import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import LaneManifest from '../components/LaneManifest';
import { Eyebrow, ModeTag, Reveal, SectionHead } from '../components/primitives';
import Icon from '../components/Icon';

const MODE_ICON = { ROAD: 'truck', AIR: 'plane', SEA: 'ship', MULTI: 'layers' };
const STEP_ICON = ['clipboard', 'box', 'route', 'pin'];

export default function HomePage() {
  const { home, seo, services, featuredServices, faqs, company } = useSite();
  useDocumentMeta({ title: seo.title, description: seo.description, canonicalPath: '/' });

  const shown = featuredServices.length ? featuredServices : services.slice(0, 3);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-brand pt-[76px] text-on-brand">
        <img
          src="/img/world-dotted-map.png"
          alt=""
          aria-hidden="true"
          width="1000" height="500" fetchPriority="low" decoding="async"
          className="pointer-events-none absolute right-0 top-1/2 w-[70%] max-w-4xl -translate-y-1/2 opacity-[0.07]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-0 h-[36rem] w-[36rem] rounded-full bg-accent-500/12 blur-[130px]"
        />

        <div className="shell relative grid gap-14 py-20 lg:grid-cols-12 lg:items-center lg:py-28">
          <div className="lg:col-span-7">
            {home.eyebrow && (
              <Reveal>
                <Eyebrow className="text-accent-400">{home.eyebrow}</Eyebrow>
              </Reveal>
            )}

            <Reveal delay={70}>
              <h1 className="mt-6 text-[length:var(--text-hero)]">{home.heading}</h1>
            </Reveal>

            <Reveal delay={140}>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-on-brand/75 sm:text-xl">
                {home.lede}
              </p>
            </Reveal>

            <Reveal delay={210}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link to={home.primaryCta?.to || '/quote'} className="btn btn-accent">
                  {home.primaryCta?.label || 'Get a quote'}
                </Link>
                <Link to={home.secondaryCta?.to || '/services'} className="btn btn-ghost-light">
                  {home.secondaryCta?.label || 'See what we move'}
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Stats read as a docket summary block, not floating numbers. */}
          {home.stats?.length > 0 && (
            <Reveal delay={280} className="lg:col-span-5">
              <dl className="divide-y divide-on-brand/12 border-y border-on-brand/12 lg:border lg:border-on-brand/12 lg:bg-on-brand/[0.05] lg:px-7">
                {home.stats.map((stat) => (
                  <div key={stat.label} className="flex items-baseline gap-5 py-5">
                    <dt className="flex shrink-0 items-baseline gap-1.5">
                      <span className="font-display text-4xl font-bold text-accent-500">{stat.value}</span>
                      <span className="font-label text-[11px] uppercase tracking-[0.16em] text-on-brand/74">
                        {stat.unit}
                      </span>
                    </dt>
                    <dd className="text-sm leading-snug text-on-brand/75">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </div>
      </section>

      <LaneManifest />

      {/* ── Featured services ────────────────────────────────────────── */}
      <section className="bg-canvas py-24 lg:py-32">
        <div className="shell">
          <SectionHead
            eyebrow="What we move"
            title="Three modes, one file"
            lede="Most shipments only need one of these. The ones that need all three are why forwarding exists."
          />

          <div className="mt-14 grid gap-px border border-line/12 bg-line/12 md:grid-cols-3">
            {shown.map((service, index) => (
              <Reveal key={service.slug} delay={index * 90}>
                <Link
                  to={`/services/${service.slug}`}
                  className="group flex h-full flex-col bg-surface p-8 transition-colors duration-300 hover:bg-brand lg:p-10"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2.5">
                      <Icon
                        name={MODE_ICON[service.mode] || 'box'}
                        size={22}
                        className="text-accent-600 transition-colors group-hover:text-accent-400"
                      />
                      <ModeTag mode={service.mode} invertOnHover />
                    </span>
                    <span className="font-label text-[11px] tracking-[0.14em] text-content/62 transition-colors group-hover:text-on-brand/72">
                      {service.transit}
                    </span>
                  </div>

                  <h3 className="mt-7 text-2xl transition-colors group-hover:text-on-brand">
                    {service.title}
                  </h3>
                  <p className="mt-4 flex-1 text-[15px] leading-relaxed text-content/65 transition-colors group-hover:text-on-brand/70">
                    {service.summary}
                  </p>

                  <span className="mt-8 inline-flex items-center gap-2 font-label text-[11px] uppercase tracking-[0.16em] text-accent-700 transition-colors group-hover:text-accent-400">
                    Details
                    <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>

          <div className="mt-10">
            <Link to="/services" className="btn btn-ghost-dark">
              All {services.length} services
            </Link>
          </div>
        </div>
      </section>

      {/* ── Process — genuinely a sequence, so it is numbered ─────────── */}
      <section className="bg-brand py-24 text-on-brand lg:py-32">
        <div className="shell">
          <SectionHead
            eyebrow="Process"
            title={home.processHeading}
            lede={home.processLede}
            tone="light"
          />

          <ol className="mt-16 grid gap-px bg-on-brand/12 md:grid-cols-2 lg:grid-cols-4">
            {home.process?.map((step, index) => (
              <Reveal as="li" key={step.code} delay={index * 90} className="bg-brand p-8">
                <div className="flex items-center gap-3">
                  <Icon name={STEP_ICON[index] || 'check'} size={20} className="text-accent-400" />
                  <span className="font-label text-xs font-semibold tracking-[0.12em] text-accent-400">{step.code}</span>
                  <span className="h-px flex-1 bg-on-brand/15" />
                </div>
                <h3 className="mt-6 text-xl">{step.title}</h3>
                <p className="mt-3.5 text-sm leading-relaxed text-on-brand/68">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section className="bg-canvas py-24 lg:py-32">
          <div className="shell grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHead eyebrow="Questions" title="Before you book" />
            </div>
            <div className="lg:col-span-8">
              <div className="border-t border-line/14">
                {faqs.map((faq) => (
                  <details key={faq.question} className="group border-b border-line/14">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-left [&::-webkit-details-marker]:hidden">
                      <h3 className="text-lg font-semibold">{faq.question}</h3>
                      <span
                        aria-hidden="true"
                        className="mt-1 shrink-0 font-label text-accent-700 transition-transform duration-300 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="max-w-2xl pb-7 text-[15px] leading-relaxed text-content/68">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Closing CTA ──────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-brand-2 py-24 text-on-brand lg:py-28">
        <img
          src="/img/cta-bg.jpg"
          alt=""
          aria-hidden="true"
          loading="lazy" decoding="async" width="1600" height="900"
          className="absolute inset-0 h-full w-full object-cover opacity-15"
        />
        <div className="shell relative flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <h2 className="text-[length:var(--text-display)]">Tell us the lane. We will tell you the price.</h2>
            <p className="mt-5 text-lg text-on-brand/75">
              Send the origin, destination, weight and dimensions. You get a mode, a transit window and a
              rate back — no obligation.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-4">
            <Link to="/quote" className="btn btn-accent">Get a quote</Link>
            {company.email && (
              <a href={`mailto:${company.email}`} className="btn btn-ghost-light">Email us</a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
