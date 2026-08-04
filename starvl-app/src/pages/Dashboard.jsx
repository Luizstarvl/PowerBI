import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingCart, Fuel, Flame, Droplet, Package, Truck, Boxes, Gauge, RefreshCw, CalendarDays, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { KpiCard } from '../components/ui';
import { apiFetch } from '../api';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const number   = new Intl.NumberFormat('pt-BR');

const KPI_KEYS = ['kpi_vendas', 'kpi_combustivel', 'kpi_conveniencia', 'kpi_compras_comb', 'kpi_compras_conv', 'kpi_afericoes'];

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function initDraft() {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = String(now.getMonth() + 1).padStart(2, '0');
  return { mode: 'mes', mes: `${y}-${m}` };
}

function draftToRange(draft) {
  if (!draft.mes) return { inicio: '', fim: '' };
  const [y, m] = draft.mes.split('-').map(Number);
  const pad  = n => String(n).padStart(2, '0');
  const last = new Date(y, m, 0).getDate();
  return { inicio: `${y}-${pad(m)}-01`, fim: `${y}-${pad(m)}-${pad(last)}` };
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
  return !!d.mes;
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

/* ── Card seletor de período ────────────────────────────────────────────────── */
function PeriodPicker({ draft, onChange, onApply, canApply, empresasKey, loading }) {
  const now = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const years = Array.from({ length: 7 }, (_, i) => currentYear - i);
  const [mesY, mesM] = (draft.mes || `${currentYear}-${String(currentMonth).padStart(2, '0')}`).split('-');

  // No ano atual só faz sentido escolher até o mês corrente (meses futuros
  // ainda não têm dado nenhum); anos anteriores já estão inteiramente no
  // passado, então liberam os 12 meses.
  const isAnoAtual = parseInt(mesY, 10) === currentYear;
  const maxMes = isAnoAtual ? currentMonth : 12;
  const mesesDisponiveis = MONTH_NAMES.slice(0, maxMes);

  function handleAnoChange(novoAno) {
    const anoNum = parseInt(novoAno, 10);
    const mesClampado = anoNum === currentYear ? Math.min(parseInt(mesM, 10), currentMonth) : parseInt(mesM, 10);
    onChange({ ...draft, mes: `${novoAno}-${String(mesClampado).padStart(2, '0')}` });
  }

  return (
    <div className="ppv3-card">
      <div className="ppv3-row">
        <PPSelect label="Mês" value={mesM}
          onChange={e => onChange({ ...draft, mes: `${mesY}-${e.target.value}` })}>
          {mesesDisponiveis.map((name, i) => (
            <option key={i} value={String(i + 1).padStart(2, '0')}>{name}</option>
          ))}
        </PPSelect>
        <PPSelect label="Ano" value={mesY}
          onChange={e => handleAnoChange(e.target.value)}>
          {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </PPSelect>
        <button
          className="btn-primary ppv3-apply-btn"
          onClick={onApply}
          disabled={!canApply || !empresasKey || loading}
          title={!empresasKey ? 'Selecione uma empresa primeiro' : 'Atualizar os dados'}
        >
          <RefreshCw size={14} className={loading ? 'pp-spin' : ''} />
          {loading ? 'Atualizando…' : 'Atualizar'}
        </button>
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
  const codCol  = columns.find(c => /^(cod_produto|codigo|prodcodigo|cod|code|sku|ref)$/i.test(c)) || null;
  if (!nameCol || !qtyCol) return [];
  return rows.slice(0, 5).map(r => ({
    name: String(r[nameCol] ?? ''),
    qty:  Number(r[qtyCol]  ?? 0),
    cod:  codCol ? String(r[codCol] ?? '') : '',
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
      vy:    0.42 + Math.random() * 0.72,
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

function TopProdutosBanner({ dadosConvenio, dadosPista, fotosConvenio, fotosPista, temConvenio, temPista, loading }) {
  const hasBoth  = temConvenio && temPista;
  const [tab, setTab] = useState('convenio');

  const activeTab = hasBoth ? tab : (temPista ? 'pista' : 'convenio');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dados = useMemo(() => activeTab === 'pista' ? (dadosPista || []) : (dadosConvenio || []), [activeTab, dadosPista, dadosConvenio]);
  const fotos = activeTab === 'pista' ? (fotosPista || {}) : (fotosConvenio || {});

  const n = dados?.length ?? 0;
  const [featured, setFeatured] = useState(0);
  const [noTransRank, setNoTransRank] = useState(null);
  const [direction, setDirection] = useState(1);
  const [navGen, setNavGen] = useState(0);
  const timerRef   = useRef(null);
  const featuredRef = useRef(0);

  useEffect(() => { featuredRef.current = featured; }, [featured]);
  useEffect(() => { setFeatured(0); setNoTransRank(null); }, [dados]);

  // Calcula o spread: quantos cards de cada lado ficam visíveis
  const spread = n >= 5 ? 2 : n >= 3 ? 1 : Math.max(0, n - 1);

  function doNavigate(dir, prev) {
    setDirection(dir);
    setNavGen(g => g + 1);
    const next = (prev + dir + n) % n;
    if (spread >= 2) {
      const wrapOffset = dir > 0 ? -spread : spread;
      const wrapIdx    = ((prev + wrapOffset) % n + n) % n;
      setNoTransRank(wrapIdx + 1);
      setFeatured(next);
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

  const TabSwitcher = hasBoth ? (
    <div className="tpb-tabs">
      <button className={`tpb-tab${activeTab === 'convenio' ? ' active' : ''}`} onClick={() => setTab('convenio')}>Conveniência</button>
      <button className={`tpb-tab${activeTab === 'pista' ? ' active' : ''}`} onClick={() => setTab('pista')}>Pista</button>
    </div>
  ) : null;

  if (loading && n === 0) {
    return (
      <div className="tpb-root tpb-skeleton">
        <div className="tpb-eyebrow">{EYEBROW_ICON} Top 5 Mais Vendidos</div>
        {TabSwitcher}
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
        <div className="tpb-eyebrow">{EYEBROW_ICON} Top 5 Mais Vendidos</div>
        {TabSwitcher}
        <p className="tpb-empty-msg">Sem dados para o período selecionado.</p>
      </div>
    );
  }

  const visibleOffsets = Array.from({ length: 2 * spread + 1 }, (_, i) => i - spread);

  return (
    <div className="tpb-root">
      {/* Confetes apenas quando o 1° lugar está em destaque */}
      {featured === 0 && <ConfettiCanvas />}
      <div className="tpb-eyebrow">{EYEBROW_ICON} Top 5 Mais Vendidos</div>
      {TabSwitcher}

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

          const innerContent = (
            <>
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
                  background: fotos?.[item.cod] ? 'transparent' : RANK_GRAD[(rank - 1) % RANK_GRAD.length],
                  boxShadow: isFirst
                    ? '0 0 28px rgba(255,180,0,.6)'
                    : isCenter ? '0 0 22px rgba(255,140,0,.45)' : 'none',
                }}
              >
                {fotos?.[item.cod]
                  ? <img src={fotos[item.cod]} alt={item.name} className="tpb-avatar-foto" />
                  : item.name.charAt(0).toUpperCase()
                }
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
            </>
          );

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
              onClick={() => {
                if (!isCenter) {
                  setDirection(offset > 0 ? 1 : -1);
                  setNavGen(g => g + 1);
                  setFeatured(idx);
                  startTimer();
                }
              }}
            >
              {isCenter ? (
                <div key={navGen} className={`tpb-inner tpb-inner--${direction > 0 ? 'fwd' : 'bwd'}`}>
                  {innerContent}
                </div>
              ) : (
                <div className="tpb-inner">
                  {innerContent}
                </div>
              )}
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
              onClick={() => {
                if (i !== featured) {
                  setDirection(i > featured ? 1 : -1);
                  setNavGen(g => g + 1);
                  setFeatured(i);
                  startTimer();
                }
              }}
              aria-label={`Ir para ${i + 1}°`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Mapeamento para combustíveis ───────────────────────────────────────────── */
function mapToTopCombust(result) {
  if (!result?.ok || !result.rows?.length || !result.columns?.length) return [];
  const { columns, rows } = result;
  const numCols = columns.filter(c => rows[0][c] !== null && !isNaN(Number(rows[0][c])));
  const txtCols = columns.filter(c => !numCols.includes(c));
  const nameCol = txtCols.find(c => /^(nome|descri|produto|item|combusti)/i.test(c))
               || txtCols[txtCols.length - 1] || txtCols[0];
  const qtyCol  = numCols.find(c => /litros?|volume|lts?|qtd|qty|quant/i.test(c)) || numCols[0];
  const subCol  = txtCols.find(c => c !== nameCol && /complemento|subtitulo|tipo|descri|obs/i.test(c));
  if (!nameCol || !qtyCol) return [];
  return rows.slice(0, 5).map(r => ({
    name: String(r[nameCol] ?? ''),
    qty:  Number(r[qtyCol]  ?? 0),
    sub:  subCol ? String(r[subCol] ?? '') : '',
  }));
}

/* ── Banner Top Combustíveis ────────────────────────────────────────────────── */
const FUEL_COLORS = ['#ff6b00', '#0ea5e9', '#10b981', '#8b5cf6', '#f472b6'];

function FuelTypeIcon() {
  return <Fuel size={18} />;
}

function TopCombustiveisBanner({ dados, loading }) {
  const n      = dados?.length ?? 0;
  const maxQty = n > 0 ? Math.max(...dados.map(d => d.qty)) : 1;
  const totQty = n > 0 ? dados.reduce((s, d) => s + d.qty, 0) : 1;

  const eyebrow = (
    <div className="tcb-eyebrow">
      <Fuel size={13} style={{ color: '#60a5fa', flexShrink: 0 }} />
      Combustíveis Mais Vendidos
    </div>
  );

  if (loading && n === 0) {
    return (
      <div className="tcb-root tcb-skeleton">
        {eyebrow}
        <div className="tcb-list">
          {[1, 2, 3, 4, 5].map((_, i) => (
            <div key={i} className="tcb-skel-row" style={{ opacity: 1 - i * 0.16 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!loading && n === 0) {
    return (
      <div className="tcb-root tcb-root--empty">
        {eyebrow}
        <p className="tcb-empty-msg">Sem dados para o período selecionado.</p>
      </div>
    );
  }

  return (
    <div className="tcb-root">
      {eyebrow}
      <div className="tcb-list">
        {dados.map((item, i) => {
          const color = FUEL_COLORS[i % FUEL_COLORS.length];
          const pct   = maxQty > 0 ? (item.qty / maxQty) * 100 : 0;
          const share = totQty > 0 ? (item.qty / totQty) * 100 : 0;
          return (
            <div key={i} className="tcb-card">
              <div className="tcb-card-left" style={{ background: `linear-gradient(135deg, ${color}44 0%, ${color}11 100%)` }}>
                <span className="tcb-card-rank" style={{ color }}>{i + 1}°</span>
                <div className="tcb-card-icon" style={{ borderColor: `${color}80`, background: `${color}22`, color }}>
                  <FuelTypeIcon name={item.name} />
                </div>
              </div>
              <div className="tcb-card-right">
                <div className="tcb-card-top">
                  <div className="tcb-card-info">
                    <div className="tcb-card-name">{item.name}</div>
                    {item.sub && <div className="tcb-card-sub">{item.sub}</div>}
                  </div>
                  <div className="tcb-card-vol">
                    {number.format(Math.round(item.qty))} <small>L</small>
                  </div>
                </div>
                <div className="tcb-card-bar-row">
                  <div className="tcb-card-track">
                    <div className="tcb-card-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="tcb-card-pct" style={{ color, borderColor: `${color}55`, background: `${color}18` }}>
                    {share.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard({ empresas, period, onNavigate }) {
  const [draft,   setDraft]   = useState(initDraft);
  const [applied, setApplied] = useState(initDraft); // only changes on button click
  const [kpis, setKpis]              = useState(null);
  const [topProdutos,  setTopProdutos]  = useState([]);
  const [fotosTop,     setFotosTop]     = useState({});
  const [topPista,     setTopPista]     = useState([]);
  const [fotosTopPista, setFotosTopPista] = useState({});
  const [loading, setLoading]           = useState(true);
  const [slotLoading, setSlotLoading]   = useState(false);
  const [slotPistaLoading, setSlotPistaLoading] = useState(false);
  const [topCombust,  setTopCombust]  = useState([]);
  const [slotCombustLoading, setSlotCombustLoading] = useState(false);
  const [kpiSlotLoading, setKpiSlotLoading] = useState(false);
  const [slotKpiData, setSlotKpiData] = useState({});
  const [erro, setErro]               = useState('');
  const [dashQueries, setDashQueries] = useState([]);
  const [periodoVisivel, setPeriodoVisivel] = useState(true);

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
    const active = KPI_KEYS.filter(k => slotMap[k]);
    if (!active.length) return;
    let cancelado = false;
    setKpiSlotLoading(true);
    Promise.all(active.map(k =>
      apiFetch(`/api/queries/execute/${slotMap[k].codigo}?${apiQs}`)
        .then(r => r.json())
        .then(d => [k, mapKpiRow(d)])
        .catch(() => [k, null])
    )).then(entries => {
      if (!cancelado) {
        setSlotKpiData(Object.fromEntries(entries.filter(([, v]) => v)));
        setLoading(false);
      }
    }).finally(() => { if (!cancelado) setKpiSlotLoading(false); });
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

  // Fotos dos top 5 conveniência
  useEffect(() => {
    if (!topProdutos.length || !empresasKey) return;
    const empresa = empresasKey.split(',')[0];
    const codes = topProdutos.map(p => p.cod).filter(Boolean);
    if (!codes.length) return;
    apiFetch(`/api/produto-extra/batch/${encodeURIComponent(empresa)}?codes=${codes.map(encodeURIComponent).join(',')}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setFotosTop(d.data); })
      .catch(() => {});
  }, [topProdutos, empresasKey]);

  // Top 5 pista via slot
  useEffect(() => {
    if (!empresasKey) return;
    const top5Q = slotMap.top5_pista;
    if (!top5Q) return;
    let cancelado = false;
    setSlotPistaLoading(true);
    apiFetch(`/api/queries/execute/${top5Q.codigo}?${apiQs}`)
      .then(r => r.json())
      .then(d => { if (!cancelado) setTopPista(mapToTopProdutos(d)); })
      .catch(() => { if (!cancelado) setTopPista([]); })
      .finally(() => { if (!cancelado) setSlotPistaLoading(false); });
    return () => { cancelado = true; };
  }, [slotMap, apiQs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fotos dos top 5 pista
  useEffect(() => {
    if (!topPista.length || !empresasKey) return;
    const empresa = empresasKey.split(',')[0];
    const codes = topPista.map(p => p.cod).filter(Boolean);
    if (!codes.length) return;
    apiFetch(`/api/produto-extra/batch/${encodeURIComponent(empresa)}?codes=${codes.map(encodeURIComponent).join(',')}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setFotosTopPista(d.data); })
      .catch(() => {});
  }, [topPista, empresasKey]);

  // Top Combustíveis via slot
  useEffect(() => {
    if (!empresasKey) return;
    const q = slotMap.top5_combustiveis;
    if (!q) return;
    let cancelado = false;
    setSlotCombustLoading(true);
    apiFetch(`/api/queries/execute/${q.codigo}?${apiQs}`)
      .then(r => r.json())
      .then(d => { if (!cancelado) setTopCombust(mapToTopCombust(d)); })
      .catch(() => { if (!cancelado) setTopCombust([]); })
      .finally(() => { if (!cancelado) setSlotCombustLoading(false); });
    return () => { cancelado = true; };
  }, [slotMap, apiQs]); // eslint-disable-line react-hooks/exhaustive-deps

  // KPIs principais (endpoint legado)
  useEffect(() => {
    if (!empresasKey) return;
    const KPI_SLOTS = ['kpi_vendas','kpi_combustivel','kpi_conveniencia','kpi_compras_comb','kpi_compras_conv','kpi_afericoes'];
    if (KPI_SLOTS.every(k => slotMap[k]) && slotMap.top5_convenio) return;
    let cancelado = false;
    setLoading(true);
    setErro('');
    const hasTop5Slot = !!slotMap.top5_convenio;
    // Se todos os 6 KPIs já têm consulta customizada vinculada, o endpoint
    // legado (que faz 6 sub-queries pesadas por empresa) não serve pra nada
    // — os cards vão usar só slotKpiData mesmo. Pula a chamada.
    const allKpiSlotsConfigured = KPI_KEYS.every(k => slotMap[k]);

    Promise.all([
      allKpiSlotsConfigured
        ? Promise.resolve(null)
        : apiFetch(`/api/dashboard/kpis?${apiQs}`).then(r => r.json()),
      hasTop5Slot
        ? Promise.resolve(null)
        : apiFetch(`/api/dashboard/top-convenio?${apiQs}`).then(r => r.json()),
    ])
      .then(([kpisData, topData]) => {
        if (cancelado) return;
        if (kpisData?.error) throw new Error(kpisData.error);
        if (kpisData) setKpis(kpisData);
        if (!hasTop5Slot && topData) setTopProdutos(Array.isArray(topData) ? topData : []);
      })
      .catch(() => { if (!cancelado) setErro('Não foi possível carregar os dados do período.'); })
      .finally(() => { if (!cancelado) setLoading(false); });

    return () => { cancelado = true; };
  }, [apiQs, slotMap]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAtualizar() {
    if (!draftCanApply(draft)) return;
    setSlotLoading(true);
    setApplied({ ...draft });
  }

  // Troca de mês/ano no seletor já aplica na hora — não precisa clicar em
  // Atualizar (esse botão fica só como "recarregar de novo o mesmo período").
  function handlePeriodoChange(novoDraft) {
    setDraft(novoDraft);
    if (!draftCanApply(novoDraft)) return;
    setLoading(true);
    setSlotLoading(true);
    setSlotKpiData({});
    setApplied({ ...novoDraft });
  }

  const canApply  = draftCanApply(draft);

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="section-title">Visão geral</div>
          <div className="section-sub">Resumo de vendas do período selecionado</div>
        </div>
        <button
          className="dash-periodo-toggle"
          onClick={() => setPeriodoVisivel(v => !v)}
          title={periodoVisivel ? 'Ocultar seletor de período' : 'Exibir seletor de período'}
        >
          {periodoVisivel ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
          {periodoVisivel ? 'Ocultar período' : 'Exibir período'}
        </button>
      </div>

      {periodoVisivel && (
        <PeriodPicker
          draft={draft}
          onChange={handlePeriodoChange}
          onApply={handleAtualizar}
          canApply={canApply}
          empresasKey={empresasKey}
          loading={loading || slotLoading}
        />
      )}

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
              const kpisLoading = loading || kpiSlotLoading;
              return (<>
                <KpiCard icon={ShoppingCart} label="Vendas totais"       value={kpisLoading ? '—' : currency.format(vendas.valor   || 0)} sub={kpisLoading ? '' : `${number.format(vendas.total || 0)} vendas`} />
                <KpiCard icon={Fuel}         label="Combustível"          value={kpisLoading ? '—' : currency.format(comb.valor    || 0)} sub={kpisLoading ? '' : `${number.format(comb.litros || comb.total || 0)} L`} />
                <KpiCard icon={Package}      label="Conveniência"         value={kpisLoading ? '—' : currency.format(conv.valor    || 0)} sub={kpisLoading ? '' : `${number.format(conv.total  || 0)} vendas`} />
                <KpiCard icon={Truck}        label="Compras combustível"  value={kpisLoading ? '—' : currency.format(compComb.valor || 0)} />
                <KpiCard icon={Boxes}        label="Compras conveniência" value={kpisLoading ? '—' : currency.format(compConv.valor || 0)} />
                <KpiCard icon={Gauge}        label="Aferições"            value={kpisLoading ? '—' : number.format(afer.total      || 0)} sub={kpisLoading ? '' : `${number.format(afer.qtd || 0)} un.`} />
              </>);
            })()}
          </div>

          <div className="dash-banners">
            <TopProdutosBanner
              dadosConvenio={topProdutos}
              dadosPista={topPista}
              fotosConvenio={fotosTop}
              fotosPista={fotosTopPista}
              temConvenio={!!slotMap.top5_convenio}
              temPista={!!slotMap.top5_pista}
              loading={loading || slotLoading || slotPistaLoading}
            />
            {slotMap.top5_combustiveis && (
              <TopCombustiveisBanner
                dados={topCombust}
                loading={loading || slotCombustLoading}
              />
            )}
          </div>
        </>
      )}
    </main>
  );
}
