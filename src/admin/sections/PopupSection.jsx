import { useContentBlock } from '../useContentBlock';
import { Field } from '../../components/primitives';
import { Card, PanelHeader, SaveBar } from '../ui';

export default function PopupSection() {
  const block = useContentBlock('popup');
  if (block.loading) return <p className="text-sm text-content/66">Loading…</p>;
  if (!block.draft) return <p className="text-sm text-accent-700">{block.error}</p>;

  const on = Number(block.draft.enabled) === 1;

  return (
    <form onSubmit={block.save} noValidate>
      <PanelHeader
        title="Contact pop-up"
        description="A small panel that appears after a visitor has been on the page for a while, showing your contact details. It uses whatever is set in Contact details, so you never have to retype a number here."
      />

      <Card title="Behaviour">
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={on}
            onChange={(e) => block.set({ enabled: e.target.checked ? 1 : 0 })}
            className="h-4 w-4 accent-[var(--color-accent-500)]"
          />
          Show the pop-up to visitors
        </label>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Field
            label="Appears after" name="delaySeconds" type="number"
            hint="Seconds on the page. 10 is the default; under 3 is not allowed."
            value={block.draft.delaySeconds ?? 10}
            error={block.fieldErrors.delaySeconds}
            onChange={(e) => block.set({ delaySeconds: e.target.value })}
          />
          <Field
            label="Stay hidden for" name="dismissDays" type="number"
            hint="Days before it shows again to someone who closed it. 1 is the default; 0 shows it every visit."
            value={block.draft.dismissDays ?? 1}
            error={block.fieldErrors.dismissDays}
            onChange={(e) => block.set({ dismissDays: e.target.value })}
          />
        </div>

        <p className="mt-6 border border-line/12 bg-canvas px-4 py-3 text-[13px] leading-relaxed text-content/75">
          It never appears on the Contact or Get a quote pages, where it would
          only repeat what the visitor is already reading.
        </p>
      </Card>

      <Card title="Wording">
        <div className="space-y-6">
          <Field
            label="Heading" name="heading" required
            value={block.draft.heading ?? ''} error={block.fieldErrors.heading}
            onChange={(e) => block.set({ heading: e.target.value })}
          />
          <Field
            label="Message" name="body" rows={3}
            value={block.draft.body ?? ''} error={block.fieldErrors.body}
            onChange={(e) => block.set({ body: e.target.value })}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              label="Button text" name="ctaLabel" hint="Leave empty to hide the button"
              value={block.draft.ctaLabel ?? ''} error={block.fieldErrors.ctaLabel}
              onChange={(e) => block.set({ ctaLabel: e.target.value })}
            />
            <Field
              label="Button link" name="ctaTo" hint="e.g. /quote or /contact"
              value={block.draft.ctaTo ?? ''} error={block.fieldErrors.ctaTo}
              onChange={(e) => block.set({ ctaTo: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <SaveBar dirty={block.dirty} saving={block.saving} saved={block.saved} error={block.error} onReset={block.reset} />
    </form>
  );
}
