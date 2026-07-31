import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('pt-BR');
}

function ModalEmpresa({ onSave, onClose }) {
  const [form, setForm] = useState({ nome: '', codigoEmpresa: '', banco: '', host: '', port: '', dbUser: '', dbPass: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSave() {
    if (!form.nome.trim()) return setErro('Nome é obrigatório.');
    if (!form.codigoEmpresa) return setErro('Código da empresa é obrigatório.');
    if (!form.banco.trim()) return setErro('Nome do banco é obrigatório.');
    setErro('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome.trim(),
          codigoEmpresa: parseInt(form.codigoEmpresa),
          banco: form.banco.trim(),
          host: form.host.trim() || undefined,
          port: form.port || undefined,
          dbUser: form.dbUser.trim() || undefined,
          dbPass: form.dbPass || undefined,
        }),
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
              <input type="text" value={form.host} onChange={e => set('host', e.target.value)} placeholder="Ex: db.servidor.com" />
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
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Conectando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Parametros() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/clients`)
      .then(r => r.json())
      .then(data => setClientes(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSave(saved) {
    setClientes(prev => [...prev, saved]);
    setModal(false);
  }

  async function handleDelete(codigoEmpresa) {
    if (!window.confirm('Remover esta empresa? A conexão com o banco será encerrada.')) return;
    const res = await fetch(`${API_URL}/api/clients/${codigoEmpresa}`, { method: 'DELETE' });
    if (res.ok) setClientes(prev => prev.filter(c => c.codigoEmpresa !== codigoEmpresa));
  }

  return (
    <main className="dashboard">
      <h2 className="section-title">Parâmetros</h2>

      {/* ── Empresas / Licença ── */}
      <div className="param-group">
        <div className="param-group-header">
          <div>
            <span className="param-group-title">Empresas / Licença</span>
            <p className="param-group-desc">Gerencie os postos conectados e suas credenciais de banco de dados.</p>
          </div>
          <button className="btn-primary" onClick={() => setModal(true)}>+ Adicionar Empresa</button>
        </div>

        <div className="param-table-wrap">
          {loading ? (
            <p className="rank-empty">Carregando…</p>
          ) : (
            <table className="param-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Código</th>
                  <th>Banco</th>
                  <th>Conexão</th>
                  <th>Cadastrado em</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan={6} className="rank-empty">Nenhuma empresa cadastrada</td></tr>
                ) : clientes.map(c => (
                  <tr key={c.id}>
                    <td className="gu-username">{c.nome}</td>
                    <td className="td-id">{c.codigoEmpresa}</td>
                    <td><code className="db-name">{c.banco}</code></td>
                    <td>
                      <span className={`badge ${c.hasCustomHost ? 'badge-admin' : 'badge-user'}`}>
                        {c.hasCustomHost ? 'Personalizada' : 'Padrão'}
                      </span>
                    </td>
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

      {modal && <ModalEmpresa onSave={handleSave} onClose={() => setModal(false)} />}
    </main>
  );
}
