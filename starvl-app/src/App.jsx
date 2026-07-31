import React, { useState, useEffect } from 'react';
import Login from './Login';
import TopBar from './TopBar';
import NavBar from './NavBar';
import Dashboard from './Dashboard';
import Usuarios from './Usuarios';
import Parametros from './Parametros';
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
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('pbi_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    return saved;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

  function handleThemeToggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('pbi_theme', next);
    document.documentElement.setAttribute('data-theme', next);
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
    <div className="app-root" data-theme={theme}>
      <TopBar
        user={user}
        clients={clients}
        selectedClient={selectedClient}
        onClientChange={setSelectedClient}
        onLogout={handleLogout}
        theme={theme}
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
              <Parametros />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
