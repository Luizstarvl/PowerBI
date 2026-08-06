/* ═══════════════════════════════════════════════════════════════
   PerformanceVendas.jsx — Módulo Performance de Vendas
   Eclipse BI · Planejamento Comercial
═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../api';
import {
  TrendingUp, TrendingDown, Minus,
  ShoppingCart, DollarSign, BarChart2, Package,
  Layers, Truck, Trophy, RefreshCw,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

/* ── Constantes ──────────────────────────────────────────────── */
const ORANGE = '#F97316';
const BLUE   = '#60A5FA';
const GREEN  = '#22C55E';
const PURPLE = '#A78BFA';
const YELLOW = '#FBBF24';
const RED    = '#EF4444';

const PERIODOS = ['Hoje', 'Semana', 'Mês', 'Ano'];
const TABS     = [
  { key: 'produtos',      label: 'Produtos',     Icon: Package },
  { key: 'secoes',        label: 'Seções',        Icon: Layers  },
  { key: 'fornecedores',  label: 'Fornecedores',  Icon: Truck   },
  { key: 'comparativo',   label: 'Comparativo',   Icon: BarChart2 },
];

const RANK_COLORS = ['#F97316','#FB923C','#FDBA74','#FED7AA','#FEF3C7',
  '#60A5FA','#93C5FD','#BFDBFE','#22C55E','#86EFAC'];

/* ── Formatadores ────────────────────────────────────────────── */
const fmtR$ = v =>
  v == null ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = v => {
  if (v == null) return '—';
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(1)}k`;
  return `R$ ${v.toFixed(0)}`;
};
const fmtN = v => v == null ? '—' : Number(v).toLocaleString('pt-BR');
const fmtPct = v => v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;

/* ── Delta chip ──────────────────────────────────────────────── */
function Delta({ val, size = 12 }) {
  if (val == null) return <span style={{ color: '#4B5563', fontSize: size }}>—</span>;
  const cor  = val > 0 ? GREEN : val < 0 ? RED : '#6B7280';
  const Icon = val > 0 ? ChevronUp : val < 0 ? ChevronDown : Minus;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: cor, fontSize: size, fontWeight: 700 }}>
      <Icon size={size - 1}/>{Math.abs(val).toFixed(1)}%
    </span>
  );
}

/* ── KPI Card ────────────────────────────────────────────────── */
function KpiCard({ titulo, valor, delta, Icone, cor, sub }) {
  return (
    <div className="pv2-kpi-card" style={{ '--pv2-cor': cor }}>
      <div className="pv2-kpi-accent"/>
      <div className="pv2-kpi-head">
        <span className="pv2-kpi-icon" style={{ background: `${cor}15`, color: cor }}>
          <Icone size={14}/>
        </span>
        <span className="pv2-kpi-title">{titulo}</span>
      </div>
      <div className="pv2-kpi-val" style={{ color: cor }}>{valor}</div>
      <div className="pv2-kpi-foot">
        <Delta val={delta}/>
        <span className="pv2-kpi-sub">{sub}</span>
      </div>
    </div>
  );
}

/* ── Barra de ranking ────────────────────────────────────────── */
function RankBar({ nome, valor, pct, cor, sub, pos }) {
  return (
    <div className="pv2-rank-row">
      <div className="pv2-rank-pos" style={{ color: pos <= 3 ? ORANGE : '#6B7280' }}>
        {pos <= 3 ? <Trophy size={12}/> : pos}
      </div>
      <div className="pv2-rank-info">
        <div className="pv2-rank-nome" title={nome}>{nome}</div>
        {sub && <div className="pv2-rank-sub">{sub}</div>}
        <div className="pv2-rank-bar-track">
          <div className="pv2-rank-bar-fill"
            style={{ width: `${pct}%`, background: cor || ORANGE }}/>
        </div>
      </div>
      <div className="pv2-rank-val">{valor}</div>
    </div>
  );
}

/* ── Tooltip do gráfico ──────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="mc3-tooltip">
      <div className="mc3-tt-title">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="mc3-tt-row">
          <span className="mc3-tt-dot" style={{ background: p.color || p.fill }}/>
          <span className="mc3-tt-name">{p.name}</span>
          <span className="mc3-tt-val">
            {p.name === 'Faturamento' ? fmtK(p.value) : fmtN(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Componente principal
═══════════════════════════════════════════════════════════════ */
export default function PerformanceVendas({ empresasKey, clients, empresas }) {
  const empresa = (empresas || [])[0] || null;

  const [periodo,  setPeriodo]  = useState('Mês');
  const [tab,      setTab]      = useState('produtos');
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const loadData = useCallback(async () => {
    if (!empresa) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const r = await apiFetch(
        `/api/planejamento/performance?empresa=${empresa}&periodo=${encodeURIComponent(periodo)}`
      );
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Erro ao carregar'); }
      setData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [empresa, periodo]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Dados derivados ─────────────────────────────────────── */
  const { kpis = {}, rankings = {}, comparativo = [] } = data || {};
  const { produtos = [], secoes = [], fornecedores = [] } = rankings;

  // Calcula máximo para % das barras
  function maxOf(arr, key) {
    return Math.max(...arr.map(r => r[key] || 0), 1);
  }
  const maxProd = maxOf(produtos,     'faturamento');
  const maxSec  = maxOf(secoes,       'faturamento');
  const maxForn = maxOf(fornecedores, 'totalCompras');

  const subPeriodo = periodo === 'Hoje' ? 'vs ontem'
    : periodo === 'Semana' ? 'vs semana anterior'
    : periodo === 'Mês'    ? 'vs mês anterior'
    : 'vs ano anterior';

  if (!empresa) return (
    <div className="pv-empty-state">
      <BarChart2 size={48} style={{ opacity: 0.3 }}/>
      <p>Selecione uma empresa para ver a performance.</p>
    </div>
  );

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="pv2-root">

      {/* ═══ 1. HEADER ═════════════════════════════════════════ */}
      <div className="pv2-header">
        <div className="pv2-header-left">
          <div className="pv2-eyebrow">
            <TrendingUp size={12}/> ECLIPSE BI · PERFORMANCE
          </div>
          <h1 className="pv2-title">Performance de Vendas</h1>
        </div>

        <div className="pv2-header-right">
          {loading && <RefreshCw size={13} className="spin" style={{ color: GREEN, opacity: 0.6 }}/>}
          <div className="pv2-period-tabs">
            {PERIODOS.map(p => (
              <button key={p}
                className={`pv2-period-tab${p === periodo ? ' pv2-period-tab--active' : ''}`}
                onClick={() => setPeriodo(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ 2. KPI CARDS ══════════════════════════════════════ */}
      <div className="pv2-kpi-grid">
        <KpiCard titulo="Faturamento"    Icone={DollarSign}   cor={GREEN}
          valor={fmtK(kpis.faturamento)}
          delta={kpis.deltaFaturamento}  sub={subPeriodo}/>
        <KpiCard titulo="Qtd Vendas"     Icone={ShoppingCart}  cor={BLUE}
          valor={fmtN(kpis.qtdVendas)}
          delta={kpis.deltaQtd}          sub={subPeriodo}/>
        <KpiCard titulo="Ticket Médio"   Icone={BarChart2}     cor={PURPLE}
          valor={fmtK(kpis.ticketMedio)}
          delta={kpis.deltaTicket}       sub={subPeriodo}/>
        <KpiCard titulo="Produtos Ativos" Icone={Package}      cor={ORANGE}
          valor={fmtN(kpis.produtosAtivos)}
          delta={null}                   sub="no período"/>
      </div>

      {/* ═══ 3. TABS ════════════════════════════════════════════ */}
      <div className="pv2-tabs">
        {TABS.map(t => (
          <button key={t.key}
            className={`pv2-tab${t.key === tab ? ' pv2-tab--active' : ''}`}
            onClick={() => setTab(t.key)}>
            <t.Icon size={13}/>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ 4. CONTEÚDO DA TAB ════════════════════════════════ */}
      {error ? (
        <div className="pv2-error">
          <span style={{ color: RED }}>⚠ {error}</span>
          <button className="pv2-retry" onClick={loadData}>Tentar novamente</button>
        </div>
      ) : (

        <div className="pv2-tab-content">

          {/* ── Produtos ─────────────────────────────────────── */}
          {tab === 'produtos' && (
            <div className="pv2-panel">
              <div className="pv2-panel-head">
                <div className="pv2-panel-title">
                  <Trophy size={14} style={{ color: ORANGE }}/> Top Produtos por Faturamento
                </div>
                <div className="pv2-panel-sub">{periodo} · {produtos.length} produtos</div>
              </div>
              {produtos.length === 0 && !loading ? (
                <div className="pv2-empty">Sem dados no período selecionado.</div>
              ) : (
                <div className="pv2-rank-list">
                  {produtos.map((p, i) => (
                    <RankBar key={i} pos={i + 1}
                      nome={p.nome}
                      sub={`${p.secao} · Qtd: ${fmtN(p.quantidade)} · Preço médio: ${fmtK(p.precoMedio)}`}
                      valor={fmtK(p.faturamento)}
                      pct={p.faturamento / maxProd * 100}
                      cor={RANK_COLORS[i] || ORANGE}/>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Seções ───────────────────────────────────────── */}
          {tab === 'secoes' && (
            <div className="pv2-panel">
              <div className="pv2-panel-head">
                <div className="pv2-panel-title">
                  <Layers size={14} style={{ color: BLUE }}/> Ranking por Seção
                </div>
                <div className="pv2-panel-sub">{periodo} · {secoes.length} seções</div>
              </div>
              {secoes.length === 0 && !loading ? (
                <div className="pv2-empty">Sem dados no período selecionado.</div>
              ) : (
                <div className="pv2-rank-list">
                  {secoes.map((s, i) => (
                    <RankBar key={i} pos={i + 1}
                      nome={s.nome}
                      sub={`${fmtN(s.qtdVendas)} vendas · Qtd itens: ${fmtN(s.quantidade)}`}
                      valor={fmtK(s.faturamento)}
                      pct={s.faturamento / maxSec * 100}
                      cor={RANK_COLORS[i] || BLUE}/>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Fornecedores ─────────────────────────────────── */}
          {tab === 'fornecedores' && (
            <div className="pv2-panel">
              <div className="pv2-panel-head">
                <div className="pv2-panel-title">
                  <Truck size={14} style={{ color: PURPLE }}/> Ranking de Fornecedores
                </div>
                <div className="pv2-panel-sub">{periodo} · por volume de compras</div>
              </div>
              {fornecedores.length === 0 && !loading ? (
                <div className="pv2-empty">Sem dados no período selecionado.</div>
              ) : (
                <div className="pv2-rank-list">
                  {fornecedores.map((f, i) => (
                    <RankBar key={i} pos={i + 1}
                      nome={f.nome}
                      sub={`${f.qtdNotas} nota(s) · Qtd: ${fmtN(f.quantidade)}`}
                      valor={fmtK(f.totalCompras)}
                      pct={f.totalCompras / maxForn * 100}
                      cor={RANK_COLORS[i] || PURPLE}/>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Comparativo ──────────────────────────────────── */}
          {tab === 'comparativo' && (
            <div className="pv2-panel">
              <div className="pv2-panel-head">
                <div className="pv2-panel-title">
                  <BarChart2 size={14} style={{ color: YELLOW }}/> Comparativo dos Últimos 6 Meses
                </div>
                <div className="pv2-panel-sub">Faturamento e volume de vendas</div>
              </div>

              {comparativo.length === 0 && !loading ? (
                <div className="pv2-empty">Sem dados históricos disponíveis.</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={comparativo} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="pv2BarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={GREEN} stopOpacity={0.85}/>
                          <stop offset="100%" stopColor={GREEN} stopOpacity={0.3}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false}/>
                      <XAxis dataKey="mes"
                        tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Sora' }}
                        tickLine={false} axisLine={false}/>
                      <YAxis yAxisId="fat"
                        tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Sora' }}
                        tickLine={false} axisLine={false}
                        tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                      <YAxis yAxisId="qtd" orientation="right"
                        tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Sora' }}
                        tickLine={false} axisLine={false}/>
                      <Tooltip content={<ChartTooltip/>}/>
                      <Bar yAxisId="fat" dataKey="faturamento" name="Faturamento"
                        fill="url(#pv2BarGrad)" radius={[5,5,0,0]}>
                        {comparativo.map((_, i) => (
                          <Cell key={i}
                            fill={i === comparativo.length - 1 ? GREEN : 'rgba(34,197,94,.35)'}/>
                        ))}
                      </Bar>
                      <Line yAxisId="qtd" type="monotone" dataKey="qtdVendas" name="Qtd Vendas"
                        stroke={BLUE} strokeWidth={2} dot={{ fill: BLUE, r: 3 }} strokeDasharray="4 2"/>
                    </ComposedChart>
                  </ResponsiveContainer>

                  {/* Tabela resumo */}
                  <div className="pv2-comp-table">
                    <div className="pv2-comp-head">
                      <span>Mês</span>
                      <span>Faturamento</span>
                      <span>Qtd Vendas</span>
                      <span>Variação</span>
                    </div>
                    {comparativo.map((m, i) => {
                      const ant = comparativo[i - 1];
                      const d = ant && ant.faturamento > 0
                        ? (m.faturamento - ant.faturamento) / ant.faturamento * 100
                        : null;
                      const isLast = i === comparativo.length - 1;
                      return (
                        <div key={m.mesKey} className={`pv2-comp-row${isLast ? ' pv2-comp-row--atual' : ''}`}>
                          <span style={{ fontWeight: isLast ? 700 : 400 }}>{m.mes}</span>
                          <span style={{ color: isLast ? GREEN : '#D1D5DB' }}>{fmtK(m.faturamento)}</span>
                          <span>{fmtN(m.qtdVendas)}</span>
                          <span><Delta val={d} size={11}/></span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="pv2-loading">
              <RefreshCw size={20} className="spin" style={{ color: GREEN }}/>
              <span>Carregando dados...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
