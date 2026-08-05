import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { RefreshCw, Search, X, Users, UserCheck, UserX, UserPlus, Printer, ChevronLeft, ChevronRight, ArrowLeft, Edit2, Check, ChevronDown } from 'lucide-react';
import { apiFetch } from '../../api';
import ClienteDetalhe from './ClienteDetalhe';

const fmtNum = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

const PAGE_OPTS = [10, 30, 50, 'Todos'];
const DIA_MS = 24 * 60 * 60 * 1000;

// Remove acentos só pra comparação — muitas consultas usam alias em
// português ("RAZÃO_SOCIAL", "SITUAÇÃO"...) e regex não trata á/ã/ç como
// equivalentes de a/c sem isso, o que fazia a detecção falhar silenciosamente.
function stripAccents(s) {
  // Faixa Unicode das marcas de acento combinantes (U+0300 a U+036F), escrita
  // via fromCharCode em vez de \uXXXX na regex pra evitar problemas de
  // codificação do caractere literal no arquivo fonte.
  const combiningMarks = new RegExp(
    '[' + String.fromCharCode(768) + '-' + String.fromCharCode(879) + ']', 'g'
  );
  return String(s || '').normalize('NFD').replace(combiningMarks, '');
}

function detectColsClientes(columns) {
  // Match exato (^ $) tem prioridade; fallback para parcial
  const exact = pat => columns.find(c => new RegExp(`^(${pat})$`, 'i').test(stripAccents(c))) || null;
  const find  = pat => columns.find(c => new RegExp(pat, 'i').test(stripAccents(c))) || null;
  return {
    // "cliente" sozinho NÃO entra aqui: em tabelas de participante/parceiro
    // (part/pars) é comum existir uma coluna booleana "CLIENTE" (Sim/Não,
    // é cliente ou não) ao lado de FORNECEDOR/FUNCIONARIO/etc — nada a ver
    // com o nome. nome_fantasia e razao_social são detectados separados
    // (ver clienteNome() abaixo) porque nem sempre os dois existem juntos.
    nomeFantasia: exact('nome_fantasia|fantasia|apelido') || find('fantasia'),
    razaoSocial:  exact('razao_social|razao|nome_cliente|nome') || find('razao|nome_completo'),
    codigo:    exact('cod_cliente|codigo|clicodigo|cod'),
    documento: exact('documento|cpf_cnpj|cpf|cnpj') || find('cpf|cnpj|documento'),
    telefone:   exact('telefone|fone|celular|whatsapp') || find('telefone|fone|celular'),
    email:      exact('email|e_mail') || find('email'),
    logradouro: exact('logradouro|rua|endereco') || find('logradouro|endereco'),
    numero:     exact('numero|nro|num') || find('numero'),
    cidade:    exact('cidade|municipio') || find('cidade|municipio'),
    tipo:      exact('tipo|tipo_pessoa|pessoa') || find('tipo_pessoa'),
    situacao:  exact('situacao|status|ativo|inativo') || find('situacao|status'),
    cadastro:  exact('data_cadastro|datacadastro|cliente_desde|cadastrado_em') || find('data_cadastro|cliente_desde|cadastrado'),
  };
}

// Nome fantasia tem prioridade (mais reconhecível), com razão social como
// fallback — cobre tanto o caso de PJ sem fantasia preenchida quanto PF
// (onde geralmente só razão social/nome completo existe).
function clienteNome(row, det) {
  return (det.nomeFantasia && row[det.nomeFantasia]) || (det.razaoSocial && row[det.razaoSocial]) || '';
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

function CtxCliente({ x, y, onEditar, onClose }) {
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

function gerarJanelaPrintClientes({ titulo, colunas, linhas, empresa, det, filtros }) {
  const fmtN = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  const now  = new Date().toLocaleString('pt-BR');

  const matchAtivo = v => { const s = String(v||'').trim().toLowerCase(); return s==='ativo'||s==='a'; };
  const ativos   = linhas.filter(r => matchAtivo(r[det.situacao])).length;
  const inativos = linhas.length - ativos;
  const novos30  = det.cadastro
    ? linhas.filter(r => { const d = new Date(r[det.cadastro]); return !isNaN(d) && (Date.now() - d.getTime()) <= 30 * 24 * 60 * 60 * 1000; }).length
    : null;

  const kpiCards = [
    { label: 'Total de Clientes', value: fmtN.format(linhas.length), sub: `${ativos} ativos · ${inativos} inativos` },
    det.situacao && { label: 'Ativos',   value: fmtN.format(ativos),   sub: 'situação ativa' },
    det.situacao && { label: 'Inativos', value: fmtN.format(inativos), sub: 'situação inativa' },
    novos30 !== null && { label: 'Novos (30 dias)', value: fmtN.format(novos30), sub: 'cadastrados recentemente' },
  ].filter(Boolean);

  const kpiHtml = kpiCards.map(k => `
    <div class="kpi-card">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-sub">${k.sub}</div>
    </div>`).join('');

  const filtroTags = Object.entries(filtros)
    .filter(([, v]) => v)
    .map(([, v]) => `<span class="ftag">${v}</span>`).join('');

  const thead = colunas.map(c => `<th>${c.label}</th>`).join('');

  const tbody = linhas.map((row, i) => {
    const cells = colunas.map(c => {
      const raw = c.calc ? c.calc(row) : row[c.key];
      let val;
      if (c.badge) {
        val = `<span class="badge ${matchAtivo(raw)?'badge-ok':'badge-off'}">${matchAtivo(raw)?'Ativo':'Inativo'}</span>`;
      } else {
        val = String(raw??'—');
      }
      return `<td>${val}</td>`;
    }).join('');
    return `<tr class="${i%2===0?'even':'odd'}">${cells}</tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>${titulo}</title>
<style>
/* margin:0 elimina a área onde o browser insere URL, data e nº de página */
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Modo Tela: simula impressão em páginas A4 ── */
@media screen {
  html { background: #4a4a4a; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5px; color: #1a1a1a;
    background: #4a4a4a; padding: 28px 20px;
  }
  .preview-wrap {
    width: 1060px; margin: 0 auto;
    background: #fff; padding: 28px 32px;
    box-shadow: 0 4px 28px rgba(0,0,0,.5);
    position: relative;
  }
  .pg-sep {
    height: 32px; margin: 0 -32px;
    background: #4a4a4a;
    display: flex; align-items: center; justify-content: center;
    gap: 12px; color: #888; font-size: 9px; letter-spacing: .06em;
    border-top: 1px dashed #888; border-bottom: 1px dashed #888;
  }
  .pg-sep::before, .pg-sep::after {
    content: ''; flex: 1; height: 1px; background: #666;
  }
  .pg-repeat-header th {
    background: #f97316 !important;
    color: #fff !important;
    padding: 7px 9px;
    font-size: 9px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .05em;
    white-space: nowrap;
  }
}

/* ── Modo Impressão ── */
@media print {
  html, body {
    background: #fff !important;
    padding: 12mm 14mm !important;
    margin: 0 !important;
  }
  .pg-sep-row,
  .pg-sep { display: none !important; }
  .pg-repeat-header { display: none !important; }
  .preview-wrap { padding: 0 !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; }
  tr { break-inside: avoid; }
  thead { display: table-header-group; }
}

body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5px; color: #1a1a1a; }
.preview-wrap { background: #fff; padding: 28px 32px; }

.report-header { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 12px; margin-bottom: 4px; border-bottom: 3px solid #f97316; }
.report-brand { display: flex; flex-direction: column; gap: 2px; }
.report-brand-name { font-size: 10px; font-weight: 700; color: #f97316; letter-spacing: .1em; text-transform: uppercase; }
.report-title { font-size: 20px; font-weight: 700; color: #111; line-height: 1.15; }
.report-meta { text-align: right; font-size: 9.5px; color: #777; line-height: 1.7; }
.report-meta strong { color: #333; }

.filters-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: 10px 0 14px; }
.filters-label { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #999; font-weight: 700; }
.ftag { background: #fff3e8; color: #c2410c; border: 1px solid #fed7aa; border-radius: 12px; padding: 2px 9px; font-size: 9px; font-weight: 600; }

.kpi-row { display: grid; grid-template-columns: repeat(${kpiCards.length}, 1fr); gap: 10px; margin-bottom: 16px; }
.kpi-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; border-left: 4px solid #f97316; }
.kpi-label { font-size: 9px; text-transform: uppercase; letter-spacing: .06em; color: #888; font-weight: 700; margin-bottom: 3px; }
.kpi-value { font-size: 17px; font-weight: 700; color: #111; line-height: 1.1; }
.kpi-sub { font-size: 9px; color: #aaa; margin-top: 2px; }

.section-title { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: #999; font-weight: 700; margin-bottom: 6px; }
table { width: 100%; border-collapse: collapse; }
thead tr { background: #f97316; }
th { padding: 7px 9px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #fff; white-space: nowrap; }
td { padding: 5.5px 9px; font-size: 10px; border-bottom: 1px solid #f0f0f0; color: #222; vertical-align: middle; }
tr.odd td { background: #fafafa; }
tr.even td { background: #fff; }
tr:last-child td { border-bottom: none; }
.badge { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 9px; font-weight: 700; }
.badge-ok  { background: #dcfce7; color: #15803d; }
.badge-off { background: #f3f4f6; color: #6b7280; }

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

<div class="section-title">Listagem de Clientes</div>
<table>
  <thead><tr>${thead}</tr></thead>
  <tbody>${tbody}</tbody>
</table>

<div class="report-footer">
  <span class="report-footer-left">Eclipse · Sistema de Gestão de Postos · ${empresa}</span>
  <span class="report-footer-right">Gerado em ${now}</span>
</div>
</div>

<script>
(function() {
  // 1. Bloqueia Ctrl+P / Cmd+P — impressão só pelo botão da barra
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // 2. Insere separadores de página + repete cabeçalho visualmente no preview
  var PAGE_H = 660; // altura útil de conteúdo por página A4 landscape (~96 DPI)

  window.addEventListener('load', function() {
    var wrap  = document.querySelector('.preview-wrap');
    var thead = document.querySelector('thead');
    var tbody = document.querySelector('tbody');
    if (!wrap || !tbody || !thead) return;

    var theadHTML = thead.innerHTML;
    var colCount  = thead.querySelector('tr') ? thead.querySelector('tr').children.length : 1;

    var wrapTop  = wrap.getBoundingClientRect().top + window.scrollY;
    var rows     = Array.from(tbody.querySelectorAll('tr'));
    var pageNum  = 1;
    var totalPgs = Math.max(1, Math.ceil(wrap.scrollHeight / PAGE_H));

    for (var i = 0; i < rows.length; i++) {
      var rowBottom = rows[i].getBoundingClientRect().bottom + window.scrollY - wrapTop;

      if (rowBottom > pageNum * PAGE_H) {
        var sep = document.createElement('tr');
        sep.className = 'pg-sep-row';
        sep.innerHTML = '<td colspan="' + colCount + '"><div class="pg-sep">Página ' + pageNum + ' de ' + totalPgs + '</div></td>';
        tbody.insertBefore(sep, rows[i]);
        rows.splice(i, 0, sep);
        i++;

        var hdrRow = document.createElement('tr');
        hdrRow.className = 'pg-repeat-header';
        hdrRow.innerHTML = theadHTML.replace(/<tr[^>]*>/i, '').replace(/<\\/tr>/i, '');
        tbody.insertBefore(hdrRow, rows[i]);
        rows.splice(i, 0, hdrRow);
        i++;

        pageNum++;
      }
    }
  });
})();
</script>

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
      <div className="prv-bar">
        <div className="prv-bar-left">
          <button className="prv-btn-close" onClick={onClose}>
            <X size={14} /> Fechar
          </button>
          <div className="prv-bar-divider" />
          <div className="prv-bar-info">
            <span className="prv-bar-title">{titulo}</span>
            <span className="prv-bar-meta">{total} cliente{total !== 1 ? 's' : ''} · {empresa}</span>
          </div>
        </div>
        <button className="prv-btn-print" onClick={handlePrint}>
          <Printer size={14} /> Imprimir
        </button>
      </div>

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

function PrintModal({ cidades, tipos, tabelaCols, sortedFiltradas, det, empresa, onClose, onPreview }) {
  const [titulo,    setTitulo]    = useState('Cadastro de Clientes');
  const [pSituacao, setPSituacao] = useState('Ativos');
  const [pCidade,   setPCidade]   = useState('Todas');
  const [pTipo,     setPTipo]     = useState('Todos');
  const [pColKeys,  setPColKeys]  = useState(() => tabelaCols.map(c => c.key));

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
    if (pCidade !== 'Todas' && det.cidade) r = r.filter(row => norm(row[det.cidade]) === norm(pCidade));
    if (pTipo   !== 'Todos' && det.tipo)   r = r.filter(row => norm(row[det.tipo])   === norm(pTipo));
    return r;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedFiltradas, pSituacao, pCidade, pTipo, det]);

  const colunasSel = tabelaCols.filter(c => pColKeys.includes(c.key));

  function toggleCol(key) {
    setPColKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  function handlePrint() {
    if (!colunasSel.length) return;
    const filtros = {
      situacao: pSituacao !== 'Todos' ? `Situação: ${pSituacao}` : '',
      cidade:   pCidade   !== 'Todas' ? `Cidade: ${pCidade}`     : '',
      tipo:     pTipo     !== 'Todos' ? `Tipo: ${pTipo}`         : '',
    };
    const html = gerarJanelaPrintClientes({ titulo, colunas: colunasSel, linhas, empresa, det, filtros });
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

              {cidades.length > 1 && (
                <div className="pm-field">
                  <label>Cidade</label>
                  <CustomSelect value={pCidade} options={cidades} onChange={setPCidade} />
                </div>
              )}

              {tipos.length > 1 && (
                <div className="pm-field">
                  <label>Tipo</label>
                  <CustomSelect value={pTipo} options={tipos} onChange={setPTipo} />
                </div>
              )}
            </div>
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
            {linhas.length} cliente{linhas.length !== 1 ? 's' : ''} · {colunasSel.length} coluna{colunasSel.length !== 1 ? 's' : ''}
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

export default function PainelClientes({ empresasKey, onVoltar }) {
  const [slotQuery, setSlotQuery] = useState(undefined);
  const [rows,      setRows]      = useState([]);
  const [cols,      setCols]      = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [erro,      setErro]      = useState('');

  const [busca,      setBusca]      = useState('');
  const [cidade,     setCidade]     = useState('Todas');
  const [tipo,       setTipo]       = useState('Todos');
  const [sortCol,    setSortCol]    = useState(null);
  const [sortDir,    setSortDir]    = useState('asc');
  const [situacao,   setSituacao]   = useState('Ativos');
  const [pagina,     setPagina]     = useState(1);
  const [pageSize,   setPageSize]   = useState(10);
  const [detalhe,    setDetalhe]    = useState(null);
  const [ctxMenu,    setCtxMenu]    = useState(null); // {x,y,row}
  const [fotosMap,   setFotosMap]   = useState({});
  const [printOpen,   setPrintOpen]   = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const empresa = (empresasKey || '').split(',')[0];
  const det = useMemo(() => detectColsClientes(cols), [cols]);

  // Busca a consulta vinculada ao slot
  useEffect(() => {
    apiFetch(`/api/queries?ativa=true&slot=cadastro_clientes`)
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

  // Busca fotos (POST para não ter limite de URL com muitos clientes)
  useEffect(() => {
    if (!rows.length || !empresa || !det.codigo) return;
    const codes = [...new Set(rows.map(r => String(r[det.codigo] ?? '')).filter(Boolean))];
    if (!codes.length) return;
    apiFetch(`/api/cliente-extra/batch/${encodeURIComponent(empresa)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes }),
    })
      .then(r => r.json())
      .then(d => { if (d.ok) setFotosMap(d.data); })
      .catch(() => {});
  }, [rows, empresa, det.codigo]);

  // Cidades e tipos: derivados direto das linhas (sem tabela auxiliar)
  const cidades = useMemo(() => {
    if (!det.cidade) return [];
    return ['Todas', ...new Set(rows.map(r => r[det.cidade]).filter(Boolean))];
  }, [rows, det.cidade]);

  const tipos = useMemo(() => {
    if (!det.tipo) return [];
    return ['Todos', ...new Set(rows.map(r => r[det.tipo]).filter(Boolean))];
  }, [rows, det.tipo]);

  const matchSituacao = (val, tipoAlvo) => {
    const v = String(val || '').trim().toLowerCase();
    if (tipoAlvo === 'Ativos')   return v === 'ativo'   || v === 'a';
    if (tipoAlvo === 'Inativos') return v === 'inativo' || v === 'i';
    return true;
  };

  const kpis = useMemo(() => {
    const ativos   = rows.filter(r => matchSituacao(r[det.situacao], 'Ativos'));
    const inativos = rows.filter(r => matchSituacao(r[det.situacao], 'Inativos'));
    const novos30  = det.cadastro
      ? rows.filter(r => { const d = new Date(r[det.cadastro]); return !isNaN(d) && (Date.now() - d.getTime()) <= 30 * DIA_MS; }).length
      : null;
    return { total: rows.length, ativos: ativos.length, inativos: inativos.length, novos30 };
  }, [rows, det]);

  const filtradas = useMemo(() => {
    let r = rows;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      r = r.filter(row =>
        clienteNome(row, det).toLowerCase().includes(q) ||
        String(row[det.codigo]    || '').toLowerCase().includes(q) ||
        String(row[det.documento] || '').toLowerCase().includes(q)
      );
    }
    const norm = s => String(s || '').trim().toLowerCase();
    if (cidade !== 'Todas' && det.cidade) r = r.filter(row => norm(row[det.cidade]) === norm(cidade));
    if (tipo   !== 'Todos' && det.tipo)   r = r.filter(row => norm(row[det.tipo])   === norm(tipo));
    if (situacao !== 'Todos' && det.situacao) r = r.filter(row => matchSituacao(row[det.situacao], situacao));
    return r;
  }, [rows, busca, cidade, tipo, situacao, det]);

  function limpar() {
    setBusca(''); setCidade('Todas'); setTipo('Todos');
    setSituacao('Ativos'); setPagina(1);
  }

  const tabelaCols = useMemo(() => [
    (det.nomeFantasia || det.razaoSocial) && { key: '__nome', label: 'Cliente', name: true, calc: row => clienteNome(row, det) },
    det.codigo     && { key: det.codigo,     label: 'Código' },
    det.documento  && { key: det.documento,  label: 'Documento' },
    det.logradouro && { key: det.logradouro, label: 'Rua' },
    det.numero     && { key: det.numero,     label: 'Número' },
    det.cidade     && { key: det.cidade,     label: 'Cidade' },
    det.situacao   && { key: det.situacao,   label: 'Situação',  badge: true },
  ].filter(Boolean), [det]);

  const sortedFiltradas = useMemo(() => {
    if (!sortCol) return filtradas;
    const col = tabelaCols.find(c => c.key === sortCol);
    if (!col) return filtradas;
    return [...filtradas].sort((a, b) => {
      const va = col.calc ? col.calc(a) : a[sortCol];
      const vb = col.calc ? col.calc(b) : b[sortCol];
      const cmp = String(va ?? '').localeCompare(String(vb ?? ''), 'pt-BR', { sensitivity: 'base', numeric: true });
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
        <Users size={36} className="tc-empty-icon" />
        <p className="tc-empty-title">Nenhuma consulta configurada</p>
        <p className="tc-empty-sub">
          Vá em <strong>Parâmetros → Gerenciador de Consultas</strong>, crie uma consulta
          com categoria <strong>Cadastros</strong> e vincule ao slot <code>cadastro_clientes</code>.
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
            <h2 className="pp-title">Cadastro de Clientes</h2>
            <p className="pp-subtitle">Clientes · {empresa || '—'}</p>
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
        <KpiCard icon={Users}     label="Total de Clientes" value={fmtNum.format(kpis.total)}    sub={`${kpis.ativos} ativos · ${kpis.inativos} inativos`} accent="#f97316" />
        <KpiCard icon={UserCheck} label="Ativos"             value={fmtNum.format(kpis.ativos)}   sub="situação ativa"                                       accent="#22c55e" />
        <KpiCard icon={UserX}     label="Inativos"           value={fmtNum.format(kpis.inativos)} sub="situação inativa"                                     accent="#ef4444" />
        {kpis.novos30 !== null && (
          <KpiCard icon={UserPlus} label="Novos (30 dias)" value={fmtNum.format(kpis.novos30)} sub="cadastrados recentemente" accent="#a78bfa" />
        )}
      </div>

      {/* ── Barra de filtros (linha única) ── */}
      <div className="pp-bar">
        <div className="pp-bar-search">
          <Search size={14} />
          <input
            className="pp-bar-input"
            placeholder="Buscar por nome, código ou documento…"
            value={busca}
            onChange={e => { setBusca(e.target.value); setPagina(1); }}
          />
          {busca && <button className="pp-bar-clear" onClick={() => { setBusca(''); setPagina(1); }}><X size={12} /></button>}
        </div>

        <div className="pp-bar-divider" />

        {cidades.length > 1 && (
          <div className="pp-bar-field">
            <label>Cidade</label>
            <select value={cidade} onChange={e => { setCidade(e.target.value); setPagina(1); }}>
              {cidades.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}

        {cidades.length > 1 && tipos.length > 1 && <div className="pp-bar-divider" />}

        {tipos.length > 1 && (
          <div className="pp-bar-field">
            <label>Tipo</label>
            <select value={tipo} onChange={e => { setTipo(e.target.value); setPagina(1); }}>
              {tipos.map(t => <option key={t}>{t}</option>)}
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

        <button className="pp-btn-ghost pp-btn-ghost--sm pp-bar-limpar" onClick={limpar}>
          <X size={12} /> Limpar
        </button>
      </div>

      {/* ── Tabela ── */}
      <div className="pp-table-wrap">
        {loading && !rows.length ? (
          <div className="pp-loading">
            <RefreshCw size={18} className="pp-spin" />
            <span>Carregando clientes…</span>
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
                      Nenhum cliente encontrado{busca ? ` para "${busca}"` : ''}.
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
                          ci === 0 ? 'pp-td--name' : '',
                        ].filter(Boolean).join(' ')}>
                          {c.badge ? <SituacaoBadge value={raw} />
                           : c.name ? (
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
              ? 'Nenhum cliente'
              : `${(pag - 1) * ps + 1}–${Math.min(pag * ps, total)} de ${total} clientes`}
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
        <ClienteDetalhe
          row={detalhe}
          cols={cols}
          det={det}
          empresa={empresa}
          onClose={() => setDetalhe(null)}
        />
      )}

      {/* ── Menu de contexto ── */}
      {ctxMenu && (
        <CtxCliente
          x={ctxMenu.x} y={ctxMenu.y}
          onEditar={() => { setDetalhe(ctxMenu.row); setCtxMenu(null); }}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* ── Modal de impressão ── */}
      {printOpen && (
        <PrintModal
          cidades={cidades}
          tipos={tipos}
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
