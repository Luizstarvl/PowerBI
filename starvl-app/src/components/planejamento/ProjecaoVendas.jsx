/* ═══════════════════════════════════════════════════════════════
   ProjecaoVendas.jsx — Projeção Inteligente de Vendas
   Eclipse BI · Planejamento Comercial
═══════════════════════════════════════════════════════════════ */
import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  TrendingUp, TrendingDown, Target, Rocket, DollarSign, BarChart2,
  AlertTriangle, Download, RefreshCw, ChevronDown, Search,
  ArrowUpRight, ArrowDownRight, Sparkles, Activity, Zap,
  FileSpreadsheet, FileText, Image as ImgIcon, Star, Filter, Eye,
  ChevronUp, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ComposedChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Treemap, Cell
} from 'recharts';

/* ── Mock Data ─────────────────────────────────────────────── */

const EVOLUTION = [
  { mes:'Jan', real:85400, projetado:82000, meta:88000 },
  { mes:'Fev', real:91200, projetado:89500, meta:90000 },
  { mes:'Mar', real:78600, projetado:81000, meta:85000 },
  { mes:'Abr', real:94300, projetado:93000, meta:92000 },
  { mes:'Mai', real:102100, projetado:98500, meta:95000 },
  { mes:'Jun', real:98700, projetado:101000, meta:98000 },
  { mes:'Jul', real:87400, projetado:92000, meta:96000 },
  { mes:'Ago', real:null, projetado:107400, meta:100000 },
  { mes:'Set', real:null, projetado:112000, meta:103000 },
  { mes:'Out', real:null, projetado:118500, meta:106000 },
  { mes:'Nov', real:null, projetado:125000, meta:110000 },
  { mes:'Dez', real:null, projetado:132000, meta:115000 },
];

const TREND = EVOLUTION.map((d, i) => ({
  mes: d.mes,
  historico: d.real,
  projecao: d.projetado,
  media: Math.round((d.real || d.projetado) * 0.95),
  tendencia: 72000 + i * 5100,
}));

const BAR_DATA = [
  { mes:'Jan', realizado:85400, projetado:82000 },
  { mes:'Fev', realizado:91200, projetado:89500 },
  { mes:'Mar', realizado:78600, projetado:81000 },
  { mes:'Abr', realizado:94300, projetado:93000 },
  { mes:'Mai', realizado:102100, projetado:98500 },
  { mes:'Jun', realizado:98700, projetado:101000 },
  { mes:'Jul', realizado:87400, projetado:92000 },
];

const RADAR_DATA = [
  { cat:'Produtos', atual:85, anterior:70 },
  { cat:'Margem', atual:72, anterior:60 },
  { cat:'Volume', atual:91, anterior:85 },
  { cat:'Rentabilidade', atual:68, anterior:75 },
  { cat:'Cobertura', atual:79, anterior:65 },
  { cat:'Giro', atual:88, anterior:82 },
];

const HEATMAP_DAYS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const HEATMAP_HOURS = ['06h','08h','10h','12h','14h','16h','18h','20h','22h'];
const HEATMAP = HEATMAP_DAYS.map(day => ({
  day,
  vals: HEATMAP_HOURS.map(hour => {
    const wk   = !['Dom','Sáb'].includes(day);
    const peak = ['12h','14h','16h'].includes(hour);
    const base = wk ? 45 : 20;
    const add  = peak ? 40 : 0;
    return { hour, v: Math.min(100, base + add + Math.floor(Math.random() * 18)) };
  }),
}));

const SCATTER = [
  { name:'Coca-Cola 2L',    preco:8.99,  volume:450, margem:28, cat:'Bebidas'     },
  { name:'Água 500ml',      preco:2.50,  volume:820, margem:42, cat:'Bebidas'     },
  { name:'Pão de Queijo',   preco:3.99,  volume:380, margem:55, cat:'Padaria'     },
  { name:'Chiclete',        preco:1.50,  volume:290, margem:60, cat:'Conveniência'},
  { name:'Café Expresso',   preco:1.99,  volume:520, margem:65, cat:'Bebidas'     },
  { name:'Salgadinho',      preco:4.50,  volume:210, margem:48, cat:'Snacks'      },
  { name:'Sorvete',         preco:6.90,  volume:130, margem:38, cat:'Gelados'     },
  { name:'Energético',      preco:12.90, volume:95,  margem:32, cat:'Bebidas'     },
  { name:'Chocolate 100g',  preco:5.90,  volume:175, margem:44, cat:'Doces'       },
  { name:'Gasolina',        preco:5.89,  volume:980, margem:8,  cat:'Combustível' },
  { name:'Etanol',          preco:4.29,  volume:720, margem:6,  cat:'Combustível' },
];

const TREEMAP = [
  { name:'Combustível', size:45000 },
  { name:'Bebidas',     size:18000 },
  { name:'Conveniência',size:12000 },
  { name:'Padaria',     size:8500  },
  { name:'Tabaco',      size:7200  },
  { name:'Snacks',      size:5400  },
  { name:'Gelados',     size:3800  },
  { name:'Serviços',    size:2900  },
];
const TREEMAP_COLORS = ['#F97316','#FB923C','#60A5FA','#A78BFA','#EAB308','#22C55E','#EC4899','#14B8A6'];

const WATERFALL = [
  { name:'Meta Inicial', base:0,      val:100000, tipo:'meta'     },
  { name:'Bebidas',      base:100000, val:12000,  tipo:'pos'      },
  { name:'Conveniência', base:112000, val:-8000,  tipo:'neg'      },
  { name:'Combustível',  base:104000, val:7400,   tipo:'pos'      },
  { name:'Serviços',     base:111400, val:-4000,  tipo:'neg'      },
  { name:'Projetado',    base:0,      val:107400, tipo:'total'    },
];

const INSIGHTS = [
  { icon:'📈', cor:'#22C55E', prio:'Alta',  titulo:'Crescimento em Bebidas', desc:'A categoria Bebidas apresentou crescimento de 18% nas últimas quatro semanas, superando a projeção em 6,2 p.p.' },
  { icon:'⚠️', cor:'#EAB308', prio:'Média', titulo:'Conveniência abaixo da projeção', desc:'O grupo Conveniência está 12% abaixo da projeção. Recomenda-se ações promocionais focadas nessa categoria.' },
  { icon:'🚀', cor:'#60A5FA', prio:'Alta',  titulo:'Potencial: Coca-Cola 2L', desc:'O produto Coca-Cola 2L possui potencial de crescimento estimado em 9% para o próximo trimestre.' },
  { icon:'💰', cor:'#F97316', prio:'Alta',  titulo:'Ticket médio em alta', desc:'O ticket médio aumentou R$ 6,42 em relação ao período anterior, sinalizando migração para produtos premium.' },
  { icon:'📊', cor:'#A78BFA', prio:'Média', titulo:'Meta comercial ao alcance', desc:'A previsão indica superação da meta comercial em aproximadamente 6% caso o ritmo atual seja mantido.' },
];

const RANKING = [
  { rank:1, produto:'Coca-Cola 2L',    atual:18450, proj:20200, margem:28, cresc:9.5  },
  { rank:2, produto:'Pão de Queijo',   atual:12300, proj:13500, margem:55, cresc:9.8  },
  { rank:3, produto:'Água 500ml',      atual:9800,  proj:10400, margem:42, cresc:6.1  },
  { rank:4, produto:'Café Expresso',   atual:8700,  proj:9200,  margem:65, cresc:5.7  },
  { rank:5, produto:'Energético 473ml',atual:7200,  proj:8100,  margem:32, cresc:12.5 },
  { rank:6, produto:'Salgadinho 40g',  atual:5400,  proj:5800,  margem:48, cresc:7.4  },
  { rank:7, produto:'Chocolate 100g',  atual:4900,  proj:5100,  margem:44, cresc:4.1  },
  { rank:8, produto:'Sorvete Palito',  atual:3800,  proj:4200,  margem:38, cresc:10.5 },
];

const ANALYTICS = [
  { produto:'Coca-Cola 2L',      cat:'Bebidas',     forn:'Coca-Cola FEMSA', atual:18450, proj:20200, meta:19000, margem:28, lucro:5166,  ticket:8.99,  qtd:2052, part:8.2,  var:9.5,  desv:1.2  },
  { produto:'Pão de Queijo 50g', cat:'Padaria',     forn:'Coqueiro',        atual:12300, proj:13500, meta:12000, margem:55, lucro:6765,  ticket:3.99,  qtd:3083, part:5.4,  var:9.8,  desv:-2.1 },
  { produto:'Água Mineral 500ml',cat:'Bebidas',     forn:'Bonafont',        atual:9800,  proj:10400, meta:9500,  margem:42, lucro:4116,  ticket:2.50,  qtd:3920, part:4.3,  var:6.1,  desv:3.2  },
  { produto:'Café Expresso',     cat:'Bebidas',     forn:'3 Corações',      atual:8700,  proj:9200,  meta:9000,  margem:65, lucro:5655,  ticket:1.99,  qtd:4372, part:3.8,  var:5.7,  desv:-3.3 },
  { produto:'Energético 473ml',  cat:'Bebidas',     forn:'Red Bull',        atual:7200,  proj:8100,  meta:7000,  margem:32, lucro:2304,  ticket:12.90, qtd:558,  part:3.2,  var:12.5, desv:2.9  },
  { produto:'Salgadinho 40g',    cat:'Snacks',      forn:'PepsiCo',         atual:5400,  proj:5800,  meta:5500,  margem:48, lucro:2592,  ticket:4.50,  qtd:1200, part:2.4,  var:7.4,  desv:-1.8 },
  { produto:'Chocolate 100g',    cat:'Doces',       forn:'Nestlé',          atual:4900,  proj:5100,  meta:5000,  margem:44, lucro:2156,  ticket:5.90,  qtd:831,  part:2.2,  var:4.1,  desv:-0.5 },
  { produto:'Sorvete Palito',    cat:'Gelados',     forn:'Kibon',           atual:3800,  proj:4200,  meta:3900,  margem:38, lucro:1444,  ticket:3.50,  qtd:1086, part:1.7,  var:10.5, desv:3.8  },
  { produto:'Chiclete',          cat:'Conveniência',forn:'Mondelez',        atual:3200,  proj:3400,  meta:3500,  margem:60, lucro:1920,  ticket:1.50,  qtd:2133, part:1.4,  var:6.3,  desv:-3.1 },
  { produto:'Suco de Laranja',   cat:'Bebidas',     forn:'Del Valle',       atual:2900,  proj:3100,  meta:3000,  margem:35, lucro:1015,  ticket:5.50,  qtd:527,  part:1.3,  var:6.9,  desv:1.2  },
];

/* ── Formatters ────────────────────────────────────────────── */
const fmtR = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(v||0);
const fmtK = v => v>=1e6?`R$ ${(v/1e6).toFixed(2)}M`:v>=1e3?`R$ ${(v/1e3).toFixed(1)}K`:`R$ ${v}`;
const fmtP = (v,plus=true) => `${plus&&v>0?'+':''}${(+v||0).toFixed(1)}%`;
const fmtN = v => new Intl.NumberFormat('pt-BR').format(v||0);

/* ── Shared chart theme ────────────────────────────────────── */
const CT = {
  grid:  'rgba(255,255,255,0.05)',
  axis:  'rgba(255,255,255,0.35)',
  orange:'#F97316', blue:'#60A5FA', green:'#22C55E',
  red:   '#EF4444', yellow:'#EAB308', purple:'#A78BFA',
};

/* ── Custom Tooltip ────────────────────────────────────────── */
function ChartTip({ active, payload, label, fmt = fmtR }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="pv-tip">
      <div className="pv-tip-label">{label}</div>
      {payload.map((e, i) => e.value != null && (
        <div key={i} className="pv-tip-row">
          <span className="pv-tip-dot" style={{ background: e.color }} />
          <span className="pv-tip-name">{e.name}</span>
          <span className="pv-tip-val">{typeof e.value === 'number' && e.value > 100 ? fmt(e.value) : `${e.value}`}</span>
        </div>
      ))}
    </div>
  );
}

function ScatterTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="pv-tip">
      <div className="pv-tip-label" style={{ color: CT.orange }}>{d.name}</div>
      <div className="pv-tip-row"><span className="pv-tip-name">Categoria</span><span className="pv-tip-val">{d.cat}</span></div>
      <div className="pv-tip-row"><span className="pv-tip-name">Preço</span><span className="pv-tip-val">R$ {d.preco}</span></div>
      <div className="pv-tip-row"><span className="pv-tip-name">Volume</span><span className="pv-tip-val">{fmtN(d.volume)} un.</span></div>
      <div className="pv-tip-row"><span className="pv-tip-name">Margem</span><span className="pv-tip-val">{d.margem}%</span></div>
    </div>
  );
}

/* ── Chart Card wrapper ────────────────────────────────────── */
function ChartCard({ title, subtitle, children, className = '', actions }) {
  return (
    <div className={`pv-chart-card ${className}`}>
      <div className="pv-chart-card-head">
        <div>
          <div className="pv-chart-title">{title}</div>
          {subtitle && <div className="pv-chart-sub">{subtitle}</div>}
        </div>
        {actions && <div className="pv-chart-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/* ── Banner ────────────────────────────────────────────────── */
function Banner() {
  return (
    <div className="pv-banner">
      {/* Animated background */}
      <div className="pv-banner-bg" />
      <div className="pv-banner-left">
        <div className="pv-banner-eyebrow">
          <span className="pv-banner-dot" />
          ANÁLISE PREDITIVA · ECLIPSE BI
        </div>
        <h1 className="pv-banner-title">
          Projeção <span className="pv-banner-accent">Inteligente</span><br />de Vendas
        </h1>
        <p className="pv-banner-sub">
          Analise tendências, compare históricos e acompanhe previsões para
          tomar decisões estratégicas com mais segurança e precisão.
        </p>
        <div className="pv-banner-chips">
          <span className="pv-chip"><Activity size={12} /> Tempo Real</span>
          <span className="pv-chip"><Sparkles size={12} /> IA Preditiva</span>
          <span className="pv-chip"><Zap size={12} /> Alta Precisão</span>
        </div>
      </div>
      <div className="pv-banner-right">
        <svg className="pv-banner-svg" viewBox="0 0 520 240" fill="none">
          <defs>
            <linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#F97316" stopOpacity="0.9"/>
            </linearGradient>
            <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.25"/>
              <stop offset="100%" stopColor="#F97316" stopOpacity="0"/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[40,80,120,160,200].map(y => (
            <line key={y} x1="40" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          ))}
          {[80,160,240,320,400,480].map(x => (
            <line key={x} x1={x} y1="20" x2={x} y2="220" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          ))}

          {/* Bars */}
          {[
            [70,160,60],[150,130,60],[230,100,60],[310,145,60],[390,80,60]
          ].map(([x,h,w],i) => (
            <g key={i}>
              <rect x={x} y={240-h-20} width={w} height={h}
                fill={`rgba(249,115,22,${0.15 + i*0.04})`}
                rx="4"
                className={`pv-bar-anim pv-bar-${i}`}
              />
              <rect x={x} y={240-h-20} width={w} height="3"
                fill="#F97316" rx="2"
                className={`pv-bar-anim pv-bar-${i}`}
              />
            </g>
          ))}

          {/* Area under curve */}
          <path d="M60,180 C120,160 180,130 240,110 C300,90 360,140 420,70 L420,220 L60,220Z"
            fill="url(#areaG)"/>

          {/* Main trend line */}
          <path d="M60,180 C120,160 180,130 240,110 C300,90 360,140 420,70"
            stroke="url(#lineG)" strokeWidth="2.5" strokeLinecap="round"
            filter="url(#glow)" className="pv-svg-line"/>

          {/* Forecast extension (dashed) */}
          <path d="M420,70 C450,50 470,35 500,20"
            stroke="#F97316" strokeWidth="2" strokeDasharray="5,4" strokeLinecap="round"
            opacity="0.8"/>

          {/* Data points */}
          {[[60,180],[120,165],[180,132],[240,112],[300,95],[360,140],[420,70]].map(([cx,cy],i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="12" fill="rgba(249,115,22,0.08)"/>
              <circle cx={cx} cy={cy} r="4"  fill="#F97316" filter="url(#glow)"/>
            </g>
          ))}

          {/* Forecast dot */}
          <circle cx="500" cy="20" r="7" fill="rgba(249,115,22,0.2)"/>
          <circle cx="500" cy="20" r="4" fill="#F97316" filter="url(#glow)"/>

          {/* Callout */}
          <rect x="395" y="30" width="110" height="38" rx="8"
            fill="rgba(249,115,22,0.12)" stroke="rgba(249,115,22,0.4)" strokeWidth="1"/>
          <text x="450" y="46" textAnchor="middle" fill="#F97316" fontSize="8" fontWeight="700">AGO (PREVISÃO)</text>
          <text x="450" y="61" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="800">R$ 1,07M</text>

          {/* Particles */}
          {[[140,60],[280,30],[380,190],[460,130],[100,40],[200,200]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="2"
              fill="#F97316" opacity="0.5"
              className={`pv-particle pv-p-${i}`}/>
          ))}

          {/* Axis labels */}
          {['Jan','Mar','Mai','Jul','Ago*'].map((l, i) => (
            <text key={l} x={60 + i * 90} y="235" textAnchor="middle"
              fill="rgba(255,255,255,0.3)" fontSize="9">{l}</text>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ── Filter Bar ────────────────────────────────────────────── */
const PERIODOS  = ['Hoje','Semana','Mês','Trimestre','Ano','Personalizado'];
const EMPRESAS  = ['Todos','Posto Central','Filial Norte','Filial Sul'];
const GRUPOS    = ['Todos','Bebidas','Snacks','Combustível','Padaria','Gelados'];
const TIPOS     = ['Todos','Varejo','Atacado','Delivery','Frota'];

function FilterSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  React.useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  return (
    <div className="pv-fsel" ref={ref}>
      <div className="pv-fsel-label">{label}</div>
      <button className="pv-fsel-btn" onClick={() => setOpen(o => !o)}>
        <span>{value}</span><ChevronDown size={12}/>
      </button>
      {open && (
        <div className="pv-fsel-drop">
          {options.map(o => (
            <button key={o} className={`pv-fsel-opt${value===o?' active':''}`}
              onClick={() => { onChange(o); setOpen(false); }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterBar({ onRefresh, loading }) {
  const [periodo, setPeriodo] = useState('Mês');
  const [empresa, setEmpresa] = useState('Todos');
  const [grupo,   setGrupo]   = useState('Todos');
  const [tipo,    setTipo]    = useState('Todos');

  return (
    <div className="pv-filterbar">
      <div className="pv-filterbar-inner">
        <div className="pv-filterbar-chip"><Filter size={13}/> Filtros</div>

        <div className="pv-filterbar-period">
          {PERIODOS.map(p => (
            <button key={p} className={`pv-period-btn${periodo===p?' active':''}`}
              onClick={() => setPeriodo(p)}>{p}</button>
          ))}
        </div>

        <div className="pv-filterbar-sels">
          <FilterSelect label="Empresa"   options={EMPRESAS} value={empresa} onChange={setEmpresa}/>
          <FilterSelect label="Grupo"     options={GRUPOS}   value={grupo}   onChange={setGrupo}/>
          <FilterSelect label="Tipo Venda"options={TIPOS}    value={tipo}    onChange={setTipo}/>
        </div>

        <button className="pv-refresh-btn" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'pv-spin' : ''}/>
          {loading ? 'Atualizando…' : 'Atualizar Projeção'}
        </button>
      </div>
    </div>
  );
}

/* ── KPI Cards ─────────────────────────────────────────────── */
function GaugeMini({ value }) {
  const color = value >= 90 ? CT.green : value >= 80 ? CT.yellow : CT.red;
  const arc = (value / 100) * Math.PI;
  const x = 40 - 28 * Math.cos(Math.PI - arc);
  const y = 30 - 28 * Math.sin(Math.PI - arc);
  return (
    <svg width="80" height="46" viewBox="0 0 80 46">
      <path d="M12,36 A28,28 0 0,1 68,36" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinecap="round"/>
      <path d={`M12,36 A28,28 0 0,1 ${x},${y}`} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}/>
      <text x="40" y="40" textAnchor="middle" fill={color} fontSize="11" fontWeight="700">{value}%</text>
    </svg>
  );
}

function KpiCard({ icon: Icon, label, value, sub, delta, deltaPositive, badge, special, children }) {
  return (
    <div className="pv-kpi">
      <div className="pv-kpi-head">
        <div className="pv-kpi-icon"><Icon size={16}/></div>
        <span className="pv-kpi-label">{label}</span>
      </div>
      <div className="pv-kpi-value">{value}</div>
      {sub && <div className="pv-kpi-sub">{sub}</div>}
      {children}
      {delta != null && (
        <div className={`pv-kpi-delta ${deltaPositive ? 'pos' : 'neg'}`}>
          {deltaPositive ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
          {delta}
        </div>
      )}
      {badge && <div className="pv-kpi-badge">{badge}</div>}
    </div>
  );
}

function KpiSection({ loading }) {
  if (loading) return (
    <div className="pv-kpi-row">
      {Array.from({length:6}).map((_,i) => <div key={i} className="pv-kpi pv-skel"/>)}
    </div>
  );
  return (
    <div className="pv-kpi-row">
      <KpiCard icon={TrendingUp}   label="Venda Projetada"       value="R$ 1,07M"  delta="+12% vs anterior"  deltaPositive />
      <KpiCard icon={DollarSign}   label="Venda Real (até hoje)" value="R$ 637K"   sub="Meta atingida: 63%" />
      <KpiCard icon={Target}       label="Precisão da Projeção"  value="">
        <GaugeMini value={86}/>
      </KpiCard>
      <KpiCard icon={Star}         label="Meta Comercial"        value="R$ 1,0M">
        <div className="pv-progress-wrap">
          <div className="pv-progress-bar" style={{ width:'85%', background: CT.orange }}/>
        </div>
        <span className="pv-kpi-sub">85% alcançado</span>
      </KpiCard>
      <KpiCard icon={BarChart2}    label="Desvio da Meta"        value="+R$ 74K"   delta="+7,4% acima"       deltaPositive />
      <KpiCard icon={Rocket}       label="Crescimento Esperado"  value="+11,8%"    delta="vs mesmo período"  deltaPositive />
    </div>
  );
}

/* ── Section 1: Evolução + Tendência ───────────────────────── */
function EvolutionChart() {
  return (
    <ChartCard
      title="Evolução da Venda Projetada × Venda Real"
      subtitle="Comparativo mensal: realizado, projeção e meta"
      actions={<button className="pv-icon-btn"><Download size={14}/></button>}>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={EVOLUTION} margin={{top:10,right:20,left:10,bottom:0}}>
          <defs>
            <linearGradient id="realG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={CT.blue}   stopOpacity={0.18}/>
              <stop offset="95%" stopColor={CT.blue}   stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="projG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={CT.orange} stopOpacity={0.18}/>
              <stop offset="95%" stopColor={CT.orange} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="mes" tick={{ fill:CT.axis, fontSize:11 }} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={v => `R$${v/1000}K`} tick={{ fill:CT.axis, fontSize:10 }} axisLine={false} tickLine={false} width={56}/>
          <Tooltip content={<ChartTip/>}/>
          <Legend wrapperStyle={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}/>
          <ReferenceLine y={96000} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 3"/>
          <Area type="monotone" dataKey="real"      name="Venda Real"      stroke={CT.blue}   fill="url(#realG)" strokeWidth={2} dot={{ r:3, fill:CT.blue,   strokeWidth:0 }}/>
          <Area type="monotone" dataKey="projetado" name="Projetado"        stroke={CT.orange} fill="url(#projG)" strokeWidth={2} strokeDasharray="5 3" dot={{ r:3, fill:CT.orange, strokeWidth:0 }}/>
          <Line type="monotone" dataKey="meta"      name="Meta"             stroke={CT.green}  strokeWidth={1.5}  strokeDasharray="3 3" dot={false}/>
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function TrendChart() {
  return (
    <ChartCard
      title="Tendência de Crescimento"
      subtitle="Curvas histórica, projetada e média móvel">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={TREND} margin={{top:10,right:20,left:10,bottom:0}}>
          <defs>
            <linearGradient id="histG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={CT.purple} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={CT.purple} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="projG2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={CT.orange} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={CT.orange} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="mes" tick={{ fill:CT.axis, fontSize:11 }} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={v=>`${v/1000}K`} tick={{ fill:CT.axis, fontSize:10 }} axisLine={false} tickLine={false} width={44}/>
          <Tooltip content={<ChartTip/>}/>
          <Legend wrapperStyle={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}/>
          <Area type="monotone" dataKey="historico"  name="Histórico"  stroke={CT.purple} fill="url(#histG)" strokeWidth={2}/>
          <Area type="monotone" dataKey="projecao"   name="Projeção"   stroke={CT.orange} fill="url(#projG2)" strokeWidth={2} strokeDasharray="5 3"/>
          <Line type="monotone" dataKey="tendencia"  name="Tendência"  stroke={CT.yellow} strokeWidth={1.5} strokeDasharray="3 3" dot={false}/>
          <Line type="monotone" dataKey="media"      name="Média Móvel"stroke={CT.blue}   strokeWidth={1.5} dot={false} opacity={0.6}/>
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ── Section 2: Barras + Waterfall ─────────────────────────── */
function BarComparativo() {
  const [active, setActive] = useState(null);
  return (
    <ChartCard
      title="Comparativo Mensal"
      subtitle="Realizado × Projetado — clique nas barras para detalhar">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={BAR_DATA} margin={{top:10,right:20,left:10,bottom:0}}
          onClick={d => setActive(d?.activeLabel)}>
          <CartesianGrid stroke={CT.grid} vertical={false}/>
          <XAxis dataKey="mes" tick={{ fill:CT.axis, fontSize:11 }} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={v=>`${v/1000}K`} tick={{ fill:CT.axis, fontSize:10 }} axisLine={false} tickLine={false} width={44}/>
          <Tooltip content={<ChartTip/>}/>
          <Legend wrapperStyle={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}/>
          <Bar dataKey="realizado"  name="Realizado"  fill={CT.blue}   radius={[4,4,0,0]} maxBarSize={28}
            opacity={active ? (d => d.mes===active?1:0.4) : 1}/>
          <Bar dataKey="projetado"  name="Projetado"  fill={CT.orange} radius={[4,4,0,0]} maxBarSize={28}
            opacity={active ? (d => d.mes===active?1:0.4) : 0.7}/>
        </BarChart>
      </ResponsiveContainer>
      {active && (
        <div className="pv-bar-detail">
          <span>Período selecionado: <strong>{active}</strong></span>
          <button className="pv-icon-btn" onClick={() => setActive(null)}>✕</button>
        </div>
      )}
    </ChartCard>
  );
}

function WaterfallChart() {
  const max = 135000;
  return (
    <ChartCard
      title="Variação da Receita"
      subtitle="Contribuição de cada fator entre meta e projetado">
      <div className="pv-waterfall">
        {WATERFALL.map((d, i) => {
          const isNeg   = d.tipo === 'neg';
          const isTotal = d.tipo === 'total';
          const isMeta  = d.tipo === 'meta';
          const barH    = Math.abs(d.val) / max * 160;
          const baseH   = d.base / max * 160;
          const color   = isTotal ? CT.orange : isMeta ? CT.blue : isNeg ? CT.red : CT.green;
          return (
            <div key={i} className="pv-wf-col">
              <div className="pv-wf-bar-wrap">
                {/* spacer to push bar down */}
                <div style={{ flex: 1, minHeight: `${160 - baseH - (isNeg ? 0 : barH)}px` }}/>
                {isNeg && <div style={{ height: `${barH}px`, background: color, borderRadius:'4px 4px 0 0', opacity:.85, boxShadow:`0 0 8px ${color}55` }}/>}
                {!isNeg && <div style={{ height: `${barH}px`, background: color, borderRadius:'4px 4px 0 0', opacity: isTotal ? 1 : .85, boxShadow:`0 0 8px ${color}55` }}/>}
              </div>
              <div className="pv-wf-label">{d.name}</div>
              <div className="pv-wf-val" style={{ color }}>{isNeg?'-':isTotal||isMeta?'':'+'}
                {Math.abs(d.val)>=1000?`R$${(Math.abs(d.val)/1000).toFixed(0)}K`:`R$${Math.abs(d.val)}`}
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

/* ── Section 3: Radar ──────────────────────────────────────── */
function RadarSection() {
  return (
    <ChartCard
      title="Performance por Categoria"
      subtitle="Comparativo entre período atual e anterior"
      className="pv-full">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={RADAR_DATA} margin={{top:10,right:40,left:40,bottom:10}}>
          <PolarGrid stroke={CT.grid}/>
          <PolarAngleAxis dataKey="cat" tick={{ fill:CT.axis, fontSize:11 }}/>
          <PolarRadiusAxis tick={false} axisLine={false} domain={[0,100]}/>
          <Radar name="Período Atual"   dataKey="atual"    stroke={CT.orange} fill={CT.orange} fillOpacity={0.18} strokeWidth={2}/>
          <Radar name="Período Anterior"dataKey="anterior" stroke={CT.blue}   fill={CT.blue}   fillOpacity={0.12} strokeWidth={1.5} strokeDasharray="4 2"/>
          <Tooltip content={<ChartTip fmt={v=>`${v}`}/>}/>
          <Legend wrapperStyle={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}/>
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ── Section 4: Heatmap ────────────────────────────────────── */
function heatColor(v) {
  if (v < 25) return 'rgba(249,115,22,0.06)';
  if (v < 45) return 'rgba(249,115,22,0.20)';
  if (v < 65) return 'rgba(249,115,22,0.45)';
  if (v < 82) return 'rgba(249,115,22,0.70)';
  return 'rgba(249,115,22,0.95)';
}

function HeatmapSection() {
  const [tip, setTip] = useState(null);
  return (
    <ChartCard
      title="Mapa de Intensidade das Vendas"
      subtitle="Volume de vendas por dia da semana e horário">
      <div className="pv-heatmap">
        <div className="pv-hm-hours">
          <div className="pv-hm-corner"/>
          {HEATMAP_HOURS.map(h => <div key={h} className="pv-hm-hlabel">{h}</div>)}
        </div>
        {HEATMAP.map(row => (
          <div key={row.day} className="pv-hm-row">
            <div className="pv-hm-dlabel">{row.day}</div>
            {row.vals.map(cell => (
              <div key={cell.hour}
                className="pv-hm-cell"
                style={{ background: heatColor(cell.v) }}
                onMouseEnter={e => setTip({ day:row.day, hour:cell.hour, v:cell.v, x:e.clientX, y:e.clientY })}
                onMouseLeave={() => setTip(null)}
              />
            ))}
          </div>
        ))}
        <div className="pv-hm-legend">
          <span>Baixo</span>
          <div className="pv-hm-grad"/>
          <span>Alto</span>
        </div>
      </div>
      {tip && (
        <div className="pv-tip pv-tip-fixed" style={{ top: tip.y - 80, left: tip.x - 60 }}>
          <div className="pv-tip-label">{tip.day} · {tip.hour}</div>
          <div className="pv-tip-row"><span className="pv-tip-name">Intensidade</span>
            <span className="pv-tip-val" style={{ color:CT.orange }}>{tip.v}%</span></div>
        </div>
      )}
    </ChartCard>
  );
}

/* ── Section 5: Scatter ────────────────────────────────────── */
const CAT_COLORS = { 'Bebidas':CT.blue, 'Padaria':CT.yellow, 'Conveniência':CT.purple, 'Snacks':CT.green, 'Gelados':CT.red, 'Doces':CT.red, 'Combustível':CT.orange, 'Tabaco':'#94A3B8' };

function ScatterSection() {
  const bycat = useMemo(() => {
    const map = {};
    SCATTER.forEach(d => { (map[d.cat] = map[d.cat]||[]).push(d); });
    return Object.entries(map);
  }, []);
  return (
    <ChartCard
      title="Preço × Volume"
      subtitle="Identifique produtos com alto preço/baixo volume e vice-versa">
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{top:10,right:20,left:10,bottom:10}}>
          <CartesianGrid stroke={CT.grid}/>
          <XAxis type="number" dataKey="preco"  name="Preço"  unit=" R$" tick={{ fill:CT.axis, fontSize:10 }} label={{ value:'Preço (R$)', position:'insideBottom', offset:-5, fill:CT.axis, fontSize:10 }}/>
          <YAxis type="number" dataKey="volume" name="Volume" unit=" un" tick={{ fill:CT.axis, fontSize:10 }} label={{ value:'Volume', angle:-90, position:'insideLeft', fill:CT.axis, fontSize:10 }}/>
          <Tooltip content={<ScatterTip/>}/>
          <Legend wrapperStyle={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}/>
          {bycat.map(([cat, data]) => (
            <Scatter key={cat} name={cat} data={data} fill={CAT_COLORS[cat]||CT.axis}/>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ── Section 6: Treemap ────────────────────────────────────── */
function TreemapContent({ root, depth, x, y, width, height, name, value }) {
  if (!width || !height || width < 30 || height < 20) return null;
  return (
    <g>
      <rect x={x+1} y={y+1} width={width-2} height={height-2}
        rx={6} fill={TREEMAP_COLORS[root?.children?.findIndex(c=>c.name===name)%TREEMAP_COLORS.length] || CT.orange}
        opacity={0.8}/>
      {width > 60 && height > 30 && (
        <>
          <text x={x+width/2} y={y+height/2-6} textAnchor="middle" fill="#fff" fontSize={Math.min(13, width/7)} fontWeight={700}>{name}</text>
          <text x={x+width/2} y={y+height/2+10} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize={Math.min(11, width/8)}>{fmtK(value)}</text>
        </>
      )}
    </g>
  );
}

function TreemapSection() {
  return (
    <ChartCard
      title="Participação nas Vendas"
      subtitle="Faturamento proporcional por grupo/categoria">
      <ResponsiveContainer width="100%" height={300}>
        <Treemap data={TREEMAP} dataKey="size" aspectRatio={4/3}
          content={<TreemapContent/>}>
          <Tooltip formatter={(v,n) => [fmtR(v), n]}/>
        </Treemap>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ── Insights Panel ────────────────────────────────────────── */
function InsightsPanel() {
  return (
    <div className="pv-insights">
      <div className="pv-section-title">
        <Sparkles size={18} style={{ color:CT.orange }}/>
        Insights Automáticos
        <span className="pv-badge-pill">IA</span>
      </div>
      <div className="pv-insights-grid">
        {INSIGHTS.map((ins, i) => (
          <div key={i} className="pv-insight-card" style={{ '--ins-color': ins.cor }}>
            <div className="pv-insight-top">
              <span className="pv-insight-icon">{ins.icon}</span>
              <div>
                <div className="pv-insight-titulo">{ins.titulo}</div>
                <div className="pv-insight-prio" style={{ color: ins.cor }}>Prioridade {ins.prio}</div>
              </div>
            </div>
            <p className="pv-insight-desc">{ins.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Descriptive Analysis ──────────────────────────────────── */
function DescriptiveAnalysis() {
  return (
    <div className="pv-analysis">
      <div className="pv-section-title">
        <Activity size={18} style={{ color:CT.orange }}/>
        Análise Descritiva da Projeção
        <span className="pv-badge-pill">Auto</span>
      </div>
      <div className="pv-analysis-body">
        <p>
          No período analisado, a projeção indica <strong>crescimento de 11,8%</strong> em relação ao mesmo período anterior.
          A tendência é sustentada principalmente pelo aumento nas vendas das categorias de <strong>Bebidas e Conveniência</strong>,
          que representam <strong>64%</strong> do faturamento previsto.
        </p>
        <p>
          Apesar do crescimento esperado, observa-se um <strong>desvio negativo em Conveniência</strong>, que está 12% abaixo
          da projeção, sugerindo oportunidades para campanhas promocionais direcionadas. Os produtos de alta margem
          — como Café Expresso (65%) e Pão de Queijo (55%) — estão com bom desempenho e sustentam a rentabilidade geral.
        </p>
        <p>
          Caso o ritmo atual seja mantido, estima-se que a <strong>meta comercial seja superada em aproximadamente 6%</strong>,
          com a venda projetada encerrando o período em torno de <strong>R$ 1,07 milhão</strong>.
          A precisão do modelo está em <strong>86%</strong>, classificada como Alta confiabilidade.
        </p>
      </div>
    </div>
  );
}

/* ── Ranking Table ─────────────────────────────────────────── */
function RankingTable() {
  const maxPj = Math.max(...RANKING.map(r=>r.proj));
  return (
    <div className="pv-ranking">
      <div className="pv-section-title">
        <Star size={18} style={{ color:CT.orange }}/>
        Top Produtos Projetados
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Produto</th>
              <th>Venda Atual</th>
              <th>Projetado</th>
              <th>Diferença</th>
              <th>Margem</th>
              <th>Crescimento</th>
              <th>Progresso</th>
            </tr>
          </thead>
          <tbody>
            {RANKING.map(r => {
              const dif = r.proj - r.atual;
              return (
                <tr key={r.rank} className="pv-tr">
                  <td><span className={`pv-rank-badge r${r.rank}`}>{r.rank}</span></td>
                  <td className="pv-td-name">{r.produto}</td>
                  <td>{fmtR(r.atual)}</td>
                  <td style={{ color:CT.orange, fontWeight:700 }}>{fmtR(r.proj)}</td>
                  <td style={{ color: dif>=0 ? CT.green : CT.red }}>
                    {dif>=0?'+':''}{fmtR(dif)}
                  </td>
                  <td>{r.margem}%</td>
                  <td style={{ color: CT.green }}>+{r.cresc}%</td>
                  <td>
                    <div className="pv-mini-progress">
                      <div className="pv-mini-bar" style={{ width:`${(r.proj/maxPj)*100}%` }}/>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Analytics Table ───────────────────────────────────────── */
const ANALYTICS_COLS = [
  { key:'produto',  label:'Produto',       sortable:true  },
  { key:'cat',      label:'Categoria',     sortable:true  },
  { key:'forn',     label:'Fornecedor',    sortable:false },
  { key:'atual',    label:'Venda Atual',   sortable:true, fmt:fmtR  },
  { key:'proj',     label:'Projetado',     sortable:true, fmt:fmtR  },
  { key:'meta',     label:'Meta',          sortable:true, fmt:fmtR  },
  { key:'margem',   label:'Margem',        sortable:true, fmt:v=>`${v}%` },
  { key:'lucro',    label:'Lucro',         sortable:true, fmt:fmtR  },
  { key:'ticket',   label:'Ticket Médio',  sortable:true, fmt:v=>`R$ ${v.toFixed(2)}` },
  { key:'qtd',      label:'Quantidade',    sortable:true, fmt:fmtN  },
  { key:'part',     label:'Part.%',        sortable:true, fmt:v=>`${v}%` },
  { key:'var',      label:'Variação',      sortable:true, fmt:v=><span style={{color:v>=0?CT.green:CT.red}}>{fmtP(v)}</span> },
  { key:'desv',     label:'Desvio',        sortable:true, fmt:v=><span style={{color:v>=0?CT.green:CT.red}}>{fmtP(v)}</span> },
];

function AnalyticsTable() {
  const [search, setSearch]   = useState('');
  const [sortKey, setSortKey] = useState('atual');
  const [sortDir, setSortDir] = useState('desc');
  const [page,    setPage]    = useState(1);
  const PAGE_SIZE = 5;

  const filtered = useMemo(() => {
    let d = ANALYTICS;
    if (search.trim()) {
      const q = search.toLowerCase();
      d = d.filter(r => r.produto.toLowerCase().includes(q) || r.cat.toLowerCase().includes(q) || r.forn.toLowerCase().includes(q));
    }
    return [...d].sort((a,b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [search, sortKey, sortDir]);

  const pages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  }

  return (
    <div className="pv-analytics">
      <div className="pv-section-title">
        <Eye size={18} style={{ color:CT.orange }}/>
        Tabela Analítica Completa
      </div>
      <div className="pv-analytics-toolbar">
        <div className="pv-search-wrap">
          <Search size={13} className="pv-search-icon"/>
          <input className="pv-search" placeholder="Buscar produto, categoria, fornecedor…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
        </div>
        <div className="pv-export-btns">
          <button className="pv-icon-btn" title="Exportar Excel"><FileSpreadsheet size={14}/></button>
          <button className="pv-icon-btn" title="Exportar PDF"><FileText size={14}/></button>
          <button className="pv-icon-btn" title="Exportar Imagem"><ImgIcon size={14}/></button>
        </div>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table pv-table-analytics">
          <thead>
            <tr>
              {ANALYTICS_COLS.map(c => (
                <th key={c.key} onClick={c.sortable ? ()=>toggleSort(c.key) : undefined}
                  className={c.sortable ? 'sortable' : ''}>
                  {c.label}
                  {c.sortable && sortKey===c.key && (
                    sortDir==='asc' ? <ChevronUp size={11}/> : <ChevronDown size={11}/>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} className="pv-tr">
                {ANALYTICS_COLS.map(c => (
                  <td key={c.key} className={c.key==='produto'?'pv-td-name':''}>
                    {c.fmt ? c.fmt(row[c.key]) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={ANALYTICS_COLS.length} className="pv-td-empty">Nenhum resultado encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pv-pagination">
        <span className="pv-page-info">{filtered.length} registros · pág {page} de {pages}</span>
        <div className="pv-page-btns">
          <button className="pv-page-btn" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={13}/></button>
          {Array.from({length:pages},(_,i)=>i+1).map(p => (
            <button key={p} className={`pv-page-btn${page===p?' active':''}`} onClick={()=>setPage(p)}>{p}</button>
          ))}
          <button className="pv-page-btn" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}><ChevronRight size={13}/></button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Export ───────────────────────────────────────────── */
export default function ProjecaoVendas({ empresasKey }) {
  const [loading, setLoading] = useState(false);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1800);
  }, []);

  return (
    <div className="pv-page">
      <Banner/>
      <FilterBar onRefresh={handleRefresh} loading={loading}/>

      <div className="pv-body">
        {/* KPIs */}
        <KpiSection loading={loading}/>

        {/* Seção 1: Evolução + Tendência */}
        <div className="pv-chart-row">
          <EvolutionChart/>
          <TrendChart/>
        </div>

        {/* Seção 2: Barras + Waterfall */}
        <div className="pv-chart-row">
          <BarComparativo/>
          <WaterfallChart/>
        </div>

        {/* Seção 3: Radar */}
        <RadarSection/>

        {/* Seção 4: Heatmap */}
        <HeatmapSection/>

        {/* Seção 5 + 6: Scatter + Treemap */}
        <div className="pv-chart-row">
          <ScatterSection/>
          <TreemapSection/>
        </div>

        {/* Insights */}
        <InsightsPanel/>

        {/* Análise Descritiva */}
        <DescriptiveAnalysis/>

        {/* Ranking */}
        <RankingTable/>

        {/* Tabela Analítica */}
        <AnalyticsTable/>
      </div>
    </div>
  );
}
