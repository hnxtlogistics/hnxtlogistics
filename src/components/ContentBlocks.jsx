import { Link } from 'react-router-dom';
import SectionTitle from './SectionTitle';
import { aboutHighlights, companyInfo, featuredServices, serviceCards, serviceSnapshots } from '../data/logisticsContent';

export function HeroSection() {
  return (
    <section id="hero" className="hero section dark-background">
      <img src="/assets/img/world-dotted-map.png" alt="" className="hero-bg" />
      <div className="container">
        <div className="row gy-4 d-flex justify-content-between align-items-center">
          <div className="col-lg-6 order-2 order-lg-1 d-flex flex-column justify-content-center">
            <span className="hero-kicker">{companyInfo.name}</span>
            <h2>Road, Air, Sea, and Door-to-Door Logistics That Move With Your Business</h2>
            <p>
              We handle domestic transportation, freight forwarding, packers and movers, shipment tracking, and last-mile delivery from our Bengaluru base.
            </p>
            <div className="d-flex gap-3 flex-wrap">
              <Link className="btn btn-primary" to="/contact">Contact Us</Link>
              <Link className="btn btn-outline-light" to="/services">View Services</Link>
            </div>
            <ul className="hero-points">
              {serviceSnapshots.map((snapshot) => (
                <li key={snapshot}>{snapshot}</li>
              ))}
            </ul>
          </div>
          <div className="col-lg-5 order-1 order-lg-2 hero-img">
            <img src="/assets/img/hero-img.jpg" className="img-fluid mb-3 mb-lg-0" alt="Logistics and freight movement" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturedServicesSection() {
  return (
    <section id="featured-services" className="featured-services section">
      <div className="container">
        <div className="row gy-4">
          {featuredServices.map((service, index) => (
            <div className="col-lg-4 col-md-6 service-item d-flex" data-aos="fade-up" data-aos-delay={(index + 1) * 100} key={service.title}>
              <div className="icon flex-shrink-0"><i className={service.icon} /></div>
              <div>
                <h4 className="title">{service.title}</h4>
                <p className="description">{service.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section id="about" className="about section">
      <div className="container">
        <div className="row gy-4">
          <div className="col-lg-6 position-relative align-self-start order-lg-last order-first about-media">
            <img src="/assets/img/about.jpg" className="img-fluid" alt="HNXT Logistics operations" />
            <a href="/contact" className="glightbox pulsating-play-btn" aria-label="Go to contact page" />
          </div>
          <div className="col-lg-6 content order-last order-lg-first">
            <h3>About HNXT Logistics</h3>
            <p>
              We support businesses and individuals with practical logistics solutions built around timely movement, careful handling, and clear communication.
              Whether the shipment needs road freight, air cargo, sea freight, or last-mile delivery, we shape the service around the job.
            </p>
            <ul>
              {aboutHighlights.map((item) => (
                <li key={item.title}>
                  <i className={item.icon} />
                  <div>
                    <h5>{item.title}</h5>
                    <p>{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ServicesGridSection() {
  return (
    <section id="services" className="services section">
      <SectionTitle
        overline="Our Services"
        title="Logistics Services"
        description="A complete view of the transport, forwarding, handling, and delivery support we offer directly or through trusted partners."
      />
      <div className="container">
        <div className="row gy-4">
          {serviceCards.map((service) => (
            <div className="col-lg-4 col-md-6" key={service.title}>
              <div className="card service-card service-card--logistics h-100">
                <div className="service-card__icon">
                  <i className={service.icon} />
                </div>
                <span className="service-card__category">{service.category}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const features = [
    {
      title: 'Shipment visibility',
      text: 'Tracking updates help you follow pickup, transit, and final delivery without guesswork.',
      icon: 'bi bi-geo-alt-fill'
    },
    {
      title: 'Careful handling',
      text: 'Packaging and cargo handling are built around reducing damage and handoff friction.',
      icon: 'bi bi-box-seam'
    },
    {
      title: 'Partner-backed support',
      text: 'Customs clearance and warehousing can be coordinated through trusted service partners where needed.',
      icon: 'bi bi-shield-check'
    },
    {
      title: 'Multi-modal planning',
      text: 'Road, air, and sea options can be combined to balance speed, cost, and shipment requirements.',
      icon: 'bi bi-layers'
    }
  ];

  return (
    <section id="features" className="features section">
      <SectionTitle
        overline="Why HNXT"
        title="Built for Practical Logistics"
        description="A service mix that keeps transport, forwarding, and delivery aligned from the first pickup to the last mile."
      />
      <div className="container">
        <div className="row gy-4">
          {features.map((feature, index) => (
            <div className="col-md-6" key={feature.title}>
              <div className="feature-card h-100" data-aos="fade-up" data-aos-delay={(index + 1) * 100}>
                <i className={feature.icon} />
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CallToActionSection() {
  return (
    <section id="call-to-action" className="call-to-action section dark-background">
      <img src="/assets/img/cta-bg.jpg" alt="" />
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-10">
            <div className="text-center">
              <h3>Need a route, a quote, or a logistics plan?</h3>
              <p>
                Share the shipment details and we will help you choose the right mix of road freight, forwarding, air, sea, packaging, and delivery support.
              </p>
              <Link className="cta-btn" to="/contact">Contact Us</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  const commitmentCards = [
    {
      title: 'On-time movement',
      text: 'Transit plans are built around dependable pickup and delivery windows.',
      icon: 'bi bi-clock-history'
    },
    {
      title: 'Clear communication',
      text: 'Shipment status and service handoffs stay visible as the load moves.',
      icon: 'bi bi-chat-square-text'
    },
    {
      title: 'Flexible service mix',
      text: 'You can combine domestic transport, forwarding, and last-mile delivery as needed.',
      icon: 'bi bi-basket'
    }
  ];

  return (
    <section id="testimonials" className="testimonials section dark-background">
      <img src="/assets/img/testimonials-bg.jpg" className="testimonials-bg" alt="" />
      <div className="container">
        <div className="row g-4">
          {commitmentCards.map((card) => (
            <div className="col-lg-4 col-md-6" key={card.title}>
              <div className="testimonial-item testimonial-item--commitment h-100">
                <i className={card.icon} />
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}