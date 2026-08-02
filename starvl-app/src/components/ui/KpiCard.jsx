import React from 'react';

export default function KpiCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="kpi-card">
      {Icon && (
        <div className="kpi-card-icon">
          <Icon size={18} strokeWidth={2} />
        </div>
      )}
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}
