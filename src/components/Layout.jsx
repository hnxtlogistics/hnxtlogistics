import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import ScrollTop from './ScrollTop';

export default function Layout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <>
      <SiteHeader />
      <div className="page-shell page-shell--transition" key={location.pathname}>
        <Outlet />
      </div>
      <SiteFooter />
      <ScrollTop />
    </>
  );
}