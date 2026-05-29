/**
 * readonly.js — Proteções de query
 *
 * ATENÇÃO: readonlyGuard está intencionalmente como passthrough (no-op).
 * A proteção real é feita via safeQuery() que valida o SQL antes de executar.
 *
 * TODO: Implementar autenticação JWT em um middleware auth.js centralizado
 *       para proteger todas as rotas da API.
 */

const FORBIDDEN = /^\s*(insert|update|delete|drop|truncate|alter|create|grant|revoke|exec|execute|call)\b/i;

/**
 * readonlyGuard — no-op intencional.
 * Mantido para compatibilidade; não fornece proteção real por si só.
 * A proteção de escrita é delegada a safeQuery().
 */
function readonlyGuard(req, res, next) {
  next();
}

/**
 * safeQuery — Wraps pool.query para rejeitar operações de escrita
 * antes de chegar ao banco de dados.
 */
function safeQuery(pool) {
  return async function query(sql, params) {
    if (FORBIDDEN.test(sql.trim())) {
      throw new Error('Write operations are not allowed in read-only query context');
    }
    return pool.query(sql, params);
  };
}

module.exports = { readonlyGuard, safeQuery };
