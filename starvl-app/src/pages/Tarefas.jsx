import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  ListTodo, Clock, CheckCircle2, AlertTriangle, Bell, User, Plus,
} from 'lucide-react';
import { Select } from '../components/ui';
import useTarefasResumo from '../hooks/useTarefasResumo';
import TaskTable from '../components/tarefas/TaskTable';
import TaskModal from '../components/tarefas/TaskModal';
import AlertsTimeline from '../components/tarefas/AlertsTimeline';
import UpcomingList from '../components/tarefas/UpcomingList';
import MiniCalendar from '../components/tarefas/MiniCalendar';
import QuickActions from '../components/tarefas/QuickActions';
import { PRIORIDADES, STATUS_TAREFA } from '../constants/tarefas';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

const FILTRO_STATUS_OPTS     = [{ value: '', label: 'Todos os status' },     ...STATUS_TAREFA];
const FILTRO_PRIORIDADE_OPTS = [{ value: '', label: 'Todas as prioridades' }, ...PRIORIDADES];

export default function Tarefas({ empresa, codigoEmpresa, user }) {
  const isAdmin = user?.perfil === 'admin';

  const { tasks, alerts, loading, refetch } = useTarefasResumo({
    empresaId: empresa, codigoEmpresa, userId: user?.id,
  });

  const [usuarios, setUsuarios] = useState([]);
  const [filtros, setFiltros]   = useState({ status: '', prioridade: '', responsavel: '', busca: '', favoritos: false });
  const [selectedDate, setSelectedDate] = useState(null);
  const [modal, setModal] = useState(null); // null | 'novo' | task

  const alertasRef = useRef(null);
  const agendaRef  = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/starvl-users`).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setUsuarios(data);
    }).catch(() => {});
  }, []);

  const tarefasFiltradas = useMemo(() => {
    return tasks.filter(t => {
      if (filtros.status && t.status !== filtros.status) return false;
      if (filtros.prioridade && t.prioridade !== filtros.prioridade) return false;
      if (filtros.responsavel && String(t.responsavelId) !== filtros.responsavel) return false;
      if (filtros.favoritos && !t.favorito) return false;
      if (filtros.busca && !t.titulo.toLowerCase().includes(filtros.busca.toLowerCase())) return false;
      if (selectedDate && t.prazo?.slice(0, 10) !== selectedDate) return false;
      return true;
    });
  }, [tasks, filtros, selectedDate]);

  const kpis = {
    total:       tasks.length,
    pendentes:   tasks.filter(t => t.status === 'pendente').length,
    andamento:   tasks.filter(t => t.status === 'andamento').length,
    concluidas:  tasks.filter(t => t.status === 'concluida').length,
    atrasadas:   tasks.filter(t => t.status === 'atrasada').length,
    alertasAtivos: alerts.filter(a => !a.resolvidoEm).length,
    minhas:      tasks.filter(t => t.responsavelId === user?.id).length,
  };

  async function handleSaveTask(form) {
    const isEdit = modal && modal !== 'novo';
    const body = isEdit
      ? form
      : { ...form, empresaId: empresa, criadoPor: user?.id };
    const url    = isEdit ? `${API_URL}/api/tasks/${modal.id}` : `${API_URL}/api/tasks`;
    const method = isEdit ? 'PUT' : 'POST';
    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Erro ao salvar tarefa.'); }
    setModal(null);
    refetch();
  }

  async function handleConcluir(task) {
    await fetch(`${API_URL}/api/tasks/${task.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: task.titulo, descricao: task.descricao, responsavelId: task.responsavelId,
        prioridade: task.prioridade, prazo: task.prazo, categoria: task.categoria, status: 'concluida',
      }),
    });
    refetch();
  }

  async function handleFavorito(task) {
    await fetch(`${API_URL}/api/tasks/${task.id}/favorito`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, favorito: !task.favorito }),
    });
    refetch();
  }

  async function handleMarcarLida(alert) {
    if (alert.origem === 'manual') {
      await fetch(`${API_URL}/api/alerts/${alert.id}/lida`, { method: 'PATCH' });
    } else if (alert.origem === 'metas') {
      await fetch(`${API_URL}/api/metas/notificacoes/${alert.origemId}/${alert.origemTipo}/lida`, { method: 'PATCH' });
    }
    refetch();
  }

  async function handleResolverAlerta(alert) {
    await fetch(`${API_URL}/api/alerts/${alert.id}/resolver`, { method: 'PATCH' });
    refetch();
  }

  function handleQuickAction(key) {
    if (key === 'nova')      setModal('novo');
    if (key === 'agenda')    agendaRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (key === 'todas')     { setFiltros({ status: '', prioridade: '', responsavel: '', busca: '', favoritos: false }); setSelectedDate(null); }
    if (key === 'alertas')   alertasRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (key === 'minhas')    setFiltros(f => ({ ...f, responsavel: String(user?.id || '') }));
    if (key === 'relatorios') handleExportExcel();
  }

  function handleExportExcel() {
    const linhas = tarefasFiltradas.map(t => ({
      Título: t.titulo, Responsável: t.responsavelNome || '', Prioridade: t.prioridade,
      Prazo: t.prazo ? t.prazo.slice(0, 10) : '', Status: t.status, Categoria: t.categoria || '',
    }));
    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tarefas');
    XLSX.writeFile(wb, 'tarefas.xlsx');
  }

  const usuarioOptions = [{ value: '', label: 'Todos os responsáveis' }, ...usuarios.map(u => ({ value: String(u.id), label: u.nome || u.usuario }))];

  return (
    <main className="dashboard fade-up">
      <div className="gu-header">
        <div>
          <h2 className="gu-title">Tarefas e Alertas</h2>
          <p className="gu-subtitle">Centralize suas atividades, pendências e notificações do sistema.</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('novo')}>
          <Plus size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Nova tarefa
        </button>
      </div>

      <QuickActions onAction={handleQuickAction} />

      <div className="gu-kpis">
        <div className="gu-kpi">
          <div className="gu-kpi-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}><ListTodo size={20} /></div>
          <div><p className="gu-kpi-label">Total</p><p className="gu-kpi-value">{kpis.total}</p></div>
        </div>
        <div className="gu-kpi">
          <div className="gu-kpi-icon" style={{ background: 'var(--color-neutral-light)', color: 'var(--color-neutral)' }}><Clock size={20} /></div>
          <div><p className="gu-kpi-label">Pendentes</p><p className="gu-kpi-value">{kpis.pendentes}</p></div>
        </div>
        <div className="gu-kpi">
          <div className="gu-kpi-icon" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}><Clock size={20} /></div>
          <div><p className="gu-kpi-label">Em andamento</p><p className="gu-kpi-value">{kpis.andamento}</p></div>
        </div>
        <div className="gu-kpi">
          <div className="gu-kpi-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}><CheckCircle2 size={20} /></div>
          <div><p className="gu-kpi-label">Concluídas</p><p className="gu-kpi-value">{kpis.concluidas}</p></div>
        </div>
        <div className="gu-kpi">
          <div className="gu-kpi-icon" style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}><AlertTriangle size={20} /></div>
          <div><p className="gu-kpi-label">Atrasadas</p><p className="gu-kpi-value">{kpis.atrasadas}</p></div>
        </div>
        <div className="gu-kpi">
          <div className="gu-kpi-icon" style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}><Bell size={20} /></div>
          <div><p className="gu-kpi-label">Alertas ativos</p><p className="gu-kpi-value">{kpis.alertasAtivos}</p></div>
        </div>
        <div className="gu-kpi">
          <div className="gu-kpi-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}><User size={20} /></div>
          <div><p className="gu-kpi-label">Minhas tarefas</p><p className="gu-kpi-value">{kpis.minhas}</p></div>
        </div>
      </div>

      <div className="tarefas-main-grid">
        <div className="tarefas-tasks-col">
          <div className="param-group">
            <div className="metas-filter-bar">
              <input
                type="text" placeholder="Buscar tarefa…"
                value={filtros.busca} onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))}
              />
              <div style={{ width: 170 }}><Select value={filtros.status} onChange={v => setFiltros(f => ({ ...f, status: v }))} options={FILTRO_STATUS_OPTS} /></div>
              <div style={{ width: 190 }}><Select value={filtros.prioridade} onChange={v => setFiltros(f => ({ ...f, prioridade: v }))} options={FILTRO_PRIORIDADE_OPTS} /></div>
              <div style={{ width: 200 }}><Select value={filtros.responsavel} onChange={v => setFiltros(f => ({ ...f, responsavel: v }))} options={usuarioOptions} searchPlaceholder="Buscar usuário…" /></div>
              <label className="login-remember" style={{ marginLeft: 'auto' }}>
                <input type="checkbox" checked={filtros.favoritos} onChange={e => setFiltros(f => ({ ...f, favoritos: e.target.checked }))} />
                <span className="login-remember-box" />
                Favoritos
              </label>
            </div>
            <div className="param-table-wrap">
              {loading ? <p className="rank-empty">Carregando…</p> : (
                <TaskTable
                  tasks={tarefasFiltradas} onEdit={setModal} onConcluir={handleConcluir} onFavorito={handleFavorito}
                  canEdit={t => isAdmin || t.criadoPor === user?.id}
                  canConcluir={t => isAdmin || t.criadoPor === user?.id || t.responsavelId === user?.id}
                />
              )}
            </div>
          </div>

          <div className="param-group" ref={alertasRef} style={{ marginTop: 20 }}>
            <div className="gu-header" style={{ padding: '16px 20px 0' }}>
              <h3 className="gu-title" style={{ fontSize: 15 }}>Alertas do sistema</h3>
            </div>
            <div style={{ padding: 16 }}>
              <AlertsTimeline alerts={alerts} onMarcarLida={handleMarcarLida} onResolver={handleResolverAlerta} />
            </div>
          </div>
        </div>

        <div className="tarefas-side-col" ref={agendaRef}>
          <div className="param-group" style={{ padding: 16 }}>
            <h3 className="gu-title" style={{ fontSize: 15, marginBottom: 12 }}>Próximos vencimentos</h3>
            <UpcomingList tasks={tasks} />
          </div>
          <div className="param-group" style={{ padding: 16, marginTop: 20 }}>
            <MiniCalendar tasks={tasks} selected={selectedDate} onSelect={setSelectedDate} />
          </div>
        </div>
      </div>

      {modal && (
        <TaskModal
          task={modal === 'novo' ? null : modal}
          usuarios={usuarios}
          onClose={() => setModal(null)}
          onSave={handleSaveTask}
        />
      )}
    </main>
  );
}
