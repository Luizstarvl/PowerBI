import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Camera, Save, Tag, Loader, Trash2, Phone, Mail, Printer } from 'lucide-react';
import { apiFetch } from '../../api';

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

function buildOrderedFields(row, det) {
  const ordered = [
    det.codigo       && { col: det.codigo,       label: 'Código',        fmt: v => String(v) },
    det.razaoSocial  && { col: det.razaoSocial,  label: 'Razão Social',  fmt: v => String(v) },
    det.nomeFantasia && { col: det.nomeFantasia, label: 'Nome Fantasia', fmt: v => String(v) },
    det.documento    && { col: det.documento,    label: 'Documento',     fmt: v => String(v) },
    det.inscricaoEstadual && { col: det.inscricaoEstadual, label: 'Insc. Estadual / RG', fmt: v => String(v) },
    det.logradouro && { col: det.logradouro, label: 'Rua',       fmt: v => String(v) },
    det.numero     && { col: det.numero,     label: 'Número',    fmt: v => String(v) },
    det.cidade    && { col: det.cidade,    label: 'Cidade',     fmt: v => String(v) },
    det.tipo      && { col: det.tipo,      label: 'Tipo',       fmt: v => String(v) },
    det.situacao  && { col: det.situacao,  label: 'Situação',   fmt: v => String(v) },
  ].filter(Boolean);

  return ordered.map(f => {
    const raw = row[f.col] ?? null;
    if (raw === null || raw === undefined || raw === '') return null;
    return { key: f.col, label: f.label, value: f.fmt(raw) };
  }).filter(Boolean);
}

function gerarFichaCliente({ row, fields, foto, observacoes, tags, empresa, det }) {
  const nome = (det?.nomeFantasia && row[det.nomeFantasia]) || (det?.razaoSocial && row[det.razaoSocial]) || '';
  const tel   = det?.telefone ? row[det.telefone]  : null;
  const email = det?.email    ? row[det.email]     : null;

  const camposHtml = fields.map(f => `
    <tr>
      <td class="label">${f.label}</td>
      <td class="value">${f.value}</td>
    </tr>`).join('');

  const contatoHtml = (tel || email) ? `
    <div class="section">
      <div class="section-title">Contato</div>
      <table class="fields">
        ${tel   ? `<tr><td class="label">Telefone</td><td class="value">${tel}</td></tr>` : ''}
        ${email ? `<tr><td class="label">E-mail</td><td class="value">${email}</td></tr>` : ''}
      </table>
    </div>` : '';

  const obsHtml = observacoes ? `
    <div class="section">
      <div class="section-title">Observações</div>
      <p class="obs-text">${observacoes.replace(/\n/g, '<br>')}</p>
    </div>` : '';

  const tagsHtml = tags.length ? `
    <div class="section">
      <div class="section-title">Tags</div>
      <div class="tags-row">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Ficha — ${nome}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #222; background: #fff; }
  @page { size: A4 portrait; margin: 18mm 15mm; }
  .page { max-width: 180mm; margin: 0 auto; }
  .header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; margin-bottom: 14px; }
  .header-logo { font-size: 16px; font-weight: 700; color: #0ea5e9; white-space: nowrap; }
  .header-sub  { font-size: 9px; color: #666; margin-top: 2px; }
  .header-title { font-size: 14px; font-weight: 700; flex: 1; text-align: right; }
  .hero { display: flex; gap: 16px; margin-bottom: 14px; align-items: flex-start; }
  .hero-foto { width: 90px; height: 90px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; flex-shrink: 0; }
  .hero-foto-empty { width: 90px; height: 90px; border-radius: 6px; border: 2px dashed #d1d5db; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 9px; flex-shrink: 0; }
  .hero-info { flex: 1; }
  .hero-name { font-size: 16px; font-weight: 700; color: #0ea5e9; margin-bottom: 4px; }
  .hero-empresa { font-size: 10px; color: #666; }
  .section { margin-bottom: 12px; }
  .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #0ea5e9; border-bottom: 1px solid #e0f2fe; padding-bottom: 3px; margin-bottom: 6px; }
  table.fields { width: 100%; border-collapse: collapse; }
  table.fields tr { border-bottom: 1px solid #f3f4f6; }
  table.fields tr:last-child { border-bottom: none; }
  td.label { width: 38%; font-weight: 600; color: #555; padding: 3px 8px 3px 0; vertical-align: top; }
  td.value { color: #111; padding: 3px 0; }
  .obs-text { background: #f8fafc; border-left: 3px solid #0ea5e9; padding: 6px 10px; border-radius: 2px; white-space: pre-line; line-height: 1.5; }
  .tags-row { display: flex; flex-wrap: wrap; gap: 5px; }
  .tag { background: #e0f2fe; color: #0369a1; border-radius: 20px; padding: 2px 8px; font-size: 10px; font-weight: 600; }
  .footer { margin-top: 18px; border-top: 1px solid #e5e7eb; padding-top: 6px; display: flex; justify-content: space-between; color: #9ca3af; font-size: 8px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="header-logo">${empresa || 'Eclipse'}</div>
      <div class="header-sub">Cadastro de Clientes</div>
    </div>
    <div class="header-title">Ficha de Cliente</div>
  </div>

  <div class="hero">
    ${foto
      ? `<img class="hero-foto" src="${foto}" alt="${nome}">`
      : `<div class="hero-foto-empty">Sem foto</div>`}
    <div class="hero-info">
      <div class="hero-name">${nome || '—'}</div>
      <div class="hero-empresa">${empresa || ''}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dados do cliente</div>
    <table class="fields">${camposHtml}</table>
  </div>

  ${contatoHtml}
  ${obsHtml}
  ${tagsHtml}

  <div class="footer">
    <span>${empresa || ''} — Ficha de Cliente</span>
    <span>Gerado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
  </div>
</div>
</body>
</html>`;
}

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
            <span className="prv-bar-title">Ficha do Cliente</span>
            <span className="prv-bar-meta">{nome}</span>
          </div>
        </div>
        <button className="prv-btn-print" onClick={() => iframeRef.current?.contentWindow?.print()}>
          <Printer size={14} /> Imprimir
        </button>
      </div>
      <div className="prv-content">
        <iframe ref={iframeRef} className="prv-iframe" srcDoc={html} title="Ficha do Cliente" />
      </div>
    </div>,
    document.body
  );
}

export default function ClienteDetalhe({ row, cols, det, empresa, onClose }) {
  const [foto,        setFoto]        = useState(null);   // base64 ou null
  const [observacoes, setObservacoes] = useState('');
  const [tags,        setTags]        = useState([]);
  const [tagInput,    setTagInput]    = useState('');
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState('');
  const [fichaHtml,   setFichaHtml]   = useState(null);
  const fileRef = useRef();

  const cod = (det?.codigo ? row?.[det.codigo] : null) ?? row?.[cols?.[0]] ?? '';

  // Busca extras ao abrir
  useEffect(() => {
    if (!empresa || !cod) return;
    setLoading(true);
    apiFetch(`/api/cliente-extra/${encodeURIComponent(empresa)}/${encodeURIComponent(cod)}`)
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
        `/api/cliente-extra/${encodeURIComponent(empresa)}/${encodeURIComponent(cod)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foto_base64: foto, observacoes, tags }) }
      );
      const d = await r.json();
      setMsg(d.ok ? 'Salvo com sucesso!' : (d.error || 'Erro ao salvar.'));
    } catch { setMsg('Erro ao salvar.'); }
    setSaving(false);
  }

  function handleImprimirFicha() {
    const fields = buildOrderedFields(row, det || {});
    const html = gerarFichaCliente({ row, fields, foto, observacoes, tags, empresa, det });
    setFichaHtml(html);
  }

  if (!row) return null;

  const fields = buildOrderedFields(row, det || {});
  const nomeExibido = (det?.nomeFantasia && row[det.nomeFantasia]) || (det?.razaoSocial && row[det.razaoSocial]) || cod;

  const portal = ReactDOM.createPortal(
    <div className="pd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pd-modal">

        {/* ── Cabeçalho ── */}
        <div className="pd-head">
          <div>
            <p className="pd-head-label">Cadastro de Cliente</p>
            <h3 className="pd-head-title">{nomeExibido}</h3>
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
                  ? <img src={foto} alt="Cliente" className="pd-foto-img" />
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

            {/* Dados do cliente */}
            <div className="pd-fields-col">
              <div className="pd-section-title">Dados do cliente</div>
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

          {/* ── Contato ── */}
          {(det?.telefone || det?.email) && (() => {
            const tel   = det.telefone ? row[det.telefone]  : null;
            const email = det.email    ? row[det.email]     : null;
            if (!tel && !email) return null;
            return (
              <div className="pd-contato-section">
                <div className="pd-section-title">Contato</div>
                <div className="pd-contato-cards">
                  {tel && (
                    <a href={`tel:${String(tel).replace(/\D/g, '')}`} className="pd-contato-card">
                      <span className="pd-contato-icon pd-contato-icon--tel"><Phone size={14} /></span>
                      <div className="pd-contato-info">
                        <span className="pd-contato-label">Telefone</span>
                        <span className="pd-contato-value">{tel}</span>
                      </div>
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} className="pd-contato-card">
                      <span className="pd-contato-icon pd-contato-icon--email"><Mail size={14} /></span>
                      <div className="pd-contato-info">
                        <span className="pd-contato-label">E-mail</span>
                        <span className="pd-contato-value">{email}</span>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            );
          })()}

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
                  placeholder="Anotações sobre o cliente…"
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
                    placeholder={tags.length ? '' : 'VIP, inadimplente…'}
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
            <button className="pd-btn-print" onClick={handleImprimirFicha} disabled={loading}>
              <Printer size={14} /> Imprimir Ficha
            </button>
            <button className="pd-btn-save" onClick={salvar} disabled={saving || loading}>
              {saving ? <Loader size={14} className="pp-spin" /> : <Save size={14} />}
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      {portal}
      {fichaHtml && <FichaPreview html={fichaHtml} nome={nomeExibido} onClose={() => setFichaHtml(null)} />}
    </>
  );
}
