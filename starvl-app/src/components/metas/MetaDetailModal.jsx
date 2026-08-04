import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { X, Edit2, Trash2, RefreshCw } from 'lucide-react';
import Portal from '../../Portal';
import { Badge, Button, ProgressBar } from '../ui';
import { CHART_COLORS } from '../../theme/tokens';
import { indicadorLabel, tipoLabel } from '../../constants/metas';
import { formatValorIndicador, formatDateBR } from './MetaCard';

const STATUS_BADGE = {
  'Não iniciada': 'neutral',
  'Em andamento': 'warning',
  'Concluída':    'success',
  'Atrasada':     'error',
  'Cancelada':    'neutral',
};
const TABS = ['Evolução', 'Histórico', 'Comentários'];

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--color-text)',
};

export default function MetaDetailModal({ meta, isAdmin, currentUser, onClose, onEdit, onDelete, onLancarResultado, onComentar, onSincronizar }) {
  const [tab, setTab] = useState('Evolução');
  const [novoResultado, setNovoResultado] = useState({ data: new Date().toISOString().slice(0, 10), valor: '', observacao: '' });
  const [novoComentario, setNovoComentario] = useState('');
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState('');
  const [syncBusy, setSyncBusy] = useState(false);

  const chartData = (meta.resultados || []).map(r => ({ data: formatDateBR(r.data), valor: r.valor }));

  async function handleSincronizar() {
    setSyncBusy(true);
    setErro('');
    try { await onSincronizar(); }
    catch (err) { setErro(err.message || 'Erro ao sincronizar.'); }
    finally { setSyncBusy(false); }
  }

  async function handleLancar() {
    setErro('');
    if (!novoResultado.valor) return setErro('Informe um valor.');
    setBusy(true);
    try {
      await onLancarResultado(novoResultado);
      setNovoResultado({ data: new Date().toISOString().slice(0, 10), valor: '', observacao: '' });
    } catch (err) {
      setErro(err.message || 'Erro ao lançar resultado.');
    } finally {
      setBusy(false);
    }
  }

  async function handleComentar() {
    if (!novoComentario.trim()) return;
    setBusy(true);
    try {
      await onComentar(novoComentario.trim());
      setNovoComentario('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Portal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 24px 0' }}>
            <div>
              <h3 className="modal-title" style={{ padding: 0 }}>{meta.nome}</h3>
              <p className="meta-card-sub" style={{ marginTop: 4 }}>
                {tipoLabel(meta.tipo)}{meta.referencia ? ` · ${meta.referencia}` : ''} · {indicadorLabel(meta.categoria, meta.indicador)}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Badge variant={STATUS_BADGE[meta.status] || 'neutral'}>{meta.status}</Badge>
              {meta.sincronizavel && (
                <button className="icon-btn" title="Sincronizar com as vendas do sistema" onClick={handleSincronizar} disabled={syncBusy}>
                  <RefreshCw size={14} className={syncBusy ? 'spin' : ''} />
                </button>
              )}
              {isAdmin && (
                <>
                  <button className="icon-btn" title="Editar" onClick={() => onEdit(meta)}><Edit2 size={14} /></button>
                  <button className="icon-btn danger" title="Excluir" onClick={() => onDelete(meta)}><Trash2 size={14} /></button>
                </>
              )}
              <button className="icon-btn" title="Fechar" onClick={onClose}><X size={14} /></button>
            </div>
          </div>

          <div className="modal-body" style={{ overflowY: 'auto' }}>
            <div className="modal-grid-2" style={{ marginBottom: 8 }}>
              <div className="meta-card-value-block">
                <span className="meta-card-value-label">Meta</span>
                <span className="meta-card-value">{formatValorIndicador(meta.valorMeta, meta.indicador)}</span>
              </div>
              <div className="meta-card-value-block">
                <span className="meta-card-value-label">Realizado</span>
                <span className="meta-card-value">{formatValorIndicador(meta.valorAtual, meta.indicador)}</span>
              </div>
            </div>
            <ProgressBar percentual={meta.percentual} atrasada={meta.status === 'Atrasada'} />
            <p className="meta-card-sub" style={{ marginTop: 8, marginBottom: 20 }}>
              {formatDateBR(meta.dataInicial)} até {formatDateBR(meta.dataFinal)} · {meta.frequencia} · Prioridade {meta.prioridade}
              {meta.responsavel ? ` · Responsável: ${meta.responsavel}` : ''}
            </p>

            <div className="usr-tabnav">
              {TABS.map(t => (
                <button key={t} className={`usr-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>

            {tab === 'Evolução' && (
              <>
                {chartData.length === 0 ? (
                  <p className="chart-empty">Nenhum resultado lançado ainda.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="data" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} width={70} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="valor" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                <div className="modal-section-label" style={{ marginTop: 20, marginBottom: 12 }}>Lançar resultado</div>
                <div className="modal-grid-2">
                  <div className="form-field">
                    <label>Data</label>
                    <input type="date" value={novoResultado.data} onChange={e => setNovoResultado(v => ({ ...v, data: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label>Valor</label>
                    <input type="number" step="0.01" value={novoResultado.valor} onChange={e => setNovoResultado(v => ({ ...v, valor: e.target.value }))} placeholder="0,00" />
                  </div>
                  <div className="form-field" style={{ gridColumn: '1/-1' }}>
                    <label>Observação (opcional)</label>
                    <input type="text" value={novoResultado.observacao} onChange={e => setNovoResultado(v => ({ ...v, observacao: e.target.value }))} />
                  </div>
                </div>
                {erro && <p className="form-erro">{erro}</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <Button variant="primary" onClick={handleLancar} disabled={busy}>{busy ? 'Salvando…' : 'Lançar resultado'}</Button>
                </div>
              </>
            )}

            {tab === 'Histórico' && (
              (meta.historico || []).length === 0 ? (
                <p className="chart-empty">Sem alterações registradas.</p>
              ) : (
                <div>
                  {meta.historico.map(h => (
                    <div key={h.id} className="meta-detail-hist-item">
                      <span><strong>{h.campo}</strong>{h.valorAntigo ? `: "${h.valorAntigo}" → "${h.valorNovo}"` : `: ${h.valorNovo}`}</span>
                      <span className="meta-card-sub">{h.usuario} · {new Date(h.criado).toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === 'Comentários' && (
              <>
                {(meta.comentarios || []).length === 0 ? (
                  <p className="chart-empty">Nenhum comentário ainda.</p>
                ) : (
                  <div style={{ marginBottom: 16 }}>
                    {meta.comentarios.map(c => (
                      <div key={c.id} className="meta-detail-comment">
                        <div className="meta-detail-comment-header">
                          <span className="meta-detail-comment-user">{c.usuario}</span>
                          <span className="meta-detail-comment-date">{new Date(c.criado).toLocaleString('pt-BR')}</span>
                        </div>
                        <p className="meta-detail-comment-text">{c.texto}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="form-field">
                  <label>Novo comentário</label>
                  <input
                    type="text" value={novoComentario} onChange={e => setNovoComentario(e.target.value)}
                    placeholder={`Comentar como ${currentUser}`}
                    onKeyDown={e => e.key === 'Enter' && handleComentar()}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <Button variant="primary" onClick={handleComentar} disabled={busy || !novoComentario.trim()}>Comentar</Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
