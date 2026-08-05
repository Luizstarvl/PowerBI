import React, { useState } from 'react';
import ProjecaoVendas from '../components/planejamento/ProjecaoVendas';

const TABS = [
  { key: 'projecao', label: 'Projeção de Vendas' },
];

export default function PlanejamentoComercial({ empresas }) {
  const [tab, setTab] = useState('projecao');
  const empresasKey = (empresas || []).join(',');

  return (
    <main className="dashboard pv-main-page">
      <div className="usr-tabnav">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`usr-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'projecao' && <ProjecaoVendas empresasKey={empresasKey} />}
    </main>
  );
}
