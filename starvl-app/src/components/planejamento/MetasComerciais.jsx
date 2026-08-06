/* ═══════════════════════════════════════════════════════════════
   MetasComerciais.jsx — Metas e Acompanhamento Comercial
   Eclipse BI · Planejamento Comercial
═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../../api';
import {
  Target, TrendingUp, Edit3, Plus, Trash2,
  ChevronLeft, ChevronRight, ChevronDown, RefreshCw, Sparkles,
  X, Save, BarChart2, ShoppingCart, DollarSign,
  CheckCircle, AlertTriangle, Zap,
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

/* ── Helpers ─────────────────────────────────────────────────── */
const fmtR$ = v =>
  v == null ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtN = v =>
  v == null ? '—' : Number(v).toLocaleString('pt-BR');
const fmtK = v => {
  if (v == null) return '—';
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(1)}k`;
  return fmtR$(v);
};

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

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
  if (pct == null) return '#374151';
  if (pct >= 100) return CT.green;
  if (pct >= 80)  return CT.orange;
  if (pct >= 50)  return CT.yellow;
  return CT.red;
}

/* ── SVG Arc de progresso ────────────────────────────────────── */
function ArcProgress({ pct, cor, size = 72, stroke = 7 }) {
  const r   = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const fill = pct != null ? Math.min(100, pct) / 100 * circ : 0;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={stroke} />
      {pct != null && (
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={cor} strokeWidth={stroke}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .6s cubic-bezier(.4,0,.2,1)' }} />
      )}
      <text x={size/2} y={size/2}
        textAnchor="middle" dominantBaseline="central"
        style={{ fill: pct != null ? cor : '#4B5563', fontSize: pct != null ? 13 : 10,
                 fontWeight: 700, transform: 'rotate(90deg)',
                 transformOrigin: `${size/2}px ${size/2}px` }}>
        {pct != null ? `${Math.round(pct)}%` : '—'}
      </text>
    </svg>
  );
}

/* ── KPI Card ────────────────────────────────────────────────── */
function KpiCard({ titulo, Icone, cor, meta, realizado, unidade, diasPassados, diasNoMes, onEdit }) {
  const pct         = meta > 0 ? realizado / meta * 100 : null;
  const proporcional= diasNoMes > 0 ? diasPassados / diasNoMes * 100 : 0;
  const temMeta     = meta != null;

  let statusTxt = 'Sem meta definida';
  let StatusIco = Target;
  let statusCor = '#4B5563';
  if (temMeta) {
    if (pct >= 100)               { statusTxt = 'Meta atingida!';     StatusIco = CheckCircle; statusCor = CT.green;  }
    else if (pct >= proporcional) { statusTxt = 'No ritmo certo';     StatusIco = CheckCircle; statusCor = CT.green;  }
    else                          { statusTxt = 'Abaixo do esperado'; StatusIco = AlertTriangle; statusCor = CT.yellow; }
  }

  const arcCor = temMeta ? progressColor(pct) : '#374151';

  return (
    <div className="mc2-card" style={{ '--mc-cor': cor }}>
      {/* Faixa colorida no topo */}
      <div className="mc2-card-top-bar" />

      <div className="mc2-card-body">
        {/* Cabeçalho */}
        <div className="mc2-card-head">
          <span className="mc2-card-icon" style={{ background: `${cor}1A`, color: cor }}>
            <Icone size={14} />
          </span>
          <span className="mc2-card-titulo">{titulo}</span>
          {onEdit && (
            <button className="mc2-edit-btn" onClick={onEdit} title="Editar meta">
              <Edit3 size={12} />
            </button>
          )}
        </div>

        {/* Valores + Arco */}
        <div className="mc2-card-content">
          <div className="mc2-card-nums">
            <div>
              <div className="mc2-label">Realizado</div>
              <div className="mc2-realizado" style={{ color: cor }}>
                {unidade === '$' ? fmtK(realizado) : fmtN(realizado)}
              </div>
            </div>
            <div>
              <div className="mc2-label">Meta</div>
              <div className="mc2-meta-val">
                {!temMeta
                  ? onEdit
                    ? <button className="mc2-def-meta-btn" onClick={onEdit}>Definir →</button>
                    : <span style={{ color: '#4B5563', fontSize: 12 }}>Não definida</span>
                  : unidade === '$' ? fmtK(meta) : fmtN(meta)
                }
              </div>
            </div>
          </div>
          <ArcProgress pct={pct} cor={arcCor} />
        </div>

        {/* Barra linear */}
        {temMeta && (
          <div className="mc2-bar-wrap">
            <div className="mc2-bar-track">
              <div className="mc2-bar-fill" style={{
                width: `${Math.min(100, pct || 0)}%`,
                background: `linear-gradient(90deg, ${progressColor(pct)}99, ${progressColor(pct)})`,
              }} />
              {/* Marcador do ritmo esperado */}
              <div className="mc2-bar-marker" style={{ left: `${Math.min(100, proporcional)}%` }} />
            </div>
          </div>
        )}

        {/* Status */}
        <div className="mc2-status" style={{ color: statusCor }}>
          <StatusIco size={11} />
          <span>{statusTxt}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Dropdown customizado (evita select nativo bugado) ───────── */
function CustomSelect({ options, value, onChange, placeholder = 'Selecione...' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const label = options.find(o => o === value) || null;

  return (
    <div className="mc2-select" ref={ref}>
      <button className="mc2-select-btn" onClick={() => setOpen(v => !v)} type="button">
        <span style={{ color: label ? '#F1F5F9' : '#6B7280' }}>{label || placeholder}</span>
        <ChevronDown size={13} style={{ color: '#6B7280', transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div className="mc2-select-menu">
          {options.map(opt => (
            <button key={opt} className={`mc2-select-item${opt === value ? ' mc2-select-item--active' : ''}`}
              onMouseDown={() => { onChange(opt); setOpen(false); }}>
              {opt}
            </button>
          ))}
          {options.length === 0 && <div className="mc2-select-empty">Nenhuma seção disponível</div>}
        </div>
      )}
    </div>
  );
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

/* ── Modal ───────────────────────────────────────────────────── */
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
            Definir Metas — {mesLabel(mes)}
          </div>
          <button className="mc-modal-close" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Sugestão */}
        {(sugestao || loadingSug) && (
          <div className="mc-sug-box">
            <div className="mc-sug-row">
              <Sparkles size={13} style={{ color: CT.yellow }} />
              {loadingSug
                ? <span style={{ opacity: 0.6 }}>Calculando sugestão automática...</span>
                : <>
                    <span>Sugestão: média 3 meses +{sugestao.crescimento}%</span>
                    <button className="mc-sug-btn" onClick={aplicar}><Zap size={11} /> Aplicar</button>
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
                  <span key={h.mes} className="mc-sug-hist-item">{h.mes}: {fmtK(h.faturamento)}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mc-modal-body">
          <label className="mc-label"><DollarSign size={13} /> Faturamento (R$)</label>
          <input className="mc-input" type="number" min="0" step="100" placeholder="Ex: 150000"
            value={form.faturamento} onChange={e => setForm(f => ({ ...f, faturamento: e.target.value }))} />

          <label className="mc-label"><ShoppingCart size={13} /> Quantidade de Vendas</label>
          <input className="mc-input" type="number" min="0" step="1" placeholder="Ex: 5000"
            value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))} />

          <label className="mc-label"><BarChart2 size={13} /> Ticket Médio (R$)</label>
          <input className="mc-input" type="number" min="0" step="0.01" placeholder="Ex: 91.36"
            value={form.ticketMedio} onChange={e => setForm(f => ({ ...f, ticketMedio: e.target.value }))} />
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
    setEditando(true); setSugestao(null); setLoadingSug(true);
    try {
      const r = await apiFetch(`/api/planejamento/metas/sugestao?empresa=${empresa}&mes=${mes}`);
      if (r.ok) { const j = await r.json(); if (j.sugestao) setSugestao(j); }
    } catch (_) {}
    finally { setLoadingSug(false); }
  }

  async function saveMetas(vals) {
    await apiFetch('/api/planejamento/metas', {
      method: 'POST',
      body: JSON.stringify({ empresa, mes, ...vals }),
    });
    setEditando(false);
    loadData();
  }

  async function handleSaveSecao() {
    if (!novaSecao.secao || !novaSecao.faturamento) return;
    setSavingSecao(true);
    try {
      await apiFetch('/api/planejamento/metas/secao', {
        method: 'POST',
        body: JSON.stringify({ empresa, mes, secao: novaSecao.secao, faturamento: parseFloat(novaSecao.faturamento) }),
      });
      setNovaSecao({ secao: '', faturamento: '' }); setAddSecao(false); loadData();
    } finally { setSavingSecao(false); }
  }

  async function handleDeleteSecao(id) {
    await apiFetch(`/api/planejamento/metas/secao/${id}`, { method: 'DELETE' });
    loadData();
  }

  const {
    meta = {}, realizado = {}, progressoDiario = [],
    metasSecao = [], secoesDisponiveis = [],
    diasNoMes = 30, diasPassados = 0,
  } = data || {};

  const mesAtual             = getMesAtual();
  const somenteLeitura       = mes < mesAtual;   // meses passados: visualização apenas
  const pctMes               = diasNoMes > 0 ? (diasPassados / diasNoMes * 100) : 0;
  const secoesParaAdicionar  = secoesDisponiveis.filter(s => !metasSecao.some(m => m.secao === s));
  const temAlgunaMeta        = meta.faturamento != null || meta.quantidade != null || meta.ticketMedio != null;

  if (!empresa) return (
    <div className="pv-empty-state">
      <Target size={48} style={{ opacity: 0.3 }} />
      <p>Selecione uma empresa para acessar as metas.</p>
    </div>
  );

  return (
    <div className="mc2-root">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="mc2-header">

        {/* Seletor de período em pill */}
        <div className="mc2-period-pill">
          <button className="mc2-pill-arrow" onClick={() => setMes(m => addMes(m, -1))}>
            <ChevronLeft size={15} />
          </button>

          <div className="mc2-pill-center">
            <span className="mc2-pill-mes">{mesLabel(mes)}</span>
            <div className="mc2-pill-prog">
              <div className="mc2-pill-track">
                <div className="mc2-pill-fill" style={{ width: `${pctMes}%` }} />
              </div>
              <span className="mc2-pill-sub">{diasPassados}/{diasNoMes} dias · {pctMes.toFixed(0)}%</span>
            </div>
          </div>

          <button className="mc2-pill-arrow" onClick={() => setMes(m => addMes(m, 1))} disabled={mes >= mesAtual}>
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="mc2-header-right">
          {loading && <RefreshCw size={14} className="spin" style={{ color: CT.orange, opacity: 0.7 }} />}
          {error   && <span className="mc2-err-badge"><AlertTriangle size={13} /> {error}</span>}
          {somenteLeitura
            ? <span className="mc2-readonly-badge">Somente visualização</span>
            : <button className="mc2-btn-definir" onClick={openEdit}>
                <Target size={14} />
                {temAlgunaMeta ? 'Editar Metas' : 'Definir Metas'}
              </button>
          }
        </div>
      </div>

      {/* ── Banner quando sem meta ───────────────────────────── */}
      {!temAlgunaMeta && !loading && (
        <div className="mc2-empty-banner">
          <Target size={22} style={{ color: CT.orange, opacity: .7 }} />
          <div>
            <p className="mc2-empty-title">Nenhuma meta definida para {mesLabel(mes)}</p>
            <p className="mc2-empty-sub">
              {somenteLeitura
                ? 'Nenhuma meta foi cadastrada para este mês.'
                : 'Clique em "Definir Metas" para configurar faturamento, quantidade e ticket médio.'
              }
            </p>
          </div>
          {!somenteLeitura && (
            <button className="mc2-btn-definir" onClick={openEdit}>
              <Sparkles size={13} /> Começar agora
            </button>
          )}
        </div>
      )}

      {/* ── KPI Cards ────────────────────────────────────────── */}
      <div className="mc2-kpi-grid">
        <KpiCard titulo="Faturamento"  Icone={DollarSign}  cor={CT.orange} unidade="$"
          meta={meta.faturamento} realizado={realizado.faturamento || 0}
          diasPassados={diasPassados} diasNoMes={diasNoMes}
          onEdit={somenteLeitura ? null : openEdit} />
        <KpiCard titulo="Qtd Vendas"   Icone={ShoppingCart} cor={CT.blue}   unidade="n"
          meta={meta.quantidade}  realizado={realizado.quantidade  || 0}
          diasPassados={diasPassados} diasNoMes={diasNoMes}
          onEdit={somenteLeitura ? null : openEdit} />
        <KpiCard titulo="Ticket Médio" Icone={BarChart2}    cor={CT.purple} unidade="$"
          meta={meta.ticketMedio} realizado={realizado.ticketMedio || 0}
          diasPassados={diasPassados} diasNoMes={diasNoMes}
          onEdit={somenteLeitura ? null : openEdit} />
      </div>

      {/* ── Gráfico diário ───────────────────────────────────── */}
      {progressoDiario.length > 0 && (
        <div className="mc2-chart-card">
          <div className="mc2-chart-head">
            <TrendingUp size={14} style={{ color: CT.orange }} />
            <span>Evolução Diária — Faturamento Acumulado</span>
            {meta.faturamento && (
              <div className="mc2-chart-legend">
                <span><span className="mc2-dot" style={{ background: CT.orange }} /> Realizado</span>
                <span><span className="mc2-dash" style={{ background: CT.green }} /> Meta proporcional</span>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={progressoDiario} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={CT.orange} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={CT.orange} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false} />
              <XAxis dataKey="dia" tick={{ fill:'#6B7280', fontSize:11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill:'#6B7280', fontSize:11 }} tickLine={false} axisLine={false}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip content={<DailyTooltip />} />
              <Area type="monotone" dataKey="realizado" name="Realizado"
                stroke={CT.orange} strokeWidth={2.5} fill="url(#mcGrad)" />
              {meta.faturamento && (
                <Line type="monotone" dataKey="metaProporcional" name="Meta (ritmo)"
                  stroke={CT.green} strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Metas por Seção ──────────────────────────────────── */}
      <div className="mc2-secao-card">
        <div className="mc2-secao-head">
          <div className="mc2-secao-titulo">
            <BarChart2 size={14} style={{ color: CT.blue }} />
            <span>Metas por Seção</span>
            {metasSecao.length > 0 && (
              <span className="mc2-count-badge">{metasSecao.length}</span>
            )}
          </div>
          {!somenteLeitura && (
            <button className="mc2-btn-add" onClick={() => setAddSecao(v => !v)} disabled={addSecao && !secoesParaAdicionar.length}>
              <Plus size={13} /> Adicionar Seção
            </button>
          )}
        </div>

        {addSecao && !somenteLeitura && (
          <div className="mc2-add-row">
            <CustomSelect
              options={secoesParaAdicionar}
              value={novaSecao.secao}
              onChange={v => setNovaSecao(f => ({ ...f, secao: v }))}
              placeholder="Selecione a seção"
            />
            <input className="mc-input mc-input-sm" type="number" min="0" placeholder="Meta R$"
              value={novaSecao.faturamento}
              onChange={e => setNovaSecao(f => ({ ...f, faturamento: e.target.value }))} />
            <button className="mc-btn-save-sm" onClick={handleSaveSecao} disabled={savingSecao}>
              {savingSecao ? <RefreshCw size={12} className="spin" /> : <Save size={12} />}
            </button>
            <button className="mc-btn-cancel-sm" onClick={() => setAddSecao(false)}><X size={12} /></button>
          </div>
        )}

        {metasSecao.length === 0 && !addSecao ? (
          <div className="mc2-secao-empty">
            <p>Adicione metas por seção para acompanhar cada categoria separadamente.</p>
          </div>
        ) : (
          <div className="mc2-secao-list">
            {metasSecao.map(s => {
              const pct = s.progresso;
              const cor = progressColor(pct);
              return (
                <div key={s.id} className="mc2-secao-item">
                  <div className="mc2-secao-left">
                    <span className="mc2-secao-nome">{s.secao}</span>
                    <div className="mc2-secao-bar-wrap">
                      <div className="mc2-secao-track">
                        <div className="mc2-secao-fill" style={{ width: `${Math.min(100, pct || 0)}%`, background: cor }} />
                      </div>
                    </div>
                    <span className="mc2-secao-nums">{fmtR$(s.realizado)} / {fmtR$(s.meta)}</span>
                  </div>
                  <div className="mc2-secao-right">
                    <span className="mc2-secao-pct" style={{ color: cor }}>
                      {pct != null ? `${pct.toFixed(1)}%` : '—'}
                    </span>
                    {!somenteLeitura && (
                      <button className="mc2-secao-del" onClick={() => handleDeleteSecao(s.id)}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal ────────────────────────────────────────────── */}
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
