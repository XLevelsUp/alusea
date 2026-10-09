import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import JournalSection from "@/components/sections/JournalSection";
import ProcessSection from "@/components/sections/ProcessSection";
import CountUp from "@/components/ui/CountUp";
import { ESTIMATE_HREF } from "@/lib/site";

export const metadata: Metadata = {
  title: "Thermal Break Hardware & Security Features",
  description: "Explore the advanced engineering, high-security multi-point locking, and eco-friendly thermal break features of Alusea's premium aluminium systems.",
  alternates: {
    canonical: "/alusea-difference",
  },
};

// The journal lists the newest articles, so the page is refreshed every five minutes.
export const revalidate = 300;

const measures = [
  { value: "45dB", label: "Sound Reduction" },
  { value: "25yr", label: "Finish Warranty" },
];

export default function FeaturesPage() {
  return (
    <div className="bg-plate-white">
      {/* The photograph fills the top of the page, with the page's name set over it. */}
      <header className="relative flex h-[82svh] min-h-[34rem] items-end overflow-hidden bg-blueberry">
        <Image src="/images/why-work-with-us.webp" alt="Modern window installation" fill priority sizes="100vw" className="object-cover" />
        {/* Shade at the top keeps the menu readable; shade at the foot keeps the heading readable. */}
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(0_0_0/0.5)_0%,transparent_26%,transparent_48%,rgb(0_0_0/0.62)_100%)]" />
        <div className="shell relative pb-[clamp(7rem,13vw,11rem)]">
          <p className="eyebrow on-dark">The Alusea Difference</p>
          <h1 className="h-display mt-5 text-white [text-shadow:0_2px_24px_rgb(0_0_0/0.35)]">Engineered for Excellence</h1>
        </div>
      </header>

      {/* A frosted panel rides up over the foot of the photograph and introduces Alusea. */}
      <div className="shell relative -mt-[clamp(4.5rem,8vw,7rem)]">
        <div className="reveal swatch-shadow rounded-card border border-white/60 bg-white/70 px-7 py-9 text-center backdrop-blur-2xl backdrop-saturate-150 md:px-14 md:py-12">
          <p className="font-display mx-auto max-w-4xl text-2xl font-light leading-snug text-blueberry md:text-[2rem] md:leading-[1.3]">
            Our aluminium architectural systems are built to surpass industry standards, providing unmatched durability, security, and thermal performance.
          </p>
          <p className="lede mx-auto mt-6 max-w-3xl text-berry-bloom">
            At ALU-SEA, we believe your doors and windows are more than just fittings—they&apos;re the first impression of your home. As reputable suppliers of aluminium sliding doors and premium architectural systems, we provide affordable aluminium windows and doors that elevate your living spaces without compromising on quality or aesthetics.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="shell grid gap-4 md:grid-cols-3 md:gap-6">
          {/* The lead feature takes two columns and two rows. */}
          <article className="reveal relative flex min-h-[26rem] flex-col justify-end overflow-hidden rounded-card border border-stem-grey/50 bg-white p-8 md:col-span-2 md:row-span-2 md:p-12">
            <svg aria-hidden="true" className="absolute -right-6 -top-6 size-64 text-stem-grey/25" fill="none" stroke="currentColor" strokeWidth="0.4" viewBox="0 0 24 24">
              <path d="M3 3h18v18H3z M12 3v18 M3 12h18" />
            </svg>
            <div className="relative max-w-lg">
              <h2 className="h-section text-blueberry">Ultimate Thermal Break Technology</h2>
              <p className="mt-5 leading-relaxed text-berry-bloom">
                Our advanced polyamide thermal break systems significantly reduce heat transfer, maintaining a comfortable interior environment and lowering your carbon footprint while complying with the strictest energy regulations.
              </p>
              <ul className="mt-8 border-t border-stem-grey/50">
                {["High Energy Ratings", "Reduced Condensation", "Extreme Insulation"].map((item) => (
                  <li key={item} className="flex items-center gap-3 border-b border-stem-grey/50 py-3.5 text-[15px] font-medium text-blueberry">
                    <CheckCircle aria-hidden="true" className="size-5 text-berry-bloom" strokeWidth={1.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="reveal flex min-h-64 flex-col justify-between rounded-card bg-blueberry p-8">
            <svg aria-hidden="true" className="size-9 text-plate-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h3 className="h-card text-white">Uncompromised Security</h3>
              <p className="mt-2 text-sm leading-relaxed text-plate-white">Multi-point locking systems and ultra-strong alloy composition providing peace of mind.</p>
            </div>
          </article>

          <article className="reveal flex min-h-64 flex-col justify-between rounded-card bg-berry-bloom p-8">
            <svg aria-hidden="true" className="size-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <div>
              <h3 className="h-card text-white">Aesthetic Brilliance</h3>
              <p className="mt-2 text-sm leading-relaxed text-white">Ultra-slim sightlines allowing for maximum glass area and breathtaking panoramic views.</p>
            </div>
          </article>

          <article className="reveal grid gap-8 rounded-card border border-stem-grey/50 bg-white p-8 md:col-span-3 md:grid-cols-2 md:items-center md:gap-16 md:p-12">
            <div>
              <h3 className="font-display text-2xl font-normal text-blueberry md:text-3xl">Acoustic Insulation &amp; Durability</h3>
              <p className="mt-4 leading-relaxed text-berry-bloom">
                Designed for urban living, our acoustic glass and tight seal integrations dramatically reduce outside noise. The marine-grade powder coating guarantees a flawless finish that resists corrosion over decades.
              </p>
            </div>
            <dl className="grid grid-cols-2 divide-x divide-stem-grey/50 border-y border-stem-grey/50">
              {measures.map((measure) => (
                <div key={measure.label} className="flex flex-col-reverse gap-2 py-6 pl-8 first:pl-0">
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-berry-bloom">{measure.label}</dt>
                  <dd className="font-display text-5xl font-light tabular-nums text-blueberry"><CountUp value={measure.value} /></dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </section>

      <ProcessSection />

      <section className="section window-grid bg-blueberry text-white">
        <div className="shell grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-20">
          <h2 className="h-section reveal text-white lg:col-span-7">Get a Quick Estimate</h2>
          <div className="reveal lg:col-span-5">
            <p className="lede text-plate-white">Share your sizes and requirements, and our team will come back with a clear estimate.</p>
            <Link href={ESTIMATE_HREF} className="btn btn-light mt-8">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <JournalSection />
    </div>
  );
}
