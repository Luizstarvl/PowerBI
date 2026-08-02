import React from 'react';
import { ArrowUpRight } from 'lucide-react';

function Sparkline({ points }) {
  const w = 100, h = 30;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={coords} className="sparkline-line" fill="none" />
    </svg>
  );
}

export default function MetricCard({ label, Icon, value, comparison, points }) {
  const isPositive = comparison.startsWith('+');
  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <span className="metric-card-icon"><Icon size={15} /></span>
        <span className="metric-card-label">{label}</span>
      </div>
      <div className="metric-card-value">{value}</div>
      <div className={`metric-card-comparison${isPositive ? ' up' : ''}`}>
        {isPositive && <ArrowUpRight size={12} />}
        {comparison}
      </div>
      <Sparkline points={points} />
    </div>
  );
}
