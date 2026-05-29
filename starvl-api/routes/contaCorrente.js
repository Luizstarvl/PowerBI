const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { safeQuery } = require('../middleware/readonly');

const query = safeQuery(pool);
const CC_EMPRESA = 7432;

function toN(v) { return parseFloat(v || 0) || 0; }
function parseDate(v) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(v || ''))) return v;
  return new Date().toISOString().slice(0, 10);
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function detectBanco(desc) {
  const u = (desc || '').toUpperCase();
  if (u.includes('BB ') || u.startsWith('BB ') || u.includes('BRASIL')) return 'Banco do Brasil';
  if (u.includes('SANT')) return 'Santander';
  if (u.includes('ITAU') || u.includes('ITAÚ')) return 'Itaú';
  if (u.includes('BRAD')) return 'Bradesco';
  if (u.includes('CEF') || u.includes('CAIXA')) return 'Caixa Econômica';
  if (u.includes('SICOOB') || u.includes('COOP')) return 'Sicoob';
  return 'Conta Interna';
}

// GET /api/conta-corrente/visao-geral
router.get('/visao-geral', async (req, res) => {
  const emp = parseInt(req.query.empresa, 10) || CC_EMPRESA;
  const hoje = parseDate(req.query.data);
  const dias = Math.max(7, Math.min(90, parseInt(req.query.dias, 10) || 30));
  const dataFim = addDays(hoje, dias);
  const dataIni = addDays(hoje, -dias);

  try {
    // Accounts linked to empresa
    const contasRes = await query(
      `SELECT cr.ccrrcodigo, cr.ccrrdescricao, cr.ccrrsaldo
       FROM ccrr cr
       JOIN ccre ce ON ce.ccreconta = cr.ccrrcodigo
       WHERE ce.ccreempresa = $1
       ORDER BY cr.ccrrsaldo DESC`,
      [emp]
    );
    const contas = contasRes.rows.map(r => ({
      codigo: r.ccrrcodigo,
      descricao: r.ccrrdescricao,
      banco: detectBanco(r.ccrrdescricao),
      saldo: toN(r.ccrrsaldo),
    }));
    const saldoConsolidado = contas.reduce((s, c) => s + c.saldo, 0);
    const disponivelBancario = contas.filter(c => c.saldo > 0).reduce((s, c) => s + c.saldo, 0);

    // Entradas previstas (rece) and saídas previstas (paga)
    const [entradasPrevRes, saidasPrevRes] = await Promise.all([
      query(
        `SELECT COALESCE(SUM(recevalor), 0) AS total, COUNT(*) AS qtd
         FROM rece
         WHERE receempresa = $1 AND recevencimento BETWEEN $2::date AND $3::date`,
        [emp, hoje, dataFim]
      ),
      query(
        `SELECT COALESCE(SUM(pagavalor), 0) AS total, COUNT(*) AS qtd
         FROM paga
         WHERE pagaempresa = $1 AND pagavencimento BETWEEN $2::date AND $3::date`,
        [emp, hoje, dataFim]
      ),
    ]);
    const entradasPrevistas = toN(entradasPrevRes.rows[0]?.total);
    const saidasPrevistas = toN(saidasPrevRes.rows[0]?.total);
    const saldoProjetado = saldoConsolidado + entradasPrevistas - saidasPrevistas;

    // Cheques pendentes
    const chqRes = await query(
      `SELECT COUNT(*) AS qtd, COALESCE(SUM(chqjvalor),0) AS total
       FROM chqj WHERE chqjempresa = $1 AND chqjpagamento IS NULL`,
      [emp]
    );
    const chequesPendentes = { qtd: parseInt(chqRes.rows[0]?.qtd || 0), total: toN(chqRes.rows[0]?.total) };

    // Lançamentos recentes (last 15 combining fatj + pagj)
    const recentesRes = await query(
      `SELECT * FROM (
        SELECT fatjbxmapa AS data, 'entrada' AS tipo,
               COALESCE(pa.partrazao, 'Cliente') AS historico,
               'fatj' AS origem,
               (COALESCE(fatjdinheiro,0)+COALESCE(fatjcheque,0)+COALESCE(fatjcartao,0)+COALESCE(fatjfrete,0)) AS valor,
               fatjbxccrr AS conta_codigo,
               fatjcodigo AS codigo
        FROM fatj
        LEFT JOIN part pa ON pa.partcodigo = fatjcliente
        WHERE fatjempresa = $1 AND fatjpagamento IS NOT NULL AND fatjbxmapa >= $2::date
      UNION ALL
        SELECT pagjbxmapa AS data, 'saida' AS tipo,
               COALESCE(pagjobs, pagjdocumento, 'Pagamento') AS historico,
               'pagj' AS origem,
               pagjpago AS valor,
               pagjbxccrr AS conta_codigo,
               pagjcodigo AS codigo
        FROM pagj
        WHERE pagjempresa = $1 AND pagjpagamento IS NOT NULL AND pagjbxmapa >= $2::date AND pagjbxccrr > 0
      ) t
      ORDER BY data DESC NULLS LAST
      LIMIT 20`,
      [emp, dataIni]
    );
    const recentes = recentesRes.rows.map(r => ({
      data: r.data,
      tipo: r.tipo,
      historico: r.historico,
      valor: toN(r.valor),
      contaCodigo: r.conta_codigo,
      contaNome: contas.find(c => c.codigo === r.conta_codigo)?.descricao || '—',
      origem: r.origem,
      codigo: r.codigo,
    }));

    // 30-day daily flow: historical (fatj/pagj) + projected (rece/paga)
    const [fluxoEntRes, fluxoSaiRes, fluxoPrevEntRes, fluxoPrevSaiRes] = await Promise.all([
      query(
        `SELECT TO_CHAR(DATE(fatjbxmapa), 'YYYY-MM-DD') AS dia, SUM(fatjdinheiro+COALESCE(fatjcheque,0)+COALESCE(fatjcartao,0)) AS total
         FROM fatj WHERE fatjempresa=$1 AND fatjbxmapa BETWEEN $2::date AND $3::date AND fatjpagamento IS NOT NULL
         GROUP BY dia ORDER BY dia`,
        [emp, dataIni, hoje]
      ),
      query(
        `SELECT TO_CHAR(DATE(pagjbxmapa), 'YYYY-MM-DD') AS dia, SUM(pagjpago) AS total
         FROM pagj WHERE pagjempresa=$1 AND pagjbxmapa BETWEEN $2::date AND $3::date AND pagjpagamento IS NOT NULL AND pagjbxccrr > 0
         GROUP BY dia ORDER BY dia`,
        [emp, dataIni, hoje]
      ),
      query(
        `SELECT TO_CHAR(DATE(recevencimento), 'YYYY-MM-DD') AS dia, SUM(recevalor) AS total
         FROM rece WHERE receempresa=$1 AND recevencimento BETWEEN $2::date AND $3::date
         GROUP BY dia ORDER BY dia`,
        [emp, hoje, dataFim]
      ),
      query(
        `SELECT TO_CHAR(DATE(pagavencimento), 'YYYY-MM-DD') AS dia, SUM(pagavalor) AS total
         FROM paga WHERE pagaempresa=$1 AND pagavencimento BETWEEN $2::date AND $3::date
         GROUP BY dia ORDER BY dia`,
        [emp, hoje, dataFim]
      ),
    ]);

    // Build daily map
    const diaMap = {};
    const addDia = (rows, campo, tipo) => rows.forEach(r => {
      const k = String(r.dia).slice(0, 10);
      if (!diaMap[k]) diaMap[k] = { data: k, entradas: 0, saidas: 0, previsto: false };
      diaMap[k][campo] += toN(r.total);
      if (tipo === 'prev') diaMap[k].previsto = true;
    });
    addDia(fluxoEntRes.rows, 'entradas', 'real');
    addDia(fluxoSaiRes.rows, 'saidas', 'real');
    addDia(fluxoPrevEntRes.rows, 'entradas', 'prev');
    addDia(fluxoPrevSaiRes.rows, 'saidas', 'prev');

    // Running balance
    let saldoRun = saldoConsolidado;
    const fluxo = Object.values(diaMap).sort((a, b) => a.data.localeCompare(b.data)).map(d => {
      if (!d.previsto) saldoRun = saldoConsolidado; // use actual for history pivot
      saldoRun += d.entradas - d.saidas;
      return { ...d, saldoProjetado: saldoRun };
    });

    // Lançamentos previstos (next 10)
    const previstosRes = await query(
      `SELECT * FROM (
        SELECT TO_CHAR(recevencimento, 'YYYY-MM-DD') AS vencimento, 'entrada' AS tipo,
               COALESCE(pa.partrazao,'Cliente') AS historico,
               recedocumento AS documento, recevalor AS valor, 0 AS contacodigo
        FROM rece
        LEFT JOIN part pa ON pa.partcodigo = rececliente
        WHERE receempresa=$1 AND recevencimento BETWEEN $2::date AND $3::date
      UNION ALL
        SELECT TO_CHAR(pagavencimento, 'YYYY-MM-DD') AS vencimento, 'saida' AS tipo,
               COALESCE(pa.partrazao, pagaobs, pagadocumento, 'Fornecedor') AS historico,
               pagadocumento AS documento, pagavalor AS valor, 0 AS contacodigo
        FROM paga
        LEFT JOIN part pa ON pa.partcodigo = pagafornecedor
        WHERE pagaempresa=$1 AND pagavencimento BETWEEN $2::date AND $3::date
      ) t ORDER BY vencimento LIMIT 30`,
      [emp, hoje, dataFim]
    );
    const previstos = previstosRes.rows.map(r => ({
      vencimento: r.vencimento,
      tipo: r.tipo,
      historico: r.historico,
      documento: r.documento,
      valor: toN(r.valor),
    }));

    // Alertas: verifica dia em que saldo fica negativo
    let alertaDia = null;
    let saldoAlert = saldoConsolidado;
    for (const d of fluxo.filter(d => d.previsto)) {
      saldoAlert += d.entradas - d.saidas;
      if (saldoAlert < 0 && !alertaDia) {
        alertaDia = { data: d.data, valor: saldoAlert };
      }
    }

    res.json({
      empresa: emp,
      hoje,
      kpis: {
        saldoConsolidado,
        saldoProjetado,
        entradasPrevistas,
        saidasPrevistas,
        disponivelBancario,
        chequesPendentes,
      },
      contas,
      fluxo,
      recentes,
      previstos,
      alerta: alertaDia,
      resumo: {
        saldoConsolidado,
        saldoProjetado,
        maiorSaldo: Math.max(...fluxo.map(d => d.saldoProjetado), saldoConsolidado),
        menorSaldo: Math.min(...fluxo.map(d => d.saldoProjetado), saldoConsolidado),
        totalEntradasPeriodo: fluxo.reduce((s, d) => s + d.entradas, 0),
        totalSaidasPeriodo: fluxo.reduce((s, d) => s + d.saidas, 0),
      },
    });
  } catch (err) {
    console.error('Error /conta-corrente/visao-geral:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/conta-corrente/lancamentos
router.get('/lancamentos', async (req, res) => {
  const emp = parseInt(req.query.empresa, 10) || CC_EMPRESA;
  const dataIni = parseDate(req.query.dataIni || addDays(new Date().toISOString().slice(0,10), -30));
  const dataFim = parseDate(req.query.dataFim || new Date().toISOString().slice(0,10));
  const tipo = req.query.tipo || 'todos';
  const conta = parseInt(req.query.conta, 10) || 0;
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 50);
  const offset = parseInt(req.query.offset, 10) || 0;

  try {
    const contaFilter = conta > 0 ? `AND contacodigo = ${conta}` : '';
    const tipoFilter = tipo === 'entradas' ? "AND tipo='entrada'" : tipo === 'saidas' ? "AND tipo='saida'" : '';

    const result = await query(
      `SELECT * FROM (
        SELECT fatjbxmapa AS data, 'entrada' AS tipo,
               COALESCE(pa.partrazao, 'Cliente') AS historico,
               fatjcodigo::text AS documento,
               fatjbxccrr AS contacodigo,
               (COALESCE(fatjdinheiro,0)+COALESCE(fatjcheque,0)+COALESCE(fatjcartao,0)) AS valor,
               NULL::numeric AS debito,
               (COALESCE(fatjdinheiro,0)+COALESCE(fatjcheque,0)+COALESCE(fatjcartao,0)) AS credito,
               'Concluído' AS status
        FROM fatj
        LEFT JOIN part pa ON pa.partcodigo = fatjcliente
        WHERE fatjempresa = $1 AND fatjpagamento IS NOT NULL
          AND fatjbxmapa BETWEEN $2::date AND $3::date
      UNION ALL
        SELECT pagjbxmapa AS data, 'saida' AS tipo,
               COALESCE(pagjobs, pagjdocumento, 'Pagamento') AS historico,
               pagjdocumento AS documento,
               pagjbxccrr AS contacodigo,
               pagjpago AS valor,
               pagjpago AS debito,
               NULL::numeric AS credito,
               'Concluído' AS status
        FROM pagj
        WHERE pagjempresa = $1 AND pagjpagamento IS NOT NULL AND pagjbxccrr > 0
          AND pagjbxmapa BETWEEN $2::date AND $3::date
      ) t
      WHERE 1=1 ${contaFilter} ${tipoFilter}
      ORDER BY data DESC NULLS LAST
      LIMIT $4 OFFSET $5`,
      [emp, dataIni, dataFim, limit, offset]
    );
    res.json({ lancamentos: result.rows.map(r => ({ ...r, valor: toN(r.valor), debito: toN(r.debito), credito: toN(r.credito) })) });
  } catch (err) {
    console.error('Error /conta-corrente/lancamentos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/conta-corrente/previstos
router.get('/previstos', async (req, res) => {
  const emp = parseInt(req.query.empresa, 10) || CC_EMPRESA;
  const dataIni = parseDate(req.query.dataIni || new Date().toISOString().slice(0,10));
  const dataFim = parseDate(req.query.dataFim || addDays(new Date().toISOString().slice(0,10), 60));
  const tipo = req.query.tipo || 'todos';
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 100);

  try {
    const tipoFilter = tipo === 'entradas' ? "WHERE tipo='entrada'" : tipo === 'saidas' ? "WHERE tipo='saida'" : '';
    const result = await query(
      `SELECT * FROM (
        SELECT TO_CHAR(recevencimento, 'YYYY-MM-DD') AS vencimento, 'entrada' AS tipo,
               COALESCE(pa.partrazao,'Cliente') AS historico,
               recedocumento AS documento,
               '—' AS conta,
               NULL::numeric AS debito,
               recevalor AS credito,
               recevalor AS valor,
               CASE WHEN recevencimento < NOW()::date THEN 'Vencido' ELSE 'Previsto' END AS status
        FROM rece
        LEFT JOIN part pa ON pa.partcodigo = rececliente
        WHERE receempresa=$1 AND recevencimento BETWEEN $2::date AND $3::date
          AND recefechamento IS NULL
      UNION ALL
        SELECT TO_CHAR(pagavencimento, 'YYYY-MM-DD') AS vencimento, 'saida' AS tipo,
               COALESCE(pa.partrazao, pagaobs, pagadocumento, 'Fornecedor') AS historico,
               pagadocumento AS documento,
               '—' AS conta,
               pagavalor AS debito,
               NULL::numeric AS credito,
               pagavalor AS valor,
               CASE WHEN pagavencimento < NOW()::date THEN 'Vencido' ELSE 'Previsto' END AS status
        FROM paga
        LEFT JOIN part pa ON pa.partcodigo = pagafornecedor
        WHERE pagaempresa=$1 AND pagavencimento BETWEEN $2::date AND $3::date
      ) t ${tipoFilter}
      ORDER BY vencimento
      LIMIT $4`,
      [emp, dataIni, dataFim, limit]
    );
    res.json({ previstos: result.rows.map(r => ({ ...r, valor: toN(r.valor), debito: toN(r.debito), credito: toN(r.credito) })) });
  } catch (err) {
    console.error('Error /conta-corrente/previstos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/conta-corrente/conciliacao
router.get('/conciliacao', async (req, res) => {
  const emp = parseInt(req.query.empresa, 10) || CC_EMPRESA;
  const hoje = new Date().toISOString().slice(0, 10);
  const dataIni = parseDate(req.query.dataIni || addDays(hoje, -30));
  const dataFim = parseDate(req.query.dataFim || hoje);

  try {
    const [receRes, pagaRes, pagjDocsRes] = await Promise.all([
      query(
        `SELECT TO_CHAR(recevencimento, 'YYYY-MM-DD') AS data,
                COALESCE(pa.partrazao, 'Cliente') AS historico,
                recedocumento AS documento,
                recevalor AS valor,
                recefechamento IS NOT NULL AS conciliado,
                (recevencimento < NOW()::date AND recefechamento IS NULL) AS vencido
         FROM rece
         LEFT JOIN part pa ON pa.partcodigo = rececliente
         WHERE receempresa=$1 AND recevencimento BETWEEN $2::date AND $3::date
         ORDER BY recevencimento DESC LIMIT 200`,
        [emp, dataIni, dataFim]
      ),
      query(
        `SELECT TO_CHAR(pagavencimento, 'YYYY-MM-DD') AS data,
                COALESCE(pa.partrazao, pagaobs, pagadocumento, 'Fornecedor') AS historico,
                pagadocumento AS documento,
                pagavalor AS valor,
                (pagavencimento < NOW()::date) AS vencido
         FROM paga
         LEFT JOIN part pa ON pa.partcodigo = pagafornecedor
         WHERE pagaempresa=$1 AND pagavencimento BETWEEN $2::date AND $3::date
         ORDER BY pagavencimento DESC LIMIT 200`,
        [emp, dataIni, dataFim]
      ),
      query(
        `SELECT DISTINCT pagjdocumento FROM pagj
         WHERE pagjempresa=$1 AND pagjpagamento IS NOT NULL`,
        [emp]
      ),
    ]);

    const pagjDocSet = new Set(pagjDocsRes.rows.map(r => r.pagjdocumento).filter(Boolean));

    const rece = receRes.rows.map(r => ({
      data: r.data, historico: r.historico, documento: r.documento, valor: toN(r.valor),
      status: r.conciliado ? 'conciliado' : r.vencido ? 'vencido' : 'pendente',
    }));
    const paga = pagaRes.rows.map(r => ({
      data: r.data, historico: r.historico, documento: r.documento, valor: toN(r.valor),
      status: pagjDocSet.has(r.documento) ? 'conciliado' : r.vencido ? 'vencido' : 'pendente',
    }));

    res.json({
      rece, paga,
      resumo: {
        recePrevisto: rece.reduce((s, r) => s + r.valor, 0),
        receConciliado: rece.filter(r => r.status === 'conciliado').reduce((s, r) => s + r.valor, 0),
        receVencido: rece.filter(r => r.status === 'vencido').reduce((s, r) => s + r.valor, 0),
        pagaPrevisto: paga.reduce((s, r) => s + r.valor, 0),
        pagaConciliado: paga.filter(r => r.status === 'conciliado').reduce((s, r) => s + r.valor, 0),
        pagaVencido: paga.filter(r => r.status === 'vencido').reduce((s, r) => s + r.valor, 0),
      },
    });
  } catch (err) {
    console.error('Error /conta-corrente/conciliacao:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/conta-corrente/transferencias
router.get('/transferencias', async (req, res) => {
  const emp = parseInt(req.query.empresa, 10) || CC_EMPRESA;
  const dataIni = parseDate(req.query.dataIni || addDays(new Date().toISOString().slice(0,10), -30));
  const dataFim = parseDate(req.query.dataFim || new Date().toISOString().slice(0,10));

  try {
    const [contasRes, entRes, saiRes] = await Promise.all([
      query(
        `SELECT cr.ccrrcodigo AS codigo, cr.ccrrdescricao AS descricao, cr.ccrrsaldo AS saldo
         FROM ccrr cr JOIN ccre ce ON ce.ccreconta = cr.ccrrcodigo
         WHERE ce.ccreempresa=$1 ORDER BY cr.ccrrsaldo DESC`,
        [emp]
      ),
      query(
        `SELECT fatjbxccrr AS conta, COUNT(*) AS qtd,
                SUM(COALESCE(fatjdinheiro,0)+COALESCE(fatjcheque,0)+COALESCE(fatjcartao,0)) AS total
         FROM fatj
         WHERE fatjempresa=$1 AND fatjpagamento IS NOT NULL AND fatjbxccrr > 0
           AND fatjbxmapa BETWEEN $2::date AND $3::date
         GROUP BY fatjbxccrr`,
        [emp, dataIni, dataFim]
      ),
      query(
        `SELECT pagjbxccrr AS conta, COUNT(*) AS qtd, SUM(pagjpago) AS total
         FROM pagj
         WHERE pagjempresa=$1 AND pagjpagamento IS NOT NULL AND pagjbxccrr > 0
           AND pagjbxmapa BETWEEN $2::date AND $3::date
         GROUP BY pagjbxccrr`,
        [emp, dataIni, dataFim]
      ),
    ]);

    const entMap = {}, saiMap = {};
    entRes.rows.forEach(r => { entMap[r.conta] = { qtd: parseInt(r.qtd), total: toN(r.total) }; });
    saiRes.rows.forEach(r => { saiMap[r.conta] = { qtd: parseInt(r.qtd), total: toN(r.total) }; });

    const contas = contasRes.rows.map(r => ({
      codigo: r.codigo, descricao: r.descricao, saldo: toN(r.saldo),
      entradas: entMap[r.codigo] || { qtd: 0, total: 0 },
      saidas: saiMap[r.codigo] || { qtd: 0, total: 0 },
      movimento: (entMap[r.codigo]?.total || 0) - (saiMap[r.codigo]?.total || 0),
    }));

    res.json({ contas, periodo: { dataIni, dataFim } });
  } catch (err) {
    console.error('Error /conta-corrente/transferencias:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/conta-corrente/extratos
router.get('/extratos', async (req, res) => {
  const emp = parseInt(req.query.empresa, 10) || CC_EMPRESA;
  const dataIni = parseDate(req.query.dataIni || addDays(new Date().toISOString().slice(0,10), -30));
  const dataFim = parseDate(req.query.dataFim || new Date().toISOString().slice(0,10));

  try {
    const contasRes = await query(
      `SELECT cr.ccrrcodigo AS codigo, cr.ccrrdescricao AS descricao, cr.ccrrsaldo AS saldo
       FROM ccrr cr JOIN ccre ce ON ce.ccreconta = cr.ccrrcodigo
       WHERE ce.ccreempresa=$1 ORDER BY cr.ccrrsaldo DESC`,
      [emp]
    );
    const contas = contasRes.rows.map(r => ({ codigo: r.codigo, descricao: r.descricao, saldo: toN(r.saldo) }));
    const contaId = parseInt(req.query.conta, 10) || (contas[0]?.codigo || 0);

    if (!contaId) return res.json({ contas, movimentos: [], saldoInicial: 0, saldoFinal: 0 });

    const movRes = await query(
      `SELECT * FROM (
        SELECT TO_CHAR(fatjbxmapa, 'YYYY-MM-DD') AS data,
               'entrada' AS tipo,
               COALESCE(pa.partrazao, 'Cliente') AS historico,
               fatjcodigo::text AS documento,
               (COALESCE(fatjdinheiro,0)+COALESCE(fatjcheque,0)+COALESCE(fatjcartao,0)) AS valor
        FROM fatj
        LEFT JOIN part pa ON pa.partcodigo = fatjcliente
        WHERE fatjempresa=$1 AND fatjbxccrr=$2 AND fatjpagamento IS NOT NULL
          AND fatjbxmapa BETWEEN $3::date AND $4::date
      UNION ALL
        SELECT TO_CHAR(pagjbxmapa, 'YYYY-MM-DD') AS data,
               'saida' AS tipo,
               COALESCE(pagjobs, pagjdocumento, 'Pagamento') AS historico,
               pagjdocumento AS documento,
               pagjpago AS valor
        FROM pagj
        WHERE pagjempresa=$1 AND pagjbxccrr=$2 AND pagjpagamento IS NOT NULL
          AND pagjbxmapa BETWEEN $3::date AND $4::date
      ) t ORDER BY data`,
      [emp, contaId, dataIni, dataFim]
    );

    const conta = contas.find(c => c.codigo === contaId);
    const movimentos = movRes.rows.map(r => ({ ...r, valor: toN(r.valor) }));
    const totalEnt = movimentos.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0);
    const totalSai = movimentos.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0);
    const saldoInicial = (conta?.saldo || 0) - totalEnt + totalSai;
    let saldoRun = saldoInicial;
    const movComSaldo = movimentos.map(m => {
      saldoRun += m.tipo === 'entrada' ? m.valor : -m.valor;
      return { ...m, debito: m.tipo === 'saida' ? m.valor : 0, credito: m.tipo === 'entrada' ? m.valor : 0, saldo: saldoRun };
    });

    res.json({ contas, contaId, movimentos: movComSaldo, saldoInicial, saldoFinal: conta?.saldo || 0 });
  } catch (err) {
    console.error('Error /conta-corrente/extratos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
