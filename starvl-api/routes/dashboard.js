const express = require('express');
const router  = require('express').Router();
const { queryFor } = require('../db/poolManager');
const pool          = require('../db/pool'); // banco de gestão (nosso), não o SGA do cliente

// ── Cache em memória (5 min, cobre qualquer período — primeira linha de defesa) ─
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

// ── Cache persistente no Postgres (só para períodos fechados) ──────────────────
// Meses já fechados praticamente não mudam mais, então guardamos o resultado no
// nosso próprio banco em vez de bater no banco do cliente toda vez — sobrevive a
// restart/deploy, ao contrário do cache em memória acima. TTL de 24h (em vez de
// permanente) porque o usuário confirmou que lançamentos retroativos em período
// fechado acontecem às vezes; isso limita o quão desatualizado o cache pode ficar
// sem precisar de invalidação ativa (que exigiria mexer no schema do SGA, fora
// de cogitação). `?force=1` (já existente) também bypassa essa camada e força
// recálculo imediato após uma correção retroativa conhecida.
const DB_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_dashboard_cache (
    dc_id      SERIAL       PRIMARY KEY,
    dc_chave   TEXT         NOT NULL UNIQUE,
    dc_payload JSONB        NOT NULL,
    dc_criado  TIMESTAMPTZ  DEFAULT NOW()
  )
`).catch(err => console.error('[dashboard_cache] ensureTable:', err.message));

// periodo = 'MMYYYY'. Fechado = estritamente anterior ao mês/ano atual.
function isPeriodoFechado(periodo) {
  if (!periodo || periodo.length !== 6) return false;
  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  if (!mes || !ano) return false;
  const agora = new Date();
  const anoAtual = agora.getFullYear(), mesAtual = agora.getMonth() + 1;
  return ano < anoAtual || (ano === anoAtual && mes < mesAtual);
}

async function dbCacheGet(key) {
  try {
    const { rows } = await pool.query(
      `SELECT dc_payload, dc_criado FROM starvl_dashboard_cache WHERE dc_chave=$1`, [key]
    );
    if (!rows.length) return null;
    if (Date.now() - new Date(rows[0].dc_criado).getTime() > DB_CACHE_TTL_MS) return null;
    return rows[0].dc_payload;
  } catch (err) {
    console.error('[dashboard_cache] get:', err.message);
    return null;
  }
}
function dbCacheSet(key, data) {
  // Fire-and-forget — não atrasa a resposta ao usuário por causa do cache.
  pool.query(
    `INSERT INTO starvl_dashboard_cache (dc_chave, dc_payload, dc_criado)
     VALUES ($1, $2, NOW())
     ON CONFLICT (dc_chave) DO UPDATE SET dc_payload=$2, dc_criado=NOW()`,
    [key, data]
  ).catch(err => console.error('[dashboard_cache] set:', err.message));
}

// Middleware que injeta cache (memória + Postgres) nas rotas GET do dashboard
function withCache(handler) {
  return async (req, res) => {
    const key = req.originalUrl;
    const periodoFechado = isPeriodoFechado(req.query.periodo);
    const force = req.query.force === '1';

    if (!force) {
      const memHit = cacheGet(key);
      if (memHit) {
        res.setHeader('X-Cache', 'HIT-MEM');
        return res.json(memHit);
      }
      if (periodoFechado) {
        const dbHit = await dbCacheGet(key);
        if (dbHit) {
          cacheSet(key, dbHit); // esquenta o cache em memória também
          res.setHeader('X-Cache', 'HIT-DB');
          return res.json(dbHit);
        }
      }
    }

    // Intercepta res.json para armazenar no(s) cache(s)
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(key, body);
        if (periodoFechado) dbCacheSet(key, body);
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };
    return handler(req, res);
  };
}

// Executa uma query em todos os pools das empresas e retorna todas as linhas
async function queryAll(empresaList, sql, paramsFn) {
  const settled = await Promise.allSettled(
    empresaList.map(emp => queryFor(emp)(sql, paramsFn(emp)))
  );
  return settled.flatMap(r => r.status === 'fulfilled' ? r.value.rows : []);
}

// Parseia o parâmetro empresas (aceita "empresa" legado ou "empresas" novo)
function parseEmpresas(query) {
  const raw = query.empresas || query.empresa || '';
  return raw.toString().split(',').map(Number).filter(Boolean);
}

// GET /api/dashboard/kpis?empresas=7432,7433&periodo=042026
router.get('/kpis', withCache(async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  const periodo = req.query.periodo; // MMYYYY

  if (!empresaList.length || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }
  // Mantém compat com queryFor (usa primeira empresa para contexto de conexão)
  const empresa = empresaList[0];

  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${diasNoMes}`;
  // Limite exclusivo (1º dia do mês seguinte) — usado nas comparações contra
  // colunas TIMESTAMP (entcpachegada/pededatarecebimento/aferdata) em vez de
  // DATE(coluna)>=/<=, que envolve a coluna numa função e impede o uso de
  // índice. `col >= inicio AND col < fimExclusivo` é sargable e equivalente.
  const proximoMes = new Date(ano, mes, 1);
  const dataFimExclusiva = `${proximoMes.getFullYear()}-${String(proximoMes.getMonth() + 1).padStart(2, '0')}-01`;

  const p = (emp) => [emp, dataInicio, dataFim, dataFimExclusiva];

  try {
    const [vendas, comb, conv, comprasComb, comprasConv, afer] = await Promise.all([
      queryAll(empresaList,
        `SELECT COUNT(DISTINCT vda.vdacodigo) AS total_vendas,
                COALESCE(SUM(vdit.vdittotal), 0) AS valor_total_vendas
         FROM vda JOIN vdit ON vdit.vditcodigovda=vda.vdacodigo AND vdit.vditempresa=vda.vdaempresa
         WHERE vda.vdaempresa=$1 AND vda.vdamovimento>=$2 AND vda.vdamovimento<=$3
           AND (vda.vdastatus IS NULL OR vda.vdastatus=0)`, p),

      queryAll(empresaList,
        `SELECT COUNT(DISTINCT vda.vdacodigo) AS total_vendas_comb,
                COALESCE(SUM(vdit.vditqtd),0) AS litros_vendidos,
                COALESCE(SUM(vdit.vdittotal),0) AS valor_combustivel
         FROM vdit JOIN vda ON vda.vdacodigo=vdit.vditcodigovda AND vda.vdaempresa=vdit.vditempresa
         JOIN prod ON prod.prodcodigo=vdit.vditproduto
         WHERE vdit.vditempresa=$1 AND vda.vdamovimento>=$2 AND vda.vdamovimento<=$3
           AND (vda.vdastatus IS NULL OR vda.vdastatus=0) AND prod.prodtipo=1`, p),

      queryAll(empresaList,
        `SELECT COUNT(DISTINCT vda.vdacodigo) AS total_vendas_conv,
                COALESCE(SUM(vdit.vdittotal),0) AS valor_conv,
                COALESCE(SUM(vdit.vditqtd),0) AS qtd_itens_conv
         FROM vdit JOIN vda ON vda.vdacodigo=vdit.vditcodigovda AND vda.vdaempresa=vdit.vditempresa
         JOIN prod ON prod.prodcodigo=vdit.vditproduto
         WHERE vdit.vditempresa=$1 AND vda.vdamovimento>=$2 AND vda.vdamovimento<=$3
           AND (vda.vdastatus IS NULL OR vda.vdastatus=0) AND prod.prodtipo!=1`, p),

      queryAll(empresaList,
        `WITH c_entcpa AS (
           SELECT COALESCE(SUM(ei.entcpitotal),0) AS valor, COUNT(DISTINCT ec.entcpacodigo) AS total
           FROM entcpa ec JOIN entcpi ei ON ei.entcpicompra=ec.entcpacodigo
           JOIN prod p ON p.prodcodigo=ei.entcpiproduto
           WHERE ec.entcpaempresa=$1 AND ec.entcpachegada>=$2 AND ec.entcpachegada<$4 AND p.prodtipo=1
         ), c_pedi AS (
           SELECT COALESCE(SUM(pi.peditotal),0) AS valor, COUNT(DISTINCT pd.pedecodigo) AS total
           FROM pede pd JOIN pedi pi ON pi.pedicodigopede=pd.pedecodigo AND pi.pediempresa=pd.pedeempresa
           JOIN prod p ON p.prodcodigo=pi.pediproduto
           WHERE pd.pedeempresa=$1 AND pd.pededatarecebimento IS NOT NULL
             AND pd.pededatarecebimento>=$2 AND pd.pededatarecebimento<$4 AND p.prodtipo=1
         )
         SELECT (SELECT valor FROM c_entcpa)+(SELECT valor FROM c_pedi) AS valor_compras_comb,
                (SELECT total FROM c_entcpa)+(SELECT total FROM c_pedi) AS total_compras_comb`, p),

      queryAll(empresaList,
        `SELECT COALESCE(SUM(ei.entcpitotal),0) AS valor_compras_conv,
                COUNT(DISTINCT ec.entcpacodigo) AS total_compras_conv
         FROM entcpa ec JOIN entcpi ei ON ei.entcpicompra=ec.entcpacodigo
         JOIN prod p ON p.prodcodigo=ei.entcpiproduto
         WHERE ec.entcpaempresa=$1 AND ec.entcpachegada>=$2 AND ec.entcpachegada<$4
           AND p.prodtipo=2`, p),

      queryAll(empresaList,
        `SELECT COUNT(*) AS total_afericoes, COALESCE(SUM(aferqtd),0) AS total_qtd_afericao
         FROM afer WHERE aferempresa=$1 AND aferdata>=$2 AND aferdata<$4`, p),
    ]);

    const sum = (rows, field) => rows.reduce((s, r) => s + parseFloat(r[field] || 0), 0);
    const cnt = (rows, field) => rows.reduce((s, r) => s + parseInt(r[field]  || 0), 0);

    res.json({
      periodo: { mes, ano },
      vendas:      { total: cnt(vendas,      'total_vendas'),      valor: sum(vendas,      'valor_total_vendas') },
      combustivel: { total: cnt(comb,        'total_vendas_comb'), litros: sum(comb, 'litros_vendidos'), valor: sum(comb, 'valor_combustivel') },
      conveniencia:{ total: cnt(conv,        'total_vendas_conv'), valor: sum(conv,  'valor_conv'),      qtd: sum(conv, 'qtd_itens_conv') },
      comprasComb: { total: cnt(comprasComb, 'total_compras_comb'),valor: sum(comprasComb,'valor_compras_comb') },
      comprasConv: { total: cnt(comprasConv, 'total_compras_conv'),valor: sum(comprasConv,'valor_compras_conv') },
      afericoes:   { total: cnt(afer,        'total_afericoes'),   qtd:  sum(afer,  'total_qtd_afericao') },
    });
  } catch (err) {
    console.error('Error in /dashboard/kpis:', err.message);
    res.status(500).json({ error: err.message });
  }
}));

// GET /api/dashboard/vendas-diarias?empresas=7432,7433&periodo=042026
router.get('/vendas-diarias', withCache(async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  const periodo = req.query.periodo;

  if (!empresaList.length || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }

  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${diasNoMes}`;

  try {
    const rows = await queryAll(empresaList,
      `SELECT vda.vdamovimento AS dia, COUNT(DISTINCT vda.vdacodigo) AS qtd_vendas,
              COALESCE(SUM(vdit.vdittotal),0) AS valor_total
       FROM vda JOIN vdit ON vdit.vditcodigovda=vda.vdacodigo AND vdit.vditempresa=vda.vdaempresa
       JOIN prod ON prod.prodcodigo=vdit.vditproduto
       WHERE vda.vdaempresa=$1 AND vda.vdamovimento>=$2 AND vda.vdamovimento<=$3
         AND (vda.vdastatus IS NULL OR vda.vdastatus=0) AND prod.prodtipo=1
       GROUP BY vda.vdamovimento ORDER BY dia`,
      emp => [emp, dataInicio, dataFim]
    );

    // Agrega por dia
    const byDia = {};
    rows.forEach(r => {
      const k = String(r.dia);
      if (!byDia[k]) byDia[k] = { qtd: 0, val: 0 };
      byDia[k].qtd += parseInt(r.qtd_vendas || 0);
      byDia[k].val += parseFloat(r.valor_total || 0);
    });

    res.json(Object.entries(byDia).sort(([a],[b]) => a.localeCompare(b)).map(([dia, v]) => ({
      dia, qtdVendas: v.qtd, valorTotal: v.val,
    })));
  } catch (err) {
    console.error('Error in /dashboard/vendas-diarias:', err.message);
    res.status(500).json({ error: err.message });
  }
}));

// GET /api/dashboard/vendas-horarias?empresas=7432,7433&periodo=042026
router.get('/vendas-horarias', withCache(async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  const periodo = req.query.periodo;

  if (!empresaList.length || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }

  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${diasNoMes}`;

  try {
    const rows = await queryAll(empresaList,
      `SELECT EXTRACT(HOUR FROM vda.vdadata)::int AS hora,
              COUNT(DISTINCT vda.vdacodigo) AS qtd_vendas,
              COALESCE(SUM(vdit.vdittotal),0) AS valor_total
       FROM vda JOIN vdit ON vdit.vditcodigovda=vda.vdacodigo AND vdit.vditempresa=vda.vdaempresa
       JOIN prod ON prod.prodcodigo=vdit.vditproduto
       WHERE vda.vdaempresa=$1 AND vda.vdamovimento>=$2 AND vda.vdamovimento<=$3
         AND (vda.vdastatus IS NULL OR vda.vdastatus=0) AND prod.prodtipo=1
       GROUP BY EXTRACT(HOUR FROM vda.vdadata)::int ORDER BY hora`,
      emp => [emp, dataInicio, dataFim]
    );

    const byHour = {};
    rows.forEach(r => {
      const h = Number(r.hora);
      if (!byHour[h]) byHour[h] = { qtd: 0, val: 0 };
      byHour[h].qtd += parseInt(r.qtd_vendas  || 0);
      byHour[h].val += parseFloat(r.valor_total || 0);
    });

    res.json(Array.from({ length: 24 }, (_, hora) => ({
      hora, label: `${String(hora).padStart(2, '0')}h`,
      qtdVendas: byHour[hora]?.qtd || 0, valorTotal: byHour[hora]?.val || 0,
    })));
  } catch (err) {
    console.error('Error in /dashboard/vendas-horarias:', err.message);
    res.status(500).json({ error: err.message });
  }
}));

// GET /api/dashboard/combustiveis?empresas=7432,7433&periodo=042026
router.get('/combustiveis', withCache(async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  const periodo = req.query.periodo;

  if (!empresaList.length || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }

  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${diasNoMes}`;

  try {
    const rows = await queryAll(empresaList,
      `SELECT prod.prodcodigo AS codigo, prod.proddescricao AS nome,
              COALESCE(SUM(vdit.vditqtd),0) AS litros, COALESCE(SUM(vdit.vdittotal),0) AS valor
       FROM vdit JOIN vda ON vda.vdacodigo=vdit.vditcodigovda AND vda.vdaempresa=vdit.vditempresa
       JOIN prod ON prod.prodcodigo=vdit.vditproduto
       WHERE vdit.vditempresa=$1 AND vda.vdamovimento>=$2 AND vda.vdamovimento<=$3
         AND (vda.vdastatus IS NULL OR vda.vdastatus=0) AND vdit.vditcodigovda IS NOT NULL AND prod.prodtipo=1
       GROUP BY prod.prodcodigo, prod.proddescricao ORDER BY litros DESC`,
      emp => [emp, dataInicio, dataFim]
    );

    // Agrega por nome do combustível
    const byNome = {};
    rows.forEach(r => {
      const k = r.nome;
      if (!byNome[k]) byNome[k] = { codigo: r.codigo, nome: k, litros: 0, valor: 0 };
      byNome[k].litros += parseFloat(r.litros || 0);
      byNome[k].valor  += parseFloat(r.valor  || 0);
    });

    res.json(Object.values(byNome).sort((a, b) => b.litros - a.litros));
  } catch (err) {
    console.error('Error in /dashboard/combustiveis:', err.message);
    res.status(500).json({ error: err.message });
  }
}));

// GET /api/dashboard/vendas-pista?empresas=7432&dataInicio=2026-04-20&dataFim=2026-05-26&prodtipo=1&locz=pista
router.get('/vendas-pista', withCache(async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  const empresa = empresaList[0]; // usa primeira para compat
  const query = queryFor(empresa);
  const prodtipo = parseInt(req.query.prodtipo) || 1;
  const loczFiltro = (req.query.locz || '').trim().toLowerCase();
  const { dataInicio, dataFim } = req.query;

  if (!empresaList.length || !dataInicio || !dataFim) {
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
       LEFT JOIN e_prod eprod ON eprod.e_prodproduto = prod.prodcodigo AND eprod.e_prodempresa = vda.vdaempresa
       LEFT JOIN locz ON locz.loczcodigo = eprod.e_prodlocal
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

// GET /api/dashboard/prod-categorias?empresas=7432,7433&prodtipo=2&locz=pista
// Retorna todas as seções (spro) e grupos (gpro) disponíveis para um prodtipo
router.get('/prod-categorias', withCache(async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  const prodtipo    = parseInt(req.query.prodtipo) || 1;
  const loczFiltro  = (req.query.locz || '').trim().toLowerCase();
  const loczClause  = loczFiltro ? `AND LOWER(COALESCE(locz.loczdescricao,'')) = '${loczFiltro.replace(/'/g,"''")}'` : '';

  if (!empresaList.length) {
    return res.status(400).json({ error: 'empresa é obrigatório' });
  }

  try {
    const [sproRows, gproRows] = await Promise.all([
      queryAll(empresaList,
        `SELECT DISTINCT spro.sprocodigo AS codigo, spro.sprodescricao AS nome
         FROM prod
         JOIN spro ON spro.sprocodigo = prod.prodsecao
         LEFT JOIN e_prod eprod ON eprod.e_prodproduto = prod.prodcodigo AND eprod.e_prodempresa = $2
         LEFT JOIN locz ON locz.loczcodigo = eprod.e_prodlocal
         WHERE prod.prodtipo = $1 AND spro.sprodescricao IS NOT NULL ${loczClause}
         ORDER BY spro.sprodescricao`,
        emp => [prodtipo, emp]
      ),
      queryAll(empresaList,
        `SELECT DISTINCT gpro.gprocodigo AS codigo, gpro.gprodescricao AS nome
         FROM prod
         JOIN gpro ON gpro.gprocodigo = prod.prodgrupo
         LEFT JOIN e_prod eprod ON eprod.e_prodproduto = prod.prodcodigo AND eprod.e_prodempresa = $2
         LEFT JOIN locz ON locz.loczcodigo = eprod.e_prodlocal
         WHERE prod.prodtipo = $1 AND gpro.gprodescricao IS NOT NULL ${loczClause}
         ORDER BY gpro.gprodescricao`,
        emp => [prodtipo, emp]
      ),
    ]);

    // Deduplica por nome (union das empresas)
    const uniqByNome = rows => {
      const seen = new Set();
      return rows.filter(r => seen.has(r.nome) ? false : seen.add(r.nome));
    };

    res.json({
      secoes: uniqByNome(sproRows).map(r => ({ codigo: r.codigo, nome: r.nome })),
      grupos: uniqByNome(gproRows).map(r => ({ codigo: r.codigo, nome: r.nome })),
    });
  } catch (err) {
    console.error('Error in /dashboard/prod-categorias:', err.message);
    res.status(500).json({ error: err.message });
  }
}));

// GET /api/dashboard/top-convenio?empresas=7432,7433&periodo=052026
// Top 5 non-fuel products by qty sold in the period
router.get('/top-convenio', withCache(async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  const periodo     = req.query.periodo;
  const loczFiltro  = (req.query.locz || '').trim().toLowerCase();

  if (!empresaList.length || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }

  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const dataFim    = `${ano}-${String(mes).padStart(2, '0')}-${diasNoMes}`;

  const loczClause = loczFiltro === 'pista'
    ? `AND LOWER(COALESCE(l.loczdescricao,'')) LIKE '%pista%'`
    : `AND LOWER(COALESCE(l.loczdescricao,'')) NOT LIKE '%pista%'`;

  try {
    const rows = await queryAll(empresaList,
      `SELECT
         p.proddescricao AS nome,
         COALESCE(SUM(i.vditqtd), 0) AS qtd
       FROM vdit i
       JOIN vda v  ON v.vdacodigo  = i.vditcodigovda AND v.vdaempresa = i.vditempresa
       JOIN prod p ON p.prodcodigo = i.vditproduto
       LEFT JOIN e_prod e ON e.e_prodproduto = p.prodcodigo AND e.e_prodempresa = i.vditempresa
       LEFT JOIN locz l ON l.loczcodigo = e.e_prodlocal
       WHERE i.vditempresa = $1
         AND v.vdamovimento >= $2
         AND v.vdamovimento <= $3
         AND (v.vdastatus IS NULL OR v.vdastatus = 0)
         AND i.vditcodigovda IS NOT NULL
         AND p.prodtipo = 2
         ${loczClause}
       GROUP BY p.proddescricao
       ORDER BY qtd DESC`,
      emp => [emp, dataInicio, dataFim]
    );

    // Agrega por nome e pega top 5
    const byNome = {};
    rows.forEach(r => {
      const k = r.nome;
      byNome[k] = (byNome[k] || 0) + parseFloat(r.qtd || 0);
    });

    const sorted = Object.entries(byNome)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    res.json(sorted.map(([name, qty]) => ({ name, qty })));
  } catch (err) {
    console.error('Error in /dashboard/top-convenio:', err.message);
    res.status(500).json({ error: err.message });
  }
}));

// GET /api/dashboard/vendas-diarias-full?empresas=7432,7433&periodo=052026
// Daily litros + valor combustivel + valor conveniencia
router.get('/vendas-diarias-full', withCache(async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  const periodo     = req.query.periodo;

  if (!empresaList.length || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }

  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const dataFim    = `${ano}-${String(mes).padStart(2, '0')}-${diasNoMes}`;

  try {
    const rows = await queryAll(empresaList,
      `SELECT
         v.vdamovimento AS dia,
         COALESCE(SUM(CASE WHEN p.prodtipo = 1  THEN i.vditqtd    ELSE 0 END), 0) AS litros_combustivel,
         COALESCE(SUM(CASE WHEN p.prodtipo = 1  THEN i.vdittotal  ELSE 0 END), 0) AS valor_combustivel,
         COALESCE(SUM(CASE WHEN p.prodtipo = 2 AND LOWER(COALESCE(l.loczdescricao,'')) NOT LIKE '%pista%' THEN i.vdittotal ELSE 0 END), 0) AS valor_conveniencia,
         COALESCE(SUM(CASE WHEN p.prodtipo = 2 AND LOWER(COALESCE(l.loczdescricao,'')) LIKE '%pista%' THEN i.vdittotal ELSE 0 END), 0) AS valor_pista
       FROM vda v
       JOIN vdit i  ON i.vditcodigovda = v.vdacodigo AND i.vditempresa = v.vdaempresa
       JOIN prod p  ON p.prodcodigo    = i.vditproduto
       LEFT JOIN e_prod e ON e.e_prodproduto = p.prodcodigo AND e.e_prodempresa = v.vdaempresa
       LEFT JOIN locz l ON l.loczcodigo = e.e_prodlocal
       WHERE v.vdaempresa = $1
         AND v.vdamovimento >= $2
         AND v.vdamovimento <= $3
         AND (v.vdastatus IS NULL OR v.vdastatus = 0)
       GROUP BY v.vdamovimento
       ORDER BY dia`,
      emp => [emp, dataInicio, dataFim]
    );

    // Agrega por dia
    const byDia = {};
    rows.forEach(r => {
      const k = String(r.dia);
      if (!byDia[k]) byDia[k] = { dia: r.dia, lc: 0, vc: 0, vconv: 0, vp: 0 };
      byDia[k].lc    += parseFloat(r.litros_combustivel || 0);
      byDia[k].vc    += parseFloat(r.valor_combustivel  || 0);
      byDia[k].vconv += parseFloat(r.valor_conveniencia || 0);
      byDia[k].vp    += parseFloat(r.valor_pista        || 0);
    });

    res.json(Object.values(byDia).sort((a, b) => String(a.dia).localeCompare(String(b.dia))).map(v => ({
      dia:               v.dia,
      litrosCombustivel: v.lc,
      valorCombustivel:  v.vc,
      valorConveniencia: v.vconv,
      valorPista:        v.vp,
    })));
  } catch (err) {
    console.error('Error in /dashboard/vendas-diarias-full:', err.message);
    res.status(500).json({ error: err.message });
  }
}));

// GET /api/dashboard/abc-produtos?empresas=7432,7433&periodo=052026&prodtipo=1
// Products ranked by volume for ABC matrix — prodtipo=1 (combustíveis), prodtipo=2 (pista/convenio)
router.get('/abc-produtos', withCache(async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  const periodo     = req.query.periodo;
  const prodtipo    = parseInt(req.query.prodtipo) || 1;
  const loczFiltro  = (req.query.locz || '').trim().toLowerCase();

  if (!empresaList.length || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }

  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const dataFim    = `${ano}-${String(mes).padStart(2, '0')}-${diasNoMes}`;

  const loczClause = prodtipo !== 2 ? '' : (
    loczFiltro === 'pista'
      ? `AND LOWER(COALESCE(l.loczdescricao,'')) LIKE '%pista%'`
      : `AND LOWER(COALESCE(l.loczdescricao,'')) NOT LIKE '%pista%'`
  );

  try {
    const rows = await queryAll(empresaList,
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
       LEFT JOIN locz l ON l.loczcodigo = ep.e_prodlocal
       WHERE i.vditempresa = $1
         AND v.vdamovimento >= $2
         AND v.vdamovimento <= $3
         AND (v.vdastatus IS NULL OR v.vdastatus = 0)
         AND p.prodtipo = $4
         ${loczClause}
       GROUP BY p.prodresumo
       ORDER BY qtd DESC`,
      emp => [emp, dataInicio, dataFim, prodtipo]
    );

    // Agrega por nome, pega top 25
    const byNome = {};
    rows.forEach(r => {
      const k = r.nome;
      if (!byNome[k]) byNome[k] = { nome: k, qtd: 0, fat: 0, custoSum: 0, custoN: 0 };
      byNome[k].qtd     += parseFloat(r.qtd      || 0);
      byNome[k].fat     += parseFloat(r.faturamento || 0);
      byNome[k].custoSum += parseFloat(r.custo_medio || 0);
      byNome[k].custoN  += 1;
    });

    res.json(
      Object.values(byNome)
        .sort((a, b) => b.qtd - a.qtd)
        .slice(0, 25)
        .map(v => {
          const custo  = v.custoN > 0 ? v.custoSum / v.custoN : 0;
          const margin = v.fat > 0 && custo > 0
            ? Math.max(0, Math.min(99, ((v.fat - v.qtd * custo) / v.fat) * 100))
            : 0;
          return { name: v.nome, volume: v.qtd, margin: parseFloat(margin.toFixed(1)) };
        })
    );
  } catch (err) {
    console.error('Error in /dashboard/abc-produtos:', err.message);
    res.status(500).json({ error: err.message });
  }
}));

module.exports = router;
