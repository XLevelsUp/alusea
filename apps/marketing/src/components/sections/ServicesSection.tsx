import InViewVideo from "@/components/ui/InViewVideo";

const services = [
  { title: "Luxury Windows", description: "Crafted for elegance, durability, and timeless style to enhance your living space." },
  { title: "Warranty & Service", description: "1-year replacement, lifetime free service pay only for hardware parts." },
  { title: "Energy-Smart Designs", description: "Energy-efficient aluminium windows and doors built to save energy year round." },
  { title: "Trusted Service", description: "Genuine care and reliable repairs that ensure durability and beauty." },
  { title: "Quality Assurance", description: "Premium materials for strength and lasting durability." },
  { title: "All-in-One Solutions", description: "Durable doors and windows, designed to enhance every home." },
];

/** Services: the whole upright film on the left; the introduction and the six services as white cards on the right. */
const ServicesSection = () => {
  return (
    <section id="services" className="section overflow-hidden bg-stem-grey/20">
      <div className="shell grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
        {/* The film is shown whole, in its own upright shape. */}
        <div className="reveal lg:col-span-4">
          <InViewVideo src="/videos/services.webm" poster="/images/posters/services.webp" label="Our services – premium windows and doors" className="swatch-shadow mx-auto aspect-[9/16] w-full max-w-[24rem] rounded-card" />
        </div>

        <div className="lg:col-span-8">
          <div className="reveal">
            <p className="eyebrow">Our Services</p>
            <h2 className="h-section mt-5 text-blueberry">Complete Door &amp; Window Solutions</h2>
            <p className="lede mt-5 max-w-2xl text-berry-bloom">
              Transform your spaces with expertly crafted doors and windows, designed for strength, elegance, and long-lasting performance. Every project is delivered with unmatched precision and care.
            </p>
          </div>

          <ol className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {services.map((service, index) => (
              <li
                key={service.title}
                className="reveal swatch-shadow group rounded-card bg-white p-7 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5"
              >
                <span aria-hidden="true" className="font-display text-3xl font-light tabular-nums text-stem-grey transition-colors duration-500 group-hover:text-blueberry">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display mt-5 text-xl text-blueberry">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-berry-bloom">{service.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
