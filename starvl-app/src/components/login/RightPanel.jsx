import React, { useRef } from 'react';
import { ShieldCheck } from 'lucide-react';
import LoginForm from './LoginForm';

export default function RightPanel({ onSubmit, loading, erro }) {
  const cardRef = useRef(null);

  function handleMouseMove(e) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty('--tilt-x', `${(-y * 4).toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${(x * 4).toFixed(2)}deg`);
  }
  function handleMouseLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  }

  return (
    <div className="login-right">
      <div
        ref={cardRef}
        className="login-card reveal reveal-7"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <h2 className="login-card-title">Bem-vindo!</h2>
        <p className="login-card-desc">Acesse sua conta para continuar.</p>

        <LoginForm onSubmit={onSubmit} loading={loading} erro={erro} />

        <div className="login-security">
          <ShieldCheck size={18} />
          <div>
            <strong>Ambiente seguro e criptografado</strong>
            <span>Seus dados protegidos com tecnologia de ponta.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
