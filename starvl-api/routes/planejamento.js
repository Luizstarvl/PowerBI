/**
 * routes/planejamento.js
 * Rotas para o módulo Planejamento Comercial — Projeção de Vendas
 */
const router     = require('express').Router();
const { queryFor } = require('../db/poolManager');

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function parseEmpresas(query) {
  const raw = query.empresas || query.empresa || '';
  return raw.toString().split(',').map(Number).filter(Boolean);
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Converte o período selecionado na tela em datas reais
function periodoToDates(periodo) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const fmt = formatDate;

  switch (periodo) {
    case 'Hoje':
      return { dataInicio: fmt(today), dataFim: fmt(today) };

    case 'Semana': {
      const s = new Date(today); s.setDate(today.getDate() - 6);
      return { dataInicio: fmt(s), dataFim: fmt(today) };
    }
    case 'Trimestre': {
      const s = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      return { dataInicio: fmt(s), dataFim: fmt(today) };
    }
    case 'Ano':
      return { dataInicio: `${today.getFullYear()}-01-01`, dataFim: fmt(today) };

    case 'Mês':
    default: {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return { dataInicio: fmt(s), dataFim: fmt(today) };
    }
  }
}

// Executa em todos os pools e agrega
async function queryAll(empresaList, sql, paramsFn) {
  const settled = await Promise.allSettled(
    empresaList.map(emp => queryFor(emp)(sql, paramsFn(emp)))
  );
  return settled.flatMap(r => r.status === 'fulfilled' ? r.value.rows : []);
}

// Monta cláusulas de filtro de seção e grupo (seguro contra injeção por parâmetro)
function buildFiltros(secao, grupo) {
  const clauses = [];
  const params  = [];
  if (secao && secao !== 'Todos') {
    params.push(secao);
    clauses.push(`spro.sprodescricao = $SECAO`);
  }
  if (grupo && grupo !== 'Todos') {
    params.push(grupo);
    clauses.push(`gpro.gprodescricao = $GRUPO`);
  }
  return { clauses, extraParams: params };
}

// Injeta os índices corretos nos placeholders $SECAO/$GRUPO
function injectParams(sql, baseIndex, clauses) {
  let idx = baseIndex;
  return sql.replace(/\$(SECAO|GRUPO)/g, () => `$${idx++}`);
}

/* ── GET /api/planejamento/evolucao ──────────────────────────────────────────
   Retorna os últimos N meses de venda real + projeção simples por tendência
   Query params: empresas, meses (default 12), secao, grupo
────────────────────────────────────────────────────────────────────────────── */
router.get('/evolucao', async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  if (!empresaList.length) return res.status(400).json({ error: 'empresas é obrigatório' });

  const meses  = Math.min(parseInt(req.query.meses) || 12, 24);
  const secao  = req.query.secao  || '';
  const grupo  = req.query.grupo  || '';

  // Janela: meses passados até hoje
  const hoje = new Date(); hoje.setDate(1);
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - (meses - 1), 1);
  const dataInicio = formatDate(inicio);
  const dataFim    = formatDate(new Date());

  const secaoClause = secao && secao !== 'Todos' ? `AND spro.sprodescricao = '${secao.replace(/'/g,"''")}'` : '';
  const grupoClause = grupo && grupo !== 'Todos' ? `AND gpro.gprodescricao  = '${grupo.replace(/'/g,"''")}'` : '';

  try {
    const rows = await queryAll(empresaList,
      `SELECT
         TO_CHAR(DATE_TRUNC('month', vda.vdamovimento), 'YYYY-MM') AS mes,
         COALESCE(SUM(vdit.vdittotal), 0)                           AS valor_total,
         COUNT(DISTINCT vda.vdacodigo)                              AS qtd_vendas
       FROM vda
       JOIN vdit ON vdit.vditcodigovda  = vda.vdacodigo
                AND vdit.vditempresa    = vda.vdaempresa
       JOIN prod ON prod.prodcodigo     = vdit.vditproduto
       LEFT JOIN spro ON spro.sprocodigo = prod.prodsecao
       LEFT JOIN gpro ON gpro.gprocodigo = prod.prodgrupo
                     AND gpro.gprosecao  = prod.prodsecao
       WHERE vda.vdaempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         ${secaoClause}
         ${grupoClause}
       GROUP BY DATE_TRUNC('month', vda.vdamovimento)
       ORDER BY mes`,
      emp => [emp, dataInicio, dataFim]
    );

    // Agrega múltiplas empresas pelo mesmo mês
    const byMes = {};
    rows.forEach(r => {
      if (!byMes[r.mes]) byMes[r.mes] = { valor: 0, qtd: 0 };
      byMes[r.mes].valor += parseFloat(r.valor_total || 0);
      byMes[r.mes].qtd   += parseInt(r.qtd_vendas   || 0);
    });

    // Preenche todos os meses da janela (mesmo sem venda)
    const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const historico = [];
    for (let i = 0; i < meses; i++) {
      const d   = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      historico.push({
        mes:     MESES_PT[d.getMonth()],
        mesKey:  key,
        ano:     d.getFullYear(),
        real:    byMes[key]?.valor || null,
        qtd:     byMes[key]?.qtd   || null,
      });
    }

    // Projeção simples: tendência linear dos últimos 3 meses com dados reais
    const comDados = historico.filter(m => m.real !== null);
    let taxa = 0;
    if (comDados.length >= 2) {
      const ultimos = comDados.slice(-3);
      const soma    = ultimos.slice(1).reduce((s, m, i) => s + (m.real / ultimos[i].real - 1), 0);
      taxa = soma / (ultimos.length - 1); // taxa média mensal
    }
    const ultimoReal = comDados.length ? comDados[comDados.length - 1].real : 0;

    // Marca os meses futuros (sem dado real) com projeção
    let base = ultimoReal;
    historico.forEach(m => {
      if (m.real === null && base > 0) {
        base = base * (1 + taxa);
        m.projetado = Math.round(base);
      } else {
        m.projetado = null;
      }
    });

    res.json({ historico, taxaCrescimento: parseFloat((taxa * 100).toFixed(2)) });
  } catch (err) {
    console.error('[planejamento/evolucao]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/planejamento/kpis ──────────────────────────────────────────────
   KPIs do período selecionado vs. período anterior equivalente
   Query params: empresas, periodo (Hoje|Semana|Mês|Trimestre|Ano), secao, grupo
────────────────────────────────────────────────────────────────────────────── */
router.get('/kpis', async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  if (!empresaList.length) return res.status(400).json({ error: 'empresas é obrigatório' });

  const periodo = req.query.periodo || 'Mês';
  const secao   = req.query.secao   || '';
  const grupo   = req.query.grupo   || '';

  const { dataInicio, dataFim } = periodoToDates(periodo);

  // Período anterior de mesmo comprimento
  const dias = Math.max(1, Math.round(
    (new Date(dataFim) - new Date(dataInicio)) / (1000 * 60 * 60 * 24)
  ));
  const antFim   = new Date(dataInicio); antFim.setDate(antFim.getDate() - 1);
  const antIni   = new Date(antFim);     antIni.setDate(antFim.getDate() - dias + 1);
  const dataAnteriorInicio = formatDate(antIni);
  const dataAnteriorFim    = formatDate(antFim);

  const secaoClause = secao && secao !== 'Todos' ? `AND spro.sprodescricao = '${secao.replace(/'/g,"''")}'` : '';
  const grupoClause = grupo && grupo !== 'Todos' ? `AND gpro.gprodescricao  = '${grupo.replace(/'/g,"''")}'` : '';

  const sql = (di, df) => `
    SELECT
      COALESCE(SUM(vdit.vdittotal), 0)            AS valor_total,
      COUNT(DISTINCT vda.vdacodigo)               AS qtd_vendas,
      COUNT(vdit.vditcodigo)                      AS qtd_itens,
      COALESCE(SUM(vdit.vdittotal),0)
        / NULLIF(COUNT(DISTINCT vda.vdacodigo),0) AS ticket_medio
    FROM vda
    JOIN vdit ON vdit.vditcodigovda  = vda.vdacodigo
             AND vdit.vditempresa    = vda.vdaempresa
    JOIN prod ON prod.prodcodigo     = vdit.vditproduto
    LEFT JOIN spro ON spro.sprocodigo = prod.prodsecao
    LEFT JOIN gpro ON gpro.gprocodigo = prod.prodgrupo
                  AND gpro.gprosecao  = prod.prodsecao
    WHERE vda.vdaempresa = $1
      AND vda.vdamovimento >= '${di}'
      AND vda.vdamovimento <= '${df}'
      AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
      ${secaoClause}
      ${grupoClause}`;

  try {
    const [atual, anterior] = await Promise.all([
      queryAll(empresaList, sql(dataInicio, dataFim),         emp => [emp]),
      queryAll(empresaList, sql(dataAnteriorInicio, dataAnteriorFim), emp => [emp]),
    ]);

    const sum = (rows, f) => rows.reduce((s, r) => s + parseFloat(r[f] || 0), 0);
    const cnt = (rows, f) => rows.reduce((s, r) => s + parseInt(r[f]  || 0), 0);

    const valorAtual    = sum(atual,    'valor_total');
    const valorAnterior = sum(anterior, 'valor_total');
    const qtdAtual      = cnt(atual,    'qtd_vendas');
    const ticketAtual   = qtdAtual > 0 ? valorAtual / qtdAtual : 0;
    const variacao      = valorAnterior > 0
      ? ((valorAtual - valorAnterior) / valorAnterior * 100)
      : null;

    res.json({
      periodo: { dataInicio, dataFim },
      valorTotal:   parseFloat(valorAtual.toFixed(2)),
      qtdVendas:    qtdAtual,
      ticketMedio:  parseFloat(ticketAtual.toFixed(2)),
      valorAnterior:parseFloat(valorAnterior.toFixed(2)),
      variacaoPerc: variacao !== null ? parseFloat(variacao.toFixed(2)) : null,
    });
  } catch (err) {
    console.error('[planejamento/kpis]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/planejamento/top-produtos ──────────────────────────────────────
   Top produtos por faturamento no período
   Query params: empresas, periodo, secao, grupo, limit (default 10)
────────────────────────────────────────────────────────────────────────────── */
router.get('/top-produtos', async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  if (!empresaList.length) return res.status(400).json({ error: 'empresas é obrigatório' });

  const periodo = req.query.periodo || 'Mês';
  const secao   = req.query.secao   || '';
  const grupo   = req.query.grupo   || '';
  const limit   = Math.min(parseInt(req.query.limit) || 10, 50);

  const { dataInicio, dataFim } = periodoToDates(periodo);

  const secaoClause = secao && secao !== 'Todos' ? `AND spro.sprodescricao = '${secao.replace(/'/g,"''")}'` : '';
  const grupoClause = grupo && grupo !== 'Todos' ? `AND gpro.gprodescricao  = '${grupo.replace(/'/g,"''")}'` : '';

  try {
    const rows = await queryAll(empresaList,
      `SELECT
         prod.prodcodigo                                            AS codigo,
         prod.proddescricao                                        AS produto,
         COALESCE(spro.sprodescricao, 'Sem Seção')                AS secao,
         COALESCE(gpro.gprodescricao, '')                         AS grupo,
         COALESCE(SUM(vdit.vdittotal), 0)                         AS valor_total,
         COALESCE(SUM(vdit.vditqtd), 0)                           AS qtd_vendida,
         COALESCE(SUM(vdit.vdittotal),0)
           / NULLIF(COUNT(DISTINCT vda.vdacodigo),0)              AS ticket_medio
       FROM vda
       JOIN vdit ON vdit.vditcodigovda  = vda.vdacodigo
                AND vdit.vditempresa    = vda.vdaempresa
       JOIN prod ON prod.prodcodigo     = vdit.vditproduto
       LEFT JOIN spro ON spro.sprocodigo = prod.prodsecao
       LEFT JOIN gpro ON gpro.gprocodigo = prod.prodgrupo
                     AND gpro.gprosecao  = prod.prodsecao
       WHERE vda.vdaempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         AND prod.prodtipo = 2
         ${secaoClause}
         ${grupoClause}
       GROUP BY prod.prodcodigo, prod.proddescricao, spro.sprodescricao, gpro.gprodescricao
       ORDER BY valor_total DESC
       LIMIT ${limit}`,
      emp => [emp, dataInicio, dataFim]
    );

    // Agrega duplicatas entre empresas
    const byProd = {};
    rows.forEach(r => {
      const k = r.produto;
      if (!byProd[k]) byProd[k] = { ...r, valor_total: 0, qtd_vendida: 0 };
      byProd[k].valor_total  += parseFloat(r.valor_total  || 0);
      byProd[k].qtd_vendida  += parseFloat(r.qtd_vendida  || 0);
    });

    const lista = Object.values(byProd)
      .sort((a, b) => b.valor_total - a.valor_total)
      .slice(0, limit)
      .map((r, i) => ({
        rank:       i + 1,
        produto:    r.produto,
        secao:      r.secao,
        grupo:      r.grupo,
        valorTotal: parseFloat(parseFloat(r.valor_total).toFixed(2)),
        qtd:        parseFloat(parseFloat(r.qtd_vendida).toFixed(3)),
        ticket:     parseFloat(parseFloat(r.ticket_medio || 0).toFixed(2)),
      }));

    res.json({ periodo: { dataInicio, dataFim }, produtos: lista });
  } catch (err) {
    console.error('[planejamento/top-produtos]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/planejamento/por-secao ─────────────────────────────────────────
   Faturamento agrupado por seção de produto no período
   Query params: empresas, periodo, grupo
────────────────────────────────────────────────────────────────────────────── */
router.get('/por-secao', async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  if (!empresaList.length) return res.status(400).json({ error: 'empresas é obrigatório' });

  const periodo = req.query.periodo || 'Mês';
  const grupo   = req.query.grupo   || '';
  const { dataInicio, dataFim } = periodoToDates(periodo);

  const grupoClause = grupo && grupo !== 'Todos' ? `AND gpro.gprodescricao = '${grupo.replace(/'/g,"''")}'` : '';

  try {
    const rows = await queryAll(empresaList,
      `SELECT
         COALESCE(spro.sprodescricao, 'Sem Seção') AS secao,
         COALESCE(SUM(vdit.vdittotal), 0)           AS valor_total,
         COUNT(DISTINCT vda.vdacodigo)              AS qtd_vendas
       FROM vda
       JOIN vdit ON vdit.vditcodigovda  = vda.vdacodigo
                AND vdit.vditempresa    = vda.vdaempresa
       JOIN prod ON prod.prodcodigo     = vdit.vditproduto
       LEFT JOIN spro ON spro.sprocodigo = prod.prodsecao
       LEFT JOIN gpro ON gpro.gprocodigo = prod.prodgrupo
                     AND gpro.gprosecao  = prod.prodsecao
       WHERE vda.vdaempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         ${grupoClause}
       GROUP BY spro.sprodescricao
       ORDER BY valor_total DESC`,
      emp => [emp, dataInicio, dataFim]
    );

    const bySecao = {};
    rows.forEach(r => {
      const k = r.secao;
      if (!bySecao[k]) bySecao[k] = { secao: k, valor: 0, qtd: 0 };
      bySecao[k].valor += parseFloat(r.valor_total || 0);
      bySecao[k].qtd   += parseInt(r.qtd_vendas   || 0);
    });

    const total  = Object.values(bySecao).reduce((s, v) => s + v.valor, 0);
    const secoes = Object.values(bySecao)
      .sort((a, b) => b.valor - a.valor)
      .map(s => ({ ...s, valor: parseFloat(s.valor.toFixed(2)), part: total > 0 ? parseFloat((s.valor/total*100).toFixed(1)) : 0 }));

    res.json({ periodo: { dataInicio, dataFim }, secoes, total: parseFloat(total.toFixed(2)) });
  } catch (err) {
    console.error('[planejamento/por-secao]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/planejamento/heatmap ───────────────────────────────────────────
   Intensidade de vendas por dia-da-semana × hora
   Query params: empresas, periodo, secao, grupo
────────────────────────────────────────────────────────────────────────────── */
router.get('/heatmap', async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  if (!empresaList.length) return res.status(400).json({ error: 'empresas é obrigatório' });

  const periodo = req.query.periodo || 'Mês';
  const secao   = req.query.secao   || '';
  const grupo   = req.query.grupo   || '';
  const { dataInicio, dataFim } = periodoToDates(periodo);

  const secaoClause = secao && secao !== 'Todos' ? `AND spro.sprodescricao = '${secao.replace(/'/g,"''")}'` : '';
  const grupoClause = grupo && grupo !== 'Todos' ? `AND gpro.gprodescricao  = '${grupo.replace(/'/g,"''")}'` : '';

  try {
    const rows = await queryAll(empresaList,
      `SELECT
         EXTRACT(DOW  FROM vda.vdamovimento)::int AS dia_semana,
         EXTRACT(HOUR FROM vda.vdadata)::int       AS hora,
         COALESCE(SUM(vdit.vdittotal), 0)          AS valor_total
       FROM vda
       JOIN vdit ON vdit.vditcodigovda  = vda.vdacodigo
                AND vdit.vditempresa    = vda.vdaempresa
       JOIN prod ON prod.prodcodigo     = vdit.vditproduto
       LEFT JOIN spro ON spro.sprocodigo = prod.prodsecao
       LEFT JOIN gpro ON gpro.gprocodigo = prod.prodgrupo
                     AND gpro.gprosecao  = prod.prodsecao
       WHERE vda.vdaempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         AND vda.vdadata IS NOT NULL
         ${secaoClause}
         ${grupoClause}
       GROUP BY EXTRACT(DOW FROM vda.vdamovimento)::int, EXTRACT(HOUR FROM vda.vdadata)::int`,
      emp => [emp, dataInicio, dataFim]
    );

    // Monta matriz dia × hora
    const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const matrix = {};
    rows.forEach(r => {
      const k = `${r.dia_semana}_${r.hora}`;
      matrix[k] = (matrix[k] || 0) + parseFloat(r.valor_total || 0);
    });

    // Normaliza 0–100 com base no max
    const maxVal = Math.max(...Object.values(matrix), 1);
    const heatmap = DIAS.map((day, di) => ({
      day,
      vals: Array.from({ length: 24 }, (_, hora) => ({
        hora,
        label: `${String(hora).padStart(2,'0')}h`,
        v:     Math.round((matrix[`${di}_${hora}`] || 0) / maxVal * 100),
        valor: parseFloat((matrix[`${di}_${hora}`] || 0).toFixed(2)),
      })),
    }));

    res.json({ periodo: { dataInicio, dataFim }, heatmap });
  } catch (err) {
    console.error('[planejamento/heatmap]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
