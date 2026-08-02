import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  Target, CheckCircle2, Clock, AlertTriangle, TrendingUp, Award, TrendingDown,
  ChevronDown, Bell, Plus,
} from 'lucide-react';
import { KpiCard, Button } from '../components/ui';
import MetaCard from '../components/metas/MetaCard';
import MetaFormModal from '../components/metas/MetaFormModal';
import MetaDetailModal from '../components/metas/MetaDetailModal';
import {
  TIPOS_META, CATEGORIAS_META, INDICADORES_POR_CATEGORIA, STATUS_META,
  RANKING_TIPOS, ALERTA_LABELS,
} from '../constants/metas';
import { CHART_COLORS } from '../theme/tokens';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

const number = new Intl.NumberFormat('pt-BR');

const KPI_ICON = { total: Target, concluidas: CheckCircle2, emAndamento: Clock, atrasadas: AlertTriangle };

const ALERT_ICON_VARIANT = {
  atingiu_100:     'info',
  ultrapassada:    'info',
  vencida:         'error',
  prazo_proximo:   'warning',
  abaixo_esperado: 'warning',
};

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--color-text)',
};

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function Metas({ empresa, user }) {
  const isAdmin = user?.perfil === 'admin';
  const currentUser = user?.nome || user?.usuario || 'Usuário';

  const [filtros, setFiltros] = useState({ tipo: '', categoria: '', indicador: '', status: '', responsavel: '' });
  const responsavelDebounced = useDebounced(filtros.responsavel, 400);

  const [page, setPage] = useState(1);
  const [lista, setLista] = useState({ data: [], total: 0, totalPages: 1 });
  const [todasMetas, setTodasMetas] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [rankingTipo, setRankingTipo] = useState('vendedores');
  const [ranking, setRanking] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState(null);
  const [detailMeta, setDetailMeta] = useState(null);

  const queryFiltros = useMemo(() => {
    const qs = new URLSearchParams({ empresa: empresa || '' });
    if (filtros.tipo)       qs.set('tipo', filtros.tipo);
    if (filtros.categoria)  qs.set('categoria', filtros.categoria);
    if (filtros.indicador)  qs.set('indicador', filtros.indicador);
    if (filtros.status)     qs.set('status', filtros.status);
    if (responsavelDebounced) qs.set('responsavel', responsavelDebounced);
    return qs;
  }, [empresa, filtros.tipo, filtros.categoria, filtros.indicador, filtros.status, responsavelDebounced]);

  const carregar = useCallback(async (opts = {}) => {
    if (!empresa) return;
    if (!opts.silent) setLoading(true);
    try {
      const listaQs = new URLSearchParams(queryFiltros); listaQs.set('page', page); listaQs.set('perPage', 12);
      const todasQs = new URLSearchParams(queryFiltros); todasQs.set('perPage', 50);

      const [listaRes, todasRes, kpisRes, rankingRes, notifRes] = await Promise.all([
        fetch(`${API_URL}/api/metas?${listaQs}`).then(r => r.json()),
        fetch(`${API_URL}/api/metas?${todasQs}`).then(r => r.json()),
        fetch(`${API_URL}/api/metas/resumo?empresa=${empresa}`).then(r => r.json()),
        fetch(`${API_URL}/api/metas/ranking?empresa=${empresa}&tipo=${rankingTipo}`).then(r => r.json()),
        fetch(`${API_URL}/api/metas/notificacoes?empresa=${empresa}`).then(r => r.json()),
      ]);

      if (listaRes && Array.isArray(listaRes.data)) setLista(listaRes);
      if (todasRes && Array.isArray(todasRes.data)) setTodasMetas(todasRes.data);
      if (kpisRes && !kpisRes.error) setKpis(kpisRes);
      if (Array.isArray(rankingRes)) setRanking(rankingRes);
      if (Array.isArray(notifRes)) setNotificacoes(notifRes);
    } catch {
      // silencioso — mantém último estado válido na tela
    } finally {
      if (!opts.silent) setLoading(false);
    }
  }, [empresa, queryFiltros, page, rankingTipo]);

  useEffect(() => { carregar(); }, [carregar]);

  // Atualização leve em segundo plano, só com a aba visível
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') carregar({ silent: true });
    }, 30000);
    return () => clearInterval(id);
  }, [carregar]);

  useEffect(() => { setPage(1); }, [filtros.tipo, filtros.categoria, filtros.indicador, filtros.status, responsavelDebounced]);

  async function abrirDetalhe(meta) {
    try {
      const full = await fetch(`${API_URL}/api/metas/${meta.id}`).then(r => r.json());
      setDetailMeta(full);
    } catch {
      setDetailMeta(meta);
    }
  }

  async function handleSalvar(form) {
    const payload = { ...form, empresaId: empresa, usuario: currentUser };
    const url = editingMeta ? `${API_URL}/api/metas/${editingMeta.id}` : `${API_URL}/api/metas`;
    const method = editingMeta ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao salvar meta.');
    setFormOpen(false);
    setEditingMeta(null);
    carregar();
  }

  async function handleExcluir(meta) {
    if (!window.confirm(`Excluir a meta "${meta.nome}"? Essa ação não pode ser desfeita.`)) return;
    await fetch(`${API_URL}/api/metas/${meta.id}`, { method: 'DELETE' });
    setDetailMeta(null);
    carregar();
  }

  async function handleLancarResultado(payload) {
    const res = await fetch(`${API_URL}/api/metas/${detailMeta.id}/resultados`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, usuario: currentUser }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao lançar resultado.');
    await abrirDetalhe(detailMeta);
    carregar({ silent: true });
  }

  async function handleComentar(texto) {
    await fetch(`${API_URL}/api/metas/${detailMeta.id}/comentarios`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: currentUser, texto }),
    });
    await abrirDetalhe(detailMeta);
  }

  async function handleMarcarLida(notif) {
    await fetch(`${API_URL}/api/metas/notificacoes/${notif.metaId}/${notif.tipo}/lida`, { method: 'PATCH' });
    setNotificacoes(prev => prev.map(n => (n.metaId === notif.metaId && n.tipo === notif.tipo) ? { ...n, lida: true } : n));
  }

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  const statusDist = useMemo(() => {
    const counts = {};
    for (const s of STATUS_META) counts[s] = 0;
    for (const m of todasMetas) counts[m.status] = (counts[m.status] || 0) + 1;
    return STATUS_META.map(s => ({ status: s, total: counts[s] }));
  }, [todasMetas]);

  const metaVsRealizado = useMemo(() => (
    [...todasMetas]
      .sort((a, b) => b.valorMeta - a.valorMeta)
      .slice(0, 8)
      .map(m => ({ nome: m.nome.length > 16 ? `${m.nome.slice(0, 16)}…` : m.nome, Meta: m.valorMeta, Realizado: m.valorAtual }))
  ), [todasMetas]);

  const indicadoresFiltro = filtros.categoria ? (INDICADORES_POR_CATEGORIA[filtros.categoria] || []) : [];

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="section-title">Gestão de Metas</div>
          <div className="section-sub">Acompanhe objetivos, desempenho e resultados em tempo real</div>
        </div>
        {isAdmin && (
          <Button variant="primary" onClick={() => { setEditingMeta(null); setFormOpen(true); }}>
            <Plus size={15} style={{ marginRight: 6, verticalAlign: -2 }} /> Nova Meta
          </Button>
        )}
      </div>

      {!empresa ? (
        <p className="chart-empty">Selecione uma empresa para ver as metas.</p>
      ) : (
        <>
          <div className="kpi-grid">
            <KpiCard icon={KPI_ICON.total}       label="Total de metas"      value={kpis ? number.format(kpis.total) : '—'} />
            <KpiCard icon={KPI_ICON.concluidas}  label="Concluídas"          value={kpis ? number.format(kpis.concluidas) : '—'} />
            <KpiCard icon={KPI_ICON.emAndamento} label="Em andamento"        value={kpis ? number.format(kpis.emAndamento) : '—'} />
            <KpiCard icon={KPI_ICON.atrasadas}   label="Atrasadas"           value={kpis ? number.format(kpis.atrasadas) : '—'} />
            <KpiCard icon={TrendingUp}           label="Média de cumprimento" value={kpis ? `${kpis.mediaCumprimento}%` : '—'} />
            <KpiCard icon={Award}                label="Melhor desempenho"   value={kpis?.melhorDesempenho ? `${kpis.melhorDesempenho.percentual}%` : '—'} sub={kpis?.melhorDesempenho?.nome} />
            <KpiCard icon={TrendingDown}          label="Pior desempenho"     value={kpis?.piorDesempenho ? `${kpis.piorDesempenho.percentual}%` : '—'} sub={kpis?.piorDesempenho?.nome} />
          </div>

          <div className="chart-grid">
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-card-title">Meta × Realizado</div>
                <div className="chart-card-desc">Comparativo das principais metas do período</div>
              </div>
              {metaVsRealizado.length === 0 ? <p className="chart-empty">Sem metas cadastradas.</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={metaVsRealizado}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="nome" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} width={60} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Meta" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Realizado" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-card-title">Metas por status</div>
                <div className="chart-card-desc">Distribuição atual de todas as metas</div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statusDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="status" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="total" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="chart-card-title">Ranking</div>
                  <div className="chart-card-desc">Top 10 por percentual de cumprimento</div>
                </div>
                <select value={rankingTipo} onChange={e => setRankingTipo(e.target.value)}
                  style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 9, padding: '6px 10px', fontSize: 12, color: 'var(--color-text)' }}>
                  {RANKING_TIPOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {ranking.length === 0 ? <p className="chart-empty">Sem dados para esse ranking ainda.</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={ranking} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                    <YAxis type="category" dataKey="nome" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} width={100} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
                    <Bar dataKey="percentual" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="notif-panel">
            <button className="notif-panel-header" onClick={() => setNotifOpen(o => !o)}>
              <span className="notif-panel-title">
                <Bell size={15} />
                Alertas
                {naoLidas > 0 && <span className="notif-count">{naoLidas}</span>}
              </span>
              <ChevronDown size={16} className={`notif-panel-chevron${notifOpen ? ' open' : ''}`} />
            </button>
            {notifOpen && (
              notificacoes.length === 0 ? (
                <p className="notif-empty">Nenhum alerta no momento.</p>
              ) : (
                <div className="notif-list">
                  {notificacoes.map(n => (
                    <div key={`${n.metaId}-${n.tipo}`} className={`notif-item${n.lida ? '' : ' unread'}`} onClick={() => handleMarcarLida(n)}>
                      <AlertTriangle size={15} className={`notif-item-icon--${ALERT_ICON_VARIANT[n.tipo] || 'warning'}`} />
                      <div className="notif-item-text">
                        {n.metaNome}
                        <div className="notif-item-meta">{ALERTA_LABELS[n.tipo] || n.tipo}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          <div className="metas-filter-bar">
            <select value={filtros.tipo} onChange={e => setFiltros(f => ({ ...f, tipo: e.target.value }))}>
              <option value="">Todos os tipos</option>
              {TIPOS_META.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={filtros.categoria} onChange={e => setFiltros(f => ({ ...f, categoria: e.target.value, indicador: '' }))}>
              <option value="">Todas as categorias</option>
              {CATEGORIAS_META.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filtros.indicador} onChange={e => setFiltros(f => ({ ...f, indicador: e.target.value }))} disabled={!filtros.categoria}>
              <option value="">Todos os indicadores</option>
              {indicadoresFiltro.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
            <select value={filtros.status} onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))}>
              <option value="">Todos os status</option>
              {STATUS_META.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="text" placeholder="Buscar por responsável…" value={filtros.responsavel} onChange={e => setFiltros(f => ({ ...f, responsavel: e.target.value }))} />
          </div>

          {loading ? (
            <p className="chart-empty">Carregando…</p>
          ) : lista.data.length === 0 ? (
            <p className="chart-empty">Nenhuma meta encontrada com esses filtros.</p>
          ) : (
            <div className="meta-grid">
              {lista.data.map(m => <MetaCard key={m.id} meta={m} onClick={abrirDetalhe} />)}
            </div>
          )}

          {lista.totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>‹</button>
              {Array.from({ length: lista.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => Math.min(lista.totalPages, p + 1))} disabled={page >= lista.totalPages}>›</button>
            </div>
          )}
        </>
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
          isAdmin={isAdmin}
          currentUser={currentUser}
          onClose={() => setDetailMeta(null)}
          onEdit={(meta) => { setDetailMeta(null); setEditingMeta(meta); setFormOpen(true); }}
          onDelete={handleExcluir}
          onLancarResultado={handleLancarResultado}
          onComentar={handleComentar}
        />
      )}
    </main>
  );
}
