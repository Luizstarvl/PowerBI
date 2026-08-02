import React, { useRef } from 'react';

// tilt: efeito 3D sutil que segue o mouse — opt-in (não muda o Dashboard,
// que já usa este componente sem o prop).
export default function KpiCard({ icon: Icon, label, value, sub, tilt = false }) {
  const ref = useRef(null);

  function handleMouseMove(e) {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.setProperty('--tilt-x', `${(-y * 7).toFixed(2)}deg`);
    ref.current.style.setProperty('--tilt-y', `${(x * 7).toFixed(2)}deg`);
  }
  function handleMouseLeave() {
    if (!tilt || !ref.current) return;
    ref.current.style.setProperty('--tilt-x', '0deg');
    ref.current.style.setProperty('--tilt-y', '0deg');
  }

  return (
    <div
      ref={ref}
      className={`kpi-card${tilt ? ' kpi-card--tilt' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
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
