import React, { useState, useEffect } from 'react';
import Login from './Login';
import TopBar from './TopBar';
import Dashboard from './Dashboard';
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
  const [period, setPeriod] = useState(getCurrentPeriod);

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

  function handleLogout() {
    sessionStorage.removeItem('pbi_user');
    setUser(null);
  }

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="app-root">
      <TopBar
        user={user}
        clients={clients}
        selectedClient={selectedClient}
        onClientChange={setSelectedClient}
        period={period}
        onPeriodChange={setPeriod}
        onLogout={handleLogout}
      />
      <Dashboard empresa={selectedClient?.codigoEmpresa} period={period} />
    </div>
  );
}
