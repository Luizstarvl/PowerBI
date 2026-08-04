/**
 * jobs/cacheVerification.js
 * Job noturno: re-executa consultas de períodos passados para verificar
 * se os dados em cache ainda batem com o banco do cliente.
 *
 * Roda automaticamente às 03:00 todos os dias.
 * Também pode ser disparado manualmente via POST /api/cache/verify.
 */
const pool = require('../db/pool');
const { Client } = require('pg');

const BATCH_SIZE   = 30;   // quantas entradas verificar por rodada
const VERIFY_HOURS = 24;   // só re-verifica se faz mais de X horas desde a última

// ── Execução segura (reutiliza lógica de queries.js sem importar o módulo todo) ─
async function safeQuery(sql, values, bancoId) {
  const { rows } = await pool.query(
    'SELECT sc_servidor, sc_porta, sc_banco, sc_usuario, sc_senha FROM starvl_connections WHERE sc_id = $1',
    [bancoId]
  );
  if (!rows.length) throw new Error(`Conexão ${bancoId} não encontrada.`);
  const c = rows[0];

  const client = new Client({
    host:                    c.sc_servidor,
    port:                    c.sc_porta,
    database:                c.sc_banco,
    user:                    c.sc_usuario || undefined,
    password:                c.sc_senha   || undefined,
    connectionTimeoutMillis: 20000,
    statement_timeout:       20000,
    ssl:                     { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query('BEGIN TRANSACTION READ ONLY');
    const result = await client.query(sql, values.length ? values : undefined);
    await client.query('COMMIT');
    return result.rows;
  } finally {
    try { await client.end(); } catch {}
  }
}

// ── Substitui {{PARAM}} → $N (cópia simplificada de applyParams) ────────────
function applyParams(sql, params = {}) {
  let result = sql;
  const values   = [];
  const indexMap = {};
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), () => {
      if (indexMap[key] !== undefined) return `$${indexMap[key]}`;
      values.push(value);
      indexMap[key] = values.length;
      return `$${values.length}`;
    });
  }
  return { sql: result, values };
}

// ── Verificação principal ─────────────────────────────────────────────────────
async function runVerification() {
  const { rows: entries } = await pool.query(`
    SELECT c.id, c.cache_key, c.sq_codigo, c.sq_banco_id, c.params_json,
           c.resultado, c.sq_versao
    FROM starvl_cache_resultados c
    WHERE c.is_periodo_atual = false
      AND (c.verificado_em IS NULL
           OR c.verificado_em < NOW() - INTERVAL '${VERIFY_HOURS} hours')
    ORDER BY c.verificado_em ASC NULLS FIRST
    LIMIT $1
  `, [BATCH_SIZE]);

  if (!entries.length) {
    console.log('[cache/verify] Nada para verificar.');
    return;
  }

  console.log(`[cache/verify] Verificando ${entries.length} entradas...`);
  let atualizados = 0;

  for (const entry of entries) {
    try {
      const { rows: qRows } = await pool.query(
        'SELECT sq_sql, sq_banco_id, sq_versao FROM starvl_queries WHERE UPPER(sq_codigo) = UPPER($1)',
        [entry.sq_codigo]
      );
      if (!qRows.length) continue;
      const q = qRows[0];

      const params = entry.params_json || {};
      const { sql, values } = applyParams(q.sq_sql, params);
      const novasLinhas = await safeQuery(sql, values, q.sq_banco_id);

      // Compara resultado atual vs cache
      const cacheLinhas  = entry.resultado?.rows || [];
      const igual = JSON.stringify(novasLinhas) === JSON.stringify(cacheLinhas);

      if (!igual) {
        // Atualiza o cache com os dados novos
        const cols = novasLinhas.length ? Object.keys(novasLinhas[0]) : [];
        await pool.query(`
          UPDATE starvl_cache_resultados
          SET resultado     = $1,
              sq_versao     = $2,
              atualizado_em = NOW(),
              verificado_em = NOW()
          WHERE id = $3
        `, [
          JSON.stringify({ columns: cols, rows: novasLinhas, rowCount: novasLinhas.length }),
          q.sq_versao,
          entry.id,
        ]);
        atualizados++;
        console.log(`[cache/verify] Atualizado: ${entry.sq_codigo} (${entry.params_json?.empresa || '?'} / ${entry.params_json?.periodo || '?'})`);
      } else {
        // Marca como verificado sem alterar
        await pool.query(
          'UPDATE starvl_cache_resultados SET verificado_em = NOW() WHERE id = $1',
          [entry.id]
        );
      }
    } catch (err) {
      console.error(`[cache/verify] Erro em ${entry.sq_codigo}:`, err.message);
      // Marca verificado mesmo com erro pra não ficar re-tentando infinitamente
      await pool.query(
        'UPDATE starvl_cache_resultados SET verificado_em = NOW() WHERE id = $1',
        [entry.id]
      ).catch(() => {});
    }
  }

  console.log(`[cache/verify] Concluído. ${atualizados} de ${entries.length} entradas atualizadas.`);
}

// ── Agendamento às 03:00 ──────────────────────────────────────────────────────
function scheduleNightlyJob() {
  function msUntil3am() {
    const now    = new Date();
    const target = new Date(now);
    target.setHours(3, 0, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target - now;
  }

  function scheduleNext() {
    const ms = msUntil3am();
    console.log(`[cache/verify] Próxima verificação noturna em ${Math.round(ms / 3600000)}h.`);
    setTimeout(async () => {
      try { await runVerification(); } catch (e) { console.error('[cache/verify]', e.message); }
      scheduleNext();
    }, ms);
  }

  scheduleNext();
}

module.exports = { runVerification, scheduleNightlyJob };
