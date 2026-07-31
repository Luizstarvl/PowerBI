import React from 'react';

const PAGES = [
  { key: 'dashboard',  label: 'Dashboard' },
  { key: 'parametros', label: 'Parâmetros' },
];

export default function NavBar({ page, onPageChange }) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {PAGES.map(p => (
          <button
            key={p.key}
            className={`sidebar-item${page === p.key ? ' active' : ''}`}
            onClick={() => onPageChange(p.key)}
          >
            {p.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
