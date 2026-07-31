import React, { useState, useEffect, useRef } from 'react';
import Portal from './Portal';

function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleOut(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOut);
    return () => document.removeEventListener('mousedown', handleOut);
  }, []);

  return (
    <div className="csel" ref={ref}>
      <button type="button" className="csel-trigger" onClick={() => setOpen(o => !o)}>
        <span>{value}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="csel-dropdown">
          {options.map(opt => (
            <button
              key={opt} type="button"
              className={`csel-option${value === opt ? ' selected' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >{opt}</button>
          ))}
        </div>
      )}
    </div>
  );
}

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

const PER_PAGE = 8;
const PERFIS = ['admin', 'user'];

function Avatar({ name }) {
  const initials = (name || '?').slice(0, 2).toUpperCase();
  const colors = ['#2563EB', '#16A34A', '#D97706', '#7C3AED', '#DC2626', '#0891B2'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className="user-avatar" style={{ background: color }}>
      {initials}
    </div>
  );
}

function ModalUsuario({ usuario, onSave, onClose }) {
  const [form, setForm] = useState({
    usuario: usuario?.usuario || '',
    senha: '',
    perfil: usuario?.perfil || 'user',
  });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const isEdit = !!usuario;

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSave() {
    if (!form.usuario.trim()) return setErro('Usuário é obrigatório.');
    if (!isEdit && !form.senha.trim()) return setErro('Senha é obrigatória.');
    setErro('');
    setLoading(true);
    try {
      const url = isEdit
        ? `${API_URL}/api/starvl-users/${usuario.id}`
        : `${API_URL}/api/starvl-users`;
      const body = { usuario: form.usuario.trim(), perfil: form.perfil };
      if (form.senha.trim()) body.senha = form.senha;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
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
            <input type="text" value={form.usuario} onChange={e => set('usuario', e.target.value)} placeholder="nome de usuário" autoFocus />
          </div>
          <div className="form-field">
            <label>{isEdit ? 'Nova senha (deixe em branco para manter)' : 'Senha'}</label>
            <input type="password" value={form.senha} onChange={e => set('senha', e.target.value)} placeholder="••••••" />
          </div>
          <div className="form-field">
            <label>Perfil</label>
            <CustomSelect value={form.perfil} onChange={v => set('perfil', v)} options={PERFIS} />
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
  const [modal, setModal] = useState(null);
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);

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
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
    setModal(null);
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir este usuário?')) return;
    await fetch(`${API_URL}/api/starvl-users/${id}`, { method: 'DELETE' });
    setUsuarios(prev => prev.filter(u => u.id !== id));
  }

  const filtrados = usuarios.filter(u =>
    u.usuario.toLowerCase().includes(busca.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtrados.length / PER_PAGE));
  const paginaAtual = Math.min(pagina, totalPages);
  const slice = filtrados.slice((paginaAtual - 1) * PER_PAGE, paginaAtual * PER_PAGE);

  const totalAdmin = usuarios.filter(u => u.perfil === 'admin').length;
  const totalUser  = usuarios.filter(u => u.perfil === 'user').length;

  return (
    <main className="dashboard">

      {/* ── Header ── */}
      <div className="gu-header">
        <h2 className="gu-title">Gerenciamento de Usuários</h2>
        <div className="gu-header-right">
          <div className="gu-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar usuário…"
              value={busca}
              onChange={e => { setBusca(e.target.value); setPagina(1); }}
            />
          </div>
          <button className="btn-primary" onClick={() => setModal('novo')}>+ Adicionar Usuário</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="gu-kpis">
        <div className="gu-kpi">
          <div className="gu-kpi-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <p className="gu-kpi-label">Total de Usuários</p>
            <p className="gu-kpi-value">{usuarios.length}</p>
          </div>
        </div>

        <div className="gu-kpi">
          <div className="gu-kpi-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <p className="gu-kpi-label">Administradores</p>
            <p className="gu-kpi-value">{totalAdmin}</p>
          </div>
        </div>

        <div className="gu-kpi">
          <div className="gu-kpi-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <p className="gu-kpi-label">Usuários</p>
            <p className="gu-kpi-value">{totalUser}</p>
          </div>
        </div>
      </div>

      {/* ── Tabela ── */}
      <div className="param-group">
        <div className="param-table-wrap">
          {loading ? (
            <p className="rank-empty">Carregando…</p>
          ) : (
            <table className="param-table">
              <thead>
                <tr>
                  <th style={{ width: 52 }}>Avatar</th>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th style={{ width: 120, textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {slice.length === 0 ? (
                  <tr><td colSpan={4} className="rank-empty">Nenhum usuário encontrado</td></tr>
                ) : slice.map(u => (
                  <tr key={u.id}>
                    <td><Avatar name={u.usuario} /></td>
                    <td className="gu-username">{u.usuario}</td>
                    <td><span className={`badge badge-${u.perfil}`}>{u.perfil}</span></td>
                    <td className="td-actions">
                      <button className="icon-btn" title="Editar" onClick={() => setModal(u)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className="icon-btn danger" title="Excluir" onClick={() => handleDelete(u.id)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Paginação ── */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPagina(1)} disabled={paginaAtual === 1}>«</button>
            <button className="page-btn" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={paginaAtual === 1}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={`page-btn${n === paginaAtual ? ' active' : ''}`}
                onClick={() => setPagina(n)}
              >{n}</button>
            ))}
            <button className="page-btn" onClick={() => setPagina(p => Math.min(totalPages, p + 1))} disabled={paginaAtual === totalPages}>›</button>
            <button className="page-btn" onClick={() => setPagina(totalPages)} disabled={paginaAtual === totalPages}>»</button>
          </div>
        )}
      </div>

      {modal && (
        <Portal>
          <ModalUsuario
            usuario={modal === 'novo' ? null : modal}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        </Portal>
      )}
    </main>
  );
}
