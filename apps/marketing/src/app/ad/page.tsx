import type { Metadata } from "next";
import Image from "next/image";
import WhatsAppButton from "@/components/ad/WhatsAppButton";
import WhatsAppPrompt from "@/components/ad/WhatsAppPrompt";

// The Google Ads landing page, served on ad.alusea.in: one page, no links out, every button opens WhatsApp.
export const metadata: Metadata = {
  title: { absolute: "Alusea | Premium Aluminium Windows & Doors in Coimbatore" },
  description: "Slim aluminium windows and doors, made to measure and installed by Alusea in Coimbatore. 17+ years, 1,500+ projects. Get a free quote on WhatsApp.",
  // Ad traffic only: kept out of search results so it never competes with www.alusea.in.
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

const STATS = [
  { value: "17+", label: "Years of expertise" },
  { value: "1,500+", label: "Projects delivered" },
  { value: "98%", label: "Satisfied clients" },
];

const OFFERINGS = [
  { title: "Aluminium Windows", text: "Casement, sliding, tilt-and-turn, folding and fixed windows with slim frames and wide views.", image: "/images/collection/03-casement-window.webp" },
  { title: "Doors & Entrances", text: "Pivot entrance doors, hinged doors and glass entrances that make a strong first impression.", image: "/images/collection/01-pivot-glass-entrance.webp" },
  { title: "Sliding & Folding Systems", text: "Panoramic sliding, lift-and-slide and folding doors that open rooms to the outdoors.", image: "/images/collection/02-panoramic-sliding.webp" },
  { title: "Partitions & Fixed Glazing", text: "Glass partitions and fixed window bands that bring daylight deep into the home.", image: "/images/collection/08-fluted-glass-partition.webp" },
];

const STEPS = ["Free consultation", "Site measurement", "Design & quote", "Fabrication", "Installation", "After-sales service"];

const VALUES = [
  { title: "Quality without compromise", text: "Premium aluminium profiles, glass and hardware, chosen for strength and a long life." },
  { title: "Customer first", text: "We listen to how you live and design every opening around your home, not a catalogue." },
  { title: "Precision in every detail", text: "Measured on site, built in our workshop and installed, sealed and tested by our own team." },
  { title: "Honest and transparent", text: "Clear drawings, clear quotations and timelines we keep." },
  { title: "Energy-smart design", text: "Well-sealed frames and the right glass for a cooler, quieter home." },
  { title: "Support for life", text: "We stay on call long after handover, for servicing and care." },
];

const CORE = [
  { title: "Made to measure", text: "Every window and door is fabricated for its exact opening, never forced to fit." },
  { title: "One team, start to finish", text: "Consultation, measurement, fabrication and installation, all handled by Alusea." },
  { title: "Warranty you can rely on", text: "1-year replacement and lifetime free service; you pay only for hardware parts." },
  { title: "See it before you buy", text: "Visit our Experience Centre in RS Puram, Coimbatore, to see and try every system." },
];

const REVIEWS = [
  { quote: "We installed their thermal break sliding doors in our Coimbatore villa, and the sound insulation and thermal performance are absolutely world-class.", author: "Rajesh Krishnan", role: "Architectural Designer, Coimbatore" },
  { quote: "Their engineering precision, seamless sliding tracks and bronze anodised finishes look breathtaking.", author: "Arjun Mehta", role: "Villa Owner, Ooty" },
];

const Check = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 size-5 shrink-0 fill-none stroke-current" strokeWidth="1.75">
    <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function AdLandingPage() {
  return (
    <div data-ad-landing className="bg-plate-white text-blueberry">
      {/* Top bar: the logo is not a link, so the visitor stays on this page. */}
      <div className="sticky top-0 z-40 border-b border-stem-grey/30 bg-plate-white/90 backdrop-blur-md">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <Image src="/images/alusea-logo-dark.svg" alt="Alusea Doors & Windows" width={350} height={192} priority className="h-11 w-auto" />
          <WhatsAppButton size="compact" label="Get a Free Quote" />
        </div>
      </div>

      {/* Hero: who Alusea is, why to trust us, and the action. */}
      <section className="relative isolate overflow-hidden bg-blueberry">
        <Image src="/images/posters/hero.webp" alt="Living room with slim Alusea aluminium sliding doors" fill priority sizes="100vw" className="-z-10 object-cover" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgb(20_26_40/0.92)_0%,rgb(20_26_40/0.7)_50%,rgb(20_26_40/0.35)_100%)]" />
        <div className="shell flex min-h-[calc(100svh-4rem)] flex-col justify-center py-16 lg:min-h-[44rem]">
          <p className="eyebrow on-dark">Aluminium Windows &amp; Doors · Coimbatore</p>
          <h1 className="h-display mt-6 max-w-4xl text-white">Slim aluminium windows and doors, made to measure for your home</h1>
          <p className="lede mt-6 max-w-2xl text-white/80">Alusea designs, fabricates and installs premium aluminium systems for villas, apartments and commercial spaces across Tamil Nadu.</p>
          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <WhatsAppButton />
            <p className="text-sm text-white/70">Free site visit and quotation · Reply within working hours</p>
          </div>
          <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/15 pt-8">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-3xl font-light text-white sm:text-4xl">{stat.value}</dd>
                <dd className="mt-1 text-xs uppercase tracking-[0.14em] text-white/65 sm:text-sm sm:normal-case sm:tracking-normal">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* About Alusea. */}
      <section className="section">
        <div className="shell grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="reveal">
            <p className="eyebrow">About Alusea</p>
            <h2 className="h-section mt-5">The first impression of your home, built to last</h2>
            <p className="lede mt-6 text-berry-bloom">At Alusea, we believe doors and windows are more than fittings: they are the first impression of your home. For over 17 years we have supplied and installed aluminium sliding doors, windows and premium architectural systems that elevate living spaces without compromising on quality or aesthetics.</p>
            <ul className="mt-8 space-y-3 text-[15px] text-blueberry">
              <li className="flex gap-3"><Check />Experience Centre in RS Puram, Coimbatore</li>
              <li className="flex gap-3"><Check />Our own workshop and installation team</li>
              <li className="flex gap-3"><Check />Homes, villas, apartments and commercial projects</li>
            </ul>
          </div>
          <div className="reveal swatch-shadow relative aspect-[4/3] overflow-hidden rounded-card">
            <Image src="/images/about/villa-sliding-doors.webp" alt="Villa with large Alusea aluminium sliding doors" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* What Alusea does. */}
      <section className="section border-t border-stem-grey/30 bg-white/60">
        <div className="shell">
          <div className="reveal max-w-3xl">
            <p className="eyebrow">What We Do</p>
            <h2 className="h-section mt-5">Every window and door your project needs</h2>
            <p className="lede mt-5 text-berry-bloom">We handle the whole job: from the first conversation to the final seal, with one team responsible for the result.</p>
          </div>
          <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-6 lg:grid-cols-4">
            {OFFERINGS.map((item) => (
              <li key={item.title} className="reveal">
                <div className="swatch-shadow relative aspect-[4/5] overflow-hidden rounded-card">
                  <Image src={item.image} alt={item.title} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
                </div>
                <h3 className="h-card mt-4 sm:mt-5">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-berry-bloom sm:text-[15px]">{item.text}</p>
              </li>
            ))}
          </ul>
          <ol className="reveal mt-14 flex flex-wrap items-center gap-x-3 gap-y-3 text-sm text-blueberry">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="rounded-full border border-stem-grey/50 bg-plate-white px-4 py-2"><span className="mr-2 tabular-nums text-berry-bloom">{String(i + 1).padStart(2, "0")}</span>{step}</span>
                {i < STEPS.length - 1 && <span aria-hidden="true" className="h-px w-5 bg-stem-grey/60" />}
              </li>
            ))}
          </ol>
          <div className="reveal mt-12">
            <WhatsAppButton label="Talk to Us on WhatsApp" />
          </div>
        </div>
      </section>

      {/* Alusea's values. */}
      <section className="section">
        <div className="shell">
          <div className="reveal max-w-3xl">
            <p className="eyebrow">Our Values</p>
            <h2 className="h-section mt-5">How we work with you</h2>
          </div>
          <ul className="mt-12 grid border-l border-t border-stem-grey/40 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((value, i) => (
              <li key={value.title} className="reveal border-b border-r border-stem-grey/40 p-7 lg:p-9">
                <span className="text-sm tabular-nums text-berry-bloom">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="h-card mt-4">{value.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-berry-bloom">{value.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Alusea's core: purpose and what sets us apart. */}
      <section className="window-grid section bg-blueberry text-white">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="reveal lg:col-span-5">
            <p className="eyebrow on-dark">Our Core</p>
            <h2 className="h-section mt-5 text-white">Where beauty meets strength</h2>
            <p className="lede mt-6 text-white/75">Our purpose is to deliver premium doors and windows that blend durability, design and function, installed with precision so every space is secure and stylish. Our aim is to be the most trusted name in doors and windows.</p>
            <div className="mt-9">
              <WhatsAppButton />
            </div>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-card bg-white/10 sm:grid-cols-2 lg:col-span-7">
            {CORE.map((item) => (
              <li key={item.title} className="reveal bg-blueberry p-7 lg:p-9">
                <h3 className="h-card text-white">{item.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/70">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Proof from clients. */}
      <section className="section">
        <div className="shell">
          <div className="reveal max-w-3xl">
            <p className="eyebrow">Client Stories</p>
            <h2 className="h-section mt-5">Trusted by homeowners and architects</h2>
          </div>
          <ul className="mt-12 grid gap-6 lg:grid-cols-2">
            {REVIEWS.map((review) => (
              <li key={review.author} className="reveal swatch-shadow rounded-card bg-white p-8 lg:p-10">
                <p aria-label="5 out of 5 stars" className="text-champagne">★★★★★</p>
                <blockquote className="font-display mt-5 text-xl font-light leading-relaxed text-blueberry lg:text-2xl">“{review.quote}”</blockquote>
                <p className="mt-6 text-sm font-semibold">{review.author}</p>
                <p className="text-sm text-berry-bloom">{review.role}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Final call to action. */}
      <section className="pb-[var(--section-y)]">
        <div className="shell">
          <div className="reveal swatch-shadow relative isolate overflow-hidden rounded-card bg-blueberry px-7 py-14 text-center sm:px-12 lg:py-20">
            <Image src="/images/collection/06-living-room-window-wall.webp" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-25" />
            <h2 className="h-section mx-auto max-w-3xl text-white">Planning new windows or doors?</h2>
            <p className="lede mx-auto mt-5 max-w-xl text-white/80">Message us on WhatsApp with your requirement. We will arrange a free site visit and a clear quotation.</p>
            <div className="mt-9 flex justify-center">
              <WhatsAppButton />
            </div>
          </div>
        </div>
      </section>

      {/* Footer details as plain text, with no links away from the page. */}
      <div className="border-t border-stem-grey/30 py-8">
        <div className="shell flex flex-col gap-2 text-sm text-berry-bloom sm:flex-row sm:items-center sm:justify-between">
          <p>Alusea Doors &amp; Windows · No 178, A Ramachandra Road, RS Puram, Coimbatore 641002</p>
          <p>© {new Date().getFullYear()} Alusea</p>
        </div>
      </div>

      <WhatsAppPrompt />
    </div>
  );
}
