import React from 'react';
import { CheckSquare, ListTodo, AlertTriangle, Clock, Bell, ShieldCheck } from 'lucide-react';

export default function TarefasAlertasCard({ counts, loading, onAbrir }) {
  const semPendencias = !loading && counts.pendentes === 0 && counts.criticos === 0;

  return (
    <button
      className={`tarefas-card${counts.criticos > 0 ? ' critical' : ''}`}
      onClick={onAbrir}
    >
      <div className="tarefas-card-icon"><CheckSquare size={22} /></div>
      <div className="tarefas-card-body">
        <div className="tarefas-card-title">Tarefas e Alertas</div>
        <p className="tarefas-card-subtitle">Centralize suas atividades, pendências e notificações do sistema.</p>

        {semPendencias ? (
          <div className="tarefas-card-clear">
            <ShieldCheck size={15} />
            Tudo em dia! Nenhuma pendência encontrada.
          </div>
        ) : (
          <div className="tarefas-card-badges">
            <span className="tarefas-card-badge"><ListTodo size={13} /> {counts.pendentes} Pendentes</span>
            <span className="tarefas-card-badge critico"><AlertTriangle size={13} /> {counts.criticos} Críticos</span>
            <span className="tarefas-card-badge"><Clock size={13} /> {counts.vencendoHoje} Hoje</span>
            <span className="tarefas-card-badge"><Bell size={13} /> {counts.novasNotificacoes} Novas</span>
          </div>
        )}
      </div>
    </button>
  );
}
