const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { safeQuery } = require('../middleware/readonly');

const query = safeQuery(pool);
const EMPRESA_ID = 7432;

function parseDate(v) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(v || ''))) return v;
  return new Date().toISOString().slice(0, 10);
}

function toInt(v, def = 0) {
  const n = parseInt(v, 10);
  return isNaN(n) ? def : n;
}

const SUPR_OPERACAO = {
  D: 'SANGRIA',
  P: 'PAGAMENTO',
  M: 'EMPRÉSTIMO',
  C: 'SUPRIMENTO',
  E: 'OUTRA ENTRADA',
  S: 'OUTRA SAÍDA',
  Q: 'BAIXA CHEQUE',
  G: 'RESGATE PONTOS',
  H: 'ESTORNO CHEQUE',
};

// GET /api/auditoria
router.get('/', async (req, res) => {
  const empresa = EMPRESA_ID;
  const data_ini = parseDate(req.query.data_ini) + ' 00:00:00';
  const data_fim = parseDate(req.query.data_fim) + ' 23:59:59';
  const page  = Math.max(1, toInt(req.query.page, 1));
  const limit = Math.min(200, Math.max(10, toInt(req.query.limit, 50)));
  const offset = (page - 1) * limit;

  const usuario  = String(req.query.usuario   || '').trim().toUpperCase() || null;
  const modulo   = String(req.query.modulo    || '').trim().toUpperCase() || null;
  const operacao = String(req.query.operacao  || '').trim().toUpperCase() || null;
  const tipoAcao = String(req.query.tipo_acao || '').trim().toUpperCase() || null;
  const search   = String(req.query.search    || '').trim() || null;

  try {
    // ── Build combined events from active tables ────────────────────────────
    const params = [empresa, data_ini, data_fim];

    const unionSql = `
      WITH eventos AS (

        -- 1. SUPRIMENTOS / SANGRIAS DE CAIXA
        SELECT
          supr.suprcodigo::text                         AS id,
          supr.suprdata                                 AS data_hora,
          COALESCE(UPPER(TRIM(supr.suprusuario)), '—')  AS usuario,
          'CAIXA'                                       AS modulo,
          CASE supr.suproperacao
            WHEN 'D' THEN 'SANGRIA'
            WHEN 'P' THEN 'PAGAMENTO'
            WHEN 'M' THEN 'EMPRÉSTIMO'
            WHEN 'C' THEN 'SUPRIMENTO'
            WHEN 'E' THEN 'OUTRA ENTRADA'
            WHEN 'S' THEN 'OUTRA SAÍDA'
            WHEN 'Q' THEN 'BAIXA CHEQUE'
            WHEN 'G' THEN 'RESGATE PONTOS'
            WHEN 'H' THEN 'ESTORNO CHEQUE'
            ELSE COALESCE(supr.suproperacao, 'OPERAÇÃO')
          END                                           AS operacao,
          CASE WHEN supr.suproperacao IN ('D','P','M','S','Q','G')
               THEN 'SAÍDA' ELSE 'ENTRADA' END          AS direcao,
          supr.suprvalor                                AS valor,
          TRIM(
            COALESCE(supr.suprhistorico, '') ||
            CASE WHEN supr.suprcaixa IS NOT NULL
                 THEN ' | Caixa: ' || supr.suprcaixa::text ELSE '' END ||
            CASE WHEN supr.suprplaca IS NOT NULL AND supr.suprplaca <> ''
                 THEN ' | Placa: ' || supr.suprplaca ELSE '' END
          )                                             AS detalhe,
          supr.suprcodigo::text                         AS referencia,
          NULL::text                                    AS terminal,
          'INCLUSÃO'                                    AS tipo_acao
        FROM supr
        WHERE supr.suprempresa = $1
          AND supr.suprdata BETWEEN $2::timestamp AND $3::timestamp

        UNION ALL

        -- 2. LIBERAÇÕES / MOTIVAÇÕES DE VENDA
        SELECT
          vdmt.vdmtcodigo::text,
          vdmt.vdmtdata,
          COALESCE(UPPER(TRIM(vdmt.vdmtusuario)), '—'),
          'VENDA',
          'LIBERAÇÃO DE VENDA',
          'SAÍDA',
          vdmt.vdmtvlr,
          TRIM(
            'Motivo: ' || COALESCE(vdmt.vdmtmotivo, '—') ||
            CASE WHEN vdmt.vdmtproduto IS NOT NULL
                 THEN ' | Produto: ' || vdmt.vdmtproduto::text ELSE '' END ||
            CASE WHEN vdmt.vdmtqtd IS NOT NULL
                 THEN ' | Qtd: ' || vdmt.vdmtqtd::text ELSE '' END ||
            CASE WHEN vdmt.vdmtcaixa IS NOT NULL
                 THEN ' | Caixa: ' || vdmt.vdmtcaixa::text ELSE '' END
          ),
          CASE WHEN vdmt.vdmtcodigovda > 0
               THEN 'Venda #' || vdmt.vdmtcodigovda::text
               ELSE '—' END,
          NULL,
          'INCLUSÃO'
        FROM vdmt
        WHERE vdmt.vdmtempresa = $1
          AND vdmt.vdmtdata BETWEEN $2::timestamp AND $3::timestamp

        UNION ALL

        -- 3. CANCELAMENTOS DE VENDA
        SELECT
          vda.vdacodigo::text,
          vda.vdadata,
          COALESCE(UPPER(TRIM(vda.vdausuariocanc)), '—'),
          'VENDA',
          'CANCELAMENTO',
          'SAÍDA',
          (SELECT COALESCE(SUM(vdit.vdittotal), 0)
           FROM vdit
           WHERE vdit.vditcodigovda = vda.vdacodigo
             AND vdit.vditempresa   = vda.vdaempresa),
          TRIM(
            'Venda #' || vda.vdacodigo::text ||
            CASE WHEN vda.vdamotivocanc IS NOT NULL AND vda.vdamotivocanc <> ''
                 THEN ' | Motivo: ' || vda.vdamotivocanc ELSE '' END ||
            COALESCE(' | Cliente: ' || part.partrazao, '')
          ),
          vda.vdacodigo::text,
          vda.vdaterminal::text,
          'CANCELAMENTO'
        FROM vda
        LEFT JOIN part ON part.partcodigo = vda.vdacliente
        WHERE vda.vdaempresa  = $1
          AND vda.vdastatus   = 1
          AND vda.vdadata BETWEEN $2::timestamp AND $3::timestamp
          AND vda.vdausuariocanc IS NOT NULL

        UNION ALL

        -- 4. VENDAS SEM EMISSÃO FISCAL
        SELECT
          vdsf.vdsfcodigo::text,
          vdsf.vdsfdata,
          COALESCE(UPPER(TRIM(vdsf.vdsfusuario)), '—'),
          'FISCAL',
          'VENDA SEM FISCAL',
          'SAÍDA',
          NULL,
          TRIM(
            'Processo: ' || COALESCE(vdsf.vdsfprocesso, '—') ||
            CASE WHEN vdsf.vdsfobs IS NOT NULL AND vdsf.vdsfobs <> ''
                 THEN ' | Obs: ' || vdsf.vdsfobs ELSE '' END ||
            CASE WHEN vdsf.vdsfretorno IS NOT NULL AND vdsf.vdsfretorno <> ''
                 THEN ' | Retorno: ' || LEFT(vdsf.vdsfretorno, 120) ELSE '' END
          ),
          CASE WHEN vdsf.vdsfcodigovda > 0
               THEN 'Venda #' || vdsf.vdsfcodigovda::text ELSE '—' END,
          vdsf.vdsfterminal::text,
          'INCLUSÃO'
        FROM vdsf
        WHERE vdsf.vdsfempresa = $1
          AND vdsf.vdsfdata BETWEEN $2::timestamp AND $3::timestamp

      )
      SELECT
        e.*,
        TO_CHAR(e.data_hora AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo',
                'DD/MM/YYYY HH24:MI:SS')               AS data_hora_fmt,
        COUNT(*) OVER()                                 AS total_count
      FROM eventos e
      WHERE
        ($4::text IS NULL OR UPPER(e.usuario)   ILIKE '%' || $4 || '%')
        AND ($5::text IS NULL OR e.modulo = $5)
        AND ($6::text IS NULL OR UPPER(e.operacao)  ILIKE '%' || $6 || '%')
        AND ($7::text IS NULL OR UPPER(e.tipo_acao) = $7)
        AND ($8::text IS NULL OR (
              UPPER(e.detalhe)    ILIKE '%' || UPPER($8) || '%'
           OR UPPER(e.usuario)   ILIKE '%' || UPPER($8) || '%'
           OR UPPER(e.operacao)  ILIKE '%' || UPPER($8) || '%'
           OR UPPER(e.referencia) ILIKE '%' || UPPER($8) || '%'
        ))
      ORDER BY e.data_hora DESC, e.id DESC
      LIMIT $9 OFFSET $10
    `;

    const filterParams = [...params, usuario, modulo, operacao, tipoAcao, search, limit, offset];
    const result = await query(unionSql, filterParams);

    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    // Stats query (per modulo/operacao summary for the period)
    const statsParams = [empresa, data_ini, data_fim];
    const statsSql = `
      WITH eventos AS (
        SELECT 'CAIXA' AS modulo,
          CASE suproperacao WHEN 'D' THEN 'SANGRIA' WHEN 'C' THEN 'SUPRIMENTO'
            WHEN 'P' THEN 'PAGAMENTO' WHEN 'M' THEN 'EMPRÉSTIMO'
            ELSE suproperacao END AS operacao,
          suprvalor AS valor
        FROM supr WHERE suprempresa=$1 AND suprdata BETWEEN $2::timestamp AND $3::timestamp
        UNION ALL
        SELECT 'VENDA', 'LIBERAÇÃO DE VENDA', vdmtvlr
        FROM vdmt WHERE vdmtempresa=$1 AND vdmtdata BETWEEN $2::timestamp AND $3::timestamp
        UNION ALL
        SELECT 'VENDA', 'CANCELAMENTO',
          (SELECT COALESCE(SUM(vdittotal),0) FROM vdit WHERE vditcodigovda=vda.vdacodigo AND vditempresa=vda.vdaempresa)
        FROM vda WHERE vdaempresa=$1 AND vdastatus=1 AND vdausuariocanc IS NOT NULL
          AND vdadata BETWEEN $2::timestamp AND $3::timestamp
        UNION ALL
        SELECT 'FISCAL', 'VENDA SEM FISCAL', NULL
        FROM vdsf WHERE vdsfempresa=$1 AND vdsfdata BETWEEN $2::timestamp AND $3::timestamp
      )
      SELECT modulo, operacao,
        COUNT(*) AS qtd,
        COALESCE(SUM(valor), 0) AS total_valor
      FROM eventos
      GROUP BY modulo, operacao
      ORDER BY modulo, qtd DESC
    `;

    const statsResult = await query(statsSql, statsParams);

    // Distinct users list
    const usersSql = `
      SELECT DISTINCT UPPER(TRIM(suprusuario)) AS usuario
      FROM supr WHERE suprempresa=$1 AND suprusuario IS NOT NULL AND TRIM(suprusuario) <> ''
      UNION
      SELECT DISTINCT UPPER(TRIM(vdmtusuario))
      FROM vdmt WHERE vdmtempresa=$1 AND vdmtusuario IS NOT NULL AND TRIM(vdmtusuario) <> ''
      UNION
      SELECT DISTINCT UPPER(TRIM(vdausuariocanc))
      FROM vda WHERE vdaempresa=$1 AND vdausuariocanc IS NOT NULL AND TRIM(vdausuariocanc) <> ''
      UNION
      SELECT DISTINCT UPPER(TRIM(vdsfusuario))
      FROM vdsf WHERE vdsfempresa=$1 AND vdsfusuario IS NOT NULL AND TRIM(vdsfusuario) <> ''
      ORDER BY 1
    `;
    const usersResult = await query(usersSql, [empresa]);

    res.json({
      items: result.rows.map(r => ({
        id:          r.id,
        dataHora:    r.data_hora,
        dataHoraFmt: r.data_hora_fmt,
        usuario:     r.usuario,
        modulo:      r.modulo,
        operacao:    r.operacao,
        direcao:     r.direcao,
        valor:       r.valor != null ? parseFloat(r.valor) : null,
        detalhe:     r.detalhe,
        referencia:  r.referencia,
        terminal:    r.terminal,
        tipoAcao:    r.tipo_acao,
      })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      stats:      statsResult.rows.map(r => ({
        modulo:      r.modulo,
        operacao:    r.operacao,
        qtd:         parseInt(r.qtd),
        totalValor:  parseFloat(r.total_valor),
      })),
      usuarios: usersResult.rows.map(r => r.usuario),
    });
  } catch (err) {
    console.error('Error /auditoria:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auditoria/alertas
router.get('/alertas', async (req, res) => {
  const empresa = EMPRESA_ID;
  const data_ini = parseDate(req.query.data_ini) + ' 00:00:00';
  const data_fim = parseDate(req.query.data_fim) + ' 23:59:59';
  const hora_inicio = toInt(req.query.hora_inicio, 6);
  const hora_fim    = toInt(req.query.hora_fim, 23);

  try {
    // 1. Operações fora do horário comercial (supr)
    const foraHorarioSql = `
      SELECT
        suprcodigo::text                  AS id,
        TO_CHAR(suprdata AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo',
                'DD/MM/YYYY HH24:MI:SS') AS data_hora_fmt,
        suprdata                          AS data_hora,
        COALESCE(UPPER(TRIM(suprusuario)), '—') AS usuario,
        CASE suproperacao
          WHEN 'D' THEN 'SANGRIA'   WHEN 'P' THEN 'PAGAMENTO'
          WHEN 'M' THEN 'EMPRÉSTIMO' WHEN 'C' THEN 'SUPRIMENTO'
          WHEN 'E' THEN 'OUTRA ENTRADA' WHEN 'S' THEN 'OUTRA SAÍDA'
          ELSE COALESCE(suproperacao, '—') END AS operacao,
        suprvalor                         AS valor,
        suprcaixa::text                   AS caixa,
        EXTRACT(HOUR FROM suprdata AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::int AS hora
      FROM supr
      WHERE suprempresa = $1
        AND suprdata BETWEEN $2::timestamp AND $3::timestamp
        AND (
          EXTRACT(HOUR FROM suprdata AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') < $4
          OR EXTRACT(HOUR FROM suprdata AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') >= $5
        )
      ORDER BY suprdata DESC
    `;
    const foraRes = await query(foraHorarioSql, [empresa, data_ini, data_fim, hora_inicio, hora_fim]);

    // 2. Liberações de alto valor (vdmt)
    const liberacoesAltoValorSql = `
      SELECT
        vdmtcodigo::text AS id,
        TO_CHAR(vdmtdata AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo',
                'DD/MM/YYYY HH24:MI:SS') AS data_hora_fmt,
        vdmtdata AS data_hora,
        COALESCE(UPPER(TRIM(vdmtusuario)), '—') AS usuario,
        vdmtvlr  AS valor,
        COALESCE(vdmtmotivo, '—') AS motivo,
        vdmtcaixa::text AS caixa,
        CASE WHEN vdmtcodigovda > 0 THEN 'Venda #' || vdmtcodigovda::text ELSE '—' END AS referencia
      FROM vdmt
      WHERE vdmtempresa = $1
        AND vdmtdata BETWEEN $2::timestamp AND $3::timestamp
        AND vdmtvlr > $4
      ORDER BY vdmtvlr DESC
    `;
    const limiteLib = parseFloat(req.query.limite_liberacao || 500);
    const libRes = await query(liberacoesAltoValorSql, [empresa, data_ini, data_fim, limiteLib]);

    // 3. Ranking de cancelamentos por usuário
    const cancelRankSql = `
      SELECT
        COALESCE(UPPER(TRIM(vdausuariocanc)), '—') AS usuario,
        COUNT(*) AS qtd,
        COALESCE(SUM(
          (SELECT COALESCE(SUM(vdittotal),0) FROM vdit
           WHERE vditcodigovda = vda.vdacodigo AND vditempresa = vda.vdaempresa)
        ), 0) AS total_valor
      FROM vda
      WHERE vdaempresa = $1
        AND vdastatus = 1
        AND vdausuariocanc IS NOT NULL
        AND vdadata BETWEEN $2::timestamp AND $3::timestamp
      GROUP BY UPPER(TRIM(vdausuariocanc))
      ORDER BY qtd DESC
    `;
    const cancelRes = await query(cancelRankSql, [empresa, data_ini, data_fim]);

    // 4. Liberações por usuário (quem mais libera?)
    const libRankSql = `
      SELECT
        COALESCE(UPPER(TRIM(vdmtusuario)), '—') AS usuario,
        COUNT(*) AS qtd,
        COALESCE(SUM(vdmtvlr), 0) AS total_valor,
        MAX(vdmtvlr) AS maior_valor
      FROM vdmt
      WHERE vdmtempresa = $1
        AND vdmtdata BETWEEN $2::timestamp AND $3::timestamp
      GROUP BY UPPER(TRIM(vdmtusuario))
      ORDER BY qtd DESC
    `;
    const libRankRes = await query(libRankSql, [empresa, data_ini, data_fim]);

    // 5. Contas a receber com desconto relevante
    const recjDescontoSql = `
      SELECT
        recjcodigo::text AS id,
        recjdocumento AS documento,
        recjoriginal  AS valor_original,
        recjvalor     AS valor_atual,
        recjdesconto  AS desconto,
        ROUND((recjdesconto / NULLIF(recjoriginal, 0) * 100)::numeric, 2) AS pct_desconto,
        TO_CHAR(recjemissao,   'DD/MM/YYYY') AS emissao,
        TO_CHAR(recjfechamento,'DD/MM/YYYY') AS fechamento
      FROM recj
      WHERE recjempresa = $1
        AND recjdesconto > $2
        AND recjfechamento BETWEEN $3::date AND $4::date
      ORDER BY recjdesconto DESC
      LIMIT 50
    `;
    const limiteDesc = parseFloat(req.query.limite_desconto || 100);
    const recjRes = await query(recjDescontoSql, [empresa, limiteDesc, data_ini, data_fim]);

    res.json({
      fora_horario:        foraRes.rows.map(r => ({
        id: r.id, dataHoraFmt: r.data_hora_fmt, dataHora: r.data_hora,
        usuario: r.usuario, operacao: r.operacao,
        valor: r.valor != null ? parseFloat(r.valor) : null,
        caixa: r.caixa, hora: r.hora,
      })),
      liberacoes_altas:    libRes.rows.map(r => ({
        id: r.id, dataHoraFmt: r.data_hora_fmt, dataHora: r.data_hora,
        usuario: r.usuario, valor: parseFloat(r.valor),
        motivo: r.motivo, caixa: r.caixa, referencia: r.referencia,
      })),
      cancelamentos_ranking: cancelRes.rows.map(r => ({
        usuario: r.usuario, qtd: parseInt(r.qtd), totalValor: parseFloat(r.total_valor),
      })),
      liberacoes_ranking:  libRankRes.rows.map(r => ({
        usuario: r.usuario, qtd: parseInt(r.qtd),
        totalValor: parseFloat(r.total_valor), maiorValor: parseFloat(r.maior_valor),
      })),
      recj_descontos:      recjRes.rows.map(r => ({
        id: r.id, documento: r.documento,
        valorOriginal: parseFloat(r.valor_original),
        valorAtual: parseFloat(r.valor_atual),
        desconto: parseFloat(r.desconto),
        pctDesconto: parseFloat(r.pct_desconto),
        emissao: r.emissao, fechamento: r.fechamento,
      })),
      config: { horaInicio: hora_inicio, horaFim: hora_fim, limiteLib, limiteDesc },
    });
  } catch (err) {
    console.error('Error /auditoria/alertas:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
