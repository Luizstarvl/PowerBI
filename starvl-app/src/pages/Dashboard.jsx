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

export default function Dashboard({ empresas, period, onNavigate }) {
  const months = useMemo(() => lastMonths(6), []);
  const [selectedPeriod, setSelectedPeriod] = useState(period || months[0].value);
  const [kpis, setKpis] = useState(null);
  const [vendasDiarias, setVendasDiarias] = useState([]);
  const [vendasHorarias, setVendasHorarias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const empresasKey = (empresas || []).join(',');

  useEffect(() => {
    if (!empresasKey) return;
    let cancelado = false;
    setLoading(true);
    setErro('');

    const periodo = toPeriodoParam(selectedPeriod);
    const qs = `empresas=${empresasKey}&periodo=${periodo}`;

    Promise.all([
      apiFetch(`/api/dashboard/kpis?${qs}`).then(r => r.json()),
      apiFetch(`/api/dashboard/vendas-diarias-full?${qs}`).then(r => r.json()),
      apiFetch(`/api/dashboard/vendas-horarias?${qs}`).then(r => r.json()),
    ])
      .then(([kpisData, diariasData, horariasData]) => {
        if (cancelado) return;
        if (kpisData?.error) throw new Error(kpisData.error);
        setKpis(kpisData);
        setVendasDiarias(Array.isArray(diariasData) ? diariasData : []);
        setVendasHorarias(Array.isArray(horariasData) ? horariasData : []);
      })
      .catch(() => { if (!cancelado) setErro('Não foi possível carregar os dados do período.'); })
      .finally(() => { if (!cancelado) setLoading(false); });

    return () => { cancelado = true; };
  }, [empresasKey, selectedPeriod]);

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
