import type { Metadata } from "next";
import Link from "next/link";
import PageBanner from "@/components/layout/PageBanner";

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
    <div className="bg-plate-white">
      <PageBanner crumb="Services" eyebrow="Services" title="Our Services">
        <p>
          From initial concept to final on-site installation, we provide complete, elite-grade aluminium engineering solutions. As the leading <Link href="/">architectural glazing manufacturer in South India</Link>, we bring structural integrity and luxury design together.
        </p>
      </PageBanner>

      <section className="section">
        <ol className="shell">
          {servicesList.map((service, idx) => (
            <li key={service.title} className="reveal group grid gap-4 border-t border-stem-grey/50 py-10 last:border-b md:grid-cols-12 md:items-baseline md:gap-10 md:py-14">
              <span aria-hidden="true" className="font-display text-sm tabular-nums text-berry-bloom md:col-span-1">0{idx + 1}</span>
              <h2 className="h-section text-blueberry transition-colors duration-300 group-hover:text-berry-bloom md:col-span-5">{service.title}</h2>
              <div className="md:col-span-6">
                <p className="lede max-w-xl text-berry-bloom">{service.desc}</p>
                <Link href="/contact" className="link-arrow mt-6 text-blueberry">
                  Learn More
                  <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
