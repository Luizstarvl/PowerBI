import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingCart, Fuel, Package, Truck, Boxes, Gauge, RefreshCw, Calendar, CalendarDays, CalendarRange, ChevronDown } from 'lucide-react';
import { KpiCard } from '../components/ui';
import { apiFetch } from '../api';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const number   = new Intl.NumberFormat('pt-BR');

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const PERIOD_MODES = [
  { id: 'dia',           label: 'Dia',           Icon: Calendar },
  { id: 'semana',        label: 'Semana',        Icon: CalendarRange },
  { id: 'mes',           label: 'Mês',           Icon: CalendarDays },
  { id: 'ano',           label: 'Ano',           Icon: Calendar },
  { id: 'personalizado', label: 'Personalizado', Icon: CalendarRange },
];

function initDraft() {
  const now  = new Date();
  const y    = now.getFullYear();
  const m    = String(now.getMonth() + 1).padStart(2, '0');
  const today = now.toISOString().slice(0, 10);
  return { mode: 'mes', mes: `${y}-${m}`, ano: String(y), dia: today, semana: today, inicio: `${y}-${m}-01`, fim: today };
}

function computeWeekBounds(dateStr) {
  const d   = new Date(`${dateStr}T12:00:00`);
  const dow = d.getDay();
  const s   = new Date(d); s.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  const e   = new Date(s); e.setDate(s.getDate() + 6);
  const fmt = dt => dt.toISOString().slice(0, 10);
  return { inicio: fmt(s), fim: fmt(e) };
}

function draftToRange(draft) {
  const pad = n => String(n).padStart(2, '0');
  switch (draft.mode) {
    case 'dia':  return { inicio: draft.dia,   fim: draft.dia };
    case 'semana': { const wb = computeWeekBounds(draft.semana); return { inicio: wb.inicio, fim: wb.fim }; }
    case 'mes': {
      const [y, m] = draft.mes.split('-').map(Number);
      const last = new Date(y, m, 0).getDate();
      return { inicio: `${y}-${pad(m)}-01`, fim: `${y}-${pad(m)}-${pad(last)}` };
    }
    case 'ano':  return { inicio: `${draft.ano}-01-01`, fim: `${draft.ano}-12-31` };
    default:     return { inicio: draft.inicio || '', fim: draft.fim || '' };
  }
}

function buildApiQs(empresasKey, applied) {
  const empresa = (empresasKey || '').split(',')[0];
  const { inicio, fim } = draftToRange(applied);
  if (!inicio || !fim) return new URLSearchParams({ empresa, empresas: empresasKey }).toString();
  const [y, m] = inicio.split('-');
  const periodo = m && y ? `${m}${y}` : '';
  return new URLSearchParams({ empresa, empresas: empresasKey, data_inicio: inicio, data_final: fim, periodo }).toString();
}

function draftCanApply(d) {
  if (d.mode === 'personalizado') return !!d.inicio && !!d.fim && d.inicio <= d.fim;
  if (d.mode === 'mes')  return !!d.mes;
  if (d.mode === 'ano')  return !!d.ano;
  if (d.mode === 'dia')  return !!d.dia;
  if (d.mode === 'semana') return !!d.semana;
  return false;
}

/* ── Sub-componentes do seletor ─────────────────────────────────────────────── */
function PPSelect({ label, value, onChange, children }) {
  return (
    <div className="ppv3-field">
      <span className="ppv3-label">{label}</span>
      <div className="ppv3-input-wrap">
        <CalendarDays size={16} className="ppv3-input-icon" />
        <select className="ppv3-select" value={value} onChange={onChange}>{children}</select>
        <ChevronDown size={15} className="ppv3-input-chevron" />
      </div>
    </div>
  );
}

function PPDate({ label, value, onChange, min, max }) {
  return (
    <div className="ppv3-field">
      <span className="ppv3-label">{label}</span>
      <div className="ppv3-input-wrap">
        <Calendar size={16} className="ppv3-input-icon" />
        <input className="ppv3-date" type="date" value={value} onChange={onChange} min={min} max={max} />
      </div>
    </div>
  );
}

/* ── Card seletor de período ────────────────────────────────────────────────── */
function PeriodPicker({ draft, onChange, onApply, canApply, empresasKey }) {
  const currentYear = new Date().getFullYear();
  const years       = Array.from({ length: 7 }, (_, i) => currentYear - i);
  const today       = new Date().toISOString().slice(0, 10);

  const set     = (key, val) => onChange({ ...draft, [key]: val });
  const setMode = mode      => onChange({ ...draft, mode });

  const [mesY, mesM] = (draft.mes || `${currentYear}-01`).split('-');
  const weekBounds   = draft.mode === 'semana' ? computeWeekBounds(draft.semana || today) : null;

  return (
    <div className="ppv3-card">

      {/* Cabeçalho */}
      <div className="ppv3-header">
        <div className="ppv3-title-group">
          <Calendar size={20} className="ppv3-title-icon" />
          <div>
            <div className="ppv3-title">Período</div>
            <div className="ppv3-subtitle">Selecione o período para análise dos dados</div>
          </div>
        </div>
        <button
          className="btn-primary ppv3-apply-btn"
          onClick={onApply}
          disabled={!canApply || !empresasKey}
          title={!empresasKey ? 'Selecione uma empresa primeiro' : 'Atualizar os dados'}
        >
          <RefreshCw size={15} />
          Atualizar Consulta
        </button>
      </div>

      {/* Abas de modo */}
      <div className="ppv3-modes">
        {PERIOD_MODES.map(({ id, label, Icon }) => (
          <button key={id} type="button"
            className={`ppv3-mode${draft.mode === id ? ' active' : ''}`}
            onClick={() => setMode(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Inputs de valor */}
      <div className="ppv3-values">
        {draft.mode === 'mes' && (
          <>
            <PPSelect label="Mês" value={mesM} onChange={e => set('mes', `${mesY}-${e.target.value}`)}>
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={String(i + 1).padStart(2, '0')}>{name}</option>
              ))}
            </PPSelect>
            <PPSelect label="Ano" value={mesY} onChange={e => set('mes', `${e.target.value}-${mesM}`)}>
              {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </PPSelect>
          </>
        )}

        {draft.mode === 'ano' && (
          <PPSelect label="Ano" value={draft.ano} onChange={e => set('ano', e.target.value)}>
            {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </PPSelect>
        )}

        {draft.mode === 'dia' && (
          <PPDate label="Data" value={draft.dia} max={today} onChange={e => set('dia', e.target.value)} />
        )}

        {draft.mode === 'semana' && (
          <>
            <PPDate label="Selecione uma data da semana" value={draft.semana} max={today}
              onChange={e => set('semana', e.target.value)} />
            {weekBounds && (
              <div className="ppv3-field">
                <span className="ppv3-label">Semana selecionada</span>
                <div className="ppv3-week-display">
                  <Calendar size={16} className="ppv3-input-icon" style={{ position: 'static', color: 'var(--color-primary)' }} />
                  {weekBounds.inicio.split('-').reverse().join('/')}
                  {' – '}
                  {weekBounds.fim.split('-').reverse().join('/')}
                </div>
              </div>
            )}
          </>
        )}

        {draft.mode === 'personalizado' && (
          <>
            <PPDate label="Data inicial" value={draft.inicio} max={today}
              onChange={e => set('inicio', e.target.value)} />
            <PPDate label="Data final" value={draft.fim} max={today} min={draft.inicio}
              onChange={e => set('fim', e.target.value)} />
          </>
        )}
      </div>
    </div>
  );
}

function mapToTopProdutos(result) {
  if (!result?.ok || !result.rows?.length || !result.columns?.length) return [];
  const { columns, rows } = result;
  const numCols = columns.filter(c => rows[0][c] !== null && !isNaN(Number(rows[0][c])));
  const txtCols = columns.filter(c => !numCols.includes(c));
  const nameCol = txtCols.find(c => /nome|descri|produto|item/i.test(c))
               || txtCols[txtCols.length - 1]
               || txtCols[0];
  const qtyCol  = numCols.find(c => /qtd|qty|quant/i.test(c)) || numCols[0];
  if (!nameCol || !qtyCol) return [];
  return rows.slice(0, 5).map(r => ({
    name: String(r[nameCol] ?? ''),
    qty:  Number(r[qtyCol]  ?? 0),
  }));
}

function mapKpiRow(result) {
  if (!result?.ok || !result.rows?.length) return null;
  const row  = result.rows[0];
  const cols = result.columns || [];
  const num  = cols.filter(c => row[c] !== null && row[c] !== undefined && !isNaN(Number(row[c])));
  const col  = pattern => cols.find(c => new RegExp(`^(${pattern})$`, 'i').test(c));
  const val  = c => c ? Number(row[c] ?? 0) : undefined;
  return {
    valor:  val(col('valor|value|total_valor')) ?? (num[0] ? Number(row[num[0]]) : 0),
    total:  val(col('total|total_vendas|count')) ?? (num[1] ? Number(row[num[1]]) : undefined),
    litros: val(col('litros|volume|lts')),
    qtd:    val(col('qtd|quantidade|qty')),
  };
}

/* ── Gradientes dos avatares por rank ───────────────────────────────────────── */
const RANK_GRAD = [
  'linear-gradient(135deg,#ff8c00,#ff4500)',
  'linear-gradient(135deg,#60a5fa,#2563eb)',
  'linear-gradient(135deg,#4ade80,#16a34a)',
  'linear-gradient(135deg,#c084fc,#7c3aed)',
  'linear-gradient(135deg,#f472b6,#be185d)',
];

// Tamanhos por distância do centro: abs=0 (centro), abs=1 (lateral), abs=2 (extremo)
const TPB_SIZES = [
  { w: 160, avatar: 74, avatarFs: 29, nameFs: 12, qtyFs: 21, badgeFs: 9,  nameMt: 10, qtyMt: 5, badgeMt: 7, pad: '14px 12px 12px' },
  { w: 124, avatar: 50, avatarFs: 19, nameFs: 10, qtyFs: 14, badgeFs: 8,  nameMt: 8,  qtyMt: 4, badgeMt: 5, pad: '12px 8px 10px'  },
  { w:  94, avatar: 38, avatarFs: 15, nameFs:  9, qtyFs: 11, badgeFs: 7,  nameMt: 6,  qtyMt: 3, badgeMt: 4, pad: '10px 6px 8px'   },
];

const OFFSET_X_PX   = { '-2': -284, '-1': -148, 0: 0, 1: 148, 2: 284 };
const OFFSET_RY_DEG = { '-2': 42,   '-1': 26,   0: 0, 1: -26, 2: -42 };
const OFFSET_TZ_PX  = { '-2': -108, '-1': -55,  0: 0, 1: -55, 2: -108 };

/* ── Chuva de confetes ──────────────────────────────────────────────────────── */
const CONFETTI_COLORS = ['#FFD700','#FF6B00','#FFC107','#FF4500','#FFFDE0','#FFB347','#ffffff','#FFA07A'];

function ConfettiCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth  || 800;
    canvas.height = canvas.offsetHeight || 290;
    const W = canvas.width;
    const H = canvas.height;
    const particles = Array.from({ length: 36 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H - H * 0.6,
      w:     4 + Math.random() * 5,
      h:     3 + Math.random() * 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      vy:    0.8 + Math.random() * 1.6,
      vx:    (Math.random() - 0.5) * 1.0,
      rot:   Math.random() * Math.PI * 2,
      drot:  (Math.random() - 0.5) * 0.07,
      alpha: 0.5 + Math.random() * 0.45,
    }));
    let raf;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        p.y += p.vy; p.x += p.vx; p.rot += p.drot;
        if (p.y > H + 12) { p.y = -12; p.x = Math.random() * W; }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="tpb-confetti" />;
}

/* ── Banner Top 5 ───────────────────────────────────────────────────────────── */
const CROWN_SVG = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1h14v1z"/>
  </svg>
);
const EYEBROW_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ff8c00' }}>
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1h14v1z"/>
  </svg>
);

function TopProdutosBanner({ dados, loading }) {
  const n = dados?.length ?? 0;
  const [featured, setFeatured] = useState(0);
  const [noTransRank, setNoTransRank] = useState(null);
  const timerRef   = useRef(null);
  const featuredRef = useRef(0);

  useEffect(() => { featuredRef.current = featured; }, [featured]);
  useEffect(() => { setFeatured(0); setNoTransRank(null); }, [dados]);

  // Calcula o spread: quantos cards de cada lado ficam visíveis
  const spread = n >= 5 ? 2 : n >= 3 ? 1 : Math.max(0, n - 1);

  function doNavigate(dir, prev) {
    const next = (prev + dir + n) % n;
    if (spread >= 2) {
      // Identifica o rank que iria "teleportar" de uma extremidade à outra
      const wrapOffset = dir > 0 ? -spread : spread;
      const wrapIdx    = ((prev + wrapOffset) % n + n) % n;
      // Desabilita transição de transform para esse rank no mesmo render que muda featured
      setNoTransRank(wrapIdx + 1);
      setFeatured(next);
      // Reabilita após dois frames (card já está na nova posição sem animação)
      requestAnimationFrame(() => requestAnimationFrame(() => setNoTransRank(null)));
    } else {
      setFeatured(next);
    }
  }

  function startTimer() {
    clearInterval(timerRef.current);
    if (n < 2) return;
    timerRef.current = setInterval(() => doNavigate(1, featuredRef.current), 3500);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { startTimer(); return () => clearInterval(timerRef.current); }, [n]);

  function go(dir) {
    if (n < 2) return;
    doNavigate(dir, featured);
    startTimer();
  }

  if (loading && n === 0) {
    return (
      <div className="tpb-root tpb-skeleton">
        <div className="tpb-eyebrow">{EYEBROW_ICON} Top 5 Mais Vendidos · Conveniência</div>
        <div className="tpb-stage" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          {[94, 124, 160, 124, 94].map((w, i) => (
            <div key={i} className="tpb-skel-card" style={{ width: w, opacity: i === 2 ? 1 : i === 1 || i === 3 ? 0.6 : 0.35 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!loading && n === 0) {
    return (
      <div className="tpb-root tpb-root--empty">
        <div className="tpb-eyebrow">{EYEBROW_ICON} Top 5 Mais Vendidos · Conveniência</div>
        <p className="tpb-empty-msg">Sem dados de conveniência para o período selecionado.</p>
      </div>
    );
  }

  const visibleOffsets = Array.from({ length: 2 * spread + 1 }, (_, i) => i - spread);

  return (
    <div className="tpb-root">
      {/* Confetes apenas quando o 1° lugar está em destaque */}
      {featured === 0 && <ConfettiCanvas />}
      <div className="tpb-eyebrow">{EYEBROW_ICON} Top 5 Mais Vendidos · Conveniência</div>

      {/* Setas de navegação */}
      {n >= 2 && (
        <button className="tpb-nav tpb-nav--prev" onClick={() => go(-1)} aria-label="Anterior">&#8592;</button>
      )}
      {n >= 2 && (
        <button className="tpb-nav tpb-nav--next" onClick={() => go(1)} aria-label="Próximo">&#8594;</button>
      )}

      <div className="tpb-stage">
        {visibleOffsets.map(offset => {
          const idx      = ((featured + offset) % n + n) % n;
          const item     = dados[idx];
          const rank     = idx + 1;
          const abs      = Math.abs(offset);
          const isCenter = offset === 0;
          const isFirst  = isCenter && rank === 1;
          const sz       = TPB_SIZES[abs] || TPB_SIZES[2];
          const skipTrans = noTransRank === rank;

          return (
            <div
              key={rank}
              className={`tpb-card${isCenter ? ' tpb-featured' : ' tpb-side'}${isFirst ? ' tpb-rank1' : ''}`}
              style={{
                width:     sz.w,
                padding:   sz.pad,
                opacity:   isCenter ? 1 : abs === 1 ? 0.85 : 0.68,
                transform: `translateX(calc(-50% + ${OFFSET_X_PX[offset]}px)) translateY(-50%) rotateY(${OFFSET_RY_DEG[offset]}deg) translateZ(${OFFSET_TZ_PX[offset]}px)`,
                zIndex:    isCenter ? 10 : abs === 1 ? 9 : 8,
                transition: skipTrans
                  ? 'opacity .4s ease, box-shadow .4s'
                  : 'transform .5s cubic-bezier(.25,.46,.45,.94), opacity .4s ease, box-shadow .4s',
                cursor: isCenter ? 'default' : 'pointer',
              }}
              onClick={() => { if (!isCenter) { setFeatured(idx); startTimer(); } }}
            >
              {isFirst && (
                <div className="tpb-stars" aria-hidden="true">
                  <span className="tpb-star tpb-star-0">✦</span>
                  <span className="tpb-star tpb-star-1">★</span>
                  <span className="tpb-star tpb-star-2">✦</span>
                  <span className="tpb-star tpb-star-3">✦</span>
                  <span className="tpb-star tpb-star-4">★</span>
                  <span className="tpb-star tpb-star-5">✦</span>
                </div>
              )}

              {rank === 1 ? (
                <div className="tpb-crown">{CROWN_SVG}</div>
              ) : (
                <div className={isCenter ? 'tpb-center-rank' : 'tpb-side-rank'}>{rank}°</div>
              )}

              <div
                className="tpb-avatar"
                style={{
                  width: sz.avatar, height: sz.avatar, fontSize: sz.avatarFs,
                  background: RANK_GRAD[(rank - 1) % RANK_GRAD.length],
                  boxShadow: isFirst
                    ? '0 0 28px rgba(255,180,0,.6)'
                    : isCenter ? '0 0 22px rgba(255,140,0,.45)' : 'none',
                }}
              >
                {item.name.charAt(0).toUpperCase()}
              </div>

              <div className="tpb-card-name" style={{ fontSize: sz.nameFs, marginTop: sz.nameMt }}>
                {item.name}
              </div>
              <div className="tpb-card-qty" style={{ fontSize: sz.qtyFs, marginTop: sz.qtyMt }}>
                {number.format(Math.round(item.qty))} <small>un.</small>
              </div>
              <div
                className={`tpb-badge tpb-badge--${rank}`}
                style={{ fontSize: sz.badgeFs, marginTop: sz.badgeMt, padding: '3px 9px' }}
              >
                {rank}° Lugar
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicadores de posição */}
      {n >= 2 && (
        <div className="tpb-dots">
          {Array.from({ length: n }, (_, i) => (
            <button
              key={i}
              className={`tpb-dot${featured === i ? ' on' : ''}`}
              onClick={() => { setFeatured(i); startTimer(); }}
              aria-label={`Ir para ${i + 1}°`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ empresas, period, onNavigate }) {
  const [draft,   setDraft]   = useState(initDraft);
  const [applied, setApplied] = useState(initDraft); // only changes on button click
  const [kpis, setKpis]              = useState(null);
  const [topProdutos, setTopProdutos] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotKpiData, setSlotKpiData] = useState({});
  const [erro, setErro]               = useState('');
  const [dashQueries, setDashQueries] = useState([]);

  useEffect(() => {
    apiFetch('/api/queries?ativa=true&categoria=Dashboard')
      .then(r => r.json())
      .then(d => setDashQueries(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const empresasKey = (empresas || []).join(',');

  const slotMap = useMemo(
    () => Object.fromEntries(dashQueries.filter(q => q.slot).map(q => [q.slot, q])),
    [dashQueries]
  );

  // String que muda somente quando empresa ou filtro aplicado mudam
  const apiQs = useMemo(() => buildApiQs(empresasKey, applied), [empresasKey, applied]);

  // KPIs via slot
  useEffect(() => {
    if (!empresasKey) return;
    const KPI_KEYS = ['kpi_vendas','kpi_combustivel','kpi_conveniencia','kpi_compras_comb','kpi_compras_conv','kpi_afericoes'];
    const active = KPI_KEYS.filter(k => slotMap[k]);
    if (!active.length) return;
    let cancelado = false;
    Promise.all(active.map(k =>
      apiFetch(`/api/queries/execute/${slotMap[k].codigo}?${apiQs}`)
        .then(r => r.json())
        .then(d => [k, mapKpiRow(d)])
        .catch(() => [k, null])
    )).then(entries => {
      if (!cancelado) setSlotKpiData(Object.fromEntries(entries.filter(([, v]) => v)));
    });
    return () => { cancelado = true; };
  }, [slotMap, apiQs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Top 5 via slot
  useEffect(() => {
    if (!empresasKey) return;
    const top5Q = slotMap.top5_convenio;
    if (!top5Q) return;
    let cancelado = false;
    setSlotLoading(true);
    apiFetch(`/api/queries/execute/${top5Q.codigo}?${apiQs}`)
      .then(r => r.json())
      .then(d => { if (!cancelado) setTopProdutos(mapToTopProdutos(d)); })
      .catch(() => { if (!cancelado) setTopProdutos([]); })
      .finally(() => { if (!cancelado) setSlotLoading(false); });
    return () => { cancelado = true; };
  }, [slotMap, apiQs]); // eslint-disable-line react-hooks/exhaustive-deps

  // KPIs principais (endpoint legado)
  useEffect(() => {
    if (!empresasKey) return;
    let cancelado = false;
    setLoading(true);
    setErro('');
    const hasTop5Slot = !!slotMap.top5_convenio;

    Promise.all([
      apiFetch(`/api/dashboard/kpis?${apiQs}`).then(r => r.json()),
      hasTop5Slot
        ? Promise.resolve(null)
        : apiFetch(`/api/dashboard/top-convenio?${apiQs}`).then(r => r.json()),
    ])
      .then(([kpisData, topData]) => {
        if (cancelado) return;
        if (kpisData?.error) throw new Error(kpisData.error);
        setKpis(kpisData);
        if (!hasTop5Slot && topData) setTopProdutos(Array.isArray(topData) ? topData : []);
      })
      .catch(() => { if (!cancelado) setErro('Não foi possível carregar os dados do período.'); })
      .finally(() => { if (!cancelado) setLoading(false); });

    return () => { cancelado = true; };
  }, [apiQs, slotMap]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAtualizar() {
    if (draftCanApply(draft)) setApplied({ ...draft });
  }

  const canApply  = draftCanApply(draft);

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="section-title">Visão geral</div>
          <div className="section-sub">Resumo de vendas do período selecionado</div>
        </div>
      </div>

      <PeriodPicker
        draft={draft}
        onChange={setDraft}
        onApply={handleAtualizar}
        canApply={canApply}
        empresasKey={empresasKey}
      />

      {!empresasKey && <p className="chart-empty">Selecione uma empresa para ver o dashboard.</p>}
      {erro && <p className="form-erro">{erro}</p>}

      {empresasKey && !erro && (
        <>
          <div className="kpi-grid">
            {(() => {
              const kpi = (slotKey, apiObj) => slotKpiData[slotKey] || apiObj || {};
              const vendas   = kpi('kpi_vendas',       kpis?.vendas);
              const comb     = kpi('kpi_combustivel',  kpis?.combustivel);
              const conv     = kpi('kpi_conveniencia', kpis?.conveniencia);
              const compComb = kpi('kpi_compras_comb', kpis?.comprasComb);
              const compConv = kpi('kpi_compras_conv', kpis?.comprasConv);
              const afer     = kpi('kpi_afericoes',    kpis?.afericoes);
              return (<>
                <KpiCard icon={ShoppingCart} label="Vendas totais"       value={loading ? '—' : currency.format(vendas.valor   || 0)} sub={loading ? '' : `${number.format(vendas.total || 0)} vendas`} />
                <KpiCard icon={Fuel}         label="Combustível"          value={loading ? '—' : currency.format(comb.valor    || 0)} sub={loading ? '' : `${number.format(comb.litros || comb.total || 0)} L`} />
                <KpiCard icon={Package}      label="Conveniência"         value={loading ? '—' : currency.format(conv.valor    || 0)} sub={loading ? '' : `${number.format(conv.total  || 0)} vendas`} />
                <KpiCard icon={Truck}        label="Compras combustível"  value={loading ? '—' : currency.format(compComb.valor || 0)} />
                <KpiCard icon={Boxes}        label="Compras conveniência" value={loading ? '—' : currency.format(compConv.valor || 0)} />
                <KpiCard icon={Gauge}        label="Aferições"            value={loading ? '—' : number.format(afer.total      || 0)} sub={loading ? '' : `${number.format(afer.qtd || 0)} un.`} />
              </>);
            })()}
          </div>

          <TopProdutosBanner dados={topProdutos} loading={loading || slotLoading} />
        </>
      )}
    </main>
  );
}
