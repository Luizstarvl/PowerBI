const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'starvl-dev-fallback-change-in-production';

if (!process.env.JWT_SECRET) {
  console.warn('[auth] JWT_SECRET não configurado! Defina a variável de ambiente em produção.');
}

function requireAuth(req, res, next) {
  const auth  = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Não autenticado. Faça login.' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.perfil !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores.' });
  }
  next();
}

// Verifica uma chave nas permissões do perfil.
// requirePerm('configuracoes')           — truthy
// requirePerm('modo', 'completo')        — valor exato
function requirePerm(key, value) {
  return (req, res, next) => {
    if (req.user?.perfil === 'admin') return next();
    const perm = req.user?.permissoes?.[key];
    const ok   = value !== undefined ? perm === value : !!perm;
    if (!ok) return res.status(403).json({ error: 'Sem permissão para esta ação.' });
    next();
  };
}

module.exports = { requireAuth, requireAdmin, requirePerm };
