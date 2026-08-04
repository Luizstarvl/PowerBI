import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Search, ChevronUp, ChevronDown, ChevronsUpDown, Settings } from 'lucide-react';
import { apiFetch } from '../../api';

const PAGE_SIZE = 50;

function SortIcon({ col, ordenacao }) {
  if (ordenacao.col !== col) return <ChevronsUpDown size={12} className="tc-sort-icon tc-sort-icon--idle" />;
  return ordenacao.dir === 'asc'
    ? <ChevronUp   size={12} className="tc-sort-icon tc-sort-icon--active" />
    : <ChevronDown size={12} className="tc-sort-icon tc-sort-icon--active" />;
}

export default function TabelaConsulta({ slot, empresasKey, titulo }) {
  const [slotQuery,  setSlotQuery]  = useState(undefined); // undefined=carregando, null=sem slot
  const [dados,      setDados]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [erro,       setErro]       = useState('');
  const [busca,      setBusca]      = useState('');
  const [ordenacao,  setOrdenacao]  = useState({ col: null, dir: 'asc' });
  const [pagina,     setPagina]     = useState(1);

  // Busca a consulta vinculada ao slot
  useEffect(() => {
    apiFetch(`/api/queries?ativa=true&slot=${slot}`)
      .then(r => r.json())
      .then(d => setSlotQuery(Array.isArray(d) && d.length ? d[0] : null))
      .catch(() => setSlotQuery(null));
  }, [slot]);

  const empresa = (empresasKey || '').split(',')[0];

  const fetchDados = useCallback(() => {
    if (!slotQuery || !empresa) return;
    setLoading(true);
    setErro('');
    apiFetch(`/api/queries/execute/${slotQuery.codigo}?empresa=${empresa}`)
      .then(r => r.json())
      .then(d => {
        if (!d.ok) throw new Error(d.error || 'Erro ao executar consulta.');
        setDados(d);
        setPagina(1);
      })
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  }, [slotQuery, empresa]);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  // Filtra pela busca
  const linhasFiltradas = useMemo(() => {
    if (!dados?.rows) return [];
    if (!busca.trim()) return dados.rows;
    const q = busca.toLowerCase();
    return dados.rows.filter(row =>
      Object.values(row).some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }, [dados, busca]);

  // Ordena
  const linhasOrdenadas = useMemo(() => {
    if (!ordenacao.col) return linhasFiltradas;
    return [...linhasFiltradas].sort((a, b) => {
      const va = a[ordenacao.col] ?? '';
      const vb = b[ordenacao.col] ?? '';
      const cmp = String(va).localeCompare(String(vb), 'pt-BR', { numeric: true });
      return ordenacao.dir === 'asc' ? cmp : -cmp;
    });
  }, [linhasFiltradas, ordenacao]);

  // Paginação
  const totalPaginas = Math.max(1, Math.ceil(linhasOrdenadas.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const linhasPagina = linhasOrdenadas.slice((paginaSegura - 1) * PAGE_SIZE, paginaSegura * PAGE_SIZE);

  function toggleSort(col) {
    setOrdenacao(prev =>
      prev.col === col
        ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: 'asc' }
    );
    setPagina(1);
  }

  function handleBusca(e) {
    setBusca(e.target.value);
    setPagina(1);
  }

  // ── Estados de renderização ──────────────────────────────────────────────────

  if (slotQuery === undefined) {
    return <div className="tc-status"><RefreshCw size={16} className="pp-spin" /> Carregando...</div>;
  }

  if (slotQuery === null) {
    return (
      <div className="tc-empty-state">
        <Settings size={32} className="tc-empty-icon" />
        <p className="tc-empty-title">Nenhuma consulta configurada</p>
        <p className="tc-empty-sub">
          Vá em <strong>Parâmetros → Gerenciador de Consultas</strong>, crie uma consulta
          com categoria <strong>Cadastros</strong> e vincule ao slot <code>{slot}</code>.
        </p>
      </div>
    );
  }

  const cols = dados?.columns || [];

  return (
    <div className="tc-wrap">
      {/* Toolbar */}
      <div className="tc-toolbar">
        <div className="tc-search-wrap">
          <Search size={14} className="tc-search-icon" />
          <input
            className="tc-search"
            placeholder="Buscar em todos os campos…"
            value={busca}
            onChange={handleBusca}
          />
        </div>
        <div className="tc-toolbar-right">
          {dados && (
            <span className="tc-count">
              {linhasFiltradas.length !== dados.rows.length
                ? `${linhasFiltradas.length} de ${dados.rows.length} registros`
                : `${dados.rows.length} registros`}
            </span>
          )}
          <button
            className="btn-primary tc-refresh-btn"
            onClick={fetchDados}
            disabled={loading}
            title="Atualizar dados"
          >
            <RefreshCw size={13} className={loading ? 'pp-spin' : ''} />
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>
      </div>

      {erro && <p className="form-erro" style={{ margin: '0 0 10px' }}>{erro}</p>}

      {/* Tabela */}
      {!erro && (
        <div className="tc-table-wrap">
          {loading && !dados ? (
            <div className="tc-status"><RefreshCw size={16} className="pp-spin" /> Carregando dados...</div>
          ) : cols.length === 0 ? (
            <div className="tc-status tc-status--muted">Nenhum dado retornado pela consulta.</div>
          ) : (
            <table className="tc-table">
              <thead>
                <tr>
                  {cols.map(col => (
                    <th key={col} className="tc-th" onClick={() => toggleSort(col)}>
                      <span className="tc-th-inner">
                        {col}
                        <SortIcon col={col} ordenacao={ordenacao} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhasPagina.length === 0 ? (
                  <tr>
                    <td colSpan={cols.length} className="tc-td tc-td--empty">
                      Nenhum registro encontrado{busca ? ` para "${busca}"` : ''}.
                    </td>
                  </tr>
                ) : (
                  linhasPagina.map((row, i) => (
                    <tr key={i} className="tc-tr">
                      {cols.map(col => (
                        <td key={col} className="tc-td">{row[col] ?? '—'}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="tc-pagination">
          <button
            className="tc-pg-btn"
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={paginaSegura === 1}
          >
            Anterior
          </button>
          <span className="tc-pg-info">Página {paginaSegura} de {totalPaginas}</span>
          <button
            className="tc-pg-btn"
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaSegura === totalPaginas}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
