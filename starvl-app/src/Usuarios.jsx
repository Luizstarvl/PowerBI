import React, { useState, useEffect, useRef } from 'react';
import Portal from './Portal';
import { useT } from './i18n';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

const PER_PAGE = 8;
const PERFIS = ['admin', 'user'];
const AVATAR_COLORS = ['#2563EB', '#16A34A', '#D97706', '#7C3AED', '#DC2626', '#0891B2'];

/* ── CustomSelect ─────────────────────────────────────────────────────────────── */
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
            <button key={opt} type="button"
              className={`csel-option${value === opt ? ' selected' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >{opt}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Toggle ───────────────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange, labelOn, labelOff }) {
  return (
    <label className="toggle-wrap">
      <div className={`toggle-track${checked ? ' on' : ''}`} onClick={() => onChange(!checked)}>
        <div className="toggle-thumb" />
      </div>
      <span className="toggle-label">{checked ? labelOn : labelOff}</span>
    </label>
  );
}

/* ── Avatar ───────────────────────────────────────────────────────────────────── */
function Avatar({ name, foto, size = 34 }) {
  if (foto) {
    return <img className="user-avatar" src={foto} alt={name}
      style={{ width: size, height: size, objectFit: 'cover', flexShrink: 0 }} />;
  }
  const initials = (name || '?').slice(0, 2).toUpperCase();
  const color = AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <div className="user-avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

/* ── Modal ────────────────────────────────────────────────────────────────────── */
function ModalUsuario({ usuario, onSave, onClose }) {
  const { t } = useT();
  const [form, setForm] = useState({
    usuario: usuario?.usuario || '',
    senha:   '',
    perfil:  usuario?.perfil  || 'user',
    nome:    usuario?.nome    || '',
    email:   usuario?.email   || '',
  });
  const [ativo, setAtivo] = useState(usuario ? usuario.ativo !== false : true);
  const [foto,  setFoto]  = useState(usuario?.foto || null);
  const [erro,  setErro]  = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const isEdit = !!usuario;

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  function setNome(value) {
    set('nome', value.replace(/\b\w/g, c => c.toUpperCase()));
  }

  function handleFotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setFoto(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form.usuario.trim()) return setErro(t('mu_obrig_usuario'));
    if (!isEdit && !form.senha.trim()) return setErro(t('mu_obrig_senha'));
    setErro(''); setLoading(true);
    try {
      const url = isEdit
        ? `${API_URL}/api/starvl-users/${usuario.id}`
        : `${API_URL}/api/starvl-users`;
      const body = { usuario: form.usuario.trim(), perfil: form.perfil, nome: form.nome.trim() || null, email: form.email.trim() || null, ativo, foto };
      if (form.senha.trim()) body.senha = form.senha;
      const res  = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) return setErro(data.error || t('me_erro'));
      onSave(data);
    } catch { setErro(t('mu_erro_conexao')); }
    finally { setLoading(false); }
  }

  const avatarColor = AVATAR_COLORS[(form.usuario?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{isEdit ? t('mu_editar') : t('mu_novo')}</h3>
        <div className="modal-body">
          <div className="modal-foto-area">
            <div className="modal-foto-wrap">
              {foto
                ? <img className="modal-foto-img" src={foto} alt="avatar" />
                : <div className="modal-foto-placeholder" style={{ background: avatarColor }}>
                    {(form.usuario || '?').slice(0, 2).toUpperCase()}
                  </div>
              }
              <button type="button" className="modal-foto-edit" onClick={() => fileRef.current?.click()} title="Alterar foto">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFotoChange} />
            {foto && <button type="button" className="modal-foto-remove" onClick={() => setFoto(null)}>{t('mu_remover_foto')}</button>}
          </div>

          <div className="modal-grid-2">
            <div className="form-field">
              <label>{t('mu_nome')}</label>
              <input type="text" value={form.nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João Silva" />
            </div>
            <div className="form-field">
              <label>{t('mu_email')}</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="joao@email.com" />
            </div>
          </div>

          <div className="modal-grid-2">
            <div className="form-field">
              <label>{t('mu_usuario')}</label>
              <input type="text" value={form.usuario} onChange={e => set('usuario', e.target.value)} placeholder="nome de usuário" autoFocus />
            </div>
            <div className="form-field">
              <label>{t('mu_perfil')}</label>
              <CustomSelect value={form.perfil} onChange={v => set('perfil', v)} options={PERFIS} />
            </div>
          </div>

          <div className="form-field">
            <label>{isEdit ? t('mu_nova_senha') : t('mu_senha')}</label>
            <input type="password" value={form.senha} onChange={e => set('senha', e.target.value)} placeholder="••••••" />
          </div>

          <div className="form-field form-field-row">
            <label>{t('mu_status')}</label>
            <Toggle checked={ativo} onChange={setAtivo} labelOn={t('status_ativo')} labelOff={t('status_inativo')} />
          </div>

          {erro && <p className="form-erro">{erro}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>{t('btn_cancelar')}</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? t('mu_salvando') : t('btn_salvar')}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Página principal ─────────────────────────────────────────────────────────── */
export default function Usuarios() {
  const { t } = useT();
  const [usuarios, setUsuarios] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [modal,    setModal]    = useState(null);
  const [busca,    setBusca]    = useState('');
  const [pagina,   setPagina]   = useState(1);

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
    if (!window.confirm(t('gu_excluir'))) return;
    await fetch(`${API_URL}/api/starvl-users/${id}`, { method: 'DELETE' });
    setUsuarios(prev => prev.filter(u => u.id !== id));
  }

  const filtrados = usuarios.filter(u => {
    const q = busca.toLowerCase();
    return u.usuario.toLowerCase().includes(q) || (u.nome || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });
  const totalPages  = Math.max(1, Math.ceil(filtrados.length / PER_PAGE));
  const paginaAtual = Math.min(pagina, totalPages);
  const slice = filtrados.slice((paginaAtual - 1) * PER_PAGE, paginaAtual * PER_PAGE);

  const totalAtivos   = usuarios.filter(u => u.ativo !== false).length;
  const totalInativos = usuarios.filter(u => u.ativo === false).length;

  return (
    <main className="dashboard">
      <div className="gu-header">
        <h2 className="gu-title">{t('gu_title')}</h2>
        <div className="gu-header-right">
          <div className="gu-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder={t('gu_busca')} value={busca} autoComplete="off"
              onChange={e => { setBusca(e.target.value); setPagina(1); }} />
          </div>
          <button className="btn-primary" onClick={() => setModal('novo')}>{t('gu_add')}</button>
        </div>
      </div>

      <div className="gu-kpis">
        <div className="gu-kpi">
          <div className="gu-kpi-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div><p className="gu-kpi-label">{t('gu_total')}</p><p className="gu-kpi-value">{usuarios.length}</p></div>
        </div>
        <div className="gu-kpi">
          <div className="gu-kpi-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div><p className="gu-kpi-label">{t('gu_ativos')}</p><p className="gu-kpi-value">{totalAtivos}</p></div>
        </div>
        <div className="gu-kpi">
          <div className="gu-kpi-icon" style={{ background: '#FFF1F2', color: '#DC2626' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <div><p className="gu-kpi-label">{t('gu_inativos')}</p><p className="gu-kpi-value">{totalInativos}</p></div>
        </div>
      </div>

      <div className="param-group">
        <div className="param-table-wrap">
          {loading ? <p className="rank-empty">{t('carregando')}</p> : (
            <table className="param-table">
              <thead>
                <tr>
                  <th style={{ width: 52 }}></th>
                  <th>{t('th_nome_usuario')}</th>
                  <th>{t('th_email')}</th>
                  <th>{t('th_perfil')}</th>
                  <th>{t('th_status')}</th>
                  <th style={{ textAlign: 'right' }}>{t('th_acoes')}</th>
                </tr>
              </thead>
              <tbody>
                {slice.length === 0
                  ? <tr><td colSpan={6} className="rank-empty">{t('gu_nenhum')}</td></tr>
                  : slice.map(u => (
                    <tr key={u.id}>
                      <td><Avatar name={u.usuario} foto={u.foto} /></td>
                      <td>
                        <p className="gu-username">{u.nome || u.usuario}</p>
                        {u.nome && <p className="gu-subtext">@{u.usuario}</p>}
                      </td>
                      <td className="gu-subtext">{u.email || '—'}</td>
                      <td><span className={`badge badge-${u.perfil}`}>{u.perfil}</span></td>
                      <td><span className={`badge ${u.ativo !== false ? 'badge-ativo' : 'badge-inativo'}`}>{u.ativo !== false ? t('status_ativo') : t('status_inativo')}</span></td>
                      <td className="td-actions">
                        <button className="icon-btn" title={t('mu_editar')} onClick={() => setModal(u)}>
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

        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPagina(1)} disabled={paginaAtual === 1}>«</button>
            <button className="page-btn" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={paginaAtual === 1}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} className={`page-btn${n === paginaAtual ? ' active' : ''}`} onClick={() => setPagina(n)}>{n}</button>
            ))}
            <button className="page-btn" onClick={() => setPagina(p => Math.min(totalPages, p + 1))} disabled={paginaAtual === totalPages}>›</button>
            <button className="page-btn" onClick={() => setPagina(totalPages)} disabled={paginaAtual === totalPages}>»</button>
          </div>
        )}
      </div>

      {modal && (
        <Portal>
          <ModalUsuario usuario={modal === 'novo' ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />
        </Portal>
      )}
    </main>
  );
}
