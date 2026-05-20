const API   = '/api';
const CORES = ['#22C55E','#16A34A','#F59E0B','#0F172A','#EF4444','#7C3AED'];
const TK    = 'lmc_token';
const UK    = 'lmc_user';
const RK    = 'lmc_role';

let charts = {};

// ─── Chart.js global tooltip polish ────────────────────────────────────────
(function _chartDefaults() {
  if (typeof Chart === 'undefined') return;
  Object.assign(Chart.defaults.plugins.tooltip, {
    backgroundColor: 'rgba(15,23,42,0.97)',
    titleColor: '#F1F5F9',
    bodyColor: '#94A3B8',
    borderColor: 'rgba(34,197,94,0.28)',
    borderWidth: 1,
    padding: 12,
    cornerRadius: 8,
    boxWidth: 8,
    boxHeight: 8,
    boxPadding: 5,
    titleFont: { size: 12, weight: '600' },
    bodyFont: { size: 12 },
  });
})();

let state = {
  clienteId: '', periodo: '',
  lmcData: [], encData: [], histData: [],
  folhasData: [], semNotaData: [], comNotaData: [], consolidadoData: [],
  descData: { com_nota: [], sem_nota: [] }
};

// ─── Utilitários ─────────────────────────────────────────────────────────────
function debounce(fn, ms = 250) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function skeletonRows(cols, rows = 5) {
  const widths = [80, 55, 70, 45, 65];
  return Array.from({ length: rows }, (_, i) =>
    `<tr class="skeleton-row">${Array.from({ length: cols }, (_, j) =>
      `<td><span class="skeleton-line" style="width:${widths[(i+j) % widths.length]}%"></span></td>`
    ).join('')}</tr>`
  ).join('');
}

// Cache para abas carregadas sob demanda (invalida ao mudar cliente/período)
const _tabCache = {};
function _clearTabCache() { Object.keys(_tabCache).forEach(k => delete _tabCache[k]); }

// ─── Paginação reutilizável ───────────────────────────────────────────────────
const _pgState = {}; // { [tableId]: { page, pageSize } }

function paginate(rows, tableId, renderRow, emptyHtml, tbodyId, pgContainerId) {
  const state = _pgState[tableId] || { page: 0, pageSize: 50 };
  _pgState[tableId] = state;
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  state.page = Math.min(state.page, pages - 1);
  const slice = rows.slice(state.page * state.pageSize, (state.page + 1) * state.pageSize);

  document.getElementById(tbodyId).innerHTML =
    slice.length ? slice.map(renderRow).join('') : emptyHtml;

  const pg = document.getElementById(pgContainerId);
  if (!pg) return;
  if (total <= state.pageSize) { pg.innerHTML = ''; return; }

  const maxBtns = 5;
  const half = Math.floor(maxBtns / 2);
  let start = Math.max(0, state.page - half);
  let end   = Math.min(pages - 1, start + maxBtns - 1);
  if (end - start < maxBtns - 1) start = Math.max(0, end - maxBtns + 1);

  let btns = `<button class="pg-btn" ${state.page===0?'disabled':''} onclick="_pgGo('${tableId}',-1,${total})">‹</button>`;
  for (let i = start; i <= end; i++)
    btns += `<button class="pg-btn ${i===state.page?'active':''}" onclick="_pgSet('${tableId}',${i},${total})">${i+1}</button>`;
  btns += `<button class="pg-btn" ${state.page>=pages-1?'disabled':''} onclick="_pgGo('${tableId}',1,${total})">›</button>`;
  btns += `<span class="pg-info">${total} registros</span>`;
  btns += `<select class="pg-size" onchange="_pgSize('${tableId}',this.value,${total})">
    ${[25,50,100,200].map(n=>`<option value="${n}" ${n===state.pageSize?'selected':''}>${n}/pág</option>`).join('')}
  </select>`;
  pg.innerHTML = `<div class="pagination">${btns}</div>`;
}

function _pgGo(id, dir, total) {
  _pgState[id] = _pgState[id] || { page:0, pageSize:50 };
  _pgState[id].page += dir;
  document.getElementById(id+'_pg_trigger')?.click();
}
function _pgSet(id, page) {
  _pgState[id] = _pgState[id] || { page:0, pageSize:50 };
  _pgState[id].page = page;
  document.getElementById(id+'_pg_trigger')?.click();
}
function _pgSize(id, size) {
  _pgState[id] = _pgState[id] || { page:0, pageSize:50 };
  _pgState[id].pageSize = Number(size);
  _pgState[id].page = 0;
  document.getElementById(id+'_pg_trigger')?.click();
}

const fmt  = (n, d=0) => Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const fmtR = (n)      => 'R$ '+Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtN = (n, d=0) => Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const killChart = id  => { if(charts[id]){ charts[id].destroy(); delete charts[id]; }};
const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
const normalizeFuel = (v) => String(v ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase();
const alphaHex = (hex, alpha) => `${hex}${alpha}`;

function getFuelColor(nome, idx=0) {
  const fuel = normalizeFuel(nome);

  if (fuel.includes('GASOLINA') && fuel.includes('ADIT')) return '#1F8A4D';
  if (fuel.includes('GASOLINA') && fuel.includes('PREMIUM')) return '#C98A00';
  if (fuel.includes('GASOLINA') && fuel.includes('COMUM')) return '#E0B100';
  if (fuel.includes('GASOLINA')) return '#D9A404';

  if (fuel.includes('ETANOL')) return '#D9EAF4';
  if (fuel.includes('ALCOOL')) return '#D9EAF4';

  if (fuel.includes('DIESEL') && fuel.includes('S500') && fuel.includes('ADIT')) return '#2F2F2F';
  if (fuel.includes('DIESEL') && fuel.includes('S500')) return '#C0392B';
  if (fuel.includes('DIESEL') && fuel.includes('S10') && fuel.includes('ADIT')) return '#7A7F87';
  if (fuel.includes('DIESEL') && fuel.includes('S10')) return '#6E9F3A';
  if (fuel.includes('DIESEL')) return '#8A6A3A';

  return CORES[idx % CORES.length];
}

function parsePeriodo(periodo) {
  const [mes, ano] = String(periodo || '').split('/');
  return { mes: Number(mes), ano: Number(ano) };
}

function periodoLabelLongo(periodo) {
  const { mes, ano } = parsePeriodo(periodo);
  if (!mes || !ano) return periodo || 'Período';
  return new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function variationLabel(curr, prev, suffix='') {
  if (!prev) return 'Sem base comparativa';
  const diff = curr - prev;
  const pct = prev !== 0 ? (diff / prev) * 100 : 0;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${fmt(diff,1)}${suffix} · ${sign}${fmt(pct,1)}% vs. mês anterior`;
}

function getComparativoPeriodo() {
  const atual = state.periodo;
  const rowsAtual = state.histData.filter(r => r.mes === atual);
  if (!rowsAtual.length) return null;

  const periodosOrdenados = [...new Set(state.histData.map(r => r.mes))]
    .sort((a,b) => {
      const pa = parsePeriodo(a), pb = parsePeriodo(b);
      return (pa.ano - pb.ano) || (pa.mes - pb.mes);
    });

  const idxAtual = periodosOrdenados.indexOf(atual);
  const anterior = idxAtual > 0 ? periodosOrdenados[idxAtual - 1] : null;
  const rowsAnterior = anterior ? state.histData.filter(r => r.mes === anterior) : [];

  const sum = (rows, key) => rows.reduce((s, r) => s + Number(r[key] || 0), 0);
  const atualVol = sum(rowsAtual, 'volume_vendido');
  const atualLiq = sum(rowsAtual, 'valor_liquido');
  const atualVendaTotal = rowsAtual.reduce((s,r)=>s + Number(r.preco_medio || 0) * Number(r.volume_vendido || 0), 0);
  const atualTicket = atualVol > 0 ? atualVendaTotal / atualVol : 0;
  const atualMargemLitro = atualVol > 0 ? atualLiq / atualVol : 0;

  const prevVol = sum(rowsAnterior, 'volume_vendido');
  const prevLiq = sum(rowsAnterior, 'valor_liquido');
  const prevVendaTotal = rowsAnterior.reduce((s,r)=>s + Number(r.preco_medio || 0) * Number(r.volume_vendido || 0), 0);
  const prevTicket = prevVol > 0 ? prevVendaTotal / prevVol : 0;
  const prevMargemLitro = prevVol > 0 ? prevLiq / prevVol : 0;

  return {
    atual,
    anterior,
    atualVol,
    atualLiq,
    atualTicket,
    atualMargemLitro,
    prevVol,
    prevLiq,
    prevTicket,
    prevMargemLitro
  };
}

function buildAlerts() {
  const alerts = [];
  const comparativo = getComparativoPeriodo();

  if (comparativo && comparativo.prevLiq > 0 && comparativo.atualLiq < comparativo.prevLiq * 0.85) {
    alerts.push({
      level: 'high',
      title: 'Queda relevante no resultado líquido',
      text: `${fmtR(comparativo.atualLiq)} no período atual, abaixo de ${fmtR(comparativo.prevLiq)} no mês anterior.`
    });
  }

  const maiorRem = [...state.encData].sort((a,b)=>Math.abs(Number(b.remanescente)) - Math.abs(Number(a.remanescente)))[0];
  if (maiorRem && Math.abs(Number(maiorRem.remanescente)) >= 1000) {
    alerts.push({
      level: 'high',
      title: 'Remanescente elevado em encerrantes',
      text: `${esc(maiorRem.combustivel)} no bico ${esc(maiorRem.bicodisplay || maiorRem.bicocodigo)} com ${fmt(maiorRem.remanescente,2)} L de remanescente.`
    });
  }

  const aferTotal = state.lmcData.reduce((s,r)=>s+Number(r.afericos || 0),0);
  const vendaTotal = state.lmcData.reduce((s,r)=>s+Number(r.vendas || 0),0);
  if (vendaTotal > 0 && (aferTotal / vendaTotal) > 0.025) {
    alerts.push({
      level: 'med',
      title: 'Aferições acima do nível esperado',
      text: `${fmt(aferTotal,1)} L em aferições, equivalente a ${fmt((aferTotal / vendaTotal) * 100,2)}% do volume vendido.`
    });
  }

  const topPerda = [...state.lmcData]
    .map(r => ({ nome: r.combustivel, margem: Number(r.valor_liquido || 0), volume: Number(r.vendas || 0) }))
    .filter(r => r.volume > 0)
    .sort((a,b)=>a.margem - b.margem)[0];
  if (topPerda && topPerda.margem < 0) {
    alerts.push({
      level: 'med',
      title: 'Combustível com margem negativa',
      text: `${esc(topPerda.nome)} fechou o período com ${fmtR(topPerda.margem)} de resultado estimado.`
    });
  }

  const semNotaVol = state.consolidadoData.reduce((s,r)=>s+Number(r.vol_sem_nota || 0),0);
  const totalPdv = state.consolidadoData.reduce((s,r)=>s+Number(r.vol_total || 0),0);
  if (totalPdv > 0 && (semNotaVol / totalPdv) > 0.3) {
    alerts.push({
      level: 'low',
      title: 'Participação alta de vendas sem nota',
      text: `${fmt((semNotaVol / totalPdv) * 100,1)}% do volume registrado no PDV veio de operações classificadas como sem nota.`
    });
  }

  if (!alerts.length) {
    alerts.push({
      level: 'low',
      title: 'Operação estável no período',
      text: 'Nenhuma anomalia forte foi identificada nas regras automáticas desta versão do BI.'
    });
  }

  return alerts.slice(0, 4);
}

// ─── Notificações / Alertas Configuráveis ────────────────────────────────────
const ALERTS_KEY = 'fuelflow_alert_cfg';

function getAlertCfg() {
  try { return JSON.parse(localStorage.getItem(ALERTS_KEY) || '{}'); } catch { return {}; }
}
function saveAlertCfg(cfg) { localStorage.setItem(ALERTS_KEY, JSON.stringify(cfg)); }

function checkAutoAlerts() {
  const cfg = getAlertCfg();
  const alerts = [];
  const d = state.lmcData;
  if (!d.length) return;

  const totVend = d.reduce((s,r)=>s+Number(r.vendas||0),0);
  const totLiq  = d.reduce((s,r)=>s+Number(r.valor_liquido||0),0);
  const totFech = d.reduce((s,r)=>s+Number(r.fechamento||0),0);

  if (cfg.minVolume && totVend < Number(cfg.minVolume))
    alerts.push(`Volume vendido (${fmt(totVend,0)} L) abaixo do mínimo configurado (${fmt(cfg.minVolume,0)} L)`);
  if (cfg.minResultado && totLiq < Number(cfg.minResultado))
    alerts.push(`Resultado líquido (${fmtR(totLiq)}) abaixo do mínimo (${fmtR(cfg.minResultado)})`);
  if (cfg.minEstoque && totFech < Number(cfg.minEstoque))
    alerts.push(`Estoque físico (${fmt(totFech,0)} L) abaixo do mínimo (${fmt(cfg.minEstoque,0)} L)`);

  // Alertas de margem negativa por combustível
  if (cfg.alertMargemNeg !== false) {
    d.filter(r=>Number(r.valor_liquido||0)<0).forEach(r =>
      alerts.push(`Margem negativa: ${r.combustivel.split(' ').slice(0,2).join(' ')} (${fmtR(r.valor_liquido)})`)
    );
  }

  alerts.forEach(msg => {
    setTimeout(() => toast(`⚠️ ${msg}`, 5000), 500);
  });
}

function openAlertCfgModal() {
  const cfg = getAlertCfg();
  const overlay = document.createElement('div');
  overlay.id = 'alertCfgOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2000;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:28px;width:380px;max-width:90vw">
    <div style="font-size:16px;font-weight:700;margin-bottom:16px">Configurar Alertas Automáticos</div>
    <label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase">Volume mínimo aceitável (L)</label>
    <input id="alcMinVol" type="number" value="${cfg.minVolume||''}" placeholder="ex: 100000"
      style="width:100%;box-sizing:border-box;margin:6px 0 14px;padding:8px 10px;border:1px solid var(--border-md);border-radius:6px;background:var(--bg);color:var(--text);font-size:13px"/>
    <label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase">Resultado mínimo aceitável (R$)</label>
    <input id="alcMinLiq" type="number" value="${cfg.minResultado||''}" placeholder="ex: 15000"
      style="width:100%;box-sizing:border-box;margin:6px 0 14px;padding:8px 10px;border:1px solid var(--border-md);border-radius:6px;background:var(--bg);color:var(--text);font-size:13px"/>
    <label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase">Estoque mínimo (L)</label>
    <input id="alcMinEst" type="number" value="${cfg.minEstoque||''}" placeholder="ex: 5000"
      style="width:100%;box-sizing:border-box;margin:6px 0 14px;padding:8px 10px;border:1px solid var(--border-md);border-radius:6px;background:var(--bg);color:var(--text);font-size:13px"/>
    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;margin-bottom:20px">
      <input type="checkbox" id="alcMargemNeg" ${cfg.alertMargemNeg!==false?'checked':''}/>
      Alertar quando combustível tiver margem negativa
    </label>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button onclick="document.getElementById('alertCfgOverlay').remove()" class="pg-btn">Cancelar</button>
      <button onclick="_saveAlertCfg()" style="background:var(--accent);color:#fff;border:none;padding:7px 18px;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600">Salvar</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target===overlay) overlay.remove(); });
}

function _saveAlertCfg() {
  saveAlertCfg({
    minVolume:   Number(document.getElementById('alcMinVol')?.value)||0,
    minResultado:Number(document.getElementById('alcMinLiq')?.value)||0,
    minEstoque:  Number(document.getElementById('alcMinEst')?.value)||0,
    alertMargemNeg: document.getElementById('alcMargemNeg')?.checked !== false,
  });
  document.getElementById('alertCfgOverlay')?.remove();
  toast('Configurações de alertas salvas!');
}

// ─── Metas Mensais ────────────────────────────────────────────────────────────
const METAS_KEY = 'fuelflow_metas';

function getMetas() {
  try { return JSON.parse(localStorage.getItem(METAS_KEY) || '{}'); } catch { return {}; }
}
function saveMeta(clienteId, periodo, key, value) {
  const m = getMetas();
  if (!m[clienteId]) m[clienteId] = {};
  if (!m[clienteId][periodo]) m[clienteId][periodo] = {};
  m[clienteId][periodo][key] = Number(value);
  localStorage.setItem(METAS_KEY, JSON.stringify(m));
}
function getMetaVal(clienteId, periodo, key) {
  const m = getMetas();
  return m?.[clienteId]?.[periodo]?.[key] || 0;
}

function renderMetaProgress(atual, meta, label) {
  if (!meta) return '';
  const pct = Math.min(100, Math.round((atual / meta) * 100));
  const cor = pct >= 100 ? 'var(--green)' : pct >= 75 ? 'var(--amber)' : 'var(--red)';
  return `<div class="meta-progress-wrap">
    <div class="meta-bar"><div class="meta-bar-fill" style="width:${pct}%;background:${cor}"></div></div>
    <div class="meta-pct">${pct}% da meta de ${label}</div>
  </div>`;
}

function openMetasModal() {
  const cId  = state.clienteId;
  const per  = state.periodo;
  if (!cId || !per) return toast('Selecione cliente e período antes de definir metas.');
  const mVol = getMetaVal(cId, per, 'volume');
  const mLiq = getMetaVal(cId, per, 'resultado');
  const overlay = document.createElement('div');
  overlay.id = 'metasOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2000;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:28px;width:360px;max-width:90vw">
    <div style="font-size:16px;font-weight:700;margin-bottom:4px">Metas do período</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:20px">${per} — ${document.getElementById('selCliente').selectedOptions[0]?.textContent||''}</div>
    <label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase">Meta de Volume (L)</label>
    <input id="metaVolInput" type="number" value="${mVol||''}" placeholder="ex: 150000"
      style="width:100%;box-sizing:border-box;margin:6px 0 14px;padding:8px 10px;border:1px solid var(--border-md);border-radius:6px;background:var(--bg);color:var(--text);font-size:13px"/>
    <label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase">Meta de Resultado (R$)</label>
    <input id="metaLiqInput" type="number" value="${mLiq||''}" placeholder="ex: 25000"
      style="width:100%;box-sizing:border-box;margin:6px 0 20px;padding:8px 10px;border:1px solid var(--border-md);border-radius:6px;background:var(--bg);color:var(--text);font-size:13px"/>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button onclick="document.getElementById('metasOverlay').remove()" class="pg-btn">Cancelar</button>
      <button onclick="_saveMetas()" style="background:var(--accent);color:#fff;border:none;padding:7px 18px;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600">Salvar metas</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target===overlay) overlay.remove(); });
}

function _saveMetas() {
  const vol = document.getElementById('metaVolInput')?.value;
  const liq = document.getElementById('metaLiqInput')?.value;
  saveMeta(state.clienteId, state.periodo, 'volume', vol);
  saveMeta(state.clienteId, state.periodo, 'resultado', liq);
  document.getElementById('metasOverlay')?.remove();
  renderResumo();
  toast('Metas salvas!');
}

// ─── Busca Global ────────────────────────────────────────────────────────────
function onGlobalSearch(q) {
  const results = document.getElementById('gsResults');
  if (!results) return;
  q = (q || '').trim().toLowerCase();
  if (!q || q.length < 2) { results.style.display = 'none'; return; }

  const hits = [];

  // Busca em LMC (combustíveis)
  state.lmcData.forEach(r => {
    if (r.combustivel?.toLowerCase().includes(q))
      hits.push({ tab:'Resumo', label:`Combustível: ${r.combustivel}`, action:"showTab('resumo',document.querySelector('[onclick*=resumo]'))" });
  });

  // Busca em Folhas
  state.folhasData.filter(r =>
    r.combustivel?.toLowerCase().includes(q) || String(r.lmccodigo).includes(q)
  ).slice(0,3).forEach(r =>
    hits.push({ tab:'Folhas', label:`Folha ${r.lmccodigo} — ${r.combustivel}`, action:"showTab('folhas',document.querySelector('[onclick*=folhas]'))" })
  );

  // Busca em Pagamentos (pagos)
  const pagAll = [...(_pagData.pagos||[]), ...(_pagData.pendentes||[])];
  pagAll.filter(r =>
    r.fornecedor?.toLowerCase().includes(q) || r.documento?.toLowerCase().includes(q) || r.dre_conta?.toLowerCase().includes(q)
  ).slice(0,4).forEach(r =>
    hits.push({ tab:'Pagamentos', label:`${r.fornecedor} — ${r.documento||''}`, action:"showTab('pagamentos',document.querySelector('[onclick*=pagamentos]'))" })
  );

  // Busca em A Receber
  (_recData.pendentes||[]).filter(r =>
    r.cliente?.toLowerCase().includes(q) || r.documento?.toLowerCase().includes(q)
  ).slice(0,4).forEach(r =>
    hits.push({ tab:'A Receber', label:`${r.cliente||'—'} — ${r.documento||''}`, action:"showTab('receitas',document.querySelector('[onclick*=receitas]'))" })
  );

  // Busca em Produtos
  (_prodData||[]).filter(r =>
    r.descricao?.toLowerCase().includes(q) || r.codigo?.toLowerCase().includes(q)
  ).slice(0,3).forEach(r =>
    hits.push({ tab:'Produtos', label:`${r.descricao}`, action:"showTab('produtos',document.querySelector('[onclick*=produtos]'))" })
  );

  // Busca no Histórico
  const histMeses = [...new Set(state.histData.map(r=>r.mes))].filter(m=>m.includes(q.replace('/','')));
  histMeses.slice(0,2).forEach(m =>
    hits.push({ tab:'Histórico', label:`Período: ${m}`, action:"showTab('historico',document.querySelector('[onclick*=historico]'))" })
  );

  if (!hits.length) {
    results.innerHTML = `<div class="gsr-empty">Nenhum resultado para "${esc(q)}"</div>`;
  } else {
    results.innerHTML = hits.slice(0,10).map(h =>
      `<div class="gsr-item" onclick="${h.action};document.getElementById('gsResults').style.display='none'">
        <span class="gsr-tab">${h.tab}</span>
        <span class="gsr-text">${esc(h.label)}</span>
      </div>`
    ).join('');
  }
  results.style.display = '';
}

// Atalho Ctrl+K para abrir busca global
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const inp = document.getElementById('globalSearch');
    if (inp) { inp.focus(); inp.select(); }
  }
  if (e.key === 'Escape') {
    const r = document.getElementById('gsResults');
    if (r) r.style.display = 'none';
  }
});

let _histRange = 12; // padrão: últimos 12 meses

function setHistRange(n, btn) {
  _histRange = n; // 0 = todos
  document.querySelectorAll('[onclick*=setHistRange]').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderHistorico();
}

function showHistoricoTab() {
  const btn = document.querySelectorAll('.nav-tab')[7];
  if (btn) showTab('historico', btn);
}

function exportExecutivePdf() {
  showTab('resumo', document.querySelectorAll('.nav-tab')[0]);
  window.print();
}

function renderExecutiveDashboard() {
  const comparativo = getComparativoPeriodo();
  const periodoAtual = state.periodo || 'Período';
  const clienteNome = document.getElementById('selCliente').selectedOptions[0]?.textContent || 'Cliente';
  const totalVendido = state.lmcData.reduce((s,r)=>s+Number(r.vendas || 0),0);
  const totalComprado = state.lmcData.reduce((s,r)=>s+Number(r.compras || 0),0);
  const totalLiq = state.lmcData.reduce((s,r)=>s+Number(r.valor_liquido || 0),0);
  const totalAfer = state.lmcData.reduce((s,r)=>s+Number(r.afericos || 0),0);
  const topFuel = [...state.lmcData].sort((a,b)=>Number(b.vendas || 0) - Number(a.vendas || 0))[0];
  const heroKpis = [
    {
      label: 'Vendas no período',
      value: `${fmt(totalVendido,0)} L`,
      sub: comparativo ? variationLabel(comparativo.atualVol, comparativo.prevVol, ' L') : 'Sem histórico comparável'
    },
    {
      label: 'Resultado estimado',
      value: fmtR(totalLiq),
      sub: comparativo ? variationLabel(comparativo.atualLiq, comparativo.prevLiq) : 'Sem histórico comparável'
    },
    {
      label: 'Margem por litro',
      value: `${fmt(totalVendido > 0 ? totalLiq / totalVendido : 0, 2)}/L`,
      sub: comparativo ? variationLabel(comparativo.atualMargemLitro, comparativo.prevMargemLitro, '/L') : 'Leitura operacional do período'
    },
    {
      label: 'Combustível líder',
      value: esc(topFuel?.combustivel?.split(' ').slice(0,2).join(' ') || '—'),
      sub: topFuel ? `${fmt(topFuel.vendas,0)} L vendidos · ${fmtR(topFuel.valor_liquido)} de resultado` : 'Sem produto de destaque'
    }
  ];

  document.getElementById('heroTitle').textContent = `${clienteNome} · ${periodoLabelLongo(periodoAtual)}`;
  document.getElementById('heroSubtitle').textContent = `Panorama executivo consolidado do LMC com leitura comercial, operacional e fiscal para apresentação e tomada de decisão.`;
  document.getElementById('executivePeriodBadge').textContent = periodoAtual;
  // Sparkline data: last 8 periods of valor_liquido totals
  const sparkPeriods = [...new Set(state.histData.map(r=>r.mes))].sort((a,b)=>{
    const pa=parsePeriodo(a),pb=parsePeriodo(b); return (pa.ano-pb.ano)||(pa.mes-pb.mes);
  }).slice(-8);
  const sparkVol = sparkPeriods.map(m => state.histData.filter(r=>r.mes===m).reduce((s,r)=>s+Number(r.volume_vendido||0),0));
  const sparkLiq = sparkPeriods.map(m => state.histData.filter(r=>r.mes===m).reduce((s,r)=>s+Number(r.valor_liquido||0),0));

  document.getElementById('heroKpis').innerHTML = heroKpis.map((k,i) => `
    <div class="hero-kpi">
      <div class="hero-kpi-label">${k.label}</div>
      <div class="hero-kpi-value">${k.value}</div>
      <div class="hero-kpi-sub">${k.sub}</div>
      ${i < 2 ? `<div class="kpi-spark"><canvas id="sparkKpi${i}" height="36"></canvas></div>` : ''}
    </div>
  `).join('');

  // Render sparklines
  if (sparkPeriods.length > 1) {
    [[0, sparkVol, '#22C55E'], [1, sparkLiq, '#F59E0B']].forEach(([idx, data, color]) => {
      const el = document.getElementById(`sparkKpi${idx}`);
      if (!el) return;
      killChart(`sparkKpi${idx}`);
      charts[`sparkKpi${idx}`] = new Chart(el, {
        type: 'line',
        data: { labels: sparkPeriods, datasets: [{ data, borderColor: color,
          backgroundColor: color+'33', fill:true, tension:0.4,
          pointRadius:0, borderWidth:1.5 }] },
        options: { responsive:true, maintainAspectRatio:false, animation:false,
          plugins:{ legend:{display:false}, tooltip:{enabled:false} },
          scales:{ x:{display:false}, y:{display:false} } }
      });
    });
  }

  const stats = [
    {
      title: 'Captação do período',
      badge: `${fmt(totalComprado,0)} L`,
      value: `${fmt(totalComprado - totalVendido,0)} L`,
      meta: 'Diferença bruta entre compras registradas e volume vendido no PDV.'
    },
    {
      title: 'Aferições',
      badge: `${fmt((totalVendido > 0 ? (totalAfer / totalVendido) * 100 : 0),2)}%`,
      value: `${fmt(totalAfer,1)} L`,
      meta: 'Volume total destinado a aferições no período selecionado.'
    },
    {
      title: 'Mix mais forte',
      badge: topFuel ? topFuel.combustivel.split(' ')[0] : '—',
      value: topFuel ? `${fmt(topFuel.vendas,0)} L` : '—',
      meta: topFuel ? `Maior participação no volume vendido com ${fmtR(topFuel.valor_liquido)} de resultado estimado.` : 'Sem destaque de mix.'
    }
  ];
  document.getElementById('executiveStats').innerHTML = stats.map(s => `
    <div class="executive-stat">
      <div class="executive-stat-top">
        <div class="executive-stat-title">${s.title}</div>
        <div class="executive-stat-badge">${esc(s.badge)}</div>
      </div>
      <div class="executive-stat-value">${s.value}</div>
      <div class="executive-stat-meta">${s.meta}</div>
    </div>
  `).join('');

  const alerts = buildAlerts();
  document.getElementById('alertSummaryBadge').textContent = `${alerts.length} alerta${alerts.length > 1 ? 's' : ''}`;
  document.getElementById('executiveAlerts').innerHTML = alerts.map(a => `
    <div class="alert-item">
      <div class="alert-icon alert-${a.level === 'high' ? 'high' : a.level === 'med' ? 'med' : 'low'}">${a.level === 'high' ? '!' : a.level === 'med' ? '•' : 'i'}</div>
      <div>
        <div class="alert-title">${a.title}</div>
        <div class="alert-text">${a.text}</div>
      </div>
    </div>
  `).join('');

  const periodosOrdenados = [...new Set(state.histData.map(r => r.mes))]
    .sort((a,b) => {
      const pa = parsePeriodo(a), pb = parsePeriodo(b);
      return (pa.ano - pb.ano) || (pa.mes - pb.mes);
    });
  const serie = periodosOrdenados.map(m => {
    const total = state.histData.filter(r => r.mes === m).reduce((s,r)=>s+Number(r.valor_liquido || 0),0);
    return { mes: m, total };
  });
  document.getElementById('heroTrendBadge').textContent = `${serie.length} períodos`;
  document.getElementById('heroTrendNote').textContent = comparativo?.anterior
    ? `Comparativo direto com ${comparativo.anterior}`
    : 'Histórico insuficiente para comparação';
  document.getElementById('heroTrendDelta').textContent = comparativo?.anterior
    ? variationLabel(comparativo.atualLiq, comparativo.prevLiq)
    : '—';

  killChart('heroTrend');
  charts.heroTrend = new Chart(document.getElementById('cHeroTrend'), {
    type: 'line',
    data: {
      labels: serie.map(s => s.mes),
      datasets: [{
        data: serie.map(s => s.total),
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#22C55E',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmtR(ctx.raw)}` } } },
      scales: {
        y: { ticks: { color: 'rgba(255,255,255,0.72)', callback: v => fmtR(v) }, grid: { color: 'rgba(255,255,255,0.08)' } },
        x: { ticks: { color: 'rgba(255,255,255,0.72)' }, grid: { display: false } }
      }
    }
  });
}

function renderStatGrid(targetId, items) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = items.map(item => `
    <div class="executive-stat">
      <div class="executive-stat-top">
        <div class="executive-stat-title">${item.title}</div>
        <div class="executive-stat-badge">${esc(item.badge || '—')}</div>
      </div>
      <div class="executive-stat-value">${item.value}</div>
      <div class="executive-stat-meta">${item.meta}</div>
    </div>
  `).join('');
}

function renderFolhasHighlightsData(d) {
  const maiorPs = [...d].sort((a,b)=>Math.abs(Number(b.ps||0)) - Math.abs(Number(a.ps||0)))[0];
  const ult = d[d.length - 1];
  renderStatGrid('folhasHighlights', [
    { title:'Ritmo diário', badge:`${d.length} folhas`, value:d.length ? `${fmt(d.reduce((s,r)=>s+Number(r.vendas||0),0) / d.length,1)} L/dia` : '—', meta:'Média simples de volume vendido por folha carregada no filtro atual.' },
    { title:'Maior desvio P/S', badge:maiorPs ? esc(maiorPs.combustivel.split(' ')[0]) : '—', value:maiorPs ? `${fmt(maiorPs.ps,3)} L` : '—', meta:'Maior diferença pontual entre previsto e realizado dentro do período selecionado.' },
    { title:'Último fechamento', badge:ult ? esc(ult.combustivel.split(' ')[0]) : '—', value:ult ? `${fmt(ult.fechamento,3)} L` : '—', meta:'Fechamento da folha mais recente disponível na seleção atual.' }
  ]);
}

function renderDescHighlightsData(cn, sn, totLitrosCn, totLitrosSn) {
  const mapa = [...cn, ...sn].reduce((acc, row) => {
    const key = row.fornecedor || '—';
    acc[key] = (acc[key] || 0) + Number(row.qtd || 0);
    return acc;
  }, {});
  const top = Object.entries(mapa).sort((a,b)=>b[1]-a[1])[0];
  const total = totLitrosCn + totLitrosSn;
  renderStatGrid('descHighlights', [
    { title:'Carga média fiscal', badge:`${cn.length} entradas`, value:cn.length ? `${fmt(totLitrosCn / cn.length,1)} L` : '—', meta:'Litros médios por descarga com documento fiscal no período.' },
    { title:'Dependência de pedidos', badge: total > 0 ? `${fmt((totLitrosSn / total) * 100,1)}%` : '0%', value:`${sn.length} pedidos`, meta:'Participação operacional de descargas internas sem documento fiscal.' },
    { title:'Fornecedor líder', badge: top ? esc(top[0].split(' ').slice(0,2).join(' ')) : '—', value: top ? `${fmt(top[1],0)} L` : '—', meta:'Fornecedor com maior volume somado considerando as duas origens.' }
  ]);
}

function renderEncHighlightsData(d) {
  const criticos = d.filter(r => Math.abs(Number(r.remanescente||0)) >= 1000).length;
  const topBico = [...d].sort((a,b)=>Number(b.vendas||0)-Number(a.vendas||0))[0];
  renderStatGrid('encHighlights', [
    { title:'Remanescente crítico', badge:`${criticos} caso${criticos === 1 ? '' : 's'}`, value:`${fmt(d.reduce((s,r)=>s+Math.abs(Number(r.remanescente||0)),0),1)} L`, meta:'Soma dos remanescentes absolutos para leitura rápida da tensão operacional.' },
    { title:'Bico com maior volume', badge: topBico ? esc(topBico.bicodisplay || topBico.bicocodigo) : '—', value: topBico ? `${fmt(topBico.vendas,1)} L` : '—', meta:'Maior volume apurado entre os bicos com movimento.' },
    { title:'Carga por bico', badge:`${d.length} ativos`, value:d.length ? `${fmt(d.reduce((s,r)=>s+Number(r.comandas||0),0) / d.length,1)}` : '—', meta:'Média de comandas por bico com venda registrada no período.' }
  ]);
}

function renderVendasHighlightsData(tipo, validas, totQtd, totVal, canceladas) {
  const target = tipo === 'semNota' ? 'semNotaHighlights' : 'comNotaHighlights';
  const topProd = Object.entries(validas.reduce((acc, row) => {
    acc[row.produto] = (acc[row.produto] || 0) + Number(row.qtd || 0);
    return acc;
  }, {})).sort((a,b)=>b[1]-a[1])[0];
  renderStatGrid(target, [
    { title:'Ticket por litro', badge:`${validas.length} válidas`, value: totQtd > 0 ? fmtR(totVal / totQtd) : '—', meta:'Preço médio efetivo por litro considerando apenas operações válidas.' },
    { title:'Produto líder', badge: topProd ? esc(topProd[0].split(' ').slice(0,2).join(' ')) : '—', value: topProd ? `${fmt(topProd[1],1)} L` : '—', meta:'Produto com maior concentração de volume dentro desta aba.' },
    { title:'Cancelamentos', badge: canceladas > 0 ? 'atenção' : 'estável', value: `${canceladas}`, meta: canceladas > 0 ? 'Existem registros cancelados no período e eles merecem conferência.' : 'Nenhum cancelamento encontrado nesta seleção.' }
  ]);
}

function renderConsolHighlightsData(d, totSem, totCom, totTotal) {
  const maiorGap = [...d].map(r => ({ nome: r.combustivel, gap: Number(r.vol_lmc||0) - Number(r.vol_total||0) }))
    .sort((a,b)=>Math.abs(b.gap)-Math.abs(a.gap))[0];
  renderStatGrid('consolHighlights', [
    { title:'Gap LMC x PDV', badge: maiorGap ? esc(maiorGap.nome.split(' ').slice(0,2).join(' ')) : '—', value: maiorGap ? `${fmt(maiorGap.gap,2)} L` : '—', meta:'Maior diferença absoluta entre o volume do LMC e o total registrado no PDV.' },
    { title:'Participação sem nota', badge: `${fmt((totTotal > 0 ? (totSem / totTotal) * 100 : 0),1)}%`, value: `${fmt(totSem,1)} L`, meta:'Peso das vendas sem nota em relação ao volume total do PDV.' },
    { title:'Cobertura fiscal', badge: `${fmt((totTotal > 0 ? (totCom / totTotal) * 100 : 0),1)}%`, value: `${fmt(totCom,1)} L`, meta:'Participação das vendas com nota sobre o volume total do PDV.' }
  ]);
}

function renderHistHighlightsData(byPeriodo) {
  const periodSummaries = Object.entries(byPeriodo).map(([mes, linhas]) => ({
    mes,
    volume: linhas.reduce((s,l)=>s+Number(l.volume_vendido||0),0),
    liquido: linhas.reduce((s,l)=>s+Number(l.valor_liquido||0),0)
  }));
  const melhor = [...periodSummaries].sort((a,b)=>b.liquido-a.liquido)[0];
  const pior = [...periodSummaries].sort((a,b)=>a.liquido-b.liquido)[0];
  renderStatGrid('histHighlights', [
    { title:'Melhor mês', badge: melhor ? melhor.mes : '—', value: melhor ? fmtR(melhor.liquido) : '—', meta: melhor ? `${fmt(melhor.volume,0)} L vendidos no melhor resultado histórico carregado.` : 'Sem histórico suficiente.' },
    { title:'Pior mês', badge: pior ? pior.mes : '—', value: pior ? fmtR(pior.liquido) : '—', meta: pior ? `${fmt(pior.volume,0)} L vendidos no período de menor resultado.` : 'Sem histórico suficiente.' },
    { title:'Amplitude', badge: `${periodSummaries.length} períodos`, value: melhor && pior ? fmtR(melhor.liquido - pior.liquido) : '—', meta:'Diferença entre o melhor e o pior resultado líquido dentro da série exibida.' }
  ]);
}

function toast(msg, ms=2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), ms);
}

function setStatus(s) {
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  dot.className = 'dot ' + s;
  txt.textContent = s==='online'?'Conectado':s==='loading'?'Carregando...':s==='error'?'Erro':'Aguardando';
}

async function api(path) {
  const token = localStorage.getItem(TK);
  const r = await fetch(API + path, { headers: token ? { 'x-token': token } : {} });
  if (r.status === 401) { doLogout(); throw new Error('Sessão expirada. Faça login novamente.'); }
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j.data;
}

async function doLogin(e) {
  e.preventDefault();
  const err = document.getElementById('loginErr');
  err.textContent = '';
  try {
    const r = await fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('loginUser').value,
        password: document.getElementById('loginPass').value
      })
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error);
    localStorage.setItem(TK, j.token);
    localStorage.setItem(UK, j.username);
    localStorage.setItem(RK, j.role || 'user');
    showApp();
  } catch(ex) { err.textContent = ex.message; }
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appShell').style.display = '';
  document.getElementById('userLabel').textContent = localStorage.getItem(UK) || '';
  const isAdmin = localStorage.getItem(RK) === 'admin';
  document.getElementById('navAdmin').style.display = isAdmin ? '' : 'none';
  const gsWrap = document.getElementById('globalSearchWrap');
  if (gsWrap) gsWrap.style.display = '';
  init();
}

async function doLogout() {
  const token = localStorage.getItem(TK);
  if (token) fetch(API + '/logout', { method: 'POST', headers: { 'x-token': token } }).catch(()=>{});
  localStorage.removeItem(TK);
  localStorage.removeItem(UK);
  localStorage.removeItem(RK);
  document.getElementById('loginScreen').style.display = '';
  document.getElementById('appShell').style.display = 'none';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginErr').textContent = '';
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  try {
    const clientes = await api('/clientes');
    const sel = document.getElementById('selCliente');
    clientes.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.nome;
      sel.appendChild(o);
    });
  } catch(e) {
    toast('Servidor não encontrado. Inicie o Node.js primeiro.');
    setStatus('error');
  }
}

async function onClienteChange() {
  const id = document.getElementById('selCliente').value;
  state.clienteId = id;
  state.periodo = '';
  _clearTabCache();
  document.getElementById('selPeriodo').innerHTML = '<option value="">Carregando...</option>';
  document.getElementById('btnAtualizar').disabled = true;
  if (!id) return;

  try {
    setStatus('loading');
    await api(`/clientes/${id}/ping`);
    const periodos = await api(`/clientes/${id}/periodos`);
    const sel = document.getElementById('selPeriodo');
    sel.innerHTML = '<option value="">— Período —</option>';
    periodos.forEach(p => {
      const o = document.createElement('option');
      o.value = p.lmcperiodo; o.textContent = p.label;
      sel.appendChild(o);
    });
    if (periodos.length > 0) {
      sel.value = periodos[0].lmcperiodo;
      state.periodo = periodos[0].lmcperiodo;
      document.getElementById('btnAtualizar').disabled = false;
      await loadAll();
    }
    setStatus('online');
    toast('Conectado com sucesso!');
  } catch(e) {
    setStatus('error');
    toast('Erro ao conectar: ' + e.message, 4000);
  }
}

function onPeriodoChange() {
  state.periodo = document.getElementById('selPeriodo').value;
  document.getElementById('btnAtualizar').disabled = !state.periodo;
  _clearTabCache();
  if (state.periodo) loadAll();
}

// ─── Load all ─────────────────────────────────────────────────────────────────
async function loadAll() {
  const { clienteId, periodo } = state;
  if (!clienteId || !periodo) return;
  setStatus('loading');
  document.getElementById('btnAtualizar').disabled = true;

  try {
    const [lmc, enc, hist, folhas, semNota, comNota, consol, desc] = await Promise.all([
      api(`/clientes/${clienteId}/lmc/resumo?periodo=${periodo}`),
      api(`/clientes/${clienteId}/lmc/encerrantes?periodo=${periodo}`),
      api(`/clientes/${clienteId}/lmc/historico`),
      api(`/clientes/${clienteId}/lmc/folhas?periodo=${periodo}`),
      api(`/clientes/${clienteId}/lmc/vendas?periodo=${periodo}&tipo=semNota`),
      api(`/clientes/${clienteId}/lmc/vendas?periodo=${periodo}&tipo=comNota`),
      api(`/clientes/${clienteId}/lmc/consolidado?periodo=${periodo}`),
      api(`/clientes/${clienteId}/lmc/descarregamentos?periodo=${periodo}`),
    ]);

    state.lmcData         = lmc;
    state.encData         = enc;
    state.histData        = hist;
    state.folhasData      = folhas;
    state.semNotaData     = semNota;
    state.comNotaData     = comNota;
    state.consolidadoData = consol;
    state.descData        = desc;

    renderExecutiveDashboard();
    renderResumo();
    renderFolhas();
    renderDescarregamentos();
    renderEncerrantes();
    renderVendas('semNota');
    renderVendas('comNota');
    renderConsolidado();
    renderHistorico();

    setStatus('online');
    toast('Dados atualizados!');
    checkAutoAlerts();
    requestAnimationFrame(() => animateKpiValues(document.querySelector('.section.active')));
  } catch(e) {
    setStatus('error');
    toast('Erro: ' + e.message, 4000);
  } finally {
    document.getElementById('btnAtualizar').disabled = false;
  }
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function showTab(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  const section = document.getElementById('tab-'+id);
  section.classList.add('active');
  btn.classList.add('active');
  if (id === 'admin')       renderAdmin();
  if (id === 'overview')    renderOverview();
  if (id === 'comparativo') renderComparativo();
  if (id === 'produtos')    loadProdutos();
  if (id === 'pagamentos')  loadPagamentos();
  if (id === 'receitas')    loadReceitas();
  if (id === 'dre')         loadDre();
  if (id === 'caixa') {
    const el = document.getElementById('selCaixaData');
    if (!el.value) el.value = new Date().toISOString().slice(0,10);
    loadCaixa();
  }
  // Animate KPI values on tab switch (skip async tabs that re-render later)
  if (!['caixa','produtos','pagamentos','receitas'].includes(id)) {
    requestAnimationFrame(() => animateKpiValues(section));
  }
}

// ─── Render: Comparativo de Períodos ─────────────────────────────────────────
function _populateCmpSelects() {
  const periodos = [...new Set(state.histData.map(r=>r.mes))].sort((a,b)=>{
    const pa=parsePeriodo(a),pb=parsePeriodo(b); return (pb.ano-pa.ano)||(pb.mes-pa.mes);
  });
  ['cmpPeriodoA','cmpPeriodoB'].forEach((id,i) => {
    const el = document.getElementById(id);
    if (!el) return;
    const cur = el.value;
    el.innerHTML = '<option value="">— Selecione —</option>' +
      periodos.map(p=>`<option value="${p}"${p===cur?'selected':''}>${p}</option>`).join('');
    if (!cur && periodos[i]) el.value = periodos[i];
  });
}

function renderComparativo() {
  _populateCmpSelects();
  const pA = document.getElementById('cmpPeriodoA')?.value;
  const pB = document.getElementById('cmpPeriodoB')?.value;
  const out = document.getElementById('cmpContent');
  if (!pA || !pB || pA === pB) {
    out.innerHTML = emptyStateHtml(
      `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="12" width="22" height="40" rx="4" stroke="currentColor" stroke-width="3"/><rect x="36" y="12" width="22" height="40" rx="4" stroke="currentColor" stroke-width="3"/><path d="M28 32h8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
      'Compare dois períodos',
      'Selecione dois meses diferentes para visualizar a comparação.'
    );
    return;
  }

  const sum = (rows, key) => rows.reduce((s,r)=>s+Number(r[key]||0),0);
  const rowsA = state.histData.filter(r=>r.mes===pA);
  const rowsB = state.histData.filter(r=>r.mes===pB);

  const volA = sum(rowsA,'volume_vendido'), volB = sum(rowsB,'volume_vendido');
  const liqA = sum(rowsA,'valor_liquido'),  liqB = sum(rowsB,'valor_liquido');
  const vendaA = rowsA.reduce((s,r)=>s+Number(r.preco_medio||0)*Number(r.volume_vendido||0),0);
  const vendaB = rowsB.reduce((s,r)=>s+Number(r.preco_medio||0)*Number(r.volume_vendido||0),0);
  const mrgA = volA>0?liqA/volA:0, mrgB = volB>0?liqB/volB:0;

  const delta = (a,b,fmt2) => {
    if (!b) return '';
    const d = a-b, pct = b?((d/Math.abs(b))*100):0;
    const up = d>0;
    return `<span class="cmp-delta ${up?'cmp-up':'cmp-dn'}">${up?'▲':'▼'} ${Math.abs(pct).toFixed(1)}%</span>`;
  };

  const rows = [
    ['Volume vendido', `${fmt(volA,0)} L`, `${fmt(volB,0)} L`, delta(volA,volB)],
    ['Receita bruta',   fmtR(vendaA),       fmtR(vendaB),       delta(vendaA,vendaB)],
    ['Resultado líq.',  fmtR(liqA),         fmtR(liqB),         delta(liqA,liqB)],
    ['Margem/litro',   `R$${fmt(mrgA,2)}/L`,`R$${fmt(mrgB,2)}/L`, delta(mrgA,mrgB)],
  ];

  const fuels = [...new Set([...rowsA,...rowsB].map(r=>r.combustivel))];
  const fuelRows = fuels.map(f => {
    const fA = rowsA.find(r=>r.combustivel===f), fB = rowsB.find(r=>r.combustivel===f);
    const vA = Number(fA?.volume_vendido||0), vB = Number(fB?.volume_vendido||0);
    return `<div class="cmp-row">
      <span style="flex:1;font-size:12px;color:var(--muted)">${esc(f.split(' ').slice(0,2).join(' '))}</span>
      <span style="min-width:90px;text-align:right;font-size:12px">${fmt(vA,0)} L</span>
      <span style="min-width:90px;text-align:right;font-size:12px">${fmt(vB,0)} L</span>
      <span style="min-width:60px;text-align:right">${delta(vA,vB)}</span>
    </div>`;
  }).join('');

  out.innerHTML = `
    <div class="cmp-grid">
      <div class="cmp-col">
        <div class="cmp-col-title">Métricas consolidadas</div>
        <div class="cmp-row" style="font-weight:600;font-size:11px;color:var(--muted)">
          <span style="flex:1"></span>
          <span style="min-width:110px;text-align:right">${pA}</span>
          <span style="min-width:110px;text-align:right">${pB}</span>
          <span style="min-width:60px;text-align:right">Δ</span>
        </div>
        ${rows.map(([label,a,b,d])=>`<div class="cmp-row">
          <span style="flex:1;font-size:12px">${label}</span>
          <span style="min-width:110px;text-align:right;font-size:12px;font-weight:500">${a}</span>
          <span style="min-width:110px;text-align:right;font-size:12px;font-weight:500">${b}</span>
          <span style="min-width:60px;text-align:right">${d}</span>
        </div>`).join('')}
      </div>
      <div class="cmp-col">
        <div class="cmp-col-title">Volume por combustível</div>
        <div class="cmp-row" style="font-weight:600;font-size:11px;color:var(--muted)">
          <span style="flex:1"></span>
          <span style="min-width:90px;text-align:right">${pA}</span>
          <span style="min-width:90px;text-align:right">${pB}</span>
          <span style="min-width:60px;text-align:right">Δ</span>
        </div>
        ${fuelRows}
      </div>
    </div>
    <div style="margin-top:16px">
      <div class="ov-chart-wrap">
        <div class="ov-chart-title">Volume vendido — ${pA} vs ${pB}</div>
        <div style="height:180px"><canvas id="cCmpBar"></canvas></div>
      </div>
    </div>`;

  setTimeout(() => {
    const el = document.getElementById('cCmpBar');
    if (!el) return;
    killChart('cmpBar');
    const labels = fuels.map(f=>f.split(' ').slice(0,2).join(' '));
    charts['cmpBar'] = new Chart(el, {
      type:'bar',
      data:{ labels, datasets:[
        { label:pA, data:fuels.map(f=>Number(rowsA.find(r=>r.combustivel===f)?.volume_vendido||0)),
          backgroundColor:'rgba(34,197,94,0.7)', borderRadius:4 },
        { label:pB, data:fuels.map(f=>Number(rowsB.find(r=>r.combustivel===f)?.volume_vendido||0)),
          backgroundColor:'rgba(59,130,246,0.7)', borderRadius:4 }
      ]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{labels:{font:{size:11},boxWidth:12}}, tooltip:{callbacks:{label:ctx=>` ${fmt(ctx.raw,0)} L`}} },
        scales:{ y:{ticks:{callback:v=>fmt(v)+' L',font:{size:10}}}, x:{ticks:{font:{size:10}}} }
      }
    });
  }, 50);
}

// ─── Render: Visão Geral ──────────────────────────────────────────────────────
function renderOverview() {
  const d   = state.lmcData;
  const cmp = getComparativoPeriodo();
  const alerts = buildAlerts();

  // KPIs
  const totVend = d.reduce((s,r)=>s+Number(r.vendas||0),0);
  const totLiq  = d.reduce((s,r)=>s+Number(r.valor_liquido||0),0);
  const totComp = d.reduce((s,r)=>s+Number(r.compras||0),0);
  const totFech = d.reduce((s,r)=>s+Number(r.fechamento||0),0);
  const topFuel = [...d].sort((a,b)=>Number(b.vendas||0)-Number(a.vendas||0))[0];

  const trendBadge = (curr, prev) => {
    if (!prev || !cmp) return '';
    const pct = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0;
    const up = pct >= 0;
    return `<div class="ov-kpi-trend" style="color:${up?'var(--green)':'var(--red)'}">${up?'↑':'↓'} ${Math.abs(pct).toFixed(1)}% vs anterior</div>`;
  };

  const kpis = [
    { label:'Volume Vendido', value:`${fmt(totVend,0)} L`,  sub:'PDV no período',      color:'#22C55E', trend:trendBadge(totVend,cmp?.prevVol) },
    { label:'Resultado Líq.',  value:fmtR(totLiq),           sub:'Estimativa período',   color:totLiq>=0?'#22C55E':'#EF4444', trend:trendBadge(totLiq,cmp?.prevLiq) },
    { label:'Estoque Físico',  value:`${fmt(totFech,0)} L`,  sub:'Fechamento do período',color:'#3B82F6', trend:'' },
    { label:'Compras',         value:`${fmt(totComp,0)} L`,  sub:'Captação do período',  color:'#F59E0B', trend:'' },
    { label:'Combustível Top', value:topFuel?.combustivel?.split(' ').slice(0,2).join(' ')||'—', sub:topFuel?`${fmt(topFuel.vendas,0)} L`:'' , color:'#7C3AED', trend:'' },
    { label:'Margem/Litro',    value:`R$ ${fmt(totVend>0?totLiq/totVend:0,2)}/L`, sub:'Resultado por litro', color:'#0EA5E9', trend:'' },
  ];

  document.getElementById('ovKpiGrid').innerHTML = kpis.map(k => `
    <div class="ov-kpi">
      <div class="ov-kpi-accent" style="background:${k.color}"></div>
      <div class="ov-kpi-label">${k.label}</div>
      <div class="ov-kpi-value">${k.value}</div>
      <div class="ov-kpi-sub">${k.sub}</div>
      ${k.trend}
    </div>
  `).join('');

  // Charts
  const periodos = [...new Set(state.histData.map(r=>r.mes))].sort((a,b)=>{
    const pa=parsePeriodo(a),pb=parsePeriodo(b); return (pa.ano-pb.ano)||(pa.mes-pb.mes);
  }).slice(-10);
  const liqSerie = periodos.map(m => state.histData.filter(r=>r.mes===m).reduce((s,r)=>s+Number(r.valor_liquido||0),0));

  const elTrend = document.getElementById('cOvTrend');
  if (elTrend) {
    killChart('ovTrend');
    charts['ovTrend'] = new Chart(elTrend, {
      type:'line',
      data:{ labels:periodos, datasets:[{
        data:liqSerie,
        borderColor:'#22C55E',
        backgroundColor:(ctx)=>{
          const g=ctx.chart.ctx.createLinearGradient(0,0,0,ctx.chart.height);
          g.addColorStop(0,'rgba(34,197,94,0.4)'); g.addColorStop(1,'rgba(34,197,94,0.02)');
          return g;
        },
        fill:true, tension:0.4, pointRadius:4,
        pointBackgroundColor:'#fff', pointBorderColor:'#22C55E', pointBorderWidth:2, borderWidth:2
      }]},
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false}, tooltip:{callbacks:{label:ctx=>` ${fmtR(ctx.raw)}`}}},
        scales:{
          y:{ticks:{callback:v=>'R$'+fmt(v/1000,1)+'k',font:{size:10}},grid:{color:'rgba(0,0,0,0.05)'}},
          x:{ticks:{font:{size:10}}}
        }
      }
    });
  }

  const elMix = document.getElementById('cOvMix');
  if (elMix && d.length) {
    killChart('ovMix');
    const cores = d.map((r,i)=>getFuelColor(r.combustivel,i));
    charts['ovMix'] = new Chart(elMix, {
      type:'doughnut',
      data:{ labels:d.map(r=>r.combustivel.split(' ').slice(0,2).join(' ')), datasets:[{
        data:d.map(r=>Number(r.vendas||0)),
        backgroundColor:cores, borderWidth:2, borderColor:'#fff'
      }]},
      options:{
        responsive:true, maintainAspectRatio:false, cutout:'60%',
        plugins:{ legend:{position:'right',labels:{font:{size:11},boxWidth:12}},
          tooltip:{callbacks:{label:ctx=>` ${fmt(ctx.raw,0)} L`}} }
      }
    });
  }

  // Alerts
  document.getElementById('ovAlerts').innerHTML = alerts.map(a => `
    <div class="alert-item">
      <div class="alert-icon alert-${a.level==='high'?'high':a.level==='med'?'med':'low'}">${a.level==='high'?'!':a.level==='med'?'•':'i'}</div>
      <div><div class="alert-title">${a.title}</div><div class="alert-text">${a.text}</div></div>
    </div>
  `).join('') || '<div class="empty">Sem alertas identificados.</div>';
}

// ─── Render: Resumo ───────────────────────────────────────────────────────────
function renderResumo() {
  const d = state.lmcData;
  if (!d.length) {
    document.getElementById('kpiResumo').innerHTML = emptyStateHtml(
      `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="16" width="48" height="36" rx="6" stroke="currentColor" stroke-width="3"/><path d="M8 26h48" stroke="currentColor" stroke-width="3"/><path d="M20 38h8M36 38h8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
      'Sem dados para o período',
      'Selecione um cliente e período com movimentações.'
    );
    return;
  }

  const coresResumo = d.map((r,i) => getFuelColor(r.combustivel, i));
  const totComp   = d.reduce((s,r)=>s+Number(r.compras),0);
  const totVend   = d.reduce((s,r)=>s+Number(r.vendas),0);
  const totFech   = d.reduce((s,r)=>s+Number(r.fechamento),0);
  const totAfer   = d.reduce((s,r)=>s+Number(r.afericos),0);
  const totLiq    = d.reduce((s,r)=>s+Number(r.valor_liquido),0);

  const cId  = state.clienteId;
  const per  = state.periodo;
  const metaVol = getMetaVal(cId, per, 'volume');
  const metaLiq = getMetaVal(cId, per, 'resultado');

  const cmp = getComparativoPeriodo();
  const trendHtml = (curr, prev, suffix='') => {
    if (!cmp || !prev) return `<div class="kpi-trend"><span class="neu">Sem histórico</span></div>`;
    const pct = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0;
    const up  = pct >= 0;
    return `<div class="kpi-trend"><span class="${up?'up':'dn'}">${up?'↑':'↓'} ${Math.abs(pct).toFixed(1)}%${suffix}</span><span>vs mês anterior</span></div>`;
  };
  document.getElementById('kpiResumo').innerHTML = [
    {label:'Total compras',      value:fmt(totComp,0),               unit:'L',  trend:trendHtml(totComp, cmp?.prevVol,' L')},
    {label:'Vendas PDV',         value:fmt(totVend,0),               unit:'L',  trend:trendHtml(totVend, cmp?.prevVol,' L'), meta: metaVol ? renderMetaProgress(totVend, metaVol, fmt(metaVol,0)+' L') : ''},
    {label:'Estoque físico',     value:fmt(totFech,0),               unit:'L',  trend:''},
    {label:'Aferições',          value:fmt(totAfer,1),               unit:'L',  trend:''},
    {label:'Resultado líquido',  value:'R$ '+fmt(totLiq/1000,1)+'k', unit:'',   green:totLiq>0, red:totLiq<0, trend:trendHtml(totLiq, cmp?.prevLiq), meta: metaLiq ? renderMetaProgress(totLiq, metaLiq, fmtR(metaLiq)) : ''},
  ].map(k=>`
    <div class="kpi">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value" style="${k.green?'color:var(--green)':k.red?'color:var(--red)':''}">${k.value}<span class="kpi-unit">${k.unit}</span></div>
      ${k.trend||''}
      ${k.meta||''}
    </div>
  `).join('');

  const periodo = document.getElementById('selPeriodo');
  document.getElementById('badgePeriodo').textContent = periodo.options[periodo.selectedIndex]?.textContent||'';

  const maxV = Math.max(...d.map(r=>Number(r.vendas)),1);
  document.getElementById('fuelRows').innerHTML = d.map((r,i)=>`
    <div class="fuel-row">
      <div class="fuel-dot" style="background:${coresResumo[i]}"></div>
      <div class="fuel-name">${esc(r.combustivel)}</div>
      <div class="fuel-metrics">
        <div class="fm"><div class="fm-label">Compra</div><div class="fm-value">${fmt(r.compras,0)} L</div></div>
        <div class="fm"><div class="fm-label">Venda PDV</div><div class="fm-value">${fmt(r.vendas,0)} L</div></div>
        <div class="fm"><div class="fm-label">Físico${r.data_fisico?` <span style="font-weight:400;color:var(--hint)">${esc(r.data_fisico)}</span>`:''}</div><div class="fm-value">${fmt(r.fechamento,0)} L</div></div>
        <div class="mini-bar"><div class="mini-bar-fill" style="width:${Math.round(Number(r.vendas)/maxV*100)}%;background:${coresResumo[i]}"></div></div>
      </div>
    </div>
  `).join('');

  killChart('pizza');
  document.getElementById('legendPizza').innerHTML = d.map((r,i)=>`
    <span class="legend-item"><span class="legend-sq" style="background:${coresResumo[i]}"></span>${esc(r.combustivel.split(' ')[0])}</span>
  `).join('');
  charts['pizza'] = new Chart(document.getElementById('cPizza'),{
    type:'doughnut',
    data:{labels:d.map(r=>r.combustivel),datasets:[{data:d.map(r=>Number(r.vendas)),backgroundColor:coresResumo,borderWidth:2,borderColor:'#fff'}]},
    options:{
      responsive:true, maintainAspectRatio:false, cutout:'65%',
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${fmt(ctx.raw,0)} L`}}},
      onClick: (evt, els) => {
        if (!els.length) return;
        const fuel = d[els[0].index];
        if (!fuel) return;
        // Drill-down: navega para Folhas filtrando o combustível
        const fuelSel = document.getElementById('selFolhaComb');
        const folhasBtn = document.querySelector('[onclick*="folhas"]');
        if (folhasBtn) showTab('folhas', folhasBtn);
        setTimeout(() => {
          const opts = [...(fuelSel?.options||[])];
          const match = opts.find(o => o.textContent.trim() === fuel.combustivel.trim());
          if (match && fuelSel) { fuelSel.value = match.value; renderFolhas(); }
          toast(`Drill-down: ${fuel.combustivel.split(' ').slice(0,2).join(' ')}`);
        }, 100);
      }
    }
  });

  killChart('bar');
  const barLabels = d.map(r => r.combustivel.split(' ').slice(0,2).join(' '));
  const margemLitro = d.map(r => {
    const v = Number(r.vendas); return v > 0 ? Number(r.valor_liquido) / v : 0;
  });
  charts['bar'] = new Chart(document.getElementById('cBar'), {
    type: 'bar',
    data: {
      labels: barLabels,
      datasets: [
        {
          type: 'bar', label: 'Volume Vendido (L)',
          data: d.map(r => Number(r.vendas)),
          backgroundColor: coresResumo.map(c => c + '88'),
          borderColor: coresResumo, borderWidth: 1.5,
          yAxisID: 'yVol', order: 2
        },
        {
          type: 'line', label: 'Margem/L (R$)',
          data: margemLitro,
          borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.15)',
          pointBackgroundColor: '#F59E0B', pointBorderColor: '#fff',
          pointBorderWidth: 2, pointRadius: 5,
          borderWidth: 2, tension: 0.3, fill: true,
          yAxisID: 'yMarg', order: 1
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { size: 11 }, boxWidth: 12 } },
        tooltip: { callbacks: { label: ctx => ctx.dataset.yAxisID === 'yMarg'
          ? ` R$ ${fmt(ctx.raw,2)}/L` : ` ${fmt(ctx.raw,0)} L` } } },
      scales: {
        yVol:  { position:'left',  ticks:{ callback: v => fmt(v)+' L', font:{size:10} }, grid:{color:'rgba(0,0,0,0.04)'} },
        yMarg: { position:'right', ticks:{ callback: v => 'R$'+fmt(v,2), font:{size:10} }, grid:{display:false} },
        x: { ticks: { font:{size:10} } }
      }
    }
  });
}

// ─── Render: Folhas ───────────────────────────────────────────────────────────
function renderFolhas() {
  const combSel = document.getElementById('selFolhaComb');
  const filtro = combSel ? combSel.value : '';

  // Popula dropdown de combustíveis
  const prods = [...new Map(state.folhasData.map(r=>[r.prodcodigo, r.combustivel])).entries()];
  const prevVal = combSel.value;
  combSel.innerHTML = '<option value="">— Todos —</option>' +
    prods.map(([id,nome])=>`<option value="${String(id)}"${String(prevVal)===String(id)?'selected':''}>${esc(nome)}</option>`).join('');
  combSel.value = prevVal;

  const d = filtro
    ? state.folhasData.filter(r=>String(r.prodcodigo)===String(filtro))
    : state.folhasData;
  renderFolhasHighlightsData(d);

  document.getElementById('badgeFolhas').textContent = `${d.length} folhas`;

  // KPIs por combustível selecionado
  const totVendas  = d.reduce((s,r)=>s+Number(r.vendas),0);
  const totCompras = d.reduce((s,r)=>s+Number(r.compras),0);
  const totAfer    = d.reduce((s,r)=>s+Number(r.afericos),0);

  document.getElementById('kpiFolhas').innerHTML = [
    {label:'Folhas',          value:d.length,              unit:''},
    {label:'Total vendas',    value:fmt(totVendas,3),       unit:'L'},
    {label:'Total compras',   value:fmt(totCompras,3),      unit:'L'},
    {label:'Aferições',       value:fmt(totAfer,3),         unit:'L'},
  ].map(k=>`<div class="kpi"><div class="kpi-label">${k.label}</div><div class="kpi-value" style="font-size:18px">${k.value}<span class="kpi-unit">${k.unit}</span></div></div>`).join('');

  // Tabela
  let prevComb = '';
  let rows = '';
  let totAbr = 0, totVnd = 0, totCmp = 0, totAfr = 0, totFch = 0;

  d.forEach(r => {
    const ps = Number(r.ps);
    if (!filtro && r.combustivel !== prevComb) {
      if (prevComb) {
        rows += `<tr class="tbl-total">
          <td colspan="2">Total ${esc(prevComb.split(' ')[0])}</td>
          <td class="mono">${fmt(totAbr,3)}</td>
          <td class="mono">${fmt(totCmp,3)}</td>
          <td class="mono">${fmt(totVnd,3)}</td>
          <td class="mono">${fmt(totAfr,3)}</td>
          <td class="mono">${fmt(totFch,3)}</td>
          <td colspan="2"></td>
        </tr>`;
        totAbr=totVnd=totCmp=totAfr=totFch=0;
      }
      rows += `<tr class="tbl-group"><td colspan="9">${esc(r.combustivel)}</td></tr>`;
      prevComb = r.combustivel;
    }
    totAbr+=Number(r.abertura); totCmp+=Number(r.compras);
    totVnd+=Number(r.vendas);   totAfr+=Number(r.afericos);
    totFch+=Number(r.fechamento);
    const dt = new Date(r.lmcdata);
    const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const dataStr = `${dias[dt.getUTCDay()]} ${String(dt.getUTCDate()).padStart(2,'0')}/${String(dt.getUTCMonth()+1).padStart(2,'0')}`;
    rows += `<tr>
      <td>${dataStr}</td>
      <td>${esc(r.combustivel)}</td>
      <td class="mono" style="text-align:right">${fmt(r.abertura,3)}</td>
      <td class="mono" style="text-align:right;color:var(--green)">${fmt(r.compras,3)}</td>
      <td class="mono" style="text-align:right;color:var(--accent)">${fmt(r.vendas,3)}</td>
      <td class="mono" style="text-align:right;color:var(--amber)">${fmt(r.afericos,3)}</td>
      <td class="mono" style="text-align:right">${fmt(r.fechamento,3)}</td>
      <td class="mono" style="text-align:right;color:var(--muted)">${fmt(r.fisico,3)}</td>
      <td class="mono" style="text-align:right;color:${ps>0?'var(--red)':ps<0?'var(--green)':'var(--muted)'}">${fmt(ps,3)}</td>
    </tr>`;
  });

  // Última linha de total
  if (d.length) {
    rows += `<tr class="tbl-total">
      <td colspan="2">${filtro?'Total':'Total geral'}</td>
      <td class="mono" style="text-align:right">${fmt(d[0]?.abertura||0,3)}</td>
      <td class="mono" style="text-align:right">${fmt(totCmp,3)}</td>
      <td class="mono" style="text-align:right">${fmt(totVnd,3)}</td>
      <td class="mono" style="text-align:right">${fmt(totAfr,3)}</td>
      <td class="mono" style="text-align:right">${fmt(totFch,3)}</td>
      <td colspan="2"></td>
    </tr>`;
  }

  document.getElementById('tbodyFolhas').innerHTML = rows ||
    '<tr><td colspan="9" class="loading-row">Sem dados</td></tr>';
}

// ─── Render: Descarregamentos ─────────────────────────────────────────────────
function renderDescarregamentos() {
  const { com_nota: cn, sem_nota: sn } = state.descData;

  const totLitrosCn = cn.reduce((s,r)=>s+Number(r.qtd),0);
  const totValorCn  = cn.reduce((s,r)=>s+Number(r.total),0);
  const totLitrosSn = sn.reduce((s,r)=>s+Number(r.qtd),0);
  const totValorSn  = sn.reduce((s,r)=>s+Number(r.total),0);

  document.getElementById('kpiDesc').innerHTML = [
    {label:'Entregas c/ Nota',  value:cn.length,              unit:'',  cor:''},
    {label:'Litros c/ Nota',    value:fmt(totLitrosCn,0),     unit:'L', cor:''},
    {label:'Valor c/ Nota',     value:'R$ '+fmt(totValorCn/1000,1)+'k', unit:'', cor:''},
    {label:'Pedidos s/ Nota',   value:sn.length,              unit:'',  cor:'var(--amber)'},
    {label:'Litros s/ Nota',    value:fmt(totLitrosSn,0),     unit:'L', cor:'var(--amber)'},
    ...(totValorSn>0 ? [{label:'Valor s/ Nota', value:'R$ '+fmt(totValorSn/1000,1)+'k', unit:'', cor:'var(--amber)'}] : []),
  ].map(k=>`<div class="kpi">
    <div class="kpi-label">${k.label}</div>
    <div class="kpi-value" style="${k.cor?'color:'+k.cor:''}">${k.value}<span class="kpi-unit"> ${k.unit}</span></div>
  </div>`).join('');

  // Tabela com nota
  const rowsCn = cn.map(r => {
    const data = r.data ? new Date(r.data).toLocaleDateString('pt-BR') : '—';
    return `<tr>
      <td>${data}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(r.fornecedor)}">${esc(r.fornecedor)}</td>
      <td>${esc(r.combustivel)}</td>
      <td class="mono" style="text-align:right;color:var(--green);font-weight:500">${fmt(r.qtd,3)}</td>
      <td class="mono" style="text-align:right">${fmtR(r.unitario)}</td>
      <td class="mono" style="text-align:right;font-weight:500">${fmtR(r.total)}</td>
      <td class="mono" style="color:var(--muted)">${esc(r.nota||'—')}</td>
      <td>${esc(r.placa||'—')}</td>
    </tr>`;
  });
  if (cn.length) {
    const totRow = `<tr class="tbl-total">
      <td colspan="3">Total</td>
      <td class="mono" style="text-align:right">${fmt(totLitrosCn,3)} L</td>
      <td></td>
      <td class="mono" style="text-align:right">${fmtR(totValorCn)}</td>
      <td colspan="2"></td>
    </tr>`;
    rowsCn.push(totRow);
  }
  document.getElementById('tbodyDescComNota').innerHTML =
    rowsCn.join('') || '<tr><td colspan="8" class="loading-row">Nenhuma descarga com nota no período</td></tr>';

  // Tabela sem nota
  const rowsSn = sn.map(r => {
    const data = r.data ? new Date(r.data).toLocaleDateString('pt-BR') : '—';
    return `<tr>
      <td>${data}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(r.fornecedor)}">${esc(r.fornecedor)}</td>
      <td>${esc(r.combustivel)}</td>
      <td class="mono" style="text-align:right;color:var(--amber);font-weight:500">${fmt(r.qtd,3)}</td>
      <td class="mono" style="text-align:right">${r.unitario>0?fmtR(r.unitario):'—'}</td>
      <td class="mono" style="text-align:right;font-weight:500">${r.total>0?fmtR(r.total):'—'}</td>
      <td style="color:var(--muted);font-size:11px">${esc(r.observacao||'—')}</td>
    </tr>`;
  });
  if (sn.length) {
    const totRow = `<tr class="tbl-total">
      <td colspan="3">Total</td>
      <td class="mono" style="text-align:right">${fmt(totLitrosSn,3)} L</td>
      <td></td>
      <td class="mono" style="text-align:right">${totValorSn>0?fmtR(totValorSn):'—'}</td>
      <td></td>
    </tr>`;
    rowsSn.push(totRow);
  }
  document.getElementById('tbodyDescSemNota').innerHTML =
    rowsSn.join('') || '<tr><td colspan="7" class="loading-row">Nenhum pedido sem nota no período</td></tr>';
  renderDescHighlightsData(cn, sn, totLitrosCn, totLitrosSn);
}

// ─── Render: Encerrantes ─────────────────────────────────────────────────────
function renderEncerrantes() {
  const d = state.encData;

  const totVendas   = d.reduce((s,r)=>s+Number(r.vendas),0);
  const totComandas = d.reduce((s,r)=>s+Number(r.comandas),0);
  const maxRem      = d.length ? Math.max(...d.map(r=>Math.abs(Number(r.remanescente)))) : 0;

  document.getElementById('kpiEnc').innerHTML = [
    {label:'Bicos no período',    value:d.length,          unit:''},
    {label:'Total vendas',        value:fmt(totVendas,1),  unit:'L'},
    {label:'Total comandas',      value:totComandas,       unit:''},
    {label:'Maior remanescente',  value:fmt(maxRem,2),     unit:'L', red:maxRem>1000},
  ].map(k=>`<div class="kpi">
    <div class="kpi-label">${k.label}</div>
    <div class="kpi-value" style="${k.red?'color:var(--red)':''}">${k.value}<span class="kpi-unit"> ${k.unit}</span></div>
  </div>`).join('');

  const renderEncRow = r => {
    const rem    = Number(r.remanescente);
    const absRem = Math.abs(rem);
    const remCls = absRem < 100 ? 'tag-green' : absRem < 1000 ? 'tag-amber' : 'tag-red';
    const st     = r.ativo ? 'A' : 'I';
    return `<tr>
      <td><span class="mono" style="font-weight:600">${esc(r.bicodisplay||r.bicocodigo)}</span></td>
      <td>${esc(r.combustivel)}</td>
      <td><span class="tag ${st==='A'?'tag-green':'tag-gray'}">${st}</span></td>
      <td class="mono" style="text-align:right">${r.sistema!=null?fmt(r.sistema,2):'—'}</td>
      <td class="mono" style="text-align:right">${r.automacao!=null?fmt(r.automacao,2):'—'}</td>
      <td class="mono" style="text-align:right">${esc(r.pista||'—')}</td>
      <td class="mono" style="text-align:right;color:var(--accent)">${fmt(r.vendas,2)}</td>
      <td class="mono" style="text-align:right">${r.comandas}</td>
      <td style="text-align:right"><span class="tag ${remCls}">${fmt(rem,2)}</span></td>
    </tr>`;
  };
  paginate(d, 'enc', renderEncRow,
    '<tr><td colspan="9" class="loading-row">Sem dados de encerrantes</td></tr>',
    'tbodyEnc', 'encPagination');
  renderEncHighlightsData(d);
}

// ─── Render: Vendas (semNota / comNota) ──────────────────────────────────────
function renderVendas(tipo) {
  const d      = tipo==='semNota' ? state.semNotaData : state.comNotaData;
  const kpiId  = tipo==='semNota' ? 'kpiSemNota'    : 'kpiComNota';
  const tblId  = tipo==='semNota' ? 'tbodySemNota'  : 'tbodyComNota';
  const cor    = tipo==='semNota' ? 'var(--amber)'  : 'var(--green)';

  const validas   = d.filter(v=>v.situacao==='OK');
  const totQtd    = validas.reduce((s,r)=>s+Number(r.qtd),0);
  const totVal    = validas.reduce((s,r)=>s+Number(r.total),0);
  const canceladas = d.filter(v=>v.situacao!=='OK').length;

  document.getElementById(kpiId).innerHTML = [
    {label:'Lançamentos',   value:d.length,                          unit:''},
    {label:'Volume válido', value:fmt(totQtd,1),                     unit:'L'},
    {label:'Valor total',   value:'R$ '+fmt(totVal/1000,1)+'k',      unit:''},
    {label:'Cancelamentos', value:canceladas,                        unit:'', red:canceladas>0},
  ].map(k=>`<div class="kpi">
    <div class="kpi-label">${k.label}</div>
    <div class="kpi-value" style="${k.red&&k.value>0?'color:var(--red)':''}">${k.value}<span class="kpi-unit">${k.unit}</span></div>
  </div>`).join('');

  document.getElementById(tblId).innerHTML = d.map(v=>`
    <tr>
      <td class="mono" style="color:var(--muted)">${v.vdacodigo}</td>
      <td>${new Date(v.vdadata).toLocaleDateString('pt-BR')}</td>
      <td>${esc(v.produto)}</td>
      <td class="mono" style="color:${cor}">${fmt(v.qtd,2)}</td>
      <td class="mono">${fmtR(v.preco_unit)}</td>
      <td class="mono" style="font-weight:500">${fmtR(v.total)}</td>
      <td class="mono">${esc(v.caixa)}</td>
      <td><span class="tag ${v.situacao==='OK'?'tag-green':'tag-red'}">${esc(v.situacao)}</span></td>
    </tr>
  `).join('') || `<tr><td colspan="8" class="loading-row">Sem vendas ${tipo==='semNota'?'sem nota':'com nota'}</td></tr>`;
  renderVendasHighlightsData(tipo, validas, totQtd, totVal, canceladas);
}

// ─── Render: Consolidado ─────────────────────────────────────────────────────
function renderConsolidado() {
  const d = state.consolidadoData;
  if (!d.length) {
    document.getElementById('kpiConsol').innerHTML = '';
    document.getElementById('consolRows').innerHTML = '<div class="empty">Sem dados</div>';
    return;
  }

  const totLmc     = d.reduce((s,r)=>s+Number(r.vol_lmc),0);
  const totSem     = d.reduce((s,r)=>s+Number(r.vol_sem_nota),0);
  const totCom     = d.reduce((s,r)=>s+Number(r.vol_com_nota),0);
  const totTotal   = d.reduce((s,r)=>s+Number(r.vol_total),0);
  const totAfer    = d.reduce((s,r)=>s+Number(r.afericos),0);
  const qtdSem     = d.reduce((s,r)=>s+Number(r.qtd_sem_nota),0);
  const qtdCom     = d.reduce((s,r)=>s+Number(r.qtd_com_nota),0);

  document.getElementById('kpiConsol').innerHTML = [
    {label:'LMC (encerrante)', value:fmt(totLmc,1),    unit:'L',  delta:''},
    {label:'s/ Nota (script)', value:fmt(totSem,1),    unit:'L',  delta:`${qtdSem} lançamentos`},
    {label:'c/ Nota (PDV)',    value:fmt(totCom,1),    unit:'L',  delta:`${qtdCom} lançamentos`},
    {label:'Total PDV',        value:fmt(totTotal,1),  unit:'L',  delta:''},
    {label:'Aferições',        value:fmt(totAfer,1),   unit:'L',  delta:''},
  ].map(k=>`<div class="kpi">
    <div class="kpi-label">${k.label}</div>
    <div class="kpi-value" style="${k.red?'color:var(--red)':''}">${k.value}<span class="kpi-unit">${k.unit}</span></div>
    ${k.delta?`<div class="kpi-delta">${k.delta}</div>`:''}
  </div>`).join('');

  document.getElementById('consolRows').innerHTML = d.map(r=>{
    const lmc    = Number(r.vol_lmc);
    const sem    = Number(r.vol_sem_nota);
    const com    = Number(r.vol_com_nota);
    const total  = Number(r.vol_total);
    const afer   = Number(r.afericos);
    const valorSem = Number(r.valor_sem_nota);
    const valorCom = Number(r.valor_com_nota);

    return `<div class="consol-row">
      <div class="consol-prod">${esc(r.combustivel)}</div>
      <div class="consol-vals">
        <div class="cv-box">
          <div class="cv-label">LMC</div>
          <div class="cv-num">${fmt(lmc,2)} L</div>
        </div>
        <div class="cv-box">
          <div class="cv-label">s/ Nota <span style="color:var(--muted)">(${r.qtd_sem_nota})</span></div>
          <div class="cv-num" style="color:var(--amber)">${fmt(sem,2)} L</div>
          <div class="cv-sub">${fmtR(valorSem)}</div>
        </div>
        <div class="cv-box">
          <div class="cv-label">c/ Nota <span style="color:var(--muted)">(${r.qtd_com_nota})</span></div>
          <div class="cv-num" style="color:var(--green)">${fmt(com,2)} L</div>
          <div class="cv-sub">${fmtR(valorCom)}</div>
        </div>
        <div class="cv-box">
          <div class="cv-label">Total PDV</div>
          <div class="cv-num">${fmt(total,2)} L</div>
          <div class="cv-sub">${fmtR(valorSem+valorCom)}</div>
        </div>
        <div class="cv-box">
          <div class="cv-label">Aferições</div>
          <div class="cv-num" style="color:var(--amber)">${fmt(afer,2)} L</div>
        </div>
      </div>
    </div>`;
  }).join('');
  renderConsolHighlightsData(d, totSem, totCom, totTotal);

}

// ─── Render: Histórico ────────────────────────────────────────────────────────
function renderHistorico() {
  const allD = state.histData;
  // Aplicar range (últimos N meses)
  const allMeses = [...new Set(allD.map(r=>r.mes))].sort((a,b)=>{
    const pa=parsePeriodo(a),pb=parsePeriodo(b); return (pa.ano-pb.ano)||(pa.mes-pb.mes);
  });
  const mesesFiltrados = _histRange > 0 ? allMeses.slice(-_histRange) : allMeses;
  const d = allD.filter(r => mesesFiltrados.includes(r.mes));
  const meses = mesesFiltrados.filter(m => d.some(r=>r.mes===m));
  const prods = [...new Set(d.map(r=>r.combustivel))];
  const coresHistorico = prods.map((p,i) => getFuelColor(p, i));

  killChart('hist');
  document.getElementById('legendHist').innerHTML = prods.map((p,i)=>`
    <span class="legend-item"><span class="legend-sq" style="background:${coresHistorico[i]}"></span>${esc(p.split(' ').slice(0,2).join(' '))}</span>
  `).join('');
  const histCanvas = document.getElementById('cHist');
  charts['hist'] = new Chart(histCanvas, {
    type:'line',
    data:{
      labels:meses,
      datasets:prods.map((p,i)=>{
        const cor = coresHistorico[i];
        const data = meses.map(m=>{ const row=d.find(r=>r.mes===m&&r.combustivel===p); return row?Number(row.volume_vendido):0; });
        return {
          label:p, data,
          borderColor: cor,
          backgroundColor: (ctx) => {
            const grad = ctx.chart.ctx.createLinearGradient(0,0,0,ctx.chart.height);
            grad.addColorStop(0, alphaHex(cor,'55'));
            grad.addColorStop(1, alphaHex(cor,'05'));
            return grad;
          },
          borderWidth:2.5, pointRadius:4, pointBackgroundColor:'#fff',
          pointBorderColor:cor, pointBorderWidth:2,
          tension:0.4, fill:true
        };
      })
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{
        legend:{display:false},
        tooltip:{ callbacks:{ label: ctx => ` ${esc(ctx.dataset.label.split(' ')[0])}: ${fmt(ctx.raw,0)} L` } }
      },
      scales:{
        y:{ ticks:{callback:v=>fmt(v)+' L',font:{size:11}}, grid:{color:'rgba(0,0,0,0.05)'} },
        x:{ ticks:{font:{size:11}} }
      }
    }
  });

  const byPeriodo = {};
  d.forEach(r=>{ if(!byPeriodo[r.mes]) byPeriodo[r.mes]=[]; byPeriodo[r.mes].push(r); });
  renderHistHighlightsData(byPeriodo);

  // ── Heatmap de resultado por período ──
  const hmEl = document.getElementById('histHeatmap');
  if (hmEl) {
    const periodos = Object.keys(byPeriodo).sort((a,b)=>{
      const pa=parsePeriodo(a),pb=parsePeriodo(b); return (pa.ano-pb.ano)||(pa.mes-pb.mes);
    });
    const totais = periodos.map(m => byPeriodo[m].reduce((s,r)=>s+Number(r.valor_liquido||0),0));
    const maxAbs = Math.max(...totais.map(Math.abs), 1);
    hmEl.innerHTML = periodos.map((m,i) => {
      const v = totais[i];
      let cls;
      if (v < 0) cls = 'hm-neg';
      else if (v === 0) cls = 'hm-0';
      else {
        const ratio = v / maxAbs;
        cls = ratio < 0.25 ? 'hm-1' : ratio < 0.5 ? 'hm-2' : ratio < 0.75 ? 'hm-3' : 'hm-4';
      }
      const label = m.replace('/', '<br>');
      return `<div class="hm-cell ${cls}" title="${m}: ${fmtR(v)}">
        <div class="hm-lbl">${label}</div>
        <div class="hm-val">${v>=0?'+':''}${fmt(v/1000,1)}k</div>
      </div>`;
    }).join('');
  }

  const ROW = (label, comb, vol, custo, venda, liq, valLiq, isMes, isTotal) => {
    const liqCor = liq > 0 ? 'var(--green)' : liq < 0 ? 'var(--red)' : 'var(--muted)';
    const fw = isTotal ? 600 : 400;
    return `<div style="display:flex;align-items:center;gap:12px;padding:${isTotal?'9px':'7px'} 0;
      border-bottom:1px solid var(--border);
      ${isTotal?'border-top:2px solid var(--border-md);background:var(--bg);':''}">
      <span style="width:64px;font-family:'DM Mono',monospace;font-size:12px;
        font-weight:${isTotal?700:isMes?600:400};
        color:${isMes||isTotal?'var(--text)':'transparent'}">${label}</span>
      <span style="flex:1;font-size:12px;color:${isTotal?'var(--text)':'var(--muted)'};font-weight:${fw}">${esc(comb)}</span>
      <span style="font-family:'DM Mono',monospace;font-size:12px;min-width:100px;text-align:right;font-weight:${fw};color:var(--accent)">${fmt(vol,0)} L</span>
      <span style="font-family:'DM Mono',monospace;font-size:11px;min-width:76px;text-align:right;color:var(--muted)">${custo>0?fmtR(custo):'—'}</span>
      <span style="font-family:'DM Mono',monospace;font-size:11px;min-width:76px;text-align:right;color:var(--muted)">${venda>0?fmtR(venda):'—'}</span>
      <span style="font-family:'DM Mono',monospace;font-size:12px;min-width:76px;text-align:right;font-weight:${fw};color:${liqCor}">${liq!==0?fmtR(liq):'—'}</span>
      <span style="font-family:'DM Mono',monospace;font-size:12px;min-width:110px;text-align:right;font-weight:${fw};color:${liqCor}">${valLiq!==0?fmtR(valLiq):'—'}</span>
    </div>`;
  };

  document.getElementById('histRows').innerHTML = Object.entries(byPeriodo).reverse().map(([mes,linhas])=>{
    const totVol    = linhas.reduce((s,l)=>s+Number(l.volume_vendido), 0);
    const totValLiq = linhas.reduce((s,l)=>s+Number(l.valor_liquido),  0);
    const totCusto  = linhas.reduce((s,l)=>s+Number(l.custo_medio)*Number(l.volume_vendido), 0);
    const totVenda  = linhas.reduce((s,l)=>s+Number(l.preco_medio)*Number(l.volume_vendido), 0);
    const custoMed  = totVol > 0 ? totCusto / totVol : 0;
    const vendaMed  = totVol > 0 ? totVenda / totVol : 0;
    const liqMed    = vendaMed - custoMed;

    return linhas.map((l,i) => ROW(
      i===0 ? l.mes : '',
      l.combustivel,
      Number(l.volume_vendido),
      Number(l.custo_medio),
      Number(l.preco_medio),
      Number(l.liquido_litro),
      Number(l.valor_liquido),
      i===0, false
    )).join('') + ROW(
      mes, 'TOTAL DO MÊS', totVol, custoMed, vendaMed, liqMed, totValLiq, false, true
    );
  }).join('');
}

// ─── Caixa ────────────────────────────────────────────────────────────────────
const PGTO_COLORS = ['#22C55E','#16A34A','#F59E0B','#0F172A','#EF4444','#7C3AED','#F97316','#0EA5E9'];
const turnoDetailCache = {};

function countUp(el, target, prefix, suffix, decimals) {
  const duration = 700, step = 16;
  const inc = target / (duration / step);
  let cur = 0;
  const f = v => prefix + (decimals ? v.toFixed(decimals).replace('.',',') : Math.round(v).toLocaleString('pt-BR')) + suffix;
  const timer = setInterval(() => {
    cur = Math.min(cur + inc, target);
    el.textContent = f(cur);
    if (cur >= target) clearInterval(timer);
  }, step);
}

async function loadCaixa() {
  if (!state.clienteId) return;
  const dateEl = document.getElementById('selCaixaData');
  const data = dateEl.value || new Date().toISOString().slice(0,10);
  dateEl.value = data;

  document.getElementById('caixaHero').style.display = 'none';
  document.getElementById('turnosGrid').innerHTML = '<div class="loading-row"><span class="spinner"></span>Carregando...</div>';
  document.getElementById('rankingGrid').innerHTML = '<div class="loading-row">—</div>';
  document.getElementById('pagamentosGrid').innerHTML = '<div class="loading-row">—</div>';

  try {
    const j = await api(`/clientes/${state.clienteId}/caixa?data=${data}`);
    renderCaixa(j);
  } catch(e) {
    document.getElementById('turnosGrid').innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}

function renderCaixa(d) {
  const { turnos, pagamentos, ranking } = d;
  const totalVendas = turnos.reduce((s,t) => s + Number(t.total_vendas), 0);
  const totalCmdas  = turnos.reduce((s,t) => s + Number(t.comandas), 0);
  const totalFalta  = turnos.reduce((s,t) => s + Number(t.falta), 0);
  const totalSobra  = turnos.reduce((s,t) => s + Number(t.sobra), 0);
  const saldo       = totalSobra - totalFalta;
  const saldoPos    = saldo >= 0;

  // ── Hero bar ──
  const hero = document.getElementById('caixaHero');
  hero.style.display = '';
  document.getElementById('caixaHeroVal').textContent = 'R$ ' + fmt(totalVendas, 2);
  document.getElementById('caixaHeroSub').textContent = `${d.data.split('-').reverse().join('/')} · ${turnos.length} turno(s) · ${totalCmdas} comandas`;
  document.getElementById('caixaHeroKpis').innerHTML = [
    { label:'Comandas',    val: totalCmdas, unit:'' },
    { label:'Turnos',      val: turnos.length, unit:'' },
    { label: saldoPos ? '✓ Sobra' : '✗ Falta', val: 'R$ '+fmt(Math.abs(saldo),2), unit:'', raw:true,
      color: saldoPos ? '#4ade80' : '#f87171' },
  ].map(k => `<div class="caixa-hero-kpi">
    <div class="caixa-hero-kpi-label">${k.label}</div>
    <div class="caixa-hero-kpi-val" style="${k.color?'color:'+k.color:''}">${k.raw ? k.val : k.val}</div>
  </div>`).join('');

  document.getElementById('caixaStatusBadge').textContent = '';

  // ── Turnos ──
  document.getElementById('badgeTurnos').textContent = turnos.length;
  if (!turnos.length) {
    document.getElementById('turnosGrid').innerHTML = emptyStateHtml(
      `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="22" stroke="currentColor" stroke-width="3"/><path d="M32 18v14l8 8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
      'Sem turnos nesta data',
      'Nenhum caixa foi aberto para a data selecionada.'
    );
  } else {
    document.getElementById('turnosGrid').innerHTML = turnos.map(t => {
      const aberto = Number(t.cxastatus) === 0;
      const saldoT = Number(t.sobra) - Number(t.falta);
      const initials = (t.cxaresponsavel||'?').substring(0,2).toUpperCase();
      return `<div class="turno-card ${aberto?'aberto':'fechado'}" id="turno-${t.cxanumero}">
        <div class="turno-header" onclick="toggleTurno(${t.cxanumero})">
          <div class="turno-header-left">
            <div class="turno-avatar">${initials}</div>
            <div>
              <div class="turno-name">${esc(t.cxaresponsavel||'Sem responsável')}</div>
              <div class="turno-time">${t.hora_ini} → ${t.hora_fim||'Em andamento'} &nbsp;·&nbsp; <span class="tag ${aberto?'tag-green':'tag-gray'}" style="font-size:10px;padding:1px 6px">${aberto?'Aberto':'Fechado'}</span></div>
            </div>
          </div>
          <div class="turno-header-right">
            <div class="turno-kpi">
              <div class="turno-kpi-label">Vendas</div>
              <div class="turno-kpi-val" style="color:var(--accent)">R$ ${fmt(t.total_vendas,2)}</div>
            </div>
            <div class="turno-kpi">
              <div class="turno-kpi-label">Comandas</div>
              <div class="turno-kpi-val">${t.comandas}</div>
            </div>
            <div class="turno-kpi">
              <div class="turno-kpi-label">${saldoT>=0?'Sobra':'Falta'}</div>
              <div class="turno-kpi-val" style="color:${saldoT>=0?'var(--green)':'var(--red)'}">R$ ${fmt(Math.abs(saldoT),2)}</div>
            </div>
            <div class="turno-chevron">▼</div>
          </div>
        </div>
        <div class="turno-detail" id="turno-detail-${t.cxanumero}">
          <div class="turno-detail-inner">
            <div class="detail-loading"><span class="spinner"></span>Carregando detalhes...</div>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  // ── Ranking ──
  if (!ranking.length) {
    document.getElementById('rankingGrid').innerHTML = '<div class="empty">Sem dados</div>';
  } else {
    const maxVal = Math.max(...ranking.map(r => Number(r.total_vendido)));
    document.getElementById('rankingGrid').innerHTML = ranking.map((r, i) => {
      const pct    = maxVal > 0 ? Math.round(Number(r.total_vendido)/maxVal*100) : 0;
      const posCls = i===0?'top1':i===1?'top2':i===2?'top3':'';
      return `<div class="rank-row">
        <div class="rank-pos ${posCls}">${i+1}</div>
        <div class="rank-info">
          <div class="rank-name">${esc(r.frentista)}</div>
          <div class="rank-sub">${r.comandas} comandas · ${r.bicos_atendidos} bico(s)</div>
        </div>
        <div class="rank-bar-wrap"><div class="rank-bar" style="width:0%" data-pct="${pct}"></div></div>
        <div class="rank-val">R$ ${fmt(r.total_vendido,2)}</div>
      </div>`;
    }).join('');
    setTimeout(() => document.querySelectorAll('.rank-bar').forEach(b => b.style.width = b.dataset.pct+'%'), 50);
  }

  // ── Pagamentos ──
  if (!pagamentos.length) {
    document.getElementById('pagamentosGrid').innerHTML = '<div class="empty">Sem dados</div>';
  } else {
    const totPgto = pagamentos.reduce((s,p) => s+Number(p.total), 0);
    document.getElementById('pagamentosGrid').innerHTML = pagamentos.map((p,i) => {
      const pct   = totPgto > 0 ? Math.round(Number(p.total)/totPgto*100) : 0;
      const color = PGTO_COLORS[i % PGTO_COLORS.length];
      return `<div class="pgto-row">
        <div class="pgto-label">${esc(p.forma)}</div>
        <div class="pgto-bar-wrap"><div class="pgto-bar" style="width:0%;background:${color}" data-pct="${pct}"></div></div>
        <div class="pgto-pct">${pct}%</div>
        <div class="pgto-val">R$ ${fmt(p.total,2)} <span style="font-size:11px;color:var(--hint)">(${p.qtd})</span></div>
      </div>`;
    }).join('');
    setTimeout(() => document.querySelectorAll('.pgto-bar').forEach(b => b.style.width = b.dataset.pct+'%'), 50);

    // Waterfall / bar chart de pagamentos
    const wcEl = document.getElementById('cCaixaWaterfall');
    if (wcEl) {
      killChart('caixaWaterfall');
      const pgSorted = [...pagamentos].sort((a,b) => Number(b.total) - Number(a.total));
      charts['caixaWaterfall'] = new Chart(wcEl, {
        type: 'bar',
        data: {
          labels: pgSorted.map(p => p.forma),
          datasets: [{
            label: 'Valor (R$)',
            data: pgSorted.map(p => Number(p.total)),
            backgroundColor: PGTO_COLORS.map(c => c + 'cc'),
            borderColor: PGTO_COLORS,
            borderWidth: 1.5,
            borderRadius: 5,
            borderSkipped: false
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => ` R$ ${fmt(ctx.raw,2)}` } }
          },
          scales: {
            x: { ticks: { callback: v => 'R$'+fmt(v,0), font:{size:10} }, grid:{color:'rgba(0,0,0,0.04)'} },
            y: { ticks: { font:{size:11} } }
          }
        }
      });
    }
  }
}

async function toggleTurno(cxanumero) {
  const card   = document.getElementById(`turno-${cxanumero}`);
  const detail = document.getElementById(`turno-detail-${cxanumero}`);
  const isOpen = card.classList.contains('expanded');

  // Fecha todos os outros
  document.querySelectorAll('.turno-card.expanded').forEach(c => c.classList.remove('expanded'));

  if (isOpen) return;

  card.classList.add('expanded');

  // Se já carregou, não recarrega
  if (turnoDetailCache[cxanumero]) {
    renderTurnoDetail(detail, turnoDetailCache[cxanumero]);
    return;
  }

  detail.querySelector('.turno-detail-inner').innerHTML =
    '<div class="detail-loading"><span class="spinner"></span>Carregando detalhes...</div>';

  try {
    const j = await api(`/clientes/${state.clienteId}/caixa/turno/${cxanumero}`);
    turnoDetailCache[cxanumero] = j;
    renderTurnoDetail(detail, j);
  } catch(e) {
    detail.querySelector('.turno-detail-inner').innerHTML =
      `<div class="detail-empty">Erro ao carregar: ${esc(e.message)}</div>`;
  }
}

function renderTurnoDetail(detailEl, d) {
  const { pagamentos, prazo, cartoes, sangrias, produtos } = d;
  const totPgto = pagamentos.reduce((s,p) => s+Number(p.total), 0);

  const secPgto = `<div class="detail-section">
    <div class="detail-section-title"><span>💳</span>Formas de pagamento</div>
    ${pagamentos.length ? pagamentos.map((p,i) => {
      const pct = totPgto>0 ? Math.round(Number(p.total)/totPgto*100) : 0;
      return `<div class="detail-pgto-row">
        <div class="detail-pgto-label">${esc(p.forma)}</div>
        <div class="detail-pgto-bar-wrap"><div class="detail-pgto-bar" style="width:${pct}%;background:${PGTO_COLORS[i%PGTO_COLORS.length]}"></div></div>
        <div class="detail-pgto-val">R$ ${fmt(p.total,2)} <span style="color:var(--hint)">(${p.qtd})</span></div>
      </div>`;
    }).join('') : '<div class="detail-empty">Sem pagamentos</div>'}
  </div>`;

  const secPrazo = prazo.length ? `<div class="detail-section">
    <div class="detail-section-title"><span>📋</span>A prazo / Mensal</div>
    ${prazo.map(p => `<div class="detail-prazo-row">
      <div class="detail-prazo-nome">${esc(p.cliente)}</div>
      <div class="detail-prazo-qtd">${p.qtd}x</div>
      <div class="detail-prazo-val">R$ ${fmt(p.total,2)}</div>
    </div>`).join('')}
  </div>` : '';

  const secCartoes = cartoes.length ? `<div class="detail-section">
    <div class="detail-section-title"><span>💳</span>Cartões TEF</div>
    ${cartoes.map(c => `<div class="detail-prazo-row">
      <div class="detail-prazo-nome">${esc(c.tipo)}</div>
      <div class="detail-prazo-qtd">${c.qtd}x</div>
      <div class="detail-prazo-val">R$ ${fmt(c.total,2)}</div>
    </div>`).join('')}
  </div>` : '';

  const secSangrias = sangrias.length ? `<div class="detail-section">
    <div class="detail-section-title"><span>💸</span>Sangrias</div>
    ${sangrias.map(s => `<div class="detail-prazo-row">
      <div class="detail-prazo-nome">${esc(s.obs)} <span style="color:var(--muted);font-size:11px">${s.hora}</span></div>
      <div class="detail-prazo-val" style="color:var(--red)">− R$ ${fmt(s.valor,2)}</div>
    </div>`).join('')}
  </div>` : '';

  const secProd = `<div class="detail-section full">
    <div class="detail-section-title"><span>⛽</span>Produtos vendidos</div>
    ${produtos.length ? produtos.map(p => `<div class="detail-prod-row">
      <div class="detail-prod-name">${esc(p.produto)}</div>
      <div class="detail-prod-qtd">${fmt(p.qtd,2)} L</div>
      <div class="detail-prod-val">R$ ${fmt(p.total,2)}</div>
    </div>`).join('') : '<div class="detail-empty">Sem dados</div>'}
  </div>`;

  detailEl.querySelector('.turno-detail-inner').innerHTML =
    secPgto + (secPrazo||secCartoes ? (secPrazo||'') + (secCartoes||'') : '') + (secSangrias||'') + secProd;
  setTimeout(() => detailEl.querySelectorAll('.detail-pgto-bar').forEach(b => b.style.transition='width 0.5s ease'), 10);
}

// ─── Admin ────────────────────────────────────────────────────────────────────
async function apiAdmin(method, path, body) {
  const token = localStorage.getItem(TK);
  const opts  = { method, headers: { 'x-token': token, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(API + path, opts);
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

async function renderAdmin() {
  try {
    const [users, clients] = await Promise.all([
      apiAdmin('GET', '/admin/users'),
      apiAdmin('GET', '/admin/clients'),
    ]);

    document.getElementById('badgeUsers').textContent   = users.data.length;
    document.getElementById('badgeClients').textContent = clients.data.length;

    document.getElementById('tbodyUsers').innerHTML = users.data.map(u => `
      <tr>
        <td>${esc(u.username)}</td>
        <td><span class="tag ${u.role==='admin'?'tag-green':'tag-blue'}">${u.role}</span></td>
        <td style="text-align:center">
          <button class="btn" style="font-size:11px;padding:3px 8px;color:var(--red)"
            onclick="adminDeleteUser('${esc(u.username)}')">Remover</button>
        </td>
      </tr>`).join('');

    document.getElementById('tbodyClients').innerHTML = clients.data.map(c => `
      <tr>
        <td class="mono">${esc(c.id)}</td>
        <td>${esc(c.nome)}</td>
        <td class="mono" style="color:var(--muted)">${esc(c.database)}</td>
        <td style="text-align:center">
          <button class="btn" style="font-size:11px;padding:3px 8px;color:var(--red)"
            onclick="adminDeleteClient('${esc(c.id)}','${esc(c.nome)}')">Remover</button>
        </td>
      </tr>`).join('');
  } catch(e) {
    console.error('Admin load error:', e);
  }
}

async function adminAddUser() {
  const errEl = document.getElementById('adminUserErr');
  errEl.textContent = '';
  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value;
  const role     = document.getElementById('newRole').value;
  if (!username || !password) { errEl.textContent = 'Preencha usuário e senha.'; return; }
  try {
    await apiAdmin('POST', '/admin/users', { username, password, role });
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
    renderAdmin();
  } catch(e) { errEl.textContent = e.message; }
}

async function adminDeleteUser(username) {
  if (!confirm(`Remover usuário "${username}"?`)) return;
  try {
    await apiAdmin('DELETE', `/admin/users/${encodeURIComponent(username)}`);
    renderAdmin();
  } catch(e) { alert(e.message); }
}

async function adminAddClient() {
  const errEl = document.getElementById('adminClientErr');
  errEl.textContent = '';
  const body = {
    id:      document.getElementById('ncId').value.trim(),
    nome:    document.getElementById('ncNome').value.trim(),
    database:document.getElementById('ncDb').value.trim(),
    empresa: document.getElementById('ncEmpresa').value.trim(),
    host:    document.getElementById('ncHost').value.trim(),
    user:    document.getElementById('ncUser').value.trim(),
    password:document.getElementById('ncPass').value,
  };
  if (!body.id || !body.nome || !body.database || !body.empresa)
    { errEl.textContent = 'Preencha ID, nome, banco e empresa.'; return; }
  try {
    await apiAdmin('POST', '/admin/clients', body);
    ['ncId','ncNome','ncDb','ncEmpresa','ncHost','ncUser','ncPass'].forEach(id => {
      document.getElementById(id).value = '';
    });
    renderAdmin();
    // Recarrega lista de clientes no seletor
    const sel = document.getElementById('selCliente');
    const clients = await apiAdmin('GET', '/admin/clients');
    sel.innerHTML = '<option value="">— Selecione o cliente —</option>' +
      clients.data.map(c=>`<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join('');
  } catch(e) { errEl.textContent = e.message; }
}

async function adminDeleteClient(id, nome) {
  if (!confirm(`Remover cliente "${nome}" (ID: ${id})?\nO posto será removido da lista imediatamente.`)) return;
  try {
    await apiAdmin('DELETE', `/admin/clients/${encodeURIComponent(id)}`);
    renderAdmin();
    // Remove do seletor
    const opt = document.querySelector(`#selCliente option[value="${id}"]`);
    if (opt) opt.remove();
  } catch(e) { alert(e.message); }
}

// ─── Dark Mode ────────────────────────────────────────────────────────────────
function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('fuelflow_dark', isDark ? '1' : '0');
  const cb = document.getElementById('btnDarkMode');
  if (cb) cb.checked = isDark;
}
function applyDarkMode() {
  // Default to dark mode unless user explicitly chose light (saved '0')
  const isDark = localStorage.getItem('fuelflow_dark') !== '0';
  if (isDark) {
    document.body.classList.add('dark');
    const cb = document.getElementById('btnDarkMode');
    if (cb) cb.checked = true;
  }
}
applyDarkMode();

// ─── Empty state helper ────────────────────────────────────────────────────
function emptyStateHtml(icon, title, desc = '') {
  return `<div class="empty-state">
    <div class="empty-state-icon">${icon}</div>
    <div class="empty-state-title">${title}</div>
    ${desc ? `<div class="empty-state-desc">${desc}</div>` : ''}
  </div>`;
}

// ─── Animate KPI counters ─────────────────────────────────────────────────
function animateKpiValues(section) {
  const root = section || document;
  root.querySelectorAll('.kpi-value, .hero-kpi-value, .ov-kpi-value').forEach(el => {
    if (el.dataset.animated || el.querySelector('canvas,svg')) return;
    const text = el.textContent.trim();
    const prefixM = text.match(/^([^0-9\-]*)/);
    const suffixM = text.match(/([kKmM%LRl$\s]*[a-zA-Z%]*)$/);
    const prefix  = prefixM ? prefixM[1] : '';
    let   suffix  = suffixM ? suffixM[1].trimStart() : '';
    const inner   = text.slice(prefix.length, suffix ? text.length - suffix.length : undefined);
    const num     = parseFloat(inner.replace(/\./g, '').replace(',', '.'));
    if (isNaN(num) || num === 0) return;
    const decimals = inner.includes(',') ? (inner.split(',')[1]?.replace(suffix,'').length || 0) : 0;
    el.dataset.animated = '1';
    countUp(el, num, prefix, suffix ? ' ' + suffix.trim() : '', decimals);
  });
}

// ─── Export CSV ───────────────────────────────────────────────────────────────
function exportTableCSV(tbodyId, filename) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const table = tbody.closest('table');
  const headers = table ? [...table.querySelectorAll('thead th')].map(th => th.textContent.trim()) : [];
  const rows = [...tbody.querySelectorAll('tr')].map(tr =>
    [...tr.querySelectorAll('td')].map(td => {
      const v = td.textContent.trim().replace(/\s+/g, ' ');
      return `"${v.replace(/"/g, '""')}"`;
    }).join(';')
  );
  const csvContent = [headers.map(h => `"${h}"`).join(';'), ...rows].join('\n');
  const bom = '﻿'; // UTF-8 BOM for Excel
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${state.periodo?.replace('/','_') || 'export'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast(`CSV exportado: ${a.download}`);
}

// ─── Caixa Auto-Refresh ───────────────────────────────────────────────────────
let _caixaAutoInterval = null;
function toggleCaixaAutoRefresh() {
  const btn = document.getElementById('btnCaixaAuto');
  if (_caixaAutoInterval) {
    clearInterval(_caixaAutoInterval);
    _caixaAutoInterval = null;
    btn.textContent = '⏱ Auto';
    btn.style.color = 'rgba(255,255,255,0.6)';
    btn.style.borderColor = '';
    toast('Auto-atualização desativada');
  } else {
    _caixaAutoInterval = setInterval(() => {
      const activeTab = document.querySelector('#tab-caixa.active');
      if (activeTab) loadCaixa();
    }, 60000);
    btn.textContent = '⏱ Ativo';
    btn.style.color = '#4ade80';
    btn.style.borderColor = 'rgba(74,222,128,0.4)';
    toast('Auto-atualização: a cada 60s');
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────
if (localStorage.getItem(TK)) { showApp(); }
else { document.getElementById('loginScreen').style.display = ''; }

// ════════════════════════════════════════════════════════════════════
// PRODUTOS
// ════════════════════════════════════════════════════════════════════
let _prodData = [];

async function loadProdutos() {
  if (!state.clienteId || !state.periodo) {
    document.getElementById('prodTbody').innerHTML = '<tr><td colspan="10" class="empty"><div class="empty-icon">📦</div>Selecione um cliente e período.</td></tr>';
    return;
  }
  const _ck = `prod:${state.clienteId}:${state.periodo}`;
  if (_tabCache[_ck]) {
    const d = _tabCache[_ck];
    _prodData = d.produtos || [];
    document.getElementById('prodTotal').textContent   = fmt(d.totalProdutos);
    document.getElementById('prodFat').textContent     = fmtR(d.totalFaturamento);
    document.getElementById('prodComEst').textContent  = fmt(d.comEstoque);
    document.getElementById('prodSemEst').textContent  = fmt(d.semEstoque);
    document.getElementById('prodRankPeriodo').textContent = state.periodo;
    renderProdTable(_prodData); renderProdRanking(_prodData); renderProdPrevisao(_prodData);
    return;
  }
  document.getElementById('prodTbody').innerHTML = `<table style="width:100%"><tbody>${skeletonRows(10)}</tbody></table>`;
  document.getElementById('prodRanking').innerHTML  = '<div class="loading-row"><span class="spinner"></span></div>';
  document.getElementById('prodPrevisao').innerHTML = '<div class="loading-row"><span class="spinner"></span></div>';

  try {
    const d = await api(`/clientes/${state.clienteId}/produtos?periodo=${state.periodo}`);
    _tabCache[_ck] = d;
    _prodData = d.produtos || [];
    const { totalProdutos, totalFaturamento, comEstoque, semEstoque } = d;

    // KPIs
    document.getElementById('prodTotal').textContent   = fmt(totalProdutos);
    document.getElementById('prodFat').textContent     = fmtR(totalFaturamento);
    document.getElementById('prodComEst').textContent  = fmt(comEstoque);
    document.getElementById('prodSemEst').textContent  = fmt(semEstoque);
    document.getElementById('prodRankPeriodo').textContent = state.periodo;

    renderProdTable(_prodData);
    renderProdRanking(_prodData);
    renderProdPrevisao(_prodData);
  } catch(e) {
    document.getElementById('prodTbody').innerHTML = `<tr><td colspan="10" class="empty" style="color:var(--red)">${e.message}</td></tr>`;
  }
}

function renderProdTable(rows) {
  const tbody = document.getElementById('prodTbody');
  document.getElementById('prodCount').textContent = `${rows.length} produtos`;
  if (!rows.length) { tbody.innerHTML = '<tr><td colspan="10" class="empty">Nenhum produto encontrado.</td></tr>'; return; }
  tbody.innerHTML = rows.map((p, i) => {
    const mkpCls   = p.mkp   >= 30 ? 'color:var(--green)' : p.mkp < 10 ? 'color:var(--red)' : '';
    const margCls  = p.margem>= 20 ? 'color:var(--green)' : p.margem < 8 ? 'color:var(--red)' : '';
    const estCls   = p.estoque <= 0 ? 'color:var(--red)' : '';
    return `<tr>
      <td style="color:var(--muted);font-size:11px">${i+1}</td>
      <td style="font-weight:500;max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${p.descricao}">${p.descricao}</td>
      <td style="color:var(--muted)">${p.unidade}</td>
      <td class="mono" style="text-align:right">${fmtR(p.custo)}</td>
      <td class="mono" style="text-align:right;font-weight:600">${fmtR(p.preco)}</td>
      <td class="mono" style="text-align:right;${estCls}">${fmtN(p.estoque,3)}</td>
      <td class="mono" style="text-align:right;${mkpCls}">${p.mkp.toFixed(1)}%</td>
      <td class="mono" style="text-align:right;${margCls}">${p.margem.toFixed(1)}%</td>
      <td class="mono" style="text-align:right">${p.qtd_vendida > 0 ? fmtN(p.qtd_vendida,3) : '<span style="color:var(--hint)">—</span>'}</td>
      <td class="mono" style="text-align:right">${p.faturamento > 0 ? fmtR(p.faturamento) : '<span style="color:var(--hint)">—</span>'}</td>
    </tr>`;
  }).join('');
}

function filterProdutos() {
  const q = document.getElementById('prodSearch').value.toLowerCase();
  const filtered = q ? _prodData.filter(p => p.descricao.toLowerCase().includes(q)) : _prodData;
  renderProdTable(filtered);
}

function renderProdRanking(rows) {
  const top = rows.filter(p => p.qtd_vendida > 0).slice(0, 10);
  const el  = document.getElementById('prodRanking');
  if (!top.length) { el.innerHTML = '<div class="empty" style="padding:20px 0">Sem vendas no período.</div>'; return; }
  const max = top[0].qtd_vendida;
  el.innerHTML = top.map((p, i) => `
    <div class="prod-rank-row">
      <div class="prod-rank-pos${i<3?' r'+(i+1):''}">${i+1}</div>
      <div style="flex:1;min-width:0">
        <div class="prod-rank-name">${p.descricao}</div>
        <div class="prod-rank-sub">${fmtR(p.faturamento)}</div>
      </div>
      <div class="prod-rank-bar-wrap"><div class="prod-rank-bar" style="width:${(p.qtd_vendida/max*100).toFixed(1)}%"></div></div>
      <div class="prod-rank-val">${fmtN(p.qtd_vendida,3)} ${p.unidade}</div>
    </div>
  `).join('');
}

function renderProdPrevisao(rows) {
  const top = rows.filter(p => p.prev_qtd > 0).slice(0, 10);
  const el  = document.getElementById('prodPrevisao');
  if (!top.length) { el.innerHTML = '<div class="empty" style="padding:20px 0">Histórico insuficiente para previsão.</div>'; return; }
  el.innerHTML = top.map(p => {
    const diff = p.qtd_vendida > 0 ? ((p.prev_qtd - p.qtd_vendida) / p.qtd_vendida * 100).toFixed(1) : null;
    const badge = diff !== null ? `<span class="prev-badge">${diff > 0 ? '▲' : '▼'} ${Math.abs(diff)}%</span>` : '';
    return `<div class="prev-row">
      <div class="prev-name">${p.descricao}${badge}</div>
      <div class="prev-qtd">${fmtN(p.prev_qtd,1)} ${p.unidade}</div>
      <div class="prev-val">${fmtR(p.prev_fat)}</div>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════════════════════════════════
// PAGAMENTOS
// ════════════════════════════════════════════════════════════════════
let _pagData = { pagos: [], pendentes: [] };
let _pagTab  = 'pagos';

async function loadPagamentos() {
  if (!state.clienteId || !state.periodo) {
    document.getElementById('pagTbody').innerHTML = '<tr><td colspan="9" class="empty"><div class="empty-icon">💳</div>Selecione um cliente e período.</td></tr>';
    return;
  }
  const _ck = `pag:${state.clienteId}:${state.periodo}`;
  if (_tabCache[_ck]) {
    _pagData = _tabCache[_ck];
    document.getElementById('pagTotalPago').textContent     = fmtR(_pagData.totalPago);
    document.getElementById('pagTotalCaixa').textContent    = fmtR(_pagData.totalCaixa);
    document.getElementById('pagTotalAgenda').textContent   = fmtR(_pagData.totalAgenda);
    document.getElementById('pagTotalPendente').textContent = fmtR(_pagData.totalPendente);
    renderPagDre(_pagData.porDre); renderPagTipos(_pagData); renderPagTable(_pagTab);
    return;
  }
  ['pagDre','pagTipos'].forEach(id => {
    document.getElementById(id).innerHTML = '<div class="loading-row"><span class="spinner"></span></div>';
  });
  document.getElementById('pagTbody').innerHTML = `<tbody>${skeletonRows(9)}</tbody>`;

  try {
    const d = await api(`/clientes/${state.clienteId}/pagamentos?periodo=${state.periodo}`);
    _tabCache[_ck] = d;
    _pagData = d;

    // KPIs
    document.getElementById('pagTotalPago').textContent     = fmtR(d.totalPago);
    document.getElementById('pagTotalCaixa').textContent    = fmtR(d.totalCaixa);
    document.getElementById('pagTotalAgenda').textContent   = fmtR(d.totalAgenda);
    document.getElementById('pagTotalPendente').textContent = fmtR(d.totalPendente);

    renderPagDre(d.porDre);
    renderPagTipos(d);
    renderPagTable(_pagTab);
  } catch(e) {
    document.getElementById('pagTbody').innerHTML = `<tr><td colspan="9" class="empty" style="color:var(--red)">${e.message}</td></tr>`;
  }
}

function renderPagDre(porDre) {
  const el = document.getElementById('pagDre');
  if (!porDre || !porDre.length) { el.innerHTML = '<div class="empty" style="padding:16px 0">Sem dados.</div>'; return; }
  const max = porDre[0].total;
  const todos = [...(_pagData.pagos||[]), ...(_pagData.pendentes||[])];

  el.innerHTML = porDre.slice(0, 15).map((d, i) => {
    const itens = todos.filter(r => r.dre_titulo === d.titulo);
    const itemsHtml = itens.map(r => {
      const tipoCls = r.tipo === 'Caixa' ? 'tag-caixa' : r.tipo === 'Agenda' ? 'tag-agenda' : 'tag-pendente';
      const dataRef = r.pagamento || r.vencimento;
      return `<div class="dre-item">
        <div class="dre-item-doc" title="${r.documento||''}">${r.documento||'—'}</div>
        <div class="dre-item-forn" title="${r.fornecedor}">${r.fornecedor}</div>
        <div class="dre-item-date">${dataRef ? new Date(dataRef).toLocaleDateString('pt-BR') : '—'}</div>
        <div class="dre-item-tipo"><span class="tag ${tipoCls}" style="font-size:10px">${r.tipo}</span></div>
        <div class="dre-item-val">${fmtR(Number(r.valor))}</div>
      </div>`;
    }).join('');

    return `<div class="dre-group" id="dreGroup${i}">
      <div class="dre-row" onclick="toggleDreGroup(${i})">
        <div class="dre-chevron">▼</div>
        <div class="dre-name">${d.titulo} <span class="dre-count">(${d.itens} lançamentos)</span></div>
        <div class="dre-bar-wrap"><div class="dre-bar" style="width:${(d.total/max*100).toFixed(1)}%"></div></div>
        <div class="dre-val">${fmtR(d.total)}</div>
      </div>
      <div class="dre-detail">
        <div class="dre-detail-inner">
          <div class="dre-item dre-item-head">
            <span>Documento</span><span>Fornecedor</span><span style="text-align:center">Data</span><span style="text-align:center">Tipo</span><span style="text-align:right">Valor</span>
          </div>
          ${itemsHtml}
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleDreGroup(i) {
  const el = document.getElementById('dreGroup' + i);
  el.classList.toggle('expanded');
}

function renderPagTipos(d) {
  const total = d.totalPago + d.totalPendente || 1;
  const tipos = [
    { label:'Pago no Caixa',    val:d.totalCaixa,    color:'var(--accent)',    dot:'var(--accent)' },
    { label:'Pago na Agenda',   val:d.totalAgenda,   color:'var(--blue-tx)',   dot:'#3B82F6' },
    { label:'Pendente',         val:d.totalPendente, color:'var(--amber-raw)', dot:'var(--amber-raw)' },
  ];
  document.getElementById('pagTipos').innerHTML = tipos.map(t => `
    <div class="tipo-row">
      <div class="tipo-dot" style="background:${t.dot}"></div>
      <div class="tipo-label">${t.label}</div>
      <div class="tipo-bar-wrap"><div class="tipo-bar" style="width:${(t.val/total*100).toFixed(1)}%;background:${t.color}"></div></div>
      <div class="tipo-pct">${(t.val/total*100).toFixed(1)}%</div>
      <div class="tipo-val" style="color:${t.color}">${fmtR(t.val)}</div>
    </div>
  `).join('');
}

function showPagTab(tab) {
  _pagTab = tab;
  ['pagos','pendentes'].forEach(t => {
    const btn = document.getElementById('pagTab' + t.charAt(0).toUpperCase() + t.slice(1));
    const active = t === tab;
    btn.style.color = active ? 'var(--accent)' : 'var(--muted)';
    btn.style.fontWeight = active ? '600' : '500';
    btn.style.borderBottomColor = active ? 'var(--accent)' : 'transparent';
  });
  renderPagTable(tab);
}

// ════════════════════════════════════════════════════════════════════
// RECEITAS
// ════════════════════════════════════════════════════════════════════
let _recData = { recebidos: [], pendentes: [] };
let _recSelectedCliente = null;

const _debouncedRecClientes = debounce(() => renderRecClienteList());
const _debouncedRecDocs     = debounce(() => renderRecDocs());

async function loadReceitas() {
  if (!state.clienteId) {
    document.getElementById('recDocTbody').innerHTML = '<tr><td colspan="8" class="empty"><div class="empty-icon">💰</div>Selecione um cliente.</td></tr>';
    document.getElementById('recClienteList').innerHTML = '<div class="empty" style="padding:16px;font-size:12px">Selecione um cliente.</div>';
    return;
  }
  const _ck = `rec:${state.clienteId}`;
  if (_tabCache[_ck]) {
    _recData = _tabCache[_ck];
    _recSelectedCliente = null;
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const pend = _recData.pendentes || [];
    let vencido = 0, aVencer = 0;
    pend.forEach(r => { const v = Number(r.valor); if (r.vencimento && new Date(r.vencimento) < hoje) vencido += v; else aVencer += v; });
    document.getElementById('recKpiVencido').textContent = fmtR(vencido);
    document.getElementById('recKpiAVencer').textContent = fmtR(aVencer);
    document.getElementById('recKpiTotal').textContent   = fmtR(vencido + aVencer);
    renderRecClienteList(); renderRecDocs();
    return;
  }
  document.getElementById('recClienteList').innerHTML = '<div class="loading-row"><span class="spinner"></span>Carregando...</div>';
  document.getElementById('recDocTbody').innerHTML = `<tbody>${skeletonRows(8)}</tbody>`;
  _recSelectedCliente = null;

  try {
    const d = await api(`/clientes/${state.clienteId}/receitas?periodo=${state.periodo}`);
    _tabCache[_ck] = d;
    _recData = d;

    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const pend = d.pendentes || [];
    let vencido = 0, aVencer = 0;
    pend.forEach(r => {
      const v = Number(r.valor);
      if (r.vencimento && new Date(r.vencimento) < hoje) vencido += v;
      else aVencer += v;
    });
    document.getElementById('recKpiVencido').textContent = fmtR(vencido);
    document.getElementById('recKpiAVencer').textContent = fmtR(aVencer);
    document.getElementById('recKpiTotal').textContent   = fmtR(vencido + aVencer);

    renderRecClienteList();
    renderRecDocs();
  } catch(e) {
    const msg = e.message.includes('não existe') || e.message.includes('does not exist')
      ? 'Tabela de recebimentos não encontrada neste banco de dados.'
      : e.message;
    document.getElementById('recClienteList').innerHTML = `<div class="empty" style="padding:16px;color:var(--muted);font-size:12px">${esc(msg)}</div>`;
    document.getElementById('recDocTbody').innerHTML    = `<tr><td colspan="8" class="empty" style="color:var(--red)">${esc(msg)}</td></tr>`;
  }
}

function renderRecClienteList() {
  const pend = _recData.pendentes || [];
  const q = (document.getElementById('recCliSearch')?.value || '').toLowerCase();
  const hoje = new Date(); hoje.setHours(0,0,0,0);

  const map = {};
  pend.forEach(r => {
    const nome = r.cliente || '—';
    if (!map[nome]) map[nome] = { total: 0, vencido: 0, count: 0 };
    const v = Number(r.valor);
    map[nome].total += v;
    map[nome].count++;
    if (r.vencimento && new Date(r.vencimento) < hoje) map[nome].vencido += v;
  });

  let clientes = Object.entries(map)
    .map(([nome, d]) => ({ nome, ...d }))
    .sort((a, b) => b.vencido - a.vencido || b.total - a.total);

  if (q) clientes = clientes.filter(c => c.nome.toLowerCase().includes(q));

  const countEl = document.getElementById('recCliCount');
  if (countEl) countEl.textContent = String(clientes.length);

  const el = document.getElementById('recClienteList');
  if (!clientes.length) {
    el.innerHTML = '<div class="empty" style="padding:16px;font-size:12px">Nenhum cliente com conta a receber.</div>';
    return;
  }

  el.innerHTML = clientes.map(c => {
    const isActive  = _recSelectedCliente === c.nome;
    const hasVencido = c.vencido > 0;
    const safeName  = c.nome.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return `<div class="rec-cli-item${isActive ? ' active' : ''}${hasVencido ? ' tem-vencido' : ''}" onclick="selectRecCliente('${safeName}')">
      <div class="rec-cli-nome" title="${esc(c.nome)}">${esc(c.nome)}</div>
      <div class="rec-cli-info">
        <span class="rec-cli-count">${c.count} doc${c.count !== 1 ? 's' : ''}</span>
        <span class="rec-cli-val">${fmtR(c.total)}</span>
      </div>
    </div>`;
  }).join('');
}

function selectRecCliente(nome) {
  _recSelectedCliente = _recSelectedCliente === nome ? null : nome;
  renderRecClienteList();
  renderRecDocs();
}

function renderRecDocs() {
  const pend = _recData.pendentes || [];
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const q = (document.getElementById('recDocSearch')?.value || '').toLowerCase();

  let rows = _recSelectedCliente
    ? pend.filter(r => (r.cliente || '—') === _recSelectedCliente)
    : [...pend];

  if (q) rows = rows.filter(r =>
    (r.documento || '').toLowerCase().includes(q) ||
    (r.cliente   || '').toLowerCase().includes(q)
  );

  rows.sort((a, b) => {
    const da = a.vencimento ? new Date(a.vencimento).getTime() : Infinity;
    const db = b.vencimento ? new Date(b.vencimento).getTime() : Infinity;
    return da - db;
  });

  const title    = document.getElementById('recDocTitle');
  const subtitle = document.getElementById('recDocSubtitle');
  const total    = rows.reduce((s, r) => s + Number(r.valor), 0);
  if (title)    title.textContent    = _recSelectedCliente || 'Todos os Clientes';
  if (subtitle) subtitle.textContent = `${rows.length} documento${rows.length !== 1 ? 's' : ''} · ${fmtR(total)}`;

  const countEl = document.getElementById('recDocCount');
  if (countEl) countEl.textContent = String(rows.length);

  const tbody = document.getElementById('recDocTbody');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">Nenhuma conta a receber.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(r => {
    const venc      = r.vencimento ? new Date(r.vencimento) : null;
    const isVencido = venc && venc < hoje;
    const rowCls    = isVencido ? ' class="rec-doc-row-vencido"' : '';
    const vencStr   = venc ? venc.toLocaleDateString('pt-BR') : '—';
    const emisStr   = r.emissao ? new Date(r.emissao).toLocaleDateString('pt-BR') : '—';
    return `<tr${rowCls}>
      <td style="font-size:12px;font-weight:500">${esc(r.documento || '—')}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px" title="${esc(r.cliente || '')}">${esc(r.cliente || '—')}</td>
      <td class="mono" style="text-align:right;font-size:11px">${emisStr}</td>
      <td class="mono" style="text-align:right;font-size:11px;font-weight:${isVencido ? '600' : '400'}">${vencStr}</td>
      <td class="mono" style="text-align:right;font-weight:600">${fmtR(Number(r.valor))}</td>
      <td class="mono" style="text-align:right;font-size:11px;color:var(--muted)">${Number(r.juro) > 0 ? fmtR(Number(r.juro)) : '—'}</td>
      <td class="mono" style="text-align:right;font-size:11px;color:var(--muted)">${Number(r.desconto) > 0 ? fmtR(Number(r.desconto)) : '—'}</td>
      <td style="text-align:right"><span class="tag ${isVencido ? 'tag-vencido' : 'tag-agenda'}" style="font-size:10px">${isVencido ? 'Vencido' : 'A Vencer'}</span></td>
    </tr>`;
  }).join('');
}

function exportRecCSV() {
  const pend  = _recData.pendentes || [];
  const hoje  = new Date(); hoje.setHours(0,0,0,0);
  const q     = (document.getElementById('recDocSearch')?.value || '').toLowerCase();
  let rows    = _recSelectedCliente
    ? pend.filter(r => (r.cliente || '—') === _recSelectedCliente)
    : [...pend];
  if (q) rows = rows.filter(r =>
    (r.documento || '').toLowerCase().includes(q) ||
    (r.cliente   || '').toLowerCase().includes(q)
  );
  if (!rows.length) return;
  const headers = ['Cliente','Documento','Emissao','Vencimento','Valor','Juros','Desconto','Status'];
  const body    = rows.map(r => {
    const venc      = r.vencimento ? new Date(r.vencimento) : null;
    const isVencido = venc && venc < hoje;
    return [
      r.cliente || '—', r.documento || '—',
      r.emissao    ? new Date(r.emissao).toLocaleDateString('pt-BR') : '—',
      venc         ? venc.toLocaleDateString('pt-BR') : '—',
      Number(r.valor).toFixed(2),
      Number(r.juro).toFixed(2),
      Number(r.desconto).toFixed(2),
      isVencido ? 'Vencido' : 'A Vencer',
    ];
  });
  const csv = '﻿' + [headers, ...body].map(row => row.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a   = document.createElement('a');
  a.href    = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8;' }));
  a.download = 'contas_a_receber.csv';
  a.click();
}

function renderPagTable(tab) {
  _pagTab = tab;
  let rows = [...(tab === 'pagos' ? (_pagData.pagos||[]) : (_pagData.pendentes||[]))];
  const tbody  = document.getElementById('pagTbody');

  // Search filter
  const q = (document.getElementById('pagSearch')?.value || '').toLowerCase();
  if (q) rows = rows.filter(r =>
    (r.documento  || '').toLowerCase().includes(q) ||
    (r.fornecedor || '').toLowerCase().includes(q) ||
    (r.dre_conta  || '').toLowerCase().includes(q) ||
    (r.dre_titulo || '').toLowerCase().includes(q)
  );

  // Sort
  const sort = document.getElementById('pagSort')?.value || '';
  const datVal = s => s ? new Date(s).getTime() : 0;
  if (sort === 'vencimento')   rows.sort((a,b) => datVal(a.vencimento) - datVal(b.vencimento));
  if (sort === 'pagamento')    rows.sort((a,b) => datVal(a.pagamento)  - datVal(b.pagamento));
  if (sort === 'valor_desc')   rows.sort((a,b) => Number(b.valor) - Number(a.valor));
  if (sort === 'valor_asc')    rows.sort((a,b) => Number(a.valor) - Number(b.valor));
  if (sort === 'fornecedor')   rows.sort((a,b) => (a.fornecedor||'').localeCompare(b.fornecedor||''));
  if (sort === 'dre')          rows.sort((a,b) => (a.dre_conta||'').localeCompare(b.dre_conta||''));
  if (sort === 'tipo')         rows.sort((a,b) => (a.tipo||'').localeCompare(b.tipo||''));

  // Badge count
  const countEl = document.getElementById('pagCount');
  if (countEl) countEl.textContent = `${rows.length} registro${rows.length !== 1 ? 's' : ''}`;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty">${q ? 'Nenhum resultado para a busca.' : tab === 'pagos' ? 'Nenhum pagamento no período.' : 'Nenhuma conta pendente.'}</td></tr>`;
    return;
  }

  const hojeP = new Date(); hojeP.setHours(0,0,0,0);
  const renderPagRow = r => {
    const tipoCls = r.tipo === 'Caixa' ? 'tag-caixa' : r.tipo === 'Agenda' ? 'tag-agenda' : 'tag-pendente';
    const isPendente = tab === 'pendentes';
    const vencDt = r.vencimento ? new Date(r.vencimento) : null;
    const isVencido = isPendente && vencDt && vencDt < hojeP;
    const rowCls = isVencido ? 'row-danger' : (isPendente && vencDt && (vencDt - hojeP) < 7*86400000 ? 'row-warning' : '');
    return `<tr class="${rowCls}">
      <td style="font-size:12px;font-weight:500">${r.documento || '—'}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.fornecedor}">${r.fornecedor}</td>
      <td style="font-size:12px">${r.dre_conta}</td>
      <td style="font-size:11px;color:var(--muted)">${r.dre_titulo}</td>
      <td class="mono" style="text-align:right;font-size:11px">${r.emissao    ? new Date(r.emissao).toLocaleDateString('pt-BR')    : '—'}</td>
      <td class="mono" style="text-align:right;font-size:11px;font-weight:${isVencido?'700':'400'}">${r.vencimento ? new Date(r.vencimento).toLocaleDateString('pt-BR')  : '—'}</td>
      <td class="mono" style="text-align:right;font-size:11px">${r.pagamento  ? new Date(r.pagamento).toLocaleDateString('pt-BR')   : '—'}</td>
      <td style="text-align:right"><span class="tag ${tipoCls}">${isVencido ? 'Vencido' : r.tipo}</span></td>
      <td class="mono" style="text-align:right;font-weight:600;color:var(--red)">${fmtR(Number(r.valor))}</td>
    </tr>`;
  };
  paginate(rows, 'pag_'+tab, renderPagRow,
    `<tr><td colspan="9" class="empty">${tab==='pagos'?'Nenhum pagamento.':'Nenhuma conta pendente.'}</td></tr>`,
    'pagTbody', 'pagPagination');
}

// ─── DRE — Demonstrativo de Resultado ────────────────────────────────────────
async function loadDre() {
  if (!state.clienteId || !state.periodo) {
    document.getElementById('dreContent').innerHTML = emptyStateHtml(
      `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="48" height="48" rx="6" stroke="currentColor" stroke-width="3"/><path d="M20 24h24M20 32h16M20 40h20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
      'Selecione cliente e período', 'O demonstrativo será gerado automaticamente.'
    );
    return;
  }
  const _ck = `dre_${state.clienteId}_${state.periodo}`;
  const el = document.getElementById('dreContent');
  if (_tabCache[_ck]) { renderDre(_tabCache[_ck]); return; }
  el.innerHTML = '<div class="loading-row" style="padding:40px;justify-content:center"><span class="spinner"></span> Carregando DRE...</div>';
  try {
    const d = await api(`/clientes/${state.clienteId}/dre?periodo=${state.periodo}`);
    _tabCache[_ck] = d;
    renderDre(d);
  } catch(e) {
    el.innerHTML = `<div class="empty" style="color:var(--red)">${esc(e.message)}</div>`;
  }
}

function renderDre(d) {
  const pct = v => `<span class="dre-pct">${v >= 0 ? '+' : ''}${v.toFixed(1)}%</span>`;
  const row = (label, value, cls = '', indent = 0, extra = '') =>
    `<div class="dre-row ${cls}" style="${indent ? 'padding-left:' + (16 + indent * 16) + 'px' : ''}">
      <div class="dre-row-label">${label}</div>
      <div class="dre-row-value">${extra}${fmtR(value)}</div>
    </div>`;

  // Combustíveis detail rows
  const fuelRows = d.combustiveis.map(c =>
    row(c.combustivel + `<span class="dre-sub">${fmtN(c.vol_pdv, 0)} L</span>`, c.receita_bruta, 'dre-item', 1)
  ).join('') + (d.receita_conveniencia > 0
    ? row(`Conveniência / Loja<span class="dre-sub">${d.qtd_vendas_conv} vendas</span>`, d.receita_conveniencia, 'dre-item', 1)
    : '');

  const custoRows = d.combustiveis.map(c => {
    const detalhes = [
      c.custo_com > 0 ? row('↳ Com Nota', c.custo_com, 'dre-item dre-neg', 2) : '',
      c.custo_sem > 0 ? row('↳ Sem Nota', c.custo_sem, 'dre-item dre-neg', 2) : '',
    ].join('');
    return row(c.combustivel + `<span class="dre-sub">total: ${fmtR(c.custo)}</span>`, c.custo, 'dre-item dre-neg', 1) + detalhes;
  }).join('');

  // Despesas groups (collapsible)
  const despesaGroups = d.despesas.map((g, gi) => {
    const catRows = g.categorias.map(c =>
      row(c.categoria, c.total, 'dre-item dre-neg', 1)
    ).join('');
    const pctTotal = d.receita_bruta > 0 ? (g.total / d.receita_bruta * 100).toFixed(1) : '0.0';
    return `
      <div class="dre-row dre-group dre-neg" onclick="toggleDreGrupo(${gi})">
        <div class="dre-row-label"><span class="dre-chevron" id="dre-chev-${gi}">▶</span>${esc(g.grupo)}</div>
        <div class="dre-row-value"><span class="dre-pct">${pctTotal}%</span>${fmtR(g.total)}</div>
      </div>
      <div class="dre-group-detail" id="dre-grp-${gi}">${catRows}</div>`;
  }).join('');

  const resultCls = d.resultado >= 0 ? 'dre-result-pos' : 'dre-result-neg';

  document.getElementById('dreContent').innerHTML = `
    <div class="dre-wrap">
      <!-- Header -->
      <div class="dre-header">
        <div>
          <div class="dre-title">Demonstrativo de Resultado</div>
          <div class="dre-period">${d.periodo}</div>
        </div>
        <button class="btn btn-primary" onclick="window.print()" style="font-size:12px;padding:6px 14px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Imprimir
        </button>
      </div>

      <!-- KPIs sumário -->
      <div class="dre-summary-grid">
        <div class="dre-summary-kpi dre-summary-green">
          <div class="dre-summary-label">Receita Bruta</div>
          <div class="dre-summary-value">${fmtR(d.receita_bruta)}</div>
        </div>
        <div class="dre-summary-kpi">
          <div class="dre-summary-label">Margem Bruta</div>
          <div class="dre-summary-value" style="color:${d.margem_bruta>=0?'var(--green)':'var(--red)'}">${fmtR(d.margem_bruta)}</div>
          <div class="dre-summary-sub">${d.pct_margem.toFixed(1)}% da receita</div>
        </div>
        <div class="dre-summary-kpi dre-summary-red">
          <div class="dre-summary-label">Total Despesas</div>
          <div class="dre-summary-value">${fmtR(d.total_despesas)}</div>
        </div>
        <div class="dre-summary-kpi ${resultCls}">
          <div class="dre-summary-label">Resultado</div>
          <div class="dre-summary-value">${fmtR(d.resultado)}</div>
          <div class="dre-summary-sub">${d.pct_resultado.toFixed(1)}% da receita</div>
        </div>
      </div>

      <!-- Corpo do DRE -->
      <div class="dre-body card">

        <div class="dre-section-title">1. RECEITA BRUTA</div>
        ${fuelRows}
        ${row('Total Receita Bruta', d.receita_bruta, 'dre-total dre-pos')}

        <div class="dre-section-title dre-section-neg">2. CUSTO DAS MERCADORIAS VENDIDAS (CMV)</div>
        ${custoRows}
        ${row('(-) Total CMV', d.custo_total, 'dre-total dre-neg')}

        <div class="dre-divider"></div>
        ${row('(=) MARGEM BRUTA', d.margem_bruta, 'dre-total dre-highlight ' + (d.margem_bruta >= 0 ? 'dre-pos' : 'dre-neg'),
          0, pct(d.pct_margem))}

        <div class="dre-section-title dre-section-neg" style="margin-top:8px">3. DESPESAS OPERACIONAIS</div>
        ${despesaGroups}
        ${row('(-) Total Despesas', d.total_despesas, 'dre-total dre-neg')}

        <div class="dre-divider"></div>
        ${row('(=) RESULTADO DO PERÍODO', d.resultado, 'dre-total dre-result ' + resultCls,
          0, pct(d.pct_resultado))}

      </div>
    </div>`;
}

function toggleDreGrupo(i) {
  const detail = document.getElementById(`dre-grp-${i}`);
  const chev   = document.getElementById(`dre-chev-${i}`);
  const open   = detail.classList.toggle('open');
  chev.textContent = open ? '▼' : '▶';
}
