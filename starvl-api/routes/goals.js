const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

// Cria tabela de metas (idempotente)
pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_goals (
    sg_id         SERIAL        PRIMARY KEY,
    sg_empresa    INTEGER       NOT NULL,
    sg_nome       VARCHAR(200)  NOT NULL,
    sg_desc       TEXT          DEFAULT '',
    sg_categoria  VARCHAR(50)   NOT NULL DEFAULT 'Outros',
    sg_periodo    VARCHAR(20)   NOT NULL DEFAULT 'Mensal',
    sg_meta       NUMERIC(14,2) NOT NULL DEFAULT 0,
    sg_alcancado  NUMERIC(14,2) NOT NULL DEFAULT 0,
    sg_status     VARCHAR(20)   NOT NULL DEFAULT 'Em andamento',
    sg_vencimento VARCHAR(10)   NOT NULL DEFAULT '',
    sg_criado     TIMESTAMPTZ   DEFAULT NOW(),
    sg_atualizado TIMESTAMPTZ   DEFAULT NOW()
  )
`).then(() => pool.query(
  `CREATE INDEX IF NOT EXISTS idx_starvl_goals_empresa ON starvl_goals (sg_empresa)`
)).catch(err => console.error('[starvl_goals] ensureTable:', err.message));

// Metas padrão usadas para semear a primeira consulta de cada empresa
const DEFAULT_GOALS = [
  { nome:'Faturamento Mensal',            desc:'Aumentar o faturamento mensal da empresa',     categoria:'Faturamento',       periodo:'Mensal',     meta:600000,  alcancado:428750,  status:'Em andamento', vencimento:'2026-04-30' },
  { nome:'Redução de Custos Operacionais',desc:'Reduzir custos operacionais em 15%',           categoria:'Redução de Custos', periodo:'Trimestral', meta:300000,  alcancado:186400,  status:'Em andamento', vencimento:'2026-06-30' },
  { nome:'Lucro Líquido Trimestral',      desc:'Alcançar lucro líquido de 12%',                categoria:'Lucro Líquido',     periodo:'Trimestral', meta:280000,  alcancado:198350,  status:'Em andamento', vencimento:'2026-06-30' },
  { nome:'Recebimento de Clientes',       desc:'Reduzir inadimplência para menos de 5%',       categoria:'Contas a Receber',  periodo:'Mensal',     meta:200000,  alcancado:156800,  status:'Em andamento', vencimento:'2026-04-30' },
  { nome:'Expansão de Mercado',           desc:'Aumentar base de clientes em 20%',             categoria:'Outros',            periodo:'Semestral',  meta:150000,  alcancado:45180,   status:'Em andamento', vencimento:'2026-08-31' },
  { nome:'Meta Vendas Q2',                desc:'Superar meta de vendas do segundo trimestre',  categoria:'Faturamento',       periodo:'Trimestral', meta:900000,  alcancado:0,       status:'Em andamento', vencimento:'2026-09-30' },
  { nome:'Margem Líquida',                desc:'Atingir margem de 15%',                        categoria:'Lucro Líquido',     periodo:'Trimestral', meta:620000,  alcancado:182000,  status:'Em atraso',    vencimento:'2026-03-31' },
  { nome:'Estoque Mínimo',                desc:'Manter estoque de segurança por período',      categoria:'Outros',            periodo:'Mensal',     meta:100000,  alcancado:35000,   status:'Em atraso',    vencimento:'2026-03-31' },
  { nome:'Eficiência Operacional',        desc:'Melhorar margem bruta em 8%',                  categoria:'Redução de Custos', periodo:'Anual',      meta:900000,  alcancado:900000,  status:'Concluída',    vencimento:'2025-12-31' },
  { nome:'Volume de Combustíveis',        desc:'Aumentar volume de venda em 25%',              categoria:'Faturamento',       periodo:'Anual',      meta:1200000, alcancado:1200000, status:'Concluída',    vencimento:'2025-12-31' },
  { nome:'Captação Novos Clientes',       desc:'Fechar 50 novos contratos no ano',             categoria:'Outros',            periodo:'Anual',      meta:120000,  alcancado:120000,  status:'Concluída',    vencimento:'2025-12-31' },
  { nome:'Volume de Combustíveis Mensal', desc:'Meta mensal de litros vendidos (combustível)', categoria:'Faturamento',       periodo:'Mensal',     meta:100000,  alcancado:0,       status:'Em andamento', vencimento:'2026-12-31' },
];

const toRow = r => ({
  id        : r.sg_id,
  nome      : r.sg_nome,
  desc      : r.sg_desc,
  categoria : r.sg_categoria,
  periodo   : r.sg_periodo,
  meta      : parseFloat(r.sg_meta),
  alcancado : parseFloat(r.sg_alcancado),
  status    : r.sg_status,
  vencimento: r.sg_vencimento,
});

async function seedDefaultGoals(empresa) {
  for (const g of DEFAULT_GOALS) {
    await pool.query(
      `INSERT INTO starvl_goals (sg_empresa, sg_nome, sg_desc, sg_categoria, sg_periodo, sg_meta, sg_alcancado, sg_status, sg_vencimento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [empresa, g.nome, g.desc, g.categoria, g.periodo, g.meta, g.alcancado, g.status, g.vencimento]
    );
  }
}

// GET /api/goals?empresa=XXXX — lista metas da empresa (semeia metas padrão na 1ª consulta)
router.get('/', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório' });
  try {
    let result = await pool.query(`SELECT * FROM starvl_goals WHERE sg_empresa=$1 ORDER BY sg_id`, [empresa]);
    if (result.rows.length === 0) {
      await seedDefaultGoals(empresa);
      result = await pool.query(`SELECT * FROM starvl_goals WHERE sg_empresa=$1 ORDER BY sg_id`, [empresa]);
    }
    res.json(result.rows.map(toRow));
  } catch (err) {
    console.error('GET /goals:', err.message);
    res.status(500).json({ error: 'Erro ao listar metas.' });
  }
});

// POST /api/goals — cria nova meta
router.post('/', async (req, res) => {
  const { empresa, nome, desc, categoria, periodo, meta, alcancado, status, vencimento } = req.body;
  const emp = parseInt(empresa);
  if (!emp || !nome?.trim()) return res.status(400).json({ error: 'empresa e nome são obrigatórios' });
  try {
    const result = await pool.query(
      `INSERT INTO starvl_goals (sg_empresa, sg_nome, sg_desc, sg_categoria, sg_periodo, sg_meta, sg_alcancado, sg_status, sg_vencimento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [emp, nome.trim(), desc || '', categoria || 'Outros', periodo || 'Mensal', parseFloat(meta) || 0, parseFloat(alcancado) || 0, status || 'Em andamento', vencimento || '']
    );
    res.status(201).json(toRow(result.rows[0]));
  } catch (err) {
    console.error('POST /goals:', err.message);
    res.status(500).json({ error: 'Erro ao criar meta.' });
  }
});

// PUT /api/goals/:id — atualiza meta existente
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, desc, categoria, periodo, meta, alcancado, status, vencimento } = req.body;
  if (!nome?.trim()) return res.status(400).json({ error: 'nome é obrigatório' });
  try {
    const result = await pool.query(
      `UPDATE starvl_goals
       SET sg_nome=$1, sg_desc=$2, sg_categoria=$3, sg_periodo=$4, sg_meta=$5, sg_alcancado=$6, sg_status=$7, sg_vencimento=$8, sg_atualizado=NOW()
       WHERE sg_id=$9
       RETURNING *`,
      [nome.trim(), desc || '', categoria || 'Outros', periodo || 'Mensal', parseFloat(meta) || 0, parseFloat(alcancado) || 0, status || 'Em andamento', vencimento || '', id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Meta não encontrada' });
    res.json(toRow(result.rows[0]));
  } catch (err) {
    console.error('PUT /goals:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar meta.' });
  }
});

// DELETE /api/goals/:id — remove meta
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query(`DELETE FROM starvl_goals WHERE sg_id=$1 RETURNING sg_id`, [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Meta não encontrada' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /goals:', err.message);
    res.status(500).json({ error: 'Erro ao excluir meta.' });
  }
});

module.exports = router;
