import React, { useState, useEffect, useRef } from 'react';
import Portal from './Portal';
import { useT } from './i18n';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

function fmtDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('pt-BR');
}

/* ── Modal Empresa ───────────────────────────────────────────────────────────── */
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
        nome: form.nome.trim(), logo: logo || null,
        cnpj: form.cnpj.trim() || undefined, ie: form.ie.trim() || undefined,
        endereco: form.endereco.trim() || undefined, contato: form.contato.trim() || undefined,
        responsavel: form.responsavel.trim() || undefined,
      };
      const res = editando
        ? await fetch(`${API_URL}/api/clients/${empresa.codigoEmpresa}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch(`${API_URL}/api/clients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, codigoEmpresa: parseInt(form.codigoEmpresa) }) });
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
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
          <div className={`emp-logo-zone${logo ? ' emp-logo-zone--filled' : ''}`} onClick={() => fileRef.current?.click()}>
            {logo ? (
              <>
                <img className="emp-logo-preview-img" src={logo} alt="logo" />
                <div className="emp-logo-overlay">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
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
          {logo && <button type="button" className="emp-logo-remove-btn" onClick={e => { e.stopPropagation(); setLogo(null); }}>{t('me_remover_logo')}</button>}

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

/* ── Custom Select ───────────────────────────────────────────────────────────── */
function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey  = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown',   onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown',   onKey);
    };
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="cselect">
      <button
        type="button"
        className={`cselect-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="cselect-value">{selected?.label || ''}</span>
        <svg
          className={`cselect-chevron${open ? ' open' : ''}`}
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="cselect-menu">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              className={`cselect-item${o.value === value ? ' selected' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Modal Conexão ───────────────────────────────────────────────────────────── */
/* ── Tipos de banco ──────────────────────────────────────────────────────────── */
const DB_TIPOS = [
  { value: 'postgresql', label: 'PostgreSQL', porta: 5432 },
  { value: 'sqlserver',  label: 'SQL Server', porta: 1433 },
  { value: 'mysql',      label: 'MySQL',      porta: 3306 },
  { value: 'mariadb',    label: 'MariaDB',    porta: 3306 },
  { value: 'oracle',     label: 'Oracle DB',  porta: 1521 },
];

/* ── Badge de status ─────────────────────────────────────────────────────────── */
function ConexaoStatus({ status, erro }) {
  const MAP = {
    ok:      { label: 'Conectado', dot: '#22C55E', bg: 'rgba(34,197,94,.1)',  text: '#16A34A' },
    error:   { label: 'Erro',      dot: '#EF4444', bg: 'rgba(239,68,68,.1)', text: '#DC2626' },
    pending: { label: 'Pendente',  dot: '#94A3B8', bg: 'rgba(148,163,184,.1)', text: '#64748B' },
  };
  const s = MAP[status] || MAP.pending;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
        background: s.bg, color: s.text, width: 'fit-content',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
        {s.label}
      </span>
      {status === 'error' && erro && (
        <span style={{ fontSize: 11, color: 'var(--red)', maxWidth: 260, lineHeight: 1.4, paddingLeft: 2 }}>{erro}</span>
      )}
    </div>
  );
}

/* ── Modal Conexão (criar / editar) ─────────────────────────────────────────── */
function ModalConexaoForm({ conexao, onSave, onClose }) {
  const TIPO_DEFAULT = DB_TIPOS[0];
  const [form, setForm] = useState({
    nome:     conexao?.nome     || '',
    tipo:     conexao?.tipo     || TIPO_DEFAULT.value,
    servidor: conexao?.servidor || '',
    porta:    conexao?.porta    || TIPO_DEFAULT.porta,
    banco:    conexao?.banco    || '',
    usuario:  conexao?.usuario  || '',
    senha:    '',
    timeout:  conexao?.timeout  || 30,
  });
  const [erro,       setErro]       = useState('');
  const [loading,    setLoading]    = useState(false);
  const [testing,    setTesting]    = useState(false);
  const [testResult, setTestResult] = useState(null);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); setTestResult(null); }

  function handleTipoChange(v) {
    const t = DB_TIPOS.find(d => d.value === v);
    setForm(p => ({ ...p, tipo: v, porta: t?.porta || p.porta }));
    setTestResult(null);
  }

  async function handleTest() {
    if (!form.servidor.trim() || !form.banco.trim()) {
      setErro('Preencha Servidor e Banco para testar.');
      return;
    }
    setErro(''); setTesting(true); setTestResult(null);
    try {
      const res  = await fetch(`${API_URL}/api/connections/test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setTestResult(data);
    } catch { setTestResult({ status: 'error', erro: 'Erro ao comunicar com o servidor.' }); }
    finally { setTesting(false); }
  }

  async function handleSave() {
    if (!form.nome.trim())     return setErro('Nome é obrigatório.');
    if (!form.servidor.trim()) return setErro('Servidor é obrigatório.');
    if (!form.banco.trim())    return setErro('Banco é obrigatório.');
    setErro(''); setLoading(true);
    try {
      const url    = conexao ? `${API_URL}/api/connections/${conexao.id}` : `${API_URL}/api/connections`;
      const method = conexao ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) return setErro(data.error || 'Erro ao salvar.');
      onSave(data);
    } catch { setErro('Erro de conexão com o servidor.'); }
    finally { setLoading(false); }
  }


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{conexao ? 'Editar Conexão' : 'Nova Conexão'}</h3>
        <div className="modal-body">

          {/* Nome */}
          <div className="form-field">
            <label>Nome da Conexão</label>
            <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Posto Central - Produção" autoFocus autoComplete="off" />
          </div>

          {/* Tipo + Timeout */}
          <div className="modal-grid-2">
            <div className="form-field">
              <label>Tipo</label>
              <CustomSelect
                value={form.tipo}
                onChange={handleTipoChange}
                options={DB_TIPOS.map(t => ({ value: t.value, label: t.label }))}
              />
            </div>
            <div className="form-field">
              <label>Timeout (segundos)</label>
              <input type="number" min={5} max={120} value={form.timeout}
                onChange={e => set('timeout', parseInt(e.target.value) || 30)} />
            </div>
          </div>

          {/* Servidor + Porta */}
          <div className="modal-section-label">Conexão</div>
          <div className="modal-grid-2" style={{ gridTemplateColumns: '1fr 120px' }}>
            <div className="form-field">
              <label>Servidor</label>
              <input type="text" value={form.servidor} onChange={e => set('servidor', e.target.value)}
                placeholder="db.servidor.com" autoComplete="off" />
            </div>
            <div className="form-field">
              <label>Porta</label>
              <input type="number" value={form.porta} onChange={e => set('porta', parseInt(e.target.value) || '')} />
            </div>
          </div>

          {/* Banco */}
          <div className="form-field">
            <label>Banco de Dados</label>
            <input type="text" value={form.banco} onChange={e => set('banco', e.target.value)}
              placeholder="nome_do_banco" autoComplete="off" />
          </div>

          {/* Usuário + Senha */}
          <div className="modal-section-label">Autenticação</div>
          <div className="modal-grid-2">
            <div className="form-field">
              <label>Usuário</label>
              <input type="text" value={form.usuario} onChange={e => set('usuario', e.target.value)}
                placeholder="postgres" autoComplete="off" />
            </div>
            <div className="form-field">
              <label>{conexao ? 'Senha (deixe vazio para manter)' : 'Senha'}</label>
              <input type="password" value={form.senha} onChange={e => set('senha', e.target.value)}
                placeholder="••••••" autoComplete="new-password" />
            </div>
          </div>

          {/* Resultado do teste */}
          {testResult && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 10,
              background: testResult.status === 'ok' ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)',
              border: `1px solid ${testResult.status === 'ok' ? 'rgba(34,197,94,.25)' : 'rgba(239,68,68,.25)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {testResult.status === 'ok'
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                }
                <span style={{ fontSize: 13, fontWeight: 600, color: testResult.status === 'ok' ? '#16A34A' : '#DC2626' }}>
                  {testResult.status === 'ok'
                    ? `Conexão bem-sucedida${testResult.latencia ? ` — ${testResult.latencia}ms` : ''}`
                    : 'Falha na conexão'}
                </span>
              </div>
              {testResult.status === 'error' && testResult.erro && (
                <p style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 5, paddingLeft: 22, lineHeight: 1.5 }}>{testResult.erro}</p>
              )}
            </div>
          )}

          {erro && <p className="form-erro">{erro}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-outline-sm" style={{ padding: '8px 16px', fontSize: 13 }}
            onClick={handleTest} disabled={testing}>
            {testing
              ? <><span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid var(--blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite', marginRight: 6 }} />Testando...</>
              : '⚡ Testar Conexão'}
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
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
    fetch(`${API_URL}/api/clients`).then(r => r.json()).then(d => setClientes(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function handleSaveNova(saved) { setClientes(p => [...p, saved]); setNova(false); }
  function handleSaveEdit(updated) { setClientes(p => p.map(c => c.codigoEmpresa === updated.codigoEmpresa ? { ...c, ...updated } : c)); setEditando(null); }
  async function handleDelete(cod) {
    if (!window.confirm(t('emp_remover'))) return;
    const res = await fetch(`${API_URL}/api/clients/${cod}`, { method: 'DELETE' });
    if (res.ok) setClientes(p => p.filter(c => c.codigoEmpresa !== cod));
  }
  function openCtx(e, empresa) { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, empresa }); }

  return (
    <div className="fade-up">
      <div className="param-section-header">
        <div><h3 className="param-section-title">{t('emp_titulo')}</h3><p className="param-section-desc">{t('emp_desc')}</p></div>
        <button className="btn-primary" onClick={() => setNova(true)}>{t('emp_adicionar')}</button>
      </div>
      <div className="param-card" onContextMenu={e => openCtx(e, null)}>
        <div className="param-table-wrap">
          {loading ? <p className="rank-empty">{t('carregando')}</p> : (
            <table className="param-table">
              <thead><tr><th>{t('th_empresa')}</th><th>{t('th_codigo')}</th><th>{t('th_cadastrado')}</th><th style={{ textAlign: 'right' }}>{t('th_acoes')}</th></tr></thead>
              <tbody>
                {clientes.length === 0 ? <tr><td colSpan={4} className="rank-empty">{t('emp_nenhuma')}</td></tr>
                : clientes.map(c => (
                  <tr key={c.id} className="tr-ctx" onContextMenu={e => { e.stopPropagation(); openCtx(e, c); }}>
                    <td className="gu-username">{c.nome}</td>
                    <td className="td-id">{c.codigoEmpresa}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(c.criado)}</td>
                    <td className="td-actions">
                      <button className="icon-btn danger" title={t('emp_remover')} onClick={() => handleDelete(c.codigoEmpresa)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
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
      {ctxMenu  && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} empresa={ctxMenu.empresa} onClose={() => setCtxMenu(null)} onIncluir={() => setNova(true)} onEditar={() => setEditando(ctxMenu.empresa)} onExcluir={() => handleDelete(ctxMenu.empresa?.codigoEmpresa)} />}
    </div>
  );
}

/* ── Context Menu ────────────────────────────────────────────────────────────── */
function ContextMenu({ x, y, empresa, onIncluir, onEditar, onExcluir, onClose }) {
  const { t } = useT();
  const ref   = useRef(null);

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
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <Portal>
      <div ref={ref} className="ctx-menu" style={{ position: 'fixed', left: x, top: y }}>
        <button className="ctx-item" onClick={() => { onIncluir(); onClose(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {t('ctx_incluir')}
        </button>
        {empresa && (
          <>
            <button className="ctx-item" onClick={() => { onEditar(); onClose(); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              {t('ctx_editar')}
            </button>
            <div className="ctx-divider" />
            <button className="ctx-item danger" onClick={() => { onExcluir(); onClose(); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              {t('ctx_excluir')}
            </button>
          </>
        )}
      </div>
    </Portal>
  );
}

/* ── Seção Conexão ───────────────────────────────────────────────────────────── */
function SecaoConexao() {
  const [conexoes,  setConexoes]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [modal,     setModal]     = useState(null);   // null | { conexao? }
  const [testando,  setTestando]  = useState(null);   // id em teste
  const [ctxMenu,   setCtxMenu]   = useState(null);

  function load() {
    setLoading(true);
    fetch(`${API_URL}/api/connections`)
      .then(r => r.json())
      .then(d => setConexoes(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handleSaved(saved) {
    setConexoes(p => {
      const idx = p.findIndex(c => c.id === saved.id);
      return idx >= 0 ? p.map(c => c.id === saved.id ? saved : c) : [...p, saved];
    });
    setModal(null);
  }

  async function handleTestar(id) {
    setTestando(id);
    try {
      const res  = await fetch(`${API_URL}/api/connections/${id}/test`, { method: 'POST' });
      const data = await res.json();
      setConexoes(p => p.map(c => c.id === id
        ? { ...c, status: data.status, erro: data.erro || null, ultimoTeste: data.ultimoTeste }
        : c
      ));
    } catch { /* silencia */ }
    finally { setTestando(null); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir esta conexão?')) return;
    const res = await fetch(`${API_URL}/api/connections/${id}`, { method: 'DELETE' });
    if (res.ok) setConexoes(p => p.filter(c => c.id !== id));
  }

  function openCtx(e, cx) { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, cx }); }

  function fmtUltimoTeste(iso) {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
    } catch { return iso; }
  }

  return (
    <div className="fade-up">
      <div className="param-section-header">
        <div>
          <h3 className="param-section-title">Conexões de Banco de Dados</h3>
          <p className="param-section-desc">Configure as fontes de dados que o sistema utiliza para consulta e extração de informações.</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({})}>+ Nova Conexão</button>
      </div>

      <div className="param-card" onContextMenu={e => openCtx(e, null)}>
        <div className="param-table-wrap">
          {loading ? <p className="rank-empty">Carregando...</p> : (
            <table className="param-table">
              <thead>
                <tr>
                  <th style={{ width: 12 }}>Status</th>
                  <th>Nome</th>
                  <th>Tipo / Servidor</th>
                  <th>Banco</th>
                  <th>Último Teste</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {conexoes.length === 0
                  ? <tr><td colSpan={6} className="rank-empty">Nenhuma conexão cadastrada</td></tr>
                  : conexoes.map(c => {
                    const tipoLabel = DB_TIPOS.find(d => d.value === c.tipo)?.label || c.tipo;
                    return (
                      <tr key={c.id} className="tr-ctx" onContextMenu={e => { e.stopPropagation(); openCtx(e, c); }}>
                        <td>
                          <ConexaoStatus status={c.status} erro={c.erro} />
                        </td>
                        <td className="gu-username">{c.nome}</td>
                        <td style={{ color: 'var(--text-sub)', fontSize: 13 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{tipoLabel}</span>
                          <span style={{ color: 'var(--text-muted)' }}> · </span>
                          {c.servidor}:{c.porta}
                        </td>
                        <td><code className="db-name">{c.banco}</code></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmtUltimoTeste(c.ultimoTeste)}</td>
                        <td className="td-actions">
                          <button className="btn-outline-sm" title="Editar"
                            onClick={() => setModal({ conexao: c })}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="btn-outline-sm" title="Testar conexão"
                            disabled={testando === c.id}
                            onClick={() => handleTestar(c.id)}
                            style={{ minWidth: 32 }}>
                            {testando === c.id
                              ? <span style={{ display: 'inline-block', width: 11, height: 11, border: '2px solid var(--blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            }
                          </button>
                          <button className="icon-btn danger" title="Excluir"
                            onClick={() => handleDelete(c.id)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
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
      </div>

      {modal !== null && (
        <Portal>
          <ModalConexaoForm
            conexao={modal.conexao || null}
            onSave={handleSaved}
            onClose={() => setModal(null)}
          />
        </Portal>
      )}

      {ctxMenu && (
        <Portal>
          <ConexaoCtxMenu
            x={ctxMenu.x} y={ctxMenu.y} cx={ctxMenu.cx}
            onClose={() => setCtxMenu(null)}
            onIncluir={() => { setModal({}); setCtxMenu(null); }}
            onEditar={() => { setModal({ conexao: ctxMenu.cx }); setCtxMenu(null); }}
            onTestar={() => { handleTestar(ctxMenu.cx?.id); setCtxMenu(null); }}
            onExcluir={() => { handleDelete(ctxMenu.cx?.id); setCtxMenu(null); }}
          />
        </Portal>
      )}
    </div>
  );
}

/* ── Context Menu Conexão ────────────────────────────────────────────────────── */
function ConexaoCtxMenu({ x, y, cx, onIncluir, onEditar, onTestar, onExcluir, onClose }) {
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
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [onClose]);
  return (
    <div ref={ref} className="ctx-menu" style={{ position: 'fixed', left: x, top: y }}>
      <button className="ctx-item" onClick={onIncluir}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Incluir
      </button>
      {cx && (
        <>
          <button className="ctx-item" onClick={onEditar}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Alterar
          </button>
          <button className="ctx-item" onClick={onTestar}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Testar
          </button>
          <div className="ctx-divider" />
          <button className="ctx-item danger" onClick={onExcluir}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Excluir
          </button>
        </>
      )}
    </div>
  );
}

/* ── Bandeiras ───────────────────────────────────────────────────────────────── */
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
      <rect y="2"  width="38" height="2" fill="white"/><rect y="6"  width="38" height="2" fill="white"/>
      <rect y="10" width="38" height="2" fill="white"/><rect y="14" width="38" height="2" fill="white"/>
      <rect y="18" width="38" height="2" fill="white"/><rect y="22" width="38" height="2" fill="white"/>
      <rect width="16" height="14" fill="#3C3B6E"/>
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
        <div className="accordion-inner">{children}</div>
      </div>
    </div>
  );
}

/* ── Timezone Selector ───────────────────────────────────────────────────────── */
const TZ_GRUPOS = [
  { tk: 'tz_brasil', zones: [
    { key: 'America/Rio_Branco', label: 'Acre',                 offset: 'UTC−5' },
    { key: 'America/Manaus',     label: 'Manaus / Amazonas',    offset: 'UTC−4' },
    { key: 'America/Sao_Paulo',  label: 'Brasília / São Paulo', offset: 'UTC−3' },
    { key: 'America/Noronha',    label: 'Fernando de Noronha',  offset: 'UTC−2' },
  ]},
  { tk: 'tz_americas', zones: [
    { key: 'America/Los_Angeles',                label: 'Los Angeles / Vancouver',    offset: 'UTC−8' },
    { key: 'America/Denver',                     label: 'Denver / Phoenix',           offset: 'UTC−7' },
    { key: 'America/Chicago',                    label: 'Chicago / Cidade do México', offset: 'UTC−6' },
    { key: 'America/New_York',                   label: 'New York / Miami',           offset: 'UTC−5' },
    { key: 'America/Santiago',                   label: 'Santiago',                   offset: 'UTC−4' },
    { key: 'America/Argentina/Buenos_Aires',     label: 'Buenos Aires',               offset: 'UTC−3' },
  ]},
  { tk: 'tz_europa', zones: [
    { key: 'UTC',            label: 'UTC / Reykjavik',           offset: 'UTC+0'    },
    { key: 'Europe/London',  label: 'Londres',                   offset: 'UTC±0/+1' },
    { key: 'Europe/Paris',   label: 'Paris / Berlim / Roma',     offset: 'UTC+1/+2' },
    { key: 'Europe/Athens',  label: 'Atenas / Cairo / Helsinki', offset: 'UTC+2/+3' },
    { key: 'Europe/Moscow',  label: 'Moscou',                    offset: 'UTC+3'    },
  ]},
  { tk: 'tz_asia', zones: [
    { key: 'Asia/Dubai',       label: 'Dubai / Abu Dhabi',              offset: 'UTC+4'     },
    { key: 'Asia/Kolkata',     label: 'Mumbai / Nova Delhi',            offset: 'UTC+5:30'  },
    { key: 'Asia/Bangkok',     label: 'Bangcoc / Jacarta',              offset: 'UTC+7'     },
    { key: 'Asia/Singapore',   label: 'Cingapura / Hong Kong / Pequim', offset: 'UTC+8'     },
    { key: 'Asia/Tokyo',       label: 'Tóquio / Seul',                 offset: 'UTC+9'     },
    { key: 'Australia/Sydney', label: 'Sydney / Melbourne',             offset: 'UTC+10/+11'},
    { key: 'Pacific/Auckland', label: 'Auckland',                       offset: 'UTC+12/+13'},
  ]},
];

function TzSelector() {
  const { t } = useT();
  const [tz, setTz]       = useState(() => localStorage.getItem('pbi_tz') || 'America/Sao_Paulo');
  const [busca, setBusca] = useState('');
  const q = busca.toLowerCase();
  const gruposFiltrados = TZ_GRUPOS
    .map(g => ({ ...g, zones: g.zones.filter(z => z.label.toLowerCase().includes(q) || z.offset.toLowerCase().includes(q) || z.key.toLowerCase().includes(q)) }))
    .filter(g => g.zones.length > 0);
  function handleSelect(key) { setTz(key); localStorage.setItem('pbi_tz', key); }
  const tzAtual = TZ_GRUPOS.flatMap(g => g.zones).find(z => z.key === tz);

  return (
    <>
      {tzAtual && (
        <div className="tz-current">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>{tzAtual.label}</span>
          <span className="tz-offset">{tzAtual.offset}</span>
        </div>
      )}
      <div className="tz-search-wrap">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" className="tz-search" placeholder={t('tz_busca')} value={busca} autoComplete="off" onChange={e => setBusca(e.target.value)} />
        {busca && <button className="tz-search-clear" onClick={() => setBusca('')}>×</button>}
      </div>
      <div className="tz-list">
        {gruposFiltrados.map(g => (
          <div key={g.tk}>
            <p className="tz-group-label">{t(g.tk)}</p>
            {g.zones.map(z => (
              <button key={z.key} className={`tz-option${tz === z.key ? ' selected' : ''}`} onClick={() => handleSelect(z.key)}>
                <span className="tz-option-label">{z.label}</span>
                <span className="tz-option-offset">{z.offset}</span>
                {tz === z.key && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            ))}
          </div>
        ))}
        {gruposFiltrados.length === 0 && <p className="rank-empty" style={{ padding: '20px 0' }}>—</p>}
      </div>
    </>
  );
}

/* ── Modal Confirmação de Idioma ─────────────────────────────────────────────── */
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

/* ── Dados para Regionalização ───────────────────────────────────────────────── */
const IDIOMAS = [
  { key: 'pt-BR', Flag: FlagBR, nome: 'Português', regiao: 'Brasil',        tag: 'PT' },
  { key: 'en',    Flag: FlagUS, nome: 'English',   regiao: 'United States', tag: 'EN' },
  { key: 'es',    Flag: FlagES, nome: 'Español',   regiao: 'España',        tag: 'ES' },
];

const MOEDAS = [
  { value: 'BRL', symbol: 'R$', label: 'Real Brasileiro',  tag: 'BRL', example: 'R$ 1.234,56' },
  { value: 'USD', symbol: '$',  label: 'Dólar Americano',  tag: 'USD', example: '$ 1,234.56'  },
  { value: 'EUR', symbol: '€',  label: 'Euro',             tag: 'EUR', example: '€ 1.234,56'  },
  { value: 'ARS', symbol: '$',  label: 'Peso Argentino',   tag: 'ARS', example: '$ 1.234,56'  },
];

const SEP_OPTIONS = [
  { value: ',', label: 'Vírgula', sub: 'Padrão brasileiro', example: '1.234,56' },
  { value: '.', label: 'Ponto',   sub: 'Padrão americano',  example: '1,234.56' },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/AAAA', example: '31/12/2024', sub: 'Padrão brasileiro' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/AAAA', example: '12/31/2024', sub: 'Padrão americano'  },
  { value: 'YYYY-MM-DD', label: 'AAAA-MM-DD', example: '2024-12-31', sub: 'ISO 8601'          },
];

/* ── Seção Regionalização ────────────────────────────────────────────────────── */
function SecaoRegionalizacao() {
  const { lang, t, applyLang } = useT();
  const [pendingLang, setPendingLang] = useState(null);
  const [moeda,   setMoedaState]   = useState(() => localStorage.getItem('pbi_currency')    || 'BRL');
  const [decSep,  setDecSepState]  = useState(() => localStorage.getItem('pbi_decimal_sep') || ',');
  const [dateFmt, setDateFmtState] = useState(() => localStorage.getItem('pbi_date_fmt')    || 'DD/MM/YYYY');

  function handleMoeda(v)   { setMoedaState(v);   localStorage.setItem('pbi_currency',    v); }
  function handleDecSep(v)  { setDecSepState(v);  localStorage.setItem('pbi_decimal_sep', v); }
  function handleDateFmt(v) { setDateFmtState(v); localStorage.setItem('pbi_date_fmt',    v); }

  const idiomaAtual = IDIOMAS.find(l => l.key === lang);
  const tzAtual     = TZ_GRUPOS.flatMap(g => g.zones).find(z => z.key === (localStorage.getItem('pbi_tz') || 'America/Sao_Paulo'));
  const moedaAtual  = MOEDAS.find(m => m.value === moeda);
  const sepAtual    = SEP_OPTIONS.find(s => s.value === decSep);

  return (
    <div className="fade-up">
      <div className="param-section-header">
        <div>
          <h3 className="param-section-title">{t('reg_titulo')}</h3>
          <p className="param-section-desc">{t('reg_desc')}</p>
        </div>
      </div>

      {/* Idioma */}
      <Accordion title={t('lang_titulo')} desc={t('lang_desc')} badge={idiomaAtual?.tag}>
        <div className="lang-list">
          {IDIOMAS.map(l => {
            const sel = lang === l.key;
            return (
              <button key={l.key} className={`lang-row${sel ? ' selected' : ''}`} onClick={() => l.key !== lang && setPendingLang(l)}>
                <l.Flag />
                <div className="lang-row-info">
                  <span className="lang-row-nome">{l.nome}</span>
                  <span className="lang-row-regiao">{l.regiao}</span>
                </div>
                <span className="lang-row-tag">{l.tag}</span>
                <div className={`lang-radio${sel ? ' checked' : ''}`}>{sel && <div className="lang-radio-dot" />}</div>
              </button>
            );
          })}
        </div>
      </Accordion>

      {/* Moeda */}
      <Accordion title={t('moeda_titulo')} desc={t('moeda_desc')} badge={moedaAtual?.symbol}>
        <div className="lang-list">
          {MOEDAS.map(m => {
            const sel = moeda === m.value;
            return (
              <button key={m.value} className={`lang-row${sel ? ' selected' : ''}`} onClick={() => handleMoeda(m.value)}>
                <span className="reg-symbol">{m.symbol}</span>
                <div className="lang-row-info">
                  <span className="lang-row-nome">{m.label}</span>
                  <span className="lang-row-regiao">{m.example}</span>
                </div>
                <span className="lang-row-tag">{m.tag}</span>
                <div className={`lang-radio${sel ? ' checked' : ''}`}>{sel && <div className="lang-radio-dot" />}</div>
              </button>
            );
          })}
        </div>
      </Accordion>

      {/* Separador decimal */}
      <Accordion title={t('sep_titulo')} desc={t('sep_desc')} badge={sepAtual?.example}>
        <div className="lang-list">
          {SEP_OPTIONS.map(s => {
            const sel = decSep === s.value;
            return (
              <button key={s.value} className={`lang-row${sel ? ' selected' : ''}`} onClick={() => handleDecSep(s.value)}>
                <span className="reg-symbol reg-mono">{s.value === ',' ? '1,5' : '1.5'}</span>
                <div className="lang-row-info">
                  <span className="lang-row-nome">{s.label}</span>
                  <span className="lang-row-regiao">{s.sub} — {s.example}</span>
                </div>
                <div className={`lang-radio${sel ? ' checked' : ''}`}>{sel && <div className="lang-radio-dot" />}</div>
              </button>
            );
          })}
        </div>
      </Accordion>

      {/* Formato de Data */}
      <Accordion title={t('data_titulo')} desc={t('data_desc')} badge={dateFmt}>
        <div className="lang-list">
          {DATE_FORMATS.map(f => {
            const sel = dateFmt === f.value;
            return (
              <button key={f.value} className={`lang-row${sel ? ' selected' : ''}`} onClick={() => handleDateFmt(f.value)}>
                <span className="reg-symbol reg-mono" style={{ fontSize: 11 }}>{f.label}</span>
                <div className="lang-row-info">
                  <span className="lang-row-nome">{f.sub}</span>
                  <span className="lang-row-regiao">{f.example}</span>
                </div>
                <div className={`lang-radio${sel ? ' checked' : ''}`}>{sel && <div className="lang-radio-dot" />}</div>
              </button>
            );
          })}
        </div>
      </Accordion>

      {/* Timezone */}
      <Accordion title={t('tz_titulo')} desc={t('tz_desc')} badge={tzAtual?.offset}>
        <TzSelector />
      </Accordion>

      {pendingLang && (
        <Portal>
          <ConfirmLang idioma={pendingLang} onConfirm={() => { applyLang(pendingLang.key); setPendingLang(null); }} onCancel={() => setPendingLang(null)} />
        </Portal>
      )}
    </div>
  );
}

/* ── Atualização dos Dados ───────────────────────────────────────────────────── */
const INTERVALOS = [
  { value: 5  * 60 * 1000,      label: '5 min'   },
  { value: 10 * 60 * 1000,      label: '10 min'  },
  { value: 30 * 60 * 1000,      label: '30 min'  },
  { value: 60 * 60 * 1000,      label: '1 hora'  },
  { value: 6  * 60 * 60 * 1000, label: '6 horas' },
  { value: 24 * 60 * 60 * 1000, label: 'Diário'  },
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
  function handleToggle() { const next = !enabled; localStorage.setItem('pbi_auto_refresh', String(next)); onEnabledChange(next); }
  function handleInterval(v) { localStorage.setItem('pbi_refresh_interval', String(v)); onIntervalChange(v); }

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
    if (date.toDateString() === today.toDateString()) return `Hoje às ${date.toLocaleTimeString('pt-BR', opts)}`;
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  const nextUpdate = enabled && lastUpdate ? new Date(lastUpdate.getTime() + intervalMs) : null;

  return (
    <div className="atu-config">
      <div className="atu-row">
        <div className="atu-row-info"><span className="atu-row-label">{t('atu_auto')}</span><span className="atu-row-desc">{t('atu_auto_desc')}</span></div>
        <div className={`toggle-track${enabled ? ' on' : ''}`} onClick={handleToggle}><div className="toggle-thumb" /></div>
      </div>
      {enabled && (
        <div className="atu-row">
          <div className="atu-row-info"><span className="atu-row-label">{t('atu_intervalo')}</span></div>
          <div className="atu-intervals">
            {INTERVALOS.map(opt => (
              <button key={opt.value} className={`atu-interval-btn${intervalMs === opt.value ? ' active' : ''}`} onClick={() => handleInterval(opt.value)}>{opt.label}</button>
            ))}
          </div>
        </div>
      )}
      <div className="atu-info-row">
        <div className="atu-info-item"><span className="atu-info-label">{t('atu_ultima')}</span><span className="atu-info-value">{fmtDateTime(lastUpdate)}</span></div>
        {nextUpdate && <div className="atu-info-item"><span className="atu-info-label">{t('atu_proxima')}</span><span className="atu-info-value">{fmtDateTime(nextUpdate)}</span></div>}
        <button className="btn-outline-sm atu-btn-now" onClick={doRefresh}>↻ {t('atu_agora')}</button>
      </div>
    </div>
  );
}

/* ── Seção Sistema ───────────────────────────────────────────────────────────── */
const IconSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const IconMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const IconMonitor = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const TEMAS = [
  { key: 'light', Icon: IconSun,     tagKey: 'tema_claro'  },
  { key: 'dark',  Icon: IconMoon,    tagKey: 'tema_escuro' },
  { key: 'auto',  Icon: IconMonitor, tagKey: 'tema_auto'   },
];

function SecaoSistema({ themeMode, onThemeModeChange }) {
  const { t } = useT();
  const [atuEnabled,  setAtuEnabled]  = useState(() => localStorage.getItem('pbi_auto_refresh') === 'true');
  const [atuInterval, setAtuInterval] = useState(() => parseInt(localStorage.getItem('pbi_refresh_interval') || String(5 * 60 * 1000)));

  const temaAtual = TEMAS.find(m => m.key === themeMode);
  const atuBadge  = atuEnabled ? INTERVALOS.find(o => o.value === atuInterval)?.label : undefined;

  return (
    <div className="fade-up">
      <div className="param-section-header">
        <div><h3 className="param-section-title">{t('sis_titulo')}</h3><p className="param-section-desc">{t('sis_desc')}</p></div>
      </div>

      {/* Tema */}
      <Accordion title={t('tema_titulo')} desc={t('tema_desc')} badge={temaAtual ? t(temaAtual.tagKey) : undefined}>
        <div className="lang-list">
          {TEMAS.map(m => {
            const sel = themeMode === m.key;
            return (
              <button key={m.key} className={`lang-row${sel ? ' selected' : ''}`} onClick={() => onThemeModeChange(m.key)}>
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: sel ? 'var(--blue)' : 'var(--text-muted)' }}><m.Icon /></span>
                <div className="lang-row-info">
                  <span className="lang-row-nome">{t(m.tagKey)}</span>
                  <span className="lang-row-regiao">{t(`${m.tagKey}_desc`)}</span>
                </div>
                <div className={`lang-radio${sel ? ' checked' : ''}`}>{sel && <div className="lang-radio-dot" />}</div>
              </button>
            );
          })}
        </div>
      </Accordion>

      {/* Atualização */}
      <Accordion title={t('atu_titulo')} desc={t('atu_desc')} badge={atuBadge}>
        <AutoRefreshConfig enabled={atuEnabled} intervalMs={atuInterval} onEnabledChange={setAtuEnabled} onIntervalChange={setAtuInterval} />
      </Accordion>
    </div>
  );
}

/* ── Sub-nav principal ───────────────────────────────────────────────────────── */
export default function Parametros({ themeMode, onThemeModeChange }) {
  const { t } = useT();
  const [sub, setSub] = useState('empresas');

  const SUB_PAGES = [
    { key: 'empresas',   tk: 'param_empresas_menu'  },
    { key: 'regional',   tk: 'param_regional_menu'  },
    { key: 'sistema',    tk: 'param_sistema_menu'   },
    { key: 'conexao',    tk: 'param_conexao_menu'   },
  ];

  return (
    <div className="param-layout">
      <aside className="param-subnav">
        <p className="param-subnav-label">{t('param_config')}</p>
        {SUB_PAGES.map(p => (
          <button key={p.key} className={`param-subnav-item${sub === p.key ? ' active' : ''}`} onClick={() => setSub(p.key)}>
            {t(p.tk)}
          </button>
        ))}
      </aside>
      <div className="param-content">
        <div className="param-content-header">
          <h2 className="param-content-title">{t('param_titulo')}</h2>
          <p className="param-content-desc">{t('param_desc')}</p>
        </div>
        {sub === 'empresas' && <SecaoEmpresas />}
        {sub === 'regional' && <SecaoRegionalizacao />}
        {sub === 'sistema'  && <SecaoSistema themeMode={themeMode} onThemeModeChange={onThemeModeChange} />}
        {sub === 'conexao'  && <SecaoConexao />}
      </div>
    </div>
  );
}
