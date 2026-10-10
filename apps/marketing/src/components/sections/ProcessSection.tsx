"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Factory, MessagesSquare, PencilRuler, Ruler, ShieldCheck, Truck, Wrench, type LucideIcon } from "lucide-react";

type Step = {
  title: string;
  text: string;
  icon: LucideIcon;
  /** Path of the step's photograph under /public; a drawn placeholder is shown until one is set. */
  image?: string;
};

const STEPS: Step[] = [
  { title: "Consultation", text: "We listen to how you live and what each room needs.", icon: MessagesSquare, image: "/images/process/01-consultation.webp" },
  { title: "Site Measurement", text: "Our team visits and measures every opening on site.", icon: Ruler, image: "/images/process/02-site-measurement.webp" },
  { title: "Design & Quote", text: "You receive drawings, finish options and a clear quotation.", icon: PencilRuler, image: "/images/process/03-design-quote.webp" },
  { title: "Fabrication", text: "Each frame is cut, assembled and checked in our workshop.", icon: Factory, image: "/images/process/04-fabrication.webp" },
  { title: "Delivery", text: "Finished units arrive packed, protected and on schedule.", icon: Truck, image: "/images/process/05-delivery.webp" },
  { title: "Installation", text: "Our fitters install, seal and test every unit.", icon: Wrench, image: "/images/process/06-installation.webp" },
  { title: "After-Sales Service", text: "We stay on call for servicing long after handover.", icon: ShieldCheck, image: "/images/process/07-after-sales-service.webp" },
];

const ANGLE = 360 / STEPS.length;
const AUTO_ADVANCE_MS = 4500;

/** The journey from first conversation to after-sales care: a wheel of steps that turns the current one to the front. */
const ProcessSection = () => {
  // A running count, not an index, so the wheel always turns the short way and never spins back through every step.
  const [count, setCount] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  // The wheel only runs while the section is on screen, so a visitor always arrives to see it turning.
  const [inView, setInView] = useState(false);
  const active = ((count % STEPS.length) + STEPS.length) % STEPS.length;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // The wheel moves on by itself every few seconds; pressing a step or an arrow starts the wait again from that step.
  useEffect(() => {
    if (!inView || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => setCount((c) => c + 1), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [count, inView]);

  const goTo = (index: number) => {
    let delta = index - active;
    if (delta > STEPS.length / 2) delta -= STEPS.length;
    if (delta < -STEPS.length / 2) delta += STEPS.length;
    setCount((c) => c + delta);
  };

  const rotation = -count * ANGLE;
  const step = STEPS[active];
  const arrowButton = "flex size-12 items-center justify-center rounded-full border border-blueberry/40 text-blueberry transition-colors duration-300 hover:bg-blueberry hover:text-white";

  return (
    <section
      ref={sectionRef}
      id="process"
      className="section overflow-hidden bg-stem-grey/20"
    >
      <div className="shell grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
        {/* The wheel: a round picture with the steps set around it; the whole ring turns to bring the current step to the right. */}
        <div className="reveal lg:col-span-6">
          <div className="relative mx-auto aspect-square w-full max-w-[34rem] [container-type:inline-size]">
            <div className="absolute inset-[6%] rounded-full border border-blueberry/15" />
            <div className="absolute inset-[13%] rounded-full border border-blueberry/10" />

            <div className="swatch-shadow absolute inset-[20%] overflow-hidden rounded-full bg-blueberry">
              {STEPS.map((item, index) => (
                <div key={item.title} aria-hidden="true" className={`absolute inset-0 transition-opacity duration-700 ${index === active ? "opacity-100" : "opacity-0"}`}>
                  {item.image ? (
                    <Image src={item.image} alt="" fill sizes="(max-width: 1024px) 60vw, 26vw" className="object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-berry-bloom via-[#77829b] to-stem-grey">
                      <item.icon className="size-1/3 text-white/45" strokeWidth={0.5} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: `rotate(${rotation}deg)` }}>
              {STEPS.map((item, index) => {
                const angle = index * ANGLE;
                const isActive = index === active;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`Step ${index + 1}: ${item.title}`}
                    aria-current={isActive ? "step" : undefined}
                    // Each button is carried round the ring, then turned back so its icon stays upright.
                    style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(44cqw) rotate(${-angle - rotation}deg)` }}
                    className={`absolute left-1/2 top-1/2 flex items-center justify-center rounded-full transition-[transform,background-color,color,width,height,box-shadow] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isActive
                        ? "swatch-shadow size-16 bg-blueberry text-white md:size-20"
                        : "size-11 border border-stem-grey/60 bg-plate-white text-berry-bloom hover:border-blueberry hover:text-blueberry md:size-14"
                    }`}
                  >
                    <item.icon aria-hidden="true" className={isActive ? "size-7 md:size-9" : "size-5 md:size-6"} strokeWidth={1.25} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="reveal lg:col-span-6">
          <p className="eyebrow">Our Process</p>
          <h2 className="h-section mt-5 text-blueberry">Every Step, Handled with Care</h2>

          {/* Re-keyed on each step, so the number and words settle in afresh. */}
          <div key={active} aria-live="polite" className="sheet-item-in mt-10 flex items-start gap-6 md:mt-14 md:gap-10">
            <span aria-hidden="true" className="font-display text-[clamp(4.5rem,10vw,9rem)] font-light leading-[0.8] tabular-nums text-blueberry/15">
              {String(active + 1).padStart(2, "0")}
            </span>
            <div className="min-h-32 pt-2">
              <h3 className="font-display text-3xl font-normal text-blueberry md:text-4xl">{step.title}</h3>
              <p className="lede mt-3 max-w-md text-berry-bloom">{step.text}</p>
            </div>
          </div>

          <div className="mt-10 flex items-center gap-3">
            <button type="button" onClick={() => setCount((c) => c - 1)} aria-label="Previous step" className={arrowButton}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current" strokeWidth="1.5">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" onClick={() => setCount((c) => c + 1)} aria-label="Next step" className={arrowButton}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current" strokeWidth="1.5">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {/* One segment per step; the current one fills as its time runs. */}
            <div className="ml-4 flex flex-1 gap-1.5">
              {STEPS.map((item, index) => (
                <button key={item.title} type="button" onClick={() => goTo(index)} aria-label={`Go to step ${index + 1}`} className="group flex-1 py-4">
                  <span className="relative block h-px bg-blueberry/20 transition-colors duration-500 group-hover:bg-blueberry/50">
                    {/* The current segment fills from left to right over the time the step is shown. */}
                    {index === active && (
                      <span
                        key={count}
                        className={`segment-fill absolute inset-0 origin-left bg-blueberry ${inView ? "" : "[animation-play-state:paused]"}`}
                        style={{ animationDuration: `${AUTO_ADVANCE_MS}ms` }}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
