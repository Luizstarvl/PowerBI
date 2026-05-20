const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { safeQuery } = require('../middleware/readonly');

const query = safeQuery(pool);

// GET /api/estoque?empresa=7432
// Fuel stock comes from tanq.tanqestoque (NOT kardex - kardex is for non-fuel products)
router.get('/', async (req, res) => {
  const empresa = parseInt(req.query.empresa);

  if (!empresa) {
    return res.status(400).json({ error: 'empresa is required' });
  }

  try {
    // Fuel stock from tanq table (source of truth for combustíveis)
    const tanqResult = await query(
      `SELECT
         tanq.tanqcodigo,
         tanq.tanqproduto AS produto_codigo,
         prod.prodresumo AS produto_nome,
         tanq.tanqmodelo,
         tanq.tanqcapacidade,
         tanq.tanqestoque AS estoque_atual
       FROM tanq
       JOIN prod ON prod.prodcodigo = tanq.tanqproduto
       WHERE tanq.tanqempresa = $1
         AND tanq.tanqinativo IS NULL
       ORDER BY tanq.tanqproduto, tanq.tanqcodigo`,
      [empresa]
    );

    // Most recent average cost per fuel product
    const custoResult = await query(
      `SELECT DISTINCT ON (custproduto)
         custproduto AS produto_codigo,
         custmedcusto AS custo_medio,
         custultcusto AS custo_ultimo,
         custdata AS data_custo
       FROM cust
       WHERE custempresa = $1
       ORDER BY custproduto, custdata DESC`,
      [empresa]
    );

    // Current selling price per fuel from e_prod
    const precoResult = await query(
      `SELECT
         ep.e_prodproduto AS produto_codigo,
         ep.e_prodv1 AS preco_venda
       FROM e_prod ep
       JOIN prod p ON p.prodcodigo = ep.e_prodproduto
       WHERE ep.e_prodempresa = $1
         AND p.prodtipo = 1`,
      [empresa]
    );

    const custoMap = {};
    custoResult.rows.forEach(r => {
      custoMap[r.produto_codigo] = {
        custoMedio: parseFloat(r.custo_medio || 0),
        custoUltimo: parseFloat(r.custo_ultimo || 0),
        dataCusto: r.data_custo,
      };
    });

    const precoMap = {};
    precoResult.rows.forEach(r => {
      precoMap[r.produto_codigo] = parseFloat(r.preco_venda || 0);
    });

    // Group tanques by product
    const produtoMap = {};
    tanqResult.rows.forEach(r => {
      const cod = r.produto_codigo;
      if (!produtoMap[cod]) {
        produtoMap[cod] = {
          produtoCodigo: cod,
          produtoNome: r.produto_nome,
          tanques: [],
          estoqueTotal: 0,
          capacidadeTotal: 0,
        };
      }
      const estTanq = parseFloat(r.estoque_atual || 0);
      const capTanq = parseFloat(r.tanqcapacidade || 0);
      produtoMap[cod].tanques.push({
        codigo: r.tanqcodigo,
        modelo: r.tanqmodelo,
        capacidade: capTanq,
        estoque: estTanq,
      });
      produtoMap[cod].estoqueTotal += estTanq;
      produtoMap[cod].capacidadeTotal += capTanq;
    });

    const estoques = Object.values(produtoMap).map(p => {
      const custo = custoMap[p.produtoCodigo] || { custoMedio: 0, custoUltimo: 0, dataCusto: null };
      const precoVenda = precoMap[p.produtoCodigo] || 0;
      const valorEstoque = p.estoqueTotal * custo.custoMedio;
      const percentualOcupacao = p.capacidadeTotal > 0
        ? Math.min((p.estoqueTotal / p.capacidadeTotal) * 100, 100)
        : 0;
      const margem = precoVenda > 0 && custo.custoUltimo > 0
        ? ((precoVenda - custo.custoUltimo) / precoVenda) * 100
        : 0;

      return {
        ...p,
        custoMedio: custo.custoMedio,
        custoUltimo: custo.custoUltimo,
        dataCusto: custo.dataCusto,
        precoVenda,
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
  const empresa = parseInt(req.query.empresa);
  const dias = parseInt(req.query.dias) || 7;

  if (!empresa) {
    return res.status(400).json({ error: 'empresa is required' });
  }

  const hoje = new Date();
  const dataInicio = new Date(hoje);
  dataInicio.setDate(dataInicio.getDate() - dias);
  const dataInicioStr = dataInicio.toISOString().split('T')[0];

  try {
    // Average daily sales per fuel in last N days
    const mediaResult = await query(
      `SELECT
         vdit.vditproduto AS produto_codigo,
         prod.prodresumo AS produto_nome,
         COALESCE(SUM(vdit.vditqtd), 0)::numeric / $3 AS media_diaria_litros
       FROM vdit
       JOIN vda ON vda.vdacodigo = vdit.vditcodigovda AND vda.vdaempresa = vdit.vditempresa
       JOIN prod ON prod.prodcodigo = vdit.vditproduto
       WHERE vdit.vditempresa = $1
         AND vda.vdamovimento >= $2
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         AND prod.prodtipo = 1
       GROUP BY vdit.vditproduto, prod.prodresumo`,
      [empresa, dataInicioStr, dias]
    );

    // Current stock from tanq
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
      const mediaDiaria = parseFloat(r.media_diaria_litros || 0);
      const estoqueAtual = estoqueMap[r.produto_codigo] || 0;
      const diasRestantes = mediaDiaria > 0 ? Math.floor(estoqueAtual / mediaDiaria) : 999;

      return {
        produtoCodigo: r.produto_codigo,
        produtoNome: r.produto_nome,
        mediaDiariaLitros: mediaDiaria,
        estoqueAtual,
        diasRestantes,
        alertaAbastecimento: diasRestantes <= 3,
      };
    });

    res.json({ empresa, diasBase: dias, projecoes });
  } catch (err) {
    console.error('Error in /estoque/projecao:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
