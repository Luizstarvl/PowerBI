import React, { useState } from 'react';
import LeftPanel from '../components/login/LeftPanel';
import RightPanel from '../components/login/RightPanel';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

export default function Login({ onLogin }) {
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(usuario, senha, lembrar) {
    setErro('');
    if (!usuario.trim() || !senha) {
      setErro('Informe usuário e senha.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/starvl-users/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.trim(), senha }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErro(data.error || 'Usuário ou senha inválidos.');
        return;
      }
      onLogin(data, lembrar);
    } catch {
      setErro('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-bg">
      <LeftPanel />
      <RightPanel onSubmit={handleSubmit} loading={loading} erro={erro} />
    </div>
  );
}
