import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import ScrollTop from './ScrollTop';
import ContactPopup from './ContactPopup';
import CookieConsent from './CookieConsent';

export default function Layout() {
  const { pathname } = useLocation();
  /* Both sit at the bottom of the viewport, so the contact popup waits until
     the visitor has answered the cookie banner rather than stacking on it. */
  const [consentResolved, setConsentResolved] = useState(false);
  const onResolved = useCallback((resolved) => setConsentResolved(resolved), []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollTop />
      <ContactPopup waitFor={!consentResolved} />
      <CookieConsent onResolved={onResolved} />
    </div>
  );
}
