import React from 'react';
import { QUICK_ACTIONS } from '../../constants/tarefas';

export default function QuickActions({ onAction }) {
  return (
    <div className="quick-actions">
      {QUICK_ACTIONS.map(({ key, label, Icon }) => (
        <button key={key} className="quick-action-btn" onClick={() => onAction(key)}>
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  );
}
