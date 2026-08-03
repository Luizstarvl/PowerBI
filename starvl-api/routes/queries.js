/**
 * routes/queries.js
 * Gerenciador de Consultas SQL — CRUD, versionamento, teste e execução segura.
 * Todas as consultas são executadas diretamente no banco do ERP (starvl_connections).
 * Apenas SELECT e CTEs WITH são permitidos. Toda escrita é bloqueada.
 */
const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { Client } = require('pg');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ── Tabelas ────────────────────────────────────────────────────────────────────
pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_queries (
    sq_id         SERIAL        PRIMARY KEY,
    sq_codigo     VARCHAR(100)  NOT NULL UNIQUE,
    sq_nome       VARCHAR(200)  NOT NULL,
    sq_categoria  VARCHAR(50)   NOT NULL DEFAULT 'Outros',
    sq_descricao  TEXT,
    sq_banco_id   INTEGER,
    sq_sql        TEXT          NOT NULL DEFAULT '',
    sq_ativa      BOOLEAN       NOT NULL DEFAULT true,
    sq_versao     INTEGER       NOT NULL DEFAULT 1,
    sq_usuario    VARCHAR(100),
    sq_criado     TIMESTAMPTZ   DEFAULT NOW(),
    sq_atualizado TIMESTAMPTZ   DEFAULT NOW()
  )
`).then(() => pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_queries_historico (
    sqh_id        SERIAL       PRIMARY KEY,
    sqh_query_id  INTEGER      NOT NULL REFERENCES starvl_queries(sq_id) ON DELETE CASCADE,
    sqh_versao    INTEGER      NOT NULL,
    sqh_sql       TEXT         NOT NULL,
    sqh_usuario   VARCHAR(100),
    sqh_motivo    VARCHAR(500),
    sqh_criado    TIMESTAMPTZ  DEFAULT NOW()
  )
`)).catch(err => console.error('[starvl_queries] init:', err.message));

// ── Segurança SQL ──────────────────────────────────────────────────────────────
const FORBIDDEN_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE',
  'MERGE', 'EXEC', 'EXECUTE', 'GRANT', 'REVOKE', 'COMMIT', 'ROLLBACK',
  'BEGIN', 'SAVEPOINT', 'VACUUM', 'COPY', 'LOCK', 'CALL',
];

function validateSQL(sql) {
  if (!sql?.trim()) throw new Error('A SQL não pode estar vazia.');

  const clean = sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .trim()
    .toUpperCase();

  if (!/^(SELECT|WITH)\b/.test(clean)) {
    throw new Error('Somente SELECT é permitido. A consulta deve iniciar com SELECT ou WITH (CTE).');
  }

  for (const kw of FORBIDDEN_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`).test(clean)) {
      throw new Error(`Comando "${kw}" não é permitido. Apenas consultas de leitura são aceitas.`);
    }
  }
}

// Substituição simples de parâmetros nomeados {{CHAVE}} por valores sanitizados
function applyParams(sql, params = {}) {
  let result = sql;
  for (const [key, value] of Object.entries(params)) {
    const safe = String(value).replace(/['";\\]/g, '');
    result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), safe);
  }
  return result;
}

// Executa SQL em uma starvl_connection; usa READ ONLY como segunda camada de proteção
async function executeOnConnection(sql, bancoId, timeoutMs = 30000) {
  const { rows } = await pool.query(
    'SELECT sc_servidor, sc_porta, sc_banco, sc_usuario, sc_senha, sc_timeout FROM starvl_connections WHERE sc_id = $1',
    [bancoId]
  );
  if (!rows.length) throw new Error('Conexão não encontrada.');
  const c = rows[0];

  const timeout = Math.min((c.sc_timeout || 30) * 1000, timeoutMs);
  const client  = new Client({
    host:                    c.sc_servidor,
    port:                    c.sc_porta,
    database:                c.sc_banco,
    user:                    c.sc_usuario || undefined,
    password:                c.sc_senha   || undefined,
    connectionTimeoutMillis: timeout,
    statement_timeout:       timeout,
    ssl:                     { rejectUnauthorized: false },
  });

  const t0 = Date.now();
  try {
    await client.connect();
    await client.query('BEGIN TRANSACTION READ ONLY');
    const result = await client.query(sql);
    await client.query('COMMIT');
    return {
      columns:       result.fields?.map(f => f.name) || [],
      rows:          result.rows,
      rowCount:      result.rowCount,
      executionTime: Date.now() - t0,
    };
  } finally {
    try { await client.end(); } catch {}
  }
}

const toRow = r => ({
  id:         r.sq_id,
  codigo:     r.sq_codigo,
  nome:       r.sq_nome,
  categoria:  r.sq_categoria,
  descricao:  r.sq_descricao  || null,
  bancoId:    r.sq_banco_id   || null,
  sql:        r.sq_sql        || '',
  ativa:      r.sq_ativa,
  versao:     r.sq_versao,
  usuario:    r.sq_usuario    || null,
  criado:     r.sq_criado,
  atualizado: r.sq_atualizado,
});

// ── GET / — lista com filtros ─────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { q, categoria, ativa } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      where += ` AND (LOWER(sq_nome) LIKE $${params.length} OR LOWER(sq_codigo) LIKE $${params.length})`;
    }
    if (categoria) { params.push(categoria); where += ` AND sq_categoria = $${params.length}`; }
    if (ativa !== undefined && ativa !== '') { params.push(ativa === 'true'); where += ` AND sq_ativa = $${params.length}`; }

    const { rows } = await pool.query(
      `SELECT sq_id,sq_codigo,sq_nome,sq_categoria,sq_banco_id,sq_ativa,sq_versao,sq_usuario,sq_criado,sq_atualizado,'' AS sq_sql
       FROM starvl_queries ${where} ORDER BY sq_categoria, sq_nome`,
      params
    );
    res.json(rows.map(toRow));
  } catch (err) {
    console.error('GET /queries:', err.message);
    res.status(500).json({ error: 'Erro ao listar consultas.' });
  }
});

// ── GET /:id — detalhes completos (com SQL) ───────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM starvl_queries WHERE sq_id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Consulta não encontrada.' });
    res.json(toRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar consulta.' });
  }
});

// ── POST / — criar ────────────────────────────────────────────────────────────
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { codigo, nome, categoria, descricao, bancoId, sql, ativa } = req.body;
  if (!codigo?.trim()) return res.status(400).json({ error: 'Código é obrigatório.' });
  if (!nome?.trim())   return res.status(400).json({ error: 'Nome é obrigatório.' });
  if (!sql?.trim())    return res.status(400).json({ error: 'SQL é obrigatória.' });

  try {
    validateSQL(sql);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO starvl_queries (sq_codigo,sq_nome,sq_categoria,sq_descricao,sq_banco_id,sq_sql,sq_ativa,sq_usuario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        codigo.trim().toUpperCase(), nome.trim(), categoria || 'Outros',
        descricao?.trim() || null, bancoId || null, sql.trim(),
        ativa !== false, req.user.usuario,
      ]
    );
    res.status(201).json(toRow(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Já existe uma consulta com este código.' });
    console.error('POST /queries:', err.message);
    res.status(500).json({ error: 'Erro ao criar consulta.' });
  }
});

// ── PUT /:id — atualizar + salvar versão ──────────────────────────────────────
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { codigo, nome, categoria, descricao, bancoId, sql, ativa, motivo } = req.body;
  if (!codigo?.trim()) return res.status(400).json({ error: 'Código é obrigatório.' });
  if (!nome?.trim())   return res.status(400).json({ error: 'Nome é obrigatório.' });
  if (!sql?.trim())    return res.status(400).json({ error: 'SQL é obrigatória.' });

  try {
    validateSQL(sql);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  try {
    // Busca SQL atual para salvar no histórico se mudou
    const curr = await pool.query('SELECT sq_sql, sq_versao FROM starvl_queries WHERE sq_id=$1', [id]);
    if (!curr.rows.length) return res.status(404).json({ error: 'Consulta não encontrada.' });

    const oldSql   = curr.rows[0].sq_sql;
    const newVersao = curr.rows[0].sq_versao + 1;

    if (oldSql !== sql.trim()) {
      await pool.query(
        `INSERT INTO starvl_queries_historico (sqh_query_id, sqh_versao, sqh_sql, sqh_usuario, sqh_motivo)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, curr.rows[0].sq_versao, oldSql, req.user.usuario, motivo?.trim() || null]
      );
    }

    const { rows } = await pool.query(
      `UPDATE starvl_queries
       SET sq_codigo=$1, sq_nome=$2, sq_categoria=$3, sq_descricao=$4, sq_banco_id=$5,
           sq_sql=$6, sq_ativa=$7, sq_versao=$8, sq_usuario=$9, sq_atualizado=NOW()
       WHERE sq_id=$10 RETURNING *`,
      [
        codigo.trim().toUpperCase(), nome.trim(), categoria || 'Outros',
        descricao?.trim() || null, bancoId || null, sql.trim(),
        ativa !== false, newVersao, req.user.usuario, id,
      ]
    );
    res.json(toRow(rows[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Já existe uma consulta com este código.' });
    console.error('PUT /queries/:id:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar consulta.' });
  }
});

// ── DELETE /:id ───────────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM starvl_queries WHERE sq_id=$1 RETURNING sq_id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Consulta não encontrada.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /queries/:id:', err.message);
    res.status(500).json({ error: 'Erro ao excluir consulta.' });
  }
});

// ── POST /:id/duplicate ───────────────────────────────────────────────────────
router.post('/:id/duplicate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM starvl_queries WHERE sq_id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Consulta não encontrada.' });
    const orig  = rows[0];
    const novo  = `${orig.sq_codigo}_COPIA`;
    const { rows: dup } = await pool.query(
      `INSERT INTO starvl_queries (sq_codigo,sq_nome,sq_categoria,sq_descricao,sq_banco_id,sq_sql,sq_ativa,sq_usuario)
       VALUES ($1,$2,$3,$4,$5,$6,false,$7) RETURNING *`,
      [`${novo.slice(0, 99)}`, `${orig.sq_nome} (Cópia)`, orig.sq_categoria, orig.sq_descricao, orig.sq_banco_id, orig.sq_sql, req.user.usuario]
    );
    res.status(201).json(toRow(dup[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Código duplicado já existe. Renomeie o original primeiro.' });
    console.error('POST /queries/:id/duplicate:', err.message);
    res.status(500).json({ error: 'Erro ao duplicar consulta.' });
  }
});

// ── GET /:id/historico ────────────────────────────────────────────────────────
router.get('/:id/historico', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT sqh_id, sqh_versao, sqh_usuario, sqh_motivo, sqh_sql, sqh_criado
       FROM starvl_queries_historico
       WHERE sqh_query_id = $1
       ORDER BY sqh_versao DESC`,
      [req.params.id]
    );
    res.json(rows.map(r => ({
      id:      r.sqh_id,
      versao:  r.sqh_versao,
      usuario: r.sqh_usuario,
      motivo:  r.sqh_motivo,
      sql:     r.sqh_sql,
      criado:  r.sqh_criado,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar histórico.' });
  }
});

// ── POST /:id/test — testa a SQL cadastrada no banco configurado ───────────────
router.post('/:id/test', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT sq_sql, sq_banco_id FROM starvl_queries WHERE sq_id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Consulta não encontrada.' });

    const { sq_sql, sq_banco_id } = rows[0];
    if (!sq_banco_id) return res.status(400).json({ error: 'Nenhuma conexão de banco configurada para esta consulta.' });

    validateSQL(sq_sql);
    const result = await executeOnConnection(sq_sql, sq_banco_id);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ── POST /test-sql — testa SQL avulsa (usada no editor antes de salvar) ────────
router.post('/test-sql', requireAuth, requireAdmin, async (req, res) => {
  const { sql, bancoId, params } = req.body;
  if (!sql?.trim())  return res.status(400).json({ ok: false, error: 'SQL é obrigatória.' });
  if (!bancoId)      return res.status(400).json({ ok: false, error: 'Selecione uma conexão de banco.' });

  try {
    validateSQL(sql);
    const finalSql = params && typeof params === 'object' ? applyParams(sql, params) : sql;
    const result = await executeOnConnection(finalSql, bancoId);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ── GET /execute/:codigo — executa consulta pelo código (uso interno) ──────────
router.get('/execute/:codigo', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT sq_sql, sq_banco_id, sq_ativa FROM starvl_queries WHERE UPPER(sq_codigo) = UPPER($1)',
      [req.params.codigo]
    );
    if (!rows.length) return res.status(404).json({ error: `Consulta '${req.params.codigo}' não encontrada.` });

    const q = rows[0];
    if (!q.sq_ativa) return res.status(403).json({ error: `Consulta '${req.params.codigo}' está inativa.` });
    if (!q.sq_banco_id) return res.status(400).json({ error: 'Consulta sem conexão de banco configurada.' });

    // Aplica parâmetros da query string como {{CHAVE}}
    const sql = applyParams(q.sq_sql, req.query);
    validateSQL(sql);

    const result = await executeOnConnection(sql, q.sq_banco_id);
    res.json({ ok: true, codigo: req.params.codigo, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
