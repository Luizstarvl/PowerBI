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

/* ── GET /api/planejamento/scatter ───────────────────────────────────────────
   Produtos com preço, volume e margem — para gráfico de dispersão
   Query params: empresas, periodo, secao, grupo
────────────────────────────────────────────────────────────────────────────── */
router.get('/scatter', async (req, res) => {
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
         prod.prodcodigo                                            AS codigo,
         prod.proddescricao                                        AS nome,
         COALESCE(ep.e_prodv1, 0)                                  AS preco,
         COALESCE(ep.e_prodcusto, 0)                               AS custo,
         COALESCE(SUM(vdit.vdittotal), 0)                          AS faturamento,
         COALESCE(SUM(vdit.vditqtd), 0)                            AS volume,
         COALESCE(spro.sprodescricao, 'Sem Seção')                AS cat
       FROM vda
       JOIN vdit ON vdit.vditcodigovda  = vda.vdacodigo
                AND vdit.vditempresa    = vda.vdaempresa
       JOIN prod ON prod.prodcodigo     = vdit.vditproduto
       LEFT JOIN e_prod ep ON ep.e_prodproduto = prod.prodcodigo
                          AND ep.e_prodempresa = vda.vdaempresa
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
       GROUP BY prod.prodcodigo, prod.proddescricao,
                ep.e_prodv1, ep.e_prodcusto, spro.sprodescricao
       ORDER BY faturamento DESC
       LIMIT 200`,
      emp => [emp, dataInicio, dataFim]
    );

    // Agrega duplicatas entre empresas pelo nome do produto
    const byProd = {};
    rows.forEach(r => {
      const k = r.codigo;
      if (!byProd[k]) {
        byProd[k] = {
          nome:         r.nome,
          cat:          r.cat,
          preco:        parseFloat(r.preco  || 0),
          custo:        parseFloat(r.custo  || 0),
          faturamento:  0,
          volume:       0,
        };
      }
      byProd[k].faturamento += parseFloat(r.faturamento || 0);
      byProd[k].volume      += parseFloat(r.volume      || 0);
    });

    const pontos = Object.values(byProd)
      .filter(p => p.volume > 0)
      .map(p => {
        const margem = p.preco > 0 && p.custo > 0
          ? Math.max(0, Math.min(99, (p.preco - p.custo) / p.preco * 100))
          : 0;
        return {
          name:       p.nome,
          cat:        p.cat,
          preco:      parseFloat(p.preco.toFixed(2)),
          volume:     parseFloat(p.volume.toFixed(3)),
          margem:     parseFloat(margem.toFixed(1)),
          faturamento:parseFloat(p.faturamento.toFixed(2)),
        };
      })
      .sort((a, b) => b.faturamento - a.faturamento);

    res.json({ periodo: { dataInicio, dataFim }, pontos });
  } catch (err) {
    console.error('[planejamento/scatter]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/planejamento/radar ─────────────────────────────────────────────
   Performance por seção normalizada 0-100 — atual vs anterior
   Query params: empresas, periodo, grupo
────────────────────────────────────────────────────────────────────────────── */
router.get('/radar', async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  if (!empresaList.length) return res.status(400).json({ error: 'empresas é obrigatório' });

  const periodo = req.query.periodo || 'Mês';
  const grupo   = req.query.grupo   || '';
  const { dataInicio, dataFim } = periodoToDates(periodo);

  // Período anterior de mesmo comprimento
  const dias     = Math.max(1, Math.round((new Date(dataFim) - new Date(dataInicio)) / (1000*60*60*24)));
  const antFim   = new Date(dataInicio); antFim.setDate(antFim.getDate() - 1);
  const antIni   = new Date(antFim);     antIni.setDate(antFim.getDate() - dias + 1);
  const dataAntInicio = formatDate(antIni);
  const dataAntFim    = formatDate(antFim);

  const grupoClause = grupo && grupo !== 'Todos' ? `AND gpro.gprodescricao = '${grupo.replace(/'/g,"''")}'` : '';

  const sqlSecao = (di, df) => `
    SELECT
      COALESCE(spro.sprodescricao, 'Sem Seção') AS secao,
      COALESCE(SUM(vdit.vdittotal), 0)           AS valor_total
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
      AND prod.prodtipo = 2
      ${grupoClause}
    GROUP BY spro.sprodescricao
    ORDER BY valor_total DESC
    LIMIT 8`;

  try {
    const [rowsAtual, rowsAnt] = await Promise.all([
      queryAll(empresaList, sqlSecao(dataInicio, dataFim),     emp => [emp]),
      queryAll(empresaList, sqlSecao(dataAntInicio, dataAntFim), emp => [emp]),
    ]);

    // Agrega por seção
    const agg = (rows) => {
      const m = {};
      rows.forEach(r => {
        const k = r.secao;
        m[k] = (m[k] || 0) + parseFloat(r.valor_total || 0);
      });
      return m;
    };

    const atual   = agg(rowsAtual);
    const anterior = agg(rowsAnt);

    // Une todas as seções (pode haver no anterior que sumiu no atual)
    const secoes = [...new Set([...Object.keys(atual), ...Object.keys(anterior)])]
      .slice(0, 8);

    // Normaliza 0-100 dentro de cada período
    const maxAtual = Math.max(...secoes.map(s => atual[s] || 0), 1);
    const maxAnt   = Math.max(...secoes.map(s => anterior[s] || 0), 1);

    const dados = secoes.map(s => ({
      cat:      s,
      atual:    parseFloat(((atual[s]    || 0) / maxAtual * 100).toFixed(1)),
      anterior: parseFloat(((anterior[s] || 0) / maxAnt   * 100).toFixed(1)),
      valorAtual:    parseFloat((atual[s]    || 0).toFixed(2)),
      valorAnterior: parseFloat((anterior[s] || 0).toFixed(2)),
    }));

    res.json({ periodo: { dataInicio, dataFim, dataAntInicio, dataAntFim }, dados });
  } catch (err) {
    console.error('[planejamento/radar]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/planejamento/waterfall ─────────────────────────────────────────
   Variação de faturamento por seção: período atual vs anterior
   Formato de saída: { name, base, val, tipo } compatível com Recharts
   Query params: empresas, periodo, grupo
────────────────────────────────────────────────────────────────────────────── */
router.get('/waterfall', async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  if (!empresaList.length) return res.status(400).json({ error: 'empresas é obrigatório' });

  const periodo = req.query.periodo || 'Mês';
  const grupo   = req.query.grupo   || '';
  const { dataInicio, dataFim } = periodoToDates(periodo);

  // Período anterior de mesmo comprimento
  const dias     = Math.max(1, Math.round((new Date(dataFim) - new Date(dataInicio)) / (1000*60*60*24)));
  const antFim   = new Date(dataInicio); antFim.setDate(antFim.getDate() - 1);
  const antIni   = new Date(antFim);     antIni.setDate(antFim.getDate() - dias + 1);
  const dataAntInicio = formatDate(antIni);
  const dataAntFim    = formatDate(antFim);

  const grupoClause = grupo && grupo !== 'Todos' ? `AND gpro.gprodescricao = '${grupo.replace(/'/g,"''")}'` : '';

  const sqlSecao = (di, df) => `
    SELECT
      COALESCE(spro.sprodescricao, 'Sem Seção') AS secao,
      COALESCE(SUM(vdit.vdittotal), 0)           AS valor_total
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
      AND prod.prodtipo = 2
      ${grupoClause}
    GROUP BY spro.sprodescricao
    ORDER BY valor_total DESC`;

  try {
    const [rowsAtual, rowsAnt] = await Promise.all([
      queryAll(empresaList, sqlSecao(dataInicio, dataFim),       emp => [emp]),
      queryAll(empresaList, sqlSecao(dataAntInicio, dataAntFim), emp => [emp]),
    ]);

    const agg = (rows) => {
      const m = {};
      rows.forEach(r => {
        const k = r.secao;
        m[k] = (m[k] || 0) + parseFloat(r.valor_total || 0);
      });
      return m;
    };

    const atual    = agg(rowsAtual);
    const anterior = agg(rowsAnt);

    // Todas as seções presentes em pelo menos um período
    const secoes = [...new Set([...Object.keys(atual), ...Object.keys(anterior)])]
      .sort((a, b) => (atual[b] || 0) - (atual[a] || 0))
      .slice(0, 10);

    const totalAnt = secoes.reduce((s, k) => s + (anterior[k] || 0), 0);
    const totalAtu = secoes.reduce((s, k) => s + (atual[k]    || 0), 0);

    // Constrói barras Waterfall: base = período anterior, variação positiva ou negativa
    let runningBase = 0;
    const barras = [];

    // Ponto inicial: total período anterior
    barras.push({ name: 'Período Anterior', base: 0, val: parseFloat(totalAnt.toFixed(2)), tipo: 'total' });
    runningBase = totalAnt;

    secoes.forEach(secao => {
      const ant = anterior[secao] || 0;
      const atu = atual[secao]    || 0;
      const diff = atu - ant;
      if (Math.abs(diff) < 0.01) return; // ignora variação nula
      const tipo = diff > 0 ? 'positivo' : 'negativo';
      barras.push({
        name:  secao.length > 18 ? secao.slice(0, 17) + '…' : secao,
        base:  parseFloat(runningBase.toFixed(2)),
        val:   parseFloat(Math.abs(diff).toFixed(2)),
        diff:  parseFloat(diff.toFixed(2)),
        tipo,
        valorAtual:    parseFloat(atu.toFixed(2)),
        valorAnterior: parseFloat(ant.toFixed(2)),
      });
      runningBase += diff;
    });

    // Ponto final: total atual
    barras.push({ name: 'Período Atual', base: 0, val: parseFloat(totalAtu.toFixed(2)), tipo: 'total' });

    const variacao = totalAnt > 0 ? ((totalAtu - totalAnt) / totalAnt * 100) : null;

    res.json({
      periodo: { dataInicio, dataFim, dataAntInicio, dataAntFim },
      totalAtual:    parseFloat(totalAtu.toFixed(2)),
      totalAnterior: parseFloat(totalAnt.toFixed(2)),
      variacaoPerc:  variacao !== null ? parseFloat(variacao.toFixed(2)) : null,
      barras,
    });
  } catch (err) {
    console.error('[planejamento/waterfall]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════════════════════════
   METAS COMERCIAIS
   Armazena metas mensais (faturamento, qtd, ticket) e metas por seção no
   banco principal (Railway). Os dados reais vêm dos bancos dos clientes.
══════════════════════════════════════════════════════════════════════════════ */

async function ensureMetasTables(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mc_metas (
      mc_id           SERIAL PRIMARY KEY,
      mc_empresa      INTEGER      NOT NULL,
      mc_mes          VARCHAR(7)   NOT NULL,
      mc_faturamento  NUMERIC(15,2),
      mc_quantidade   INTEGER,
      mc_ticket_medio NUMERIC(15,2),
      mc_criado_em    TIMESTAMPTZ  DEFAULT NOW(),
      mc_atualizado_em TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(mc_empresa, mc_mes)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mc_metas_secao (
      mcs_id          SERIAL PRIMARY KEY,
      mcs_empresa     INTEGER      NOT NULL,
      mcs_mes         VARCHAR(7)   NOT NULL,
      mcs_secao       VARCHAR(200) NOT NULL,
      mcs_faturamento NUMERIC(15,2),
      mcs_criado_em   TIMESTAMPTZ  DEFAULT NOW(),
      UNIQUE(mcs_empresa, mcs_mes, mcs_secao)
    )
  `);
}

/* ── GET /api/planejamento/metas ─────────────────────────────────────────────
   Retorna metas + realizado para empresa e mês.
   Query params: empresa, mes (YYYY-MM, default = mês atual)
────────────────────────────────────────────────────────────────────────────── */
router.get('/metas', async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  if (!empresaList.length) return res.status(400).json({ error: 'empresa é obrigatório' });
  const empresa = empresaList[0];

  const hoje  = new Date();
  const mesParam = req.query.mes
    || `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;

  const [ano, mes] = mesParam.split('-').map(Number);
  const dataInicio = `${ano}-${String(mes).padStart(2,'0')}-01`;
  const ultimoDia  = new Date(ano, mes, 0);
  const dataFimMes = formatDate(ultimoDia);
  const dataHoje   = formatDate(hoje);
  const dataFim    = dataHoje < dataFimMes ? dataHoje : dataFimMes;

  const { mainPool } = require('../db/poolManager');
  try {
    await ensureMetasTables(mainPool);

    // Metas salvas
    const { rows: metaRows } = await mainPool.query(
      `SELECT mc_faturamento, mc_quantidade, mc_ticket_medio
       FROM mc_metas WHERE mc_empresa = $1 AND mc_mes = $2`,
      [empresa, mesParam]
    );
    const metaRow = metaRows[0] || {};

    const { rows: secaoRows } = await mainPool.query(
      `SELECT mcs_id, mcs_secao, mcs_faturamento
       FROM mc_metas_secao WHERE mcs_empresa = $1 AND mcs_mes = $2
       ORDER BY mcs_faturamento DESC NULLS LAST`,
      [empresa, mesParam]
    );

    // Realizado (banco do cliente)
    const q = queryFor(empresa);

    const { rows: totRows } = await q(
      `SELECT COALESCE(SUM(vdit.vdittotal),0)                                        AS faturamento,
              COUNT(DISTINCT vda.vdacodigo)::int                                      AS quantidade,
              COALESCE(SUM(vdit.vdittotal)/NULLIF(COUNT(DISTINCT vda.vdacodigo),0),0) AS ticket_medio
       FROM vda
       JOIN vdit ON vdit.vditcodigovda = vda.vdacodigo
                AND vdit.vditempresa   = vda.vdaempresa
       WHERE vda.vdaempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)`,
      [empresa, dataInicio, dataFim]
    );
    const real = totRows[0] || {};

    // Evolução diária acumulada
    const { rows: dayRows } = await q(
      `SELECT TO_CHAR(vda.vdamovimento,'YYYY-MM-DD') AS dia,
              COALESCE(SUM(vdit.vdittotal),0)         AS valor
       FROM vda
       JOIN vdit ON vdit.vditcodigovda = vda.vdacodigo
                AND vdit.vditempresa   = vda.vdaempresa
       WHERE vda.vdaempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
       GROUP BY vda.vdamovimento
       ORDER BY dia`,
      [empresa, dataInicio, dataFim]
    );

    const diasNoMes    = ultimoDia.getDate();
    const diasPassados = Math.min(diasNoMes,
      Math.max(1, Math.round((new Date(dataFim) - new Date(dataInicio)) / (1000*60*60*24)) + 1)
    );

    const byDia = {};
    dayRows.forEach(r => { byDia[r.dia] = parseFloat(r.valor || 0); });

    let acum = 0;
    const metaFat = metaRow.mc_faturamento ? parseFloat(metaRow.mc_faturamento) : null;
    const progressoDiario = [];
    for (let d = 1; d <= diasPassados; d++) {
      const key = `${ano}-${String(mes).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      acum += byDia[key] || 0;
      progressoDiario.push({
        dia:            d,
        realizado:      parseFloat(acum.toFixed(2)),
        metaProporcional: metaFat ? parseFloat((metaFat * d / diasNoMes).toFixed(2)) : null,
      });
    }

    // Realizado por seção
    const { rows: secActRows } = await q(
      `SELECT COALESCE(spro.sprodescricao,'Sem Seção') AS secao,
              COALESCE(SUM(vdit.vdittotal),0)           AS valor
       FROM vda
       JOIN vdit ON vdit.vditcodigovda = vda.vdacodigo
                AND vdit.vditempresa   = vda.vdaempresa
       JOIN prod ON prod.prodcodigo    = vdit.vditproduto
       LEFT JOIN spro ON spro.sprocodigo = prod.prodsecao
       WHERE vda.vdaempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
       GROUP BY spro.sprodescricao
       ORDER BY valor DESC`,
      [empresa, dataInicio, dataFim]
    );

    const secaoActual = {};
    secActRows.forEach(r => { secaoActual[r.secao] = parseFloat(r.valor || 0); });

    const metasSecao = secaoRows.map(s => {
      const realSec  = secaoActual[s.mcs_secao] || 0;
      const metaSec  = parseFloat(s.mcs_faturamento || 0);
      return {
        id:        s.mcs_id,
        secao:     s.mcs_secao,
        meta:      metaSec,
        realizado: realSec,
        progresso: metaSec > 0 ? parseFloat((realSec / metaSec * 100).toFixed(1)) : null,
      };
    });

    res.json({
      mes: mesParam,
      periodo: { dataInicio, dataFim },
      diasNoMes,
      diasPassados,
      meta: {
        faturamento: metaRow.mc_faturamento  != null ? parseFloat(metaRow.mc_faturamento)  : null,
        quantidade:  metaRow.mc_quantidade   != null ? parseInt(metaRow.mc_quantidade)      : null,
        ticketMedio: metaRow.mc_ticket_medio != null ? parseFloat(metaRow.mc_ticket_medio)  : null,
      },
      realizado: {
        faturamento: parseFloat(real.faturamento   || 0),
        quantidade:  parseInt(real.quantidade      || 0),
        ticketMedio: parseFloat(real.ticket_medio  || 0),
      },
      progressoDiario,
      metasSecao,
      secoesDisponiveis: Object.keys(secaoActual).sort(),
    });
  } catch (err) {
    console.error('[planejamento/metas GET]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/planejamento/metas ────────────────────────────────────────────
   Cria ou atualiza metas mensais.
   Body: { empresa, mes, faturamento, quantidade, ticketMedio }
────────────────────────────────────────────────────────────────────────────── */
router.post('/metas', async (req, res) => {
  const { empresa, mes, faturamento, quantidade, ticketMedio } = req.body || {};
  if (!empresa || !mes) return res.status(400).json({ error: 'empresa e mes são obrigatórios' });

  const { mainPool } = require('../db/poolManager');
  try {
    await ensureMetasTables(mainPool);
    await mainPool.query(`
      INSERT INTO mc_metas
        (mc_empresa, mc_mes, mc_faturamento, mc_quantidade, mc_ticket_medio, mc_atualizado_em)
      VALUES ($1,$2,$3,$4,$5,NOW())
      ON CONFLICT (mc_empresa, mc_mes) DO UPDATE SET
        mc_faturamento   = EXCLUDED.mc_faturamento,
        mc_quantidade    = EXCLUDED.mc_quantidade,
        mc_ticket_medio  = EXCLUDED.mc_ticket_medio,
        mc_atualizado_em = NOW()
    `, [empresa, mes, faturamento || null, quantidade || null, ticketMedio || null]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[planejamento/metas POST]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/planejamento/metas/secao ──────────────────────────────────────
   Cria ou atualiza meta de uma seção.
   Body: { empresa, mes, secao, faturamento }
────────────────────────────────────────────────────────────────────────────── */
router.post('/metas/secao', async (req, res) => {
  const { empresa, mes, secao, faturamento } = req.body || {};
  if (!empresa || !mes || !secao) return res.status(400).json({ error: 'empresa, mes e secao são obrigatórios' });

  const { mainPool } = require('../db/poolManager');
  try {
    await ensureMetasTables(mainPool);
    await mainPool.query(`
      INSERT INTO mc_metas_secao (mcs_empresa, mcs_mes, mcs_secao, mcs_faturamento)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (mcs_empresa, mcs_mes, mcs_secao) DO UPDATE SET
        mcs_faturamento = EXCLUDED.mcs_faturamento
    `, [empresa, mes, secao, faturamento || null]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[planejamento/metas/secao POST]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── DELETE /api/planejamento/metas/secao/:id ────────────────────────────────
   Remove meta de seção pelo ID.
────────────────────────────────────────────────────────────────────────────── */
router.delete('/metas/secao/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });

  const { mainPool } = require('../db/poolManager');
  try {
    await mainPool.query('DELETE FROM mc_metas_secao WHERE mcs_id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[planejamento/metas/secao DELETE]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/planejamento/metas/sugestao ────────────────────────────────────
   Sugere metas baseadas na média dos últimos 3 meses + 5%.
   Query params: empresa, mes (mês alvo YYYY-MM)
────────────────────────────────────────────────────────────────────────────── */
router.get('/metas/sugestao', async (req, res) => {
  const empresaList = parseEmpresas(req.query);
  if (!empresaList.length) return res.status(400).json({ error: 'empresa é obrigatório' });
  const empresa = empresaList[0];

  const hoje     = new Date();
  const mesParam = req.query.mes
    || `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;
  const [ano, mes] = mesParam.split('-').map(Number);

  // 3 meses antes do mês alvo
  const mesInicio  = new Date(ano, mes - 4, 1);
  const dataInicio = formatDate(mesInicio);
  const dataFim    = formatDate(new Date(ano, mes - 1, 0));

  try {
    const q = queryFor(empresa);
    const { rows } = await q(
      `SELECT TO_CHAR(DATE_TRUNC('month',vda.vdamovimento),'YYYY-MM') AS mes,
              COALESCE(SUM(vdit.vdittotal),0)      AS faturamento,
              COUNT(DISTINCT vda.vdacodigo)::int    AS quantidade
       FROM vda
       JOIN vdit ON vdit.vditcodigovda = vda.vdacodigo
                AND vdit.vditempresa   = vda.vdaempresa
       WHERE vda.vdaempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
       GROUP BY DATE_TRUNC('month',vda.vdamovimento)
       ORDER BY mes DESC
       LIMIT 3`,
      [empresa, dataInicio, dataFim]
    );

    if (!rows.length) return res.json({ sugestao: null, motivo: 'Sem dados históricos' });

    const avgFat = rows.reduce((s, r) => s + parseFloat(r.faturamento || 0), 0) / rows.length;
    const avgQtd = rows.reduce((s, r) => s + parseInt(r.quantidade    || 0), 0) / rows.length;
    const crescimento = 5;

    res.json({
      sugestao: {
        faturamento: parseFloat((avgFat * (1 + crescimento/100)).toFixed(2)),
        quantidade:  Math.round(avgQtd * (1 + crescimento/100)),
        ticketMedio: avgQtd > 0 ? parseFloat((avgFat / avgQtd).toFixed(2)) : null,
      },
      historico: rows.map(r => ({
        mes:         r.mes,
        faturamento: parseFloat(r.faturamento),
        quantidade:  parseInt(r.quantidade),
      })),
      crescimento,
    });
  } catch (err) {
    console.error('[planejamento/metas/sugestao]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/planejamento/reload-pools ─────────────────────────────────────
   Força recarregar todos os pools sem reiniciar o servidor.
   Útil após cadastrar uma nova conexão no gerenciador de conexões.
────────────────────────────────────────────────────────────────────────────── */
router.post('/reload-pools', async (req, res) => {
  try {
    const { loadConnections } = require('../db/poolManager');
    const total = await loadConnections();
    res.json({ ok: true, pools: total, msg: `${total} conexão(ões) recarregada(s)` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ── GET /api/planejamento/debug ─────────────────────────────────────────────
   Diagnóstico: mostra datas mín/máx de vda, data do servidor e empresas registradas
   Query params: empresas
────────────────────────────────────────────────────────────────────────────── */
router.get('/debug', async (req, res) => {
  const { isEmpresaRegistered, mainPool, registerClient } = require('../db/poolManager');
  const empresaList = parseEmpresas(req.query);
  const serverDate = formatDate(new Date());

  // Verifica starvl_clients
  let clientes = [];
  try {
    const r = await mainPool.query('SELECT sc_codigo, sc_banco, sc_host FROM starvl_clients ORDER BY sc_codigo');
    clientes = r.rows;
  } catch (e) {
    clientes = [{ erro: e.message }];
  }

  // Verifica se mainPool tem vda
  let mainPoolTemVda = false;
  try {
    await mainPool.query("SELECT 1 FROM vda LIMIT 1");
    mainPoolTemVda = true;
  } catch (_) {}

  const results = {};
  await Promise.allSettled(
    (empresaList.length ? empresaList : []).map(async emp => {
      const registrado = isEmpresaRegistered(emp);
      try {
        const q = queryFor(emp);
        const r = await q(
          `SELECT MIN(vda.vdamovimento)::text AS data_min,
                  MAX(vda.vdamovimento)::text AS data_max,
                  COUNT(*)::int              AS total_vendas
           FROM vda WHERE vda.vdaempresa = $1`,
          [emp]
        );
        results[emp] = { registrado, ...r.rows[0] };
      } catch (err) {
        results[emp] = { registrado, erro: err.message };
      }
    })
  );

  // Lista todos os databases no servidor (mesmo host do mainPool)
  let databases = [];
  let dbComVda   = [];
  try {
    const r = await mainPool.query(
      `SELECT datname FROM pg_catalog.pg_database WHERE datistemplate = false ORDER BY datname`
    );
    databases = r.rows.map(row => row.datname);

    // Tenta cada database para ver qual tem vda
    const { Pool } = require('pg');
    await Promise.allSettled(databases.map(async dbName => {
      let pool;
      try {
        if (process.env.DATABASE_URL) {
          const url = new URL(process.env.DATABASE_URL);
          url.pathname = '/' + dbName;
          pool = new Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false }, max: 1, connectionTimeoutMillis: 3000 });
        } else {
          pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT || 5432, database: dbName, user: process.env.DB_USER, password: process.env.DB_PASSWORD, max: 1, connectionTimeoutMillis: 3000 });
        }
        await pool.query("SELECT 1 FROM vda LIMIT 1");
        dbComVda.push(dbName);
      } catch (_) {} finally {
        if (pool) pool.end().catch(() => {});
      }
    }));
  } catch (e) {
    databases = [{ erro: e.message }];
  }

  res.json({ serverDate, mainPoolTemVda, clientes, databases, dbComVda, empresas: results });
});

/* ═══════════════════════════════════════════════════════════════════════════
   PERFORMANCE DE VENDAS
   GET /api/planejamento/performance
   Query params: empresa, periodo (Hoje|Semana|Mês|Ano), limit (default 10)
   Returns: { rankings: { produtos, secoes, fornecedores }, comparativo }
═══════════════════════════════════════════════════════════════════════════ */
router.get('/performance', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório' });

  const periodo = req.query.periodo || 'Mês';
  const limit   = Math.min(parseInt(req.query.limit) || 10, 50);

  const { dataInicio, dataFim } = periodoToDates(periodo);

  // Período anterior de mesmo comprimento para comparativo
  const dias    = Math.max(1, Math.round((new Date(dataFim) - new Date(dataInicio)) / 86400000));
  const antFim  = new Date(dataInicio); antFim.setDate(antFim.getDate() - 1);
  const antIni  = new Date(antFim);     antIni.setDate(antFim.getDate() - dias + 1);
  const antInicio = formatDate(antIni);
  const antFimFmt = formatDate(antFim);

  const query = queryFor(empresa);

  try {
    const [
      produtosRows,
      secoesRows,
      fornecedoresRows,
      atualRows,
      anteriorRows,
      comparMesesRows,
    ] = await Promise.all([

      /* ── Top produtos ──────────────────────────────────────── */
      query(
        `SELECT
           prod.prodcodigo                                     AS codigo,
           prod.prodresumo                                     AS nome,
           COALESCE(spro.sprodescricao, 'Sem seção')          AS secao,
           COALESCE(SUM(vdit.vdittotal), 0)                   AS faturamento,
           COALESCE(SUM(vdit.vditqtd), 0)              AS quantidade,
           COALESCE(SUM(vdit.vdittotal), 0)
             / NULLIF(SUM(vdit.vditqtd), 0)            AS preco_medio
         FROM vdit
         JOIN vda  ON vda.vdacodigo   = vdit.vditcodigovda
                  AND vda.vdaempresa  = vdit.vditempresa
         JOIN prod ON prod.prodcodigo = vdit.vditproduto
         LEFT JOIN spro ON spro.sprocodigo = prod.prodsecao
         WHERE vdit.vditempresa = $1
           AND vda.vdamovimento >= $2
           AND vda.vdamovimento <= $3
           AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         GROUP BY prod.prodcodigo, prod.prodresumo, spro.sprodescricao
         ORDER BY faturamento DESC
         LIMIT $4`,
        [empresa, dataInicio, dataFim, limit]
      ),

      /* ── Top seções ────────────────────────────────────────── */
      query(
        `SELECT
           COALESCE(spro.sprodescricao, 'Sem seção')  AS secao,
           COALESCE(SUM(vdit.vdittotal), 0)           AS faturamento,
           COUNT(DISTINCT vda.vdacodigo)              AS qtd_vendas,
           COALESCE(SUM(vdit.vditqtd), 0)      AS quantidade
         FROM vdit
         JOIN vda  ON vda.vdacodigo   = vdit.vditcodigovda
                  AND vda.vdaempresa  = vdit.vditempresa
         JOIN prod ON prod.prodcodigo = vdit.vditproduto
         LEFT JOIN spro ON spro.sprocodigo = prod.prodsecao
         WHERE vdit.vditempresa = $1
           AND vda.vdamovimento >= $2
           AND vda.vdamovimento <= $3
           AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         GROUP BY spro.sprodescricao
         ORDER BY faturamento DESC
         LIMIT $4`,
        [empresa, dataInicio, dataFim, limit]
      ),

      /* ── Top fornecedores (por compras) ────────────────────── */
      query(
        `SELECT
           COALESCE(part.partrazao, 'Sem fornecedor')  AS fornecedor,
           COALESCE(SUM(entcpi.entcpitotal), 0)        AS total_compras,
           COALESCE(SUM(entcpi.entcpiqtd), 0)          AS quantidade,
           COUNT(DISTINCT entcpa.entcpacodigo)          AS qtd_notas
         FROM entcpa
         JOIN entcpi ON entcpi.entcpicompra  = entcpa.entcpacodigo
                    AND entcpi.entcpiempresa = entcpa.entcpaempresa
         LEFT JOIN part ON part.partcodigo = entcpa.entcpafornecedor
         WHERE entcpa.entcpaempresa = $1
           AND DATE(entcpa.entcpachegada) >= $2
           AND DATE(entcpa.entcpachegada) <= $3
         GROUP BY part.partrazao
         ORDER BY total_compras DESC
         LIMIT $4`,
        [empresa, dataInicio, dataFim, limit]
      ),

      /* ── KPIs período atual ─────────────────────────────────── */
      query(
        `SELECT
           COALESCE(SUM(vdit.vdittotal), 0)                        AS faturamento,
           COUNT(DISTINCT vda.vdacodigo)                           AS qtd_vendas,
           COALESCE(SUM(vdit.vdittotal), 0)
             / NULLIF(COUNT(DISTINCT vda.vdacodigo), 0)            AS ticket_medio,
           COUNT(DISTINCT vdit.vditproduto)                        AS produtos_ativos
         FROM vda
         JOIN vdit ON vdit.vditcodigovda = vda.vdacodigo
                  AND vdit.vditempresa   = vda.vdaempresa
         WHERE vda.vdaempresa = $1
           AND vda.vdamovimento >= $2
           AND vda.vdamovimento <= $3
           AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)`,
        [empresa, dataInicio, dataFim]
      ),

      /* ── KPIs período anterior ──────────────────────────────── */
      query(
        `SELECT
           COALESCE(SUM(vdit.vdittotal), 0)                        AS faturamento,
           COUNT(DISTINCT vda.vdacodigo)                           AS qtd_vendas,
           COALESCE(SUM(vdit.vdittotal), 0)
             / NULLIF(COUNT(DISTINCT vda.vdacodigo), 0)            AS ticket_medio
         FROM vda
         JOIN vdit ON vdit.vditcodigovda = vda.vdacodigo
                  AND vdit.vditempresa   = vda.vdaempresa
         WHERE vda.vdaempresa = $1
           AND vda.vdamovimento >= $2
           AND vda.vdamovimento <= $3
           AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)`,
        [empresa, antInicio, antFimFmt]
      ),

      /* ── Comparativo últimos 6 meses ────────────────────────── */
      query(
        `SELECT
           TO_CHAR(DATE_TRUNC('month', vda.vdamovimento), 'YYYY-MM') AS mes,
           COALESCE(SUM(vdit.vdittotal), 0)                          AS faturamento,
           COUNT(DISTINCT vda.vdacodigo)                             AS qtd_vendas
         FROM vda
         JOIN vdit ON vdit.vditcodigovda = vda.vdacodigo
                  AND vdit.vditempresa   = vda.vdaempresa
         WHERE vda.vdaempresa = $1
           AND vda.vdamovimento >= (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months')
           AND vda.vdamovimento <= CURRENT_DATE
           AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         GROUP BY DATE_TRUNC('month', vda.vdamovimento)
         ORDER BY mes`,
        [empresa]
      ),
    ]);

    const atual    = atualRows.rows[0]    || {};
    const anterior = anteriorRows.rows[0] || {};

    function delta(a, b) {
      const av = parseFloat(a || 0), bv = parseFloat(b || 0);
      if (bv === 0) return null;
      return parseFloat(((av - bv) / bv * 100).toFixed(1));
    }

    const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

    res.json({
      periodo: { dataInicio, dataFim, label: periodo },
      kpis: {
        faturamento:    parseFloat(atual.faturamento   || 0),
        qtdVendas:      parseInt(atual.qtd_vendas      || 0),
        ticketMedio:    parseFloat(atual.ticket_medio  || 0),
        produtosAtivos: parseInt(atual.produtos_ativos || 0),
        deltaFaturamento: delta(atual.faturamento,  anterior.faturamento),
        deltaQtd:         delta(atual.qtd_vendas,   anterior.qtd_vendas),
        deltaTicket:      delta(atual.ticket_medio, anterior.ticket_medio),
      },
      rankings: {
        produtos: produtosRows.rows.map(r => ({
          nome:       r.nome,
          secao:      r.secao,
          faturamento: parseFloat(r.faturamento || 0),
          quantidade:  parseFloat(r.quantidade  || 0),
          precoMedio:  parseFloat(r.preco_medio || 0),
        })),
        secoes: secoesRows.rows.map(r => ({
          nome:        r.secao,
          faturamento: parseFloat(r.faturamento || 0),
          qtdVendas:   parseInt(r.qtd_vendas    || 0),
          quantidade:  parseFloat(r.quantidade  || 0),
        })),
        fornecedores: fornecedoresRows.rows.map(r => ({
          nome:         r.fornecedor,
          totalCompras: parseFloat(r.total_compras || 0),
          quantidade:   parseFloat(r.quantidade    || 0),
          qtdNotas:     parseInt(r.qtd_notas       || 0),
        })),
      },
      comparativo: comparMesesRows.rows.map(r => {
        const [ano, m] = r.mes.split('-').map(Number);
        return {
          mes:         MESES_ABREV[m - 1] + '/' + String(ano).slice(2),
          mesKey:      r.mes,
          faturamento: parseFloat(r.faturamento || 0),
          qtdVendas:   parseInt(r.qtd_vendas    || 0),
        };
      }),
    });
  } catch (err) {
    console.error('[planejamento/performance]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   ANÁLISE DE MARGEM E MARKUP
   GET /api/planejamento/margem
   Query params: empresa, periodo (Hoje|Semana|Mês|Ano), margemMinima (default 20)
═══════════════════════════════════════════════════════════════════════════ */
router.get('/margem', async (req, res) => {
  const empresa      = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório' });

  const periodo      = req.query.periodo      || 'Mês';
  const margemMinima = parseFloat(req.query.margemMinima) || 20;

  const { dataInicio, dataFim } = periodoToDates(periodo);

  // Período anterior de mesmo comprimento
  const dias   = Math.max(1, Math.round((new Date(dataFim) - new Date(dataInicio)) / 86400000));
  const antFim = new Date(dataInicio); antFim.setDate(antFim.getDate() - 1);
  const antIni = new Date(antFim);     antIni.setDate(antFim.getDate() - dias + 1);
  const antInicio = formatDate(antIni);
  const antFimFmt = formatDate(antFim);

  const query = queryFor(empresa);

  // SQL base: vende por produto com custo de e_prod
  const sqlProdutos = (di, df) => `
    SELECT
      prod.prodcodigo                                                     AS codigo,
      prod.prodresumo                                                     AS produto,
      COALESCE(spro.sprodescricao, 'Sem Categoria')                      AS categoria,
      COALESCE(gpro.gprodescricao, 'Sem Grupo')                          AS grupo,
      COALESCE(part.partrazao, 'Sem Fornecedor')                         AS fornecedor,
      COALESCE(ep.e_prodv1, 0)                                           AS preco_atual,
      COALESCE(ep.e_prodcusto, 0)                                        AS custo_atual,
      COALESCE(SUM(vdit.vdittotal), 0)                                   AS receita,
      COALESCE(SUM(vdit.vditqtd), 0)                                     AS quantidade,
      COALESCE(SUM(vdit.vdittotal) / NULLIF(SUM(vdit.vditqtd), 0), 0)   AS preco_medio_venda,
      COALESCE(ep.e_prodcusto, 0)                                        AS custo_medio,
      COALESCE(
        SUM(vdit.vdittotal) - SUM(vdit.vditqtd) * COALESCE(ep.e_prodcusto, 0),
        0
      )                                                                   AS lucro,
      CASE
        WHEN SUM(vdit.vdittotal) > 0 AND ep.e_prodcusto IS NOT NULL
        THEN (SUM(vdit.vdittotal) - SUM(vdit.vditqtd) * ep.e_prodcusto)
              / NULLIF(SUM(vdit.vdittotal), 0) * 100
        ELSE NULL
      END                                                                 AS margem,
      CASE
        WHEN ep.e_prodcusto > 0 AND SUM(vdit.vdittotal) > 0
        THEN (SUM(vdit.vdittotal) - SUM(vdit.vditqtd) * ep.e_prodcusto)
              / NULLIF(SUM(vdit.vditqtd) * ep.e_prodcusto, 0) * 100
        ELSE NULL
      END                                                                 AS markup
    FROM vdit
    JOIN vda  ON vda.vdacodigo  = vdit.vditcodigovda
             AND vda.vdaempresa = vdit.vditempresa
    JOIN prod ON prod.prodcodigo = vdit.vditproduto
    LEFT JOIN e_prod ep  ON ep.e_prodproduto = prod.prodcodigo
                        AND ep.e_prodempresa  = vdit.vditempresa
    LEFT JOIN spro ON spro.sprocodigo = prod.prodsecao
    LEFT JOIN gpro ON gpro.gprocodigo = prod.prodgrupo
                  AND gpro.gprosecao  = prod.prodsecao
    LEFT JOIN part ON part.partcodigo = prod.prodfornecedor
    WHERE vdit.vditempresa = $1
      AND vda.vdamovimento >= '${di}'
      AND vda.vdamovimento <= '${df}'
      AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
    GROUP BY
      prod.prodcodigo, prod.prodresumo,
      spro.sprodescricao, gpro.gprodescricao, part.partrazao,
      ep.e_prodv1, ep.e_prodcusto
    ORDER BY lucro DESC`;

  const sqlEvolucao = `
    SELECT
      TO_CHAR(DATE_TRUNC('month', vda.vdamovimento), 'YYYY-MM') AS mes,
      COALESCE(SUM(vdit.vdittotal), 0)                           AS receita,
      COALESCE(SUM(vdit.vditqtd * COALESCE(ep.e_prodcusto, 0)), 0) AS custo_total,
      COALESCE(SUM(vdit.vdittotal) - SUM(vdit.vditqtd * COALESCE(ep.e_prodcusto, 0)), 0) AS lucro
    FROM vdit
    JOIN vda  ON vda.vdacodigo  = vdit.vditcodigovda
             AND vda.vdaempresa = vdit.vditempresa
    JOIN prod ON prod.prodcodigo = vdit.vditproduto
    LEFT JOIN e_prod ep ON ep.e_prodproduto = prod.prodcodigo
                       AND ep.e_prodempresa  = vdit.vditempresa
    WHERE vdit.vditempresa = $1
      AND vda.vdamovimento >= (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months')
      AND vda.vdamovimento <= CURRENT_DATE
      AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
    GROUP BY DATE_TRUNC('month', vda.vdamovimento)
    ORDER BY mes`;

  try {
    const [prodAtual, prodAnt, evolRows] = await Promise.all([
      query(sqlProdutos(dataInicio, dataFim),   [empresa]),
      query(sqlProdutos(antInicio, antFimFmt),  [empresa]),
      query(sqlEvolucao, [empresa]),
    ]);

    const rows    = prodAtual.rows;
    const rowsAnt = prodAnt.rows;

    // ── KPIs agregados ───────────────────────────────────────────
    const receitaTotal = rows.reduce((s, r) => s + parseFloat(r.receita || 0), 0);
    const custoTotal   = rows.reduce((s, r) => s + parseFloat(r.custo_medio || 0) * parseFloat(r.quantidade || 0), 0);
    const lucroTotal   = receitaTotal - custoTotal;
    const margemMedia  = receitaTotal > 0 ? lucroTotal / receitaTotal * 100 : 0;
    const markupMedio  = custoTotal   > 0 ? lucroTotal / custoTotal   * 100 : 0;
    const abaixoMin    = rows.filter(r => r.margem != null && parseFloat(r.margem) < margemMinima).length;

    // Período anterior
    const recAnt  = rowsAnt.reduce((s, r) => s + parseFloat(r.receita || 0), 0);
    const custAnt = rowsAnt.reduce((s, r) => s + parseFloat(r.custo_medio || 0) * parseFloat(r.quantidade || 0), 0);
    const lucAnt  = recAnt - custAnt;
    const margAnt = recAnt > 0 ? lucAnt / recAnt * 100 : 0;
    const mkpAnt  = custAnt > 0 ? lucAnt / custAnt * 100 : 0;

    function d(a, b) { return b !== 0 ? parseFloat(((a - b) / Math.abs(b) * 100).toFixed(1)) : null; }

    // ── Margem por categoria ──────────────────────────────────────
    const byCategoria = {};
    rows.forEach(r => {
      const k = r.categoria;
      if (!byCategoria[k]) byCategoria[k] = { receita: 0, custo: 0, lucro: 0 };
      byCategoria[k].receita += parseFloat(r.receita || 0);
      byCategoria[k].custo   += parseFloat(r.custo_medio || 0) * parseFloat(r.quantidade || 0);
      byCategoria[k].lucro   += parseFloat(r.lucro || 0);
    });
    const margemCategoria = Object.entries(byCategoria)
      .map(([cat, v]) => ({
        categoria: cat,
        receita:   v.receita,
        lucro:     v.lucro,
        margem:    v.receita > 0 ? v.lucro / v.receita * 100 : 0,
      }))
      .sort((a, b) => b.margem - a.margem);

    // ── Margem por grupo ──────────────────────────────────────────
    const byGrupo = {};
    rows.forEach(r => {
      const k = r.grupo;
      if (!byGrupo[k]) byGrupo[k] = { lucro: 0, receita: 0 };
      byGrupo[k].lucro   += parseFloat(r.lucro || 0);
      byGrupo[k].receita += parseFloat(r.receita || 0);
    });
    const lucroGrupo = Object.entries(byGrupo)
      .map(([grupo, v]) => ({ grupo, lucro: v.lucro, receita: v.receita }))
      .sort((a, b) => b.lucro - a.lucro);

    // ── Rankings ──────────────────────────────────────────────────
    const topLucrativos = [...rows]
      .sort((a, b) => parseFloat(b.lucro || 0) - parseFloat(a.lucro || 0))
      .slice(0, 10)
      .map(r => ({
        produto:    r.produto,
        lucro:      parseFloat(r.lucro     || 0),
        margem:     r.margem != null ? parseFloat(r.margem) : null,
        markup:     r.markup != null ? parseFloat(r.markup) : null,
        quantidade: parseFloat(r.quantidade || 0),
        receita:    parseFloat(r.receita   || 0),
      }));

    const menoresMargens = [...rows]
      .filter(r => r.margem != null && parseFloat(r.receita || 0) > 0)
      .sort((a, b) => parseFloat(a.margem) - parseFloat(b.margem))
      .slice(0, 10)
      .map(r => ({
        produto:    r.produto,
        margem:     parseFloat(r.margem),
        markup:     r.markup != null ? parseFloat(r.markup) : null,
        preco:      parseFloat(r.preco_medio_venda || 0),
        custo:      parseFloat(r.custo_medio || 0),
        diferenca:  parseFloat(r.preco_medio_venda || 0) - parseFloat(r.custo_medio || 0),
      }));

    // ── Scatter: Margem x Faturamento ────────────────────────────
    const scatter = rows
      .filter(r => r.margem != null && parseFloat(r.receita || 0) > 0)
      .map(r => ({
        produto:  r.produto,
        receita:  parseFloat(r.receita || 0),
        margem:   parseFloat(r.margem),
        lucro:    parseFloat(r.lucro   || 0),
        categoria: r.categoria,
      }));

    // ── Donut: participação no lucro por categoria ─────────────────
    const donutLucro = margemCategoria
      .filter(c => c.lucro > 0)
      .slice(0, 6)
      .map(c => ({ name: c.categoria, value: parseFloat(c.lucro.toFixed(2)) }));

    // ── Evolução mensal ───────────────────────────────────────────
    const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const evolucao = evolRows.rows.map(r => {
      const [ano, m] = r.mes.split('-').map(Number);
      const rec  = parseFloat(r.receita    || 0);
      const cust = parseFloat(r.custo_total|| 0);
      const luc  = parseFloat(r.lucro      || 0);
      return {
        mes:       MESES_ABREV[m - 1],
        mesKey:    r.mes,
        receita:   rec,
        custo:     cust,
        lucro:     luc,
        margem:    rec > 0 ? parseFloat((luc / rec * 100).toFixed(2)) : 0,
      };
    });

    // ── Alertas inteligentes ──────────────────────────────────────
    const alertas = [];
    if (abaixoMin > 0) alertas.push({ tipo: 'erro',    msg: `${abaixoMin} produto(s) abaixo da margem mínima de ${margemMinima}%.` });
    if (margemMedia > margAnt && margAnt > 0) alertas.push({ tipo: 'sucesso', msg: `Margem média subiu ${d(margemMedia, margAnt)}% em relação ao período anterior.` });
    if (margemMedia < margAnt && margAnt > 0) alertas.push({ tipo: 'atencao', msg: `Margem média caiu ${Math.abs(d(margemMedia, margAnt))}% em relação ao período anterior.` });
    if (lucroTotal > lucAnt && lucAnt > 0)    alertas.push({ tipo: 'sucesso', msg: `Lucro bruto cresceu ${d(lucroTotal, lucAnt)}% vs período anterior.` });
    if (margemCategoria.length > 0) {
      const top = margemCategoria[0];
      alertas.push({ tipo: 'info', msg: `Categoria "${top.categoria}" possui a maior margem: ${top.margem.toFixed(1)}%.` });
    }
    const menorMargem = menoresMargens[0];
    if (menorMargem) alertas.push({ tipo: 'atencao', msg: `Produto "${menorMargem.produto}" possui a menor margem: ${menorMargem.margem.toFixed(1)}%.` });

    // ── Tabela completa ───────────────────────────────────────────
    const tabela = rows.map(r => ({
      produto:     r.produto,
      grupo:       r.grupo,
      categoria:   r.categoria,
      fornecedor:  r.fornecedor,
      custoMedio:  parseFloat(r.custo_medio        || 0),
      precoMedio:  parseFloat(r.preco_medio_venda  || 0),
      receita:     parseFloat(r.receita            || 0),
      quantidade:  parseFloat(r.quantidade         || 0),
      lucro:       parseFloat(r.lucro              || 0),
      margem:      r.margem != null ? parseFloat(r.margem) : null,
      markup:      r.markup != null ? parseFloat(r.markup) : null,
    }));

    res.json({
      periodo:      { dataInicio, dataFim, label: periodo },
      margemMinima,
      kpis: {
        margemMedia:  parseFloat(margemMedia.toFixed(2)),
        markupMedio:  parseFloat(markupMedio.toFixed(2)),
        lucroBruto:   lucroTotal,
        receitaTotal,
        custoTotal,
        abaixoMin,
        deltaMargemMedia: d(margemMedia,  margAnt),
        deltaMarkupMedio: d(markupMedio,  mkpAnt),
        deltaLucro:       d(lucroTotal,   lucAnt),
        deltaReceita:     d(receitaTotal, recAnt),
        deltaCusto:       d(custoTotal,   custAnt),
      },
      margemCategoria,
      lucroGrupo,
      topLucrativos,
      menoresMargens,
      scatter,
      donutLucro,
      evolucao,
      alertas,
      tabela,
    });
  } catch (err) {
    console.error('[planejamento/margem]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   NOTAS DE FORNECEDOR
   GET /api/planejamento/notas-fornecedor
   Query params: empresa, fornecedor (nome/razao), periodo (Hoje|Semana|Mês|Ano)
   Returns: lista de notas com totais
═══════════════════════════════════════════════════════════════════════════ */
router.get('/notas-fornecedor', async (req, res) => {
  const empresa    = parseInt(req.query.empresa);
  const fornecedor = (req.query.fornecedor || '').trim();
  const periodo    = req.query.periodo || 'Mês';

  if (!empresa)    return res.status(400).json({ error: 'empresa é obrigatório' });
  if (!fornecedor) return res.status(400).json({ error: 'fornecedor é obrigatório' });

  const { dataInicio, dataFim } = periodoToDates(periodo);
  const query = queryFor(empresa);

  try {
    const { rows } = await query(
      `SELECT
         entcpa.entcpacodigo                          AS nota,
         COALESCE(entcpa.entcpachave, entcpa.entcpadocumento,
                  entcpa.entcpacodigo::text)          AS num_nota,
         entcpa.entcpachegada                         AS data_chegada,
         entcpa.entcpaemissao                         AS data_emissao,
         COALESCE(SUM(entcpi.entcpitotal), 0)         AS total,
         COALESCE(SUM(entcpi.entcpiqtd),   0)         AS quantidade,
         COUNT(entcpi.entcpicodigo)                   AS qtd_itens
       FROM entcpa
       JOIN entcpi ON entcpi.entcpicompra  = entcpa.entcpacodigo
                  AND entcpi.entcpiempresa = entcpa.entcpaempresa
       LEFT JOIN part ON part.partcodigo = entcpa.entcpafornecedor
       WHERE entcpa.entcpaempresa = $1
         AND DATE(entcpa.entcpachegada) >= $2
         AND DATE(entcpa.entcpachegada) <= $3
         AND COALESCE(part.partrazao, 'Sem fornecedor') = $4
       GROUP BY entcpa.entcpacodigo, entcpa.entcpachave, entcpa.entcpadocumento,
                entcpa.entcpachegada, entcpa.entcpaemissao
       ORDER BY entcpa.entcpachegada DESC`,
      [empresa, dataInicio, dataFim, fornecedor]
    );

    res.json({
      fornecedor,
      periodo: { dataInicio, dataFim },
      notas: rows.map(r => ({
        nota:        r.nota,
        numNota:     r.num_nota || r.nota,
        dataChegada: r.data_chegada ? r.data_chegada.toISOString().slice(0, 10) : null,
        dataEmissao: r.data_emissao ? r.data_emissao.toISOString().slice(0, 10) : null,
        total:       parseFloat(r.total    || 0),
        quantidade:  parseFloat(r.quantidade || 0),
        qtdItens:    parseInt(r.qtd_itens  || 0),
      })),
    });
  } catch (err) {
    console.error('[planejamento/notas-fornecedor]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/planejamento/nota-itens ────────────────────────────────────────
   Itens de uma nota de entrada específica
   Query params: empresa, nota (entcpacodigo)
────────────────────────────────────────────────────────────────────────────── */
router.get('/nota-itens', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const nota    = parseInt(req.query.nota);

  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório' });
  if (!nota)    return res.status(400).json({ error: 'nota é obrigatório' });

  const query = queryFor(empresa);

  try {
    const { rows } = await query(
      `SELECT
         COALESCE(prod.prodresumo, prod.proddescricao, 'Sem descrição') AS produto,
         entcpi.entcpiqtd      AS qtd,
         entcpi.entcpipreco    AS preco_unitario,
         entcpi.entcpitotal    AS total
       FROM entcpi
       LEFT JOIN prod ON prod.prodcodigo = entcpi.entcpiproduto
       WHERE entcpi.entcpiempresa = $1
         AND entcpi.entcpicompra  = $2
       ORDER BY entcpi.entcpicodigo`,
      [empresa, nota]
    );

    res.json({
      nota,
      itens: rows.map(r => ({
        produto:      r.produto,
        qtd:          parseFloat(r.qtd           || 0),
        precoUnitario:parseFloat(r.preco_unitario|| 0),
        total:        parseFloat(r.total         || 0),
      })),
    });
  } catch (err) {
    console.error('[planejamento/nota-itens]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
