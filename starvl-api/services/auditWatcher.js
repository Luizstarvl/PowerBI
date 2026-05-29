const pool  = require('../db/pool');
const { safeQuery } = require('../middleware/readonly');
const store = require('./auditStore');

const query       = safeQuery(pool);
const EMPRESA_ID  = 7432;
const INTERVAL_MS = 2 * 60 * 1000; // 2 minutos

const SUPR_OPERACAO = {
  D: 'SANGRIA', P: 'PAGAMENTO', M: 'EMPRÉSTIMO', C: 'SUPRIMENTO',
  E: 'OUTRA ENTRADA', S: 'OUTRA SAÍDA', Q: 'BAIXA CHEQUE',
  G: 'RESGATE PONTOS', H: 'ESTORNO CHEQUE',
};

const FIELD_LABEL = {
  suprvalor: 'Valor', suprhistorico: 'Histórico', suproperacao: 'Operação',
  suprcaixa: 'Caixa', suprplaca: 'Placa', suprusuario: 'Usuário',
};

const WATCH_FIELDS = Object.keys(FIELD_LABEL);

async function runCycle() {
  try {
    const result = await query(`
      SELECT
        suprcodigo::text                         AS id,
        suprempresa::text                        AS suprempresa,
        suprdata::text                           AS suprdata,
        COALESCE(UPPER(TRIM(suprusuario)), '')   AS suprusuario,
        suproperacao,
        ROUND(suprvalor::numeric, 2)::text       AS suprvalor,
        COALESCE(suprhistorico, '')              AS suprhistorico,
        COALESCE(suprcaixa::text, '')            AS suprcaixa,
        COALESCE(suprplaca, '')                  AS suprplaca
      FROM supr
      WHERE suprempresa = $1
        AND suprdata >= NOW() - INTERVAL '60 days'
    `, [EMPRESA_ID]);

    const currentMap = {};
    for (const r of result.rows) currentMap[r.id] = r;

    const prevSnap  = store.getSnapshot();
    const isFirst   = Object.keys(prevSnap).length === 0;

    if (isFirst) {
      console.log(`[AuditWatcher] Snapshot inicial: ${result.rows.length} registros`);
      store.setSnapshot(currentMap);
      store.persist();
      return;
    }

    const events = [];

    // ── EXCLUSÕES: estava no snapshot, sumiu do banco ────────────────────────
    for (const [id, snap] of Object.entries(prevSnap)) {
      if (currentMap[id]) continue;
      const opName = SUPR_OPERACAO[snap.suproperacao] || snap.suproperacao || 'OPERAÇÃO';
      events.push({
        empresa:            EMPRESA_ID,
        registro_id:        id,
        tipo_acao:          'EXCLUSÃO',
        usuario:            snap.suprusuario || null,
        modulo:             'CAIXA',
        operacao:           opName,
        data_hora_registro: snap.suprdata,
        valor_antes:        snap.suprvalor != null ? parseFloat(snap.suprvalor) : null,
        valor_depois:       null,
        dados_antes:        snap,
        dados_depois:       null,
        descricao: `Excluído: ${opName} R$ ${snap.suprvalor || '—'} | Caixa: ${snap.suprcaixa || '—'} | Usuário: ${snap.suprusuario || '—'}`,
      });
    }

    // ── ALTERAÇÕES: está em ambos mas campos mudaram ─────────────────────────
    for (const [id, curr] of Object.entries(currentMap)) {
      const snap = prevSnap[id];
      if (!snap) continue;

      const changed = WATCH_FIELDS.filter(
        f => String(snap[f] ?? '') !== String(curr[f] ?? '')
      );
      if (changed.length === 0) continue;

      const opName = SUPR_OPERACAO[curr.suproperacao] || curr.suproperacao || 'OPERAÇÃO';
      const detail = changed
        .map(f => `${FIELD_LABEL[f]}: ${snap[f] || '—'} → ${curr[f] || '—'}`)
        .join(' | ');

      events.push({
        empresa:            EMPRESA_ID,
        registro_id:        id,
        tipo_acao:          'ALTERAÇÃO',
        usuario:            curr.suprusuario || snap.suprusuario || null,
        modulo:             'CAIXA',
        operacao:           opName,
        data_hora_registro: curr.suprdata,
        valor_antes:        snap.suprvalor != null ? parseFloat(snap.suprvalor) : null,
        valor_depois:       curr.suprvalor != null ? parseFloat(curr.suprvalor) : null,
        dados_antes:        snap,
        dados_depois:       curr,
        campos_alterados:   changed,
        descricao:          `Alterado: ${opName} | ${detail}`,
      });
    }

    store.setSnapshot(currentMap);
    for (const ev of events) store.addEvent(ev);
    store.persist();

    if (events.length > 0) {
      const summary = events.map(e => `${e.tipo_acao}(#${e.registro_id})`).join(', ');
      console.log(`[AuditWatcher] ${events.length} evento(s): ${summary}`);
    }
  } catch (err) {
    console.error('[AuditWatcher] Erro no ciclo:', err.message);
  }
}

function start() {
  store.load();
  console.log(`[AuditWatcher] Iniciado — poll a cada ${INTERVAL_MS / 1000}s`);
  runCycle();
  setInterval(runCycle, INTERVAL_MS);
}

module.exports = { start };
