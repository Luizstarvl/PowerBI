const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_alerts (
    al_id           SERIAL       PRIMARY KEY,
    al_titulo       VARCHAR(200) NOT NULL,
    al_tipo         VARCHAR(40)  NOT NULL DEFAULT 'manual',
    al_severidade   VARCHAR(10)  NOT NULL DEFAULT 'info',
    al_modulo       VARCHAR(50),
    al_empresa_id   INTEGER      REFERENCES starvl_clients(sc_id) ON DELETE CASCADE,
    al_lido         BOOLEAN      NOT NULL DEFAULT false,
    al_criado_em    TIMESTAMPTZ  DEFAULT NOW(),
    al_resolvido_em TIMESTAMPTZ
  )
`).catch(err => console.error('[starvl_alerts] ensureTable:', err.message));

const toRow = r => ({
  id:          r.al_id,
  titulo:      r.al_titulo,
  tipo:        r.al_tipo,
  severidade:  r.al_severidade,
  modulo:      r.al_modulo    || null,
  empresaId:   r.al_empresa_id,
  lido:        r.al_lido,
  criadoEm:    r.al_criado_em,
  resolvidoEm: r.al_resolvido_em || null,
  origem:      'manual',
});

// ── GET /api/alerts?empresa=&resolvido= ────────────────────────────────────────
router.get('/', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório.' });
  const incluirResolvidos = req.query.resolvido === 'true';
  try {
    const result = await pool.query(
      `SELECT * FROM starvl_alerts
       WHERE al_empresa_id = $1 ${incluirResolvidos ? '' : 'AND al_resolvido_em IS NULL'}
       ORDER BY al_criado_em DESC`,
      [empresa]
    );
    res.json(result.rows.map(toRow));
  } catch (err) {
    console.error('GET /alerts:', err.message);
    res.status(500).json({ error: 'Erro ao listar alertas.' });
  }
});

// ── POST /api/alerts ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { titulo, tipo, severidade, modulo, empresaId } = req.body;
  if (!titulo?.trim() || !empresaId) {
    return res.status(400).json({ error: 'titulo e empresaId são obrigatórios.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO starvl_alerts (al_titulo, al_tipo, al_severidade, al_modulo, al_empresa_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [titulo.trim(), tipo || 'manual', severidade || 'info', modulo?.trim() || null, empresaId]
    );
    res.status(201).json(toRow(result.rows[0]));
  } catch (err) {
    console.error('POST /alerts:', err.message);
    res.status(500).json({ error: 'Erro ao criar alerta.' });
  }
});

// ── PATCH /api/alerts/:id/lida ──────────────────────────────────────────────────
router.patch('/:id/lida', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query(
      `UPDATE starvl_alerts SET al_lido = true WHERE al_id = $1 RETURNING *`, [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Alerta não encontrado.' });
    res.json(toRow(result.rows[0]));
  } catch (err) {
    console.error('PATCH /alerts/:id/lida:', err.message);
    res.status(500).json({ error: 'Erro ao marcar alerta como lido.' });
  }
});

// ── PATCH /api/alerts/:id/resolver ──────────────────────────────────────────────
router.patch('/:id/resolver', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query(
      `UPDATE starvl_alerts SET al_resolvido_em = NOW(), al_lido = true WHERE al_id = $1 RETURNING *`, [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Alerta não encontrado.' });
    res.json(toRow(result.rows[0]));
  } catch (err) {
    console.error('PATCH /alerts/:id/resolver:', err.message);
    res.status(500).json({ error: 'Erro ao resolver alerta.' });
  }
});

module.exports = router;
