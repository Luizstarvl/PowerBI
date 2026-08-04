import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Search, X, Package, DollarSign, AlertTriangle, TrendingUp, Printer } from 'lucide-react';
import { apiFetch } from '../../api';

const fmtCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum      = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
const fmtPct      = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const PAGE_OPTS = [15, 30, 50, 'Todos'];

/* Detecta colunas relevantes pelo nome */
function detectCols(columns) {
  const find = pat => columns.find(c => new RegExp(pat, 'i').test(c)) || null;
  return {
    nome:     find('descricao|nome|produto'),
    codigo:   find('cod_produto|codigo|prodcodigo'),
    barra:    find('cod_barra|barra|ean'),
    secao:    find('descricao_secao|secao'),
    grupo:    find('descricao_grupo|grupo'),
    estoque:  find('estoque|kardex'),
    preco:    find('preco_venda1|preco_venda|preco(?!_venda2)'),
    custo:    find('custo'),
    situacao: find('situacao|status'),
  };
}

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="pp-kpi">
      <div className="pp-kpi-icon" style={{ background: color + '22', color }}>
        <Icon size={16} />
      </div>
      <div className="pp-kpi-body">
        <div className="pp-kpi-label">{label}</div>
        <div className="pp-kpi-value">{value}</div>
        {sub && <div className="pp-kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

function SituacaoBadge({ value }) {
  const ativo = /ativo/i.test(String(value));
  return (
    <span className={`pp-badge ${ativo ? 'pp-badge--ok' : 'pp-badge--off'}`}>
      {ativo ? 'ATIVO' : 'INATIVO'}
    </span>
  );
}

export default function PainelProdutos({ empresasKey }) {
  const [slotQuery,  setSlotQuery]  = useState(undefined);
  const [rows,       setRows]       = useState([]);
  const [cols,       setCols]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [erro,       setErro]       = useState('');

  /* Filtros */
  const [busca,      setBusca]      = useState('');
  const [secao,      setSecao]      = useState('Todas');
  const [grupo,      setGrupo]      = useState('Todos');
  const [situacao,   setSituacao]   = useState('Ativos');
  const [semEstoque, setSemEstoque] = useState(false);
  const [pagina,     setPagina]     = useState(1);
  const [pageSize,   setPageSize]   = useState(15);

  const empresa = (empresasKey || '').split(',')[0];
  const det = useMemo(() => detectCols(cols), [cols]);

  /* Busca slot */
  useEffect(() => {
    apiFetch('/api/queries?ativa=true&slot=cadastro_produtos')
      .then(r => r.json())
      .then(d => setSlotQuery(Array.isArray(d) && d.length ? d[0] : null))
      .catch(() => setSlotQuery(null));
  }, []);

  /* Executa consulta */
  const fetchDados = useCallback(() => {
    if (!slotQuery || !empresa) return;
    setLoading(true);
    setErro('');
    apiFetch(`/api/queries/execute/${slotQuery.codigo}?empresa=${empresa}`)
      .then(r => r.json())
      .then(d => {
        if (!d.ok) throw new Error(d.error || 'Erro ao executar consulta.');
        setCols(d.columns || []);
        setRows(d.rows || []);
        setPagina(1);
      })
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  }, [slotQuery, empresa]);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  /* Opções dos selects */
  const secoes = useMemo(() => {
    if (!det.secao) return [];
    return ['Todas', ...new Set(rows.map(r => r[det.secao]).filter(Boolean))];
  }, [rows, det.secao]);

  const grupos = useMemo(() => {
    if (!det.grupo) return [];
    const base = secao === 'Todas' ? rows : rows.filter(r => r[det.secao] === secao);
    return ['Todos', ...new Set(base.map(r => r[det.grupo]).filter(Boolean))];
  }, [rows, det.secao, det.grupo, secao]);

  /* KPIs calculados */
  const kpis = useMemo(() => {
    const ativos    = rows.filter(r => /ativo/i.test(String(r[det.situacao] || '')));
    const inativos  = rows.filter(r => /inativo/i.test(String(r[det.situacao] || '')));
    const semEst    = rows.filter(r => Number(r[det.estoque] || 0) <= 0);

    const valorTotal = rows.reduce((acc, r) => {
      const est   = Number(r[det.estoque] || 0);
      const preco = Number(r[det.preco]   || 0);
      return acc + (est * preco);
    }, 0);

    const margens = rows
      .map(r => {
        const p = Number(r[det.preco] || 0);
        const c = Number(r[det.custo] || 0);
        return p > 0 ? ((p - c) / p) * 100 : null;
      })
      .filter(m => m !== null);
    const margemMedia = margens.length ? margens.reduce((a, b) => a + b, 0) / margens.length : 0;

    return { total: rows.length, ativos: ativos.length, inativos: inativos.length, semEst: semEst.length, valorTotal, margemMedia };
  }, [rows, det]);

  /* Filtragem */
  const filtradas = useMemo(() => {
    let r = rows;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      r = r.filter(row =>
        String(row[det.nome]   || '').toLowerCase().includes(q) ||
        String(row[det.codigo] || '').toLowerCase().includes(q) ||
        String(row[det.barra]  || '').toLowerCase().includes(q)
      );
    }
    if (secao !== 'Todas' && det.secao)     r = r.filter(row => row[det.secao] === secao);
    if (grupo !== 'Todos' && det.grupo)     r = r.filter(row => row[det.grupo] === grupo);
    if (situacao === 'Ativos'   && det.situacao) r = r.filter(row =>  /ativo/i.test(String(row[det.situacao] || '')));
    if (situacao === 'Inativos' && det.situacao) r = r.filter(row => /inativo/i.test(String(row[det.situacao] || '')));
    if (semEstoque && det.estoque) r = r.filter(row => Number(row[det.estoque] || 0) <= 0);
    return r;
  }, [rows, busca, secao, grupo, situacao, semEstoque, det]);

  /* Paginação */
  const total      = filtradas.length;
  const ps         = pageSize === 'Todos' ? total : pageSize;
  const totalPags  = Math.max(1, Math.ceil(total / (ps || 1)));
  const pag        = Math.min(pagina, totalPags);
  const pagRows    = pageSize === 'Todos' ? filtradas : filtradas.slice((pag - 1) * ps, pag * ps);

  function limpar() {
    setBusca(''); setSecao('Todas'); setGrupo('Todos');
    setSituacao('Ativos'); setSemEstoque(false); setPagina(1);
  }

  /* Colunas visíveis da tabela */
  const tabelaCols = useMemo(() => [
    det.nome     && { key: det.nome,     label: 'PRODUTO' },
    det.codigo   && { key: det.codigo,   label: 'CÓDIGO' },
    det.secao    && { key: det.secao,    label: 'SEÇÃO' },
    det.grupo    && { key: det.grupo,    label: 'GRUPO' },
    det.estoque  && { key: det.estoque,  label: 'ESTOQUE',     num: true },
    det.preco    && { key: det.preco,    label: 'PREÇO VENDA', currency: true },
    det.custo    && { key: det.custo,    label: 'CUSTO',       currency: true },
    det.estoque && det.preco && { key: '__valor_estoque', label: 'VALOR ESTOQUE', currency: true, calc: r => Number(r[det.estoque] || 0) * Number(r[det.preco] || 0) },
    det.situacao && { key: det.situacao, label: 'SITUAÇÃO',    badge: true },
  ].filter(Boolean), [det]);

  /* Sem slot configurado */
  if (slotQuery === null) {
    return (
      <div className="tc-empty-state">
        <Package size={32} className="tc-empty-icon" />
        <p className="tc-empty-title">Nenhuma consulta configurada</p>
        <p className="tc-empty-sub">
          Vá em <strong>Parâmetros → Gerenciador de Consultas</strong>, crie uma consulta
          com categoria <strong>Cadastros</strong> e vincule ao slot <code>cadastro_produtos</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="pp-wrap">
      {/* Cabeçalho */}
      <div className="pp-header">
        <h2 className="pp-title">Gerenciamento de Produtos</h2>
        <div className="pp-header-actions">
          <button className="btn-primary pp-refresh" onClick={fetchDados} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'pp-spin' : ''} />
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
          <button className="btn-outline pp-print" onClick={() => window.print()} title="Imprimir">
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      {erro && <p className="form-erro">{erro}</p>}

      {/* KPIs */}
      <div className="pp-kpi-grid">
        <KpiCard icon={Package}       label="Total de Produtos"      value={kpis.total}                               sub={`${kpis.ativos} ativos`}            color="var(--color-primary)" />
        <KpiCard icon={DollarSign}    label="Valor Total em Estoque" value={fmtCurrency.format(kpis.valorTotal)}      sub="valor de venda"                     color="#22c55e" />
        <KpiCard icon={AlertTriangle} label="Sem Estoque"            value={kpis.semEst}                              sub={`${kpis.inativos} inativos`}        color="#f59e0b" />
        <KpiCard icon={TrendingUp}    label="Margem Média"           value={`${fmtPct.format(kpis.margemMedia)}%`}    sub="margem estimada"                    color="#a78bfa" />
      </div>

      {/* Filtros */}
      <div className="pp-filters">
        <div className="pp-search-wrap">
          <Search size={14} className="pp-search-icon" />
          <input className="pp-search" placeholder="Buscar produto ou código…" value={busca} onChange={e => { setBusca(e.target.value); setPagina(1); }} />
        </div>

        {secoes.length > 1 && (
          <div className="pp-filter-group">
            <label>Seção</label>
            <select value={secao} onChange={e => { setSecao(e.target.value); setGrupo('Todos'); setPagina(1); }}>
              {secoes.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}

        {grupos.length > 1 && (
          <div className="pp-filter-group">
            <label>Grupo</label>
            <select value={grupo} onChange={e => { setGrupo(e.target.value); setPagina(1); }}>
              {grupos.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
        )}

        <div className="pp-filter-group">
          <label>Situação</label>
          <div className="pp-seg">
            {['Ativos','Inativos','Todos'].map(s => (
              <button key={s} className={`pp-seg-btn${situacao === s ? ' pp-seg-btn--on' : ''}`}
                onClick={() => { setSituacao(s); setPagina(1); }}>{s}</button>
            ))}
          </div>
        </div>

        <button
          className={`pp-toggle${semEstoque ? ' pp-toggle--on' : ''}`}
          onClick={() => { setSemEstoque(v => !v); setPagina(1); }}
        >
          SEM ESTOQUE
        </button>

        <button className="btn-ghost pp-limpar" onClick={limpar}>
          <X size={13} /> Limpar
        </button>
      </div>

      {/* Tabela */}
      <div className="pp-table-wrap">
        {loading && !rows.length ? (
          <div className="tc-status"><RefreshCw size={16} className="pp-spin" /> Carregando produtos...</div>
        ) : (
          <table className="pp-table">
            <thead>
              <tr>
                {tabelaCols.map(c => (
                  <th key={c.key} className={`pp-th${c.num || c.currency ? ' pp-th--num' : ''}`}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagRows.length === 0 ? (
                <tr><td colSpan={tabelaCols.length} className="tc-td--empty">Nenhum produto encontrado.</td></tr>
              ) : pagRows.map((row, i) => (
                <tr key={i} className="pp-tr">
                  {tabelaCols.map(c => {
                    const raw = c.calc ? c.calc(row) : row[c.key];
                    return (
                      <td key={c.key} className={`pp-td${c.num || c.currency ? ' pp-td--num' : ''}`}>
                        {c.badge    ? <SituacaoBadge value={raw} />
                         : c.currency ? fmtCurrency.format(Number(raw) || 0)
                         : c.num      ? fmtNum.format(Number(raw) || 0)
                         : (raw ?? '—')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Rodapé */}
      <div className="pp-footer">
        <span className="pp-footer-info">
          Mostrando {total === 0 ? 0 : (pag - 1) * ps + 1} a {Math.min(pag * ps, total)} de {total} produtos
        </span>

        <div className="pp-pagination">
          <button className="pp-pg-btn" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pag === 1 || pageSize === 'Todos'}>‹</button>
          {totalPags <= 7
            ? Array.from({ length: totalPags }, (_, i) => i + 1).map(n => (
                <button key={n} className={`pp-pg-btn${pag === n ? ' pp-pg-btn--on' : ''}`} onClick={() => setPagina(n)}>{n}</button>
              ))
            : <span className="pp-pg-info">Pág. {pag} / {totalPags}</span>
          }
          <button className="pp-pg-btn" onClick={() => setPagina(p => Math.min(totalPags, p + 1))} disabled={pag === totalPags || pageSize === 'Todos'}>›</button>
        </div>

        <div className="pp-pagesize">
          <span>Itens por página</span>
          {PAGE_OPTS.map(o => (
            <button key={o} className={`pp-pg-btn${pageSize === o ? ' pp-pg-btn--on' : ''}`}
              onClick={() => { setPageSize(o); setPagina(1); }}>{o}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
