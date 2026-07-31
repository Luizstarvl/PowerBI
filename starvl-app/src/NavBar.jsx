import React from 'react';

const PAGES = [
  { key: 'dashboard',  label: 'Dashboard' },
  { key: 'parametros', label: 'Parâmetros' },
];

export default function NavBar({ page, onPageChange }) {
  return (
    <nav className="navbar">
      {PAGES.map(p => (
        <button
          key={p.key}
          className={`navbar-tab${page === p.key ? ' active' : ''}`}
          onClick={() => onPageChange(p.key)}
        >
          {p.label}
        </button>
      ))}
    </nav>
  );
}
