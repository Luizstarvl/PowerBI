import React, { useState } from 'react';
import { Package, Users, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';

const CADASTROS = [
  { key: 'produtos', label: 'Cadastro de Produtos', desc: 'Gerencie os produtos cadastrados no sistema.', Icon: Package },
  { key: 'clientes', label: 'Cadastro de Clientes',  desc: 'Gerencie os clientes cadastrados no sistema.', Icon: Users    },
];

function CadastroPlaceholder({ titulo, onVoltar }) {
  return (
    <main className="dashboard">
      <div className="gu-header">
        <div>
          <button className="cad-voltar" onClick={onVoltar}>
            <ChevronLeft size={16} /> Cadastros
          </button>
          <h2 className="gu-title" style={{ marginTop: 8 }}>{titulo}</h2>
        </div>
      </div>
      <div className="param-group">
        <div style={{ padding: '32px 22px' }}>
          <p className="rank-empty">Em breve.</p>
        </div>
      </div>
    </main>
  );
}

export default function Cadastros() {
  const [view, setView] = useState('home');

  if (view !== 'home') {
    const item = CADASTROS.find(c => c.key === view);
    return <CadastroPlaceholder titulo={item.label} onVoltar={() => setView('home')} />;
  }

  return (
    <main className="dashboard">
      <div className="gu-header">
        <div>
          <h2 className="gu-title"><ClipboardList size={20} strokeWidth={2} /> Cadastros</h2>
          <p className="gu-subtitle">Acesso rápido aos cadastros do sistema.</p>
        </div>
      </div>

      <div className="cad-landing-grid">
        {CADASTROS.map(({ key, label, desc, Icon }) => (
          <button key={key} className="cad-landing-card" onClick={() => setView(key)}>
            <div className="cad-landing-card-icon"><Icon size={22} strokeWidth={1.8} /></div>
            <div className="cad-landing-card-body">
              <div className="cad-landing-card-title">{label}</div>
              <div className="cad-landing-card-desc">{desc}</div>
            </div>
            <ChevronRight size={18} className="cad-landing-card-arrow" />
          </button>
        ))}
      </div>
    </main>
  );
}
