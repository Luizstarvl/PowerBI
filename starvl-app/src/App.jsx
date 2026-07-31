import React, { useState } from 'react';
import Login from './Login';
import './App.css';

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('pbi_user')) || null; }
    catch { return null; }
  });

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
      <button onClick={handleLogout} className="logout-btn">Sair</button>
    </div>
  );
}
