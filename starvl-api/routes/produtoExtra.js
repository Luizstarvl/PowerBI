const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

// Cria tabela na primeira vez
pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_produto_extra (
    id            SERIAL       PRIMARY KEY,
    empresa       VARCHAR(50)  NOT NULL,
    cod_produto   VARCHAR(100) NOT NULL,
    foto_base64   TEXT,
    observacoes   TEXT,
    tags          TEXT[]       NOT NULL DEFAULT '{}',
    atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (empresa, cod_produto)
  )
`).catch(err => console.error('[produto-extra] init:', err.message));

// GET /api/produto-extra/batch/:empresa?codes=c1,c2,... (top5, poucos itens)
router.get('/batch/:empresa', async (req, res) => {
  try {
    const { empresa } = req.params;
    const codes = (req.query.codes || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 200);
    if (!codes.length) return res.json({ ok: true, data: {} });
    const { rows } = await pool.query(
      `SELECT cod_produto, foto_base64
         FROM starvl_produto_extra
        WHERE empresa = $1 AND cod_produto = ANY($2::text[])`,
      [empresa, codes]
    );
    const data = {};
    rows.forEach(r => { if (r.foto_base64) data[r.cod_produto] = r.foto_base64; });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/produto-extra/batch/:empresa  { codes: [...] }  (listagem, sem limite de URL)
router.post('/batch/:empresa', async (req, res) => {
  try {
    const { empresa } = req.params;
    const codes = (req.body.codes || []).map(String).slice(0, 2000);
    if (!codes.length) return res.json({ ok: true, data: {} });
    const { rows } = await pool.query(
      `SELECT cod_produto, foto_base64
         FROM starvl_produto_extra
        WHERE empresa = $1 AND cod_produto = ANY($2::text[])`,
      [empresa, codes]
    );
    const data = {};
    rows.forEach(r => { if (r.foto_base64) data[r.cod_produto] = r.foto_base64; });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/produto-extra/:empresa/:cod
router.get('/:empresa/:cod', async (req, res) => {
  try {
    const { empresa, cod } = req.params;
    const { rows } = await pool.query(
      `SELECT foto_base64, observacoes, tags, atualizado_em
         FROM starvl_produto_extra
        WHERE empresa = $1 AND cod_produto = $2`,
      [empresa, cod]
    );
    res.json({ ok: true, data: rows[0] || null });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/produto-extra/:empresa/:cod
router.post('/:empresa/:cod', async (req, res) => {
  try {
    const { empresa, cod } = req.params;
    const { foto_base64, observacoes, tags } = req.body;

    await pool.query(
      `INSERT INTO starvl_produto_extra (empresa, cod_produto, foto_base64, observacoes, tags, atualizado_em)
            VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (empresa, cod_produto)
       DO UPDATE SET
         foto_base64   = EXCLUDED.foto_base64,
         observacoes   = EXCLUDED.observacoes,
         tags          = EXCLUDED.tags,
         atualizado_em = NOW()`,
      [empresa, cod, foto_base64 ?? null, observacoes ?? null, tags ?? []]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
