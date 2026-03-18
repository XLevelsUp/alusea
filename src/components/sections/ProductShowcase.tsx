"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const slides = [
  {
    id: 1,
    src: "/images/Interior 1.JPG",
    alt: "Interior showcase 1",
  },
  {
    id: 2,
    src: "/images/Interior 2.JPG",
    alt: "Interior showcase 2",
  },
  {
    id: 3,
    src: "/images/Interior 3 (1).JPG",
    alt: "Interior showcase 3",
  },
  {
    id: 4,
    src: "/images/Interior 3.JPG",
    alt: "Interior showcase 4",
  },
  {
    id: 5,
    src: "/images/Interior-Master-Line-Multi-Panel-Pivot-Glass-Revolving-Door-Aluminium-Internal-Aluminum-Center-Glass-Pivot-Doors.jpg",
    alt: "Multi-panel pivot glass revolving door",
  },
  {
    id: 6,
    src: "/images/glass entrance door.JPG",
    alt: "Glass entrance door",
  },
  {
    id: 7,
    src: "/images/Rectangle 87.jpg",
    alt: "Premium aluminium product",
  },
  {
    id: 8,
    src: "/images/ChatGPT Image Mar 13, 2026, 04_53_24 PM.png",
    alt: "Architectural aluminium design",
  },
  {
    id: 9,
    src: "/images/ChatGPT Image Mar 13, 2026, 04_56_24 PM.png",
    alt: "Architectural aluminium design 2",
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

  // Auto-play
  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section id="collection" className="relative bg-matte-black overflow-hidden">
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-6 py-16 flex items-end justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brushed-bronze" />
            <span className="text-brushed-bronze text-xs uppercase tracking-[0.2em] font-bold">
              Our Collection
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Precision Engineered <br />
            <span className="text-brushed-bronze italic">Architectural Solutions</span>
          </h2>
        </div>

        {/* Slide counter + navigation */}
        <div className="hidden md:flex items-center gap-4">
          <span className="text-white/40 text-sm tabular-nums">
            {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-brushed-bronze hover:text-brushed-bronze transition-all duration-300"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-brushed-bronze hover:text-brushed-bronze transition-all duration-300"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Carousel track */}
      <div className="relative w-full h-[60vh] md:h-[75vh] overflow-hidden">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-cover"
              sizes="100vw"
              priority={idx === 0}
            />

            {/* Subtle gradient overlay */}
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

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-3 py-8">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all duration-300 rounded-full ${
              idx === current
                ? "w-8 h-2 bg-brushed-bronze"
                : "w-2 h-2 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default ProductShowcase;
