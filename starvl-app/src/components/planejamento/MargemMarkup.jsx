/* ═══════════════════════════════════════════════════════════════
   MargemMarkup.jsx — Análise de Margem e Markup
   Eclipse BI · Planejamento Comercial
═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../../api';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Info, RefreshCw, ChevronUp, ChevronDown, Minus,
  DollarSign, BarChart2, Package, Percent,
  Search, Download, ChevronLeft, ChevronRight,
  Calculator, Filter, X, Layers,
  ArrowUpRight, ArrowDownRight,
  Target, Zap,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  ScatterChart, Scatter, ZAxis,
  ComposedChart, Area,
  PieChart, Pie,
} from 'recharts';

/* ── Paleta ──────────────────────────────────────────────────── */
const C = {
  bg:      '#121212',
  card:    '#1C1C1E',
  hover:   '#262629',
  orange:  '#F97316',
  orangeL: '#FB923C',
  white:   '#F8FAFC',
  gray:    '#94A3B8',
  green:   '#10B981',
  red:     '#EF4444',
  yellow:  '#FACC15',
  blue:    '#60A5FA',
  purple:  '#A78BFA',
  border:  'rgba(255,255,255,.08)',
};

const PERIODOS = ['Hoje', 'Semana', 'Mês', 'Ano'];
const DONUT_COLORS = [C.orange, C.blue, C.green, C.purple, C.yellow, '#EC4899'];

/* ── Helpers ─────────────────────────────────────────────────── */
const fmtR$  = v => v == null ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK   = v => { if (v == null) return '—'; const n = Number(v); if (n >= 1e6) return `R$ ${(n/1e6).toFixed(2)}M`; if (n >= 1e3) return `R$ ${(n/1e3).toFixed(1)}k`; return `R$ ${n.toFixed(0)}`; };
const fmtPct = v => v == null ? '—' : `${Number(v).toFixed(1)}%`;
const fmtN   = v => v == null ? '—' : Number(v).toLocaleString('pt-BR');

function margemCor(v) {
  if (v == null) return C.gray;
  if (v >= 30) return C.green;
  if (v >= 20) return C.yellow;
  return C.red;
}
function margemLabel(v) {
  if (v == null) return 'Sem custo';
  if (v >= 30) return 'Boa';
  if (v >= 20) return 'Regular';
  return 'Crítica';
}

/* ── Delta chip ──────────────────────────────────────────────── */
function Delta({ val }) {
  if (val == null) return <span style={{ color: C.gray, fontSize: 11 }}>—</span>;
  const cor  = val > 0 ? C.green : val < 0 ? C.red : C.gray;
  const Icon = val > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:2, color: cor, fontSize: 11, fontWeight: 700 }}>
      <Icon size={11}/>{Math.abs(val).toFixed(1)}%
    </span>
  );
}

/* ── Sparkline simples ───────────────────────────────────────── */
function Spark({ data = [], cor }) {
  if (!data.length) return null;
  const max = Math.max(...data, 0.001);
  const W = 60, H = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * W;
    const y = H - (v / max) * H;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} style={{ display:'block' }}>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── KPI Card ────────────────────────────────────────────────── */
function KpiCard({ titulo, valor, unidade, delta, deltaSub, Icone, cor, spark }) {
  return (
    <div className="mm-kpi-card" style={{ '--mm-cor': cor }}>
      <div className="mm-kpi-accent"/>
      <div className="mm-kpi-head">
        <span className="mm-kpi-icon" style={{ background:`${cor}15`, color: cor }}><Icone size={14}/></span>
        <span className="mm-kpi-title">{titulo}</span>
      </div>
      <div className="mm-kpi-val" style={{ color: cor }}>{valor}</div>
      {unidade && <div className="mm-kpi-unit">{unidade}</div>}
      <div className="mm-kpi-foot">
        <Delta val={delta}/>
        <span style={{ color: C.gray, fontSize: 11, marginLeft: 4 }}>{deltaSub || 'vs anterior'}</span>
      </div>
      {spark && <div className="mm-kpi-spark"><Spark data={spark} cor={cor}/></div>}
    </div>
  );
}

/* ── Tooltip padrão ──────────────────────────────────────────── */
function ChartTip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="mc3-tooltip">
      <div className="mc3-tt-title">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="mc3-tt-row">
          <span className="mc3-tt-dot" style={{ background: p.color || p.fill }}/>
          <span className="mc3-tt-name">{p.name}</span>
          <span className="mc3-tt-val">{formatter ? formatter(p.name, p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Rank Row ────────────────────────────────────────────────── */
function RankRow({ pos, cols, values, cor }) {
  return (
    <div className="mm-rank-row">
      <div className="mm-rank-pos" style={{ color: pos <= 3 ? C.orange : C.gray }}>
        {pos <= 3 ? '★' : pos}
      </div>
      <div className="mm-rank-data">
        {cols.map((c, i) => (
          <div key={i} className="mm-rank-cell" style={c.style || {}}>
            {i === 0 ? <span className="mm-rank-name" title={values[i]}>{values[i]}</span>
              : <span style={{ color: c.color ? c.color(values[i]) : C.white, fontWeight: i === 1 ? 700 : 400 }}>
                  {c.fmt ? c.fmt(values[i]) : values[i]}
                </span>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Painel de Alertas ───────────────────────────────────────── */
function Alertas({ alertas }) {
  const icon = { erro: AlertTriangle, sucesso: CheckCircle, atencao: Zap, info: Info };
  const cor  = { erro: C.red, sucesso: C.green, atencao: C.yellow, info: C.blue };
  if (!alertas?.length) return null;
  return (
    <div className="mm-alertas">
      <div className="mm-alertas-title"><Zap size={13} style={{ color: C.yellow }}/> Alertas Inteligentes</div>
      <div className="mm-alertas-list">
        {alertas.map((a, i) => {
          const Icon = icon[a.tipo] || Info;
          return (
            <div key={i} className="mm-alerta-item" style={{ '--al-cor': cor[a.tipo] || C.gray }}>
              <Icon size={13} style={{ color: cor[a.tipo], flexShrink: 0 }}/>
              <span>{a.msg}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Simulador de Preço ──────────────────────────────────────── */
function SimuladorPreco({ produtos }) {
  const [busca,    setBusca]    = useState('');
  const [produto,  setProduto]  = useState(null);
  const [custo,    setCusto]    = useState('');
  const [novoPreco,setNovoPreco]= useState('');
  const [open,     setOpen]     = useState(false);

  const filtrados = useMemo(() => {
    if (!busca || !produtos?.length) return [];
    return produtos.filter(p => p.produto?.toLowerCase().includes(busca.toLowerCase())).slice(0, 8);
  }, [busca, produtos]);

  function selProduto(p) {
    setProduto(p);
    setBusca(p.produto);
    setCusto(p.custoMedio?.toFixed(2) || '');
    setNovoPreco(p.precoMedio?.toFixed(2) || '');
    setOpen(false);
  }

  const c  = parseFloat(custo)    || 0;
  const np = parseFloat(novoPreco)|| 0;
  const pa = produto?.precoMedio  || 0;

  const margemAtual  = pa > 0 && c > 0 ? (pa - c) / pa  * 100 : null;
  const markupAtual  = c  > 0 && pa > 0? (pa - c) / c   * 100 : null;
  const margemNova   = np > 0 && c > 0 ? (np - c) / np  * 100 : null;
  const markupNovo   = c  > 0 && np > 0? (np - c) / c   * 100 : null;
  const lucroPorUn   = np > 0 && c > 0 ? np - c : null;
  const difFinanceira= produto ? (np - pa) * (produto.quantidade || 1) : null;

  return (
    <div className="mm-sim-card">
      <div className="mm-sim-head">
        <span className="mm-sim-title"><Calculator size={15} style={{ color: C.orange }}/> Simulador de Preço</span>
        <span className="mm-sim-sub">Calcule o impacto de uma mudança de preço em tempo real</span>
      </div>

      <div className="mm-sim-body">
        {/* Busca produto */}
        <div className="mm-sim-field" style={{ position:'relative' }}>
          <label className="mm-sim-label">Produto</label>
          <div style={{ position:'relative' }}>
            <input className="mm-sim-input" placeholder="Buscar produto..."
              value={busca}
              onChange={e => { setBusca(e.target.value); setOpen(true); setProduto(null); }}
              onFocus={() => setOpen(true)}/>
            {open && filtrados.length > 0 && (
              <div className="mm-sim-dropdown">
                {filtrados.map((p, i) => (
                  <button key={i} className="mm-sim-drop-item" onMouseDown={() => selProduto(p)}>
                    <span>{p.produto}</span>
                    <span style={{ color: C.gray, fontSize: 11 }}>{fmtK(p.precoMedio)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mm-sim-row2">
          <div className="mm-sim-field">
            <label className="mm-sim-label">Custo (R$)</label>
            <input className="mm-sim-input" type="number" step="0.01" min="0"
              value={custo} onChange={e => setCusto(e.target.value)}/>
          </div>
          <div className="mm-sim-field">
            <label className="mm-sim-label">Preço Atual (R$)</label>
            <input className="mm-sim-input" readOnly value={pa ? pa.toFixed(2) : ''}
              style={{ opacity: 0.6 }}/>
          </div>
          <div className="mm-sim-field">
            <label className="mm-sim-label">Novo Preço (R$)</label>
            <input className="mm-sim-input mm-sim-input--dest" type="number" step="0.01" min="0"
              value={novoPreco} onChange={e => setNovoPreco(e.target.value)}/>
          </div>
        </div>

        {/* Resultados */}
        <div className="mm-sim-results">
          <div className="mm-sim-compare">
            <div className="mm-sim-col">
              <div className="mm-sim-col-label">Preço Atual</div>
              <div className="mm-sim-metric">
                <span className="mm-sim-m-label">Margem</span>
                <span className="mm-sim-m-val" style={{ color: margemCor(margemAtual) }}>{fmtPct(margemAtual)}</span>
              </div>
              <div className="mm-sim-metric">
                <span className="mm-sim-m-label">Markup</span>
                <span className="mm-sim-m-val" style={{ color: C.blue }}>{fmtPct(markupAtual)}</span>
              </div>
              <div className="mm-sim-metric">
                <span className="mm-sim-m-label">Lucro/un</span>
                <span className="mm-sim-m-val">{c > 0 && pa > 0 ? fmtR$(pa - c) : '—'}</span>
              </div>
            </div>

            <div className="mm-sim-arrow">→</div>

            <div className="mm-sim-col mm-sim-col--dest">
              <div className="mm-sim-col-label" style={{ color: C.orange }}>Novo Preço</div>
              <div className="mm-sim-metric">
                <span className="mm-sim-m-label">Margem</span>
                <span className="mm-sim-m-val" style={{ color: margemCor(margemNova), fontWeight: 700 }}>{fmtPct(margemNova)}</span>
              </div>
              <div className="mm-sim-metric">
                <span className="mm-sim-m-label">Markup</span>
                <span className="mm-sim-m-val" style={{ color: C.blue, fontWeight: 700 }}>{fmtPct(markupNovo)}</span>
              </div>
              <div className="mm-sim-metric">
                <span className="mm-sim-m-label">Lucro/un</span>
                <span className="mm-sim-m-val" style={{ color: lucroPorUn > 0 ? C.green : C.red, fontWeight: 700 }}>
                  {lucroPorUn != null ? fmtR$(lucroPorUn) : '—'}
                </span>
              </div>
            </div>
          </div>

          {difFinanceira != null && (
            <div className="mm-sim-impact">
              <span>Impacto financeiro estimado:</span>
              <span style={{ color: difFinanceira >= 0 ? C.green : C.red, fontWeight: 700 }}>
                {difFinanceira >= 0 ? '+' : ''}{fmtR$(difFinanceira)}
              </span>
              <span style={{ color: C.gray, fontSize: 11 }}>
                ({fmtN(produto?.quantidade)} un vendidas no período)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Tabela Analítica ────────────────────────────────────────── */
function TabelaAnalitica({ tabela }) {
  const [busca,    setBusca]    = useState('');
  const [sortKey,  setSortKey]  = useState('lucro');
  const [sortAsc,  setSortAsc]  = useState(false);
  const [pagina,   setPagina]   = useState(0);
  const POR_PAG = 15;

  const cols = [
    { key: 'produto',    label: 'Produto',   fmt: v => v,           width: '22%' },
    { key: 'categoria',  label: 'Categoria', fmt: v => v,           width: '13%' },
    { key: 'grupo',      label: 'Grupo',     fmt: v => v,           width: '12%' },
    { key: 'custoMedio', label: 'Custo',     fmt: fmtR$,            width: '9%'  },
    { key: 'precoMedio', label: 'Preço',     fmt: fmtR$,            width: '9%'  },
    { key: 'receita',    label: 'Receita',   fmt: fmtK,             width: '9%'  },
    { key: 'quantidade', label: 'Qtd',       fmt: fmtN,             width: '6%'  },
    { key: 'lucro',      label: 'Lucro',     fmt: fmtK,             width: '9%'  },
    { key: 'margem',     label: 'Margem',    fmt: fmtPct,           width: '7%', color: margemCor },
    { key: 'markup',     label: 'Markup',    fmt: fmtPct,           width: '7%'  },
    { key: 'status',     label: 'Status',    fmt: v => margemLabel(v), width: '7%', color: margemCor, isStatus: true },
  ];

  const filtrado = useMemo(() => {
    let r = [...(tabela || [])];
    if (busca) r = r.filter(p => p.produto?.toLowerCase().includes(busca.toLowerCase())
      || p.categoria?.toLowerCase().includes(busca.toLowerCase())
      || p.grupo?.toLowerCase().includes(busca.toLowerCase()));
    r.sort((a, b) => {
      const av = a[sortKey] ?? -Infinity, bv = b[sortKey] ?? -Infinity;
      return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return r;
  }, [tabela, busca, sortKey, sortAsc]);

  const total  = filtrado.length;
  const paginas= Math.ceil(total / POR_PAG);
  const slice  = filtrado.slice(pagina * POR_PAG, (pagina + 1) * POR_PAG);

  function sort(k) {
    if (sortKey === k) setSortAsc(a => !a);
    else { setSortKey(k); setSortAsc(false); }
    setPagina(0);
  }

  function exportCSV() {
    const header = cols.map(c => c.label).join(';');
    const rows = filtrado.map(r =>
      cols.map(c => {
        const v = c.key === 'status' ? r.margem : r[c.key];
        return String(c.fmt(v) ?? '').replace(/[;\n]/g, ' ');
      }).join(';')
    ).join('\n');
    const blob = new Blob([`${header}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'margem_markup.csv' });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mm-tabela-wrap">
      <div className="mm-tabela-head">
        <div className="mm-tabela-title"><Layers size={14} style={{ color: C.blue }}/> Tabela Analítica</div>
        <div className="mm-tabela-controls">
          <div className="mm-search-wrap">
            <Search size={12} style={{ color: C.gray }}/>
            <input className="mm-search-input" placeholder="Buscar produto, categoria..."
              value={busca} onChange={e => { setBusca(e.target.value); setPagina(0); }}/>
            {busca && <button className="mm-search-clear" onClick={() => setBusca('')}><X size={11}/></button>}
          </div>
          <button className="mm-export-btn" onClick={exportCSV} title="Exportar CSV">
            <Download size={13}/> CSV
          </button>
        </div>
      </div>

      <div className="mm-tabela-scroll">
        <table className="mm-tabela">
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.key} className="mm-th" style={{ width: c.width }}
                  onClick={() => sort(c.key === 'status' ? 'margem' : c.key)}>
                  {c.label}
                  {sortKey === (c.key === 'status' ? 'margem' : c.key)
                    ? (sortAsc ? <ChevronUp size={10}/> : <ChevronDown size={10}/>)
                    : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => (
              <tr key={i} className="mm-tr">
                {cols.map(c => {
                  const val = c.key === 'status' ? r.margem : r[c.key];
                  return (
                    <td key={c.key} className="mm-td">
                      {c.isStatus ? (
                        <span className="mm-status-chip"
                          style={{ background: `${margemCor(val)}18`, color: margemCor(val), border: `1px solid ${margemCor(val)}40` }}>
                          {margemLabel(val)}
                        </span>
                      ) : (
                        <span style={{ color: c.color ? c.color(val) : undefined }}>
                          {c.fmt(val)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {slice.length === 0 && (
              <tr><td colSpan={cols.length} className="mm-td-empty">Nenhum produto encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {paginas > 1 && (
        <div className="mm-paginacao">
          <button className="mm-pag-btn" disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}>
            <ChevronLeft size={13}/>
          </button>
          <span style={{ fontSize: 12, color: C.gray }}>
            {pagina + 1} / {paginas} · {total} registros
          </span>
          <button className="mm-pag-btn" disabled={pagina >= paginas - 1} onClick={() => setPagina(p => p + 1)}>
            <ChevronRight size={13}/>
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Componente Principal
═══════════════════════════════════════════════════════════════ */
export default function MargemMarkup({ empresasKey, clients, empresas }) {
  const empresa = (empresas || [])[0] || null;

  const [periodo,  setPeriodo]  = useState('Mês');
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const loadData = useCallback(async () => {
    if (!empresa) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const r = await apiFetch(
        `/api/planejamento/margem?empresa=${empresa}&periodo=${encodeURIComponent(periodo)}`
      );
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Erro'); }
      setData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [empresa, periodo]);

  useEffect(() => { loadData(); }, [loadData]);

  const {
    kpis = {}, margemCategoria = [], lucroGrupo = [],
    topLucrativos = [], menoresMargens = [],
    scatter = [], donutLucro = [], evolucao = [],
    alertas = [], tabela = [], margemMinima = 20,
  } = data || {};

  const maxCat  = Math.max(...margemCategoria.map(c => c.lucro || 0), 1);
  const maxGrupo= Math.max(...lucroGrupo.map(g => g.lucro || 0), 1);

  const fmtTip = (name, val) => {
    if (name === 'Margem' || name === 'margem') return fmtPct(val);
    return fmtK(val);
  };

  if (!empresa) return (
    <div className="pv-empty-state">
      <BarChart2 size={48} style={{ opacity: 0.3 }}/>
      <p>Selecione uma empresa para analisar a margem.</p>
    </div>
  );

  return (
    <div className="mm-root">

      {/* ═══ HEADER ════════════════════════════════════════════ */}
      <div className="mm-header">
        <div className="mm-header-left">
          <div className="mm-eyebrow"><Target size={11}/> ECLIPSE BI · MARGEM & MARKUP</div>
          <h1 className="mm-title">Análise de Margem e Markup</h1>
          <p className="mm-sub">Monitore a rentabilidade dos seus produtos e identifique oportunidades de aumentar seus resultados.</p>
        </div>
        <div className="mm-header-right">
          {loading && <RefreshCw size={13} className="spin" style={{ color: C.orange, opacity: 0.6 }}/>}
          <div className="pv2-period-tabs">
            {PERIODOS.map(p => (
              <button key={p}
                className={`pv2-period-tab${p === periodo ? ' pv2-period-tab--active' : ''}`}
                onClick={() => setPeriodo(p)}>{p}</button>
            ))}
          </div>
          <button className="mm-refresh-btn" onClick={loadData} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spin' : ''}/>
          </button>
        </div>
      </div>

      {error && (
        <div className="pv2-error">
          <AlertTriangle size={18} style={{ color: C.red }}/>
          <span style={{ color: C.red }}>{error}</span>
          <button className="pv2-retry" onClick={loadData}>Tentar novamente</button>
        </div>
      )}

      {/* ═══ KPI CARDS ══════════════════════════════════════════ */}
      <div className="mm-kpi-grid">
        <KpiCard titulo="Margem Média"    Icone={Percent}     cor={C.orange}
          valor={fmtPct(kpis.margemMedia)} delta={kpis.deltaMargemMedia}
          spark={evolucao.map(e => e.margem)}/>
        <KpiCard titulo="Markup Médio"    Icone={TrendingUp}  cor={C.blue}
          valor={fmtPct(kpis.markupMedio)} delta={kpis.deltaMarkupMedio}
          spark={evolucao.map(e => e.margem)}/>
        <KpiCard titulo="Lucro Bruto"     Icone={DollarSign}  cor={C.green}
          valor={fmtK(kpis.lucroBruto)} delta={kpis.deltaLucro}
          spark={evolucao.map(e => e.lucro)}/>
        <KpiCard titulo="Receita Total"   Icone={BarChart2}   cor={C.orangeL}
          valor={fmtK(kpis.receitaTotal)} delta={kpis.deltaReceita}
          spark={evolucao.map(e => e.receita)}/>
        <KpiCard titulo="Custo Total"     Icone={Package}     cor={C.purple}
          valor={fmtK(kpis.custoTotal)} delta={kpis.deltaCusto}
          spark={evolucao.map(e => e.custo)}/>
        <KpiCard titulo="Abaixo da Margem Mínima" Icone={AlertTriangle} cor={C.red}
          valor={String(kpis.abaixoMin ?? 0)} unidade={`produtos < ${margemMinima}%`}
          delta={null}/>
      </div>

      {/* ═══ ALERTAS ══════════════════════════════════════════ */}
      {alertas.length > 0 && <Alertas alertas={alertas}/>}

      {/* ═══ LINHA 1: Margem por Categoria + Evolução ════════ */}
      <div className="mm-row-2">
        {/* Barras horizontais — margem por categoria */}
        <div className="mm-chart-card">
          <div className="mm-chart-title"><BarChart2 size={14} style={{ color: C.orange }}/> Margem por Categoria</div>
          {margemCategoria.length > 0 ? (
            <div className="mm-hbar-list">
              {margemCategoria.slice(0, 8).map((c, i) => (
                <div key={i} className="mm-hbar-row">
                  <div className="mm-hbar-label" title={c.categoria}>{c.categoria}</div>
                  <div className="mm-hbar-track">
                    <div className="mm-hbar-fill"
                      style={{ width:`${Math.min(100, Math.max(0, c.margem))}%`, background: margemCor(c.margem) }}/>
                  </div>
                  <div className="mm-hbar-val" style={{ color: margemCor(c.margem) }}>{fmtPct(c.margem)}</div>
                </div>
              ))}
            </div>
          ) : <div className="pv2-empty">Sem dados.</div>}
        </div>

        {/* Evolução da Margem */}
        <div className="mm-chart-card">
          <div className="mm-chart-title"><TrendingUp size={14} style={{ color: C.blue }}/> Evolução da Margem</div>
          {evolucao.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={evolucao} margin={{ top:6, right:12, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="mmLucroGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.green} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={C.green} stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false}/>
                <XAxis dataKey="mes" tick={{ fill:'#6B7280', fontSize:11, fontFamily:'Sora' }} tickLine={false} axisLine={false}/>
                <YAxis yAxisId="l" tick={{ fill:'#6B7280', fontSize:10, fontFamily:'Sora' }}
                  tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(0)}%`}/>
                <Tooltip content={<ChartTip formatter={fmtTip}/>}/>
                <Area yAxisId="l" type="monotone" dataKey="margem" name="Margem"
                  stroke={C.green} strokeWidth={2.5} fill="url(#mmLucroGrad)"/>
              </ComposedChart>
            </ResponsiveContainer>
          ) : <div className="pv2-empty">Sem dados.</div>}
        </div>
      </div>

      {/* ═══ SIMULADOR ════════════════════════════════════════ */}
      <SimuladorPreco produtos={tabela}/>

      {/* ═══ LINHA 2: Scatter + Donut ════════════════════════ */}
      <div className="mm-row-2">
        {/* Scatter: Margem x Faturamento */}
        <div className="mm-chart-card">
          <div className="mm-chart-title"><Zap size={14} style={{ color: C.yellow }}/> Margem × Faturamento</div>
          <div className="mm-chart-sub">Produtos que vendem muito mas têm pouca margem</div>
          {scatter.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart margin={{ top:6, right:12, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)"/>
                <XAxis dataKey="receita" name="Receita" type="number"
                  tick={{ fill:'#6B7280', fontSize:10 }} tickLine={false} axisLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                <YAxis dataKey="margem" name="Margem" type="number"
                  tick={{ fill:'#6B7280', fontSize:10 }} tickLine={false} axisLine={false}
                  tickFormatter={v=>`${v.toFixed(0)}%`}/>
                <ZAxis range={[40, 300]}/>
                <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="mc3-tooltip">
                      <div className="mc3-tt-title">{d.produto}</div>
                      <div className="mc3-tt-row"><span className="mc3-tt-name">Receita</span><span className="mc3-tt-val">{fmtK(d.receita)}</span></div>
                      <div className="mc3-tt-row"><span className="mc3-tt-name">Margem</span><span className="mc3-tt-val" style={{ color: margemCor(d.margem) }}>{fmtPct(d.margem)}</span></div>
                      <div className="mc3-tt-row"><span className="mc3-tt-name">Lucro</span><span className="mc3-tt-val">{fmtK(d.lucro)}</span></div>
                    </div>
                  );
                }}/>
                <Scatter data={scatter.slice(0, 50)} name="Produtos">
                  {scatter.slice(0, 50).map((p, i) => (
                    <Cell key={i} fill={margemCor(p.margem)} fillOpacity={0.75}/>
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : <div className="pv2-empty">Sem dados.</div>}
        </div>

        {/* Donut: Participação do lucro */}
        <div className="mm-chart-card mm-donut-card">
          <div className="mm-chart-title"><Layers size={14} style={{ color: C.purple }}/> Participação no Lucro</div>
          {donutLucro.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={donutLucro} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                    paddingAngle={3} strokeWidth={0}>
                    {donutLucro.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]}/>
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmtK(v)}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="mm-donut-legend">
                {donutLucro.map((d, i) => (
                  <div key={i} className="mm-donut-item">
                    <span className="mm-donut-dot" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}/>
                    <span className="mm-donut-name">{d.name}</span>
                    <span className="mm-donut-val">{fmtK(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="pv2-empty">Sem dados.</div>}
        </div>
      </div>

      {/* ═══ RANKINGS ════════════════════════════════════════ */}
      <div className="mm-row-2">
        {/* Top 10 lucrativos */}
        <div className="mm-rank-card">
          <div className="mm-chart-title" style={{ marginBottom: 12 }}>
            <TrendingUp size={14} style={{ color: C.green }}/> Top 10 Mais Lucrativos
          </div>
          <div className="mm-rank-header">
            {['Produto','Lucro','Margem','Markup','Qtd'].map(c => (
              <span key={c} className="mm-rank-hcell">{c}</span>
            ))}
          </div>
          {topLucrativos.map((p, i) => (
            <div key={i} className="mm-rank-row2">
              <span className="mm-rank-pos2" style={{ color: i < 3 ? C.orange : C.gray }}>{i+1}</span>
              <span className="mm-rank-nome2" title={p.produto}>{p.produto}</span>
              <span style={{ color: C.green,           fontWeight: 600 }}>{fmtK(p.lucro)}</span>
              <span style={{ color: margemCor(p.margem), fontWeight: 600 }}>{fmtPct(p.margem)}</span>
              <span style={{ color: C.blue }}>{fmtPct(p.markup)}</span>
              <span style={{ color: C.gray }}>{fmtN(p.quantidade)}</span>
            </div>
          ))}
          {!topLucrativos.length && <div className="pv2-empty">Sem dados.</div>}
        </div>

        {/* Top 10 menores margens */}
        <div className="mm-rank-card">
          <div className="mm-chart-title" style={{ marginBottom: 12 }}>
            <AlertTriangle size={14} style={{ color: C.red }}/> Top 10 Menores Margens
          </div>
          <div className="mm-rank-header">
            {['Produto','Margem','Markup','Preço','Custo'].map(c => (
              <span key={c} className="mm-rank-hcell">{c}</span>
            ))}
          </div>
          {menoresMargens.map((p, i) => (
            <div key={i} className="mm-rank-row2">
              <span className="mm-rank-pos2" style={{ color: C.red }}>{i+1}</span>
              <span className="mm-rank-nome2" title={p.produto}>{p.produto}</span>
              <span style={{ color: margemCor(p.margem), fontWeight: 700 }}>{fmtPct(p.margem)}</span>
              <span style={{ color: C.blue }}>{fmtPct(p.markup)}</span>
              <span>{fmtR$(p.preco)}</span>
              <span style={{ color: C.gray }}>{fmtR$(p.custo)}</span>
            </div>
          ))}
          {!menoresMargens.length && <div className="pv2-empty">Sem dados.</div>}
        </div>
      </div>

      {/* ═══ TABELA ANALÍTICA ════════════════════════════════ */}
      {tabela.length > 0 && <TabelaAnalitica tabela={tabela}/>}

      {loading && !data && (
        <div className="pv2-loading">
          <RefreshCw size={22} className="spin" style={{ color: C.orange }}/>
          <span>Carregando análise de margem...</span>
        </div>
      )}
    </div>
  );
}
