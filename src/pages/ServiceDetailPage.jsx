import { Link, Navigate, useParams } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import PageHeader from '../components/PageHeader';
import { ModeTag } from '../components/primitives';

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const { serviceBySlug, services, company, status } = useSite();
  const service = serviceBySlug(slug);

  useDocumentMeta({
    title: service ? `${service.title} — ${company.name || 'HNXT Logistics'}` : 'Service',
    description: service?.summary,
    canonicalPath: `/services/${slug}`
  });

  if (status === 'loading') return <div className="min-h-screen bg-brand" />;
  if (!service) return <Navigate to="/services" replace />;

  const related = services.filter((s) => s.slug !== service.slug && s.mode === service.mode).slice(0, 3);

  const specs = [
    { label: 'Mode', value: service.mode },
    { label: 'Coverage', value: service.lane },
    { label: 'Typical transit', value: service.transit }
  ].filter((spec) => spec.value);

  return (
    <>
      <PageHeader
        eyebrow="Service"
        title={service.title}
        lede={service.summary}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Services', to: '/services' }, { label: service.title }]}
      />

      <section className="bg-canvas py-16 lg:py-24">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="text-lg leading-relaxed text-content/78">{service.body}</p>

            <div className="mt-12 border-t border-line/14 pt-10">
              <h2 className="text-2xl">What you get</h2>
              <ul className="mt-6 space-y-4">
                {[
                  'A confirmed mode, transit window and rate before the cargo moves.',
                  'A single reference number that follows the shipment across every leg.',
                  'Packing specified against the route, not against whatever is on the shelf.',
                  'Status updates at each transfer point, and proof of delivery on the same file.'
                ].map((item) => (
                  <li key={item} className="flex gap-4">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent-500" />
                    <span className="text-[15px] leading-relaxed text-content/72">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Spec panel, set like the header block of a consignment note. */}
          <aside className="lg:col-span-5">
            <div className="border border-line/14 bg-surface">
              <div className="border-b border-line/14 px-6 py-4">
                <p className="eyebrow text-content/66">Service record</p>
              </div>
              <dl className="divide-y divide-line/10">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex items-baseline justify-between gap-6 px-6 py-4">
                    <dt className="font-label text-[11px] uppercase tracking-[0.14em] text-content/65">
                      {spec.label}
                    </dt>
                    <dd className="text-right text-sm font-medium">
                      {spec.label === 'Mode' ? <ModeTag mode={service.mode} /> : spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="border-t border-line/14 p-6">
                <Link to="/quote" className="btn btn-accent w-full">Quote this service</Link>
                {company.email && (
                  <a href={`mailto:${company.email}`} className="btn btn-ghost-dark mt-3 w-full">
                    Ask a question
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <div className="shell mt-20">
            <h2 className="text-xl">Also moves by {service.mode.toLowerCase()}</h2>
            <div className="mt-6 grid gap-px border border-line/12 bg-line/12 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to={`/services/${item.slug}`}
                  className="group bg-surface p-6 transition-colors hover:bg-brand"
                >
                  <h3 className="text-lg transition-colors group-hover:text-on-brand">{item.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-content/62 transition-colors group-hover:text-on-brand/70">
                    {item.summary}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
