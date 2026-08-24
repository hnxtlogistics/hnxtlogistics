import PageTitle from '../components/PageTitle';
import { ContactForm } from '../components/PageForms';
import { companyInfo } from '../data/logisticsContent';

export default function ContactPage() {
  const mapQuery = encodeURIComponent(companyInfo.address);

  return (
    <main className="main">
      <PageTitle title="Contact" description="Reach HNXT Logistics for freight, delivery, packing, and logistics coordination." />
      <section id="contact" className="contact section">
        <div className="container">
          <div className="mb-4">
            <iframe
              title="HNXT Logistics map"
              style={{ border: 0, width: '100%', height: '270px' }}
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              loading="lazy"
            />
          </div>

          <div className="row gy-4">
            <div className="col-lg-4">
              <div className="info-item d-flex">
                <i className="bi bi-geo-alt flex-shrink-0" />
                <div>
                  <h3>Address</h3>
                  <p>{companyInfo.address}</p>
                </div>
              </div>
              <div className="info-item d-flex">
                <i className="bi bi-instagram flex-shrink-0" />
                <div>
                  <h3>Instagram</h3>
                  <p>@hnxt_logistics</p>
                </div>
              </div>
              <div className="info-item d-flex">
                <i className="bi bi-envelope flex-shrink-0" />
                <div>
                  <h3>Email Us</h3>
                  <p>{companyInfo.email}</p>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="contact-intro mb-4">
                <p>
                  Tell us about the shipment, delivery lane, or packing requirement and we will route it through the most practical service option.
                  Customs clearance and warehousing can be arranged through trusted partners when those services are needed.
                </p>
              </div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}