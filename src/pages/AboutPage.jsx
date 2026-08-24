import PageTitle from '../components/PageTitle';
import { AboutSection, TestimonialsSection } from '../components/ContentBlocks';

export default function AboutPage() {
  return (
    <main className="main">
      <PageTitle title="About" description="Learn how HNXT Logistics handles transport, forwarding, delivery, and partner-backed support across Bengaluru and beyond." />
      <AboutSection />
      <TestimonialsSection />
    </main>
  );
}