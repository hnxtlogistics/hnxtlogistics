import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

/* Each mode carries a colour. The themed set follows light/dark; the "lit"
   set is fixed and used on the always-dark brand blocks, and on cards that
   invert to dark on hover. */
const THEMED = {
  ROAD:  'text-mode-road border-mode-road/35 bg-mode-road/8',
  AIR:   'text-mode-air border-mode-air/35 bg-mode-air/8',
  SEA:   'text-mode-sea border-mode-sea/35 bg-mode-sea/8',
  MULTI: 'text-mode-multi border-mode-multi/30 bg-mode-multi/8'
};

const LIT = {
  ROAD:  'text-mode-road-lit border-mode-road-lit/40 bg-mode-road-lit/10',
  AIR:   'text-mode-air-lit border-mode-air-lit/40 bg-mode-air-lit/10',
  SEA:   'text-mode-sea-lit border-mode-sea-lit/40 bg-mode-sea-lit/10',
  MULTI: 'text-mode-multi-lit border-mode-multi-lit/35 bg-mode-multi-lit/10'
};

const HOVER_LIT = {
  ROAD:  'group-hover:text-mode-road-lit group-hover:border-mode-road-lit/40',
  AIR:   'group-hover:text-mode-air-lit group-hover:border-mode-air-lit/40',
  SEA:   'group-hover:text-mode-sea-lit group-hover:border-mode-sea-lit/40',
  MULTI: 'group-hover:text-mode-multi-lit group-hover:border-mode-multi-lit/35'
};

/**
 * Transport mode, styled the way a manifest colour-codes its lanes.
 * `tone` describes the background the tag sits on, not the tag itself.
 */
export function ModeTag({ mode = 'MULTI', tone = 'light', invertOnHover = false, className = '' }) {
  const key = THEMED[mode] ? mode : 'MULTI';
  const palette = tone === 'dark' ? LIT : THEMED;
  return (
    <span
      className={`inline-flex items-center border px-2 py-[3px] font-label text-[10px] font-semibold tracking-[0.1em] transition-colors ${palette[key]} ${
        invertOnHover ? HOVER_LIT[key] : ''
      } ${className}`}
    >
      {key}
    </span>
  );
}

export function Eyebrow({ children, className = '' }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

/** Wraps content and fades it in once it scrolls into view. */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    observer.observe(node);

    /* Failsafe: content must never stay hidden because an observer never
       fired — print, prerender and background tabs all hit that case. */
    const failsafe = setTimeout(() => setVisible(true), 2500);

    return () => {
      observer.disconnect();
      clearTimeout(failsafe);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/** A labelled input with inline validation messaging. */
export function Field({
  label, name, type = 'text', value, onChange, error, hint,
  required = false, rows, options, placeholder, autoComplete, className = ''
}) {
  const id = `field-${name}`;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  const shared = {
    id, name, value, onChange, placeholder, required, autoComplete,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy,
    className: `field-input${isPassword ? ' pr-12' : ''}`
  };

  return (
    <div className={className}>
      <label className="field-label" htmlFor={id}>
        {label}
        {required && <span className="text-accent-700"> *</span>}
      </label>

      {options ? (
        <select {...shared}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : rows ? (
        <textarea {...shared} rows={rows} />
      ) : isPassword ? (
        <div className="relative">
          <input {...shared} type={revealed ? 'text' : 'password'} />
          {/* Revealing is a deliberate, per-field action — the button never
              stays on across page loads, and it reports its own state. */}
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            aria-pressed={revealed}
            className="absolute right-1 top-1/2 flex h-9 w-10 -translate-y-1/2 items-center justify-center text-content/62 transition-colors hover:text-content"
          >
            <Icon name={revealed ? 'eyeOff' : 'eye'} size={18} />
          </button>
        </div>
      ) : (
        <input {...shared} type={type} />
      )}

      {error && (
        <p id={`${id}-error`} className="mt-1.5 font-label text-[11px] text-accent-700">{error}</p>
      )}
      {!error && hint && (
        <p id={`${id}-hint`} className="mt-1.5 font-label text-[11px] opacity-80">{hint}</p>
      )}
    </div>
  );
}

/** Section heading used across the marketing pages. */
export function SectionHead({ eyebrow, title, lede, tone = 'dark', align = 'left', className = '' }) {
  const muted = tone === 'dark' ? 'text-content/62' : 'text-on-brand/72';
  const accent = tone === 'dark' ? 'text-accent-700' : 'text-accent-400';
  return (
    <div className={`${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'} ${className}`}>
      {eyebrow && <Eyebrow className={accent}>{eyebrow}</Eyebrow>}
      <h2 className="mt-3 text-[length:var(--text-display)]">{title}</h2>
      {lede && <p className={`mt-5 text-lg leading-relaxed ${muted}`}>{lede}</p>}
    </div>
  );
}
