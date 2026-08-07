/**
 * Estoque.jsx
 * Módulo de Estoque — alimentado por consultas configuradas no Gerenciador de Consultas.
 *
 * Slots esperados (Parâmetros → Gerenciador de Consultas → categoria Estoque):
 *   estoque_principal  → tabela principal com posição de estoque por produto
 *   estoque_secoes     → (opcional) lista de seções para o filtro
 *   estoque_grupos     → (opcional) lista de grupos para o filtro
 *
 * Colunas detectadas automaticamente nos resultados:
 *   nome / descricao / produto     → nome do produto
 *   codigo / cod / prodcodigo      → código
 *   barra / ean / gtin             → código de barras
 *   secao / descricao_secao        → seção
 *   grupo / descricao_grupo        → grupo
 *   estoque / kardex / saldo       → saldo em estoque
 *   minimo / estoque_minimo        → estoque mínimo (para alerta)
 *   preco / preco_venda / preco_venda1 → preço de venda
 *   custo / e_prodcusto            → custo
 *   situacao / status              → situação (ativo/inativo)
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Package, RefreshCw, Search, X, AlertTriangle, DollarSign,
         TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '../api';

// ── Formatadores ───────────────────────────────────────────────────────────────
const fmtCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum      = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });

const PAGE_OPTS = [10, 30, 50, 'Todos'];

// ── Detecção automática de colunas ────────────────────────────────────────────
function detectCols(columns) {
  const exact = pat => columns.find(c => new RegExp(`^(${pat})$`, 'i').test(c)) || null;
  const find  = pat => columns.find(c => new RegExp(pat, 'i').test(c)) || null;
  return {
    nome:     exact('descricao|nome|proddescricao|descricao_produto') || find('descricao(?!_)'),
    codigo:   exact('cod_produto|codigo|prodcodigo|cod|code'),
    barra:    exact('cod_barra|barra|ean|gtin'),
    secao:    exact('descricao_secao|nome_secao|secao_descricao') || exact('secao'),
    grupo:    exact('descricao_grupo|nome_grupo|grupo_descricao') || exact('grupo'),
    estoque:  find('estoque|kardex|saldo'),
    minimo:   find('minimo|estoque_minimo|min'),
    preco:    exact('preco_venda1|preco_venda|preco') || find('preco(?!_venda2)'),
    custo:    exact('custo|custo_medio|e_prodcusto') || find('custo'),
    situacao: exact('situacao|status|ativo|inativo') || find('situacao|status'),
  };
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="pp-kpi" style={{ '--pp-accent': accent }}>
      <div className="pp-kpi-icon-wrap"><Icon size={18} /></div>
      <div className="pp-kpi-body">
        <span className="pp-kpi-label">{label}</span>
        <strong className="pp-kpi-value">{value}</strong>
        {sub && <span className="pp-kpi-sub">{sub}</span>}
      </div>
    </div>
  );
}

// ── Badge situação ─────────────────────────────────────────────────────────────
function SituacaoBadge({ value }) {
  const v = String(value || '').trim().toLowerCase();
  const ativo = v === 'ativo' || v === 'a';
  return (
    <span className={`pp-badge ${ativo ? 'pp-badge--ok' : 'pp-badge--off'}`}>
      <span className="pp-badge-dot" />
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  );
}

// ── Célula de estoque (vermelho quando zero/negativo) ─────────────────────────
function EstoqueCell({ value, minimo }) {
  const n   = Number(value)  || 0;
  const min = Number(minimo) || 0;
  const abaixoMin = min > 0 && n <= min;
  const zerado    = n <= 0;
  const cls = zerado ? ' pp-estoque--zero' : abaixoMin ? ' pp-estoque--low' : '';
  return (
    <span className={`pp-estoque${cls}`} title={abaixoMin && !zerado ? `Mínimo: ${fmtNum.format(min)}` : undefined}>
      {fmtNum.format(n)}
      {abaixoMin && !zerado && <AlertTriangle size={11} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
    </span>
  );
}

// ── Estado vazio (sem consulta configurada) ───────────────────────────────────
function SemConsulta() {
  return (
    <div className="tc-empty-state">
      <Package size={36} className="tc-empty-icon" />
      <p className="tc-empty-title">Nenhuma consulta configurada</p>
      <p className="tc-empty-sub">
        Vá em <strong>Parâmetros → Gerenciador de Consultas</strong>, crie uma consulta
        com categoria <strong>Estoque</strong> e vincule ao slot{' '}
        <code>estoque_principal</code>.
      </p>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function Estoque({ empresas }) {
  const empresa = (empresas || [])[0] || '';

  // Slots
  const [slotPrincipal, setSlotPrincipal] = useState(undefined); // undefined = carregando
  const [slotSecoes,    setSlotSecoes]    = useState(null);
  const [slotGrupos,    setSlotGrupos]    = useState(null);

  // Dados
  const [rows,       setRows]       = useState([]);
  const [cols,       setCols]       = useState([]);
  const [secoesExt,  setSecoesExt]  = useState([]);
  const [gruposExt,  setGruposExt]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [erro,       setErro]       = useState('');

  // Filtros
  const [busca,      setBusca]      = useState('');
  const [secao,      setSecao]      = useState('Todas');
  const [grupo,      setGrupo]      = useState('Todos');
  const [situacao,   setSituacao]   = useState('Ativos');
  const [semEst,     setSemEst]     = useState(false);
  const [sortCol,    setSortCol]    = useState(null);
  const [sortDir,    setSortDir]    = useState('asc');
  const [pagina,     setPagina]     = useState(1);
  const [pageSize,   setPageSize]   = useState(10);

  // Detecta colunas
  const det = useMemo(() => detectCols(cols), [cols]);

  // 1. Busca os 3 slots
  useEffect(() => {
    const fetchSlot = slot =>
      apiFetch(`/api/queries?ativa=true&slot=${slot}`)
        .then(r => r.json())
        .then(d => (Array.isArray(d) && d.length ? d[0] : null))
        .catch(() => null);

    Promise.all([
      fetchSlot('estoque_principal'),
      fetchSlot('estoque_secoes'),
      fetchSlot('estoque_grupos'),
    ]).then(([qp, qs, qg]) => {
      setSlotPrincipal(qp);
      setSlotSecoes(qs);
      setSlotGrupos(qg);
    });
  }, []);

  // 2. Executa seções e grupos quando prontos
  useEffect(() => {
    if (!empresa) return;
    if (slotSecoes) {
      apiFetch(`/api/queries/execute/${slotSecoes.codigo}?empresa=${empresa}`)
        .then(r => r.json())
        .then(d => {
          if (!d.ok || !d.rows?.length) return;
          const [codCol, descCol] = d.columns;
          setSecoesExt(d.rows.map(r => ({ cod: String(r[codCol] ?? ''), desc: String(r[descCol] ?? '') })));
        }).catch(() => {});
    }
    if (slotGrupos) {
      apiFetch(`/api/queries/execute/${slotGrupos.codigo}?empresa=${empresa}`)
        .then(r => r.json())
        .then(d => {
          if (!d.ok || !d.rows?.length) return;
          const [codCol, descCol, codSecaoCol] = d.columns;
          setGruposExt(d.rows.map(r => ({
            cod:       String(r[codCol]     ?? ''),
            desc:      String(r[descCol]    ?? ''),
            cod_secao: codSecaoCol ? String(r[codSecaoCol] ?? '') : null,
          })));
        }).catch(() => {});
    }
  }, [slotSecoes, slotGrupos, empresa]);

  // 3. Executa consulta principal
  const fetchDados = useCallback(() => {
    if (!slotPrincipal || !empresa) return;
    setLoading(true);
    setErro('');
    apiFetch(`/api/queries/execute/${slotPrincipal.codigo}?empresa=${empresa}`)
      .then(r => r.json())
      .then(d => {
        if (!d.ok) throw new Error(d.error || 'Erro ao executar consulta.');
        setCols(d.columns || []);
        setRows(d.rows    || []);
        setPagina(1);
      })
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  }, [slotPrincipal, empresa]);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  // ── Listas de filtros ────────────────────────────────────────────────────────
  const secoes = useMemo(() => {
    if (secoesExt.length) return ['Todas', ...secoesExt.map(s => s.desc).filter(Boolean)];
    if (!det.secao) return [];
    return ['Todas', ...new Set(rows.map(r => r[det.secao]).filter(Boolean))];
  }, [secoesExt, rows, det.secao]);

  const grupos = useMemo(() => {
    const norm = s => String(s || '').trim().toLowerCase();
    if (gruposExt.length) {
      let lista = gruposExt;
      if (secao !== 'Todas') {
        const temRelacao = gruposExt.some(g => g.cod_secao !== null);
        if (temRelacao) {
          const secaoObj = secoesExt.find(s => norm(s.desc) === norm(secao));
          if (secaoObj) lista = gruposExt.filter(g => g.cod_secao === secaoObj.cod);
        } else {
          const base = rows.filter(r => norm(r[det.secao]) === norm(secao));
          const permitidos = new Set(base.map(r => norm(r[det.grupo])).filter(Boolean));
          if (permitidos.size) lista = gruposExt.filter(g => permitidos.has(norm(g.desc)));
        }
      }
      return ['Todos', ...lista.map(g => g.desc).filter(Boolean)];
    }
    if (!det.grupo) return [];
    const base = secao === 'Todas' ? rows : rows.filter(r => norm(r[det.secao]) === norm(secao));
    return ['Todos', ...new Set(base.map(r => r[det.grupo]).filter(Boolean))];
  }, [gruposExt, secoesExt, rows, det, secao]);

  // ── Match situação ────────────────────────────────────────────────────────────
  const matchSituacao = (val, tipo) => {
    const v = String(val || '').trim().toLowerCase();
    if (tipo === 'Ativos')   return v === 'ativo'   || v === 'a';
    if (tipo === 'Inativos') return v === 'inativo' || v === 'i';
    return true;
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const ativos   = rows.filter(r => matchSituacao(r[det.situacao], 'Ativos'));
    const inativos = rows.length - ativos.length;
    const zerados  = rows.filter(r => Number(r[det.estoque] || 0) <= 0);
    const abaixoMin = det.minimo
      ? rows.filter(r => {
          const est = Number(r[det.estoque] || 0);
          const min = Number(r[det.minimo]  || 0);
          return min > 0 && est > 0 && est <= min;
        })
      : [];
    const valorEst = (det.estoque && det.preco)
      ? rows.reduce((acc, r) => acc + Number(r[det.estoque] || 0) * Number(r[det.preco] || 0), 0)
      : null;

    return { total: rows.length, ativos: ativos.length, inativos, zerados: zerados.length, abaixoMin: abaixoMin.length, valorEst };
  }, [rows, det]);

  // ── Filtro e ordenação ────────────────────────────────────────────────────────
  const tabelaCols = useMemo(() => [
    det.nome     && { key: det.nome,    label: 'Produto',         name: true },
    det.codigo   && { key: det.codigo,  label: 'Código' },
    det.barra    && { key: det.barra,   label: 'Cód. Barras' },
    det.secao    && { key: det.secao,   label: 'Seção' },
    det.grupo    && { key: det.grupo,   label: 'Grupo' },
    det.estoque  && { key: det.estoque, label: 'Estoque',  estoque: true },
    det.minimo   && { key: det.minimo,  label: 'Mínimo',   num: true },
    det.preco    && { key: det.preco,   label: 'Preço',    currency: true },
    det.custo    && { key: det.custo,   label: 'Custo',    currency: true },
    det.estoque && det.preco && {
      key: '__ve', label: 'Vl. Estoque', currency: true,
      calc: r => Number(r[det.estoque] || 0) * Number(r[det.preco] || 0),
    },
    det.situacao && { key: det.situacao, label: 'Situação', badge: true },
  ].filter(Boolean), [det]);

  const norm = s => String(s || '').trim().toLowerCase();

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
    if (secao !== 'Todas' && det.secao) r = r.filter(row => norm(row[det.secao]) === norm(secao));
    if (grupo !== 'Todos' && det.grupo) r = r.filter(row => norm(row[det.grupo]) === norm(grupo));
    if (situacao !== 'Todos' && det.situacao) r = r.filter(row => matchSituacao(row[det.situacao], situacao));
    if (semEst && det.estoque) r = r.filter(row => Number(row[det.estoque] || 0) <= 0);
    return r;
  }, [rows, busca, secao, grupo, situacao, semEst, det]); // eslint-disable-line

  const sortedFiltradas = useMemo(() => {
    if (!sortCol) return filtradas;
    const col = tabelaCols.find(c => c.key === sortCol);
    if (!col) return filtradas;
    return [...filtradas].sort((a, b) => {
      const va = col.calc ? col.calc(a) : a[sortCol];
      const vb = col.calc ? col.calc(b) : b[sortCol];
      if (col.currency || col.estoque || col.num) {
        const diff = (Number(va) || 0) - (Number(vb) || 0);
        return sortDir === 'asc' ? diff : -diff;
      }
      const cmp = String(va ?? '').localeCompare(String(vb ?? ''), 'pt-BR', { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtradas, sortCol, sortDir, tabelaCols]);

  function handleSort(key) {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(key); setSortDir('asc'); }
    setPagina(1);
  }

  function limpar() {
    setBusca(''); setSecao('Todas'); setGrupo('Todos');
    setSituacao('Ativos'); setSemEst(false); setPagina(1);
  }

  const total     = sortedFiltradas.length;
  const ps        = pageSize === 'Todos' ? total : pageSize;
  const totalPags = Math.max(1, Math.ceil(total / (ps || 1)));
  const pag       = Math.min(pagina, totalPags);
  const pagRows   = pageSize === 'Todos' ? sortedFiltradas : sortedFiltradas.slice((pag - 1) * ps, pag * ps);

  // ── Renderização ──────────────────────────────────────────────────────────────
  if (slotPrincipal === undefined) {
    return (
      <main className="dashboard">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <RefreshCw size={20} style={{ animation: 'spin .7s linear infinite' }} />
        </div>
      </main>
    );
  }

  if (slotPrincipal === null) {
    return <main className="dashboard"><SemConsulta /></main>;
  }

  return (
    <main className="dashboard">
      <div className="pp-wrap">

        {/* ── Cabeçalho ── */}
        <div className="pp-header">
          <div className="pp-header-left">
            <div className="pp-header-title-group">
              <h2 className="pp-title">Estoque</h2>
              <p className="pp-subtitle">{empresa || '—'}</p>
            </div>
          </div>
          <div className="pp-header-actions">
            <button className="pp-btn-primary" onClick={fetchDados} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'pp-spin' : ''} />
              {loading ? 'Atualizando…' : 'Atualizar'}
            </button>
          </div>
        </div>

        {erro && <p className="form-erro">{erro}</p>}

        {/* ── KPIs ── */}
        <div className="pp-kpi-grid">
          <KpiCard icon={Package}       label="Total de Itens"     value={fmtNum.format(kpis.total)}                                 sub={`${kpis.ativos} ativos · ${kpis.inativos} inativos`}   accent="#3b82f6" />
          {kpis.valorEst !== null && (
            <KpiCard icon={DollarSign}  label="Valor em Estoque"   value={fmtCurrency.format(kpis.valorEst)}                         sub="preço × saldo"                                          accent="#22c55e" />
          )}
          <KpiCard icon={AlertTriangle} label="Zerados"            value={fmtNum.format(kpis.zerados)}                               sub="saldo ≤ 0"                                              accent="#ef4444" />
          {kpis.abaixoMin > 0 && (
            <KpiCard icon={TrendingDown} label="Abaixo do Mínimo"  value={fmtNum.format(kpis.abaixoMin)}                             sub="saldo ≤ mínimo configurado"                             accent="#f59e0b" />
          )}
        </div>

        {/* ── Barra de filtros ── */}
        <div className="pp-bar">
          <div className="pp-bar-search">
            <Search size={14} />
            <input
              className="pp-bar-input"
              placeholder="Buscar por nome ou código…"
              value={busca}
              onChange={e => { setBusca(e.target.value); setPagina(1); }}
            />
            {busca && <button className="pp-bar-clear" onClick={() => { setBusca(''); setPagina(1); }}><X size={12} /></button>}
          </div>

          <div className="pp-bar-divider" />

          {secoes.length > 1 && (
            <div className="pp-bar-field">
              <label>Seção</label>
              <select value={secao} onChange={e => { setSecao(e.target.value); setGrupo('Todos'); setPagina(1); }}>
                {secoes.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}

          {secoes.length > 1 && grupos.length > 1 && <div className="pp-bar-divider" />}

          {grupos.length > 1 && (
            <div className="pp-bar-field">
              <label>Grupo</label>
              <select value={grupo} onChange={e => { setGrupo(e.target.value); setPagina(1); }}>
                {grupos.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          )}

          <div className="pp-bar-divider" />

          <div className="pp-bar-field">
            <label>Situação</label>
            <div className="pp-tabs">
              {['Ativos', 'Inativos', 'Todos'].map(s => (
                <button key={s}
                  className={`pp-tab${situacao === s ? ' pp-tab--on' : ''}`}
                  onClick={() => { setSituacao(s); setPagina(1); }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="pp-bar-divider" />

          {det.estoque && (
            <button
              className={`pp-chip${semEst ? ' pp-chip--on' : ''}`}
              onClick={() => { setSemEst(v => !v); setPagina(1); }}>
              Zerados
            </button>
          )}

          <button className="pp-btn-ghost pp-btn-ghost--sm pp-bar-limpar" onClick={limpar}>
            <X size={12} /> Limpar
          </button>
        </div>

        {/* ── Tabela ── */}
        <div className="pp-table-wrap">
          {loading && !rows.length ? (
            <div className="pp-loading">
              <RefreshCw size={18} className="pp-spin" />
              <span>Carregando estoque…</span>
            </div>
          ) : (
            <div className="pp-table-scroll">
              <table className="pp-table">
                <thead>
                  <tr className="pp-thead-row">
                    {tabelaCols.map((c, i) => {
                      const isActive = sortCol === c.key;
                      return (
                        <th
                          key={c.key}
                          className={[
                            'pp-th pp-th--sortable',
                            c.currency || c.estoque || c.num ? 'pp-th--r' : '',
                            i === 0 ? 'pp-th--first' : '',
                            isActive ? 'pp-th--active' : '',
                          ].filter(Boolean).join(' ')}
                          onClick={() => handleSort(c.key)}
                        >
                          {c.label}
                          <span className="pp-sort-icon">
                            {isActive ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {pagRows.length === 0 ? (
                    <tr>
                      <td colSpan={tabelaCols.length} className="pp-empty-cell">
                        Nenhum item encontrado{busca ? ` para "${busca}"` : ''}.
                      </td>
                    </tr>
                  ) : pagRows.map((row, i) => (
                    <tr key={i} className="pp-tr">
                      {tabelaCols.map((c, ci) => {
                        const raw = c.calc ? c.calc(row) : row[c.key];
                        return (
                          <td key={c.key} className={[
                            'pp-td',
                            c.currency || c.estoque || c.num ? 'pp-td--r' : '',
                            ci === 0 ? 'pp-td--name' : '',
                          ].filter(Boolean).join(' ')}>
                            {c.badge    ? <SituacaoBadge value={raw} />
                             : c.estoque  ? <EstoqueCell value={raw} minimo={det.minimo ? row[det.minimo] : null} />
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
            </div>
          )}

          {/* ── Rodapé / paginação ── */}
          <div className="pp-foot">
            <span className="pp-foot-count">
              {total === 0
                ? 'Nenhum item'
                : `${(pag - 1) * ps + 1}–${Math.min(pag * ps, total)} de ${total} itens`}
            </span>

            <div className="pp-pag">
              <button className="pp-pag-btn" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pag <= 1 || pageSize === 'Todos'}>
                <ChevronLeft size={14} />
              </button>
              {totalPags <= 6
                ? Array.from({ length: totalPags }, (_, i) => i + 1).map(n => (
                    <button key={n} className={`pp-pag-btn${pag === n ? ' pp-pag-btn--on' : ''}`} onClick={() => setPagina(n)}>{n}</button>
                  ))
                : <span className="pp-pag-info">{pag} / {totalPags}</span>
              }
              <button className="pp-pag-btn" onClick={() => setPagina(p => Math.min(totalPags, p + 1))} disabled={pag >= totalPags || pageSize === 'Todos'}>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="pp-pag-size">
              <span>Por página</span>
              {PAGE_OPTS.map(o => (
                <button key={o} className={`pp-pag-btn${pageSize === o ? ' pp-pag-btn--on' : ''}`}
                  onClick={() => { setPageSize(o); setPagina(1); }}>{o}</button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
