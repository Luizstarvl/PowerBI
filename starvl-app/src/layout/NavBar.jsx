import React from 'react';
import { Zap } from 'lucide-react';
import { useT } from '../i18n';
import { NAV_ITEMS } from '../constants/nav';

export default function NavBar({ page, onPageChange }) {
  const { t } = useT();
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Zap size={16} strokeWidth={2.25} />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Horse</span>
        </div>
      </div>

      <div className="sidebar-section-label">Menu</div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ key, tk, Icon }) => (
          <button
            key={key}
            className={`sidebar-item${page === key ? ' active' : ''}`}
            onClick={() => onPageChange(key)}
          >
            <span className="sidebar-item-icon"><Icon size={15} strokeWidth={2} /></span>
            <span className="sidebar-item-label">{t(tk)}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-version">v2.2</span>
      </div>
    </aside>
  );
}
