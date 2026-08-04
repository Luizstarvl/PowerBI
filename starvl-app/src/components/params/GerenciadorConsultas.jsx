/**
 * GerenciadorConsultas.jsx
 * Gerenciador de consultas SQL — lista, edição e histórico.
 * Execução de consultas disponível exclusivamente no Ambiente de Testes.
 */
import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { apiFetch } from '../../api';
import Portal from '../../Portal';

// ── Constantes ─────────────────────────────────────────────────────────────────
const CATEGORIAS = ['Dashboard', 'Cadastros', 'Indicadores', 'Relatórios', 'Cards', 'Gráficos', 'Listagens', 'Outros'];

const DASHBOARD_SLOTS = [
  { value: '',                  label: '— Nenhum —' },
  { value: 'top5_convenio',    label: '🏆 Banner Top 5 Conveniência' },
  { value: 'kpi_vendas',       label: '📊 KPI — Vendas Totais' },
  { value: 'kpi_combustivel',  label: '⛽ KPI — Combustível' },
  { value: 'kpi_conveniencia', label: '🛒 KPI — Conveniência' },
  { value: 'kpi_compras_comb', label: '🚛 KPI — Compras Combustível' },
  { value: 'kpi_compras_conv', label: '📦 KPI — Compras Conveniência' },
  { value: 'kpi_afericoes',    label: '🔧 KPI — Aferições' },
  { value: 'vendas_diarias',   label: '📈 Gráfico Vendas Diárias' },
  { value: 'vendas_horarias',  label: '⏱ Gráfico Vendas por Hora' },
];

const CAT_COLORS = {
  Dashboard:   { bg: '#dbeafe', color: '#1d4ed8' },
  Indicadores: { bg: '#d1fae5', color: '#065f46' },
  Relatórios:  { bg: '#ede9fe', color: '#5b21b6' },
  Cards:       { bg: '#fef3c7', color: '#92400e' },
  Gráficos:    { bg: '#fce7f3', color: '#9d174d' },
  Listagens:   { bg: '#e0f2fe', color: '#075985' },
  Outros:      { bg: '#f3f4f6', color: '#374151' },
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
      <div className="modal modal-lg" style={{ maxWidth: 860, height: '85vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Histórico de Versões — {queryNome}</h3>
        <div className="modal-body" style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden', padding: 0 }}>
          {/* Lista */}
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
                  border: 'none', cursor: 'pointer',
                  borderLeft: selected?.id === h.id ? '3px solid var(--color-primary)' : '3px solid transparent',
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
            {!selected ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--color-text-muted)', fontSize: 13 }}>
                Selecione uma versão para visualizar a SQL.
              </div>
            ) : (
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

// ── Modal Formulário (criar / editar) — layout split-panel ────────────────────
function ModalQueryForm({ query, conexoes, onSave, onClose }) {
  const editando = !!query;
  const [form, setForm] = useState({
    codigo:    query?.codigo    || '',
    nome:      query?.nome      || '',
    categoria: query?.categoria || 'Outros',
    descricao: query?.descricao || '',
    bancoId:   query?.bancoId   || (conexoes[0]?.id || ''),
    sql:       query?.sql       || 'SELECT\n  *\nFROM\n  ',
    slot:      query?.slot      || '',
    ativa:     query?.ativa     !== false,
    motivo:    '',
  });
  const [erro,       setErro]       = useState('');
  const [loading,    setLoading]    = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const isDark = document.documentElement.dataset.theme !== 'light';

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

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
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'Courier New', monospace",
    fontLigatures: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    wordWrap: 'off',
    formatOnPaste: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    folding: true,
    renderLineHighlight: 'all',
    cursorBlinking: 'smooth',
    smoothScrolling: true,
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
    padding: { top: 14, bottom: 14 },
    tabSize: 2,
    insertSpaces: true,
    automaticLayout: true,
    lineDecorationsWidth: 6,
    glyphMargin: false,
  };

  const modalW = fullscreen ? '100vw' : '96vw';
  const modalH = fullscreen ? '100vh' : '95vh';

  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget && !fullscreen) onClose(); }}>
      <div
        className="modal"
        style={{
          maxWidth: fullscreen ? '100vw' : 1320,
          width: modalW, height: modalH, maxHeight: modalH,
          borderRadius: fullscreen ? 0 : undefined,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', transition: 'none', padding: 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Barra de título ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--color-border)', flexShrink: 0,
          background: 'var(--color-surface)',
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
            {editando ? 'Editar Consulta' : 'Nova Consulta'}
          </h3>
          <button
            onClick={() => setFullscreen(f => !f)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 6, borderRadius: 6 }}
            title={fullscreen ? 'Sair do modo tela cheia' : 'Tela cheia'}
          >
            {fullscreen
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            }
          </button>
        </div>

        {/* ── Corpo: dois paineis ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {/* PAINEL ESQUERDO — campos do formulário */}
          <div style={{
            width: 308, flexShrink: 0,
            borderRight: '1px solid var(--color-border)',
            overflowY: 'auto', overflowX: 'hidden',
            padding: '20px 18px',
            display: 'flex', flexDirection: 'column', gap: 14,
            background: 'var(--color-surface)',
          }}>
            {/* Código */}
            <div className="form-field" style={{ margin: 0 }}>
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

            {/* Nome */}
            <div className="form-field" style={{ margin: 0 }}>
              <label>Nome da Consulta</label>
              <input
                type="text" value={form.nome}
                onChange={e => set('nome', e.target.value)}
                placeholder="Ex: Vendas do Mês por Produto"
                autoComplete="off"
              />
            </div>

            {/* Categoria */}
            <div className="form-field" style={{ margin: 0 }}>
              <label>Categoria</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)} style={{ width: '100%' }}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Banco */}
            <div className="form-field" style={{ margin: 0 }}>
              <label>Banco de Dados</label>
              <select value={form.bancoId} onChange={e => set('bancoId', parseInt(e.target.value) || '')} style={{ width: '100%' }}>
                <option value="">— Selecione —</option>
                {conexoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>

            {/* Situação */}
            <div className="form-field" style={{ margin: 0 }}>
              <label style={{ marginBottom: 6, display: 'block' }}>Situação</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <div
                  className={`toggle-track${form.ativa ? ' on' : ''}`}
                  onClick={() => set('ativa', !form.ativa)}
                  style={{ flexShrink: 0 }}
                >
                  <div className="toggle-thumb" />
                </div>
                {form.ativa ? 'Ativa' : 'Inativa'}
              </label>
            </div>

            {/* Widget do dashboard */}
            {form.categoria === 'Dashboard' && (
              <div className="form-field" style={{ margin: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  Vincular ao widget do dashboard
                </label>
                <select value={form.slot} onChange={e => set('slot', e.target.value)} style={{ width: '100%' }}>
                  {DASHBOARD_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>
                  Os dados desta consulta substituem os dados padrão do widget selecionado.
                </span>
              </div>
            )}

            {/* Painel de cadastro */}
            {form.categoria === 'Cadastros' && (
              <div className="form-field" style={{ margin: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>
                  </svg>
                  Vincular ao painel de cadastro
                </label>
                <select value={form.slot} onChange={e => set('slot', e.target.value)} style={{ width: '100%' }}>
                  <option value="">— Nenhum —</option>
                  <option value="cadastro_produtos">📦 Tabela — Cadastro de Produtos</option>
                  <option value="cadastro_clientes">👥 Tabela — Cadastro de Clientes</option>
                </select>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>
                  Os resultados desta consulta serão exibidos como tabela no cadastro selecionado.
                </span>
              </div>
            )}

            {/* Descrição */}
            <div className="form-field" style={{ margin: 0 }}>
              <label>Descrição (opcional)</label>
              <textarea
                value={form.descricao}
                onChange={e => set('descricao', e.target.value)}
                placeholder="Propósito, fontes de dados, observações..."
                rows={3}
                style={{ width: '100%', resize: 'vertical', minHeight: 64 }}
              />
            </div>

            {/* Motivo da alteração */}
            {editando && (
              <div className="form-field" style={{ margin: 0 }}>
                <label>Motivo da alteração</label>
                <input
                  type="text" value={form.motivo}
                  onChange={e => set('motivo', e.target.value)}
                  placeholder="Ex: Ajuste de filtro por data..."
                  autoComplete="off"
                />
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>
                  Registrado no histórico de versões.
                </span>
              </div>
            )}

            {/* Erro */}
            {erro && <p className="form-erro" style={{ margin: 0 }}>{erro}</p>}
          </div>

          {/* PAINEL DIREITO — editor SQL */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Cabeçalho do editor */}
            <div style={{
              padding: '9px 16px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
              background: 'var(--color-surface)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-text-muted)' }}>
                SQL
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                Apenas SELECT e WITH · use{' '}
                <code style={{ background: 'var(--color-background)', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>{'{{empresa}}'}</code>
                {', '}
                <code style={{ background: 'var(--color-background)', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>{'{{data_inicio}}'}</code>
              </span>
            </div>

            {/* Monaco Editor — ocupa toda a altura restante */}
            <div style={{ flex: 1, minHeight: 0 }}>
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
        </div>

        {/* ── Rodapé ── */}
        <div className="modal-footer" style={{ flexShrink: 0 }}>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <><Spin size={13} color="#fff" /> Salvando...</> : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Context Menu ───────────────────────────────────────────────────────────────
function CtxMenuQuery({ x, y, query, isAdmin, onClose, onIncluir, onEditar, onHistorico, onDuplicar, onExcluir }) {
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
  const [modal,     setModal]     = useState(null);
  const [histModal, setHistModal] = useState(null);
  const [ctxMenu,   setCtxMenu]   = useState(null);
  const [filtro,    setFiltro]    = useState('');
  const [filtCat,   setFiltCat]   = useState('');
  const [filtAtiva, setFiltAtiva] = useState('');

  function loadQueries() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtro)         params.set('q', filtro);
    if (filtCat)        params.set('categoria', filtCat);
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
    if (res.ok) setQueries(p => [data, ...p]);
    else alert(data.error || 'Erro ao duplicar.');
  }

  async function openEdit(q) {
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
          onHistorico={() => setHistModal({ id: ctxMenu.query.id, nome: ctxMenu.query.nome })}
          onDuplicar={() => handleDuplicate(ctxMenu.query)}
          onExcluir={() => handleDelete(ctxMenu.query)}
        />
      )}
    </div>
  );
}
