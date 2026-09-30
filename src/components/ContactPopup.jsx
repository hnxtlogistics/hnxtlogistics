import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

const STORAGE_KEY = 'hnxt.contactPopup.dismissedUntil';

/* Pages where the popup would only repeat what the visitor is already
   looking at. */
const SUPPRESSED = ['/contact', '/quote'];

function dismissedRecently() {
  try {
    const until = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(until) && until > Date.now();
  } catch {
    // Private browsing or blocked storage — fall back to showing it.
    return false;
  }
}

function remember(days) {
  if (!days) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now() + days * 86400000));
  } catch {
    /* Nothing to do — the popup simply reappears next visit. */
  }
}

export default function ContactPopup({ waitFor = false }) {
  const { popup, company, addressLines } = useSite();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const restoreFocusTo = useRef(null);

  const suppressed = SUPPRESSED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const active = Number(popup?.enabled) === 1 && !suppressed;

  const close = useCallback(() => {
    setOpen(false);
    remember(popup?.dismissDays ?? 1);
    restoreFocusTo.current?.focus?.();
  }, [popup?.dismissDays]);

  useEffect(() => {
    if (waitFor || !active || dismissedRecently()) return undefined;
    const delay = Math.max(3, Number(popup.delaySeconds) || 10) * 1000;
    const timer = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(timer);
  }, [waitFor, active, popup?.delaySeconds, pathname]);

  // Move focus in, keep it inside, and hand it back on close.
  useEffect(() => {
    if (!open) return undefined;
    restoreFocusTo.current = document.activeElement;
    closeRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  if (!open) return null;

  const phoneHref = company.phone ? `tel:${company.phone.replace(/\s/g, '')}` : null;
  const waHref = company.whatsapp ? `https://wa.me/${company.whatsapp.replace(/\D/g, '')}` : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      {/* Dimmed only lightly on mobile so the page stays visible behind the
          sheet — a full-screen takeover on arrival is what search engines
          treat as an intrusive interstitial. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={close}
        className="absolute inset-0 cursor-default bg-brand/25 backdrop-blur-[2px] sm:bg-brand/45"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-popup-heading"
        aria-describedby="contact-popup-body"
        className="relative w-full max-w-lg border-t-2 border-accent-500 bg-surface p-7 shadow-2xl motion-safe:animate-[popup-in_.32s_var(--ease-out-quint)_both] sm:m-6 sm:border sm:border-t-2 sm:border-line/12 sm:border-t-accent-500 sm:p-9"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center text-content/70 transition-colors hover:bg-surface-2 hover:text-content"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M1 1l13 13M14 1L1 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <p className="eyebrow text-accent-700">Talk to us</p>
        <h2 id="contact-popup-heading" className="mt-3 pr-8 text-2xl">
          {popup.heading}
        </h2>
        {popup.body && (
          <p id="contact-popup-body" className="mt-3.5 text-[15px] leading-relaxed text-content/75">
            {popup.body}
          </p>
        )}

        {/* Contact values are the reason this panel exists, so they are set
            in the body face at full size and semibold rather than as faint
            monospace labels. */}
        <dl className="mt-6 space-y-px overflow-hidden border border-line/12 bg-line/10">
          {phoneHref && (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-surface px-4 py-3.5">
              <dt className="eyebrow text-content/70">Phone</dt>
              <dd>
                <a href={phoneHref} className="text-lg font-semibold tracking-tight text-content transition-colors hover:text-accent-600">
                  {company.phone}
                </a>
              </dd>
            </div>
          )}
          {waHref && (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-surface px-4 py-3.5">
              <dt className="eyebrow text-content/70">WhatsApp</dt>
              <dd>
                <a href={waHref} target="_blank" rel="noreferrer noopener" className="text-lg font-semibold tracking-tight text-content transition-colors hover:text-accent-600">
                  {company.whatsapp}
                </a>
              </dd>
            </div>
          )}
          {company.email && (
            <div className="bg-surface px-4 py-3.5">
              <dt className="eyebrow text-content/70">Email</dt>
              <dd className="mt-1.5">
                <a
                  href={`mailto:${company.email}`}
                  className="block break-all text-[1.0625rem] font-semibold leading-snug tracking-tight text-content underline decoration-accent-500 decoration-2 underline-offset-[5px] transition-colors hover:text-accent-600 sm:text-lg"
                >
                  {company.email}
                </a>
              </dd>
            </div>
          )}
          {company.hours && (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-surface px-4 py-3.5">
              <dt className="eyebrow text-content/70">Hours</dt>
              <dd className="text-[15px] font-medium">{company.hours}</dd>
            </div>
          )}
          {addressLines.length > 0 && (
            <div className="bg-surface px-4 py-3.5">
              <dt className="eyebrow text-content/70">Office</dt>
              <dd className="mt-1.5 text-[15px] font-medium leading-snug">{addressLines.join(', ')}</dd>
            </div>
          )}
        </dl>

        <div className="mt-7 flex flex-wrap gap-3">
          {popup.ctaLabel && popup.ctaTo && (
            <Link to={popup.ctaTo} onClick={close} className="btn btn-accent !py-2.5 !text-sm">
              {popup.ctaLabel}
            </Link>
          )}
          <button type="button" onClick={close} className="btn btn-ghost-dark !py-2.5 !text-sm">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
