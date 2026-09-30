import { useState } from 'react';
import { useCollection } from '../useCollection';
import { ApiError } from '../../lib/api';
import { Field } from '../../components/primitives';
import { Card, Empty, PanelHeader } from '../ui';

const BLANK = { question: '', answer: '', published: 1, sort_order: 0 };

function FaqEditor({ initial, onSave, onCancel, isNew }) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (patch) => setDraft((current) => ({ ...current, ...patch }));

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(draft);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="border border-line/20 bg-surface p-6">
      {error && <p role="alert" className="mb-5 border border-accent-600/40 bg-accent-500/8 px-4 py-2.5 text-sm text-accent-700">{error}</p>}
      <Field label="Question" name="faq-q" required value={draft.question} onChange={(e) => set({ question: e.target.value })} />
      <Field className="mt-5" label="Answer" name="faq-a" rows={4} required value={draft.answer} onChange={(e) => set({ answer: e.target.value })} />
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Order" name="faq-order" type="number" hint="Lower numbers appear first" value={draft.sort_order} onChange={(e) => set({ sort_order: e.target.value })} />
        <label className="flex cursor-pointer items-end gap-2.5 pb-3 text-sm">
          <input type="checkbox" checked={Number(draft.published) === 1} onChange={(e) => set({ published: e.target.checked ? 1 : 0 })} className="h-4 w-4 accent-[var(--color-accent-500)]" />
          Visible on the site
        </label>
      </div>
      <div className="mt-7 flex gap-3">
        <button type="submit" className="btn btn-ink !py-2.5 !text-sm" disabled={saving}>
          {saving ? 'Saving…' : isNew ? 'Add question' : 'Save question'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-ghost-dark !py-2.5 !text-sm">Cancel</button>
      </div>
    </form>
  );
}

export default function FaqsSection() {
  const { items, loading, error, create, update, remove } = useCollection('/admin/faqs');
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  if (loading) return <p className="text-sm text-content/66">Loading…</p>;

  return (
    <div>
      <PanelHeader title="FAQs" description="Shown near the bottom of the home page, in this order." />
      {error && <p className="mb-6 text-sm text-accent-700">{error}</p>}

      <Card
        title={`${items.length} questions`}
        actions={
          !adding && (
            <button type="button" onClick={() => { setAdding(true); setEditingId(null); }} className="font-label text-[11px] uppercase tracking-[0.12em] text-accent-700 hover:text-accent-500">
              + Add question
            </button>
          )
        }
      >
        {adding && (
          <div className="mb-6">
            <FaqEditor
              isNew
              initial={{ ...BLANK, sort_order: items.length }}
              onSave={async (draft) => { await create(draft); setAdding(false); }}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}

        {items.length === 0 && !adding ? (
          <Empty>No questions yet.</Empty>
        ) : (
          <ul className="divide-y divide-line/10">
            {items.map((faq) =>
              editingId === faq.id ? (
                <li key={faq.id} className="py-5">
                  <FaqEditor
                    initial={faq}
                    onSave={async (draft) => { await update(faq.id, draft); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li key={faq.id} className="flex flex-wrap items-start gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {faq.question}
                      {!faq.published && <span className="ml-2 font-label text-[10px] uppercase tracking-[0.1em] text-content/62">Hidden</span>}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-content/70">{faq.answer}</p>
                  </div>
                  {confirmId === faq.id ? (
                    <div className="flex items-center gap-3 font-label text-[11px] uppercase tracking-[0.1em]">
                      <span className="text-content/60">Delete?</span>
                      <button type="button" onClick={async () => { await remove(faq.id); setConfirmId(null); }} className="text-accent-700 hover:text-accent-500">Yes, delete</button>
                      <button type="button" onClick={() => setConfirmId(null)} className="text-content/65 hover:text-content">Keep</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 font-label text-[11px] uppercase tracking-[0.1em]">
                      <button type="button" onClick={() => { setEditingId(faq.id); setAdding(false); }} className="text-content/66 hover:text-content">Edit</button>
                      <button type="button" onClick={() => setConfirmId(faq.id)} className="text-accent-700 hover:text-accent-500">Delete</button>
                    </div>
                  )}
                </li>
              )
            )}
          </ul>
        )}
      </Card>
    </div>
  );
}
