require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pool = require('./db/pool');

const dashboardRoutes = require('./routes/dashboard');
const lmcRoutes       = require('./routes/lmc');
const estoqueRoutes   = require('./routes/estoque');
const relatoriosRoutes = require('./routes/relatorios');
const receberRoutes   = require('./routes/receber');
const pagarRoutes     = require('./routes/pagar');
const fluxoCaixaRoutes    = require('./routes/fluxoCaixa');
const contaCorrenteRoutes = require('./routes/contaCorrente');
const imagensRoutes       = require('./routes/imagens');
const starvlUsersRoutes   = require('./routes/starvlUsers');
const auditoriaRoutes     = require('./routes/auditoria');

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3001;
const clientBuildPath = path.resolve(__dirname, '../starvl-app/build');

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function isAllowedRenderOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'onrender.com' || hostname.endsWith('.onrender.com');
  } catch {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    // Sem origin (ex: curl, server-to-server, same-origin) → sempre permitir
    if (!origin) return callback(null, true);

    // Origem explicitamente liberada via variável de ambiente
    if (process.env.CORS_ORIGIN === '*' || corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Origens *.onrender.com sempre permitidas (deploy próprio)
    if (isAllowedRenderOrigin(origin)) return callback(null, true);

    // Em dev: permitir localhost de qualquer porta
    if (process.env.NODE_ENV !== 'production') {
      try {
        const { hostname } = new URL(origin);
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch { /* ignora URL inválida */ }
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Health check + DB connectivity test
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now, current_database() AS db');
    res.json({
      status: 'ok',
      db: result.rows[0].db,
      serverTime: result.rows[0].now,
    });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

// Test empresa connectivity
app.get('/api/test-empresa', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa is required' });

  try {
    const result = await pool.query(
      `SELECT emp.empcodigo, emp.emprazao, emp.empfantasia
       FROM emp
       WHERE emp.empcodigo = $1`,
      [empresa]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Empresa ${empresa} not found` });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/lmc', lmcRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/receber', receberRoutes);
app.use('/api/pagar',   pagarRoutes);
app.use('/api/fluxo-caixa', fluxoCaixaRoutes);
app.use('/api/conta-corrente', contaCorrenteRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/imagens',        imagensRoutes);
app.use('/api/starvl-users',   starvlUsersRoutes);
app.use('/api/auditoria',      auditoriaRoutes);

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath, {
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}static${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return;
      }

      res.setHeader('Cache-Control', 'no-store');
    },
  }));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.setHeader('Cache-Control', 'no-store');
    return res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`STARVL API running on http://localhost:${PORT}`);
  console.log(`DB: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

  // Inicia o watcher de auditoria (snapshot + detecção de alterações/exclusões)
  try {
    const auditWatcher = require('./services/auditWatcher');
    auditWatcher.start();
  } catch (err) {
    console.error('[AuditWatcher] Falha ao iniciar:', err.message);
  }
});
