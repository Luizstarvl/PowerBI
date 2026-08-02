import React from 'react';
import ParticleLayer from './ParticleLayer';
import MapLayer from './MapLayer';

// Fundo do painel esquerdo do login: preto + glow radial laranja (CSS) +
// mapa pontilhado + partículas (canvas). Sempre atrás do conteúdo real.
export default function AnimatedBackground() {
  return (
    <div className="login-bg-layer" aria-hidden="true">
      <div className="login-bg-glow login-bg-glow--1" />
      <div className="login-bg-glow login-bg-glow--2" />
      <MapLayer />
      <ParticleLayer />
    </div>
  );
}
