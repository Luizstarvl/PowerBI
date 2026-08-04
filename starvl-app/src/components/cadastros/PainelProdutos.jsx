import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { RefreshCw, Search, X, Package, DollarSign, AlertTriangle, TrendingUp, Printer, ChevronLeft, ChevronRight, ArrowLeft, Edit2, Check, ChevronDown } from 'lucide-react';
import { apiFetch } from '../../api';
import ProdutoDetalhe from './ProdutoDetalhe';

const fmtCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum      = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
const fmtPct      = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const PAGE_OPTS = [10, 30, 50, 'Todos'];

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
    // setTimeout garante que o mesmo contextmenu que abriu o menu não o feche na hora
    const t = setTimeout(() => {
      document.addEventListener('mousedown', close);
      document.addEventListener('contextmenu', close);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', close);
      document.removeEventListener('contextmenu', close);
    };
  }, [onClose]);
  return ReactDOM.createPortal(
    <div ref={ref} className="pp-ctx" style={{ position: 'fixed', left: x, top: y, zIndex: 9999 }}>
      <button className="pp-ctx-item" onClick={onEditar}>
        <Edit2 size={15} /> Alterar
      </button>
    </div>,
    document.body
  );
}

function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);

  function handleOpen() {
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    setOpen(o => !o);
  }

  useEffect(() => {
    if (!open) return;
    const close = e => { if (!triggerRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <>
      <button ref={triggerRef} className="pm-select-trigger" onClick={handleOpen}>
        <span>{value}</span>
        <ChevronDown size={12} style={{ flexShrink: 0, transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && ReactDOM.createPortal(
        <div className="pm-select-drop" style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}>
          {options.map(opt => (
            <div key={opt}
              className={`pm-select-opt${opt === value ? ' pm-select-opt--on' : ''}`}
              onMouseDown={() => { onChange(opt); setOpen(false); }}>
              {opt === value && <Check size={11} />}
              {opt}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

function gerarJanelaPrint({ titulo, colunas, linhas, empresa, det, filtros }) {
  const fmtC = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtN = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
  const fmtP = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const now  = new Date().toLocaleString('pt-BR');

  // KPIs calculados das linhas filtradas
  const matchAtivo = v => { const s = String(v||'').trim().toLowerCase(); return s==='ativo'||s==='a'; };
  const ativos   = linhas.filter(r => matchAtivo(r[det.situacao])).length;
  const inativos = linhas.length - ativos;
  const semEst   = det.estoque ? linhas.filter(r => Number(r[det.estoque]||0) <= 0).length : 0;
  const valorEst = (det.estoque && det.preco)
    ? linhas.reduce((acc, r) => acc + Number(r[det.estoque]||0) * Number(r[det.preco]||0), 0)
    : null;
  const margens  = (det.preco && det.custo)
    ? linhas.map(r => { const p=Number(r[det.preco]||0),c=Number(r[det.custo]||0); return p>0?((p-c)/p)*100:null; }).filter(m=>m!==null)
    : [];
  const margem   = margens.length ? margens.reduce((a,b)=>a+b,0)/margens.length : null;

  const kpiCards = [
    { label: 'Total de Produtos', value: fmtN.format(linhas.length), sub: `${ativos} ativos · ${inativos} inativos` },
    valorEst !== null && { label: 'Valor em Estoque', value: fmtC.format(valorEst), sub: 'preço × estoque' },
    det.estoque && { label: 'Sem Estoque', value: fmtN.format(semEst), sub: 'saldo zerado' },
    margem !== null && { label: 'Margem Média', value: `${fmtP.format(margem)}%`, sub: '(venda − custo) / venda' },
  ].filter(Boolean);

  const kpiHtml = kpiCards.map(k => `
    <div class="kpi-card">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-sub">${k.sub}</div>
    </div>`).join('');

  // Tags de filtros ativos
  const filtroTags = Object.entries(filtros)
    .filter(([, v]) => v)
    .map(([, v]) => `<span class="ftag">${v}</span>`).join('');

  // Tabela
  const thead = colunas.map(c =>
    `<th${c.currency||c.estoque?' class="r"':''}>${c.label}</th>`).join('');

  const tbody = linhas.map((row, i) => {
    const cells = colunas.map(c => {
      const raw = c.calc ? c.calc(row) : row[c.key];
      let val;
      if (c.badge) {
        const v = String(raw||'').trim().toLowerCase();
        val = `<span class="badge ${matchAtivo(raw)?'badge-ok':'badge-off'}">${matchAtivo(raw)?'Ativo':'Inativo'}</span>`;
      } else if (c.currency) {
        val = fmtC.format(Number(raw)||0);
      } else if (c.estoque) {
        val = `<span class="${Number(raw)<=0?'est-zero':''}">${fmtN.format(Number(raw)||0)}</span>`;
      } else {
        val = String(raw??'—');
      }
      return `<td${c.currency||c.estoque?' class="r"':''}>${val}</td>`;
    }).join('');
    return `<tr class="${i%2===0?'even':'odd'}">${cells}</tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>${titulo}</title>
<style>
@page { size: A4 landscape; margin: 18mm 14mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5px; color: #1a1a1a; background: #f3f4f6; }
.preview-wrap { max-width: 1100px; margin: 0 auto; background: #fff; padding: 28px 32px; min-height: 100vh; }

/* ── Cabeçalho ── */
.report-header { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 12px; margin-bottom: 4px; border-bottom: 3px solid #f97316; }
.report-brand { display: flex; flex-direction: column; gap: 2px; }
.report-brand-name { font-size: 10px; font-weight: 700; color: #f97316; letter-spacing: .1em; text-transform: uppercase; }
.report-title { font-size: 20px; font-weight: 700; color: #111; line-height: 1.15; }
.report-meta { text-align: right; font-size: 9.5px; color: #777; line-height: 1.7; }
.report-meta strong { color: #333; }

/* ── Filtros ativos ── */
.filters-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: 10px 0 14px; }
.filters-label { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #999; font-weight: 700; }
.ftag { background: #fff3e8; color: #c2410c; border: 1px solid #fed7aa; border-radius: 12px; padding: 2px 9px; font-size: 9px; font-weight: 600; }

/* ── KPI cards ── */
.kpi-row { display: grid; grid-template-columns: repeat(${kpiCards.length}, 1fr); gap: 10px; margin-bottom: 16px; }
.kpi-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; border-left: 4px solid #f97316; }
.kpi-label { font-size: 9px; text-transform: uppercase; letter-spacing: .06em; color: #888; font-weight: 700; margin-bottom: 3px; }
.kpi-value { font-size: 17px; font-weight: 700; color: #111; line-height: 1.1; }
.kpi-sub { font-size: 9px; color: #aaa; margin-top: 2px; }

/* ── Tabela ── */
.section-title { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #999; font-weight: 700; margin-bottom: 6px; }
table { width: 100%; border-collapse: collapse; }
thead tr { background: #f97316; }
th { padding: 7px 9px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #fff; white-space: nowrap; }
th.r { text-align: right; }
td { padding: 5.5px 9px; font-size: 10px; border-bottom: 1px solid #f0f0f0; color: #222; vertical-align: middle; }
td.r { text-align: right; font-variant-numeric: tabular-nums; }
tr.odd td { background: #fafafa; }
tr.even td { background: #fff; }
tr:last-child td { border-bottom: none; }
.badge { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 9px; font-weight: 700; }
.badge-ok  { background: #dcfce7; color: #15803d; }
.badge-off { background: #f3f4f6; color: #6b7280; }
.est-zero  { color: #dc2626; font-weight: 600; }

/* ── Rodapé ── */
.report-footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
.report-footer-left { font-size: 9px; color: #bbb; }
.report-footer-right { font-size: 9px; color: #bbb; }

@media print {
  body { background: #fff; }
  .preview-wrap { padding: 0; box-shadow: none; }
}
</style></head><body>
<div class="preview-wrap">
<div class="report-header">
  <div class="report-brand">
    <span class="report-brand-name">Eclipse · Sistema de Gestão de Postos</span>
    <span class="report-title">${titulo}</span>
  </div>
  <div class="report-meta">
    <strong>Empresa:</strong> ${empresa}<br>
    <strong>Gerado em:</strong> ${now}<br>
    <strong>Total de registros:</strong> ${linhas.length}
  </div>
</div>

${filtroTags ? `<div class="filters-row"><span class="filters-label">Filtros aplicados</span>${filtroTags}</div>` : ''}

<div class="kpi-row">${kpiHtml}</div>

<div class="section-title">Listagem de Produtos</div>
<table>
  <thead><tr>${thead}</tr></thead>
  <tbody>${tbody}</tbody>
</table>

<div class="report-footer">
  <span class="report-footer-left">Eclipse · Sistema de Gestão de Postos · ${empresa}</span>
  <span class="report-footer-right">Gerado em ${now}</span>
</div>
</div>

</body></html>`;

  return html;
}

function PrintPreview({ html, titulo, total, empresa, onClose }) {
  const iframeRef = useRef(null);

  function handlePrint() {
    iframeRef.current?.contentWindow?.print();
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className="prv-overlay">
      {/* ── Topbar do preview ── */}
      <div className="prv-bar">
        <div className="prv-bar-left">
          <button className="prv-btn-close" onClick={onClose}>
            <X size={14} /> Fechar
          </button>
          <div className="prv-bar-divider" />
          <div className="prv-bar-info">
            <span className="prv-bar-title">{titulo}</span>
            <span className="prv-bar-meta">{total} produto{total !== 1 ? 's' : ''} · {empresa}</span>
          </div>
        </div>
        <button className="prv-btn-print" onClick={handlePrint}>
          <Printer size={14} /> Imprimir
        </button>
      </div>

      {/* ── Área do relatório ── */}
      <div className="prv-content">
        <iframe
          ref={iframeRef}
          className="prv-iframe"
          srcDoc={html}
          title="Preview do Relatório"
        />
      </div>
    </div>,
    document.body
  );
}

function PrintModal({ secoes, grupos, tabelaCols, sortedFiltradas, det, empresa, onClose, onPreview }) {
  const [titulo,      setTitulo]      = useState('Cadastro de Produtos');
  const [pSituacao,   setPSituacao]   = useState('Ativos');
  const [pSecao,      setPSecao]      = useState('Todas');
  const [pGrupo,      setPGrupo]      = useState('Todos');
  const [pSemEst,     setPSemEst]     = useState(false);
  const [pColKeys,    setPColKeys]    = useState(() => tabelaCols.map(c => c.key));

  const matchSituacao = (val, tipo) => {
    const v = String(val || '').trim().toLowerCase();
    if (tipo === 'Ativos')   return v === 'ativo'   || v === 'a';
    if (tipo === 'Inativos') return v === 'inativo' || v === 'i';
    return true;
  };

  const norm = s => String(s || '').trim().toLowerCase();

  const linhas = useMemo(() => {
    let r = sortedFiltradas;
    if (pSituacao !== 'Todos' && det.situacao) r = r.filter(row => matchSituacao(row[det.situacao], pSituacao));
    if (pSecao !== 'Todas'  && det.secao)  r = r.filter(row => norm(row[det.secao])  === norm(pSecao));
    if (pGrupo !== 'Todos'  && det.grupo)  r = r.filter(row => norm(row[det.grupo])  === norm(pGrupo));
    if (pSemEst && det.estoque) r = r.filter(row => Number(row[det.estoque] || 0) <= 0);
    return r;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedFiltradas, pSituacao, pSecao, pGrupo, pSemEst, det]);

  const colunasSel = tabelaCols.filter(c => pColKeys.includes(c.key));

  function toggleCol(key) {
    setPColKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  function handlePrint() {
    if (!colunasSel.length) return;
    const filtros = {
      situacao: pSituacao !== 'Todos' ? `Situação: ${pSituacao}` : '',
      secao:    pSecao  !== 'Todas'  ? `Seção: ${pSecao}`       : '',
      grupo:    pGrupo  !== 'Todos'  ? `Grupo: ${pGrupo}`       : '',
      semEst:   pSemEst               ? 'Sem estoque'            : '',
    };
    const html = gerarJanelaPrint({ titulo, colunas: colunasSel, linhas, empresa, det, filtros });
    onPreview({ html, titulo, total: linhas.length, empresa });
    onClose();
  }

  return ReactDOM.createPortal(
    <div className="pm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pm-modal">
        <div className="pm-header">
          <Printer size={16} />
          <span>Configurar Impressão</span>
          <button className="pm-close" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="pm-body">
          {/* Título */}
          <div className="pm-section">
            <div className="pm-section-title">Título do relatório</div>
            <input
              className="pm-input"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Título da impressão"
            />
          </div>

          {/* Filtros */}
          <div className="pm-section">
            <div className="pm-section-title">Filtros de dados</div>
            <div className="pm-grid2">
              <div className="pm-field">
                <label>Situação</label>
                <div className="pm-tabs">
                  {['Ativos', 'Inativos', 'Todos'].map(s => (
                    <button key={s} className={`pm-tab${pSituacao === s ? ' pm-tab--on' : ''}`}
                      onClick={() => setPSituacao(s)}>{s}</button>
                  ))}
                </div>
              </div>

              {secoes.length > 1 && (
                <div className="pm-field">
                  <label>Seção</label>
                  <CustomSelect value={pSecao} options={secoes} onChange={v => { setPSecao(v); setPGrupo('Todos'); }} />
                </div>
              )}

              {grupos.length > 1 && (
                <div className="pm-field">
                  <label>Grupo</label>
                  <CustomSelect value={pGrupo} options={grupos} onChange={setPGrupo} />
                </div>
              )}

              {det.estoque && (
                <div className="pm-field pm-field--inline">
                  <button className={`pm-chip${pSemEst ? ' pm-chip--on' : ''}`} onClick={() => setPSemEst(v => !v)}>
                    {pSemEst && <Check size={11} />} Somente sem estoque
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Colunas */}
          <div className="pm-section">
            <div className="pm-section-title">Colunas a exibir</div>
            <div className="pm-cols-grid">
              {tabelaCols.map(c => (
                <button
                  key={c.key}
                  className={`pm-col-chip${pColKeys.includes(c.key) ? ' pm-col-chip--on' : ''}`}
                  onClick={() => toggleCol(c.key)}
                >
                  {pColKeys.includes(c.key) && <Check size={11} />}
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pm-preview-count">
            {linhas.length} produto{linhas.length !== 1 ? 's' : ''} · {colunasSel.length} coluna{colunasSel.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="pm-footer">
          <button className="pm-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="pm-btn-print" onClick={handlePrint} disabled={!colunasSel.length}>
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>
    </div>,
    document.body
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
  const [sortCol,    setSortCol]    = useState(null);
  const [sortDir,    setSortDir]    = useState('asc');
  const [situacao,   setSituacao]   = useState('Ativos');
  const [semEstoque, setSemEstoque] = useState(false);
  const [pagina,     setPagina]     = useState(1);
  const [pageSize,   setPageSize]   = useState(10);
  const [detalhe,    setDetalhe]    = useState(null);
  const [ctxMenu,    setCtxMenu]    = useState(null); // {x,y,row}
  const [fotosMap,   setFotosMap]   = useState({});
  const [printOpen,   setPrintOpen]   = useState(false);
  const [previewData, setPreviewData] = useState(null);

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

  // Busca fotos (POST para não ter limite de URL com muitos produtos)
  useEffect(() => {
    if (!rows.length || !empresa || !det.codigo) return;
    const codes = [...new Set(rows.map(r => String(r[det.codigo] ?? '')).filter(Boolean))];
    if (!codes.length) return;
    apiFetch(`/api/produto-extra/batch/${encodeURIComponent(empresa)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes }),
    })
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

    // Helper: quais descrições de grupo aparecem nos produtos da seção selecionada
    const gruposNaSecao = () => {
      if (!det.grupo) return null;
      const base = secao === 'Todas'
        ? rows
        : rows.filter(r => norm(r[det.secao]) === norm(secao));
      return new Set(base.map(r => norm(r[det.grupo])).filter(Boolean));
    };

    if (gruposExt.length) {
      let lista = gruposExt;
      if (secao !== 'Todas') {
        const temRelacao = gruposExt.some(g => g.cod_secao !== null);
        if (temRelacao) {
          // GPRO tem coluna de vínculo: filtra por cod_secao
          const secaoObj = secoesExt.find(s => norm(s.desc) === norm(secao));
          if (secaoObj) lista = gruposExt.filter(g => g.cod_secao === secaoObj.cod);
        } else {
          // GPRO sem vínculo: usa os produtos para descobrir quais grupos pertencem à seção
          const permitidos = gruposNaSecao();
          if (permitidos && permitidos.size > 0) {
            lista = gruposExt.filter(g => permitidos.has(norm(g.desc)));
          }
        }
      }
      return ['Todos', ...lista.map(g => g.desc).filter(Boolean)];
    }

    // Sem GPRO: deriva direto das linhas
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
    const semEst   = (det.situacao ? ativos : rows).filter(r => Number(r[det.estoque] || 0) <= 0);

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

  const sortedFiltradas = useMemo(() => {
    if (!sortCol) return filtradas;
    const col = tabelaCols.find(c => c.key === sortCol);
    if (!col) return filtradas;
    return [...filtradas].sort((a, b) => {
      const va = col.calc ? col.calc(a) : a[sortCol];
      const vb = col.calc ? col.calc(b) : b[sortCol];
      if (col.currency || col.estoque) {
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

  const total     = sortedFiltradas.length;
  const ps        = pageSize === 'Todos' ? total : pageSize;
  const totalPags = Math.max(1, Math.ceil(total / (ps || 1)));
  const pag       = Math.min(pagina, totalPags);
  const pagRows   = pageSize === 'Todos' ? sortedFiltradas : sortedFiltradas.slice((pag - 1) * ps, pag * ps);

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
          <button className="pp-btn-ghost" onClick={() => setPrintOpen(true)}>
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

      {/* ── Barra de filtros (linha única) ── */}
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

        <button
          className={`pp-chip${semEstoque ? ' pp-chip--on' : ''}`}
          onClick={() => { setSemEstoque(v => !v); setPagina(1); }}>
          Sem estoque
        </button>

        <button className="pp-btn-ghost pp-btn-ghost--sm pp-bar-limpar" onClick={limpar}>
          <X size={12} /> Limpar
        </button>
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
                  {tabelaCols.map((c, i) => {
                    const isActive = sortCol === c.key;
                    return (
                      <th
                        key={c.key}
                        className={[
                          'pp-th pp-th--sortable',
                          c.currency || c.estoque ? 'pp-th--r' : '',
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
                                 <span className="pp-td-avatar">
                                   {fotosMap[String(row[det.codigo] ?? '')]
                                     ? <img src={fotosMap[String(row[det.codigo] ?? '')]} alt="" className="pp-td-thumb" />
                                     : String(raw ?? '').charAt(0).toUpperCase()
                                   }
                                 </span>
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

      {/* ── Modal de impressão ── */}
      {printOpen && (
        <PrintModal
          secoes={secoes}
          grupos={grupos}
          tabelaCols={tabelaCols}
          sortedFiltradas={sortedFiltradas}
          det={det}
          empresa={empresa}
          onClose={() => setPrintOpen(false)}
          onPreview={data => setPreviewData(data)}
        />
      )}

      {/* ── Preview fullscreen ── */}
      {previewData && (
        <PrintPreview
          html={previewData.html}
          titulo={previewData.titulo}
          total={previewData.total}
          empresa={previewData.empresa}
          onClose={() => setPreviewData(null)}
        />
      )}
    </div>
  );
}
