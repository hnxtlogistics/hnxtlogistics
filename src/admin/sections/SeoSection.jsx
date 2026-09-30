import { useContentBlock } from '../useContentBlock';
import { Field } from '../../components/primitives';
import { Card, PanelHeader, SaveBar } from '../ui';

export default function SeoSection() {
  const block = useContentBlock('seo');
  if (block.loading) return <p className="text-sm text-content/66">Loading…</p>;
  if (!block.draft) return <p className="text-sm text-accent-700">{block.error}</p>;

  return (
    <form onSubmit={block.save} noValidate>
      <PanelHeader
        title="Search listing"
        description="How the home page appears in Google results and when someone shares the link."
      />

      <Card title="Home page listing">
        <div className="space-y-6">
          <Field label="Page title" name="title" required hint="Aim for 50–60 characters" value={block.draft.title ?? ''} error={block.fieldErrors.title} onChange={(e) => block.set({ title: e.target.value })} />
          <Field label="Description" name="description" rows={3} hint="Aim for 140–160 characters" value={block.draft.description ?? ''} error={block.fieldErrors.description} onChange={(e) => block.set({ description: e.target.value })} />
          <Field label="Keywords" name="keywords" hint="Comma separated" value={block.draft.keywords ?? ''} error={block.fieldErrors.keywords} onChange={(e) => block.set({ keywords: e.target.value })} />
        </div>
      </Card>

      <Card title="Preview">
        {/* Deliberately fixed light: this imitates a Google result, which is
            white with dark text whatever theme the admin is using. */}
        <div className="max-w-xl border border-line/12 bg-white p-5">
          <p className="truncate font-label text-[11px] font-medium text-[#5f6368]">{window.location.origin}</p>
          <p className="mt-1 text-lg text-[#1a0dab]">{block.draft.title || 'Untitled page'}</p>
          <p className="mt-1 text-sm leading-relaxed text-[#4d5156]">
            {block.draft.description || 'No description set.'}
          </p>
        </div>
        <p className="mt-4 font-label text-[11px] text-content/70">
          Title {(block.draft.title || '').length} chars · Description {(block.draft.description || '').length} chars
        </p>
      </Card>

      <SaveBar dirty={block.dirty} saving={block.saving} saved={block.saved} error={block.error} onReset={block.reset} />
    </form>
  );
}
