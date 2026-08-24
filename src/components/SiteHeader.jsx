import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { companyInfo, navItems } from '../data/logisticsContent';

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    document.body.classList.toggle('mobile-nav-active', mobileOpen);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.classList.remove('mobile-nav-active');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <header id="header" className="header d-flex align-items-center fixed-top">
      <div 
        className="container-fluid d-flex align-items-center justify-content-between w-100"
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          justify: 'space-between', 
          width: '100%',
          paddingLeft: 'clamp(1rem, 4vw, 2.5rem)',
          paddingRight: 'clamp(1rem, 4vw, 2.5rem)'
        }}
      >
        {/* LOGO: Left */}
        <NavLink 
          to="/" 
          className="logo d-flex align-items-center me-auto" 
          onClick={() => setMobileOpen(false)}
          style={{ order: 1, margin: '0 auto 0 0' }}
        >
          <img src="/assets/img/logo.png" alt={companyInfo.name} />
        </NavLink>

        {/* DESKTOP NAV */}
        <nav id="navmenu" className="navmenu navmenu-desktop d-none d-xl-block" style={{ order: 2 }}>
          <ul>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `navmenu-link${isActive ? ' active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* DESKTOP CONTACT BUTTON */}
        <NavLink 
          className="btn-getstarted navmenu-desktop-contact d-none d-xl-inline-flex" 
          to="/get-a-quote" 
          onClick={() => setMobileOpen(false)}
          style={{ order: 3 }}
        >
          Get a Quote
        </NavLink>

        {/* HAMBURGER TOGGLE: Right */}
        <button
          type="button"
          className={`cdpn-mobile-menu__toggle ra-button uia-control__group uia-hamburger d-inline-flex d-xl-none ms-auto ${mobileOpen ? 'is-open' : ''}`}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          aria-controls="navmenu"
          onClick={() => setMobileOpen((value) => !value)}
          style={{ order: 99, margin: '0 0 0 auto' }}
        >
          <span className="ha-screen-reader" aria-hidden="false">
            {mobileOpen ? 'Close the menu' : 'Open the menu'}
          </span>
          <span className="uia-hamburger__group" aria-hidden="true">
            <span className="uia-hamburger__label" />
          </span>
        </button>
      </div>

      {mobileOpen && typeof document !== 'undefined'
        ? createPortal(
            <div className="cdpn-mobile-menu is-open" aria-hidden={!mobileOpen}>
              <button
                type="button"
                className="cdpn-mobile-menu__backdrop"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              />
              <aside className="cdpn-mobile-menu__panel" role="dialog" aria-modal="true" aria-label="Mobile navigation">
                <div className="cdpn-mobile-menu__head">
                  <button type="button" className="cdpn-mobile-menu__close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                    <i className="bi bi-x-lg" aria-hidden="true" />
                  </button>
                </div>
                <nav className="cdpn-mobile-menu__list" aria-label="Mobile navigation">
                  <ul className="ra-list cdpn-mobile-menu__links">
                    {navItems.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) => `cdpn-mobile-menu__link${isActive ? ' active' : ''}`}
                          onClick={() => setMobileOpen(false)}
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                    <li>
                      <NavLink className="cdpn-mobile-menu__link cdpn-mobile-menu__contact" to="/get-a-quote" onClick={() => setMobileOpen(false)}>
                        Get a Quote
                      </NavLink>
                    </li>
                  </ul>
                </nav>
              </aside>
            </div>,
            document.body
          )
        : null}
    </header>
  );
}