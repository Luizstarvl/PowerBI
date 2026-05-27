const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { safeQuery } = require('../middleware/readonly');

const query = safeQuery(pool);

// GET /api/estoque?empresa=7432
// Estoque de combustíveis via tanq, preço/custo via e_prod (empresa-específico)
router.get('/', async (req, res) => {
  const empresa = parseInt(req.query.empresa);

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
       LEFT JOIN e_prod ep ON ep.e_prodproduto = tanq.tanqproduto
                          AND ep.e_prodempresa  = $1
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

    const estoques = Object.values(produtoMap).map(p => {
      const valorEstoque       = p.estoqueTotal * p.custo;
      const percentualOcupacao = p.capacidadeTotal > 0
        ? Math.min((p.estoqueTotal / p.capacidadeTotal) * 100, 100)
        : 0;
      const margem = p.precoVenda > 0 && p.custo > 0
        ? ((p.precoVenda - p.custo) / p.precoVenda) * 100
        : 0;

      return {
        ...p,
        valorEstoque,
        percentualOcupacao,
        margem,
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

module.exports = router;
