/**
 * db/cache.js
 * Cache persistente de resultados de consultas SQL.
 *
 * Estratégia:
 *  - Períodos passados (meses fechados): serve do cache; re-executa só na
 *    verificação noturna.
 *  - Período atual: sempre executa ao vivo, depois atualiza o cache.
 *  - Se o SQL da consulta mudou (sq_versao diferente): cache miss automático.
 */
const pool = require('./pool');

// ── Criação da tabela ──────────────────────────────────────────────────────────
pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_cache_resultados (
    id              SERIAL       PRIMARY KEY,
    cache_key       VARCHAR(400) UNIQUE NOT NULL,
    sq_codigo       VARCHAR(100) NOT NULL,
    sq_banco_id     INTEGER,
    empresa         VARCHAR(50),
    periodo         VARCHAR(10),
    params_json     JSONB        NOT NULL DEFAULT '{}',
    resultado       JSONB        NOT NULL,
    sq_versao       INTEGER      NOT NULL DEFAULT 0,
    is_periodo_atual BOOLEAN     NOT NULL DEFAULT false,
    criado_em       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    verificado_em   TIMESTAMPTZ
  )
`).then(() => pool.query(`
  CREATE INDEX IF NOT EXISTS idx_cache_codigo
    ON starvl_cache_resultados(sq_codigo)
`)).then(() => pool.query(`
  CREATE INDEX IF NOT EXISTS idx_cache_verificar
    ON starvl_cache_resultados(verificado_em NULLS FIRST)
    WHERE is_periodo_atual = false
`)).catch(err => console.error('[cache] init:', err.message));

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Extrai o período no formato MMYYYY a partir dos parâmetros da requisição.
 * Aceita o param `periodo` (já no formato certo) ou deriva de `data_inicio`.
 */
function extractPeriodo(params) {
  if (params.periodo && /^\d{6}$/.test(params.periodo)) return params.periodo;
  if (params.data_inicio) {
    const [y, m] = params.data_inicio.split('-');
    if (y && m) return `${m}${y}`;
  }
  return '';
}

/**
 * Retorna true se os parâmetros indicam o mês atual (dados ainda em aberto).
 * Sem período identificável → trata como atual (não cacheia).
 */
function isPeriodoAtual(params) {
  const periodo = extractPeriodo(params);
  if (!periodo) return true;

  const now   = new Date();
  const mes   = parseInt(periodo.substring(0, 2), 10);
  const ano   = parseInt(periodo.substring(2, 6), 10);
  return mes === now.getMonth() + 1 && ano === now.getFullYear();
}

/**
 * Chave única: codigo + empresa + data_inicio + data_final
 * (não inclui sq_versao na chave — a versão é verificada na leitura)
 */
function buildCacheKey(codigo, params) {
  return [
    codigo.toUpperCase(),
    params.empresa      || '',
    params.data_inicio  || '',
    params.data_final   || '',
  ].join(':');
}

// ── Operações de cache ─────────────────────────────────────────────────────────

/**
 * Tenta encontrar um resultado válido no cache.
 * Retorna null se não existir ou se o SQL mudou (sq_versao diferente).
 */
async function get(cacheKey, sqVersao) {
  try {
    const { rows } = await pool.query(
      `SELECT resultado, atualizado_em
       FROM starvl_cache_resultados
       WHERE cache_key = $1 AND sq_versao = $2`,
      [cacheKey, sqVersao]
    );
    return rows[0] || null;
  } catch (err) {
    console.error('[cache] get error:', err.message);
    return null;
  }
}

/**
 * Salva ou atualiza um resultado no cache (UPSERT).
 * Operação assíncrona — não bloqueia a resposta HTTP.
 */
async function set(cacheKey, { codigo, bancoId, empresa, params, resultado, sqVersao, isAtual }) {
  const periodo = extractPeriodo(params);
  await pool.query(`
    INSERT INTO starvl_cache_resultados
      (cache_key, sq_codigo, sq_banco_id, empresa, periodo, params_json,
       resultado, sq_versao, is_periodo_atual, atualizado_em)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
    ON CONFLICT (cache_key) DO UPDATE SET
      resultado        = EXCLUDED.resultado,
      sq_versao        = EXCLUDED.sq_versao,
      is_periodo_atual = EXCLUDED.is_periodo_atual,
      atualizado_em    = NOW()
  `, [
    cacheKey, codigo.toUpperCase(), bancoId, empresa, periodo,
    JSON.stringify(params), JSON.stringify(resultado), sqVersao, isAtual,
  ]);
}

/**
 * Invalida manualmente entradas de cache (por código ou tudo).
 */
async function invalidate(codigo) {
  if (codigo) {
    await pool.query(
      'DELETE FROM starvl_cache_resultados WHERE UPPER(sq_codigo) = UPPER($1)',
      [codigo]
    );
  } else {
    await pool.query('DELETE FROM starvl_cache_resultados');
  }
}

/**
 * Retorna estatísticas do cache para o painel admin.
 */
async function stats() {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*)                                          AS total,
      COUNT(*) FILTER (WHERE is_periodo_atual = false) AS historico,
      COUNT(*) FILTER (WHERE is_periodo_atual = true)  AS atual,
      COUNT(*) FILTER (WHERE verificado_em IS NULL
                         AND is_periodo_atual = false)  AS nunca_verificado,
      MAX(atualizado_em)                                AS ultimo_cache
    FROM starvl_cache_resultados
  `);
  return rows[0];
}

/**
 * Lista entradas do cache com paginação.
 */
async function list({ codigo, limit = 50, offset = 0 } = {}) {
  const params = [];
  let where = '';
  if (codigo) {
    params.push(codigo.toUpperCase());
    where = 'WHERE UPPER(sq_codigo) = $1';
  }
  const { rows } = await pool.query(`
    SELECT id, sq_codigo, empresa, periodo, sq_versao, is_periodo_atual,
           criado_em, atualizado_em, verificado_em,
           pg_column_size(resultado) AS resultado_bytes
    FROM starvl_cache_resultados
    ${where}
    ORDER BY atualizado_em DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `, [...params, limit, offset]);
  return rows;
}

module.exports = { get, set, invalidate, stats, list, buildCacheKey, isPeriodoAtual, extractPeriodo };
