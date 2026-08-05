import React, { useEffect, useRef } from 'react';

/* ── static data ── */
const AI_ITEMS = [
  'Histórico de vendas','Tendência mensal','Sazonalidade','Crescimento',
  'Mais vendidos','Ticket médio','Datas comemorativas','Estoque','Promoções','Clima',
];
const HIST     = [42, 58, 51, 73, 68, 82];
const PRED     = [88, 97, 108, 118];
const BARS     = [0.45, 0.62, 0.55, 0.78, 0.70, 0.85, 0.92];
const LINE_D   = [0.5, 0.55, 0.48, 0.62, 0.58, 0.72, 0.68, 0.82, 0.88, 0.95];

/* ── helpers ── */
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rng   = (a, b) => a + Math.random() * (b - a);

function animateCounter(el, target, decimals = 0, duration = 1800) {
  if (!el) return;
  const start = performance.now();
  const fmt = v => {
    const n = v.toFixed(decimals);
    return decimals === 0
      ? parseInt(n).toLocaleString('pt-BR')
      : parseFloat(n).toLocaleString('pt-BR', { minimumFractionDigits: decimals });
  };
  const tick = now => {
    const p    = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(ease * target);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════ */
export default function BannerPrevisaoVendas() {
  const bannerRef   = useRef(null);
  const parallaxRef = useRef(null);
  const miniRef     = useRef(null);
  const techRef     = useRef(null);
  const aiRef       = useRef(null);
  const ctrRecRef   = useRef(null);
  const ctrCrRef    = useRef(null);
  const ctrPrRef    = useRef(null);
  const barRef      = useRef(null);
  const circleRef   = useRef(null);
  const miniRafRef  = useRef(null);
  const techRafRef  = useRef(null);

  /* ── Parallax ── */
  useEffect(() => {
    const banner   = bannerRef.current;
    const parallax = parallaxRef.current;
    if (!banner || !parallax) return;
    const onMove = e => {
      const r  = banner.getBoundingClientRect();
      parallax.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%');
      parallax.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%');
    };
    banner.addEventListener('mousemove', onMove);
    return () => banner.removeEventListener('mousemove', onMove);
  }, []);

  /* ── AI items staggered reveal ── */
  useEffect(() => {
    const items   = aiRef.current?.querySelectorAll('.bpv-ai-item');
    if (!items) return;
    const timers  = [];
    items.forEach((el, i) => {
      timers.push(setTimeout(() => el.classList.add('bpv-ai-item--visible'), 900 + i * 130));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  /* ── IntersectionObserver → counters + bar + circle ── */
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      animateCounter(ctrRecRef.current, 1258420, 0);
      animateCounter(ctrCrRef.current,  18.4,    1);
      animateCounter(ctrPrRef.current,  96.8,    1);
      setTimeout(() => { if (barRef.current)    barRef.current.style.width = '75%'; }, 700);
      setTimeout(() => {
        if (circleRef.current)
          circleRef.current.style.strokeDashoffset = 2 * Math.PI * 15 * (1 - 96.8 / 100);
      }, 900);
    }, { threshold: 0.2 });
    if (bannerRef.current) io.observe(bannerRef.current);
    return () => io.disconnect();
  }, []);

  /* ── Mini chart canvas ── */
  useEffect(() => {
    const canvas = miniRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const all  = [...HIST, ...PRED];
    let ctx = null;

    function resize() {
      const w = canvas.offsetWidth || 300;
      canvas.width  = w * dpr;
      canvas.height = 80 * dpr;
      ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
    }
    resize();

    const pad = { l: 8, r: 8, t: 10, b: 12 };
    const GW  = () => canvas.width  / dpr;
    const GH  = () => canvas.height / dpr;
    const ptX = i => pad.l + (i / (all.length - 1)) * (GW() - pad.l - pad.r);
    const ptY = v => {
      const mn = Math.min(...all) - 5, mx = Math.max(...all) + 5;
      return GH() - pad.b - (v - mn) / (mx - mn) * (GH() - pad.t - pad.b);
    };

    const startT = performance.now();
    const DUR    = 2000;

    function draw(now) {
      if (!ctx) { miniRafRef.current = requestAnimationFrame(draw); return; }
      const progress = Math.min((now - startT) / DUR, 1);
      const w = GW(), h = GH();
      ctx.clearRect(0, 0, w, h);

      // axis
      ctx.beginPath(); ctx.moveTo(pad.l, h - pad.b); ctx.lineTo(w - pad.r, h - pad.b);
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.stroke();

      // month labels
      const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out'];
      ctx.fillStyle = 'rgba(161,161,170,.5)'; ctx.font = '8px system-ui'; ctx.textAlign = 'center';
      all.forEach((_, i) => { if (i % 2 === 0) ctx.fillText(months[i] || '', ptX(i), h - 2); });

      const hc = HIST.length;

      // historical line
      ctx.beginPath();
      HIST.forEach((v, i) => {
        const vis = clamp(progress * all.length - i, 0, 1);
        i === 0 ? ctx.moveTo(ptX(i), ptY(v)) : ctx.lineTo(ptX(i), lerp(ptY(HIST[i - 1]), ptY(v), vis));
      });
      ctx.shadowColor = 'rgba(248,250,252,.5)'; ctx.shadowBlur = 6;
      ctx.strokeStyle = 'rgba(248,250,252,.85)'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.shadowBlur = 0;

      // forecast line
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      const joined = [HIST[HIST.length - 1], ...PRED];
      joined.forEach((v, i) => {
        const absI = hc - 1 + i;
        const prog = clamp(progress * all.length - absI, 0, 1);
        i === 0 ? ctx.moveTo(ptX(absI), ptY(v)) : ctx.lineTo(ptX(absI), lerp(ptY(joined[i - 1]), ptY(v), prog));
      });
      ctx.shadowColor = 'rgba(249,115,22,.7)'; ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(249,115,22,.9)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0;

      // pulsing dots
      const t2 = Date.now() / 1000;
      all.forEach((v, i) => {
        if (progress * all.length < i) return;
        const isForecast = i >= hc;
        const pulse = Math.sin(t2 * 2 + i) * 0.3;
        ctx.beginPath();
        ctx.arc(ptX(i), ptY(v), (isForecast ? 3.5 : 3) + pulse, 0, Math.PI * 2);
        ctx.fillStyle    = isForecast ? '#F97316' : 'rgba(248,250,252,.9)';
        ctx.shadowColor  = isForecast ? 'rgba(249,115,22,.8)' : 'rgba(255,255,255,.5)';
        ctx.shadowBlur   = isForecast ? 10 : 6;
        ctx.fill(); ctx.shadowBlur = 0;
      });

      miniRafRef.current = requestAnimationFrame(draw);
    }
    miniRafRef.current = requestAnimationFrame(draw);

    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(miniRafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  /* ── Tech canvas (right panel) ── */
  useEffect(() => {
    const canvas = techRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const dpr = window.devicePixelRatio || 1;
    let W = 0, H = 0, ctx = null;

    function resize() {
      W = parent.clientWidth;
      H = parent.clientHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
    }
    resize();

    const C_O  = '#F97316';
    const C_OL = '#FB923C';

    const particles = Array.from({ length: 40 }, () => ({
      x: rng(0, 1), y: rng(0, 1),
      vx: rng(-0.0003, 0.0003), vy: rng(-0.0004, -0.0001),
      r: rng(1, 3), a: rng(0.1, 0.5),
      color: Math.random() < 0.4 ? C_O : 'rgba(248,250,252,0.5)',
    }));

    const labels = [
      { x: .15, y: .12, txt: '97.2%',     color: C_O },
      { x: .60, y: .08, txt: '↑18.4%',    color: '#4ade80' },
      { x: .05, y: .60, txt: 'R$1.25M',   color: C_OL },
      { x: .55, y: .90, txt: '96.8% acc', color: 'rgba(248,250,252,.6)' },
    ];
    labels.forEach(l => { l.t = rng(0, Math.PI * 2); });

    const nly = [[.22,.4,.58,.76],[.42,.3,.56,.72,.88],[.72,.42,.62]];
    const nlx = [.12, .45, .78];

    let barProg = 0, lineProg = 0;
    const startTime = performance.now();

    function draw(now) {
      if (!ctx || W === 0) { techRafRef.current = requestAnimationFrame(draw); return; }
      const t = (now - startTime) / 1000;
      ctx.clearRect(0, 0, W, H);
      barProg  = Math.min(barProg  + .012, 1);
      lineProg = Math.min(lineProg + .008, 1);

      // faint grid
      ctx.strokeStyle = 'rgba(249,115,22,.04)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // hologram rings
      const cx = W * .65, cy = H * .35;
      [80, 110, 140].forEach((r, i) => {
        const a = 0.06 + Math.sin(t * .6 + i * 1.1) * .04;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(249,115,22,${a})`; ctx.lineWidth = 1; ctx.stroke();
      });

      // neural connections + moving dots
      nly.forEach((col, li) => {
        if (li >= nlx.length - 1) return;
        col.forEach(yf => {
          nly[li + 1].forEach(yf2 => {
            const x1=nlx[li]*W, y1=yf*H, x2=nlx[li+1]*W, y2=yf2*H;
            const pulse = Math.sin(t * 2 + yf * 10 + yf2 * 7) * .5 + .5;
            ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
            ctx.strokeStyle = `rgba(249,115,22,${.04+pulse*.08})`; ctx.lineWidth = 1; ctx.stroke();
            const dt2 = (t * .4 + yf * 3) % 1;
            ctx.beginPath(); ctx.arc(lerp(x1,x2,dt2), lerp(y1,y2,dt2), 1.5, 0, Math.PI*2);
            ctx.fillStyle = `rgba(249,115,22,${.3+pulse*.4})`; ctx.fill();
          });
        });
      });

      // neural nodes
      nly.forEach((col, li) => {
        col.forEach(yf => {
          const nx=nlx[li]*W, ny=yf*H;
          const pulse = Math.sin(t * 2.5 + nx * .02 + ny * .02) * .5 + .5;
          const nr = 4 + pulse;
          const grd = ctx.createRadialGradient(nx,ny,0,nx,ny,nr*3);
          grd.addColorStop(0, `rgba(249,115,22,${.4+pulse*.3})`);
          grd.addColorStop(1, 'transparent');
          ctx.beginPath(); ctx.arc(nx,ny,nr*3,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
          ctx.beginPath(); ctx.arc(nx,ny,nr,0,Math.PI*2);
          ctx.fillStyle = `rgba(249,115,22,${.7+pulse*.3})`; ctx.fill();
        });
      });

      // bar chart
      const bW=W*.55, bH=H*.28, bX=(W-W*.55)/2, bY=H*.68;
      const bBarW = (bW / BARS.length) * .7;
      BARS.forEach((v, i) => {
        const bh = bH * v * barProg;
        const bx = bX + i*(bW/BARS.length) + ((bW/BARS.length)-bBarW)/2;
        const by = bY + bH - bh;
        const grd = ctx.createLinearGradient(bx,by,bx,bY+bH);
        grd.addColorStop(0, C_OL); grd.addColorStop(1, 'rgba(249,115,22,.15)');
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx,by,bBarW,bh,3); else ctx.rect(bx,by,bBarW,bh);
        ctx.fillStyle = grd; ctx.fill();
      });

      // trend line
      const lY1=H*.12, lY2=H*.6, lX1=W*.08, lX2=W*.92;
      const visPts = Math.floor(LINE_D.length * lineProg);
      if (visPts > 1) {
        ctx.beginPath();
        LINE_D.slice(0, visPts).forEach((v, i) => {
          const px = lerp(lX1, lX2, i / (LINE_D.length - 1));
          const py = lerp(lY2, lY1, v);
          i === 0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
        });
        ctx.strokeStyle = C_O; ctx.lineWidth = 2; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(249,115,22,.6)'; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
      }

      // particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x*W, p.y*H, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.color; ctx.globalAlpha = p.a + Math.sin(t + p.x*10) * .1;
        ctx.fill(); ctx.globalAlpha = 1;
      });

      // floating labels
      labels.forEach(l => {
        l.t += .012;
        const fy = Math.sin(l.t) * .012;
        ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'left';
        ctx.fillStyle = l.color; ctx.shadowColor = l.color; ctx.shadowBlur = 8;
        ctx.fillText(l.txt, l.x * W, (l.y + fy) * H); ctx.shadowBlur = 0;
      });

      // AI badge
      const bpx = W * .82, bpy = H * .14;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bpx-28,bpy-12,56,24,6); else ctx.rect(bpx-28,bpy-12,56,24);
      ctx.fillStyle = 'rgba(249,115,22,.12)'; ctx.strokeStyle = 'rgba(249,115,22,.35)';
      ctx.lineWidth = 1; ctx.fill(); ctx.stroke();
      ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center';
      ctx.fillStyle = C_OL; ctx.fillText('🤖 IA', bpx, bpy + 4);

      techRafRef.current = requestAnimationFrame(draw);
    }
    techRafRef.current = requestAnimationFrame(draw);

    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(techRafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  /* ── Button ripple ── */
  function handleRipple(e) {
    const btn = e.currentTarget;
    const r   = btn.getBoundingClientRect();
    const el  = document.createElement('span');
    const d   = Math.max(r.width, r.height);
    el.className = 'bpv-ripple';
    el.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;
    btn.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }

  /* ── JSX ── */
  return (
    <div className="bpv-banner" ref={bannerRef}>
      <div className="bpv-bg-grid" />
      <div className="bpv-shimmer" />
      <div className="bpv-parallax" ref={parallaxRef} />

      <div className="bpv-inner">

        {/* LEFT */}
        <div className="bpv-left">
          <div className="bpv-eyebrow">
            <span className="bpv-eyebrow-dot" />
            IA PREDITIVA · ECLIPSE
          </div>

          <h2 className="bpv-title">
            Previsão <span className="bpv-title-accent">Inteligente</span><br />de Vendas
          </h2>

          <p className="bpv-subtitle">
            Utilizando modelos estatísticos e inteligência artificial para estimar
            seu desempenho comercial com alta precisão e confiança.
          </p>

          <button className="bpv-btn" onClick={handleRipple}>
            <span>📈</span>
            Gerar Nova Previsão
          </button>

          {/* KPI cards */}
          <div className="bpv-kpi-row">
            <div className="bpv-kpi-card">
              <div className="bpv-kpi-label">Receita Prevista</div>
              <div className="bpv-kpi-value">R$&nbsp;<span ref={ctrRecRef}>0</span></div>
              <div className="bpv-kpi-delta">↑ +12,3% vs. mês anterior</div>
            </div>
            <div className="bpv-kpi-card">
              <div className="bpv-kpi-label">Crescimento Esperado</div>
              <div className="bpv-kpi-value">+<span ref={ctrCrRef}>0</span>%</div>
              <div className="bpv-kpi-progress">
                <div className="bpv-kpi-bar" ref={barRef} />
              </div>
            </div>
            <div className="bpv-kpi-card" style={{ position: 'relative' }}>
              <div className="bpv-kpi-label">Precisão do Modelo</div>
              <div className="bpv-kpi-value"><span ref={ctrPrRef}>0</span>%</div>
              <div className="bpv-circle-wrap">
                <svg className="bpv-circle" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
                  <circle
                    ref={circleRef}
                    cx="18" cy="18" r="15" fill="none"
                    stroke="#F97316" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray="94.2" strokeDashoffset="94.2"
                    transform="rotate(-90 18 18)"
                    style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }}
                  />
                </svg>
              </div>
            </div>
            <div className="bpv-kpi-card">
              <div className="bpv-kpi-label">Confiança</div>
              <div className="bpv-kpi-value bpv-confidence">Alta</div>
              <div className="bpv-confidence-badge">✓ Verificado</div>
            </div>
          </div>

          {/* Bottom: mini chart + AI panel */}
          <div className="bpv-bottom">
            <div className="bpv-mini-wrap">
              <div className="bpv-legend">
                <span className="bpv-legend-hist">─ Histórico</span>
                <span className="bpv-legend-pred">- - Previsão</span>
              </div>
              <canvas ref={miniRef} className="bpv-mini-canvas" />
            </div>
            <div className="bpv-ai-panel" ref={aiRef}>
              <div className="bpv-ai-title">🤖 IA analisando:</div>
              <div className="bpv-ai-items">
                {AI_ITEMS.map((txt, i) => (
                  <div key={i} className="bpv-ai-item">
                    <span className="bpv-ai-check">✓</span>
                    {txt}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: tech canvas */}
        <div className="bpv-right">
          <canvas ref={techRef} className="bpv-tech-canvas" />
        </div>

      </div>
    </div>
  );
}
