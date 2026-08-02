import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const SEVERIDADE_ICON_VARIANT = { critico: 'error', atencao: 'warning', info: 'info', concluido: 'success' };

function formatQuando(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function AlertsTimeline({ alerts, onMarcarLida, onResolver }) {
  if (alerts.length === 0) {
    return <p className="notif-empty">Nenhum alerta ativo — tudo em dia!</p>;
  }
  return (
    <div className="notif-list alerts-timeline">
      {alerts.map(a => (
        <div key={a.id} className={`notif-item${a.lido ? '' : ' unread'}`} onClick={() => !a.lido && onMarcarLida(a)}>
          <AlertTriangle size={15} className={`notif-item-icon--${SEVERIDADE_ICON_VARIANT[a.severidade] || 'info'}`} />
          <div className="notif-item-text">
            {a.titulo}
            <div className="notif-item-meta">{a.modulo || 'Sistema'} · {formatQuando(a.criadoEm)}</div>
          </div>
          {a.origem === 'manual' && (
            <button
              className="icon-btn" title="Resolver" style={{ marginLeft: 8, flexShrink: 0 }}
              onClick={e => { e.stopPropagation(); onResolver(a); }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
