const express = require('express');
const router = express.Router();
const { queryFor } = require('../db/poolManager');





// GET /api/estoque?empresa=7432
// Estoque de combustíveis via tanq, preço/custo via e_prod (empresa-específico)
router.get('/', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const query = queryFor(empresa);

  if (!empresa) {
    return res.status(400).json({ error: 'empresa is required' });
  }

  try {
    // Tanques + produto (prod) + dados empresa (e_prod) em uma única query
    const result = await query(
      `SELECT
         tanq.tanqcodigo,
         tanq.tanqproduto          AS produto_codigo,
         prod.prodresumo           AS produto_nome,
         tanq.tanqmodelo,
         tanq.tanqcapacidade,
         tanq.tanqestoque          AS estoque_atual,
         COALESCE(ep.e_prodv1,    0) AS preco_venda,
         COALESCE(ep.e_prodcusto, 0) AS custo
       FROM tanq
       JOIN prod ON prod.prodcodigo    = tanq.tanqproduto
                AND prod.prodtipo      = 1
       LEFT JOIN e_prod ep ON ep.e_prodproduto = tanq.tanqproduto
                          AND ep.e_prodempresa  = $1
                          AND ep.e_prodproduto IN (
                            SELECT prodcodigo FROM prod WHERE prodtipo = 1
                          )
       WHERE tanq.tanqempresa = $1
         AND tanq.tanqinativo IS NULL
       ORDER BY tanq.tanqproduto, tanq.tanqcodigo`,
      [empresa]
    );

    // Agrupa tanques por produto
    const produtoMap = {};
    result.rows.forEach(r => {
      const cod = r.produto_codigo;
      if (!produtoMap[cod]) {
        produtoMap[cod] = {
          produtoCodigo:    cod,
          produtoNome:      r.produto_nome,
          precoVenda:       parseFloat(r.preco_venda || 0),
          custo:            parseFloat(r.custo       || 0),
          tanques:          [],
          estoqueTotal:     0,
          capacidadeTotal:  0,
        };
      }
      const estTanq = parseFloat(r.estoque_atual  || 0);
      const capTanq = parseFloat(r.tanqcapacidade || 0);
      produtoMap[cod].tanques.push({
        codigo:    r.tanqcodigo,
        modelo:    r.tanqmodelo,
        capacidade: capTanq,
        estoque:   estTanq,
      });
      produtoMap[cod].estoqueTotal    += estTanq;
      produtoMap[cod].capacidadeTotal += capTanq;
    });

    // ── Fechamento LMC — mesmo cálculo da página Movimentação de Combustíveis ──
    // fechamento = abertura_lmc + compras110(entcpivol) + compras220(pediqtd)
    //              + aferições(aferqtd) − vendas(vditqtd)
    // Período: 1º dia do mês corrente até hoje
    const agora      = new Date();
    const mesPad     = String(agora.getMonth() + 1).padStart(2, '0');
    const anoAtual   = agora.getFullYear();
    const dataInicio = `${anoAtual}-${mesPad}-01`;
    const dataHoje   = agora.toISOString().split('T')[0];
    const lmcPeriodo = `${mesPad}/${anoAtual}`;

    const lmcFechRes = await query(
      `WITH
        -- Abertura do mês (tabela lmc)
        abertura AS (
          SELECT lmccombustivel AS produto,
                 COALESCE(lmcabertura, 0) AS total
          FROM lmc
          WHERE lmcempresa = $1 AND lmcperiodo = $4
        ),
        -- Compras 110: usa entcpivol1+vol2+vol3 (igual ao /api/lmc/controle)
        c110 AS (
          SELECT t.entcpiproduto AS produto,
                 COALESCE(SUM(COALESCE(t.entcpivol1,0)+COALESCE(t.entcpivol2,0)+COALESCE(t.entcpivol3,0)), 0) AS total
          FROM entcpi t
          JOIN entcpa r ON r.entcpacodigo = t.entcpicompra AND r.entcpaempresa = $1
          WHERE t.entcpiempresa = $1
            AND DATE(r.entcpachegada) BETWEEN $2 AND $3
          GROUP BY t.entcpiproduto
        ),
        -- Compras 220: pediqtd (igual ao /api/lmc/controle)
        c220 AS (
          SELECT e.pediproduto AS produto,
                 COALESCE(SUM(e.pediqtd), 0) AS total
          FROM pede d
          JOIN pedi e ON e.pedicodigopede = d.pedecodigo AND e.pediempresa = d.pedeempresa
          WHERE d.pedeempresa = $1
            AND d.pededatarecebimento IS NOT NULL
            AND DATE(d.pededatarecebimento) BETWEEN $2 AND $3
          GROUP BY e.pediproduto
        ),
        -- Vendas: vditqtd (igual ao /api/lmc/controle)
        vnd AS (
          SELECT i.vditproduto AS produto,
                 COALESCE(SUM(i.vditqtd), 0) AS total
          FROM vdit i
          JOIN vda v ON v.vdacodigo = i.vditcodigovda AND v.vdaempresa = i.vditempresa
          JOIN prod p ON p.prodcodigo = i.vditproduto
          WHERE i.vditempresa = $1
            AND p.prodtipo = 1
            AND v.vdastatus = 0
            AND i.vditstatus = 0
            AND DATE(v.vdadata) BETWEEN $2 AND $3
          GROUP BY i.vditproduto
        ),
        -- Aferições: aferqtd, data = afermovimento (igual ao /api/lmc/controle)
        af AS (
          SELECT a.aferproduto AS produto,
                 COALESCE(SUM(a.aferqtd), 0) AS total
          FROM afer a
          WHERE a.aferempresa = $1
            AND DATE(a.afermovimento) BETWEEN $2 AND $3
          GROUP BY a.aferproduto
        )
      SELECT
        ab.produto,
        ab.total                                     AS abertura,
        COALESCE(c110.total, 0)                      AS compras110,
        COALESCE(c220.total, 0)                      AS compras220,
        COALESCE(vnd.total, 0)                       AS vendas,
        COALESCE(af.total,  0)                       AS afericoes,
        ab.total + COALESCE(c110.total,0) + COALESCE(c220.total,0)
                 + COALESCE(af.total,0)  - COALESCE(vnd.total,0)  AS fechamento
      FROM abertura ab
      LEFT JOIN c110 ON c110.produto = ab.produto
      LEFT JOIN c220 ON c220.produto = ab.produto
      LEFT JOIN vnd  ON vnd.produto  = ab.produto
      LEFT JOIN af   ON af.produto   = ab.produto`,
      [empresa, dataInicio, dataHoje, lmcPeriodo]
    );

    const lmcFechMap = {};
    lmcFechRes.rows.forEach(r => {
      lmcFechMap[r.produto] = {
        fechamento: parseFloat(r.fechamento || 0),
        abertura:   parseFloat(r.abertura   || 0),
      };
    });

    const estoques = Object.values(produtoMap).map(p => {
      const cod = p.produtoCodigo;
      const valorEstoque = p.estoqueTotal * p.custo;
      const percentualOcupacao = p.capacidadeTotal > 0
        ? Math.min((p.estoqueTotal / p.capacidadeTotal) * 100, 100)
        : 0;
      const margem = p.precoVenda > 0 && p.custo > 0
        ? ((p.precoVenda - p.custo) / p.precoVenda) * 100
        : 0;

      const lmcInfo = lmcFechMap[cod];
      // Usa o fechamento calculado igual ao Livros; fallback para tanqestoque
      const estoqueEstimado = lmcInfo
        ? Math.max(0, lmcInfo.fechamento)
        : p.estoqueTotal;
      const percentualEstimado = p.capacidadeTotal > 0
        ? Math.min((estoqueEstimado / p.capacidadeTotal) * 100, 100)
        : percentualOcupacao;

      return {
        ...p,
        custoMedio: p.custo,
        valorEstoque,
        percentualOcupacao,
        margem,
        lmcPeriodo:      lmcInfo ? lmcPeriodo : null,
        estoqueEstimado,
        percentualEstimado,
      };
    });

    res.json({ empresa, estoques });
  } catch (err) {
    console.error('Error in /estoque:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/estoque/projecao?empresa=7432&dias=7
router.get('/projecao', async (req, res) => {
  const empresa      = parseInt(req.query.empresa);
  const dias         = parseInt(req.query.dias)        || 7;
  const diasProjecao = parseInt(req.query.diasProjecao) || dias;
  const dataInicioParam = req.query.dataInicio;
  const dataFimParam    = req.query.dataFim;

  if (!empresa) {
    return res.status(400).json({ error: 'empresa is required' });
  }

  const query = queryFor(empresa);

  const hoje      = new Date();
  const dataInicio = new Date(hoje);
  dataInicio.setDate(dataInicio.getDate() - dias);
  const dataInicioStr = dataInicioParam || dataInicio.toISOString().split('T')[0];
  const dataFimStr    = dataFimParam    || hoje.toISOString().split('T')[0];
  const startDate     = new Date(`${dataInicioStr}T00:00:00`);
  const endDate       = new Date(`${dataFimStr}T00:00:00`);
  const diasBase      = Number.isFinite(startDate.getTime()) && Number.isFinite(endDate.getTime())
    ? Math.max(1, Math.floor((endDate - startDate) / 86400000) + 1)
    : dias;

  try {
    // Média de vendas + preço/custo via e_prod
    const mediaResult = await query(
      `SELECT
         vdit.vditproduto             AS produto_codigo,
         prod.prodresumo              AS produto_nome,
         COALESCE(ep.e_prodv1,    0)  AS preco_venda,
         COALESCE(ep.e_prodcusto, 0)  AS custo,
         COALESCE(SUM(vdit.vditqtd), 0)              AS litros_periodo,
         COALESCE(SUM(vdit.vditqtd), 0)::numeric / $4 AS media_diaria_litros
       FROM vdit
       JOIN vda  ON vda.vdacodigo  = vdit.vditcodigovda AND vda.vdaempresa = vdit.vditempresa
       JOIN prod ON prod.prodcodigo = vdit.vditproduto
       LEFT JOIN e_prod ep ON ep.e_prodproduto = vdit.vditproduto
                          AND ep.e_prodempresa  = $1
       WHERE vdit.vditempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         AND prod.prodtipo = 1
       GROUP BY vdit.vditproduto, prod.prodresumo, ep.e_prodv1, ep.e_prodcusto`,
      [empresa, dataInicioStr, dataFimStr, diasBase]
    );

    // Estoque atual por produto
    const estoqueResult = await query(
      `SELECT tanqproduto AS produto_codigo, SUM(tanqestoque::numeric) AS estoque_total
       FROM tanq
       WHERE tanqempresa = $1
       GROUP BY tanqproduto`,
      [empresa]
    );

    const estoqueMap = {};
    estoqueResult.rows.forEach(r => {
      estoqueMap[r.produto_codigo] = parseFloat(r.estoque_total || 0);
    });

    const projecoes = mediaResult.rows.map(r => {
      const mediaDiaria       = parseFloat(r.media_diaria_litros || 0);
      const litrosPeriodo     = parseFloat(r.litros_periodo      || 0);
      const precoVenda        = parseFloat(r.preco_venda         || 0);
      const custo             = parseFloat(r.custo               || 0);
      const estoqueAtual      = estoqueMap[r.produto_codigo]     || 0;
      const diasRestantes     = mediaDiaria > 0 ? Math.floor(estoqueAtual / mediaDiaria) : 999;
      const consumoProjetado  = mediaDiaria * diasProjecao;
      const necessidadeCompra = Math.max(consumoProjetado - estoqueAtual, 0);
      const valorNecessidade  = necessidadeCompra * custo;

      return {
        produtoCodigo:      r.produto_codigo,
        produtoNome:        r.produto_nome,
        precoVenda,
        custo,
        litrosPeriodo,
        mediaDiariaLitros:  mediaDiaria,
        estoqueAtual,
        diasRestantes,
        diasProjecao,
        consumoProjetado,
        necessidadeCompra,
        valorNecessidade,
        alertaAbastecimento: diasRestantes <= 3,
      };
    });

    res.json({
      empresa,
      diasBase,
      diasProjecao,
      dataInicio: dataInicioStr,
      dataFim:    dataFimStr,
      projecoes,
    });
  } catch (err) {
    console.error('Error in /estoque/projecao:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/estoque/convenio?empresa=7432
router.get('/convenio', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const query = queryFor(empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa is required' });

  try {
    const result = await query(
      `SELECT
         p2.e_prodempresa  AS empresa,
         p1.prodcodigo     AS cod_produto,
         p1.prodbarra      AS cod_barra,
         p1.proddescricao  AS descricao,
         s.sprocodigo      AS cod_secao,
         s.sprodescricao   AS descricao_secao,
         g.gprocodigo      AS cod_grupo,
         g.gprodescricao   AS descricao_grupo,
         p2.e_prodv1       AS preco_venda1,
         p2.e_prodv2       AS preco_venda2,
         k.kardexestoque   AS estoque_produto,
         p2.e_prodcusto    AS custo,
         CASE
           WHEN p2.e_prodinativo IS NOT NULL THEN 'INATIVO'
           ELSE 'ATIVO'
         END AS situacao
       FROM prod p1
       JOIN e_prod p2
         ON p1.prodcodigo = p2.e_prodproduto
        AND p2.e_prodempresa = $1
       LEFT JOIN LATERAL (
           SELECT k.kardexestoque
           FROM kardex k
           WHERE k.kardexempresa = p2.e_prodempresa
             AND k.kardexproduto = p2.e_prodproduto
           ORDER BY k.kardexdata DESC
           LIMIT 1
       ) k ON TRUE
       LEFT JOIN LATERAL (
           SELECT s.sprocodigo, s.sprodescricao
           FROM spro s
           WHERE s.sprocodigo = p1.prodsecao
           LIMIT 1
       ) s ON TRUE
       LEFT JOIN LATERAL (
           SELECT g.gprocodigo, g.gprodescricao
           FROM gpro g
           WHERE g.gprosecao = p1.prodsecao
             AND g.gprocodigo = p1.prodgrupo
           LIMIT 1
       ) g ON TRUE
       WHERE p1.prodtipo = 2
       ORDER BY s.sprodescricao, g.gprodescricao, p1.proddescricao`,
      [empresa]
    );

    const produtos = result.rows.map(r => ({
      cod_produto:     r.cod_produto,
      cod_barra:       r.cod_barra       || '',
      descricao:       r.descricao       || '',
      cod_secao:       r.cod_secao,
      descricao_secao: r.descricao_secao || 'Sem Categoria',
      cod_grupo:       r.cod_grupo,
      descricao_grupo: r.descricao_grupo || '',
      preco_venda1:    parseFloat(r.preco_venda1    || 0),
      preco_venda2:    parseFloat(r.preco_venda2    || 0),
      estoque_produto: parseFloat(r.estoque_produto || 0),
      custo:           parseFloat(r.custo           || 0),
      situacao:        r.situacao,
    }));

    res.json({ empresa, produtos });
  } catch (err) {
    console.error('Error in /estoque/convenio:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/estoque/categorias-convenio?empresa=7432
// Retorna seções da tabela spro onde sprotipo = 2
router.get('/categorias-convenio', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const query = queryFor(empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa is required' });

  try {
    const result = await query(
      `SELECT sprocodigo AS codigo, sprodescricao AS descricao
       FROM spro
       WHERE sprotipo = 2
       ORDER BY sprodescricao`,
      []
    );
    res.json({ categorias: result.rows });
  } catch (err) {
    console.error('Error in /estoque/categorias-convenio:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/estoque/grupos-convenio?empresa=7432
// Retorna grupos da tabela gpro cujo gprosecao pertence a spro sprotipo=2
router.get('/grupos-convenio', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const query = queryFor(empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa is required' });

  try {
    const result = await query(
      `SELECT g.gprocodigo AS codigo, g.gprodescricao AS descricao, s.sprodescricao AS secao
       FROM gpro g
       JOIN spro s ON s.sprocodigo = g.gprosecao
       WHERE s.sprotipo = 2
       ORDER BY g.gprodescricao`,
      []
    );
    res.json({ grupos: result.rows });
  } catch (err) {
    console.error('Error in /estoque/grupos-convenio:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
