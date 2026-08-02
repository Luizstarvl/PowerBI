import React from 'react';
import ParticleLayer from './ParticleLayer';

// Fundo do painel esquerdo: preto + glow radial laranja (CSS) + partículas/
// pontos de luz animados (canvas) por cima.
export default function AnimatedBackground() {
  return (
    <div className="login-bg-layer" aria-hidden="true">
      <div className="login-bg-glow login-bg-glow--1" />
      <div className="login-bg-glow login-bg-glow--2" />
      <ParticleLayer />
    </div>
  );
}
