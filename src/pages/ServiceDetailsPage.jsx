import PageTitle from '../components/PageTitle';
import { serviceCards } from '../data/logisticsContent';

export default function ServiceDetailsPage() {
  return (
    <main className="main">
      <PageTitle title="Service Details" description="Detailed logistics service coverage, including direct services and partner-supported options." />
      <section id="service-details" className="service-details section">
        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-4">
              <div className="services-list">
                {serviceCards.slice(0, 8).map((service, index) => (
                  <a href="#service-details" className={index === 0 ? 'active' : ''} key={service.title}>
                    {service.title}
                  </a>
                ))}
              </div>
              <h4>Direct and partner-supported services</h4>
              <p>Customs clearance and warehousing are provided directly only when available or through trusted CHA and warehouse partners.</p>
            </div>
            <div className="col-lg-8">
              <img src="/assets/img/services.jpg" alt="Service details" className="img-fluid services-img" />
              <h3>Flexible logistics coverage for local, domestic, and international movement</h3>
              <p>
                HNXT Logistics coordinates road freight, air freight, sea freight, domestic transportation, freight forwarding, and last-mile delivery through a practical service structure.
              </p>
              <ul>
                <li><i className="bi bi-check-circle" /> <span>Secure packing, handling, and shipment tracking from pickup to handoff.</span></li>
                <li><i className="bi bi-check-circle" /> <span>Door-to-door delivery, express delivery, and multi-modal transportation options.</span></li>
                <li><i className="bi bi-check-circle" /> <span>Import and export logistics with customs clearance and warehousing support when required.</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}