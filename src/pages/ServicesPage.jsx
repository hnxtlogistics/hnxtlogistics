import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import PageHeader from '../components/PageHeader';
import { ModeTag, Reveal } from '../components/primitives';
import Icon from '../components/Icon';

const MODE_ICON = { ROAD: 'truck', AIR: 'plane', SEA: 'ship', MULTI: 'layers' };

const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'ROAD', label: 'Road' },
  { value: 'AIR', label: 'Air' },
  { value: 'SEA', label: 'Sea' },
  { value: 'MULTI', label: 'Multi-modal' }
];

export default function ServicesPage() {
  const { services, company } = useSite();
  const [filter, setFilter] = useState('ALL');

  useDocumentMeta({
    title: `Services — ${company.name || 'HNXT Logistics'}`,
    description:
      'Road, air and sea freight, freight forwarding, packers and movers, customs support, warehousing, express and last-mile delivery.',
    canonicalPath: '/services'
  });

  const visible = useMemo(
    () => (filter === 'ALL' ? services : services.filter((s) => s.mode === filter)),
    [services, filter]
  );

  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Everything we can put on a truck, a plane or a ship"
        lede="Fifteen services run off one desk. Filter by mode, or send us the shipment and we will pick the route."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Services' }]}
      />

      <section className="bg-canvas py-16 lg:py-24">
        <div className="shell">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter services by mode">
            {FILTERS.map((option) => {
              const active = filter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilter(option.value)}
                  aria-pressed={active}
                  className={`border px-4 py-2 font-label text-[11px] uppercase tracking-[0.14em] transition-colors ${
                    active
                      ? 'border-line bg-brand-2 text-on-brand'
                      : 'border-line/20 text-content/72 hover:border-line/45 hover:text-content'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
            <span className="ml-auto font-label text-[11px] tracking-[0.14em] text-content/62">
              {visible.length} of {services.length}
            </span>
          </div>

          {/* Dense manifest rows on desktop; stacked cards on mobile. */}
          <div className="mt-10 border-t border-line/14">
            {visible.map((service, index) => (
              <Reveal key={service.slug} delay={Math.min(index, 6) * 55}>
                <Link
                  to={`/services/${service.slug}`}
                  className="group grid gap-3 border-b border-line/14 py-7 transition-colors hover:bg-surface md:grid-cols-12 md:items-baseline md:gap-6 md:px-4"
                >
                  <div className="flex items-center gap-3 md:col-span-1">
                    <Icon name={MODE_ICON[service.mode] || 'box'} size={20} className="text-accent-600" />
                    <ModeTag mode={service.mode} />
                  </div>
                  <h2 className="text-xl md:col-span-4 md:text-[1.375rem]">{service.title}</h2>
                  <p className="text-[15px] leading-relaxed text-content/65 md:col-span-5">
                    {service.summary}
                  </p>
                  <div className="flex items-center justify-between gap-4 md:col-span-2 md:justify-end">
                    <span className="font-label text-[11px] tracking-[0.12em] text-content/62">
                      {service.transit}
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-accent-700 transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="py-16 text-center text-content/72">
              No services under this mode yet. Try another filter.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
