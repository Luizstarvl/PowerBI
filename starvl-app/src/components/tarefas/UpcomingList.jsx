import React from 'react';
import { Clock } from 'lucide-react';

function diaISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

export default function UpcomingList({ tasks }) {
  const abertas = tasks.filter(t => t.status !== 'concluida' && t.prazo);
  const hoje = diaISO(0), amanha = diaISO(1), em7dias = diaISO(7);

  const grupos = [
    { label: 'Hoje',            items: abertas.filter(t => t.prazo.slice(0, 10) === hoje) },
    { label: 'Amanhã',          items: abertas.filter(t => t.prazo.slice(0, 10) === amanha) },
    { label: 'Próximos 7 dias', items: abertas.filter(t => { const p = t.prazo.slice(0, 10); return p > amanha && p <= em7dias; }) },
  ];

  const semNenhum = grupos.every(g => g.items.length === 0);
  if (semNenhum) return <p className="rank-empty">Nenhum vencimento nos próximos 7 dias.</p>;

  return (
    <div className="upcoming-list">
      {grupos.filter(g => g.items.length > 0).map(g => (
        <div key={g.label} className="upcoming-group">
          <div className="upcoming-group-label">{g.label}</div>
          {g.items.map(t => (
            <div key={t.id} className="upcoming-item">
              <Clock size={13} />
              <span>{t.titulo}</span>
              {t.responsavelNome && <span className="upcoming-item-resp">{t.responsavelNome}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
