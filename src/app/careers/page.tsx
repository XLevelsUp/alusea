import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join the Alusea team. Explore career opportunities in premium aluminium fabrication and architectural design.",
  alternates: {
    canonical: "/careers",
  },
};

const openPositions = [
  { title: "Senior Structural Engineer", dept: "Engineering", location: "Coimbatore, TN", type: "Full-time" },
  { title: "Aluminium Fabricator", dept: "Production", location: "Coimbatore, TN", type: "Full-time" },
  { title: "Project Estimator", dept: "Sales", location: "Coimbatore, TN", type: "Full-time" },
  { title: "CAD Designer", dept: "Design", location: "Coimbatore, TN", type: "Full-time" }
];

export default function CareersPage() {
  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-white">
      <div className="max-w-5xl mx-auto">
        <header className="mb-20 text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-architectural-blue tracking-tight">
            Build Your Future <span className="text-brushed-bronze">With Us</span>
          </h1>
          <p className="text-steel-gray text-lg leading-relaxed max-w-2xl mx-auto">
            We're always looking for passionate engineers, craftsmen, and leaders to join our mission of reshaping modern architecture.
          </p>
        </header>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-matte-black border-b border-gray-100 pb-4">Open Roles</h2>
          {openPositions.map((job, idx) => (
            <div key={idx} className="group border border-gray-100 rounded-xl p-8 hover:border-brushed-bronze/50 hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between cursor-pointer">
              <div className="space-y-2 mb-6 md:mb-0">
                <h3 className="text-xl font-bold text-matte-black group-hover:text-architectural-blue transition-colors">{job.title}</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-steel-gray">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    {job.dept}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {job.type}
                  </span>
                </div>
              </div>
              <div>
                <button className="px-6 py-3 bg-gray-50 text-matte-black font-bold text-sm rounded-lg group-hover:bg-brushed-bronze group-hover:text-white transition-colors">
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
