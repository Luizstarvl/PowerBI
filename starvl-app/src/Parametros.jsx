import React, { useState, useEffect, useRef } from 'react';
import Portal from './Portal';
import { useT } from './i18n';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

function fmtDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('pt-BR');
}

/* ── Modal Empresa (criar ou editar) ─────────────────────────────────────────── */
function ModalEmpresa({ empresa, onSave, onClose }) {
  const { t }    = useT();
  const editando = !!empresa;
  const fileRef  = useRef(null);
  const [logo, setLogo]   = useState(empresa?.logo || null);
  const [form, setForm]   = useState({
    nome:          empresa?.nome          || '',
    codigoEmpresa: empresa?.codigoEmpresa || '',
    cnpj:          empresa?.cnpj          || '',
    ie:            empresa?.ie            || '',
    endereco:      empresa?.endereco      || '',
    contato:       empresa?.contato       || '',
    responsavel:   empresa?.responsavel   || '',
  });
  const [erro, setErro]       = useState('');
  const [loading, setLoading] = useState(false);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form.nome.trim()) return setErro(t('me_obrig_nome'));
    if (!editando && !form.codigoEmpresa) return setErro(t('me_obrig_cod'));
    setErro(''); setLoading(true);
    try {
      const payload = {
        nome:        form.nome.trim(),
        logo:        logo || null,
        cnpj:        form.cnpj.trim()        || undefined,
        ie:          form.ie.trim()          || undefined,
        endereco:    form.endereco.trim()    || undefined,
        contato:     form.contato.trim()     || undefined,
        responsavel: form.responsavel.trim() || undefined,
      };
      const res = editando
        ? await fetch(`${API_URL}/api/clients/${empresa.codigoEmpresa}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch(`${API_URL}/api/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, codigoEmpresa: parseInt(form.codigoEmpresa) }),
          });
      const data = await res.json();
      if (!res.ok) return setErro(data.error || t('me_erro'));
      onSave(data);
    } catch { setErro(t('me_erro_conexao')); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--empresa" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{editando ? t('mu_editar') : t('me_titulo')}</h3>
        <div className="modal-body modal-body--empresa">

          {/* Drop zone de logo */}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
          <div className={`emp-logo-zone${logo ? ' emp-logo-zone--filled' : ''}`} onClick={() => fileRef.current?.click()}>
            {logo ? (
              <>
                <img className="emp-logo-preview-img" src={logo} alt="logo" />
                <div className="emp-logo-overlay">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span>Alterar imagem</span>
                </div>
              </>
            ) : (
              <div className="emp-logo-empty">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
                <p className="emp-logo-empty-title">{t('me_logo')}</p>
                <p className="emp-logo-empty-sub">PNG, JPG, SVG — clique para enviar</p>
              </div>
            )}
          </div>
          {logo && (
            <button type="button" className="emp-logo-remove-btn" onClick={e => { e.stopPropagation(); setLogo(null); }}>
              {t('me_remover_logo')}
            </button>
          )}

          {/* Identificação */}
          <div className="emp-sec-title">Identificação</div>
          <div className="modal-grid-2">
            <div className="form-field">
              <label>{t('me_nome')}</label>
              <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Posto Central" autoFocus autoComplete="off" />
            </div>
            <div className="form-field">
              <label>{t('me_codigo')}</label>
              <input type="number" value={form.codigoEmpresa} onChange={e => set('codigoEmpresa', e.target.value)} placeholder="Ex: 7432" disabled={editando} style={editando ? { opacity: .45 } : undefined} />
            </div>
          </div>
          <div className="modal-grid-2">
            <div className="form-field">
              <label>{t('me_cnpj')}</label>
              <input type="text" value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" autoComplete="off" />
            </div>
            <div className="form-field">
              <label>{t('me_ie')}</label>
              <input type="text" value={form.ie} onChange={e => set('ie', e.target.value)} placeholder="000.000.000.000" autoComplete="off" />
            </div>
          </div>

          {/* Localização & Contato */}
          <div className="emp-sec-title">Localização &amp; Contato</div>
          <div className="form-field">
            <label>{t('me_endereco')}</label>
            <input type="text" value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, bairro, cidade — UF" autoComplete="off" />
          </div>
          <div className="modal-grid-2">
            <div className="form-field">
              <label>{t('me_contato')}</label>
              <input type="text" value={form.contato} onChange={e => set('contato', e.target.value)} placeholder="(00) 00000-0000" autoComplete="off" />
            </div>
            <div className="form-field">
              <label>{t('me_responsavel')}</label>
              <input type="text" value={form.responsavel} onChange={e => set('responsavel', e.target.value)} placeholder="Nome do responsável" autoComplete="off" />
            </div>
          </div>

          {erro && <p className="form-erro">{erro}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>{t('btn_cancelar')}</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? t('carregando') : t('btn_salvar')}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal Configurar Conexão ────────────────────────────────────────────────── */
function ModalConexao({ empresa, onSave, onClose }) {
  const { t } = useT();
  const [form, setForm] = useState({
    banco:  empresa.banco || '',
    host:   '',
    port:   '',
    dbUser: '',
    dbPass: '',
  });
  const [erro, setErro]     = useState('');
  const [loading, setLoading] = useState(false);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  async function handleSave() {
    if (!form.banco.trim()) return setErro(t('con2_obrig_banco'));
    setErro(''); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/clients/${empresa.codigoEmpresa}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banco:  form.banco.trim(),
          host:   form.host.trim()   || undefined,
          port:   form.port          || undefined,
          dbUser: form.dbUser.trim() || undefined,
          dbPass: form.dbPass        || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setErro(data.error || t('me_erro'));
      onSave(data);
    } catch { setErro(t('me_erro_conexao')); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{t('con2_modal_titulo')}</h3>
        <div className="modal-body">
          <div className="con2-empresa-hint">
            <span className="con2-empresa-nome">{empresa.nome}</span>
            <span className="con2-empresa-cod">#{empresa.codigoEmpresa}</span>
          </div>
          <div className="form-field">
            <label>{t('me_banco')}</label>
            <input type="text" value={form.banco} onChange={e => set('banco', e.target.value)} placeholder="Ex: ret_meavenida" autoFocus autoComplete="off" />
          </div>
          <div className="modal-section-label">{t('me_opcional')}</div>
          <div className="modal-grid-2">
            <div className="form-field">
              <label>{t('me_host')}</label>
              <input type="text" value={form.host} onChange={e => set('host', e.target.value)} placeholder="db.servidor.com" autoComplete="off" />
            </div>
            <div className="form-field">
              <label>{t('me_porta')}</label>
              <input type="number" value={form.port} onChange={e => set('port', e.target.value)} placeholder="5432" />
            </div>
            <div className="form-field">
              <label>{t('me_usuario_db')}</label>
              <input type="text" value={form.dbUser} onChange={e => set('dbUser', e.target.value)} placeholder="postgres" autoComplete="off" />
            </div>
            <div className="form-field">
              <label>{t('me_senha_db')}</label>
              <input type="password" value={form.dbPass} onChange={e => set('dbPass', e.target.value)} placeholder="••••••" autoComplete="new-password" />
            </div>
          </div>
          {erro && <p className="form-erro">{erro}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>{t('btn_cancelar')}</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? t('con2_testando') : t('btn_salvar')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Seção Empresas ──────────────────────────────────────────────────────────── */
function SecaoEmpresas() {
  const { t } = useT();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [nova, setNova]         = useState(false);
  const [editando, setEditando] = useState(null);
  const [ctxMenu, setCtxMenu]   = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/clients`)
      .then(r => r.json())
      .then(d => setClientes(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSaveNova(saved) { setClientes(p => [...p, saved]); setNova(false); }
  function handleSaveEdit(updated) {
    setClientes(p => p.map(c => c.codigoEmpresa === updated.codigoEmpresa ? { ...c, ...updated } : c));
    setEditando(null);
  }

  async function handleDelete(cod) {
    if (!window.confirm(t('emp_remover'))) return;
    const res = await fetch(`${API_URL}/api/clients/${cod}`, { method: 'DELETE' });
    if (res.ok) setClientes(p => p.filter(c => c.codigoEmpresa !== cod));
  }

  function openCtx(e, empresa) { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, empresa }); }

  return (
    <div className="fade-up">
      <div className="param-section-header">
        <div>
          <h3 className="param-section-title">{t('emp_titulo')}</h3>
          <p className="param-section-desc">{t('emp_desc')}</p>
        </div>
        <button className="btn-primary" onClick={() => setNova(true)}>{t('emp_adicionar')}</button>
      </div>

      <div className="param-card" onContextMenu={e => openCtx(e, null)}>
        <div className="param-table-wrap">
          {loading ? <p className="rank-empty">{t('carregando')}</p> : (
            <table className="param-table">
              <thead>
                <tr>
                  <th>{t('th_empresa')}</th>
                  <th>{t('th_codigo')}</th>
                  <th>{t('th_cadastrado')}</th>
                  <th style={{ textAlign: 'right' }}>{t('th_acoes')}</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0
                  ? <tr><td colSpan={4} className="rank-empty">{t('emp_nenhuma')}</td></tr>
                  : clientes.map(c => (
                    <tr key={c.id} className="tr-ctx" onContextMenu={e => { e.stopPropagation(); openCtx(e, c); }}>
                      <td className="gu-username">{c.nome}</td>
                      <td className="td-id">{c.codigoEmpresa}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(c.criado)}</td>
                      <td className="td-actions">
                        <button className="icon-btn danger" title={t('emp_remover')} onClick={() => handleDelete(c.codigoEmpresa)}>
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
      </div>

      {nova     && <Portal><ModalEmpresa onSave={handleSaveNova} onClose={() => setNova(false)} /></Portal>}
      {editando && <Portal><ModalEmpresa empresa={editando} onSave={handleSaveEdit} onClose={() => setEditando(null)} /></Portal>}
      {ctxMenu  && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          empresa={ctxMenu.empresa}
          onClose={() => setCtxMenu(null)}
          onIncluir={() => setNova(true)}
          onEditar={() => setEditando(ctxMenu.empresa)}
          onExcluir={() => handleDelete(ctxMenu.empresa?.codigoEmpresa)}
        />
      )}
    </div>
  );
}

/* ── Menu de contexto (right-click) ─────────────────────────────────────────── */
function ContextMenu({ x, y, empresa, onIncluir, onEditar, onExcluir, onClose }) {
  const { t }  = useT();
  const ref    = useRef(null);

  // Corrige posição se ultrapassar a borda da janela
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.right  > window.innerWidth)  el.style.left = `${x - rect.width}px`;
    if (rect.bottom > window.innerHeight) el.style.top  = `${y - rect.height}px`;
  }, [x, y]);

  // Fecha ao clicar fora ou pressionar Esc
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

  return (
    <Portal>
      <div ref={ref} className="ctx-menu" style={{ position: 'fixed', left: x, top: y }}>
        <button className="ctx-item" onClick={() => { onIncluir(); onClose(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t('ctx_incluir')}
        </button>
        {empresa && (
          <>
            <button className="ctx-item" onClick={() => { onEditar(); onClose(); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {t('ctx_editar')}
            </button>
            <div className="ctx-divider" />
            <button className="ctx-item danger" onClick={() => { onExcluir(); onClose(); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
              </svg>
              {t('ctx_excluir')}
            </button>
          </>
        )}
      </div>
    </Portal>
  );
}

/* ── Modal Nova Conexão (empresa + banco em um único fluxo) ──────────────────── */
function ModalNovaConexao({ onSave, onClose }) {
  const { t } = useT();
  const [form, setForm] = useState({ nome: '', codigoEmpresa: '', banco: '', host: '', port: '', dbUser: '', dbPass: '' });
  const [erro, setErro]     = useState('');
  const [loading, setLoading] = useState(false);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  async function handleSave() {
    if (!form.nome.trim())    return setErro(t('me_obrig_nome'));
    if (!form.codigoEmpresa)  return setErro(t('me_obrig_cod'));
    if (!form.banco.trim())   return setErro(t('con2_obrig_banco'));
    setErro(''); setLoading(true);
    try {
      // 1. Cria a empresa
      const r1 = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: form.nome.trim(), codigoEmpresa: parseInt(form.codigoEmpresa) }),
      });
      const d1 = await r1.json();
      if (!r1.ok) { setErro(d1.error || t('me_erro')); return; }

      // 2. Configura a conexão
      const r2 = await fetch(`${API_URL}/api/clients/${d1.codigoEmpresa}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banco:  form.banco.trim(),
          host:   form.host.trim()   || undefined,
          port:   form.port          || undefined,
          dbUser: form.dbUser.trim() || undefined,
          dbPass: form.dbPass        || undefined,
        }),
      });
      const d2 = await r2.json();
      if (!r2.ok) { setErro(d2.error || t('me_erro')); return; }

      onSave(d2);
    } catch { setErro(t('me_erro_conexao')); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{t('con2_modal_titulo')}</h3>
        <div className="modal-body">
          <div className="modal-grid-2">
            <div className="form-field">
              <label>{t('me_nome')}</label>
              <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Posto Central" autoFocus autoComplete="off" />
            </div>
            <div className="form-field">
              <label>{t('me_codigo')}</label>
              <input type="number" value={form.codigoEmpresa} onChange={e => set('codigoEmpresa', e.target.value)} placeholder="Ex: 7432" />
            </div>
          </div>
          <div className="modal-section-label">{t('th_banco')}</div>
          <div className="form-field">
            <label>{t('me_banco')}</label>
            <input type="text" value={form.banco} onChange={e => set('banco', e.target.value)} placeholder="Ex: ret_meavenida" autoComplete="off" />
          </div>
          <div className="modal-section-label">{t('me_opcional')}</div>
          <div className="modal-grid-2">
            <div className="form-field">
              <label>{t('me_host')}</label>
              <input type="text" value={form.host} onChange={e => set('host', e.target.value)} placeholder="db.servidor.com" autoComplete="off" />
            </div>
            <div className="form-field">
              <label>{t('me_porta')}</label>
              <input type="number" value={form.port} onChange={e => set('port', e.target.value)} placeholder="5432" />
            </div>
            <div className="form-field">
              <label>{t('me_usuario_db')}</label>
              <input type="text" value={form.dbUser} onChange={e => set('dbUser', e.target.value)} placeholder="postgres" autoComplete="off" />
            </div>
            <div className="form-field">
              <label>{t('me_senha_db')}</label>
              <input type="password" value={form.dbPass} onChange={e => set('dbPass', e.target.value)} placeholder="••••••" autoComplete="new-password" />
            </div>
          </div>
          {erro && <p className="form-erro">{erro}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>{t('btn_cancelar')}</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? t('con2_testando') : t('btn_salvar')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Seção Conexão ───────────────────────────────────────────────────────────── */
function SecaoConexao() {
  const { t } = useT();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [config, setConfig]     = useState(null);   // empresa sendo editada
  const [nova, setNova]         = useState(false);   // modal de nova conexão
  const [ctxMenu, setCtxMenu]   = useState(null);    // { x, y, empresa }

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/clients`)
      .then(r => r.json())
      .then(d => setClientes(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(updated) {
    setClientes(p => p.map(c => c.codigoEmpresa === updated.codigoEmpresa ? { ...c, ...updated } : c));
    setConfig(null);
  }

  function handleNovaSalva(item) {
    setClientes(p => [...p, item]);
    setNova(false);
  }

  async function handleDelete(cod) {
    if (!window.confirm(t('emp_remover'))) return;
    const res = await fetch(`${API_URL}/api/clients/${cod}`, { method: 'DELETE' });
    if (res.ok) setClientes(p => p.filter(c => c.codigoEmpresa !== cod));
  }

  function openCtx(e, empresa) {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, empresa });
  }

  return (
    <div className="fade-up">
      <div className="param-section-header">
        <div>
          <h3 className="param-section-title">{t('con2_titulo')}</h3>
          <p className="param-section-desc">{t('con2_desc')}</p>
        </div>
        <button className="btn-primary" onClick={() => setNova(true)}>{t('con2_adicionar')}</button>
      </div>

      <div className="param-card" onContextMenu={e => openCtx(e, null)}>
        <div className="param-table-wrap">
          {loading ? <p className="rank-empty">{t('carregando')}</p> : (
            <table className="param-table">
              <thead>
                <tr>
                  <th>{t('th_empresa')}</th>
                  <th>{t('th_codigo')}</th>
                  <th>{t('th_banco')}</th>
                  <th>{t('th_conexao')}</th>
                  <th style={{ textAlign: 'right' }}>{t('th_acoes')}</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0
                  ? <tr><td colSpan={5} className="rank-empty">{t('emp_nenhuma')}</td></tr>
                  : clientes.map(c => (
                    <tr key={c.id} className="tr-ctx" onContextMenu={e => { e.stopPropagation(); openCtx(e, c); }}>
                      <td className="gu-username">{c.nome}</td>
                      <td className="td-id">{c.codigoEmpresa}</td>
                      <td>
                        {c.banco
                          ? <code className="db-name">{c.banco}</code>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      <td>
                        {c.isConfigured
                          ? <span className={`badge ${c.hasCustomHost ? 'badge-admin' : 'badge-user'}`}>
                              {c.hasCustomHost ? t('con_personalizada') : t('con_padrao')}
                            </span>
                          : <span className="badge badge-warn">{t('con2_nao_config')}</span>}
                      </td>
                      <td className="td-actions">
                        <button className="btn-outline-sm" onClick={() => setConfig(c)}>
                          {t('con2_configurar')}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {nova && (
        <Portal>
          <ModalNovaConexao onSave={handleNovaSalva} onClose={() => setNova(false)} />
        </Portal>
      )}
      {config && (
        <Portal>
          <ModalConexao empresa={config} onSave={handleSaved} onClose={() => setConfig(null)} />
        </Portal>
      )}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          empresa={ctxMenu.empresa}
          onClose={() => setCtxMenu(null)}
          onIncluir={() => setNova(true)}
          onEditar={() => setConfig(ctxMenu.empresa)}
          onExcluir={() => handleDelete(ctxMenu.empresa?.codigoEmpresa)}
        />
      )}
    </div>
  );
}

/* ── SVG Bandeiras ───────────────────────────────────────────────────────────── */
function FlagBR() {
  return (
    <svg width="38" height="26" viewBox="0 0 38 26" style={{ borderRadius: 5, flexShrink: 0, display: 'block' }}>
      <rect width="38" height="26" fill="#009B3A" rx="5"/>
      <polygon points="19,3.5 34.5,13 19,22.5 3.5,13" fill="#FEDF00"/>
      <circle cx="19" cy="13" r="6.5" fill="#002776"/>
      <path d="M12.8,11 Q19,9.2 25.2,11.5" stroke="white" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
    </svg>
  );
}
function FlagUS() {
  return (
    <svg width="38" height="26" viewBox="0 0 38 26" style={{ borderRadius: 5, flexShrink: 0, display: 'block' }}>
      <rect width="38" height="26" fill="#B22234" rx="5"/>
      <rect y="2"  width="38" height="2" fill="white"/>
      <rect y="6"  width="38" height="2" fill="white"/>
      <rect y="10" width="38" height="2" fill="white"/>
      <rect y="14" width="38" height="2" fill="white"/>
      <rect y="18" width="38" height="2" fill="white"/>
      <rect y="22" width="38" height="2" fill="white"/>
      <rect width="16" height="14" fill="#3C3B6E"/>
      {[0,1,2,3,4].map(r => [0,1,2,3,4,5].slice(0,r%2===0?6:5).map((c,i) => (
        <circle key={`${r}${i}`} cx={c*2.5+(r%2===0?1:2.25)} cy={r*2.4+1.4} r="0.55" fill="white"/>
      )))}
    </svg>
  );
}
function FlagES() {
  return (
    <svg width="38" height="26" viewBox="0 0 38 26" style={{ borderRadius: 5, flexShrink: 0, display: 'block' }}>
      <rect width="38" height="26" fill="#AA151B" rx="5"/>
      <rect y="6.5" width="38" height="13" fill="#F1BF00"/>
    </svg>
  );
}

/* ── Accordion ───────────────────────────────────────────────────────────────── */
function Accordion({ title, desc, children, badge }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`accordion${open ? ' accordion-open' : ''}`}>
      <button className="accordion-trigger" onClick={() => setOpen(o => !o)}>
        <div className="accordion-trigger-info">
          <div className="accordion-title-row">
            <p className="accordion-title">{title}</p>
            {badge && <span className="accordion-badge">{badge}</span>}
          </div>
          <p className="accordion-desc">{desc}</p>
        </div>
        <svg className="accordion-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div className="accordion-body">
        <div className="accordion-inner">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Seletor de Timezone ─────────────────────────────────────────────────────── */
const TZ_GRUPOS = [
  { tk: 'tz_brasil', zones: [
    { key: 'America/Rio_Branco', label: 'Acre',                    offset: 'UTC−5' },
    { key: 'America/Manaus',     label: 'Manaus / Amazonas',       offset: 'UTC−4' },
    { key: 'America/Sao_Paulo',  label: 'Brasília / São Paulo',    offset: 'UTC−3' },
    { key: 'America/Noronha',    label: 'Fernando de Noronha',     offset: 'UTC−2' },
  ]},
  { tk: 'tz_americas', zones: [
    { key: 'America/Los_Angeles',  label: 'Los Angeles / Vancouver',     offset: 'UTC−8' },
    { key: 'America/Denver',       label: 'Denver / Phoenix',            offset: 'UTC−7' },
    { key: 'America/Chicago',      label: 'Chicago / Cidade do México',  offset: 'UTC−6' },
    { key: 'America/New_York',     label: 'New York / Miami',            offset: 'UTC−5' },
    { key: 'America/Santiago',     label: 'Santiago',                    offset: 'UTC−4' },
    { key: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires',      offset: 'UTC−3' },
  ]},
  { tk: 'tz_europa', zones: [
    { key: 'UTC',              label: 'UTC / Reykjavik',            offset: 'UTC+0'    },
    { key: 'Europe/London',    label: 'Londres',                    offset: 'UTC±0/+1' },
    { key: 'Europe/Paris',     label: 'Paris / Berlim / Roma',      offset: 'UTC+1/+2' },
    { key: 'Europe/Athens',    label: 'Atenas / Cairo / Helsinki',  offset: 'UTC+2/+3' },
    { key: 'Europe/Moscow',    label: 'Moscou',                     offset: 'UTC+3'    },
  ]},
  { tk: 'tz_asia', zones: [
    { key: 'Asia/Dubai',       label: 'Dubai / Abu Dhabi',               offset: 'UTC+4'    },
    { key: 'Asia/Kolkata',     label: 'Mumbai / Nova Delhi',             offset: 'UTC+5:30' },
    { key: 'Asia/Bangkok',     label: 'Bangcoc / Jacarta',               offset: 'UTC+7'    },
    { key: 'Asia/Singapore',   label: 'Cingapura / Hong Kong / Pequim',  offset: 'UTC+8'    },
    { key: 'Asia/Tokyo',       label: 'Tóquio / Seul',                  offset: 'UTC+9'    },
    { key: 'Australia/Sydney', label: 'Sydney / Melbourne',              offset: 'UTC+10/+11'},
    { key: 'Pacific/Auckland', label: 'Auckland',                        offset: 'UTC+12/+13'},
  ]},
];

function TzSelector() {
  const { t } = useT();
  const [tz, setTz]       = useState(() => localStorage.getItem('pbi_tz') || 'America/Sao_Paulo');
  const [busca, setBusca] = useState('');
  const searchRef = useRef(null);

  const q = busca.toLowerCase();
  const gruposFiltrados = TZ_GRUPOS
    .map(g => ({ ...g, zones: g.zones.filter(z => z.label.toLowerCase().includes(q) || z.offset.toLowerCase().includes(q) || z.key.toLowerCase().includes(q)) }))
    .filter(g => g.zones.length > 0);

  function handleSelect(key) {
    setTz(key);
    localStorage.setItem('pbi_tz', key);
  }

  const tzAtual = TZ_GRUPOS.flatMap(g => g.zones).find(z => z.key === tz);

  return (
    <>
      {tzAtual && (
        <div className="tz-current">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>{tzAtual.label}</span>
          <span className="tz-offset">{tzAtual.offset}</span>
        </div>
      )}

      <div className="tz-search-wrap">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={searchRef}
          type="text"
          className="tz-search"
          placeholder={t('tz_busca')}
          value={busca}
          autoComplete="off"
          onChange={e => setBusca(e.target.value)}
        />
        {busca && <button className="tz-search-clear" onClick={() => setBusca('')}>×</button>}
      </div>

      <div className="tz-list">
        {gruposFiltrados.map(g => (
          <div key={g.tk}>
            <p className="tz-group-label">{t(g.tk)}</p>
            {g.zones.map(z => (
              <button
                key={z.key}
                className={`tz-option${tz === z.key ? ' selected' : ''}`}
                onClick={() => handleSelect(z.key)}
              >
                <span className="tz-option-label">{z.label}</span>
                <span className="tz-option-offset">{z.offset}</span>
                {tz === z.key && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        ))}
        {gruposFiltrados.length === 0 && (
          <p className="rank-empty" style={{ padding: '20px 0' }}>—</p>
        )}
      </div>
    </>
  );
}

/* ── Modal confirmação de idioma ─────────────────────────────────────────────── */
function ConfirmLang({ idioma, onConfirm, onCancel }) {
  const { t } = useT();
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{t('lang_confirm_titulo')}</h3>
        <div className="modal-body">
          <div className="lang-confirm-preview">
            <idioma.Flag />
            <p className="lang-confirm-text">{t('lang_confirm_msg', idioma.nome)}</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onCancel}>{t('btn_cancelar')}</button>
          <button className="btn-primary" onClick={onConfirm}>{t('lang_confirm_aplicar')}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Atualização dos Dados ───────────────────────────────────────────────────── */
const INTERVALOS = [
  { value: 5  * 60 * 1000,       label: '5 min'   },
  { value: 10 * 60 * 1000,       label: '10 min'  },
  { value: 30 * 60 * 1000,       label: '30 min'  },
  { value: 60 * 60 * 1000,       label: '1 hora'  },
  { value: 6  * 60 * 60 * 1000,  label: '6 horas' },
  { value: 24 * 60 * 60 * 1000,  label: 'Diário'  },
];

function AutoRefreshConfig({ enabled, intervalMs, onEnabledChange, onIntervalChange }) {
  const { t } = useT();
  const [lastUpdate, setLastUpdate] = useState(() => {
    const s = localStorage.getItem('pbi_last_update');
    return s ? new Date(parseInt(s)) : null;
  });

  function doRefresh() {
    const now = new Date();
    setLastUpdate(now);
    localStorage.setItem('pbi_last_update', String(now.getTime()));
    window.dispatchEvent(new CustomEvent('pbi-refresh'));
  }

  function handleToggle() {
    const next = !enabled;
    localStorage.setItem('pbi_auto_refresh', String(next));
    onEnabledChange(next);
  }

  function handleInterval(v) {
    localStorage.setItem('pbi_refresh_interval', String(v));
    onIntervalChange(v);
  }

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      const now = new Date();
      setLastUpdate(now);
      localStorage.setItem('pbi_last_update', String(now.getTime()));
      window.dispatchEvent(new CustomEvent('pbi-refresh'));
    }, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs]);

  function fmtDateTime(date) {
    if (!date) return t('atu_nunca');
    const today = new Date();
    const opts  = { hour: '2-digit', minute: '2-digit' };
    if (date.toDateString() === today.toDateString())
      return `Hoje às ${date.toLocaleTimeString('pt-BR', opts)}`;
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  const nextUpdate = enabled && lastUpdate ? new Date(lastUpdate.getTime() + intervalMs) : null;

  return (
    <div className="atu-config">
      <div className="atu-row">
        <div className="atu-row-info">
          <span className="atu-row-label">{t('atu_auto')}</span>
          <span className="atu-row-desc">{t('atu_auto_desc')}</span>
        </div>
        <div className={`toggle-track${enabled ? ' on' : ''}`} onClick={handleToggle}>
          <div className="toggle-thumb" />
        </div>
      </div>

      {enabled && (
        <div className="atu-row">
          <div className="atu-row-info">
            <span className="atu-row-label">{t('atu_intervalo')}</span>
          </div>
          <div className="atu-intervals">
            {INTERVALOS.map(opt => (
              <button
                key={opt.value}
                className={`atu-interval-btn${intervalMs === opt.value ? ' active' : ''}`}
                onClick={() => handleInterval(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="atu-info-row">
        <div className="atu-info-item">
          <span className="atu-info-label">{t('atu_ultima')}</span>
          <span className="atu-info-value">{fmtDateTime(lastUpdate)}</span>
        </div>
        {nextUpdate && (
          <div className="atu-info-item">
            <span className="atu-info-label">{t('atu_proxima')}</span>
            <span className="atu-info-value">{fmtDateTime(nextUpdate)}</span>
          </div>
        )}
        <button className="btn-outline-sm atu-btn-now" onClick={doRefresh}>
          ↻ {t('atu_agora')}
        </button>
      </div>
    </div>
  );
}

/* ── Seção Sistema ───────────────────────────────────────────────────────────── */
const IDIOMAS = [
  { key: 'pt-BR', Flag: FlagBR, nome: 'Português', regiao: 'Brasil',        tag: 'PT' },
  { key: 'en',    Flag: FlagUS, nome: 'English',   regiao: 'United States', tag: 'EN' },
  { key: 'es',    Flag: FlagES, nome: 'Español',   regiao: 'España',        tag: 'ES' },
];

function SecaoSistema() {
  const { lang, t, applyLang } = useT();
  const [pendingLang, setPendingLang] = useState(null);
  const [atuEnabled, setAtuEnabled]   = useState(() => localStorage.getItem('pbi_auto_refresh') === 'true');
  const [atuInterval, setAtuInterval] = useState(() =>
    parseInt(localStorage.getItem('pbi_refresh_interval') || String(5 * 60 * 1000))
  );

  const idiomaAtual = IDIOMAS.find(l => l.key === lang);
  const tzAtual     = TZ_GRUPOS.flatMap(g => g.zones).find(z => z.key === (localStorage.getItem('pbi_tz') || 'America/Sao_Paulo'));
  const atuBadge    = atuEnabled ? (INTERVALOS.find(o => o.value === atuInterval)?.label) : undefined;

  function handleSelect(idioma) {
    if (idioma.key === lang) return;
    setPendingLang(idioma);
  }

  function handleConfirm() {
    applyLang(pendingLang.key);
    setPendingLang(null);
  }

  return (
    <div className="fade-up">
      <div className="param-section-header">
        <div>
          <h3 className="param-section-title">{t('sis_titulo')}</h3>
          <p className="param-section-desc">{t('sis_desc')}</p>
        </div>
      </div>

      <Accordion
        title={t('lang_titulo')}
        desc={t('lang_desc')}
        badge={idiomaAtual ? idiomaAtual.tag : undefined}
      >
        <div className="lang-list">
          {IDIOMAS.map(l => {
            const sel = lang === l.key;
            return (
              <button key={l.key} className={`lang-row${sel ? ' selected' : ''}`} onClick={() => handleSelect(l)}>
                <l.Flag />
                <div className="lang-row-info">
                  <span className="lang-row-nome">{l.nome}</span>
                  <span className="lang-row-regiao">{l.regiao}</span>
                </div>
                <span className="lang-row-tag">{l.tag}</span>
                <div className={`lang-radio${sel ? ' checked' : ''}`}>
                  {sel && <div className="lang-radio-dot" />}
                </div>
              </button>
            );
          })}
        </div>
      </Accordion>

      <Accordion
        title={t('tz_titulo')}
        desc={t('tz_desc')}
        badge={tzAtual ? tzAtual.offset : undefined}
      >
        <TzSelector />
      </Accordion>

      <Accordion
        title={t('atu_titulo')}
        desc={t('atu_desc')}
        badge={atuBadge}
      >
        <AutoRefreshConfig
          enabled={atuEnabled}
          intervalMs={atuInterval}
          onEnabledChange={setAtuEnabled}
          onIntervalChange={setAtuInterval}
        />
      </Accordion>

      {pendingLang && (
        <Portal>
          <ConfirmLang idioma={pendingLang} onConfirm={handleConfirm} onCancel={() => setPendingLang(null)} />
        </Portal>
      )}
    </div>
  );
}

/* ── Sub-nav ─────────────────────────────────────────────────────────────────── */
export default function Parametros() {
  const { t } = useT();
  const [sub, setSub] = useState('empresas');

  const SUB_PAGES = [
    { key: 'empresas', tk: 'param_empresas_menu' },
    { key: 'sistema',  tk: 'param_sistema_menu'  },
    { key: 'conexao',  tk: 'param_conexao_menu'  },
  ];

  return (
    <div className="param-layout">
      <aside className="param-subnav">
        <p className="param-subnav-label">{t('param_config')}</p>
        {SUB_PAGES.map(p => (
          <button key={p.key}
            className={`param-subnav-item${sub === p.key ? ' active' : ''}`}
            onClick={() => setSub(p.key)}
          >{t(p.tk)}</button>
        ))}
      </aside>

      <div className="param-content">
        <div className="param-content-header">
          <h2 className="param-content-title">{t('param_titulo')}</h2>
          <p className="param-content-desc">{t('param_desc')}</p>
        </div>
        {sub === 'empresas' && <SecaoEmpresas />}
        {sub === 'conexao'  && <SecaoConexao />}
        {sub === 'sistema'  && <SecaoSistema />}
      </div>
    </div>
  );
}
