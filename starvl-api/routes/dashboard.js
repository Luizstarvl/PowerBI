const express = require('express');
const router  = require('express').Router();
const { queryFor } = require('../db/poolManager');

// ── Cache em memória (5 min) ──────────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const cache = new Map();

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}
function cacheSet(key, data) {
  cache.set(key, { data, ts: Date.now() });
}
// Middleware que injeta cache nas rotas GET do dashboard
function withCache(handler) {
  return async (req, res) => {
    const key = req.originalUrl;
    // Bypass cache se force=1 for passado na query
    if (req.query.force !== '1') {
      const cached = cacheGet(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
    }
    // Intercepta res.json para armazenar no cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) cacheSet(key, body);
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };
    return handler(req, res);
  };
}

// GET /api/dashboard/kpis?empresa=7432&periodo=042026
router.get('/kpis', withCache(async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const query = queryFor(empresa);
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

    // Combustível vendido (litros + valor + qtd de vendas com combustível)
    const combustivelResult = await query(
      `SELECT
         COUNT(DISTINCT vda.vdacodigo)    AS total_vendas_comb,
         COALESCE(SUM(vdit.vditqtd), 0)  AS litros_vendidos,
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

    // Conveniência / Produtos (prodtipo != 1)
    const convenienciaResult = await query(
      `SELECT
         COUNT(DISTINCT vda.vdacodigo)    AS total_vendas_conv,
         COALESCE(SUM(vdit.vdittotal), 0) AS valor_conv,
         COALESCE(SUM(vdit.vditqtd), 0)  AS qtd_itens_conv
       FROM vdit
       JOIN vda ON vda.vdacodigo = vdit.vditcodigovda AND vda.vdaempresa = vdit.vditempresa
       JOIN prod ON prod.prodcodigo = vdit.vditproduto
       WHERE vdit.vditempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         AND prod.prodtipo != 1`,
      [empresa, dataInicio, dataFim]
    );

    // Compras de Combustível (prodtipo = 1): entcpa + pedidos (pede/pedi)
    const comprasCombResult = await query(
      `WITH c_entcpa AS (
         SELECT COALESCE(SUM(ei.entcpitotal), 0) AS valor,
                COUNT(DISTINCT ec.entcpacodigo)   AS total
         FROM entcpa ec
         JOIN entcpi ei ON ei.entcpicompra   = ec.entcpacodigo
         JOIN prod   p  ON p.prodcodigo      = ei.entcpiproduto
         WHERE ec.entcpaempresa = $1
           AND DATE(ec.entcpachegada) >= $2
           AND DATE(ec.entcpachegada) <= $3
           AND p.prodtipo = 1
       ),
       c_pedi AS (
         SELECT COALESCE(SUM(pi.peditotal), 0) AS valor,
                COUNT(DISTINCT pd.pedecodigo)   AS total
         FROM pede pd
         JOIN pedi pi ON pi.pedicodigopede = pd.pedecodigo
                     AND pi.pediempresa    = pd.pedeempresa
         JOIN prod  p  ON p.prodcodigo     = pi.pediproduto
         WHERE pd.pedeempresa = $1
           AND pd.pededatarecebimento IS NOT NULL
           AND DATE(pd.pededatarecebimento) >= $2
           AND DATE(pd.pededatarecebimento) <= $3
           AND p.prodtipo = 1
       )
       SELECT
         (SELECT valor FROM c_entcpa) + (SELECT valor FROM c_pedi) AS valor_compras_comb,
         (SELECT total FROM c_entcpa) + (SELECT total FROM c_pedi) AS total_compras_comb`,
      [empresa, dataInicio, dataFim]
    );

    // Compras de Conveniência (prodtipo = 2): apenas entcpa
    const comprasConvResult = await query(
      `SELECT
         COALESCE(SUM(ei.entcpitotal), 0)  AS valor_compras_conv,
         COUNT(DISTINCT ec.entcpacodigo)    AS total_compras_conv
       FROM entcpa ec
       JOIN entcpi ei ON ei.entcpicompra = ec.entcpacodigo
       JOIN prod   p  ON p.prodcodigo    = ei.entcpiproduto
       WHERE ec.entcpaempresa = $1
         AND DATE(ec.entcpachegada) >= $2
         AND DATE(ec.entcpachegada) <= $3
         AND p.prodtipo = 2`,
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
        total: parseInt(combustivelResult.rows[0].total_vendas_comb),
        litros: parseFloat(combustivelResult.rows[0].litros_vendidos),
        valor: parseFloat(combustivelResult.rows[0].valor_combustivel),
      },
      conveniencia: {
        total: parseInt(convenienciaResult.rows[0].total_vendas_conv),
        valor: parseFloat(convenienciaResult.rows[0].valor_conv),
        qtd:   parseFloat(convenienciaResult.rows[0].qtd_itens_conv),
      },
      comprasComb: {
        total: parseInt(comprasCombResult.rows[0].total_compras_comb),
        valor: parseFloat(comprasCombResult.rows[0].valor_compras_comb),
      },
      comprasConv: {
        total: parseInt(comprasConvResult.rows[0].total_compras_conv),
        valor: parseFloat(comprasConvResult.rows[0].valor_compras_conv),
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
}));

// GET /api/dashboard/vendas-diarias?empresa=7432&periodo=042026
router.get('/vendas-diarias', withCache(async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const query = queryFor(empresa);
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
}));

// GET /api/dashboard/vendas-horarias?empresa=7432&periodo=042026
router.get('/vendas-horarias', withCache(async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const query = queryFor(empresa);
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
}));

// GET /api/dashboard/combustiveis?empresa=7432&periodo=042026
router.get('/combustiveis', withCache(async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const query = queryFor(empresa);
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
}));

// GET /api/dashboard/vendas-pista?empresa=7432&dataInicio=2026-04-20&dataFim=2026-05-26&prodtipo=1&locz=pista
// prodtipo: 1 = combustíveis (padrão), 2 = conveniência/loja
// locz (opcional): filtra por loczdescricao (ex: 'pista')
router.get('/vendas-pista', withCache(async (req, res) => {
  const empresa  = parseInt(req.query.empresa);
  const query = queryFor(empresa);
  const prodtipo = parseInt(req.query.prodtipo) || 1;
  const loczFiltro = (req.query.locz || '').trim().toLowerCase();
  const { dataInicio, dataFim } = req.query;

  if (!empresa || !dataInicio || !dataFim) {
    return res.status(400).json({ error: 'empresa, dataInicio e dataFim são obrigatórios' });
  }

  const loczClause = loczFiltro ? `AND LOWER(COALESCE(locz.loczdescricao,'')) = '${loczFiltro.replace(/'/g,"''")}'` : '';

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
       LEFT JOIN locz ON locz.loczcodigo = prod.prodlocal
       LEFT JOIN atde ON atde.atdecodigo = vdit.vditvendedor
       LEFT JOIN spro ON spro.sprocodigo = prod.prodsecao
       LEFT JOIN gpro ON gpro.gprocodigo = prod.prodgrupo
       WHERE vda.vdaempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         AND prod.prodtipo = $4
         ${loczClause}
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
}));

// GET /api/dashboard/prod-categorias?prodtipo=2&locz=pista
// Retorna todas as seções (spro) e grupos (gpro) disponíveis para um prodtipo
router.get('/prod-categorias', withCache(async (req, res) => {
  const prodtipo   = parseInt(req.query.prodtipo) || 1;
  const loczFiltro = (req.query.locz || '').trim().toLowerCase();
  const loczClause = loczFiltro ? `AND LOWER(COALESCE(locz.loczdescricao,'')) = '${loczFiltro.replace(/'/g,"''")}'` : '';

  try {
    const sproResult = await query(
      `SELECT DISTINCT spro.sprocodigo AS codigo, spro.sprodescricao AS nome
       FROM prod
       JOIN spro ON spro.sprocodigo = prod.prodsecao
       LEFT JOIN locz ON locz.loczcodigo = prod.prodlocal
       WHERE prod.prodtipo = $1
         AND spro.sprodescricao IS NOT NULL
         ${loczClause}
       ORDER BY spro.sprodescricao`,
      [prodtipo]
    );

    const gproResult = await query(
      `SELECT DISTINCT gpro.gprocodigo AS codigo, gpro.gprodescricao AS nome
       FROM prod
       JOIN gpro ON gpro.gprocodigo = prod.prodgrupo
       LEFT JOIN locz ON locz.loczcodigo = prod.prodlocal
       WHERE prod.prodtipo = $1
         AND gpro.gprodescricao IS NOT NULL
         ${loczClause}
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
}));

// GET /api/dashboard/top-convenio?empresa=7432&periodo=052026
// Top 4 non-fuel products by qty sold in the period
router.get('/top-convenio', withCache(async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const query = queryFor(empresa);
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
         AND p.prodtipo = 2
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
}));

// GET /api/dashboard/vendas-diarias-full?empresa=7432&periodo=052026
// Daily litros + valor combustivel + valor conveniencia
router.get('/vendas-diarias-full', withCache(async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const query = queryFor(empresa);
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
         COALESCE(SUM(CASE WHEN p.prodtipo != 1 THEN i.vdittotal  ELSE 0 END), 0) AS valor_conveniencia,
         COALESCE(SUM(CASE WHEN p.prodtipo = 2 AND LOWER(COALESCE(l.loczdescricao,'')) = 'pista' THEN i.vdittotal ELSE 0 END), 0) AS valor_pista
       FROM vda v
       JOIN vdit i  ON i.vditcodigovda = v.vdacodigo AND i.vditempresa = v.vdaempresa
       JOIN prod p  ON p.prodcodigo    = i.vditproduto
       LEFT JOIN locz l ON l.loczcodigo = p.prodlocal
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
      valorPista:        parseFloat(r.valor_pista),
    })));
  } catch (err) {
    console.error('Error in /dashboard/vendas-diarias-full:', err.message);
    res.status(500).json({ error: err.message });
  }
}));

// GET /api/dashboard/abc-produtos?empresa=7432&periodo=052026&prodtipo=1
// Products ranked by volume for ABC matrix — prodtipo=1 (combustíveis), prodtipo=2 (pista/convenio)
router.get('/abc-produtos', withCache(async (req, res) => {
  const empresa  = parseInt(req.query.empresa);
  const query = queryFor(empresa);
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
}));

module.exports = router;
