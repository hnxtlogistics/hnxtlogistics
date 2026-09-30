import { useContentBlock } from '../useContentBlock';
import { Field } from '../../components/primitives';
import { Card, Empty, PanelHeader, SaveBar } from '../ui';

export default function AboutSection() {
  const block = useContentBlock('about');
  if (block.loading) return <p className="text-sm text-content/66">Loading…</p>;
  if (!block.draft) return <p className="text-sm text-accent-700">{block.error}</p>;

  const body = block.draft.body || [];
  const values = block.draft.values || [];

  return (
    <form onSubmit={block.save} noValidate>
      <PanelHeader title="About page" description="Your story and the commitments listed underneath it." />

      <Card title="Introduction">
        <div className="space-y-6">
          <Field label="Heading" name="heading" required value={block.draft.heading ?? ''} error={block.fieldErrors.heading} onChange={(e) => block.set({ heading: e.target.value })} />
          <Field label="Summary" name="lede" rows={3} value={block.draft.lede ?? ''} error={block.fieldErrors.lede} onChange={(e) => block.set({ lede: e.target.value })} />
        </div>
      </Card>

      <Card
        title="Body paragraphs"
        actions={
          <button type="button" onClick={() => block.set({ body: [...body, ''] })} className="font-label text-[11px] uppercase tracking-[0.12em] text-accent-700 hover:text-accent-500">
            + Add paragraph
          </button>
        }
      >
        {body.length === 0 ? (
          <Empty>No paragraphs yet.</Empty>
        ) : (
          <div className="space-y-5">
            {body.map((paragraph, index) => (
              <div key={index}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-label text-[11px] tracking-[0.12em] text-content/62">Paragraph {index + 1}</span>
                  <button type="button" onClick={() => block.set({ body: body.filter((_, i) => i !== index) })} className="font-label text-[11px] uppercase tracking-[0.1em] text-accent-700 hover:text-accent-500">
                    Remove
                  </button>
                </div>
                <textarea
                  className="field-input"
                  rows={4}
                  value={paragraph}
                  aria-label={`Paragraph ${index + 1}`}
                  onChange={(e) => block.set({ body: body.map((p, i) => (i === index ? e.target.value : p)) })}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="Commitments"
        actions={
          values.length < 8 && (
            <button type="button" onClick={() => block.set({ values: [...values, { title: '', text: '' }] })} className="font-label text-[11px] uppercase tracking-[0.12em] text-accent-700 hover:text-accent-500">
              + Add commitment
            </button>
          )
        }
      >
        {values.length === 0 ? (
          <Empty>No commitments yet.</Empty>
        ) : (
          <div className="space-y-6">
            {values.map((value, index) => (
              <div key={index} className="border border-line/12 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-label text-[11px] tracking-[0.12em] text-content/62">Item {index + 1}</span>
                  <button type="button" onClick={() => block.set({ values: values.filter((_, i) => i !== index) })} className="font-label text-[11px] uppercase tracking-[0.1em] text-accent-700 hover:text-accent-500">
                    Remove
                  </button>
                </div>
                <Field label="Title" name={`value-title-${index}`} value={value.title} onChange={(e) => block.set({ values: values.map((v, i) => (i === index ? { ...v, title: e.target.value } : v)) })} />
                <Field className="mt-5" label="Description" name={`value-text-${index}`} rows={2} value={value.text} onChange={(e) => block.set({ values: values.map((v, i) => (i === index ? { ...v, text: e.target.value } : v)) })} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <SaveBar dirty={block.dirty} saving={block.saving} saved={block.saved} error={block.error} onReset={block.reset} />
    </form>
  );
}
