import type { Metadata } from "next";
import PageBanner from "@/components/layout/PageBanner";

export const metadata: Metadata = {
  title: "Expert Aluminium Craftsmen & Architects",
  description:
    "Meet the skilled craftsmen, engineers, and architects behind Alusea's premium aluminium solutions. We bring decades of fabrication expertise to you.",
  alternates: {
    canonical: "/team",
  },
};

/*
const teamMembers = [
  { role: "Founder & CEO" },
  { role: "Lead Architect" },
  { role: "Head of Engineering" },
  { role: "Project Manager" },
  { role: "Senior Fabricator" },
  { role: "Installation Director" }
];
*/

export default function TeamPage() {
  return (
    <div className="min-h-[70vh] bg-plate-white">
      <PageBanner crumb="Team" title="Meet the Men Behind the Metal">
        <p>
          Our team of engineers, designers, and master craftsmen bring decades of combined experience to every Alusea project.
        </p>
      </PageBanner>
      <div className="shell">

        {/* Team members grid hidden on UI
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="group">
              <div className="aspect-[3/4] bg-stem-grey/25 rounded-card mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-stem-grey/15 to-stem-grey/15 flex items-center justify-center opacity-50">
                  <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-blueberry bg-gray-100/50 w-3/4 h-7 rounded mb-2"></h3>
              <p className="text-berry-bloom font-medium w-1/2 h-5 bg-berry-bloom/10 rounded"></p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs font-bold text-berry-bloom uppercase tracking-widest">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
        */}
      </div>
    </div>
  );
}
