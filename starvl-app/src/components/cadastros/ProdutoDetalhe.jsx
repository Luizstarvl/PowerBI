import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Camera, Save, Tag, Loader, Trash2, Printer } from 'lucide-react';
import { apiFetch } from '../../api';

const fmtCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum      = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
const fmtPct      = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function compress(file, maxPx = 600, quality = 0.75) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = url;
  });
}

const FIELD_LABELS = {
  descricao:        'Descrição',
  cod_produto:      'Código',
  cod_barra:        'Cód. Barra',
  descricao_secao:  'Seção',
  descricao_grupo:  'Grupo',
  preco_venda1:     'Preço Venda',
  preco_venda2:     'Preço Venda 2',
  custo:            'Custo',
  estoque_produto:  'Estoque',
  situacao:         'Situação',
  empresa:          'Empresa',
};

const CURRENCY_COLS = /preco|custo|valor/i;
const NUM_COLS      = /estoque|qtd/i;

function buildOrderedFields(row, cols, det) {
  const fmtC = v => fmtCurrency.format(Number(v) || 0);
  const fmtN = v => fmtNum.format(Number(v) || 0);

  const ordered = [
    det.codigo  && { col: det.codigo,  label: 'Código',      fmt: v => String(v) },
    det.nome    && { col: det.nome,    label: 'Descrição',   fmt: v => String(v) },
    det.barra   && { col: det.barra,   label: 'Cód. Barras', fmt: v => String(v) },
    det.secao   && { col: det.secao,   label: 'Seção',       fmt: v => String(v) },
    det.grupo   && { col: det.grupo,   label: 'Grupo',       fmt: v => String(v) },
    det.estoque && { col: det.estoque, label: 'Estoque',     fmt: fmtN },
    det.minimo  && { col: det.minimo,  label: 'Est. Mínimo', fmt: fmtN },
    det.preco   && { col: det.preco,   label: 'Preço Venda', fmt: fmtC },
    det.custo   && { col: det.custo,   label: 'Custo',       fmt: fmtC },
    (det.estoque && det.preco) && {
      col: '__ve', label: 'Vl. Estoque',
      fmt: () => fmtC(Number(row[det.estoque]||0) * Number(row[det.preco]||0)),
    },
    (det.preco && det.custo) && {
      col: '__mg', label: 'Margem',
      fmt: () => {
        const p = Number(row[det.preco]||0), c = Number(row[det.custo]||0);
        return p > 0 ? `${fmtPct.format(((p-c)/p)*100)}%` : '—';
      },
    },
    det.situacao && { col: det.situacao, label: 'Situação', fmt: v => String(v) },
  ].filter(Boolean);

  return ordered.map(f => {
    const raw = (f.col === '__ve' || f.col === '__mg') ? 1 : (row[f.col] ?? null);
    if (f.col !== '__ve' && f.col !== '__mg' && (raw === null || raw === undefined || raw === '')) return null;
    return { key: f.col, label: f.label, value: f.fmt(raw) };
  }).filter(Boolean);
}

// ── Gerador de HTML da Ficha do Produto ───────────────────────────────────────
function gerarFichaProduto({ row, fields, foto, observacoes, tags, empresa, det }) {
  const now = new Date().toLocaleString('pt-BR');

  const nome = det?.nome ? row[det.nome] : row.descricao || row.nome || '';
  const cod  = det?.codigo ? row[det.codigo] : row.cod_produto || '';

  const matchAtivo = v => { const s = String(v||'').trim().toLowerCase(); return s==='ativo'||s==='a'; };

  const fotoHtml = foto
    ? `<img src="${foto}" class="ficha-foto" alt="Foto do produto" />`
    : `<div class="ficha-foto-empty"><span>SEM FOTO</span></div>`;

  const fieldsHtml = fields.map(f => {
    let val = f.value;
    if (f.key === det?.situacao || f.label === 'Situação') {
      const ok = matchAtivo(row[f.key]);
      val = `<span class="badge ${ok ? 'badge-ok' : 'badge-off'}">${ok ? 'Ativo' : 'Inativo'}</span>`;
    }
    const isNum = f.key === det?.estoque || f.key === det?.minimo || f.key === '__ve' || f.key === '__mg'
               || CURRENCY_COLS.test(f.key || '') || NUM_COLS.test(f.key || '');
    return `
      <tr>
        <td class="fl">${f.label}</td>
        <td class="fv${isNum ? ' fv-r' : ''}">${val}</td>
      </tr>`;
  }).join('');

  const tagsHtml = tags.length
    ? `<div class="ficha-section-title">Tags</div>
       <div class="ficha-tags">${tags.map(t => `<span class="ftag">${t}</span>`).join('')}</div>`
    : '';

  const obsHtml = observacoes.trim()
    ? `<div class="ficha-section-title">Observações</div>
       <div class="ficha-obs">${observacoes.replace(/\n/g, '<br>')}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Ficha: ${nome}</title>
<style>
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }

@media screen {
  html { background: #4a4a4a; }
  body { background: #4a4a4a; padding: 28px 20px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; }
  .wrap { width: 720px; margin: 0 auto; background: #fff; padding: 32px 36px; box-shadow: 0 4px 28px rgba(0,0,0,.5); }
}
@media print {
  html, body { background: #fff !important; padding: 14mm !important; margin: 0 !important; }
  .wrap { padding: 0 !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; }
}

body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; }
.wrap { background: #fff; }

/* ── Cabeçalho ── */
.rh { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 14px; margin-bottom: 20px; border-bottom: 3px solid #f97316; }
.rh-brand { font-size: 10px; font-weight: 700; color: #f97316; letter-spacing: .12em; text-transform: uppercase; }
.rh-title { font-size: 18px; font-weight: 700; color: #111; line-height: 1.2; margin-top: 3px; }
.rh-meta { text-align: right; font-size: 9.5px; color: #888; line-height: 1.8; }
.rh-meta strong { color: #444; }

/* ── Corpo principal ── */
.main-row { display: flex; gap: 24px; margin-bottom: 20px; }

/* Foto */
.foto-col { flex-shrink: 0; }
.ficha-foto {
  width: 180px; height: 180px;
  object-fit: contain;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  display: block;
}
.ficha-foto-empty {
  width: 180px; height: 180px;
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: #f9fafb;
  color: #9ca3af; font-size: 11px; font-weight: 700; letter-spacing: .08em;
}

/* Dados */
.fields-col { flex: 1; min-width: 0; }
.ficha-nome { font-size: 17px; font-weight: 700; color: #111; line-height: 1.25; margin-bottom: 14px; }
.ficha-cod  { font-size: 11px; color: #6b7280; margin-top: -10px; margin-bottom: 14px; }

table.ft { width: 100%; border-collapse: collapse; }
table.ft td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; font-size: 10.5px; vertical-align: middle; }
table.ft td.fl { width: 38%; color: #6b7280; font-weight: 600; font-size: 9.5px; text-transform: uppercase; letter-spacing: .04em; }
table.ft td.fv { color: #111; }
table.ft td.fv-r { text-align: right; font-variant-numeric: tabular-nums; }
table.ft tr:last-child td { border-bottom: none; }

/* ── Extras ── */
.extras-row { border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; flex-direction: column; gap: 14px; }
.ficha-section-title { font-size: 9px; text-transform: uppercase; letter-spacing: .1em; color: #9ca3af; font-weight: 700; margin-bottom: 6px; }

.ficha-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.ftag { background: #fff3e8; color: #c2410c; border: 1px solid #fed7aa; border-radius: 20px; padding: 2px 10px; font-size: 10px; font-weight: 600; }

.ficha-obs { font-size: 11px; color: #374151; line-height: 1.6; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; }

/* Badges */
.badge { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 10px; font-weight: 700; }
.badge-ok  { background: #dcfce7; color: #15803d; }
.badge-off { background: #f3f4f6; color: #6b7280; }

/* ── Rodapé ── */
.rf { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 9px; color: #d1d5db; }
</style></head><body>
<div class="wrap">

  <div class="rh">
    <div>
      <div class="rh-brand">Eclipse · Sistema de Gestão de Postos</div>
      <div class="rh-title">Ficha do Produto</div>
    </div>
    <div class="rh-meta">
      <strong>Empresa:</strong> ${empresa}<br>
      <strong>Gerado em:</strong> ${now}
    </div>
  </div>

  <div class="main-row">
    <div class="foto-col">${fotoHtml}</div>
    <div class="fields-col">
      <div class="ficha-nome">${nome || '—'}</div>
      ${cod ? `<div class="ficha-cod">Código: ${cod}</div>` : ''}
      <table class="ft"><tbody>${fieldsHtml}</tbody></table>
    </div>
  </div>

  ${(tagsHtml || obsHtml) ? `<div class="extras-row">${tagsHtml}${obsHtml}</div>` : ''}

  <div class="rf">
    <span>Eclipse · ${empresa}</span>
    <span>Gerado em ${now}</span>
  </div>

</div>
<script>
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') e.preventDefault();
});
</script>
</body></html>`;
}

// ── Preview de impressão (iframe fullscreen) ──────────────────────────────────
function FichaPreview({ html, nome, onClose }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        iframeRef.current?.contentWindow?.print();
      }
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
            <span className="prv-bar-title">Ficha do Produto</span>
            <span className="prv-bar-meta">{nome}</span>
          </div>
        </div>
        <button className="prv-btn-print" onClick={() => iframeRef.current?.contentWindow?.print()}>
          <Printer size={14} /> Imprimir
        </button>
      </div>
      <div className="prv-content">
        <iframe ref={iframeRef} className="prv-iframe" srcDoc={html} title="Ficha do Produto" />
      </div>
    </div>,
    document.body
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ProdutoDetalhe({ row, cols, det, empresa, onClose, onFotoAtualizada }) {
  const [foto,        setFoto]        = useState(null);
  const [observacoes, setObservacoes] = useState('');
  const [tags,        setTags]        = useState([]);
  const [tagInput,    setTagInput]    = useState('');
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState('');
  const [fichaHtml,   setFichaHtml]   = useState(null);
  const fileRef = useRef();

  const cod = row?.cod_produto ?? (det?.codigo ? row?.[det.codigo] : null) ?? row?.[cols?.[1]] ?? '';
  const nome = det?.nome ? row[det.nome] : row.descricao || row.nome || cod;

  // Busca extras ao abrir
  useEffect(() => {
    if (!empresa || !cod) return;
    setLoading(true);
    apiFetch(`/api/produto-extra/${encodeURIComponent(empresa)}/${encodeURIComponent(cod)}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.data) {
          setFoto(d.data.foto_base64 || null);
          setObservacoes(d.data.observacoes || '');
          setTags(d.data.tags || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [empresa, cod]);

  async function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await compress(file);
    setFoto(b64);
  }

  function addTag(e) {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  }

  function removeTag(t) { setTags(prev => prev.filter(x => x !== t)); }

  async function salvar() {
    setSaving(true); setMsg('');
    try {
      const r = await apiFetch(
        `/api/produto-extra/${encodeURIComponent(empresa)}/${encodeURIComponent(cod)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foto_base64: foto, observacoes, tags }) }
      );
      const d = await r.json();
      if (d.ok) {
        setMsg('Salvo com sucesso!');
        onFotoAtualizada?.(cod, foto);
      } else {
        setMsg(d.error || 'Erro ao salvar.');
      }
    } catch { setMsg('Erro ao salvar.'); }
    setSaving(false);
  }

  function handleImprimirFicha() {
    const fields = det
      ? buildOrderedFields(row, cols, det)
      : cols.filter(c => c !== 'empresa').map(col => {
          const val = row[col];
          if (val === undefined || val === null || val === '') return null;
          const fmt = CURRENCY_COLS.test(col) ? fmtCurrency.format(Number(val) || 0)
                    : NUM_COLS.test(col)      ? fmtNum.format(Number(val) || 0)
                    : String(val);
          return { key: col, label: FIELD_LABELS[col] || col, value: fmt };
        }).filter(Boolean);

    const html = gerarFichaProduto({ row, fields, foto, observacoes, tags, empresa, det });
    setFichaHtml(html);
  }

  if (!row) return null;

  const fields = det ? buildOrderedFields(row, cols, det) : cols.filter(c => c !== 'empresa').map(col => {
    const val = row[col];
    if (val === undefined || val === null || val === '') return null;
    const fmt = CURRENCY_COLS.test(col) ? fmtCurrency.format(Number(val) || 0)
              : NUM_COLS.test(col)      ? fmtNum.format(Number(val) || 0)
              : String(val);
    return { key: col, label: FIELD_LABELS[col] || col, value: fmt };
  }).filter(Boolean);

  return ReactDOM.createPortal(
    <>
      <div className="pd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="pd-modal">

          {/* ── Cabeçalho ── */}
          <div className="pd-head">
            <div>
              <p className="pd-head-label">Cadastro de Produto</p>
              <h3 className="pd-head-title">{nome || cod}</h3>
            </div>
            <button className="pd-close" onClick={onClose}><X size={18} /></button>
          </div>

          <div className="pd-body">

            {/* ── Linha superior: foto + dados ── */}
            <div className="pd-top-section">

              {/* Foto */}
              <div className="pd-foto-area">
                <div className="pd-foto-frame" onClick={() => fileRef.current?.click()}>
                  {foto
                    ? <img src={foto} alt="Produto" className="pd-foto-img" />
                    : <div className="pd-foto-empty"><Camera size={28} /><span>Adicionar foto</span></div>
                  }
                  <div className="pd-foto-overlay"><Camera size={16} /> Alterar</div>
                </div>
                {foto && (
                  <button className="pd-foto-remove" onClick={() => setFoto(null)}>
                    <Trash2 size={13} /> Remover foto
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFoto} />
              </div>

              {/* Dados do produto */}
              <div className="pd-fields-col">
                <div className="pd-section-title">Dados do produto</div>
                <div className="pd-fields">
                  {fields.map(f => (
                    <div key={f.key} className="pd-field">
                      <span className="pd-field-label">{f.label}</span>
                      <span className="pd-field-value">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ── Extras abaixo ── */}
            {loading ? (
              <div className="pd-loading"><Loader size={16} className="pp-spin" /> Carregando extras…</div>
            ) : (
              <div className="pd-extras-section">
                <div className="pd-section-title">Informações extras</div>

                <div className="pd-extra-field">
                  <label className="pd-extra-label">Observações</label>
                  <textarea
                    className="pd-textarea"
                    rows={3}
                    placeholder="Anotações sobre o produto…"
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                  />
                </div>

                <div className="pd-extra-field">
                  <label className="pd-extra-label">Tags <span className="pd-hint">Enter ou vírgula para adicionar</span></label>
                  <div className="pd-tag-wrap">
                    {tags.map(t => (
                      <span key={t} className="pd-tag">
                        <Tag size={10} /> {t}
                        <button className="pd-tag-rm" onClick={() => removeTag(t)}><X size={10} /></button>
                      </span>
                    ))}
                    <input
                      className="pd-tag-input"
                      placeholder={tags.length ? '' : 'promoção, destaque…'}
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={addTag}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Rodapé ── */}
          <div className="pd-foot">
            {msg && <span className={`pd-msg${msg.includes('sucesso') ? ' pd-msg--ok' : ' pd-msg--err'}`}>{msg}</span>}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className="pd-btn-print" onClick={handleImprimirFicha} title="Imprimir ficha do produto">
                <Printer size={14} /> Imprimir Ficha
              </button>
              <button className="pd-btn-save" onClick={salvar} disabled={saving || loading}>
                {saving ? <Loader size={14} className="pp-spin" /> : <Save size={14} />}
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Preview da ficha (abre sobre o modal) ── */}
      {fichaHtml && (
        <FichaPreview
          html={fichaHtml}
          nome={nome || cod}
          onClose={() => setFichaHtml(null)}
        />
      )}
    </>,
    document.body
  );
}
