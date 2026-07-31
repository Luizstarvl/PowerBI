import React from 'react';
import { useT } from './i18n';

const PAGES = [
  { key: 'dashboard',  tk: 'nav_dashboard' },
  { key: 'usuarios',   tk: 'nav_usuarios' },
  { key: 'parametros', tk: 'nav_parametros' },
];

export default function NavBar({ page, onPageChange }) {
  const { t } = useT();
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {PAGES.map(p => (
          <button
            key={p.key}
            className={`sidebar-item${page === p.key ? ' active' : ''}`}
            onClick={() => onPageChange(p.key)}
          >
            {t(p.tk)}
          </button>
        ))}
      </nav>
    </aside>
  );
}
