const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { safeQuery } = require('../middleware/readonly');

const query = safeQuery(pool);
const RANKING_EMPRESA_ID = 7432;

function periodoToRange(periodo) {
  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  const diasNoMes = new Date(ano, mes, 0).getDate();
  return {
    mes, ano,
    dataInicio: `${ano}-${String(mes).padStart(2, '0')}-01`,
    dataFim: `${ano}-${String(mes).padStart(2, '0')}-${String(diasNoMes).padStart(2, '0')}`,
    lmcperiodo: `${String(mes).padStart(2, '0')}/${ano}`,
  };
}

function isValidDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function getRankingEmpresa(req, res) {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) {
    res.status(400).json({ error: 'empresa is required' });
    return null;
  }
  if (empresa !== RANKING_EMPRESA_ID) {
    res.status(400).json({ error: `Este relatorio esta restrito a empresa ${RANKING_EMPRESA_ID}` });
    return null;
  }
  return RANKING_EMPRESA_ID;
}

// GET /api/relatorios/descarregamentos?empresa=&periodo=MMYYYY
router.get('/descarregamentos', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const periodo = req.query.periodo;
  if (!empresa || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }
  const { dataInicio, dataFim } = periodoToRange(periodo);
  try {
    const [entcpaResult, pedeResult] = await Promise.all([
      // 110 — NF-e de entrada (entcpa com chave fiscal)
      query(
        `SELECT
           DATE(entcpa.entcpachegada) AS data,
           COALESCE(part.partrazao, '—') AS fornecedor,
           prod.prodresumo AS combustivel,
           COALESCE(SUM(entcpi.entcpiqtd), 0) AS qtd,
           CASE WHEN SUM(entcpi.entcpiqtd) > 0
                THEN SUM(entcpi.entcpitotal) / SUM(entcpi.entcpiqtd)
                ELSE 0 END AS unitario,
           COALESCE(SUM(entcpi.entcpitotal), 0) AS total,
           entcpa.entcpachave AS nota,
           entcpa.entcpaplaca AS placa
         FROM entcpa
         JOIN entcpi ON entcpi.entcpicompra = entcpa.entcpacodigo
                    AND entcpi.entcpiempresa = entcpa.entcpaempresa
         JOIN prod ON prod.prodcodigo = entcpi.entcpiproduto
         LEFT JOIN part ON part.partcodigo = entcpa.entcpafornecedor
         WHERE entcpa.entcpaempresa = $1
           AND prod.prodtipo = 1
           AND entcpa.entcpachave IS NOT NULL
           AND DATE(entcpa.entcpachegada) >= $2
           AND DATE(entcpa.entcpachegada) <= $3
         GROUP BY
           DATE(entcpa.entcpachegada), part.partrazao,
           prod.prodresumo, entcpa.entcpachave, entcpa.entcpaplaca
         ORDER BY data DESC, combustivel`,
        [empresa, dataInicio, dataFim]
      ),
      // 220 — Pedidos de compra sem NF
      query(
        `SELECT
           DATE(pede.pededatarecebimento) AS data,
           COALESCE(part.partrazao, '—') AS fornecedor,
           prod.prodresumo AS combustivel,
           pedi.pediqtd AS qtd,
           pedi.pediunitario AS unitario,
           pedi.peditotal AS total,
           pede.pedeobservacao AS observacao,
           pede.pedecodigo AS pedido
         FROM pede
         JOIN pedi ON pedi.pedicodigopede = pede.pedecodigo
                  AND pedi.pediempresa = pede.pedeempresa
         JOIN prod ON prod.prodcodigo = pedi.pediproduto
         LEFT JOIN part ON part.partcodigo = pede.pedefornecedor
         WHERE pede.pedeempresa = $1
           AND prod.prodtipo = 1
           AND pede.pededatarecebimento IS NOT NULL
           AND DATE(pede.pededatarecebimento) >= $2
           AND DATE(pede.pededatarecebimento) <= $3
         ORDER BY data DESC, combustivel`,
        [empresa, dataInicio, dataFim]
      ),
    ]);

    const comNota = entcpaResult.rows.map(r => ({
      data: r.data,
      fornecedor: r.fornecedor,
      combustivel: r.combustivel,
      qtd: parseFloat(r.qtd),
      unitario: parseFloat(r.unitario),
      total: parseFloat(r.total),
      tipo: '110',
      nota: r.nota || null,
      placa: r.placa || null,
    }));

    const semNota = pedeResult.rows.map(r => ({
      data: r.data,
      fornecedor: r.fornecedor,
      combustivel: r.combustivel,
      qtd: parseFloat(r.qtd),
      unitario: parseFloat(r.unitario),
      total: parseFloat(r.total),
      tipo: '220',
      nota: null,
      pedido: r.pedido,
      observacao: r.observacao || null,
    }));

    res.json({ comNota, semNota });
  } catch (err) {
    console.error('Error in /relatorios/descarregamentos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/relatorios/vendedores?empresa=
router.get('/vendedores', async (req, res) => {
  const empresa = getRankingEmpresa(req, res);
  if (!empresa) return;

  try {
    const result = await query(
      `SELECT DISTINCT
         a.atdecodigo,
         a.atdenome
       FROM atde a
       JOIN atdeemp ae
         ON ae.atdecodigo = a.atdecodigo
        AND ae.atdeempcod = $1
       WHERE a.atdecodigo > 0
         AND a.atdenome IS NOT NULL
         AND TRIM(a.atdenome) <> ''
       ORDER BY a.atdenome`,
      [empresa]
    );

    res.json({
      vendedores: result.rows.map(r => ({
        codigo: parseInt(r.atdecodigo),
        nome: r.atdenome,
      })),
    });
  } catch (err) {
    console.error('Error in /relatorios/vendedores:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/relatorios/ranking-vendas?empresa=&dataInicial=YYYY-MM-DD&dataFinal=YYYY-MM-DD&tipoProd=1&vendedores=1,2
router.get('/ranking-vendas', async (req, res) => {
  const empresa = getRankingEmpresa(req, res);
  if (!empresa) return;
  const dataInicial = req.query.dataInicial;
  const dataFinal = req.query.dataFinal;
  const tipoProd = parseInt(req.query.tipoProd);
  const vendedores = String(req.query.vendedores || '')
    .split(',')
    .map(v => parseInt(v))
    .filter(v => Number.isInteger(v) && v > 0);

  if (!isValidDateKey(dataInicial) || !isValidDateKey(dataFinal) || ![1, 2].includes(tipoProd)) {
    return res.status(400).json({ error: 'dataInicial, dataFinal and tipoProd (1 or 2) required' });
  }

  if (dataInicial > dataFinal) {
    return res.status(400).json({ error: 'dataInicial cannot be greater than dataFinal' });
  }

  try {
    const result = await query(
      `SELECT *,
              RANK() OVER (ORDER BY total_venda DESC) AS posicao_vendedor
         FROM (
           SELECT
             TO_CHAR(v.vdadata, 'MM/YYYY') AS mes_venda,
             a.atdecodigo AS codvendedor,
             a.atdenome AS nomevendedor,
             COALESCE(SUM(i.vditqtd), 0) AS qtd_venda,
             COALESCE(SUM(i.vditsubtotal), 0) AS subtotal_venda,
             COALESCE(SUM(i.vdittotal), 0) AS total_venda
           FROM vda v
             LEFT JOIN vdit i
                    ON i.vditempresa = v.vdaempresa
                   AND i.vditcodigovda = v.vdacodigo
             LEFT JOIN prod p
                    ON p.prodcodigo = i.vditproduto
             LEFT JOIN spro s
                    ON s.sprocodigo = p.prodsecao
             LEFT JOIN gpro g
                    ON g.gprosecao = s.sprocodigo
                   AND g.gprocodigo = p.prodgrupo
             LEFT JOIN atde a
                    ON a.atdecodigo = i.vditvendedor
           WHERE v.vdaempresa = $1
             AND CAST(v.vdadata AS DATE) BETWEEN $2 AND $3
             AND i.vditvendedor > 0
             AND a.atdecodigo IS NOT NULL
             AND p.prodtipo = $4
             AND ($5::int[] IS NULL OR a.atdecodigo = ANY($5::int[]))
             AND EXISTS (
               SELECT 1
                 FROM atdeemp ae
                WHERE ae.atdecodigo = a.atdecodigo
                  AND ae.atdeempcod = $1
             )
             AND (v.vdastatus IS NULL OR v.vdastatus = 0)
             AND (i.vditstatus IS NULL OR i.vditstatus = 0)
           GROUP BY 1, 2, 3
         ) t
        ORDER BY total_venda DESC`,
      [empresa, dataInicial, dataFinal, tipoProd, vendedores.length ? vendedores : null]
    );

    const ranking = result.rows.map(r => ({
      mesVenda: r.mes_venda,
      codVendedor: parseInt(r.codvendedor),
      nomeVendedor: r.nomevendedor,
      qtdVenda: parseFloat(r.qtd_venda || 0),
      subtotalVenda: parseFloat(r.subtotal_venda || 0),
      totalVenda: parseFloat(r.total_venda || 0),
      posicaoVendedor: parseInt(r.posicao_vendedor),
    }));

    res.json({
      ranking,
      totais: {
        qtdVenda: ranking.reduce((s, r) => s + r.qtdVenda, 0),
        subtotalVenda: ranking.reduce((s, r) => s + r.subtotalVenda, 0),
        totalVenda: ranking.reduce((s, r) => s + r.totalVenda, 0),
      },
    });
  } catch (err) {
    console.error('Error in /relatorios/ranking-vendas:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/relatorios/vendas?empresa=&periodo=MMYYYY
router.get('/vendas', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const periodo = req.query.periodo;
  if (!empresa || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }
  const { dataInicio, dataFim } = periodoToRange(periodo);
  try {
    const [result, totalVendasResult] = await Promise.all([
      query(
        `SELECT
           prod.prodresumo AS produto,
           prod.prodtipo AS tipo_prod,
           COALESCE(SUM(vdit.vditqtd), 0) AS qtd_total,
           COALESCE(SUM(vdit.vdittotal), 0) AS valor_total,
           CASE WHEN SUM(vdit.vditqtd) > 0
                THEN SUM(vdit.vdittotal) / SUM(vdit.vditqtd)
                ELSE 0 END AS preco_medio,
           COUNT(DISTINCT vda.vdacodigo) AS qtd_vendas
         FROM vdit
         JOIN vda ON vda.vdacodigo = vdit.vditcodigovda
                 AND vda.vdaempresa = vdit.vditempresa
         JOIN prod ON prod.prodcodigo = vdit.vditproduto
         WHERE vdit.vditempresa = $1
           AND vda.vdamovimento >= $2
           AND vda.vdamovimento <= $3
           AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         GROUP BY prod.prodresumo, prod.prodtipo
         ORDER BY valor_total DESC`,
        [empresa, dataInicio, dataFim]
      ),
      query(
        `SELECT COUNT(DISTINCT vda.vdacodigo) AS qtd_vendas_pdv
         FROM vda
         WHERE vda.vdaempresa = $1
           AND vda.vdamovimento >= $2
           AND vda.vdamovimento <= $3
           AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)`,
        [empresa, dataInicio, dataFim]
      ),
    ]);
    const rows = result.rows.map(r => ({
      produto: r.produto,
      tipoProd: r.tipo_prod,
      qtdTotal: parseFloat(r.qtd_total),
      valorTotal: parseFloat(r.valor_total),
      precoMedio: parseFloat(r.preco_medio),
      qtdVendas: parseInt(r.qtd_vendas),
    }));
    res.json({
      produtos: rows,
      totais: {
        qtdTotal: rows.reduce((s, r) => s + r.qtdTotal, 0),
        valorTotal: rows.reduce((s, r) => s + r.valorTotal, 0),
        qtdVendas: rows.reduce((s, r) => s + r.qtdVendas, 0),
        qtdVendasPdv: parseInt(totalVendasResult.rows[0]?.qtd_vendas_pdv || 0),
      },
    });
  } catch (err) {
    console.error('Error in /relatorios/vendas:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/relatorios/historico?empresa=&meses=12
router.get('/historico', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const meses = parseInt(req.query.meses) || 12;
  if (!empresa) {
    return res.status(400).json({ error: 'empresa is required' });
  }
  try {
    const result = await query(
      `SELECT
         lmc.lmcperiodo AS periodo,
         prod.prodresumo AS combustivel,
         COALESCE(SUM(lmc.lmcvenda), 0) AS volume_vendido,
         COALESCE(SUM(lmc.lmccompra), 0) AS volume_comprado,
         COALESCE(SUM(lmc.lmcafericao), 0) AS afericoes,
         COALESCE(SUM(lmc.lmcfechamento), 0) AS fechamento
       FROM lmc
       JOIN prod ON prod.prodcodigo = lmc.lmccombustivel
       WHERE lmc.lmcempresa = $1
       GROUP BY lmc.lmcperiodo, prod.prodresumo
       ORDER BY lmc.lmcperiodo DESC, prod.prodresumo
       LIMIT $2`,
      [empresa, meses * 10]
    );
    res.json(result.rows.map(r => ({
      periodo: r.periodo,
      combustivel: r.combustivel,
      volumeVendido: parseFloat(r.volume_vendido),
      volumeComprado: parseFloat(r.volume_comprado),
      afericoes: parseFloat(r.afericoes),
      fechamento: parseFloat(r.fechamento),
    })));
  } catch (err) {
    console.error('Error in /relatorios/historico:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/relatorios/consolidado?empresa=&periodo=MMYYYY
router.get('/consolidado', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const periodo = req.query.periodo;
  if (!empresa || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }
  const { dataInicio, dataFim, lmcperiodo } = periodoToRange(periodo);
  try {
    const [lmcResult, vdaResult, compra110Result, compra220Result, vendaDocResult] = await Promise.all([
      query(
        `SELECT
           prod.prodresumo AS combustivel,
           COALESCE(SUM(lmc.lmcvenda), 0) AS vol_lmc,
           COALESCE(SUM(lmc.lmcafericao), 0) AS afericoes
         FROM lmc
         JOIN prod ON prod.prodcodigo = lmc.lmccombustivel
         WHERE lmc.lmcempresa = $1 AND lmc.lmcperiodo = $2
         GROUP BY prod.prodresumo`,
        [empresa, lmcperiodo]
      ),
      query(
        `SELECT
           prod.prodresumo AS combustivel,
           COALESCE(SUM(vdit.vditqtd), 0) AS vol_total,
           COALESCE(SUM(vdit.vdittotal), 0) AS valor_total
         FROM vdit
         JOIN vda ON vda.vdacodigo = vdit.vditcodigovda AND vda.vdaempresa = vdit.vditempresa
         JOIN prod ON prod.prodcodigo = vdit.vditproduto
         WHERE vdit.vditempresa = $1
           AND vda.vdamovimento >= $2
           AND vda.vdamovimento <= $3
           AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
           AND prod.prodtipo = 1
         GROUP BY prod.prodresumo`,
        [empresa, dataInicio, dataFim]
      ),
      // compra 110: entcpa com NF-e
      query(
        `SELECT
           prod.prodresumo AS combustivel,
           COALESCE(SUM(entcpi.entcpiqtd), 0) AS qtd,
           COALESCE(SUM(entcpi.entcpitotal), 0) AS valor
         FROM entcpa
         JOIN entcpi ON entcpi.entcpicompra = entcpa.entcpacodigo
                    AND entcpi.entcpiempresa = entcpa.entcpaempresa
         JOIN prod ON prod.prodcodigo = entcpi.entcpiproduto
         WHERE entcpa.entcpaempresa = $1
           AND prod.prodtipo = 1
           AND entcpa.entcpachave IS NOT NULL
           AND DATE(entcpa.entcpachegada) >= $2
           AND DATE(entcpa.entcpachegada) <= $3
         GROUP BY prod.prodresumo`,
        [empresa, dataInicio, dataFim]
      ),
      // compra 220: pedidos de compra sem NF
      query(
        `SELECT
           prod.prodresumo AS combustivel,
           COALESCE(SUM(pedi.pediqtd), 0) AS qtd,
           COALESCE(SUM(pedi.peditotal), 0) AS valor
         FROM pede
         JOIN pedi ON pedi.pedicodigopede = pede.pedecodigo
                  AND pedi.pediempresa = pede.pedeempresa
         JOIN prod ON prod.prodcodigo = pedi.pediproduto
         WHERE pede.pedeempresa = $1
           AND prod.prodtipo = 1
           AND pede.pededatarecebimento IS NOT NULL
           AND DATE(pede.pededatarecebimento) >= $2
           AND DATE(pede.pededatarecebimento) <= $3
         GROUP BY prod.prodresumo`,
        [empresa, dataInicio, dataFim]
      ),
      query(
        `SELECT
           prod.prodresumo AS combustivel,
           CASE WHEN vda.vdadocumento = 0 THEN '220' ELSE '110' END AS tipo,
           COALESCE(SUM(vdit.vditqtd), 0) AS qtd,
           COALESCE(SUM(vdit.vdittotal), 0) AS valor
         FROM vdit
         JOIN vda ON vda.vdacodigo = vdit.vditcodigovda AND vda.vdaempresa = vdit.vditempresa
         JOIN prod ON prod.prodcodigo = vdit.vditproduto
         WHERE vdit.vditempresa = $1
           AND vda.vdamovimento >= $2
           AND vda.vdamovimento <= $3
           AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
           AND prod.prodtipo = 1
         GROUP BY prod.prodresumo,
           CASE WHEN vda.vdadocumento = 0 THEN '220' ELSE '110' END`,
        [empresa, dataInicio, dataFim]
      ),
    ]);

    const combustiveis = [...new Set([
      ...lmcResult.rows.map(r => r.combustivel),
      ...vdaResult.rows.map(r => r.combustivel),
      ...compra110Result.rows.map(r => r.combustivel),
      ...compra220Result.rows.map(r => r.combustivel),
    ])].sort();

    const rows = combustiveis.map(comb => {
      const lmc  = lmcResult.rows.find(r => r.combustivel === comb) || {};
      const pdv  = vdaResult.rows.find(r => r.combustivel === comb) || {};
      const c110 = compra110Result.rows.find(r => r.combustivel === comb) || {};
      const c220 = compra220Result.rows.find(r => r.combustivel === comb) || {};
      const v110 = vendaDocResult.rows.find(r => r.combustivel === comb && r.tipo === '110') || {};
      const v220 = vendaDocResult.rows.find(r => r.combustivel === comb && r.tipo === '220') || {};
      const volLmc = parseFloat(lmc.vol_lmc || 0);
      const volPdv = parseFloat(pdv.vol_total || 0);
      return {
        combustivel: comb,
        volLmc,
        afericoes: parseFloat(lmc.afericoes || 0),
        volPdv,
        valorPdv: parseFloat(pdv.valor_total || 0),
        compra110Qtd: parseFloat(c110.qtd || 0),
        compra110Valor: parseFloat(c110.valor || 0),
        compra220Qtd: parseFloat(c220.qtd || 0),
        compra220Valor: parseFloat(c220.valor || 0),
        venda110Qtd: parseFloat(v110.qtd || 0),
        venda110Valor: parseFloat(v110.valor || 0),
        venda220Qtd: parseFloat(v220.qtd || 0),
        venda220Valor: parseFloat(v220.valor || 0),
        difLmcPdv: volLmc - volPdv,
      };
    });

    res.json(rows);
  } catch (err) {
    console.error('Error in /relatorios/consolidado:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/relatorios/cadastro-produtos?empresa=7432
// REL 11 — Relação de cadastros de produtos (conveniência) e combustíveis
router.get('/cadastro-produtos', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa is required' });

  try {
    // ── Combustíveis (prodtipo = 1) ──────────────────────────────────────
    const combResult = await query(
      `SELECT
         p.prodcodigo          AS cod,
         p.proddescricao       AS descricao,
         p.prodanp             AS anp,
         ep.e_prodv1           AS preco_v1,
         ep.e_prodv2           AS preco_v2,
         ep.e_prodcusto        AS custo,
         CASE WHEN ep.e_prodinativo IS NOT NULL THEN 'INATIVO' ELSE 'ATIVO' END AS situacao
       FROM prod p
       JOIN e_prod ep
         ON ep.e_prodproduto = p.prodcodigo
        AND ep.e_prodempresa = $1
       WHERE p.prodtipo = 1
       ORDER BY p.proddescricao`,
      [empresa]
    );

    // ── Conveniência (prodtipo != 1) ─────────────────────────────────────
    const convResult = await query(
      `SELECT
         p.prodcodigo          AS cod,
         p.prodbarra           AS cod_barra,
         p.proddescricao       AS descricao,
         s.sprodescricao       AS secao,
         g.gprodescricao       AS grupo,
         ep.e_prodv1           AS preco_v1,
         ep.e_prodcusto        AS custo,
         CASE WHEN ep.e_prodinativo IS NOT NULL THEN 'INATIVO' ELSE 'ATIVO' END AS situacao
       FROM prod p
       JOIN e_prod ep
         ON ep.e_prodproduto = p.prodcodigo
        AND ep.e_prodempresa = $1
       LEFT JOIN LATERAL (
           SELECT s.sprodescricao FROM spro s WHERE s.sprocodigo = p.prodsecao LIMIT 1
       ) s ON TRUE
       LEFT JOIN LATERAL (
           SELECT g.gprodescricao FROM gpro g
           WHERE g.gprosecao = p.prodsecao AND g.gprocodigo = p.prodgrupo LIMIT 1
       ) g ON TRUE
       WHERE p.prodtipo = 2
       ORDER BY s.sprodescricao NULLS LAST, g.gprodescricao NULLS LAST, p.proddescricao`,
      [empresa]
    );

    const parseF = v => parseFloat(v || 0);
    const margem = (preco, custo) => preco > 0 ? ((preco - custo) / preco * 100) : 0;

    res.json({
      combustiveis: combResult.rows.map(r => ({
        cod:       r.cod,
        descricao: r.descricao || '',
        anp:       r.anp       || '',
        precoV1:   parseF(r.preco_v1),
        precoV2:   parseF(r.preco_v2),
        custo:     parseF(r.custo),
        margem:    margem(parseF(r.preco_v1), parseF(r.custo)),
        situacao:  r.situacao,
      })),
      convenio: convResult.rows.map(r => ({
        cod:       r.cod,
        codBarra:  r.cod_barra  || '',
        descricao: r.descricao  || '',
        secao:     r.secao      || 'Sem Categoria',
        grupo:     r.grupo      || '',
        precoV1:   parseF(r.preco_v1),
        custo:     parseF(r.custo),
        margem:    margem(parseF(r.preco_v1), parseF(r.custo)),
        situacao:  r.situacao,
      })),
    });
  } catch (err) {
    console.error('Error in /relatorios/cadastro-produtos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
