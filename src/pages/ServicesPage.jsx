import PageTitle from '../components/PageTitle';
import { FeaturedServicesSection, ServicesGridSection, FeaturesSection } from '../components/ContentBlocks';

export default function ServicesPage() {
  return (
    <main className="main">
      <PageTitle title="Services" description="Browse the full HNXT Logistics service list, from road freight and warehousing support to shipment tracking and express delivery." />
      <FeaturedServicesSection />
      <ServicesGridSection />
      <FeaturesSection />
    </main>
  );
}