import { useSite } from '../context/SiteContext';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import PageHeader from '../components/PageHeader';
import EnquiryForm from '../components/EnquiryForm';
import Icon from '../components/Icon';

export default function ContactPage() {
  const { company, addressLines, addressText } = useSite();

  useDocumentMeta({
    title: `Contact — ${company.name || 'HNXT Logistics'}`,
    description: `Get in touch with ${company.name || 'HNXT Logistics'} about freight, delivery, packing and logistics coordination.`,
    canonicalPath: '/contact'
  });

  const channels = [
    company.phone && { label: 'Phone', icon: 'phone', value: company.phone, href: `tel:${company.phone.replace(/\s/g, '')}` },
    company.whatsapp && {
      label: 'WhatsApp',
      icon: 'whatsapp',
      value: company.whatsapp,
      href: `https://wa.me/${company.whatsapp.replace(/\D/g, '')}`
    },
    company.email && { label: 'Email', icon: 'mail', value: company.email, href: `mailto:${company.email}` },
    company.hours && { label: 'Hours', icon: 'clock', value: company.hours }
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to the person who will run your shipment"
        lede="No call centre. Send the details and the coordinator who would handle the load replies."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}
      />

      <section className="bg-canvas py-16 lg:py-24">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <div className="border border-line/14 bg-surface">
              <div className="border-b border-line/14 px-6 py-4">
                <p className="eyebrow text-content/66">Direct lines</p>
              </div>
              <dl className="divide-y divide-line/10">
                {channels.map((channel) => (
                  <div key={channel.label} className="px-6 py-4">
                    <dt className="flex items-center gap-2.5 font-label text-[11px] font-semibold uppercase tracking-[0.1em] text-content/65">
                      <Icon name={channel.icon} size={16} className="text-accent-600" />
                      {channel.label}
                    </dt>
                    <dd className="mt-1.5 pl-[26px] text-[15px] font-medium">
                      {channel.href ? (
                        <a href={channel.href} className="break-all transition-colors hover:text-accent-500">
                          {channel.value}
                        </a>
                      ) : (
                        channel.value
                      )}
                    </dd>
                  </div>
                ))}
                {addressLines.length > 0 && (
                  <div className="px-6 py-4">
                    <dt className="flex items-center gap-2.5 font-label text-[11px] font-semibold uppercase tracking-[0.1em] text-content/65">
                      <Icon name="pin" size={16} className="text-accent-600" />
                      Office
                    </dt>
                    <dd className="mt-1.5 pl-[26px]">
                      <address className="text-[15px] not-italic leading-relaxed">
                        {addressLines.map((line) => <span key={line} className="block">{line}</span>)}
                      </address>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {addressText && (
              <div className="mt-6 border border-line/14">
                <iframe
                  title={`${company.name || 'Our office'} location`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(addressText)}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block h-64 w-full border-0"
                />
              </div>
            )}
          </aside>

          <div className="lg:col-span-8">
            <div className="border border-line/14 bg-surface p-7 lg:p-10">
              <h2 className="text-2xl">Send us a message</h2>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-content/65">
                For a price, the <a href="/quote" className="font-medium text-accent-700 underline underline-offset-4">quote form</a> collects
                the shipment details we need. For anything else, this reaches the same desk.
              </p>
              <div className="mt-8">
                <EnquiryForm kind="contact" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
