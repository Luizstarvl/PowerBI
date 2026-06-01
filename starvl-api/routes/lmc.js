const express = require('express');
const router = express.Router();
const { queryFor } = require('../db/poolManager');





function getPeriodoRange(periodo) {
  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  const diasNoMes = new Date(ano, mes, 0).getDate();

  return {
    mes,
    ano,
    dataInicio: `${ano}-${String(mes).padStart(2, '0')}-01`,
    dataFim: `${ano}-${String(mes).padStart(2, '0')}-${diasNoMes}`,
  };
}

// GET /api/lmc?empresa=7432&periodo=042026
router.get('/', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const query = queryFor(empresa);
  const periodo = req.query.periodo; // MMYYYY

  if (!empresa || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }

  const mes = parseInt(periodo.substring(0, 2));
  const ano = parseInt(periodo.substring(2, 6));
  // lmcperiodo stored as 'MM/YYYY' string in the DB
  const lmcperiodoStr = `${String(mes).padStart(2, '0')}/${ano}`;

  try {
    const lmcResult = await query(
      `SELECT
         lmc.lmccodigo,
         lmc.lmccombustivel,
         prod.prodresumo AS combustivel_nome,
         lmc.lmcperiodo,
         lmc.lmcabertura,
         lmc.lmccompra,
         lmc.lmcvenda,
         lmc.lmcafericao,
         lmc.lmcfechamento,
         lmc.lmcdata
       FROM lmc
       JOIN prod ON prod.prodcodigo = lmc.lmccombustivel
       WHERE lmc.lmcempresa = $1
         AND lmc.lmcperiodo = $2
       ORDER BY prod.prodresumo`,
      [empresa, lmcperiodoStr]
    );

    if (lmcResult.rows.length === 0) {
      return res.json({ lmcperiodo: lmcperiodoStr, registros: [], tanques: [] });
    }

    const lmcCodigos = lmcResult.rows.map(r => r.lmccodigo);

    const tanqResult = await query(
      `SELECT
         lmce.lmcecodigo,
         lmce.lmcelmc,
         lmce.lmcetanque,
         tanq.tanqmodelo AS tanque_nome,
         lmce.lmceabertura,
         lmce.lmcefechamento
       FROM lmce
       JOIN tanq ON tanq.tanqcodigo = lmce.lmcetanque
       WHERE lmce.lmcelmc = ANY($1::int[])
       ORDER BY lmce.lmcetanque`,
      [lmcCodigos]
    );

    res.json({
      lmcperiodo: lmcperiodoStr,
      registros: lmcResult.rows.map(r => ({
        codigo: r.lmccodigo,
        combustivelCodigo: r.lmccombustivel,
        combustivelNome: r.combustivel_nome,
        abertura: parseFloat(r.lmcabertura || 0),
        compra: parseFloat(r.lmccompra || 0),
        venda: parseFloat(r.lmcvenda || 0),
        afericao: parseFloat(r.lmcafericao || 0),
        fechamento: parseFloat(r.lmcfechamento || 0),
        saldoCalculado:
          parseFloat(r.lmcabertura || 0) +
          parseFloat(r.lmccompra || 0) -
          parseFloat(r.lmcvenda || 0) +
          parseFloat(r.lmcafericao || 0),
        data: r.lmcdata,
      })),
      tanques: tanqResult.rows.map(r => ({
        codigo: r.lmcecodigo,
        lmcCodigo: r.lmcelmc,
        tanqueCodigo: r.lmcetanque,
        tanqueNome: r.tanque_nome,
        abertura: parseFloat(r.lmceabertura || 0),
        fechamento: parseFloat(r.lmcefechamento || 0),
      })),
    });
  } catch (err) {
    console.error('Error in /lmc:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/lmc/controle?empresa=7432&periodo=042026
router.get('/controle', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const query = queryFor(empresa);
  const periodo = req.query.periodo;

  if (!empresa || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }

  const { mes, ano, dataInicio, dataFim } = getPeriodoRange(periodo);

  try {
    // Reescrito com LEFT JOINs pre-agregados para evitar "subquery uses ungrouped column"
    const result = await query(
      `SELECT
         CAST(v.vdadata AS date)         AS emissao,
         p.prodcodigo                     AS cod_produto,
         p.proddescricao                  AS descricao_produto,
         COALESCE(MAX(c110.total), 0)     AS compra_110,
         COALESCE(MAX(c220.total), 0)     AS compra_220,
         COALESCE(MAX(af.total),   0)     AS afericao,
         COALESCE(SUM(i.vditqtd),  0)     AS venda_110e220
       FROM vda v
       LEFT JOIN vdit i
         ON i.vditcodigovda = v.vdacodigo
        AND i.vditempresa   = $1
       LEFT JOIN prod p
         ON p.prodcodigo = i.vditproduto
       LEFT JOIN (
           SELECT
             CAST(r.entcpachegada AS date) AS dia,
             t.entcpiproduto               AS produto,
             SUM(
               COALESCE(t.entcpivol1, 0) +
               COALESCE(t.entcpivol2, 0) +
               COALESCE(t.entcpivol3, 0)
             ) AS total
           FROM entcpi t
           LEFT JOIN entcpa r
             ON r.entcpacodigo  = t.entcpicompra
            AND r.entcpaempresa = $1
           WHERE t.entcpiempresa = $1
           GROUP BY CAST(r.entcpachegada AS date), t.entcpiproduto
       ) c110
         ON c110.dia     = CAST(v.vdadata AS date)
        AND c110.produto = p.prodcodigo
       LEFT JOIN (
           SELECT
             CAST(d.pededatarecebimento AS date) AS dia,
             e.pediproduto                        AS produto,
             SUM(e.pediqtd)                       AS total
           FROM pede d
           LEFT JOIN pedi e
             ON e.pedicodigopede = d.pedecodigo
            AND e.pediempresa    = $1
           WHERE d.pedeempresa = $1
           GROUP BY CAST(d.pededatarecebimento AS date), e.pediproduto
       ) c220
         ON c220.dia     = CAST(v.vdadata AS date)
        AND c220.produto = p.prodcodigo
       LEFT JOIN (
           SELECT
             CAST(a.afermovimento AS date) AS dia,
             a.aferproduto                 AS produto,
             SUM(a.aferqtd)                AS total
           FROM afer a
           WHERE a.aferempresa = $1
           GROUP BY CAST(a.afermovimento AS date), a.aferproduto
       ) af
         ON af.dia     = CAST(v.vdadata AS date)
        AND af.produto = p.prodcodigo
       WHERE v.vdaempresa = $1
         AND p.prodtipo   = 1
         AND v.vdastatus  = 0
         AND i.vditstatus = 0
         AND CAST(v.vdadata AS date) BETWEEN $2 AND $3
       GROUP BY
         CAST(v.vdadata AS date),
         p.prodcodigo,
         p.proddescricao
       ORDER BY 1, 3`,
      [empresa, dataInicio, dataFim]
    );

    res.json({
      periodo: { mes, ano, dataInicio, dataFim },
      registros: result.rows.map(r => ({
        emissao: r.emissao,
        codProduto: r.cod_produto,
        descricaoProduto: r.descricao_produto,
        compra110: parseFloat(r.compra_110 || 0),
        compra220: parseFloat(r.compra_220 || 0),
        afericao: parseFloat(r.afericao || 0),
        venda: parseFloat(r.venda_110e220 || 0),
      })),
    });
  } catch (err) {
    console.error('Error in /lmc/controle:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/lmc/diario?empresa=7432&periodo=042026
router.get('/diario', async (req, res) => {
  const empresa = parseInt(req.query.empresa);
  const query = queryFor(empresa);
  const periodo = req.query.periodo;

  if (!empresa || !periodo || periodo.length !== 6) {
    return res.status(400).json({ error: 'empresa and periodo (MMYYYY) required' });
  }

  const { mes, ano, dataInicio, dataFim } = getPeriodoRange(periodo);

  try {
    const vendasDiarias = await query(
      `SELECT
         vda.vdamovimento AS dia,
         vdit.vditproduto AS produto,
         prod.prodresumo AS produto_nome,
         COALESCE(SUM(vdit.vditqtd), 0) AS qtd_vendida,
         COALESCE(SUM(vdit.vdittotal), 0) AS valor_vendido
       FROM vdit
       JOIN vda ON vda.vdacodigo = vdit.vditcodigovda AND vda.vdaempresa = vdit.vditempresa
       JOIN prod ON prod.prodcodigo = vdit.vditproduto
       WHERE vdit.vditempresa = $1
         AND vda.vdamovimento >= $2
         AND vda.vdamovimento <= $3
         AND (vda.vdastatus IS NULL OR vda.vdastatus = 0)
         AND prod.prodtipo = 1
       GROUP BY vda.vdamovimento, vdit.vditproduto, prod.prodresumo
       ORDER BY dia, produto_nome`,
      [empresa, dataInicio, dataFim]
    );

    const comprasDiarias = await query(
      `SELECT
         DATE(entcpa.entcpachegada) AS dia,
         entcpi.entcpiproduto AS produto,
         prod.prodresumo AS produto_nome,
         COALESCE(SUM(entcpi.entcpiqtd), 0) AS qtd_comprada,
         COALESCE(SUM(entcpi.entcpitotal), 0) AS valor_comprado,
         CASE WHEN entcpa.entcpachave IS NOT NULL THEN '110' ELSE '220' END AS tipo
       FROM entcpa
       JOIN entcpi ON entcpi.entcpicompra = entcpa.entcpacodigo
       JOIN prod ON prod.prodcodigo = entcpi.entcpiproduto
       WHERE entcpa.entcpaempresa = $1
         AND DATE(entcpa.entcpachegada) >= $2
         AND DATE(entcpa.entcpachegada) <= $3
         AND prod.prodtipo = 1
       GROUP BY DATE(entcpa.entcpachegada), entcpi.entcpiproduto, prod.prodresumo,
                CASE WHEN entcpa.entcpachave IS NOT NULL THEN '110' ELSE '220' END
       ORDER BY dia, produto_nome`,
      [empresa, dataInicio, dataFim]
    );

    const afericoesDiarias = await query(
      `SELECT
         DATE(aferdata) AS dia,
         aferproduto AS produto,
         prod.prodresumo AS produto_nome,
         COALESCE(SUM(aferqtd), 0) AS qtd_aferida
       FROM afer
       JOIN prod ON prod.prodcodigo = afer.aferproduto
       WHERE aferempresa = $1
         AND DATE(aferdata) >= $2
         AND DATE(aferdata) <= $3
       GROUP BY DATE(aferdata), aferproduto, prod.prodresumo
       ORDER BY dia, produto_nome`,
      [empresa, dataInicio, dataFim]
    );

    res.json({
      periodo: { mes, ano },
      vendasDiarias: vendasDiarias.rows.map(r => ({
        dia: r.dia,
        produto: r.produto,
        produtoNome: r.produto_nome,
        qtdVendida: parseFloat(r.qtd_vendida),
        valorVendido: parseFloat(r.valor_vendido),
      })),
      comprasDiarias: comprasDiarias.rows.map(r => ({
        dia: r.dia,
        produto: r.produto,
        produtoNome: r.produto_nome,
        qtdComprada: parseFloat(r.qtd_comprada),
        valorComprado: parseFloat(r.valor_comprado),
        tipo: r.tipo,
      })),
      afericoesDiarias: afericoesDiarias.rows.map(r => ({
        dia: r.dia,
        produto: r.produto,
        produtoNome: r.produto_nome,
        qtdAferida: parseFloat(r.qtd_aferida),
      })),
    });
  } catch (err) {
    console.error('Error in /lmc/diario:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
