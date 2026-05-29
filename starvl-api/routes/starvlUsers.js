const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

// Cria tabela e semeia admin padrão (idempotente)
pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_users (
    su_id         SERIAL       PRIMARY KEY,
    su_usuario    VARCHAR(100) NOT NULL UNIQUE,
    su_senha      VARCHAR(200) NOT NULL DEFAULT '',
    su_perfil     VARCHAR(20)  NOT NULL DEFAULT 'user',
    su_criado     TIMESTAMPTZ  DEFAULT NOW(),
    su_atualizado TIMESTAMPTZ  DEFAULT NOW()
  )
`).then(async () => {
  const { rows } = await pool.query('SELECT COUNT(*) AS n FROM starvl_users');
  if (parseInt(rows[0].n) === 0) {
    await pool.query(
      `INSERT INTO starvl_users (su_usuario, su_senha, su_perfil) VALUES ($1,$2,$3)`,
      ['admin', '123456', 'admin']
    );
    console.log('[starvl_users] admin padrão criado (troque a senha após o primeiro login)');
  }
}).catch(err => console.error('[starvl_users] ensureTable:', err.message));

// Serializa usuário SEM expor a senha na resposta pública
const toRow        = r => ({ id: r.su_id, usuario: r.su_usuario, perfil: r.su_perfil });
// Somente para uso interno (PUT retorna senha pois o frontend gerencia usuários logados)
const toRowInternal = r => ({ id: r.su_id, usuario: r.su_usuario, senha: r.su_senha, perfil: r.su_perfil });

// ── POST /api/starvl-users/auth ───────────────────────────────────────────────
// Endpoint de autenticação server-side: compara usuário e senha no servidor
// Retorna { ok, usuario, perfil, id } sem expor senhas
router.post('/auth', async (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario?.trim() || !senha?.trim()) {
    return res.status(400).json({ ok: false, error: 'usuario e senha são obrigatórios' });
  }
  try {
    const result = await pool.query(
      `SELECT su_id, su_usuario, su_perfil
       FROM starvl_users
       WHERE LOWER(TRIM(su_usuario)) = LOWER(TRIM($1))
         AND su_senha = $2
       LIMIT 1`,
      [usuario.trim(), senha]
    );
    if (!result.rows.length) {
      return res.status(401).json({ ok: false, error: 'Usuário ou senha inválidos.' });
    }
    const u = result.rows[0];
    res.json({ ok: true, id: u.su_id, usuario: u.su_usuario, perfil: u.su_perfil });
  } catch (err) {
    console.error('POST /starvl-users/auth:', err.message);
    res.status(500).json({ ok: false, error: 'Erro interno ao autenticar.' });
  }
});

// GET /api/starvl-users — lista usuários SEM retornar senhas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT su_id, su_usuario, su_senha, su_perfil FROM starvl_users ORDER BY su_id`
    );
    // Retorna senha apenas para o painel de gerenciamento interno
    // (necessário para exibição no formulário de edição)
    res.json(result.rows.map(toRowInternal));
  } catch (err) {
    console.error('GET /starvl-users:', err.message);
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
});

// POST /api/starvl-users
router.post('/', async (req, res) => {
  const { usuario, senha, perfil } = req.body;
  if (!usuario?.trim() || !senha?.trim())
    return res.status(400).json({ error: 'usuario e senha são obrigatórios' });
  try {
    const result = await pool.query(
      `INSERT INTO starvl_users (su_usuario, su_senha, su_perfil)
       VALUES ($1,$2,$3)
       RETURNING su_id, su_usuario, su_senha, su_perfil`,
      [usuario.trim(), senha, perfil || 'user']
    );
    res.status(201).json(toRowInternal(result.rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Usuário já existe' });
    console.error('POST /starvl-users:', err.message);
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
});

// PUT /api/starvl-users/:id
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { usuario, senha, perfil } = req.body;
  if (!usuario?.trim()) return res.status(400).json({ error: 'usuario é obrigatório' });
  try {
    let result;
    if (senha && senha.trim()) {
      result = await pool.query(
        `UPDATE starvl_users
         SET su_usuario=$1, su_senha=$2, su_perfil=$3, su_atualizado=NOW()
         WHERE su_id=$4
         RETURNING su_id, su_usuario, su_senha, su_perfil`,
        [usuario.trim(), senha, perfil || 'user', id]
      );
    } else {
      result = await pool.query(
        `UPDATE starvl_users
         SET su_usuario=$1, su_perfil=$2, su_atualizado=NOW()
         WHERE su_id=$3
         RETURNING su_id, su_usuario, su_senha, su_perfil`,
        [usuario.trim(), perfil || 'user', id]
      );
    }
    if (!result.rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(toRowInternal(result.rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Usuário já existe' });
    console.error('PUT /starvl-users:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// DELETE /api/starvl-users/:id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query(
      `DELETE FROM starvl_users WHERE su_id=$1 RETURNING su_id`, [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /starvl-users:', err.message);
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

module.exports = router;
