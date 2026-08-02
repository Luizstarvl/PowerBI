import React, { useState } from 'react';
import Portal from '../../Portal';
import { Button } from '../ui';
import {
  TIPOS_META, CATEGORIAS_META, INDICADORES_POR_CATEGORIA,
  FREQUENCIAS_META, PRIORIDADES_META,
} from '../../constants/metas';

const EMPTY = {
  nome: '', descricao: '', tipo: 'empresa', referencia: '', categoria: 'Financeiro', indicador: 'Faturamento',
  valorMeta: '', dataInicial: '', dataFinal: '', frequencia: 'Mensal', prioridade: 'Média',
  responsavel: '', observacoes: '',
};

export default function MetaFormModal({ meta, onClose, onSave }) {
  const [form, setForm] = useState(() => meta ? {
    nome: meta.nome, descricao: meta.descricao, tipo: meta.tipo, referencia: meta.referencia,
    categoria: meta.categoria, indicador: meta.indicador, valorMeta: meta.valorMeta,
    dataInicial: meta.dataInicial?.slice(0, 10) || '', dataFinal: meta.dataFinal?.slice(0, 10) || '',
    frequencia: meta.frequencia, prioridade: meta.prioridade, responsavel: meta.responsavel, observacoes: meta.observacoes,
  } : EMPTY);
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm(f => {
      const next = { ...f, [field]: value };
      if (field === 'categoria') next.indicador = INDICADORES_POR_CATEGORIA[value][0].value;
      return next;
    });
  }

  async function handleSave() {
    setErro('');
    if (!form.nome.trim())                     return setErro('Nome é obrigatório.');
    if (!form.dataInicial || !form.dataFinal)   return setErro('Data inicial e final são obrigatórias.');
    if (form.dataFinal < form.dataInicial)      return setErro('Data final não pode ser antes da inicial.');
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setErro(err.message || 'Erro ao salvar meta.');
    } finally {
      setSaving(false);
    }
  }

  const indicadores = INDICADORES_POR_CATEGORIA[form.categoria] || [];

  return (
    <Portal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
          <h3 className="modal-title">{meta ? 'Editar meta' : 'Nova meta'}</h3>
          <div className="modal-body">
            <div className="modal-grid-2">
              <div className="form-field" style={{ gridColumn: '1/-1' }}>
                <label>Nome</label>
                <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Meta de Faturamento — Agosto" />
              </div>
              <div className="form-field" style={{ gridColumn: '1/-1' }}>
                <label>Descrição</label>
                <input type="text" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Opcional" />
              </div>

              <div className="form-field">
                <label>Tipo da meta</label>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                  {TIPOS_META.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Referência (opcional)</label>
                <input type="text" value={form.referencia} onChange={e => set('referencia', e.target.value)} placeholder="Ex: nome do vendedor/produto" />
              </div>

              <div className="form-field">
                <label>Categoria</label>
                <select value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                  {CATEGORIAS_META.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Indicador</label>
                <select value={form.indicador} onChange={e => set('indicador', e.target.value)}>
                  {indicadores.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
              </div>

              <div className="form-field">
                <label>Valor da meta</label>
                <input type="number" step="0.01" value={form.valorMeta} onChange={e => set('valorMeta', e.target.value)} placeholder="0,00" />
              </div>
              <div className="form-field">
                <label>Prioridade</label>
                <select value={form.prioridade} onChange={e => set('prioridade', e.target.value)}>
                  {PRIORIDADES_META.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="form-field">
                <label>Data inicial</label>
                <input type="date" value={form.dataInicial} onChange={e => set('dataInicial', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Data final</label>
                <input type="date" value={form.dataFinal} onChange={e => set('dataFinal', e.target.value)} />
              </div>

              <div className="form-field">
                <label>Frequência</label>
                <select value={form.frequencia} onChange={e => set('frequencia', e.target.value)}>
                  {FREQUENCIAS_META.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Responsável</label>
                <input type="text" value={form.responsavel} onChange={e => set('responsavel', e.target.value)} placeholder="Nome do responsável" />
              </div>

              <div className="form-field" style={{ gridColumn: '1/-1' }}>
                <label>Observações</label>
                <input type="text" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            {erro && <p className="form-erro">{erro}</p>}
          </div>
          <div className="modal-footer">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
