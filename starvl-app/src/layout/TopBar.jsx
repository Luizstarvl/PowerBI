import React, { useState, useRef, useEffect } from 'react';
import { Search, Sun, Moon, Monitor, ChevronDown, LogOut } from 'lucide-react';
import { useT } from '../i18n';
import { Logo } from '../components/ui';

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function TopBar({ user, clients, selectedClient, onClientChange, onLogout, themeMode, onThemeToggle }) {
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
      {/* Left: brand + company selector */}
      <div className="topbar-brand">
        <Logo className="topbar-brand-logo" />
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
          <span className="topbar-client">{selectedClient?.nome}</span>
        )}
      </div>

      {/* Center: global search */}
      <div className="topbar-search">
        <span className="topbar-search-icon"><Search size={13} strokeWidth={2.5} /></span>
        <input
          className="topbar-search-input"
          type="text"
          placeholder="Buscar…"
        />
      </div>

      {/* Right: controls */}
      <div className="topbar-user">
        <button className="topbar-theme" onClick={onThemeToggle}
          title={themeMode === 'dark' ? 'Tema Escuro' : themeMode === 'light' ? 'Tema Claro' : 'Tema Automático'}>
          {themeMode === 'dark'  ? <Sun size={15} strokeWidth={2} />     :
           themeMode === 'light' ? <Moon size={15} strokeWidth={2} />   :
                                   <Monitor size={15} strokeWidth={2} />}
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
            <ChevronDown size={12} strokeWidth={2.5} />
          </button>

          {profileOpen && (
            <div className="topbar-dropdown">
              <div className="topbar-dropdown-user">
                <div className="topbar-dropdown-name">{user?.nome || user?.usuario}</div>
                <div className="topbar-dropdown-email">{user?.email || user?.usuario}</div>
              </div>
              <div className="topbar-dropdown-divider" />
              <button className="topbar-dropdown-item danger" onClick={() => { setProfileOpen(false); onLogout(); }}>
                <LogOut size={14} strokeWidth={2} />
                {t('topbar_logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
