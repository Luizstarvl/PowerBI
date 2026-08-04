import React from 'react';
import { useT } from '../i18n';
import { NAV_ITEMS } from '../constants/nav';
import pkg from '../../package.json';
const { version } = pkg;

function canAccessPage(user, key) {
  if (!user) return false;
  if (user.perfil === 'admin') return true;
  switch (key) {
    case 'dashboard':  return true;
    case 'metas':      return true;
    case 'atalhos':    return true;
    case 'usuarios':   return false;
    case 'parametros': return !!user.permissoes?.configuracoes;
    default:           return false;
  }
}

export default function NavBar({ page, onPageChange, user, badges }) {
  const { t } = useT();
  const visibleItems = NAV_ITEMS.filter(item => canAccessPage(user, item.key));

  return (
    <aside className="sidebar">
      <div className="sidebar-section-label">Menu</div>

      <nav className="sidebar-nav">
        {visibleItems.map(({ key, tk, Icon }) => {
          const count = badges?.[key] || 0;
          return (
            <button
              key={key}
              className={`sidebar-item${page === key ? ' active' : ''}`}
              onClick={() => onPageChange(key)}
            >
              <span className="sidebar-item-icon"><Icon size={15} strokeWidth={2} /></span>
              <span className="sidebar-item-label">{t(tk)}</span>
              {count > 0 && <span className="sidebar-item-badge">{count}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-version">v{version}</span>
      </div>
    </aside>
  );
}
