import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { principles, qualities } from "@/components/sections/AboutSection";
import CountUp from "@/components/ui/CountUp";
import { CONSULTATION_HREF } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us | Luxury Aluminium Window Fabricator Tamil Nadu | Alusea",
  description:
    "Discover Alusea's dedication to architectural glazing and premium aluminium fabrication. As a leading luxury aluminium window fabricator in Tamil Nadu and architectural glazing manufacturer in South India, we craft bespoke fenestration solutions.",
  alternates: {
    canonical: "/about",
  },
};

const stats = [
  { value: "10+", label: "Years of Precision" },
  { value: "100%", label: "Client Satisfaction" },
];

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Alusea",
    "description": "Alusea stands at the forefront of the architectural glazing industry, bringing decades of collective expertise to the design and manufacturing of supreme aluminium doors and windows. Every piece that leaves our state-of-the-art facility undergoes rigorous quality control checks and adheres to stringent international standards, guaranteeing flawless performance.",
    "publisher": {
      "@type": "Organization",
      "name": "Alusea"
    }
  };

  return (
    <div className="bg-plate-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      {/* The workshop photograph fills the top of the page, with the page's heading set over it. */}
      <header className="relative flex h-[82svh] min-h-[34rem] items-end overflow-hidden bg-blueberry">
        <Image src="/images/about/workshop-craftsman.webp" alt="Alusea craftsman fitting glass into an aluminium frame in the workshop" fill priority sizes="100vw" className="object-cover object-[70%_center]" />
        {/* Shade at the top keeps the menu readable; shade at the foot and left keeps the heading readable. */}
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(0_0_0/0.5)_0%,transparent_26%,transparent_44%,rgb(0_0_0/0.68)_100%),linear-gradient(to_right,rgb(0_0_0/0.35),transparent_60%)]" />
        <div className="shell relative pb-[clamp(7rem,13vw,11rem)]">
          <p className="eyebrow on-dark">Who We Are</p>
          <h1 className="h-display mt-5 text-white [text-shadow:0_2px_24px_rgb(0_0_0/0.35)]">Crafting Architectural <br />Excellence</h1>
        </div>
      </header>

      {/* A frosted panel rides up over the foot of the photograph and carries the opening line. */}
      <div className="shell relative -mt-[clamp(4.5rem,8vw,7rem)]">
        <div className="reveal swatch-shadow rounded-card border border-white/60 bg-white/70 px-7 py-9 backdrop-blur-2xl backdrop-saturate-150 md:px-14 md:py-12">
          <p className="font-display mx-auto max-w-4xl text-center text-2xl font-light leading-snug text-blueberry md:text-[2rem] md:leading-[1.3]">
            At Alusea, we believe that windows and doors are more than just functional elements—they are the transparent boundaries that connect your sanctuary to the world.
          </p>
        </div>
      </div>

      {/* The story: the picture holds still on the left while the words scroll past on the right. */}
      <section className="section">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-20">
          <figure className="reveal lg:col-span-5">
            <div className="media aspect-[4/5] lg:sticky lg:top-28">
              <Image
                src="/images/about/villa-sliding-doors.webp"
                alt="Villa at dusk with slim-frame Alusea aluminium sliding doors"
                fill
                sizes="(max-width: 1024px) 92vw, 38vw"
                className="parallax object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blueberry/85 to-transparent p-8 pt-24">
                <p className="font-display max-w-sm text-xl font-light text-white md:text-2xl">
                  &quot;Redefining spaces with light, strength, and visionary design.&quot;
                </p>
              </figcaption>
            </div>
          </figure>

          <div className="reveal lg:col-span-7">
            <p className="eyebrow">Our Heritage</p>
            <p className="lede mt-8 text-berry-bloom">
              For over a decade, we have dedicated ourselves to perfecting the art of premium aluminium architecture, establishing ourselves as the leading aluminium window doors manufacturer in Coimbatore and South India.
            </p>
            <p className="lede mt-6 text-berry-bloom">
              If you&apos;ve ever wondered what are the advantages of aluminium windows, it comes down to longevity, slim profiles, and unparalleled energy performance. As a prominent luxury aluminium window fabricator in Tamil Nadu and architectural glazing manufacturer in South India, our mission is to empower architects, builders, and homeowners with sustainable, high-performance systems that never compromise on aesthetic brilliance. Every extrusion, thermal break, and glass pane is rigorously tested to meet our uncompromising standards.
            </p>

            <dl className="mt-12 grid grid-cols-2 divide-x divide-stem-grey/50 border-y border-stem-grey/50">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse gap-2 py-8 pl-8 first:pl-0">
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-berry-bloom">{stat.label}</dt>
                  <dd className="h-display font-display tabular-nums text-blueberry"><CountUp value={stat.value} /></dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Mission and vision share one dark band, side by side, as the two statements the company works to. */}
      <section className="section window-grid bg-blueberry text-white">
        <div className="shell">
          <p className="eyebrow on-dark reveal">Mission &amp; Vision</p>
          <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-0 md:divide-x md:divide-white/20">
            {principles.map((item) => (
              <article key={item.title} className="reveal md:px-14 md:first:pl-0 md:last:pr-0">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-10 fill-none stroke-plate-white" strokeWidth="1">
                  {item.icon}
                </svg>
                <h2 className="h-section mt-6 text-white">{item.title}</h2>
                <p className="lede mt-5 text-plate-white">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <p className="eyebrow reveal">What We Stand For</p>
          <h2 className="h-section reveal mt-5 text-blueberry">Built on Six Promises</h2>
          {/* Six qualities in one ruled band, like a specification strip. */}
          <ul className="reveal mt-14 grid grid-cols-2 border-l border-t border-stem-grey/50 md:grid-cols-3">
            {qualities.map((item, index) => (
              <li key={item.label} className="flex flex-col items-start gap-10 border-b border-r border-stem-grey/50 bg-white/50 p-7 lg:p-10">
                <div className="flex w-full items-start justify-between">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-10 fill-none stroke-berry-bloom" strokeWidth="1">
                    {item.icon}
                  </svg>
                  <span aria-hidden="true" className="font-display text-sm tabular-nums text-berry-bloom">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <span className="font-display text-xl font-normal leading-snug text-blueberry md:text-2xl">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section bg-stem-grey/20">
        <div className="shell grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-20">
          <h2 className="h-section reveal text-blueberry lg:col-span-7">Planning a Project?</h2>
          <div className="reveal lg:col-span-5">
            <p className="lede text-berry-bloom">Tell us about your space and we will suggest the frames, glass and finish that fit it.</p>
            <Link href={CONSULTATION_HREF} className="btn btn-primary mt-8">
              Book a Consultation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
