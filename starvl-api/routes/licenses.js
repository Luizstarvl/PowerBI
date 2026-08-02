/**
 * routes/licenses.js
 * CRUD de licenças de clientes (FatoLicenciamento no modelo de BI).
 * Sem FOREIGN KEY para starvl_clients/starvl_plans de propósito: segue o mesmo
 * padrão de starvl_goals (sg_empresa), evitando problemas de ordem de criação
 * entre tabelas que nascem em módulos de rota diferentes. Integridade é
 * validada na aplicação (ver checkEmpresaExists/checkPlanoExists abaixo).
 */
const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

const STATUS_VALIDOS = ['Ativa', 'Expirada', 'Bloqueada', 'Teste', 'Cancelada'];

// Cria tabela de licenças (idempotente)
pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_licenses (
    sl_id                  SERIAL        PRIMARY KEY,
    sl_empresa_id          INTEGER       NOT NULL,
    sl_plano_id            INTEGER       NOT NULL,
    sl_numero_licenca      VARCHAR(50)   NOT NULL UNIQUE,
    sl_status              VARCHAR(20)   NOT NULL DEFAULT 'Ativa',
    sl_data_ativacao       DATE          NOT NULL,
    sl_data_expiracao      DATE          NOT NULL,
    sl_limite_usuarios     INTEGER       NOT NULL DEFAULT 0,
    sl_usuarios_utilizados INTEGER       NOT NULL DEFAULT 0,
    sl_limite_empresas     INTEGER       NOT NULL DEFAULT 1,
    sl_empresas_utilizadas INTEGER       NOT NULL DEFAULT 1,
    sl_limite_conexoes     INTEGER       NOT NULL DEFAULT 1,
    sl_conexoes_utilizadas INTEGER       NOT NULL DEFAULT 0,
    sl_valor_licenca       NUMERIC(12,2) NOT NULL DEFAULT 0,
    sl_criado              TIMESTAMPTZ   DEFAULT NOW(),
    sl_ultima_atualizacao  TIMESTAMPTZ   DEFAULT NOW(),
    CONSTRAINT chk_starvl_licenses_status CHECK (sl_status IN ('Ativa','Expirada','Bloqueada','Teste','Cancelada'))
  )
`).then(() => Promise.all([
  pool.query(`CREATE INDEX IF NOT EXISTS idx_starvl_licenses_empresa    ON starvl_licenses (sl_empresa_id)`),
  pool.query(`CREATE INDEX IF NOT EXISTS idx_starvl_licenses_plano      ON starvl_licenses (sl_plano_id)`),
  pool.query(`CREATE INDEX IF NOT EXISTS idx_starvl_licenses_status     ON starvl_licenses (sl_status)`),
  pool.query(`CREATE INDEX IF NOT EXISTS idx_starvl_licenses_expiracao  ON starvl_licenses (sl_data_expiracao)`),
])).catch(err => console.error('[starvl_licenses] ensureTable:', err.message));

function diasRestantes(dataExpiracao) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const exp  = new Date(dataExpiracao); exp.setHours(0, 0, 0, 0);
  return Math.round((exp - hoje) / 86400000);
}

function pct(usado, limite) {
  if (!limite) return 0;
  return Math.round((usado / limite) * 1000) / 10;
}

const toRow = r => ({
  id:                 r.sl_id,
  empresaId:          r.sl_empresa_id,
  empresaNome:        r.empresa_nome || null,
  planoId:            r.sl_plano_id,
  planoNome:          r.plano_nome || null,
  numeroLicenca:      r.sl_numero_licenca,
  status:             r.sl_status,
  dataAtivacao:       r.sl_data_ativacao,
  dataExpiracao:      r.sl_data_expiracao,
  diasRestantes:      diasRestantes(r.sl_data_expiracao),
  limiteUsuarios:     r.sl_limite_usuarios,
  usuariosUtilizados: r.sl_usuarios_utilizados,
  pctUsuarios:        pct(r.sl_usuarios_utilizados, r.sl_limite_usuarios),
  limiteEmpresas:     r.sl_limite_empresas,
  empresasUtilizadas: r.sl_empresas_utilizadas,
  pctEmpresas:        pct(r.sl_empresas_utilizadas, r.sl_limite_empresas),
  limiteConexoes:     r.sl_limite_conexoes,
  conexoesUtilizadas: r.sl_conexoes_utilizadas,
  pctConexoes:        pct(r.sl_conexoes_utilizadas, r.sl_limite_conexoes),
  valorLicenca:       parseFloat(r.sl_valor_licenca),
  ultimaAtualizacao:  r.sl_ultima_atualizacao,
});

const SELECT_BASE = `
  SELECT sl.*, sc.sc_nome AS empresa_nome, sp.sp_nome AS plano_nome
  FROM starvl_licenses sl
  LEFT JOIN starvl_clients sc ON sc.sc_id = sl.sl_empresa_id
  LEFT JOIN starvl_plans   sp ON sp.sp_id = sl.sl_plano_id
`;

// GET /api/licenses?empresa=&plano=&status=
router.get('/', async (req, res) => {
  const { empresa, plano, status } = req.query;
  const clauses = [];
  const params  = [];

  if (empresa) { params.push(parseInt(empresa)); clauses.push(`sl.sl_empresa_id = $${params.length}`); }
  if (plano)   { params.push(parseInt(plano));   clauses.push(`sl.sl_plano_id = $${params.length}`); }
  if (status)  { params.push(status);            clauses.push(`sl.sl_status = $${params.length}`); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(`${SELECT_BASE} ${where} ORDER BY sl.sl_data_expiracao`, params);
    res.json(rows.map(toRow));
  } catch (err) {
    console.error('GET /licenses:', err.message);
    res.status(500).json({ error: 'Erro ao listar licenças.' });
  }
});

// GET /api/licenses/summary — KPIs agregados (espelham as medidas DAX do dashboard)
router.get('/summary', async (req, res) => {
  try {
    const [porStatus, vencimentos, mrr, porPlano, totalEmpresas] = await Promise.all([
      pool.query(`SELECT sl_status AS status, COUNT(*)::int AS total FROM starvl_licenses GROUP BY sl_status`),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE sl_data_expiracao < CURRENT_DATE)                                            AS vencidas,
          COUNT(*) FILTER (WHERE sl_data_expiracao BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days')  AS vencendo_7,
          COUNT(*) FILTER (WHERE sl_data_expiracao BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '15 days') AS vencendo_15,
          COUNT(*) FILTER (WHERE sl_data_expiracao BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS vencendo_30
        FROM starvl_licenses
      `),
      pool.query(`
        SELECT COALESCE(SUM(sp.sp_valor_mensal), 0) AS mrr, COUNT(*)::int AS ativas
        FROM starvl_licenses sl JOIN starvl_plans sp ON sp.sp_id = sl.sl_plano_id
        WHERE sl.sl_status = 'Ativa'
      `),
      pool.query(`
        SELECT sp.sp_nome AS plano, COUNT(*)::int AS total
        FROM starvl_licenses sl JOIN starvl_plans sp ON sp.sp_id = sl.sl_plano_id
        GROUP BY sp.sp_nome ORDER BY total DESC
      `),
      pool.query(`SELECT COUNT(DISTINCT sl_empresa_id)::int AS total FROM starvl_licenses`),
    ]);

    const statusMap = Object.fromEntries(porStatus.rows.map(r => [r.status, r.total]));
    const mrrValor  = parseFloat(mrr.rows[0].mrr);
    const ativas    = mrr.rows[0].ativas;

    res.json({
      totalEmpresas:        totalEmpresas.rows[0].total,
      licencasAtivas:       statusMap['Ativa']      || 0,
      licencasExpiradas:    statusMap['Expirada']   || 0,
      licencasBloqueadas:   statusMap['Bloqueada']  || 0,
      licencasTeste:        statusMap['Teste']      || 0,
      licencasCanceladas:   statusMap['Cancelada']  || 0,
      vencidas:             parseInt(vencimentos.rows[0].vencidas),
      vencendoEm7Dias:      parseInt(vencimentos.rows[0].vencendo_7),
      vencendoEm15Dias:     parseInt(vencimentos.rows[0].vencendo_15),
      vencendoEm30Dias:     parseInt(vencimentos.rows[0].vencendo_30),
      receitaMensalRecorrente: mrrValor,
      receitaAnual:             mrrValor * 12,
      ticketMedio:              ativas ? Math.round((mrrValor / ativas) * 100) / 100 : 0,
      clientesPorPlano:         porPlano.rows,
    });
  } catch (err) {
    console.error('GET /licenses/summary:', err.message);
    res.status(500).json({ error: 'Erro ao calcular resumo de licenças.' });
  }
});

async function checkEmpresaExists(id) {
  const { rows } = await pool.query(`SELECT 1 FROM starvl_clients WHERE sc_id=$1`, [id]);
  return rows.length > 0;
}
async function checkPlanoExists(id) {
  const { rows } = await pool.query(`SELECT 1 FROM starvl_plans WHERE sp_id=$1`, [id]);
  return rows.length > 0;
}

// POST /api/licenses
router.post('/', async (req, res) => {
  const {
    empresaId, planoId, numeroLicenca, status, dataAtivacao, dataExpiracao,
    limiteUsuarios, usuariosUtilizados, limiteEmpresas, empresasUtilizadas,
    limiteConexoes, conexoesUtilizadas, valorLicenca,
  } = req.body;

  const empId   = parseInt(empresaId);
  const planId  = parseInt(planoId);
  const situacao = status || 'Ativa';

  if (!empId || !planId || !numeroLicenca?.trim() || !dataAtivacao || !dataExpiracao) {
    return res.status(400).json({ error: 'empresaId, planoId, numeroLicenca, dataAtivacao e dataExpiracao são obrigatórios.' });
  }
  if (!STATUS_VALIDOS.includes(situacao)) {
    return res.status(400).json({ error: `status deve ser um de: ${STATUS_VALIDOS.join(', ')}` });
  }
  if (!(await checkEmpresaExists(empId)))  return res.status(400).json({ error: `Empresa ${empId} não encontrada.` });
  if (!(await checkPlanoExists(planId)))   return res.status(400).json({ error: `Plano ${planId} não encontrado.` });

  try {
    const { rows } = await pool.query(
      `INSERT INTO starvl_licenses (
         sl_empresa_id, sl_plano_id, sl_numero_licenca, sl_status, sl_data_ativacao, sl_data_expiracao,
         sl_limite_usuarios, sl_usuarios_utilizados, sl_limite_empresas, sl_empresas_utilizadas,
         sl_limite_conexoes, sl_conexoes_utilizadas, sl_valor_licenca
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING sl_id`,
      [
        empId, planId, numeroLicenca.trim(), situacao, dataAtivacao, dataExpiracao,
        parseInt(limiteUsuarios) || 0, parseInt(usuariosUtilizados) || 0,
        parseInt(limiteEmpresas) || 1, parseInt(empresasUtilizadas) || 1,
        parseInt(limiteConexoes) || 1, parseInt(conexoesUtilizadas) || 0,
        parseFloat(valorLicenca) || 0,
      ]
    );
    const { rows: full } = await pool.query(`${SELECT_BASE} WHERE sl.sl_id = $1`, [rows[0].sl_id]);
    res.status(201).json(toRow(full[0]));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: `Licença "${numeroLicenca}" já existe.` });
    console.error('POST /licenses:', err.message);
    res.status(500).json({ error: 'Erro ao criar licença.' });
  }
});

// PUT /api/licenses/:id
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    empresaId, planoId, numeroLicenca, status, dataAtivacao, dataExpiracao,
    limiteUsuarios, usuariosUtilizados, limiteEmpresas, empresasUtilizadas,
    limiteConexoes, conexoesUtilizadas, valorLicenca,
  } = req.body;

  const situacao = status || 'Ativa';
  if (!STATUS_VALIDOS.includes(situacao)) {
    return res.status(400).json({ error: `status deve ser um de: ${STATUS_VALIDOS.join(', ')}` });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE starvl_licenses SET
         sl_empresa_id=$1, sl_plano_id=$2, sl_numero_licenca=$3, sl_status=$4,
         sl_data_ativacao=$5, sl_data_expiracao=$6,
         sl_limite_usuarios=$7, sl_usuarios_utilizados=$8,
         sl_limite_empresas=$9, sl_empresas_utilizadas=$10,
         sl_limite_conexoes=$11, sl_conexoes_utilizadas=$12,
         sl_valor_licenca=$13, sl_ultima_atualizacao=NOW()
       WHERE sl_id=$14
       RETURNING sl_id`,
      [
        parseInt(empresaId), parseInt(planoId), numeroLicenca?.trim(), situacao, dataAtivacao, dataExpiracao,
        parseInt(limiteUsuarios) || 0, parseInt(usuariosUtilizados) || 0,
        parseInt(limiteEmpresas) || 1, parseInt(empresasUtilizadas) || 1,
        parseInt(limiteConexoes) || 1, parseInt(conexoesUtilizadas) || 0,
        parseFloat(valorLicenca) || 0, id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: 'Licença não encontrada.' });
    const { rows: full } = await pool.query(`${SELECT_BASE} WHERE sl.sl_id = $1`, [id]);
    res.json(toRow(full[0]));
  } catch (err) {
    console.error('PUT /licenses:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar licença.' });
  }
});

// DELETE /api/licenses/:id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const { rows } = await pool.query(`DELETE FROM starvl_licenses WHERE sl_id=$1 RETURNING sl_id`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Licença não encontrada.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /licenses:', err.message);
    res.status(500).json({ error: 'Erro ao excluir licença.' });
  }
});

module.exports = router;
