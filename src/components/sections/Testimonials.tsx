"use client";

import React from 'react';

// Empty for now, add testimonial objects here in the future
const testimonials: { quote: string; author: string; role: string; image: string }[] = [];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  if (testimonials.length === 0) {
    return null; // Safely hide section if no testimonials are defined
  }

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-24 px-6 bg-white overflow-hidden relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content and Controls */}
          <div className="space-y-8 relative z-10">
            <div className="space-y-4">
              {/* FIX: darkened from text-brushed-bronze to #7A5418 for AA contrast on white */}
              <span className="text-[#7A5418] text-xs uppercase tracking-[0.3em] font-bold block">
                Testimonial
              </span>
              <h2 className="text-[42px] md:text-[52px] font-bold text-matte-black leading-tight max-w-sm">
                Client&apos;s Success Stories
              </h2>
            </div>

            {/* FIX: dot indicators wrapped in p-3 for 44×44px touch target */}
            <div className="flex gap-1 pt-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to testimonial ${idx + 1}`}
                  className="p-3 flex items-center justify-center"
                >
                  <span className={`block transition-all duration-300 rounded-full ${idx === currentIndex
                    ? "w-8 h-2 bg-[#7A5418]"
                    : "w-2 h-2 bg-[#7A5418]/30 hover:bg-[#7A5418]/60"
                    }`} />
                </button>
              ))}
            </div>

            <div className="flex gap-4 pt-2">
              {/* FIX: nav button border/text darkened for contrast */}
              <button
                onClick={prevSlide}
                aria-label="Previous testimonial"
                className="w-12 h-12 rounded-full border border-[#7A5418] flex items-center justify-center text-[#7A5418] hover:bg-[#7A5418] hover:text-white transition-all duration-300"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2.5">
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                aria-label="Next testimonial"
                className="w-12 h-12 rounded-full border border-[#7A5418] flex items-center justify-center text-[#7A5418] hover:bg-[#7A5418] hover:text-white transition-all duration-300"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2.5">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right: Fade Carousel */}
          <div className="relative h-[420px] lg:h-[480px] flex items-center">
            {/* FIX: decorative arc darkened to match new brand color */}
            <div className="absolute top-0 right-[-10%] w-[120%] h-[100%] bg-[#7A5418] rounded-l-full -z-0 opacity-100 transform translate-x-1/4" />

            <div className="relative w-full z-10 h-full">
              {testimonials.map((t, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 flex items-center transition-opacity duration-700 ${index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                >
                  <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl space-y-8 w-full">
                    <div className="flex items-center gap-6">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.image}
                        alt={t.author}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <div>
                        {/* FIX: h4 → h3 to fix heading order (section h2 → card h3) */}
                        <h3 className="text-xl font-bold text-matte-black">{t.author}</h3>
                        <p className="text-steel-gray text-sm">{t.role}</p>
                      </div>
                    </div>

                    <p className="text-steel-gray text-lg md:text-xl leading-relaxed font-medium italic">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;