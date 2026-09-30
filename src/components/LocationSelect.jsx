import { useEffect, useId, useMemo, useRef, useState } from 'react';

const MAX_RESULTS = 60;

/**
 * Ranks a prefix match above a substring match, so typing "del" offers
 * Delhi before New Delhi rather than burying it.
 */
function filterOptions(options, query) {
  const q = query.trim().toLowerCase();
  if (!q) return options.slice(0, MAX_RESULTS);
  const starts = [];
  const contains = [];
  for (const option of options) {
    const label = option.label.toLowerCase();
    if (label.startsWith(q)) starts.push(option);
    else if (label.includes(q) || option.meta?.toLowerCase().includes(q)) contains.push(option);
    if (starts.length >= MAX_RESULTS) break;
  }
  return [...starts, ...contains].slice(0, MAX_RESULTS);
}

/**
 * Searchable location picker following the ARIA combobox pattern.
 *
 * A plain <select> is not usable at several hundred options, and a strict
 * dropdown would block any consignment from a place not on the list — so
 * the field still accepts free text and only *suggests* matches.
 */
export default function LocationSelect({
  label, name, value, onChange, options, error, required = false,
  placeholder, hint, freeTextHint
}) {
  const id = `field-${name}`;
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(
    () => (open ? filterOptions(options, value || '') : []),
    [open, value, options]
  );
  const exact = useMemo(() => options.some((o) => o.value === value), [options, value]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (option) => {
    onChange({ target: { name, value: option.value } });
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) { setOpen(true); setActive(0); return; }
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => (current + step + results.length) % Math.max(results.length, 1));
      return;
    }
    if (event.key === 'Enter' && open && results[active]) {
      event.preventDefault();
      choose(results[active]);
      return;
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  };

  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div ref={wrapRef} className="relative">
      <label className="field-label" htmlFor={id}>
        {label}
        {required && <span className="text-accent-700"> *</span>}
      </label>

      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className="field-input"
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(event) => { onChange(event); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {open && results.length > 0 && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto border border-line/20 bg-surface py-1 shadow-xl"
        >
          {results.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => { event.preventDefault(); choose(option); }}
              className={`flex cursor-pointer items-baseline justify-between gap-3 px-3.5 py-2 text-sm ${
                index === active ? 'bg-accent-500/12 text-content' : 'text-content/85'
              }`}
            >
              <span>{option.label}</span>
              {option.meta && (
                <span className="shrink-0 font-label text-[10px] font-semibold uppercase tracking-[0.1em] text-content/62">
                  {option.meta}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && <p id={`${id}-error`} className="mt-1.5 font-label text-[11px] text-accent-700">{error}</p>}
      {!error && hint && (
        <p id={`${id}-hint`} className="mt-1.5 font-label text-[11px] opacity-80">
          {value && !exact ? freeTextHint || 'Not in the list — we will confirm this with you.' : hint}
        </p>
      )}
    </div>
  );
}
