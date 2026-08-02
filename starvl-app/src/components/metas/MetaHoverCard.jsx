import React from 'react';
import { formatValorIndicador, formatDateBR } from './MetaCard';
import { indicadorLabel } from '../../constants/metas';

function diasRestantes(dataFinal) {
  const diff = Math.ceil((new Date(dataFinal) - new Date()) / 86400000);
  if (diff > 0) return `${diff} dia${diff === 1 ? '' : 's'} restantes`;
  if (diff === 0) return 'Vence hoje';
  return `Vencida há ${Math.abs(diff)} dia${Math.abs(diff) === 1 ? '' : 's'}`;
}

// Popup posicionado perto do cursor — usado na tabela de metas e no gráfico
// de ranking. Mostra o resumo completo sem precisar abrir o modal de detalhe.
const CARD_WIDTH = 260;
const CARD_HEIGHT_ESTIMATE = 230;

export default function MetaHoverCard({ meta, x, y, empresaNome }) {
  const left = Math.min(x + 16, window.innerWidth - CARD_WIDTH - 12);
  const top  = Math.min(y + 16, window.innerHeight - CARD_HEIGHT_ESTIMATE - 12);
  return (
    <div className="meta-hover-card" style={{ left, top }}>
      <div className="meta-hover-title">{meta.nome}</div>
      <div className="meta-hover-row"><span>Responsável</span><strong>{meta.responsavel || '—'}</strong></div>
      {empresaNome && <div className="meta-hover-row"><span>Empresa</span><strong>{empresaNome}</strong></div>}
      <div className="meta-hover-row"><span>Categoria</span><strong>{meta.categoria}</strong></div>
      <div className="meta-hover-row"><span>Valor esperado</span><strong>{formatValorIndicador(meta.valorMeta, meta.indicador)}</strong></div>
      <div className="meta-hover-row"><span>Valor realizado</span><strong>{formatValorIndicador(meta.valorAtual, meta.indicador)}</strong></div>
      <div className="meta-hover-row"><span>Percentual</span><strong>{meta.percentual}%</strong></div>
      <div className="meta-hover-row"><span>Prazo</span><strong>{diasRestantes(meta.dataFinal)}</strong></div>
      <div className="meta-hover-divider" />
      <div className="meta-hover-hist">
        Criada em {formatDateBR(meta.criado)} · Indicador: {indicadorLabel(meta.categoria, meta.indicador)}
      </div>
    </div>
  );
}
