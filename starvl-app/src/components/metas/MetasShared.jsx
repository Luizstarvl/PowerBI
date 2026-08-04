import React from 'react';

// Formatadores e pequenos componentes reaproveitados entre Metas.jsx e
// VisaoGeral.jsx — extraídos pra cá pra evitar import circular entre a
// página e o componente de aba que ela renderiza.

export const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

export function fmtPeriodo(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const mes = d.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' });
    const ano = d.getUTCFullYear();
    return `${mes.charAt(0).toUpperCase() + mes.slice(1).replace('.', '')}/${ano}`;
  } catch { return '—'; }
}

export const STATUS_CFG = {
  'Concluída':    { dot: '#22C55E', bg: 'rgba(34,197,94,.10)',   text: '#16A34A', label: 'Atingida'       },
  'Em andamento': { dot: '#F59E0B', bg: 'rgba(245,158,11,.10)',  text: '#B45309', label: 'Em andamento'   },
  'Não iniciada': { dot: '#94A3B8', bg: 'rgba(148,163,184,.10)', text: '#64748B', label: 'Não iniciada'   },
  'Atrasada':     { dot: '#EF4444', bg: 'rgba(239,68,68,.10)',   text: '#DC2626', label: 'Abaixo da meta' },
  'Cancelada':    { dot: '#6B7280', bg: 'rgba(107,114,128,.10)', text: '#4B5563', label: 'Cancelada'      },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG['Não iniciada'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.text,
      padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

export function BarraPercentual({ pct }) {
  const clamped = Math.min(pct, 100);
  const cor = pct >= 100 ? '#22C55E' : pct >= 75 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--border, rgba(255,255,255,.1))', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${clamped}%`, height: '100%', background: cor, borderRadius: 4, transition: 'width .3s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: cor, minWidth: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

export function KpiMeta({ icon: Icon, label, value, sub, progress }) {
  return (
    <div className="mgt-kpi-card">
      <div className="kpi-card-icon">
        {Icon && <Icon size={18} strokeWidth={2} />}
      </div>
      <div className="mgt-kpi-content">
        <div className="mgt-kpi-label">{label}</div>
        <div className="mgt-kpi-value">{value}</div>
        {progress != null && (
          <div style={{ marginTop: 6 }}>
            <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 4, transition: 'width .4s' }} />
            </div>
          </div>
        )}
        <div className="mgt-kpi-sub">{sub}</div>
      </div>
    </div>
  );
}
