import React, { useState } from 'react';
import {
  TrendingUp, BarChart2, Target, ArrowLeft, ChevronRight,
  Activity, Clock
} from 'lucide-react';
import ProjecaoVendas     from '../components/planejamento/ProjecaoVendas';
import MetasComerciais    from '../components/planejamento/MetasComerciais';
import PerformanceVendas  from '../components/planejamento/PerformanceVendas';
import MargemMarkup       from '../components/planejamento/MargemMarkup';

/* ── Definição dos módulos ─────────────────────────────────────
   Adicione novos módulos aqui no futuro.
   status: 'ativo' | 'em_breve'
──────────────────────────────────────────────────────────────── */
const MODULOS = [
  {
    key: 'projecao',
    titulo: 'Projeção de Vendas',
    descricao: 'Analise tendências, compare históricos e acompanhe previsões com suporte de IA preditiva.',
    Icon: TrendingUp,
    cor: '#F97316',
    tags: ['IA Preditiva', 'Gráficos', 'Export'],
    status: 'ativo',
  },
  {
    key: 'metas_comerciais',
    titulo: 'Metas Comerciais',
    descricao: 'Defina, acompanhe e gerencie as metas por equipe, produto e período.',
    Icon: Target,
    cor: '#60A5FA',
    tags: ['KPIs', 'Seções', 'Período'],
    status: 'ativo',
  },
  {
    key: 'margem',
    titulo: 'Análise de Margem e Markup',
    descricao: 'Monitore a rentabilidade dos seus produtos e identifique oportunidades de aumentar seus resultados.',
    Icon: TrendingUp,
    cor: '#10B981',
    tags: ['Margem', 'Markup', 'Rentabilidade'],
    status: 'ativo',
  },
  {
    key: 'performance',
    titulo: 'Performance de Vendas',
    descricao: 'Avalie o desempenho de produtos, categorias e fornecedores em tempo real.',
    Icon: BarChart2,
    cor: '#22C55E',
    tags: ['Rankings', 'Comparativo', 'Fornecedores'],
    status: 'ativo',
  },
];

/* ── Hub — tela inicial com cards ─────────────────────────────── */
function Hub({ onSelect }) {
  return (
    <div className="pc-hub">
      {/* Cabeçalho do hub */}
      <div className="pc-hub-header">
        <div className="pc-hub-eyebrow">
          <Activity size={13} />
          ECLIPSE BI · PLANEJAMENTO
        </div>
        <h1 className="pc-hub-title">Planejamento Comercial</h1>
        <p className="pc-hub-sub">
          Selecione um módulo para começar a analisar e planejar suas operações comerciais.
        </p>
      </div>

      {/* Grid de cards */}
      <div className="pc-hub-grid">
        {MODULOS.map(mod => (
          <button
            key={mod.key}
            className={`pc-mod-card${mod.status === 'em_breve' ? ' pc-mod-soon' : ''}`}
            onClick={() => mod.status === 'ativo' && onSelect(mod.key)}
            disabled={mod.status === 'em_breve'}
            style={{ '--mod-cor': mod.cor }}
          >
            {/* Badge em breve */}
            {mod.status === 'em_breve' && (
              <span className="pc-mod-badge-soon">
                <Clock size={10} /> Em breve
              </span>
            )}

            {/* Ícone */}
            <div className="pc-mod-icon-wrap">
              <mod.Icon size={28} />
            </div>

            {/* Texto */}
            <div className="pc-mod-content">
              <div className="pc-mod-titulo">{mod.titulo}</div>
              <p className="pc-mod-desc">{mod.descricao}</p>
              <div className="pc-mod-tags">
                {mod.tags.map(t => (
                  <span key={t} className="pc-mod-tag">{t}</span>
                ))}
              </div>
            </div>

            {/* Seta */}
            {mod.status === 'ativo' && (
              <ChevronRight size={18} className="pc-mod-arrow" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Módulo interno com cabeçalho de volta ─────────────────────── */
function ModuloWrapper({ moduloKey, onBack, empresasKey, clients, empresas }) {
  const mod = MODULOS.find(m => m.key === moduloKey);

  return (
    <div className="pc-modulo-wrap">
      {/* Barra de volta */}
      <div className="pc-modulo-topbar">
        <button className="pc-back-btn pc-back-btn-destaque" onClick={onBack}>
          <ArrowLeft size={15} />
          Voltar
        </button>
      </div>

      {/* Conteúdo do módulo */}
      {moduloKey === 'projecao'          && <ProjecaoVendas    empresasKey={empresasKey} clients={clients} empresas={empresas} />}
      {moduloKey === 'metas_comerciais'  && <MetasComerciais   empresasKey={empresasKey} clients={clients} empresas={empresas} />}
      {moduloKey === 'performance'       && <PerformanceVendas empresasKey={empresasKey} clients={clients} empresas={empresas} />}
      {moduloKey === 'margem'            && <MargemMarkup      empresasKey={empresasKey} clients={clients} empresas={empresas} />}
    </div>
  );
}

/* ── Page principal ────────────────────────────────────────────── */
export default function PlanejamentoComercial({ empresas, clients = [] }) {
  const [modulo, setModulo] = useState(null); // null = hub
  const empresasKey = (empresas || []).join(',');

  return (
    <main className="dashboard pv-main-page">
      {modulo === null
        ? <Hub onSelect={setModulo} />
        : <ModuloWrapper
            moduloKey={modulo}
            onBack={() => setModulo(null)}
            empresasKey={empresasKey}
            clients={clients}
            empresas={empresas}
          />
      }
    </main>
  );
}
