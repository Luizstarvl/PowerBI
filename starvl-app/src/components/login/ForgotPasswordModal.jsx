import React, { useState } from 'react';
import { X, KeyRound } from 'lucide-react';
import Portal from '../../Portal';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

export default function ForgotPasswordModal({ onClose }) {
  const [usuario, setUsuario] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!usuario.trim()) { setErro('Informe seu usuário.'); return; }
    setErro(''); setLoading(true);
    try {
      await fetch(`${API_URL}/api/password-resets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.trim() }),
      });
      // Resposta é sempre genérica (não revela se o usuário existe), então
      // mostramos a mesma confirmação independente do resultado.
      setEnviado(true);
    } catch {
      setErro('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Portal>
      <div className="login-forgot-overlay" onClick={onClose}>
        <div className="login-forgot-modal" onClick={e => e.stopPropagation()}>
          <button type="button" className="login-forgot-close" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>

          <div className="login-forgot-icon"><KeyRound size={22} /></div>

          {enviado ? (
            <>
              <h3 className="login-forgot-title">Solicitação enviada!</h3>
              <p className="login-forgot-desc">
                Se o usuário existir, um administrador foi notificado e vai redefinir
                sua senha em breve. Procure o administrador do sistema caso seja urgente.
              </p>
              <button type="button" className="login-btnv2" onClick={onClose}>
                <span>Entendido</span>
              </button>
            </>
          ) : (
            <>
              <h3 className="login-forgot-title">Esqueceu sua senha?</h3>
              <p className="login-forgot-desc">
                Informe seu usuário. Um administrador do sistema será notificado
                para redefinir sua senha.
              </p>
              <form onSubmit={handleSubmit}>
                <div className="login-inputv2-wrap">
                  <input
                    type="text" value={usuario} onChange={e => setUsuario(e.target.value)}
                    placeholder="Digite seu usuário" autoFocus autoComplete="username"
                  />
                </div>
                {erro && <p className="login-erro" style={{ marginTop: 12 }}>{erro}</p>}
                <button type="submit" className="login-btnv2" disabled={loading} style={{ marginTop: 16 }}>
                  <span>{loading ? 'Enviando…' : 'Solicitar redefinição'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}
