import type { Metadata } from "next";
import PageBanner from "@/components/layout/PageBanner";

export const metadata: Metadata = {
  title: "Jobs in Architectural Aluminium Manufacturing",
  description:
    "Join the Alusea team. Explore rewarding career opportunities in luxury aluminium fabrication, architectural design, structural engineering, and sales.",
  alternates: {
    canonical: "/careers",
  },
};

const openPositions = [
  { title: "Field Marketing Executive", dept: "Marketing", location: "Coimbatore, TN", type: "Full-time" },
  { title: "Sales Executive", dept: "Sales", location: "Coimbatore, TN", type: "Full-time" },
];

// Each Apply button opens WhatsApp with a message that names its own role.
const applyHref = (title: string) => `https://wa.me/919626022722?text=${encodeURIComponent(`Hello, I am interested in the ${title} position.`)}`;

export default function CareersPage() {
  return (
    <div className="bg-plate-white">
      <PageBanner crumb="Careers" title={<>Build Your Future <span className="text-plate-white/80">With Us</span></>}>
        <p>
          We&apos;re always looking for passionate engineers, craftsmen, and leaders to join our mission of reshaping modern architecture.
        </p>
      </PageBanner>

      <section className="section">
        <div className="shell">
          <h2 className="h-section text-blueberry">Open Roles</h2>
          <ul className="mt-10">
            {openPositions.map((job) => (
              <li key={job.title} className="reveal group flex flex-col justify-between gap-6 border-t border-stem-grey/50 py-8 last:border-b md:flex-row md:items-center md:py-10">
                <div>
                  <h3 className="font-display text-2xl font-normal text-blueberry md:text-3xl">{job.title}</h3>
                  <ul className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-berry-bloom">
                    <li className="flex items-center gap-2">
                      <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      {job.dept}
                    </li>
                    <li className="flex items-center gap-2">
                      <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {job.location}
                    </li>
                    <li className="flex items-center gap-2">
                      <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {job.type}
                    </li>
                  </ul>
                </div>
                <a
                  href={applyHref(job.title)}
                  aria-label={`Apply for ${job.title}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline shrink-0 self-start md:self-auto"
                >
                  Apply Now
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
