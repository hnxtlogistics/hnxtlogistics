import { useSite } from '../context/SiteContext';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import PageHeader from '../components/PageHeader';

export default function PrivacyPage() {
  const { company, addressText } = useSite();
  const name = company.name || 'HNXT Logistics';

  useDocumentMeta({
    title: `Privacy — ${name}`,
    description: `How ${name} collects, uses and stores the information you send through this website.`,
    canonicalPath: '/privacy'
  });

  const sections = [
    ['What we collect', `When you submit the contact or quote form we collect the details you enter: your name, email address, phone number, company name, and the shipment information you provide. We do not use advertising or analytics trackers on this site.`],
    ['Why we collect it', `We use these details for one purpose — to respond to your enquiry and, if you go on to book, to arrange and run the shipment. We do not sell or rent your information to anyone.`],
    ['Who we share it with', `Where a shipment requires a partner — a customs house agent, a warehouse, or a carrier — we share only the details that partner needs to complete their part of the job. We do not share your information for any other reason.`],
    ['How long we keep it', `Enquiries are retained so we can pick up an earlier conversation and meet our record-keeping obligations. You can ask us to delete your enquiry at any time and we will do so unless we are legally required to keep it.`],
    ['Cookies', `This site sets no cookies of its own. Your cookie choice is stored in your browser so the banner does not ask again, and nothing is used to track visitors. If you agree to analytics in the cookie banner, we may also count page visits anonymously — no advertising or cross-site tracking is used either way. Your choice is remembered in your browser; clearing your browsing data will ask you again.`],
    ['Your choices', `You can ask us what information we hold about you, ask us to correct it, or ask us to delete it. Email ${company.email || 'us'} and we will action the request.`],
    ['Contact', `Questions about this notice can go to ${company.email || 'our office'}${addressText ? `, or by post to ${addressText}` : ''}.`]
  ];

  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy notice"
        lede={`How ${name} handles the information you send through this website.`}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Privacy' }]}
      />

      <section className="bg-canvas py-16 lg:py-24">
        <div className="shell max-w-3xl">
          {sections.map(([heading, body]) => (
            <div key={heading} className="mb-10">
              <h2 className="text-xl">{heading}</h2>
              <p className="mt-4 leading-relaxed text-content/75">{body}</p>
            </div>
          ))}
          <p className="mt-14 border-t border-line/14 pt-6 font-label text-[11px] tracking-[0.12em] text-content/62">
            Last updated {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </section>
    </>
  );
}
