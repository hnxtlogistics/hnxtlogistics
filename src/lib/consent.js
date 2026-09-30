/**
 * Cookie consent store.
 *
 * This is a real gate, not a decoration. Nothing that reads it may run until
 * `hasConsent('analytics')` returns true, so adding an analytics script later
 * means calling `onConsentChange` rather than dropping a tag in index.html.
 *
 * As shipped, the site sets exactly one cookie — the admin session — which is
 * strictly necessary and therefore outside the scope of consent. The banner is
 * worded to say that honestly rather than implying tracking that is not there.
 */
const KEY = 'hnxt.cookieConsent';
const VERSION = 1;

const listeners = new Set();

export const CATEGORIES = [
  {
    id: 'necessary',
    label: 'Strictly necessary',
    detail: 'Keeps the site working and holds a staff sign-in session. Cannot be switched off.',
    locked: true
  },
  {
    id: 'analytics',
    label: 'Analytics',
    detail: 'Anonymous counts of which pages and services get visited, so we know what to improve.',
    locked: false
  }
];

export function readConsent() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(choices) {
  const record = {
    version: VERSION,
    decidedAt: new Date().toISOString(),
    necessary: true,
    analytics: Boolean(choices.analytics)
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    /* Storage blocked — the choice applies to this page view only. */
  }
  listeners.forEach((fn) => fn(record));
  return record;
}

export function hasConsent(category) {
  if (category === 'necessary') return true;
  return Boolean(readConsent()?.[category]);
}

/** Subscribe to consent changes; returns an unsubscribe function. */
export function onConsentChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
