import React, { useEffect, useState } from 'react';

// cinza (0%) · laranja (1–79%) · verde (80–100%) · azul (acima da meta) · vermelho (atrasada)
function progressVariant(percentual, atrasada) {
  if (atrasada) return 'error';
  if (percentual <= 0) return 'neutral';
  if (percentual < 80) return 'warning';
  if (percentual <= 100) return 'success';
  return 'info';
}

export default function ProgressBar({ percentual = 0, atrasada = false, showLabel = true }) {
  const variant = progressVariant(percentual, atrasada);
  const target = Math.min(Math.max(percentual, 0), 100);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <div className="progress-bar">
      <div className="progress-bar-track">
        <div className={`progress-bar-fill progress-bar-fill--${variant}`} style={{ width: `${width}%` }} />
      </div>
      {showLabel && (
        <span className={`progress-bar-label progress-bar-label--${variant}`}>{percentual}%</span>
      )}
    </div>
  );
}
