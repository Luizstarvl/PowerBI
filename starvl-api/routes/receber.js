const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { safeQuery } = require('../middleware/readonly');

const query = safeQuery(pool);

function today() {
  return new Date().toISOString().split('T')[0];
}

// ── Resumo / KPIs ─────────────────────────────────────────────────────────────
// GET /api/receber/resumo?empresa=X
router.get('/resumo', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa required' });

  const d = today();
  const mesInicio = d.substring(0, 8) + '01';

  try {
    const abertoResult = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN rece.recevencimento > $2 THEN rece.recevalor + COALESCE(rece.recejuros,0) - COALESCE(rece.recedesconto,0) END), 0) AS a_vencer,
         COALESCE(SUM(CASE WHEN DATE(rece.recevencimento) = $2::date THEN rece.recevalor + COALESCE(rece.recejuros,0) - COALESCE(rece.recedesconto,0) END), 0) AS vence_hoje,
         COALESCE(SUM(CASE WHEN rece.recevencimento < $2 THEN rece.recevalor + COALESCE(rece.recejuros,0) - COALESCE(rece.recedesconto,0) END), 0) AS em_atraso,
         COALESCE(SUM(rece.recevalor + COALESCE(rece.recejuros,0) - COALESCE(rece.recedesconto,0)), 0) AS total_aberto,
         COUNT(*)::int AS qtd_aberto
       FROM rece
       LEFT JOIN recj ON recj.recjrece = rece.rececodigo AND recj.recjempresa = rece.receempresa
       WHERE rece.receempresa = $1
         AND recj.recjcodigo IS NULL`,
      [empresa, d]
    );

    const recebidosResult = await query(
      `SELECT
         COALESCE(SUM(recj.recjvalor), 0) AS recebidos_mes,
         COUNT(*)::int AS qtd_recebidos
       FROM recj
       WHERE recj.recjempresa = $1
         AND DATE(recj.recjpagamento) >= $2
         AND DATE(recj.recjpagamento) <= $3`,
      [empresa, mesInicio, d]
    );

    const row       = abertoResult.rows[0];
    const totalAberto = parseFloat(row.total_aberto) || 0;
    const emAtraso    = parseFloat(row.em_atraso)    || 0;

    res.json({
      totalAReceber:   totalAberto,
      aReceberHoje:    parseFloat(row.vence_hoje) || 0,
      emAtraso,
      aVencer:         parseFloat(row.a_vencer)   || 0,
      recebidosMes:    parseFloat(recebidosResult.rows[0]?.recebidos_mes) || 0,
      inadimplencia:   totalAberto > 0 ? (emAtraso / totalAberto) * 100 : 0,
      qtdAberto:       row.qtd_aberto || 0,
    });
  } catch (err) {
    console.error('Error /receber/resumo:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Tabela de Contas ──────────────────────────────────────────────────────────
// GET /api/receber/contas?empresa=X&page=1&limit=10&search=&status=&dataInicio=&dataFim=
router.get('/contas', async (req, res) => {
  const empresa   = parseInt(req.query.empresa);
  const page      = Math.max(1, parseInt(req.query.page)  || 1);
  const limit     = Math.min(50, Math.max(5, parseInt(req.query.limit) || 10));
  const offset    = (page - 1) * limit;
  const search    = (req.query.search || '').trim();
  const status    = req.query.status || 'todos';
  const dataInicio = req.query.dataInicio || null;
  const dataFim    = req.query.dataFim    || null;

  if (!empresa) return res.status(400).json({ error: 'empresa required' });

  const d = today();

  try {
    const conditions = ['rece.receempresa = $1'];
    const params     = [empresa];
    let   pidx       = 2;

    if (search) {
      conditions.push(
        `(part.partrazao ILIKE $${pidx} OR CAST(rece.recedocumento AS TEXT) ILIKE $${pidx} OR COALESCE(part.partcnpjcpf, '') ILIKE $${pidx})`
      );
      params.push(`%${search}%`);
      pidx++;
    }
    if (dataInicio) { conditions.push(`rece.recevencimento >= $${pidx}`); params.push(dataInicio); pidx++; }
    if (dataFim)    { conditions.push(`rece.recevencimento <= $${pidx}`); params.push(dataFim);    pidx++; }

    const statusSQL = {
      a_vencer:   `AND recj.recjcodigo IS NULL AND rece.recevencimento > '${d}'`,
      vence_hoje: `AND recj.recjcodigo IS NULL AND DATE(rece.recevencimento) = '${d}'::date`,
      atrasado:   `AND recj.recjcodigo IS NULL AND rece.recevencimento < '${d}'`,
      recebido:   `AND recj.recjcodigo IS NOT NULL`,
    }[status] || '';

    const where = conditions.join(' AND ');

    const baseFrom = `
      FROM rece
      LEFT JOIN part ON part.partcodigo = rece.rececliente
      LEFT JOIN recj ON recj.recjrece   = rece.rececodigo AND recj.recjempresa = rece.receempresa
      WHERE ${where} ${statusSQL}`;

    const dataSQL = `
      SELECT
        rece.rececodigo,
        COALESCE(part.partrazao, 'Cliente') AS cliente,
        COALESCE(part.partcnpjcpf, '')      AS cnpj,
        CAST(rece.recedocumento AS TEXT)     AS documento,
        rece.recevencimento                  AS vencimento,
        COALESCE(rece.recevalor,    0)       AS valor,
        COALESCE(rece.recejuros,    0)       AS juros,
        COALESCE(rece.recedesconto, 0)       AS desconto,
        COALESCE(rece.recevalor,0) + COALESCE(rece.recejuros,0) - COALESCE(rece.recedesconto,0) AS valor_a_receber,
        CASE
          WHEN recj.recjcodigo IS NOT NULL THEN 'recebido'
          WHEN DATE(rece.recevencimento) = '${d}'::date THEN 'vence_hoje'
          WHEN rece.recevencimento < '${d}' THEN 'atrasado'
          ELSE 'a_vencer'
        END AS status,
        CASE
          WHEN recj.recjcodigo IS NOT NULL THEN 0
          WHEN rece.recevencimento < '${d}' THEN EXTRACT(DAY FROM ('${d}'::date - DATE(rece.recevencimento)))::int
          ELSE 0
        END AS dias_atraso,
        recj.recjpagamento AS data_recebimento
      ${baseFrom}
      ORDER BY
        CASE WHEN recj.recjcodigo IS NULL AND rece.recevencimento < '${d}' THEN 0 ELSE 1 END,
        rece.recevencimento ASC
      LIMIT $${pidx} OFFSET $${pidx + 1}`;

    const countSQL = `SELECT COUNT(*)::int AS total ${baseFrom}`;

    params.push(limit, offset);

    const [dataRes, countRes] = await Promise.all([
      query(dataSQL, params),
      query(countSQL, params.slice(0, -2)),
    ]);

    const total = countRes.rows[0]?.total || 0;

    res.json({
      data: dataRes.rows.map(r => ({
        id:               r.rececodigo,
        cliente:          r.cliente,
        cnpj:             r.cnpj,
        documento:        r.documento,
        vencimento:       String(r.vencimento || '').substring(0, 10),
        valor:            parseFloat(r.valor            || 0),
        juros:            parseFloat(r.juros            || 0),
        desconto:         parseFloat(r.desconto         || 0),
        valorAReceber:    parseFloat(r.valor_a_receber  || 0),
        status:           r.status,
        diasAtraso:       parseInt(r.dias_atraso        || 0),
        dataRecebimento:  r.data_recebimento ? String(r.data_recebimento).substring(0, 10) : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Error /receber/contas:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Analíticos ────────────────────────────────────────────────────────────────
// GET /api/receber/analiticos?empresa=X
router.get('/analiticos', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa required' });

  const d = today();

  try {
    const statusRes = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN recj.recjcodigo IS NOT NULL THEN rece.recevalor END), 0)                           AS recebido,
         COALESCE(SUM(CASE WHEN recj.recjcodigo IS NULL AND DATE(rece.recevencimento) = $2::date THEN rece.recevalor END), 0) AS vence_hoje,
         COALESCE(SUM(CASE WHEN recj.recjcodigo IS NULL AND rece.recevencimento < $2 THEN rece.recevalor END), 0)  AS atrasado,
         COALESCE(SUM(CASE WHEN recj.recjcodigo IS NULL AND rece.recevencimento > $2 THEN rece.recevalor END), 0)  AS a_vencer,
         COUNT(*) AS total
       FROM rece
       LEFT JOIN recj ON recj.recjrece = rece.rececodigo AND recj.recjempresa = rece.receempresa
       WHERE rece.receempresa = $1`,
      [empresa, d]
    );

    const faixaRes = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN (CURRENT_DATE - DATE(rece.recevencimento)) BETWEEN 1 AND 15   THEN rece.recevalor END),0) AS f1,
         COALESCE(SUM(CASE WHEN (CURRENT_DATE - DATE(rece.recevencimento)) BETWEEN 16 AND 30  THEN rece.recevalor END),0) AS f2,
         COALESCE(SUM(CASE WHEN (CURRENT_DATE - DATE(rece.recevencimento)) BETWEEN 31 AND 60  THEN rece.recevalor END),0) AS f3,
         COALESCE(SUM(CASE WHEN (CURRENT_DATE - DATE(rece.recevencimento)) > 60               THEN rece.recevalor END),0) AS f4,
         COALESCE(SUM(rece.recevalor), 0) AS total_atraso
       FROM rece
       LEFT JOIN recj ON recj.recjrece = rece.rececodigo AND recj.recjempresa = rece.receempresa
       WHERE rece.receempresa = $1
         AND recj.recjcodigo IS NULL
         AND rece.recevencimento < $2`,
      [empresa, d]
    );

    const topRes = await query(
      `SELECT
         COALESCE(part.partrazao, 'Cliente') AS cliente,
         COALESCE(SUM(rece.recevalor + COALESCE(rece.recejuros,0) - COALESCE(rece.recedesconto,0)), 0) AS divida
       FROM rece
       LEFT JOIN part ON part.partcodigo = rece.rececliente
       LEFT JOIN recj ON recj.recjrece   = rece.rececodigo AND recj.recjempresa = rece.receempresa
       WHERE rece.receempresa = $1
         AND recj.recjcodigo IS NULL
       GROUP BY part.partrazao
       ORDER BY divida DESC
       LIMIT 5`,
      [empresa]
    );

    const indicesRes = await query(
      `SELECT
         COALESCE(AVG(rece.recevalor), 0) AS ticket_medio,
         COALESCE(AVG(EXTRACT(DAY FROM (DATE(recj.recjpagamento) - DATE(rece.recevencimento)))), 0) AS prazo_medio,
         COUNT(CASE WHEN recj.recjpagamento < rece.recevencimento THEN 1 END)::float /
           NULLIF(COUNT(recj.recjcodigo), 0) * 100 AS pct_antecipado
       FROM rece
       LEFT JOIN recj ON recj.recjrece = rece.rececodigo AND recj.recjempresa = rece.receempresa
       WHERE rece.receempresa = $1`,
      [empresa]
    );

    const s  = statusRes.rows[0];
    const f  = faixaRes.rows[0];
    const ix = indicesRes.rows[0];
    const totalAberto = parseFloat(s.atrasado) + parseFloat(s.a_vencer) + parseFloat(s.vence_hoje);
    const emAtraso    = parseFloat(s.atrasado) || 0;

    res.json({
      porStatus: {
        aVencer:   parseFloat(s.a_vencer)   || 0,
        venceHoje: parseFloat(s.vence_hoje) || 0,
        atrasado:  emAtraso,
        recebido:  parseFloat(s.recebido)   || 0,
      },
      faixaAtraso: {
        f1:    parseFloat(f.f1) || 0,
        f2:    parseFloat(f.f2) || 0,
        f3:    parseFloat(f.f3) || 0,
        f4:    parseFloat(f.f4) || 0,
        total: parseFloat(f.total_atraso) || 0,
      },
      top5: topRes.rows.map(r => ({
        cliente: r.cliente,
        divida:  parseFloat(r.divida) || 0,
      })),
      indices: {
        ticketMedio:        parseFloat(ix.ticket_medio)  || 0,
        prazoMedio:         Math.round(parseFloat(ix.prazo_medio || 0)),
        inadimplencia:      totalAberto > 0 ? (emAtraso / totalAberto) * 100 : 0,
        recebimentoAntecip: parseFloat(ix.pct_antecipado) || 0,
      },
    });
  } catch (err) {
    console.error('Error /receber/analiticos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
