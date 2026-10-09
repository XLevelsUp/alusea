import Image from 'next/image';
import CountUp from '@/components/ui/CountUp';

const WhyWorkWithUs = () => {
  const benefits = [
    "Unmatched Quality",
    "Expert Craftsmanship",
    "Tailored Solutions",
    "Energy Efficiency"
  ];

  const stats = [
    { value: "98%", label: "Satisfied Clients" },
    { value: "1,500+", label: "Projects Delivered" },
    { value: "17+", label: "Years of Expertise" }
  ];

  const features = [
    {
      title: "Free Shipping",
      subtitle: "*Only in Coimbatore",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-9 fill-none stroke-current" strokeWidth="1">
          <path d="M1 12h5m1 0h11m1 0h4m-4 0a3 3 0 11-6 0m6 0a3 3 0 116 0" />
          <path d="M3 5h11a2 2 0 012 2v5" />
          <path d="M16 7h2l3 3v2" />
        </svg>
      )
    },
    {
      title: "Secure Payment",
      subtitle: "Get 100% payment safe",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-9 fill-none stroke-current" strokeWidth="1">
          <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    },
    {
      title: "Support 24/7",
      subtitle: "Help anytime you need.",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-9 fill-none stroke-current" strokeWidth="1">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      )
    },
    {
      title: "Serving All Tamil Nadu",
      subtitle: "Trusted Doors & Windows",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-9 fill-none stroke-current" strokeWidth="1">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      )
    }
  ];

  return (
    <section className="section relative z-10 overflow-visible bg-plate-white">
      <div className="shell">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="reveal lg:col-span-6">
            <p className="eyebrow">Why Work With Us</p>
            <h2 className="h-section mt-5 text-blueberry">The Trusted Choice for Your Windows &amp; Doors</h2>
            <p className="lede mt-6 max-w-xl text-berry-bloom">
              We are committed to delivering doors and windows that combine strength, elegance, and precision. From consultation to installation, every step is handled with care to create secure, stylish, and lasting solutions for your space.
            </p>

            <ul className="mt-8 grid max-w-xl grid-cols-2 gap-x-8 border-t border-stem-grey/50">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 border-b border-stem-grey/50 py-4 text-[15px] font-medium text-blueberry">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0 fill-none stroke-berry-bloom" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>

            <a href="#contact" className="btn btn-primary mt-10">
              Get Your Free Quote
            </a>
          </div>

          <div className="reveal lg:col-span-6">
            <div className="media aspect-[4/3]">
              <Image
                src="/images/why-work-with-us.webp"
                alt="Modern window installation"
                fill
                sizes="(max-width: 1024px) 92vw, 48vw"
                className="parallax object-cover"
              />
            </div>
          </div>
        </div>

        {/* One compact band: the three figures on the left, the four assurances on the right. */}
        <div className="reveal swatch-shadow mt-14 grid overflow-hidden rounded-card bg-white lg:mt-20 xl:grid-cols-12">
          <dl className="grid grid-cols-3 divide-x divide-stem-grey/40 border-b border-stem-grey/40 xl:col-span-6 xl:border-b-0 xl:border-r">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse justify-end gap-1.5 px-4 py-7 sm:px-6">
                <dt className="text-[10px] font-semibold uppercase leading-snug tracking-[0.14em] text-berry-bloom sm:text-[11px]">{stat.label}</dt>
                <dd className="font-display text-3xl font-light leading-none tabular-nums text-blueberry sm:text-[2.75rem]"><CountUp value={stat.value} /></dd>
              </div>
            ))}
          </dl>

          <ul className="grid grid-cols-1 gap-x-8 gap-y-5 px-6 py-7 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 xl:col-span-6 xl:grid-cols-2">
            {features.map((feature) => (
              <li key={feature.title} className="flex items-center gap-4">
                <span className="shrink-0 text-berry-bloom [&_svg]:size-7">{feature.icon}</span>
                <span className="flex flex-col">
                  <span className="text-[15px] font-semibold leading-tight text-blueberry">{feature.title}</span>
                  <span className="text-[13px] text-berry-bloom">{feature.subtitle}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default WhyWorkWithUs;
