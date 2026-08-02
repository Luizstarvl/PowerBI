const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_password_resets (
    pr_id       SERIAL       PRIMARY KEY,
    pr_user_id  INTEGER      REFERENCES starvl_users(su_id) ON DELETE CASCADE,
    pr_usuario  VARCHAR(100) NOT NULL,
    pr_status   VARCHAR(20)  NOT NULL DEFAULT 'pendente',
    pr_criado   TIMESTAMPTZ  DEFAULT NOW(),
    pr_atendido TIMESTAMPTZ
  )
`).catch(err => console.error('[password_resets] ensureTable:', err.message));

// ── POST /api/password-resets ─────────────────────────────────────────────────
// Público (chamado da tela de login, antes de autenticar). Sempre responde com
// sucesso genérico, exista ou não o usuário — evita que a rota seja usada pra
// descobrir quais usuários existem no sistema.
router.post('/', async (req, res) => {
  const { usuario } = req.body;
  if (!usuario?.trim()) {
    return res.status(400).json({ ok: false, error: 'Informe o usuário.' });
  }
  try {
    const u = await pool.query(
      `SELECT su_id FROM starvl_users
       WHERE LOWER(TRIM(su_usuario)) = LOWER(TRIM($1)) AND su_ativo = true
       LIMIT 1`,
      [usuario.trim()]
    );
    if (u.rows.length) {
      const userId = u.rows[0].su_id;
      const existing = await pool.query(
        `SELECT pr_id FROM starvl_password_resets WHERE pr_user_id = $1 AND pr_status = 'pendente' LIMIT 1`,
        [userId]
      );
      if (!existing.rows.length) {
        await pool.query(
          `INSERT INTO starvl_password_resets (pr_user_id, pr_usuario) VALUES ($1, $2)`,
          [userId, usuario.trim()]
        );
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /password-resets:', err.message);
    res.status(500).json({ ok: false, error: 'Erro ao registrar solicitação.' });
  }
});

// ── GET /api/password-resets?status=pendente ──────────────────────────────────
router.get('/', async (req, res) => {
  const { status } = req.query;
  try {
    const params = [];
    let where = '';
    if (status) { params.push(status); where = 'WHERE pr.pr_status = $1'; }
    const result = await pool.query(
      `SELECT pr.pr_id, pr.pr_usuario, pr.pr_status, pr.pr_criado, pr.pr_atendido,
              u.su_id, u.su_nome, u.su_email, u.su_foto
       FROM starvl_password_resets pr
       LEFT JOIN starvl_users u ON u.su_id = pr.pr_user_id
       ${where}
       ORDER BY pr.pr_criado DESC`,
      params
    );
    res.json(result.rows.map(r => ({
      id:         r.pr_id,
      usuario:    r.pr_usuario,
      status:     r.pr_status,
      criadoEm:   r.pr_criado,
      atendidoEm: r.pr_atendido,
      userId:     r.su_id   || null,
      nome:       r.su_nome || null,
      email:      r.su_email || null,
      foto:       r.su_foto || null,
    })));
  } catch (err) {
    console.error('GET /password-resets:', err.message);
    res.status(500).json({ error: 'Erro ao listar solicitações.' });
  }
});

// ── PATCH /api/password-resets/:id/resolver ───────────────────────────────────
router.patch('/:id/resolver', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query(
      `UPDATE starvl_password_resets SET pr_status = 'atendido', pr_atendido = NOW()
       WHERE pr_id = $1 RETURNING pr_id`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Solicitação não encontrada' });
    res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /password-resets/:id/resolver:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar solicitação.' });
  }
});

module.exports = router;
