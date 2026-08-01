const express  = require('express');
const router   = express.Router();
const pool     = require('../db/pool');
const bcrypt   = require('bcryptjs');

const SALT_ROUNDS = 10;

function isBcryptHash(str) {
  return typeof str === 'string' && /^\$2[ab]\$\d{2}\$/.test(str);
}

// Cria tabela e migra colunas (idempotente)
pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_users (
    su_id         SERIAL       PRIMARY KEY,
    su_usuario    VARCHAR(100) NOT NULL UNIQUE,
    su_senha      VARCHAR(200) NOT NULL DEFAULT '',
    su_perfil     VARCHAR(20)  NOT NULL DEFAULT 'user',
    su_criado     TIMESTAMPTZ  DEFAULT NOW(),
    su_atualizado TIMESTAMPTZ  DEFAULT NOW()
  )
`)
  .then(() => pool.query(`ALTER TABLE starvl_users ADD COLUMN IF NOT EXISTS su_foto           TEXT`))
  .then(() => pool.query(`ALTER TABLE starvl_users ADD COLUMN IF NOT EXISTS su_nome           VARCHAR(150)`))
  .then(() => pool.query(`ALTER TABLE starvl_users ADD COLUMN IF NOT EXISTS su_email          VARCHAR(150)`))
  .then(() => pool.query(`ALTER TABLE starvl_users ADD COLUMN IF NOT EXISTS su_ativo          BOOLEAN NOT NULL DEFAULT true`))
  .then(() => pool.query(`ALTER TABLE starvl_users ADD COLUMN IF NOT EXISTS su_cargo          VARCHAR(100)`))
  .then(() => pool.query(`ALTER TABLE starvl_users ADD COLUMN IF NOT EXISTS su_empresa_acesso VARCHAR(200)`))
  .then(() => pool.query(`ALTER TABLE starvl_users ADD COLUMN IF NOT EXISTS su_profile_id     INTEGER`))
  .then(async () => {
    const { rows } = await pool.query('SELECT COUNT(*) AS n FROM starvl_users');
    if (parseInt(rows[0].n) === 0) {
      const hash = await bcrypt.hash('123456', SALT_ROUNDS);
      await pool.query(
        `INSERT INTO starvl_users (su_usuario, su_senha, su_perfil) VALUES ($1,$2,$3)`,
        ['admin', hash, 'admin']
      );
      console.log('[starvl_users] admin padrão criado com senha hasheada');
    }
  }).catch(err => console.error('[starvl_users] ensureTable:', err.message));

const SEL = `su_id, su_usuario, su_perfil, su_foto, su_nome, su_email, su_ativo, su_cargo, su_empresa_acesso, su_profile_id`;

const toRow = r => ({
  id:            r.su_id,
  usuario:       r.su_usuario,
  perfil:        r.su_perfil,
  foto:          r.su_foto           || null,
  nome:          r.su_nome           || null,
  email:         r.su_email          || null,
  ativo:         r.su_ativo !== false,
  cargo:         r.su_cargo          || null,
  empresaAcesso: r.su_empresa_acesso || null,
  profileId:     r.su_profile_id     || null,
});

// ── POST /api/starvl-users/auth ───────────────────────────────────────────────
router.post('/auth', async (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario?.trim() || !senha?.trim()) {
    return res.status(400).json({ ok: false, error: 'usuario e senha são obrigatórios' });
  }
  try {
    const result = await pool.query(
      `SELECT su_id, su_usuario, su_perfil, su_senha, su_foto
       FROM starvl_users
       WHERE LOWER(TRIM(su_usuario)) = LOWER(TRIM($1))
       LIMIT 1`,
      [usuario.trim()]
    );
    if (!result.rows.length) {
      return res.status(401).json({ ok: false, error: 'Usuário ou senha inválidos.' });
    }
    const u = result.rows[0];
    let valid = false;
    if (isBcryptHash(u.su_senha)) {
      valid = await bcrypt.compare(senha, u.su_senha);
    } else {
      valid = (senha === u.su_senha);
      if (valid) {
        const newHash = await bcrypt.hash(senha, SALT_ROUNDS);
        await pool.query(
          `UPDATE starvl_users SET su_senha=$1, su_atualizado=NOW() WHERE su_id=$2`,
          [newHash, u.su_id]
        );
        console.log(`[starvl_users] senha de "${u.su_usuario}" migrada para bcrypt`);
      }
    }
    if (!valid) return res.status(401).json({ ok: false, error: 'Usuário ou senha inválidos.' });
    res.json({ ok: true, id: u.su_id, usuario: u.su_usuario, perfil: u.su_perfil, foto: u.su_foto || null });
  } catch (err) {
    console.error('POST /starvl-users/auth:', err.message);
    res.status(500).json({ ok: false, error: 'Erro interno ao autenticar.' });
  }
});

// GET /api/starvl-users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT ${SEL} FROM starvl_users ORDER BY su_id`);
    res.json(result.rows.map(toRow));
  } catch (err) {
    console.error('GET /starvl-users:', err.message);
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
});

// POST /api/starvl-users
router.post('/', async (req, res) => {
  const { usuario, senha, perfil, foto, nome, email, ativo, cargo, empresaAcesso, profileId } = req.body;
  if (!usuario?.trim() || !senha?.trim())
    return res.status(400).json({ error: 'usuario e senha são obrigatórios' });
  try {
    const hash   = await bcrypt.hash(senha, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO starvl_users
         (su_usuario, su_senha, su_perfil, su_foto, su_nome, su_email, su_ativo, su_cargo, su_empresa_acesso, su_profile_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING ${SEL}`,
      [
        usuario.trim(), hash, perfil || 'user',
        foto || null, nome?.trim() || null, email?.trim() || null, ativo !== false,
        cargo?.trim() || null, empresaAcesso || null, profileId || null,
      ]
    );
    res.status(201).json(toRow(result.rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Usuário já existe' });
    console.error('POST /starvl-users:', err.message);
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
});

// PUT /api/starvl-users/:id
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { usuario, senha, perfil, foto, nome, email, ativo, cargo, empresaAcesso, profileId } = req.body;
  if (!usuario?.trim()) return res.status(400).json({ error: 'usuario é obrigatório' });
  try {
    let result;
    // shared param order: usuario, perfil, foto, nome, email, ativo, cargo, empresaAcesso, profileId
    const shared = [
      usuario.trim(), perfil || 'user',
      foto !== undefined ? foto : null, nome?.trim() || null, email?.trim() || null, ativo !== false,
      cargo?.trim() || null, empresaAcesso || null, profileId || null,
    ];
    if (senha?.trim()) {
      const hash = await bcrypt.hash(senha, SALT_ROUNDS);
      result = await pool.query(
        `UPDATE starvl_users
         SET su_usuario=$1, su_senha=$2, su_perfil=$3, su_foto=$4, su_nome=$5,
             su_email=$6, su_ativo=$7, su_cargo=$8, su_empresa_acesso=$9,
             su_profile_id=$10, su_atualizado=NOW()
         WHERE su_id=$11 RETURNING ${SEL}`,
        [shared[0], hash, ...shared.slice(1), id]
      );
    } else {
      result = await pool.query(
        `UPDATE starvl_users
         SET su_usuario=$1, su_perfil=$2, su_foto=$3, su_nome=$4, su_email=$5,
             su_ativo=$6, su_cargo=$7, su_empresa_acesso=$8, su_profile_id=$9, su_atualizado=NOW()
         WHERE su_id=$10 RETURNING ${SEL}`,
        [...shared, id]
      );
    }
    if (!result.rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(toRow(result.rows[0]));
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
    const result = await pool.query(`DELETE FROM starvl_users WHERE su_id=$1 RETURNING su_id`, [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /starvl-users:', err.message);
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

module.exports = router;
