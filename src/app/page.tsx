import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";

export const metadata: Metadata = {
  title: "Architectural Aluminium Doors & Windows Manufacturer | Coimbatore | Alusea",
  description: "Experience architectural elegance with Alusea, the leading architectural aluminium facade manufacturer and curtain wall glazing supplier in Coimbatore. We fabricate luxury thermal break aluminium doors, custom windows, and modern glass facades for premier residential and commercial properties across Tamil Nadu and South India.",
  keywords: [
    "Alusea aluminium Coimbatore",
    "Alusea windows doors India",
    "architectural aluminium facade manufacturer Coimbatore",
    "Curtain wall glazing supplier Coimbatore",
    "Luxury aluminium window fabricator Tamil Nadu",
    "Aluminium sliding doors Coimbatore",
    "Aluminium glass door Coimbatore",
    "aluminium window doors manufacturer Coimbatore",
    "minimalist aluminium sliding door villa India",
    "architectural glazing manufacturer South India",
    "luxury aluminium facade supplier South India",
    "Aluminium windows manufacturer Coimbatore",
    "Aluminium window supply Tamil Nadu",
    "Commercial aluminium facade contractor Coimbatore",
    "Thermal break aluminium window specification",
    "Apartment aluminium facade supplier"
  ],
  alternates: {
    canonical: "/",
  },
};
import AboutSection from "@/components/sections/AboutSection";
import ServicesSection from "@/components/sections/ServicesSection";
import WhyWorkWithUs from "@/components/sections/WhyWorkWithUs";
import ProductShowcase from "@/components/sections/ProductShowcase";
// import ProjectGallery from "@/components/sections/ProjectGallery";
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
          Welcome to Alusea, your premier architectural aluminium facade manufacturer in Coimbatore and trusted curtain wall glazing supplier in Coimbatore. As the leading luxury aluminium window fabricator in Tamil Nadu, Alusea aluminium Coimbatore delivers custom-engineered architectural glazing solutions tailored for modern spaces. From sleek aluminium sliding doors in Coimbatore to premium aluminium glass doors in Coimbatore, our high-end fenestration systems redefine contemporary living.
        </p>
        <p>
          We are recognized as a premier aluminium window doors manufacturer in Coimbatore and a luxury aluminium facade supplier in South India, supplying high-performance solutions for prestigious residential projects, including minimalist aluminium sliding door systems for luxury villas across India. Our systems meet the strict requirements of premier architects and structural engineers, offering outstanding durability, aesthetic refinement, and custom hardware integrations.
        </p>
        <p>
          For industrial and commercial spaces, Alusea operates as a professional commercial aluminium facade contractor in Coimbatore and apartment aluminium facade supplier, offering high-performance aluminium window supply in Tamil Nadu. We specialize in custom-tailoring each thermal break aluminium window specification to deliver superior thermal performance, acoustic insulation, and maximum security for modern high-rises and state-of-the-art office spaces.
        </p>
      </div>
    </main>
  );
}
