"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const slides = [
  { id: 1, src: "/images/collection/01-pivot-glass-entrance.webp", alt: "Tall pivot glass door with slim black aluminium frames at the entrance of a residence" },
  { id: 2, src: "/images/collection/02-panoramic-sliding.webp", alt: "Floor-to-ceiling panoramic aluminium sliding system opening a living room onto a garden terrace" },
  { id: 3, src: "/images/collection/03-casement-window.webp", alt: "Double-glazed aluminium casement window with one sash open in a bedroom" },
  { id: 4, src: "/images/collection/04-pivot-entrance-door.webp", alt: "Aluminium pivot entrance door with a long vertical pull handle in a minimalist foyer" },
  { id: 5, src: "/images/collection/05-office-glass-entrance.webp", alt: "Aluminium-framed glass entrance door at the front of a modern office lobby" },
  { id: 6, src: "/images/collection/06-living-room-window-wall.webp", alt: "Wall of slim-framed aluminium windows in a living room overlooking the city" },
  { id: 7, src: "/images/collection/07-fixed-window-band.webp", alt: "Band of black aluminium-framed windows set into a white wall" },
  { id: 8, src: "/images/collection/08-fluted-glass-partition.webp", alt: "Interior with a fluted glass partition beside lit display shelves" },
];

const AUTO_ADVANCE_MS = 5000;

/** Our Collection: a gallery that arrives as one picture and opens out as it scrolls into view, the neighbours sliding from behind it. */
const ProductShowcase = () => {
  const [current, setCurrent] = useState(0);
  const count = slides.length;
  const touchStart = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // The gallery only moves on by itself while it is on screen.
  const [inView, setInView] = useState(false);

  const go = (step: number) => setCurrent((c) => (c + step + count) % count);

  // The opening is tied to scrolling in both directions; visitors who ask for less motion see the gallery already open.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(stage);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => observer.disconnect();

    let frame = 0;
    const update = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const top = stage.getBoundingClientRect().top;
      // 0 while the gallery is still at the foot of the screen, 1 once its top has risen to about a third of the way down.
      const progress = Math.min(1, Math.max(0, (viewport * 0.95 - top) / (viewport * 0.6)));
      stage.style.setProperty("--spread", progress.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!inView || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => setCurrent((c) => (c + 1) % count), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [current, count, inView]);

  // Distance from the centre picture, wrapped so the row loops round.
  const offset = (index: number) => {
    let d = index - current;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  };

  const arrow = "flex size-12 items-center justify-center rounded-full border border-blueberry/30 bg-white text-blueberry transition-colors duration-300 hover:bg-blueberry hover:text-white";

  return (
    <section id="collection" className="section overflow-hidden bg-plate-white">
      <div className="reveal shell text-center">
        <p className="eyebrow">Our Collection</p>
        <h2 className="h-section mt-5 text-blueberry">
          Precision Engineered <span className="italic text-berry-bloom">Architectural Solutions</span>
        </h2>
      </div>

      <div
        ref={stageRef}
        className="relative mx-auto mt-14 aspect-[4/3] w-[80vw] [--spread:1] sm:aspect-[3/2] lg:w-[56vw] lg:max-w-[62rem]"
        onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchStart.current = null;
        }}
      >
        {slides.map((slide, index) => {
          const d = offset(index);
          const isCentre = d === 0;
          return (
            <button
              key={slide.id}
              type="button"
              tabIndex={Math.abs(d) > 1 ? -1 : 0}
              aria-label={isCentre ? `Picture ${index + 1} of ${count}` : `Show picture ${index + 1}`}
              aria-current={isCentre}
              onClick={() => setCurrent(index)}
              className={`absolute inset-0 overflow-hidden rounded-card transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isCentre ? "swatch-shadow z-10 cursor-default" : "cursor-pointer"}`}
              // Each neighbour sits one picture-width plus a gap to the side, smaller and paler; --spread closes that distance to nothing while the gallery is still arriving.
              style={{
                transform: isCentre
                  ? "scale(calc(0.84 + 0.16 * var(--spread)))"
                  : `translateX(calc(${d} * var(--spread) * (100% + clamp(1rem, 3.5vw, 3.25rem)))) scale(calc(0.8 + 0.16 * var(--spread)))`,
                opacity: Math.abs(d) > 1 ? 0 : isCentre ? 1 : "calc(0.45 * var(--spread))",
                transformOrigin: "center top",
              }}
            >
              {/* Only the pictures near the centre are fetched at first; the rest load as they come round. */}
              <Image src={slide.src} alt={slide.alt} fill sizes="(max-width: 1024px) 80vw, 56vw" loading={Math.abs(d) <= 1 ? "eager" : "lazy"} className="object-cover" />
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button type="button" onClick={() => go(-1)} aria-label="Previous picture" className={arrow}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current" strokeWidth="1.75">
            <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="min-w-14 text-center text-sm tabular-nums text-berry-bloom">
          {String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
        <button type="button" onClick={() => go(1)} aria-label="Next picture" className={arrow}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current" strokeWidth="1.75">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default ProductShowcase;
