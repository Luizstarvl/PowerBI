import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Search, X, Package, DollarSign, AlertTriangle, TrendingUp, Printer, ChevronLeft, ChevronRight, ArrowLeft, Edit2 } from 'lucide-react';
import { apiFetch } from '../../api';
import ProdutoDetalhe from './ProdutoDetalhe';

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
    secao:    exact('descricao_secao|nome_secao|secao_descricao') || exact('secao'),
    grupo:    exact('descricao_grupo|nome_grupo|grupo_descricao') || exact('grupo'),
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
  const v = String(value || '').trim().toLowerCase();
  const ativo = v === 'ativo' || v === 'a';
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

function CtxProduto({ x, y, onEditar, onClose }) {
  const ref = React.useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.right  > window.innerWidth)  el.style.left = `${x - rect.width}px`;
    if (rect.bottom > window.innerHeight) el.style.top  = `${y - rect.height}px`;
  }, [x, y]);
  useEffect(() => {
    const close = e => { if (!ref.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', close);
    document.addEventListener('contextmenu', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('contextmenu', close); };
  }, [onClose]);
  return (
    <div ref={ref} className="pp-ctx" style={{ position: 'fixed', left: x, top: y, zIndex: 9999 }}>
      <button className="pp-ctx-item" onClick={onEditar}>
        <Edit2 size={13} /> Alterar Cadastro
      </button>
    </div>
  );
}

export default function PainelProdutos({ empresasKey, onVoltar }) {
  const [slotQuery,   setSlotQuery]   = useState(undefined);
  const [slotSecoes,  setSlotSecoes]  = useState(null); // query dedicada para SPRO
  const [slotGrupos,  setSlotGrupos]  = useState(null); // query dedicada para GPRO
  const [rows,        setRows]        = useState([]);
  const [cols,        setCols]        = useState([]);
  const [secoesExt,   setSecoesExt]   = useState([]); // [{cod, desc}] de SPRO
  const [gruposExt,   setGruposExt]   = useState([]); // [{cod, desc, cod_secao}] de GPRO
  const [loading,     setLoading]     = useState(false);
  const [erro,        setErro]        = useState('');

  const [busca,      setBusca]      = useState('');
  const [secao,      setSecao]      = useState('Todas');
  const [grupo,      setGrupo]      = useState('Todos');
  const [situacao,   setSituacao]   = useState('Ativos');
  const [semEstoque, setSemEstoque] = useState(false);
  const [pagina,     setPagina]     = useState(1);
  const [pageSize,   setPageSize]   = useState(15);
  const [detalhe,    setDetalhe]    = useState(null);
  const [ctxMenu,    setCtxMenu]    = useState(null); // {x,y,row}
  const [fotosMap,   setFotosMap]   = useState({});

  const empresa = (empresasKey || '').split(',')[0];
  const det = useMemo(() => detectCols(cols), [cols]);

  // Busca os 3 slots: produtos, seções (SPRO), grupos (GPRO)
  useEffect(() => {
    const fetchSlot = slot =>
      apiFetch(`/api/queries?ativa=true&slot=${slot}`)
        .then(r => r.json())
        .then(d => (Array.isArray(d) && d.length ? d[0] : null))
        .catch(() => null);

    Promise.all([
      fetchSlot('cadastro_produtos'),
      fetchSlot('cadastro_secoes'),
      fetchSlot('cadastro_grupos'),
    ]).then(([q, qs, qg]) => {
      setSlotQuery(q);
      setSlotSecoes(qs);
      setSlotGrupos(qg);
    });
  }, []);

  // Executa SPRO e GPRO quando os slots estiverem prontos
  useEffect(() => {
    if (!empresa) return;
    if (slotSecoes) {
      apiFetch(`/api/queries/execute/${slotSecoes.codigo}?empresa=${empresa}`)
        .then(r => r.json())
        .then(d => {
          if (!d.ok || !d.rows?.length) return;
          // Detecta colunas: primeiro é código, segundo é descrição
          const [codCol, descCol] = d.columns;
          // Detecta coluna de seção pai (para GPRO) — pode ser null aqui
          setSecoesExt(d.rows.map(r => ({ cod: String(r[codCol] ?? ''), desc: String(r[descCol] ?? '') })));
        })
        .catch(() => {});
    }
    if (slotGrupos) {
      apiFetch(`/api/queries/execute/${slotGrupos.codigo}?empresa=${empresa}`)
        .then(r => r.json())
        .then(d => {
          if (!d.ok || !d.rows?.length) return;
          // Espera colunas: cod_grupo, descricao, cod_secao (terceira coluna opcional)
          const [codCol, descCol, codSecaoCol] = d.columns;
          setGruposExt(d.rows.map(r => ({
            cod:      String(r[codCol]      ?? ''),
            desc:     String(r[descCol]     ?? ''),
            cod_secao: codSecaoCol ? String(r[codSecaoCol] ?? '') : null,
          })));
        })
        .catch(() => {});
    }
  }, [slotSecoes, slotGrupos, empresa]);

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

  // Busca fotos salvas para mostrar thumbnail na listagem
  useEffect(() => {
    if (!rows.length || !empresa || !det.codigo) return;
    const codes = [...new Set(rows.map(r => r[det.codigo]).filter(Boolean))].slice(0, 500);
    if (!codes.length) return;
    apiFetch(`/api/produto-extra/batch/${encodeURIComponent(empresa)}?codes=${codes.map(encodeURIComponent).join(',')}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setFotosMap(d.data); })
      .catch(() => {});
  }, [rows, empresa, det.codigo]);

  // Seções: usa SPRO se configurado, senão deriva das linhas
  const secoes = useMemo(() => {
    if (secoesExt.length) {
      return ['Todas', ...secoesExt.map(s => s.desc).filter(Boolean)];
    }
    if (!det.secao) return [];
    return ['Todas', ...new Set(rows.map(r => r[det.secao]).filter(Boolean))];
  }, [secoesExt, rows, det.secao]);

  // Grupos: usa GPRO se configurado (com filtro por seção), senão deriva das linhas
  const grupos = useMemo(() => {
    const norm = s => String(s || '').trim().toLowerCase();
    if (gruposExt.length) {
      let lista = gruposExt;
      const temRelacao = gruposExt.some(g => g.cod_secao !== null);
      if (secao !== 'Todas' && temRelacao) {
        const secaoObj = secoesExt.find(s => norm(s.desc) === norm(secao));
        if (secaoObj) lista = gruposExt.filter(g => g.cod_secao === secaoObj.cod);
      }
      return ['Todos', ...lista.map(g => g.desc).filter(Boolean)];
    }
    if (!det.grupo) return [];
    const base = secao === 'Todas'
      ? rows
      : rows.filter(r => norm(r[det.secao]) === norm(secao));
    return ['Todos', ...new Set(base.map(r => r[det.grupo]).filter(Boolean))];
  }, [gruposExt, secoesExt, rows, det.secao, det.grupo, secao]);

  // Helper para comparar situação sem falso positivo (ativo dentro de inativo)
  const matchSituacao = (val, tipo) => {
    const v = String(val || '').trim().toLowerCase();
    if (tipo === 'Ativos')   return v === 'ativo'   || v === 'a';
    if (tipo === 'Inativos') return v === 'inativo' || v === 'i';
    return true;
  };

  const kpis = useMemo(() => {
    const ativos   = rows.filter(r => matchSituacao(r[det.situacao], 'Ativos'));
    const inativos = rows.filter(r => matchSituacao(r[det.situacao], 'Inativos'));
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
    const norm = s => String(s || '').trim().toLowerCase();
    if (secao !== 'Todas' && det.secao) r = r.filter(row => norm(row[det.secao]) === norm(secao));
    if (grupo !== 'Todos' && det.grupo) r = r.filter(row => norm(row[det.grupo]) === norm(grupo));
    if (situacao !== 'Todos' && det.situacao) r = r.filter(row => matchSituacao(row[det.situacao], situacao));
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
          {onVoltar && (
            <button className="pp-back" onClick={onVoltar}>
              <ArrowLeft size={14} /> Voltar
            </button>
          )}
          <div className="pp-header-title-group">
            <h2 className="pp-title">Cadastro de Produtos</h2>
            <p className="pp-subtitle">Conveniência · {empresa || '—'}</p>
          </div>
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
        {/* Linha 1 — busca */}
        <div className="pp-bar-top">
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
          <button className="pp-btn-ghost pp-btn-ghost--sm" onClick={limpar}>
            <X size={12} /> Limpar
          </button>
        </div>

        {/* Linha 2 — filtros */}
        <div className="pp-bar-filters">
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

          <button
            className={`pp-chip${semEstoque ? ' pp-chip--on' : ''}`}
            onClick={() => { setSemEstoque(v => !v); setPagina(1); }}>
            Sem estoque
          </button>
        </div>
      </div>

      {/* ── Tabela ── */}
      <div className="pp-table-wrap">
        {loading && !rows.length ? (
          <div className="pp-loading">
            <RefreshCw size={18} className="pp-spin" />
            <span>Carregando produtos…</span>
          </div>
        ) : (
          <div className="pp-table-scroll">
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
                  <tr key={i} className="pp-tr pp-tr--click"
                    onClick={() => setDetalhe(row)}
                    onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, row }); }}
                  >
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
                           : c.name     ? (
                               <span className="pp-td-name-cell">
                                 {fotosMap[row[det.codigo]] && (
                                   <img src={fotosMap[row[det.codigo]]} alt="" className="pp-td-thumb" />
                                 )}
                                 {raw ?? '—'}
                               </span>
                             )
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

        {/* ── Rodapé dentro do card ── */}
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

      {/* ── Modal detalhe ── */}
      {detalhe && (
        <ProdutoDetalhe
          row={detalhe}
          cols={cols}
          det={det}
          empresa={empresa}
          onClose={() => setDetalhe(null)}
        />
      )}

      {/* ── Menu de contexto ── */}
      {ctxMenu && (
        <CtxProduto
          x={ctxMenu.x} y={ctxMenu.y}
          onEditar={() => { setDetalhe(ctxMenu.row); setCtxMenu(null); }}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
