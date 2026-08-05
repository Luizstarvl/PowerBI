import React, { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import PainelProdutos from '../components/cadastros/PainelProdutos';
import PainelClientes from '../components/cadastros/PainelClientes';

const TABS = [
  { key: 'produtos', label: 'Produtos' },
  { key: 'clientes', label: 'Clientes' },
];

export default function Cadastros({ empresas }) {
  const [tab, setTab] = useState('produtos');
  const empresasKey = (empresas || []).join(',');

  return (
    <main className="dashboard">
      {/* ── Tab Navigation ── */}
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

      {/* ── Conteúdo da aba ── */}
      {tab === 'produtos' && (
        <PainelProdutos empresasKey={empresasKey} />
      )}
      {tab === 'clientes' && (
        <PainelClientes empresasKey={empresasKey} />
      )}
    </main>
  );
}
