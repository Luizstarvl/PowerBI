import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { ShoppingCart, Fuel, Package, Truck, Boxes, Gauge } from 'lucide-react';
import { KpiCard } from '../components/ui';

import { CHART_COLORS } from '../theme/tokens';
import { apiFetch } from '../api';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const number   = new Intl.NumberFormat('pt-BR');

function toPeriodoParam(period) {
  const [yyyy, mm] = period.split('-');
  return `${mm}${yyyy}`;
}

// Monta query string para /execute/:codigo com todos os params comuns do dashboard
function buildSlotQs(empresasKey, selectedPeriod) {
  const empresa = (empresasKey || '').split(',')[0];
  const [y, m] = selectedPeriod.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  const pad = n => String(n).padStart(2, '0');
  return new URLSearchParams({
    empresa,
    empresas:    empresasKey,
    data_inicio: `${y}-${pad(m)}-01`,
    data_final:  `${y}-${pad(m)}-${last}`,
    periodo:     `${pad(m)}${y}`,
  }).toString();
}

// Mapeia resultado genérico de consulta para { name, qty } esperado pelo banner
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

function lastMonths(n = 6) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return { value: `${yyyy}-${mm}`, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--color-text)',
};

/* ── Cores dos avatares por rank ─────────────────────────────────────────────── */
const RANK_GRAD = [
  'linear-gradient(135deg,#ff8c00,#ff4500)',
  'linear-gradient(135deg,#60a5fa,#2563eb)',
  'linear-gradient(135deg,#4ade80,#16a34a)',
  'linear-gradient(135deg,#c084fc,#7c3aed)',
  'linear-gradient(135deg,#f472b6,#be185d)',
];

function TopProdutosBanner({ dados, loading }) {
  const [featured, setFeatured] = useState(0);

  useEffect(() => {
    if (!dados || dados.length < 2) return;
    const id = setInterval(() => setFeatured(f => (f + 1) % dados.length), 4000);
    return () => clearInterval(id);
  }, [dados]);

  if (loading) return null;

  if (!dados || dados.length === 0) return (
    <div className="tpb-root tpb-root--empty">
      <div className="tpb-eyebrow">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ff8c00' }}>
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1h14v1z"/>
        </svg>
        Top 5 Mais Vendidos · Conveniência
      </div>
      <p className="tpb-empty-msg">Sem dados de conveniência para o período selecionado.</p>
    </div>
  );

  const n = dados.length;
  const half = Math.min(2, Math.floor((n - 1) / 2));
  const offsets = Array.from({ length: 2 * half + 1 }, (_, i) => i - half);

  const cards = offsets.map(offset => {
    const idx = ((featured + offset) % n + n) % n;
    return { ...dados[idx], rank: idx + 1, offset };
  });

  return (
    <div className="tpb-root">
      <div className="tpb-eyebrow">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ff8c00' }}>
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1h14v1z"/>
        </svg>
        Top 5 Mais Vendidos · Conveniência
      </div>

      <div className="tpb-stage">
        {cards.map(card => {
          const isCenter = card.offset === 0;
          const dist = Math.abs(card.offset);
          return (
            <div
              key={`${card.rank}-${card.offset}`}
              className={`tpb-card tpb-dist-${dist}${isCenter ? ' tpb-featured' : ''}`}
              onClick={isCenter ? undefined : () => setFeatured(card.rank - 1)}
            >
              {isCenter ? (
                <div className="tpb-crown">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1h14v1z"/>
                  </svg>
                </div>
              ) : (
                <div className="tpb-side-rank">{card.rank}°</div>
              )}

              <div className="tpb-avatar" style={{ background: RANK_GRAD[(card.rank - 1) % RANK_GRAD.length] }}>
                {card.name.charAt(0).toUpperCase()}
              </div>

              <div className="tpb-card-name">{card.name}</div>
              <div className="tpb-card-qty">
                {number.format(Math.round(card.qty))} <small>un.</small>
              </div>
              <div className={`tpb-badge tpb-badge--${card.rank}`}>{card.rank}° Lugar</div>
            </div>
          );
        })}
      </div>

      <div className="tpb-dots">
        {dados.map((_, i) => (
          <button key={i} className={`tpb-dot${i === featured ? ' on' : ''}`} onClick={() => setFeatured(i)} />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ empresas, period, onNavigate }) {
  const months = useMemo(() => lastMonths(6), []);
  const [selectedPeriod, setSelectedPeriod] = useState(period || months[0].value);
  const [kpis, setKpis] = useState(null);
  const [vendasDiarias, setVendasDiarias] = useState([]);
  const [vendasHorarias, setVendasHorarias] = useState([]);
  const [topProdutos, setTopProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [dashQueries, setDashQueries] = useState([]);

  // Carrega uma vez as consultas salvas com categoria "Dashboard"
  useEffect(() => {
    apiFetch('/api/queries?ativa=true&categoria=Dashboard')
      .then(r => r.json())
      .then(d => setDashQueries(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const empresasKey = (empresas || []).join(',');

  // Mapa slot → query para acesso rápido
  const slotMap = useMemo(
    () => Object.fromEntries(dashQueries.filter(q => q.slot).map(q => [q.slot, q])),
    [dashQueries]
  );

  // Effect separado para dados de widgets vinculados a slots
  useEffect(() => {
    if (!empresasKey || !selectedPeriod) return;
    const top5Q = slotMap.top5_convenio;
    if (!top5Q) return;
    let cancelado = false;
    const qs = buildSlotQs(empresasKey, selectedPeriod);
    apiFetch(`/api/queries/execute/${top5Q.codigo}?${qs}`)
      .then(r => r.json())
      .then(d => { if (!cancelado) setTopProdutos(mapToTopProdutos(d)); })
      .catch(() => { if (!cancelado) setTopProdutos([]); });
    return () => { cancelado = true; };
  }, [slotMap, empresasKey, selectedPeriod]);

  useEffect(() => {
    if (!empresasKey) return;
    let cancelado = false;
    setLoading(true);
    setErro('');

    const periodo = toPeriodoParam(selectedPeriod);
    const qs = `empresas=${empresasKey}&periodo=${periodo}`;

    // top-convenio: usa slot se configurado (o slot effect cuida dos dados),
    // caso contrário usa a rota hardcoded
    const hasTop5Slot = !!slotMap.top5_convenio;

    Promise.all([
      apiFetch(`/api/dashboard/kpis?${qs}`).then(r => r.json()),
      apiFetch(`/api/dashboard/vendas-diarias-full?${qs}`).then(r => r.json()),
      apiFetch(`/api/dashboard/vendas-horarias?${qs}`).then(r => r.json()),
      hasTop5Slot ? Promise.resolve([]) : apiFetch(`/api/dashboard/top-convenio?${qs}`).then(r => r.json()),
    ])
      .then(([kpisData, diariasData, horariasData, topData]) => {
        if (cancelado) return;
        if (kpisData?.error) throw new Error(kpisData.error);
        setKpis(kpisData);
        setVendasDiarias(Array.isArray(diariasData) ? diariasData : []);
        setVendasHorarias(Array.isArray(horariasData) ? horariasData : []);
        if (!hasTop5Slot) setTopProdutos(Array.isArray(topData) ? topData : []);
      })
      .catch(() => { if (!cancelado) setErro('Não foi possível carregar os dados do período.'); })
      .finally(() => { if (!cancelado) setLoading(false); });

    return () => { cancelado = true; };
  }, [empresasKey, selectedPeriod, slotMap]);

  const diariasFmt = vendasDiarias.map(d => ({
    ...d,
    diaLabel: String(d.dia).slice(8, 10) || String(d.dia).slice(-2),
  }));

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="section-title">Visão geral</div>
          <div className="section-sub">Resumo de vendas do período selecionado</div>
        </div>
        <div className="period-picker">
          <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {!empresasKey && <p className="chart-empty">Selecione uma empresa para ver o dashboard.</p>}
      {erro && <p className="form-erro">{erro}</p>}

      {empresasKey && !erro && (
        <>
          <TopProdutosBanner dados={topProdutos} loading={loading} />

          <div className="kpi-grid">
            <KpiCard icon={ShoppingCart} label="Vendas totais" value={loading ? '—' : currency.format(kpis?.vendas.valor || 0)} sub={loading ? '' : `${number.format(kpis?.vendas.total || 0)} vendas`} />
            <KpiCard icon={Fuel}         label="Combustível"   value={loading ? '—' : currency.format(kpis?.combustivel.valor || 0)} sub={loading ? '' : `${number.format(kpis?.combustivel.litros || 0)} L`} />
            <KpiCard icon={Package}      label="Conveniência"  value={loading ? '—' : currency.format(kpis?.conveniencia.valor || 0)} sub={loading ? '' : `${number.format(kpis?.conveniencia.total || 0)} vendas`} />
            <KpiCard icon={Truck}        label="Compras combustível" value={loading ? '—' : currency.format(kpis?.comprasComb.valor || 0)} />
            <KpiCard icon={Boxes}        label="Compras conveniência" value={loading ? '—' : currency.format(kpis?.comprasConv.valor || 0)} />
            <KpiCard icon={Gauge}        label="Aferições" value={loading ? '—' : number.format(kpis?.afericoes.total || 0)} sub={loading ? '' : `${number.format(kpis?.afericoes.qtd || 0)} un.`} />
          </div>

          <div className="chart-grid">
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-card-title">Vendas diárias</div>
                <div className="chart-card-desc">Combustível, conveniência e pista ao longo do mês</div>
              </div>
              {diariasFmt.length === 0 ? (
                <p className="chart-empty">{loading ? 'Carregando…' : 'Sem dados para o período.'}</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={diariasFmt}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="diaLabel" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => currency.format(v)} width={90} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => currency.format(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="valorCombustivel"  name="Combustível"   stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.18} strokeWidth={2} />
                    <Area type="monotone" dataKey="valorConveniencia" name="Conveniência"  stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.14} strokeWidth={2} />
                    <Area type="monotone" dataKey="valorPista"        name="Pista"         stroke={CHART_COLORS[4]} fill={CHART_COLORS[4]} fillOpacity={0.12} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-card-title">Vendas por hora</div>
                <div className="chart-card-desc">Faturamento de combustível por horário do dia</div>
              </div>
              {vendasHorarias.length === 0 ? (
                <p className="chart-empty">{loading ? 'Carregando…' : 'Sem dados para o período.'}</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={vendasHorarias}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} interval={2} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => currency.format(v)} width={90} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => currency.format(v)} />
                    <Bar dataKey="valorTotal" name="Faturamento" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </>
      )}
    </main>
  );
}
