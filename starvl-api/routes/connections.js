const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const net     = require('net');
const { Client } = require('pg');
const { requireAuth, requirePerm } = require('../middleware/auth');

pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_connections (
    sc_id          SERIAL        PRIMARY KEY,
    sc_nome        VARCHAR(200)  NOT NULL,
    sc_tipo        VARCHAR(50)   NOT NULL DEFAULT 'postgresql',
    sc_servidor    VARCHAR(300)  NOT NULL,
    sc_porta       INTEGER       NOT NULL DEFAULT 5432,
    sc_banco       VARCHAR(200)  NOT NULL,
    sc_usuario     VARCHAR(200),
    sc_senha       TEXT,
    sc_timeout     INTEGER       NOT NULL DEFAULT 30,
    sc_status      VARCHAR(20)   NOT NULL DEFAULT 'pending',
    sc_ultimo_teste TIMESTAMPTZ,
    sc_erro        TEXT,
    sc_criado      TIMESTAMPTZ   DEFAULT NOW()
  )
`).catch(err => console.error('[starvl_connections] init:', err.message));

const toRow = r => ({
  id:          r.sc_id,
  nome:        r.sc_nome,
  tipo:        r.sc_tipo,
  servidor:    r.sc_servidor,
  porta:       r.sc_porta,
  banco:       r.sc_banco,
  usuario:     r.sc_usuario  || '',
  timeout:     r.sc_timeout,
  status:      r.sc_status,
  ultimoTeste: r.sc_ultimo_teste,
  erro:        r.sc_erro || null,
  criado:      r.sc_criado,
});

async function testarConexao({ tipo, servidor, porta, banco, usuario, senha, timeout }) {
  const ms = (timeout || 30) * 1000;

  if (tipo === 'postgresql') {
    const client = new Client({
      host:                     servidor,
      port:                     porta || 5432,
      database:                 banco,
      user:                     usuario || undefined,
      password:                 senha   || undefined,
      connectionTimeoutMillis:  Math.min(ms, 15000),
      ssl:                      { rejectUnauthorized: false },
    });
    const t0 = Date.now();
    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      return { status: 'ok', latencia: Date.now() - t0, erro: null };
    } catch (err) {
      try { await client.end(); } catch {}
      return { status: 'error', latencia: null, erro: err.message };
    }
  }

  // Demais tipos: verifica alcance TCP
  const t0 = Date.now();
  return new Promise(resolve => {
    const sock  = net.createConnection({ host: servidor, port: porta });
    const timer = setTimeout(() => {
      sock.destroy();
      resolve({ status: 'error', latencia: null, erro: `Timeout ao conectar em ${servidor}:${porta}` });
    }, Math.min(ms, 10000));
    sock.on('connect', () => {
      clearTimeout(timer);
      sock.destroy();
      resolve({ status: 'ok', latencia: Date.now() - t0, erro: null });
    });
    sock.on('error', err => {
      clearTimeout(timer);
      resolve({ status: 'error', latencia: null, erro: err.message });
    });
  });
}

// Todas as rotas de conexão exigem autenticação + permissão de configurações
router.use(requireAuth, requirePerm('configuracoes'));

/* ── GET all ─────────────────────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM starvl_connections ORDER BY sc_criado DESC');
    res.json(rows.map(toRow));
  } catch (err) {
    console.error('GET /connections:', err.message);
    res.status(500).json({ error: 'Erro ao listar conexões.' });
  }
});

/* ── POST test (sem salvar) ──────────────────────────────────────────────────── */
router.post('/test', async (req, res) => {
  const { tipo, servidor, porta, banco, usuario, senha, timeout } = req.body;
  if (!servidor?.trim() || !banco?.trim())
    return res.status(400).json({ error: 'Servidor e Banco são obrigatórios para o teste.' });
  try {
    const result = await testarConexao({ tipo, servidor, porta, banco, usuario, senha, timeout });
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', erro: err.message });
  }
});

/* ── POST create ─────────────────────────────────────────────────────────────── */
router.post('/', async (req, res) => {
  const { nome, tipo, servidor, porta, banco, usuario, senha, timeout } = req.body;
  if (!nome?.trim())     return res.status(400).json({ error: 'Nome é obrigatório.' });
  if (!servidor?.trim()) return res.status(400).json({ error: 'Servidor é obrigatório.' });
  if (!banco?.trim())    return res.status(400).json({ error: 'Banco é obrigatório.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO starvl_connections
         (sc_nome, sc_tipo, sc_servidor, sc_porta, sc_banco, sc_usuario, sc_senha, sc_timeout)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [nome.trim(), tipo || 'postgresql', servidor.trim(), porta || 5432,
       banco.trim(), usuario?.trim() || null, senha || null, timeout || 30]
    );
    res.status(201).json(toRow(rows[0]));
  } catch (err) {
    console.error('POST /connections:', err.message);
    res.status(500).json({ error: 'Erro ao criar conexão.' });
  }
});

/* ── PUT update ──────────────────────────────────────────────────────────────── */
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, tipo, servidor, porta, banco, usuario, senha, timeout } = req.body;
  if (!nome?.trim()) return res.status(400).json({ error: 'Nome é obrigatório.' });
  try {
    let q, p;
    if (senha !== undefined && senha !== '') {
      q = `UPDATE starvl_connections
           SET sc_nome=$1,sc_tipo=$2,sc_servidor=$3,sc_porta=$4,sc_banco=$5,
               sc_usuario=$6,sc_senha=$7,sc_timeout=$8,sc_status='pending',sc_erro=NULL
           WHERE sc_id=$9 RETURNING *`;
      p = [nome.trim(), tipo || 'postgresql', servidor.trim(), porta || 5432,
           banco.trim(), usuario?.trim() || null, senha, timeout || 30, id];
    } else {
      q = `UPDATE starvl_connections
           SET sc_nome=$1,sc_tipo=$2,sc_servidor=$3,sc_porta=$4,sc_banco=$5,
               sc_usuario=$6,sc_timeout=$7,sc_status='pending',sc_erro=NULL
           WHERE sc_id=$8 RETURNING *`;
      p = [nome.trim(), tipo || 'postgresql', servidor.trim(), porta || 5432,
           banco.trim(), usuario?.trim() || null, timeout || 30, id];
    }
    const { rows } = await pool.query(q, p);
    if (!rows.length) return res.status(404).json({ error: 'Conexão não encontrada.' });
    res.json(toRow(rows[0]));
  } catch (err) {
    console.error('PUT /connections/:id:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar conexão.' });
  }
});

/* ── POST /:id/test ──────────────────────────────────────────────────────────── */
router.post('/:id/test', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const { rows } = await pool.query('SELECT * FROM starvl_connections WHERE sc_id=$1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Conexão não encontrada.' });
    const c = rows[0];
    const result = await testarConexao({
      tipo: c.sc_tipo, servidor: c.sc_servidor, porta: c.sc_porta,
      banco: c.sc_banco, usuario: c.sc_usuario, senha: c.sc_senha, timeout: c.sc_timeout,
    });
    await pool.query(
      `UPDATE starvl_connections SET sc_status=$1, sc_ultimo_teste=NOW(), sc_erro=$2 WHERE sc_id=$3`,
      [result.status, result.erro, id]
    );
    res.json({ ...result, ultimoTeste: new Date().toISOString() });
  } catch (err) {
    console.error('POST /connections/:id/test:', err.message);
    res.status(500).json({ status: 'error', erro: err.message });
  }
});

/* ── DELETE ──────────────────────────────────────────────────────────────────── */
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await pool.query('DELETE FROM starvl_connections WHERE sc_id=$1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /connections/:id:', err.message);
    res.status(500).json({ error: 'Erro ao excluir conexão.' });
  }
});

module.exports = router;
