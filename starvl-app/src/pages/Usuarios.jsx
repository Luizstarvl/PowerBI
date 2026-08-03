import React, { useState, useEffect, useRef } from 'react';
import Portal from '../Portal';
import { useT } from '../i18n';
import { AVATAR_COLORS } from '../theme/tokens';
import { apiFetch } from '../api';

const PER_PAGE = 8;

/* ── CustomSelect ─────────────────────────────────────────────────────────── */
// options: string[] | { value, label }[]
function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const items = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  const selected = items.find(i => i.value === value);

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
        <span style={!selected && placeholder ? { color: 'var(--color-text-muted)' } : {}}>
          {selected ? selected.label : (placeholder || '—')}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="csel-dropdown">
          {items.map(item => (
            <button key={item.value} type="button"
              className={`csel-option${value === item.value ? ' selected' : ''}`}
              onClick={() => { onChange(item.value); setOpen(false); }}
            >{item.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Toggle ───────────────────────────────────────────────────────────────── */
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

/* ── Context Menu Usuários ────────────────────────────────────────────────── */
function CtxMenuUsuario({ x, y, usuario, onClose, onIncluir, onAlterar, onToggleAtivo }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.right  > window.innerWidth)  el.style.left = `${x - rect.width}px`;
    if (rect.bottom > window.innerHeight) el.style.top  = `${y - rect.height}px`;
  }, [x, y]);

  useEffect(() => {
    const onDown = e => { if (!ref.current?.contains(e.target)) onClose(); };
    const onKey  = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown',   onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown',   onKey);
    };
  }, [onClose]);

  const ativo = usuario?.ativo !== false;

  return (
    <Portal>
      <div ref={ref} className="ctx-menu" style={{ position: 'fixed', left: x, top: y }}>
        <button className="ctx-item" onClick={() => { onIncluir(); onClose(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Incluir
        </button>
        {usuario && (
          <>
            <button className="ctx-item" onClick={() => { onAlterar(); onClose(); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Alterar
            </button>
            <div className="ctx-divider" />
            <button className={`ctx-item${ativo ? ' danger' : ''}`} onClick={() => { onToggleAtivo(); onClose(); }}>
              {ativo
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              }
              {ativo ? 'Inativar' : 'Ativar'}
            </button>
          </>
        )}
      </div>
    </Portal>
  );
}

/* ── Avatar ───────────────────────────────────────────────────────────────── */
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

/* ── SVG Icons ────────────────────────────────────────────────────────────── */
function IconEdit() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}
function IconX() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

/* ── ModalPerfil ──────────────────────────────────────────────────────────── */
const DASH_MODULOS = [
  { key: 'fluxo_caixa',    label: 'Fluxo de Caixa'   },
  { key: 'contas_receber', label: 'Contas a Receber'  },
  { key: 'despesas',       label: 'Despesas'          },
  { key: 'estoque',        label: 'Estoque'           },
];

function ModalPerfil({ perfil, onSave, onClose }) {
  const { t } = useT();
  const [nome,    setNome]    = useState(perfil?.nome      || '');
  const [desc,    setDesc]    = useState(perfil?.descricao || '');
  const [perm,    setPerm]    = useState(() => ({
    dashboards:    'todos',
    configuracoes: false,
    postos:        'todos',
    modo:          'completo',
    ...(perfil?.permissoes || {}),
  }));
  const [erro,    setErro]    = useState('');
  const [loading, setLoading] = useState(false);

  function setP(key, val) { setPerm(p => ({ ...p, [key]: val })); }

  const todosDash = perm.dashboards === 'todos';

  function handleDashModulo(key, checked) {
    const allKeys = DASH_MODULOS.map(m => m.key);
    if (todosDash) {
      const next = checked ? allKeys : allKeys.filter(k => k !== key);
      setP('dashboards', next.length === allKeys.length ? 'todos' : next);
    } else {
      const current = Array.isArray(perm.dashboards) ? perm.dashboards : [];
      const next = checked ? [...new Set([...current, key])] : current.filter(k => k !== key);
      setP('dashboards', next.length === allKeys.length ? 'todos' : next);
    }
  }

  function isDashChecked(key) {
    if (todosDash) return true;
    return Array.isArray(perm.dashboards) && perm.dashboards.includes(key);
  }

  async function handleSave() {
    if (!nome.trim()) return setErro(t('pf_nome') + ' é obrigatório.');
    setErro(''); setLoading(true);
    try {
      const url    = perfil ? `/api/profiles/${perfil.id}` : `/api/profiles`;
      const method = perfil ? 'PUT' : 'POST';
      const res    = await apiFetch(url, {
        method,
        body: JSON.stringify({ nome: nome.trim(), descricao: desc.trim() || null, permissoes: perm }),
      });
      const data = await res.json();
      if (!res.ok) return setErro(data.error || t('me_erro'));
      onSave(data);
    } catch { setErro(t('mu_erro_conexao')); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <h3 className="modal-title">{perfil ? t('pf_editar') : t('pf_novo')}</h3>
        <div className="modal-body">
          <div className="modal-grid-2">
            <div className="form-field" style={{ gridColumn: '1/-1' }}>
              <label>{t('pf_nome')}</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Supervisor" />
            </div>
            <div className="form-field" style={{ gridColumn: '1/-1' }}>
              <label>{t('pf_descricao')}</label>
              <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descreva as permissões deste perfil" />
            </div>
          </div>

          <div className="pf-perm-section">
            <p className="pf-perm-title">Dashboards</p>
            <div className="pf-perm-group">
              <label className="pf-check-row">
                <input type="checkbox" checked={todosDash}
                  onChange={e => setP('dashboards', e.target.checked ? 'todos' : [])} />
                <span>{t('pf_todos_dash')}</span>
              </label>
              {DASH_MODULOS.map(m => (
                <label key={m.key} className="pf-check-row pf-check-indent">
                  <input type="checkbox" checked={isDashChecked(m.key)}
                    onChange={e => handleDashModulo(m.key, e.target.checked)} />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pf-perm-section">
            <p className="pf-perm-title">Sistema</p>
            <div className="pf-perm-group">
              <label className="pf-check-row">
                <input type="checkbox" checked={!!perm.configuracoes}
                  onChange={e => setP('configuracoes', e.target.checked)} />
                <span>{t('pf_configuracoes')}</span>
              </label>
            </div>
          </div>

          <div className="pf-perm-section">
            <p className="pf-perm-title">Postos</p>
            <div className="pf-perm-group">
              {[['todos', t('pf_todos_postos')], ['proprios', t('pf_postos_proprios')]].map(([v, l]) => (
                <label key={v} className="pf-check-row">
                  <input type="radio" name="pf-postos" checked={perm.postos === v}
                    onChange={() => setP('postos', v)} />
                  <span>{l}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pf-perm-section">
            <p className="pf-perm-title">Modo de Acesso</p>
            <div className="pf-perm-group">
              {[['completo', t('pf_completo')], ['consulta', t('pf_consulta')]].map(([v, l]) => (
                <label key={v} className="pf-check-row">
                  <input type="radio" name="pf-modo" checked={perm.modo === v}
                    onChange={() => setP('modo', v)} />
                  <span>{l}</span>
                </label>
              ))}
            </div>
          </div>

          {erro && <p className="form-erro">{erro}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>{t('btn_cancelar')}</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? t('mu_salvando') : t('btn_salvar')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal Alerta ─────────────────────────────────────────────────────────── */
function ModalAlerta({ titulo, mensagem, onClose }) {
  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 0' }}>
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'var(--color-error-light)', color: 'var(--color-error)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </span>
          <h3 className="modal-title" style={{ padding: 0 }}>{titulo}</h3>
        </div>
        <div className="modal-body" style={{ paddingTop: 14 }}>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>{mensagem}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>Entendido</button>
        </div>
      </div>
    </div>
  );
}

/* ── Context Menu Perfis ──────────────────────────────────────────────────── */
function CtxMenuPerfil({ x, y, perfil, onClose, onIncluir, onAlterar, onExcluir }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.right  > window.innerWidth)  el.style.left = `${x - rect.width}px`;
    if (rect.bottom > window.innerHeight) el.style.top  = `${y - rect.height}px`;
  }, [x, y]);

  useEffect(() => {
    const onDown = e => { if (!ref.current?.contains(e.target)) onClose(); };
    const onKey  = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown',   onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown',   onKey);
    };
  }, [onClose]);

  const isBuiltin = perfil?.builtin;

  return (
    <Portal>
      <div ref={ref} className="ctx-menu" style={{ position: 'fixed', left: x, top: y }}>
        <button className="ctx-item" onClick={() => { onIncluir(); onClose(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Incluir
        </button>
        {perfil && (
          <>
            <button className="ctx-item" onClick={() => { onAlterar(); onClose(); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Alterar
            </button>
            <div className="ctx-divider" />
            <button
              className="ctx-item danger"
              disabled={isBuiltin}
              style={isBuiltin ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
              onClick={() => { if (!isBuiltin) { onExcluir(); onClose(); } }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
              </svg>
              {isBuiltin ? 'Excluir (padrão)' : 'Excluir'}
            </button>
          </>
        )}
      </div>
    </Portal>
  );
}

/* ── SecaoPerfis ──────────────────────────────────────────────────────────── */
function permTags(perm) {
  const tags = [];
  if (perm.dashboards === 'todos') tags.push('Todos dashboards');
  else if (Array.isArray(perm.dashboards) && perm.dashboards.length > 0) {
    const labels = { fluxo_caixa: 'Fluxo', contas_receber: 'Receber', despesas: 'Despesas', estoque: 'Estoque' };
    tags.push(...perm.dashboards.map(k => labels[k] || k));
  }
  if (perm.configuracoes) tags.push('Configurações');
  tags.push(perm.postos === 'todos' ? 'Todos postos' : 'Postos próprios');
  if (perm.modo === 'consulta') tags.push('Somente consulta');
  return tags;
}

function SecaoPerfis({ profiles, onProfilesChange, usuarios }) {
  const { t } = useT();
  const [modal,     setModal]     = useState(null);
  const [ctxPerfil, setCtxPerfil] = useState(null);
  const [alertMsg,  setAlertMsg]  = useState(null);

  function openCtxPerfil(e, pf) {
    e.preventDefault();
    e.stopPropagation();
    setCtxPerfil({ x: e.clientX, y: e.clientY, perfil: pf });
  }

  function handleSave(saved) {
    onProfilesChange(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
    setModal(null);
  }

  async function handleDelete(pf) {
    const vinculados = (usuarios || []).filter(u => u.profileId === pf.id);
    if (vinculados.length > 0) {
      setAlertMsg(
        `Não é possível excluir este perfil de acesso, pois existem usuários vinculados a ele. Remova ou altere esses vínculos antes de realizar a exclusão.`
      );
      return;
    }
    if (!window.confirm(t('pf_excluir'))) return;
    try {
      const res  = await apiFetch(`/api/profiles/${pf.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) return setAlertMsg(data.error || t('me_erro'));
      onProfilesChange(prev => prev.filter(p => p.id !== pf.id));
    } catch { setAlertMsg(t('mu_erro_conexao')); }
  }

  return (
    <div className="fade-up">
      <div className="gu-header">
        <div>
          <h2 className="gu-title">{t('pf_titulo')}</h2>
          <p className="gu-subtitle">{t('pf_subtitulo')}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('novo')}>{t('pf_add')}</button>
      </div>

      <div className="param-group" onContextMenu={e => openCtxPerfil(e, null)}>
        <div className="param-table-wrap">
          <table className="param-table">
            <thead>
              <tr>
                <th>Perfil</th>
                <th>{t('pf_permissoes')}</th>
                <th style={{ textAlign: 'right' }}>{t('th_acoes')}</th>
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0
                ? <tr><td colSpan={3} className="rank-empty">{t('pf_nenhum')}</td></tr>
                : profiles.map(pf => (
                  <tr key={pf.id} className="tr-ctx" onContextMenu={e => { e.stopPropagation(); openCtxPerfil(e, pf); }}>
                    <td>
                      <p className="gu-username">{pf.nome}</p>
                      {pf.descricao && <p className="gu-subtext">{pf.descricao}</p>}
                      {pf.builtin && (
                        <span className="badge badge-admin" style={{ marginTop: 6, display: 'inline-flex' }}>
                          {t('pf_padrao')}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="pf-badges">
                        {permTags(pf.permissoes).map(tag => (
                          <span key={tag} className="pf-badge">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="td-actions">
                      <button className="icon-btn" title={t('mu_editar')} onClick={() => setModal(pf)}>
                        <IconEdit />
                      </button>
                      <button className="icon-btn danger" title="Excluir"
                        disabled={pf.builtin}
                        style={{ opacity: pf.builtin ? 0.3 : 1, cursor: pf.builtin ? 'not-allowed' : 'pointer' }}
                        onClick={() => !pf.builtin && handleDelete(pf)}
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {ctxPerfil && (
        <CtxMenuPerfil
          x={ctxPerfil.x} y={ctxPerfil.y}
          perfil={ctxPerfil.perfil}
          onClose={() => setCtxPerfil(null)}
          onIncluir={() => setModal('novo')}
          onAlterar={() => setModal(ctxPerfil.perfil)}
          onExcluir={() => handleDelete(ctxPerfil.perfil)}
        />
      )}

      {alertMsg && (
        <Portal>
          <ModalAlerta
            titulo="Exclusão não permitida"
            mensagem={alertMsg}
            onClose={() => setAlertMsg(null)}
          />
        </Portal>
      )}

      {modal && (
        <Portal>
          <ModalPerfil
            perfil={modal === 'novo' ? null : modal}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        </Portal>
      )}
    </div>
  );
}

/* ── ModalUsuario ─────────────────────────────────────────────────────────── */
function ModalUsuario({ usuario, onSave, onClose, profiles, clients }) {
  const { t } = useT();
  const fileRef = useRef(null);
  const isEdit  = !!usuario;

  const [form, setForm] = useState({
    usuario:       usuario?.usuario       || '',
    senha:         '',
    perfil:        usuario?.perfil        || 'user',
    nome:          usuario?.nome          || '',
    email:         usuario?.email         || '',
    cargo:         usuario?.cargo         || '',
    empresaAcesso: usuario?.empresaAcesso || '',
    profileId:     usuario?.profileId     ? String(usuario.profileId) : '',
  });
  const [ativo,   setAtivo]   = useState(usuario ? usuario.ativo !== false : true);
  const [foto,    setFoto]    = useState(usuario?.foto || null);
  const [erro,    setErro]    = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

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
      const body = {
        usuario:       form.usuario.trim(),
        perfil:        form.perfil,
        nome:          form.nome.trim()  || null,
        email:         form.email.trim() || null,
        cargo:         form.cargo.trim() || null,
        empresaAcesso: form.empresaAcesso || null,
        profileId:     form.profileId ? parseInt(form.profileId) : null,
        ativo,
        foto,
      };
      if (form.senha.trim()) body.senha = form.senha;
      const url  = isEdit ? `/api/starvl-users/${usuario.id}` : `/api/starvl-users`;
      const res  = await apiFetch(url, { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) return setErro(data.error || t('me_erro'));
      onSave(data);
    } catch { setErro(t('mu_erro_conexao')); }
    finally { setLoading(false); }
  }

  const companyOptions = [
    { value: '', label: t('mu_todos_postos') },
    ...clients.map(c => ({ value: c.nome, label: c.nome })),
  ];
  const profileOptions = [
    { value: '', label: t('pf_sem_perfil') },
    ...profiles.map(p => ({ value: String(p.id), label: p.nome })),
  ];
  const avatarColor = AVATAR_COLORS[(form.usuario?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-lg">
        <h3 className="modal-title">{isEdit ? t('mu_editar') : t('mu_novo')}</h3>
        <div className="modal-body">
          {/* Avatar upload */}
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

          {/* Row 1: nome + email */}
          <div className="modal-grid-2">
            <div className="form-field">
              <label>{t('mu_nome')}</label>
              <input type="text" value={form.nome}
                onChange={e => set('nome', e.target.value.replace(/\b\w/g, c => c.toUpperCase()))}
                placeholder="Ex: João Silva" />
            </div>
            <div className="form-field">
              <label>{t('mu_email')}</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="joao@email.com" />
            </div>
          </div>

          {/* Row 2: usuario + senha */}
          <div className="modal-grid-2">
            <div className="form-field">
              <label>{t('mu_usuario')}</label>
              <input type="text" value={form.usuario} onChange={e => set('usuario', e.target.value)} placeholder="nome.usuario" autoComplete="off" />
            </div>
            <div className="form-field">
              <label>{isEdit ? t('mu_nova_senha') : t('mu_senha')}</label>
              <input type="password" value={form.senha} onChange={e => set('senha', e.target.value)} placeholder="••••••" autoComplete="new-password" />
            </div>
          </div>

          {/* Row 3: cargo + empresa */}
          <div className="modal-grid-2">
            <div className="form-field">
              <label>{t('mu_cargo')}</label>
              <input type="text" value={form.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ex: Supervisor de Posto" />
            </div>
            <div className="form-field">
              <label>{t('mu_empresa_acesso')}</label>
              <CustomSelect
                value={form.empresaAcesso}
                onChange={v => set('empresaAcesso', v)}
                options={companyOptions}
                placeholder={t('mu_todos_postos')}
              />
            </div>
          </div>

          {/* Row 4: perfil de acesso + perfil de sistema */}
          <div className="modal-grid-2">
            <div className="form-field">
              <label>{t('mu_perfil_acesso')}</label>
              <CustomSelect
                value={form.profileId}
                onChange={v => set('profileId', v)}
                options={profileOptions}
                placeholder={t('pf_sem_perfil')}
              />
            </div>
            <div className="form-field">
              <label>{t('mu_perfil')}</label>
              <CustomSelect
                value={form.perfil}
                onChange={v => set('perfil', v)}
                options={[
                  { value: 'admin', label: 'Administrador (sistema)' },
                  { value: 'user',  label: 'Usuário padrão' },
                ]}
              />
            </div>
          </div>

          {/* Status toggle */}
          <div className="form-field form-field-row">
            <label>{t('mu_status')}</label>
            <Toggle checked={ativo} onChange={setAtivo} labelOn={t('status_ativo')} labelOff={t('status_inativo')} />
          </div>

          {erro && <p className="form-erro">{erro}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>{t('btn_cancelar')}</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? t('mu_salvando') : t('btn_salvar')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Acesso negado ────────────────────────────────────────────────────────── */
function AccessDenied() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Acesso Negado</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
        Você não tem permissão para acessar esta área.
      </p>
    </div>
  );
}

/* ── Página principal ─────────────────────────────────────────────────────── */
export default function Usuarios({ user }) {
  const { t } = useT();
  const [tab,      setTab]      = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [clients,  setClients]  = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [modal,    setModal]    = useState(null);
  const [busca,    setBusca]    = useState('');
  const [pagina,   setPagina]   = useState(1);
  const [ctxUser,  setCtxUser]  = useState(null);
  const [resolvingRequestId, setResolvingRequestId] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch('/api/starvl-users').then(r => r.json()).catch(() => []),
      apiFetch('/api/profiles').then(r => r.json()).catch(() => []),
      apiFetch('/api/clients').then(r => r.json()).catch(() => []),
      apiFetch('/api/password-resets?status=pendente').then(r => r.json()).catch(() => []),
    ]).then(([users, profs, cls, resets]) => {
      if (Array.isArray(users))  setUsuarios(users);
      if (Array.isArray(profs))  setProfiles(profs);
      if (Array.isArray(cls))    setClients(cls);
      if (Array.isArray(resets)) setResetRequests(resets);
    }).finally(() => setLoading(false));
  }, []);

  function handleSaveUser(saved) {
    setUsuarios(prev => {
      const idx = prev.findIndex(u => u.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
    setModal(null);
    if (resolvingRequestId) {
      handleResolveRequest(resolvingRequestId);
      setResolvingRequestId(null);
    }
  }

  function openResetUser(req) {
    const u = usuarios.find(x => x.id === req.userId);
    if (!u) return;
    setResolvingRequestId(req.id);
    setModal(u);
  }

  async function handleResolveRequest(id) {
    setResetRequests(prev => prev.filter(r => r.id !== id));
    await apiFetch(`/api/password-resets/${id}/resolver`, { method: 'PATCH' }).catch(() => {});
  }

  function openCtxUser(e, usuario) {
    e.preventDefault();
    e.stopPropagation();
    setCtxUser({ x: e.clientX, y: e.clientY, usuario });
  }

  async function handleToggleAtivo(u) {
    const next = u.ativo === false;
    const res = await apiFetch(`/api/starvl-users/${u.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        usuario: u.usuario, perfil: u.perfil, foto: u.foto,
        nome: u.nome, email: u.email, ativo: next,
        cargo: u.cargo, empresaAcesso: u.empresaAcesso, profileId: u.profileId,
      }),
    });
    if (res.ok) { const saved = await res.json(); handleSaveUser(saved); }
  }

  async function handleDeleteUser(id) {
    if (!window.confirm(t('gu_excluir'))) return;
    await apiFetch(`/api/starvl-users/${id}`, { method: 'DELETE' });
    setUsuarios(prev => prev.filter(u => u.id !== id));
  }

  function profileName(profileId) {
    if (!profileId) return null;
    return profiles.find(p => p.id === profileId)?.nome || null;
  }

  const filtrados   = usuarios.filter(u => {
    const q = busca.toLowerCase();
    return !q || [u.usuario, u.nome, u.email, u.cargo].some(v => v?.toLowerCase().includes(q));
  });
  const totalPages  = Math.max(1, Math.ceil(filtrados.length / PER_PAGE));
  const paginaAtual = Math.min(pagina, totalPages);
  const slice       = filtrados.slice((paginaAtual - 1) * PER_PAGE, paginaAtual * PER_PAGE);
  const totalAtivos   = usuarios.filter(u => u.ativo !== false).length;
  const totalInativos = usuarios.filter(u => u.ativo === false).length;

  if (user?.perfil !== 'admin') return <AccessDenied />;

  return (
    <main className="dashboard">
      {/* ── Tab Navigation ─────────────────────────────────────────────── */}
      <div className="usr-tabnav">
        <button className={`usr-tab${tab === 'usuarios' ? ' active' : ''}`} onClick={() => setTab('usuarios')}>
          {t('usr_tab_usuarios')}
        </button>
        <button className={`usr-tab${tab === 'perfis' ? ' active' : ''}`} onClick={() => setTab('perfis')}>
          {t('usr_tab_perfis')}
        </button>
        <button className={`usr-tab${tab === 'redefinicoes' ? ' active' : ''}`} onClick={() => setTab('redefinicoes')}>
          Redefinições de Senha
          {resetRequests.length > 0 && <span className="usr-tab-badge">{resetRequests.length}</span>}
        </button>
      </div>

      {/* ── Perfis de Acesso ───────────────────────────────────────────── */}
      {tab === 'perfis' && (
        <SecaoPerfis profiles={profiles} onProfilesChange={setProfiles} usuarios={usuarios} />
      )}

      {/* ── Redefinições de Senha ──────────────────────────────────────── */}
      {tab === 'redefinicoes' && (
        <div className="fade-up">
          <div className="gu-header">
            <div>
              <h2 className="gu-title">Redefinições de Senha</h2>
              <p className="gu-subtitle">Usuários que solicitaram redefinição de senha pela tela de login.</p>
            </div>
          </div>

          <div className="param-group">
            <div className="param-table-wrap">
              {resetRequests.length === 0 ? (
                <p className="rank-empty">Nenhuma solicitação pendente. Tudo em dia!</p>
              ) : (
                <table className="param-table">
                  <thead>
                    <tr>
                      <th style={{ width: 52 }}></th>
                      <th>{t('th_nome_usuario')}</th>
                      <th>{t('th_email')}</th>
                      <th>Solicitado em</th>
                      <th style={{ textAlign: 'right' }}>{t('th_acoes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resetRequests.map(req => (
                      <tr key={req.id}>
                        <td><Avatar name={req.nome || req.usuario} foto={req.foto} /></td>
                        <td>
                          <p className="gu-username">{req.nome || req.usuario}</p>
                          {req.nome && <p className="gu-subtext">@{req.usuario}</p>}
                        </td>
                        <td className="gu-subtext">{req.email || '—'}</td>
                        <td className="gu-subtext">{new Date(req.criadoEm).toLocaleString('pt-BR')}</td>
                        <td className="td-actions">
                          {req.userId && (
                            <button className="btn-primary btn-sm" onClick={() => openResetUser(req)}>
                              Redefinir agora
                            </button>
                          )}
                          <button className="icon-btn" title="Dispensar" onClick={() => handleResolveRequest(req.id)}>
                            <IconX />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Usuários ───────────────────────────────────────────────────── */}
      {tab === 'usuarios' && (
        <div className="fade-up">
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
              <div className="gu-kpi-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div><p className="gu-kpi-label">{t('gu_total')}</p><p className="gu-kpi-value">{usuarios.length}</p></div>
            </div>
            <div className="gu-kpi">
              <div className="gu-kpi-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div><p className="gu-kpi-label">{t('gu_ativos')}</p><p className="gu-kpi-value">{totalAtivos}</p></div>
            </div>
            <div className="gu-kpi">
              <div className="gu-kpi-icon" style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
              </div>
              <div><p className="gu-kpi-label">{t('gu_inativos')}</p><p className="gu-kpi-value">{totalInativos}</p></div>
            </div>
          </div>

          <div className="param-group" onContextMenu={e => openCtxUser(e, null)}>
            <div className="param-table-wrap">
              {loading ? <p className="rank-empty">{t('carregando')}</p> : (
                <table className="param-table">
                  <thead>
                    <tr>
                      <th style={{ width: 52 }}></th>
                      <th>{t('th_nome_usuario')}</th>
                      <th>{t('mu_perfil_acesso')}</th>
                      <th>{t('th_email')}</th>
                      <th>{t('th_status')}</th>
                      <th style={{ textAlign: 'right' }}>{t('th_acoes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slice.length === 0
                      ? <tr><td colSpan={6} className="rank-empty">{t('gu_nenhum')}</td></tr>
                      : slice.map(u => {
                          const pname = profileName(u.profileId);
                          return (
                            <tr key={u.id} className="tr-ctx" onContextMenu={e => { e.stopPropagation(); openCtxUser(e, u); }}>
                              <td><Avatar name={u.nome || u.usuario} foto={u.foto} /></td>
                              <td>
                                <p className="gu-username">{u.nome || u.usuario}</p>
                                {u.nome && <p className="gu-subtext">@{u.usuario}</p>}
                                {u.cargo && <p className="gu-cargo">{u.cargo}</p>}
                              </td>
                              <td>
                                {pname
                                  ? <span className="badge badge-admin">{pname}</span>
                                  : <span className="badge badge-warn">{u.perfil}</span>
                                }
                                {u.empresaAcesso && (
                                  <p className="gu-subtext" style={{ marginTop: 3 }}>{u.empresaAcesso}</p>
                                )}
                              </td>
                              <td className="gu-subtext">{u.email || '—'}</td>
                              <td>
                                <span className={`badge ${u.ativo !== false ? 'badge-ativo' : 'badge-inativo'}`}>
                                  {u.ativo !== false ? t('status_ativo') : t('status_inativo')}
                                </span>
                              </td>
                              <td className="td-actions">
                                <button className="icon-btn" title={t('mu_editar')} onClick={() => setModal(u)}>
                                  <IconEdit />
                                </button>
                                <button className="icon-btn danger" title="Excluir" onClick={() => handleDeleteUser(u.id)}>
                                  <IconTrash />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    }
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
        </div>
      )}

      {ctxUser && (
        <CtxMenuUsuario
          x={ctxUser.x} y={ctxUser.y}
          usuario={ctxUser.usuario}
          onClose={() => setCtxUser(null)}
          onIncluir={() => setModal('novo')}
          onAlterar={() => setModal(ctxUser.usuario)}
          onToggleAtivo={() => handleToggleAtivo(ctxUser.usuario)}
        />
      )}

      {modal && (
        <Portal>
          <ModalUsuario
            usuario={modal === 'novo' ? null : modal}
            onSave={handleSaveUser}
            onClose={() => { setModal(null); setResolvingRequestId(null); }}
            profiles={profiles}
            clients={clients}
          />
        </Portal>
      )}
    </main>
  );
}
