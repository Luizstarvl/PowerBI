import React, { useEffect, useRef, useState, useCallback } from 'react';
import { apiFetch } from '../../api';

/* ── helpers ── */
const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

/* ── Linear regression sobre array de números ── */
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

/* ── Detecta coluna de valor numérico e coluna de rótulo ── */
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

/* ── Converte rótulo de período para nome curto do mês ── */
function toShortMonth(l) {
  const m = l.match(/(\d{4})[/-](\d{2})|(\d{2})[/-](\d{4})|^(\d{1,2})\/(\d{4})$/);
  if (m) {
    const n = parseInt(m[2] || m[3] || m[5] || 0, 10);
    return n >= 1 && n <= 12 ? MONTH_SHORT[n - 1] : l.slice(0, 5);
  }
  const i = MONTH_SHORT.findIndex(s => l.toLowerCase().startsWith(s.toLowerCase()));
  return i >= 0 ? MONTH_SHORT[i] : l.slice(0, 5);
}

/* ── Formata valor monetário ── */
function fmtMoney(v) {
  if (v == null) return '—';
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M`;
  if (v >= 1e3) return `R$ ${(v / 1e3).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} K`;
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ════════════════════════════════════════════
   MINI CHART — desenho estático (sem RAF)
════════════════════════════════════════════ */
function MiniChart({ hist, pred, labels, predLabel }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hist?.length) return;
    const dpr = window.devicePixelRatio || 1;
    const all = [...hist, ...pred];
    const w = canvas.offsetWidth || 340;
    const h = 80;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const pad = { l: 8, r: 8, t: 10, b: 14 };
    const mn  = Math.min(...all) * 0.9;
    const mx  = Math.max(...all) * 1.05;
    const ptX = i => pad.l + (i / (all.length - 1)) * (w - pad.l - pad.r);
    const ptY = v => h - pad.b - (v - mn) / (mx - mn) * (h - pad.t - pad.b);
    const allLabels = [...labels, predLabel || 'Prev'];

    // eixo
    ctx.beginPath(); ctx.moveTo(pad.l, h - pad.b); ctx.lineTo(w - pad.r, h - pad.b);
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.stroke();

    // rótulos de meses
    ctx.fillStyle = 'rgba(161,161,170,.5)'; ctx.font = '8px system-ui'; ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(all.length / 6));
    all.forEach((_, i) => { if (i % step === 0) ctx.fillText(allLabels[i] || '', ptX(i), h - 2); });

    const hc = hist.length;

    // linha histórica
    ctx.beginPath();
    hist.forEach((v, i) => { i === 0 ? ctx.moveTo(ptX(i), ptY(v)) : ctx.lineTo(ptX(i), ptY(v)); });
    ctx.strokeStyle = 'rgba(248,250,252,.85)'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();

    // linha previsão (tracejada laranja)
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    const joined = [hist[hist.length - 1], ...pred];
    joined.forEach((v, i) => {
      const absI = hc - 1 + i;
      i === 0 ? ctx.moveTo(ptX(absI), ptY(v)) : ctx.lineTo(ptX(absI), ptY(v));
    });
    ctx.strokeStyle = 'rgba(249,115,22,.9)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.setLineDash([]);

    // pontos
    all.forEach((v, i) => {
      const isForecast = i >= hc;
      ctx.beginPath();
      ctx.arc(ptX(i), ptY(v), isForecast ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isForecast ? '#F97316' : 'rgba(248,250,252,.9)';
      ctx.fill();
    });
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
      // 1. Busca a consulta com slot=historico_mensal
      const qRes  = await apiFetch('/api/queries?ativa=true&slot=historico_mensal');
      const qList = await qRes.json();
      const slotQ = Array.isArray(qList) ? qList[0] : null;
      if (!slotQ) { setSemSlot(true); return; }

      // 2. Executa a query
      const execRes = await apiFetch(`/api/queries/execute/${slotQ.codigo}?empresa=${encodeURIComponent(empresa)}`);
      const data    = await execRes.json();

      // A resposta é { ok, rows: [...], columns, rowCount, ... }
      if (!data.ok) { setErro(data.error || 'Erro ao executar consulta.'); return; }
      const rows = data.rows;
      if (!Array.isArray(rows) || rows.length < 2) { setSemSlot(true); return; }

      // 3. Detecta colunas
      const { valueCol, labelCol } = detectColumns(rows);
      if (!valueCol) { setErro('Não foi possível detectar a coluna de valor numérico.'); return; }

      // 4. Extrai valores e rótulos
      const values = rows.map(r => {
        const v = r[valueCol];
        return typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.')) || 0;
      });
      const labels     = rows.map(r => labelCol ? String(r[labelCol] ?? '') : '');
      const shortLabels = labels.map(toShortMonth);

      // 5. Regressão linear
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
  const crescimento  = dados?.crescimento ?? null;
  const precisao     = dados?.precisao    ?? null;
  // Limiares calibrados para dados mensais com sazonalidade
  const confidencia  = precisao == null ? '—'
    : precisao >= 70 ? 'Alta' : precisao >= 35 ? 'Média' : 'Baixa';
  const mesAtual = MONTH_SHORT[new Date().getMonth()];

  const barW = crescimento != null
    ? Math.min(100, Math.max(0, Math.abs(crescimento) / 30 * 100)).toFixed(1) + '%'
    : '0%';
  const circleOffset = precisao != null
    ? (2 * Math.PI * 15 * (1 - precisao / 100)).toFixed(1)
    : '94.2';

  const deltaLabel = dados
    ? `${crescimento >= 0 ? '↑ +' : '↓ '}${Math.abs(crescimento).toFixed(1)}% vs. mês anterior`
    : '';

  /* ── JSX ── */
  return (
    <div className="bpv-banner bpv-no-anim">
      <div className="bpv-bg-grid" />

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
            {erro
              ? `Erro: ${erro}`
              : semSlot
                ? 'Configure o slot "historico_mensal" no Gerenciador de Consultas para ativar a previsão com dados reais.'
                : dados
                  ? `Estimativa para ${mesAtual} calculada via regressão linear com base no histórico mensal.`
                  : loading
                    ? 'Calculando previsão...'
                    : 'Clique em "Gerar Nova Previsão" para calcular.'
            }
          </p>

          <button
            className="bpv-btn"
            onClick={fetchPrevisao}
            disabled={loading || !empresa}
          >
            {loading
              ? <><span className="bpv-btn-spinner" />Calculando...</>
              : <>📈 Gerar Nova Previsão</>
            }
          </button>

          {/* KPI cards */}
          <div className="bpv-kpi-row">
            <div className="bpv-kpi-card">
              <div className="bpv-kpi-label">Receita Prevista ({mesAtual})</div>
              <div className="bpv-kpi-value">
                {dados ? fmtMoney(dados.forecast) : <span className="bpv-kpi-empty">—</span>}
              </div>
              <div className="bpv-kpi-delta">
                {dados ? deltaLabel : semSlot ? 'Sem dados' : ''}
              </div>
            </div>

            <div className="bpv-kpi-card">
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

            <div className="bpv-kpi-card" style={{ position: 'relative' }}>
              <div className="bpv-kpi-label">Precisão (R²)</div>
              <div className="bpv-kpi-value">
                {dados ? `${precisao}%` : <span className="bpv-kpi-empty">—</span>}
              </div>
              <div className="bpv-circle-wrap">
                <svg className="bpv-circle" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke="#F97316" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray="94.2"
                    strokeDashoffset={circleOffset}
                    transform="rotate(-90 18 18)"
                  />
                </svg>
              </div>
            </div>

            <div className="bpv-kpi-card">
              <div className="bpv-kpi-label">Confiança</div>
              <div className="bpv-kpi-value bpv-confidence">{confidencia}</div>
              <div className="bpv-confidence-badge">
                {precisao != null && precisao >= 35 ? '✓ Verificado' : precisao != null ? '⚠ Baixa precisão' : '—'}
              </div>
            </div>
          </div>

          {/* Mini chart */}
          {dados && (
            <div className="bpv-bottom">
              <div className="bpv-mini-wrap" style={{ flex: 1 }}>
                <div className="bpv-legend">
                  <span className="bpv-legend-hist">─ Histórico</span>
                  <span className="bpv-legend-pred">- - Previsão ({mesAtual})</span>
                </div>
                <MiniChart
                  hist={dados.hist}
                  pred={[dados.forecast]}
                  labels={dados.labels}
                  predLabel={dados.predLabel}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — removido temporariamente (canvas animado) */}
      </div>
    </div>
  );
}
