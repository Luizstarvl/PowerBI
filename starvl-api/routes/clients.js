/**
 * routes/clients.js
 * CRUD de clientes (postos) — apenas para leitura de dados SGA.
 * Credenciais de banco NUNCA são retornadas ao frontend.
 */
const express      = require('express');
const router       = express.Router();
const { mainPool, registerClient, unregisterClient } = require('../db/poolManager');

// Serializa sem expor credenciais
const toPublic = r => ({
  id:            r.sc_id,
  nome:          r.sc_nome,
  codigoEmpresa: r.sc_codigo,
  banco:         r.sc_banco,
  // host somente se diferente do padrão (para o front saber que é custom)
  hasCustomHost: !!(r.sc_host),
  criado:        r.sc_criado,
});

// GET /api/clients — lista todos os clientes (sem credenciais)
router.get('/', async (req, res) => {
  try {
    const { rows } = await mainPool.query(
      `SELECT sc_id, sc_nome, sc_codigo, sc_banco, sc_host, sc_criado
       FROM starvl_clients ORDER BY sc_id`
    );
    res.json(rows.map(toPublic));
  } catch (err) {
    console.error('GET /clients:', err.message);
    res.status(500).json({ error: 'Erro ao listar clientes.' });
  }
});

// POST /api/clients — adiciona novo cliente
// Body: { nome, codigoEmpresa, banco, host?, port?, dbUser?, dbPass? }
router.post('/', async (req, res) => {
  const { nome, codigoEmpresa, banco, host, port, dbUser, dbPass } = req.body;

  if (!nome?.trim() || !codigoEmpresa || !banco?.trim()) {
    return res.status(400).json({ error: 'nome, codigoEmpresa e banco são obrigatórios.' });
  }

  const codigo = parseInt(codigoEmpresa);
  if (isNaN(codigo) || codigo <= 0) {
    return res.status(400).json({ error: 'codigoEmpresa deve ser um número positivo.' });
  }

  try {
    // Verifica se a empresa já existe
    const { rows: existing } = await mainPool.query(
      'SELECT sc_id FROM starvl_clients WHERE sc_codigo = $1', [codigo]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: `Empresa ${codigo} já está cadastrada.` });
    }

    // Registra temporariamente para testar a conexão ANTES de salvar
    const { queryFor } = require('../db/poolManager');
    registerClient({ codigoEmpresa: codigo, dbName: banco, host, port, dbUser, dbPass });
    const testQuery = queryFor(codigo);
    try {
      await testQuery(`SELECT 1`, []);
    } catch (connErr) {
      // Desfaz o registro temporário
      unregisterClient(codigo);
      return res.status(400).json({
        error: `Não foi possível conectar ao banco "${banco}": ${connErr.message}`,
      });
    }

    // Salva no banco de gestão
    const { rows } = await mainPool.query(
      `INSERT INTO starvl_clients (sc_nome, sc_codigo, sc_banco, sc_host, sc_port, sc_user, sc_pass)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING sc_id, sc_nome, sc_codigo, sc_banco, sc_host, sc_criado`,
      [
        nome.trim(),
        codigo,
        banco.trim(),
        host?.trim()   || null,
        port ? parseInt(port) : null,
        dbUser?.trim() || null,
        dbPass         || null,   // armazena como está (sem hash — é senha de banco, não de usuário)
      ]
    );

    console.log(`[clients] novo cliente adicionado: "${nome}" (empresa ${codigo}, banco "${banco}")`);
    res.status(201).json(toPublic(rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `Empresa ${codigo} já está cadastrada.` });
    }
    console.error('POST /clients:', err.message);
    res.status(500).json({ error: 'Erro ao adicionar cliente.' });
  }
});

// DELETE /api/clients/:id — remove cliente
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const { rows } = await mainPool.query(
      `DELETE FROM starvl_clients WHERE sc_id = $1
       RETURNING sc_id, sc_nome, sc_codigo`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }
    const removed = rows[0];
    unregisterClient(removed.sc_codigo);
    console.log(`[clients] cliente removido: "${removed.sc_nome}" (empresa ${removed.sc_codigo})`);
    res.json({ ok: true, id: removed.sc_id });
  } catch (err) {
    console.error('DELETE /clients:', err.message);
    res.status(500).json({ error: 'Erro ao remover cliente.' });
  }
});

// GET /api/clients/test?empresa=7432 — testa conectividade de uma empresa
router.get('/test', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório.' });
  try {
    const { queryFor } = require('../db/poolManager');
    const q = queryFor(empresa);
    const { rows } = await q(`SELECT current_database() AS db, NOW() AS agora`);
    res.json({ ok: true, empresa, db: rows[0].db, agora: rows[0].agora });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

module.exports = router;
