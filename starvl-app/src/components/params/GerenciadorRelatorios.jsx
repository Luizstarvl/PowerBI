import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart,  Bar,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { apiFetch } from '../../api';

const SERIES_COLORS = ['#F97316','#3B82F6','#22C55E','#A855F7','#F59E0B','#EF4444'];

const fmt = new Intl.NumberFormat('pt-BR');
const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function detectParams(sql) {
  const re = /\{\{\s*(\w+)\s*\}\}/g;
  const found = new Set();
  let m;
  while ((m = re.exec(sql)) !== null) found.add(m[1]);
  return [...found];
}

function autoDefault(name) {
  const n  = name.toLowerCase();
  const d  = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  if (n === 'data_inicio' || n === 'datainicio') return `01-${mm}-${yy}`;
  if (n === 'data_fim'    || n === 'datafim'
   || n === 'data_final'  || n === 'datafinal')  return `${dd}-${mm}-${yy}`;
  if (n === 'data'        || n === 'hoje')       return `${dd}-${mm}-${yy}`;
  if (n === 'mes'         || n === 'mes_atual')  return String(d.getMonth() + 1);
  if (n === 'ano'         || n === 'ano_atual')  return String(yy);
  if (n === 'periodo')                           return `${mm}${yy}`;
  return '';
}

function paramLabel(name) {
  const map = {
    empresa:    'Empresa (código)',
    empresa_id: 'Empresa (código)',
    data:       'Data (DD-MM-AAAA)',
    data_inicio:'Data início (DD-MM-AAAA)',
    data_fim:   'Data fim (DD-MM-AAAA)',
    data_final: 'Data final (DD-MM-AAAA)',
    mes:        'Mês (1–12)',
    ano:        'Ano (AAAA)',
    periodo:    'Período (MMAAAA)',
  };
  return map[name.toLowerCase()] || name;
}

// Converte DD-MM-AAAA → AAAA-MM-DD antes de enviar ao PostgreSQL
function toISODate(value) {
  const m = String(value).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : value;
}

function isDateParam(name) {
  const n = name.toLowerCase();
  return n.includes('data') || n === 'hoje' || n === 'date';
}

function Spin({ size = 14 }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: '2px solid var(--color-primary)', borderTopColor: 'transparent',
      borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0,
    }} />
  );
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 10, fontSize: 12,
  color: 'var(--color-text)',
};

function Chart({ type, data, xAxis, ySeries }) {
  if (!data.length || !xAxis || !ySeries.length) return (
    <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
      Configure o eixo X e pelo menos uma série para visualizar o gráfico.
    </div>
  );

  const isCurrency = ySeries.some(s => {
    const vals = data.map(r => r[s]).filter(v => v != null);
    return vals.length > 0 && vals.every(v => !isNaN(Number(v)));
  });

  const tickFormatter = v => {
    if (isNaN(Number(v))) return v;
    return Number(v) >= 1000 ? fmt.format(Number(v)) : String(v);
  };
  const tipFormatter = v => {
    if (isNaN(Number(v))) return v;
    return Number(v) >= 1000 ? fmtBRL.format(Number(v)) : fmt.format(Number(v));
  };

  const common = {
    data,
    children: (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey={xAxis} stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false}
          tickFormatter={tickFormatter} width={isCurrency ? 80 : 50} />
        <Tooltip contentStyle={tooltipStyle} formatter={tipFormatter} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {ySeries.map((col, i) => {
          const color = SERIES_COLORS[i % SERIES_COLORS.length];
          if (type === 'bar')  return <Bar  key={col} dataKey={col} name={col} fill={color} radius={[4,4,0,0]} />;
          if (type === 'area') return <Area key={col} dataKey={col} name={col} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} type="monotone" />;
          return <Line key={col} dataKey={col} name={col} stroke={color} strokeWidth={2} dot={false} type="monotone" />;
        })}
      </>
    ),
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      {type === 'bar'  ? <BarChart  data={common.data}>{common.children}</BarChart>  :
       type === 'area' ? <AreaChart data={common.data}>{common.children}</AreaChart> :
                         <LineChart data={common.data}>{common.children}</LineChart>}
    </ResponsiveContainer>
  );
}

export default function GerenciadorRelatorios({ user }) {
  const [queries,   setQueries]   = useState([]);
  const [loadingQ,  setLoadingQ]  = useState(true);
  const [selId,     setSelId]     = useState('');
  const [selQuery,  setSelQuery]  = useState(null);
  const [params,    setParams]    = useState({});
  const [paramNames,setParamNames]= useState([]);
  const [executing, setExecuting] = useState(false);
  const [result,    setResult]    = useState(null);
  const [view,      setView]      = useState('table'); // 'table' | 'chart'
  const [chartType, setChartType] = useState('bar');
  const [xAxis,     setXAxis]     = useState('');
  const [ySeries,   setYSeries]   = useState([]);

  useEffect(() => {
    apiFetch('/api/queries?ativa=true')
      .then(r => r.json())
      .then(d => setQueries(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingQ(false));
  }, []);

  async function handleSelectQuery(id) {
    setSelId(id);
    setResult(null);
    setXAxis(''); setYSeries([]);
    if (!id) { setSelQuery(null); setParamNames([]); setParams({}); return; }
    try {
      const res  = await apiFetch(`/api/queries/${id}`);
      const data = await res.json();
      setSelQuery(data);
      const detected = detectParams(data.sql || '');
      setParamNames(detected);
      setParams(Object.fromEntries(detected.map(p => [p, autoDefault(p)])));
    } catch { setSelQuery(null); }
  }

  function setParam(k, v) { setParams(p => ({ ...p, [k]: v })); }

  async function execute() {
    if (!selQuery) return;
    setExecuting(true); setResult(null);
    try {
      const converted = Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, isDateParam(k) ? toISODate(v) : v])
      );
      const qs  = new URLSearchParams(converted).toString();
      const url = `/api/queries/execute/${selQuery.codigo}${qs ? '?' + qs : ''}`;
      const res = await apiFetch(url);
      const data = await res.json();
      setResult(data);
      if (data.ok && data.columns?.length) {
        setXAxis(data.columns[0]);
        setYSeries(data.columns.slice(1, 4));
      }
    } catch { setResult({ ok: false, error: 'Erro de comunicação com o servidor.' }); }
    finally { setExecuting(false); }
  }

  function toggleSerie(col) {
    setYSeries(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  }

  const canExecute = !!selQuery && !executing && paramNames.every(p => String(params[p] ?? '').trim() !== '');
  const displayRows = result?.rows?.slice(0, 500) ?? [];

  return (
    <div className="fade-up">
      <div className="param-section-header">
        <div>
          <h3 className="param-section-title">Gerador de Relatórios</h3>
          <p className="param-section-desc">
            Selecione uma consulta salva, preencha os parâmetros e visualize os dados em tabela ou gráfico.
          </p>
        </div>
      </div>

      {/* Seleção de consulta */}
      <div className="param-card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-field" style={{ flex: 1, minWidth: 240, margin: 0 }}>
            <label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Consulta</label>
            {loadingQ ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38 }}>
                <Spin size={14} /><span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Carregando consultas…</span>
              </div>
            ) : (
              <select
                value={selId}
                onChange={e => handleSelectQuery(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">— Selecione uma consulta —</option>
                {queries.map(q => (
                  <option key={q.id} value={q.id}>
                    [{q.categoria}] {q.nome} ({q.codigo})
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            className="btn-primary"
            onClick={execute}
            disabled={!canExecute}
            style={{ flexShrink: 0, height: 38, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {executing ? <><Spin size={13} /> Executando…</> : '▶ Executar'}
          </button>
        </div>

        {/* Parâmetros dinâmicos */}
        {paramNames.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Parâmetros
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {paramNames.map(p => (
                <div className="form-field" key={p} style={{ margin: 0, minWidth: 160 }}>
                  <label style={{ fontSize: 12 }}>
                    <code style={{ background: 'var(--color-bg)', padding: '1px 4px', borderRadius: 3, fontSize: 11 }}>
                      {`{{${p}}}`}
                    </code>
                    {'  '}{paramLabel(p)}
                  </label>
                  <input
                    type="text"
                    value={params[p] ?? ''}
                    onChange={e => setParam(p, e.target.value)}
                    placeholder={autoDefault(p) || `valor de ${p}`}
                    autoComplete="off"
                    onKeyDown={e => { if (e.key === 'Enter' && canExecute) execute(); }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resultado */}
      {result && (
        <div className="param-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Barra de status + abas */}
          <div style={{
            padding: '10px 16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-bg-secondary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {result.ok ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)' }}>
                    {result.rowCount ?? 0} linha(s) em {result.executionTime}ms
                  </span>
                  {result.rowCount > 500 && (
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      · exibindo 500
                    </span>
                  )}
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-error)' }}>
                    {result.error}
                  </span>
                </>
              )}
            </div>

            {result.ok && result.rows?.length > 0 && (
              <div style={{ display: 'flex', gap: 4 }}>
                {[['table','Tabela'],['chart','Gráfico']].map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    style={{
                      padding: '4px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                      border: '1px solid var(--color-border)',
                      background: view === v ? 'var(--color-primary)' : 'transparent',
                      color:      view === v ? '#fff' : 'var(--color-text-muted)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabela */}
          {result.ok && view === 'table' && displayRows.length > 0 && (
            <div style={{ overflow: 'auto', maxHeight: 440 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-secondary)', position: 'sticky', top: 0, zIndex: 1 }}>
                    {result.columns.map(col => (
                      <th key={col} style={{ padding: '7px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {result.columns.map(col => (
                        <td key={col} style={{ padding: '5px 14px', color: 'var(--color-text)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row[col] === null
                            ? <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>null</span>
                            : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.ok && view === 'table' && displayRows.length === 0 && (
            <p style={{ padding: '20px 16px', fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              Consulta retornou 0 linhas.
            </p>
          )}

          {/* Gráfico */}
          {result.ok && view === 'chart' && (
            <div style={{ padding: '16px 20px' }}>
              {/* Config do gráfico */}
              <div style={{
                display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start',
                padding: '14px 16px', borderRadius: 8, marginBottom: 16,
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
              }}>
                {/* Tipo */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', margin: '0 0 6px' }}>Tipo</p>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[['bar','Barra'],['line','Linha'],['area','Área']].map(([t, l]) => (
                      <button
                        key={t} onClick={() => setChartType(t)}
                        style={{
                          padding: '4px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                          border: '1px solid var(--color-border)',
                          background: chartType === t ? 'var(--color-primary)' : 'transparent',
                          color:      chartType === t ? '#fff' : 'var(--color-text-muted)',
                        }}
                      >{l}</button>
                    ))}
                  </div>
                </div>

                {/* Eixo X */}
                <div className="form-field" style={{ margin: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Eixo X (categorias)</label>
                  <select value={xAxis} onChange={e => setXAxis(e.target.value)} style={{ minWidth: 160 }}>
                    <option value="">— selecione —</option>
                    {result.columns.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>

                {/* Séries Y */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', margin: '0 0 6px' }}>Valores (séries)</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {result.columns.filter(c => c !== xAxis).map((col, i) => {
                      const active = ySeries.includes(col);
                      return (
                        <label key={col} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12 }}>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleSerie(col)}
                            style={{ accentColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
                          />
                          <span style={{ color: active ? SERIES_COLORS[i % SERIES_COLORS.length] : 'var(--color-text-muted)', fontWeight: active ? 600 : 400 }}>
                            {col}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Chart
                type={chartType}
                data={displayRows}
                xAxis={xAxis}
                ySeries={ySeries}
              />
            </div>
          )}
        </div>
      )}

      {!selQuery && !loadingQ && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .35, marginBottom: 10 }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
          </svg>
          <p style={{ margin: 0, fontSize: 14 }}>Selecione uma consulta para começar.</p>
          <p style={{ margin: '4px 0 0', fontSize: 12 }}>
            Crie consultas no <strong>Gerenciador de Consultas</strong> com parâmetros como{' '}
            <code style={{ background: 'var(--color-bg)', padding: '1px 4px', borderRadius: 3 }}>{'{{empresa}}'}</code>,{' '}
            <code style={{ background: 'var(--color-bg)', padding: '1px 4px', borderRadius: 3 }}>{'{{data_inicio}}'}</code>.
          </p>
        </div>
      )}
    </div>
  );
}
