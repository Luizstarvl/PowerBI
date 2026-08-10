/**
 * Estoque.jsx
 * Módulo de Estoque — alimentado por consultas configuradas no Gerenciador de Consultas.
 *
 * Slots esperados (Parâmetros → Gerenciador de Consultas → categoria Estoque):
 *   estoque_principal  → tabela principal com posição de estoque por produto
 *   estoque_secoes     → (opcional) lista de seções para o filtro
 *   estoque_grupos     → (opcional) lista de grupos para o filtro
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import * as XLSX from 'xlsx';
import { Package, RefreshCw, Search, X, AlertTriangle, DollarSign,
         TrendingDown, ChevronLeft, ChevronRight, Printer, FileDown, Check } from 'lucide-react';
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

// ── Helper: valor bruto formatado para print/excel ───────────────────────────
function rawVal(col, row, det) {
  if (col.calc) return col.calc(row);
  return row[col.key] ?? '';
}

// ── Gerador de HTML para impressão ───────────────────────────────────────────
function gerarHtmlPrint({ titulo, colunas, linhas, empresa, det }) {
  const fmtC = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtN = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
  const now  = new Date().toLocaleString('pt-BR');

  const ativos   = linhas.filter(r => { const v = String(r[det.situacao]||'').toLowerCase(); return v==='ativo'||v==='a'; }).length;
  const zerados  = det.estoque ? linhas.filter(r => Number(r[det.estoque]||0) <= 0).length : 0;
  const valorEst = (det.estoque && det.preco)
    ? linhas.reduce((acc,r) => acc + Number(r[det.estoque]||0)*Number(r[det.preco]||0), 0) : null;

  const kpis = [
    { label:'Total de Itens',   value: fmtN.format(linhas.length),           sub:`${ativos} ativos` },
    valorEst !== null && { label:'Valor em Estoque', value: fmtC.format(valorEst), sub:'preço × saldo' },
    det.estoque && { label:'Zerados', value: fmtN.format(zerados), sub:'saldo ≤ 0' },
  ].filter(Boolean);

  const kpiHtml = kpis.map(k=>`
    <div class="kpi-card">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-sub">${k.sub}</div>
    </div>`).join('');

  const thead = colunas.map(c=>`<th${c.currency||c.estoque||c.num?' class="r"':''}>${c.label}</th>`).join('');

  const tbody = linhas.map((row, i) => {
    const cells = colunas.map(c => {
      const raw = rawVal(c, row, det);
      let val;
      if (c.badge) {
        const v = String(raw||'').toLowerCase();
        const ok = v==='ativo'||v==='a';
        val = `<span class="badge ${ok?'badge-ok':'badge-off'}">${ok?'Ativo':'Inativo'}</span>`;
      } else if (c.currency) {
        val = fmtC.format(Number(raw)||0);
      } else if (c.estoque || c.num) {
        const n = Number(raw)||0;
        val = `<span class="${n<=0?'est-zero':''}">${fmtN.format(n)}</span>`;
      } else {
        val = String(raw??'—');
      }
      return `<td${c.currency||c.estoque||c.num?' class="r"':''}>${val}</td>`;
    }).join('');
    return `<tr class="${i%2===0?'even':'odd'}">${cells}</tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>${titulo}</title>
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
@media screen {
  html { background: #4a4a4a; }
  body { font-family:'Segoe UI',Arial,sans-serif; font-size:10.5px; color:#1a1a1a; background:#4a4a4a; padding:28px 20px; }
  .preview-wrap { width:1060px; margin:0 auto; background:#fff; padding:28px 32px; box-shadow:0 4px 28px rgba(0,0,0,.5); }
  .pg-sep { height:32px; margin:0 -32px; background:#4a4a4a; display:flex; align-items:center; justify-content:center; gap:12px; color:#888; font-size:9px; letter-spacing:.06em; border-top:1px dashed #888; border-bottom:1px dashed #888; }
  .pg-repeat-header th { background:#3b82f6!important; color:#fff!important; padding:7px 9px; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; white-space:nowrap; }
  .pg-repeat-header th.r { text-align:right; }
}
@media print {
  html,body { background:#fff!important; padding:12mm 14mm!important; margin:0!important; }
  .pg-sep-row,.pg-sep,.pg-repeat-header { display:none!important; }
  .preview-wrap { padding:0!important; box-shadow:none!important; width:100%!important; margin:0!important; }
  tr { break-inside:avoid; }
  thead { display:table-header-group; }
}
body { font-family:'Segoe UI',Arial,sans-serif; font-size:10.5px; color:#1a1a1a; }
.preview-wrap { background:#fff; padding:28px 32px; }
.report-header { display:flex; align-items:flex-end; justify-content:space-between; padding-bottom:12px; margin-bottom:4px; border-bottom:3px solid #3b82f6; }
.report-brand-name { font-size:10px; font-weight:700; color:#3b82f6; letter-spacing:.1em; text-transform:uppercase; }
.report-title { font-size:20px; font-weight:700; color:#111; line-height:1.15; }
.report-meta { text-align:right; font-size:9.5px; color:#777; line-height:1.7; }
.report-meta strong { color:#333; }
.kpi-row { display:grid; grid-template-columns:repeat(${kpis.length},1fr); gap:10px; margin-bottom:16px; }
.kpi-card { border:1px solid #e5e7eb; border-radius:8px; padding:10px 14px; border-left:4px solid #3b82f6; }
.kpi-label { font-size:9px; text-transform:uppercase; letter-spacing:.06em; color:#888; font-weight:700; margin-bottom:3px; }
.kpi-value { font-size:17px; font-weight:700; color:#111; line-height:1.1; }
.kpi-sub { font-size:9px; color:#aaa; margin-top:2px; }
.section-title { font-size:9px; text-transform:uppercase; letter-spacing:.08em; color:#999; font-weight:700; margin-bottom:6px; }
table { width:100%; border-collapse:collapse; }
thead tr { background:#3b82f6; }
th { padding:7px 9px; text-align:left; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#fff; white-space:nowrap; }
th.r { text-align:right; }
td { padding:5.5px 9px; font-size:10px; border-bottom:1px solid #f0f0f0; color:#222; vertical-align:middle; }
td.r { text-align:right; font-variant-numeric:tabular-nums; }
tr.odd td { background:#fafafa; }
tr.even td { background:#fff; }
tr:last-child td { border-bottom:none; }
.badge { display:inline-block; padding:1px 7px; border-radius:10px; font-size:9px; font-weight:700; }
.badge-ok  { background:#dcfce7; color:#15803d; }
.badge-off { background:#f3f4f6; color:#6b7280; }
.est-zero  { color:#dc2626; font-weight:600; }
.report-footer { margin-top:16px; padding-top:8px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; }
.report-footer-left,.report-footer-right { font-size:9px; color:#bbb; }
</style></head><body>
<div class="preview-wrap">
<div class="report-header">
  <div>
    <div class="report-brand-name">Eclipse · Sistema de Gestão de Postos</div>
    <div class="report-title">${titulo}</div>
  </div>
  <div class="report-meta">
    <strong>Empresa:</strong> ${empresa}<br>
    <strong>Gerado em:</strong> ${now}<br>
    <strong>Total de registros:</strong> ${linhas.length}
  </div>
</div>
<div class="kpi-row">${kpiHtml}</div>
<div class="section-title">Listagem de Estoque</div>
<table>
  <thead><tr>${thead}</tr></thead>
  <tbody>${tbody}</tbody>
</table>
<div class="report-footer">
  <span class="report-footer-left">Eclipse · ${empresa}</span>
  <span class="report-footer-right">Gerado em ${now}</span>
</div>
</div>
<script>
(function(){
  document.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key==='p'){e.preventDefault();}});
  var PAGE_H=660;
  window.addEventListener('load',function(){
    var wrap=document.querySelector('.preview-wrap');
    var tbody=document.querySelector('tbody');
    var thead=document.querySelector('thead');
    if(!wrap||!tbody||!thead)return;
    var theadHTML=thead.innerHTML;
    var colCount=thead.querySelector('tr')?thead.querySelector('tr').children.length:1;
    var wrapTop=wrap.getBoundingClientRect().top+window.scrollY;
    var rows=Array.from(tbody.querySelectorAll('tr'));
    var pageNum=1;
    var totalPgs=Math.max(1,Math.ceil(wrap.scrollHeight/PAGE_H));
    for(var i=0;i<rows.length;i++){
      var rowBottom=rows[i].getBoundingClientRect().bottom+window.scrollY-wrapTop;
      if(rowBottom>pageNum*PAGE_H){
        var sep=document.createElement('tr');sep.className='pg-sep-row';
        sep.innerHTML='<td colspan="'+colCount+'"><div class="pg-sep">Página '+pageNum+' de '+totalPgs+'</div></td>';
        tbody.insertBefore(sep,rows[i]);rows.splice(i,0,sep);i++;
        var hdrRow=document.createElement('tr');hdrRow.className='pg-repeat-header';
        hdrRow.innerHTML=theadHTML.replace(/<tr[^>]*>/i,'').replace(/<\/tr>/i,'');
        tbody.insertBefore(hdrRow,rows[i]);rows.splice(i,0,hdrRow);i++;
        pageNum++;
      }
    }
  });
})();
</script>
</body></html>`;
}

// ── PrintPreview ──────────────────────────────────────────────────────────────
function PrintPreview({ html, titulo, total, empresa, onClose }) {
  const iframeRef = useRef(null);

  function handlePrint() { iframeRef.current?.contentWindow?.print(); }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); iframeRef.current?.contentWindow?.print(); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className="prv-overlay">
      <div className="prv-bar">
        <div className="prv-bar-left">
          <button className="prv-btn-close" onClick={onClose}>
            <X size={14} /> Fechar
          </button>
          <div className="prv-bar-divider" />
          <div className="prv-bar-info">
            <span className="prv-bar-title">{titulo}</span>
            <span className="prv-bar-meta">{total} item{total !== 1 ? 's' : ''} · {empresa}</span>
          </div>
        </div>
        <button className="prv-btn-print" onClick={handlePrint}>
          <Printer size={14} /> Imprimir
        </button>
      </div>
      <div className="prv-content">
        <iframe ref={iframeRef} className="prv-iframe" srcDoc={html} title="Preview de Impressão" />
      </div>
    </div>,
    document.body
  );
}

// ── PrintModal ────────────────────────────────────────────────────────────────
function PrintModal({ tabelaCols, sortedFiltradas, det, empresa, onClose, onPreview }) {
  const [titulo,   setTitulo]   = useState('Posição de Estoque');
  const [pColKeys, setPColKeys] = useState(() => tabelaCols.map(c => c.key));

  function toggleCol(key) {
    setPColKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  function handlePrint() {
    const colunasSel = tabelaCols.filter(c => pColKeys.includes(c.key));
    if (!colunasSel.length) return;
    const html = gerarHtmlPrint({ titulo, colunas: colunasSel, linhas: sortedFiltradas, empresa, det });
    onPreview({ html, titulo, total: sortedFiltradas.length, empresa });
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
          <div className="pm-section">
            <div className="pm-section-title">Título do relatório</div>
            <input
              className="pm-input"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Título da impressão"
            />
          </div>

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
            {sortedFiltradas.length} item{sortedFiltradas.length !== 1 ? 's' : ''} · {tabelaCols.filter(c => pColKeys.includes(c.key)).length} coluna{tabelaCols.filter(c => pColKeys.includes(c.key)).length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="pm-footer">
          <button className="pm-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="pm-btn-print" onClick={handlePrint} disabled={!pColKeys.length}>
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Export Excel ──────────────────────────────────────────────────────────────
function exportarExcel({ tabelaCols, linhas, empresa, det }) {
  const headers = tabelaCols.map(c => c.label);

  const dataRows = linhas.map(row =>
    tabelaCols.map(c => {
      const raw = rawVal(c, row, det);
      if (c.badge) {
        const v = String(raw||'').toLowerCase();
        return (v==='ativo'||v==='a') ? 'Ativo' : 'Inativo';
      }
      if (c.currency) return Number(raw) || 0;
      if (c.estoque || c.num) return Number(raw) || 0;
      return raw ?? '';
    })
  );

  const wsData = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Largura automática das colunas
  const colWidths = headers.map((h, i) => ({
    wch: Math.max(
      h.length,
      ...dataRows.map(r => String(r[i] ?? '').length)
    ) + 2
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Estoque');

  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  XLSX.writeFile(wb, `estoque_${empresa}_${stamp}.xlsx`);
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function Estoque({ empresas }) {
  const empresa = (empresas || [])[0] || '';

  // Slots
  const [slotPrincipal, setSlotPrincipal] = useState(undefined);
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

  // Print / Export
  const [printOpen,   setPrintOpen]   = useState(false);
  const [previewData, setPreviewData] = useState(null);

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

  // 2. Executa seções e grupos
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
  }, [gruposExt, secoesExt, rows, det, secao]); // eslint-disable-line

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
      ? rows.filter(r => { const e = Number(r[det.estoque]||0), m = Number(r[det.minimo]||0); return m>0&&e>0&&e<=m; })
      : [];
    const valorEst = (det.estoque && det.preco)
      ? rows.reduce((acc, r) => acc + Number(r[det.estoque]||0)*Number(r[det.preco]||0), 0)
      : null;
    return { total: rows.length, ativos: ativos.length, inativos, zerados: zerados.length, abaixoMin: abaixoMin.length, valorEst };
  }, [rows, det]); // eslint-disable-line

  // ── Colunas da tabela ────────────────────────────────────────────────────────
  const tabelaCols = useMemo(() => [
    det.nome     && { key: det.nome,    label: 'Produto',     name: true },
    det.codigo   && { key: det.codigo,  label: 'Código' },
    det.barra    && { key: det.barra,   label: 'Cód. Barras' },
    det.secao    && { key: det.secao,   label: 'Seção' },
    det.grupo    && { key: det.grupo,   label: 'Grupo' },
    det.estoque  && { key: det.estoque, label: 'Estoque',     estoque: true },
    det.minimo   && { key: det.minimo,  label: 'Mínimo',      num: true },
    det.preco    && { key: det.preco,   label: 'Preço',       currency: true },
    det.custo    && { key: det.custo,   label: 'Custo',       currency: true },
    det.estoque && det.preco && {
      key: '__ve', label: 'Vl. Estoque', currency: true,
      calc: r => Number(r[det.estoque]||0)*Number(r[det.preco]||0),
    },
    det.situacao && { key: det.situacao, label: 'Situação',   badge: true },
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
    if (semEst && det.estoque) r = r.filter(row => Number(row[det.estoque]||0) <= 0);
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
        const diff = (Number(va)||0) - (Number(vb)||0);
        return sortDir === 'asc' ? diff : -diff;
      }
      const cmp = String(va??'').localeCompare(String(vb??''), 'pt-BR', { sensitivity: 'base' });
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
  const totalPags = Math.max(1, Math.ceil(total / (ps||1)));
  const pag       = Math.min(pagina, totalPags);
  const pagRows   = pageSize === 'Todos' ? sortedFiltradas : sortedFiltradas.slice((pag-1)*ps, pag*ps);

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
            <button
              className="pp-btn-ghost"
              onClick={() => exportarExcel({ tabelaCols, linhas: sortedFiltradas, empresa, det })}
              disabled={!sortedFiltradas.length}
              title="Exportar para Excel"
            >
              <FileDown size={14} /> Excel
            </button>
            <button
              className="pp-btn-ghost"
              onClick={() => setPrintOpen(true)}
              disabled={!sortedFiltradas.length}
              title="Imprimir"
            >
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
          <KpiCard icon={Package}       label="Total de Itens"   value={fmtNum.format(kpis.total)}              sub={`${kpis.ativos} ativos · ${kpis.inativos} inativos`}  accent="#3b82f6" />
          {kpis.valorEst !== null && (
            <KpiCard icon={DollarSign}  label="Valor em Estoque" value={fmtCurrency.format(kpis.valorEst)}      sub="preço × saldo"                                         accent="#22c55e" />
          )}
          <KpiCard icon={AlertTriangle} label="Zerados"          value={fmtNum.format(kpis.zerados)}            sub="saldo ≤ 0"                                             accent="#ef4444" />
          {kpis.abaixoMin > 0 && (
            <KpiCard icon={TrendingDown} label="Abaixo do Mínimo" value={fmtNum.format(kpis.abaixoMin)}         sub="saldo ≤ mínimo configurado"                            accent="#f59e0b" />
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
                             : c.currency ? fmtCurrency.format(Number(raw)||0)
                             : c.num      ? fmtNum.format(Number(raw)||0)
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
                : `${(pag-1)*ps+1}–${Math.min(pag*ps, total)} de ${total} itens`}
            </span>

            <div className="pp-pag">
              <button className="pp-pag-btn" onClick={() => setPagina(p => Math.max(1, p-1))} disabled={pag <= 1 || pageSize === 'Todos'}>
                <ChevronLeft size={14} />
              </button>
              {totalPags <= 6
                ? Array.from({ length: totalPags }, (_, i) => i+1).map(n => (
                    <button key={n} className={`pp-pag-btn${pag === n ? ' pp-pag-btn--on' : ''}`} onClick={() => setPagina(n)}>{n}</button>
                  ))
                : <span className="pp-pag-info">{pag} / {totalPags}</span>
              }
              <button className="pp-pag-btn" onClick={() => setPagina(p => Math.min(totalPags, p+1))} disabled={pag >= totalPags || pageSize === 'Todos'}>
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

      {/* ── Modal de impressão ── */}
      {printOpen && (
        <PrintModal
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
    </main>
  );
}
