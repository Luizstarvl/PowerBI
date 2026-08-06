/* ═══════════════════════════════════════════════════════════════
   MetasComerciais.jsx — Metas e Acompanhamento Comercial
   Eclipse BI · Planejamento Comercial
═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../api';
import {
  Target, TrendingUp, Edit3, Plus, Trash2,
  ChevronLeft, ChevronRight, RefreshCw, Sparkles,
  X, Save, BarChart2, ShoppingCart, DollarSign,
  CheckCircle, AlertTriangle, Minus
} from 'lucide-react';
import {
  ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

/* ── Tokens ──────────────────────────────────────────────────── */
const CT = {
  orange: '#F97316', blue: '#60A5FA', green: '#22C55E',
  yellow: '#FBBF24', red: '#EF4444', purple: '#A78BFA',
};

/* ── Helpers de formato ──────────────────────────────────────── */
const fmtR$ = v =>
  v == null ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtN  = v =>
  v == null ? '—' : Number(v).toLocaleString('pt-BR');

const MESES_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

function getMesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function mesLabel(k) {
  const [a, m] = k.split('-').map(Number);
  return `${MESES_PT[m-1]} ${a}`;
}
function addMes(k, delta) {
  const [a, m] = k.split('-').map(Number);
  const d = new Date(a, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function progressColor(pct) {
  if (pct == null) return '#6B7280';
  if (pct >= 100) return CT.green;
  if (pct >= 80)  return CT.orange;
  if (pct >= 50)  return CT.yellow;
  return CT.red;
}

/* ── Tooltip do gráfico ──────────────────────────────────────── */
function DailyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="pv-tooltip">
      <div className="pv-tt-title">Dia {label}</div>
      {payload.map((p, i) => (
        <div key={i} className="pv-tt-row">
          <span className="pv-tt-dot" style={{ background: p.color }} />
          <span className="pv-tt-name">{p.name}</span>
          <span className="pv-tt-val">{fmtR$(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Card de KPI ─────────────────────────────────────────────── */
function KpiCard({ titulo, Icone, cor, meta, realizado, unidade, diasPassados, diasNoMes, onEdit }) {
  const pct = meta > 0 ? Math.min(150, realizado / meta * 100) : null;
  const proporcional = diasNoMes > 0 ? (diasPassados / diasNoMes * 100) : 0;

  let StatusIcon = Minus;
  let statusLabel = 'Sem meta';
  if (pct != null) {
    if (pct >= 100)          { StatusIcon = CheckCircle; statusLabel = 'Meta atingida!'; }
    else if (pct >= proporcional) { StatusIcon = CheckCircle; statusLabel = 'No ritmo'; }
    else                     { StatusIcon = AlertTriangle; statusLabel = 'Abaixo do ritmo'; }
  }
  const sColor = pct == null ? '#6B7280' : pct >= proporcional ? CT.green : CT.yellow;

  return (
    <div className="mc-kpi-card">
      <div className="mc-kpi-head">
        <span className="mc-kpi-icon-wrap" style={{ background: `${cor}22`, color: cor }}>
          <Icone size={15} />
        </span>
        <span className="mc-kpi-titulo">{titulo}</span>
        <button className="mc-kpi-edit" onClick={onEdit} title="Editar meta">
          <Edit3 size={12} />
        </button>
      </div>

      <div className="mc-kpi-vals">
        <div>
          <div className="mc-kpi-label">Realizado</div>
          <div className="mc-kpi-main">{unidade === '$' ? fmtR$(realizado) : fmtN(realizado)}</div>
        </div>
        <div>
          <div className="mc-kpi-label">Meta</div>
          <div className="mc-kpi-secondary">
            {meta == null ? 'Não definida' : unidade === '$' ? fmtR$(meta) : fmtN(meta)}
          </div>
        </div>
      </div>

      <div className="mc-prog-row">
        <div className="mc-prog-track">
          <div className="mc-prog-fill" style={{ width: `${Math.min(100, pct || 0)}%`, background: progressColor(pct) }} />
        </div>
        <span className="mc-prog-pct" style={{ color: progressColor(pct) }}>
          {pct != null ? `${pct.toFixed(1)}%` : '—'}
        </span>
      </div>

      <div className="mc-kpi-status" style={{ color: sColor }}>
        <StatusIcon size={12} />
        <span>{statusLabel}</span>
      </div>
    </div>
  );
}

/* ── Modal de definição de metas ─────────────────────────────── */
function EditModal({ mes, metaAtual, sugestao, loadingSug, onSave, onClose }) {
  const [form, setForm] = useState({
    faturamento: metaAtual?.faturamento != null ? String(metaAtual.faturamento) : '',
    quantidade:  metaAtual?.quantidade  != null ? String(metaAtual.quantidade)  : '',
    ticketMedio: metaAtual?.ticketMedio != null ? String(metaAtual.ticketMedio) : '',
  });
  const [saving, setSaving] = useState(false);

  function aplicar() {
    if (!sugestao) return;
    setForm({
      faturamento: sugestao.faturamento != null ? String(sugestao.faturamento) : '',
      quantidade:  sugestao.quantidade  != null ? String(sugestao.quantidade)  : '',
      ticketMedio: sugestao.ticketMedio != null ? String(sugestao.ticketMedio) : '',
    });
  }

  async function salvar() {
    setSaving(true);
    await onSave({
      faturamento: form.faturamento ? parseFloat(form.faturamento) : null,
      quantidade:  form.quantidade  ? parseInt(form.quantidade)    : null,
      ticketMedio: form.ticketMedio ? parseFloat(form.ticketMedio) : null,
    });
    setSaving(false);
  }

  return (
    <div className="mc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mc-modal">
        <div className="mc-modal-head">
          <div className="mc-modal-titulo">
            <Target size={17} style={{ color: CT.orange }} />
            Metas — {mesLabel(mes)}
          </div>
          <button className="mc-modal-close" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Sugestão automática */}
        {(sugestao || loadingSug) && (
          <div className="mc-sug-box">
            <div className="mc-sug-row">
              <Sparkles size={13} style={{ color: CT.yellow }} />
              {loadingSug
                ? <span style={{ opacity: 0.6 }}>Calculando sugestão...</span>
                : <>
                    <span>Sugestão: média de 3 meses +{sugestao.crescimento}%</span>
                    <button className="mc-sug-btn" onClick={aplicar}>Aplicar</button>
                  </>
              }
            </div>
            {sugestao && (
              <div className="mc-sug-vals">
                <span>Fat: <b>{fmtR$(sugestao.faturamento)}</b></span>
                <span>Qtd: <b>{fmtN(sugestao.quantidade)}</b></span>
                {sugestao.ticketMedio && <span>Ticket: <b>{fmtR$(sugestao.ticketMedio)}</b></span>}
              </div>
            )}
            {sugestao?.historico?.length > 0 && (
              <div className="mc-sug-hist">
                {sugestao.historico.map(h => (
                  <span key={h.mes} className="mc-sug-hist-item">
                    {h.mes}: {fmtR$(h.faturamento)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mc-modal-body">
          <label className="mc-label"><DollarSign size={13} /> Faturamento (R$)</label>
          <input className="mc-input" type="number" min="0" step="100"
            placeholder="Ex: 150000"
            value={form.faturamento}
            onChange={e => setForm(f => ({ ...f, faturamento: e.target.value }))} />

          <label className="mc-label"><ShoppingCart size={13} /> Quantidade de Vendas</label>
          <input className="mc-input" type="number" min="0" step="1"
            placeholder="Ex: 5000"
            value={form.quantidade}
            onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))} />

          <label className="mc-label"><BarChart2 size={13} /> Ticket Médio (R$)</label>
          <input className="mc-input" type="number" min="0" step="0.01"
            placeholder="Ex: 45.00"
            value={form.ticketMedio}
            onChange={e => setForm(f => ({ ...f, ticketMedio: e.target.value }))} />
        </div>

        <div className="mc-modal-foot">
          <button className="mc-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="mc-btn-save" onClick={salvar} disabled={saving}>
            {saving ? <RefreshCw size={13} className="spin" /> : <Save size={13} />}
            Salvar Metas
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Componente principal
══════════════════════════════════════════════════════════════ */
export default function MetasComerciais({ empresasKey, clients, empresas }) {
  const empresa = (empresas || [])[0] || null;

  const [mes, setMes]               = useState(getMesAtual);
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [editando, setEditando]     = useState(false);
  const [sugestao, setSugestao]     = useState(null);
  const [loadingSug, setLoadingSug] = useState(false);
  const [addSecao, setAddSecao]     = useState(false);
  const [novaSecao, setNovaSecao]   = useState({ secao: '', faturamento: '' });
  const [savingSecao, setSavingSecao] = useState(false);

  const loadData = useCallback(async () => {
    if (!empresa) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const r = await apiFetch(`/api/planejamento/metas?empresa=${empresa}&mes=${mes}`);
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Erro'); }
      setData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [empresa, mes]);

  useEffect(() => { loadData(); }, [loadData]);

  async function openEdit() {
    setEditando(true);
    setSugestao(null);
    setLoadingSug(true);
    try {
      const r = await apiFetch(`/api/planejamento/metas/sugestao?empresa=${empresa}&mes=${mes}`);
      if (r.ok) { const j = await r.json(); setSugestao(j.sugestao ? j : null); }
    } catch (_) {}
    finally { setLoadingSug(false); }
  }

  async function saveMetas(vals) {
    const r = await apiFetch('/api/planejamento/metas', {
      method: 'POST',
      body: JSON.stringify({ empresa, mes, ...vals }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
    setEditando(false);
    loadData();
  }

  async function handleSaveSecao() {
    if (!novaSecao.secao || !novaSecao.faturamento) return;
    setSavingSecao(true);
    try {
      const r = await apiFetch('/api/planejamento/metas/secao', {
        method: 'POST',
        body: JSON.stringify({ empresa, mes, secao: novaSecao.secao, faturamento: parseFloat(novaSecao.faturamento) }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setNovaSecao({ secao: '', faturamento: '' });
      setAddSecao(false);
      loadData();
    } finally { setSavingSecao(false); }
  }

  async function handleDeleteSecao(id) {
    const r = await apiFetch(`/api/planejamento/metas/secao/${id}`, { method: 'DELETE' });
    if (r.ok) loadData();
  }

  /* ── Desestruturação dos dados ─────────────────────────────── */
  const {
    meta = {}, realizado = {}, progressoDiario = [],
    metasSecao = [], secoesDisponiveis = [],
    diasNoMes = 30, diasPassados = 0,
  } = data || {};

  const mesAtual = getMesAtual();
  const secoesParaAdicionar = secoesDisponiveis.filter(s => !metasSecao.some(m => m.secao === s));

  /* ── Render principal ──────────────────────────────────────── */
  if (!empresa) return (
    <div className="pv-empty-state">
      <Target size={48} style={{ opacity: 0.3 }} />
      <p>Selecione uma empresa para acessar as metas.</p>
    </div>
  );

  return (
    <div className="mc-root">

      {/* ── Cabeçalho com navegação de mês ─────────────────── */}
      <div className="mc-header">
        <div className="mc-nav">
          <button className="mc-nav-btn" onClick={() => setMes(m => addMes(m, -1))}>
            <ChevronLeft size={17} />
          </button>
          <h2 className="mc-nav-label">{mesLabel(mes)}</h2>
          <button className="mc-nav-btn" onClick={() => setMes(m => addMes(m, 1))} disabled={mes >= mesAtual}>
            <ChevronRight size={17} />
          </button>
        </div>
        <div className="mc-header-actions">
          {loading && <RefreshCw size={14} className="spin" style={{ color: CT.orange, opacity: 0.7 }} />}
          <button className="mc-btn-primary" onClick={openEdit}>
            <Target size={13} />
            Definir Metas
          </button>
        </div>
      </div>

      {/* ── Barra de progresso do mês ─────────────────────── */}
      <div className="mc-mes-progress">
        <div className="mc-mes-track">
          <div className="mc-mes-fill" style={{ width: `${diasNoMes > 0 ? (diasPassados/diasNoMes*100) : 0}%` }} />
        </div>
        <span className="mc-mes-label">
          {diasPassados} de {diasNoMes} dias — {diasNoMes > 0 ? ((diasPassados/diasNoMes)*100).toFixed(0) : 0}% do mês concluído
        </span>
      </div>

      {/* ── Erro ────────────────────────────────────────────── */}
      {error && (
        <div className="mc-error-box">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div className="mc-kpi-grid">
        <KpiCard titulo="Faturamento"     Icone={DollarSign}   cor={CT.orange} unidade="$"
          meta={meta.faturamento} realizado={realizado.faturamento || 0}
          diasPassados={diasPassados} diasNoMes={diasNoMes} onEdit={openEdit} />
        <KpiCard titulo="Qtd Vendas"      Icone={ShoppingCart}  cor={CT.blue}   unidade="n"
          meta={meta.quantidade}  realizado={realizado.quantidade  || 0}
          diasPassados={diasPassados} diasNoMes={diasNoMes} onEdit={openEdit} />
        <KpiCard titulo="Ticket Médio"    Icone={BarChart2}     cor={CT.purple} unidade="$"
          meta={meta.ticketMedio} realizado={realizado.ticketMedio || 0}
          diasPassados={diasPassados} diasNoMes={diasNoMes} onEdit={openEdit} />
      </div>

      {/* ── Gráfico de evolução diária ───────────────────────── */}
      {progressoDiario.length > 0 && (
        <div className="mc-chart-card">
          <div className="mc-section-head">
            <TrendingUp size={14} style={{ color: CT.orange }} />
            <span>Evolução Diária — Faturamento Acumulado</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={progressoDiario} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mcGradReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={CT.orange} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={CT.orange} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<DailyTooltip />} />
              <Area type="monotone" dataKey="realizado" name="Realizado"
                stroke={CT.orange} strokeWidth={2} fill="url(#mcGradReal)" />
              {meta.faturamento && (
                <Line type="monotone" dataKey="metaProporcional" name="Meta (ritmo)"
                  stroke={CT.green} strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          {meta.faturamento && (
            <div className="mc-legend">
              <span><span className="mc-legend-dot" style={{ background: CT.orange }} /> Realizado</span>
              <span><span className="mc-legend-dash" style={{ background: CT.green }} /> Meta proporcional</span>
            </div>
          )}
        </div>
      )}

      {/* ── Metas por Seção ─────────────────────────────────── */}
      <div className="mc-secao-card">
        <div className="mc-section-head">
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <BarChart2 size={14} style={{ color: CT.blue }} />
            <span>Metas por Seção</span>
          </div>
          <button className="mc-btn-add" onClick={() => setAddSecao(true)} disabled={addSecao}>
            <Plus size={13} /> Adicionar Seção
          </button>
        </div>

        {/* Formulário de nova seção */}
        {addSecao && (
          <div className="mc-add-secao">
            <select className="mc-input mc-input-sm" value={novaSecao.secao}
              onChange={e => setNovaSecao(f => ({ ...f, secao: e.target.value }))}>
              <option value="">Selecione a seção</option>
              {secoesParaAdicionar.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className="mc-input mc-input-sm" type="number" min="0" placeholder="Meta R$"
              value={novaSecao.faturamento}
              onChange={e => setNovaSecao(f => ({ ...f, faturamento: e.target.value }))} />
            <button className="mc-btn-save-sm" onClick={handleSaveSecao} disabled={savingSecao}>
              {savingSecao ? <RefreshCw size={12} className="spin" /> : <Save size={12} />}
            </button>
            <button className="mc-btn-cancel-sm" onClick={() => setAddSecao(false)}><X size={12} /></button>
          </div>
        )}

        {/* Lista */}
        {metasSecao.length === 0 && !addSecao ? (
          <div className="mc-secao-empty">
            <Target size={32} style={{ opacity: 0.25 }} />
            <p>Nenhuma meta por seção definida.</p>
            <p style={{ fontSize: 12, opacity: 0.5 }}>Clique em "Adicionar Seção" para começar.</p>
          </div>
        ) : (
          <div className="mc-secao-list">
            {metasSecao.map(s => (
              <div key={s.id} className="mc-secao-row">
                <div className="mc-secao-info">
                  <span className="mc-secao-nome">{s.secao}</span>
                  <span className="mc-secao-nums">
                    {fmtR$(s.realizado)} <span style={{ opacity: 0.4 }}>/</span> {fmtR$(s.meta)}
                  </span>
                </div>
                <div className="mc-secao-bar-wrap">
                  <div className="mc-prog-track">
                    <div className="mc-prog-fill"
                      style={{ width: `${Math.min(100, s.progresso || 0)}%`, background: progressColor(s.progresso) }} />
                  </div>
                  <span className="mc-prog-pct" style={{ color: progressColor(s.progresso) }}>
                    {s.progresso != null ? `${s.progresso.toFixed(1)}%` : '—'}
                  </span>
                </div>
                <button className="mc-secao-del" onClick={() => handleDeleteSecao(s.id)} title="Remover">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────── */}
      {editando && (
        <EditModal
          mes={mes}
          metaAtual={meta}
          sugestao={sugestao?.sugestao ?? sugestao}
          loadingSug={loadingSug}
          onSave={saveMetas}
          onClose={() => setEditando(false)}
        />
      )}
    </div>
  );
}
