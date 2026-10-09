import type { Metadata } from "next";
import PageBanner from "@/components/layout/PageBanner";

export const metadata: Metadata = {
  title: "Luxury Aluminium Facade & Villa Portfolios",
  description:
    "Explore Alusea's premier portfolio of completed architectural projects. View our custom aluminium facades across luxury residential and commercial sites.",
  alternates: {
    canonical: "/projects",
  },
};

const projectPlaceholders = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ProjectsPage() {
  return (
    <div className="bg-plate-white">
      <PageBanner crumb="Projects" title="Our Portfolio">
        <p>A curated selection of our finest architectural aluminium installations.</p>
      </PageBanner>

      <section className="section">
        <div className="shell">
          {/* Category filter, shown ahead of the finished project photographs. */}
          <div className="flex flex-wrap gap-3">
            {["All Projects", "Residential", "Commercial", "Facades"].map((cat, i) => (
              <button key={cat} type="button" aria-pressed={i === 0} className={`btn ${i === 0 ? "btn-primary" : "btn-outline"}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Placeholders that hold each project's place until its photograph is added. */}
          <div className="mt-12 columns-1 gap-6 space-y-6 md:columns-2 lg:columns-3">
            {projectPlaceholders.map((p, idx) => (
              <div key={p} className="media group break-inside-avoid border border-stem-grey/50" style={{ height: `${250 + (idx % 3) * 100}px` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg aria-hidden="true" className="size-12 text-stem-grey" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-blueberry/85 via-transparent to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div>
                    <h3 className="text-lg font-medium text-white">Project Name</h3>
                    <p className="text-sm text-plate-white">Location</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
