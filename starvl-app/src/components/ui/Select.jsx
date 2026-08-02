import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

// Select customizado reaproveitando o visual já usado em Parametros.jsx
// (.cselect*), estendido com busca (pra listas longas), navegação por
// teclado e estado vazio — usado no módulo de Gestão de Metas.
// options: string[] | { value, label }[]
export default function Select({
  value, onChange, options, placeholder = 'Selecione', disabled = false,
  searchable, searchPlaceholder = 'Buscar…', emptyMessage = 'Nenhum resultado encontrado',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const ref = useRef(null);
  const searchRef = useRef(null);

  const items = useMemo(() => options.map(o => (typeof o === 'string' ? { value: o, label: o } : o)), [options]);
  const shouldSearch = searchable ?? items.length > 8;

  const filtered = useMemo(() => {
    if (!shouldSearch || !query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter(i => i.label.toLowerCase().includes(q));
  }, [items, query, shouldSearch]);

  const selected = items.find(i => i.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey  = e => { if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector('.cselect-trigger')?.focus(); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      const idx = items.findIndex(i => i.value === value);
      setHighlight(Math.max(idx, 0));
      if (shouldSearch) setTimeout(() => searchRef.current?.focus(), 0);
    }
    // Só deve reagir à abertura/fechamento — items/shouldSearch/value mudariam
    // a cada renderização e reabririam a busca sem necessidade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => { setHighlight(0); }, [query]);

  function handleTriggerKeyDown(e) {
    if (disabled) return;
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
    }
  }

  function handleListKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlight]) { onChange(filtered[highlight].value); setOpen(false); }
    }
  }

  return (
    <div ref={ref} className="cselect">
      <button
        type="button"
        className={`cselect-trigger${open ? ' open' : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="cselect-value" style={!selected ? { color: 'var(--color-text-muted)' } : undefined}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`cselect-chevron${open ? ' open' : ''}`} size={14} />
      </button>
      {open && (
        <div className="cselect-menu" onKeyDown={handleListKeyDown} role="listbox">
          {shouldSearch && (
            <div className="cselect-search-wrap">
              <Search size={13} />
              <input
                ref={searchRef}
                type="text"
                className="cselect-search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
              />
            </div>
          )}
          <div className="cselect-items">
            {filtered.length === 0 ? (
              <div className="cselect-empty">{emptyMessage}</div>
            ) : (
              filtered.map((item, i) => (
                <button
                  key={item.value}
                  type="button"
                  className={`cselect-item${item.value === value ? ' selected' : ''}${i === highlight ? ' highlighted' : ''}`}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => { onChange(item.value); setOpen(false); }}
                >
                  {item.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
