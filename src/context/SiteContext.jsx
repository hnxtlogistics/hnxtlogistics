import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import SiteUnavailable from '../components/SiteUnavailable';

const SiteContext = createContext(null);

/** Shown until the first /api/site response lands, and if it never does. */
const EMPTY = { company: {}, home: {}, about: {}, seo: {}, popup: {}, lanes: [], services: [], faqs: [] };

export function SiteProvider({ children }) {
  const [data, setData] = useState(EMPTY);
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let retry;

    api
      .get('/site', { signal: controller.signal })
      .then((payload) => {
        setData({ ...EMPTY, ...payload });
        setStatus('ready');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setStatus('error');
        /* One automatic retry covers a rate-limit blip or a dropped
           request without making the visitor reload the page. */
        if (attempt < 2) retry = setTimeout(() => setAttempt((n) => n + 1), 1500 * (attempt + 1));
      });

    return () => {
      controller.abort();
      clearTimeout(retry);
    };
  }, [attempt]);

  const value = useMemo(() => {
    const { company, services } = data;
    const addressLines = [
      company.addressLine1,
      company.addressLine2,
      [company.city, company.state].filter(Boolean).join(', '),
      [company.pincode, company.country].filter(Boolean).join(' ')
    ].filter(Boolean);

    return {
      ...data,
      status,
      addressLines,
      addressText: addressLines.join(', '),
      featuredServices: services.filter((s) => s.featured),
      serviceBySlug: (slug) => services.find((s) => s.slug === slug)
    };
  }, [data, status]);

  if (status === 'error' && attempt >= 2) {
    return <SiteUnavailable onRetry={() => { setStatus('loading'); setAttempt(0); }} />;
  }

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) throw new Error('useSite must be used inside <SiteProvider>.');
  return context;
}
