import { useSite } from '../context/SiteContext';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import PageHeader from '../components/PageHeader';
import EnquiryForm from '../components/EnquiryForm';

const NEEDED = [
  ['Origin & destination', 'City is enough to start. Full addresses let us price the pickup and delivery legs properly.'],
  ['Weight & dimensions', 'Gross weight and the size of the largest piece. Approximate is fine.'],
  ['Timing', 'The date it needs to arrive by, if there is one. This usually decides the mode.'],
  ['Cargo type', 'Anything fragile, hazardous, temperature-controlled or high-value changes how we pack and route it.']
];

export default function QuotePage() {
  const { company } = useSite();

  useDocumentMeta({
    title: `Get a quote — ${company.name || 'HNXT Logistics'}`,
    description:
      'Send your shipment details and get a mode, transit window and rate back from HNXT Logistics — no obligation.',
    canonicalPath: '/quote'
  });

  return (
    <>
      <PageHeader
        eyebrow="Quote"
        title="Price a shipment"
        lede="Fill in what you know. We come back with a mode, a transit window and a rate — usually within one working day."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Get a quote' }]}
      />

      <section className="bg-canvas py-16 lg:py-24">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="border border-line/14 bg-surface p-7 lg:p-10">
              <EnquiryForm kind="quote" />
            </div>
          </div>

          <aside className="lg:col-span-5">
            <h2 className="text-2xl">What helps us price it accurately</h2>
            <dl className="mt-8 border-t border-line/14">
              {NEEDED.map(([term, detail]) => (
                <div key={term} className="border-b border-line/14 py-5">
                  <dt className="font-display text-[15px] font-semibold">{term}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-content/65">{detail}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 border border-line/14 bg-brand p-6 text-on-brand">
              <p className="eyebrow text-accent-400">Prefer to talk?</p>
              <p className="mt-3 text-sm leading-relaxed text-on-brand/72">
                Complicated shipments are faster to explain than to type.
              </p>
              <div className="mt-5 space-y-2 font-label text-sm">
                {company.phone && (
                  <a href={`tel:${company.phone.replace(/\s/g, '')}`} className="block transition-colors hover:text-accent-400">
                    {company.phone}
                  </a>
                )}
                {company.email && (
                  <a href={`mailto:${company.email}`} className="block break-all transition-colors hover:text-accent-400">
                    {company.email}
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
