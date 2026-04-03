import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expert Aluminium Craftsmen & Architects",
  description:
    "Meet the skilled craftsmen, engineers, and architects behind Alusea's premium aluminium solutions. We bring decades of fabrication expertise to you.",
  alternates: {
    canonical: "/team",
  },
};

const teamMembers = [
  { role: "Founder & CEO" },
  { role: "Lead Architect" },
  { role: "Head of Engineering" },
  { role: "Project Manager" },
  { role: "Senior Fabricator" },
  { role: "Installation Director" }
];

export default function TeamPage() {
  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-architectural-blue tracking-tight">
            Meet the Men Behind the Metal
          </h1>
          <p className="text-steel-gray text-lg leading-relaxed">
            Our team of engineers, designers, and master craftsmen bring decades of combined experience to every Alusea project.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="group">
              <div className="aspect-[3/4] bg-gray-100 rounded-xl mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 to-gray-50 flex items-center justify-center opacity-50">
                  <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-matte-black bg-gray-100/50 w-3/4 h-7 rounded mb-2"></h3>
              <p className="text-brushed-bronze font-medium w-1/2 h-5 bg-brushed-bronze/10 rounded"></p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs font-bold text-steel-gray uppercase tracking-widest">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
