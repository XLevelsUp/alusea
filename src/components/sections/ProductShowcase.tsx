"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const slides = [
  { id: 1, src: "/images/Interior 1.webp", alt: "Matte black multi-panel pivot glass revolving door for luxury residential entrance" },
  { id: 2, src: "/images/Interior 2.webp", alt: "Ultra-slim frame aluminium floor-to-ceiling panoramic sliding window systems" },
  { id: 3, src: "/images/Interior 3 (1).webp", alt: "Energy-efficient thermal break aluminium casement window with double glazing" },
  { id: 4, src: "/images/Interior 3.webp", alt: "Custom built aluminium bi-fold doors seamlessly connecting indoor and outdoor living spaces" },
  {
    id: 5,
    src: "/images/Interior-Master-Line-Multi-Panel-Pivot-Glass-Revolving-Door-Aluminium-Internal-Aluminum-Center-Glass-Pivot-Doors.webp",
    alt: "Premium architectural aluminium pivot entrance door with modern minimalist hardware",
  },
  { id: 6, src: "/images/glass entrance door.webp", alt: "Commercial grade aluminium frame glass entrance door with enhanced security locking mechanism" },
  { id: 7, src: "/images/Rectangle 87.webp", alt: "High-performance aluminium facade system designed for contemporary sleek architectural buildings" },
  {
    id: 8,
    src: "/images/ChatGPT Image Mar 13, 2026, 04_53_24 PM.webp",
    alt: "Luxurious modern home featuring custom oversized aluminium windows and slimline sliding doors",
  },
  {
    id: 9,
    src: "/images/ChatGPT Image Mar 13, 2026, 04_56_24 PM.webp",
    alt: "Precision engineered structural aluminium window frames offering maximum natural light and weather resistance",
  },
];

const ProductShowcase = () => {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent((index + slides.length) % slides.length);
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [isTransitioning]
  );

  const prev = () => goTo(current - 1);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section id="collection" className="relative bg-matte-black overflow-hidden">

      {/* Section header */}
      <div className="max-w-[1440px] mx-auto px-4 md:pl-6 md:pr-12 py-16 flex items-end justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {/* FIX: on bg-matte-black, use light bronze #D4A84B instead of dark #7A5418 */}
            <span className="w-2 h-2 rounded-full bg-[#D4A84B]" />
            <span className="text-[#D4A84B] text-xs uppercase tracking-[0.2em] font-bold">
              Our Collection
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Precision Engineered <br />
            <span className="text-[#D4A84B] italic">Architectural Solutions</span>
          </h2>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <span className="text-white/70 text-sm tabular-nums">
            {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-[#D4A84B] hover:text-[#D4A84B] transition-all duration-300"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-[#D4A84B] hover:text-[#D4A84B] transition-all duration-300"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Carousel track */}
      <div className="max-w-[1440px] mx-auto px-10 md:px-32">
        <div className="relative w-full h-[65vh] md:h-[82vh] overflow-hidden rounded-sm">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-500 ${idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                className="object-cover object-center"
                /*
                  PERFORMANCE FIX: was "100vw" — but container has px-10 md:px-32 padding.
                  Corrected sizes match the actual rendered width so Next.js
                  serves the right srcset variant instead of always downloading the largest.
                  Also only priority-load slide 0; rest are lazy loaded.
                */
                sizes="(max-width: 640px) 85vw, (max-width: 1024px) 75vw, 60vw"
                priority={idx === 0}
                loading={idx === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-matte-black/60 via-transparent to-transparent" />
            </div>
          ))}

          {/* Mobile arrow buttons */}
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white border border-white/20"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white border border-white/20"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1 py-6">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className="p-3 flex items-center justify-center"
          >
            <span className={`block transition-all duration-300 rounded-full ${idx === current
              ? "w-8 h-2 bg-[#7A5418]"
              : "w-2 h-2 bg-white/50 hover:bg-white/80"
              }`} />
          </button>
        ))}
      </div>
    </section>
  );
};

export default ProductShowcase;