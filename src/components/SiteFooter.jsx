import { NavLink } from 'react-router-dom';
import { companyInfo, navItems } from '../data/logisticsContent';

export default function SiteFooter() {
  return (
    <footer id="footer" className="footer dark-background">
      <div className="container footer-top">
        <div className="row gy-4">
          <div className="col-lg-5 col-md-12 footer-about">
            <NavLink to="/" className="logo d-flex align-items-center">
              <img src="/assets/img/logo.png" alt={companyInfo.name} className="footer-logo" />
            </NavLink>
            <p>
              Road freight, domestic transport, freight forwarding, air freight, sea freight, and delivery support for shipments that need careful handling and reliable movement.
            </p>
          </div>

          <div className="col-lg-2 col-6 footer-links">
            <h4>Useful Links</h4>
            <ul>
              {navItems.map((item) => (
                <li key={item.to}><NavLink to={item.to}>{item.label}</NavLink></li>
              ))}
              <li><NavLink to="/get-a-quote">Get a Quote</NavLink></li>
            </ul>
          </div>

          <div className="col-lg-5 col-md-12 footer-contact text-center text-md-start">
            <h4>Contact Us</h4>
            <p>{companyInfo.address}</p>
            <div className="footer-contact-icons d-flex justify-content-center justify-content-md-start gap-3 mt-4">
              <a href={`mailto:${companyInfo.email}`} aria-label="Email"><i className="bi bi-envelope" /></a>
              <a href={companyInfo.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><i className="bi bi-instagram" /></a>
            </div>
          </div>
        </div>
      </div>

      <div className="container copyright text-center mt-4">
        <p>
          © <span>All Rights Reserved</span>
        </p>
        <div className="credits">
          Logistics support tailored for road, air, sea, and last-mile delivery
        </div>
      </div>
    </footer>
  );
}