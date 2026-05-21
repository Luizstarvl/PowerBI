const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { safeQuery } = require('../middleware/readonly');

const query = safeQuery(pool);

// GET /api/dashboard/kpis?empresa=7432&periodo=042026
router.get('/kpis', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const periodo = req.query.periodo; // MMYYYY

  if (!empresa || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }

  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${diasNoMes}`;

  try {
    // Total vendas (count + valor via vdit, pois vda não tem campo de total)
    const vendasResult = await query(
      `SELECT
         COUNT(DISTINCT vda.vdacodigo) AS total_vendas,
         COALESCE(SUM(vdit.vdittotal), 0) AS valor_total_vendas
       FROM vda
       JOIN vdit ON vdit.vditcodigovda = vda.vdacodigo AND vdit.vditempresa = vda.vdaempresa
       WHERE vda.vdaempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)`,
      [empresa, dataInicio, dataFim]
    );

    // Combustível vendido (litros + valor)
    const combustivelResult = await query(
      `SELECT
         COALESCE(SUM(vdit.vditqtd), 0) AS litros_vendidos,
         COALESCE(SUM(vdit.vdittotal), 0) AS valor_combustivel
       FROM vdit
       JOIN vda ON vda.vdacodigo = vdit.vditcodigovda AND vda.vdaempresa = vdit.vditempresa
       JOIN prod ON prod.prodcodigo = vdit.vditproduto
       WHERE vdit.vditempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         AND prod.prodtipo = 1`,
      [empresa, dataInicio, dataFim]
    );

    // Compras 110 (com nota fiscal - entcpachave NOT NULL)
    const compras110Result = await query(
      `SELECT
         COUNT(DISTINCT entcpa.entcpacodigo) AS total_nf,
         COALESCE(SUM(entcpi.entcpitotal), 0) AS valor_compras_110
       FROM entcpa
       JOIN entcpi ON entcpi.entcpicompra = entcpa.entcpacodigo
       WHERE entcpa.entcpaempresa = $1
         AND DATE(entcpa.entcpachegada) >= $2
         AND DATE(entcpa.entcpachegada) <= $3
         AND entcpa.entcpachave IS NOT NULL`,
      [empresa, dataInicio, dataFim]
    );

    // Compras 220 (sem documento fiscal - entcpachave IS NULL)
    const compras220Result = await query(
      `SELECT
         COUNT(DISTINCT entcpa.entcpacodigo) AS total_sem_nf,
         COALESCE(SUM(entcpi.entcpitotal), 0) AS valor_compras_220
       FROM entcpa
       JOIN entcpi ON entcpi.entcpicompra = entcpa.entcpacodigo
       WHERE entcpa.entcpaempresa = $1
         AND DATE(entcpa.entcpachegada) >= $2
         AND DATE(entcpa.entcpachegada) <= $3
         AND entcpa.entcpachave IS NULL`,
      [empresa, dataInicio, dataFim]
    );

    // Aferições do período
    const afericoesResult = await query(
      `SELECT
         COUNT(*) AS total_afericoes,
         COALESCE(SUM(aferqtd), 0) AS total_qtd_afericao
       FROM afer
       WHERE aferempresa = $1
         AND DATE(aferdata) >= $2
         AND DATE(aferdata) <= $3`,
      [empresa, dataInicio, dataFim]
    );

    res.json({
      periodo: { mes, ano },
      vendas: {
        total: parseInt(vendasResult.rows[0].total_vendas),
        valor: parseFloat(vendasResult.rows[0].valor_total_vendas),
      },
      combustivel: {
        litros: parseFloat(combustivelResult.rows[0].litros_vendidos),
        valor: parseFloat(combustivelResult.rows[0].valor_combustivel),
      },
      compras110: {
        total: parseInt(compras110Result.rows[0].total_nf),
        valor: parseFloat(compras110Result.rows[0].valor_compras_110),
      },
      compras220: {
        total: parseInt(compras220Result.rows[0].total_sem_nf),
        valor: parseFloat(compras220Result.rows[0].valor_compras_220),
      },
      afericoes: {
        total: parseInt(afericoesResult.rows[0].total_afericoes),
        qtd: parseFloat(afericoesResult.rows[0].total_qtd_afericao),
      },
    });
  } catch (err) {
    console.error('Error in /dashboard/kpis:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/vendas-diarias?empresa=7432&periodo=042026
router.get('/vendas-diarias', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const periodo = req.query.periodo;

  if (!empresa || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }

  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${diasNoMes}`;

  try {
    const result = await query(
      `SELECT
         vda.vdamovimento AS dia,
         COUNT(DISTINCT vda.vdacodigo) AS qtd_vendas,
         COALESCE(SUM(vdit.vdittotal), 0) AS valor_total
       FROM vda
       JOIN vdit ON vdit.vditcodigovda = vda.vdacodigo AND vdit.vditempresa = vda.vdaempresa
       JOIN prod ON prod.prodcodigo = vdit.vditproduto
       WHERE vda.vdaempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         AND prod.prodtipo = 1
       GROUP BY vda.vdamovimento
       ORDER BY dia`,
      [empresa, dataInicio, dataFim]
    );

    res.json(result.rows.map(r => ({
      dia: r.dia,
      qtdVendas: parseInt(r.qtd_vendas),
      valorTotal: parseFloat(r.valor_total),
    })));
  } catch (err) {
    console.error('Error in /dashboard/vendas-diarias:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/vendas-horarias?empresa=7432&periodo=042026
router.get('/vendas-horarias', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const periodo = req.query.periodo;

  if (!empresa || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }

  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${diasNoMes}`;

  try {
    const result = await query(
      `SELECT
         EXTRACT(HOUR FROM vda.vdadata)::int AS hora,
         COUNT(DISTINCT vda.vdacodigo) AS qtd_vendas,
         COALESCE(SUM(vdit.vdittotal), 0) AS valor_total
       FROM vda
       JOIN vdit ON vdit.vditcodigovda = vda.vdacodigo AND vdit.vditempresa = vda.vdaempresa
       JOIN prod ON prod.prodcodigo = vdit.vditproduto
       WHERE vda.vdaempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         AND prod.prodtipo = 1
       GROUP BY EXTRACT(HOUR FROM vda.vdadata)::int
       ORDER BY hora`,
      [empresa, dataInicio, dataFim]
    );

    const byHour = {};
    result.rows.forEach(r => {
      byHour[Number(r.hora)] = {
        qtdVendas: parseInt(r.qtd_vendas),
        valorTotal: parseFloat(r.valor_total),
      };
    });

    res.json(Array.from({ length: 24 }, (_, hora) => ({
      hora,
      label: `${String(hora).padStart(2, '0')}h`,
      qtdVendas: byHour[hora]?.qtdVendas || 0,
      valorTotal: byHour[hora]?.valorTotal || 0,
    })));
  } catch (err) {
    console.error('Error in /dashboard/vendas-horarias:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/combustiveis?empresa=7432&periodo=042026
router.get('/combustiveis', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const periodo = req.query.periodo;

  if (!empresa || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }

  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${diasNoMes}`;

  try {
    const result = await query(
      `SELECT
         prod.prodcodigo AS codigo,
         prod.prodresumo AS nome,
         COALESCE(SUM(vdit.vditqtd), 0) AS litros,
         COALESCE(SUM(vdit.vdittotal), 0) AS valor
       FROM vdit
       JOIN vda ON vda.vdacodigo = vdit.vditcodigovda AND vda.vdaempresa = vdit.vditempresa
       JOIN prod ON prod.prodcodigo = vdit.vditproduto
       WHERE vdit.vditempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         AND prod.prodtipo = 1
       GROUP BY prod.prodcodigo, prod.prodresumo
       ORDER BY litros DESC`,
      [empresa, dataInicio, dataFim]
    );

    res.json(result.rows.map(r => ({
      codigo: r.codigo,
      nome: r.nome,
      litros: parseFloat(r.litros),
      valor: parseFloat(r.valor),
    })));
  } catch (err) {
    console.error('Error in /dashboard/combustiveis:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
