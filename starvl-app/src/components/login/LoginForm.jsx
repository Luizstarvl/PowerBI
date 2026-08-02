import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginForm({ onSubmit, loading, erro }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [ripple, setRipple] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(usuario, senha, lembrar);
  }

  function handleButtonMouseDown(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() });
  }

  return (
    <form className="login-formv2" onSubmit={handleSubmit}>
      <div className="login-fieldv2 reveal reveal-8">
        <label>Usuário</label>
        <div className="login-inputv2-wrap">
          <User size={17} className="login-input-icon" />
          <input
            type="text" value={usuario} onChange={e => setUsuario(e.target.value)}
            placeholder="Digite seu usuário" autoFocus autoComplete="username"
          />
        </div>
      </div>

      <div className="login-fieldv2 reveal reveal-8">
        <label>Senha</label>
        <div className="login-inputv2-wrap">
          <Lock size={17} className="login-input-icon" />
          <input
            type={showSenha ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)}
            placeholder="Digite sua senha" autoComplete="current-password"
          />
          <button
            type="button" className="login-input-toggle" tabIndex={-1}
            onClick={() => setShowSenha(s => !s)}
            aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="login-row reveal reveal-8">
        <label className="login-remember">
          <input type="checkbox" checked={lembrar} onChange={e => setLembrar(e.target.checked)} />
          <span className="login-remember-box" />
          Lembrar meu acesso
        </label>
        <span className="login-forgot" title="Fale com o administrador do sistema para redefinir sua senha">
          Esqueceu sua senha?
        </span>
      </div>

      {erro && <p className="login-erro">{erro}</p>}

      <button type="submit" className="login-btnv2 reveal reveal-9" disabled={loading} onMouseDown={handleButtonMouseDown}>
        {ripple && (
          <span
            key={ripple.id}
            className="login-btn-ripple"
            style={{ left: ripple.x, top: ripple.y }}
            onAnimationEnd={() => setRipple(null)}
          />
        )}
        <span>{loading ? 'Entrando…' : 'Entrar'}</span>
        {!loading && <ArrowRight size={18} />}
      </button>
    </form>
  );
}
