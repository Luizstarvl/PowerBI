const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_tasks (
    tk_id             SERIAL       PRIMARY KEY,
    tk_titulo         VARCHAR(200) NOT NULL,
    tk_descricao      TEXT,
    tk_responsavel_id INTEGER      REFERENCES starvl_users(su_id) ON DELETE SET NULL,
    tk_prioridade     VARCHAR(10)  NOT NULL DEFAULT 'media',
    tk_prazo          DATE,
    tk_status         VARCHAR(20)  NOT NULL DEFAULT 'pendente',
    tk_categoria      VARCHAR(50),
    tk_empresa_id     INTEGER      REFERENCES starvl_clients(sc_id) ON DELETE CASCADE,
    tk_criado_por     INTEGER      REFERENCES starvl_users(su_id) ON DELETE SET NULL,
    tk_criado_em      TIMESTAMPTZ  DEFAULT NOW(),
    tk_atualizado_em  TIMESTAMPTZ  DEFAULT NOW()
  )
`)
  .then(() => pool.query(`
    CREATE TABLE IF NOT EXISTS starvl_task_favoritos (
      tf_user_id INTEGER NOT NULL REFERENCES starvl_users(su_id) ON DELETE CASCADE,
      tf_task_id INTEGER NOT NULL REFERENCES starvl_tasks(tk_id)  ON DELETE CASCADE,
      PRIMARY KEY (tf_user_id, tf_task_id)
    )
  `))
  .catch(err => console.error('[starvl_tasks] ensureTable:', err.message));

// "Atrasada" é calculado ao vivo (nunca fica stale no banco), mesma lógica
// usada pelos status computados de metas.js.
function computeStatus(row) {
  if (row.tk_status === 'concluida') return 'concluida';
  if (row.tk_prazo) {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const prazo = new Date(row.tk_prazo);
    if (prazo < hoje) return 'atrasada';
  }
  return row.tk_status;
}

const toRow = (r, favoritos) => ({
  id:           r.tk_id,
  titulo:       r.tk_titulo,
  descricao:    r.tk_descricao    || null,
  responsavelId: r.tk_responsavel_id || null,
  responsavelNome: r.responsavel_nome || null,
  prioridade:   r.tk_prioridade,
  prazo:        r.tk_prazo        || null,
  status:       computeStatus(r),
  categoria:    r.tk_categoria    || null,
  empresaId:    r.tk_empresa_id,
  criadoPor:    r.tk_criado_por   || null,
  criadoEm:     r.tk_criado_em,
  atualizadoEm: r.tk_atualizado_em,
  favorito:     favoritos ? favoritos.has(r.tk_id) : false,
});

const SEL = `t.tk_id, t.tk_titulo, t.tk_descricao, t.tk_responsavel_id, t.tk_prioridade,
             t.tk_prazo, t.tk_status, t.tk_categoria, t.tk_empresa_id, t.tk_criado_por,
             t.tk_criado_em, t.tk_atualizado_em, u.su_nome AS responsavel_nome`;

// ── GET /api/tasks?empresa=&status=&prioridade=&responsavel=&busca=&userId= ───
router.get('/', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório.' });
  const { status, prioridade, responsavel, busca, favoritos: soFavoritos, userId } = req.query;

  const where  = ['t.tk_empresa_id = $1'];
  const params = [empresa];
  if (status && status !== 'atrasada') { params.push(status); where.push(`t.tk_status = $${params.length}`); }
  if (prioridade) { params.push(prioridade); where.push(`t.tk_prioridade = $${params.length}`); }
  if (responsavel) { params.push(parseInt(responsavel)); where.push(`t.tk_responsavel_id = $${params.length}`); }
  if (busca) { params.push(`%${busca}%`); where.push(`t.tk_titulo ILIKE $${params.length}`); }

  try {
    const result = await pool.query(
      `SELECT ${SEL} FROM starvl_tasks t
       LEFT JOIN starvl_users u ON u.su_id = t.tk_responsavel_id
       WHERE ${where.join(' AND ')}
       ORDER BY t.tk_prazo NULLS LAST, t.tk_criado_em DESC`,
      params
    );

    let favoritosSet = new Set();
    if (userId) {
      const { rows: favs } = await pool.query(
        `SELECT tf_task_id FROM starvl_task_favoritos WHERE tf_user_id = $1`, [parseInt(userId)]
      );
      favoritosSet = new Set(favs.map(f => f.tf_task_id));
    }

    let rows = result.rows.map(r => toRow(r, favoritosSet));
    if (status === 'atrasada') rows = rows.filter(r => r.status === 'atrasada');
    if (soFavoritos === 'true') rows = rows.filter(r => r.favorito);

    res.json(rows);
  } catch (err) {
    console.error('GET /tasks:', err.message);
    res.status(500).json({ error: 'Erro ao listar tarefas.' });
  }
});

// ── POST /api/tasks ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { titulo, descricao, responsavelId, prioridade, prazo, categoria, empresaId, criadoPor } = req.body;
  if (!titulo?.trim() || !empresaId) {
    return res.status(400).json({ error: 'titulo e empresaId são obrigatórios.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO starvl_tasks
         (tk_titulo, tk_descricao, tk_responsavel_id, tk_prioridade, tk_prazo, tk_categoria, tk_empresa_id, tk_criado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING tk_id, tk_titulo, tk_descricao, tk_responsavel_id, tk_prioridade,
                 tk_prazo, tk_status, tk_categoria, tk_empresa_id, tk_criado_por, tk_criado_em, tk_atualizado_em`,
      [
        titulo.trim(), descricao?.trim() || null, responsavelId || null,
        prioridade || 'media', prazo || null, categoria || null, empresaId, criadoPor || null,
      ]
    );
    res.status(201).json(toRow(result.rows[0]));
  } catch (err) {
    console.error('POST /tasks:', err.message);
    res.status(500).json({ error: 'Erro ao criar tarefa.' });
  }
});

// ── PUT /api/tasks/:id ──────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { titulo, descricao, responsavelId, prioridade, prazo, status, categoria } = req.body;
  if (!titulo?.trim()) return res.status(400).json({ error: 'titulo é obrigatório.' });
  try {
    const result = await pool.query(
      `UPDATE starvl_tasks
       SET tk_titulo=$1, tk_descricao=$2, tk_responsavel_id=$3, tk_prioridade=$4,
           tk_prazo=$5, tk_status=$6, tk_categoria=$7, tk_atualizado_em=NOW()
       WHERE tk_id=$8
       RETURNING tk_id, tk_titulo, tk_descricao, tk_responsavel_id, tk_prioridade,
                 tk_prazo, tk_status, tk_categoria, tk_empresa_id, tk_criado_por, tk_criado_em, tk_atualizado_em`,
      [
        titulo.trim(), descricao?.trim() || null, responsavelId || null,
        prioridade || 'media', prazo || null, status || 'pendente', categoria || null, id,
      ]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Tarefa não encontrada.' });
    res.json(toRow(result.rows[0]));
  } catch (err) {
    console.error('PUT /tasks:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
  }
});

// ── DELETE /api/tasks/:id ────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query(`DELETE FROM starvl_tasks WHERE tk_id=$1 RETURNING tk_id`, [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Tarefa não encontrada.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /tasks:', err.message);
    res.status(500).json({ error: 'Erro ao excluir tarefa.' });
  }
});

// ── POST /api/tasks/:id/favorito { userId, favorito } ─────────────────────────
router.post('/:id/favorito', async (req, res) => {
  const id = parseInt(req.params.id);
  const { userId, favorito } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório.' });
  try {
    if (favorito) {
      await pool.query(
        `INSERT INTO starvl_task_favoritos (tf_user_id, tf_task_id) VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [userId, id]
      );
    } else {
      await pool.query(
        `DELETE FROM starvl_task_favoritos WHERE tf_user_id=$1 AND tf_task_id=$2`,
        [userId, id]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /tasks/:id/favorito:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar favorito.' });
  }
});

module.exports = router;
