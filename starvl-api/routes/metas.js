/**
 * routes/metas.js
 * Módulo de Gestão de Metas — CRUD, resultados, histórico, comentários,
 * resumo (KPIs), ranking e notificações (alertas computados ao vivo).
 * Segue o mesmo padrão de mainPool/pool das demais rotas de controle
 * (clients/plans/licenses/goals): dado de gestão, não dado do SGA por posto.
 */
const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

const TIPOS = [
  'empresa', 'filial', 'departamento', 'equipe', 'funcionario', 'vendedor',
  'caixa', 'comprador', 'produto', 'grupo_produtos', 'categoria', 'marca',
  'fornecedor', 'cliente',
];
const CATEGORIAS = ['Financeiro', 'Comercial', 'Estoque', 'Compras', 'Atendimento'];
const INDICADORES = {
  Financeiro:  ['Faturamento', 'Receita', 'Lucro', 'Margem', 'TicketMedio', 'Rentabilidade', 'FluxoCaixa'],
  Comercial:   ['QuantidadeVendida', 'NovosClientes', 'ClientesAtivos', 'Conversao', 'VendasPorHora', 'VendasPorDia'],
  Estoque:     ['Giro', 'Cobertura', 'EstoqueIdeal', 'Ruptura', 'Perdas', 'Inventario'],
  Compras:     ['Economia', 'PrazoMedio', 'ValorComprado', 'ProdutosComprados'],
  Atendimento: ['TempoMedio', 'Satisfacao', 'ChamadosResolvidos'],
};
const TODOS_INDICADORES = Object.values(INDICADORES).flat();
const FREQUENCIAS = ['Diária', 'Semanal', 'Quinzenal', 'Mensal', 'Trimestral', 'Semestral', 'Anual'];
const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Urgente'];
const ALERT_TYPES = ['atingiu_100', 'abaixo_esperado', 'prazo_proximo', 'vencida', 'ultrapassada'];

const inList = arr => arr.map(v => `'${v.replace(/'/g, "''")}'`).join(',');

// Cria tabelas (idempotente)
pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_metas (
    sm_id             SERIAL        PRIMARY KEY,
    sm_empresa_id     INTEGER       NOT NULL,
    sm_nome           VARCHAR(200)  NOT NULL,
    sm_descricao      TEXT          DEFAULT '',
    sm_tipo           VARCHAR(30)   NOT NULL CHECK (sm_tipo IN (${inList(TIPOS)})),
    sm_referencia     VARCHAR(200),
    sm_categoria      VARCHAR(20)   NOT NULL CHECK (sm_categoria IN (${inList(CATEGORIAS)})),
    sm_indicador      VARCHAR(40)   NOT NULL CHECK (sm_indicador IN (${inList(TODOS_INDICADORES)})),
    sm_valor_meta     NUMERIC(14,2) NOT NULL DEFAULT 0,
    sm_data_inicial   DATE          NOT NULL,
    sm_data_final     DATE          NOT NULL,
    sm_frequencia     VARCHAR(20)   NOT NULL DEFAULT 'Mensal' CHECK (sm_frequencia IN (${inList(FREQUENCIAS)})),
    sm_prioridade     VARCHAR(10)   NOT NULL DEFAULT 'Média' CHECK (sm_prioridade IN (${inList(PRIORIDADES)})),
    sm_responsavel    VARCHAR(150),
    sm_observacoes    TEXT          DEFAULT '',
    sm_status_manual  VARCHAR(20),
    sm_criado         TIMESTAMPTZ   DEFAULT NOW(),
    sm_atualizado     TIMESTAMPTZ   DEFAULT NOW()
  )
`).then(() => Promise.all([
  pool.query(`CREATE TABLE IF NOT EXISTS starvl_meta_resultados (
    smr_id           SERIAL        PRIMARY KEY,
    smr_meta_id       INTEGER       NOT NULL,
    smr_data          DATE          NOT NULL,
    smr_valor         NUMERIC(14,2) NOT NULL,
    smr_observacao    TEXT          DEFAULT '',
    smr_criado        TIMESTAMPTZ   DEFAULT NOW()
  )`),
  pool.query(`CREATE TABLE IF NOT EXISTS starvl_meta_historico (
    smh_id            SERIAL        PRIMARY KEY,
    smh_meta_id        INTEGER       NOT NULL,
    smh_campo          VARCHAR(50)   NOT NULL,
    smh_valor_antigo    TEXT,
    smh_valor_novo      TEXT,
    smh_usuario         VARCHAR(150),
    smh_criado          TIMESTAMPTZ   DEFAULT NOW()
  )`),
  pool.query(`CREATE TABLE IF NOT EXISTS starvl_meta_comentarios (
    smc_id            SERIAL        PRIMARY KEY,
    smc_meta_id        INTEGER       NOT NULL,
    smc_usuario         VARCHAR(150)  NOT NULL,
    smc_texto           TEXT          NOT NULL,
    smc_criado          TIMESTAMPTZ   DEFAULT NOW()
  )`),
  pool.query(`CREATE TABLE IF NOT EXISTS starvl_meta_notificacoes (
    smn_id            SERIAL        PRIMARY KEY,
    smn_meta_id        INTEGER       NOT NULL,
    smn_tipo            VARCHAR(30)   NOT NULL CHECK (smn_tipo IN (${inList(ALERT_TYPES)})),
    smn_lida            BOOLEAN       NOT NULL DEFAULT false,
    smn_criado          TIMESTAMPTZ   DEFAULT NOW(),
    UNIQUE (smn_meta_id, smn_tipo)
  )`),
])).then(() => Promise.all([
  pool.query(`CREATE INDEX IF NOT EXISTS idx_starvl_metas_empresa     ON starvl_metas (sm_empresa_id)`),
  pool.query(`CREATE INDEX IF NOT EXISTS idx_starvl_metas_responsavel ON starvl_metas (sm_responsavel)`),
  pool.query(`CREATE INDEX IF NOT EXISTS idx_starvl_metas_data_final  ON starvl_metas (sm_data_final)`),
  pool.query(`CREATE INDEX IF NOT EXISTS idx_starvl_metas_indicador   ON starvl_metas (sm_indicador)`),
  pool.query(`CREATE INDEX IF NOT EXISTS idx_starvl_meta_resultados_meta ON starvl_meta_resultados (smr_meta_id)`),
])).catch(err => console.error('[metas] ensureTables:', err.message));

// ── Regras de cálculo ───────────────────────────────────────────────────────

// Datas DATE do Postgres chegam via node-pg como Date ancorado em UTC
// meia-noite. Usar .setHours() (hora local) pra zerar o horário desloca o
// dia em servidores fora do fuso UTC — por isso todo o cálculo de
// status/alertas trabalha em "dia UTC" (timestamp do início do dia em UTC),
// nunca com getters/setters locais.
function toDiaUTC(value) {
  const d = new Date(value);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function computeStatusPercentual(meta, valorAtual) {
  const hojeUTC        = toDiaUTC(new Date());
  const dataFinalUTC    = toDiaUTC(meta.sm_data_final);
  const dataInicialUTC  = toDiaUTC(meta.sm_data_inicial);
  const valorMeta       = parseFloat(meta.sm_valor_meta) || 0;
  const percentual      = valorMeta > 0 ? Math.round((valorAtual / valorMeta) * 1000) / 10 : 0;

  let status;
  if (meta.sm_status_manual === 'Cancelada')              status = 'Cancelada';
  else if (hojeUTC > dataFinalUTC && percentual < 100)     status = 'Atrasada';
  else if (percentual >= 100)                              status = 'Concluída';
  else if (hojeUTC < dataInicialUTC)                       status = 'Não iniciada';
  else                                                       status = 'Em andamento';

  return { percentual, status };
}

function computeAlerts(meta, valorAtual) {
  const { percentual, status } = computeStatusPercentual(meta, valorAtual);
  const alerts = [];
  const hojeUTC       = toDiaUTC(new Date());
  const dataFinalUTC   = toDiaUTC(meta.sm_data_final);
  const dataInicialUTC = toDiaUTC(meta.sm_data_inicial);
  const diasRestantes  = Math.round((dataFinalUTC - hojeUTC) / 86400000);

  if (status === 'Atrasada') alerts.push('vencida');
  if (percentual >= 110)      alerts.push('ultrapassada');
  else if (percentual >= 100) alerts.push('atingiu_100');
  if (status === 'Em andamento' && diasRestantes >= 0 && diasRestantes <= 7) alerts.push('prazo_proximo');

  const totalDias   = (dataFinalUTC - dataInicialUTC) / 86400000;
  const decorridos  = (hojeUTC - dataInicialUTC) / 86400000;
  if (status === 'Em andamento' && totalDias > 0) {
    const esperado = Math.min(100, Math.max(0, (decorridos / totalDias) * 100));
    if (percentual < esperado - 15) alerts.push('abaixo_esperado');
  }
  return alerts;
}

const toRow = r => {
  const valorAtual = parseFloat(r.valor_atual || 0);
  const { percentual, status } = computeStatusPercentual(r, valorAtual);
  return {
    id:             r.sm_id,
    empresaId:      r.sm_empresa_id,
    nome:           r.sm_nome,
    descricao:      r.sm_descricao || '',
    tipo:           r.sm_tipo,
    referencia:     r.sm_referencia || '',
    categoria:      r.sm_categoria,
    indicador:      r.sm_indicador,
    valorMeta:      parseFloat(r.sm_valor_meta),
    valorAtual,
    percentual,
    dataInicial:    r.sm_data_inicial,
    dataFinal:      r.sm_data_final,
    frequencia:     r.sm_frequencia,
    prioridade:     r.sm_prioridade,
    responsavel:    r.sm_responsavel || '',
    observacoes:    r.sm_observacoes || '',
    status,
    criado:         r.sm_criado,
    atualizado:     r.sm_atualizado,
  };
};

const SELECT_COM_VALOR = `
  SELECT m.*, COALESCE(SUM(r.smr_valor), 0) AS valor_atual
  FROM starvl_metas m
  LEFT JOIN starvl_meta_resultados r
    ON r.smr_meta_id = m.sm_id AND r.smr_data BETWEEN m.sm_data_inicial AND m.sm_data_final
`;

// ── GET /api/metas — lista com filtros + paginação ─────────────────────────
router.get('/', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório.' });

  const { tipo, categoria, indicador, status, responsavel } = req.query;
  const page    = Math.max(parseInt(req.query.page) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(req.query.perPage) || 12, 1), 100);

  const clauses = ['m.sm_empresa_id = $1'];
  const params  = [empresa];
  if (tipo)        { params.push(tipo);               clauses.push(`m.sm_tipo = $${params.length}`); }
  if (categoria)   { params.push(categoria);           clauses.push(`m.sm_categoria = $${params.length}`); }
  if (indicador)   { params.push(indicador);           clauses.push(`m.sm_indicador = $${params.length}`); }
  if (responsavel) { params.push(`%${responsavel}%`);  clauses.push(`m.sm_responsavel ILIKE $${params.length}`); }

  try {
    const { rows } = await pool.query(
      `${SELECT_COM_VALOR} WHERE ${clauses.join(' AND ')} GROUP BY m.sm_id ORDER BY m.sm_data_final ASC`,
      params
    );
    let mapped = rows.map(toRow);
    if (status) mapped = mapped.filter(m => m.status === status);

    const total = mapped.length;
    const start = (page - 1) * perPage;
    res.json({
      data: mapped.slice(start, start + perPage),
      total, page, perPage,
      totalPages: Math.max(Math.ceil(total / perPage), 1),
    });
  } catch (err) {
    console.error('GET /metas:', err.message);
    res.status(500).json({ error: 'Erro ao listar metas.' });
  }
});

// ── GET /api/metas/resumo — KPIs do dashboard ───────────────────────────────
router.get('/resumo', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório.' });
  try {
    const { rows } = await pool.query(
      `${SELECT_COM_VALOR} WHERE m.sm_empresa_id = $1 GROUP BY m.sm_id`, [empresa]
    );
    const computed = rows.map(r => {
      const { percentual, status } = computeStatusPercentual(r, parseFloat(r.valor_atual));
      return { nome: r.sm_nome, percentual, status };
    });

    const total      = computed.length;
    const concluidas = computed.filter(m => m.status === 'Concluída').length;
    const andamento  = computed.filter(m => m.status === 'Em andamento').length;
    const atrasadas  = computed.filter(m => m.status === 'Atrasada').length;
    const media      = total ? Math.round((computed.reduce((s, m) => s + m.percentual, 0) / total) * 10) / 10 : 0;
    const ordenadas  = [...computed].sort((a, b) => b.percentual - a.percentual);

    res.json({
      total, concluidas, emAndamento: andamento, atrasadas,
      mediaCumprimento: media,
      melhorDesempenho: ordenadas[0] || null,
      piorDesempenho:   ordenadas.length ? ordenadas[ordenadas.length - 1] : null,
    });
  } catch (err) {
    console.error('GET /metas/resumo:', err.message);
    res.status(500).json({ error: 'Erro ao calcular resumo.' });
  }
});

// ── GET /api/metas/ranking ───────────────────────────────────────────────────
router.get('/ranking', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const tipo = req.query.tipo || 'vendedores';
  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório.' });

  const TIPO_MAP = { vendedores: 'vendedor', departamentos: 'departamento', produtos: 'produto', clientes: 'cliente' };

  try {
    if (tipo === 'metas') {
      const { rows } = await pool.query(
        `${SELECT_COM_VALOR} WHERE m.sm_empresa_id = $1 GROUP BY m.sm_id
         ORDER BY (COALESCE(SUM(r.smr_valor),0) / NULLIF(m.sm_valor_meta,0)) DESC NULLS LAST LIMIT 10`,
        [empresa]
      );
      return res.json(rows.map(r => {
        const { percentual, status } = computeStatusPercentual(r, parseFloat(r.valor_atual));
        return { nome: r.sm_nome, percentual, status, valorAtual: parseFloat(r.valor_atual), valorMeta: parseFloat(r.sm_valor_meta) };
      }));
    }

    if (tipo === 'empresas') {
      const { rows } = await pool.query(`
        SELECT sc.sc_nome AS nome,
               COALESCE(SUM(r.smr_valor), 0) AS valor_atual,
               COALESCE(SUM(m.sm_valor_meta), 0) AS valor_meta
        FROM starvl_metas m
        JOIN starvl_clients sc ON sc.sc_id = m.sm_empresa_id
        LEFT JOIN starvl_meta_resultados r
          ON r.smr_meta_id = m.sm_id AND r.smr_data BETWEEN m.sm_data_inicial AND m.sm_data_final
        GROUP BY sc.sc_id, sc.sc_nome
        ORDER BY (COALESCE(SUM(r.smr_valor),0) / NULLIF(SUM(m.sm_valor_meta),0)) DESC NULLS LAST
        LIMIT 10
      `);
      return res.json(rows.map(r => ({
        nome: r.nome,
        percentual: r.valor_meta > 0 ? Math.round((r.valor_atual / r.valor_meta) * 1000) / 10 : 0,
        valorAtual: parseFloat(r.valor_atual), valorMeta: parseFloat(r.valor_meta),
      })));
    }

    const smTipo = TIPO_MAP[tipo];
    if (!smTipo) return res.status(400).json({ error: 'tipo de ranking inválido.' });

    const { rows } = await pool.query(`
      SELECT m.sm_referencia AS nome,
             COALESCE(SUM(r.smr_valor), 0) AS valor_atual,
             COALESCE(SUM(m.sm_valor_meta), 0) AS valor_meta
      FROM starvl_metas m
      LEFT JOIN starvl_meta_resultados r
        ON r.smr_meta_id = m.sm_id AND r.smr_data BETWEEN m.sm_data_inicial AND m.sm_data_final
      WHERE m.sm_empresa_id = $1 AND m.sm_tipo = $2 AND COALESCE(m.sm_referencia, '') != ''
      GROUP BY m.sm_referencia
      ORDER BY (COALESCE(SUM(r.smr_valor),0) / NULLIF(SUM(m.sm_valor_meta),0)) DESC NULLS LAST
      LIMIT 10
    `, [empresa, smTipo]);

    res.json(rows.map(r => ({
      nome: r.nome,
      percentual: r.valor_meta > 0 ? Math.round((r.valor_atual / r.valor_meta) * 1000) / 10 : 0,
      valorAtual: parseFloat(r.valor_atual), valorMeta: parseFloat(r.valor_meta),
    })));
  } catch (err) {
    console.error('GET /metas/ranking:', err.message);
    res.status(500).json({ error: 'Erro ao gerar ranking.' });
  }
});

// ── GET /api/metas/notificacoes — alertas computados ao vivo ───────────────
router.get('/notificacoes', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório.' });
  try {
    const { rows } = await pool.query(
      `${SELECT_COM_VALOR} WHERE m.sm_empresa_id = $1 GROUP BY m.sm_id`, [empresa]
    );
    const metaIds = rows.map(r => r.sm_id);
    const { rows: lidas } = metaIds.length
      ? await pool.query(`SELECT smn_meta_id, smn_tipo FROM starvl_meta_notificacoes WHERE smn_meta_id = ANY($1) AND smn_lida = true`, [metaIds])
      : { rows: [] };
    const lidaSet = new Set(lidas.map(l => `${l.smn_meta_id}:${l.smn_tipo}`));

    const notificacoes = [];
    for (const r of rows) {
      for (const tipo of computeAlerts(r, parseFloat(r.valor_atual))) {
        notificacoes.push({
          metaId: r.sm_id,
          metaNome: r.sm_nome,
          tipo,
          lida: lidaSet.has(`${r.sm_id}:${tipo}`),
        });
      }
    }
    res.json(notificacoes);
  } catch (err) {
    console.error('GET /metas/notificacoes:', err.message);
    res.status(500).json({ error: 'Erro ao calcular notificações.' });
  }
});

// ── GET /api/metas/evolucao — total lançado por mês (últimos N meses) ──────
router.get('/evolucao', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório.' });
  const meses = Math.min(Math.max(parseInt(req.query.meses) || 6, 1), 24);
  try {
    const { rows } = await pool.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', r.smr_data), 'YYYY-MM') AS mes,
              COALESCE(SUM(r.smr_valor), 0) AS valor
       FROM starvl_meta_resultados r
       JOIN starvl_metas m ON m.sm_id = r.smr_meta_id
       WHERE m.sm_empresa_id = $1
         AND r.smr_data >= DATE_TRUNC('month', CURRENT_DATE) - ($2 || ' months')::interval
       GROUP BY 1
       ORDER BY 1`,
      [empresa, meses - 1]
    );
    res.json(rows.map(r => ({ mes: r.mes, valor: parseFloat(r.valor) })));
  } catch (err) {
    console.error('GET /metas/evolucao:', err.message);
    res.status(500).json({ error: 'Erro ao calcular evolução.' });
  }
});

router.patch('/notificacoes/:metaId/:tipo/lida', async (req, res) => {
  const metaId = parseInt(req.params.metaId);
  const { tipo } = req.params;
  if (!ALERT_TYPES.includes(tipo)) return res.status(400).json({ error: 'tipo de alerta inválido.' });
  try {
    await pool.query(
      `INSERT INTO starvl_meta_notificacoes (smn_meta_id, smn_tipo, smn_lida) VALUES ($1,$2,true)
       ON CONFLICT (smn_meta_id, smn_tipo) DO UPDATE SET smn_lida = true`,
      [metaId, tipo]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /metas/notificacoes:', err.message);
    res.status(500).json({ error: 'Erro ao marcar notificação.' });
  }
});

// ── GET /api/metas/:id — detalhe (resultados + histórico + comentários) ────
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const { rows } = await pool.query(`${SELECT_COM_VALOR} WHERE m.sm_id = $1 GROUP BY m.sm_id`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Meta não encontrada.' });

    const [resultados, historico, comentarios] = await Promise.all([
      pool.query(`SELECT smr_id AS id, smr_data AS data, smr_valor AS valor, smr_observacao AS observacao FROM starvl_meta_resultados WHERE smr_meta_id=$1 ORDER BY smr_data`, [id]),
      pool.query(`SELECT smh_id AS id, smh_campo AS campo, smh_valor_antigo AS "valorAntigo", smh_valor_novo AS "valorNovo", smh_usuario AS usuario, smh_criado AS criado FROM starvl_meta_historico WHERE smh_meta_id=$1 ORDER BY smh_criado DESC`, [id]),
      pool.query(`SELECT smc_id AS id, smc_usuario AS usuario, smc_texto AS texto, smc_criado AS criado FROM starvl_meta_comentarios WHERE smc_meta_id=$1 ORDER BY smc_criado DESC`, [id]),
    ]);

    res.json({
      ...toRow(rows[0]),
      resultados: resultados.rows.map(r => ({ ...r, valor: parseFloat(r.valor) })),
      historico: historico.rows,
      comentarios: comentarios.rows,
    });
  } catch (err) {
    console.error('GET /metas/:id:', err.message);
    res.status(500).json({ error: 'Erro ao buscar meta.' });
  }
});

// ── POST /api/metas — cria ──────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    empresaId, nome, descricao, tipo, referencia, categoria, indicador,
    valorMeta, dataInicial, dataFinal, frequencia, prioridade, responsavel, observacoes, usuario,
  } = req.body;

  const empId = parseInt(empresaId);
  if (!empId || !nome?.trim() || !tipo || !categoria || !indicador || !dataInicial || !dataFinal) {
    return res.status(400).json({ error: 'empresaId, nome, tipo, categoria, indicador, dataInicial e dataFinal são obrigatórios.' });
  }
  if (!TIPOS.includes(tipo))               return res.status(400).json({ error: 'tipo inválido.' });
  if (!CATEGORIAS.includes(categoria))     return res.status(400).json({ error: 'categoria inválida.' });
  if (!INDICADORES[categoria]?.includes(indicador)) {
    return res.status(400).json({ error: 'indicador inválido para a categoria informada.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO starvl_metas (
         sm_empresa_id, sm_nome, sm_descricao, sm_tipo, sm_referencia, sm_categoria, sm_indicador,
         sm_valor_meta, sm_data_inicial, sm_data_final, sm_frequencia, sm_prioridade, sm_responsavel, sm_observacoes
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING sm_id`,
      [
        empId, nome.trim(), descricao?.trim() || '', tipo, referencia?.trim() || null, categoria, indicador,
        parseFloat(valorMeta) || 0, dataInicial, dataFinal, frequencia || 'Mensal', prioridade || 'Média',
        responsavel?.trim() || null, observacoes?.trim() || '',
      ]
    );
    const id = rows[0].sm_id;
    await pool.query(
      `INSERT INTO starvl_meta_historico (smh_meta_id, smh_campo, smh_valor_novo, smh_usuario) VALUES ($1,'criação',$2,$3)`,
      [id, nome.trim(), usuario || 'Sistema']
    );
    const { rows: full } = await pool.query(`${SELECT_COM_VALOR} WHERE m.sm_id = $1 GROUP BY m.sm_id`, [id]);
    res.status(201).json(toRow(full[0]));
  } catch (err) {
    console.error('POST /metas:', err.message);
    res.status(500).json({ error: 'Erro ao criar meta.' });
  }
});

// ── PUT /api/metas/:id — atualiza (grava diff no histórico) ────────────────
const FIELD_MAP = {
  nome: 'sm_nome', descricao: 'sm_descricao', tipo: 'sm_tipo', referencia: 'sm_referencia',
  categoria: 'sm_categoria', indicador: 'sm_indicador', valorMeta: 'sm_valor_meta',
  dataInicial: 'sm_data_inicial', dataFinal: 'sm_data_final', frequencia: 'sm_frequencia',
  prioridade: 'sm_prioridade', responsavel: 'sm_responsavel', observacoes: 'sm_observacoes',
};

router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { usuario, statusManual, ...body } = req.body;
  try {
    const { rows: existing } = await pool.query(`SELECT * FROM starvl_metas WHERE sm_id=$1`, [id]);
    if (!existing.length) return res.status(404).json({ error: 'Meta não encontrada.' });
    const old = existing[0];

    const sets = [];
    const params = [];
    const historicoEntries = [];

    for (const [key, col] of Object.entries(FIELD_MAP)) {
      if (!(key in body)) continue;
      let newVal = body[key];
      newVal = typeof newVal === 'string' ? newVal.trim() : newVal;
      const oldVal = old[col];
      if (String(oldVal ?? '') !== String(newVal ?? '')) {
        params.push(newVal === '' ? null : newVal);
        sets.push(`${col} = $${params.length}`);
        historicoEntries.push([key, oldVal, newVal]);
      }
    }
    if (statusManual !== undefined && statusManual !== old.sm_status_manual) {
      params.push(statusManual || null);
      sets.push(`sm_status_manual = $${params.length}`);
      historicoEntries.push(['status', old.sm_status_manual, statusManual]);
    }

    if (sets.length) {
      params.push(id);
      sets.push('sm_atualizado = NOW()');
      await pool.query(`UPDATE starvl_metas SET ${sets.join(', ')} WHERE sm_id = $${params.length}`, params);
      for (const [campo, antigo, novo] of historicoEntries) {
        await pool.query(
          `INSERT INTO starvl_meta_historico (smh_meta_id, smh_campo, smh_valor_antigo, smh_valor_novo, smh_usuario) VALUES ($1,$2,$3,$4,$5)`,
          [id, campo, antigo != null ? String(antigo) : null, novo != null ? String(novo) : null, usuario || 'Sistema']
        );
      }
    }

    const { rows: full } = await pool.query(`${SELECT_COM_VALOR} WHERE m.sm_id = $1 GROUP BY m.sm_id`, [id]);
    res.json(toRow(full[0]));
  } catch (err) {
    console.error('PUT /metas:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar meta.' });
  }
});

// ── DELETE /api/metas/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const { rows } = await pool.query(`DELETE FROM starvl_metas WHERE sm_id=$1 RETURNING sm_id`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Meta não encontrada.' });
    await Promise.all([
      pool.query(`DELETE FROM starvl_meta_resultados WHERE smr_meta_id=$1`, [id]),
      pool.query(`DELETE FROM starvl_meta_historico WHERE smh_meta_id=$1`, [id]),
      pool.query(`DELETE FROM starvl_meta_comentarios WHERE smc_meta_id=$1`, [id]),
      pool.query(`DELETE FROM starvl_meta_notificacoes WHERE smn_meta_id=$1`, [id]),
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /metas:', err.message);
    res.status(500).json({ error: 'Erro ao excluir meta.' });
  }
});

// ── POST /api/metas/:id/resultados — lança um resultado ─────────────────────
router.post('/:id/resultados', async (req, res) => {
  const id = parseInt(req.params.id);
  const { data, valor, observacao, usuario } = req.body;
  if (!data || valor === undefined || valor === null) {
    return res.status(400).json({ error: 'data e valor são obrigatórios.' });
  }
  try {
    const { rows: metaRows } = await pool.query(`SELECT sm_id FROM starvl_metas WHERE sm_id=$1`, [id]);
    if (!metaRows.length) return res.status(404).json({ error: 'Meta não encontrada.' });

    await pool.query(
      `INSERT INTO starvl_meta_resultados (smr_meta_id, smr_data, smr_valor, smr_observacao) VALUES ($1,$2,$3,$4)`,
      [id, data, parseFloat(valor), observacao?.trim() || '']
    );
    await pool.query(
      `INSERT INTO starvl_meta_historico (smh_meta_id, smh_campo, smh_valor_novo, smh_usuario) VALUES ($1,'resultado',$2,$3)`,
      [id, String(valor), usuario || 'Sistema']
    );

    const { rows: full } = await pool.query(`${SELECT_COM_VALOR} WHERE m.sm_id = $1 GROUP BY m.sm_id`, [id]);
    res.status(201).json(toRow(full[0]));
  } catch (err) {
    console.error('POST /metas/:id/resultados:', err.message);
    res.status(500).json({ error: 'Erro ao lançar resultado.' });
  }
});

// ── POST /api/metas/:id/comentarios ─────────────────────────────────────────
router.post('/:id/comentarios', async (req, res) => {
  const id = parseInt(req.params.id);
  const { usuario, texto } = req.body;
  if (!usuario?.trim() || !texto?.trim()) return res.status(400).json({ error: 'usuario e texto são obrigatórios.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO starvl_meta_comentarios (smc_meta_id, smc_usuario, smc_texto)
       VALUES ($1,$2,$3) RETURNING smc_id AS id, smc_usuario AS usuario, smc_texto AS texto, smc_criado AS criado`,
      [id, usuario.trim(), texto.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /metas/:id/comentarios:', err.message);
    res.status(500).json({ error: 'Erro ao comentar.' });
  }
});

module.exports = router;
// Exportadas à parte para teste unitário isolado (funções puras, sem I/O).
module.exports.computeStatusPercentual = computeStatusPercentual;
module.exports.computeAlerts = computeAlerts;
