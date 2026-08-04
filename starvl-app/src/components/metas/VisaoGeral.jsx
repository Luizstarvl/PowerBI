import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, Bar, Line, ComposedChart, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { CheckCircle2, TrendingUp, Wallet, CalendarClock, AlertTriangle, Layers } from 'lucide-react';
import { apiFetch } from '../../api';
import { indicadorLabel } from '../../constants/metas';
import { CHART_COLORS } from '../../theme/tokens';
import { fmtBRL, fmtPeriodo, KpiMeta, StatusBadge, BarraPercentual } from './MetasShared';

const tooltipStyle = {
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 10, fontSize: 12, color: 'var(--color-text)',
};

export default function VisaoGeral({ empresa, empresaNome, kpis, onOpenDetalhe }) {
  const [progresso, setProgresso]   = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [emAndamento, setEmAndamento] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empresa) return;
    let cancelado = false;
    setLoading(true);
    Promise.all([
      apiFetch(`/api/metas/progresso-mensal?empresa=${empresa}`).then(r => r.json()),
      apiFetch(`/api/metas/categorias?empresa=${empresa}`).then(r => r.json()),
      apiFetch(`/api/metas?empresa=${empresa}&status=${encodeURIComponent('Em andamento')}&perPage=8`).then(r => r.json()),
    ]).then(([prog, cats, lista]) => {
      if (cancelado) return;
      if (Array.isArray(prog)) setProgresso(prog);
      if (Array.isArray(cats)) setCategorias(cats);
      if (lista?.data) setEmAndamento(lista.data);
    }).catch(() => {}).finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
  }, [empresa]);

  const totalMetasCategorias = categorias.reduce((s, c) => s + c.totalMetas, 0);

  return (
    <>
      <div className="mgt-kpi-grid mgt-kpi-grid--6">
        <KpiMeta icon={Layers}        label="METAS ATIVAS"      value={kpis ? String(kpis.ativas ?? 0) : '—'} sub="Nem concluídas nem canceladas" />
        <KpiMeta icon={CheckCircle2}  label="CONCLUÍDAS"        value={kpis ? String(kpis.concluidas ?? 0) : '—'} sub="Atingiram 100% ou mais" />
        <KpiMeta icon={TrendingUp}    label="PROGRESSO MÉDIO"   value={kpis ? `${(kpis.mediaCumprimento || 0).toFixed(1)}%` : '—'} progress={kpis?.mediaCumprimento} sub="Média de todas as metas" />
        <KpiMeta icon={Wallet}        label="ATINGIMENTO TOTAL" value={kpis ? fmtBRL.format(kpis.valorTotalAtual || 0) : '—'} sub="Valor total realizado" />
        <KpiMeta icon={CalendarClock} label="A VENCER HOJE"     value={kpis ? String(kpis.venceHoje ?? 0) : '—'} sub="Prazo é hoje" />
        <KpiMeta icon={AlertTriangle} label="EM ATRASO"         value={kpis ? String(kpis.atrasadas ?? 0) : '—'} sub="Prazo vencido" />
      </div>

      <div className="mgt-charts-row">
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Progresso das metas</div>
            <div className="chart-card-desc">Meta, alcançado e ritmo previsto por mês (ano corrente)</div>
          </div>
          {progresso.length === 0 ? <p className="chart-empty">{loading ? 'Carregando…' : 'Sem metas com prazo neste ano.'}</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={progresso}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="mesLabel" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} width={70}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => fmtBRL.format(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="meta"      name="Meta"      fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
                <Bar dataKey="alcancado" name="Alcançado"  fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
                <Line dataKey="previsto" name="Previsto" stroke="var(--color-text-muted)" strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive animationDuration={900} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Distribuição por categoria</div>
            <div className="chart-card-desc">Valor realizado por categoria</div>
          </div>
          {categorias.length === 0 ? <p className="chart-empty">{loading ? 'Carregando…' : 'Sem metas cadastradas.'}</p> : (
            <div className="mgt-donut-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categorias} dataKey="valorAtual" nameKey="categoria" innerRadius={62} outerRadius={92} paddingAngle={3} isAnimationActive animationDuration={800}>
                    {categorias.map((c, i) => <Cell key={c.categoria} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={v => fmtBRL.format(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mgt-donut-center">
                <span className="mgt-donut-center-value">{totalMetasCategorias}</span>
                <span className="mgt-donut-center-label">Metas</span>
              </div>
              <div className="mgt-donut-legend">
                {categorias.map((c, i) => (
                  <div key={c.categoria} className="mgt-donut-legend-item">
                    <span className="mgt-donut-legend-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="mgt-donut-legend-nome">{c.categoria}</span>
                    <span className="mgt-donut-legend-valor">{fmtBRL.format(c.valorAtual)} ({c.percentual}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mgt-table-card">
        <div className="mgt-table-card-title">Metas em andamento</div>
        <div className="mgt-table-wrap">
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>Carregando…</div>
          ) : emAndamento.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>Nenhuma meta em andamento.</div>
          ) : (
            <table className="mgt-table">
              <thead>
                <tr>
                  <th>META</th>
                  <th>CATEGORIA</th>
                  <th>PERÍODO</th>
                  <th style={{ textAlign: 'right' }}>META (R$)</th>
                  <th style={{ textAlign: 'right' }}>ALCANÇADO</th>
                  <th style={{ minWidth: 140 }}>PROGRESSO</th>
                  <th>STATUS</th>
                  <th>VENCIMENTO</th>
                  <th style={{ textAlign: 'center', width: 52 }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {emAndamento.map(m => (
                  <tr key={m.id} className="mgt-tr" onDoubleClick={() => onOpenDetalhe(m)}>
                    <td className="mgt-td-ref">{m.nome}</td>
                    <td>{m.categoria}</td>
                    <td className="mgt-td-periodo">{indicadorLabel(m.categoria, m.indicador)}</td>
                    <td className="mgt-td-num">{fmtBRL.format(m.valorMeta)}</td>
                    <td className="mgt-td-num">{fmtBRL.format(m.valorAtual)}</td>
                    <td><BarraPercentual pct={m.percentual} /></td>
                    <td><StatusBadge status={m.status} /></td>
                    <td className="mgt-td-periodo">{fmtPeriodo(m.dataFinal)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="mgt-acoes-btn" onClick={() => onOpenDetalhe(m)} title="Ver detalhe">
                        <span>✎</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
