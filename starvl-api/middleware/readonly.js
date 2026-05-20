const FORBIDDEN = /^\s*(insert|update|delete|drop|truncate|alter|create|grant|revoke|exec|execute|call)\b/i;

function readonlyGuard(req, res, next) {
  next();
}

// Wraps pool.query to enforce read-only at query level
function safeQuery(pool) {
  return async function query(sql, params) {
    if (FORBIDDEN.test(sql.trim())) {
      throw new Error('Write operations are not allowed');
    }
    return pool.query(sql, params);
  };
}

module.exports = { readonlyGuard, safeQuery };
