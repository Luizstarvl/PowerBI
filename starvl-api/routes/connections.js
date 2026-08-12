const express    = require('express');
const router     = express.Router();
const pool       = require('../db/pool');
const net        = require('net');
const { Client } = require('pg');
const { requireAuth, requirePerm } = require('../middleware/auth');

// Cria/migra tabelas
pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_connections (
    sc_id           SERIAL        PRIMARY KEY,
    sc_nome         VARCHAR(200)  NOT NULL,
    sc_tipo         VARCHAR(50)   NOT NULL DEFAULT 'postgresql',
    sc_servidor     VARCHAR(300)  NOT NULL,
    sc_porta        INTEGER       NOT NULL DEFAULT 5432,
    sc_banco        VARCHAR(200)  NOT NULL,
    sc_usuario      VARCHAR(200),
    sc_senha        TEXT,
    sc_timeout      INTEGER       NOT NULL DEFAULT 30,
    sc_status       VARCHAR(20)   NOT NULL DEFAULT 'pending',
    sc_ultimo_teste TIMESTAMPTZ,
    sc_erro         TEXT,
    sc_criado       TIMESTAMPTZ   DEFAULT NOW()
  )
`).then(() =>
  pool.query(`ALTER TABLE starvl_connections ADD COLUMN IF NOT EXISTS sc_tipo_cliente VARCHAR(20) NOT NULL DEFAULT 'unica'`)
).then(() =>
  pool.query(`
    CREATE TABLE IF NOT EXISTS starvl_connection_empresas (
      sce_id         SERIAL  PRIMARY KEY,
      sce_conexao_id INTEGER NOT NULL REFERENCES starvl_connections(sc_id) ON DELETE CASCADE,
      sce_empresa_id INTEGER NOT NULL,
      UNIQUE(sce_conexao_id, sce_empresa_id)
    )
  `)
).catch(err => console.error('[starvl_connections] init:', err.message));

const toRow = r => ({
  id:           r.sc_id,
  nome:         r.sc_nome,
  tipo:         r.sc_tipo,
  servidor:     r.sc_servidor,
  porta:        r.sc_porta,
  banco:        r.sc_banco,
  usuario:      r.sc_usuario    || '',
  timeout:      r.sc_timeout,
  status:       r.sc_status,
  ultimoTeste:  r.sc_ultimo_teste,
  erro:         r.sc_erro       || null,
  criado:       r.sc_criado,
  tipoCliente:  r.sc_tipo_cliente || 'unica',
  empresasCount: parseInt(r.empresas_count || 0),
  empresas:     [],
});

async function getEmpresasByConexao(conexaoId) {
  const { rows } = await pool.query(
    `SELECT cl.sc_id AS id, cl.sc_nome AS nome, cl.sc_codigo AS codigo
     FROM starvl_connection_empresas sce
     JOIN starvl_clients cl ON cl.sc_id = sce.sce_empresa_id
     WHERE sce.sce_conexao_id = $1
     ORDER BY cl.sc_nome`,
    [conexaoId]
  );
  return rows.map(r => ({ id: r.id, nome: r.nome, codigo: r.codigo }));
}

async function syncEmpresas(dbClient, conexaoId, empresaIds, tipoCliente) {
  await dbClient.query('DELETE FROM starvl_connection_empresas WHERE sce_conexao_id = $1', [conexaoId]);
  const ids = tipoCliente === 'unica' ? empresaIds.slice(0, 1) : empresaIds;
  for (const eid of ids) {
    await dbClient.query(
      'INSERT INTO starvl_connection_empresas (sce_conexao_id, sce_empresa_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [conexaoId, eid]
    );
  }
}

async function testarConexao({ tipo, servidor, porta, banco, usuario, senha, timeout }) {
  const ms = (timeout || 30) * 1000;

  if (tipo === 'postgresql') {
    const client = new Client({
      host:                    servidor,
      port:                    porta || 5432,
      database:                banco,
      user:                    usuario || undefined,
      password:                senha   || undefined,
      connectionTimeoutMillis: Math.min(ms, 15000),
      ssl:                     { rejectUnauthorized: false },
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

  const t0 = Date.now();
  return new Promise(resolve => {
    const sock  = net.createConnection({ host: servidor, port: porta });
    const timer = setTimeout(() => {
      sock.destroy();
      resolve({ status: 'error', latencia: null, erro: `Timeout ao conectar em ${servidor}:${porta}` });
    }, Math.min(ms, 10000));
    sock.on('connect', () => {
      clearTimeout(timer); sock.destroy();
      resolve({ status: 'ok', latencia: Date.now() - t0, erro: null });
    });
    sock.on('error', err => {
      clearTimeout(timer);
      resolve({ status: 'error', latencia: null, erro: err.message });
    });
  });
}

router.use(requireAuth, requirePerm('configuracoes'));

/* ── GET all ─────────────────────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT sc.*, COUNT(sce.sce_empresa_id)::int AS empresas_count
      FROM starvl_connections sc
      LEFT JOIN starvl_connection_empresas sce ON sce.sce_conexao_id = sc.sc_id
      GROUP BY sc.sc_id
      ORDER BY sc.sc_criado DESC
    `);

    const { rows: assocs } = await pool.query(`
      SELECT sce.sce_conexao_id,
             cl.sc_id    AS id,
             cl.sc_nome  AS nome,
             cl.sc_codigo AS codigo
      FROM starvl_connection_empresas sce
      JOIN starvl_clients cl ON cl.sc_id = sce.sce_empresa_id
      ORDER BY cl.sc_nome
    `);

    const byConexao = {};
    for (const a of assocs) {
      if (!byConexao[a.sce_conexao_id]) byConexao[a.sce_conexao_id] = [];
      byConexao[a.sce_conexao_id].push({ id: a.id, nome: a.nome, codigo: a.codigo });
    }

    res.json(rows.map(r => ({ ...toRow(r), empresas: byConexao[r.sc_id] || [] })));
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
  const { nome, tipo, servidor, porta, banco, usuario, senha, timeout, tipoCliente, empresaIds } = req.body;
  if (!nome?.trim())     return res.status(400).json({ error: 'Nome é obrigatório.' });
  if (!servidor?.trim()) return res.status(400).json({ error: 'Servidor é obrigatório.' });
  if (!banco?.trim())    return res.status(400).json({ error: 'Banco é obrigatório.' });
  if (!Array.isArray(empresaIds) || empresaIds.length === 0)
    return res.status(400).json({ error: 'Vincule ao menos uma empresa à conexão.' });

  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');
    const { rows } = await dbClient.query(
      `INSERT INTO starvl_connections
         (sc_nome, sc_tipo, sc_servidor, sc_porta, sc_banco, sc_usuario, sc_senha, sc_timeout, sc_tipo_cliente)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [nome.trim(), tipo || 'postgresql', servidor.trim(), porta || 5432,
       banco.trim(), usuario?.trim() || null, senha || null, timeout || 30, tipoCliente || 'unica']
    );
    const conexao = rows[0];
    await syncEmpresas(dbClient, conexao.sc_id, empresaIds, tipoCliente || 'unica');
    await dbClient.query('COMMIT');
    const empresas = await getEmpresasByConexao(conexao.sc_id);
    res.status(201).json({ ...toRow(conexao), empresas, empresasCount: empresas.length });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('POST /connections:', err.message);
    res.status(500).json({ error: 'Erro ao criar conexão.' });
  } finally { dbClient.release(); }
});

/* ── PUT update ──────────────────────────────────────────────────────────────── */
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, tipo, servidor, porta, banco, usuario, senha, timeout, tipoCliente, empresaIds } = req.body;
  if (!nome?.trim()) return res.status(400).json({ error: 'Nome é obrigatório.' });
  if (!Array.isArray(empresaIds) || empresaIds.length === 0)
    return res.status(400).json({ error: 'Vincule ao menos uma empresa à conexão.' });

  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');
    let q, p;
    if (senha !== undefined && senha !== '') {
      q = `UPDATE starvl_connections
           SET sc_nome=$1,sc_tipo=$2,sc_servidor=$3,sc_porta=$4,sc_banco=$5,
               sc_usuario=$6,sc_senha=$7,sc_timeout=$8,sc_tipo_cliente=$9,
               sc_status='pending',sc_erro=NULL
           WHERE sc_id=$10 RETURNING *`;
      p = [nome.trim(), tipo || 'postgresql', servidor.trim(), porta || 5432,
           banco.trim(), usuario?.trim() || null, senha, timeout || 30, tipoCliente || 'unica', id];
    } else {
      q = `UPDATE starvl_connections
           SET sc_nome=$1,sc_tipo=$2,sc_servidor=$3,sc_porta=$4,sc_banco=$5,
               sc_usuario=$6,sc_timeout=$7,sc_tipo_cliente=$8,
               sc_status='pending',sc_erro=NULL
           WHERE sc_id=$9 RETURNING *`;
      p = [nome.trim(), tipo || 'postgresql', servidor.trim(), porta || 5432,
           banco.trim(), usuario?.trim() || null, timeout || 30, tipoCliente || 'unica', id];
    }
    const { rows } = await dbClient.query(q, p);
    if (!rows.length) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ error: 'Conexão não encontrada.' });
    }
    await syncEmpresas(dbClient, id, empresaIds, tipoCliente || 'unica');
    await dbClient.query('COMMIT');
    const empresas = await getEmpresasByConexao(id);
    res.json({ ...toRow(rows[0]), empresas, empresasCount: empresas.length });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('PUT /connections/:id:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar conexão.' });
  } finally { dbClient.release(); }
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
  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');
    // Desvincula consultas (starvl_queries) que apontavam para esta conexão
    // para evitar erro "Conexão não encontrada" em chamadas futuras.
    await dbClient.query(
      'UPDATE starvl_queries SET sq_banco_id = NULL WHERE sq_banco_id = $1',
      [id]
    );
    // FK ON DELETE CASCADE cuida do starvl_connection_empresas
    await dbClient.query('DELETE FROM starvl_connections WHERE sc_id=$1', [id]);
    await dbClient.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('DELETE /connections/:id:', err.message);
    res.status(500).json({ error: 'Erro ao excluir conexão.' });
  } finally { dbClient.release(); }
});

module.exports = router;
