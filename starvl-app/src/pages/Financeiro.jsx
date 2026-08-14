/**
 * Financeiro.jsx — v2
 * Layout por abas, KPIs visuais com barra de progresso,
 * gráficos de barras (Recharts) e formatação automática de valores.
 *
 * Slots (Gerenciador de Consultas):
 *   financeiro_resumo          → 1 linha: receita/faturamento, custo/recebido, lucro, margem, ticket_medio, transacoes
 *   financeiro_vendas          → linhas: data, vendas, clientes, total
 *   financeiro_custos          → linhas: cliente_codigo*, cliente, titulos, total_aberto, a_vencer, em_atraso, maior_atraso
 *                                 (* cliente_codigo é obrigatório para habilitar o drill-down; oculto na tabela)
 *   financeiro_custos_detalhe  → parâmetros: empresa, cliente_codigo
 *                                 linhas: vencimento, valor, em_atraso, a_vencer, dias_atraso (+ colunas extras à escolha)
 *   financeiro_fluxo           → linhas: data, recebimentos, total_recebido
 */
import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Landmark, RefreshCw, TrendingUp, TrendingDown,
  DollarSign, BarChart3, ArrowUpRight,
  CalendarDays, ChevronDown, Settings, Wallet, Activity, X,
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle,
  LineChart, Building2, ArrowLeftRight,
  BellRing, ChevronRight, ChevronLeft,
  AlertTriangle, AlertCircle, Info,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, LabelList,
} from 'recharts';
import { apiFetch } from '../api';

// ── Módulos do Hub Financeiro ───────────────────────────────────────────────────
const FIN_MODULES = [
  {
    key:   'visao_geral',
    label: 'Visão Geral',
    desc:  'Dashboard executivo com os principais indicadores financeiros',
    Icon:  LayoutDashboard,
    color: '#3b82f6',
  },
  {
    key:   'receber',
    label: 'Contas a Receber',
    desc:  'Análise dos valores que a empresa tem a receber',
    Icon:  ArrowDownCircle,
    color: '#22c55e',
  },
  {
    key:   'pagar',
    label: 'Contas a Pagar',
    desc:  'Controle e análise das obrigações financeiras',
    Icon:  ArrowUpCircle,
    color: '#ef4444',
  },
  {
    key:   'fluxo',
    label: 'Fluxo de Caixa',
    desc:  'Acompanhamento de entradas, saídas e saldo financeiro',
    Icon:  LineChart,
    color: '#22c55e',
  },
  {
    key:   'bancos',
    label: 'Bancos e Caixa',
    desc:  'Visão consolidada da posição financeira por conta',
    Icon:  Building2,
    color: '#8b5cf6',
  },
  {
    key:   'receitas',
    label: 'Receitas e Despesas',
    desc:  'Análise detalhada das entradas e saídas da empresa',
    Icon:  ArrowLeftRight,
    color: '#f97316',
  },
  {
    key:   'resultado',
    label: 'Resultado e Rentabilidade',
    desc:  'Análise do desempenho, margens e rentabilidade',
    Icon:  TrendingUp,
    color: '#f59e0b',
  },
  {
    key:   'alertas',
    label: 'Alertas Financeiros',
    desc:  'Central de alertas e situações que precisam de atenção',
    Icon:  BellRing,
    color: '#ef4444',
  },
];

// ── Abas ───────────────────────────────────────────────────────────────────────
// ── Formatadores ───────────────────────────────────────────────────────────────
const fmtCur = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const fmtPct = v => `${fmtNum.format(Number(v) || 0)}%`;
const fmtDate = str => {
  if (!str) return '—';
  // substring(0,10) garante que funciona tanto com "YYYY-MM-DD" quanto com "YYYY-MM-DDTHH:mm:ss.sssZ"
  const s = String(str).substring(0, 10);
  const parts = s.split('-');
  if (parts.length !== 3) return str;
  return `${parts[2]}/${parts[1]}`; // DD/MM
};

// Detectores de tipo por nome de coluna
const isDateCol     = c => /^data$/i.test(c);
const isDaysCol     = c => /maior_atraso/i.test(c);
const isPctCol      = c => /^margem$|pct|percent/i.test(c);
const isCurrencyCol = c => /total|valor|aberto|a_vencer|em_atraso|receita|custo|recebido|faturamento|lucro|ticket/i.test(c);

function fmtCell(col, val) {
  if (val == null || val === '') return '—';
  if (isDateCol(col))     return fmtDate(String(val));
  if (isDaysCol(col))     return Number(val) > 0 ? `${val} dias` : '—';
  if (isPctCol(col))      return fmtPct(val);
  if (isCurrencyCol(col)) return fmtCur.format(Number(val) || 0);
  const n = Number(val);
  if (!isNaN(n) && String(val).trim() !== '') return fmtNum.format(n);
  return val;
}

function cellStyle(col, val) {
  const n = Number(val);
  if (col === 'em_atraso'    && n > 0)  return { color: '#dc2626', fontWeight: 700 };
  if (col === 'a_vencer'     && n > 0)  return { color: '#16a34a', fontWeight: 600 };
  if (col === 'maior_atraso' && n > 30) return { color: '#dc2626' };
  if (col === 'maior_atraso' && n > 0)  return { color: '#f97316' };
  return {};
}

// ── Componentes auxiliares ─────────────────────────────────────────────────────

function SemConsulta({ slot }) {
  return (
    <div className="fin-sem-consulta">
      <Settings size={28} className="fin-sem-icon" />
      <p className="fin-sem-title">Slot não configurado</p>
      <p className="fin-sem-sub">
        Configure a consulta <strong>{slot}</strong> em{' '}
        <em>Parâmetros → Gerenciador de Consultas</em> para ativar este painel.
      </p>
    </div>
  );
}

function FinLoading() {
  return (
    <div className="fin-loading fin2-loading-tab">
      <RefreshCw size={18} className="pp-spin" />
      <span>Carregando…</span>
    </div>
  );
}

function PeriodPicker({ period, onChange }) {
  const now = new Date();
  const options = [];
  for (let i = 0; i < 12; i++) {
    const d  = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    options.push({ value: `${yr}-${mo}`, label: `${mo}/${yr}` });
  }
  return (
    <div className="fin-period-wrap">
      <CalendarDays size={13} />
      <select className="fin-period-select" value={period} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} className="fin-period-arrow" />
    </div>
  );
}

// KPI card com barra de progresso colorida
function KpiCard({ icon: Icon, label, value, sub, accent, progress }) {
  return (
    <div className="fin2-kpi" style={{ '--fin-accent': accent }}>
      <div className="fin2-kpi-top">
        <div className="fin2-kpi-icon"><Icon size={15} /></div>
        <span className="fin2-kpi-label">{label}</span>
      </div>
      <div className="fin2-kpi-value">{value}</div>
      {sub && <div className="fin2-kpi-sub">{sub}</div>}
      {progress !== undefined && (
        <div className="fin2-kpi-bar-track">
          <div className="fin2-kpi-bar-fill"
            style={{ width: `${Math.min(100, Math.max(0, progress || 0))}%` }} />
        </div>
      )}
    </div>
  );
}

// Tooltip customizado para gráficos
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="fin2-tooltip">
      <div className="fin2-tooltip-label">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="fin2-tooltip-row">
          <span className="fin2-tooltip-key">{p.name}</span>
          <span className="fin2-tooltip-val">
            {isCurrencyCol(p.name)
              ? fmtCur.format(p.value)
              : fmtNum.format(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Linha de rodapé com totais
function TfootTotals({ cols, rows }) {
  return (
    <tfoot>
      <tr className="fin2-tfoot-row">
        {cols.map((c, i) => {
          let content = '';
          if (i === 0) {
            content = 'Total';
          } else if (isCurrencyCol(c)) {
            content = fmtCur.format(rows.reduce((s, r) => s + (parseFloat(r[c]) || 0), 0));
          } else if (!isDateCol(c) && !isDaysCol(c)) {
            const sum = rows.reduce((s, r) => s + (parseFloat(r[c]) || 0), 0);
            if (!isNaN(sum)) content = fmtNum.format(sum);
          }
          return (
            <td key={c} className={isCurrencyCol(c) ? 'fin2-td-num' : ''}>{content}</td>
          );
        })}
      </tr>
    </tfoot>
  );
}

// ── Hook unificado de dados ────────────────────────────────────────────────────
function useFinData(slot, empresa, period) {
  const [dados,   setDados]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState('');

  const [y, m] = period.split('-');
  const inicio = `${y}-${m}-01`;
  const fimDay = new Date(parseInt(y), parseInt(m), 0).getDate();
  const fim    = `${y}-${m}-${String(fimDay).padStart(2,'0')}`;

  const fetch = useCallback(() => {
    if (!slot || !empresa) return;
    setLoading(true);
    setErro('');
    apiFetch(`/api/queries/execute/${slot.codigo}?empresa=${empresa}&data_inicio=${inicio}&data_final=${fim}&periodo=${m}${y}`)
      .then(r => r.json())
      .then(d => {
        if (!d.ok) throw new Error(d.error || 'Erro ao carregar dados');
        setDados({ rows: d.rows || [], columns: d.columns || [] });
      })
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot?.codigo, empresa, inicio, fim, m, y]);

  useEffect(() => { fetch(); }, [fetch]);

  return { dados, loading, erro, refresh: fetch };
}

// Hook para detalhe de um cliente específico (sem filtro de período)
function useFinDetalhe(slot, empresa, clienteCodigo) {
  const [dados,   setDados]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState('');

  const fetch = useCallback(() => {
    if (!slot || !empresa || !clienteCodigo) return;
    setLoading(true);
    setErro('');
    apiFetch(`/api/queries/execute/${slot.codigo}?empresa=${empresa}&cliente_codigo=${encodeURIComponent(clienteCodigo)}`)
      .then(r => r.json())
      .then(d => {
        if (!d.ok) throw new Error(d.error || 'Erro ao carregar detalhe');
        setDados({ rows: d.rows || [], columns: d.columns || [] });
      })
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  }, [slot?.codigo, empresa, clienteCodigo]);

  useEffect(() => { fetch(); }, [fetch]);
  return { dados, loading, erro, refresh: fetch };
}

// ── Painel Resumo ──────────────────────────────────────────────────────────────
function PainelResumo({ slot, empresa, period }) {
  const { dados, loading, erro, refresh } = useFinData(slot, empresa, period);

  if (!slot) return <SemConsulta slot="financeiro_resumo" />;
  if (loading && !dados) return <FinLoading />;

  const r = dados?.rows?.[0] || {};
  const receita    = parseFloat(r.receita    || r.faturamento   || 0);
  const custo      = parseFloat(r.custo      || r.recebido      || 0);
  const lucro      = receita - custo;
  const margem     = parseFloat(r.margem     || (receita > 0 ? ((receita - custo) / receita) * 100 : 0));
  const ticket     = parseFloat(r.ticket     || r.ticket_medio  || 0);
  const transacoes = parseFloat(r.transacoes || r.qtd_vendas    || 0);

  const pctRecebido = receita > 0 ? (custo   / receita) * 100 : 0;
  const pctPendente = receita > 0 ? (Math.abs(lucro) / receita) * 100 : 0;

  const temDados = Object.keys(r).length > 0;

  return (
    <div className="fin2-tab-body">
      <div className="fin2-section-header">
        <BarChart3 size={14} /> Resumo do Período
        {erro && <span className="fin-erro-inline">{erro}</span>}
        <div className="fin2-section-actions">
          <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={refresh} disabled={loading}>
            <RefreshCw size={11} className={loading ? 'pp-spin' : ''} />
          </button>
        </div>
      </div>

      {temDados ? (
        <div className="fin2-kpi-grid">
          <KpiCard
            icon={DollarSign}   label="Faturamento"
            value={fmtCur.format(receita)}
            accent="#3b82f6"    progress={100}
          />
          <KpiCard
            icon={ArrowUpRight} label="Recebido"
            value={fmtCur.format(custo)}
            sub={`${fmtPct(pctRecebido)} do faturado`}
            accent="#22c55e"    progress={pctRecebido}
          />
          <KpiCard
            icon={TrendingDown} label="Pendente"
            value={fmtCur.format(Math.abs(lucro))}
            sub={`${fmtPct(pctPendente)} em aberto`}
            accent={lucro > 0 ? '#f97316' : '#22c55e'}
            progress={pctPendente}
          />
          <KpiCard
            icon={BarChart3}    label="Margem Receb."
            value={fmtPct(margem)}
            accent="#8b5cf6"
          />
          {ticket     > 0 && (
            <KpiCard icon={DollarSign} label="Ticket Médio"  value={fmtCur.format(ticket)}    accent="#06b6d4" />
          )}
          {transacoes > 0 && (
            <KpiCard icon={Activity}   label="Transações"    value={fmtNum.format(transacoes)} accent="#84cc16" />
          )}
        </div>
      ) : (
        !erro && !loading && <p className="fin-vazio">Nenhum dado encontrado para o período.</p>
      )}
    </div>
  );
}

// ── Painel Vendas ──────────────────────────────────────────────────────────────
function PainelVendas({ slot, empresa, period }) {
  const { dados, loading, erro, refresh } = useFinData(slot, empresa, period);

  if (!slot) return <SemConsulta slot="financeiro_vendas" />;
  if (loading && !dados) return <FinLoading />;

  const rows = dados?.rows || [];
  const cols = dados?.columns || [];
  const total = rows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);

  const chartData = rows.map(r => ({
    data:   fmtDate(r.data),
    Total:  parseFloat(r.total)  || 0,
    Vendas: parseInt(r.vendas)   || 0,
  }));

  return (
    <div className="fin2-tab-body">
      <div className="fin2-section-header">
        <TrendingUp size={14} /> Vendas por Dia
        {erro && <span className="fin-erro-inline">{erro}</span>}
        <div className="fin2-section-actions">
          {total > 0 && <span className="fin2-section-total">{fmtCur.format(total)}</span>}
          <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={refresh} disabled={loading}>
            <RefreshCw size={11} className={loading ? 'pp-spin' : ''} />
          </button>
        </div>
      </div>

      {rows.length > 0 ? (
        <>
          <div className="fin2-chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}
                margin={{ top: 24, right: 8, left: 0, bottom: 4 }}
                barSize={Math.max(6, Math.min(28, Math.floor(560 / (chartData.length || 1))))}>
                <defs>
                  <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#f97316" stopOpacity={1} />
                    <stop offset="100%" stopColor="#fb923c" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="data"
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  axisLine={false} tickLine={false}
                  interval={chartData.length > 20 ? Math.ceil(chartData.length / 10) - 1 : 0} />
                <YAxis
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  axisLine={false} tickLine={false} width={46} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(249,115,22,0.08)' }} />
                <Bar dataKey="Total" name="Total" fill="url(#gradVendas)" radius={[5,5,0,0]}>
                  <LabelList dataKey="Total" position="top"
                    formatter={v => chartData.length <= 20
                      ? (v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v))
                      : ''}
                    style={{ fontSize: chartData.length <= 20 ? 9 : 0, fill: 'var(--color-text-muted)', fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="fin-table-wrap">
            <table className="fin-table fin2-table">
              <thead>
                <tr>{cols.map(c => <th key={c} className={isCurrencyCol(c)||isDateCol(c)?'':''}>{c.replace(/_/g,' ')}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {cols.map(c => (
                      <td key={c} style={cellStyle(c, row[c])}
                        className={isCurrencyCol(c) ? 'fin2-td-num' : ''}>
                        {fmtCell(c, row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <TfootTotals cols={cols} rows={rows} />
            </table>
          </div>
        </>
      ) : (
        !erro && !loading && <p className="fin-vazio">Nenhuma venda encontrada para o período.</p>
      )}
    </div>
  );
}

// Colunas internas que não devem aparecer na tabela mas alimentam o drill-down
const HIDDEN_COLS = new Set(['cliente_codigo', 'codcliente', 'codigo_cliente', 'partcodigo']);

// ── Modal de Detalhe do Cliente ────────────────────────────────────────────────
function DetalheClienteModal({ cliente, slotDetalhe, empresa, onClose }) {
  const { dados, loading, erro, refresh } = useFinDetalhe(slotDetalhe, empresa, cliente.codigo);
  const rows = dados?.rows  || [];
  const cols = dados?.columns || [];
  const visCols = cols.filter(c => !HIDDEN_COLS.has(c));

  const totalAberto = rows.reduce((s, r) => s + (parseFloat(r.total_aberto ?? r.valor) || 0), 0);
  const totalAtraso = rows.reduce((s, r) => s + (parseFloat(r.em_atraso) || 0), 0);
  const totalVencer = rows.reduce((s, r) => s + (parseFloat(r.a_vencer)  || 0), 0);

  // Fecha ao pressionar Esc
  useEffect(() => {
    const handleKey = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className="fin2-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fin2-modal" role="dialog" aria-modal="true">

        {/* Cabeçalho */}
        <div className="fin2-modal-header">
          <div className="fin2-modal-title">
            <Wallet size={15} />
            <span>{cliente.nome}</span>
            {rows.length > 0 && (
              <span className="fin2-modal-badge">{rows.length} título{rows.length > 1 ? 's' : ''}</span>
            )}
          </div>
          <button className="fin2-modal-close" onClick={onClose} title="Fechar (Esc)">
            <X size={15} />
          </button>
        </div>

        {/* Conteúdo */}
        {!slotDetalhe ? (
          <div className="fin-sem-consulta fin2-modal-body">
            <Settings size={22} className="fin-sem-icon" />
            <p className="fin-sem-title">Slot não configurado</p>
            <p className="fin-sem-sub">Configure <strong>financeiro_custos_detalhe</strong> em Parâmetros → Gerenciador de Consultas.</p>
          </div>
        ) : loading && !dados ? (
          <div className="fin-loading fin2-modal-body">
            <RefreshCw size={15} className="pp-spin" />
            <span>Carregando títulos…</span>
          </div>
        ) : (
          <>
            {/* Mini KPIs */}
            {rows.length > 0 && (
              <div className="fin2-mini-kpi-row fin2-modal-kpis">
                <div className="fin2-mini-kpi">
                  <span className="fin2-mini-kpi-label">Total em Aberto</span>
                  <span className="fin2-mini-kpi-value" style={{ color: '#3b82f6' }}>
                    {fmtCur.format(totalAberto)}
                  </span>
                </div>
                {totalAtraso > 0 && (
                  <div className="fin2-mini-kpi fin2-mini-kpi--danger">
                    <span className="fin2-mini-kpi-label">Em Atraso</span>
                    <span className="fin2-mini-kpi-value" style={{ color: '#dc2626' }}>
                      {fmtCur.format(totalAtraso)}
                    </span>
                  </div>
                )}
                {totalVencer > 0 && (
                  <div className="fin2-mini-kpi fin2-mini-kpi--ok">
                    <span className="fin2-mini-kpi-label">A Vencer</span>
                    <span className="fin2-mini-kpi-value" style={{ color: '#16a34a' }}>
                      {fmtCur.format(totalVencer)}
                    </span>
                  </div>
                )}
                <button className="pp-btn-ghost pp-btn-ghost--sm fin2-modal-refresh"
                  onClick={refresh} disabled={loading} title="Atualizar">
                  <RefreshCw size={11} className={loading ? 'pp-spin' : ''} />
                </button>
              </div>
            )}

            {/* Tabela de títulos */}
            <div className="fin-table-wrap fin2-modal-table-wrap">
              {rows.length === 0 ? (
                <p className="fin-vazio">{erro || 'Nenhum título em aberto para este cliente.'}</p>
              ) : (
                <table className="fin-table fin2-table fin2-modal-table">
                  <thead>
                    <tr>
                      {visCols.map(c => <th key={c}>{c.replace(/_/g, ' ')}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>
                        {visCols.map(c => (
                          <td key={c} style={cellStyle(c, row[c])}
                            className={isCurrencyCol(c) ? 'fin2-td-num' : ''}>
                            {fmtCell(c, row[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {erro && <p className="fin-erro-inline" style={{ margin: '8px 16px' }}>{erro}</p>}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Painel Custos / Contas a Receber ──────────────────────────────────────────
function PainelCustos({ slot, slotDetalhe, empresa, period }) {
  const { dados, loading, erro, refresh } = useFinData(slot, empresa, period);
  const [clienteSel, setClienteSel] = useState(null);

  const handleRowClick = useCallback((row) => {
    const codigo = row.cliente_codigo ?? row.codcliente ?? row.codigo_cliente ?? row.partcodigo;
    if (codigo == null) return; // sem código → não abre modal
    const nome = row.cliente || row.partrazao || row.nome || `Cliente ${codigo}`;
    setClienteSel({ codigo: String(codigo), nome });
  }, []);

  if (!slot) return <SemConsulta slot="financeiro_custos" />;
  if (loading && !dados) return <FinLoading />;

  const rows    = dados?.rows    || [];
  const cols    = dados?.columns || [];
  const visCols = cols.filter(c => !HIDDEN_COLS.has(c));

  // Detecta se o drill-down está disponível (query tem cliente_codigo)
  const temDrillDown = rows.length > 0 &&
    HIDDEN_COLS.has(cols.find(c => HIDDEN_COLS.has(c)) ?? '');

  const totalAberto = rows.reduce((s,r) => s + (parseFloat(r.total_aberto) || 0), 0);
  const totalAtraso = rows.reduce((s,r) => s + (parseFloat(r.em_atraso)   || 0), 0);
  const totalVencer = rows.reduce((s,r) => s + (parseFloat(r.a_vencer)    || 0), 0);

  return (
    <div className="fin2-tab-body">
      <div className="fin2-section-header">
        <Wallet size={14} /> Contas a Receber
        {temDrillDown && (
          <span className="fin2-section-hint">clique em um cliente para ver os títulos</span>
        )}
        {erro && <span className="fin-erro-inline">{erro}</span>}
        <div className="fin2-section-actions">
          <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={refresh} disabled={loading}>
            <RefreshCw size={11} className={loading ? 'pp-spin' : ''} />
          </button>
        </div>
      </div>

      {rows.length > 0 ? (
        <>
          {/* Mini KPIs de resumo */}
          <div className="fin2-mini-kpi-row">
            <div className="fin2-mini-kpi">
              <span className="fin2-mini-kpi-label">Total em Aberto</span>
              <span className="fin2-mini-kpi-value" style={{ color: '#3b82f6' }}>
                {fmtCur.format(totalAberto)}
              </span>
            </div>
            <div className="fin2-mini-kpi fin2-mini-kpi--danger">
              <span className="fin2-mini-kpi-label">Em Atraso</span>
              <span className="fin2-mini-kpi-value" style={{ color: '#dc2626' }}>
                {fmtCur.format(totalAtraso)}
              </span>
            </div>
            <div className="fin2-mini-kpi fin2-mini-kpi--ok">
              <span className="fin2-mini-kpi-label">A Vencer</span>
              <span className="fin2-mini-kpi-value" style={{ color: '#16a34a' }}>
                {fmtCur.format(totalVencer)}
              </span>
            </div>
          </div>

          <div className="fin-table-wrap">
            <table className="fin-table fin2-table">
              <thead>
                <tr>
                  {visCols.map(c => <th key={c}>{c.replace(/_/g,' ')}</th>)}
                  {temDrillDown && <th className="fin2-th-action" />}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const codRow = row.cliente_codigo ?? row.codcliente ?? row.codigo_cliente ?? row.partcodigo;
                  const clicavel = codRow != null;
                  return (
                    <tr key={i}
                      className={clicavel ? 'fin2-row-clickable' : ''}
                      onClick={clicavel ? () => handleRowClick(row) : undefined}>
                      {visCols.map(c => (
                        <td key={c} style={cellStyle(c, row[c])}
                          className={isCurrencyCol(c) ? 'fin2-td-num' : ''}>
                          {fmtCell(c, row[c])}
                        </td>
                      ))}
                      {temDrillDown && (
                        <td className="fin2-td-action">
                          {clicavel && <span className="fin2-row-chevron">›</span>}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        !erro && !loading && <p className="fin-vazio">Nenhum título em aberto no período.</p>
      )}

      {/* Modal de detalhe */}
      {clienteSel && (
        <DetalheClienteModal
          cliente={clienteSel}
          slotDetalhe={slotDetalhe}
          empresa={empresa}
          onClose={() => setClienteSel(null)}
        />
      )}
    </div>
  );
}

// ── Painel Fluxo de Caixa ─────────────────────────────────────────────────────
function PainelFluxo({ slot, empresa, period }) {
  const { dados, loading, erro, refresh } = useFinData(slot, empresa, period);

  if (!slot) return <SemConsulta slot="financeiro_fluxo" />;
  if (loading && !dados) return <FinLoading />;

  const rows  = dados?.rows || [];
  const cols  = dados?.columns || [];
  const total = rows.reduce((s, r) => s + (parseFloat(r.total_recebido) || 0), 0);

  const chartData = rows.map(r => ({
    data:      fmtDate(r.data),
    Recebido:  parseFloat(r.total_recebido) || 0,
  }));

  return (
    <div className="fin2-tab-body">
      <div className="fin2-section-header">
        <Activity size={14} /> Recebimentos por Dia
        {erro && <span className="fin-erro-inline">{erro}</span>}
        <div className="fin2-section-actions">
          {total > 0 && <span className="fin2-section-total">{fmtCur.format(total)}</span>}
          <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={refresh} disabled={loading}>
            <RefreshCw size={11} className={loading ? 'pp-spin' : ''} />
          </button>
        </div>
      </div>

      {rows.length > 0 ? (
        <>
          <div className="fin2-chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}
                margin={{ top: 24, right: 8, left: 0, bottom: 4 }}
                barSize={Math.max(6, Math.min(28, Math.floor(560 / (chartData.length || 1))))}>
                <defs>
                  <linearGradient id="gradFluxo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#22c55e" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4ade80" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="data"
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  axisLine={false} tickLine={false}
                  interval={chartData.length > 20 ? Math.ceil(chartData.length / 10) - 1 : 0} />
                <YAxis
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  axisLine={false} tickLine={false} width={46} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(34,197,94,0.08)' }} />
                <Bar dataKey="Recebido" name="Recebido" fill="url(#gradFluxo)" radius={[5,5,0,0]}>
                  <LabelList dataKey="Recebido" position="top"
                    formatter={v => chartData.length <= 20
                      ? (v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v))
                      : ''}
                    style={{ fontSize: chartData.length <= 20 ? 9 : 0, fill: 'var(--color-text-muted)', fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="fin-table-wrap">
            <table className="fin-table fin2-table">
              <thead>
                <tr>{cols.map(c => <th key={c}>{c.replace(/_/g,' ')}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {cols.map(c => (
                      <td key={c} style={cellStyle(c, row[c])}
                        className={isCurrencyCol(c) ? 'fin2-td-num' : ''}>
                        {fmtCell(c, row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <TfootTotals cols={cols} rows={rows} />
            </table>
          </div>
        </>
      ) : (
        !erro && !loading && <p className="fin-vazio">Nenhum recebimento encontrado no período.</p>
      )}
    </div>
  );
}

// ── Hub: menu de atalhos do Financeiro ────────────────────────────────────────
function FinHub({ onSelect }) {
  return (
    <div className="fhub-wrap">
      <div className="fhub-header">
        <div className="fhub-header-eyebrow">Gestão Financeira</div>
        <h1 className="fhub-header-title">
          <Landmark size={18} className="fhub-header-icon" />
          Financeiro
        </h1>
        <p className="fhub-header-sub">Selecione um módulo para acessar os dados</p>
      </div>
      <div className="fhub-grid">
        {FIN_MODULES.map(m => (
          <button
            key={m.key}
            className="fhub-card"
            style={{ '--fhub-accent': m.color }}
            onClick={() => onSelect(m.key)}
          >
            <div className="fhub-card-icon">
              <m.Icon size={22} />
            </div>
            <div className="fhub-card-title">{m.label}</div>
            <div className="fhub-card-desc">{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Breadcrumb / cabeçalho de módulo ──────────────────────────────────────────
function ModuleHeader({ modKey, onBack, period, setPeriod, loading }) {
  const mod = FIN_MODULES.find(m => m.key === modKey) || {};
  return (
    <div className="fhub-mod-header">
      <button className="fhub-back-btn" onClick={onBack} title="Voltar ao menu">
        <ChevronLeft size={14} /> Menu
      </button>
      <div className="fhub-mod-breadcrumb">
        <span className="fhub-mod-breadcrumb-sep">/</span>
        {mod.Icon && <mod.Icon size={14} style={{ color: mod.color }} />}
        <span className="fhub-mod-breadcrumb-label">{mod.label}</span>
      </div>
      <PeriodPicker period={period} onChange={setPeriod} />
      {loading && <RefreshCw size={12} className="pp-spin fhub-mod-spin" />}
    </div>
  );
}

// ── Painel genérico p/ módulos novos (slot-based, tabela automática) ───────────
function PainelSlot({ slot, slotName, empresa, period, titulo, Icon: PIcon }) {
  const { dados, loading, erro, refresh } = useFinData(slot, empresa, period);

  if (!slot) return <SemConsulta slot={slotName} />;
  if (loading && !dados) return <FinLoading />;

  const rows    = dados?.rows    || [];
  const cols    = dados?.columns || [];
  const visCols = cols.filter(c => !HIDDEN_COLS.has(c));

  return (
    <div className="fin2-tab-body">
      <div className="fin2-section-header">
        {PIcon && <PIcon size={14} />} {titulo}
        {erro && <span className="fin-erro-inline">{erro}</span>}
        <div className="fin2-section-actions">
          <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={refresh} disabled={loading}>
            <RefreshCw size={11} className={loading ? 'pp-spin' : ''} />
          </button>
        </div>
      </div>
      {rows.length > 0 ? (
        <div className="fin-table-wrap">
          <table className="fin-table fin2-table">
            <thead>
              <tr>{visCols.map(c => <th key={c}>{c.replace(/_/g,' ')}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {visCols.map(c => (
                    <td key={c} style={cellStyle(c, row[c])}
                      className={isCurrencyCol(c) ? 'fin2-td-num' : ''}>
                      {fmtCell(c, row[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <TfootTotals cols={visCols} rows={rows} />
          </table>
        </div>
      ) : (
        !erro && !loading && <p className="fin-vazio">Nenhum dado encontrado para o período.</p>
      )}
    </div>
  );
}

// ── Painel Alertas Financeiros ─────────────────────────────────────────────────
const ALERT_PRIORITY = {
  critico: { label: 'Crítico', color: '#dc2626', bg: 'rgba(220,38,38,0.1)',  Icon: AlertCircle   },
  alto:    { label: 'Alto',    color: '#f97316', bg: 'rgba(249,115,22,0.1)', Icon: AlertTriangle },
  medio:   { label: 'Médio',   color: '#eab308', bg: 'rgba(234,179,8,0.1)', Icon: AlertTriangle },
  baixo:   { label: 'Baixo',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',Icon: Info           },
};

function PainelAlertas({ slot, empresa, period }) {
  const { dados, loading, erro, refresh } = useFinData(slot, empresa, period);

  if (!slot) return <SemConsulta slot="financeiro_alertas" />;
  if (loading && !dados) return <FinLoading />;

  const rows = dados?.rows || [];

  // Tenta detectar colunas: tipo/prioridade/descricao/valor/quantidade
  const col = (row, ...candidates) => {
    for (const c of candidates) {
      const k = Object.keys(row).find(k2 => k2.toLowerCase() === c.toLowerCase());
      if (k !== undefined) return row[k];
    }
    return undefined;
  };

  return (
    <div className="fin2-tab-body">
      <div className="fin2-section-header">
        <BellRing size={14} /> Alertas Financeiros
        {erro && <span className="fin-erro-inline">{erro}</span>}
        <div className="fin2-section-actions">
          <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={refresh} disabled={loading}>
            <RefreshCw size={11} className={loading ? 'pp-spin' : ''} />
          </button>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="fin2-alertas-list">
          {rows.map((row, i) => {
            const prioridade = (col(row,'prioridade','priority','nivel') || 'medio').toLowerCase();
            const config     = ALERT_PRIORITY[prioridade] || ALERT_PRIORITY.medio;
            const titulo     = col(row,'titulo','descricao','tipo','alerta','mensagem') || `Alerta ${i+1}`;
            const valor      = col(row,'valor','total','montante');
            const qtd        = col(row,'quantidade','qtd','count');
            const detalhe    = col(row,'detalhe','observacao','obs','complemento');
            return (
              <div key={i} className="fin2-alerta-card"
                style={{ '--alerta-color': config.color, '--alerta-bg': config.bg }}>
                <div className="fin2-alerta-icon">
                  <config.Icon size={18} style={{ color: config.color }} />
                </div>
                <div className="fin2-alerta-body">
                  <div className="fin2-alerta-titulo">{titulo}</div>
                  {detalhe && <div className="fin2-alerta-detalhe">{detalhe}</div>}
                  {(valor != null || qtd != null) && (
                    <div className="fin2-alerta-meta">
                      {valor != null && <span className="fin2-alerta-valor">{fmtCur.format(Number(valor)||0)}</span>}
                      {qtd   != null && <span className="fin2-alerta-qtd">{fmtNum.format(Number(qtd)||0)} ocorrência(s)</span>}
                    </div>
                  )}
                </div>
                <span className="fin2-alerta-badge"
                  style={{ background: config.bg, color: config.color }}>
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        !erro && !loading && (
          <div className="fin2-alertas-ok">
            <div className="fin2-alertas-ok-icon">✅</div>
            <p>Nenhum alerta para o período selecionado.</p>
          </div>
        )
      )}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function Financeiro({ empresas }) {
  const empresa = (empresas || [])[0] || '';

  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // null = hub; string = módulo ativo
  const [activeModule, setActiveModule] = useState(null);

  const [slots, setSlots] = useState({
    resumo: undefined, vendas: undefined,
    custos: undefined, custos_detalhe: undefined,
    fluxo: undefined,
    pagar: undefined,
    bancos: undefined,
    receitas_despesas: undefined,
    resultado: undefined,
    alertas: undefined,
  });

  useEffect(() => {
    const fetchSlot = nome =>
      apiFetch(`/api/queries?ativa=true&slot=${nome}`)
        .then(r => r.json())
        .then(d => Array.isArray(d) && d.length ? d[0] : null)
        .catch(() => null);

    Promise.all([
      fetchSlot('financeiro_resumo'),
      fetchSlot('financeiro_vendas'),
      fetchSlot('financeiro_custos'),
      fetchSlot('financeiro_custos_detalhe'),
      fetchSlot('financeiro_fluxo'),
      fetchSlot('financeiro_pagar'),
      fetchSlot('financeiro_bancos'),
      fetchSlot('financeiro_receitas_despesas'),
      fetchSlot('financeiro_resultado'),
      fetchSlot('financeiro_alertas'),
    ]).then(([resumo, vendas, custos, custos_detalhe, fluxo,
              pagar, bancos, receitas_despesas, resultado, alertas]) =>
      setSlots({ resumo, vendas, custos, custos_detalhe, fluxo,
                 pagar, bancos, receitas_despesas, resultado, alertas })
    );
  }, [empresa]);

  const loadingSlots = Object.values(slots).some(s => s === undefined);

  // ── Renderização ──────────────────────────────────────────────────────────────

  if (loadingSlots) {
    return (
      <div className="fin2-wrap">
        <div className="fin-loading fin-loading--full">
          <RefreshCw size={20} className="pp-spin" />
          <span>Carregando módulos financeiros…</span>
        </div>
      </div>
    );
  }

  // Hub: menu de atalhos
  if (!activeModule) {
    return (
      <div className="fin2-wrap">
        <FinHub onSelect={setActiveModule} />
      </div>
    );
  }

  // Módulo ativo: cabeçalho + conteúdo
  return (
    <div className="fin2-wrap">
      <ModuleHeader
        modKey={activeModule}
        onBack={() => setActiveModule(null)}
        period={period}
        setPeriod={setPeriod}
        loading={false}
      />

      <div className="fin2-content">
        {/* ── Visão Geral: Resumo + Vendas ── */}
        {activeModule === 'visao_geral' && (
          <>
            <PainelResumo slot={slots.resumo} empresa={empresa} period={period} />
            <PainelVendas slot={slots.vendas} empresa={empresa} period={period} />
          </>
        )}

        {/* ── Módulos mapeados para painéis existentes ── */}
        {activeModule === 'receber' && (
          <PainelCustos
            slot={slots.custos}
            slotDetalhe={slots.custos_detalhe}
            empresa={empresa}
            period={period}
          />
        )}
        {activeModule === 'fluxo' && (
          <PainelFluxo slot={slots.fluxo} empresa={empresa} period={period} />
        )}

        {/* ── Novos módulos: PainelSlot genérico ── */}
        {activeModule === 'pagar' && (
          <PainelSlot
            slot={slots.pagar}
            slotName="financeiro_pagar"
            empresa={empresa}
            period={period}
            titulo="Contas a Pagar"
            Icon={ArrowUpCircle}
          />
        )}
        {activeModule === 'bancos' && (
          <PainelSlot
            slot={slots.bancos}
            slotName="financeiro_bancos"
            empresa={empresa}
            period={period}
            titulo="Bancos e Caixa"
            Icon={Building2}
          />
        )}
        {activeModule === 'receitas' && (
          <PainelSlot
            slot={slots.receitas_despesas}
            slotName="financeiro_receitas_despesas"
            empresa={empresa}
            period={period}
            titulo="Receitas e Despesas"
            Icon={ArrowLeftRight}
          />
        )}
        {activeModule === 'resultado' && (
          <PainelSlot
            slot={slots.resultado}
            slotName="financeiro_resultado"
            empresa={empresa}
            period={period}
            titulo="Resultado e Rentabilidade"
            Icon={TrendingUp}
          />
        )}
        {activeModule === 'alertas' && (
          <PainelAlertas slot={slots.alertas} empresa={empresa} period={period} />
        )}
      </div>
    </div>
  );
}
