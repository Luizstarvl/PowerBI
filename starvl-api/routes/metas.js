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
const { queryFor, isEmpresaRegistered } = require('../db/poolManager');
const { requireAuth, requireAdmin, requirePerm } = require('../middleware/auth');

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
    smr_origem        VARCHAR(10)   NOT NULL DEFAULT 'manual' CHECK (smr_origem IN ('manual','auto')),
    smr_criado        TIMESTAMPTZ   DEFAULT NOW()
  )`).then(() => pool.query(`ALTER TABLE starvl_meta_resultados ADD COLUMN IF NOT EXISTS smr_origem VARCHAR(10) NOT NULL DEFAULT 'manual'`)),
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
    sincronizavel:  !!SYNC_INDICADORES[r.sm_indicador],
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

// ── Sincronização automática com vendas do SGA ──────────────────────────────
// Só indicadores com uma query equivalente no banco do posto (SGA) entram
// aqui. Cada função recebe (query, dataInicio, dataFim) — query já vinculada
// ao pool da empresa certa via queryFor(codigoEmpresa) — e devolve o valor
// apurado no período. Mesma query-base usada no KPI "Vendas" do Dashboard
// (routes/dashboard.js), pra garantir que os dois números batem.
const SYNC_INDICADORES = {
  Faturamento: async (query, codigoEmpresa, dataInicio, dataFim) => {
    const { rows } = await query(
      `SELECT COALESCE(SUM(vdit.vdittotal), 0) AS valor_total_vendas
       FROM vda JOIN vdit ON vdit.vditcodigovda=vda.vdacodigo AND vdit.vditempresa=vda.vdaempresa
       WHERE vda.vdaempresa=$1 AND vda.vdamovimento>=$2 AND vda.vdamovimento<=$3
         AND (vda.vdastatus IS NULL OR vda.vdastatus=0)`,
      [codigoEmpresa, dataInicio, dataFim]
    );
    return parseFloat(rows[0].valor_total_vendas) || 0;
  },
};

// Busca o valor no SGA e grava/atualiza o resultado "auto" da meta (substitui
// só o resultado automático anterior — resultados lançados manualmente pelo
// usuário não são tocados). Lança em ISO string; quem chama decide quando.
async function sincronizarMeta(id, usuario) {
  const { rows } = await pool.query(
    `SELECT m.sm_id, m.sm_indicador, m.sm_data_inicial, m.sm_data_final, c.sc_codigo
     FROM starvl_metas m JOIN starvl_clients c ON c.sc_id = m.sm_empresa_id
     WHERE m.sm_id = $1`, [id]
  );
  if (!rows.length) return { ok: false, error: 'Meta não encontrada.' };
  const meta = rows[0];
  const sincronizador = SYNC_INDICADORES[meta.sm_indicador];
  if (!sincronizador) return { ok: false, skipped: true };

  const hojeISO = new Date().toISOString().slice(0, 10);
  const dataInicio = new Date(meta.sm_data_inicial).toISOString().slice(0, 10);
  // Não faz sentido consultar vendas no futuro — apura só até hoje (ou até
  // o fim da meta, se ela já tiver terminado).
  const dataFimMeta = new Date(meta.sm_data_final).toISOString().slice(0, 10);
  const dataFim = dataFimMeta < hojeISO ? dataFimMeta : hojeISO;

  if (!isEmpresaRegistered(meta.sc_codigo)) {
    throw new Error(
      `Empresa código ${meta.sc_codigo} não tem conexão com o banco de vendas configurada ` +
      `(Parâmetros → Conexão). Sem isso não há como consultar as vendas dela.`
    );
  }

  const query = queryFor(meta.sc_codigo);
  const valor = await sincronizador(query, meta.sc_codigo, dataInicio, dataFim);

  await pool.query(`DELETE FROM starvl_meta_resultados WHERE smr_meta_id=$1 AND smr_origem='auto'`, [id]);
  await pool.query(
    `INSERT INTO starvl_meta_resultados (smr_meta_id, smr_data, smr_valor, smr_observacao, smr_origem)
     VALUES ($1,$2,$3,'Sincronizado automaticamente das vendas do sistema.','auto')`,
    [id, hojeISO, valor]
  );
  await pool.query(
    `INSERT INTO starvl_meta_historico (smh_meta_id, smh_campo, smh_valor_novo, smh_usuario) VALUES ($1,'sincronização',$2,$3)`,
    [id, String(valor), usuario || 'Sistema']
  );
  return { ok: true, valor };
}

// Autenticação obrigatória em todas as rotas de metas
router.use(requireAuth);

// Operações de escrita exigem modo 'completo'; DELETE exige admin
const requireWrite = requirePerm('modo', 'completo');
router.use((req, res, next) => {
  if (req.method === 'DELETE')                             return requireAdmin(req, res, next);
  if (['POST', 'PUT', 'PATCH'].includes(req.method))      return requireWrite(req, res, next);
  next();
});

// ── GET /api/metas — lista com filtros + paginação ─────────────────────────
router.get('/', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório.' });

  const { tipo, categoria, indicador, status, responsavel, periodo } = req.query;
  const page    = Math.max(parseInt(req.query.page) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(req.query.perPage) || 12, 1), 100);

  const clauses = ['m.sm_empresa_id = $1'];
  const params  = [empresa];
  if (tipo)        { params.push(tipo);               clauses.push(`m.sm_tipo = $${params.length}`); }
  if (categoria)   { params.push(categoria);           clauses.push(`m.sm_categoria = $${params.length}`); }
  if (indicador)   { params.push(indicador);           clauses.push(`m.sm_indicador = $${params.length}`); }
  if (responsavel) { params.push(`%${responsavel}%`);  clauses.push(`m.sm_responsavel ILIKE $${params.length}`); }
  // periodo = mês (YYYY-MM) em que o prazo da meta (sm_data_final) cai
  if (periodo)     { params.push(`${periodo}-01`);     clauses.push(`DATE_TRUNC('month', m.sm_data_final) = $${params.length}::date`); }

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
    const canceladas = computed.filter(m => m.status === 'Cancelada').length;
    const ativas     = total - canceladas - concluidas;
    const media      = total ? Math.round((computed.reduce((s, m) => s + m.percentual, 0) / total) * 10) / 10 : 0;
    const ordenadas  = [...computed].sort((a, b) => b.percentual - a.percentual);

    // "Vence hoje": prazo é hoje e a meta ainda não terminou (nem concluída
    // nem cancelada) — mesma comparação em dia UTC usada no resto do arquivo.
    const hojeUTCDia = toDiaUTC(new Date());
    const venceHoje = rows.filter((r, i) => {
      const st = computed[i].status;
      return st !== 'Concluída' && st !== 'Cancelada' && toDiaUTC(r.sm_data_final) === hojeUTCDia;
    }).length;

    const valorTotalMetas = rows.reduce((s, r) => s + (parseFloat(r.sm_valor_meta) || 0), 0);
    const valorTotalAtual = rows.reduce((s, r) => s + parseFloat(r.valor_atual || 0), 0);

    // Comparativo mês atual vs anterior — aproximação, não um snapshot
    // histórico de verdade (não existe tabela guardando o resumo por
    // período). Total/valor usam o mês de criação (sm_criado); os status
    // (concluída/andamento/atrasada) usam o mês do prazo (sm_data_final),
    // já que é a única data que os relaciona a um período específico.
    const hoje              = new Date();
    const inicioMesAtual    = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1);
    const inicioMesAnterior = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - 1, 1);
    const noMesAtual    = t => t >= inicioMesAtual;
    const noMesAnterior = t => t >= inicioMesAnterior && t < inicioMesAtual;

    const porCriado = (pred) => rows.filter(r => pred(toDiaUTC(r.sm_criado))).length;
    const porFinalEStatus = (statusAlvo, pred) => computed.filter((m, i) =>
      m.status === statusAlvo && pred(toDiaUTC(rows[i].sm_data_final))
    ).length;
    const valorPorCriado = (pred) => rows
      .filter(r => pred(toDiaUTC(r.sm_criado)))
      .reduce((s, r) => s + (parseFloat(r.sm_valor_meta) || 0), 0);

    const comparativo = {
      total:        { atual: porCriado(noMesAtual), anterior: porCriado(noMesAnterior) },
      concluidas:   { atual: porFinalEStatus('Concluída', noMesAtual),   anterior: porFinalEStatus('Concluída', noMesAnterior) },
      emAndamento:  { atual: porFinalEStatus('Em andamento', noMesAtual), anterior: porFinalEStatus('Em andamento', noMesAnterior) },
      atrasadas:    { atual: porFinalEStatus('Atrasada', noMesAtual),    anterior: porFinalEStatus('Atrasada', noMesAnterior) },
      valorTotal:   { atual: valorPorCriado(noMesAtual), anterior: valorPorCriado(noMesAnterior) },
    };

    res.json({
      total, concluidas, emAndamento: andamento, atrasadas, canceladas, ativas, venceHoje,
      mediaCumprimento: media,
      valorTotalMetas, valorTotalAtual,
      melhorDesempenho: ordenadas[0] || null,
      piorDesempenho:   ordenadas.length ? ordenadas[ordenadas.length - 1] : null,
      comparativo,
    });
  } catch (err) {
    console.error('GET /metas/resumo:', err.message);
    res.status(500).json({ error: 'Erro ao calcular resumo.' });
  }
});

// ── GET /api/metas/categorias — distribuição por categoria (valor + %) ─────
router.get('/categorias', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório.' });
  try {
    const { rows } = await pool.query(
      `${SELECT_COM_VALOR} WHERE m.sm_empresa_id = $1 GROUP BY m.sm_id`, [empresa]
    );
    const grupos = {};
    rows.forEach(r => {
      const cat = r.sm_categoria;
      if (!grupos[cat]) grupos[cat] = { categoria: cat, valorAtual: 0, totalMetas: 0 };
      grupos[cat].valorAtual += parseFloat(r.valor_atual || 0);
      grupos[cat].totalMetas += 1;
    });
    const lista = Object.values(grupos);
    const somaTotal = lista.reduce((s, g) => s + g.valorAtual, 0);
    res.json(lista
      .map(g => ({ ...g, percentual: somaTotal > 0 ? Math.round((g.valorAtual / somaTotal) * 1000) / 10 : 0 }))
      .sort((a, b) => b.valorAtual - a.valorAtual));
  } catch (err) {
    console.error('GET /metas/categorias:', err.message);
    res.status(500).json({ error: 'Erro ao calcular categorias.' });
  }
});

// ── GET /api/metas/progresso-mensal — meta/alcançado/previsto por mês ──────
// "Previsto" é uma projeção de ritmo linear (valor total das metas do ano
// dividido igualmente pelos 12 meses) — não é um valor cadastrado por
// ninguém, é só uma referência visual de "ritmo esperado se o progresso
// fosse constante ao longo do ano".
router.get('/progresso-mensal', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const ano = parseInt(req.query.ano) || new Date().getFullYear();
  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório.' });
  try {
    const { rows } = await pool.query(
      `${SELECT_COM_VALOR} WHERE m.sm_empresa_id = $1 AND EXTRACT(YEAR FROM m.sm_data_final) = $2 GROUP BY m.sm_id`,
      [empresa, ano]
    );
    const porMes = Array.from({ length: 12 }, () => ({ meta: 0, alcancado: 0 }));
    rows.forEach(r => {
      const mesIdx = new Date(r.sm_data_final).getUTCMonth(); // 0-11, coluna DATE vem ancorada em UTC
      porMes[mesIdx].meta      += parseFloat(r.sm_valor_meta || 0);
      porMes[mesIdx].alcancado += parseFloat(r.valor_atual   || 0);
    });
    const valorTotalAno = porMes.reduce((s, m) => s + m.meta, 0);
    const NOMES_MES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    res.json(porMes.map((m, i) => ({
      mes: i + 1,
      mesLabel: NOMES_MES[i],
      meta:      Math.round(m.meta * 100) / 100,
      alcancado: Math.round(m.alcancado * 100) / 100,
      previsto:  Math.round(valorTotalAno * ((i + 1) / 12) * 100) / 100,
    })));
  } catch (err) {
    console.error('GET /metas/progresso-mensal:', err.message);
    res.status(500).json({ error: 'Erro ao calcular progresso mensal.' });
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

    if (tipo === 'responsaveis') {
      const { rows } = await pool.query(`
        SELECT m.sm_responsavel AS nome,
               COALESCE(SUM(r.smr_valor), 0) AS valor_atual,
               COALESCE(SUM(m.sm_valor_meta), 0) AS valor_meta
        FROM starvl_metas m
        LEFT JOIN starvl_meta_resultados r
          ON r.smr_meta_id = m.sm_id AND r.smr_data BETWEEN m.sm_data_inicial AND m.sm_data_final
        WHERE m.sm_empresa_id = $1 AND COALESCE(m.sm_responsavel, '') != ''
        GROUP BY m.sm_responsavel
        ORDER BY (COALESCE(SUM(r.smr_valor),0) / NULLIF(SUM(m.sm_valor_meta),0)) DESC NULLS LAST
        LIMIT 10
      `, [empresa]);
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

// ── GET /api/metas/evolucao — criadas/concluídas/vencidas + valor por mês ──
// "Concluídas"/"vencidas" são aproximadas pelo mês de sm_data_final das metas
// com esse status hoje — não existe coluna de "data de conclusão" guardada,
// então não há como saber o mês exato em que cada uma virou concluída/vencida.
router.get('/evolucao', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório.' });
  const meses = Math.min(Math.max(parseInt(req.query.meses) || 6, 1), 24);
  try {
    const valorRes = await pool.query(
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
    const { rows: metas } = await pool.query(
      `${SELECT_COM_VALOR} WHERE m.sm_empresa_id = $1 GROUP BY m.sm_id`, [empresa]
    );

    const chavesMes = Array.from({ length: meses }, (_, i) => {
      const d = new Date();
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() - (meses - 1 - i));
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    });

    const valorPorMes = {};
    valorRes.rows.forEach(r => { valorPorMes[r.mes] = parseFloat(r.valor); });

    const criadasPorMes   = {};
    const concluidasPorMes = {};
    const vencidasPorMes  = {};
    metas.forEach(r => {
      const { status } = computeStatusPercentual(r, parseFloat(r.valor_atual));
      const mesCriado = new Date(r.sm_criado).toISOString().slice(0, 7);
      criadasPorMes[mesCriado] = (criadasPorMes[mesCriado] || 0) + 1;
      if (status === 'Concluída' || status === 'Atrasada') {
        const mesFinal = new Date(r.sm_data_final).toISOString().slice(0, 7);
        const alvo = status === 'Concluída' ? concluidasPorMes : vencidasPorMes;
        alvo[mesFinal] = (alvo[mesFinal] || 0) + 1;
      }
    });

    res.json(chavesMes.map(mes => ({
      mes,
      valor:      valorPorMes[mes]      || 0,
      criadas:    criadasPorMes[mes]    || 0,
      concluidas: concluidasPorMes[mes] || 0,
      vencidas:   vencidasPorMes[mes]   || 0,
    })));
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
      pool.query(`SELECT smr_id AS id, smr_data AS data, smr_valor AS valor, smr_observacao AS observacao, smr_origem AS origem FROM starvl_meta_resultados WHERE smr_meta_id=$1 ORDER BY smr_data`, [id]),
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

    // Se o indicador tem sincronização automática (ex.: Faturamento), já
    // popula o realizado com o que existir no período assim que a meta é
    // criada — sem isso a meta nasce zerada até alguém sincronizar/lançar.
    if (SYNC_INDICADORES[indicador]) {
      try { await sincronizarMeta(id, usuario); }
      catch (syncErr) { console.error('[metas] sync automático na criação falhou:', syncErr.message); }
    }

    const { rows: full } = await pool.query(`${SELECT_COM_VALOR} WHERE m.sm_id = $1 GROUP BY m.sm_id`, [id]);
    res.status(201).json(toRow(full[0]));
  } catch (err) {
    console.error('POST /metas:', err.message);
    res.status(500).json({ error: 'Erro ao criar meta.' });
  }
});

// ── POST /api/metas/:id/sincronizar — busca o valor no SGA e atualiza ──────
router.post('/:id/sincronizar', async (req, res) => {
  const id = parseInt(req.params.id);
  const { usuario } = req.body;
  try {
    const result = await sincronizarMeta(id, usuario);
    if (!result.ok) {
      return res.status(result.skipped ? 400 : 404).json({
        error: result.skipped
          ? 'Este indicador não tem sincronização automática — lance o resultado manualmente.'
          : (result.error || 'Meta não encontrada.'),
      });
    }
    const { rows: full } = await pool.query(`${SELECT_COM_VALOR} WHERE m.sm_id = $1 GROUP BY m.sm_id`, [id]);
    res.json(toRow(full[0]));
  } catch (err) {
    console.error('POST /metas/:id/sincronizar:', err.message);
    // Detalhe do erro exposto de propósito (ferramenta interna/admin) — ajuda
    // a diagnosticar se é falha de conexão com o SGA do posto, schema, etc.
    res.status(500).json({ error: `Erro ao sincronizar com as vendas: ${err.message}` });
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
