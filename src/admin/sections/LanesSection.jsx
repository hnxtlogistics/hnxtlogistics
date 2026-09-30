import { useContentBlock } from '../useContentBlock';
import { Field } from '../../components/primitives';
import { Card, Empty, PanelHeader, SaveBar } from '../ui';

const MODES = [
  { value: 'ROAD', label: 'ROAD' },
  { value: 'AIR', label: 'AIR' },
  { value: 'SEA', label: 'SEA' },
  { value: 'MULTI', label: 'MULTI' }
];

export default function LanesSection() {
  const block = useContentBlock('lanes');
  if (block.loading) return <p className="text-sm text-content/66">Loading…</p>;
  if (!block.draft) return <p className="text-sm text-accent-700">{block.error}</p>;

  const lanes = Array.isArray(block.draft) ? block.draft : [];
  const update = (index, patch) =>
    block.replace(lanes.map((lane, i) => (i === index ? { ...lane, ...patch } : lane)));

  return (
    <form onSubmit={block.save} noValidate>
      <PanelHeader
        title="Lane board"
        description="The scrolling strip under the home page headline. Use short codes — airport, port or city codes read best."
      />

      <Card
        title={`${lanes.length} lanes`}
        actions={
          lanes.length < 20 && (
            <button
              type="button"
              onClick={() => block.replace([...lanes, { origin: '', destination: '', mode: 'ROAD', service: '' }])}
              className="font-label text-[11px] uppercase tracking-[0.12em] text-accent-700 hover:text-accent-500"
            >
              + Add lane
            </button>
          )
        }
      >
        {lanes.length === 0 ? (
          <Empty>No lanes yet. The strip is hidden while this list is empty.</Empty>
        ) : (
          <div className="space-y-4">
            {lanes.map((lane, index) => (
              <div key={index} className="grid items-end gap-4 border border-line/12 p-4 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                <Field label="From" name={`lane-origin-${index}`} value={lane.origin} onChange={(e) => update(index, { origin: e.target.value.toUpperCase() })} />
                <Field label="To" name={`lane-dest-${index}`} value={lane.destination} onChange={(e) => update(index, { destination: e.target.value.toUpperCase() })} />
                <Field label="Mode" name={`lane-mode-${index}`} options={MODES} value={lane.mode} onChange={(e) => update(index, { mode: e.target.value })} />
                <Field label="Service" name={`lane-service-${index}`} value={lane.service} onChange={(e) => update(index, { service: e.target.value.toUpperCase() })} />
                <button
                  type="button"
                  onClick={() => block.replace(lanes.filter((_, i) => i !== index))}
                  className="pb-3 font-label text-[11px] uppercase tracking-[0.1em] text-accent-700 hover:text-accent-500"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <SaveBar dirty={block.dirty} saving={block.saving} saved={block.saved} error={block.error} onReset={block.reset} />
    </form>
  );
}
