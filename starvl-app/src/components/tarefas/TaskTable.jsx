import React from 'react';
import { Star, CheckCircle2, Pencil } from 'lucide-react';
import { PRIORIDADES, STATUS_TAREFA } from '../../constants/tarefas';

const PRIORIDADE_BADGE = { baixa: 'badge-neutral', media: 'badge-admin', alta: 'badge-warn', urgente: 'badge-inativo' };
const STATUS_BADGE = { pendente: 'badge-neutral', andamento: 'badge-warn', concluida: 'badge-ativo', atrasada: 'badge-inativo' };

function label(list, value) { return list.find(o => o.value === value)?.label || value; }

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default function TaskTable({ tasks, onEdit, onConcluir, onFavorito, canEdit, canConcluir }) {
  if (tasks.length === 0) {
    return <p className="rank-empty">Nenhuma tarefa encontrada.</p>;
  }
  return (
    <table className="param-table">
      <thead>
        <tr>
          <th style={{ width: 36 }}></th>
          <th>Título</th>
          <th>Responsável</th>
          <th>Prioridade</th>
          <th>Prazo</th>
          <th>Status</th>
          <th>Categoria</th>
          <th style={{ textAlign: 'right' }}>Ações</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(t => (
          <tr key={t.id}>
            <td>
              <button className="icon-btn" style={{ marginLeft: 0 }} title={t.favorito ? 'Remover favorito' : 'Favoritar'} onClick={() => onFavorito(t)}>
                <Star size={14} fill={t.favorito ? 'currentColor' : 'none'} color={t.favorito ? '#FB923C' : undefined} />
              </button>
            </td>
            <td>
              <p className="gu-username">{t.titulo}</p>
              {t.descricao && <p className="gu-subtext">{t.descricao}</p>}
            </td>
            <td className="gu-subtext">{t.responsavelNome || '—'}</td>
            <td><span className={`badge ${PRIORIDADE_BADGE[t.prioridade] || 'badge-neutral'}`}>{label(PRIORIDADES, t.prioridade)}</span></td>
            <td className="gu-subtext">{formatDate(t.prazo)}</td>
            <td><span className={`badge ${STATUS_BADGE[t.status] || 'badge-neutral'}`}>{label(STATUS_TAREFA, t.status)}</span></td>
            <td className="gu-subtext">{t.categoria || '—'}</td>
            <td className="td-actions">
              {t.status !== 'concluida' && canConcluir(t) && (
                <button className="icon-btn" title="Concluir" onClick={() => onConcluir(t)}>
                  <CheckCircle2 size={15} />
                </button>
              )}
              {canEdit(t) && (
                <button className="icon-btn" title="Editar" onClick={() => onEdit(t)}>
                  <Pencil size={14} />
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
