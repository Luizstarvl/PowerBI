import React, { useEffect, useRef } from 'react';

// Contorno aproximado do Brasil em coordenadas normalizadas (0-1) — não é
// dado geográfico oficial, só o suficiente pra dar uma silhueta reconhecível
// pro mapa de pontos decorativo atrás da ilustração.
const BRAZIL_OUTLINE = [
  [0.20, 0.05], [0.35, 0.02], [0.50, 0.04], [0.58, 0.10],
  [0.62, 0.18], [0.72, 0.20], [0.85, 0.24], [0.95, 0.30],
  [0.92, 0.38], [0.82, 0.40], [0.78, 0.46], [0.80, 0.52],
  [0.74, 0.58], [0.68, 0.62], [0.70, 0.68], [0.62, 0.74],
  [0.55, 0.78], [0.50, 0.86], [0.42, 0.94], [0.36, 0.90],
  [0.38, 0.82], [0.30, 0.76], [0.26, 0.68], [0.18, 0.62],
  [0.14, 0.54], [0.10, 0.46], [0.08, 0.36], [0.06, 0.26],
  [0.10, 0.16], [0.15, 0.09],
];

// Alguns "hubs" (pontos aproximados de capitais) só pra desenhar linhas de
// conexão por cima do mapa de pontos — também não é geograficamente exato.
const HUBS = [[0.30, 0.20], [0.75, 0.28], [0.45, 0.55], [0.35, 0.80]];

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function MapLayer() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const step = 7;
    ctx.fillStyle = 'rgb(249,115,22)';
    for (let px = 0; px < width; px += step) {
      for (let py = 0; py < height; py += step) {
        const nx = px / width;
        const ny = py / height;
        if (!pointInPolygon(nx, ny, BRAZIL_OUTLINE)) continue;
        const jx = px + (Math.random() - 0.5) * 2;
        const jy = py + (Math.random() - 0.5) * 2;
        ctx.globalAlpha = Math.random() * 0.35 + 0.12;
        ctx.beginPath();
        ctx.arc(jx, jy, Math.random() * 0.9 + 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    const hubPx = HUBS.map(([nx, ny]) => [nx * width, ny * height]);
    ctx.strokeStyle = 'rgba(251,146,60,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < hubPx.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(hubPx[i][0], hubPx[i][1]);
      ctx.lineTo(hubPx[i + 1][0], hubPx[i + 1][1]);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgb(251,146,60)';
    hubPx.forEach(([x, y]) => {
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }, []);

  return <canvas ref={canvasRef} className="map-layer" aria-hidden="true" />;
}
