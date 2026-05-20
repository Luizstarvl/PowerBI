require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');

const dashboardRoutes = require('./routes/dashboard');
const lmcRoutes = require('./routes/lmc');
const estoqueRoutes = require('./routes/estoque');
const relatoriosRoutes = require('./routes/relatorios');

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

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
app.use('/api/relatorios', relatoriosRoutes);

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
});
