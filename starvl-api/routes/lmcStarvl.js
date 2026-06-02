/**
 * routes/lmcStarvl.js
 *
 * LMC gerenciado pelo STARVL:
 *  – Abertura e fechamento calculados por nós (encadeamento diário)
 *  – Compras 110/220, vendas e aferições buscadas do banco do cliente (SGA)
 *  – Dados persistidos em starvl_lmc (banco de gestão)
 */
const express = require('express');
const router  = express.Router();
const { mainPool, queryFor } = require('../db/poolManager');

// ── helpers ──────────────────────────────────────────────────────────────────

function getPeriodoRange(periodo) {
  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  const diasNoMes = new Date(ano, mes, 0).getDate();
  return {
    mes,
    ano,
    dataInicio: `${ano}-${String(mes).padStart(2, '0')}-01`,
    dataFim:    `${ano}-${String(mes).padStart(2, '0')}-${String(diasNoMes).padStart(2, '0')}`,
    periodoStr: `${String(mes).padStart(2, '0')}/${ano}`,
  };
}

function toDateStr(v) {
  if (!v) return '';
  const s = v instanceof Date ? v.toISOString() : String(v);
  return s.split('T')[0];
}

// ── GET /api/lmc-starvl?empresa=X&periodo=MMYYYY ──────────────────────────────
// Devolve registros armazenados no banco STARVL para o período
router.get('/', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const periodo = req.query.periodo;
  if (!empresa || !periodo || periodo.length !== 6)
    return res.status(400).json({ error: 'empresa e periodo (MMYYYY) são obrigatórios' });

  const { dataInicio, dataFim, periodoStr } = getPeriodoRange(periodo);

  try {
    const { rows } = await mainPool.query(
      `SELECT
         slmc_produto       AS cod_produto,
         slmc_produto_nome  AS descricao_produto,
         slmc_data          AS emissao,
         slmc_abertura      AS abertura,
         slmc_compras110    AS compras110,
         slmc_compras220    AS compras220,
         slmc_vendas        AS vendas,
         slmc_afericoes     AS afericoes,
         slmc_fechamento    AS fechamento,
         slmc_synced_at     AS synced_at
       FROM starvl_lmc
       WHERE slmc_empresa = $1
         AND slmc_data BETWEEN $2 AND $3
       ORDER BY slmc_data, slmc_produto_nome`,
      [empresa, dataInicio, dataFim]
    );

    const registros = rows.map(r => ({
      codProduto:       r.cod_produto,
      descricaoProduto: r.descricao_produto || 'Produto',
      emissao:          toDateStr(r.emissao),
      abertura:         parseFloat(r.abertura   || 0),
      compras110:       parseFloat(r.compras110 || 0),
      compras220:       parseFloat(r.compras220 || 0),
      vendas:           parseFloat(r.vendas     || 0),
      afericoes:        parseFloat(r.afericoes  || 0),
      fechamento:       parseFloat(r.fechamento || 0),
      syncedAt:         r.synced_at,
    }));

    res.json({ empresa, periodo: periodoStr, registros });
  } catch (err) {
    console.error('GET /lmc-starvl:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/lmc-starvl/fechamento?empresa=X ──────────────────────────────────
// Último fechamento de cada produto (para dashboard e gerenciamento)
router.get('/fechamento', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  if (!empresa)
    return res.status(400).json({ error: 'empresa é obrigatório' });

  try {
    const { rows } = await mainPool.query(
      `SELECT DISTINCT ON (slmc_produto)
         slmc_produto      AS cod_produto,
         slmc_produto_nome AS descricao_produto,
         slmc_data         AS data,
         slmc_fechamento   AS fechamento,
         slmc_synced_at    AS synced_at
       FROM starvl_lmc
       WHERE slmc_empresa = $1
       ORDER BY slmc_produto, slmc_data DESC`,
      [empresa]
    );

    res.json({
      empresa,
      fechamentos: rows.map(r => ({
        codProduto:       r.cod_produto,
        descricaoProduto: r.descricao_produto || 'Produto',
        data:             toDateStr(r.data),
        fechamento:       parseFloat(r.fechamento || 0),
        syncedAt:         r.synced_at,
      })),
    });
  } catch (err) {
    console.error('GET /lmc-starvl/fechamento:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/lmc-starvl/sync?empresa=X&periodo=MMYYYY ───────────────────────
// Busca movimentos do banco SGA, calcula abertura/fechamento e salva no STARVL
router.post('/sync', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const periodo = req.query.periodo;
  if (!empresa || !periodo || periodo.length !== 6)
    return res.status(400).json({ error: 'empresa e periodo (MMYYYY) são obrigatórios' });

  const { dataInicio, dataFim, periodoStr } = getPeriodoRange(periodo);
  const query = queryFor(empresa);
  const todayStr = toDateStr(new Date());

  try {
    // 1. Produtos combustível da empresa (apenas os que têm tanque ativo)
    const prodResult = await query(
      `SELECT DISTINCT prod.prodcodigo, prod.proddescricao
       FROM prod
       JOIN tanq ON tanq.tanqproduto = prod.prodcodigo
                AND tanq.tanqempresa = $1
                AND tanq.tanqinativo IS NULL
       WHERE prod.prodtipo = 1
       ORDER BY prod.proddescricao`,
      [empresa]
    );
    const produtos = prodResult.rows;

    if (produtos.length === 0) {
      return res.json({ ok: true, empresa, periodo: periodoStr, synced: 0, message: 'Nenhum produto combustível encontrado' });
    }

    // 2. Busca movimentos do banco SGA (parallel queries)
    const [vendasRes, c110Res, c220Res, aferRes] = await Promise.all([

      // Vendas: vda + vdit (quantidade em litros) — filtro igual ao /api/lmc/controle
      query(
        `SELECT
           DATE(v.vdadata)   AS dia,
           i.vditproduto     AS produto,
           COALESCE(SUM(i.vditqtd), 0) AS total
         FROM vdit i
         JOIN vda  v ON v.vdacodigo = i.vditcodigovda AND v.vdaempresa = i.vditempresa
         JOIN prod p ON p.prodcodigo = i.vditproduto
         WHERE i.vditempresa = $1
           AND p.prodtipo   = 1
           AND v.vdastatus  = 0
           AND i.vditstatus = 0
           AND DATE(v.vdadata) BETWEEN $2 AND $3
         GROUP BY DATE(v.vdadata), i.vditproduto`,
        [empresa, dataInicio, dataFim]
      ),

      // Compras 110: entcpa (cabeçalho) + entcpi (itens) — volume = vol1+vol2+vol3
      query(
        `SELECT
           DATE(r.entcpachegada) AS dia,
           t.entcpiproduto       AS produto,
           COALESCE(SUM(
             COALESCE(t.entcpivol1,0) +
             COALESCE(t.entcpivol2,0) +
             COALESCE(t.entcpivol3,0)
           ), 0) AS total
         FROM entcpi t
         JOIN entcpa r ON r.entcpacodigo = t.entcpicompra
                      AND r.entcpaempresa = $1
         WHERE t.entcpiempresa = $1
           AND DATE(r.entcpachegada) BETWEEN $2 AND $3
         GROUP BY DATE(r.entcpachegada), t.entcpiproduto`,
        [empresa, dataInicio, dataFim]
      ),

      // Compras 220: pede (cabeçalho) + pedi (itens) — volume = pediqtd
      query(
        `SELECT
           DATE(d.pededatarecebimento) AS dia,
           e.pediproduto               AS produto,
           COALESCE(SUM(e.pediqtd), 0) AS total
         FROM pede d
         JOIN pedi e ON e.pedicodigopede = d.pedecodigo
                    AND e.pediempresa    = d.pedeempresa
         WHERE d.pedeempresa = $1
           AND d.pededatarecebimento IS NOT NULL
           AND DATE(d.pededatarecebimento) BETWEEN $2 AND $3
         GROUP BY DATE(d.pededatarecebimento), e.pediproduto`,
        [empresa, dataInicio, dataFim]
      ),

      // Aferições: afer — coluna de data = afermovimento
      query(
        `SELECT
           DATE(a.afermovimento) AS dia,
           a.aferproduto         AS produto,
           COALESCE(SUM(a.aferqtd), 0) AS total
         FROM afer a
         WHERE a.aferempresa = $1
           AND DATE(a.afermovimento) BETWEEN $2 AND $3
         GROUP BY DATE(a.afermovimento), a.aferproduto`,
        [empresa, dataInicio, dataFim]
      ),
    ]);

    // 3. Organiza movimentos em Map: produto → dia → { vendas, c110, c220, afer }
    const movByProd = {};
    const ensureProd = (cod) => {
      if (!movByProd[cod]) movByProd[cod] = {};
      return movByProd[cod];
    };
    const ensureDay = (m, dia) => {
      if (!m[dia]) m[dia] = { vendas: 0, compras110: 0, compras220: 0, afericoes: 0 };
      return m[dia];
    };

    vendasRes.rows.forEach(r => { ensureDay(ensureProd(r.produto), toDateStr(r.dia)).vendas     += parseFloat(r.total || 0); });
    c110Res.rows.forEach(r =>    { ensureDay(ensureProd(r.produto), toDateStr(r.dia)).compras110 += parseFloat(r.total || 0); });
    c220Res.rows.forEach(r =>    { ensureDay(ensureProd(r.produto), toDateStr(r.dia)).compras220 += parseFloat(r.total || 0); });
    aferRes.rows.forEach(r =>    { ensureDay(ensureProd(r.produto), toDateStr(r.dia)).afericoes  += parseFloat(r.total || 0); });

    // 4. Abertura do dia 1 = último fechamento salvo no starvl_lmc antes do período
    //    Fallback: lmcabertura da tabela lmc do SGA (registro mensal)
    const ultimosRes = await mainPool.query(
      `SELECT DISTINCT ON (slmc_produto)
         slmc_produto, slmc_fechamento
       FROM starvl_lmc
       WHERE slmc_empresa = $1
         AND slmc_data < $2
       ORDER BY slmc_produto, slmc_data DESC`,
      [empresa, dataInicio]
    );
    const ultimoFechMap = {};
    ultimosRes.rows.forEach(r => {
      ultimoFechMap[r.slmc_produto] = parseFloat(r.slmc_fechamento || 0);
    });

    // Produtos que ainda não têm histórico no starvl_lmc → busca abertura na tabela lmc do SGA
    const semHistorico = produtos.filter(p => ultimoFechMap[p.prodcodigo] == null);
    if (semHistorico.length > 0) {
      const lmcAbertRes = await query(
        `SELECT lmccombustivel AS produto, COALESCE(lmcabertura, 0) AS abertura
         FROM lmc
         WHERE lmcempresa = $1 AND lmcperiodo = $2`,
        [empresa, periodoStr]   // periodoStr = "MM/YYYY"
      );
      lmcAbertRes.rows.forEach(r => {
        const cod = r.produto;
        if (ultimoFechMap[cod] == null) {
          ultimoFechMap[cod] = parseFloat(r.abertura || 0);
        }
      });
    }

    // 5. Gera todos os dias do período (até hoje)
    const allDays = [];
    const dCur = new Date(dataInicio + 'T12:00:00Z');
    const dEnd = new Date(
      (dataFim < todayStr ? dataFim : todayStr) + 'T12:00:00Z'
    );
    while (dCur <= dEnd) {
      allDays.push(toDateStr(dCur));
      dCur.setUTCDate(dCur.getUTCDate() + 1);
    }

    // 6. Calcula abertura/fechamento encadeado e faz upsert
    let totalSynced = 0;

    for (const prod of produtos) {
      const cod  = prod.prodcodigo;
      const nome = prod.proddescricao || 'Produto';
      const dias = movByProd[cod] || {};
      let abertura = ultimoFechMap[cod] ?? 0;

      for (const dia of allDays) {
        const mov = dias[dia] || { vendas: 0, compras110: 0, compras220: 0, afericoes: 0 };
        const fechamento = abertura
          + mov.compras110 + mov.compras220 + mov.afericoes
          - mov.vendas;

        await mainPool.query(
          `INSERT INTO starvl_lmc
             (slmc_empresa, slmc_produto, slmc_produto_nome, slmc_data,
              slmc_abertura, slmc_compras110, slmc_compras220,
              slmc_vendas, slmc_afericoes, slmc_fechamento, slmc_synced_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
           ON CONFLICT (slmc_empresa, slmc_produto, slmc_data) DO UPDATE SET
             slmc_produto_nome = EXCLUDED.slmc_produto_nome,
             slmc_abertura     = EXCLUDED.slmc_abertura,
             slmc_compras110   = EXCLUDED.slmc_compras110,
             slmc_compras220   = EXCLUDED.slmc_compras220,
             slmc_vendas       = EXCLUDED.slmc_vendas,
             slmc_afericoes    = EXCLUDED.slmc_afericoes,
             slmc_fechamento   = EXCLUDED.slmc_fechamento,
             slmc_synced_at    = NOW()`,
          [empresa, cod, nome, dia,
           abertura, mov.compras110, mov.compras220,
           mov.vendas, mov.afericoes, fechamento]
        );

        abertura = fechamento;   // próximo dia começa onde esse terminou
        totalSynced++;
      }
    }

    console.log(`[lmc-starvl] sync OK: empresa=${empresa} periodo=${periodoStr} rows=${totalSynced}`);
    res.json({ ok: true, empresa, periodo: periodoStr, synced: totalSynced, produtos: produtos.length });

  } catch (err) {
    console.error('POST /lmc-starvl/sync:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/lmc-starvl/save-period?empresa=X&periodo=MMYYYY ─────────────────
// Salva entradas manuais (sem buscar no banco SGA)
router.post('/save-period', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const periodo = req.query.periodo;
  if (!empresa || !periodo || periodo.length !== 6)
    return res.status(400).json({ error: 'empresa e periodo (MMYYYY) são obrigatórios' });

  const { codProduto, nomeProduto, dias } = req.body;
  if (!codProduto || !Array.isArray(dias) || dias.length === 0)
    return res.status(400).json({ error: 'codProduto e dias são obrigatórios' });

  const { periodoStr } = getPeriodoRange(periodo);

  try {
    for (const dia of dias) {
      await mainPool.query(
        `INSERT INTO starvl_lmc
           (slmc_empresa, slmc_produto, slmc_produto_nome, slmc_data,
            slmc_abertura, slmc_compras110, slmc_compras220,
            slmc_vendas, slmc_afericoes, slmc_fechamento, slmc_synced_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
         ON CONFLICT (slmc_empresa, slmc_produto, slmc_data) DO UPDATE SET
           slmc_produto_nome = EXCLUDED.slmc_produto_nome,
           slmc_abertura     = EXCLUDED.slmc_abertura,
           slmc_compras110   = EXCLUDED.slmc_compras110,
           slmc_compras220   = EXCLUDED.slmc_compras220,
           slmc_vendas       = EXCLUDED.slmc_vendas,
           slmc_afericoes    = EXCLUDED.slmc_afericoes,
           slmc_fechamento   = EXCLUDED.slmc_fechamento,
           slmc_synced_at    = NOW()`,
        [empresa, codProduto, nomeProduto || 'Produto', dia.data,
         dia.abertura   ?? 0,
         dia.compras110 ?? 0,
         dia.compras220 ?? 0,
         dia.vendas     ?? 0,
         dia.afericoes  ?? 0,
         dia.fechamento ?? 0]
      );
    }
    console.log(`[lmc-starvl] save-period OK: empresa=${empresa} periodo=${periodoStr} dias=${dias.length}`);
    res.json({ ok: true, empresa, periodo: periodoStr, saved: dias.length });
  } catch (err) {
    console.error('POST /lmc-starvl/save-period:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
