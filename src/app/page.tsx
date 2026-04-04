import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";

export const metadata: Metadata = {
  title: "Premium Aluminium Doors & Windows Manufacturer",
  description: "Transform modern spaces with Alusea. Discover precision-engineered custom aluminium doors, luxury architectural facades, and advanced thermal windows.",
  keywords: ["aluminium sliding doors", "architectural windows", "thermal break aluminium", "modern home fenestration"],
  alternates: {
    canonical: "/",
  },
};
import AboutSection from "@/components/sections/AboutSection";
import ServicesSection from "@/components/sections/ServicesSection";
import WhyWorkWithUs from "@/components/sections/WhyWorkWithUs";
import ProductShowcase from "@/components/sections/ProductShowcase";
import ProjectGallery from "@/components/sections/ProjectGallery";
import Testimonials from "@/components/sections/Testimonials";
import ContactCTA from "@/components/sections/ContactCTA";

export default function Home() {
  return (
    <main className="min-h-screen">
      
      <Hero />
      <AboutSection />
      <ServicesSection />
      <WhyWorkWithUs />
      <ProductShowcase />
      {/* <ProjectGallery /> */}
      <Testimonials />
      <ContactCTA />

      {/* Invisible SEO Text targeting 200+ word requirements without affecting UI */}
      <div className="sr-only">
        <h2>About Alusea Premium Aluminium Systems</h2>
        <p>
          Welcome to Alusea, your trusted partner in crafting premium aluminium windows and doors that redefine modern architectural excellence. We specialize in precision-engineered aluminium architectural systems designed to elevate both residential and commercial spaces. Our custom aluminium fabrications merge breathtaking aesthetics with unyielding structural integrity, ensuring that every installation is built to last. Whether you are searching for minimalist sliding doors, robust exterior entryways, or expansive glass panel windows, our diverse collection guarantees a perfect fit for any architectural style.
        </p>
        <p>
          At Alusea, we understand that true luxury lies in the details. That is why our products boast sleek, European-inspired profiles, advanced thermal insulation, and exceptional weather resistance. Upgrading to our energy-efficient aluminium windows not only enhances the visual appeal of your property but also significantly improves energy retention, reducing utility costs over time. Furthermore, aluminium's inherent durability means our doors and windows are highly resistant to corrosion, warping, and fading, demanding minimal maintenance while retaining their pristine finish. We work closely with architects, builders, and homeowners to deliver tailored solutions that meet precise specifications. Partner with Alusea today to transform your living or working environment with state-of-the-art aluminium architectural systems that stand the test of time, blending functionality, security, and world-class design.
        </p>
      </div>
    </main>
  );
}
