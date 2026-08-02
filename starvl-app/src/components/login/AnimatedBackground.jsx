import React from 'react';
import ParticleLayer from './ParticleLayer';
import stationBg from '../../assets/login/station-bg.png';

// Fundo do painel esquerdo: a ilustração do posto (imagem real) + glow radial
// laranja (CSS) + partículas/pontos de luz animados (canvas) por cima.
export default function AnimatedBackground() {
  return (
    <div className="login-bg-layer" aria-hidden="true">
      <div className="login-bg-photo" style={{ backgroundImage: `url(${stationBg})` }} />
      <div className="login-bg-fade login-bg-fade--top" />
      <div className="login-bg-fade login-bg-fade--bottom" />
      <div className="login-bg-glow login-bg-glow--1" />
      <div className="login-bg-glow login-bg-glow--2" />
      <ParticleLayer />
    </div>
  );
}
