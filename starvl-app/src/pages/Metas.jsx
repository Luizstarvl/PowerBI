import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Target, TrendingUp, Zap, Flag } from 'lucide-react';
import MetaFormModal  from '../components/metas/MetaFormModal';
import MetaDetailModal from '../components/metas/MetaDetailModal';
import {
  TIPOS_META, STATUS_META, CATEGORIAS_META,
  INDICADORES_POR_CATEGORIA, indicadorLabel,
} from '../constants/metas';

import { apiFetch } from '../api';

/* ── Formatadores ──────────────────────────────────────────────────────────── */
const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

function fmtPeriodo(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const mes  = d.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' });
    const ano  = d.getUTCFullYear();
    return `${mes.charAt(0).toUpperCase() + mes.slice(1).replace('.', '')}/${ano}`;
  } catch { return '—'; }
}

/* ── Opções de filtro ──────────────────────────────────────────────────────── */
const TIPO_OPTS = [
  { value: '', label: 'Todos' },
  ...TIPOS_META,
];
const STATUS_OPTS = [
  { value: '', label: 'Todos' },
  ...STATUS_META.map(s => ({ value: s, label: s })),
];
const CATEGORIA_OPTS = [
  { value: '', label: 'Todos' },
  ...CATEGORIAS_META.map(c => ({ value: c, label: c })),
];
function anoOpts() {
  const ano = new Date().getFullYear();
  return [{ value: '', label: 'Ano' }, ...Array.from({ length: 5 }, (_, i) => ({ value: String(ano - i), label: String(ano - i) }))];
}
function mesOpts() {
  const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return [{ value: '', label: 'Mês' }, ...nomes.map((n, i) => ({ value: String(i + 1).padStart(2, '0'), label: n }))];
}
const ANO_OPTS = anoOpts();
const MES_OPTS = mesOpts();
const PER_PAGE_OPTS = [10, 25, 50, 100];

const FILTRO_VAZIO = { tipo: '', indicador: '', categoria: '', ano: '', mes: '', status: '', responsavel: '' };

/* ── StatusBadge ───────────────────────────────────────────────────────────── */
const STATUS_CFG = {
  'Concluída':    { dot: '#22C55E', bg: 'rgba(34,197,94,.10)',   text: '#16A34A', label: 'Atingida'       },
  'Em andamento': { dot: '#F59E0B', bg: 'rgba(245,158,11,.10)',  text: '#B45309', label: 'Em andamento'   },
  'Não iniciada': { dot: '#94A3B8', bg: 'rgba(148,163,184,.10)', text: '#64748B', label: 'Não iniciada'   },
  'Atrasada':     { dot: '#EF4444', bg: 'rgba(239,68,68,.10)',   text: '#DC2626', label: 'Abaixo da meta' },
  'Cancelada':    { dot: '#6B7280', bg: 'rgba(107,114,128,.10)', text: '#4B5563', label: 'Cancelada'      },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG['Não iniciada'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.text,
      padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

/* ── BarraPercentual ───────────────────────────────────────────────────────── */
function BarraPercentual({ pct }) {
  const clamped = Math.min(pct, 100);
  const cor = pct >= 100 ? '#22C55E' : pct >= 75 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--border, rgba(255,255,255,.1))', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${clamped}%`, height: '100%', background: cor, borderRadius: 4, transition: 'width .3s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: cor, minWidth: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

/* ── KPI Card ──────────────────────────────────────────────────────────────── */
function KpiMeta({ icon: Icon, label, value, sub, progress }) {
  return (
    <div className="mgt-kpi-card">
      <div className="kpi-card-icon">
        {Icon && <Icon size={18} strokeWidth={2} />}
      </div>
      <div className="mgt-kpi-content">
        <div className="mgt-kpi-label">{label}</div>
        <div className="mgt-kpi-value">{value}</div>
        {progress != null && (
          <div style={{ marginTop: 6 }}>
            <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 4, transition: 'width .4s' }} />
            </div>
          </div>
        )}
        <div className="mgt-kpi-sub">{sub}</div>
      </div>
    </div>
  );
}

/* ── Context Menu Ações ────────────────────────────────────────────────────── */
function AcoesMenu({ meta, onVer, onEditar, onExcluir, onClose }) {
  const ref = React.useRef(null);
  useEffect(() => {
    const onDown = e => { if (!ref.current?.contains(e.target)) onClose(); };
    const onKey  = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown',   onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [onClose]);
  return (
    <div ref={ref} className="ctx-menu" style={{ position: 'fixed', zIndex: 500 }}>
      <button className="ctx-item" onClick={() => { onVer(); onClose(); }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Ver detalhe
      </button>
      <button className="ctx-item" onClick={() => { onEditar(); onClose(); }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Alterar
      </button>
      <div className="ctx-divider" />
      <button className="ctx-item danger" onClick={() => { onExcluir(); onClose(); }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        Excluir
      </button>
    </div>
  );
}

/* ── Componente principal ──────────────────────────────────────────────────── */
export default function Metas({ empresa, empresaNome, user, onNavigate }) {
  const isAdmin    = user?.perfil === 'admin';
  const canEdit    = isAdmin || user?.permissoes?.modo === 'completo';
  const currentUser = user?.nome || user?.usuario || '';

  /* estado de filtros — pending (editando) vs aplicado (busca ativa) */
  const [pending,  setPending]  = useState({ ...FILTRO_VAZIO });
  const [filtros,  setFiltros]  = useState({ ...FILTRO_VAZIO });
  const [page,     setPage]     = useState(1);
  const [perPage,  setPerPage]  = useState(10);
  const [lista,    setLista]    = useState({ data: [], total: 0, totalPages: 1 });
  const [kpis,     setKpis]     = useState(null);
  const [loading,  setLoading]  = useState(false);

  const [formOpen,     setFormOpen]     = useState(false);
  const [editingMeta,  setEditingMeta]  = useState(null);
  const [detailMeta,   setDetailMeta]   = useState(null);
  const [acoesMeta,    setAcoesMeta]    = useState(null); /* { meta, x, y } */

  /* indicadores filtrados por categoria */
  const indicOpts = useMemo(() => {
    const lista = pending.categoria ? (INDICADORES_POR_CATEGORIA[pending.categoria] || []) : [];
    return [{ value: '', label: 'Todos' }, ...lista];
  }, [pending.categoria]);

  /* monta querystring de filtros aplicados */
  const qs = useMemo(() => {
    const p = new URLSearchParams({ empresa: empresa || '' });
    if (filtros.tipo)       p.set('tipo', filtros.tipo);
    if (filtros.indicador)  p.set('indicador', filtros.indicador);
    if (filtros.status)     p.set('status', filtros.status);
    if (filtros.responsavel) p.set('responsavel', filtros.responsavel);
    if (filtros.ano && filtros.mes) p.set('periodo', `${filtros.ano}-${filtros.mes}`);
    return p;
  }, [empresa, filtros]);

  const carregar = useCallback(async (opts = {}) => {
    if (!empresa) return;
    if (!opts.silent) setLoading(true);
    try {
      const listaQs = new URLSearchParams(qs);
      listaQs.set('page', page);
      listaQs.set('perPage', perPage);

      const [listaRes, kpisRes] = await Promise.all([
        apiFetch(`/api/metas?${listaQs}`).then(r => r.json()),
        apiFetch(`/api/metas/resumo?empresa=${empresa}`).then(r => r.json()),
      ]);

      if (listaRes?.data) setLista(listaRes);
      if (kpisRes && !kpisRes.error) setKpis(kpisRes);
    } catch { /* mantém último estado */ }
    finally { if (!opts.silent) setLoading(false); }
  }, [empresa, qs, page, perPage]);

  useEffect(() => { carregar(); }, [carregar]);

  /* reseta página ao aplicar filtros */
  function aplicarFiltros() { setFiltros({ ...pending }); setPage(1); }
  function limparFiltros()   { const z = { ...FILTRO_VAZIO }; setPending(z); setFiltros(z); setPage(1); }

  async function abrirDetalhe(meta) {
    try {
      const full = await apiFetch(`/api/metas/${meta.id}`).then(r => r.json());
      setDetailMeta(full);
    } catch { setDetailMeta(meta); }
  }

  async function handleSalvar(form) {
    const payload = { ...form, empresaId: empresa, usuario: currentUser };
    const url    = editingMeta ? `/api/metas/${editingMeta.id}` : `/api/metas`;
    const method = editingMeta ? 'PUT' : 'POST';
    const res  = await apiFetch(url, { method, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao salvar.');
    setFormOpen(false); setEditingMeta(null); carregar();
  }

  async function handleExcluir(meta) {
    if (!window.confirm(`Excluir a meta "${meta.nome}"?`)) return;
    await apiFetch(`/api/metas/${meta.id}`, { method: 'DELETE' });
    setDetailMeta(null); setAcoesMeta(null); carregar();
  }

  async function handleLancarResultado(payload) {
    const res  = await apiFetch(`/api/metas/${detailMeta.id}/resultados`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, usuario: currentUser }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao lançar resultado.');
    await abrirDetalhe(detailMeta);
    carregar({ silent: true });
  }

  async function handleComentar(texto) {
    await apiFetch(`/api/metas/${detailMeta.id}/comentarios`, {
      method: 'POST',
      body: JSON.stringify({ usuario: currentUser, texto }),
    });
    await abrirDetalhe(detailMeta);
  }

  function handleExportar() {
    const cabecalho = ['Empresa','Posto','Indicador','Meta','Realizado','%','Responsável','Status','Período'];
    const linhas = lista.data.map(m => [
      empresaNome || '',
      m.referencia || '',
      indicadorLabel(m.categoria, m.indicador),
      m.valorMeta.toFixed(2),
      m.valorAtual.toFixed(2),
      m.percentual.toFixed(1) + '%',
      m.responsavel || '',
      m.status || '',
      fmtPeriodo(m.dataFinal),
    ]);
    const csv = [cabecalho, ...linhas].map(r => r.join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `metas-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  function openAcoes(e, meta) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setAcoesMeta({ meta, x: rect.right - 160, y: rect.bottom + 4 });
  }

  /* paginação */
  const from  = lista.total === 0 ? 0 : (page - 1) * perPage + 1;
  const to    = Math.min(page * perPage, lista.total);
  const pages = Array.from({ length: Math.min(lista.totalPages, 5) }, (_, i) => {
    const half  = 2;
    const start = Math.max(1, Math.min(page - half, lista.totalPages - 4));
    return start + i;
  }).filter(p => p >= 1 && p <= lista.totalPages);

  /* ── metas ativas = total excluindo canceladas e concluídas */
  const metasAtivas = kpis
    ? (kpis.total || 0) - (kpis.canceladas || 0) - (kpis.concluidas || 0)
    : null;

  return (
    <main className="dashboard">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mgt-header">
        <div>
          <h2 className="mgt-title">Gerenciamento de Metas</h2>
          <p className="mgt-subtitle">Acompanhe o desempenho das metas e alcance melhores resultados.</p>
        </div>
        <div className="mgt-header-btns">
          <button className="mgt-btn-export" onClick={handleExportar}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar
          </button>
          {canEdit && (
            <button className="btn-primary" onClick={() => { setEditingMeta(null); setFormOpen(true); }}>
              + Nova Meta
            </button>
          )}
        </div>
      </div>

      {!empresa ? (
        <div className="metas-empty-state">
          <p>Selecione uma empresa para visualizar as metas.</p>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ──────────────────────────────────────────────── */}
          <div className="mgt-kpi-grid">
            <KpiMeta
              icon={Target}
              label="META TOTAL"
              value={kpis ? fmtBRL.format(kpis.valorTotalMetas || 0) : '—'}
              sub="Total das metas no período"
            />
            <KpiMeta
              icon={TrendingUp}
              label="REALIZADO"
              value={kpis ? fmtBRL.format(kpis.valorTotalAtual || 0) : '—'}
              sub="Total realizado no período"
            />
            <KpiMeta
              icon={Zap}
              label="ATINGIMENTO"
              value={kpis ? `${(kpis.mediaCumprimento || 0).toFixed(1)}%` : '—'}
              progress={kpis?.mediaCumprimento}
              sub="Percentual de atingimento"
            />
            <KpiMeta
              icon={Flag}
              label="METAS ATIVAS"
              value={metasAtivas != null ? String(metasAtivas) : '—'}
              sub="Total de metas ativas"
            />
          </div>

          {/* ── Filtros ────────────────────────────────────────────────── */}
          <div className="mgt-filter-card">
            <div className="mgt-filter-row">

              <div className="mgt-filter-group">
                <label>Empresa</label>
                <select value="" disabled>
                  <option>{empresaNome || 'Empresa'}</option>
                </select>
              </div>

              <div className="mgt-filter-group">
                <label>Posto / Tipo</label>
                <select value={pending.tipo} onChange={e => setPending(p => ({ ...p, tipo: e.target.value }))}>
                  {TIPO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="mgt-filter-group">
                <label>Categoria</label>
                <select value={pending.categoria} onChange={e => setPending(p => ({ ...p, categoria: e.target.value, indicador: '' }))}>
                  {CATEGORIA_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="mgt-filter-group">
                <label>Indicador</label>
                <select value={pending.indicador} onChange={e => setPending(p => ({ ...p, indicador: e.target.value }))} disabled={!pending.categoria}>
                  {indicOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="mgt-filter-group mgt-filter-group--sm">
                <label>Ano</label>
                <select value={pending.ano} onChange={e => setPending(p => ({ ...p, ano: e.target.value }))}>
                  {ANO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="mgt-filter-group mgt-filter-group--sm">
                <label>Mês</label>
                <select value={pending.mes} onChange={e => setPending(p => ({ ...p, mes: e.target.value }))}>
                  {MES_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="mgt-filter-group">
                <label>Status</label>
                <select value={pending.status} onChange={e => setPending(p => ({ ...p, status: e.target.value }))}>
                  {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="mgt-filter-group">
                <label>Responsável</label>
                <input
                  type="text"
                  placeholder="Todos"
                  value={pending.responsavel}
                  onChange={e => setPending(p => ({ ...p, responsavel: e.target.value }))}
                />
              </div>

            </div>
            <div className="mgt-filter-actions">
              <button className="mgt-btn-limpar" onClick={limparFiltros}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.73"/></svg>
                Limpar
              </button>
              <button className="mgt-btn-aplicar" onClick={aplicarFiltros}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="6" x2="2" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" strokeLinecap="round"/></svg>
                Aplicar filtros
              </button>
            </div>
          </div>

          {/* ── Tabela ─────────────────────────────────────────────────── */}
          <div className="mgt-table-card">
            <div className="mgt-table-wrap">
              {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted, #6B7280)', fontSize: 14 }}>Carregando…</div>
              ) : (
                <table className="mgt-table">
                  <thead>
                    <tr>
                      <th>EMPRESA</th>
                      <th>POSTO</th>
                      <th>INDICADOR</th>
                      <th style={{ textAlign: 'right' }}>META (R$)</th>
                      <th style={{ textAlign: 'right' }}>REALIZADO (R$)</th>
                      <th style={{ minWidth: 140 }}>%</th>
                      <th>RESPONSÁVEL</th>
                      <th>STATUS</th>
                      <th>PERÍODO</th>
                      <th style={{ textAlign: 'center', width: 52 }}>AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.data.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted, #6B7280)', fontSize: 14 }}>
                          Nenhuma meta encontrada
                        </td>
                      </tr>
                    ) : lista.data.map(m => (
                      <tr key={m.id} className="mgt-tr" onDoubleClick={() => abrirDetalhe(m)}>
                        <td className="mgt-td-empresa">{empresaNome || '—'}</td>
                        <td className="mgt-td-ref">{m.referencia || m.tipo || '—'}</td>
                        <td className="mgt-td-indicador">{indicadorLabel(m.categoria, m.indicador)}</td>
                        <td className="mgt-td-num">{fmtBRL.format(m.valorMeta)}</td>
                        <td className="mgt-td-num">{fmtBRL.format(m.valorAtual)}</td>
                        <td><BarraPercentual pct={m.percentual} /></td>
                        <td className="mgt-td-resp">{m.responsavel || '—'}</td>
                        <td><StatusBadge status={m.status} /></td>
                        <td className="mgt-td-periodo">{fmtPeriodo(m.dataFinal)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="mgt-acoes-btn" onClick={e => openAcoes(e, m)} title="Ações">
                            <span>⋮</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── Paginação ────────────────────────────────────────────── */}
            {lista.total > 0 && (
              <div className="mgt-pagination">
                <span className="mgt-pag-info">
                  Mostrando {from} a {to} de {lista.total} registros
                </span>
                <div className="mgt-pag-btns">
                  <button className="mgt-pag-btn" onClick={() => setPage(1)}  disabled={page <= 1}>«</button>
                  <button className="mgt-pag-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>‹</button>
                  {pages.map(p => (
                    <button key={p} className={`mgt-pag-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  ))}
                  <button className="mgt-pag-btn" onClick={() => setPage(p => Math.min(lista.totalPages, p + 1))} disabled={page >= lista.totalPages}>›</button>
                  <button className="mgt-pag-btn" onClick={() => setPage(lista.totalPages)} disabled={page >= lista.totalPages}>»</button>
                </div>
                <div className="mgt-pag-perpage">
                  <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}>
                    {PER_PAGE_OPTS.map(n => <option key={n} value={n}>{n} por página</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Context menu ações ─────────────────────────────────────────── */}
      {acoesMeta && (
        <div style={{ position: 'fixed', left: acoesMeta.x, top: acoesMeta.y, zIndex: 500 }}>
          <AcoesMenu
            meta={acoesMeta.meta}
            onVer={() => abrirDetalhe(acoesMeta.meta)}
            onEditar={() => { setEditingMeta(acoesMeta.meta); setFormOpen(true); }}
            onExcluir={() => handleExcluir(acoesMeta.meta)}
            onClose={() => setAcoesMeta(null)}
          />
        </div>
      )}

      {formOpen && (
        <MetaFormModal
          meta={editingMeta}
          onClose={() => { setFormOpen(false); setEditingMeta(null); }}
          onSave={handleSalvar}
        />
      )}

      {detailMeta && (
        <MetaDetailModal
          meta={detailMeta}
          isAdmin={canEdit}
          currentUser={currentUser}
          onClose={() => setDetailMeta(null)}
          onEdit={meta => { setDetailMeta(null); setEditingMeta(meta); setFormOpen(true); }}
          onDelete={handleExcluir}
          onLancarResultado={handleLancarResultado}
          onComentar={handleComentar}
        />
      )}
    </main>
  );
}
