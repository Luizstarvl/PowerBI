import React, { useEffect, useRef, useState } from 'react';

const defaultFormatter = n => Math.round(n).toLocaleString('pt-BR');

// Anima um número de 0 (ou do valor anterior) até `value` — usado nos KPIs.
export default function CountUp({ value, duration = 800, formatter = defaultFormatter }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
    const start = performance.now();
    let raf;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{formatter(display)}</>;
}
