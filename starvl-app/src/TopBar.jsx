import React, { useState, useRef, useEffect } from 'react';
import { useT } from './i18n';

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const IconSearch = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

const IconSun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const IconMoon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const IconChevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IconLogOut = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default function TopBar({ user, clients, selectedClient, onClientChange, onLogout, theme, onThemeToggle }) {
  const { t } = useT();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  const roleName = user?.perfil === 'admin' ? 'Administrador' : 'Usuário';

  return (
    <header className="topbar">
      {/* Left: company selector */}
      <div className="topbar-brand">
        {clients.length > 1 ? (
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
        ) : (
          <span className="topbar-client">{selectedClient?.nome || t('topbar_sub')}</span>
        )}
      </div>

      {/* Center: global search */}
      <div className="topbar-search">
        <span className="topbar-search-icon"><IconSearch /></span>
        <input
          className="topbar-search-input"
          type="text"
          placeholder="Buscar…"
        />
      </div>

      {/* Right: controls */}
      <div className="topbar-user">
        <button className="topbar-icon-btn" title="Notificações" style={{ position: 'relative' }}>
          <IconBell />
        </button>

        <button className="topbar-theme" onClick={onThemeToggle} title="Alternar tema">
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>

        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            className="topbar-profile-btn"
            onClick={() => setProfileOpen(o => !o)}
          >
            {user?.foto
              ? <img className="topbar-avatar" src={user.foto} alt={user.usuario} style={{ objectFit: 'cover' }} />
              : <div className="topbar-avatar">{initials(user?.nome || user?.usuario)}</div>
            }
            <div className="topbar-profile-info">
              <span className="topbar-profile-name">{user?.nome || user?.usuario}</span>
              <span className="topbar-profile-role">{roleName}</span>
            </div>
            <IconChevron />
          </button>

          {profileOpen && (
            <div className="topbar-dropdown">
              <div className="topbar-dropdown-user">
                <div className="topbar-dropdown-name">{user?.nome || user?.usuario}</div>
                <div className="topbar-dropdown-email">{user?.email || user?.usuario}</div>
              </div>
              <div className="topbar-dropdown-divider" />
              <button className="topbar-dropdown-item danger" onClick={() => { setProfileOpen(false); onLogout(); }}>
                <IconLogOut />
                {t('topbar_logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
