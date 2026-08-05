import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Camera, Save, Tag, Loader, Trash2 } from 'lucide-react';
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
    det.codigo    && { col: det.codigo,    label: 'Código',     fmt: v => String(v) },
    det.nome      && { col: det.nome,      label: 'Nome',       fmt: v => String(v) },
    det.documento && { col: det.documento, label: 'Documento',  fmt: v => String(v) },
    det.telefone  && { col: det.telefone,  label: 'Telefone',   fmt: v => String(v) },
    det.email     && { col: det.email,     label: 'Email',      fmt: v => String(v) },
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

export default function ClienteDetalhe({ row, cols, det, empresa, onClose }) {
  const [foto,        setFoto]        = useState(null);   // base64 ou null
  const [observacoes, setObservacoes] = useState('');
  const [tags,        setTags]        = useState([]);
  const [tagInput,    setTagInput]    = useState('');
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState('');
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

  if (!row) return null;

  const fields = buildOrderedFields(row, det || {});
  const nomeExibido = (det?.nome ? row[det.nome] : null) || cod;

  return ReactDOM.createPortal(
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
          <button className="pd-btn-save" onClick={salvar} disabled={saving || loading}>
            {saving ? <Loader size={14} className="pp-spin" /> : <Save size={14} />}
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
