import React, { useState, useEffect } from 'react';
import Login from './Login';
import TopBar from './TopBar';
import NavBar from './NavBar';
import Dashboard from './Dashboard';
import Usuarios from './Usuarios';
import Parametros from './Parametros';
import { LangProvider } from './i18n';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

function getCurrentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('pbi_user')) || null; }
    catch { return null; }
  });
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
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

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/clients`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length) {
          setClients(data);
          setSelectedClient(data[0]);
        }
      })
      .catch(() => {});
  }, [user]);

  function handleLogin(data) {
    sessionStorage.setItem('pbi_user', JSON.stringify(data));
    setUser(data);
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

  function handleLogout() {
    sessionStorage.removeItem('pbi_user');
    setUser(null);
  }

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <LangProvider>
    <div className="app-root" data-theme={appliedTheme}>
      <TopBar
        user={user}
        clients={clients}
        selectedClient={selectedClient}
        onClientChange={setSelectedClient}
        onLogout={handleLogout}
        themeMode={themeMode}
        onThemeToggle={handleThemeToggle}
      />
      <div className="app-body">
        <NavBar page={page} onPageChange={handlePageChange} />
        <div className="app-content">
          {visited.has('dashboard') && (
            <div className={`page-slot${page === 'dashboard' ? ' page-active' : ''}`}>
              <Dashboard empresa={selectedClient?.codigoEmpresa} period={period} />
            </div>
          )}
          {visited.has('usuarios') && (
            <div className={`page-slot${page === 'usuarios' ? ' page-active' : ''}`}>
              <Usuarios />
            </div>
          )}
          {visited.has('parametros') && (
            <div className={`page-slot${page === 'parametros' ? ' page-active' : ''}`}>
              <Parametros themeMode={themeMode} onThemeModeChange={handleThemeModeChange} />
            </div>
          )}
        </div>
      </div>
    </div>
    </LangProvider>
  );
}
