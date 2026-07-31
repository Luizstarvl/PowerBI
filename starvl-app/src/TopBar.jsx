import React from 'react';

function initials(name) {
  return (name || '?').slice(0, 2).toUpperCase();
}

export default function TopBar({ user, clients, selectedClient, onClientChange, onLogout, theme, onThemeToggle }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-logo">PowerBI</span>
        <span className="topbar-divider" />
        <span className="topbar-sub">Gestão de Postos</span>
      </div>

      <div className="topbar-controls">
        {clients.length > 1 && (
          <select
            className="topbar-select"
            value={selectedClient?.codigoEmpresa || ''}
            onChange={e => {
              const c = clients.find(c => c.codigoEmpresa === parseInt(e.target.value));
              if (c) onClientChange(c);
            }}
          >
            {clients.map(c => (
              <option key={c.codigoEmpresa} value={c.codigoEmpresa}>{c.nome}</option>
            ))}
          </select>
        )}
        {clients.length === 1 && (
          <span className="topbar-client">{selectedClient?.nome}</span>
        )}
      </div>

      <div className="topbar-user">
        <button className="topbar-theme" onClick={onThemeToggle} title="Alternar tema">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="topbar-avatar" title={user?.usuario}>
          {initials(user?.usuario)}
        </div>
        <button className="topbar-logout" onClick={onLogout}>Sair</button>
      </div>
    </header>
  );
}
