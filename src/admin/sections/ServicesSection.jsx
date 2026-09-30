import { useState } from 'react';
import { useCollection } from '../useCollection';
import { ApiError } from '../../lib/api';
import { Field, ModeTag } from '../../components/primitives';
import { Card, Empty, PanelHeader } from '../ui';

const MODES = [
  { value: 'ROAD', label: 'Road' },
  { value: 'AIR', label: 'Air' },
  { value: 'SEA', label: 'Sea' },
  { value: 'MULTI', label: 'Multi-modal' }
];

const BLANK = {
  slug: '', title: '', mode: 'ROAD', summary: '', body: '',
  lane: '', transit: '', featured: 0, published: 1, sort_order: 0
};

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

function ServiceEditor({ initial, onSave, onCancel, isNew }) {
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Title" name="svc-title" required value={draft.title}
          onChange={(e) => set(isNew ? { title: e.target.value, slug: slugify(e.target.value) } : { title: e.target.value })}
        />
        <Field label="URL slug" name="svc-slug" required hint={`/services/${draft.slug || '…'}`} value={draft.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} />
        <Field label="Mode" name="svc-mode" options={MODES} value={draft.mode} onChange={(e) => set({ mode: e.target.value })} />
        <Field label="Coverage" name="svc-lane" hint="e.g. Pan-India" value={draft.lane} onChange={(e) => set({ lane: e.target.value })} />
        <Field label="Typical transit" name="svc-transit" hint="e.g. 1–6 days" value={draft.transit} onChange={(e) => set({ transit: e.target.value })} />
        <Field label="Order" name="svc-order" type="number" hint="Lower numbers appear first" value={draft.sort_order} onChange={(e) => set({ sort_order: e.target.value })} />
      </div>

      <Field className="mt-5" label="Short summary" name="svc-summary" rows={2} hint="Shown in listings" value={draft.summary} onChange={(e) => set({ summary: e.target.value })} />
      <Field className="mt-5" label="Full description" name="svc-body" rows={5} hint="Shown on the service's own page" value={draft.body} onChange={(e) => set({ body: e.target.value })} />

      <div className="mt-6 flex flex-wrap gap-6">
        {[
          ['published', 'Visible on the site'],
          ['featured', 'Show on the home page']
        ].map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={Number(draft[key]) === 1}
              onChange={(e) => set({ [key]: e.target.checked ? 1 : 0 })}
              className="h-4 w-4 accent-[var(--color-accent-500)]"
            />
            {label}
          </label>
        ))}
      </div>

      <div className="mt-7 flex gap-3">
        <button type="submit" className="btn btn-ink !py-2.5 !text-sm" disabled={saving}>
          {saving ? 'Saving…' : isNew ? 'Add service' : 'Save service'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-ghost-dark !py-2.5 !text-sm">Cancel</button>
      </div>
    </form>
  );
}

export default function ServicesSection() {
  const { items, loading, error, create, update, remove } = useCollection('/admin/services');
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  if (loading) return <p className="text-sm text-content/66">Loading…</p>;

  return (
    <div>
      <PanelHeader
        title="Services"
        description="Everything listed on the services page. Unpublish a service to hide it without deleting it."
      />
      {error && <p className="mb-6 text-sm text-accent-700">{error}</p>}

      <Card
        title={`${items.length} services`}
        actions={
          !adding && (
            <button type="button" onClick={() => { setAdding(true); setEditingId(null); }} className="font-label text-[11px] uppercase tracking-[0.12em] text-accent-700 hover:text-accent-500">
              + Add service
            </button>
          )
        }
      >
        {adding && (
          <div className="mb-6">
            <ServiceEditor
              isNew
              initial={{ ...BLANK, sort_order: items.length }}
              onSave={async (draft) => { await create(draft); setAdding(false); }}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}

        {items.length === 0 && !adding ? (
          <Empty>No services yet.</Empty>
        ) : (
          <ul className="divide-y divide-line/10">
            {items.map((service) =>
              editingId === service.id ? (
                <li key={service.id} className="py-5">
                  <ServiceEditor
                    initial={service}
                    onSave={async (draft) => { await update(service.id, draft); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li key={service.id} className="flex flex-wrap items-center gap-4 py-4">
                  <ModeTag mode={service.mode} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {service.title}
                      {!service.published && <span className="ml-2 font-label text-[10px] uppercase tracking-[0.1em] text-content/62">Hidden</span>}
                      {Boolean(service.featured) && <span className="ml-2 font-label text-[10px] uppercase tracking-[0.1em] text-accent-700">Featured</span>}
                    </p>
                    <p className="truncate font-label text-[11px] text-content/62">/services/{service.slug}</p>
                  </div>

                  {confirmId === service.id ? (
                    <div className="flex items-center gap-3 font-label text-[11px] uppercase tracking-[0.1em]">
                      <span className="text-content/60">Delete?</span>
                      <button type="button" onClick={async () => { await remove(service.id); setConfirmId(null); }} className="text-accent-700 hover:text-accent-500">Yes, delete</button>
                      <button type="button" onClick={() => setConfirmId(null)} className="text-content/65 hover:text-content">Keep</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 font-label text-[11px] uppercase tracking-[0.1em]">
                      <button type="button" onClick={() => { setEditingId(service.id); setAdding(false); }} className="text-content/66 hover:text-content">Edit</button>
                      <button type="button" onClick={() => setConfirmId(service.id)} className="text-accent-700 hover:text-accent-500">Delete</button>
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
