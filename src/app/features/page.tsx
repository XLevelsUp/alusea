import type { Metadata } from "next";
import { CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Features",
  description: "Explore the advanced engineering, security, and sustainability features of Alusea aluminium systems.",
  alternates: {
    canonical: "/features",
  },
};

export default function FeaturesPage() {
  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-matte-black tracking-tight">
            Engineered for <span className="text-brushed-bronze">Excellence</span>
          </h1>
          <p className="text-steel-gray text-lg leading-relaxed">
            Our aluminium architectural systems are built to surpass industry standards, providing unmatched durability, security, and thermal performance.
          </p>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
          {/* Large Featured Card */}
          <div className="md:col-span-2 row-span-1 md:row-span-2 bg-white rounded-2xl p-8 relative overflow-hidden shadow-sm border border-gray-100 group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-48 h-48 text-architectural-blue" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"/>
              </svg>
            </div>
            <div className="relative z-10 h-full flex flex-col justify-end max-w-md">
              <h2 className="text-3xl font-bold text-architectural-blue mb-4">Ultimate Thermal Break Technology</h2>
              <p className="text-steel-gray mb-6">
                Our advanced polyamide thermal break systems significantly reduce heat transfer, maintaining a comfortable interior environment and lowering your carbon footprint while complying with the strictest energy regulations.
              </p>
              <ul className="space-y-3">
                {['High Energy Ratings', 'Reduced Condensation', 'Extreme Insulation'].map((item, i) => (
                  <li key={i} className="flex items-center text-sm font-medium text-matte-black">
                    <CheckCircle className="w-5 h-5 text-brushed-bronze mr-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Standard Card 1 */}
          <div className="bg-matte-black rounded-2xl p-8 flex flex-col justify-between shadow-lg">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Uncompromised Security</h3>
              <p className="text-gray-400 text-sm">Multi-point locking systems and ultra-strong alloy composition providing peace of mind.</p>
            </div>
          </div>

          {/* Standard Card 2 */}
          <div className="bg-brushed-bronze rounded-2xl p-8 flex flex-col justify-between shadow-lg">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Aesthetic Brilliance</h3>
              <p className="text-white/80 text-sm">Ultra-slim sightlines allowing for maximum glass area and breathtaking panoramic views.</p>
            </div>
          </div>
          
          {/* Standard Card 3 */}
          <div className="md:col-span-3 bg-white border border-gray-100 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-sm">
             <div className="mb-6 md:mb-0 md:mr-8 max-w-xl">
               <h3 className="text-2xl font-bold text-architectural-blue mb-4">Acoustic Insulation & Durability</h3>
               <p className="text-steel-gray">
                 Designed for urban living, our acoustic glass and tight seal integrations dramatically reduce outside noise. The marine-grade powder coating guarantees a flawless finish that resists corrosion over decades.
               </p>
             </div>
             <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="border border-gray-100 p-4 rounded-xl text-center">
                  <span className="block text-3xl font-bold text-brushed-bronze mb-1">45dB</span>
                  <span className="text-xs text-steel-gray font-semibold uppercase tracking-wider">Sound Reduction</span>
                </div>
                <div className="border border-gray-100 p-4 rounded-xl text-center">
                  <span className="block text-3xl font-bold text-brushed-bronze mb-1">25yr</span>
                  <span className="text-xs text-steel-gray font-semibold uppercase tracking-wider">Finish Warranty</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
