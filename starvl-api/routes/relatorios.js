const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { safeQuery } = require('../middleware/readonly');

const query = safeQuery(pool);

function periodoToRange(periodo) {
  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  const diasNoMes = new Date(ano, mes, 0).getDate();
  return {
    mes, ano,
    dataInicio: `${ano}-${String(mes).padStart(2, '0')}-01`,
    dataFim: `${ano}-${String(mes).padStart(2, '0')}-${String(diasNoMes).padStart(2, '0')}`,
    lmcperiodo: `${String(mes).padStart(2, '0')}/${ano}`,
  };
}

// GET /api/relatorios/descarregamentos?empresa=&periodo=MMYYYY
router.get('/descarregamentos', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const periodo = req.query.periodo;
  if (!empresa || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }
  const { dataInicio, dataFim } = periodoToRange(periodo);
  try {
    const [entcpaResult, pedeResult] = await Promise.all([
      // 110 — NF-e de entrada (entcpa com chave fiscal)
      query(
        `SELECT
           DATE(entcpa.entcpachegada) AS data,
           COALESCE(part.partrazao, '—') AS fornecedor,
           prod.prodresumo AS combustivel,
           COALESCE(SUM(entcpi.entcpiqtd), 0) AS qtd,
           CASE WHEN SUM(entcpi.entcpiqtd) > 0
                THEN SUM(entcpi.entcpitotal) / SUM(entcpi.entcpiqtd)
                ELSE 0 END AS unitario,
           COALESCE(SUM(entcpi.entcpitotal), 0) AS total,
           entcpa.entcpachave AS nota,
           entcpa.entcpaplaca AS placa
         FROM entcpa
         JOIN entcpi ON entcpi.entcpicompra = entcpa.entcpacodigo
                    AND entcpi.entcpiempresa = entcpa.entcpaempresa
         JOIN prod ON prod.prodcodigo = entcpi.entcpiproduto
         LEFT JOIN part ON part.partcodigo = entcpa.entcpafornecedor
         WHERE entcpa.entcpaempresa = $1
           AND prod.prodtipo = 1
           AND entcpa.entcpachave IS NOT NULL
           AND DATE(entcpa.entcpachegada) >= $2
           AND DATE(entcpa.entcpachegada) <= $3
         GROUP BY
           DATE(entcpa.entcpachegada), part.partrazao,
           prod.prodresumo, entcpa.entcpachave, entcpa.entcpaplaca
         ORDER BY data DESC, combustivel`,
        [empresa, dataInicio, dataFim]
      ),
      // 220 — Pedidos de compra sem NF
      query(
        `SELECT
           DATE(pede.pededatarecebimento) AS data,
           COALESCE(part.partrazao, '—') AS fornecedor,
           prod.prodresumo AS combustivel,
           pedi.pediqtd AS qtd,
           pedi.pediunitario AS unitario,
           pedi.peditotal AS total,
           pede.pedeobservacao AS observacao,
           pede.pedecodigo AS pedido
         FROM pede
         JOIN pedi ON pedi.pedicodigopede = pede.pedecodigo
                  AND pedi.pediempresa = pede.pedeempresa
         JOIN prod ON prod.prodcodigo = pedi.pediproduto
         LEFT JOIN part ON part.partcodigo = pede.pedefornecedor
         WHERE pede.pedeempresa = $1
           AND prod.prodtipo = 1
           AND pede.pededatarecebimento IS NOT NULL
           AND DATE(pede.pededatarecebimento) >= $2
           AND DATE(pede.pededatarecebimento) <= $3
         ORDER BY data DESC, combustivel`,
        [empresa, dataInicio, dataFim]
      ),
    ]);

    const comNota = entcpaResult.rows.map(r => ({
      data: r.data,
      fornecedor: r.fornecedor,
      combustivel: r.combustivel,
      qtd: parseFloat(r.qtd),
      unitario: parseFloat(r.unitario),
      total: parseFloat(r.total),
      tipo: '110',
      nota: r.nota || null,
      placa: r.placa || null,
    }));

    const semNota = pedeResult.rows.map(r => ({
      data: r.data,
      fornecedor: r.fornecedor,
      combustivel: r.combustivel,
      qtd: parseFloat(r.qtd),
      unitario: parseFloat(r.unitario),
      total: parseFloat(r.total),
      tipo: '220',
      nota: null,
      pedido: r.pedido,
      observacao: r.observacao || null,
    }));

    res.json({ comNota, semNota });
  } catch (err) {
    console.error('Error in /relatorios/descarregamentos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/relatorios/vendas?empresa=&periodo=MMYYYY
router.get('/vendas', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const periodo = req.query.periodo;
  if (!empresa || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }
  const { dataInicio, dataFim } = periodoToRange(periodo);
  try {
    const [result, totalVendasResult] = await Promise.all([
      query(
        `SELECT
           prod.prodresumo AS produto,
           prod.prodtipo AS tipo_prod,
           COALESCE(SUM(vdit.vditqtd), 0) AS qtd_total,
           COALESCE(SUM(vdit.vdittotal), 0) AS valor_total,
           CASE WHEN SUM(vdit.vditqtd) > 0
                THEN SUM(vdit.vdittotal) / SUM(vdit.vditqtd)
                ELSE 0 END AS preco_medio,
           COUNT(DISTINCT vda.vdacodigo) AS qtd_vendas
         FROM vdit
         JOIN vda ON vda.vdacodigo = vdit.vditcodigovda
                 AND vda.vdaempresa = vdit.vditempresa
         JOIN prod ON prod.prodcodigo = vdit.vditproduto
         WHERE vdit.vditempresa = $1
           AND vda.vdamovimento >= $2
           AND vda.vdamovimento <= $3
           AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         GROUP BY prod.prodresumo, prod.prodtipo
         ORDER BY valor_total DESC`,
        [empresa, dataInicio, dataFim]
      ),
      query(
        `SELECT COUNT(DISTINCT vda.vdacodigo) AS qtd_vendas_pdv
         FROM vda
         WHERE vda.vdaempresa = $1
           AND vda.vdamovimento >= $2
           AND vda.vdamovimento <= $3
           AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)`,
        [empresa, dataInicio, dataFim]
      ),
    ]);
    const rows = result.rows.map(r => ({
      produto: r.produto,
      tipoProd: r.tipo_prod,
      qtdTotal: parseFloat(r.qtd_total),
      valorTotal: parseFloat(r.valor_total),
      precoMedio: parseFloat(r.preco_medio),
      qtdVendas: parseInt(r.qtd_vendas),
    }));
    res.json({
      produtos: rows,
      totais: {
        qtdTotal: rows.reduce((s, r) => s + r.qtdTotal, 0),
        valorTotal: rows.reduce((s, r) => s + r.valorTotal, 0),
        qtdVendas: rows.reduce((s, r) => s + r.qtdVendas, 0),
        qtdVendasPdv: parseInt(totalVendasResult.rows[0]?.qtd_vendas_pdv || 0),
      },
    });
  } catch (err) {
    console.error('Error in /relatorios/vendas:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/relatorios/historico?empresa=&meses=12
router.get('/historico', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const meses = parseInt(req.query.meses) || 12;
  if (!empresa) {
    return res.status(400).json({ error: 'empresa is required' });
  }
  try {
    const result = await query(
      `SELECT
         lmc.lmcperiodo AS periodo,
         prod.prodresumo AS combustivel,
         COALESCE(SUM(lmc.lmcvenda), 0) AS volume_vendido,
         COALESCE(SUM(lmc.lmccompra), 0) AS volume_comprado,
         COALESCE(SUM(lmc.lmcafericao), 0) AS afericoes,
         COALESCE(SUM(lmc.lmcfechamento), 0) AS fechamento
       FROM lmc
       JOIN prod ON prod.prodcodigo = lmc.lmccombustivel
       WHERE lmc.lmcempresa = $1
       GROUP BY lmc.lmcperiodo, prod.prodresumo
       ORDER BY lmc.lmcperiodo DESC, prod.prodresumo
       LIMIT $2`,
      [empresa, meses * 10]
    );
    res.json(result.rows.map(r => ({
      periodo: r.periodo,
      combustivel: r.combustivel,
      volumeVendido: parseFloat(r.volume_vendido),
      volumeComprado: parseFloat(r.volume_comprado),
      afericoes: parseFloat(r.afericoes),
      fechamento: parseFloat(r.fechamento),
    })));
  } catch (err) {
    console.error('Error in /relatorios/historico:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/relatorios/consolidado?empresa=&periodo=MMYYYY
router.get('/consolidado', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const periodo = req.query.periodo;
  if (!empresa || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }
  const { dataInicio, dataFim, lmcperiodo } = periodoToRange(periodo);
  try {
    const [lmcResult, vdaResult, compra110Result, compra220Result, vendaDocResult] = await Promise.all([
      query(
        `SELECT
           prod.prodresumo AS combustivel,
           COALESCE(SUM(lmc.lmcvenda), 0) AS vol_lmc,
           COALESCE(SUM(lmc.lmcafericao), 0) AS afericoes
         FROM lmc
         JOIN prod ON prod.prodcodigo = lmc.lmccombustivel
         WHERE lmc.lmcempresa = $1 AND lmc.lmcperiodo = $2
         GROUP BY prod.prodresumo`,
        [empresa, lmcperiodo]
      ),
      query(
        `SELECT
           prod.prodresumo AS combustivel,
           COALESCE(SUM(vdit.vditqtd), 0) AS vol_total,
           COALESCE(SUM(vdit.vdittotal), 0) AS valor_total
         FROM vdit
         JOIN vda ON vda.vdacodigo = vdit.vditcodigovda AND vda.vdaempresa = vdit.vditempresa
         JOIN prod ON prod.prodcodigo = vdit.vditproduto
         WHERE vdit.vditempresa = $1
           AND vda.vdamovimento >= $2
           AND vda.vdamovimento <= $3
           AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
           AND prod.prodtipo = 1
         GROUP BY prod.prodresumo`,
        [empresa, dataInicio, dataFim]
      ),
      // compra 110: entcpa com NF-e
      query(
        `SELECT
           prod.prodresumo AS combustivel,
           COALESCE(SUM(entcpi.entcpiqtd), 0) AS qtd,
           COALESCE(SUM(entcpi.entcpitotal), 0) AS valor
         FROM entcpa
         JOIN entcpi ON entcpi.entcpicompra = entcpa.entcpacodigo
                    AND entcpi.entcpiempresa = entcpa.entcpaempresa
         JOIN prod ON prod.prodcodigo = entcpi.entcpiproduto
         WHERE entcpa.entcpaempresa = $1
           AND prod.prodtipo = 1
           AND entcpa.entcpachave IS NOT NULL
           AND DATE(entcpa.entcpachegada) >= $2
           AND DATE(entcpa.entcpachegada) <= $3
         GROUP BY prod.prodresumo`,
        [empresa, dataInicio, dataFim]
      ),
      // compra 220: pedidos de compra sem NF
      query(
        `SELECT
           prod.prodresumo AS combustivel,
           COALESCE(SUM(pedi.pediqtd), 0) AS qtd,
           COALESCE(SUM(pedi.peditotal), 0) AS valor
         FROM pede
         JOIN pedi ON pedi.pedicodigopede = pede.pedecodigo
                  AND pedi.pediempresa = pede.pedeempresa
         JOIN prod ON prod.prodcodigo = pedi.pediproduto
         WHERE pede.pedeempresa = $1
           AND prod.prodtipo = 1
           AND pede.pededatarecebimento IS NOT NULL
           AND DATE(pede.pededatarecebimento) >= $2
           AND DATE(pede.pededatarecebimento) <= $3
         GROUP BY prod.prodresumo`,
        [empresa, dataInicio, dataFim]
      ),
      query(
        `SELECT
           prod.prodresumo AS combustivel,
           CASE WHEN vda.vdadocumento = 0 THEN '220' ELSE '110' END AS tipo,
           COALESCE(SUM(vdit.vditqtd), 0) AS qtd,
           COALESCE(SUM(vdit.vdittotal), 0) AS valor
         FROM vdit
         JOIN vda ON vda.vdacodigo = vdit.vditcodigovda AND vda.vdaempresa = vdit.vditempresa
         JOIN prod ON prod.prodcodigo = vdit.vditproduto
         WHERE vdit.vditempresa = $1
           AND vda.vdamovimento >= $2
           AND vda.vdamovimento <= $3
           AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
           AND prod.prodtipo = 1
         GROUP BY prod.prodresumo,
           CASE WHEN vda.vdadocumento = 0 THEN '220' ELSE '110' END`,
        [empresa, dataInicio, dataFim]
      ),
    ]);

    const combustiveis = [...new Set([
      ...lmcResult.rows.map(r => r.combustivel),
      ...vdaResult.rows.map(r => r.combustivel),
      ...compra110Result.rows.map(r => r.combustivel),
      ...compra220Result.rows.map(r => r.combustivel),
    ])].sort();

    const rows = combustiveis.map(comb => {
      const lmc  = lmcResult.rows.find(r => r.combustivel === comb) || {};
      const pdv  = vdaResult.rows.find(r => r.combustivel === comb) || {};
      const c110 = compra110Result.rows.find(r => r.combustivel === comb) || {};
      const c220 = compra220Result.rows.find(r => r.combustivel === comb) || {};
      const v110 = vendaDocResult.rows.find(r => r.combustivel === comb && r.tipo === '110') || {};
      const v220 = vendaDocResult.rows.find(r => r.combustivel === comb && r.tipo === '220') || {};
      const volLmc = parseFloat(lmc.vol_lmc || 0);
      const volPdv = parseFloat(pdv.vol_total || 0);
      return {
        combustivel: comb,
        volLmc,
        afericoes: parseFloat(lmc.afericoes || 0),
        volPdv,
        valorPdv: parseFloat(pdv.valor_total || 0),
        compra110Qtd: parseFloat(c110.qtd || 0),
        compra110Valor: parseFloat(c110.valor || 0),
        compra220Qtd: parseFloat(c220.qtd || 0),
        compra220Valor: parseFloat(c220.valor || 0),
        venda110Qtd: parseFloat(v110.qtd || 0),
        venda110Valor: parseFloat(v110.valor || 0),
        venda220Qtd: parseFloat(v220.qtd || 0),
        venda220Valor: parseFloat(v220.valor || 0),
        difLmcPdv: volLmc - volPdv,
      };
    });

    res.json(rows);
  } catch (err) {
    console.error('Error in /relatorios/consolidado:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
