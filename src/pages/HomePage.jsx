import {
  HeroSection,
  FeaturedServicesSection,
  AboutSection,
  ServicesGridSection,
  CallToActionSection,
  FeaturesSection,
  TestimonialsSection
} from '../components/ContentBlocks';

export default function HomePage() {
  return (
    <main className="main">
      <HeroSection />
      <FeaturedServicesSection />
      <AboutSection />
      <ServicesGridSection />
      <CallToActionSection />
      <FeaturesSection />
      <TestimonialsSection />
    </main>
  );
}