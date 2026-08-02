import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Circle, XCircle } from 'lucide-react';
import { Badge, ProgressBar } from '../ui';
import { tipoLabel } from '../../constants/metas';
import { formatValorIndicador, formatDateBR } from './MetaCard';
import MetaHoverCard from './MetaHoverCard';

const STATUS_BADGE = {
  'Não iniciada': 'neutral',
  'Em andamento': 'info',
  'Concluída':    'success',
  'Atrasada':     'error',
  'Cancelada':    'neutral',
};

const STATUS_ICON = {
  'Não iniciada': Circle,
  'Em andamento': Clock,
  'Concluída':    CheckCircle2,
  'Atrasada':     AlertTriangle,
  'Cancelada':    XCircle,
};

export default function MetaTable({ metas, onOpen }) {
  const [hover, setHover] = useState(null); // { meta, x, y }

  if (metas.length === 0) {
    return <p className="rank-empty">Nenhuma meta encontrada com esses filtros.</p>;
  }

  return (
    <div className="param-table-wrap" style={{ position: 'relative' }}>
      <table className="param-table meta-table">
        <thead>
          <tr>
            <th>Meta</th>
            <th>Departamento</th>
            <th>Responsável</th>
            <th>Data inicial</th>
            <th>Data final</th>
            <th>Valor da meta</th>
            <th>Valor atual</th>
            <th style={{ width: 160 }}>Percentual</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {metas.map(m => {
            const StatusIcon = STATUS_ICON[m.status] || Circle;
            return (
              <tr
                key={m.id} className="tr-ctx" style={{ cursor: 'pointer' }}
                onClick={() => onOpen(m)}
                onMouseEnter={e => setHover({ meta: m, x: e.clientX, y: e.clientY })}
                onMouseMove={e => setHover(h => h && h.meta.id === m.id ? { ...h, x: e.clientX, y: e.clientY } : h)}
                onMouseLeave={() => setHover(null)}
              >
                <td>
                  <p className="gu-username">{m.nome}</p>
                  <p className="gu-subtext">{tipoLabel(m.tipo)}{m.referencia ? ` · ${m.referencia}` : ''}</p>
                </td>
                <td className="gu-subtext">{m.categoria}</td>
                <td className="gu-subtext">{m.responsavel || '—'}</td>
                <td className="gu-subtext">{formatDateBR(m.dataInicial)}</td>
                <td className="gu-subtext">{formatDateBR(m.dataFinal)}</td>
                <td className="gu-subtext">{formatValorIndicador(m.valorMeta, m.indicador)}</td>
                <td className="gu-subtext">{formatValorIndicador(m.valorAtual, m.indicador)}</td>
                <td><ProgressBar percentual={m.percentual} atrasada={m.status === 'Atrasada'} /></td>
                <td>
                  <Badge variant={STATUS_BADGE[m.status] || 'neutral'}>
                    <StatusIcon size={11} style={{ marginRight: 4, verticalAlign: -1.5 }} />
                    {m.status}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {hover && <MetaHoverCard meta={hover.meta} x={hover.x} y={hover.y} />}
    </div>
  );
}
