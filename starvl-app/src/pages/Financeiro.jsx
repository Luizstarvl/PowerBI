/**
 * Financeiro.jsx
 * Módulo Financeiro — visão consolidada de receita, custo, margem e fluxo de caixa.
 * Alimentado por consultas configuradas no Gerenciador de Consultas (categoria Financeiro).
 *
 * Slots esperados (opcionais — cada um ativa o respectivo painel):
 *   financeiro_resumo      → KPIs consolidados do período (receita, custo, margem, ticket)
 *   financeiro_vendas      → Evolução de vendas por período
 *   financeiro_custos      → Detalhamento de custos operacionais
 *   financeiro_fluxo       → Fluxo de caixa entradas/saídas
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Landmark, RefreshCw, TrendingUp, TrendingDown,
  DollarSign, BarChart3, ArrowUpRight, ArrowDownRight,
  CalendarDays, ChevronDown, Settings,
} from 'lucide-react';
import { apiFetch } from '../api';

// ── Formatadores ───────────────────────────────────────────────────────────────
const fmtCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum      = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const fmtPct      = v => `${fmtNum.format(Number(v) || 0)}%`;

// ── Componentes auxiliares ─────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, accent, trend, trendLabel }) {
  const up = trend > 0;
  const dn = trend < 0;
  return (
    <div className="fin-kpi" style={{ '--fin-accent': accent }}>
      <div className="fin-kpi-icon"><Icon size={17} /></div>
      <div className="fin-kpi-body">
        <span className="fin-kpi-label">{label}</span>
        <span className="fin-kpi-value">{value}</span>
        {(sub || trendLabel) && (
          <span className="fin-kpi-sub">
            {trend !== undefined && (
              <span className={`fin-kpi-trend ${up ? 'fin-kpi-trend--up' : dn ? 'fin-kpi-trend--dn' : ''}`}>
                {up ? <ArrowUpRight size={11} /> : dn ? <ArrowDownRight size={11} /> : null}
                {trendLabel}
              </span>
            )}
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

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

function PeriodPicker({ period, onChange }) {
  const now     = new Date();
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
      <select
        className="fin-period-select"
        value={period}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={12} className="fin-period-arrow" />
    </div>
  );
}

// ── Painel de Resumo Financeiro ────────────────────────────────────────────────
function PainelResumo({ slot, empresa, period }) {
  const [dados,   setDados]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState('');

  const [y, m] = period.split('-');
  const inicio = `${y}-${m}-01`;
  const fim    = new Date(parseInt(y), parseInt(m), 0);
  const fimStr = `${y}-${m}-${String(fim.getDate()).padStart(2, '0')}`;

  const fetch = useCallback(() => {
    if (!slot || !empresa) return;
    setLoading(true);
    setErro('');
    apiFetch(`/api/queries/execute/${slot.codigo}?empresa=${empresa}&data_inicio=${inicio}&data_final=${fimStr}&periodo=${m}${y}`)
      .then(r => r.json())
      .then(d => {
        if (!d.ok) throw new Error(d.error || 'Erro ao carregar resumo');
        setDados(d.rows?.[0] || null);
      })
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  }, [slot, empresa, inicio, fimStr, m, y]);

  useEffect(() => { fetch(); }, [fetch]);

  if (!slot) return <SemConsulta slot="financeiro_resumo" />;
  if (loading && !dados) return (
    <div className="fin-loading"><RefreshCw size={16} className="pp-spin" /> Carregando…</div>
  );

  const r = dados || {};
  const receita  = parseFloat(r.receita  || r.faturamento || r.total_vendas  || 0);
  const custo    = parseFloat(r.custo    || r.total_custo || r.custos        || 0);
  const margem   = receita > 0 ? ((receita - custo) / receita) * 100 : parseFloat(r.margem || 0);
  const lucro    = parseFloat(r.lucro    || (receita - custo) || 0);
  const ticket   = parseFloat(r.ticket   || r.ticket_medio  || 0);
  const transacoes = parseFloat(r.transacoes || r.qtd_vendas || 0);

  return (
    <div className="fin-section">
      <div className="fin-section-header">
        <BarChart3 size={14} />
        <span>Resumo do Período</span>
        {erro && <span className="fin-erro-inline">{erro}</span>}
        <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={fetch} disabled={loading}>
          <RefreshCw size={11} className={loading ? 'pp-spin' : ''} />
        </button>
      </div>
      {dados ? (
        <div className="fin-kpi-grid">
          <KpiCard icon={DollarSign}  label="Faturamento"   value={fmtCurrency.format(receita)} accent="#3b82f6" />
          <KpiCard icon={TrendingDown} label="Custo Total"  value={fmtCurrency.format(custo)}   accent="#f97316" />
          <KpiCard icon={TrendingUp}  label="Lucro Bruto"   value={fmtCurrency.format(lucro)}   accent="#22c55e"
            trend={lucro >= 0 ? 1 : -1} trendLabel={fmtCurrency.format(lucro)} />
          <KpiCard icon={BarChart3}   label="Margem"        value={fmtPct(margem)}              accent="#8b5cf6" />
          {ticket > 0    && <KpiCard icon={DollarSign}   label="Ticket Médio"   value={fmtCurrency.format(ticket)}   accent="#06b6d4" />}
          {transacoes > 0 && <KpiCard icon={BarChart3}   label="Transações"     value={fmtNum.format(transacoes)}     accent="#84cc16" />}
        </div>
      ) : (
        !erro && <p className="fin-vazio">Nenhum dado encontrado para o período selecionado.</p>
      )}
    </div>
  );
}

// ── Painel genérico (vendas / custos / fluxo) ─────────────────────────────────
function PainelTabela({ slot, slotNome, icon: Icon, empresa, period }) {
  const [dados,   setDados]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState('');

  const [y, m] = period.split('-');
  const inicio = `${y}-${m}-01`;
  const fim    = new Date(parseInt(y), parseInt(m), 0);
  const fimStr = `${y}-${m}-${String(fim.getDate()).padStart(2, '0')}`;

  const fetchDados = useCallback(() => {
    if (!slot || !empresa) return;
    setLoading(true);
    setErro('');
    apiFetch(`/api/queries/execute/${slot.codigo}?empresa=${empresa}&data_inicio=${inicio}&data_final=${fimStr}&periodo=${m}${y}`)
      .then(r => r.json())
      .then(d => {
        if (!d.ok) throw new Error(d.error || 'Erro ao carregar dados');
        setDados({ rows: d.rows || [], columns: d.columns || [] });
      })
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  }, [slot, empresa, inicio, fimStr, m, y]);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  if (!slot) return <SemConsulta slot={slotNome} />;
  if (loading && !dados) return (
    <div className="fin-loading"><RefreshCw size={16} className="pp-spin" /> Carregando…</div>
  );

  return (
    <div className="fin-section">
      <div className="fin-section-header">
        <Icon size={14} />
        <span>{slotNome.replace('financeiro_', '').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
        {erro && <span className="fin-erro-inline">{erro}</span>}
        <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={fetchDados} disabled={loading}>
          <RefreshCw size={11} className={loading ? 'pp-spin' : ''} />
        </button>
      </div>
      {dados && dados.rows.length > 0 ? (
        <div className="fin-table-wrap">
          <table className="fin-table">
            <thead>
              <tr>
                {dados.columns.map(c => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {dados.rows.map((row, i) => (
                <tr key={i}>
                  {dados.columns.map(c => (
                    <td key={c}>{row[c] ?? '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !erro && !loading && <p className="fin-vazio">Nenhum dado encontrado para o período selecionado.</p>
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

  // Slots configurados no Gerenciador de Consultas
  const [slots, setSlots] = useState({
    resumo:  undefined,   // undefined = carregando, null = não existe
    vendas:  undefined,
    custos:  undefined,
    fluxo:   undefined,
  });

  useEffect(() => {
    const fetchSlot = nome =>
      apiFetch(`/api/queries?ativa=true&slot=${nome}`)
        .then(r => r.json())
        .then(d => (Array.isArray(d) && d.length ? d[0] : null))
        .catch(() => null);

    Promise.all([
      fetchSlot('financeiro_resumo'),
      fetchSlot('financeiro_vendas'),
      fetchSlot('financeiro_custos'),
      fetchSlot('financeiro_fluxo'),
    ]).then(([resumo, vendas, custos, fluxo]) => {
      setSlots({ resumo, vendas, custos, fluxo });
    });
  }, [empresa]);

  const loading = Object.values(slots).some(s => s === undefined);

  return (
    <div className="fin-wrap">

      {/* ── Cabeçalho ── */}
      <div className="fin-header">
        <div className="fin-header-title">
          <Landmark size={18} />
          <h1>Financeiro</h1>
        </div>
        <PeriodPicker period={period} onChange={setPeriod} />
      </div>

      {loading ? (
        <div className="fin-loading fin-loading--full">
          <RefreshCw size={20} className="pp-spin" />
          <span>Carregando módulos financeiros…</span>
        </div>
      ) : (
        <div className="fin-body">

          {/* ── Resumo ── */}
          <PainelResumo
            slot={slots.resumo}
            empresa={empresa}
            period={period}
          />

          {/* ── Vendas / Custos / Fluxo em grid 2 colunas ── */}
          <div className="fin-panels-grid">
            <PainelTabela
              slot={slots.vendas}
              slotNome="financeiro_vendas"
              icon={TrendingUp}
              empresa={empresa}
              period={period}
            />
            <PainelTabela
              slot={slots.custos}
              slotNome="financeiro_custos"
              icon={TrendingDown}
              empresa={empresa}
              period={period}
            />
          </div>

          <PainelTabela
            slot={slots.fluxo}
            slotNome="financeiro_fluxo"
            icon={BarChart3}
            empresa={empresa}
            period={period}
          />

        </div>
      )}
    </div>
  );
}
