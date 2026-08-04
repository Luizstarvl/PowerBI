/**
 * routes/cache.js
 * Endpoints de administração do cache de resultados.
 * Todos exigem autenticação; invalidação exige perfil admin.
 */
const express = require('express');
const router  = express.Router();
const cache   = require('../db/cache');
const pool    = require('../db/pool');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { runVerification } = require('../jobs/cacheVerification');

// GET /api/cache/stats — resumo geral
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await cache.stats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cache — lista entradas (paginado)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { codigo, limit = 50, offset = 0 } = req.query;
    res.json(await cache.list({ codigo, limit: parseInt(limit), offset: parseInt(offset) }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cache — invalida tudo (ou por código)
router.delete('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { codigo } = req.query;
    await cache.invalidate(codigo || null);
    res.json({ ok: true, message: codigo ? `Cache de '${codigo}' limpo.` : 'Cache completo limpo.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cache/:id — invalida entrada específica
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM starvl_cache_resultados WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cache/verify — dispara verificação manual (admin)
router.post('/verify', requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json({ ok: true, message: 'Verificação iniciada em background.' });
    runVerification().catch(e => console.error('[cache/verify] manual:', e.message));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
