import PageTitle from '../components/PageTitle';
import { QuoteForm } from '../components/PageForms';

export default function QuotePage() {
  return (
    <main className="main">
      <PageTitle title="Get a Quote" description="Tell HNXT Logistics about your shipment so we can suggest the most practical transport and delivery option." />
      <section id="get-a-quote" className="get-a-quote section">
        <div className="container">
          <div className="row g-0">
            <div className="col-lg-5 quote-bg" style={{ backgroundImage: 'url(/assets/img/quote-bg.jpg)' }} />
            <div className="col-lg-7">
              <QuoteForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}