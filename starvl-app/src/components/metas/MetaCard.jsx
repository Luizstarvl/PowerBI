import React from 'react';
import { Calendar, User } from 'lucide-react';
import { Badge, ProgressBar } from '../ui';
import { indicadorLabel, tipoLabel } from '../../constants/metas';

const STATUS_BADGE = {
  'Não iniciada': 'neutral',
  'Em andamento': 'warning',
  'Concluída':    'success',
  'Atrasada':     'error',
  'Cancelada':    'neutral',
};

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const number   = new Intl.NumberFormat('pt-BR');

const PERCENT_INDICADORES = ['Margem', 'Rentabilidade', 'Conversao', 'Giro', 'Cobertura', 'Ruptura', 'Perdas', 'Economia', 'Satisfacao'];
const CONTAGEM_INDICADORES = ['QuantidadeVendida', 'NovosClientes', 'ClientesAtivos', 'VendasPorHora', 'VendasPorDia', 'ProdutosComprados', 'ChamadosResolvidos', 'Inventario', 'EstoqueIdeal'];

export function formatValorIndicador(valor, indicador) {
  if (PERCENT_INDICADORES.includes(indicador))  return `${number.format(valor)}%`;
  if (CONTAGEM_INDICADORES.includes(indicador))  return number.format(valor);
  return currency.format(valor);
}

export function formatDateBR(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default function MetaCard({ meta, onClick }) {
  return (
    <button className="meta-card" onClick={() => onClick(meta)}>
      <div className="meta-card-header">
        <div>
          <div className="meta-card-title">{meta.nome}</div>
          <div className="meta-card-sub">
            {tipoLabel(meta.tipo)}{meta.referencia ? ` · ${meta.referencia}` : ''} · {indicadorLabel(meta.categoria, meta.indicador)}
          </div>
        </div>
        <div className="meta-card-tags">
          <Badge variant={STATUS_BADGE[meta.status] || 'neutral'}>{meta.status}</Badge>
        </div>
      </div>

      <div className="meta-card-values">
        <div className="meta-card-value-block">
          <span className="meta-card-value-label">Meta</span>
          <span className="meta-card-value">{formatValorIndicador(meta.valorMeta, meta.indicador)}</span>
        </div>
        <div className="meta-card-value-block" style={{ alignItems: 'flex-end' }}>
          <span className="meta-card-value-label">Realizado</span>
          <span className="meta-card-value">{formatValorIndicador(meta.valorAtual, meta.indicador)}</span>
        </div>
      </div>

      <ProgressBar percentual={meta.percentual} atrasada={meta.status === 'Atrasada'} />

      <div className="meta-card-footer">
        <div className="meta-card-footer-item">
          <Calendar size={13} />
          <span>{formatDateBR(meta.dataFinal)}</span>
        </div>
        <div className="meta-card-footer-item">
          <User size={13} />
          <span>{meta.responsavel || 'Sem responsável'}</span>
        </div>
      </div>
    </button>
  );
}
