import React, { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 55;
const RGB = '249,115,22';

function rand(min, max) { return Math.random() * (max - min) + min; }

// Partículas laranja flutuando + algumas linhas finas — puramente decorativo.
export default function ParticleLayer() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf;
    let width = 0, height = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: rand(0, width), y: rand(0, height),
      r: rand(0.6, 2.2), speed: rand(0.05, 0.22), drift: rand(-0.06, 0.06),
      alpha: rand(0.15, 0.6), phase: rand(0, Math.PI * 2),
    }));

    const lines = Array.from({ length: 4 }, () => ({
      x1: rand(0, width), y1: rand(0, height),
      x2: rand(0, width), y2: rand(0, height),
      alpha: rand(0.04, 0.09),
    }));

    function draw(time) {
      ctx.clearRect(0, 0, width, height);

      lines.forEach(l => {
        ctx.globalAlpha = l.alpha;
        ctx.strokeStyle = `rgb(${RGB})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
      });

      particles.forEach(p => {
        if (!reduceMotion) {
          p.y -= p.speed;
          p.x += p.drift;
          if (p.y < -10) { p.y = height + 10; p.x = rand(0, width); }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }
        const twinkle = reduceMotion ? p.alpha : p.alpha * (0.7 + 0.3 * Math.sin(time / 900 + p.phase));
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = `rgb(${RGB})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      if (!reduceMotion) raf = requestAnimationFrame(draw);
    }
    draw(0);

    function onResize() { resize(); }
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-layer" aria-hidden="true" />;
}
