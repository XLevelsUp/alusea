import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Leaders in Architectural Glazing & Aluminium",
  description:
    "Discover Alusea's dedication to architectural finesse and sustainable design. We provide bespoke modern aluminium manufacturing and expert installation.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Alusea",
    "description": "Alusea stands at the forefront of the architectural glazing industry, bringing decades of collective expertise to the design and manufacturing of supreme aluminium doors and windows. Every piece that leaves our state-of-the-art facility undergoes rigorous quality control checks and adheres to stringent international standards, guaranteeing flawless performance.",
    "publisher": {
      "@type": "Organization",
      "name": "Alusea"
    }
  };

  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brushed-bronze" />
                <span className="text-brushed-bronze text-xs uppercase tracking-[0.2em] font-bold">Our Heritage</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-architectural-blue leading-tight tracking-tight">
                Crafting Architectural <br />
                <span className="text-brushed-bronze">Excellence</span>
              </h1>
            </div>
            
            <p className="text-steel-gray text-lg leading-relaxed">
              At Alusea, we believe that windows and doors are more than just functional elements—they are the transparent boundaries that connect your sanctuary to the world. For over a decade, we have dedicated ourselves to perfecting the art of premium aluminium architecture, establishing ourselves as the best aluminium window and door manufacturer in the region.
            </p>
            <p className="text-steel-gray text-lg leading-relaxed">
              If you've ever wondered what are the advantages of aluminium windows, it comes down to longevity, slim profiles, and unparalleled energy performance. Our mission is to empower architects, builders, and homeowners with sustainable, high-performance systems that never compromise on aesthetic brilliance. Every extrusion, thermal break, and glass pane is rigorously tested to meet our uncompromising standards.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-100">
              <div>
                <h3 className="text-3xl font-bold text-matte-black mb-2">10+</h3>
                <p className="text-sm text-steel-gray font-bold uppercase tracking-wider">Years of Precision</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-matte-black mb-2">100%</h3>
                <p className="text-sm text-steel-gray font-bold uppercase tracking-wider">Client Satisfaction</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl relative">
              <Image
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000"
                alt="Alusea architectural building"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-matte-black/60 to-transparent flex items-end p-8">
                <p className="text-white text-xl font-medium max-w-sm">
                  "Redefining spaces with light, strength, and visionary design."
                </p>
              </div>
            </div>
            <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-brushed-bronze/10 rounded-full blur-3xl -z-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
