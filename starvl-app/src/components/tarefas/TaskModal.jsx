import React, { useState } from 'react';
import Portal from '../../Portal';
import { Select } from '../ui';
import { PRIORIDADES, STATUS_TAREFA, CATEGORIAS_TAREFA } from '../../constants/tarefas';

const EMPTY = { titulo: '', descricao: '', responsavelId: '', prioridade: 'media', prazo: '', status: 'pendente', categoria: '' };

export default function TaskModal({ task, usuarios, onClose, onSave }) {
  const [form, setForm] = useState(() => task ? {
    titulo: task.titulo, descricao: task.descricao || '',
    responsavelId: task.responsavelId ? String(task.responsavelId) : '',
    prioridade: task.prioridade, prazo: task.prazo?.slice(0, 10) || '',
    status: task.status === 'atrasada' ? 'pendente' : task.status,
    categoria: task.categoria || '',
  } : EMPTY);
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSave() {
    setErro('');
    if (!form.titulo.trim()) return setErro('Título é obrigatório.');
    setSaving(true);
    try {
      await onSave({ ...form, responsavelId: form.responsavelId ? parseInt(form.responsavelId) : null });
    } catch (err) {
      setErro(err.message || 'Erro ao salvar tarefa.');
    } finally {
      setSaving(false);
    }
  }

  const usuarioOptions = [
    { value: '', label: 'Sem responsável' },
    ...(usuarios || []).map(u => ({ value: String(u.id), label: u.nome || u.usuario })),
  ];
  const categoriaOptions = [
    { value: '', label: 'Sem categoria' },
    ...CATEGORIAS_TAREFA.map(c => ({ value: c, label: c })),
  ];

  return (
    <Portal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
          <h3 className="modal-title">{task ? 'Editar tarefa' : 'Nova tarefa'}</h3>
          <div className="modal-body">
            <div className="modal-grid-2">
              <div className="form-field" style={{ gridColumn: '1/-1' }}>
                <label>Título</label>
                <input type="text" value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Conferir fechamento de caixa" />
              </div>
              <div className="form-field" style={{ gridColumn: '1/-1' }}>
                <label>Descrição</label>
                <input type="text" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Opcional" />
              </div>

              <div className="form-field">
                <label>Responsável</label>
                <Select value={form.responsavelId} onChange={v => set('responsavelId', v)} options={usuarioOptions} searchPlaceholder="Buscar usuário…" />
              </div>
              <div className="form-field">
                <label>Categoria</label>
                <Select value={form.categoria} onChange={v => set('categoria', v)} options={categoriaOptions} searchPlaceholder="Buscar categoria…" />
              </div>

              <div className="form-field">
                <label>Prioridade</label>
                <Select value={form.prioridade} onChange={v => set('prioridade', v)} options={PRIORIDADES} />
              </div>
              <div className="form-field">
                <label>Prazo</label>
                <input type="date" value={form.prazo} onChange={e => set('prazo', e.target.value)} />
              </div>

              {task && (
                <div className="form-field">
                  <label>Status</label>
                  <Select value={form.status} onChange={v => set('status', v)} options={STATUS_TAREFA.filter(s => s.value !== 'atrasada')} />
                </div>
              )}
            </div>

            {erro && <p className="form-erro">{erro}</p>}
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
