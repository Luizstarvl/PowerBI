import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Search, X, Package, DollarSign, AlertTriangle, TrendingUp, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '../../api';

const fmtCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum      = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
const fmtPct      = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const PAGE_OPTS = [15, 30, 50, 'Todos'];

function detectCols(columns) {
  // Match exato (^ $) tem prioridade; fallback para parcial
  const exact = pat => columns.find(c => new RegExp(`^(${pat})$`, 'i').test(c)) || null;
  const find  = pat => columns.find(c => new RegExp(pat, 'i').test(c)) || null;
  return {
    // "descricao" exato antes de tentar qualquer coisa com "produto"
    nome:     exact('descricao|nome|proddescricao|descricao_produto')
              || find('descricao(?!_)'),
    codigo:   exact('cod_produto|codigo|prodcodigo|cod|code'),
    barra:    exact('cod_barra|barra|ean|gtin'),
    secao:    find('descricao_secao|secao'),
    grupo:    find('descricao_grupo|grupo'),
    estoque:  find('estoque|kardex'),
    preco:    exact('preco_venda1|preco_venda|preco') || find('preco(?!_venda2)'),
    custo:    exact('custo|custo_medio|e_prodcusto') || find('custo'),
    situacao: exact('situacao|status|ativo|inativo') || find('situacao|status'),
  };
}

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="pp-kpi" style={{ '--pp-accent': accent }}>
      <div className="pp-kpi-icon-wrap">
        <Icon size={18} />
      </div>
      <div className="pp-kpi-body">
        <span className="pp-kpi-label">{label}</span>
        <strong className="pp-kpi-value">{value}</strong>
        {sub && <span className="pp-kpi-sub">{sub}</span>}
      </div>
    </div>
  );
}

function SituacaoBadge({ value }) {
  const ativo = /ativo/i.test(String(value));
  return (
    <span className={`pp-badge ${ativo ? 'pp-badge--ok' : 'pp-badge--off'}`}>
      <span className="pp-badge-dot" />
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  );
}

function EstoqueCell({ value }) {
  const n = Number(value) || 0;
  return (
    <span className={`pp-estoque${n <= 0 ? ' pp-estoque--zero' : ''}`}>
      {fmtNum.format(n)}
    </span>
  );
}

export default function PainelProdutos({ empresasKey }) {
  const [slotQuery,  setSlotQuery]  = useState(undefined);
  const [rows,       setRows]       = useState([]);
  const [cols,       setCols]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [erro,       setErro]       = useState('');

  const [busca,      setBusca]      = useState('');
  const [secao,      setSecao]      = useState('Todas');
  const [grupo,      setGrupo]      = useState('Todos');
  const [situacao,   setSituacao]   = useState('Ativos');
  const [semEstoque, setSemEstoque] = useState(false);
  const [pagina,     setPagina]     = useState(1);
  const [pageSize,   setPageSize]   = useState(15);

  const empresa = (empresasKey || '').split(',')[0];
  const det = useMemo(() => detectCols(cols), [cols]);

  useEffect(() => {
    apiFetch('/api/queries?ativa=true&slot=cadastro_produtos')
      .then(r => r.json())
      .then(d => setSlotQuery(Array.isArray(d) && d.length ? d[0] : null))
      .catch(() => setSlotQuery(null));
  }, []);

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

  const secoes = useMemo(() => {
    if (!det.secao) return [];
    return ['Todas', ...new Set(rows.map(r => r[det.secao]).filter(Boolean))];
  }, [rows, det.secao]);

  const grupos = useMemo(() => {
    if (!det.grupo) return [];
    const base = secao === 'Todas' ? rows : rows.filter(r => r[det.secao] === secao);
    return ['Todos', ...new Set(base.map(r => r[det.grupo]).filter(Boolean))];
  }, [rows, det.secao, det.grupo, secao]);

  const kpis = useMemo(() => {
    const ativos   = rows.filter(r => /ativo/i.test(String(r[det.situacao] || '')));
    const inativos = rows.filter(r => /inativo/i.test(String(r[det.situacao] || '')));
    const semEst   = rows.filter(r => Number(r[det.estoque] || 0) <= 0);

    const valorTotal = rows.reduce((acc, r) =>
      acc + (Number(r[det.estoque] || 0) * Number(r[det.preco] || 0)), 0);

    const margens = rows.map(r => {
      const p = Number(r[det.preco] || 0);
      const c = Number(r[det.custo] || 0);
      return p > 0 ? ((p - c) / p) * 100 : null;
    }).filter(m => m !== null);
    const margemMedia = margens.length ? margens.reduce((a, b) => a + b, 0) / margens.length : 0;

    return { total: rows.length, ativos: ativos.length, inativos: inativos.length, semEst: semEst.length, valorTotal, margemMedia };
  }, [rows, det]);

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
    if (secao !== 'Todas' && det.secao)      r = r.filter(row => row[det.secao] === secao);
    if (grupo !== 'Todos' && det.grupo)      r = r.filter(row => row[det.grupo] === grupo);
    if (situacao === 'Ativos'   && det.situacao) r = r.filter(row =>  /ativo/i.test(String(row[det.situacao] || '')));
    if (situacao === 'Inativos' && det.situacao) r = r.filter(row => /inativo/i.test(String(row[det.situacao] || '')));
    if (semEstoque && det.estoque) r = r.filter(row => Number(row[det.estoque] || 0) <= 0);
    return r;
  }, [rows, busca, secao, grupo, situacao, semEstoque, det]);

  const total     = filtradas.length;
  const ps        = pageSize === 'Todos' ? total : pageSize;
  const totalPags = Math.max(1, Math.ceil(total / (ps || 1)));
  const pag       = Math.min(pagina, totalPags);
  const pagRows   = pageSize === 'Todos' ? filtradas : filtradas.slice((pag - 1) * ps, pag * ps);

  function limpar() {
    setBusca(''); setSecao('Todas'); setGrupo('Todos');
    setSituacao('Ativos'); setSemEstoque(false); setPagina(1);
  }

  const tabelaCols = useMemo(() => [
    det.nome     && { key: det.nome,     label: 'Produto',        name: true },
    det.codigo   && { key: det.codigo,   label: 'Código' },
    det.secao    && { key: det.secao,    label: 'Seção' },
    det.grupo    && { key: det.grupo,    label: 'Grupo' },
    det.estoque  && { key: det.estoque,  label: 'Estoque',        estoque: true },
    det.preco    && { key: det.preco,    label: 'Preço Venda',    currency: true },
    det.custo    && { key: det.custo,    label: 'Custo',          currency: true },
    det.estoque && det.preco && { key: '__ve', label: 'Vl. Estoque', currency: true, calc: r => Number(r[det.estoque]||0)*Number(r[det.preco]||0) },
    det.situacao && { key: det.situacao, label: 'Situação',       badge: true },
  ].filter(Boolean), [det]);

  if (slotQuery === null) {
    return (
      <div className="tc-empty-state">
        <Package size={36} className="tc-empty-icon" />
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

      {/* ── Cabeçalho ── */}
      <div className="pp-header">
        <div className="pp-header-left">
          <h2 className="pp-title">Gerenciamento de Produtos</h2>
          <p className="pp-subtitle">Conveniência · {empresa || '—'}</p>
        </div>
        <div className="pp-header-actions">
          <button className="pp-btn-ghost" onClick={() => window.print()}>
            <Printer size={14} /> Imprimir
          </button>
          <button className="pp-btn-primary" onClick={fetchDados} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'pp-spin' : ''} />
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>
      </div>

      {erro && <p className="form-erro">{erro}</p>}

      {/* ── KPIs ── */}
      <div className="pp-kpi-grid">
        <KpiCard icon={Package}       label="Total de Produtos"      value={kpis.total}                            sub={`${kpis.ativos} ativos · ${kpis.inativos} inativos`} accent="#f97316" />
        <KpiCard icon={DollarSign}    label="Valor em Estoque"       value={fmtCurrency.format(kpis.valorTotal)}  sub="preço de venda × estoque"                            accent="#22c55e" />
        <KpiCard icon={AlertTriangle} label="Sem Estoque"            value={kpis.semEst}                          sub="produtos com saldo zero"                             accent="#f59e0b" />
        <KpiCard icon={TrendingUp}    label="Margem Média"           value={`${fmtPct.format(kpis.margemMedia)}%`} sub="(venda − custo) / venda"                            accent="#a78bfa" />
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

        {grupos.length > 1 && (
          <div className="pp-bar-field">
            <label>Grupo</label>
            <select value={grupo} onChange={e => { setGrupo(e.target.value); setPagina(1); }}>
              {grupos.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
        )}

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

        <button
          className={`pp-chip${semEstoque ? ' pp-chip--on' : ''}`}
          onClick={() => { setSemEstoque(v => !v); setPagina(1); }}>
          Sem estoque
        </button>

        <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={limpar}>
          <X size={12} /> Limpar
        </button>
      </div>

      {/* ── Tabela ── */}
      <div className="pp-table-scroll">
        {loading && !rows.length ? (
          <div className="pp-loading">
            <RefreshCw size={18} className="pp-spin" />
            <span>Carregando produtos…</span>
          </div>
        ) : (
          <table className="pp-table">
            <thead>
              <tr className="pp-thead-row">
                {tabelaCols.map((c, i) => (
                  <th key={c.key} className={`pp-th${c.currency || c.estoque ? ' pp-th--r' : ''}${i === 0 ? ' pp-th--first' : ''}`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagRows.length === 0 ? (
                <tr>
                  <td colSpan={tabelaCols.length} className="pp-empty-cell">
                    Nenhum produto encontrado{busca ? ` para "${busca}"` : ''}.
                  </td>
                </tr>
              ) : pagRows.map((row, i) => (
                <tr key={i} className="pp-tr">
                  {tabelaCols.map((c, ci) => {
                    const raw = c.calc ? c.calc(row) : row[c.key];
                    return (
                      <td key={c.key} className={[
                        'pp-td',
                        c.currency || c.estoque ? 'pp-td--r' : '',
                        ci === 0 ? 'pp-td--name' : '',
                      ].filter(Boolean).join(' ')}>
                        {c.badge    ? <SituacaoBadge value={raw} />
                         : c.estoque  ? <EstoqueCell value={raw} />
                         : c.currency ? fmtCurrency.format(Number(raw) || 0)
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

      {/* ── Rodapé ── */}
      <div className="pp-foot">
        <span className="pp-foot-count">
          {total === 0
            ? 'Nenhum produto'
            : `${(pag - 1) * ps + 1}–${Math.min(pag * ps, total)} de ${total} produtos`}
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
  );
}
