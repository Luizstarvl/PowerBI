import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function PlanejamentoComercial() {
  return (
    <div className="pc-empty-state">
      <div className="pc-empty-icon-wrap">
        <TrendingUp size={40} strokeWidth={1.5} />
      </div>
      <h2 className="pc-empty-title">Planejamento Comercial</h2>
      <p className="pc-empty-sub">
        Esta seção está em desenvolvimento. Em breve você poderá gerenciar metas,
        estratégias e indicadores comerciais aqui.
      </p>
    </div>
  );
}
