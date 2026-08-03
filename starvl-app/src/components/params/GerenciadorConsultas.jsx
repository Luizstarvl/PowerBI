/**
 * GerenciadorConsultas.jsx
 * Editor profissional de consultas SQL para o módulo de Parâmetros.
 * Monaco Editor (VSCode) · Validação de segurança · Histórico de versões
 */
import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { apiFetch } from '../../api';
import Portal from '../../Portal';

// ── Constantes ─────────────────────────────────────────────────────────────────
const CATEGORIAS = ['Dashboard', 'Indicadores', 'Relatórios', 'Cards', 'Gráficos', 'Listagens', 'Outros'];

const CAT_COLORS = {
  Dashboard:    { bg: '#dbeafe', color: '#1d4ed8' },
  Indicadores:  { bg: '#d1fae5', color: '#065f46' },
  Relatórios:   { bg: '#ede9fe', color: '#5b21b6' },
  Cards:        { bg: '#fef3c7', color: '#92400e' },
  Gráficos:     { bg: '#fce7f3', color: '#9d174d' },
  Listagens:    { bg: '#e0f2fe', color: '#075985' },
  Outros:       { bg: '#f3f4f6', color: '#374151' },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(s) {
  if (!s) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(s));
}

function CatBadge({ cat }) {
  const c = CAT_COLORS[cat] || CAT_COLORS.Outros;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 600,
      padding: '2px 8px', borderRadius: 20, background: c.bg, color: c.color,
    }}>
      {cat}
    </span>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────────
function Spin({ size = 14, color = 'var(--color-primary)' }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid ${color}`, borderTopColor: 'transparent',
      borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0,
    }} />
  );
}

// ── Modal Histórico ────────────────────────────────────────────────────────────
function ModalHistorico({ queryId, queryNome, onClose }) {
  const [historico, setHistorico] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const themeClass = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/queries/${queryId}/historico`)
      .then(r => r.json())
      .then(d => { setHistorico(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [queryId]);

  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-lg" style={{ maxWidth: 860, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Histórico de Versões — {queryNome}</h3>
        <div className="modal-body" style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden', padding: 0 }}>
          {/* Lista de versões */}
          <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid var(--color-border)', overflowY: 'auto', padding: '12px 0' }}>
            {loading && <div style={{ padding: 16 }}><Spin /></div>}
            {!loading && historico.length === 0 && (
              <p style={{ padding: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>Sem versões salvas.</p>
            )}
            {historico.map(h => (
              <button
                key={h.id}
                onClick={() => setSelected(h)}
                style={{
                  display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                  background: selected?.id === h.id ? 'var(--color-primary-light)' : 'transparent',
                  border: 'none', cursor: 'pointer', borderLeft: selected?.id === h.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>v{h.versao}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{fmtDate(h.criado)}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>{h.usuario || '—'}</div>
                {h.motivo && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.motivo}</div>}
              </button>
            ))}
          </div>

          {/* Visualizador */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '16px 16px 0' }}>
            {!selected && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--color-text-muted)', fontSize: 13 }}>
                Selecione uma versão para visualizar a SQL.
              </div>
            )}
            {selected && (
              <>
                <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Versão {selected.versao} — {fmtDate(selected.criado)} — {selected.usuario || '—'}
                  {selected.motivo && <span style={{ marginLeft: 8, fontStyle: 'italic' }}>{selected.motivo}</span>}
                </div>
                <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                  <Editor
                    height="100%"
                    language="sql"
                    value={selected.sql}
                    theme={themeClass === 'light' ? 'light' : 'vs-dark'}
                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, lineNumbers: 'on' }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers de parâmetros ─────────────────────────────────────────────────────
function detectParams(sql) {
  const re = /\{\{\s*(\w+)\s*\}\}/g;
  const found = new Set();
  let m;
  while ((m = re.exec(sql)) !== null) found.add(m[1]);
  return [...found];
}

function autoDefaultValue(name) {
  const n = name.toLowerCase();
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth() + 1).padStart(2, '0');
  const dd    = String(today.getDate()).padStart(2, '0');
  if (n === 'hoje' || n === 'data' || n === 'data_hoje') return `${yyyy}-${mm}-${dd}`;
  if (n === 'data_inicio' || n === 'datainicio')         return `${yyyy}-${mm}-01`;
  if (n.includes('data_fim') || n === 'datafim')         return `${yyyy}-${mm}-${dd}`;
  if (n === 'mes' || n === 'mes_atual')                  return String(today.getMonth() + 1);
  if (n === 'ano' || n === 'ano_atual')                  return String(yyyy);
  if (n === 'periodo')                                   return `${mm}${yyyy}`;
  return '';
}

function paramLabel(name) {
  const map = {
    empresa: 'Código da empresa (ex: 7432)',
    empresa_id: 'Código da empresa',
    cod_empresa: 'Código da empresa',
    hoje: 'Data de hoje (AAAA-MM-DD)',
    data: 'Data (AAAA-MM-DD)',
    data_inicio: 'Data início (AAAA-MM-DD)',
    data_fim: 'Data fim (AAAA-MM-DD)',
    mes: 'Mês (1–12)',
    ano: 'Ano (AAAA)',
    periodo: 'Período (MMAAAA)',
  };
  return map[name.toLowerCase()] || name;
}

// ── Modal de preenchimento de parâmetros ──────────────────────────────────────
function ParamInputModal({ params, onConfirm, onCancel }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(params.map(p => [p, autoDefaultValue(p)]))
  );
  function set(k, v) { setValues(prev => ({ ...prev, [k]: v })); }
  const allFilled = params.every(p => String(values[p] ?? '').trim() !== '');
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 420, minWidth: 320 }} onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Parâmetros da consulta</h3>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
            Preencha os parâmetros detectados na SQL. Cada <code style={{ background: 'var(--color-bg)', padding: '1px 4px', borderRadius: 3, fontSize: 12 }}>{'{{nome}}'}</code> diferente gera um campo.
          </p>
          {params.map(p => (
            <div className="form-field" key={p} style={{ margin: 0 }}>
              <label style={{ fontSize: 12 }}>
                <code style={{ background: 'var(--color-bg)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>{`{{${p}}}`}</code>
                {'  '}{paramLabel(p)}
              </label>
              <input
                type="text"
                autoFocus={params[0] === p}
                value={values[p] ?? ''}
                onChange={e => set(p, e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && allFilled) onConfirm(values); }}
                placeholder={autoDefaultValue(p) || `valor de ${p}`}
                autoComplete="off"
              />
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn-primary" onClick={() => onConfirm(values)} disabled={!allFilled}>
            ▶ Executar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Formulário (criar / editar) ──────────────────────────────────────────
function ModalQueryForm({ query, conexoes, onSave, onClose }) {
  const editando = !!query;
  const [form, setForm] = useState({
    codigo:    query?.codigo    || '',
    nome:      query?.nome      || '',
    categoria: query?.categoria || 'Outros',
    descricao: query?.descricao || '',
    bancoId:   query?.bancoId   || (conexoes[0]?.id || ''),
    sql:       query?.sql       || 'SELECT\n  *\nFROM\n  ',
    ativa:     query?.ativa     !== false,
    motivo:    '',
  });
  const [erro,       setErro]       = useState('');
  const [loading,    setLoading]    = useState(false);
  const [testing,    setTesting]    = useState(false);
  const [testRes,    setTestRes]    = useState(null);
  const [paramModal, setParamModal] = useState(null); // null | string[] (lista de params pendentes)
  const [fullscreen, setFullscreen] = useState(false);
  const isDark = document.documentElement.dataset.theme !== 'light';

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  async function runTest(params = {}) {
    setParamModal(null);
    setTesting(true); setTestRes(null);
    try {
      const res  = await apiFetch('/api/queries/test-sql', {
        method: 'POST',
        body: JSON.stringify({ sql: form.sql, bancoId: form.bancoId, params }),
      });
      const data = await res.json();
      setTestRes(data);
    } catch { setTestRes({ ok: false, error: 'Erro ao comunicar com o servidor.' }); }
    finally { setTesting(false); }
  }

  function handleTest() {
    const params = detectParams(form.sql);
    if (params.length > 0) {
      setParamModal(params); // abre modal de preenchimento
    } else {
      runTest();
    }
  }

  async function handleSave() {
    if (!form.codigo.trim()) return setErro('Código é obrigatório.');
    if (!form.nome.trim())   return setErro('Nome é obrigatório.');
    if (!form.sql.trim())    return setErro('SQL é obrigatória.');
    setErro(''); setLoading(true);
    try {
      const url    = editando ? `/api/queries/${query.id}` : '/api/queries';
      const method = editando ? 'PUT' : 'POST';
      const res    = await apiFetch(url, { method, body: JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) return setErro(data.error || 'Erro ao salvar.');
      onSave(data);
    } catch { setErro('Erro de conexão com o servidor.'); }
    finally { setLoading(false); }
  }

  const editorOptions = {
    fontSize: 13,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    wordWrap: 'on',
    formatOnPaste: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    folding: true,
  };

  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget && !fullscreen) onClose(); }}>
      <div
        className="modal"
        style={{
          maxWidth: fullscreen ? '100vw' : 900, width: '100%',
          maxHeight: fullscreen ? '100vh' : '94vh',
          height: fullscreen ? '100vh' : undefined,
          borderRadius: fullscreen ? 0 : undefined,
          display: 'flex', flexDirection: 'column', transition: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
          <h3 className="modal-title" style={{ margin: 0 }}>{editando ? 'Editar Consulta' : 'Nova Consulta'}</h3>
          <button
            onClick={() => setFullscreen(f => !f)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
            title={fullscreen ? 'Sair do modo tela cheia' : 'Tela cheia'}
          >
            {fullscreen
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            }
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Linha 1: Código + Nome */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12 }}>
            <div className="form-field">
              <label>Código (identificador único)</label>
              <input
                type="text" value={form.codigo}
                onChange={e => set('codigo', e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                placeholder="EX: DASH_VENDAS_MES"
                disabled={editando}
                style={editando ? { opacity: .5 } : undefined}
                autoComplete="off" autoFocus
              />
            </div>
            <div className="form-field">
              <label>Nome da Consulta</label>
              <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Vendas do Mês por Produto" autoComplete="off" />
            </div>
          </div>

          {/* Linha 2: Categoria + Banco + Ativa */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 12 }}>
            <div className="form-field">
              <label>Categoria</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)} style={{ width: '100%' }}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Banco de Dados</label>
              <select value={form.bancoId} onChange={e => set('bancoId', parseInt(e.target.value) || '')} style={{ width: '100%' }}>
                <option value="">— Selecione —</option>
                {conexoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="form-field" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ marginBottom: 6, display: 'block' }}>Situação</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <div className={`toggle-track${form.ativa ? ' on' : ''}`} onClick={() => set('ativa', !form.ativa)} style={{ flexShrink: 0 }}>
                  <div className="toggle-thumb" />
                </div>
                {form.ativa ? 'Ativa' : 'Inativa'}
              </label>
            </div>
          </div>

          {/* Descrição */}
          <div className="form-field">
            <label>Descrição (opcional)</label>
            <textarea
              value={form.descricao} onChange={e => set('descricao', e.target.value)}
              placeholder="Descreva o propósito desta consulta, fontes de dados e observações importantes..."
              rows={2}
              style={{ width: '100%', resize: 'vertical', minHeight: 56 }}
            />
          </div>

          {/* Motivo da alteração (só no edit) */}
          {editando && (
            <div className="form-field">
              <label>Motivo da alteração (registrado no histórico)</label>
              <input type="text" value={form.motivo} onChange={e => set('motivo', e.target.value)} placeholder="Ex: Ajuste de performance, inclusão de filtro por data..." autoComplete="off" />
            </div>
          )}

          {/* Editor SQL */}
          <div className="form-field" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ margin: 0 }}>SQL</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  Apenas SELECT e WITH · use <code style={{ background: 'var(--color-bg)', padding: '1px 4px', borderRadius: 3 }}>{'{{empresa}}'}</code>
                  {', '}
                  <code style={{ background: 'var(--color-bg)', padding: '1px 4px', borderRadius: 3 }}>{'{{data_inicio}}'}</code>
                  {' '}(cada parâmetro com nome único)
                </span>
                <button
                  type="button"
                  className="btn-outline-sm"
                  style={{ padding: '4px 12px', fontSize: 12 }}
                  onClick={handleTest}
                  disabled={testing || !form.bancoId}
                  title={!form.bancoId ? 'Selecione um banco de dados primeiro' : ''}
                >
                  {testing ? <><Spin size={12} /> Executando...</> : '▶ Executar'}
                </button>
              </div>
            </div>
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)', height: fullscreen ? 'calc(100vh - 560px)' : 280, minHeight: 200 }}>
              <Editor
                height="100%"
                language="sql"
                value={form.sql}
                theme={isDark ? 'vs-dark' : 'light'}
                options={editorOptions}
                onChange={v => set('sql', v || '')}
              />
            </div>
          </div>

          {/* Resultado do teste */}
          {testRes && <TestResultPanel result={testRes} />}

          {erro && <p className="form-erro" style={{ margin: 0 }}>{erro}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <><Spin size={13} color="#fff" /> Salvando...</> : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Modal de preenchimento de parâmetros */}
      {paramModal && (
        <Portal>
          <ParamInputModal
            params={paramModal}
            onConfirm={values => runTest(values)}
            onCancel={() => setParamModal(null)}
          />
        </Portal>
      )}
    </div>
  );
}

// ── Painel de resultados do teste ──────────────────────────────────────────────
function TestResultPanel({ result }) {
  const ok = result?.ok;
  return (
    <div style={{
      borderRadius: 8, overflow: 'hidden',
      border: `1px solid ${ok ? 'var(--color-success)' : 'var(--color-error)'}`,
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10,
        background: ok ? 'var(--color-success-light)' : 'var(--color-error-light)',
      }}>
        {ok
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        }
        <span style={{ fontSize: 13, fontWeight: 600, color: ok ? 'var(--color-success)' : 'var(--color-error)' }}>
          {ok
            ? `${result.rowCount ?? 0} linha(s) retornada(s) em ${result.executionTime}ms`
            : `Erro: ${result.error}`
          }
        </span>
      </div>

      {/* Tabela de resultados */}
      {ok && result.rows?.length > 0 && (
        <div style={{ overflow: 'auto', maxHeight: 220 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-secondary)', position: 'sticky', top: 0, zIndex: 1 }}>
                {result.columns.map(col => (
                  <th key={col} style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.slice(0, 100).map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {result.columns.map(col => (
                    <td key={col} style={{ padding: '5px 12px', color: 'var(--color-text)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row[col] === null ? <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>null</span> : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {result.rows.length > 100 && (
            <p style={{ padding: '6px 12px', fontSize: 11, color: 'var(--color-text-muted)', margin: 0, borderTop: '1px solid var(--color-border)' }}>
              Mostrando 100 de {result.rowCount} linhas.
            </p>
          )}
        </div>
      )}
      {ok && result.rows?.length === 0 && (
        <p style={{ padding: '10px 14px', fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Consulta retornou 0 linhas.</p>
      )}
    </div>
  );
}

// ── Context Menu ───────────────────────────────────────────────────────────────
function CtxMenuQuery({ x, y, query, isAdmin, onClose, onIncluir, onEditar, onExecutar, onHistorico, onDuplicar, onExcluir }) {
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

  return (
    <Portal>
      <div ref={ref} className="ctx-menu" style={{ position: 'fixed', left: x, top: y, zIndex: 9999 }}>
        {isAdmin && (
          <button className="ctx-item" onClick={() => { onIncluir(); onClose(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Incluir
          </button>
        )}
        {query && (
          <>
            {query.bancoId && query.ativa && (
              <button className="ctx-item" onClick={() => { onExecutar(); onClose(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Executar
              </button>
            )}
            <button className="ctx-item" onClick={() => { onHistorico(); onClose(); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><polyline points="12 7 12 12 15 15"/></svg>
              Histórico
            </button>
            {isAdmin && (
              <>
                <button className="ctx-item" onClick={() => { onEditar(); onClose(); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Alterar
                </button>
                <button className="ctx-item" onClick={() => { onDuplicar(); onClose(); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Duplicar
                </button>
                <div className="ctx-divider" />
                <button className="ctx-item danger" onClick={() => { onExcluir(); onClose(); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  Excluir
                </button>
              </>
            )}
          </>
        )}
      </div>
    </Portal>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function GerenciadorConsultas({ user }) {
  const [queries,   setQueries]   = useState([]);
  const [conexoes,  setConexoes]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null);   // null | { query? }
  const [histModal, setHistModal] = useState(null);   // null | { id, nome }
  const [testRes,   setTestRes]   = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [ctxMenu,   setCtxMenu]   = useState(null);  // null | { x, y, query }
  const [filtro,    setFiltro]    = useState('');
  const [filtCat,   setFiltCat]   = useState('');
  const [filtAtiva, setFiltAtiva] = useState('');

  function loadQueries() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtro)   params.set('q', filtro);
    if (filtCat)  params.set('categoria', filtCat);
    if (filtAtiva !== '') params.set('ativa', filtAtiva);
    apiFetch(`/api/queries?${params.toString()}`)
      .then(r => r.json())
      .then(d => setQueries(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadQueries(); }, [filtro, filtCat, filtAtiva]);

  useEffect(() => {
    apiFetch('/api/connections').then(r => r.json()).then(d => setConexoes(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  async function handleDelete(q) {
    if (!window.confirm(`Excluir a consulta "${q.nome}"? O histórico de versões também será apagado.`)) return;
    const res = await apiFetch(`/api/queries/${q.id}`, { method: 'DELETE' });
    if (res.ok) setQueries(p => p.filter(x => x.id !== q.id));
  }

  async function handleDuplicate(q) {
    const res  = await apiFetch(`/api/queries/${q.id}/duplicate`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) { setQueries(p => [data, ...p]); }
    else alert(data.error || 'Erro ao duplicar.');
  }

  async function handleTest(q) {
    setTestingId(q.id); setTestRes(null);
    try {
      const res  = await apiFetch(`/api/queries/${q.id}/test`, { method: 'POST' });
      const data = await res.json();
      setTestRes({ queryId: q.id, queryNome: q.nome, ...data });
    } catch { setTestRes({ queryId: q.id, queryNome: q.nome, ok: false, error: 'Erro de comunicação.' }); }
    finally { setTestingId(null); }
  }

  async function openEdit(q) {
    // Busca SQL completa (listagem omite para performance)
    try {
      const res  = await apiFetch(`/api/queries/${q.id}`);
      const data = await res.json();
      if (res.ok) setModal({ query: data });
      else setModal({ query: q });
    } catch { setModal({ query: q }); }
  }

  function handleSaved(saved) {
    setQueries(p => {
      const idx = p.findIndex(x => x.id === saved.id);
      return idx >= 0 ? p.map(x => x.id === saved.id ? saved : x) : [saved, ...p];
    });
    setModal(null);
  }

  function openCtxMenu(e, q = null) {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, query: q });
  }

  const conexaoNome = (id) => conexoes.find(c => c.id === id)?.nome || '—';

  return (
    <div className="fade-up">
      {/* Header */}
      <div className="param-section-header">
        <div>
          <h3 className="param-section-title">Gerenciador de Consultas</h3>
          <p className="param-section-desc">Gerencie as consultas SQL utilizadas nos dashboards, indicadores e relatórios do sistema.</p>
        </div>
        {user?.perfil === 'admin' && (
          <button className="btn-primary" onClick={() => setModal({})}>+ Nova Consulta</button>
        )}
      </div>

      {/* Filtros */}
      <div className="param-card" style={{ padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="themed-input"
              type="text" value={filtro} onChange={e => setFiltro(e.target.value)}
              placeholder="Buscar por nome ou código..."
              style={{ width: '100%', paddingLeft: 30, paddingRight: 8 }}
              autoComplete="off"
            />
          </div>
          <select className="themed-select" value={filtCat} onChange={e => setFiltCat(e.target.value)} style={{ minWidth: 140, width: 'auto' }}>
            <option value="">Todas as categorias</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="themed-select" value={filtAtiva} onChange={e => setFiltAtiva(e.target.value)} style={{ minWidth: 120, width: 'auto' }}>
            <option value="">Todas</option>
            <option value="true">Ativas</option>
            <option value="false">Inativas</option>
          </select>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {queries.length} consulta{queries.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Painel de resultado de teste (quando aberto fora do modal) */}
      {testRes && (
        <div className="param-card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Resultado: {testRes.queryNome}</span>
            <button onClick={() => setTestRes(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ padding: 16 }}>
            <TestResultPanel result={testRes} />
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="param-card" onContextMenu={e => openCtxMenu(e, null)}>
        <div className="param-table-wrap">
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}><Spin size={22} /></div>
          ) : queries.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 10, opacity: .4 }}>
                <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
              <p style={{ margin: 0, fontSize: 14 }}>Nenhuma consulta encontrada.</p>
              {user?.perfil === 'admin' && <p style={{ margin: '6px 0 0', fontSize: 13 }}>Clique em "+ Nova Consulta" para criar a primeira.</p>}
            </div>
          ) : (
            <table className="param-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Banco</th>
                  <th>Versão</th>
                  <th>Situação</th>
                  <th>Atualizado</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {queries.map(q => (
                  <tr key={q.id} onContextMenu={e => openCtxMenu(e, q)}>
                    <td>
                      <code style={{ fontSize: 12, background: 'var(--color-bg-secondary)', padding: '2px 7px', borderRadius: 5, fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                        {q.codigo}
                      </code>
                    </td>
                    <td className="gu-username" style={{ maxWidth: 200 }}>{q.nome}</td>
                    <td><CatBadge cat={q.categoria} /></td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{conexaoNome(q.bancoId)}</td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>v{q.versao}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        background: q.ativa ? 'var(--color-success-light)' : 'var(--color-neutral-light)',
                        color: q.ativa ? 'var(--color-success)' : 'var(--color-neutral)',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: q.ativa ? 'var(--color-success)' : 'var(--color-neutral)' }} />
                        {q.ativa ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{fmtDate(q.atualizado)}</td>
                    <td className="td-actions">
                      {/* Executar */}
                      <button
                        className="btn-outline-sm"
                        title="Executar consulta"
                        disabled={testingId === q.id || !q.bancoId || !q.ativa}
                        onClick={() => handleTest(q)}
                        style={{ minWidth: 32 }}
                      >
                        {testingId === q.id ? <Spin size={12} /> : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                          </svg>
                        )}
                      </button>

                      {/* Histórico */}
                      <button
                        className="btn-outline-sm"
                        title="Histórico de versões"
                        onClick={() => setHistModal({ id: q.id, nome: q.nome })}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
                          <polyline points="12 7 12 12 15 15"/>
                        </svg>
                      </button>

                      {user?.perfil === 'admin' && (
                        <>
                          {/* Editar */}
                          <button className="btn-outline-sm" title="Editar" onClick={() => openEdit(q)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>

                          {/* Duplicar */}
                          <button className="btn-outline-sm" title="Duplicar" onClick={() => handleDuplicate(q)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                          </button>

                          {/* Excluir */}
                          <button className="icon-btn danger" title="Excluir" onClick={() => handleDelete(q)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6"/><path d="M14 11v6"/>
                            </svg>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modais */}
      {modal !== null && (
        <Portal>
          <ModalQueryForm
            query={modal.query || null}
            conexoes={conexoes}
            onSave={handleSaved}
            onClose={() => setModal(null)}
          />
        </Portal>
      )}
      {histModal && (
        <Portal>
          <ModalHistorico
            queryId={histModal.id}
            queryNome={histModal.nome}
            onClose={() => setHistModal(null)}
          />
        </Portal>
      )}

      {/* Context Menu */}
      {ctxMenu && (
        <CtxMenuQuery
          x={ctxMenu.x}
          y={ctxMenu.y}
          query={ctxMenu.query}
          isAdmin={user?.perfil === 'admin'}
          onClose={() => setCtxMenu(null)}
          onIncluir={() => setModal({})}
          onEditar={() => openEdit(ctxMenu.query)}
          onExecutar={() => handleTest(ctxMenu.query)}
          onHistorico={() => setHistModal({ id: ctxMenu.query.id, nome: ctxMenu.query.nome })}
          onDuplicar={() => handleDuplicate(ctxMenu.query)}
          onExcluir={() => handleDelete(ctxMenu.query)}
        />
      )}
    </div>
  );
}
