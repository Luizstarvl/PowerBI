/* ═══════════════════════════════════════════════════════════════
   MetasComerciais.jsx — Dashboard Executivo de Metas v3
   Eclipse BI · Planejamento Comercial
═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../../api';
import {
  Target, TrendingUp, Edit3, Plus, Trash2,
  ChevronLeft, ChevronRight, ChevronDown,
  RefreshCw, Sparkles, X, Save,
  BarChart2, ShoppingCart, DollarSign,
  CheckCircle, AlertTriangle, Zap, Lightbulb,
  Activity, Layers, Minus,
} from 'lucide-react';
import {
  ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

/* ── Constantes ──────────────────────────────────────────────── */
const ORANGE  = '#F97316';
const BLUE    = '#60A5FA';
const PURPLE  = '#A78BFA';
const GREEN   = '#22C55E';
const YELLOW  = '#FBBF24';
const RED     = '#EF4444';

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const CAT_COLORS = ['#F97316','#60A5FA','#22C55E','#A78BFA','#FBBF24','#EC4899','#14B8A6','#F43F5E'];
const CAT_ICONS  = [Activity, ShoppingCart, Layers, Zap, BarChart2, TrendingUp, Target, DollarSign];

/* ── Formatadores ────────────────────────────────────────────── */
const fmtR$ = v =>
  v == null ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtN = v =>
  v == null ? '—' : Number(v).toLocaleString('pt-BR');
const fmtK = (v, prefix = 'R$ ') => {
  if (v == null) return '—';
  if (v >= 1_000_000) return `${prefix}${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `${prefix}${(v / 1_000).toFixed(1)}k`;
  return `${prefix}${v.toFixed(0)}`;
};

function getMesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function mesLabel(k) {
  const [a, m] = k.split('-').map(Number);
  return `${MESES_PT[m-1]} ${a}`;
}
function addMes(k, delta) {
  const [a, m] = k.split('-').map(Number);
  const d = new Date(a, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function pColor(pct) {
  if (pct == null) return '#374151';
  if (pct >= 100) return GREEN;
  if (pct >= 80)  return ORANGE;
  if (pct >= 50)  return YELLOW;
  return RED;
}

/* ── Hook: contador animado ──────────────────────────────────── */
function useCountUp(target, key) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (!target) { setVal(0); return; }
    const t0 = performance.now();
    const dur = 1100;
    function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      setVal(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, key]);
  return val;
}

/* ═══════════════════════════════════════════════════════════════
   SVG Illustration — hero side art
═══════════════════════════════════════════════════════════════ */
function HeroArt() {
  return (
    <svg viewBox="0 0 320 190" fill="none" xmlns="http://www.w3.org/2000/svg"
      className="mc3-hero-svg" aria-hidden="true">
      <defs>
        <filter id="hglow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sglow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F97316"/>
          <stop offset="100%" stopColor="#F97316" stopOpacity=".25"/>
        </linearGradient>
        <linearGradient id="barG2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FB923C"/>
          <stop offset="100%" stopColor="#FB923C" stopOpacity=".2"/>
        </linearGradient>
        <radialGradient id="ambGlow" cx="70%" cy="50%">
          <stop offset="0%" stopColor="#F97316" stopOpacity=".18"/>
          <stop offset="100%" stopColor="#F97316" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Ambient glow */}
      <ellipse cx="230" cy="90" rx="110" ry="80" fill="url(#ambGlow)"/>

      {/* Grid lines */}
      <line x1="20" y1="165" x2="175" y2="165" stroke="rgba(255,255,255,.06)" strokeWidth="1"/>
      <line x1="20" y1="165" x2="20"  y2="30"  stroke="rgba(255,255,255,.06)" strokeWidth="1"/>
      <line x1="20" y1="130" x2="175" y2="130" stroke="rgba(255,255,255,.04)" strokeWidth="1" strokeDasharray="3 4"/>
      <line x1="20" y1="97"  x2="175" y2="97"  stroke="rgba(255,255,255,.04)" strokeWidth="1" strokeDasharray="3 4"/>
      <line x1="20" y1="64"  x2="175" y2="64"  stroke="rgba(255,255,255,.04)" strokeWidth="1" strokeDasharray="3 4"/>

      {/* Bar chart — 5 bars */}
      <rect x="30"  y="138" width="18" height="27" rx="3" fill="url(#barG)"  opacity=".55"/>
      <rect x="58"  y="118" width="18" height="47" rx="3" fill="url(#barG)"  opacity=".65"/>
      <rect x="86"  y="96"  width="18" height="69" rx="3" fill="url(#barG)"  opacity=".75"/>
      <rect x="114" y="70"  width="18" height="95" rx="3" fill="url(#barG2)" opacity=".85"/>
      <rect x="142" y="44"  width="18" height="121" rx="3" fill="url(#barG2)"/>

      {/* Trend line */}
      <polyline
        points="39,133 67,113 95,91 123,65 151,39"
        fill="none" stroke="#F97316" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        filter="url(#hglow)"
      />
      {/* Data points on trend line */}
      {[[39,133],[67,113],[95,91],[123,65],[151,39]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#F97316" filter="url(#sglow)"/>
      ))}

      {/* Arrow at end of trend */}
      <polygon points="147,33 162,37 153,47" fill="#FB923C" filter="url(#hglow)"/>

      {/* Target — right side */}
      <circle cx="242" cy="85" r="52" stroke="rgba(249,115,22,.10)" strokeWidth="1.5" fill="none"/>
      <circle cx="242" cy="85" r="38" stroke="rgba(249,115,22,.18)" strokeWidth="1.5" fill="none"/>
      <circle cx="242" cy="85" r="25" stroke="rgba(249,115,22,.30)" strokeWidth="1.5" fill="none"/>
      <circle cx="242" cy="85" r="13" stroke="rgba(249,115,22,.50)" strokeWidth="2"   fill="none"/>
      <circle cx="242" cy="85" r="5"  fill="#F97316" filter="url(#hglow)"/>

      {/* Arrow hitting target */}
      <line x1="195" y1="55" x2="238" y2="82"
        stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" filter="url(#sglow)"/>
      <polygon points="236,78 243,85 233,87" fill="#FB923C" filter="url(#sglow)"/>

      {/* Fletched end of arrow */}
      <line x1="195" y1="55" x2="189" y2="48" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="195" y1="55" x2="200" y2="48" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>

      {/* Particles */}
      <circle cx="175" cy="28"  r="2"   fill="#F97316" opacity=".7" className="mc3-p1"/>
      <circle cx="280" cy="42"  r="1.5" fill="#FB923C" opacity=".5" className="mc3-p2"/>
      <circle cx="305" cy="120" r="2.5" fill="#F97316" opacity=".4" className="mc3-p3"/>
      <circle cx="55"  cy="42"  r="1.5" fill="#FB923C" opacity=".6" className="mc3-p1"/>
      <circle cx="260" cy="150" r="1.5" fill="#F97316" opacity=".5" className="mc3-p2"/>
      <circle cx="290" cy="75"  r="1"   fill="#FB923C" opacity=".6" className="mc3-p3"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Progress Ring SVG animado
═══════════════════════════════════════════════════════════════ */
function ProgressRing({ pct, cor, size = 88, stroke = 8 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [cur, setCur] = useState(0);
  const raf  = useRef(null);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const target = pct != null ? Math.min(150, pct) : 0;
    const dur = 1100;
    const t0 = performance.now();
    function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      setCur(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [pct]);

  const fill = (Math.min(100, cur) / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      {/* Track */}
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={stroke}/>
      {/* Fill */}
      {pct != null ? (
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={cor} strokeWidth={stroke}
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"/>
      ) : (
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={stroke}
          strokeDasharray="4 7" strokeLinecap="round"/>
      )}
      {/* Label */}
      <text x={size/2} y={size/2}
        textAnchor="middle" dominantBaseline="central"
        style={{
          fill: pct != null ? cor : '#374151',
          fontSize: pct != null ? 13 : 10,
          fontWeight: 700,
          fontFamily: 'Sora, Inter, sans-serif',
          transform: `rotate(90deg)`,
          transformOrigin: `${size/2}px ${size/2}px`,
        }}>
        {pct != null ? `${Math.round(Math.min(150, pct))}%` : '—'}
      </text>
    </svg>
  );
}

/* ── Semi-gauge para resumo executivo ────────────────────────── */
function SemiGauge({ pct, size = 110 }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = Math.PI * r; // semi-circle
  const [cur, setCur] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const target = Math.min(100, pct || 0);
    const dur = 1000;
    const t0 = performance.now();
    function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      setCur(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [pct]);

  const fill = (cur / 100) * circ;
  const color = pct >= 80 ? ORANGE : pct >= 50 ? YELLOW : pct >= 20 ? BLUE : '#374151';

  return (
    <svg width={size} height={size/2 + 20} viewBox={`0 0 ${size} ${size/2 + 20}`} style={{ overflow: 'visible' }}>
      {/* Track */}
      <path d={`M ${stroke/2} ${size/2} A ${r} ${r} 0 0 1 ${size - stroke/2} ${size/2}`}
        fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={stroke} strokeLinecap="round"/>
      {/* Fill */}
      <path d={`M ${stroke/2} ${size/2} A ${r} ${r} 0 0 1 ${size - stroke/2} ${size/2}`}
        fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}/>
      {/* Center text */}
      <text x={size/2} y={size/2 - 2} textAnchor="middle"
        style={{ fill: color, fontSize: 22, fontWeight: 700, fontFamily: 'Sora, sans-serif' }}>
        {Math.round(cur)}%
      </text>
      <text x={size/2} y={size/2 + 14} textAnchor="middle"
        style={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Sora, sans-serif' }}>
        do mês
      </text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KPI Card premium
═══════════════════════════════════════════════════════════════ */
function KpiCard3({ titulo, Icone, cor, meta, realizado, unidade, onEdit, mesKey }) {
  const pct     = meta > 0 ? realizado / meta * 100 : null;
  const dif     = meta != null ? realizado - meta : null;
  const animVal = useCountUp(realizado, mesKey);

  const fmtAnimated = v =>
    unidade === '$' ? fmtK(v) : Math.round(v).toLocaleString('pt-BR');

  let StatusIcon = Minus;
  let statusTxt  = 'Sem meta definida';
  let statusCor  = '#4B5563';
  if (pct != null) {
    if (pct >= 100)  { StatusIcon = CheckCircle;   statusTxt = 'Meta atingida!';    statusCor = GREEN;  }
    else if (pct >= 75) { StatusIcon = TrendingUp; statusTxt = 'No ritmo certo';    statusCor = GREEN;  }
    else             { StatusIcon = AlertTriangle;  statusTxt = 'Abaixo do esperado'; statusCor = YELLOW; }
  }

  return (
    <div className="mc3-kpi-card" style={{ '--kpi-cor': cor }}>
      <div className="mc3-kpi-glow"/>
      <div className="mc3-kpi-accent"/>

      <div className="mc3-kpi-head">
        <span className="mc3-kpi-icon" style={{ background: `${cor}18`, color: cor }}>
          <Icone size={15}/>
        </span>
        <span className="mc3-kpi-name">{titulo}</span>
        {onEdit && (
          <button className="mc3-kpi-edit-btn" onClick={onEdit} title="Editar meta">
            <Edit3 size={11}/>
          </button>
        )}
      </div>

      <div className="mc3-kpi-body">
        <div className="mc3-kpi-left">
          <div className="mc3-kpi-lbl">Realizado</div>
          <div className="mc3-kpi-val" style={{ color: cor }}>{fmtAnimated(animVal)}</div>

          <div className="mc3-kpi-meta-block">
            <div className="mc3-kpi-lbl">Meta</div>
            <div className="mc3-kpi-meta-val">
              {meta == null
                ? onEdit
                  ? <button className="mc3-kpi-def-btn" onClick={onEdit}>Definir meta →</button>
                  : <span style={{ color: '#4B5563', fontSize: 12 }}>Não definida</span>
                : unidade === '$' ? fmtR$(meta) : fmtN(meta)
              }
            </div>
          </div>

          {dif != null && (
            <div className="mc3-kpi-dif" style={{ color: dif >= 0 ? GREEN : RED }}>
              {dif >= 0 ? '▲' : '▼'}{' '}
              {unidade === '$' ? fmtK(Math.abs(dif)) : fmtN(Math.abs(dif))}
              <span style={{ color: '#6B7280', fontWeight: 400, marginLeft: 4 }}>vs meta</span>
            </div>
          )}

          <div className="mc3-kpi-status" style={{ color: statusCor }}>
            <StatusIcon size={11}/>
            <span>{statusTxt}</span>
          </div>
        </div>

        <ProgressRing pct={pct} cor={cor} size={88}/>
      </div>
    </div>
  );
}

/* ── Tooltip do gráfico ──────────────────────────────────────── */
function DailyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="mc3-tooltip">
      <div className="mc3-tt-title">Dia {label}</div>
      {payload.map((p, i) => (
        <div key={i} className="mc3-tt-row">
          <span className="mc3-tt-dot" style={{ background: p.color }}/>
          <span className="mc3-tt-name">{p.name}</span>
          <span className="mc3-tt-val">{fmtR$(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Custom Select ───────────────────────────────────────────── */
function CustomSelect({ options, value, onChange, placeholder = 'Selecione...' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="mc2-select" ref={ref}>
      <button className="mc2-select-btn" onClick={() => setOpen(v => !v)} type="button">
        <span style={{ color: value ? '#F1F5F9' : '#6B7280' }}>{value || placeholder}</span>
        <ChevronDown size={13} style={{ color: '#6B7280', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}/>
      </button>
      {open && (
        <div className="mc2-select-menu">
          {options.map(opt => (
            <button key={opt} className={`mc2-select-item${opt === value ? ' mc2-select-item--active' : ''}`}
              onMouseDown={() => { onChange(opt); setOpen(false); }}>
              {opt}
            </button>
          ))}
          {!options.length && <div className="mc2-select-empty">Nenhuma seção disponível</div>}
        </div>
      )}
    </div>
  );
}

/* ── Modal de Metas ──────────────────────────────────────────── */
function EditModal({ mes, metaAtual, sugestao, loadingSug, onSave, onClose }) {
  const [form, setForm] = useState({
    faturamento: metaAtual?.faturamento != null ? String(metaAtual.faturamento) : '',
    quantidade:  metaAtual?.quantidade  != null ? String(metaAtual.quantidade)  : '',
    ticketMedio: metaAtual?.ticketMedio != null ? String(metaAtual.ticketMedio) : '',
  });
  const [saving, setSaving] = useState(false);

  function aplicar() {
    if (!sugestao) return;
    setForm({
      faturamento: sugestao.faturamento != null ? String(sugestao.faturamento) : '',
      quantidade:  sugestao.quantidade  != null ? String(sugestao.quantidade)  : '',
      ticketMedio: sugestao.ticketMedio != null ? String(sugestao.ticketMedio) : '',
    });
  }

  async function salvar() {
    setSaving(true);
    await onSave({
      faturamento: form.faturamento ? parseFloat(form.faturamento) : null,
      quantidade:  form.quantidade  ? parseInt(form.quantidade)    : null,
      ticketMedio: form.ticketMedio ? parseFloat(form.ticketMedio) : null,
    });
    setSaving(false);
  }

  return (
    <div className="mc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mc-modal">
        <div className="mc-modal-head">
          <div className="mc-modal-titulo"><Target size={17} style={{ color: ORANGE }}/> Definir Metas — {mesLabel(mes)}</div>
          <button className="mc-modal-close" onClick={onClose}><X size={15}/></button>
        </div>
        {(sugestao || loadingSug) && (
          <div className="mc-sug-box">
            <div className="mc-sug-row">
              <Sparkles size={13} style={{ color: YELLOW }}/>
              {loadingSug
                ? <span style={{ opacity: 0.6 }}>Calculando sugestão automática...</span>
                : <><span>Sugestão: média 3 meses +{sugestao.crescimento}%</span>
                    <button className="mc-sug-btn" onClick={aplicar}><Zap size={11}/> Aplicar</button></>
              }
            </div>
            {sugestao && (
              <div className="mc-sug-vals">
                <span>Fat: <b>{fmtR$(sugestao.faturamento)}</b></span>
                <span>Qtd: <b>{fmtN(sugestao.quantidade)}</b></span>
                {sugestao.ticketMedio && <span>Ticket: <b>{fmtR$(sugestao.ticketMedio)}</b></span>}
              </div>
            )}
            {sugestao?.historico?.length > 0 && (
              <div className="mc-sug-hist">
                {sugestao.historico.map(h => (
                  <span key={h.mes} className="mc-sug-hist-item">{h.mes}: {fmtK(h.faturamento)}</span>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="mc-modal-body">
          <label className="mc-label"><DollarSign size={13}/> Faturamento (R$)</label>
          <input className="mc-input" type="number" min="0" step="100" placeholder="Ex: 150000"
            value={form.faturamento} onChange={e => setForm(f => ({ ...f, faturamento: e.target.value }))}/>
          <label className="mc-label"><ShoppingCart size={13}/> Quantidade de Vendas</label>
          <input className="mc-input" type="number" min="0" step="1" placeholder="Ex: 5000"
            value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))}/>
          <label className="mc-label"><BarChart2 size={13}/> Ticket Médio (R$)</label>
          <input className="mc-input" type="number" min="0" step="0.01" placeholder="Ex: 91.36"
            value={form.ticketMedio} onChange={e => setForm(f => ({ ...f, ticketMedio: e.target.value }))}/>
        </div>
        <div className="mc-modal-foot">
          <button className="mc-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="mc-btn-save" onClick={salvar} disabled={saving}>
            {saving ? <RefreshCw size={13} className="spin"/> : <Save size={13}/>} Salvar Metas
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Componente principal
═══════════════════════════════════════════════════════════════ */
export default function MetasComerciais({ empresasKey, clients, empresas }) {
  const empresa = (empresas || [])[0] || null;

  const [mes, setMes]               = useState(getMesAtual);
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [editando, setEditando]     = useState(false);
  const [sugestao, setSugestao]     = useState(null);
  const [loadingSug, setLoadingSug] = useState(false);
  const [addSecao, setAddSecao]     = useState(false);
  const [novaSecao, setNovaSecao]   = useState({ secao: '', faturamento: '' });
  const [savingSecao, setSavingSecao] = useState(false);
  const [simMsg, setSimMsg]         = useState(false);
  const [dicasOpen, setDicasOpen]   = useState(false);

  const loadData = useCallback(async () => {
    if (!empresa) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const r = await apiFetch(`/api/planejamento/metas?empresa=${empresa}&mes=${mes}`);
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Erro'); }
      setData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [empresa, mes]);

  useEffect(() => { loadData(); }, [loadData]);

  async function openEdit() {
    setEditando(true); setSugestao(null); setLoadingSug(true);
    try {
      const r = await apiFetch(`/api/planejamento/metas/sugestao?empresa=${empresa}&mes=${mes}`);
      if (r.ok) { const j = await r.json(); if (j.sugestao) setSugestao(j); }
    } catch (_) {}
    finally { setLoadingSug(false); }
  }

  async function saveMetas(vals) {
    await apiFetch('/api/planejamento/metas', {
      method: 'POST', body: JSON.stringify({ empresa, mes, ...vals }),
    });
    setEditando(false); loadData();
  }

  async function handleSaveSecao() {
    if (!novaSecao.secao || !novaSecao.faturamento) return;
    setSavingSecao(true);
    try {
      await apiFetch('/api/planejamento/metas/secao', {
        method: 'POST',
        body: JSON.stringify({ empresa, mes, secao: novaSecao.secao, faturamento: parseFloat(novaSecao.faturamento) }),
      });
      setNovaSecao({ secao: '', faturamento: '' }); setAddSecao(false); loadData();
    } finally { setSavingSecao(false); }
  }

  async function handleDeleteSecao(id) {
    await apiFetch(`/api/planejamento/metas/secao/${id}`, { method: 'DELETE' });
    loadData();
  }

  /* ── Dados derivados ─────────────────────────────────────────── */
  const {
    meta = {}, realizado = {}, progressoDiario = [],
    metasSecao = [], secoesDisponiveis = [],
    diasNoMes = 30, diasPassados = 0,
  } = data || {};

  const mesAtual    = getMesAtual();
  const readonly    = mes < mesAtual;
  const pctMes      = diasNoMes > 0 ? (diasPassados / diasNoMes * 100) : 0;
  const temMeta     = meta.faturamento != null || meta.quantidade != null || meta.ticketMedio != null;
  const configPct   = Math.round([meta.faturamento, meta.quantidade, meta.ticketMedio].filter(v => v != null).length / 3 * 100);

  const secoesLivres = secoesDisponiveis.filter(s => !metasSecao.some(m => m.secao === s));

  // Forecast
  const dailyPace = diasPassados > 0 ? (realizado.faturamento || 0) / diasPassados : 0;
  const forecast  = diasNoMes > 0 ? Math.round(dailyPace * diasNoMes) : null;

  // Melhor dia
  let melhorDia = null;
  if (progressoDiario.length > 0) {
    let mx = 0;
    progressoDiario.forEach((d, i) => {
      const dv = i === 0 ? d.realizado : d.realizado - progressoDiario[i-1].realizado;
      if (dv > mx) { mx = dv; melhorDia = { dia: d.dia, val: dv }; }
    });
  }

  const mesAbbr = mesLabel(mes).slice(0, 3).toLowerCase();

  if (!empresa) return (
    <div className="pv-empty-state">
      <Target size={48} style={{ opacity: 0.3 }}/>
      <p>Selecione uma empresa para acessar as metas.</p>
    </div>
  );

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="mc3-root">

      {/* ═══ 1. HERO BANNER ═════════════════════════════════════ */}
      <section className="mc3-hero">
        {/* Left: copy + CTA */}
        <div className="mc3-hero-copy">
          <div className="mc3-hero-badge">
            <Sparkles size={11}/> ECLIPSE BI · METAS
          </div>
          <h1 className="mc3-hero-title">
            Transforme metas<br/>
            em <span className="mc3-orange">resultados.</span>
          </h1>
          <p className="mc3-hero-sub">
            Defina objetivos de faturamento, quantidade de vendas e ticket médio.<br/>
            Acompanhe diariamente o desempenho através de indicadores inteligentes.
          </p>
        </div>

        {/* Center: config progress */}
        <div className="mc3-hero-config">
          <div className="mc3-config-label">Progresso de configuração</div>
          <div className="mc3-config-pct" style={{ color: configPct === 100 ? GREEN : ORANGE }}>
            {configPct}%
          </div>
          <div className="mc3-config-track">
            <div className="mc3-config-fill" style={{ width: `${configPct}%` }}/>
          </div>
          <div className="mc3-config-items">
            {[
              { label: 'Faturamento', val: meta.faturamento },
              { label: 'Qtd Vendas',  val: meta.quantidade  },
              { label: 'Ticket Médio',val: meta.ticketMedio },
            ].map(({ label, val }) => (
              <div key={label} className="mc3-config-item">
                <span className={`mc3-config-dot ${val != null ? 'mc3-config-dot--ok' : ''}`}/>
                <span>{label}</span>
                <span style={{ color: val != null ? GREEN : '#4B5563', marginLeft: 'auto', fontSize: 11 }}>
                  {val != null ? '✓' : '—'}
                </span>
              </div>
            ))}
          </div>
          {!readonly && configPct < 100 && (
            <button className="mc3-config-cta" onClick={openEdit}>
              Configure suas metas →
            </button>
          )}
        </div>

        {/* Right: SVG illustration */}
        <div className="mc3-hero-art-wrap">
          <HeroArt/>
        </div>
      </section>

      {/* ═══ 2. HEADER ══════════════════════════════════════════ */}
      <header className="mc3-header">
        {/* Period selector */}
        <div className="mc3-period">
          <button className="mc3-period-arrow" onClick={() => setMes(m => addMes(m, -1))}>
            <ChevronLeft size={15}/>
          </button>
          <div className="mc3-period-center">
            <span className="mc3-period-mes">{mesLabel(mes)}</span>
            <div className="mc3-period-meta-row">
              <div className="mc3-period-bar-wrap">
                <div className="mc3-period-bar-fill" style={{ width: `${pctMes}%` }}/>
              </div>
              <span className="mc3-period-sub">
                {diasPassados}/{diasNoMes} dias · {pctMes.toFixed(0)}%
              </span>
            </div>
          </div>
          <button className="mc3-period-arrow" onClick={() => setMes(m => addMes(m, 1))} disabled={mes >= mesAtual}>
            <ChevronRight size={15}/>
          </button>
        </div>

        {/* Action buttons */}
        <div className="mc3-header-actions">
          {loading && <RefreshCw size={13} className="spin" style={{ color: ORANGE, opacity: 0.6 }}/>}
          {readonly
            ? <span className="mc3-readonly-badge">Somente visualização</span>
            : <>
                <div style={{ position: 'relative' }}>
                  <button className="mc3-btn-sim" onClick={() => { setSimMsg(true); setTimeout(() => setSimMsg(false), 2500); }}>
                    <Activity size={13}/> Simular Cenários
                  </button>
                  {simMsg && <div className="mc3-sim-tip">Em breve 🚀</div>}
                </div>
                <button className="mc3-btn-def" onClick={openEdit}>
                  <Target size={13}/> Definir Metas
                </button>
              </>
          }
        </div>
      </header>

      {/* ═══ 3. KPI CARDS ═══════════════════════════════════════ */}
      <div className="mc3-kpi-grid">
        <KpiCard3 titulo="Faturamento"  Icone={DollarSign}  cor={ORANGE} unidade="$"
          meta={meta.faturamento} realizado={realizado.faturamento || 0}
          onEdit={readonly ? null : openEdit} mesKey={mes}/>
        <KpiCard3 titulo="Qtd Vendas"   Icone={ShoppingCart} cor={BLUE}   unidade="n"
          meta={meta.quantidade}  realizado={realizado.quantidade  || 0}
          onEdit={readonly ? null : openEdit} mesKey={mes}/>
        <KpiCard3 titulo="Ticket Médio" Icone={BarChart2}    cor={PURPLE} unidade="$"
          meta={meta.ticketMedio} realizado={realizado.ticketMedio || 0}
          onEdit={readonly ? null : openEdit} mesKey={mes}/>
      </div>

      {/* ═══ 4. CHART ROW 70/30 ══════════════════════════════════ */}
      <div className="mc3-main-row">
        {/* Chart 70% */}
        <div className="mc3-chart-card">
          <div className="mc3-chart-head">
            <div>
              <div className="mc3-chart-title">Evolução Diária do Faturamento</div>
              <div className="mc3-chart-sub">Acumulado dia a dia · {mesLabel(mes)}</div>
            </div>
            <div className="mc3-chart-legend">
              <span><span className="mc3-leg-line" style={{ background: ORANGE }}/> Realizado</span>
              {meta.faturamento && <span><span className="mc3-leg-dashed" style={{ background: GREEN }}/> Meta</span>}
            </div>
          </div>

          {progressoDiario.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={progressoDiario} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mc3Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={ORANGE} stopOpacity={0.22}/>
                    <stop offset="95%" stopColor={ORANGE} stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false}/>
                <XAxis dataKey="dia" tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Sora' }}
                  tickLine={false} axisLine={false}/>
                <YAxis tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Sora' }}
                  tickLine={false} axisLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                <Tooltip content={<DailyTooltip/>}/>
                <Area type="monotone" dataKey="realizado" name="Realizado"
                  stroke={ORANGE} strokeWidth={2.5} fill="url(#mc3Grad)"/>
                {meta.faturamento && (
                  <Line type="monotone" dataKey="metaProporcional" name="Meta"
                    stroke={GREEN} strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="mc3-chart-empty">
              <TrendingUp size={32} style={{ opacity: 0.2 }}/>
              <p>Sem dados para {mesLabel(mes)}</p>
            </div>
          )}
        </div>

        {/* Executive Summary 30% */}
        <div className="mc3-summary-card">
          <div className="mc3-summary-title">Resumo do Mês</div>

          <div className="mc3-summary-gauge">
            <SemiGauge pct={pctMes} size={120}/>
          </div>

          <div className="mc3-summary-rows">
            <div className="mc3-sum-row">
              <span className="mc3-sum-lbl">Dias decorridos</span>
              <span className="mc3-sum-val">{diasPassados} de {diasNoMes}</span>
            </div>
            <div className="mc3-sum-row">
              <span className="mc3-sum-lbl">Progresso do mês</span>
              <span className="mc3-sum-val" style={{ color: ORANGE }}>{pctMes.toFixed(0)}%</span>
            </div>
            {melhorDia && (
              <div className="mc3-sum-row">
                <span className="mc3-sum-lbl">Melhor dia</span>
                <span className="mc3-sum-val mc3-sum-highlight">
                  {fmtK(melhorDia.val)}
                  <span className="mc3-sum-badge">{String(melhorDia.dia).padStart(2,'0')}/{mesAbbr}</span>
                </span>
              </div>
            )}
            <div className="mc3-sum-row">
              <span className="mc3-sum-lbl">Meta mensal</span>
              <span className="mc3-sum-val">
                {meta.faturamento ? fmtK(meta.faturamento) : <span style={{ color: '#4B5563' }}>Não definida</span>}
              </span>
            </div>
            <div className="mc3-sum-row">
              <span className="mc3-sum-lbl">Previsão de fechamento</span>
              <span className="mc3-sum-val" style={{ color: forecast && meta.faturamento && forecast >= meta.faturamento ? GREEN : ORANGE }}>
                {forecast ? fmtK(forecast) : 'Não disponível'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 5. METAS POR CATEGORIA ══════════════════════════════ */}
      <section className="mc3-cat-section">
        <div className="mc3-cat-head">
          <div>
            <div className="mc3-cat-title">Metas por Categoria</div>
            <div className="mc3-cat-sub">Acompanhe o desempenho por categoria e área de negócio.</div>
          </div>
          {!readonly && (
            <button className="mc3-btn-add-cat" onClick={() => setAddSecao(v => !v)}>
              <Plus size={13}/> Adicionar Seção
            </button>
          )}
        </div>

        {/* Form de nova seção */}
        {addSecao && !readonly && (
          <div className="mc2-add-row" style={{ marginBottom: 4 }}>
            <CustomSelect options={secoesLivres} value={novaSecao.secao}
              onChange={v => setNovaSecao(f => ({ ...f, secao: v }))} placeholder="Selecione a seção"/>
            <input className="mc-input mc-input-sm" type="number" min="0" placeholder="Meta R$"
              value={novaSecao.faturamento}
              onChange={e => setNovaSecao(f => ({ ...f, faturamento: e.target.value }))}/>
            <button className="mc-btn-save-sm" onClick={handleSaveSecao} disabled={savingSecao}>
              {savingSecao ? <RefreshCw size={12} className="spin"/> : <Save size={12}/>}
            </button>
            <button className="mc-btn-cancel-sm" onClick={() => setAddSecao(false)}><X size={12}/></button>
          </div>
        )}

        {/* Cards de seções */}
        {metasSecao.length === 0 && secoesLivres.length === 0 && !addSecao ? (
          <div className="mc3-cat-empty">
            <Target size={36} style={{ opacity: 0.2 }}/>
            <p>Nenhuma categoria disponível.</p>
          </div>
        ) : (
          <div className="mc3-cat-scroll">
            {/* Com meta */}
            {metasSecao.map((s, i) => {
              const cor     = CAT_COLORS[i % CAT_COLORS.length];
              const CatIcon = CAT_ICONS[i % CAT_ICONS.length];
              const pct     = s.progresso;
              return (
                <div key={s.id} className="mc3-cat-card" style={{ '--cat-cor': cor }}>
                  <div className="mc3-cat-card-top"/>
                  <div className="mc3-cat-icon" style={{ background: `${cor}18`, color: cor }}>
                    <CatIcon size={16}/>
                  </div>
                  <div className="mc3-cat-nome">{s.secao}</div>
                  <div className="mc3-cat-realizado" style={{ color: cor }}>
                    {fmtK(s.realizado)}
                  </div>
                  <div className="mc3-cat-meta">Meta: {fmtK(s.meta)}</div>
                  <div className="mc3-cat-bar-track">
                    <div className="mc3-cat-bar-fill" style={{ width: `${Math.min(100, pct || 0)}%`, background: pColor(pct) }}/>
                  </div>
                  <div className="mc3-cat-footer">
                    <span className="mc3-cat-pct" style={{ color: pColor(pct) }}>
                      {pct != null ? `${pct.toFixed(1)}%` : '—'}
                    </span>
                    {!readonly && (
                      <button className="mc3-cat-del" onClick={() => handleDeleteSecao(s.id)}>
                        <Trash2 size={11}/>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Sem meta — ghost cards */}
            {!readonly && secoesLivres.slice(0, 5).map((s, i) => {
              const idx     = (metasSecao.length + i) % CAT_COLORS.length;
              const cor     = CAT_COLORS[idx];
              const CatIcon = CAT_ICONS[idx % CAT_ICONS.length];
              return (
                <div key={s} className="mc3-cat-card mc3-cat-card--ghost" style={{ '--cat-cor': cor }}>
                  <div className="mc3-cat-icon" style={{ background: `${cor}0D`, color: cor, opacity: 0.5 }}>
                    <CatIcon size={16}/>
                  </div>
                  <div className="mc3-cat-nome" style={{ opacity: 0.5 }}>{s}</div>
                  <div className="mc3-cat-no-meta">Sem meta definida</div>
                  <button className="mc3-cat-add-btn" onClick={openEdit}>
                    <Plus size={11}/> Definir meta
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══ 6. FOOTER DICA ══════════════════════════════════════ */}
      <div className="mc3-footer">
        <Lightbulb size={14} style={{ color: YELLOW, flexShrink: 0 }}/>
        <span>
          <strong>Dica:</strong> Metas bem definidas tornam sua equipe mais focada
          e seus resultados muito melhores!
        </span>
        <button className="mc3-footer-link" onClick={() => setDicasOpen(true)}>Saiba mais sobre metas →</button>
      </div>

      {/* Modal */}
      {editando && (
        <EditModal mes={mes} metaAtual={meta}
          sugestao={sugestao?.sugestao ?? sugestao}
          loadingSug={loadingSug} onSave={saveMetas} onClose={() => setEditando(false)}/>
      )}

      {/* Modal de dicas */}
      {dicasOpen && <DicasModal onClose={() => setDicasOpen(false)}/>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Modal de Boas Práticas de Metas
═══════════════════════════════════════════════════════════════ */
const DICAS = [
  {
    emoji: '🎯',
    titulo: 'Metas S.M.A.R.T.',
    texto: 'Defina metas Específicas, Mensuráveis, Atingíveis, Relevantes e com Prazo definido. Evite metas vagas como "vender mais" — prefira "faturar R$ 150.000 em agosto".',
  },
  {
    emoji: '📊',
    titulo: 'Use o histórico como base',
    texto: 'Analise os últimos 3 meses de desempenho antes de definir a meta. O sistema já calcula automaticamente a sugestão com média + crescimento ao clicar em "Definir Metas".',
  },
  {
    emoji: '📈',
    titulo: 'Crescimento gradual',
    texto: 'Metas muito agressivas desmotivam a equipe. Um crescimento de 5% a 10% ao mês sobre o histórico é sustentável e motivador.',
  },
  {
    emoji: '🗂️',
    titulo: 'Divida por categorias',
    texto: 'Use as "Metas por Categoria" para distribuir o objetivo entre as seções do negócio. Isso facilita o acompanhamento e a responsabilidade de cada área.',
  },
  {
    emoji: '📅',
    titulo: 'Acompanhe diariamente',
    texto: 'O gráfico de evolução diária mostra o acumulado dia a dia. Se o ritmo estiver abaixo do esperado no meio do mês, ainda há tempo para ajustar a operação.',
  },
  {
    emoji: '💡',
    titulo: 'Ticket médio é estratégico',
    texto: 'Aumentar o ticket médio é muitas vezes mais fácil do que aumentar o volume de vendas. Treine a equipe em técnicas de upsell e cross-sell para elevar esse indicador.',
  },
];

function DicasModal({ onClose }) {
  return (
    <div className="mc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mc-modal mc3-dicas-modal">
        <div className="mc-modal-head">
          <div className="mc-modal-titulo">
            <Lightbulb size={17} style={{ color: YELLOW }}/> Boas Práticas de Metas Comerciais
          </div>
          <button className="mc-modal-close" onClick={onClose}><X size={15}/></button>
        </div>
        <div className="mc3-dicas-grid">
          {DICAS.map((d, i) => (
            <div key={i} className="mc3-dica-card">
              <div className="mc3-dica-emoji">{d.emoji}</div>
              <div className="mc3-dica-titulo">{d.titulo}</div>
              <div className="mc3-dica-texto">{d.texto}</div>
            </div>
          ))}
        </div>
        <div className="mc-modal-foot" style={{ justifyContent: 'flex-end' }}>
          <button className="mc-btn-save" onClick={onClose}>Entendido!</button>
        </div>
      </div>
    </div>
  );
}
