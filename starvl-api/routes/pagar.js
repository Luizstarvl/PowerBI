const express = require('express');
const router  = express.Router();
const { queryFor } = require('../db/poolManager');





function today() {
  return new Date().toISOString().split('T')[0];
}

// ── Resumo / KPIs ─────────────────────────────────────────────────────────────
// GET /api/pagar/resumo?empresa=X
router.get('/resumo', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const query = queryFor(empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa required' });

  const d = today();
  const mesInicio = d.substring(0, 8) + '01';

  try {
    const abertoResult = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN paga.pagavencimento > $2  THEN paga.pagavalor + COALESCE(paga.pagajuro,0) - COALESCE(paga.pagadesconto,0) END), 0) AS a_vencer,
         COALESCE(SUM(CASE WHEN DATE(paga.pagavencimento) = $2::date THEN paga.pagavalor + COALESCE(paga.pagajuro,0) - COALESCE(paga.pagadesconto,0) END), 0) AS vence_hoje,
         COALESCE(SUM(CASE WHEN paga.pagavencimento < $2  THEN paga.pagavalor + COALESCE(paga.pagajuro,0) - COALESCE(paga.pagadesconto,0) END), 0) AS em_atraso,
         COALESCE(SUM(paga.pagavalor + COALESCE(paga.pagajuro,0) - COALESCE(paga.pagadesconto,0)), 0) AS total_aberto,
         COUNT(*)::int AS qtd_aberto
       FROM paga
       WHERE paga.pagaempresa = $1`,
      [empresa, d]
    );

    const pagosResult = await query(
      `SELECT
         COALESCE(SUM(pagj.pagjpago), 0) AS pagos_mes,
         COUNT(*)::int AS qtd_pagos
       FROM pagj
       WHERE pagj.pagjempresa = $1
         AND DATE(pagj.pagjpagamento) >= $2
         AND DATE(pagj.pagjpagamento) <= $3`,
      [empresa, mesInicio, d]
    );

    const row       = abertoResult.rows[0];
    const totalAberto = parseFloat(row.total_aberto) || 0;
    const emAtraso    = parseFloat(row.em_atraso)    || 0;

    res.json({
      totalAPagar:  totalAberto,
      aPagarHoje:   parseFloat(row.vence_hoje) || 0,
      emAtraso,
      aVencer:      parseFloat(row.a_vencer)   || 0,
      pagosMes:     parseFloat(pagosResult.rows[0]?.pagos_mes) || 0,
      pctAtraso:    totalAberto > 0 ? (emAtraso / totalAberto) * 100 : 0,
      qtdAberto:    row.qtd_aberto || 0,
    });
  } catch (err) {
    console.error('Error /pagar/resumo:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Tabela de Contas ──────────────────────────────────────────────────────────
// GET /api/pagar/contas?empresa=X&page=1&limit=10&search=&status=&dataInicio=&dataFim=
router.get('/contas', async (req, res) => {
  const empresa    = parseInt(req.query.empresa);
  const query = queryFor(empresa);
  const page       = Math.max(1, parseInt(req.query.page)  || 1);
  const limit      = Math.min(50, Math.max(5, parseInt(req.query.limit) || 10));
  const offset     = (page - 1) * limit;
  const search     = (req.query.search || '').trim();
  const status     = req.query.status || 'todos';
  const dataInicio = req.query.dataInicio || null;
  const dataFim    = req.query.dataFim    || null;

  if (!empresa) return res.status(400).json({ error: 'empresa required' });

  const d = today();

  try {
    const conditions = ['paga.pagaempresa = $1'];
    const params     = [empresa];
    let   pidx       = 2;

    if (search) {
      conditions.push(
        `(part.partrazao ILIKE $${pidx} OR CAST(paga.pagadocumento AS TEXT) ILIKE $${pidx} OR COALESCE(part.partcnpjcpf, '') ILIKE $${pidx})`
      );
      params.push(`%${search}%`);
      pidx++;
    }
    if (dataInicio) { conditions.push(`paga.pagavencimento >= $${pidx}`); params.push(dataInicio); pidx++; }
    if (dataFim)    { conditions.push(`paga.pagavencimento <= $${pidx}`); params.push(dataFim);    pidx++; }

    const statusSQL = {
      a_vencer:   `AND paga.pagavencimento > '${d}'`,
      vence_hoje: `AND DATE(paga.pagavencimento) = '${d}'::date`,
      atrasado:   `AND paga.pagavencimento < '${d}'`,
      pago:       `AND 1 = 0`,
    }[status] || '';

    const where = conditions.join(' AND ');

    const baseFrom = `
      FROM paga
      LEFT JOIN part ON part.partcodigo = paga.pagafornecedor
      WHERE ${where} ${statusSQL}`;

    const dataSQL = `
      SELECT
        paga.pagacodigo,
        COALESCE(part.partrazao,   'Fornecedor') AS fornecedor,
        COALESCE(part.partcnpjcpf, '')           AS cnpj,
        CAST(paga.pagadocumento AS TEXT)          AS documento,
        TO_CHAR(paga.pagavencimento, 'YYYY-MM-DD') AS vencimento,
        COALESCE(paga.pagavalor,    0)            AS valor,
        COALESCE(paga.pagajuro,     0)            AS juros,
        COALESCE(paga.pagadesconto, 0)            AS desconto,
        COALESCE(paga.pagavalor,0) + COALESCE(paga.pagajuro,0) - COALESCE(paga.pagadesconto,0) AS valor_a_pagar,
        CASE
          WHEN DATE(paga.pagavencimento) = '${d}'::date THEN 'vence_hoje'
          WHEN paga.pagavencimento < '${d}' THEN 'atrasado'
          ELSE 'a_vencer'
        END AS status,
        CASE
          WHEN paga.pagavencimento < '${d}' THEN ('${d}'::date - DATE(paga.pagavencimento))::int
          ELSE 0
        END AS dias_atraso,
        NULL AS data_pagamento
      ${baseFrom}
      ORDER BY
        CASE WHEN paga.pagavencimento < '${d}' THEN 0 ELSE 1 END,
        paga.pagavencimento ASC
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
        id:            r.pagacodigo,
        fornecedor:    r.fornecedor,
        cnpj:          r.cnpj,
        documento:     r.documento,
        vencimento:    String(r.vencimento || '').substring(0, 10),
        valor:         parseFloat(r.valor         || 0),
        juros:         parseFloat(r.juros         || 0),
        desconto:      parseFloat(r.desconto      || 0),
        valorAPagar:   parseFloat(r.valor_a_pagar || 0),
        status:        r.status,
        diasAtraso:    parseInt(r.dias_atraso     || 0),
        dataPagamento: r.data_pagamento ? String(r.data_pagamento).substring(0, 10) : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Error /pagar/contas:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Analíticos ────────────────────────────────────────────────────────────────
// GET /api/pagar/analiticos?empresa=X
router.get('/analiticos', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const query = queryFor(empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa required' });

  const d = today();

  try {
    const statusRes = await query(
      `SELECT
         (SELECT COALESCE(SUM(pagj.pagjpago), 0) FROM pagj WHERE pagj.pagjempresa = $1) AS pago,
         COALESCE(SUM(CASE WHEN DATE(paga.pagavencimento) = $2::date THEN paga.pagavalor END), 0) AS vence_hoje,
         COALESCE(SUM(CASE WHEN paga.pagavencimento < $2 THEN paga.pagavalor END), 0)  AS atrasado,
         COALESCE(SUM(CASE WHEN paga.pagavencimento > $2 THEN paga.pagavalor END), 0)  AS a_vencer,
         COUNT(*) AS total
       FROM paga
       WHERE paga.pagaempresa = $1`,
      [empresa, d]
    );

    const faixaRes = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN (CURRENT_DATE - DATE(paga.pagavencimento)) BETWEEN 1 AND 15  THEN paga.pagavalor END),0) AS f1,
         COALESCE(SUM(CASE WHEN (CURRENT_DATE - DATE(paga.pagavencimento)) BETWEEN 16 AND 30 THEN paga.pagavalor END),0) AS f2,
         COALESCE(SUM(CASE WHEN (CURRENT_DATE - DATE(paga.pagavencimento)) BETWEEN 31 AND 60 THEN paga.pagavalor END),0) AS f3,
         COALESCE(SUM(CASE WHEN (CURRENT_DATE - DATE(paga.pagavencimento)) > 60              THEN paga.pagavalor END),0) AS f4,
         COALESCE(SUM(paga.pagavalor), 0) AS total_atraso
       FROM paga
       WHERE paga.pagaempresa = $1
         AND paga.pagavencimento < $2`,
      [empresa, d]
    );

    const topRes = await query(
      `SELECT
         COALESCE(part.partrazao, 'Fornecedor') AS fornecedor,
         COALESCE(SUM(paga.pagavalor + COALESCE(paga.pagajuro,0) - COALESCE(paga.pagadesconto,0)), 0) AS divida
       FROM paga
       LEFT JOIN part ON part.partcodigo = paga.pagafornecedor
       WHERE paga.pagaempresa = $1
       GROUP BY part.partrazao
       ORDER BY divida DESC
       LIMIT 5`,
      [empresa]
    );

    const indicesRes = await query(
      `SELECT
         COALESCE(AVG(paga.pagavalor), 0) AS ticket_medio,
         (SELECT COALESCE(AVG((DATE(pagj.pagjpagamento) - DATE(pagj.pagjvencimento))::int), 0)
            FROM pagj WHERE pagj.pagjempresa = $1) AS prazo_medio,
         (SELECT COUNT(CASE WHEN pagj.pagjpagamento < pagj.pagjvencimento THEN 1 END)::float /
                 NULLIF(COUNT(pagj.pagjcodigo), 0) * 100
            FROM pagj WHERE pagj.pagjempresa = $1) AS pct_antecipado
       FROM paga
       WHERE paga.pagaempresa = $1`,
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
        pago:      parseFloat(s.pago)       || 0,
      },
      faixaAtraso: {
        f1: parseFloat(f.f1) || 0, f2: parseFloat(f.f2) || 0,
        f3: parseFloat(f.f3) || 0, f4: parseFloat(f.f4) || 0,
        total: parseFloat(f.total_atraso) || 0,
      },
      top5: topRes.rows.map(r => ({ fornecedor: r.fornecedor, divida: parseFloat(r.divida) || 0 })),
      indices: {
        ticketMedio:   parseFloat(ix.ticket_medio)  || 0,
        prazoMedio:    Math.round(parseFloat(ix.prazo_medio || 0)),
        pctAtraso:     totalAberto > 0 ? (emAtraso / totalAberto) * 100 : 0,
        pagoAntecip:   parseFloat(ix.pct_antecipado) || 0,
      },
    });
  } catch (err) {
    console.error('Error /pagar/analiticos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
