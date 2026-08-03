import React from 'react';
import { Logo } from '../ui';

export default function HeroSection() {
  return (
    <div className="login-hero">
      <div className="login-hero-brand reveal reveal-1">
        <Logo className="login-hero-logo" variant="dark" />
      </div>
      <h1 className="login-hero-title reveal reveal-2">
        Controle completo<br /><span>do seu posto.</span>
      </h1>
      <p className="login-hero-desc reveal reveal-3">
        Tudo que você precisa para gerir seu posto com eficiência, praticidade e segurança.
      </p>
    </div>
  );
}
