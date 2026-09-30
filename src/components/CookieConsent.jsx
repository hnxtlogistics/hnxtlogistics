import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, onConsentChange, readConsent, saveConsent } from '../lib/consent';

export default function CookieConsent({ onResolved }) {
  const [visible, setVisible] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const decided = readConsent();
    setVisible(!decided);
    onResolved?.(Boolean(decided));

    return onConsentChange((record) => {
      setVisible(!record);
      setShowDetail(false);
      onResolved?.(Boolean(record));
    });
  }, [onResolved]);

  // Keep Tab inside the banner while it is asking for a decision.
  useEffect(() => {
    if (!visible) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return;
      const focusable = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [visible]);

  if (!visible) return null;

  const decide = (choices) => saveConsent(choices);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-heading"
      className="fixed inset-x-0 bottom-0 z-[80] border-t-2 border-accent-500 bg-surface shadow-[0_-6px_28px_rgba(10,12,40,0.14)]"
    >
      <div className="shell py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h2 id="cookie-consent-heading" className="font-display text-base font-bold">
              Cookies on this site
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-content/78">
              We use only what the site needs to work. With your agreement we would also count
              page visits anonymously, so we can see which services people look for. You can
              decide now and change it later from the footer.{' '}
              <Link to="/privacy" className="font-medium text-accent-700 underline underline-offset-4 hover:text-accent-600">
                Privacy notice
              </Link>
            </p>

            {showDetail && (
              <ul className="mt-5 space-y-3 border-t border-line/12 pt-4">
                {CATEGORIES.map((category) => (
                  <li key={category.id} className="flex items-start gap-3">
                    <input
                      id={`consent-${category.id}`}
                      type="checkbox"
                      checked={category.locked ? true : analytics}
                      disabled={category.locked}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-accent-500)] disabled:opacity-60"
                    />
                    <label htmlFor={`consent-${category.id}`} className="cursor-pointer">
                      <span className="block text-[14px] font-semibold">
                        {category.label}
                        {category.locked && (
                          <span className="ml-2 font-label text-[10px] uppercase tracking-[0.12em] text-content/62">
                            Always on
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-content/72">
                        {category.detail}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {showDetail ? (
              <button type="button" onClick={() => decide({ analytics })} className="btn btn-accent !py-2.5 !text-sm">
                Save choices
              </button>
            ) : (
              <button type="button" onClick={() => decide({ analytics: true })} className="btn btn-accent !py-2.5 !text-sm">
                Accept all
              </button>
            )}
            <button type="button" onClick={() => decide({ analytics: false })} className="btn btn-ghost-dark !py-2.5 !text-sm">
              Necessary only
            </button>
            {!showDetail && (
              <button
                type="button"
                onClick={() => setShowDetail(true)}
                className="font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-content/72 underline underline-offset-4 transition-colors hover:text-accent-600"
              >
                Choose
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
