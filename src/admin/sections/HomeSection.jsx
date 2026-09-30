import { useContentBlock } from '../useContentBlock';
import { Field } from '../../components/primitives';
import { Card, Empty, PanelHeader, SaveBar } from '../ui';

/** Edits one row of a repeatable list held inside the block. */
function listOps(block, key) {
  const items = block.draft[key] || [];
  return {
    items,
    update: (index, patch) =>
      block.set({ [key]: items.map((item, i) => (i === index ? { ...item, ...patch } : item)) }),
    remove: (index) => block.set({ [key]: items.filter((_, i) => i !== index) }),
    add: (blank) => block.set({ [key]: [...items, blank] }),
    move: (index, delta) => {
      const next = [...items];
      const target = index + delta;
      if (target < 0 || target >= next.length) return;
      [next[index], next[target]] = [next[target], next[index]];
      block.set({ [key]: next });
    }
  };
}

function RowControls({ ops, index, count }) {
  return (
    <div className="flex items-center gap-3 font-label text-[11px] uppercase tracking-[0.1em]">
      <button type="button" onClick={() => ops.move(index, -1)} disabled={index === 0} className="text-content/65 transition-colors hover:text-content disabled:opacity-25">
        ↑ Up
      </button>
      <button type="button" onClick={() => ops.move(index, 1)} disabled={index === count - 1} className="text-content/65 transition-colors hover:text-content disabled:opacity-25">
        ↓ Down
      </button>
      <button type="button" onClick={() => ops.remove(index)} className="text-accent-700 transition-colors hover:text-accent-500">
        Remove
      </button>
    </div>
  );
}

export default function HomeSection() {
  const block = useContentBlock('home');
  if (block.loading) return <p className="text-sm text-content/66">Loading…</p>;
  if (!block.draft) return <p className="text-sm text-accent-700">{block.error}</p>;

  const stats = listOps(block, 'stats');
  const steps = listOps(block, 'process');

  return (
    <form onSubmit={block.save} noValidate>
      <PanelHeader
        title="Home page"
        description="The headline, the summary block and the four process steps that visitors see first."
      />

      <Card title="Hero">
        <div className="space-y-6">
          <Field label="Eyebrow" name="eyebrow" hint="Small line above the headline" value={block.draft.eyebrow ?? ''} error={block.fieldErrors.eyebrow} onChange={(e) => block.set({ eyebrow: e.target.value })} />
          <Field label="Headline" name="heading" required rows={2} value={block.draft.heading ?? ''} error={block.fieldErrors.heading} onChange={(e) => block.set({ heading: e.target.value })} />
          <Field label="Opening paragraph" name="lede" rows={3} value={block.draft.lede ?? ''} error={block.fieldErrors.lede} onChange={(e) => block.set({ lede: e.target.value })} />
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Primary button text" name="primaryLabel" value={block.draft.primaryCta?.label ?? ''} onChange={(e) => block.set({ primaryCta: { ...block.draft.primaryCta, label: e.target.value } })} />
            <Field label="Primary button link" name="primaryTo" hint="e.g. /quote" value={block.draft.primaryCta?.to ?? ''} onChange={(e) => block.set({ primaryCta: { ...block.draft.primaryCta, to: e.target.value } })} />
            <Field label="Secondary button text" name="secondaryLabel" value={block.draft.secondaryCta?.label ?? ''} onChange={(e) => block.set({ secondaryCta: { ...block.draft.secondaryCta, label: e.target.value } })} />
            <Field label="Secondary button link" name="secondaryTo" hint="e.g. /services" value={block.draft.secondaryCta?.to ?? ''} onChange={(e) => block.set({ secondaryCta: { ...block.draft.secondaryCta, to: e.target.value } })} />
          </div>
        </div>
      </Card>

      <Card
        title="Summary figures"
        actions={
          stats.items.length < 4 && (
            <button type="button" onClick={() => stats.add({ value: '', unit: '', label: '' })} className="font-label text-[11px] uppercase tracking-[0.12em] text-accent-700 hover:text-accent-500">
              + Add figure
            </button>
          )
        }
      >
        {stats.items.length === 0 ? (
          <Empty>No figures yet. Add up to four.</Empty>
        ) : (
          <div className="space-y-6">
            {stats.items.map((stat, index) => (
              <div key={index} className="border border-line/12 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-label text-[11px] tracking-[0.12em] text-content/62">Figure {index + 1}</span>
                  <RowControls ops={stats} index={index} count={stats.items.length} />
                </div>
                <div className="grid gap-5 sm:grid-cols-[6rem_10rem_1fr]">
                  <Field label="Number" name={`stat-value-${index}`} value={stat.value} onChange={(e) => stats.update(index, { value: e.target.value })} />
                  <Field label="Unit" name={`stat-unit-${index}`} value={stat.unit} onChange={(e) => stats.update(index, { unit: e.target.value })} />
                  <Field label="Description" name={`stat-label-${index}`} value={stat.label} onChange={(e) => stats.update(index, { label: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="Process steps"
        actions={
          steps.items.length < 6 && (
            <button type="button" onClick={() => steps.add({ code: `S${steps.items.length + 1}`, title: '', text: '' })} className="font-label text-[11px] uppercase tracking-[0.12em] text-accent-700 hover:text-accent-500">
              + Add step
            </button>
          )
        }
      >
        <div className="mb-6 grid gap-5 sm:grid-cols-2">
          <Field label="Section heading" name="processHeading" value={block.draft.processHeading ?? ''} onChange={(e) => block.set({ processHeading: e.target.value })} />
          <Field label="Section intro" name="processLede" value={block.draft.processLede ?? ''} onChange={(e) => block.set({ processLede: e.target.value })} />
        </div>

        {steps.items.length === 0 ? (
          <Empty>No steps yet.</Empty>
        ) : (
          <div className="space-y-6">
            {steps.items.map((step, index) => (
              <div key={index} className="border border-line/12 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-label text-[11px] tracking-[0.12em] text-content/62">Step {index + 1}</span>
                  <RowControls ops={steps} index={index} count={steps.items.length} />
                </div>
                <div className="grid gap-5 sm:grid-cols-[5rem_1fr]">
                  <Field label="Code" name={`step-code-${index}`} value={step.code} onChange={(e) => steps.update(index, { code: e.target.value })} />
                  <Field label="Title" name={`step-title-${index}`} value={step.title} onChange={(e) => steps.update(index, { title: e.target.value })} />
                </div>
                <Field className="mt-5" label="Description" name={`step-text-${index}`} rows={2} value={step.text} onChange={(e) => steps.update(index, { text: e.target.value })} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <SaveBar dirty={block.dirty} saving={block.saving} saved={block.saved} error={block.error} onReset={block.reset} />
    </form>
  );
}
