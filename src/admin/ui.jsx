import { useEffect, useState } from 'react';

/** Confirmation + status line shared by every editor panel. */
export function SaveBar({ dirty, saving, saved, error, onReset }) {
  return (
    <div className="sticky bottom-0 -mx-6 mt-8 flex flex-wrap items-center gap-4 border-t border-line/12 bg-surface/95 px-6 py-4 backdrop-blur lg:-mx-8 lg:px-8">
      <button type="submit" className="btn btn-ink !py-2.5 !text-sm" disabled={!dirty || saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
      {dirty && !saving && (
        <button type="button" onClick={onReset} className="btn btn-ghost-dark !py-2.5 !text-sm">
          Discard
        </button>
      )}
      <span role="status" className="font-label text-[11px] tracking-[0.1em]">
        {error && <span className="text-accent-700">{error}</span>}
        {!error && saved && <span className="text-sea">Saved — the live site is updated</span>}
        {!error && !saved && dirty && <span className="text-content/65">Unsaved changes</span>}
      </span>
    </div>
  );
}

export function PanelHeader({ title, description }) {
  return (
    <header className="mb-8 border-b border-line/12 pb-6">
      <h1 className="text-2xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-content/62">{description}</p>}
    </header>
  );
}

export function Card({ title, children, actions }) {
  return (
    <section className="mb-8 border border-line/12 bg-surface">
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4 border-b border-line/12 px-6 py-4">
          {title && <h2 className="font-label text-[11px] uppercase tracking-[0.14em] text-content/66">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

/** Tracks a draft copy of server state and reports whether it diverged. */
export function useDraft(initial) {
  const [draft, setDraft] = useState(initial);
  const [baseline, setBaseline] = useState(initial);

  useEffect(() => {
    setDraft(initial);
    setBaseline(initial);
  }, [initial]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const set = (patch) => setDraft((current) => ({ ...current, ...patch }));
  const commit = (value) => { setDraft(value); setBaseline(value); };
  const reset = () => setDraft(baseline);

  return { draft, setDraft, set, dirty, commit, reset };
}

export function Empty({ children }) {
  return (
    <p className="border border-dashed border-line/20 px-6 py-12 text-center text-sm text-content/66">
      {children}
    </p>
  );
}
