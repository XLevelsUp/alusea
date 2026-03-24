import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services | Alusea",
  description:
    "Explore Alusea's full range of premium aluminium door, window, and curtain wall services.",
};

const servicesList = [
  { title: "Custom Window Fabrication", desc: "Precision-engineered windows tailored to your architectural vision." },
  { title: "Architectural Doors", desc: "Premium sliding, folding, and swing doors for seamless transitions." },
  { title: "Curtain Wall Systems", desc: "Expansive structural glazing for impressive commercial facades." },
  { title: "Professional Installation", desc: "Expert fitting carried out by our highly trained technicians." }
];

export default function ServicesPage() {
  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-architectural-blue tracking-tight">
            Our Services
          </h1>
          <p className="text-steel-gray text-lg leading-relaxed">
            From initial consultation to final installation, we provide end-to-end aluminium engineering solutions.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {servicesList.map((service, idx) => (
            <div key={idx} className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 hover:border-brushed-bronze/50 transition-colors group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 text-7xl font-bold text-gray-50 opacity-50 group-hover:-translate-y-2 group-hover:text-gray-100 transition-all">0{idx + 1}</div>
               <div className="relative z-10">
                 <h3 className="text-2xl font-bold text-matte-black mb-4 group-hover:text-brushed-bronze transition-colors">{service.title}</h3>
                 <p className="text-steel-gray leading-relaxed max-w-sm">{service.desc}</p>
                 <button className="mt-8 text-sm font-bold text-matte-black flex items-center gap-2 group-hover:text-brushed-bronze transition-colors">
                   Learn More
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                   </svg>
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
