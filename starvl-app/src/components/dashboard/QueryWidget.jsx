import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,  Bar,
  LineChart, Line,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { apiFetch } from '../../api';

const COLORS = ['#F97316','#3B82F6','#22C55E','#A855F7','#F59E0B','#EF4444'];

const fmtNum = new Intl.NumberFormat('pt-BR');
const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 10, fontSize: 12,
  color: 'var(--color-text)',
};

function Spin() {
  return (
    <span style={{
      display: 'inline-block', width: 22, height: 22,
      border: '2px solid var(--color-primary)', borderTopColor: 'transparent',
      borderRadius: '50%', animation: 'spin .7s linear infinite',
    }} />
  );
}

function isNumeric(col, rows) {
  if (!rows.length) return false;
  const v = rows[0][col];
  return v !== null && v !== '' && !isNaN(Number(v));
}

function toISOFirst(ym) {
  const [y, m] = ym.split('-');
  return `${y}-${m}-01`;
}

function toISOLast(ym) {
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, '0')}-${last}`;
}

function toPeriodo(ym) {
  const [y, m] = ym.split('-');
  return `${m}${y}`;
}

function ChartInner({ type, data, xAxis, ySeries }) {
  if (!data.length || !xAxis || !ySeries.length) return null;

  const large = ySeries.some(s => data.some(r => Math.abs(Number(r[s])) >= 1000));
  const tipFmt = v => isNaN(Number(v)) ? v : (large ? fmtBRL.format(Number(v)) : fmtNum.format(Number(v)));
  const tickFmt = v => isNaN(Number(v)) ? v : fmtNum.format(Number(v));

  const shared = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
      <XAxis dataKey={xAxis} stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
      <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false}
        tickFormatter={tickFmt} width={large ? 90 : 55} />
      <Tooltip contentStyle={tooltipStyle} formatter={tipFmt} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      {ySeries.map((col, i) => {
        const c = COLORS[i % COLORS.length];
        if (type === 'bar')  return <Bar  key={col} dataKey={col} name={col} fill={c} radius={[4, 4, 0, 0]} />;
        if (type === 'area') return <Area key={col} dataKey={col} name={col} stroke={c} fill={c} fillOpacity={0.15} strokeWidth={2} type="monotone" />;
        return <Line key={col} dataKey={col} name={col} stroke={c} strokeWidth={2} dot={false} type="monotone" />;
      })}
    </>
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      {type === 'bar'  ? <BarChart  data={data}>{shared}</BarChart>  :
       type === 'area' ? <AreaChart data={data}>{shared}</AreaChart> :
                         <LineChart data={data}>{shared}</LineChart>}
    </ResponsiveContainer>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function QueryWidget({ codigo, titulo, empresas, selectedPeriod }) {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState('table');
  const [xAxis,   setXAxis]   = useState('');
  const [ySeries, setYSeries] = useState([]);

  const empresa    = (empresas || [])[0];
  const empresasQs = (empresas || []).join(',');

  useEffect(() => {
    if (!empresa || !selectedPeriod) return;
    let cancelled = false;
    setLoading(true);
    setResult(null);

    // Passa todos os params comuns: o SQL pode usar qualquer um deles
    const qs = new URLSearchParams({
      empresa,
      empresas:    empresasQs,
      data_inicio: toISOFirst(selectedPeriod),
      data_final:  toISOLast(selectedPeriod),
      periodo:     toPeriodo(selectedPeriod),
    }).toString();

    apiFetch(`/api/queries/execute/${codigo}?${qs}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setResult(d);
        if (d.ok && d.columns?.length && d.rows?.length) {
          const numCols = d.columns.filter(c => isNumeric(c, d.rows));
          const txtCols = d.columns.filter(c => !isNumeric(c, d.rows));
          setXAxis(txtCols[0] || d.columns[0]);
          setYSeries(numCols.slice(0, 3));
        }
      })
      .catch(() => { if (!cancelled) setResult({ ok: false, error: 'Erro de comunicação com o servidor.' }); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [codigo, empresa, empresasQs, selectedPeriod]);

  const rows    = result?.rows?.slice(0, 50) ?? [];
  const columns = result?.columns ?? [];
  const hasData = result?.ok && rows.length > 0;

  const VIEWS = [
    { key: 'table', label: 'Tabela' },
    { key: 'bar',   label: 'Barra' },
    { key: 'line',  label: 'Linha' },
    { key: 'area',  label: 'Área' },
  ];

  return (
    <div className="chart-card">
      {/* Header */}
      <div className="chart-card-header" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="chart-card-title">{titulo}</div>
          <div className="chart-card-desc">
            <code style={{ fontSize: 10, background: 'var(--color-bg)', padding: '1px 5px', borderRadius: 3 }}>
              {codigo}
            </code>
          </div>
        </div>

        {hasData && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {VIEWS.map(v => (
              <button key={v.key} onClick={() => setView(v.key)} style={{
                padding: '3px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                border: '1px solid var(--color-border)',
                background: view === v.key ? 'var(--color-primary)' : 'transparent',
                color:      view === v.key ? '#fff' : 'var(--color-text-muted)',
              }}>
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Estados */}
      {loading && (
        <div style={{ padding: '36px 0', display: 'flex', justifyContent: 'center' }}>
          <Spin />
        </div>
      )}

      {!loading && !result?.ok && (
        <p className="chart-empty" style={{ color: 'var(--color-error)' }}>
          {result?.error || 'Erro ao executar consulta.'}
        </p>
      )}

      {!loading && result?.ok && !hasData && (
        <p className="chart-empty">Sem dados para o período selecionado.</p>
      )}

      {/* Tabela */}
      {!loading && hasData && view === 'table' && (
        <div style={{ overflow: 'auto', maxHeight: 300 }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12 }}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col} style={{
                    position: 'sticky', top: 0, zIndex: 1,
                    background: 'var(--color-bg-secondary)',
                    padding: '7px 12px', textAlign: 'left', fontWeight: 700,
                    color: 'var(--color-text-secondary)',
                    boxShadow: '0 2px 0 var(--color-primary)',
                    whiteSpace: 'nowrap',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col} style={{
                      padding: '5px 12px', borderBottom: '1px solid var(--color-border)',
                      color: 'var(--color-text)', maxWidth: 220,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {row[col] === null
                        ? <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>null</span>
                        : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {(result.rowCount ?? 0) > 50 && (
            <p style={{ padding: '6px 12px', fontSize: 11, color: 'var(--color-text-muted)', margin: 0, borderTop: '1px solid var(--color-border)' }}>
              Exibindo 50 de {result.rowCount} linhas.
            </p>
          )}
        </div>
      )}

      {/* Gráfico */}
      {!loading && hasData && view !== 'table' && (
        <div style={{ paddingTop: 8 }}>
          <ChartInner type={view} data={rows} xAxis={xAxis} ySeries={ySeries} />
        </div>
      )}
    </div>
  );
}
