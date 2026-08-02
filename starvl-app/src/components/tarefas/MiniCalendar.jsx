import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function isoDia(d) { return d.toISOString().split('T')[0]; }

export default function MiniCalendar({ tasks, selected, onSelect }) {
  const [mesRef, setMesRef] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const diasComTarefa = useMemo(() => {
    const set = new Set();
    tasks.forEach(t => { if (t.prazo) set.add(t.prazo.slice(0, 10)); });
    return set;
  }, [tasks]);

  const dias = useMemo(() => {
    const ano = mesRef.getFullYear(), mes = mesRef.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const inicioGrid = new Date(primeiroDia);
    inicioGrid.setDate(inicioGrid.getDate() - primeiroDia.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicioGrid);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [mesRef]);

  const hojeISO = isoDia(new Date());
  const mesLabel = mesRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <button className="icon-btn" style={{ marginLeft: 0 }} onClick={() => setMesRef(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
          <ChevronLeft size={14} />
        </button>
        <span className="mini-calendar-title">{mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)}</span>
        <button className="icon-btn" onClick={() => setMesRef(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="mini-calendar-grid">
        {DIAS_SEMANA.map((d, i) => <div key={i} className="mini-calendar-weekday">{d}</div>)}
        {dias.map(d => {
          const iso = isoDia(d);
          const foraDoMes = d.getMonth() !== mesRef.getMonth();
          const classes = ['mini-calendar-day'];
          if (foraDoMes) classes.push('outside');
          if (iso === hojeISO) classes.push('today');
          if (iso === selected) classes.push('selected');
          return (
            <button key={iso} className={classes.join(' ')} onClick={() => onSelect(iso === selected ? null : iso)}>
              {d.getDate()}
              {diasComTarefa.has(iso) && <span className="mini-calendar-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
