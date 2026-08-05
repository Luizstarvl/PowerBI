import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import ProjecaoVendas from '../components/planejamento/ProjecaoVendas';

const TABS = [
  { key: 'projecao', label: 'Projeção de Vendas' },
];

export default function PlanejamentoComercial({ empresas }) {
  const [tab, setTab] = useState('projecao');
  const empresasKey = (empresas || []).join(',');

  /* ── Nenhuma empresa selecionada ── */
  if (!empresasKey) {
    return (
      <main className="dashboard pv-main-page">
        <div className="pc-empty-state">
          <div className="pc-empty-icon-wrap">
            <TrendingUp size={36} />
          </div>
          <h2 className="pc-empty-title">Planejamento Comercial</h2>
          <p className="pc-empty-sub">
            Selecione uma empresa na barra superior para visualizar
            a projeção de vendas, análises e insights comerciais.
          </p>
        </div>
      </main>
    );
  }

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
