/**
 * SaudeCarteira.jsx
 * Módulo Saúde da Carteira de Clientes — 6 abas de análise.
 * Alimentado por consultas configuradas no Gerenciador de Consultas.
 *
 * Slots esperados (opcionais — cada um ativa a aba correspondente):
 *   saude_visao_geral     → KPIs consolidados da carteira
 *   saude_inadimplencia   → Aging da dívida + ranking de inadimplentes
 *   saude_frequencia      → Frequência e recência de compra por cliente
 *   saude_ausentes        → Clientes sem compra no período
 *   saude_score           → Score completo por cliente (0–100)
 *   saude_oportunidades   → Alertas inteligentes (crescimento, risco, etc.)
 *
 * Parâmetros passados a cada slot:
 *   ?empresa=X&data_inicio=YYYY-MM-DD&data_final=YYYY-MM-DD&dias=90
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  Heart, AlertTriangle, Clock, Users, Star, Zap,
  RefreshCw, Settings, ChevronDown, X,
  TrendingUp, TrendingDown, DollarSign,
  BarChart3, Activity, Target, Calendar,
  AlertCircle, Printer,
} from 'lucide-react';
import { apiFetch } from '../../api';

// ── Constantes ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'visao_geral',    label: 'Visão Geral',          Icon: Activity,      slot: 'saude_visao_geral'    },
  { key: 'inadimplencia',  label: 'Inadimplência',         Icon: AlertTriangle, slot: 'saude_inadimplencia'  },
  { key: 'frequencia',     label: 'Freq. de Compra',       Icon: BarChart3,     slot: 'saude_frequencia'     },
  { key: 'ausentes',       label: 'Clientes Ausentes',     Icon: Clock,         slot: 'saude_ausentes'       },
  { key: 'score',          label: 'Score',                 Icon: Star,          slot: 'saude_score'          },
  { key: 'oportunidades',  label: 'Oportunidades',         Icon: Zap,           slot: 'saude_oportunidades'  },
];

const DIAS_OPTIONS = [
  { value: 30,  label: 'Últimos 30 dias'  },
  { value: 60,  label: 'Últimos 60 dias'  },
  { value: 90,  label: 'Últimos 90 dias'  },
  { value: 180, label: 'Últimos 180 dias' },
  { value: 365, label: 'Últimos 365 dias' },
];

// ── Gerador de HTML para impressão ───────────────────────────────────────────
function gerarHtmlSaude({ tabLabel, rows, columns, periodoLabel, dataInicio, dataFim, empresa }) {
  const now = new Date().toLocaleString('pt-BR');

  const headersHtml = columns
    .map(c => `<th>${c.replace(/_/g, ' ').toUpperCase()}</th>`)
    .join('');

  const RISK_MAP = { alto: '#dc2626', medio: '#f59e0b', baixo: '#22c55e', critico: '#7f1d1d' };
  const isRisk  = c => /risco|nivel|risk/.test(c.toLowerCase());
  const isScore = c => c.toLowerCase() === 'score';

  const rowsHtml = rows.map((row, i) => {
    const tds = columns.map(c => {
      const v = row[c] ?? '—';
      if (isRisk(c)) {
        const key = String(v).toLowerCase().normalize('NFD').replace(/[̀-͜]/g, '');
        const cor = RISK_MAP[key] || '#888';
        return `<td><span class="badge" style="background:${cor}20;color:${cor};border:1px solid ${cor}60">${v}</span></td>`;
      }
      if (isScore(c)) {
        const s = Number(v) || 0;
        const cor = s >= 76 ? '#22c55e' : s >= 51 ? '#f59e0b' : s >= 26 ? '#f97316' : '#dc2626';
        return `<td><span class="badge" style="background:${cor}20;color:${cor};border:1px solid ${cor}60">${s}</span></td>`;
      }
      return `<td>${v}</td>`;
    }).join('');
    const bg = i % 2 === 1 ? 'background:#f9f9f9' : '';
    return `<tr style="${bg}">${tds}</tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Saúde da Carteira · ${tabLabel}</title>
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
@media screen {
  html { background: #3a3a3a; }
  body { background: #3a3a3a; padding: 28px 20px; font-family:'Segoe UI',Arial,sans-serif; font-size:11px; color:#1a1a1a; }
  .wrap { max-width: 1000px; margin: 0 auto; background: #fff; padding: 32px 36px; box-shadow: 0 4px 28px rgba(0,0,0,.5); }
}
@media print {
  html, body { background: #fff !important; padding: 10mm !important; margin: 0 !important; }
  .wrap { padding: 0 !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; }
  table { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
body { font-family:'Segoe UI',Arial,sans-serif; font-size:11px; color:#1a1a1a; }
.wrap { background:#fff; }
.rh { display:flex; align-items:flex-end; justify-content:space-between; padding-bottom:12px; margin-bottom:20px; border-bottom:3px solid #EC4899; }
.rh-brand { font-size:10px; font-weight:700; color:#EC4899; letter-spacing:.12em; text-transform:uppercase; }
.rh-title { font-size:17px; font-weight:700; color:#111; line-height:1.2; margin-top:4px; }
.rh-meta  { text-align:right; font-size:9.5px; color:#888; line-height:1.9; }
.rh-meta strong { color:#444; }
table { width:100%; border-collapse:collapse; margin-top:4px; }
thead tr { border-bottom:2px solid #EC4899; }
th { padding:5px 7px; font-size:8.5px; text-transform:uppercase; letter-spacing:.05em; color:#888; font-weight:700; text-align:left; white-space:nowrap; }
td { padding:7px 7px; border-bottom:1px solid #f0f0f0; vertical-align:middle; font-size:10.5px; white-space:nowrap; }
tr:last-child td { border-bottom:none; }
.badge { display:inline-block; padding:2px 7px; border-radius:4px; font-size:9.5px; font-weight:700; }
.rf { margin-top:18px; padding-top:9px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; font-size:9px; color:#ccc; }
</style></head><body>
<div class="wrap">
  <div class="rh">
    <div>
      <div class="rh-brand">Eclipse · Sistema de Gestão de Postos</div>
      <div class="rh-title">Saúde da Carteira — ${tabLabel}</div>
    </div>
    <div class="rh-meta">
      <strong>Empresa:</strong> ${empresa || '—'}<br>
      <strong>Período:</strong> ${periodoLabel} (${dataInicio} a ${dataFim})<br>
      <strong>Gerado em:</strong> ${now}
    </div>
  </div>
  <table>
    <thead><tr>${headersHtml}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="rf">
    <span>Eclipse · Saúde da Carteira</span>
    <span>${now}</span>
  </div>
</div>
</body></html>`;
}

// ── Print Preview Modal ───────────────────────────────────────────────────────
function PrintPreview({ html, titulo, onClose }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        iframeRef.current?.contentWindow?.print();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className="prv-overlay">
      <div className="prv-bar">
        <div className="prv-bar-left">
          <button className="prv-btn-close" onClick={onClose}>
            <X size={14} /> Fechar
          </button>
          <div className="prv-bar-divider" />
          <div className="prv-bar-info">
            <span className="prv-bar-title">{titulo}</span>
          </div>
        </div>
        <button className="prv-btn-print" onClick={() => iframeRef.current?.contentWindow?.print()}>
          <Printer size={14} /> Imprimir
        </button>
      </div>
      <div className="prv-content">
        <iframe ref={iframeRef} className="prv-iframe" srcDoc={html} title={titulo} />
      </div>
    </div>,
    document.body
  );
}

// ── Formatadores ──────────────────────────────────────────────────────────────
const fmtCur  = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const fmtNum  = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const fmtPct  = v => `${fmtNum.format(Number(v) || 0)}%`;

function dateFromDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().split('T')[0];
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ── Hook: busca + executa slot ────────────────────────────────────────────────
function useSlotData(slot, empresa, params, active, onDataLoaded) {
  const [dados,   setDados]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState('');

  const paramsKey = JSON.stringify(params);

  const fetch = useCallback(() => {
    if (!slot || !empresa || !active) return;
    setLoading(true);
    setErro('');
    const qs = new URLSearchParams({ empresa, ...params }).toString();
    apiFetch(`/api/queries/execute/${slot.codigo}?${qs}`)
      .then(r => r.json())
      .then(d => {
        if (!d.ok) throw new Error(d.error || 'Erro ao carregar dados');
        const result = { rows: d.rows || [], columns: d.columns || [] };
        setDados(result);
        if (onDataLoaded) onDataLoaded(result);
      })
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, empresa, paramsKey, active]);

  useEffect(() => { if (active) fetch(); }, [fetch, active]);

  return { dados, loading, erro, refresh: fetch };
}

// ── Componentes compartilhados ────────────────────────────────────────────────
function SemConsulta({ slot }) {
  return (
    <div className="sc-sem-consulta">
      <Settings size={32} className="sc-sem-icon" />
      <p className="sc-sem-title">Slot não configurado</p>
      <p className="sc-sem-sub">
        Configure a consulta <strong>{slot}</strong> em{' '}
        <em>Parâmetros → Gerenciador de Consultas</em> para ativar este painel.
      </p>
    </div>
  );
}

function Loading({ text = 'Carregando…' }) {
  return (
    <div className="sc-loading">
      <RefreshCw size={18} className="pp-spin" />
      <span>{text}</span>
    </div>
  );
}

function KpiCard({ label, value, sub, accent, icon: Icon }) {
  return (
    <div className="sc-kpi" style={{ '--sc-accent': accent }}>
      {Icon && <div className="sc-kpi-icon"><Icon size={16} /></div>}
      <div className="sc-kpi-body">
        <span className="sc-kpi-label">{label}</span>
        <span className="sc-kpi-value">{value}</span>
        {sub && <span className="sc-kpi-sub">{sub}</span>}
      </div>
    </div>
  );
}

function RiskBadge({ nivel }) {
  const map = {
    alto:    { label: 'Alto',    cls: 'sc-risk--alto'    },
    medio:   { label: 'Médio',   cls: 'sc-risk--medio'   },
    baixo:   { label: 'Baixo',   cls: 'sc-risk--baixo'   },
    critico: { label: 'Crítico', cls: 'sc-risk--critico' },
  };
  const key  = (nivel || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const info = map[key] || { label: nivel || '—', cls: '' };
  return <span className={`sc-risk-badge ${info.cls}`}>{info.label}</span>;
}

function ScoreBadge({ score }) {
  const s = Number(score) || 0;
  const [cls, label] =
    s >= 76 ? ['sc-score--bom',     'Saudável'] :
    s >= 51 ? ['sc-score--medio',   'Médio']    :
    s >= 26 ? ['sc-score--atencao', 'Atenção']  :
              ['sc-score--baixo',   'Crítico'];
  return <span className={`sc-score-badge ${cls}`}>{s} — {label}</span>;
}

function ClassBadge({ value, color }) {
  return (
    <span className="sc-class-badge" style={{ '--badge-color': color || '#888' }}>
      {value}
    </span>
  );
}

function AgingBar({ bands }) {
  const total = bands.reduce((a, b) => a + (Number(b.valor) || 0), 0);
  if (!total) return null;
  return (
    <div className="sc-aging-bar">
      {bands.map(b => {
        const pct = (Number(b.valor) / total) * 100;
        return pct > 0 ? (
          <div
            key={b.label}
            className="sc-aging-seg"
            style={{ width: `${pct}%`, '--seg-color': b.color }}
            title={`${b.label}: ${fmtCur.format(b.valor)} (${fmtPct(pct)})`}
          />
        ) : null;
      })}
    </div>
  );
}

function ScoreDistChart({ dist, total }) {
  return (
    <div className="sc-score-dist">
      {dist.map(d => {
        const pct = total > 0 ? (d.count / total) * 100 : 0;
        return (
          <div key={d.label} className="sc-score-dist-item">
            <div className="sc-score-dist-label">{d.label}</div>
            <div className="sc-score-dist-bar-wrap">
              <div
                className="sc-score-dist-bar"
                style={{ width: `${pct}%`, background: d.color }}
              />
            </div>
            <div className="sc-score-dist-count">{d.count}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tabela genérica ──────────────────────────────────────────────────────────
function Tabela({ rows, cols, onRowClick, extraCols = [] }) {
  if (!rows.length) return null;
  const isRisk  = c => /risco|nivel|risk/.test(c.toLowerCase());
  const isScore = c => c.toLowerCase() === 'score';
  return (
    <div className="sc-table-wrap">
      <table className="sc-table">
        <thead>
          <tr>
            {cols.map(c => <th key={c}>{c}</th>)}
            {extraCols.map(c => <th key={c.key}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`sc-table-row ${onRowClick ? 'sc-table-row--click' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {cols.map(c => (
                <td key={c}>
                  {isRisk(c)  ? <RiskBadge  nivel={row[c]} />   :
                   isScore(c) ? <ScoreBadge score={row[c]} />   :
                   row[c] ?? '—'}
                </td>
              ))}
              {extraCols.map(c => <td key={c.key}>{c.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab: Visão Geral ──────────────────────────────────────────────────────────
function TabVisaoGeral({ slot, empresa, params, active, onDataLoaded }) {
  const { dados, loading, erro, refresh } = useSlotData(slot, empresa, params, active, onDataLoaded);

  if (!slot) return <SemConsulta slot="saude_visao_geral" />;
  if (loading && !dados) return <Loading />;

  const r = dados?.rows?.[0] || {};

  const ativos     = Number(r.clientes_ativos    || r.ativos           || 0);
  const inadimp    = Number(r.inadimplentes       || r.qtd_inadimp      || 0);
  const ausentes   = Number(r.ausentes            || r.qtd_ausentes     || 0);
  const novos      = Number(r.novos_clientes      || r.clientes_novos   || 0);
  const retornos   = Number(r.retornos            || r.clientes_retorno  || 0);
  const vlrInadimp = Number(r.valor_inadimplente  || r.total_inadimp    || 0);
  const ticket     = Number(r.ticket_medio        || r.ticket           || 0);
  const faturamento= Number(r.receita_periodo     || r.faturamento      || 0);
  const pctInadimp = ativos > 0 ? (inadimp  / ativos) * 100 : 0;
  const pctAusentes= ativos > 0 ? (ausentes / ativos) * 100 : 0;

  return (
    <div className="sc-tab-body">
      <div className="sc-section-header">
        <span className="sc-section-title">Visão Geral da Carteira</span>
        {erro && <span className="sc-erro-inline">{erro}</span>}
        <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={refresh} disabled={loading}>
          <RefreshCw size={11} className={loading ? 'pp-spin' : ''} />
        </button>
      </div>

      {dados && Object.keys(r).length > 0 ? (
        <div className="sc-kpi-grid">
          <KpiCard label="Clientes Ativos"      value={fmtNum.format(ativos)}         accent="#3b82f6" icon={Users}         />
          <KpiCard label="Inadimplentes"         value={fmtNum.format(inadimp)}        accent="#ef4444" icon={AlertTriangle}
            sub={`${fmtPct(pctInadimp)} da carteira`} />
          <KpiCard label="Clientes Ausentes"     value={fmtNum.format(ausentes)}       accent="#f59e0b" icon={Clock}
            sub={`${fmtPct(pctAusentes)} da carteira`} />
          <KpiCard label="Valor em Aberto"       value={fmtCur.format(vlrInadimp)}    accent="#dc2626" icon={TrendingDown}  />
          <KpiCard label="Ticket Médio"          value={fmtCur.format(ticket)}        accent="#8b5cf6" icon={Target}        />
          <KpiCard label="Faturamento Período"   value={fmtCur.format(faturamento)}   accent="#22c55e" icon={TrendingUp}    />
          {novos    > 0 && <KpiCard label="Novos Clientes" value={fmtNum.format(novos)}   accent="#06b6d4" icon={Users}      />}
          {retornos > 0 && <KpiCard label="Retornos"       value={fmtNum.format(retornos)} accent="#a78bfa" icon={Activity}  />}
        </div>
      ) : (
        !erro && !loading && <p className="sc-vazio">Nenhum dado encontrado para o período selecionado.</p>
      )}
    </div>
  );
}

// ── Tab: Inadimplência ────────────────────────────────────────────────────────
const AGING_BANDS_DEF = [
  { label: 'A vencer',   color: '#22c55e', campos: ['a_vencer',   'avencer',  'vencer']  },
  { label: '1-7 dias',   color: '#84cc16', campos: ['dias_1_7',   'd1_7',     'ate7']    },
  { label: '8-30 dias',  color: '#f59e0b', campos: ['dias_8_30',  'd8_30',    'ate30']   },
  { label: '31-60 dias', color: '#f97316', campos: ['dias_31_60', 'd31_60',   'ate60']   },
  { label: '61-90 dias', color: '#ef4444', campos: ['dias_61_90', 'd61_90',   'ate90']   },
  { label: '+90 dias',   color: '#7f1d1d', campos: ['mais_90',    'acima_90', 'acima90'] },
];

function TabInadimplencia({ slot, empresa, params, active, onClienteClick, onDataLoaded }) {
  const { dados, loading, erro, refresh } = useSlotData(slot, empresa, params, active, onDataLoaded);

  if (!slot) return <SemConsulta slot="saude_inadimplencia" />;
  if (loading && !dados) return <Loading />;

  const rows = dados?.rows || [];
  const cols = dados?.columns || [];

  // Tenta encontrar linha de totais
  const totals = rows.find(r =>
    (r.tipo || r.is_total || '').toString().toLowerCase().includes('total')
  );

  // Computa aging a partir das colunas disponíveis
  const bandsData = AGING_BANDS_DEF.map(b => {
    let valor = 0;
    const source = totals || {};
    if (totals) {
      for (const c of b.campos) {
        if (source[c] !== undefined) { valor = Number(source[c]) || 0; break; }
      }
    } else {
      for (const row of rows) {
        for (const c of b.campos) {
          if (row[c] !== undefined) { valor += Number(row[c]) || 0; break; }
        }
      }
    }
    return { ...b, valor };
  });

  const totalGeral = bandsData.reduce((a, b) => a + b.valor, 0);

  return (
    <div className="sc-tab-body">
      <div className="sc-section-header">
        <span className="sc-section-title">Análise de Inadimplência</span>
        {erro && <span className="sc-erro-inline">{erro}</span>}
        <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={refresh} disabled={loading}>
          <RefreshCw size={11} className={loading ? 'pp-spin' : ''} />
        </button>
      </div>

      {/* Aging visual */}
      {totalGeral > 0 && (
        <div className="sc-aging-wrap">
          <div className="sc-aging-title">
            Distribuição da Dívida — Total: <strong>{fmtCur.format(totalGeral)}</strong>
          </div>
          <AgingBar bands={bandsData} />
          <div className="sc-aging-legend">
            {bandsData.filter(b => b.valor > 0).map(b => (
              <div key={b.label} className="sc-aging-leg-item">
                <span className="sc-aging-leg-dot" style={{ background: b.color }} />
                <span className="sc-aging-leg-label">{b.label}</span>
                <span className="sc-aging-leg-val">{fmtCur.format(b.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rows.length > 0 ? (
        <Tabela rows={rows} cols={cols} onRowClick={onClienteClick} />
      ) : (
        !erro && !loading && <p className="sc-vazio">Nenhum cliente inadimplente no período.</p>
      )}
    </div>
  );
}

// ── Tab: Frequência de Compra ─────────────────────────────────────────────────
const FREQ_CLASSES = {
  frequente: { label: 'Frequente', color: '#22c55e' },
  atencao:   { label: 'Atenção',   color: '#f59e0b' },
  reducao:   { label: 'Redução',   color: '#f97316' },
  baixa:     { label: 'Baixa',     color: '#ef4444' },
};

function classifyFreq(row) {
  const dias = Number(row.dias_sem_compra || row.recencia        || 0);
  const qtd  = Number(row.qtd_compras    || row.frequencia      || 0);
  if (dias <= 30 && qtd >= 2) return 'frequente';
  if (dias <= 60 && qtd >= 1) return 'atencao';
  if (dias <= 90)             return 'reducao';
  return 'baixa';
}

function TabFrequencia({ slot, empresa, params, active, onClienteClick, onDataLoaded }) {
  const { dados, loading, erro, refresh } = useSlotData(slot, empresa, params, active, onDataLoaded);
  const [filtro, setFiltro] = useState('todos');

  if (!slot) return <SemConsulta slot="saude_frequencia" />;
  if (loading && !dados) return <Loading />;

  const rows = dados?.rows || [];
  const cols = dados?.columns || [];

  const classified = rows.map(r => ({
    ...r,
    _class: r.classificacao || r.classe || classifyFreq(r),
  }));

  const counts = { todos: classified.length };
  for (const r of classified) counts[r._class] = (counts[r._class] || 0) + 1;

  const filtered = filtro === 'todos' ? classified : classified.filter(r => r._class === filtro);

  return (
    <div className="sc-tab-body">
      <div className="sc-section-header">
        <span className="sc-section-title">Frequência de Compra</span>
        {erro && <span className="sc-erro-inline">{erro}</span>}
        <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={refresh} disabled={loading}>
          <RefreshCw size={11} className={loading ? 'pp-spin' : ''} />
        </button>
      </div>

      <div className="sc-filter-pills">
        <button
          className={`sc-pill ${filtro === 'todos' ? 'sc-pill--active' : ''}`}
          onClick={() => setFiltro('todos')}
        >
          Todos <span className="sc-pill-count">{counts.todos}</span>
        </button>
        {Object.entries(FREQ_CLASSES).map(([k, v]) => (
          <button
            key={k}
            className={`sc-pill ${filtro === k ? 'sc-pill--active' : ''}`}
            style={filtro === k ? { '--pill-accent': v.color } : {}}
            onClick={() => setFiltro(k)}
          >
            {v.label} <span className="sc-pill-count">{counts[k] || 0}</span>
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <Tabela
          rows={filtered}
          cols={cols}
          onRowClick={onClienteClick}
          extraCols={[{
            key: '_class',
            label: 'Classificação',
            render: row => (
              <ClassBadge
                value={FREQ_CLASSES[row._class]?.label || row._class}
                color={FREQ_CLASSES[row._class]?.color}
              />
            ),
          }]}
        />
      ) : (
        !erro && !loading && <p className="sc-vazio">Nenhum cliente encontrado.</p>
      )}
    </div>
  );
}

// ── Tab: Clientes Ausentes ─────────────────────────────────────────────────────
const AUSENTES_BANDAS = [
  { key: 'b0_15',  label: '0-15 dias',  color: '#f59e0b', range: [0,   15]       },
  { key: 'b16_30', label: '16-30 dias', color: '#f97316', range: [16,  30]       },
  { key: 'b31_60', label: '31-60 dias', color: '#ef4444', range: [31,  60]       },
  { key: 'b61_90', label: '61-90 dias', color: '#dc2626', range: [61,  90]       },
  { key: 'b90',    label: '+90 dias',   color: '#7f1d1d', range: [91,  Infinity] },
];

function getBandaKey(row) {
  const dias = Number(row.dias_sem_compra || row.dias_ausente || row.inatividade || 0);
  return AUSENTES_BANDAS.find(b => dias >= b.range[0] && dias <= b.range[1])?.key || 'b90';
}

function TabAusentes({ slot, empresa, params, active, onClienteClick, onDataLoaded }) {
  const { dados, loading, erro, refresh } = useSlotData(slot, empresa, params, active, onDataLoaded);
  const [bandaFiltro, setBandaFiltro] = useState('todos');

  if (!slot) return <SemConsulta slot="saude_ausentes" />;
  if (loading && !dados) return <Loading />;

  const rows = dados?.rows || [];
  const cols = dados?.columns || [];

  const withBanda = rows.map(r => ({ ...r, _banda: r.banda || getBandaKey(r) }));

  const counts = { todos: withBanda.length };
  for (const r of withBanda) counts[r._banda] = (counts[r._banda] || 0) + 1;

  const filtered = bandaFiltro === 'todos'
    ? withBanda
    : withBanda.filter(r => r._banda === bandaFiltro);

  const totalRisco = filtered.reduce(
    (a, r) => a + Number(r.receita_potencial || r.ticket_medio || 0), 0
  );

  return (
    <div className="sc-tab-body">
      <div className="sc-section-header">
        <span className="sc-section-title">Clientes Ausentes</span>
        {erro && <span className="sc-erro-inline">{erro}</span>}
        <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={refresh} disabled={loading}>
          <RefreshCw size={11} className={loading ? 'pp-spin' : ''} />
        </button>
      </div>

      {totalRisco > 0 && (
        <div className="sc-risco-alerta">
          <AlertCircle size={14} />
          Receita potencial em risco: <strong>{fmtCur.format(totalRisco)}</strong>
        </div>
      )}

      <div className="sc-filter-pills">
        <button
          className={`sc-pill ${bandaFiltro === 'todos' ? 'sc-pill--active' : ''}`}
          onClick={() => setBandaFiltro('todos')}
        >
          Todos <span className="sc-pill-count">{counts.todos}</span>
        </button>
        {AUSENTES_BANDAS.map(b => (
          <button
            key={b.key}
            className={`sc-pill ${bandaFiltro === b.key ? 'sc-pill--active' : ''}`}
            style={bandaFiltro === b.key ? { '--pill-accent': b.color } : {}}
            onClick={() => setBandaFiltro(b.key)}
          >
            {b.label} <span className="sc-pill-count">{counts[b.key] || 0}</span>
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <Tabela rows={filtered} cols={cols} onRowClick={onClienteClick} />
      ) : (
        !erro && !loading && <p className="sc-vazio">Nenhum cliente ausente no período.</p>
      )}
    </div>
  );
}

// ── Tab: Score de Clientes ─────────────────────────────────────────────────────
const SCORE_DIST_DEF = [
  { label: 'Crítico (0-25)',  range: [0,  25],  color: '#ef4444', count: 0 },
  { label: 'Atenção (26-50)', range: [26, 50],  color: '#f97316', count: 0 },
  { label: 'Médio (51-75)',   range: [51, 75],  color: '#f59e0b', count: 0 },
  { label: 'Saudável (76+)', range: [76, 100],  color: '#22c55e', count: 0 },
];

function computeScore(row, maxQtd) {
  const dias   = Number(row.dias_sem_compra || row.recencia           || 0);
  const qtd    = Number(row.qtd_compras     || row.frequencia         || 0);
  const inadimp= Number(row.valor_inadimplente || row.inadimplencia   || 0);
  const ticket = Number(row.ticket_medio    || row.ticket             || 1);
  const freqPts  = Math.round(30 * (maxQtd > 0 ? qtd / maxQtd : 0));
  const recPts   = Math.round(30 * Math.max(0, 1 - dias / 90));
  const inadPts  = Math.round(40 * Math.max(0, 1 - inadimp / Math.max(ticket, 1)));
  return Math.min(100, Math.max(0, freqPts + recPts + inadPts));
}

function TabScore({ slot, empresa, params, active, onClienteClick, onDataLoaded }) {
  const { dados, loading, erro, refresh } = useSlotData(slot, empresa, params, active, onDataLoaded);

  if (!slot) return <SemConsulta slot="saude_score" />;
  if (loading && !dados) return <Loading />;

  const rows = dados?.rows || [];
  const cols = dados?.columns || [];

  const maxQtd = Math.max(
    ...rows.map(r => Number(r.qtd_compras || r.frequencia || 0)), 1
  );

  const withScore = rows.map(r => ({
    ...r,
    score: r.score !== undefined ? r.score : computeScore(r, maxQtd),
  }));

  const dist = SCORE_DIST_DEF.map(d => ({ ...d, count: 0 }));
  for (const r of withScore) {
    const s = Number(r.score) || 0;
    const bucket = dist.find(d => s >= d.range[0] && s <= d.range[1]);
    if (bucket) bucket.count++;
  }

  const sorted = [...withScore].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));

  const hasScoreCol = cols.includes('score');

  return (
    <div className="sc-tab-body">
      <div className="sc-section-header">
        <span className="sc-section-title">Score de Clientes (0–100)</span>
        {erro && <span className="sc-erro-inline">{erro}</span>}
        <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={refresh} disabled={loading}>
          <RefreshCw size={11} className={loading ? 'pp-spin' : ''} />
        </button>
      </div>

      {sorted.length > 0 && (
        <ScoreDistChart dist={dist} total={sorted.length} />
      )}

      {sorted.length > 0 ? (
        <Tabela
          rows={sorted}
          cols={cols}
          onRowClick={onClienteClick}
          extraCols={hasScoreCol ? [] : [{
            key: 'score',
            label: 'Score',
            render: row => <ScoreBadge score={row.score} />,
          }]}
        />
      ) : (
        !erro && !loading && <p className="sc-vazio">Nenhum dado disponível.</p>
      )}
    </div>
  );
}

// ── Tab: Oportunidades ────────────────────────────────────────────────────────
const OPORT_CATS = [
  { key: 'devedores_comprando', label: 'Devedores Comprando',  Icon: AlertTriangle, color: '#ef4444', desc: 'Dívidas em aberto, mas continua comprando' },
  { key: 'reducao_drastica',    label: 'Redução Drástica',      Icon: TrendingDown,  color: '#f97316', desc: 'Volume de compras caiu significativamente'  },
  { key: 'importantes_sumidos', label: 'Importantes Sumidos',   Icon: Users,         color: '#f59e0b', desc: 'Alto valor, mas sem compras recentes'        },
  { key: 'prestes_inativar',    label: 'Prestes a Inativar',    Icon: Clock,         color: '#dc2626', desc: 'Próximo do limiar de inatividade'            },
  { key: 'crescimento',         label: 'Em Crescimento',        Icon: TrendingUp,    color: '#22c55e', desc: 'Tendência positiva de volume de compras'     },
];

function TabOportunidades({ slot, empresa, params, active, onClienteClick, onDataLoaded }) {
  const { dados, loading, erro, refresh } = useSlotData(slot, empresa, params, active, onDataLoaded);
  const [catFiltro, setCatFiltro] = useState('todos');

  if (!slot) return <SemConsulta slot="saude_oportunidades" />;
  if (loading && !dados) return <Loading />;

  const rows = dados?.rows || [];
  const cols = dados?.columns || [];

  const counts = { todos: rows.length };
  for (const r of rows) {
    const cat = r.categoria || r.tipo || r.alert_type || '';
    counts[cat] = (counts[cat] || 0) + 1;
  }

  const filtered = catFiltro === 'todos'
    ? rows
    : rows.filter(r => (r.categoria || r.tipo || r.alert_type || '') === catFiltro);

  return (
    <div className="sc-tab-body">
      <div className="sc-section-header">
        <span className="sc-section-title">Oportunidades e Alertas</span>
        {erro && <span className="sc-erro-inline">{erro}</span>}
        <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={refresh} disabled={loading}>
          <RefreshCw size={11} className={loading ? 'pp-spin' : ''} />
        </button>
      </div>

      {/* Cards de categoria */}
      <div className="sc-oport-cards">
        {OPORT_CATS.map(cat => {
          const n = counts[cat.key] || 0;
          const isActive = catFiltro === cat.key;
          return (
            <button
              key={cat.key}
              className={`sc-oport-card ${isActive ? 'sc-oport-card--active' : ''}`}
              style={{ '--oport-color': cat.color }}
              onClick={() => setCatFiltro(prev => prev === cat.key ? 'todos' : cat.key)}
            >
              <div className="sc-oport-icon"><cat.Icon size={15} /></div>
              <div className="sc-oport-body">
                <span className="sc-oport-label">{cat.label}</span>
                <span className="sc-oport-desc">{cat.desc}</span>
              </div>
              <span className="sc-oport-count">{n}</span>
            </button>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <Tabela rows={filtered} cols={cols} onRowClick={onClienteClick} />
      ) : (
        !erro && !loading && <p className="sc-vazio">Nenhum alerta encontrado para este filtro.</p>
      )}
    </div>
  );
}

// ── Modal de detalhe do cliente ───────────────────────────────────────────────
function ClienteModal({ cliente, onClose }) {
  if (!cliente) return null;
  const keys = Object.keys(cliente).filter(k => !k.startsWith('_'));
  const nome = cliente.nome || cliente.razao_social || cliente.cliente || 'Detalhe do Cliente';

  return (
    <div className="sc-modal-overlay" onClick={onClose}>
      <div className="sc-modal" onClick={e => e.stopPropagation()}>
        <div className="sc-modal-header">
          <div className="sc-modal-icon"><Users size={16} /></div>
          <span className="sc-modal-title">{nome}</span>
          <button className="sc-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="sc-modal-body">
          <div className="sc-modal-grid">
            {keys.map(k => (
              <div key={k} className="sc-modal-field">
                <span className="sc-modal-field-label">{k.replace(/_/g, ' ')}</span>
                <span className="sc-modal-field-value">{cliente[k] ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Componente raiz: SaudeCarteira ────────────────────────────────────────────
export default function SaudeCarteira({ empresas }) {
  const empresa = (empresas || [])[0] || '';

  const [activeTab,        setActiveTab]        = useState('visao_geral');
  const [dias,             setDias]             = useState(90);
  const [slots,            setSlots]            = useState(null); // null = loading
  const [selectedCliente,  setSelectedCliente]  = useState(null);
  const [printHtml,        setPrintHtml]        = useState(null);

  // Guarda os dados da aba ativa para impressão
  const tabDataRef = useRef({ rows: [], columns: [] });

  // Callback repassado à aba ativa para capturar dados ao carregar
  // Deve ficar antes de qualquer early return (regra de hooks)
  const handleDataLoaded = useCallback(result => {
    tabDataRef.current = result;
  }, []);

  const dataFim    = todayStr();
  const dataInicio = dateFromDias(dias);
  const params     = { data_inicio: dataInicio, data_final: dataFim, dias };

  // Carrega todos os slots de uma vez
  useEffect(() => {
    const fetchSlot = nome =>
      apiFetch(`/api/queries?ativa=true&slot=${nome}`)
        .then(r => r.json())
        .then(d => Array.isArray(d) && d.length ? d[0] : null)
        .catch(() => null);

    Promise.all(TABS.map(t => fetchSlot(t.slot))).then(results => {
      const map = {};
      TABS.forEach((t, i) => { map[t.key] = results[i]; });
      setSlots(map);
    });
  }, [empresa]);

  if (!slots) {
    return (
      <div className="sc-wrap">
        <Loading text="Carregando módulo Saúde da Carteira…" />
      </div>
    );
  }

  const activeTabLabel = TABS.find(t => t.key === activeTab)?.label || '';
  const periodoLabel   = DIAS_OPTIONS.find(o => o.value === dias)?.label || `${dias} dias`;

  const tabProps = key => ({
    slot:           slots[key],
    empresa,
    params,
    active:         activeTab === key,
    onClienteClick: setSelectedCliente,
    onDataLoaded:   activeTab === key ? handleDataLoaded : undefined,
  });

  const handlePrint = () => {
    const { rows, columns } = tabDataRef.current;
    if (!rows.length) return;
    const html = gerarHtmlSaude({ tabLabel: activeTabLabel, rows, columns, periodoLabel, dataInicio, dataFim, empresa });
    setPrintHtml({ html, titulo: `Saúde da Carteira — ${activeTabLabel}` });
  };

  return (
    <div className="sc-wrap">

      {/* Cabeçalho */}
      <div className="sc-header">
        <div className="sc-header-title">
          <Heart size={17} />
          <h2>Saúde da Carteira</h2>
        </div>
        <div className="sc-header-actions">
          <button
            className="pp-btn-ghost pp-btn-ghost--sm"
            onClick={handlePrint}
            title="Visualizar prévia e imprimir aba atual"
          >
            <Printer size={13} /> Imprimir
          </button>
          <div className="sc-period-wrap">
            <Calendar size={13} />
            <select
              className="sc-period-select"
              value={dias}
              onChange={e => setDias(Number(e.target.value))}
            >
              {DIAS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="sc-period-arrow" />
          </div>
        </div>
      </div>

      {/* Barra de abas */}
      <div className="sc-tabs-bar">
        {TABS.map(t => {
          const conf = slots[t.key] !== null;
          return (
            <button
              key={t.key}
              className={`sc-tab-btn ${activeTab === t.key ? 'sc-tab-btn--active' : ''} ${!conf ? 'sc-tab-btn--unconf' : ''}`}
              onClick={() => { setActiveTab(t.key); tabDataRef.current = { rows: [], columns: [] }; }}
              title={!conf ? 'Configure o slot no Gerenciador de Consultas' : t.label}
            >
              <t.Icon size={13} />
              <span>{t.label}</span>
              {!conf && <span className="sc-tab-dot" />}
            </button>
          );
        })}
      </div>

      {/* Conteúdo da aba ativa */}
      <div className="sc-content">
        {activeTab === 'visao_geral'   && <TabVisaoGeral    {...tabProps('visao_geral')}   />}
        {activeTab === 'inadimplencia' && <TabInadimplencia {...tabProps('inadimplencia')} />}
        {activeTab === 'frequencia'    && <TabFrequencia    {...tabProps('frequencia')}    />}
        {activeTab === 'ausentes'      && <TabAusentes      {...tabProps('ausentes')}      />}
        {activeTab === 'score'         && <TabScore         {...tabProps('score')}         />}
        {activeTab === 'oportunidades' && <TabOportunidades  {...tabProps('oportunidades')} />}
      </div>

      {/* Modal de detalhe do cliente */}
      {selectedCliente && (
        <ClienteModal
          cliente={selectedCliente}
          onClose={() => setSelectedCliente(null)}
        />
      )}

      {/* Preview de impressão */}
      {printHtml && (
        <PrintPreview
          html={printHtml.html}
          titulo={printHtml.titulo}
          onClose={() => setPrintHtml(null)}
        />
      )}
    </div>
  );
}
