import React, { useState } from 'react';
import { Package, Users, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import TabelaConsulta from '../components/cadastros/TabelaConsulta';
import PainelProdutos from '../components/cadastros/PainelProdutos';
import PainelClientes from '../components/cadastros/PainelClientes';

const CADASTROS = [
  { key: 'produtos', label: 'Cadastro de Produtos', desc: 'Consulte os produtos cadastrados no sistema.', Icon: Package, slot: 'cadastro_produtos' },
  { key: 'clientes', label: 'Cadastro de Clientes',  desc: 'Consulte os clientes cadastrados no sistema.', Icon: Users,   slot: 'cadastro_clientes'  },
];

export default function Cadastros({ empresas }) {
  const [view, setView] = useState('home');
  const empresasKey = (empresas || []).join(',');

  if (view !== 'home') {
    const item = CADASTROS.find(c => c.key === view);

    if (item.key === 'produtos') {
      return (
        <main className="dashboard">
          <PainelProdutos empresasKey={empresasKey} onVoltar={() => setView('home')} />
        </main>
      );
    }

    if (item.key === 'clientes') {
      return (
        <main className="dashboard">
          <PainelClientes empresasKey={empresasKey} onVoltar={() => setView('home')} />
        </main>
      );
    }

    return (
      <main className="dashboard">
        <div className="gu-header">
          <div>
            <button className="cad-voltar" onClick={() => setView('home')}>
              <ChevronLeft size={16} /> Cadastros
            </button>
            <h2 className="gu-title" style={{ marginTop: 8 }}>
              <item.Icon size={18} strokeWidth={1.8} style={{ marginRight: 8 }} />
              {item.label}
            </h2>
          </div>
        </div>
        <div className="param-group">
          <TabelaConsulta slot={item.slot} empresasKey={empresasKey} titulo={item.label} />
        </div>
      </main>
    );
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
