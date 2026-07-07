import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Commercial Aluminium Facade Contractor & Glazing Coimbatore | Alusea",
  description:
    "Discover Alusea, the leading commercial aluminium facade contractor and curtain wall glazing supplier in Coimbatore. We design, fabricate, and install elite specification-grade architectural glass systems in Tamil Nadu.",
  alternates: {
    canonical: "/services",
  },
};

const servicesList = [
  { title: "Custom Window Fabrication", desc: "Precision-engineered custom thermal break aluminium windows in Coimbatore tailored to strict residential U-value and acoustic specifications." },
  { title: "Architectural Doors", desc: "Premium minimalist aluminium sliding doors for modern villas and sleek aluminium glass door frameworks for residences in Tamil Nadu." },
  { title: "Curtain Wall Systems", desc: "Expansive structural glazing and architectural louvers supplied by the leading commercial aluminium facade contractor in Coimbatore." },
  { title: "Professional Installation", desc: "Flawless on-site execution and structural testing for luxury apartments and corporate buildings throughout South India." }
];

export default function ServicesPage() {
  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 text-center max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7A5418]" />
            <span className="text-[#7A5418] text-xs uppercase tracking-[0.2em] font-bold">Services</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-architectural-blue tracking-tight">
            Our Services
          </h1>
          <p className="text-steel-gray text-lg leading-relaxed">
            From initial concept to final on-site installation, we provide complete, elite-grade aluminium engineering solutions. As the leading <Link href="/" className="text-brushed-bronze hover:underline font-semibold">architectural glazing manufacturer in South India</Link>, we bring structural integrity and luxury design together.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {servicesList.map((service, idx) => (
            <div key={idx} className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 hover:border-brushed-bronze/50 transition-colors group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 text-7xl font-bold text-gray-50 opacity-50 group-hover:-translate-y-2 group-hover:text-gray-100 transition-all">0{idx + 1}</div>
               <div className="relative z-10">
                 <h3 className="text-2xl font-bold text-matte-black mb-4 group-hover:text-brushed-bronze transition-colors">{service.title}</h3>
                 <p className="text-steel-gray leading-relaxed max-w-sm">{service.desc}</p>
                 <Link href="/contact" className="mt-8 text-sm font-bold text-matte-black flex items-center gap-2 group-hover:text-brushed-bronze transition-colors">
                   Learn More
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                   </svg>
                 </Link>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
