import { useSite } from '../context/SiteContext';
import { ModeTag } from './primitives';

/**
 * The site's signature element: a departures-board strip of the lanes we
 * actually run. Duplicated once so the marquee can loop seamlessly, and
 * frozen into a static grid when the visitor prefers reduced motion.
 */
export default function LaneManifest() {
  const { lanes } = useSite();
  if (!lanes.length) return null;

  const track = [...lanes, ...lanes];

  return (
    <section
      aria-label="Lanes we run"
      className="overflow-hidden border-y border-on-brand/12 bg-brand"
    >
      <div className="flex items-stretch">
        <div className="hidden shrink-0 items-center gap-3 border-r border-on-brand/12 px-6 md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-500 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-500" />
          </span>
          <span className="eyebrow whitespace-nowrap text-on-brand/70">Active lanes</span>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="lane-marquee">
            {track.map((lane, index) => (
              <div
                key={`${lane.origin}-${lane.destination}-${index}`}
                aria-hidden={index >= lanes.length}
                className="flex shrink-0 items-center gap-4 border-r border-on-brand/10 px-7 py-4"
              >
                <span className="font-label text-sm font-medium tracking-wider text-on-brand">
                  {lane.origin}
                </span>
                <span className="text-accent-500" aria-hidden="true">→</span>
                <span className="font-label text-sm font-medium tracking-wider text-on-brand">
                  {lane.destination}
                </span>
                <ModeTag mode={lane.mode} tone="dark" />
                <span className="font-label text-[11px] tracking-[0.14em] text-on-brand/74">
                  {lane.service}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
