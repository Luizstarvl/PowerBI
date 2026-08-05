import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import TopBar from './layout/TopBar';
import NavBar from './layout/NavBar';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Cadastros from './pages/Cadastros';
import Parametros from './pages/Parametros';
import PlanejamentoComercial from './pages/PlanejamentoComercial';
import AnimatedBackground from './components/login/AnimatedBackground';
import { LangProvider } from './i18n';
import { apiFetch, setApiToken, clearApiToken } from './api';
import './App.css';

function getCurrentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function initUserFromStorage() {
  try {
    const stored = sessionStorage.getItem('pbi_user') || localStorage.getItem('pbi_user');
    if (!stored) return null;
    const u = JSON.parse(stored);
    const t = sessionStorage.getItem('pbi_token') || localStorage.getItem('pbi_token');
    if (t) setApiToken(t);
    return u;
  } catch { return null; }
}

export default function App() {
  const [user, setUser] = useState(initUserFromStorage);
  const [clients, setClients] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [period] = useState(getCurrentPeriod);
  const [page, setPage] = useState('dashboard');
  const [visited, setVisited] = useState(() => new Set(['dashboard']));
  const [themeMode, setThemeMode] = useState(() => {
    const saved   = localStorage.getItem('pbi_theme') || 'dark';
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const applied = saved === 'auto' ? (sysDark ? 'dark' : 'light') : saved;
    document.documentElement.setAttribute('data-theme', applied);
    return saved;
  });
  const [sysDark, setSysDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => setSysDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const appliedTheme = themeMode === 'auto' ? (sysDark ? 'dark' : 'light') : themeMode;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appliedTheme);
  }, [appliedTheme]);

  // Auto-logout quando o JWT expira (401 vindo da API)
  useEffect(() => {
    const handler = () => handleLogout();
    window.addEventListener('starvl:unauthorized', handler);
    return () => window.removeEventListener('starvl:unauthorized', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    apiFetch('/api/clients')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length) {
          setClients(data);
          setSelectedIds([data[0].codigoEmpresa]);
        }
      })
      .catch(() => {});
  }, [user]);

  function handleLogin(data, lembrar) {
    const { token, ...userObj } = data;
    const json = JSON.stringify(userObj);
    if (lembrar) {
      localStorage.setItem('pbi_user',  json);
      localStorage.setItem('pbi_token', token);
      sessionStorage.removeItem('pbi_user');
      sessionStorage.removeItem('pbi_token');
    } else {
      sessionStorage.setItem('pbi_user',  json);
      sessionStorage.setItem('pbi_token', token);
      localStorage.removeItem('pbi_user');
      localStorage.removeItem('pbi_token');
    }
    setApiToken(token);
    setUser(userObj);
  }

  function handleLogout() {
    sessionStorage.removeItem('pbi_user');
    sessionStorage.removeItem('pbi_token');
    localStorage.removeItem('pbi_user');
    localStorage.removeItem('pbi_token');
    clearApiToken();
    setUser(null);
  }

  function handleThemeModeChange(mode) {
    setThemeMode(mode);
    localStorage.setItem('pbi_theme', mode);
  }

  function handleThemeToggle() {
    const cycle = ['dark', 'light', 'auto'];
    handleThemeModeChange(cycle[(cycle.indexOf(themeMode) + 1) % cycle.length]);
  }

  function handlePageChange(newPage) {
    setVisited(prev => { const s = new Set(prev); s.add(newPage); return s; });
    setPage(newPage);
  }

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <LangProvider>
    <div className="app-root" data-theme={appliedTheme} onContextMenu={e => e.preventDefault()}>
      <div className="app-anim-bg" aria-hidden="true"><AnimatedBackground /></div>
      <TopBar
        user={user}
        clients={clients}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onLogout={handleLogout}
        themeMode={themeMode}
        onThemeToggle={handleThemeToggle}
      />
      <div className="app-body">
        <NavBar page={page} onPageChange={handlePageChange} user={user} />
        <div className="app-content">
          {visited.has('dashboard') && (
            <div className={`page-slot${page === 'dashboard' ? ' page-active' : ''}`}>
              <Dashboard empresas={selectedIds} period={period} onNavigate={handlePageChange} />
            </div>
          )}
          {visited.has('planejamento_comercial') && (
            <div className={`page-slot${page === 'planejamento_comercial' ? ' page-active' : ''}`}>
              <PlanejamentoComercial empresas={selectedIds} clients={clients} />
            </div>
          )}
          {visited.has('cadastros') && (
            <div className={`page-slot${page === 'cadastros' ? ' page-active' : ''}`}>
              <Cadastros empresas={selectedIds} />
            </div>
          )}
          {visited.has('usuarios') && (
            <div className={`page-slot${page === 'usuarios' ? ' page-active' : ''}`}>
              <Usuarios user={user} />
            </div>
          )}
          {visited.has('parametros') && (
            <div className={`page-slot${page === 'parametros' ? ' page-active' : ''}`}>
              <Parametros themeMode={themeMode} onThemeModeChange={handleThemeModeChange} user={user} />
            </div>
          )}
        </div>
      </div>
    </div>
    </LangProvider>
  );
}
