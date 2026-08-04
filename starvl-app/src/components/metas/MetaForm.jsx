import React, { useState } from 'react';
import { Button, Select } from '../ui';
import {
  TIPOS_META, CATEGORIAS_META, INDICADORES_POR_CATEGORIA,
  FREQUENCIAS_META, PRIORIDADES_META,
} from '../../constants/metas';

const EMPTY = {
  nome: '', descricao: '', tipo: 'empresa', referencia: '', categoria: 'Financeiro', indicador: 'Faturamento',
  valorMeta: '', dataInicial: '', dataFinal: '', frequencia: 'Mensal', prioridade: 'Média',
  responsavel: '', observacoes: '',
};

// Campos + validação do formulário de meta — usado tanto pelo modal de
// edição (MetaFormModal.jsx) quanto embutido na aba "Criar Meta".
export default function MetaForm({ meta, onSave, onCancel, submitLabel }) {
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
      if (!meta) setForm(EMPTY); // formulário de criação limpa após salvar
    } catch (err) {
      setErro(err.message || 'Erro ao salvar meta.');
    } finally {
      setSaving(false);
    }
  }

  const indicadores = INDICADORES_POR_CATEGORIA[form.categoria] || [];

  return (
    <>
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
          <Select value={form.tipo} onChange={v => set('tipo', v)} options={TIPOS_META} searchPlaceholder="Buscar tipo…" />
        </div>
        <div className="form-field">
          <label>Referência (opcional)</label>
          <input type="text" value={form.referencia} onChange={e => set('referencia', e.target.value)} placeholder="Ex: nome do vendedor/produto" />
        </div>

        <div className="form-field">
          <label>Categoria</label>
          <Select value={form.categoria} onChange={v => set('categoria', v)} options={CATEGORIAS_META} />
        </div>
        <div className="form-field">
          <label>Indicador</label>
          <Select value={form.indicador} onChange={v => set('indicador', v)} options={indicadores} searchPlaceholder="Buscar indicador…" />
        </div>

        <div className="form-field">
          <label>Valor da meta</label>
          <input type="number" step="0.01" value={form.valorMeta} onChange={e => set('valorMeta', e.target.value)} placeholder="0,00" />
        </div>
        <div className="form-field">
          <label>Prioridade</label>
          <Select value={form.prioridade} onChange={v => set('prioridade', v)} options={PRIORIDADES_META} />
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
          <Select value={form.frequencia} onChange={v => set('frequencia', v)} options={FREQUENCIAS_META} />
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
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancelar</Button>}
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando…' : (submitLabel || 'Salvar')}
        </Button>
      </div>
    </>
  );
}
