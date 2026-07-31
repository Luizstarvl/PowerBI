import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
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
      onLogin(data);
    } catch {
      setErro('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-bg">
      <div className="login-panel">
        <div className="login-panel-brand">
          <div className="login-panel-logo">PowerBI</div>
          <div className="login-panel-sub">Gestão de Postos</div>
        </div>
        <div className="login-panel-footer">© 2026 STARVL</div>
      </div>

      <div className="login-form-side">
        <div className="login-form-inner">
          <h2 className="login-form-title">Bem-vindo</h2>
          <p className="login-form-desc">Acesse sua conta para continuar.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label>Usuário</label>
              <input
                type="text"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                placeholder="seu usuário"
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="login-field">
              <label>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••"
                autoComplete="current-password"
              />
            </div>

            {erro && <p className="login-erro">{erro}</p>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
