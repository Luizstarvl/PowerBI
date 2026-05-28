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

    // Compras de Combustível: NF (entcpi, entcpachave NOT NULL) + Pedidos (pedi/pede)
    const compras110Result = await query(
      `WITH c110 AS (
         SELECT COALESCE(SUM(ei.entcpitotal), 0) AS valor,
                COUNT(DISTINCT ec.entcpacodigo)   AS total
         FROM entcpa ec
         JOIN entcpi ei ON ei.entcpicompra = ec.entcpacodigo
         WHERE ec.entcpaempresa = $1
           AND DATE(ec.entcpachegada) >= $2
           AND DATE(ec.entcpachegada) <= $3
           AND ec.entcpachave IS NOT NULL
       ),
       c220 AS (
         SELECT COALESCE(SUM(pi.peditotal), 0) AS valor,
                COUNT(DISTINCT pd.pedecodigo)   AS total
         FROM pede pd
         JOIN pedi pi ON pi.pedicodigopede = pd.pedecodigo
                     AND pi.pediempresa    = pd.pedeempresa
         WHERE pd.pedeempresa = $1
           AND pd.pededatarecebimento IS NOT NULL
           AND DATE(pd.pededatarecebimento) >= $2
           AND DATE(pd.pededatarecebimento) <= $3
       )
       SELECT
         (SELECT valor FROM c110) + (SELECT valor FROM c220) AS valor_compras,
         (SELECT total FROM c110) + (SELECT total FROM c220) AS total_compras`,
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
        total: parseInt(compras110Result.rows[0].total_compras),
        valor: parseFloat(compras110Result.rows[0].valor_compras),
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

// GET /api/dashboard/vendas-pista?empresa=7432&dataInicio=2026-04-20&dataFim=2026-05-26&prodtipo=1
// prodtipo: 1 = combustíveis (padrão), 2 = conveniência/loja
router.get('/vendas-pista', async (req, res) => {
  const empresa  = parseInt(req.query.empresa);
  const prodtipo = parseInt(req.query.prodtipo) || 1;
  const { dataInicio, dataFim } = req.query;

  if (!empresa || !dataInicio || !dataFim) {
    return res.status(400).json({ error: 'empresa, dataInicio e dataFim são obrigatórios' });
  }

  try {
    const result = await query(
      `SELECT
         TO_CHAR(vda.vdamovimento, 'YYYY-MM-DD')            AS dia,
         prod.prodcodigo                                     AS codigo_produto,
         prod.prodresumo                                     AS combustivel,
         COALESCE(atde.atdenome, 'Sem Vendedor')             AS vendedor,
         COALESCE(spro.sprodescricao, prod.prodsecao::text, 'Sem Seção')  AS secao,
         COALESCE(gpro.gprodescricao, prod.prodgrupo::text, 'Sem Grupo')  AS grupo,
         COALESCE(SUM(vdit.vditqtd),   0)                   AS litros,
         COALESCE(SUM(vdit.vdittotal), 0)                   AS faturamento,
         COUNT(DISTINCT vda.vdacodigo)                      AS qtd_vendas
       FROM vda
       JOIN vdit ON vdit.vditcodigovda = vda.vdacodigo
                AND vdit.vditempresa   = vda.vdaempresa
       JOIN prod ON prod.prodcodigo    = vdit.vditproduto
       LEFT JOIN atde ON atde.atdecodigo = vdit.vditvendedor
       LEFT JOIN spro ON spro.sprocodigo = prod.prodsecao
       LEFT JOIN gpro ON gpro.gprocodigo = prod.prodgrupo
       WHERE vda.vdaempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         AND prod.prodtipo = $4
       GROUP BY TO_CHAR(vda.vdamovimento, 'YYYY-MM-DD'), prod.prodcodigo, prod.prodresumo,
                atde.atdenome, spro.sprodescricao, prod.prodsecao, gpro.gprodescricao, prod.prodgrupo
       ORDER BY dia, combustivel, vendedor`,
      [empresa, dataInicio, dataFim, prodtipo]
    );

    res.json(result.rows.map(r => ({
      dia:           String(r.dia).substring(0, 10),
      codigoProduto: r.codigo_produto,
      combustivel:   r.combustivel,
      vendedor:      r.vendedor,
      secao:         r.secao  || 'Sem Seção',
      grupo:         r.grupo  || 'Sem Grupo',
      litros:        parseFloat(r.litros),
      faturamento:   parseFloat(r.faturamento),
      qtdVendas:     parseInt(r.qtd_vendas),
    })));
  } catch (err) {
    console.error('Error in /dashboard/vendas-pista:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/prod-categorias?prodtipo=2
// Retorna todas as seções (spro) e grupos (gpro) disponíveis para um prodtipo
router.get('/prod-categorias', async (req, res) => {
  const prodtipo = parseInt(req.query.prodtipo) || 1;

  try {
    const sproResult = await query(
      `SELECT DISTINCT spro.sprocodigo AS codigo, spro.sprodescricao AS nome
       FROM prod
       JOIN spro ON spro.sprocodigo = prod.prodsecao
       WHERE prod.prodtipo = $1
         AND spro.sprodescricao IS NOT NULL
       ORDER BY spro.sprodescricao`,
      [prodtipo]
    );

    const gproResult = await query(
      `SELECT DISTINCT gpro.gprocodigo AS codigo, gpro.gprodescricao AS nome
       FROM prod
       JOIN gpro ON gpro.gprocodigo = prod.prodgrupo
       WHERE prod.prodtipo = $1
         AND gpro.gprodescricao IS NOT NULL
       ORDER BY gpro.gprodescricao`,
      [prodtipo]
    );

    res.json({
      secoes: sproResult.rows.map(r => ({ codigo: r.codigo, nome: r.nome })),
      grupos: gproResult.rows.map(r => ({ codigo: r.codigo, nome: r.nome })),
    });
  } catch (err) {
    console.error('Error in /dashboard/prod-categorias:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/top-convenio?empresa=7432&periodo=052026
// Top 4 non-fuel products by qty sold in the period
router.get('/top-convenio', async (req, res) => {
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
         p.prodcodigo AS id,
         p.prodresumo AS nome,
         COALESCE(SUM(i.vditqtd), 0) AS qtd
       FROM vdit i
       JOIN vda v  ON v.vdacodigo  = i.vditcodigovda AND v.vdaempresa = i.vditempresa
       JOIN prod p ON p.prodcodigo = i.vditproduto
       WHERE i.vditempresa = $1
         AND v.vdamovimento >= $2
         AND v.vdamovimento <= $3
         AND (v.vdastatus IS NULL OR v.vdastatus = 0)
         AND p.prodtipo != 1
       GROUP BY p.prodcodigo, p.prodresumo
       ORDER BY qtd DESC
       LIMIT 4`,
      [empresa, dataInicio, dataFim]
    );

    res.json(result.rows.map(r => ({
      id:   r.id,
      name: r.nome,
      qty:  parseFloat(r.qtd),
    })));
  } catch (err) {
    console.error('Error in /dashboard/top-convenio:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/vendas-diarias-full?empresa=7432&periodo=052026
// Daily litros + valor combustivel + valor conveniencia
router.get('/vendas-diarias-full', async (req, res) => {
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
         v.vdamovimento AS dia,
         COALESCE(SUM(CASE WHEN p.prodtipo = 1  THEN i.vditqtd    ELSE 0 END), 0) AS litros_combustivel,
         COALESCE(SUM(CASE WHEN p.prodtipo = 1  THEN i.vdittotal  ELSE 0 END), 0) AS valor_combustivel,
         COALESCE(SUM(CASE WHEN p.prodtipo != 1 THEN i.vdittotal  ELSE 0 END), 0) AS valor_conveniencia
       FROM vda v
       JOIN vdit i  ON i.vditcodigovda = v.vdacodigo AND i.vditempresa = v.vdaempresa
       JOIN prod p  ON p.prodcodigo    = i.vditproduto
       WHERE v.vdaempresa = $1
         AND v.vdamovimento >= $2
         AND v.vdamovimento <= $3
         AND (v.vdastatus IS NULL OR v.vdastatus = 0)
       GROUP BY v.vdamovimento
       ORDER BY dia`,
      [empresa, dataInicio, dataFim]
    );

    res.json(result.rows.map(r => ({
      dia:               r.dia,
      litrosCombustivel: parseFloat(r.litros_combustivel),
      valorCombustivel:  parseFloat(r.valor_combustivel),
      valorConveniencia: parseFloat(r.valor_conveniencia),
    })));
  } catch (err) {
    console.error('Error in /dashboard/vendas-diarias-full:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/abc-produtos?empresa=7432&periodo=052026&prodtipo=1
// Products ranked by volume for ABC matrix — prodtipo=1 (combustíveis), prodtipo=2 (pista/convenio)
router.get('/abc-produtos', async (req, res) => {
  const empresa  = parseInt(req.query.empresa);
  const periodo  = req.query.periodo;
  const prodtipo = parseInt(req.query.prodtipo) || 1;

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
         p.prodresumo                     AS nome,
         COALESCE(SUM(i.vditqtd),   0)    AS qtd,
         COALESCE(SUM(i.vdittotal), 0)    AS faturamento,
         COALESCE(AVG(ep.e_prodcusto), 0) AS custo_medio
       FROM vdit i
       JOIN vda  v  ON v.vdacodigo  = i.vditcodigovda AND v.vdaempresa = i.vditempresa
       JOIN prod p  ON p.prodcodigo = i.vditproduto
       LEFT JOIN e_prod ep ON ep.e_prodproduto = i.vditproduto
                          AND ep.e_prodempresa  = $1
       WHERE i.vditempresa = $1
         AND v.vdamovimento >= $2
         AND v.vdamovimento <= $3
         AND (v.vdastatus IS NULL OR v.vdastatus = 0)
         AND p.prodtipo = $4
       GROUP BY p.prodresumo
       ORDER BY qtd DESC
       LIMIT 25`,
      [empresa, dataInicio, dataFim, prodtipo]
    );

    res.json(result.rows.map(r => {
      const qtd   = parseFloat(r.qtd);
      const fat   = parseFloat(r.faturamento);
      const custo = parseFloat(r.custo_medio);
      const margin = fat > 0 && custo > 0
        ? Math.max(0, Math.min(99, ((fat - qtd * custo) / fat) * 100))
        : 0;
      return {
        name:   r.nome,
        volume: qtd,
        margin: parseFloat(margin.toFixed(1)),
      };
    }));
  } catch (err) {
    console.error('Error in /dashboard/abc-produtos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
