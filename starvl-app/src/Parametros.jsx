import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

const PERFIS = ['admin', 'user'];

function ModalUsuario({ usuario, onSave, onClose }) {
  const [form, setForm] = useState({
    usuario: usuario?.usuario || '',
    senha: '',
    perfil: usuario?.perfil || 'user',
  });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const isEdit = !!usuario;

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.usuario.trim()) return setErro('Usuário é obrigatório.');
    if (!isEdit && !form.senha.trim()) return setErro('Senha é obrigatória.');
    setErro('');
    setLoading(true);
    try {
      const url = isEdit
        ? `${API_URL}/api/starvl-users/${usuario.id}`
        : `${API_URL}/api/starvl-users`;
      const method = isEdit ? 'PUT' : 'POST';
      const body = { usuario: form.usuario.trim(), perfil: form.perfil };
      if (form.senha.trim()) body.senha = form.senha;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return setErro(data.error || 'Erro ao salvar.');
      onSave(data);
    } catch {
      setErro('Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</h3>

        <div className="modal-body">
          <div className="form-field">
            <label>Usuário</label>
            <input
              type="text"
              value={form.usuario}
              onChange={e => set('usuario', e.target.value)}
              placeholder="nome de usuário"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label>{isEdit ? 'Nova senha (deixe em branco para manter)' : 'Senha'}</label>
            <input
              type="password"
              value={form.senha}
              onChange={e => set('senha', e.target.value)}
              placeholder="••••••"
            />
          </div>

          <div className="form-field">
            <label>Perfil</label>
            <select value={form.perfil} onChange={e => set('perfil', e.target.value)}>
              {PERFIS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {erro && <p className="form-erro">{erro}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Parametros() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // null | 'novo' | { usuario }

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/starvl-users`)
      .then(r => r.json())
      .then(data => setUsuarios(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSave(saved) {
    setUsuarios(prev => {
      const idx = prev.findIndex(u => u.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setModal(null);
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir este usuário?')) return;
    await fetch(`${API_URL}/api/starvl-users/${id}`, { method: 'DELETE' });
    setUsuarios(prev => prev.filter(u => u.id !== id));
  }

  return (
    <main className="dashboard">
      <h2 className="section-title">Parâmetros</h2>

      <div className="param-group">
        <div className="param-group-header">
          <span className="param-group-title">Gestão de Usuários</span>
          <button className="btn-primary" onClick={() => setModal('novo')}>+ Novo usuário</button>
        </div>

        <div className="param-table-wrap">
          {loading ? (
            <p className="rank-empty">Carregando…</p>
          ) : (
            <table className="param-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td className="td-id">{u.id}</td>
                    <td>{u.usuario}</td>
                    <td><span className={`badge badge-${u.perfil}`}>{u.perfil}</span></td>
                    <td className="td-actions">
                      <button className="action-btn" onClick={() => setModal(u)}>Editar</button>
                      <button className="action-btn danger" onClick={() => handleDelete(u.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <ModalUsuario
          usuario={modal === 'novo' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </main>
  );
}
