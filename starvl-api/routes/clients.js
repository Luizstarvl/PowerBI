/**
 * routes/clients.js
 * CRUD de clientes (postos).
 * Credenciais de banco NUNCA são retornadas ao frontend.
 */
const express      = require('express');
const router       = express.Router();
const { mainPool, registerClient, unregisterClient } = require('../db/poolManager');

// Garante que sc_banco pode ser NULL (empresa sem conexão configurada)
mainPool.query(`ALTER TABLE starvl_clients ALTER COLUMN sc_banco DROP NOT NULL`).catch(() => {});

// Colunas de dados cadastrais da empresa
mainPool.query(`ALTER TABLE starvl_clients ADD COLUMN IF NOT EXISTS sc_cnpj        VARCHAR(20)`).catch(() => {});
mainPool.query(`ALTER TABLE starvl_clients ADD COLUMN IF NOT EXISTS sc_ie          VARCHAR(30)`).catch(() => {});
mainPool.query(`ALTER TABLE starvl_clients ADD COLUMN IF NOT EXISTS sc_endereco    TEXT`).catch(() => {});
mainPool.query(`ALTER TABLE starvl_clients ADD COLUMN IF NOT EXISTS sc_contato     VARCHAR(100)`).catch(() => {});
mainPool.query(`ALTER TABLE starvl_clients ADD COLUMN IF NOT EXISTS sc_responsavel VARCHAR(150)`).catch(() => {});

const toPublic = r => ({
  id:            r.sc_id,
  nome:          r.sc_nome,
  codigoEmpresa: r.sc_codigo,
  banco:         r.sc_banco        || null,
  hasCustomHost: !!(r.sc_host),
  isConfigured:  !!(r.sc_banco),
  criado:        r.sc_criado,
  cnpj:          r.sc_cnpj         || null,
  ie:            r.sc_ie           || null,
  endereco:      r.sc_endereco     || null,
  contato:       r.sc_contato      || null,
  responsavel:   r.sc_responsavel  || null,
});

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    const { rows } = await mainPool.query(
      `SELECT sc_id, sc_nome, sc_codigo, sc_banco, sc_host, sc_criado,
              sc_cnpj, sc_ie, sc_endereco, sc_contato, sc_responsavel
       FROM starvl_clients ORDER BY sc_id`
    );
    res.json(rows.map(toPublic));
  } catch (err) {
    console.error('GET /clients:', err.message);
    res.status(500).json({ error: 'Erro ao listar clientes.' });
  }
});

// POST /api/clients — cadastra empresa (nome + código apenas; conexão configurada depois via PUT)
// Body: { nome, codigoEmpresa }
router.post('/', async (req, res) => {
  const { nome, codigoEmpresa, cnpj, ie, endereco, contato, responsavel } = req.body;

  if (!nome?.trim() || !codigoEmpresa) {
    return res.status(400).json({ error: 'nome e codigoEmpresa são obrigatórios.' });
  }

  const codigo = parseInt(codigoEmpresa);
  if (isNaN(codigo) || codigo <= 0) {
    return res.status(400).json({ error: 'codigoEmpresa deve ser um número positivo.' });
  }

  try {
    const { rows: existing } = await mainPool.query(
      'SELECT sc_id FROM starvl_clients WHERE sc_codigo = $1', [codigo]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: `Empresa ${codigo} já está cadastrada.` });
    }

    const { rows } = await mainPool.query(
      `INSERT INTO starvl_clients (sc_nome, sc_codigo, sc_cnpj, sc_ie, sc_endereco, sc_contato, sc_responsavel)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING sc_id, sc_nome, sc_codigo, sc_banco, sc_host, sc_criado,
                 sc_cnpj, sc_ie, sc_endereco, sc_contato, sc_responsavel`,
      [nome.trim(), codigo, cnpj?.trim()||null, ie?.trim()||null, endereco?.trim()||null, contato?.trim()||null, responsavel?.trim()||null]
    );

    console.log(`[clients] nova empresa: "${nome}" (código ${codigo})`);
    res.status(201).json(toPublic(rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `Empresa ${codigo} já está cadastrada.` });
    }
    console.error('POST /clients:', err.message);
    res.status(500).json({ error: 'Erro ao adicionar empresa.' });
  }
});

// PATCH /api/clients/:codigoEmpresa — atualiza dados da empresa (nome)
router.patch('/:codigoEmpresa', async (req, res) => {
  const codigo = parseInt(req.params.codigoEmpresa);
  if (isNaN(codigo) || codigo <= 0) return res.status(400).json({ error: 'codigoEmpresa inválido.' });

  const { nome, cnpj, ie, endereco, contato, responsavel } = req.body;
  if (!nome?.trim()) return res.status(400).json({ error: 'nome é obrigatório.' });

  try {
    const { rows } = await mainPool.query(
      `UPDATE starvl_clients
       SET sc_nome=$1, sc_cnpj=$2, sc_ie=$3, sc_endereco=$4, sc_contato=$5, sc_responsavel=$6
       WHERE sc_codigo=$7
       RETURNING sc_id, sc_nome, sc_codigo, sc_banco, sc_host, sc_criado,
                 sc_cnpj, sc_ie, sc_endereco, sc_contato, sc_responsavel`,
      [nome.trim(), cnpj?.trim()||null, ie?.trim()||null, endereco?.trim()||null, contato?.trim()||null, responsavel?.trim()||null, codigo]
    );
    if (!rows.length) return res.status(404).json({ error: 'Empresa não encontrada.' });
    console.log(`[clients] empresa atualizada: "${nome}" (código ${codigo})`);
    res.json(toPublic(rows[0]));
  } catch (err) {
    console.error('PATCH /clients:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar empresa.' });
  }
});

// PUT /api/clients/:codigoEmpresa — configura conexão de banco de dados
// Body: { banco, host?, port?, dbUser?, dbPass? }
router.put('/:codigoEmpresa', async (req, res) => {
  const codigo = parseInt(req.params.codigoEmpresa);
  if (isNaN(codigo) || codigo <= 0) return res.status(400).json({ error: 'codigoEmpresa inválido.' });

  const { banco, host, port, dbUser, dbPass } = req.body;
  if (!banco?.trim()) return res.status(400).json({ error: 'Nome do banco é obrigatório.' });

  try {
    const { rows: existing } = await mainPool.query(
      `SELECT sc_id, sc_banco, sc_host, sc_port, sc_user, sc_pass
       FROM starvl_clients WHERE sc_codigo = $1`,
      [codigo]
    );
    if (!existing.length) return res.status(404).json({ error: 'Empresa não encontrada.' });

    const old = existing[0];

    // Testa nova conexão antes de salvar
    unregisterClient(codigo);
    registerClient({ codigoEmpresa: codigo, dbName: banco.trim(), host, port, dbUser, dbPass });
    const { queryFor } = require('../db/poolManager');

    try {
      await queryFor(codigo)(`SELECT 1`, []);
    } catch (connErr) {
      // Restaura pool anterior se existia
      unregisterClient(codigo);
      if (old.sc_banco) {
        registerClient({ codigoEmpresa: codigo, dbName: old.sc_banco, host: old.sc_host, port: old.sc_port, dbUser: old.sc_user, dbPass: old.sc_pass });
      }
      return res.status(400).json({
        error: `Não foi possível conectar ao banco "${banco}": ${connErr.message}`,
      });
    }

    const { rows } = await mainPool.query(
      `UPDATE starvl_clients
       SET sc_banco=$1, sc_host=$2, sc_port=$3, sc_user=$4, sc_pass=$5
       WHERE sc_codigo=$6
       RETURNING sc_id, sc_nome, sc_codigo, sc_banco, sc_host, sc_criado`,
      [banco.trim(), host?.trim() || null, port ? parseInt(port) : null, dbUser?.trim() || null, dbPass || null, codigo]
    );

    console.log(`[clients] conexão atualizada: empresa ${codigo}, banco "${banco}"`);
    res.json(toPublic(rows[0]));
  } catch (err) {
    console.error('PUT /clients:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar conexão.' });
  }
});

// DELETE /api/clients/:codigoEmpresa
router.delete('/:id', async (req, res) => {
  const codigoEmpresa = parseInt(req.params.id);
  if (!codigoEmpresa) return res.status(400).json({ error: 'codigoEmpresa inválido.' });
  try {
    const { rows } = await mainPool.query(
      `DELETE FROM starvl_clients WHERE sc_codigo = $1
       RETURNING sc_id, sc_nome, sc_codigo`,
      [codigoEmpresa]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }
    const removed = rows[0];
    unregisterClient(removed.sc_codigo);
    console.log(`[clients] empresa removida: "${removed.sc_nome}" (código ${removed.sc_codigo})`);
    res.json({ ok: true, id: removed.sc_codigo });
  } catch (err) {
    console.error('DELETE /clients:', err.message);
    res.status(500).json({ error: 'Erro ao remover empresa.' });
  }
});

// GET /api/clients/test?empresa=7432 — testa conectividade registrada
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
