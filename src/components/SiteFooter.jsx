import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import Icon from './Icon';
import LogoMark from './LogoMark';

const SOCIALS = [
  { key: 'instagram', label: 'Instagram', icon: 'instagram' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
  { key: 'facebook', label: 'Facebook', icon: 'facebook' }
];

const MODE_ICON = { ROAD: 'truck', AIR: 'plane', SEA: 'ship', MULTI: 'layers' };

export default function SiteFooter() {
  const { company, services, addressLines } = useSite();
  const year = new Date().getFullYear();
  const socials = SOCIALS.filter((social) => company[social.key]);

  return (
    /* Kept white so the logo appears in its original colours, the same way
       it does in the header. The top border carries the separation that a
       dark ground used to. */
    <footer className="border-t-2 border-line/10 bg-surface text-content/78">
      <div className="shell grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4 lg:py-20">
        <div className="lg:col-span-1">
          <LogoMark alt={company.name || 'HNXT Logistics'} imgClassName="h-12 w-auto" />
          <p className="mt-6 max-w-xs text-sm leading-relaxed">
            {company.tagline || 'Freight that keeps its promises.'}
          </p>
          {company.gstin && (
            <p className="mt-5 font-label text-[11px] tracking-[0.12em] text-content/65">
              GSTIN {company.gstin}
            </p>
          )}
        </div>

        <nav aria-label="Services">
          <h3 className="eyebrow text-content/72">Services</h3>
          <ul className="mt-5 space-y-2.5 text-sm">
            {services.slice(0, 6).map((service) => (
              <li key={service.slug}>
                <Link
                  to={`/services/${service.slug}`}
                  className="group flex items-center gap-2.5 transition-colors hover:text-accent-600"
                >
                  <Icon name={MODE_ICON[service.mode] || 'box'} size={16} className="text-content/45 transition-colors group-hover:text-accent-600" />
                  {service.title}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/services" className="group flex items-center gap-2.5 font-medium text-accent-700 transition-colors hover:text-accent-600">
                <Icon name="arrowRight" size={16} className="transition-transform group-hover:translate-x-0.5" />
                All services
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Company">
          <h3 className="eyebrow text-content/72">Company</h3>
          <ul className="mt-5 space-y-2.5 text-sm">
            <li><Link to="/about" className="transition-colors hover:text-accent-600">About us</Link></li>
            <li><Link to="/contact" className="transition-colors hover:text-accent-600">Contact</Link></li>
            <li><Link to="/quote" className="transition-colors hover:text-accent-600">Request a quote</Link></li>
            <li><Link to="/privacy" className="transition-colors hover:text-accent-600">Privacy</Link></li>
          </ul>
        </nav>

        <div>
          <h3 className="eyebrow text-content/72">Get in touch</h3>
          <address className="mt-5 space-y-4 text-sm not-italic">
            {addressLines.length > 0 && (
              <p className="flex gap-3 leading-relaxed">
                <Icon name="pin" size={17} className="mt-0.5 text-accent-600" />
                <span>
                  {addressLines.map((line) => (
                    <span key={line} className="block">{line}</span>
                  ))}
                </span>
              </p>
            )}
            {company.phone && (
              <a href={`tel:${company.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 font-label font-medium transition-colors hover:text-accent-600">
                <Icon name="phone" size={17} className="text-accent-600" />
                {company.phone}
              </a>
            )}
            {company.whatsapp && (
              <a
                href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`}
                target="_blank" rel="noreferrer noopener"
                className="flex items-center gap-3 font-label font-medium transition-colors hover:text-accent-600"
              >
                <Icon name="whatsapp" size={17} className="text-accent-600" />
                WhatsApp
              </a>
            )}
            {(company.secondaryEmail || company.email) && (
              <a href={`mailto:${company.secondaryEmail || company.email}`} className="flex items-start gap-3 break-all transition-colors hover:text-accent-600">
                <Icon name="mail" size={17} className="mt-0.5 text-accent-600" />
                {company.secondaryEmail || company.email}
              </a>
            )}
            {company.hours && (
              <p className="flex items-center gap-3 text-content/68">
                <Icon name="clock" size={17} className="text-accent-600" />
                {company.hours}
              </p>
            )}
          </address>

          {socials.length > 0 && (
            <ul className="mt-6 flex gap-4">
              {socials.map((social) => (
                <li key={social.key}>
                  <a
                    href={company[social.key]}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                    title={social.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-line/20 transition-colors hover:border-accent-600 hover:bg-accent-500/10 hover:text-accent-600"
                  >
                    <Icon name={social.icon} size={18} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-line/10">
        <div className="shell flex flex-col gap-3 py-6 text-[13px] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {company.legalName || company.name || 'HNXT Logistics'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
