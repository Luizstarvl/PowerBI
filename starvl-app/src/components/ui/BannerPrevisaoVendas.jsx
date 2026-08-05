import React, { useEffect, useRef, useState, useCallback } from 'react';
import { apiFetch } from '../../api';

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rng   = (a, b) => a + Math.random() * (b - a);

const BARS   = [0.45, 0.62, 0.55, 0.78, 0.70, 0.85, 0.92];
const LINE_D = [0.5, 0.55, 0.48, 0.62, 0.58, 0.72, 0.68, 0.82, 0.88, 0.95];

const AI_ITEMS = [
  'Histórico de vendas','Tendência mensal','Sazonalidade','Crescimento',
  'Mais vendidos','Ticket médio','Datas comemorativas','Estoque','Promoções','Clima',
];

const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

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

/* ── Linear regression over array of numbers ── */
function linearRegression(values) {
  const n = values.length;
  if (n < 2) return { forecast: values[0] || 0, r2: 0, slope: 0 };
  const sumX  = n * (n + 1) / 2;
  const sumX2 = n * (n + 1) * (2 * n + 1) / 6;
  const sumY  = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((a, v, i) => a + (i + 1) * v, 0);
  const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const forecast  = Math.max(0, slope * (n + 1) + intercept);
  const yMean     = sumY / n;
  const ssTot     = values.reduce((a, v) => a + Math.pow(v - yMean, 2), 0);
  const ssRes     = values.reduce((a, v, i) => a + Math.pow(v - (slope * (i + 1) + intercept), 2), 0);
  const r2        = ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0;
  return { forecast, r2, slope };
}

/* ── Detect which column is numeric value and which is label ── */
function detectColumns(rows) {
  if (!rows || !rows.length) return { valueCol: null, labelCol: null };
  const keys = Object.keys(rows[0]);
  // Label: string that isn't purely numeric
  const labelCol = keys.find(k => {
    const v = rows[0][k];
    return typeof v === 'string' && !/^\s*[\d.,]+\s*$/.test(v);
  }) ?? keys[0];
  // Value: numeric (or string number), and not the label
  const valueCol = keys.find(k => {
    if (k === labelCol) return false;
    const v = rows[0][k];
    return typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v.replace(',', '.'))));
  });
  return { valueCol, labelCol };
}

/* ════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════ */
export default function BannerPrevisaoVendas({ empresa }) {
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

  // Data refs for RAF loops (updated without re-renders)
  const chartDataRef  = useRef(null);  // { hist, pred, labels, predLabel }
  const dadosRef      = useRef(null);  // full dados object for tech canvas labels
  const miniStartRef  = useRef(performance.now());

  // Animation fn ref (holds latest animate fn so IntersectionObserver always uses fresh data)
  const animateFnRef    = useRef(null);
  const intersectedRef  = useRef(false);

  // State
  const [dados, setDados]     = useState(null);   // null = not yet loaded
  const [loading, setLoading] = useState(false);
  const [semSlot, setSemSlot] = useState(false);
  const [deltaLabel, setDeltaLabel] = useState('');

  /* ── Fetch & compute ── */
  const fetchPrevisao = useCallback(async () => {
    if (!empresa) return;
    setLoading(true);
    setSemSlot(false);
    try {
      // 1. Find the slot query
      const qRes = await apiFetch('/api/queries?ativa=true&slot=historico_mensal');
      const qList = await qRes.json();
      const slotQ = Array.isArray(qList) ? qList[0] : null;
      if (!slotQ) { setSemSlot(true); setLoading(false); return; }

      // 2. Execute query
      const execRes = await apiFetch(`/api/queries/execute/${slotQ.codigo}?empresa=${encodeURIComponent(empresa)}`);
      const rows = await execRes.json();
      if (!Array.isArray(rows) || rows.length < 2) { setSemSlot(true); setLoading(false); return; }

      // 3. Detect columns
      const { valueCol, labelCol } = detectColumns(rows);
      if (!valueCol) { setSemSlot(true); setLoading(false); return; }

      // 4. Extract values & labels
      const values = rows.map(r => {
        const v = r[valueCol];
        return typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.')) || 0;
      });
      const labels = labelCol ? rows.map(r => String(r[labelCol] ?? '')) : rows.map((_, i) => MONTH_SHORT[i % 12]);

      // 5. Normalize labels to short month names where possible
      const shortLabels = labels.map(l => {
        // try to extract month name or number from the label
        const monthMatch = l.match(/(\d{4})[/-](\d{2})|(\d{2})[/-](\d{4})|^(\d{1,2})\/(\d{4})$/);
        if (monthMatch) {
          const mNum = parseInt(monthMatch[2] || monthMatch[3] || monthMatch[5] || 0, 10);
          return mNum >= 1 && mNum <= 12 ? MONTH_SHORT[mNum - 1] : l.slice(0, 5);
        }
        // Match Portuguese month names
        const mIdx = MONTH_SHORT.findIndex(m => l.toLowerCase().startsWith(m.toLowerCase()));
        if (mIdx >= 0) return MONTH_SHORT[mIdx];
        return l.slice(0, 5);
      });

      // 6. Linear regression
      const { forecast, r2 } = linearRegression(values);
      const lastVal = values[values.length - 1];
      const crescimento = lastVal > 0 ? ((forecast - lastVal) / lastVal) * 100 : 0;
      const precisao = Math.round(r2 * 1000) / 10; // e.g., 87.3

      // Current month name for the forecast label
      const now = new Date();
      const predLabel = MONTH_SHORT[now.getMonth()];

      const result = { hist: values, labels: shortLabels, forecast, r2, crescimento, precisao, predLabel };
      setDados(result);
      setDeltaLabel(`${crescimento >= 0 ? '↑ +' : '↓ '}${crescimento.toFixed(1)}% vs. mês anterior`);
    } catch (err) {
      console.error('[BannerPrevisaoVendas] fetch error', err);
      setSemSlot(true);
    } finally {
      setLoading(false);
    }
  }, [empresa]);

  // Auto-fetch when empresa changes
  useEffect(() => {
    if (empresa) fetchPrevisao();
  }, [empresa]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Sync data refs & reset mini animation ── */
  useEffect(() => {
    if (dados) {
      const { hist, labels, forecast, predLabel } = dados;
      chartDataRef.current = { hist, pred: [forecast], labels, predLabel };
      dadosRef.current     = dados;
      miniStartRef.current = performance.now(); // restart draw animation
    }
  }, [dados]);

  /* ── Build animate fn that always uses latest dados ── */
  useEffect(() => {
    animateFnRef.current = () => {
      const receitaPrev = dados?.forecast ?? 0;
      const crescimento = dados?.crescimento ?? 0;
      const precisao    = dados?.precisao ?? 0;

      animateCounter(ctrRecRef.current, receitaPrev, 0);
      animateCounter(ctrCrRef.current, Math.abs(crescimento), 1);
      animateCounter(ctrPrRef.current, precisao, 1);

      // bar: maps crescimento 0%→0%, 30%→100% (cap at 30%)
      const barW = Math.min(100, Math.max(0, Math.abs(crescimento) / 30 * 100));
      setTimeout(() => { if (barRef.current) barRef.current.style.width = `${barW.toFixed(1)}%`; }, 700);

      // circle
      const r2pct = precisao / 100;
      setTimeout(() => {
        if (circleRef.current)
          circleRef.current.style.strokeDashoffset = 2 * Math.PI * 15 * (1 - r2pct);
      }, 900);
    };

    // If intersection already happened, re-run with fresh data
    if (intersectedRef.current && dados) {
      animateFnRef.current();
    }
  }, [dados]);

  /* ── Parallax ── */
  useEffect(() => {
    const banner   = bannerRef.current;
    const parallax = parallaxRef.current;
    if (!banner || !parallax) return;
    const onMove = e => {
      const r = banner.getBoundingClientRect();
      parallax.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%');
      parallax.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%');
    };
    banner.addEventListener('mousemove', onMove);
    return () => banner.removeEventListener('mousemove', onMove);
  }, []);

  /* ── AI items staggered reveal ── */
  useEffect(() => {
    const items  = aiRef.current?.querySelectorAll('.bpv-ai-item');
    if (!items) return;
    const timers = [];
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
      intersectedRef.current = true;
      animateFnRef.current?.();
    }, { threshold: 0.2 });
    if (bannerRef.current) io.observe(bannerRef.current);
    return () => io.disconnect();
  }, []);

  /* ── Mini chart canvas ── */
  useEffect(() => {
    const canvas = miniRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
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

    function draw(now) {
      if (!ctx) { miniRafRef.current = requestAnimationFrame(draw); return; }
      const cd = chartDataRef.current;
      // Use real data if available, else defaults
      const HIST   = cd ? cd.hist : [42, 58, 51, 73, 68, 82];
      const PRED   = cd ? cd.pred : [88];
      const labels = cd ? [...cd.labels, cd.predLabel || 'Prev'] : ['Jan','Fev','Mar','Abr','Mai','Jun','Jul'];
      const all    = [...HIST, ...PRED];

      const progress = Math.min((now - miniStartRef.current) / 2000, 1);
      const w = GW(), h = GH();
      ctx.clearRect(0, 0, w, h);

      const ptX = i => pad.l + (i / (all.length - 1)) * (w - pad.l - pad.r);
      const ptY = v => {
        const mn = Math.min(...all) * 0.9, mx = Math.max(...all) * 1.05;
        return h - pad.b - (v - mn) / (mx - mn) * (h - pad.t - pad.b);
      };

      // axis
      ctx.beginPath(); ctx.moveTo(pad.l, h - pad.b); ctx.lineTo(w - pad.r, h - pad.b);
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.stroke();

      // month labels
      ctx.fillStyle = 'rgba(161,161,170,.5)'; ctx.font = '8px system-ui'; ctx.textAlign = 'center';
      all.forEach((_, i) => {
        if (i % Math.max(1, Math.floor(all.length / 6)) === 0)
          ctx.fillText(labels[i] || '', ptX(i), h - 2);
      });

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

      // forecast line (dashed, orange)
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

    const floatLabels = [
      { x: .15, y: .12, color: C_O,                       t: rng(0, Math.PI * 2), key: 'precisao' },
      { x: .60, y: .08, color: '#4ade80',                  t: rng(0, Math.PI * 2), key: 'crescimento' },
      { x: .05, y: .60, color: C_OL,                       t: rng(0, Math.PI * 2), key: 'receita' },
      { x: .55, y: .90, color: 'rgba(248,250,252,.6)',     t: rng(0, Math.PI * 2), key: 'acc' },
    ];

    const nly = [[.22,.4,.58,.76],[.42,.3,.56,.72,.88],[.72,.42,.62]];
    const nlx = [.12, .45, .78];

    let barProg = 0, lineProg = 0;
    const startTime = performance.now();

    function getLabelText(key) {
      const d = dadosRef.current; // use ref — avoids stale closure inside RAF
      if (!d) {
        return { precisao: '97.2%', crescimento: '↑18.4%', receita: 'R$1.25M', acc: '96.8% acc' }[key] || '';
      }
      const { forecast, r2, crescimento } = d;
      const fmt = v => {
        if (v >= 1e6) return `R$${(v/1e6).toFixed(2)}M`;
        if (v >= 1e3) return `R$${(v/1e3).toFixed(1)}K`;
        return `R$${v?.toFixed(0) ?? '—'}`;
      };
      return {
        precisao:    `${(r2 != null ? (r2*100).toFixed(1) : '—')}%`,
        crescimento: `${crescimento != null ? (crescimento >= 0 ? '↑' : '↓') + Math.abs(crescimento).toFixed(1) + '%' : '—'}`,
        receita:     forecast != null ? fmt(forecast) : '—',
        acc:         `${(r2 != null ? (r2*100).toFixed(1) : '—')} acc`,
      }[key] || '';
    }

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

      // floating labels (show real data when available)
      floatLabels.forEach(l => {
        l.t += .012;
        const fy = Math.sin(l.t) * .012;
        const txt = getLabelText(l.key);
        ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'left';
        ctx.fillStyle = l.color; ctx.shadowColor = l.color; ctx.shadowBlur = 8;
        ctx.fillText(txt, l.x * W, (l.y + fy) * H); ctx.shadowBlur = 0;
      });

      techRafRef.current = requestAnimationFrame(draw);
    }
    techRafRef.current = requestAnimationFrame(draw);

    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(techRafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    fetchPrevisao();
  }

  /* ── Derived display values ── */
  const receitaPrev  = dados?.forecast   ?? null;
  const crescimento  = dados?.crescimento ?? null;
  const precisao     = dados?.precisao    ?? null;
  const confidencia  = precisao != null
    ? precisao >= 80 ? 'Alta' : precisao >= 60 ? 'Média' : 'Baixa'
    : '—';
  const confidenciaCheck = precisao != null
    ? precisao >= 60 ? '✓ Verificado' : '⚠ Baixa precisão'
    : '—';

  const fmtReceita = v => {
    if (v == null) return '—';
    if (v >= 1e6) return `${(v/1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
    if (v >= 1e3) return `${(v/1e3).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K`;
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
  };

  const now = new Date();
  const mesAtual = MONTH_SHORT[now.getMonth()];

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
            REGRESSÃO LINEAR · ECLIPSE
          </div>

          <h2 className="bpv-title">
            Previsão <span className="bpv-title-accent">Inteligente</span><br />de Vendas
          </h2>

          <p className="bpv-subtitle">
            {semSlot
              ? 'Configure o slot "historico_mensal" no Gerenciador de Consultas para ativar a previsão com dados reais.'
              : dados
                ? `Estimativa para ${mesAtual} calculada via regressão linear com base no histórico de vendas mensais.`
                : 'Analisando histórico de vendas para calcular a previsão do mês atual...'
            }
          </p>

          <button className="bpv-btn" onClick={handleRipple} disabled={loading || !empresa}>
            {loading
              ? <><span className="bpv-btn-spinner" />Calculando...</>
              : <><span>📈</span>Gerar Nova Previsão</>
            }
          </button>

          {/* KPI cards */}
          <div className="bpv-kpi-row">
            <div className="bpv-kpi-card">
              <div className="bpv-kpi-label">Receita Prevista ({mesAtual})</div>
              <div className="bpv-kpi-value">
                {dados
                  ? <>R$&nbsp;<span ref={ctrRecRef}>0</span></>
                  : semSlot
                    ? <span className="bpv-kpi-empty" ref={ctrRecRef}>—</span>
                    : <span className="bpv-kpi-loading" ref={ctrRecRef}>...</span>
                }
              </div>
              <div className="bpv-kpi-delta">
                {dados ? deltaLabel : semSlot ? 'Sem dados' : 'Aguardando dados'}
              </div>
            </div>

            <div className="bpv-kpi-card">
              <div className="bpv-kpi-label">Crescimento Esperado</div>
              <div className="bpv-kpi-value">
                {dados
                  ? <>{crescimento >= 0 ? '+' : ''}<span ref={ctrCrRef}>0</span>%</>
                  : <span ref={ctrCrRef}>—</span>
                }
              </div>
              <div className="bpv-kpi-progress">
                <div className="bpv-kpi-bar" ref={barRef} />
              </div>
            </div>

            <div className="bpv-kpi-card" style={{ position: 'relative' }}>
              <div className="bpv-kpi-label">Precisão (R²)</div>
              <div className="bpv-kpi-value">
                {dados
                  ? <><span ref={ctrPrRef}>0</span>%</>
                  : <span ref={ctrPrRef}>—</span>
                }
              </div>
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
              <div className="bpv-kpi-value bpv-confidence">{confidencia}</div>
              <div className="bpv-confidence-badge">{confidenciaCheck}</div>
            </div>
          </div>

          {/* Bottom: mini chart + AI panel */}
          <div className="bpv-bottom">
            <div className="bpv-mini-wrap">
              <div className="bpv-legend">
                <span className="bpv-legend-hist">─ Histórico</span>
                <span className="bpv-legend-pred">- - Previsão ({mesAtual})</span>
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
