/**
 * poolManager.js
 * Gerencia múltiplas conexões PostgreSQL — uma por banco de cliente.
 * Cada posto/empresa pode ter seu próprio banco de dados (SGA independente).
 */
require('dotenv').config();
const { Pool }      = require('pg');
const { safeQuery } = require('../middleware/readonly');

// Pool principal: banco de gestão do STARVL (starvl_users, starvl_clients, etc.)
const mainPool = require('./pool');

// dbName → Pool
const dbPools   = new Map();
// codigoEmpresa (string) → { dbName, pool }
const empresaMap = new Map();

// ── Helpers de configuração ──────────────────────────────────────────────────

/**
 * Constrói a configuração do pg.Pool para um banco específico.
 * Usa overrides quando fornecidos, cai de volta nas vars de ambiente.
 */
function buildConfig(dbName, host, port, dbUser, dbPass) {
  if (process.env.DATABASE_URL && !host) {
    // Em Render com DATABASE_URL: substitui só o nome do banco na URL
    try {
      const url = new URL(process.env.DATABASE_URL);
      url.pathname = '/' + dbName;
      return {
        connectionString: url.toString(),
        ssl: { rejectUnauthorized: false },
        max: 12, // o Dashboard dispara várias sub-queries concorrentes por empresa; 5 virava gargalo de fila
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      };
    } catch {
      // fallback abaixo
    }
  }
  return {
    host:     host     || process.env.DB_HOST,
    port:     parseInt(port)   || parseInt(process.env.DB_PORT) || 5432,
    database: dbName,
    user:     dbUser   || process.env.DB_USER,
    password: dbPass   || process.env.DB_PASSWORD,
    ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 12, // o Dashboard dispara várias sub-queries concorrentes por empresa; 5 virava gargalo de fila
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

// ── Registro de clientes ─────────────────────────────────────────────────────

/**
 * Registra (ou reutiliza) um pool para o banco do cliente.
 * @param {{ codigoEmpresa, dbName, host?, port?, dbUser?, dbPass? }} opts
 */
function registerClient({ codigoEmpresa, dbName, host, port, dbUser, dbPass }) {
  if (!dbPools.has(dbName)) {
    const cfg  = buildConfig(dbName, host, port, dbUser, dbPass);
    const pool = new Pool(cfg);
    pool.on('error', err =>
      console.error(`[poolManager][${dbName}] erro inesperado:`, err.message));
    dbPools.set(dbName, pool);
    console.log(`[poolManager] pool criado para banco "${dbName}"`);
  }
  empresaMap.set(String(codigoEmpresa), {
    dbName,
    pool: dbPools.get(dbName),
  });
  console.log(`[poolManager] empresa ${codigoEmpresa} → banco "${dbName}"`);
}

/**
 * Remove o mapeamento empresa → pool.
 * O pool do banco em si é mantido se outro cliente usa o mesmo banco.
 */
function unregisterClient(codigoEmpresa) {
  empresaMap.delete(String(codigoEmpresa));
  console.log(`[poolManager] empresa ${codigoEmpresa} removida do mapa`);
}

// ── Lookups ──────────────────────────────────────────────────────────────────

/**
 * Retorna o pg.Pool correto para uma empresa.
 * Usa mainPool como fallback (empresa no banco padrão).
 */
function getPoolByEmpresa(codigoEmpresa) {
  const entry = empresaMap.get(String(codigoEmpresa));
  return entry ? entry.pool : mainPool;
}

/**
 * Retorna uma função query (safeQuery) ligada ao pool correto para a empresa.
 * Uso nos handlers de rota:
 *   const query = queryFor(empresa);
 *   const result = await query('SELECT ...', [empresa]);
 */
function queryFor(codigoEmpresa) {
  return safeQuery(getPoolByEmpresa(codigoEmpresa));
}

// ── Inicialização: carrega clientes salvos no banco de gestão ─────────────────

async function initialize() {
  try {
    // Garante que a tabela de clientes existe
    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS starvl_clients (
        sc_id           SERIAL       PRIMARY KEY,
        sc_nome         VARCHAR(200) NOT NULL,
        sc_codigo       INTEGER      NOT NULL UNIQUE,
        sc_banco        VARCHAR(200) NOT NULL,
        sc_host         VARCHAR(200),
        sc_port         INTEGER,
        sc_user         VARCHAR(200),
        sc_pass         VARCHAR(200),
        sc_criado       TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    // Seed: se não houver nenhum cliente, cria o padrão a partir do .env
    const { rows: count } = await mainPool.query('SELECT COUNT(*) AS n FROM starvl_clients');
    if (parseInt(count[0].n) === 0 && process.env.DB_NAME && process.env.DEFAULT_EMPRESA) {
      const defaultEmpresa = parseInt(process.env.DEFAULT_EMPRESA);
      const defaultNome    = process.env.DEFAULT_CLIENT_NAME || 'Posto Principal';
      await mainPool.query(
        `INSERT INTO starvl_clients (sc_nome, sc_codigo, sc_banco) VALUES ($1, $2, $3)`,
        [defaultNome, defaultEmpresa, process.env.DB_NAME]
      );
      console.log(`[poolManager] cliente padrão seedado: "${defaultNome}" (empresa ${defaultEmpresa})`);
    }

    // Carrega todos os clientes e registra os pools
    const { rows } = await mainPool.query(
      `SELECT sc_codigo, sc_banco, sc_host, sc_port, sc_user, sc_pass FROM starvl_clients`
    );
    for (const r of rows) {
      registerClient({
        codigoEmpresa: r.sc_codigo,
        dbName:  r.sc_banco,
        host:    r.sc_host   || null,
        port:    r.sc_port   || null,
        dbUser:  r.sc_user   || null,
        dbPass:  r.sc_pass   || null,
      });
    }
    console.log(`[poolManager] ${rows.length} cliente(s) carregado(s)`);
  } catch (err) {
    console.error('[poolManager] falha na inicialização:', err.message);
  }
}

module.exports = {
  initialize,
  registerClient,
  unregisterClient,
  getPoolByEmpresa,
  queryFor,
  mainPool,
};
