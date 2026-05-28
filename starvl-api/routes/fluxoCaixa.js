const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { safeQuery } = require('../middleware/readonly');

const query = safeQuery(pool);
const FLUXO_EMPRESA_ID = 7432;

function parseDate(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return value;
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value) {
  return Number.parseFloat(value || 0) || 0;
}

function pct(value, total) {
  return total > 0 ? (value / total) * 100 : 0;
}

function buildCaixaWhere(req) {
  const params = [FLUXO_EMPRESA_ID, parseDate(req.query.data)];
  const conditions = ['cxa.cxaempresa = $1', 'DATE(cxa.cxadatai) = $2::date'];

  const turno = parseInt(req.query.turno, 10);
  if (turno > 0) {
    params.push(turno);
    conditions.push(`cxa.cxaturno = $${params.length}`);
  }

  const caixa = parseInt(req.query.caixa, 10);
  if (caixa > 0) {
    params.push(caixa);
    conditions.push(`cxa.cxanumero = $${params.length}`);
  }

  const operador = String(req.query.operador || '').trim();
  if (operador && operador !== 'todos') {
    params.push(operador);
    conditions.push(`cxa.cxaresponsavel = $${params.length}`);
  }

  return { params, where: conditions.join(' AND ') };
}

async function getCaixas(req) {
  const { params, where } = buildCaixaWhere(req);
  const result = await query(
    `SELECT
       cxa.cxanumero,
       cxa.cxadatai,
       cxa.cxadataf,
       cxa.cxadatac,
       cxa.cxaresponsavel,
       cxa.cxaturno,
       COALESCE(cxa.cxa_e_troco, 0) AS entrada_troco,
       COALESCE(cxa.cxa_s_troco, 0) AS saida_troco,
       COALESCE(cxa.cxa_e_falta, 0) AS falta,
       COALESCE(cxa.cxa_s_sobra, 0) AS sobra,
       COALESCE(cxa.cxa_dinheiro, 0) AS dinheiro_conferido
     FROM cxa
     WHERE ${where}
     ORDER BY cxa.cxadatai ASC`,
    params
  );
  return result.rows;
}

function caixaFilterSql() {
  return `WITH caixas AS (
    SELECT cxa.cxanumero
    FROM cxa
    WHERE cxa.cxaempresa = $1
      AND DATE(cxa.cxadatai) = $2::date
      AND ($3::int IS NULL OR cxa.cxaturno = $3)
      AND ($4::int IS NULL OR cxa.cxanumero = $4)
      AND ($5::text IS NULL OR cxa.cxaresponsavel = $5)
  )`;
}

function filterParams(req) {
  const turno = parseInt(req.query.turno, 10);
  const caixa = parseInt(req.query.caixa, 10);
  const operador = String(req.query.operador || '').trim();
  return [
    FLUXO_EMPRESA_ID,
    parseDate(req.query.data),
    turno > 0 ? turno : null,
    caixa > 0 ? caixa : null,
    operador && operador !== 'todos' ? operador : null,
  ];
}

// GET /api/fluxo-caixa
router.get('/', async (req, res) => {
  const requestedEmpresa = parseInt(req.query.empresa, 10);
  if (requestedEmpresa && requestedEmpresa !== FLUXO_EMPRESA_ID) {
    return res.status(403).json({ error: 'Relatorio disponivel apenas para a empresa 7432' });
  }

  const data = parseDate(req.query.data);
  const params = filterParams(req);

  try {
    const caixas = await getCaixas(req);

    const [vendasRes, recRes, caixaTotaisRes, suprRes, pagjRes, cartoesRes, tanquesRes, timelineRes, filtersRes] = await Promise.all([
      query(
        `${caixaFilterSql()}
         SELECT
           COALESCE(SUM(CASE WHEN p.prodtipo = 1 THEN i.vdittotal ELSE 0 END), 0) AS combustiveis,
           COALESCE(SUM(CASE WHEN COALESCE(p.prodtipo, 0) <> 1 THEN i.vdittotal ELSE 0 END), 0) AS produtos,
           COALESCE(SUM(i.vdittotal), 0) AS total
         FROM vda v
         JOIN vdit i ON i.vditempresa = v.vdaempresa AND i.vditcodigovda = v.vdacodigo
         LEFT JOIN prod p ON p.prodcodigo = i.vditproduto
         WHERE v.vdaempresa = $1
           AND v.vdacaixa IN (SELECT cxanumero FROM caixas)
           AND COALESCE(v.vdastatus, 0) <> 1`,
        params
      ),
      query(
        `${caixaFilterSql()}
         SELECT COALESCE(SUM(recj.recjvalor), 0) AS total
         FROM recj
         WHERE recj.recjempresa = $1
           AND recj.recjcaixa IN (SELECT cxanumero FROM caixas)`,
        params
      ),
      query(
        `${caixaFilterSql()}
         , vendas AS (
           SELECT v.vdacaixa AS caixa, COALESCE(SUM(i.vdittotal), 0) AS total
           FROM vda v
           JOIN vdit i ON i.vditempresa = v.vdaempresa AND i.vditcodigovda = v.vdacodigo
           WHERE v.vdaempresa = $1
             AND v.vdacaixa IN (SELECT cxanumero FROM caixas)
             AND COALESCE(v.vdastatus, 0) <> 1
           GROUP BY v.vdacaixa
         ), recebimentos AS (
           SELECT recj.recjcaixa AS caixa, COALESCE(SUM(recj.recjvalor), 0) AS total
           FROM recj
           WHERE recj.recjempresa = $1
             AND recj.recjcaixa IN (SELECT cxanumero FROM caixas)
           GROUP BY recj.recjcaixa
         ), movimentos AS (
           SELECT supr.suprcaixa AS caixa,
                  COALESCE(SUM(CASE WHEN supr.suproperacao IN ('C','E') THEN supr.suprvalor ELSE 0 END), 0) AS entradas,
                  COALESCE(SUM(CASE WHEN supr.suproperacao IN ('D','P','M','S','Q','H','G') THEN supr.suprvalor ELSE 0 END), 0) AS saidas
           FROM supr
           WHERE supr.suprempresa = $1
             AND supr.suprcaixa IN (SELECT cxanumero FROM caixas)
           GROUP BY supr.suprcaixa
         )
         SELECT c.cxanumero,
                COALESCE(vendas.total, 0) + COALESCE(recebimentos.total, 0) + COALESCE(movimentos.entradas, 0) - COALESCE(movimentos.saidas, 0) AS total
         FROM caixas c
         LEFT JOIN vendas ON vendas.caixa = c.cxanumero
         LEFT JOIN recebimentos ON recebimentos.caixa = c.cxanumero
         LEFT JOIN movimentos ON movimentos.caixa = c.cxanumero`,
        params
      ),
      query(
        `${caixaFilterSql()}
         SELECT
           COALESCE(SUM(CASE WHEN supr.suproperacao = 'D' THEN supr.suprvalor ELSE 0 END), 0) AS sangrias,
           COALESCE(SUM(CASE WHEN supr.suproperacao = 'P' THEN supr.suprvalor ELSE 0 END), 0) AS pagamentos_supr,
           COALESCE(SUM(CASE WHEN supr.suproperacao = 'M' THEN supr.suprvalor ELSE 0 END), 0) AS emprestimos,
           COALESCE(SUM(CASE WHEN supr.suproperacao = 'C' THEN supr.suprvalor ELSE 0 END), 0) AS suprimentos,
           COALESCE(SUM(CASE WHEN supr.suproperacao = 'E' THEN supr.suprvalor ELSE 0 END), 0) AS outras_entradas,
           COALESCE(SUM(CASE WHEN supr.suproperacao = 'S' THEN supr.suprvalor ELSE 0 END), 0) AS outras_saidas,
           COALESCE(SUM(CASE WHEN supr.suproperacao = 'Q' THEN supr.suprvalor ELSE 0 END), 0) AS baixa_cheques,
           COALESCE(SUM(CASE WHEN supr.suproperacao = 'G' THEN supr.suprvalor ELSE 0 END), 0) AS resgate_pontos,
           COALESCE(SUM(CASE WHEN supr.suproperacao = 'H' THEN supr.suprvalor ELSE 0 END), 0) AS estorno_cheques
         FROM supr
         WHERE supr.suprempresa = $1
           AND supr.suprcaixa IN (SELECT cxanumero FROM caixas)`,
        params
      ),
      // pagj: fonte autoritativa para pagamentos baixados por caixa
      // Cobre casos onde supr.suproperacao='P' não foi gerado pelo sistema
      query(
        `${caixaFilterSql()}
         SELECT COALESCE(SUM(COALESCE(pagj.pagjpago, pagj.pagjvalor, 0)), 0) AS pagamentos
         FROM pagj
         WHERE pagj.pagjempresa = $1
           AND pagj.pagjbxcaixa IN (SELECT cxanumero FROM caixas)
           AND DATE(pagj.pagjpagamento) = $2::date`,
        params
      ),
      query(
        `${caixaFilterSql()}
         SELECT
           COALESCE(tefp.tefpdescricao, 'Operadora ' || cxac.cxacoperadora::text, 'Sem operadora') AS operadora,
           COALESCE(band.banddescricao, 'Bandeira ' || cxac.cxacbandeira::text, 'Sem bandeira') AS bandeira,
           COALESCE(SUM(cxac.cxacvalor), 0) AS total
         FROM cxac
         LEFT JOIN tefp ON tefp.tefpcodigo = cxac.cxacoperadora
         LEFT JOIN band ON band.bandcodigo = cxac.cxacbandeira
         WHERE cxac.cxacempresa = $1
           AND cxac.cxaccaixa IN (SELECT cxanumero FROM caixas)
         GROUP BY operadora, bandeira
         ORDER BY total DESC`,
        params
      ),
      query(
        `WITH latest_lmc AS (
           SELECT DISTINCT ON (l.lmccombustivel, e.lmcetanque)
                  l.lmcdata, l.lmccombustivel, e.lmcetanque,
                  COALESCE(e.lmcemedicao, e.lmcefisico, e.lmcefechamento, 0) AS volume
           FROM lmc l
           JOIN lmce e ON e.lmcelmc = l.lmccodigo
           WHERE l.lmcempresa = $1
             AND l.lmcdata <= $2::date
           ORDER BY l.lmccombustivel, e.lmcetanque, l.lmcdata DESC
         )
         SELECT
           t.tanqcodigo,
           COALESCE(p.prodresumo, p.proddescricao, 'Tanque ' || t.tanqcodigo::text) AS produto,
           COALESCE(latest_lmc.volume, t.tanqmedqtd, t.tanqestoque, 0) AS volume,
           COALESCE(t.tanqcapacidade, 0) AS capacidade,
           COALESCE(t.tanqmeddat, latest_lmc.lmcdata::timestamp) AS atualizado_em
         FROM tanq t
         LEFT JOIN prod p ON p.prodcodigo = t.tanqproduto
         LEFT JOIN latest_lmc ON latest_lmc.lmcetanque = t.tanqcodigo
         WHERE t.tanqempresa = $1
           AND t.tanqinativo IS NULL
         ORDER BY t.tanqcodigo
         LIMIT 8`,
        [FLUXO_EMPRESA_ID, data]
      ),
      query(
        `${caixaFilterSql()}
         SELECT * FROM (
           SELECT cxa.cxadatai AS momento, 'abertura' AS tipo, 'Abertura de Caixa' AS titulo,
                  COALESCE(cxa.cxaresponsavel, 'Operador') AS detalhe, 0::numeric AS valor, cxa.cxanumero AS caixa
           FROM cxa
           WHERE cxa.cxaempresa = $1 AND cxa.cxanumero IN (SELECT cxanumero FROM caixas)
           UNION ALL
           SELECT cxa.cxadataf AS momento, 'fechamento' AS tipo, 'Fechamento de Caixa' AS titulo,
                  'Caixa ' || cxa.cxanumero::text AS detalhe, 0::numeric AS valor, cxa.cxanumero AS caixa
           FROM cxa
           WHERE cxa.cxaempresa = $1 AND cxa.cxanumero IN (SELECT cxanumero FROM caixas) AND cxa.cxadataf IS NOT NULL
           UNION ALL
           SELECT supr.suprdata AS momento,
                  CASE WHEN supr.suproperacao IN ('D','P','M','S','Q','H','G') THEN 'saida' ELSE 'entrada' END AS tipo,
                  CASE supr.suproperacao
                    WHEN 'D' THEN 'Sangria'
                    WHEN 'P' THEN 'Pagamento'
                    WHEN 'M' THEN 'Emprestimo'
                    WHEN 'E' THEN 'Outra Entrada'
                    WHEN 'S' THEN 'Outra Saida'
                    WHEN 'Q' THEN 'Baixa de Cheque'
                    WHEN 'G' THEN 'Resgate de Pontos'
                    WHEN 'H' THEN 'Estorno de Cheque'
                    ELSE 'Movimento de Caixa'
                  END AS titulo,
                  COALESCE(supr.suprhistorico, 'Movimento') AS detalhe,
                  COALESCE(supr.suprvalor, 0) AS valor,
                  supr.suprcaixa AS caixa
           FROM supr
           WHERE supr.suprempresa = $1 AND supr.suprcaixa IN (SELECT cxanumero FROM caixas)
           UNION ALL
           SELECT recj.recjemissao::timestamp AS momento, 'entrada' AS tipo, 'Recebimento Cliente' AS titulo,
                  COALESCE(recj.recjdocumento, 'Recebimento') AS detalhe,
                  COALESCE(recj.recjvalor, 0) AS valor, recj.recjcaixa AS caixa
           FROM recj
           WHERE recj.recjempresa = $1 AND recj.recjcaixa IN (SELECT cxanumero FROM caixas)
         ) eventos
         WHERE momento IS NOT NULL
         ORDER BY momento DESC
         LIMIT 18`,
        params
      ),
      query(
        `SELECT
           ARRAY_AGG(DISTINCT cxa.cxaturno ORDER BY cxa.cxaturno) FILTER (WHERE cxa.cxaturno IS NOT NULL) AS turnos,
           ARRAY_AGG(DISTINCT cxa.cxaresponsavel ORDER BY cxa.cxaresponsavel) FILTER (WHERE cxa.cxaresponsavel IS NOT NULL) AS operadores,
           ARRAY_AGG(DISTINCT cxa.cxanumero ORDER BY cxa.cxanumero) AS caixas
         FROM cxa
         WHERE cxa.cxaempresa = $1
           AND DATE(cxa.cxadatai) = $2::date`,
        [FLUXO_EMPRESA_ID, data]
      ),
    ]);

    const vendas = vendasRes.rows[0] || {};
    const supr = suprRes.rows[0] || {};
    const recebimentos = toNumber(recRes.rows[0]?.total);

    // Pagamentos: usa pagj como fonte autoritativa.
    // Em alguns lançamentos o supr.suproperacao='P' não é gerado,
    // fazendo o campo aparecer zerado mesmo havendo pagamentos reais.
    const pagjTotal = toNumber(pagjRes.rows[0]?.pagamentos);
    const suprPagamentos = toNumber(supr.pagamentos_supr);
    // Usa o maior valor (pagj >= supr quando supr está incompleto)
    const pagamentosTotal = Math.max(pagjTotal, suprPagamentos);

    const trocoInicial = caixas.reduce((sum, c) => sum + toNumber(c.entrada_troco), 0);
    const trocoFinal = caixas.reduce((sum, c) => sum + toNumber(c.saida_troco), 0);
    const dinheiroRaw = caixas.reduce((sum, c) => sum + toNumber(c.dinheiro_conferido), 0);
    const totalFalta = caixas.reduce((sum, c) => sum + toNumber(c.falta), 0);
    const totalSobra = caixas.reduce((sum, c) => sum + toNumber(c.sobra), 0);

    const cartoes = cartoesRes.rows.map(row => ({
      operadora: row.operadora,
      bandeira: row.bandeira,
      valor: toNumber(row.total),
    }));
    const totalCartoes = cartoes.reduce((sum, item) => sum + item.valor, 0);
    const porOperadora = Object.values(cartoes.reduce((acc, item) => {
      acc[item.operadora] = acc[item.operadora] || { nome: item.operadora, valor: 0 };
      acc[item.operadora].valor += item.valor;
      return acc;
    }, {})).sort((a, b) => b.valor - a.valor);

    const porBandeira = Object.values(cartoes.reduce((acc, item) => {
      acc[item.bandeira] = acc[item.bandeira] || { nome: item.bandeira, valor: 0 };
      acc[item.bandeira].valor += item.valor;
      return acc;
    }, {})).sort((a, b) => b.valor - a.valor);

    // Compute known entrada and saída totals (excluding dinheiro) to derive dinheiro from formula.
    // Esta estação não preenche denominação (cxa_dinheiro=0) — o dinheiro em caixa é calculado
    // como: entradas_conhecidas - saídas_sem_dinheiro + falta - sobra, garantindo que
    // Saldo Líquido final = sobra - falta (balancete correto).
    const entradasKnown = trocoInicial
      + toNumber(vendas.combustiveis) + toNumber(vendas.produtos)
      + recebimentos
      + toNumber(supr.suprimentos) + toNumber(supr.outras_entradas)
      + toNumber(supr.baixa_cheques);

    const saidasSemDinheiro = trocoFinal
      + totalCartoes + pagamentosTotal
      + toNumber(supr.sangrias) + toNumber(supr.emprestimos)
      + toNumber(supr.resgate_pontos) + toNumber(supr.estorno_cheques)
      + toNumber(supr.outras_saidas);

    // If dinheiroRaw was entered by the cashier (denomination form filled) use it directly.
    // Otherwise derive from the balancing formula so the register reconciles to sobra/falta.
    const dinheiroApresentado = dinheiroRaw > 0
      ? dinheiroRaw
      : Math.max(0, entradasKnown - saidasSemDinheiro + totalFalta - totalSobra);

    const entradas = [
      { id: 'trocoInicial',      label: 'Troco Inicial',        valor: trocoInicial },
      { id: 'vendaCombustiveis', label: 'Venda Combustiveis',   valor: toNumber(vendas.combustiveis) },
      { id: 'vendaProdutos',     label: 'Venda Produtos',       valor: toNumber(vendas.produtos) },
      { id: 'recebimentos',      label: 'Recebimentos',         valor: recebimentos },
      { id: 'suprimentos',       label: 'Suprimentos',          valor: toNumber(supr.suprimentos) },
      { id: 'adiantamentos',     label: 'Adiantamentos',        valor: 0 },
      { id: 'creditosVendaProg', label: 'Creditos Venda Prog',  valor: 0 },
      { id: 'chequesTroco',      label: 'Cheques Troco',        valor: 0 },
      { id: 'acrescimosCadastro',label: 'Acrescimos Cadastro',  valor: 0 },
      { id: 'acrescimosGerais',  label: 'Acrescimos Gerais',    valor: 0 },
      { id: 'baixaDeChecques',   label: 'Baixa de Cheques',     valor: toNumber(supr.baixa_cheques) },
      { id: 'outrasEntradas',    label: 'Outras Entradas',      valor: toNumber(supr.outras_entradas) },
    ];

    const saidas = [
      { id: 'trocoFinal',         label: 'Troco Final',          valor: trocoFinal },
      { id: 'dinheiroApresentado',label: 'Dinheiro em Caixa',    valor: dinheiroApresentado },
      { id: 'papeisApresentados', label: 'Papeis Apresentados',  valor: totalCartoes },
      { id: 'pagamentos',         label: 'Pagamentos',           valor: pagamentosTotal },
      { id: 'sangrias',           label: 'Sangrias',             valor: toNumber(supr.sangrias) },
      { id: 'emprestimos',        label: 'Emprestimos',          valor: toNumber(supr.emprestimos) },
      { id: 'retiradasVendaProg', label: 'Retiradas Venda Prog', valor: 0 },
      { id: 'resgateDepontos',    label: 'Resgate de Pontos',    valor: toNumber(supr.resgate_pontos) },
      { id: 'descontosCadastro',  label: 'Descontos Cadastro',   valor: 0 },
      { id: 'descontosGerais',    label: 'Descontos Gerais',     valor: 0 },
      { id: 'estornoCheques',     label: 'Estorno de Cheques',   valor: toNumber(supr.estorno_cheques) },
      { id: 'outrasSaidas',       label: 'Outras Saidas',        valor: toNumber(supr.outras_saidas) },
    ];

    const totalEntradas = entradas.reduce((sum, item) => sum + item.valor, 0);
    const totalSaidas = saidas.reduce((sum, item) => sum + item.valor, 0);
    const divergencia = caixas.reduce((sum, c) => sum + Math.abs(toNumber(c.falta)) + Math.abs(toNumber(c.sobra)), 0);
    const caixaTotais = caixaTotaisRes.rows.reduce((acc, row) => {
      acc[row.cxanumero] = toNumber(row.total);
      return acc;
    }, {});

    res.json({
      empresa: FLUXO_EMPRESA_ID,
      data,
      filtros: filtersRes.rows[0] || { turnos: [], operadores: [], caixas: [] },
      resumo: {
        entradas: totalEntradas,
        saidas: totalSaidas,
        saldoAtual: totalEntradas - totalSaidas,
        divergencia,
        conferido: divergencia === 0 && caixas.length > 0,
      },
      caixas: caixas.map(cxa => ({
        numero: cxa.cxanumero,
        nome: `Caixa ${cxa.cxanumero}`,
        operador: cxa.cxaresponsavel || 'Operador',
        turno: cxa.cxaturno,
        abertura: cxa.cxadatai,
        fechamento: cxa.cxadataf,
        conferidoEm: cxa.cxadatac,
        trocoInicial: toNumber(cxa.entrada_troco),
        trocoFinal: toNumber(cxa.saida_troco),
        dinheiroConferido: toNumber(cxa.dinheiro_conferido),
        total: caixaTotais[cxa.cxanumero] || 0,
        divergencia: Math.abs(toNumber(cxa.falta)) + Math.abs(toNumber(cxa.sobra)),
      })),
      entradas: entradas.map(item => ({ ...item, percentual: pct(item.valor, totalEntradas) })),
      saidas: saidas.map(item => ({ ...item, percentual: pct(item.valor, totalSaidas) })),
      cartoes: {
        total: totalCartoes,
        operadoras: porOperadora.map(item => ({ ...item, percentual: pct(item.valor, totalCartoes) })),
        bandeiras: porBandeira.map(item => ({ ...item, percentual: pct(item.valor, totalCartoes) })),
      },
      tanques: tanquesRes.rows.map(row => ({
        codigo: row.tanqcodigo,
        produto: row.produto,
        volume: toNumber(row.volume),
        capacidade: toNumber(row.capacidade),
        percentual: pct(toNumber(row.volume), toNumber(row.capacidade)),
        atualizadoEm: row.atualizado_em,
      })),
      timeline: timelineRes.rows.map(row => ({
        momento: row.momento,
        tipo: row.tipo,
        titulo: row.titulo,
        detalhe: row.detalhe,
        valor: toNumber(row.valor),
        caixa: row.caixa,
      })),
    });
  } catch (err) {
    console.error('Error /fluxo-caixa:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fluxo-caixa/papeis?empresa=7432&data=2026-05-27&caixa=375&tab=cartaoDebito
router.get('/papeis', async (req, res) => {
  const requestedEmpresa = parseInt(req.query.empresa, 10);
  if (requestedEmpresa && requestedEmpresa !== FLUXO_EMPRESA_ID) {
    return res.status(403).json({ error: 'Relatorio disponivel apenas para a empresa 7432' });
  }

  const empresa = FLUXO_EMPRESA_ID;
  const data = parseDate(req.query.data);
  const caixa = parseInt(req.query.caixa, 10);
  const tab = req.query.tab;

  if (!caixa) return res.status(400).json({ error: 'caixa required' });
  if (!tab) return res.status(400).json({ error: 'tab required' });

  try {
    const CARD_TABS = {
      cartaoDebito: { prefix: 'PD', tefOnly: false },
      cartaoCredito: { prefix: 'PC', tefOnly: false },
      tefDebito: { prefix: 'PD', tefOnly: true },
      tefCredito: { prefix: 'PC', tefOnly: true },
    };

    if (CARD_TABS[tab]) {
      const { prefix, tefOnly } = CARD_TABS[tab];
      const tefCond = tefOnly
        ? "AND cxac.cxactipo = 'TEF'"
        : "AND (cxac.cxactipo IS NULL OR cxac.cxactipo = '' OR cxac.cxactipo = 'POS')";

      const result = await query(
        `SELECT
           SPLIT_PART(cxac.cxacchave, '@', 2) AS operadora,
           SPLIT_PART(cxac.cxacchave, '@', 3) AS bandeira,
           COALESCE(cxac.cxacvalor, 0) AS valor,
           cxac.cxaccodigo AS codigo,
           COALESCE(cxac.cxacautorizacao, '') AS autorizacao,
           COALESCE(cxac.cxacparcela, 1) AS parcela
         FROM cxac
         WHERE cxac.cxacempresa = $1
           AND cxac.cxaccaixa = $2
           AND cxac.cxacchave LIKE $3
           ${tefCond}
         ORDER BY cxac.cxacvalor DESC`,
        [empresa, caixa, `${prefix}@%`]
      );

      const lancamentos = result.rows.map(r => ({
        codigo: r.codigo,
        operadora: r.operadora || '-',
        bandeira: r.bandeira || '-',
        valor: toNumber(r.valor),
        autorizacao: r.autorizacao,
        parcela: r.parcela,
      }));

      const opMap = {};
      lancamentos.forEach(l => {
        opMap[l.operadora] = opMap[l.operadora] || { nome: l.operadora, valor: 0 };
        opMap[l.operadora].valor += l.valor;
      });
      const operadoras = Object.values(opMap).sort((a, b) => b.valor - a.valor);

      const bandMap = {};
      lancamentos.forEach(l => {
        if (!bandMap[l.bandeira]) bandMap[l.bandeira] = { descricao: l.bandeira, valor: 0, operadora: l.operadora };
        bandMap[l.bandeira].valor += l.valor;
      });
      const bandeiras = Object.values(bandMap).sort((a, b) => b.valor - a.valor);

      return res.json({ tab, tipo: 'card', operadoras, bandeiras, lancamentos });
    }

    if (tab === 'prazo' || tab === 'vales' || tab === 'cartaFrete' || tab === 'vendaPrg' || tab === 'depositoAntecipado') {
      if (tab !== 'prazo') {
        return res.json({ tab, tipo: 'lista', subTipo: 'prazo', rows: [] });
      }
      const result = await query(
        `SELECT
           recj.recjcodigo AS codigo,
           COALESCE(recj.recjdocumento, '—') AS documento,
           COALESCE(NULLIF(recj.recjvenda, 0), rece.recevenda, 0) AS venda,
           recj.recjemissao AS data,
           COALESCE(pa.partrazao, 'Cliente') AS cliente,
           COALESCE(recj.recjvalor, 0) AS valor,
           COALESCE(fr.partrazao, '—') AS frentista
         FROM recj
         LEFT JOIN rece ON rece.rececodigo = recj.recjfatura AND rece.receempresa = recj.recjempresa
         LEFT JOIN part pa ON pa.partcodigo = recj.recjcliente
         LEFT JOIN vda v ON v.vdacodigo = COALESCE(NULLIF(recj.recjvenda, 0), rece.recevenda)
                        AND v.vdaempresa = recj.recjempresa
         LEFT JOIN part fr ON fr.partcodigo = v.vdavendedor
         WHERE recj.recjempresa = $1
           AND recj.recjcaixa = $2
           AND DATE(recj.recjemissao) = $3::date
           AND (recj.recjtefchave IS NULL OR recj.recjtefchave = '')
         ORDER BY recj.recjemissao DESC`,
        [empresa, caixa, data]
      );
      const rows = result.rows.map(r => ({
        codigo: r.codigo,
        documento: r.documento,
        venda: r.venda || 0,
        data: r.data,
        cliente: r.cliente,
        valor: toNumber(r.valor),
        frentista: r.frentista,
      }));
      return res.json({ tab, tipo: 'lista', subTipo: 'prazo', rows });
    }

    if (tab === 'chequeVista' || tab === 'chequePre') {
      const predatado = tab === 'chequePre' ? 1 : 0;
      const result = await query(
        `SELECT
           cxaq.cxaqcodigo AS codigo,
           COALESCE(cxaq.cxaqrespnome, '—') AS responsavel,
           cxaq.cxaqvencimento AS vencimento,
           COALESCE(cxaq.cxaqvalor, 0) AS valor,
           COALESCE(cxaq.cxaqplaca, '') AS placa,
           COALESCE(fr.partrazao, '—') AS frentista,
           COALESCE(cxaq.cxaqvenda, 0) AS vdacodigo,
           COALESCE(cxaq.cxaqconferido, 0) AS conferido
         FROM cxaq
         LEFT JOIN part fr ON fr.partcodigo = cxaq.cxaqfrentista
         WHERE cxaq.cxaqempresa = $1
           AND cxaq.cxaqcaixa = $2
           AND cxaq.cxaqpredatado = $3
         ORDER BY cxaq.cxaqvencimento`,
        [empresa, caixa, predatado]
      );
      const rows = result.rows.map(r => ({
        codigo: r.codigo,
        responsavel: r.responsavel,
        vencimento: r.vencimento,
        valor: toNumber(r.valor),
        placa: r.placa || '—',
        frentista: r.frentista,
        vdaCodigo: r.vdacodigo || 0,
        conferido: r.conferido,
      }));
      return res.json({ tab, tipo: 'lista', subTipo: 'cheque', rows });
    }

    return res.status(400).json({ error: `Tab '${tab}' nao suportada` });
  } catch (err) {
    console.error('Error /fluxo-caixa/papeis:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fluxo-caixa/detalhe?empresa=7432&data=2026-05-27&caixa=375&tipo=vendaCombustiveis
router.get('/detalhe', async (req, res) => {
  const requestedEmpresa = parseInt(req.query.empresa, 10);
  if (requestedEmpresa && requestedEmpresa !== FLUXO_EMPRESA_ID) {
    return res.status(403).json({ error: 'Relatorio disponivel apenas para a empresa 7432' });
  }

  const empresa = FLUXO_EMPRESA_ID;
  const data = parseDate(req.query.data);
  const caixa = parseInt(req.query.caixa, 10);
  const tipo = req.query.tipo;

  if (!caixa) return res.status(400).json({ error: 'caixa required' });
  if (!tipo) return res.status(400).json({ error: 'tipo required' });

  const SUPR_OP_MAP = {
    sangrias: 'D',
    pagamentos: 'P',
    emprestimos: 'M',
    suprimentos: 'C',
    outrasEntradas: 'E',
    outrasSaidas: 'S',
    baixaDeChecques: 'Q',
    resgateDepontos: 'G',
    estornoCheques: 'H',
  };

  try {
    let itens = [];

    if (tipo === 'vendaCombustiveis' || tipo === 'vendaProdutos') {
      const prodFilter = tipo === 'vendaCombustiveis' ? 'p.prodtipo = 1' : 'COALESCE(p.prodtipo, 0) <> 1';
      const result = await query(
        `SELECT
           v.vdacodigo AS codigo,
           v.vdadata AS momento,
           COALESCE(pa.partrazao, 'Consumidor') AS cliente,
           COALESCE(p.proddescricao, 'Produto') AS produto,
           COALESCE(i.vditqtd, 0) AS quantidade,
           COALESCE(i.vditunitario, 0) AS unitario,
           COALESCE(i.vdittotal, 0) AS valor
         FROM vda v
         JOIN vdit i ON i.vditcodigovda = v.vdacodigo AND i.vditempresa = v.vdaempresa
         LEFT JOIN prod p ON p.prodcodigo = i.vditproduto
         LEFT JOIN part pa ON pa.partcodigo = v.vdacliente
         WHERE v.vdaempresa = $1
           AND v.vdacaixa = $2
           AND DATE(v.vdadata) = $3::date
           AND ${prodFilter}
           AND COALESCE(v.vdastatus, 0) <> 1
         ORDER BY v.vdadata DESC`,
        [empresa, caixa, data]
      );
      itens = result.rows.map(r => ({
        codigo: r.codigo,
        momento: r.momento,
        cliente: r.cliente,
        produto: r.produto,
        quantidade: toNumber(r.quantidade),
        unitario: toNumber(r.unitario),
        valor: toNumber(r.valor),
      }));

    } else if (tipo === 'recebimentos') {
      const result = await query(
        `SELECT
           recj.recjcodigo AS codigo,
           recj.recjemissao AS momento,
           COALESCE(pa.partrazao, 'Cliente') AS cliente,
           COALESCE(recj.recjdocumento, '—') AS documento,
           COALESCE(recj.recjvalor, 0) AS valor
         FROM recj
         LEFT JOIN rece ON rece.rececodigo = recj.recjrece AND rece.receempresa = recj.recjempresa
         LEFT JOIN part pa ON pa.partcodigo = rece.rececliente
         WHERE recj.recjempresa = $1
           AND recj.recjcaixa = $2
           AND DATE(recj.recjemissao) = $3::date
         ORDER BY recj.recjemissao DESC`,
        [empresa, caixa, data]
      );
      itens = result.rows.map(r => ({
        codigo: r.codigo,
        momento: r.momento,
        cliente: r.cliente,
        documento: r.documento,
        valor: toNumber(r.valor),
      }));

    } else if (tipo === 'papeisApresentados') {
      const result = await query(
        `SELECT
           cxac.cxaccodigo AS codigo,
           COALESCE(tefp.tefpdescricao, 'Operadora ' || cxac.cxacoperadora::text) AS operadora,
           COALESCE(band.banddescricao, 'Bandeira ' || cxac.cxacbandeira::text) AS bandeira,
           COALESCE(cxac.cxacvalor, 0) AS valor
         FROM cxac
         LEFT JOIN tefp ON tefp.tefpcodigo = cxac.cxacoperadora
         LEFT JOIN band ON band.bandcodigo = cxac.cxacbandeira
         WHERE cxac.cxacempresa = $1
           AND cxac.cxaccaixa = $2
         ORDER BY cxac.cxacvalor DESC`,
        [empresa, caixa]
      );
      itens = result.rows.map(r => ({
        codigo: r.codigo,
        operadora: r.operadora,
        bandeira: r.bandeira,
        valor: toNumber(r.valor),
      }));

    } else if (SUPR_OP_MAP[tipo]) {
      const op = SUPR_OP_MAP[tipo];
      const result = await query(
        `SELECT
           supr.suprcodigo AS codigo,
           supr.suprdata AS momento,
           COALESCE(supr.suprhistorico, 'Movimento') AS historico,
           COALESCE(supr.suprvalor, 0) AS valor
         FROM supr
         WHERE supr.suprempresa = $1
           AND supr.suprcaixa = $2
           AND DATE(supr.suprdata) = $3::date
           AND supr.suproperacao = $4
         ORDER BY supr.suprdata DESC`,
        [empresa, caixa, data, op]
      );
      itens = result.rows.map(r => ({
        codigo: r.codigo,
        momento: r.momento,
        historico: r.historico,
        valor: toNumber(r.valor),
      }));

    } else {
      return res.status(400).json({ error: `Tipo '${tipo}' nao suportado` });
    }

    res.json({ tipo, caixa, data, itens });
  } catch (err) {
    console.error('Error /fluxo-caixa/detalhe:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
