import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import PageHeader from '../components/PageHeader';
import { Reveal, SectionHead } from '../components/primitives';

export default function AboutPage() {
  const { about, company, addressLines } = useSite();

  useDocumentMeta({
    title: `About — ${company.name || 'HNXT Logistics'}`,
    description: about.lede,
    canonicalPath: '/about'
  });

  return (
    <>
      <PageHeader
        eyebrow="About"
        title={about.heading}
        lede={about.lede}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'About' }]}
      />

      <section className="bg-canvas py-16 lg:py-24">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {about.body?.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mb-6 text-lg leading-relaxed text-content/78">
                {paragraph}
              </p>
            ))}
          </div>

          <aside className="lg:col-span-5">
            <img
              src="/img/about.jpg"
              alt="Cargo being handled at a loading dock"
              className="w-full object-cover"
              loading="lazy"
            />
            <div className="mt-6 border border-line/14 bg-surface p-6">
              <p className="eyebrow text-content/66">Where we are</p>
              <address className="mt-4 space-y-1 text-sm not-italic leading-relaxed text-content/75">
                {addressLines.map((line) => <span key={line} className="block">{line}</span>)}
              </address>
              {company.hours && (
                <p className="mt-4 font-label text-[11px] tracking-[0.12em] text-content/65">
                  {company.hours}
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>

      {about.values?.length > 0 && (
        <section className="bg-brand py-24 text-on-brand lg:py-32">
          <div className="shell">
            <SectionHead eyebrow="How we work" title="Four commitments we can actually hold" tone="light" />
            <div className="mt-14 grid gap-px bg-on-brand/12 md:grid-cols-2">
              {about.values.map((value, index) => (
                <Reveal key={value.title} delay={index * 80} className="bg-brand p-8 lg:p-10">
                  <h3 className="text-xl">{value.title}</h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-on-brand/68">{value.text}</p>
                </Reveal>
              ))}
            </div>

            <div className="mt-14 flex flex-wrap gap-4">
              <Link to="/quote" className="btn btn-accent">Get a quote</Link>
              <Link to="/contact" className="btn btn-ghost-light">Talk to us</Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
