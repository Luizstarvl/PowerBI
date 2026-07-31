import React, { useState, useEffect, useRef } from 'react';
import Portal from './Portal';
import { useT } from './i18n';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

function fmtDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('pt-BR');
}

/* ── Modal Nova Empresa ──────────────────────────────────────────────────────── */
function ModalEmpresa({ onSave, onClose }) {
  const { t } = useT();
  const [form, setForm] = useState({ nome: '', codigoEmpresa: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  async function handleSave() {
    if (!form.nome.trim())   return setErro(t('me_obrig_nome'));
    if (!form.codigoEmpresa) return setErro(t('me_obrig_cod'));
    setErro(''); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: form.nome.trim(), codigoEmpresa: parseInt(form.codigoEmpresa) }),
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
        <h3 className="modal-title">{t('me_titulo')}</h3>
        <div className="modal-body">
          <div className="modal-grid-2">
            <div className="form-field">
              <label>{t('me_nome')}</label>
              <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Posto Central" autoFocus />
            </div>
            <div className="form-field">
              <label>{t('me_codigo')}</label>
              <input type="number" value={form.codigoEmpresa} onChange={e => set('codigoEmpresa', e.target.value)} placeholder="Ex: 7432" />
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
  const [modal, setModal]       = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/clients`)
      .then(r => r.json())
      .then(d => setClientes(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSave(saved) { setClientes(p => [...p, saved]); setModal(false); }

  async function handleDelete(cod) {
    if (!window.confirm(t('emp_remover'))) return;
    const res = await fetch(`${API_URL}/api/clients/${cod}`, { method: 'DELETE' });
    if (res.ok) setClientes(p => p.filter(c => c.codigoEmpresa !== cod));
  }

  return (
    <div className="fade-up">
      <div className="param-section-header">
        <div>
          <h3 className="param-section-title">{t('emp_titulo')}</h3>
          <p className="param-section-desc">{t('emp_desc')}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>{t('emp_adicionar')}</button>
      </div>

      <div className="param-card">
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
                    <tr key={c.id}>
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
      {modal && <Portal><ModalEmpresa onSave={handleSave} onClose={() => setModal(false)} /></Portal>}
    </div>
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
  const [config, setConfig]     = useState(null);  // empresa sendo editada
  const [nova, setNova]         = useState(false);  // modal de nova conexão

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

  function handleNovaSalva(nova) {
    setClientes(p => [...p, nova]);
    setNova(false);
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

      <div className="param-card">
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
                    <tr key={c.id}>
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

/* ── Seção Sistema ───────────────────────────────────────────────────────────── */
const IDIOMAS = [
  { key: 'pt-BR', Flag: FlagBR, nome: 'Português', regiao: 'Brasil',        tag: 'PT' },
  { key: 'en',    Flag: FlagUS, nome: 'English',   regiao: 'United States', tag: 'EN' },
  { key: 'es',    Flag: FlagES, nome: 'Español',   regiao: 'España',        tag: 'ES' },
];

function SecaoSistema() {
  const { lang, t, applyLang } = useT();
  const [pendingLang, setPendingLang] = useState(null);

  const idiomaAtual = IDIOMAS.find(l => l.key === lang);
  const tzAtual     = TZ_GRUPOS.flatMap(g => g.zones).find(z => z.key === (localStorage.getItem('pbi_tz') || 'America/Sao_Paulo'));

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
