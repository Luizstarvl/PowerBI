import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis, LineChart, Line,
} from 'recharts';
import {
  Target, CheckCircle2, Clock, AlertTriangle, TrendingUp, DollarSign, Plus,
  ChevronDown, SlidersHorizontal, BarChart3, Crown, CalendarClock,
  LayoutGrid, Trophy, TrendingDown,
} from 'lucide-react';
import { KpiCard, Button, Select, CountUp } from '../components/ui';
import MetaTable from '../components/metas/MetaTable';
import MetaFormModal from '../components/metas/MetaFormModal';
import MetaDetailModal from '../components/metas/MetaDetailModal';
import {
  TIPOS_META, CATEGORIAS_META, INDICADORES_POR_CATEGORIA, STATUS_META,
  RANKING_TIPOS, STATUS_COLOR_VAR,
} from '../constants/metas';
import { CHART_COLORS } from '../theme/tokens';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

const currencyCompact = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--color-text)',
};

const FILTRO_TIPO_OPTS      = [{ value: '', label: 'Todos os tipos' },      ...TIPOS_META];
const FILTRO_CATEGORIA_OPTS = [{ value: '', label: 'Todas as categorias' }, ...CATEGORIAS_META.map(c => ({ value: c, label: c }))];
const FILTRO_STATUS_OPTS    = [{ value: '', label: 'Todos os status' },     ...STATUS_META.map(s => ({ value: s, label: s }))];

function periodoOpts(n = 12) {
  const now = new Date();
  const opts = [{ value: '', label: 'Todos os períodos' }];
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear(), mm = String(d.getMonth() + 1).padStart(2, '0');
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    opts.push({ value: `${yyyy}-${mm}`, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return opts;
}
const PERIODO_OPTS = periodoOpts();

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function mesLabel(mes) {
  const [ano, mesNum] = mes.split('-');
  const d = new Date(Date.UTC(parseInt(ano), parseInt(mesNum) - 1, 1));
  const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' });
  return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '');
}

// Comparação com o mesmo bloco { atual, anterior } que a API devolve —
// null quando não há base de comparação (mês anterior sem dados).
function trendFrom(comp) {
  if (!comp || !comp.anterior) return null;
  const delta = ((comp.atual - comp.anterior) / comp.anterior) * 100;
  return { positive: delta >= 0, text: `${delta >= 0 ? '+' : ''}${Math.round(delta)}% vs mês anterior` };
}

function diasAte(data) {
  return Math.ceil((new Date(data) - new Date()) / 86400000);
}

export default function Metas({ empresa, empresaNome, user, onNavigate }) {
  const isAdmin = user?.perfil === 'admin';
  const currentUser = user?.nome || user?.usuario || 'Usuário';

  const [filtros, setFiltros] = useState({ tipo: '', categoria: '', indicador: '', status: '', responsavel: '', periodo: '' });
  const responsavelDebounced = useDebounced(filtros.responsavel, 400);
  const [filtrosOpen, setFiltrosOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [lista, setLista] = useState({ data: [], total: 0, totalPages: 1 });
  const [todasMetas, setTodasMetas] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [rankingTipo, setRankingTipo] = useState('responsaveis');
  const [ranking, setRanking] = useState([]);
  const [rankingResponsaveis, setRankingResponsaveis] = useState([]);
  const [evolucao, setEvolucao] = useState([]);
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
    if (filtros.periodo)    qs.set('periodo', filtros.periodo);
    if (responsavelDebounced) qs.set('responsavel', responsavelDebounced);
    return qs;
  }, [empresa, filtros.tipo, filtros.categoria, filtros.indicador, filtros.status, filtros.periodo, responsavelDebounced]);

  const carregar = useCallback(async (opts = {}) => {
    if (!empresa) return;
    if (!opts.silent) setLoading(true);
    try {
      const listaQs = new URLSearchParams(queryFiltros); listaQs.set('page', page); listaQs.set('perPage', 12);
      const todasQs = new URLSearchParams(queryFiltros); todasQs.set('perPage', 50);

      const [listaRes, todasRes, kpisRes, rankingRes, rankingRespRes, evolucaoRes] = await Promise.all([
        fetch(`${API_URL}/api/metas?${listaQs}`).then(r => r.json()),
        fetch(`${API_URL}/api/metas?${todasQs}`).then(r => r.json()),
        fetch(`${API_URL}/api/metas/resumo?empresa=${empresa}`).then(r => r.json()),
        fetch(`${API_URL}/api/metas/ranking?empresa=${empresa}&tipo=${rankingTipo}`).then(r => r.json()),
        fetch(`${API_URL}/api/metas/ranking?empresa=${empresa}&tipo=responsaveis`).then(r => r.json()),
        fetch(`${API_URL}/api/metas/evolucao?empresa=${empresa}&meses=6`).then(r => r.json()),
      ]);

      if (listaRes && Array.isArray(listaRes.data)) setLista(listaRes);
      if (todasRes && Array.isArray(todasRes.data)) setTodasMetas(todasRes.data);
      if (kpisRes && !kpisRes.error) setKpis(kpisRes);
      if (Array.isArray(rankingRes)) setRanking(rankingRes);
      if (Array.isArray(rankingRespRes)) setRankingResponsaveis(rankingRespRes);
      if (Array.isArray(evolucaoRes)) setEvolucao(evolucaoRes.map(e => ({ ...e, mesLabel: mesLabel(e.mes) })));
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

  useEffect(() => { setPage(1); }, [filtros.tipo, filtros.categoria, filtros.indicador, filtros.status, filtros.periodo, responsavelDebounced]);

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

  const statusDist = useMemo(() => {
    const counts = {};
    for (const s of STATUS_META) counts[s] = 0;
    for (const m of todasMetas) counts[m.status] = (counts[m.status] || 0) + 1;
    return STATUS_META.map(s => ({ status: s, total: counts[s] })).filter(s => s.total > 0);
  }, [todasMetas]);

  const porDepartamento = useMemo(() => {
    const grupos = {};
    todasMetas.forEach(m => {
      if (!grupos[m.categoria]) grupos[m.categoria] = { categoria: m.categoria, soma: 0, count: 0 };
      grupos[m.categoria].soma += m.percentual;
      grupos[m.categoria].count += 1;
    });
    return Object.values(grupos)
      .map(g => ({ categoria: g.categoria, percentual: Math.round((g.soma / g.count) * 10) / 10 }))
      .sort((a, b) => b.percentual - a.percentual);
  }, [todasMetas]);

  const abertas = useMemo(() => todasMetas.filter(m => !['Concluída', 'Cancelada'].includes(m.status)), [todasMetas]);
  const alertasVencidas  = useMemo(() => todasMetas.filter(m => m.status === 'Atrasada').sort((a, b) => new Date(a.dataFinal) - new Date(b.dataFinal)), [todasMetas]);
  const alertasVencendo  = useMemo(() => abertas.filter(m => { const d = diasAte(m.dataFinal); return d >= 0 && d <= 7; }).sort((a, b) => new Date(a.dataFinal) - new Date(b.dataFinal)), [abertas]);
  const alertasConcluidasRecentes = useMemo(() => todasMetas
    .filter(m => m.status === 'Concluída' && (Date.now() - new Date(m.atualizado)) < 14 * 86400000)
    .sort((a, b) => new Date(b.atualizado) - new Date(a.atualizado)), [todasMetas]);
  const alertasAbaixo50 = useMemo(() => abertas.filter(m => m.percentual < 50).sort((a, b) => a.percentual - b.percentual), [abertas]);

  // "Vence em breve" só faz sentido pra prazos que ainda não passaram — uma
  // meta atrasada já venceu, não está "próxima do vencimento".
  const metaProximaVencimento = useMemo(() => {
    const pendentes = abertas.filter(m => m.status !== 'Atrasada');
    return pendentes.length ? [...pendentes].sort((a, b) => new Date(a.dataFinal) - new Date(b.dataFinal))[0] : null;
  }, [abertas]);
  const topResponsavel = rankingResponsaveis[0] || null;
  const deptoMelhor = porDepartamento[0] || null;
  const deptoPior   = porDepartamento.length ? porDepartamento[porDepartamento.length - 1] : null;

  const gaugeData = [{ name: 'Cumprimento', value: Math.min(kpis?.mediaCumprimento || 0, 100), fill: CHART_COLORS[0] }];
  const indicadoresFiltro = filtros.categoria ? (INDICADORES_POR_CATEGORIA[filtros.categoria] || []) : [];
  const indicadorFiltroOpts = [{ value: '', label: 'Todos os indicadores' }, ...indicadoresFiltro];

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="section-title">📈 Gestão de Metas</div>
          <div className="section-sub">Acompanhe objetivos, desempenho e resultados em tempo real.</div>
        </div>
        <div className="metas-header-actions">
          <div style={{ width: 170 }}>
            <Select value={filtros.periodo} onChange={v => setFiltros(f => ({ ...f, periodo: v }))} options={PERIODO_OPTS} searchPlaceholder="Buscar mês…" />
          </div>
          <input
            type="text" placeholder="Buscar por responsável…" value={filtros.responsavel}
            onChange={e => setFiltros(f => ({ ...f, responsavel: e.target.value }))}
          />
          {onNavigate && (
            <Button variant="ghost" onClick={() => onNavigate('dashboard')}>
              <LayoutGrid size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Dashboard
            </Button>
          )}
          {isAdmin && (
            <Button variant="primary" onClick={() => { setEditingMeta(null); setFormOpen(true); }}>
              <Plus size={15} style={{ marginRight: 6, verticalAlign: -2 }} /> Nova Meta
            </Button>
          )}
        </div>
      </div>

      {!empresa ? (
        <div className="metas-empty-state">
          <div className="metas-empty-icon"><BarChart3 size={40} /></div>
          <p>Selecione uma empresa para visualizar os indicadores e acompanhar o desempenho das metas.</p>
        </div>
      ) : (
        <>
          {/* ── Linha 1 — KPIs ─────────────────────────────────────────── */}
          <div className="kpi-grid stagger-children">
            <KpiCard tilt icon={Target}        label="Total de metas"      value={kpis ? <CountUp value={kpis.total} /> : '—'} trend={trendFrom(kpis?.comparativo?.total)} />
            <KpiCard tilt icon={CheckCircle2}  label="Metas atingidas"     value={kpis ? <CountUp value={kpis.concluidas} /> : '—'} trend={trendFrom(kpis?.comparativo?.concluidas)} />
            <KpiCard tilt icon={Clock}         label="Em andamento"        value={kpis ? <CountUp value={kpis.emAndamento} /> : '—'} trend={trendFrom(kpis?.comparativo?.emAndamento)} />
            <KpiCard tilt icon={AlertTriangle} label="Metas atrasadas"     value={kpis ? <CountUp value={kpis.atrasadas} /> : '—'} trend={trendFrom(kpis?.comparativo?.atrasadas)} />
            <KpiCard tilt icon={TrendingUp}    label="% médio de cumprimento" value={kpis ? <CountUp value={kpis.mediaCumprimento} formatter={n => `${n.toFixed(1)}%`} /> : '—'} />
            <KpiCard tilt icon={DollarSign}    label="Valor total das metas" value={kpis ? currencyCompact.format(kpis.valorTotalMetas) : '—'} trend={trendFrom(kpis?.comparativo?.valorTotal)} />
          </div>

          {/* ── Linha 2 — Evolução + Cumprimento geral ────────────────── */}
          <div className="metas-row-2 stagger-children">
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-card-title">Evolução das metas</div>
                <div className="chart-card-desc">Criadas, concluídas e vencidas por mês (últimos 6 meses)</div>
              </div>
              {evolucao.length === 0 ? <p className="chart-empty">Sem dados suficientes ainda.</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={evolucao}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="mesLabel" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="criadas"    name="Criadas"    stroke={CHART_COLORS[3]} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive animationDuration={900} />
                    <Line type="monotone" dataKey="concluidas" name="Concluídas" stroke={CHART_COLORS[4]} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive animationDuration={900} />
                    <Line type="monotone" dataKey="vencidas"   name="Vencidas"   stroke="var(--color-error)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive animationDuration={900} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-card-title">Cumprimento geral</div>
                <div className="chart-card-desc">Média de todas as metas ativas</div>
              </div>
              <div className="gauge-wrap">
                <ResponsiveContainer width="100%" height={190}>
                  <RadialBarChart cx="50%" cy="80%" innerRadius="85%" outerRadius="130%" startAngle={180} endAngle={0} data={gaugeData} barSize={16}>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={8} isAnimationActive animationDuration={900} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="gauge-center">
                  <span className="gauge-value">{kpis ? `${Math.round(kpis.mediaCumprimento)}%` : '—'}</span>
                  <span className="gauge-label">cumprimento</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Linha 3 — Ranking + Departamento + Status ─────────────── */}
          <div className="metas-row-3 stagger-children">
            <div className="chart-card">
              <div className="chart-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div className="chart-card-title">Ranking dos responsáveis</div>
                  <div className="chart-card-desc">Top 10 por percentual atingido</div>
                </div>
                <div style={{ width: 150, flexShrink: 0 }}>
                  <Select value={rankingTipo} onChange={setRankingTipo} options={RANKING_TIPOS} />
                </div>
              </div>
              {ranking.length === 0 ? <p className="chart-empty">Sem dados para esse ranking ainda.</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={ranking} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                    <YAxis type="category" dataKey="nome" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} width={100} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
                    <Bar dataKey="percentual" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} isAnimationActive animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-card-title">Metas por departamento</div>
                <div className="chart-card-desc">% médio de cumprimento por área</div>
              </div>
              {porDepartamento.length === 0 ? <p className="chart-empty">Sem metas cadastradas.</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={porDepartamento}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="categoria" stroke="var(--color-text-muted)" fontSize={10.5} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} width={36} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
                    <Bar dataKey="percentual" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-card-title">Status das metas</div>
                <div className="chart-card-desc">Onde as metas estão hoje</div>
              </div>
              {statusDist.length === 0 ? <p className="chart-empty">Sem metas cadastradas.</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusDist} dataKey="total" nameKey="status" innerRadius={58} outerRadius={90} paddingAngle={3} isAnimationActive animationDuration={800}>
                      {statusDist.map(s => <Cell key={s.status} fill={STATUS_COLOR_VAR[s.status]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Linha 4/5 — Tabela + painel de alertas ────────────────── */}
          <div className="metas-main-grid">
            <div className="metas-tabela-col">
              <div className="filtros-panel">
                <button className="filtros-panel-header" onClick={() => setFiltrosOpen(o => !o)}>
                  <span className="filtros-panel-title"><SlidersHorizontal size={14} /> Filtros</span>
                  <ChevronDown size={16} className={`filtros-panel-chevron${filtrosOpen ? ' open' : ''}`} />
                </button>
                {filtrosOpen && (
                  <div className="metas-filter-bar">
                    <div style={{ width: 170 }}>
                      <Select value={filtros.tipo} onChange={v => setFiltros(f => ({ ...f, tipo: v }))} options={FILTRO_TIPO_OPTS} searchPlaceholder="Buscar tipo…" />
                    </div>
                    <div style={{ width: 190 }}>
                      <Select value={filtros.categoria} onChange={v => setFiltros(f => ({ ...f, categoria: v, indicador: '' }))} options={FILTRO_CATEGORIA_OPTS} />
                    </div>
                    <div style={{ width: 190 }}>
                      <Select
                        value={filtros.indicador} onChange={v => setFiltros(f => ({ ...f, indicador: v }))}
                        options={indicadorFiltroOpts} disabled={!filtros.categoria} searchPlaceholder="Buscar indicador…"
                      />
                    </div>
                    <div style={{ width: 170 }}>
                      <Select value={filtros.status} onChange={v => setFiltros(f => ({ ...f, status: v }))} options={FILTRO_STATUS_OPTS} />
                    </div>
                  </div>
                )}
              </div>

              {loading ? (
                <p className="chart-empty">Carregando…</p>
              ) : (
                <MetaTable metas={lista.data} onOpen={abrirDetalhe} empresaNome={empresaNome} />
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
            </div>

            <div className="metas-alertas-col">
              <div className="param-group alertas-panel">
                <h3 className="gu-title" style={{ fontSize: 15, padding: '16px 20px 4px' }}>Alertas</h3>
                <AlertaSecao titulo="🚨 Metas vencidas" itens={alertasVencidas} critico onOpen={abrirDetalhe} vazio="Nenhuma meta vencida." />
                <AlertaSecao titulo="⚠️ Vencendo em breve" itens={alertasVencendo} onOpen={abrirDetalhe} vazio="Nada vencendo nos próximos dias." />
                <AlertaSecao titulo="🏆 Concluídas recentemente" itens={alertasConcluidasRecentes} onOpen={abrirDetalhe} vazio="Nenhuma conclusão recente." />
                <AlertaSecao titulo="📉 Abaixo de 50%" itens={alertasAbaixo50} onOpen={abrirDetalhe} vazio="Nenhuma meta abaixo de 50%." ultimo />
              </div>
            </div>
          </div>

          {/* ── Linha 6 — Indicadores estratégicos ────────────────────── */}
          <div className="gu-kpis" style={{ marginTop: 20 }}>
            <div className="gu-kpi" style={{ cursor: topResponsavel ? 'pointer' : 'default' }} onClick={() => topResponsavel && setFiltros(f => ({ ...f, responsavel: topResponsavel.nome }))}>
              <div className="gu-kpi-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}><Crown size={20} /></div>
              <div><p className="gu-kpi-label">Top responsável</p><p className="gu-kpi-value" style={{ fontSize: 16 }}>{topResponsavel?.nome || '—'}</p></div>
            </div>
            <div className="gu-kpi">
              <div className="gu-kpi-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}><Trophy size={20} /></div>
              <div><p className="gu-kpi-label">Melhor departamento</p><p className="gu-kpi-value" style={{ fontSize: 16 }}>{deptoMelhor?.categoria || '—'}</p></div>
            </div>
            <div className="gu-kpi">
              <div className="gu-kpi-icon" style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}><TrendingDown size={20} /></div>
              <div><p className="gu-kpi-label">Departamento a atenção</p><p className="gu-kpi-value" style={{ fontSize: 16 }}>{deptoPior?.categoria || '—'}</p></div>
            </div>
            <div className="gu-kpi" style={{ cursor: metaProximaVencimento ? 'pointer' : 'default' }} onClick={() => metaProximaVencimento && abrirDetalhe(metaProximaVencimento)}>
              <div className="gu-kpi-icon" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}><CalendarClock size={20} /></div>
              <div><p className="gu-kpi-label">Vence em breve</p><p className="gu-kpi-value" style={{ fontSize: 16 }}>{metaProximaVencimento?.nome || '—'}</p></div>
            </div>
          </div>
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

function AlertaSecao({ titulo, itens, onOpen, vazio, critico, ultimo }) {
  return (
    <div className={`alerta-secao${ultimo ? '' : ' alerta-secao-divider'}`}>
      <div className="alerta-secao-titulo">{titulo} {itens.length > 0 && <span className="alerta-secao-count">{itens.length}</span>}</div>
      {itens.length === 0 ? (
        <p className="notif-empty" style={{ padding: '6px 20px 14px' }}>{vazio}</p>
      ) : (
        <div className="alerta-secao-lista">
          {itens.slice(0, 5).map(m => (
            <button
              key={m.id} className={`alerta-item${critico ? ' critico' : ''}`}
              onClick={() => onOpen(m)}
            >
              <span className="alerta-item-nome">{m.nome}</span>
              <span className="alerta-item-sub">{m.responsavel || 'Sem responsável'} · {m.percentual}%</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
