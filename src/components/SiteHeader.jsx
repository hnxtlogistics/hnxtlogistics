import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import Icon from './Icon';
import LogoMark from './LogoMark';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' }
];

export default function SiteHeader() {
  const { company } = useSite();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const linkClass = ({ isActive }) =>
    `relative py-2 font-display text-[0.9375rem] font-medium transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:bg-accent-500 after:transition-all ${
      isActive
        ? 'text-content after:w-full'
        : 'text-content/62 after:w-0 hover:text-content hover:after:w-full'
    }`;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-accent-500 focus:px-4 focus:py-2 focus:font-label focus:text-sm focus:text-[#06081A]"
      >
        Skip to content
      </a>

      {/* The header is kept light on purpose: the logo is an indigo and
          grey mark drawn for a white ground, and it loses most of its
          contrast on anything dark. */}
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b bg-surface transition-shadow duration-300 ${
          scrolled || open
            ? 'border-line/10 shadow-[0_1px_24px_rgba(10,12,40,0.08)]'
            : 'border-line/8'
        }`}
      >
        <div className="shell flex h-[76px] items-center justify-between gap-6">
          {/* The mark already sets the company name — repeating it as text
              beside the logo only competes with it. */}
          <LogoMark to="/" alt={company.name || 'HNXT Logistics'} />

          <nav aria-label="Main" className="hidden items-center gap-9 lg:flex">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            {company.phone && (
              <a
                href={`tel:${company.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-2 font-label text-sm font-medium text-content/72 transition-colors hover:text-accent-600"
              >
                <Icon name="phone" size={16} />
                {company.phone}
              </a>
            )}
            <Link to="/quote" className="btn btn-accent !py-2.5 !px-5 !text-sm">
              Get a quote
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] lg:hidden"
          >
            <span className={`h-[2px] w-6 bg-brand-2 transition-transform duration-300 ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`h-[2px] w-6 bg-brand-2 transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
            <span className={`h-[2px] w-6 bg-brand-2 transition-transform duration-300 ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>
        </div>

        <div id="mobile-nav" hidden={!open} className="border-t border-line/10 bg-surface lg:hidden">
          <nav aria-label="Mobile" className="shell flex flex-col py-6">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `border-b border-line/10 py-4 font-display text-xl font-semibold ${
                    isActive ? 'text-accent-600' : 'text-content'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/quote" className="btn btn-accent mt-6 w-full">Get a quote</Link>
            {company.phone && (
              <a
                href={`tel:${company.phone.replace(/\s/g, '')}`}
                className="mt-4 flex items-center justify-center gap-2 font-label text-sm font-medium text-content/72"
              >
                <Icon name="phone" size={16} />
                {company.phone}
              </a>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
