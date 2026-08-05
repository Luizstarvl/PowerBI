import React, { useEffect, useRef, useState, useCallback } from 'react';
import { apiFetch } from '../../api';
import { DollarSign, TrendingUp, Target, ShieldCheck } from 'lucide-react';

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function linearRegression(values) {
  const n = values.length;
  if (n < 2) return { forecast: values[0] || 0, r2: 0 };
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
  return { forecast, r2 };
}

function detectColumns(rows) {
  if (!rows?.length) return { valueCol: null, labelCol: null };
  const keys = Object.keys(rows[0]);
  const labelCol = keys.find(k => {
    const v = rows[0][k];
    return typeof v === 'string' && !/^\s*[\d.,]+\s*$/.test(v);
  }) ?? keys[0];
  const valueCol = keys.find(k => {
    if (k === labelCol) return false;
    const v = rows[0][k];
    return typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v.replace(',', '.'))));
  });
  return { valueCol, labelCol };
}

function toShortMonth(l) {
  const m = l.match(/(\d{4})[/-](\d{2})|(\d{2})[/-](\d{4})|^(\d{1,2})\/(\d{4})$/);
  if (m) {
    const n = parseInt(m[2] || m[3] || m[5] || 0, 10);
    return n >= 1 && n <= 12 ? MONTH_SHORT[n - 1] : l.slice(0, 5);
  }
  const i = MONTH_SHORT.findIndex(s => l.toLowerCase().startsWith(s.toLowerCase()));
  return i >= 0 ? MONTH_SHORT[i] : l.slice(0, 5);
}

function fmtMoney(v) {
  if (v == null) return '—';
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M`;
  if (v >= 1e3) return `R$ ${(v / 1e3).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} K`;
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ════════════════════════════════════════════
   MINI CHART — animação de subida + hover tooltip
════════════════════════════════════════════ */
const CHART_DUR = 1600;

function MiniChart({ hist, pred, labels, predLabel }) {
  const canvasRef  = useRef(null);
  const rafRef     = useRef(null);
  const pointsRef  = useRef([]);   // {x, y, label, value, isForecast}[]
  const doneRef    = useRef(false);
  const hoverRef   = useRef(-1);   // index do ponto hovered (-1 = nenhum)
  const [tooltip, setTooltip] = useState(null); // {x, y, label, value, isForecast}

  /* ── Redraw estático (após animação) com ponto destacado ── */
  const redrawStatic = useCallback((highlightIdx) => {
    const canvas = canvasRef.current;
    if (!canvas || !hist?.length) return;
    const dpr  = window.devicePixelRatio || 1;
    const all  = [...hist, ...pred];
    const hc   = hist.length;
    const w    = canvas.width  / dpr;
    const h    = canvas.height / dpr;
    const pad  = { l: 12, r: 16, t: 12, b: 22 };
    const mn   = Math.min(...all) * 0.88;
    const mx   = Math.max(...all) * 1.06;
    const ptX  = i => pad.l + (i / (all.length - 1)) * (w - pad.l - pad.r);
    const ptYR = v => h - pad.b - (v - mn) / (mx - mn) * (h - pad.t - pad.b);
    const allLabels = [...labels, predLabel || 'Prev'];

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    // fundo
    const gradFill = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
    gradFill.addColorStop(0, 'rgba(248,250,252,0.07)');
    gradFill.addColorStop(1, 'rgba(248,250,252,0)');
    ctx.beginPath();
    hist.forEach((v, i) => { i === 0 ? ctx.moveTo(ptX(i), ptYR(v)) : ctx.lineTo(ptX(i), ptYR(v)); });
    ctx.lineTo(ptX(hc - 1), h - pad.b); ctx.lineTo(ptX(0), h - pad.b); ctx.closePath();
    ctx.fillStyle = gradFill; ctx.fill();

    // eixo X
    ctx.beginPath(); ctx.moveTo(pad.l, h - pad.b); ctx.lineTo(w - pad.r, h - pad.b);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.stroke();

    // grade
    for (let g = 1; g <= 3; g++) {
      const gy = pad.t + (h - pad.t - pad.b) * (g / 4);
      ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(w - pad.r, gy);
      ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1; ctx.stroke();
    }

    // rótulos
    ctx.font = `${Math.max(9, Math.min(11, Math.floor(w / 50)))}px system-ui`;
    ctx.textAlign = 'center';
    all.forEach((_, i) => {
      ctx.fillStyle = i >= hc ? 'rgba(249,115,22,0.85)' : 'rgba(161,161,170,0.7)';
      ctx.fillText(allLabels[i] || '', ptX(i), h - 4);
    });

    // linha histórica
    ctx.beginPath();
    hist.forEach((v, i) => { i === 0 ? ctx.moveTo(ptX(i), ptYR(v)) : ctx.lineTo(ptX(i), ptYR(v)); });
    ctx.strokeStyle = 'rgba(248,250,252,0.9)'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,255,255,0.2)'; ctx.shadowBlur = 4; ctx.stroke(); ctx.shadowBlur = 0;

    // linha previsão
    ctx.setLineDash([5, 4]); ctx.beginPath();
    ctx.moveTo(ptX(hc - 1), ptYR(hist[hc - 1])); ctx.lineTo(ptX(hc), ptYR(pred[0]));
    ctx.strokeStyle = 'rgba(249,115,22,0.95)'; ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(249,115,22,0.5)'; ctx.shadowBlur = 8;
    ctx.stroke(); ctx.setLineDash([]); ctx.shadowBlur = 0;

    // pontos
    all.forEach((v, i) => {
      const isH = highlightIdx === i;
      const isFc = i >= hc;
      const r = isH ? 5.5 : (isFc ? 5 : 3.5);
      // halo quando highlight
      if (isH) {
        const halo = ctx.createRadialGradient(ptX(i), ptYR(v), 0, ptX(i), ptYR(v), 16);
        halo.addColorStop(0, isFc ? 'rgba(249,115,22,0.35)' : 'rgba(248,250,252,0.2)');
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(ptX(i), ptYR(v), 16, 0, Math.PI * 2);
        ctx.fillStyle = halo; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(ptX(i), ptYR(v), r, 0, Math.PI * 2);
      ctx.fillStyle   = isFc ? '#F97316' : '#F8FAFC';
      ctx.shadowColor = isFc ? 'rgba(249,115,22,0.8)' : 'rgba(255,255,255,0.4)';
      ctx.shadowBlur  = isH ? 14 : (isFc ? 12 : 6);
      ctx.fill(); ctx.shadowBlur = 0;
    });

    // linha vertical pontilhada no ponto hovered
    if (highlightIdx >= 0) {
      const hx = ptX(highlightIdx);
      const hy = ptYR(all[highlightIdx]);
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(hx, hy + 6); ctx.lineTo(hx, h - pad.b);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [hist, pred, labels, predLabel]);

  /* ── RAF de animação inicial ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hist?.length) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    doneRef.current  = false;
    pointsRef.current = [];
    hoverRef.current  = -1;
    setTooltip(null);

    const dpr = window.devicePixelRatio || 1;
    const all = [...hist, ...pred];
    const hc  = hist.length;
    let startTs = null;

    function resize() {
      canvas.width  = (canvas.offsetWidth  || 400) * dpr;
      canvas.height = (canvas.offsetHeight || 170) * dpr;
    }
    resize();

    function draw(ts) {
      if (!startTs) startTs = ts;
      const raw  = Math.min((ts - startTs) / CHART_DUR, 1);
      const ease = 1 - Math.pow(1 - raw, 3);
      const w = canvas.width / dpr, h = canvas.height / dpr;
      const pad = { l: 12, r: 16, t: 12, b: 22 };
      const mn  = Math.min(...all) * 0.88, mx = Math.max(...all) * 1.06;
      const ptX = i => pad.l + (i / (all.length - 1)) * (w - pad.l - pad.r);
      const ptYReal = v => h - pad.b - (v - mn) / (mx - mn) * (h - pad.t - pad.b);
      const ptY = (v, i) => {
        const delay = i / (all.length * 1.4), pEnd = delay + 0.5;
        const loc = clamp((ease - delay) / (pEnd - delay), 0, 1);
        return lerp(h - pad.b, ptYReal(v), 1 - Math.pow(1 - loc, 3));
      };
      const allLabels = [...labels, predLabel || 'Prev'];
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);

      // fundo
      const gradFill = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
      gradFill.addColorStop(0, 'rgba(248,250,252,0.07)');
      gradFill.addColorStop(1, 'rgba(248,250,252,0)');
      ctx.beginPath();
      hist.forEach((v, i) => { i === 0 ? ctx.moveTo(ptX(i), ptY(v,i)) : ctx.lineTo(ptX(i), ptY(v,i)); });
      ctx.lineTo(ptX(hc-1), h-pad.b); ctx.lineTo(ptX(0), h-pad.b); ctx.closePath();
      ctx.fillStyle = gradFill; ctx.fill();

      // eixo
      ctx.beginPath(); ctx.moveTo(pad.l, h-pad.b); ctx.lineTo(w-pad.r, h-pad.b);
      ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=1; ctx.stroke();
      for (let g=1;g<=3;g++){
        const gy=pad.t+(h-pad.t-pad.b)*(g/4);
        ctx.beginPath(); ctx.moveTo(pad.l,gy); ctx.lineTo(w-pad.r,gy);
        ctx.strokeStyle='rgba(255,255,255,0.035)'; ctx.lineWidth=1; ctx.stroke();
      }

      // rótulos
      ctx.font=`${Math.max(9,Math.min(11,Math.floor(w/50)))}px system-ui`;
      ctx.textAlign='center';
      all.forEach((_,i)=>{
        ctx.fillStyle = i>=hc ? 'rgba(249,115,22,0.85)' : 'rgba(161,161,170,0.7)';
        ctx.fillText(allLabels[i]||'', ptX(i), h-4);
      });

      // linha histórica
      ctx.beginPath();
      hist.forEach((v,i)=>{ i===0?ctx.moveTo(ptX(i),ptY(v,i)):ctx.lineTo(ptX(i),ptY(v,i)); });
      ctx.strokeStyle='rgba(248,250,252,0.9)'; ctx.lineWidth=2; ctx.lineJoin='round';
      ctx.shadowColor='rgba(255,255,255,0.2)'; ctx.shadowBlur=4; ctx.stroke(); ctx.shadowBlur=0;

      // previsão
      const predDelay=(hc-1)/(all.length*1.4);
      const predEase=clamp((ease-predDelay-0.1)/0.4,0,1);
      if(predEase>0){
        const sx=ptX(hc-1),sy=ptY(hist[hc-1],hc-1),ex=ptX(hc),ey=ptY(pred[0],hc);
        ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(lerp(sx,ex,predEase),lerp(sy,ey,predEase));
        ctx.strokeStyle='rgba(249,115,22,0.95)'; ctx.lineWidth=2;
        ctx.shadowColor='rgba(249,115,22,0.5)'; ctx.shadowBlur=8; ctx.stroke();
        ctx.setLineDash([]); ctx.shadowBlur=0;
      }

      // pontos históricos
      hist.forEach((v,i)=>{
        const vis=clamp((ease-i/(all.length*1.4))/0.3,0,1);
        if(vis<=0) return;
        ctx.globalAlpha=vis; ctx.beginPath(); ctx.arc(ptX(i),ptY(v,i),3.5,0,Math.PI*2);
        ctx.fillStyle='#F8FAFC'; ctx.shadowColor='rgba(255,255,255,0.4)'; ctx.shadowBlur=6;
        ctx.fill(); ctx.shadowBlur=0; ctx.globalAlpha=1;
      });

      // ponto previsão
      if(predEase>=0.85){
        const px=ptX(hc),py=ptY(pred[0],hc),alpha=clamp((predEase-0.85)/0.15,0,1);
        ctx.globalAlpha=alpha;
        const halo=ctx.createRadialGradient(px,py,0,px,py,14);
        halo.addColorStop(0,'rgba(249,115,22,0.25)'); halo.addColorStop(1,'rgba(249,115,22,0)');
        ctx.beginPath(); ctx.arc(px,py,14,0,Math.PI*2); ctx.fillStyle=halo; ctx.fill();
        ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2);
        ctx.fillStyle='#F97316'; ctx.shadowColor='rgba(249,115,22,0.8)'; ctx.shadowBlur=12;
        ctx.fill(); ctx.shadowBlur=0; ctx.globalAlpha=1;
      }

      // ao terminar: salva posições reais para hover
      if (raw >= 1 && !doneRef.current) {
        doneRef.current = true;
        pointsRef.current = all.map((v, i) => ({
          x: ptX(i),
          y: ptYReal(v),
          label: allLabels[i] || '',
          value: v,
          isForecast: i >= hc,
        }));
      }

      if (raw < 1) rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [hist, pred, labels, predLabel]); // eslint-disable-line

  /* ── Handlers de mouse ── */
  const handleMouseMove = useCallback((e) => {
    if (!doneRef.current || !pointsRef.current.length) return;
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let nearest = -1, minDist = Infinity;
    pointsRef.current.forEach((pt, i) => {
      const d = Math.sqrt((mx - pt.x) ** 2 + (my - pt.y) ** 2);
      if (d < minDist) { minDist = d; nearest = i; }
    });

    if (minDist < 32 && nearest !== hoverRef.current) {
      hoverRef.current = nearest;
      setTooltip(pointsRef.current[nearest]);
      redrawStatic(nearest);
    } else if (minDist >= 32 && hoverRef.current !== -1) {
      hoverRef.current = -1;
      setTooltip(null);
      redrawStatic(-1);
    }
  }, [redrawStatic]);

  const handleMouseLeave = useCallback(() => {
    if (hoverRef.current !== -1) {
      hoverRef.current = -1;
      setTooltip(null);
      redrawStatic(-1);
    }
  }, [redrawStatic]);

  /* ── Calcula posição do tooltip para não sair do card ── */
  function tooltipStyle(tt) {
    if (!tt) return {};
    const canvas = canvasRef.current;
    const cw = canvas ? canvas.offsetWidth : 400;
    let left = tt.x;
    // se muito perto da borda direita, ancora à direita
    if (tt.x > cw - 120) left = tt.x - 120;
    // se muito perto da esquerda, ancora à esquerda
    else if (tt.x < 60) left = tt.x;
    else left = tt.x - 60; // centro
    return { left, top: tt.y - 60 };
  }

  return (
    <div className="bpv-chart-canvas-wrap"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}>
      <canvas ref={canvasRef} className="bpv-mini-canvas" />
      {tooltip && (
        <div className="bpv-pt-tooltip" style={tooltipStyle(tooltip)}>
          <div className="bpv-pt-tt-label">{tooltip.label}</div>
          <div className="bpv-pt-tt-value" style={{ color: tooltip.isForecast ? '#F97316' : '#F8FAFC' }}>
            {fmtMoney(tooltip.value)}
          </div>
          {tooltip.isForecast && (
            <div className="bpv-pt-tt-tag">Previsão</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   TOOLTIP DE CONFIANÇA
════════════════════════════════════════════ */
function TooltipConfianca({ precisao, confidencia, children }) {
  const [show, setShow] = useState(false);

  const titulo  = `Por que ${confidencia}?`;
  const r2txt   = precisao != null ? `R² = ${precisao.toFixed(1)}%` : null;
  const mensagem = precisao == null
    ? 'Sem dados para calcular a precisão.'
    : precisao >= 70
      ? 'O modelo linear se ajusta bem ao histórico. A tendência dos dados é consistente — a previsão é confiável.'
      : precisao >= 35
        ? 'Há variação sazonal ou flutuações que a linha reta não captura completamente. Use como referência.'
        : 'Alta volatilidade ou poucos meses de histórico. Adicione mais meses de dados para aumentar a precisão.';

  const dica = precisao != null && precisao < 35
    ? '💡 Dica: tente usar 24 meses no SQL histórico.'
    : precisao != null && precisao < 70
      ? '💡 Dica: mais meses de histórico melhoram o R².'
      : null;

  return (
    <div
      className="bpv-kpi-card bpv-kpi-card--confianca"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="bpv-conf-tooltip">
          <div className="bpv-conf-tt-title">{titulo}</div>
          {r2txt && <div className="bpv-conf-tt-r2">{r2txt}</div>}
          <div className="bpv-conf-tt-body">{mensagem}</div>
          {dica && <div className="bpv-conf-tt-dica">{dica}</div>}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════ */
export default function BannerPrevisaoVendas({ empresa }) {
  const [dados, setDados]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [semSlot, setSemSlot] = useState(false);
  const [erro, setErro]       = useState('');

  /* ── Fetch & compute ── */
  const fetchPrevisao = useCallback(async () => {
    if (!empresa) return;
    setLoading(true);
    setSemSlot(false);
    setErro('');
    try {
      const qRes  = await apiFetch('/api/queries?ativa=true&slot=historico_mensal');
      const qList = await qRes.json();
      const slotQ = Array.isArray(qList) ? qList[0] : null;
      if (!slotQ) { setSemSlot(true); return; }

      const execRes = await apiFetch(`/api/queries/execute/${slotQ.codigo}?empresa=${encodeURIComponent(empresa)}`);
      const data    = await execRes.json();
      if (!data.ok) { setErro(data.error || 'Erro ao executar consulta.'); return; }

      const rows = data.rows;
      if (!Array.isArray(rows) || rows.length < 2) { setSemSlot(true); return; }

      const { valueCol, labelCol } = detectColumns(rows);
      if (!valueCol) { setErro('Não foi possível detectar a coluna de valor numérico.'); return; }

      const values      = rows.map(r => {
        const v = r[valueCol];
        return typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.')) || 0;
      });
      const labels      = rows.map(r => labelCol ? String(r[labelCol] ?? '') : '');
      const shortLabels = labels.map(toShortMonth);

      const { forecast, r2 } = linearRegression(values);
      const lastVal     = values[values.length - 1];
      const crescimento = lastVal > 0 ? ((forecast - lastVal) / lastVal) * 100 : 0;
      const precisao    = Math.round(r2 * 1000) / 10;
      const predLabel   = MONTH_SHORT[new Date().getMonth()];

      setDados({ hist: values, labels: shortLabels, forecast, r2, crescimento, precisao, predLabel });
    } catch (err) {
      console.error('[BannerPrevisaoVendas]', err);
      setErro(err.message || 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }, [empresa]);

  useEffect(() => { if (empresa) fetchPrevisao(); }, [empresa]); // eslint-disable-line

  /* ── Valores derivados ── */
  const crescimento = dados?.crescimento ?? null;
  const precisao    = dados?.precisao    ?? null;
  const mesAtual    = MONTH_SHORT[new Date().getMonth()];

  const confidencia = precisao == null ? '—'
    : precisao >= 70 ? 'Alta' : precisao >= 35 ? 'Média' : 'Baixa';
  const confVerificado = precisao != null && precisao >= 35;

  const barW = crescimento != null
    ? Math.min(100, Math.max(0, Math.abs(crescimento) / 30 * 100)).toFixed(1) + '%'
    : '0%';
  const circleOffset = precisao != null
    ? (2 * Math.PI * 15 * (1 - precisao / 100)).toFixed(1)
    : '94.2';

  const deltaLabel = dados
    ? `${crescimento >= 0 ? '↑' : '↓'} ${Math.abs(crescimento).toFixed(1)}% vs. mês anterior`
    : '';
  const deltaColor = crescimento != null && crescimento < 0 ? '#f87171' : '#4ade80';

  /* ── JSX ── */
  return (
    <div className="bpv-banner">
      <div className="bpv-bg-grid" />

      {/* Fundo animado — ondas + glow + sparkles */}
      <svg className="bpv-deco" viewBox="0 0 600 340" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
        <defs>
          <radialGradient id="bpvGlow" cx="75%" cy="65%" r="55%">
            <stop offset="0%"   stopColor="rgba(249,115,22,0.18)" />
            <stop offset="100%" stopColor="rgba(249,115,22,0)" />
          </radialGradient>
        </defs>
        <rect width="600" height="340" fill="url(#bpvGlow)" className="bpv-deco-glow" />
        {/* ondas animadas */}
        <path className="bpv-deco-wave bpv-deco-wave--1"
          d="M 80 275 Q 200 225 330 250 Q 440 270 620 215"
          stroke="rgba(249,115,22,0.30)" fill="none" strokeWidth="1.5" />
        <path className="bpv-deco-wave bpv-deco-wave--2"
          d="M 40 305 Q 180 255 310 278 Q 430 298 620 248"
          stroke="rgba(249,115,22,0.14)" fill="none" strokeWidth="1.2" />
        <path className="bpv-deco-wave bpv-deco-wave--3"
          d="M 0   320 Q 160 275 290 298 Q 420 318 620 272"
          stroke="rgba(249,115,22,0.07)" fill="none" strokeWidth="1" />
        {/* sparkles pulsantes */}
        <circle className="bpv-spark" cx="480" cy="28"  r="2.5" fill="rgba(249,115,22,0.65)" style={{ animationDelay: '0s' }} />
        <circle className="bpv-spark" cx="530" cy="55"  r="1.5" fill="rgba(249,115,22,0.50)" style={{ animationDelay: '0.8s' }} />
        <circle className="bpv-spark" cx="555" cy="18"  r="2"   fill="rgba(249,115,22,0.55)" style={{ animationDelay: '1.6s' }} />
        <circle className="bpv-spark" cx="575" cy="48"  r="1"   fill="rgba(249,115,22,0.75)" style={{ animationDelay: '0.4s' }} />
        <circle className="bpv-spark" cx="460" cy="60"  r="1.5" fill="rgba(249,115,22,0.35)" style={{ animationDelay: '1.2s' }} />
        <circle className="bpv-spark" cx="510" cy="82"  r="2"   fill="rgba(249,115,22,0.40)" style={{ animationDelay: '2.0s' }} />
        <circle className="bpv-spark" cx="440" cy="40"  r="1"   fill="rgba(249,115,22,0.50)" style={{ animationDelay: '0.6s' }} />
        <circle className="bpv-spark" cx="565" cy="90"  r="1.5" fill="rgba(249,115,22,0.30)" style={{ animationDelay: '1.4s' }} />
      </svg>

      <div className="bpv-inner">

        {/* ── TOPO: título + gráfico ── */}
        <div className="bpv-top-row">

          {/* LEFT — título e botão */}
          <div className="bpv-left">
            <div className="bpv-eyebrow">
              <span className="bpv-eyebrow-dot" />
              REGRESSÃO LINEAR · ECLIPSE
            </div>

            <h2 className="bpv-title">
              Previsão <span className="bpv-title-accent">Inteligente</span><br />de Vendas
            </h2>

            <p className="bpv-subtitle">
              {erro
                ? `Erro: ${erro}`
                : semSlot
                  ? 'Configure o slot "historico_mensal" no Gerenciador de Consultas para ativar a previsão com dados reais.'
                  : dados
                    ? `Estimativa para ${mesAtual} calculada via regressão linear com base no histórico mensal.`
                    : loading ? 'Calculando previsão...' : 'Clique em "Gerar Nova Previsão" para calcular.'
              }
            </p>

            <button className="bpv-btn" onClick={fetchPrevisao} disabled={loading || !empresa}>
              {loading
                ? <><span className="bpv-btn-spinner" /> Calculando...</>
                : <><TrendingUp size={16} /> Gerar Nova Previsão</>
              }
            </button>
          </div>

          {/* RIGHT — gráfico */}
          <div className="bpv-right">
            {dados ? (
              <div className="bpv-chart-card">
                <div className="bpv-chart-top">
                  <div className="bpv-legend">
                    <span className="bpv-leg-dot bpv-leg-dot--hist" />
                    <span>Histórico</span>
                    <span className="bpv-leg-dot bpv-leg-dot--pred" />
                    <span>Previsão ({dados.predLabel})</span>
                  </div>
                  <div className="bpv-callout">
                    <div className="bpv-callout-label">{dados.predLabel?.toUpperCase()} (PREVISÃO)</div>
                    <div className="bpv-callout-value">{fmtMoney(dados.forecast)}</div>
                    <div className="bpv-callout-delta" style={{ color: deltaColor }}>{deltaLabel}</div>
                  </div>
                </div>
                <MiniChart
                  hist={dados.hist}
                  pred={[dados.forecast]}
                  labels={dados.labels}
                  predLabel={dados.predLabel}
                />
              </div>
            ) : (
              <div className="bpv-chart-placeholder">
                {loading
                  ? 'Calculando...'
                  : semSlot
                    ? 'Gráfico disponível após configurar o slot'
                    : 'Aguardando dados...'
                }
              </div>
            )}
          </div>
        </div>

        {/* ── BAIXO: 4 KPIs em linha ── */}
        <div className="bpv-kpi-row">

          {/* Receita */}
          <div className="bpv-kpi-card">
            <div className="bpv-kpi-icon-wrap"><DollarSign size={18} /></div>
            <div className="bpv-kpi-body">
              <div className="bpv-kpi-label">Receita Prevista ({mesAtual})</div>
              <div className="bpv-kpi-value">
                {dados ? fmtMoney(dados.forecast) : <span className="bpv-kpi-empty">—</span>}
              </div>
              <div className="bpv-kpi-delta" style={{ color: deltaColor }}>
                {dados ? deltaLabel : ''}
              </div>
            </div>
          </div>

          {/* Crescimento */}
          <div className="bpv-kpi-card">
            <div className="bpv-kpi-icon-wrap"><TrendingUp size={18} /></div>
            <div className="bpv-kpi-body">
              <div className="bpv-kpi-label">Crescimento Esperado</div>
              <div className="bpv-kpi-value">
                {dados
                  ? `${crescimento >= 0 ? '+' : ''}${crescimento.toFixed(1)}%`
                  : <span className="bpv-kpi-empty">—</span>
                }
              </div>
              <div className="bpv-kpi-progress">
                <div className="bpv-kpi-bar" style={{ width: barW }} />
              </div>
            </div>
          </div>

          {/* Precisão */}
          <div className="bpv-kpi-card" style={{ position: 'relative' }}>
            <div className="bpv-kpi-icon-wrap"><Target size={18} /></div>
            <div className="bpv-kpi-body">
              <div className="bpv-kpi-label">Precisão (R²)</div>
              <div className="bpv-kpi-value">
                {dados ? `${precisao}%` : <span className="bpv-kpi-empty">—</span>}
              </div>
            </div>
            <div className="bpv-circle-wrap">
              <svg className="bpv-circle" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none"
                  stroke="#F97316" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray="94.2" strokeDashoffset={circleOffset}
                  transform="rotate(-90 18 18)" />
              </svg>
            </div>
          </div>

          {/* Confiança — com tooltip */}
          <TooltipConfianca precisao={precisao} confidencia={confidencia}>
            <div className="bpv-kpi-icon-wrap"><ShieldCheck size={18} /></div>
            <div className="bpv-kpi-body">
              <div className="bpv-kpi-label">Confiança</div>
              <div className="bpv-kpi-value bpv-confidence">{confidencia}</div>
              <div className={`bpv-confidence-badge${confVerificado ? '' : ' bpv-confidence-badge--warn'}`}>
                {confVerificado ? '✓ Verificado' : '⚠ Baixa precisão'}
              </div>
            </div>
          </TooltipConfianca>

        </div>
      </div>
    </div>
  );
}
