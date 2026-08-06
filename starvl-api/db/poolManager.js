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
  if (!dbName) {
    console.warn(`[poolManager] empresa ${codigoEmpresa} sem sc_banco configurado — ignorando`);
    return;
  }
  // Chave única considera host+porta+banco (evita colisão entre servidores diferentes)
  const poolKey = host ? `${host}:${port || 5432}/${dbName}` : dbName;
  if (!dbPools.has(poolKey)) {
    const cfg  = buildConfig(dbName, host, port, dbUser, dbPass);
    const pool = new Pool(cfg);
    pool.on('error', err =>
      console.error(`[poolManager][${poolKey}] erro inesperado:`, err.message));
    dbPools.set(poolKey, pool);
    console.log(`[poolManager] pool criado: "${poolKey}"`);
  }
  empresaMap.set(String(codigoEmpresa), {
    dbName: poolKey,
    pool:   dbPools.get(poolKey),
  });
  console.log(`[poolManager] empresa ${codigoEmpresa} → "${poolKey}"`);
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
 * true se a empresa tem conexão de banco (SGA) configurada e registrada.
 * Sem isso, getPoolByEmpresa cai silenciosamente no mainPool (banco de
 * gestão), que não tem as tabelas do SGA (vda, vdit, etc.) — útil pra dar
 * um erro claro em vez de "relation ... does not exist".
 */
function isEmpresaRegistered(codigoEmpresa) {
  return empresaMap.has(String(codigoEmpresa));
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

/**
 * Carrega conexões de starvl_clients (legado) e starvl_connections (novo).
 * Pode ser chamada no startup ou depois via /api/planejamento/reload-pools.
 */
async function loadConnections() {
  let total = 0;

  // 1. starvl_clients legado — apenas linhas com sc_banco preenchido
  try {
    const { rows } = await mainPool.query(
      `SELECT sc_codigo, sc_banco, sc_host, sc_port, sc_user, sc_pass
       FROM starvl_clients
       WHERE sc_banco IS NOT NULL AND sc_banco <> ''`
    );
    for (const r of rows) {
      registerClient({
        codigoEmpresa: r.sc_codigo,
        dbName:  r.sc_banco,
        host:    r.sc_host || null,
        port:    r.sc_port || null,
        dbUser:  r.sc_user || null,
        dbPass:  r.sc_pass || null,
      });
      total++;
    }
    console.log(`[poolManager] starvl_clients: ${rows.length} entrada(s)`);
  } catch (e) {
    console.error('[poolManager] erro ao ler starvl_clients:', e.message);
  }

  // 2. starvl_connections (gerenciador de conexões do app)
  try {
    const { rows } = await mainPool.query(`
      SELECT
        c.sc_servidor  AS host,
        c.sc_porta     AS port,
        c.sc_banco     AS banco,
        c.sc_usuario   AS usuario,
        c.sc_senha     AS senha,
        cl.sc_codigo   AS codigo_empresa
      FROM starvl_connections c
      JOIN starvl_connection_empresas sce ON sce.sce_conexao_id = c.sc_id
      JOIN starvl_clients cl             ON cl.sc_id            = sce.sce_empresa_id
      WHERE c.sc_banco IS NOT NULL AND c.sc_servidor IS NOT NULL
    `);
    for (const r of rows) {
      registerClient({
        codigoEmpresa: r.codigo_empresa,
        dbName:  r.banco,
        host:    r.host    || null,
        port:    r.port    || null,
        dbUser:  r.usuario || null,
        dbPass:  r.senha   || null,
      });
      total++;
    }
    console.log(`[poolManager] starvl_connections: ${rows.length} entrada(s)`);
  } catch (e) {
    // A tabela pode não existir ainda
    console.log('[poolManager] starvl_connections não disponível:', e.message);
  }

  return total;
}

async function initialize() {
  try {
    // Garante que a tabela de clientes existe (permite sc_banco NULL)
    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS starvl_clients (
        sc_id           SERIAL       PRIMARY KEY,
        sc_nome         VARCHAR(200) NOT NULL,
        sc_codigo       INTEGER      NOT NULL UNIQUE,
        sc_banco        VARCHAR(200),
        sc_host         VARCHAR(200),
        sc_port         INTEGER,
        sc_user         VARCHAR(200),
        sc_pass         VARCHAR(200),
        sc_criado       TIMESTAMPTZ  DEFAULT NOW()
      )
    `);
    // Permite NULL caso a coluna tenha sido criada com NOT NULL antes
    await mainPool.query(
      `ALTER TABLE starvl_clients ALTER COLUMN sc_banco DROP NOT NULL`
    ).catch(() => {});

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

    const total = await loadConnections();
    console.log(`[poolManager] inicializado com ${total} pool(s)`);
  } catch (err) {
    console.error('[poolManager] falha na inicialização:', err.message);
  }
}

module.exports = {
  initialize,
  loadConnections,
  registerClient,
  unregisterClient,
  getPoolByEmpresa,
  isEmpresaRegistered,
  queryFor,
  mainPool,
};
