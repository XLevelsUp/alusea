import InViewVideo from "@/components/ui/InViewVideo";
import Link from "next/link";

export const principles = [
  {
    title: "Our Mission",
    text: "Our mission is to deliver premium doors and windows that blend durability, design, and functionality, with precise installation that enhances every space with secure and stylish solutions.",
    icon: <path d="M3 3h18v18H3z M12 3v18 M3 10h18 M3 14h18" />,
  },
  {
    title: "Our Vision",
    text: "Our vision is to be the most trusted name in doors and windows by delivering unmatched quality and innovative designs, creating homes and spaces where beauty meets strength.",
    icon: <path d="M4 4h16v16H4z M9 4v16 M15 4v16" />,
  },
];

export const qualities = [
  { label: "Energy Saving Technologies", icon: <path d="M3 3h18v18H3z M9 3v8 M15 3v8 M3 11h18" /> },
  { label: "Quality without compromise", icon: <path d="M4 4h16v16H4z M10 4v16 M14 4v16 M4 10h16 M4 14h16" /> },
  { label: "Customer-first approach", icon: <path d="M3 3h18v18H3z M12 3v18 M3 12h18" /> },
  { label: "Long Durability", icon: <path d="M4 4h16v10 c0 3.3-2.7 6-6 6 s-6-2.7-6-6 V4" /> },
  { label: "Eco - Friendly Materials", icon: <path d="M4 4h16v16H4z M12 4v16 M12 10h8" /> },
  { label: "Lifetime Support", icon: <path d="M4 4h16v16H4z M12 4v16" /> },
];

const AboutSection = () => {
  return (
    <section id="about" className="section overflow-hidden bg-plate-white pt-0">
      <div className="shell">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
          {/* The film sits on the right on wide screens; it is cropped a little at the sides, which also keeps its corner mark out of view. */}
          <div className="reveal lg:order-2 lg:col-span-6">
            <InViewVideo src="/videos/about.webm" poster="/images/posters/about.webp" label="Modern architectural window system" className="swatch-shadow aspect-[4/3] rounded-card" />
          </div>

          <div className="reveal lg:col-span-6">
            <p className="eyebrow">About Us</p>
            <h2 className="h-section mt-5 text-blueberry">Expertise in Windows &amp; Doors</h2>
            <p className="lede mt-6 max-w-2xl text-berry-bloom">
              At ALU-SEA, we believe your doors and windows are more than just fittings—they&apos;re the first impression of your home. As reputable suppliers of aluminium sliding doors and premium architectural systems, we provide affordable aluminium windows and doors that elevate your living spaces without compromising on quality or aesthetics.
            </p>

            <div className="mt-10 grid gap-8 border-t border-stem-grey/50 pt-10 sm:grid-cols-2">
              {principles.map((item) => (
                <div key={item.title}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-9 fill-none stroke-berry-bloom" strokeWidth="1">
                    {item.icon}
                  </svg>
                  <h3 className="h-card mt-4 text-blueberry">{item.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-berry-bloom">{item.text}</p>
                </div>
              ))}
            </div>

            <Link href="#contact" className="btn btn-primary mt-10">
              Get Your Free Quote
            </Link>
          </div>
        </div>

        {/* Six qualities in one ruled band, like a specification strip. */}
        <ul className="reveal mt-[var(--section-y)] grid grid-cols-2 border-l border-t border-stem-grey/50 md:grid-cols-3 lg:grid-cols-6">
          {qualities.map((item) => (
            <li key={item.label} className="flex flex-col items-start gap-4 border-b border-r border-stem-grey/50 p-6 lg:p-7">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-8 fill-none stroke-berry-bloom" strokeWidth="1">
                {item.icon}
              </svg>
              <span className="text-sm font-medium leading-snug text-blueberry">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default AboutSection;
