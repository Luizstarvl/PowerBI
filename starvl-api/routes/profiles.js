const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');

pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_profiles (
    sp_id        SERIAL       PRIMARY KEY,
    sp_nome      VARCHAR(100) NOT NULL UNIQUE,
    sp_descricao TEXT,
    sp_permissoes JSONB       NOT NULL DEFAULT '{}',
    sp_builtin   BOOLEAN      NOT NULL DEFAULT false,
    sp_criado    TIMESTAMPTZ  DEFAULT NOW()
  )
`).then(() => pool.query(`ALTER TABLE starvl_profiles ADD COLUMN IF NOT EXISTS sp_is_admin BOOLEAN NOT NULL DEFAULT false`))
  .then(async () => {
  const defaults = [
    { nome: 'Administrador', builtin: true,  isAdmin: true,  desc: 'Acesso total ao sistema.',                             perm: { dashboards: 'todos',   configuracoes: true,  postos: 'todos',    modo: 'completo' } },
    { nome: 'Diretoria',     builtin: false, isAdmin: false, desc: 'Todos os dashboards, sem acesso às configurações.',    perm: { dashboards: 'todos',   configuracoes: false, postos: 'todos',    modo: 'completo' } },
    { nome: 'Gerente',       builtin: false, isAdmin: false, desc: 'Dashboards apenas do próprio posto.',                  perm: { dashboards: 'todos',   configuracoes: false, postos: 'proprios', modo: 'completo' } },
    { nome: 'Financeiro',    builtin: false, isAdmin: false, desc: 'Fluxo de Caixa, Contas a Receber e Despesas.',         perm: { dashboards: ['fluxo_caixa','contas_receber','despesas'], configuracoes: false, postos: 'proprios', modo: 'completo' } },
    { nome: 'Operador',      builtin: false, isAdmin: false, desc: 'Somente consulta de dados, sem edições.',              perm: { dashboards: 'todos',   configuracoes: false, postos: 'proprios', modo: 'consulta' } },
  ];
  for (const p of defaults) {
    await pool.query(
      `INSERT INTO starvl_profiles (sp_nome, sp_descricao, sp_permissoes, sp_builtin, sp_is_admin)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (sp_nome) DO NOTHING`,
      [p.nome, p.desc, JSON.stringify(p.perm), p.builtin, !!p.isAdmin]
    );
  }
  // Garante que o perfil Administrador existente tenha sp_is_admin = true
  await pool.query(`UPDATE starvl_profiles SET sp_is_admin = true WHERE sp_nome = 'Administrador' AND sp_is_admin = false`);
  // Corrige registros existentes: apenas Administrador permanece builtin
  await pool.query(
    `UPDATE starvl_profiles SET sp_builtin = false WHERE sp_nome != 'Administrador' AND sp_builtin = true`
  );
}).catch(err => console.error('[starvl_profiles] init:', err.message));

const toRow = r => ({
  id:         r.sp_id,
  nome:       r.sp_nome,
  descricao:  r.sp_descricao || '',
  permissoes: r.sp_permissoes || {},
  builtin:    r.sp_builtin,
  isAdmin:    r.sp_is_admin || false,
  criado:     r.sp_criado,
});

// Leitura: qualquer usuário autenticado (precisa para popular dropdowns)
// Escrita: somente admin
router.use(requireAuth);
router.use((req, res, next) => {
  if (req.method !== 'GET') return requireAdmin(req, res, next);
  next();
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM starvl_profiles ORDER BY sp_id');
    res.json(rows.map(toRow));
  } catch (err) {
    console.error('GET /profiles:', err.message);
    res.status(500).json({ error: 'Erro ao listar perfis.' });
  }
});

router.post('/', async (req, res) => {
  const { nome, descricao, permissoes, isAdmin } = req.body;
  if (!nome?.trim()) return res.status(400).json({ error: 'nome é obrigatório.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO starvl_profiles (sp_nome, sp_descricao, sp_permissoes, sp_is_admin)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [nome.trim(), descricao?.trim() || null, JSON.stringify(permissoes || {}), !!isAdmin]
    );
    res.status(201).json(toRow(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Perfil já existe.' });
    console.error('POST /profiles:', err.message);
    res.status(500).json({ error: 'Erro ao criar perfil.' });
  }
});

router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, descricao, permissoes, isAdmin } = req.body;
  if (!nome?.trim()) return res.status(400).json({ error: 'nome é obrigatório.' });
  try {
    const { rows } = await pool.query(
      `UPDATE starvl_profiles SET sp_nome=$1, sp_descricao=$2, sp_permissoes=$3, sp_is_admin=$4
       WHERE sp_id=$5 RETURNING *`,
      [nome.trim(), descricao?.trim() || null, JSON.stringify(permissoes || {}), !!isAdmin, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Perfil não encontrado.' });
    res.json(toRow(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Perfil já existe.' });
    console.error('PUT /profiles:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const { rows } = await pool.query('SELECT sp_builtin FROM starvl_profiles WHERE sp_id=$1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Perfil não encontrado.' });
    if (rows[0].sp_builtin) return res.status(403).json({ error: 'Perfis padrão não podem ser excluídos.' });
    await pool.query('DELETE FROM starvl_profiles WHERE sp_id=$1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /profiles:', err.message);
    res.status(500).json({ error: 'Erro ao excluir perfil.' });
  }
});

module.exports = router;
