import Hero from "@/components/sections/Hero";
import ProductShowcase from "@/components/sections/ProductShowcase";
import AboutSection from "@/components/sections/AboutSection";
import ServicesSection from "@/components/sections/ServicesSection";
import WhyWorkWithUs from "@/components/sections/WhyWorkWithUs";
import ProjectGallery from "@/components/sections/ProjectGallery";
import Testimonials from "@/components/sections/Testimonials";
import FAQ from "@/components/sections/FAQ";
import ContactCTA from "@/components/sections/ContactCTA";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <ProductShowcase />
      <AboutSection />
      <ServicesSection />
      <WhyWorkWithUs />
      <ProjectGallery />
      <Testimonials />
      <FAQ />
      <ContactCTA />
    </main>
  );
}
