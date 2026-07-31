import React, { useState, useEffect } from 'react';
import Portal from './Portal';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

function fmtDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('pt-BR');
}

/* ── Modal Nova Empresa ──────────────────────────────────────────────────────── */
function ModalEmpresa({ onSave, onClose }) {
  const [form, setForm] = useState({ nome: '', codigoEmpresa: '', banco: '', host: '', port: '', dbUser: '', dbPass: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  async function handleSave() {
    if (!form.nome.trim())        return setErro('Nome é obrigatório.');
    if (!form.codigoEmpresa)      return setErro('Código da empresa é obrigatório.');
    if (!form.banco.trim())       return setErro('Nome do banco é obrigatório.');
    setErro(''); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome.trim(), codigoEmpresa: parseInt(form.codigoEmpresa),
          banco: form.banco.trim(),
          host: form.host.trim() || undefined, port: form.port || undefined,
          dbUser: form.dbUser.trim() || undefined, dbPass: form.dbPass || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setErro(data.error || 'Erro ao salvar.');
      onSave(data);
    } catch { setErro('Erro ao conectar ao servidor.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Nova Empresa</h3>
        <div className="modal-body">
          <div className="modal-grid-2">
            <div className="form-field">
              <label>Nome da Empresa</label>
              <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Posto Central" autoFocus />
            </div>
            <div className="form-field">
              <label>Código da Empresa</label>
              <input type="number" value={form.codigoEmpresa} onChange={e => set('codigoEmpresa', e.target.value)} placeholder="Ex: 7432" />
            </div>
          </div>
          <div className="form-field">
            <label>Banco de Dados</label>
            <input type="text" value={form.banco} onChange={e => set('banco', e.target.value)} placeholder="Ex: ret_meavenida" />
          </div>
          <div className="modal-section-label">Conexão personalizada (opcional)</div>
          <div className="modal-grid-2">
            <div className="form-field">
              <label>Host</label>
              <input type="text" value={form.host} onChange={e => set('host', e.target.value)} placeholder="db.servidor.com" />
            </div>
            <div className="form-field">
              <label>Porta</label>
              <input type="number" value={form.port} onChange={e => set('port', e.target.value)} placeholder="5432" />
            </div>
            <div className="form-field">
              <label>Usuário DB</label>
              <input type="text" value={form.dbUser} onChange={e => set('dbUser', e.target.value)} placeholder="postgres" autoComplete="off" />
            </div>
            <div className="form-field">
              <label>Senha DB</label>
              <input type="password" value={form.dbPass} onChange={e => set('dbPass', e.target.value)} placeholder="••••••" autoComplete="new-password" />
            </div>
          </div>
          {erro && <p className="form-erro">{erro}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Conectando…' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Seção Empresas ──────────────────────────────────────────────────────────── */
function SecaoEmpresas() {
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
    if (!window.confirm('Remover esta empresa?')) return;
    const res = await fetch(`${API_URL}/api/clients/${cod}`, { method: 'DELETE' });
    if (res.ok) setClientes(p => p.filter(c => c.codigoEmpresa !== cod));
  }

  return (
    <div className="fade-up">
      <div className="param-section-header">
        <div>
          <h3 className="param-section-title">Empresas / Licença</h3>
          <p className="param-section-desc">Gerencie os postos conectados e suas credenciais de banco de dados.</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Adicionar</button>
      </div>

      <div className="param-card">
        <div className="param-table-wrap">
          {loading ? <p className="rank-empty">Carregando…</p> : (
            <table className="param-table">
              <thead>
                <tr>
                  <th>Empresa</th><th>Código</th><th>Banco</th><th>Conexão</th><th>Cadastrado</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0
                  ? <tr><td colSpan={6} className="rank-empty">Nenhuma empresa cadastrada</td></tr>
                  : clientes.map(c => (
                    <tr key={c.id}>
                      <td className="gu-username">{c.nome}</td>
                      <td className="td-id">{c.codigoEmpresa}</td>
                      <td><code className="db-name">{c.banco}</code></td>
                      <td><span className={`badge ${c.hasCustomHost ? 'badge-admin' : 'badge-user'}`}>{c.hasCustomHost ? 'Personalizada' : 'Padrão'}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(c.criado)}</td>
                      <td className="td-actions">
                        <button className="icon-btn danger" title="Remover" onClick={() => handleDelete(c.codigoEmpresa)}>
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
      <rect width="16" height="14" fill="#3C3B6E" rx="5" style={{ borderBottomRightRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0 }}/>
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

/* ── Seção Sistema ───────────────────────────────────────────────────────────── */
const IDIOMAS = [
  { key: 'pt-BR', Flag: FlagBR, nome: 'Português', regiao: 'Brasil',        tag: 'PT' },
  { key: 'en',    Flag: FlagUS, nome: 'English',   regiao: 'United States', tag: 'EN' },
  { key: 'es',    Flag: FlagES, nome: 'Español',   regiao: 'España',        tag: 'ES' },
];

function SecaoSistema() {
  const [idioma, setIdioma] = useState(() => localStorage.getItem('pbi_lang') || 'pt-BR');

  function handleIdioma(key) {
    setIdioma(key);
    localStorage.setItem('pbi_lang', key);
  }

  return (
    <div className="fade-up">
      <div className="param-section-header">
        <div>
          <h3 className="param-section-title">Sistema</h3>
          <p className="param-section-desc">Configurações gerais da plataforma.</p>
        </div>
      </div>

      <div className="sys-group">
        <p className="sys-group-title">Idioma da interface</p>
        <p className="sys-group-desc">Selecione o idioma exibido no sistema.</p>
        <div className="lang-list">
          {IDIOMAS.map(l => {
            const sel = idioma === l.key;
            return (
              <button key={l.key} className={`lang-row${sel ? ' selected' : ''}`} onClick={() => handleIdioma(l.key)}>
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
      </div>
    </div>
  );
}

/* ── Sub-nav ─────────────────────────────────────────────────────────────────── */
const SUB_PAGES = [
  { key: 'empresas', label: 'Empresas' },
  { key: 'sistema',  label: 'Sistema' },
];

export default function Parametros() {
  const [sub, setSub] = useState('empresas');

  return (
    <div className="param-layout">
      {/* Sub-sidebar */}
      <aside className="param-subnav">
        <p className="param-subnav-label">Configurações</p>
        {SUB_PAGES.map(p => (
          <button
            key={p.key}
            className={`param-subnav-item${sub === p.key ? ' active' : ''}`}
            onClick={() => setSub(p.key)}
          >
            {p.label}
          </button>
        ))}
      </aside>

      {/* Conteúdo */}
      <div className="param-content">
        <div className="param-content-header">
          <h2 className="param-content-title">Parâmetros</h2>
          <p className="param-content-desc">Configure parâmetros e preferências gerais do sistema.</p>
        </div>
        {sub === 'empresas' && <SecaoEmpresas />}
        {sub === 'sistema'  && <SecaoSistema />}
      </div>
    </div>
  );
}
