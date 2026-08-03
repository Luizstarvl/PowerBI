import React, { useState, useRef, useEffect } from 'react';
import { Search, Sun, Moon, Monitor, ChevronDown, LogOut } from 'lucide-react';
import { useT } from '../i18n';


function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ── Seletor de empresa com multi-seleção ──────────────────────────────────── */
function EmpresaPicker({ clients, selectedIds, onChange }) {
  const [open,  setOpen]  = useState(false);
  const [busca, setBusca] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const fn = e => { if (!ref.current?.contains(e.target)) { setOpen(false); setBusca(''); } };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  function toggle(code) {
    onChange(selectedIds.includes(code)
      ? selectedIds.filter(x => x !== code)
      : [...selectedIds, code]
    );
  }

  function selectAll()  { onChange(clients.map(c => c.codigoEmpresa)); }
  function clearAll()   { onChange([]); }

  const filtered = clients.filter(c =>
    !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    String(c.codigoEmpresa).includes(busca)
  );

  const label = selectedIds.length === 0
    ? 'Selecionar empresa'
    : selectedIds.length === 1
    ? clients.find(c => c.codigoEmpresa === selectedIds[0])?.nome || '1 empresa'
    : `${selectedIds.length} empresas`;

  if (clients.length === 0) return null;

  return (
    <div className="ep-root" ref={ref}>
      <button className="ep-trigger" onClick={() => setOpen(o => !o)}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: .7 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span className="ep-label">{label}</span>
        <ChevronDown size={12} strokeWidth={2.5} style={{ flexShrink: 0, transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div className="ep-dropdown">
          <div className="ep-dropdown-header">Selecione a empresa</div>

          {clients.length > 2 && (
            <div style={{ position: 'relative', padding: '0 8px 6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-60%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="themed-input"
                type="text"
                placeholder="Buscar..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{ width: '100%', paddingLeft: 28, boxSizing: 'border-box', fontSize: 12 }}
                autoFocus
              />
            </div>
          )}

          {clients.length > 1 && (
            <div className="ep-actions">
              <button className="ep-action-btn" onClick={selectAll}>Todas</button>
              <button className="ep-action-btn" onClick={clearAll}>Limpar</button>
            </div>
          )}

          <div className="ep-list">
            {filtered.length === 0
              ? <div className="ep-empty">Nenhuma empresa encontrada</div>
              : filtered.map(c => (
                <label
                  key={c.codigoEmpresa}
                  className={`ep-row${selectedIds.includes(c.codigoEmpresa) ? ' selected' : ''}`}
                  onClick={() => toggle(c.codigoEmpresa)}
                >
                  <div className={`ep-check${selectedIds.includes(c.codigoEmpresa) ? ' on' : ''}`}>
                    {selectedIds.includes(c.codigoEmpresa) && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </div>
                  <span className="ep-row-nome">{c.nome}</span>
                  <span className="ep-row-cod">#{c.codigoEmpresa}</span>
                </label>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

export default function TopBar({ user, clients, selectedIds, onSelectionChange, onLogout, themeMode, onThemeToggle }) {
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
      {/* Left: brand placeholder — logo será adicionada futuramente */}
      <div className="topbar-brand" />

      {/* Center: search + company picker */}
      <div className="topbar-center">
        <div className="topbar-search">
          <span className="topbar-search-icon"><Search size={13} strokeWidth={2.5} /></span>
          <input className="topbar-search-input" type="text" placeholder="Buscar…" />
        </div>

        <EmpresaPicker
          clients={clients}
          selectedIds={selectedIds}
          onChange={onSelectionChange}
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
