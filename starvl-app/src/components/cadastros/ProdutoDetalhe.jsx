import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Save, Tag, Loader, Trash2 } from 'lucide-react';
import { apiFetch } from '../../api';

const fmtCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum      = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });

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

// Mapeia rótulo amigável para cada campo da linha
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

export default function ProdutoDetalhe({ row, cols, empresa, onClose }) {
  const [foto,        setFoto]        = useState(null);   // base64 ou null
  const [observacoes, setObservacoes] = useState('');
  const [tags,        setTags]        = useState([]);
  const [tagInput,    setTagInput]    = useState('');
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState('');
  const fileRef = useRef();

  const cod = row?.cod_produto ?? row?.[cols?.[1]] ?? '';

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
      setMsg(d.ok ? 'Salvo com sucesso!' : (d.error || 'Erro ao salvar.'));
    } catch { setMsg('Erro ao salvar.'); }
    setSaving(false);
  }

  if (!row) return null;

  const visibleCols = cols.filter(c => c !== 'empresa');

  return (
    <div className="pd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pd-modal">

        {/* ── Cabeçalho ── */}
        <div className="pd-head">
          <div>
            <p className="pd-head-label">Cadastro de Produto</p>
            <h3 className="pd-head-title">{row.descricao || cod}</h3>
          </div>
          <button className="pd-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="pd-body">

          {/* ── Foto ── */}
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

          {/* ── Dados do produto (vêm da consulta) ── */}
          <div className="pd-section-title">Dados do produto</div>
          <div className="pd-fields">
            {visibleCols.map(col => {
              const val = row[col];
              if (val === undefined || val === null || val === '') return null;
              const label = FIELD_LABELS[col] || col;
              const fmt = CURRENCY_COLS.test(col)
                ? fmtCurrency.format(Number(val) || 0)
                : NUM_COLS.test(col)
                  ? fmtNum.format(Number(val) || 0)
                  : String(val);
              return (
                <div key={col} className="pd-field">
                  <span className="pd-field-label">{label}</span>
                  <span className="pd-field-value">{fmt}</span>
                </div>
              );
            })}
          </div>

          {/* ── Extras (salvos no nosso banco) ── */}
          {loading ? (
            <div className="pd-loading"><Loader size={16} className="pp-spin" /> Carregando extras…</div>
          ) : (
            <>
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
            </>
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
    </div>
  );
}
