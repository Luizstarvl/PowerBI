import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingCart, Fuel, Package, Truck, Boxes, Gauge } from 'lucide-react';
import { KpiCard } from '../components/ui';
import { apiFetch } from '../api';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const number   = new Intl.NumberFormat('pt-BR');

function toPeriodoParam(period) {
  const [yyyy, mm] = period.split('-');
  return `${mm}${yyyy}`;
}

function buildSlotQs(empresasKey, selectedPeriod) {
  const empresa = (empresasKey || '').split(',')[0];
  const [y, m] = selectedPeriod.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  const pad = n => String(n).padStart(2, '0');
  return new URLSearchParams({
    empresa,
    empresas:    empresasKey,
    data_inicio: `${y}-${pad(m)}-01`,
    data_final:  `${y}-${pad(m)}-${last}`,
    periodo:     `${pad(m)}${y}`,
  }).toString();
}

function mapToTopProdutos(result) {
  if (!result?.ok || !result.rows?.length || !result.columns?.length) return [];
  const { columns, rows } = result;
  const numCols = columns.filter(c => rows[0][c] !== null && !isNaN(Number(rows[0][c])));
  const txtCols = columns.filter(c => !numCols.includes(c));
  const nameCol = txtCols.find(c => /nome|descri|produto|item/i.test(c))
               || txtCols[txtCols.length - 1]
               || txtCols[0];
  const qtyCol  = numCols.find(c => /qtd|qty|quant/i.test(c)) || numCols[0];
  if (!nameCol || !qtyCol) return [];
  return rows.slice(0, 5).map(r => ({
    name: String(r[nameCol] ?? ''),
    qty:  Number(r[qtyCol]  ?? 0),
  }));
}

function mapKpiRow(result) {
  if (!result?.ok || !result.rows?.length) return null;
  const row  = result.rows[0];
  const cols = result.columns || [];
  const num  = cols.filter(c => row[c] !== null && row[c] !== undefined && !isNaN(Number(row[c])));
  const col  = pattern => cols.find(c => new RegExp(`^(${pattern})$`, 'i').test(c));
  const val  = c => c ? Number(row[c] ?? 0) : undefined;
  return {
    valor:  val(col('valor|value|total_valor')) ?? (num[0] ? Number(row[num[0]]) : 0),
    total:  val(col('total|total_vendas|count')) ?? (num[1] ? Number(row[num[1]]) : undefined),
    litros: val(col('litros|volume|lts')),
    qtd:    val(col('qtd|quantidade|qty')),
  };
}

function lastMonths(n = 6) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return { value: `${yyyy}-${mm}`, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });
}

/* ── Gradientes dos avatares por rank ───────────────────────────────────────── */
const RANK_GRAD = [
  'linear-gradient(135deg,#ff8c00,#ff4500)',
  'linear-gradient(135deg,#60a5fa,#2563eb)',
  'linear-gradient(135deg,#4ade80,#16a34a)',
  'linear-gradient(135deg,#c084fc,#7c3aed)',
  'linear-gradient(135deg,#f472b6,#be185d)',
];

// Tamanhos por distância do centro: abs=0 (centro), abs=1 (lateral), abs=2 (extremo)
const TPB_SIZES = [
  { w: 160, avatar: 74, avatarFs: 29, nameFs: 12, qtyFs: 21, badgeFs: 9,  nameMt: 10, qtyMt: 5, badgeMt: 7, pad: '14px 12px 12px' },
  { w: 124, avatar: 50, avatarFs: 19, nameFs: 10, qtyFs: 14, badgeFs: 8,  nameMt: 8,  qtyMt: 4, badgeMt: 5, pad: '12px 8px 10px'  },
  { w:  94, avatar: 38, avatarFs: 15, nameFs:  9, qtyFs: 11, badgeFs: 7,  nameMt: 6,  qtyMt: 3, badgeMt: 4, pad: '10px 6px 8px'   },
];

const OFFSET_X_PX   = { '-2': -284, '-1': -148, 0: 0, 1: 148, 2: 284 };
const OFFSET_RY_DEG = { '-2': 42,   '-1': 26,   0: 0, 1: -26, 2: -42 };
const OFFSET_TZ_PX  = { '-2': -108, '-1': -55,  0: 0, 1: -55, 2: -108 };

/* ── Chuva de confetes ──────────────────────────────────────────────────────── */
const CONFETTI_COLORS = ['#FFD700','#FF6B00','#FFC107','#FF4500','#FFFDE0','#FFB347','#ffffff','#FFA07A'];

function ConfettiCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth  || 800;
    canvas.height = canvas.offsetHeight || 290;
    const W = canvas.width;
    const H = canvas.height;
    const particles = Array.from({ length: 36 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H - H * 0.6,
      w:     4 + Math.random() * 5,
      h:     3 + Math.random() * 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      vy:    0.8 + Math.random() * 1.6,
      vx:    (Math.random() - 0.5) * 1.0,
      rot:   Math.random() * Math.PI * 2,
      drot:  (Math.random() - 0.5) * 0.07,
      alpha: 0.5 + Math.random() * 0.45,
    }));
    let raf;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        p.y += p.vy; p.x += p.vx; p.rot += p.drot;
        if (p.y > H + 12) { p.y = -12; p.x = Math.random() * W; }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="tpb-confetti" />;
}

/* ── Banner Top 5 ───────────────────────────────────────────────────────────── */
const CROWN_SVG = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1h14v1z"/>
  </svg>
);
const EYEBROW_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ff8c00' }}>
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1h14v1z"/>
  </svg>
);

function TopProdutosBanner({ dados, loading }) {
  const n = dados?.length ?? 0;
  const [featured, setFeatured] = useState(0);
  const [noTransRank, setNoTransRank] = useState(null);
  const timerRef   = useRef(null);
  const featuredRef = useRef(0);

  useEffect(() => { featuredRef.current = featured; }, [featured]);
  useEffect(() => { setFeatured(0); setNoTransRank(null); }, [dados]);

  // Calcula o spread: quantos cards de cada lado ficam visíveis
  const spread = n >= 5 ? 2 : n >= 3 ? 1 : Math.max(0, n - 1);

  function doNavigate(dir, prev) {
    const next = (prev + dir + n) % n;
    if (spread >= 2) {
      // Identifica o rank que iria "teleportar" de uma extremidade à outra
      const wrapOffset = dir > 0 ? -spread : spread;
      const wrapIdx    = ((prev + wrapOffset) % n + n) % n;
      // Desabilita transição de transform para esse rank no mesmo render que muda featured
      setNoTransRank(wrapIdx + 1);
      setFeatured(next);
      // Reabilita após dois frames (card já está na nova posição sem animação)
      requestAnimationFrame(() => requestAnimationFrame(() => setNoTransRank(null)));
    } else {
      setFeatured(next);
    }
  }

  function startTimer() {
    clearInterval(timerRef.current);
    if (n < 2) return;
    timerRef.current = setInterval(() => doNavigate(1, featuredRef.current), 3500);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { startTimer(); return () => clearInterval(timerRef.current); }, [n]);

  function go(dir) {
    if (n < 2) return;
    doNavigate(dir, featured);
    startTimer();
  }

  if (loading && n === 0) {
    return (
      <div className="tpb-root tpb-skeleton">
        <div className="tpb-eyebrow">{EYEBROW_ICON} Top 5 Mais Vendidos · Conveniência</div>
        <div className="tpb-stage" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          {[94, 124, 160, 124, 94].map((w, i) => (
            <div key={i} className="tpb-skel-card" style={{ width: w, opacity: i === 2 ? 1 : i === 1 || i === 3 ? 0.6 : 0.35 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!loading && n === 0) {
    return (
      <div className="tpb-root tpb-root--empty">
        <div className="tpb-eyebrow">{EYEBROW_ICON} Top 5 Mais Vendidos · Conveniência</div>
        <p className="tpb-empty-msg">Sem dados de conveniência para o período selecionado.</p>
      </div>
    );
  }

  const visibleOffsets = Array.from({ length: 2 * spread + 1 }, (_, i) => i - spread);

  return (
    <div className="tpb-root">
      <ConfettiCanvas />
      <div className="tpb-eyebrow">{EYEBROW_ICON} Top 5 Mais Vendidos · Conveniência</div>

      {/* Setas de navegação */}
      {n >= 2 && (
        <button className="tpb-nav tpb-nav--prev" onClick={() => go(-1)} aria-label="Anterior">&#8592;</button>
      )}
      {n >= 2 && (
        <button className="tpb-nav tpb-nav--next" onClick={() => go(1)} aria-label="Próximo">&#8594;</button>
      )}

      <div className="tpb-stage">
        {visibleOffsets.map(offset => {
          const idx      = ((featured + offset) % n + n) % n;
          const item     = dados[idx];
          const rank     = idx + 1;
          const abs      = Math.abs(offset);
          const isCenter = offset === 0;
          const isFirst  = isCenter && rank === 1;
          const sz       = TPB_SIZES[abs] || TPB_SIZES[2];
          const skipTrans = noTransRank === rank;

          return (
            <div
              key={rank}
              className={`tpb-card${isCenter ? ' tpb-featured' : ''}${isFirst ? ' tpb-rank1' : ''}`}
              style={{
                width:     sz.w,
                padding:   sz.pad,
                opacity:   isCenter ? 1 : abs === 1 ? 0.85 : 0.68,
                transform: `translateX(calc(-50% + ${OFFSET_X_PX[offset]}px)) translateY(-50%) rotateY(${OFFSET_RY_DEG[offset]}deg) translateZ(${OFFSET_TZ_PX[offset]}px)`,
                zIndex:    isCenter ? 10 : abs === 1 ? 9 : 8,
                transition: skipTrans
                  ? 'opacity .4s ease, box-shadow .4s'
                  : 'transform .5s cubic-bezier(.25,.46,.45,.94), opacity .4s ease, box-shadow .4s',
                cursor: 'default',
              }}
            >
              {isFirst && (
                <div className="tpb-stars" aria-hidden="true">
                  <span className="tpb-star tpb-star-0">✦</span>
                  <span className="tpb-star tpb-star-1">★</span>
                  <span className="tpb-star tpb-star-2">✦</span>
                  <span className="tpb-star tpb-star-3">✦</span>
                  <span className="tpb-star tpb-star-4">★</span>
                  <span className="tpb-star tpb-star-5">✦</span>
                </div>
              )}

              {rank === 1 ? (
                <div className="tpb-crown">{CROWN_SVG}</div>
              ) : (
                <div className={isCenter ? 'tpb-center-rank' : 'tpb-side-rank'}>{rank}°</div>
              )}

              <div
                className="tpb-avatar"
                style={{
                  width: sz.avatar, height: sz.avatar, fontSize: sz.avatarFs,
                  background: RANK_GRAD[(rank - 1) % RANK_GRAD.length],
                  boxShadow: isFirst
                    ? '0 0 28px rgba(255,180,0,.6)'
                    : isCenter ? '0 0 22px rgba(255,140,0,.45)' : 'none',
                }}
              >
                {item.name.charAt(0).toUpperCase()}
              </div>

              <div className="tpb-card-name" style={{ fontSize: sz.nameFs, marginTop: sz.nameMt }}>
                {item.name}
              </div>
              <div className="tpb-card-qty" style={{ fontSize: sz.qtyFs, marginTop: sz.qtyMt }}>
                {number.format(Math.round(item.qty))} <small>un.</small>
              </div>
              <div
                className={`tpb-badge tpb-badge--${rank}`}
                style={{ fontSize: sz.badgeFs, marginTop: sz.badgeMt, padding: '3px 9px' }}
              >
                {rank}° Lugar
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicadores de posição */}
      {n >= 2 && (
        <div className="tpb-dots">
          {Array.from({ length: n }, (_, i) => (
            <button
              key={i}
              className={`tpb-dot${featured === i ? ' on' : ''}`}
              onClick={() => { setFeatured(i); startTimer(); }}
              aria-label={`Ir para ${i + 1}°`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ empresas, period, onNavigate }) {
  const months = useMemo(() => lastMonths(6), []);
  const [selectedPeriod, setSelectedPeriod] = useState(period || months[0].value);
  const [kpis, setKpis]             = useState(null);
  const [topProdutos, setTopProdutos] = useState([]);
  const [loading, setLoading]        = useState(true);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotKpiData, setSlotKpiData] = useState({});
  const [erro, setErro]              = useState('');
  const [dashQueries, setDashQueries] = useState([]);

  useEffect(() => {
    apiFetch('/api/queries?ativa=true&categoria=Dashboard')
      .then(r => r.json())
      .then(d => setDashQueries(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const empresasKey = (empresas || []).join(',');

  const slotMap = useMemo(
    () => Object.fromEntries(dashQueries.filter(q => q.slot).map(q => [q.slot, q])),
    [dashQueries]
  );

  // Busca paralela de todos os KPIs configurados via slot
  useEffect(() => {
    if (!empresasKey || !selectedPeriod) return;
    const KPI_KEYS = ['kpi_vendas','kpi_combustivel','kpi_conveniencia','kpi_compras_comb','kpi_compras_conv','kpi_afericoes'];
    const active = KPI_KEYS.filter(k => slotMap[k]);
    if (!active.length) return;
    let cancelado = false;
    const qs = buildSlotQs(empresasKey, selectedPeriod);
    Promise.all(active.map(k =>
      apiFetch(`/api/queries/execute/${slotMap[k].codigo}?${qs}`)
        .then(r => r.json())
        .then(d => [k, mapKpiRow(d)])
        .catch(() => [k, null])
    )).then(entries => {
      if (!cancelado) setSlotKpiData(Object.fromEntries(entries.filter(([, v]) => v)));
    });
    return () => { cancelado = true; };
  }, [slotMap, empresasKey, selectedPeriod]);

  // Busca Top 5 via slot configurado
  useEffect(() => {
    if (!empresasKey || !selectedPeriod) return;
    const top5Q = slotMap.top5_convenio;
    if (!top5Q) return;
    let cancelado = false;
    setSlotLoading(true);
    const qs = buildSlotQs(empresasKey, selectedPeriod);
    apiFetch(`/api/queries/execute/${top5Q.codigo}?${qs}`)
      .then(r => r.json())
      .then(d => { if (!cancelado) setTopProdutos(mapToTopProdutos(d)); })
      .catch(() => { if (!cancelado) setTopProdutos([]); })
      .finally(() => { if (!cancelado) setSlotLoading(false); });
    return () => { cancelado = true; };
  }, [slotMap, empresasKey, selectedPeriod]);

  // Busca principal: KPIs + top convenio fallback (sem slot)
  useEffect(() => {
    if (!empresasKey) return;
    let cancelado = false;
    setLoading(true);
    setErro('');
    const periodo = toPeriodoParam(selectedPeriod);
    const qs = `empresas=${empresasKey}&periodo=${periodo}`;
    const hasTop5Slot = !!slotMap.top5_convenio;

    Promise.all([
      apiFetch(`/api/dashboard/kpis?${qs}`).then(r => r.json()),
      hasTop5Slot
        ? Promise.resolve(null)
        : apiFetch(`/api/dashboard/top-convenio?${qs}`).then(r => r.json()),
    ])
      .then(([kpisData, topData]) => {
        if (cancelado) return;
        if (kpisData?.error) throw new Error(kpisData.error);
        setKpis(kpisData);
        if (!hasTop5Slot && topData) setTopProdutos(Array.isArray(topData) ? topData : []);
      })
      .catch(() => { if (!cancelado) setErro('Não foi possível carregar os dados do período.'); })
      .finally(() => { if (!cancelado) setLoading(false); });

    return () => { cancelado = true; };
  }, [empresasKey, selectedPeriod, slotMap]);

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="section-title">Visão geral</div>
          <div className="section-sub">Resumo de vendas do período selecionado</div>
        </div>
        <div className="period-picker">
          <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {!empresasKey && <p className="chart-empty">Selecione uma empresa para ver o dashboard.</p>}
      {erro && <p className="form-erro">{erro}</p>}

      {empresasKey && !erro && (
        <>
          <div className="kpi-grid">
            {(() => {
              const kpi = (slotKey, apiObj) => slotKpiData[slotKey] || apiObj || {};
              const vendas   = kpi('kpi_vendas',       kpis?.vendas);
              const comb     = kpi('kpi_combustivel',  kpis?.combustivel);
              const conv     = kpi('kpi_conveniencia', kpis?.conveniencia);
              const compComb = kpi('kpi_compras_comb', kpis?.comprasComb);
              const compConv = kpi('kpi_compras_conv', kpis?.comprasConv);
              const afer     = kpi('kpi_afericoes',    kpis?.afericoes);
              return (<>
                <KpiCard icon={ShoppingCart} label="Vendas totais"       value={loading ? '—' : currency.format(vendas.valor   || 0)} sub={loading ? '' : `${number.format(vendas.total || 0)} vendas`} />
                <KpiCard icon={Fuel}         label="Combustível"          value={loading ? '—' : currency.format(comb.valor    || 0)} sub={loading ? '' : `${number.format(comb.litros || comb.total || 0)} L`} />
                <KpiCard icon={Package}      label="Conveniência"         value={loading ? '—' : currency.format(conv.valor    || 0)} sub={loading ? '' : `${number.format(conv.total  || 0)} vendas`} />
                <KpiCard icon={Truck}        label="Compras combustível"  value={loading ? '—' : currency.format(compComb.valor || 0)} />
                <KpiCard icon={Boxes}        label="Compras conveniência" value={loading ? '—' : currency.format(compConv.valor || 0)} />
                <KpiCard icon={Gauge}        label="Aferições"            value={loading ? '—' : number.format(afer.total      || 0)} sub={loading ? '' : `${number.format(afer.qtd || 0)} un.`} />
              </>);
            })()}
          </div>

          <TopProdutosBanner dados={topProdutos} loading={loading || slotLoading} />
        </>
      )}
    </main>
  );
}
