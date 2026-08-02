/**
 * routes/plans.js
 * CRUD de planos comerciais (DimPlano no modelo de BI).
 */
const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

// Cria tabela de planos (idempotente)
pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_plans (
    sp_id                   SERIAL        PRIMARY KEY,
    sp_nome                 VARCHAR(100)  NOT NULL,
    sp_categoria            VARCHAR(50)   NOT NULL DEFAULT 'Standard',
    sp_valor_mensal         NUMERIC(12,2) NOT NULL DEFAULT 0,
    sp_valor_anual          NUMERIC(12,2) NOT NULL DEFAULT 0,
    sp_permite_multiempresa BOOLEAN       NOT NULL DEFAULT false,
    sp_permite_api          BOOLEAN       NOT NULL DEFAULT false,
    sp_permite_mobile       BOOLEAN       NOT NULL DEFAULT false,
    sp_permite_bi           BOOLEAN       NOT NULL DEFAULT false,
    sp_permite_integracoes  BOOLEAN       NOT NULL DEFAULT false,
    sp_situacao             VARCHAR(20)   NOT NULL DEFAULT 'Ativo',
    sp_criado               TIMESTAMPTZ   DEFAULT NOW(),
    sp_atualizado           TIMESTAMPTZ   DEFAULT NOW()
  )
`).catch(err => console.error('[starvl_plans] ensureTable:', err.message));

const toRow = r => ({
  id:                  r.sp_id,
  nome:                r.sp_nome,
  categoria:           r.sp_categoria,
  valorMensal:         parseFloat(r.sp_valor_mensal),
  valorAnual:          parseFloat(r.sp_valor_anual),
  permiteMultiempresa: r.sp_permite_multiempresa,
  permiteApi:          r.sp_permite_api,
  permiteMobile:       r.sp_permite_mobile,
  permiteBi:           r.sp_permite_bi,
  permiteIntegracoes:  r.sp_permite_integracoes,
  situacao:            r.sp_situacao,
  criado:              r.sp_criado,
});

// GET /api/plans
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM starvl_plans ORDER BY sp_id`);
    res.json(rows.map(toRow));
  } catch (err) {
    console.error('GET /plans:', err.message);
    res.status(500).json({ error: 'Erro ao listar planos.' });
  }
});

// POST /api/plans
router.post('/', async (req, res) => {
  const {
    nome, categoria, valorMensal, valorAnual,
    permiteMultiempresa, permiteApi, permiteMobile, permiteBi, permiteIntegracoes,
    situacao,
  } = req.body;

  if (!nome?.trim()) return res.status(400).json({ error: 'nome é obrigatório.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO starvl_plans (
         sp_nome, sp_categoria, sp_valor_mensal, sp_valor_anual,
         sp_permite_multiempresa, sp_permite_api, sp_permite_mobile, sp_permite_bi, sp_permite_integracoes,
         sp_situacao
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        nome.trim(), categoria || 'Standard', parseFloat(valorMensal) || 0, parseFloat(valorAnual) || 0,
        !!permiteMultiempresa, !!permiteApi, !!permiteMobile, !!permiteBi, !!permiteIntegracoes,
        situacao || 'Ativo',
      ]
    );
    res.status(201).json(toRow(rows[0]));
  } catch (err) {
    console.error('POST /plans:', err.message);
    res.status(500).json({ error: 'Erro ao criar plano.' });
  }
});

// PUT /api/plans/:id
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    nome, categoria, valorMensal, valorAnual,
    permiteMultiempresa, permiteApi, permiteMobile, permiteBi, permiteIntegracoes,
    situacao,
  } = req.body;

  if (!nome?.trim()) return res.status(400).json({ error: 'nome é obrigatório.' });

  try {
    const { rows } = await pool.query(
      `UPDATE starvl_plans
       SET sp_nome=$1, sp_categoria=$2, sp_valor_mensal=$3, sp_valor_anual=$4,
           sp_permite_multiempresa=$5, sp_permite_api=$6, sp_permite_mobile=$7, sp_permite_bi=$8, sp_permite_integracoes=$9,
           sp_situacao=$10, sp_atualizado=NOW()
       WHERE sp_id=$11
       RETURNING *`,
      [
        nome.trim(), categoria || 'Standard', parseFloat(valorMensal) || 0, parseFloat(valorAnual) || 0,
        !!permiteMultiempresa, !!permiteApi, !!permiteMobile, !!permiteBi, !!permiteIntegracoes,
        situacao || 'Ativo', id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: 'Plano não encontrado.' });
    res.json(toRow(rows[0]));
  } catch (err) {
    console.error('PUT /plans:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar plano.' });
  }
});

// DELETE /api/plans/:id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const { rows: inUse } = await pool.query(`SELECT 1 FROM starvl_licenses WHERE sl_plano_id=$1 LIMIT 1`, [id]);
    if (inUse.length) {
      return res.status(409).json({ error: 'Plano possui licenças vinculadas e não pode ser removido.' });
    }
    const { rows } = await pool.query(`DELETE FROM starvl_plans WHERE sp_id=$1 RETURNING sp_id`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Plano não encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /plans:', err.message);
    res.status(500).json({ error: 'Erro ao excluir plano.' });
  }
});

module.exports = router;
