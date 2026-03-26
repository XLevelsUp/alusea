import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Explore Alusea's portfolio of completed architectural projects — luxury residential, commercial, and expansive installations.",
  alternates: {
    canonical: "https://alusea.in/projects",
  },
};

const projectPlaceholders = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ProjectsPage() {
  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-gray-50">
      <div className="max-w-[1440px] mx-auto">
        <header className="mb-16 text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-architectural-blue tracking-tight">
            Our Portfolio
          </h1>
          <p className="text-steel-gray text-lg leading-relaxed">
            A curated selection of our finest architectural aluminium installations.
          </p>
        </header>

        {/* Categories Filter Skeleton */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {["All Projects", "Residential", "Commercial", "Facades"].map((cat, i) => (
            <button key={i} className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${i === 0 ? 'bg-brushed-bronze text-white' : 'bg-white text-steel-gray border border-gray-200 hover:border-brushed-bronze hover:text-brushed-bronze'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Masonry/Grid Skeleton */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {projectPlaceholders.map((p, idx) => (
            <div key={idx} className="break-inside-avoid relative group rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm" style={{ height: `${250 + (idx % 3) * 100}px` }}>
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center opacity-70">
                 <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-matte-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Project Name</h3>
                  <p className="text-brushed-bronze text-sm font-medium">Location</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
