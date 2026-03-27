import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";

export const metadata: Metadata = {
  title: "Home",
  description: "Discover Alusea's premium aluminium windows and doors. Expertly crafted for modern architectural designs with superior durability and aesthetics.",
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
    </main>
  );
}
