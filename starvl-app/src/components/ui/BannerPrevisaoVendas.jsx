import React, { useEffect, useRef, useState, useCallback } from 'react';
import { apiFetch } from '../../api';
import { DollarSign, TrendingUp, Target, ShieldCheck } from 'lucide-react';

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

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
   MINI CHART — desenho estático
════════════════════════════════════════════ */
function MiniChart({ hist, pred, labels, predLabel }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hist?.length) return;

    const dpr  = window.devicePixelRatio || 1;
    const all  = [...hist, ...pred];
    const w    = canvas.offsetWidth  || 400;
    const h    = canvas.offsetHeight || 170;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const pad = { l: 12, r: 16, t: 12, b: 22 };
    const mn  = Math.min(...all) * 0.88;
    const mx  = Math.max(...all) * 1.06;
    const ptX = i => pad.l + (i / (all.length - 1)) * (w - pad.l - pad.r);
    const ptY = v => h - pad.b - (v - mn) / (mx - mn) * (h - pad.t - pad.b);
    const allLabels = [...labels, predLabel || 'Prev'];
    const hc  = hist.length;

    // fundo suave abaixo da linha histórica
    const gradFill = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
    gradFill.addColorStop(0, 'rgba(248,250,252,0.07)');
    gradFill.addColorStop(1, 'rgba(248,250,252,0)');
    ctx.beginPath();
    hist.forEach((v, i) => { i === 0 ? ctx.moveTo(ptX(i), ptY(v)) : ctx.lineTo(ptX(i), ptY(v)); });
    ctx.lineTo(ptX(hc - 1), h - pad.b);
    ctx.lineTo(ptX(0), h - pad.b);
    ctx.closePath();
    ctx.fillStyle = gradFill;
    ctx.fill();

    // eixo x
    ctx.beginPath();
    ctx.moveTo(pad.l, h - pad.b);
    ctx.lineTo(w - pad.r, h - pad.b);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // grade horizontal leve
    const gridLines = 3;
    for (let g = 1; g <= gridLines; g++) {
      const gy = pad.t + (h - pad.t - pad.b) * (g / (gridLines + 1));
      ctx.beginPath();
      ctx.moveTo(pad.l, gy);
      ctx.lineTo(w - pad.r, gy);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // rótulos de meses
    ctx.fillStyle = 'rgba(161,161,170,0.7)';
    ctx.font = `${Math.max(9, Math.min(11, Math.floor(w / 50)))}px system-ui`;
    ctx.textAlign = 'center';
    all.forEach((_, i) => {
      const lbl = allLabels[i] || '';
      const isForecast = i >= hc;
      ctx.fillStyle = isForecast ? 'rgba(249,115,22,0.85)' : 'rgba(161,161,170,0.7)';
      ctx.fillText(lbl, ptX(i), h - 4);
    });

    // linha histórica
    ctx.beginPath();
    hist.forEach((v, i) => { i === 0 ? ctx.moveTo(ptX(i), ptY(v)) : ctx.lineTo(ptX(i), ptY(v)); });
    ctx.strokeStyle = 'rgba(248,250,252,0.9)';
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.shadowColor = 'rgba(255,255,255,0.2)';
    ctx.shadowBlur  = 4;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    // linha previsão (tracejada laranja)
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    const joined = [hist[hist.length - 1], ...pred];
    joined.forEach((v, i) => {
      const absI = hc - 1 + i;
      i === 0 ? ctx.moveTo(ptX(absI), ptY(v)) : ctx.lineTo(ptX(absI), ptY(v));
    });
    ctx.strokeStyle = 'rgba(249,115,22,0.95)';
    ctx.lineWidth   = 2;
    ctx.shadowColor = 'rgba(249,115,22,0.5)';
    ctx.shadowBlur  = 8;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur  = 0;

    // pontos históricos
    hist.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(ptX(i), ptY(v), 3.5, 0, Math.PI * 2);
      ctx.fillStyle   = '#F8FAFC';
      ctx.shadowColor = 'rgba(255,255,255,0.4)';
      ctx.shadowBlur  = 6;
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // ponto previsão (maior, laranja com halo)
    const px = ptX(hc), py = ptY(pred[0]);
    // halo
    const haloGrad = ctx.createRadialGradient(px, py, 0, px, py, 14);
    haloGrad.addColorStop(0, 'rgba(249,115,22,0.25)');
    haloGrad.addColorStop(1, 'rgba(249,115,22,0)');
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fillStyle = haloGrad;
    ctx.fill();
    // dot
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle   = '#F97316';
    ctx.shadowColor = 'rgba(249,115,22,0.8)';
    ctx.shadowBlur  = 12;
    ctx.fill();
    ctx.shadowBlur  = 0;
  }, [hist, pred, labels, predLabel]);

  return <canvas ref={canvasRef} className="bpv-mini-canvas" />;
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

      const values = rows.map(r => {
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

  // Limiares calibrados para dados mensais com sazonalidade
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

  /* ── JSX ── */
  return (
    <div className="bpv-banner bpv-no-anim">
      <div className="bpv-bg-grid" />

      {/* Decoração SVG — ondas + partículas */}
      <svg className="bpv-deco" viewBox="0 0 600 340" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
        <defs>
          <radialGradient id="bpvGlow" cx="80%" cy="70%" r="50%">
            <stop offset="0%"   stopColor="rgba(249,115,22,0.18)" />
            <stop offset="100%" stopColor="rgba(249,115,22,0)" />
          </radialGradient>
        </defs>
        <rect width="600" height="340" fill="url(#bpvGlow)" />
        <path d="M 100 280 Q 220 230 340 255 Q 440 275 600 220" stroke="rgba(249,115,22,0.28)" fill="none" strokeWidth="1.5" />
        <path d="M 180 310 Q 300 260 420 285 Q 510 300 600 255" stroke="rgba(249,115,22,0.14)" fill="none" strokeWidth="1" />
        <path d="M 60  320 Q 200 275 320 300 Q 440 320 600 280" stroke="rgba(249,115,22,0.08)" fill="none" strokeWidth="1" />
        {/* sparkle dots */}
        <circle cx="480" cy="28"  r="2.5" fill="rgba(249,115,22,0.65)" />
        <circle cx="530" cy="55"  r="1.5" fill="rgba(249,115,22,0.45)" />
        <circle cx="555" cy="18"  r="2"   fill="rgba(249,115,22,0.55)" />
        <circle cx="575" cy="48"  r="1"   fill="rgba(249,115,22,0.75)" />
        <circle cx="460" cy="60"  r="1.5" fill="rgba(249,115,22,0.35)" />
        <circle cx="510" cy="82"  r="2"   fill="rgba(249,115,22,0.40)" />
        <circle cx="440" cy="40"  r="1"   fill="rgba(249,115,22,0.50)" />
        <circle cx="565" cy="90"  r="1.5" fill="rgba(249,115,22,0.30)" />
      </svg>

      <div className="bpv-inner">
        {/* ── LEFT ── */}
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

          {/* KPI cards — 2×2 */}
          <div className="bpv-kpi-row">

            <div className="bpv-kpi-card">
              <div className="bpv-kpi-icon-wrap"><DollarSign size={18} /></div>
              <div className="bpv-kpi-body">
                <div className="bpv-kpi-label">Receita Prevista ({mesAtual})</div>
                <div className="bpv-kpi-value">
                  {dados ? fmtMoney(dados.forecast) : <span className="bpv-kpi-empty">—</span>}
                </div>
                <div className="bpv-kpi-delta" style={{ color: crescimento != null && crescimento < 0 ? '#f87171' : '#4ade80' }}>
                  {dados ? deltaLabel : ''}
                </div>
              </div>
            </div>

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

            <div className="bpv-kpi-card">
              <div className="bpv-kpi-icon-wrap"><Target size={18} /></div>
              <div className="bpv-kpi-body" style={{ position: 'relative' }}>
                <div className="bpv-kpi-label">Precisão (R²)</div>
                <div className="bpv-kpi-value">
                  {dados ? `${precisao}%` : <span className="bpv-kpi-empty">—</span>}
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
            </div>

            <div className="bpv-kpi-card">
              <div className="bpv-kpi-icon-wrap"><ShieldCheck size={18} /></div>
              <div className="bpv-kpi-body">
                <div className="bpv-kpi-label">Confiança</div>
                <div className="bpv-kpi-value bpv-confidence">{confidencia}</div>
                <div className={`bpv-confidence-badge ${confVerificado ? '' : 'bpv-confidence-badge--warn'}`}>
                  {confVerificado ? '✓ Verificado' : '⚠ Baixa precisão'}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── RIGHT — gráfico ── */}
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
                  <div className="bpv-callout-delta"
                    style={{ color: crescimento >= 0 ? '#4ade80' : '#f87171' }}>
                    {deltaLabel}
                  </div>
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
                ? <span>Calculando...</span>
                : <span>{semSlot ? 'Gráfico disponível após configurar o slot' : 'Aguardando dados...'}</span>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
