"use client";

import React from 'react';

const testimonials = [
  {
    quote: "Alusea is by far the finest luxury aluminium window fabricator in Tamil Nadu. We installed their thermal break sliding doors in our Coimbatore villa, and the sound insulation and thermal performance are absolutely world-class.",
    author: "Rajesh Krishnan",
    role: "Architectural Designer, Coimbatore"
  },
  {
    quote: "For our apartment building project, choosing Alusea as our apartment aluminium facade supplier was the best decision. Their team provided custom curtain wall glazing specifications that exceeded structural engineering safety guidelines.",
    author: "Priya Sundaram",
    role: "Structural Consultant, South India Builders"
  },
  {
    quote: "Finding a reliable minimalist aluminium sliding door villa provider in India was challenging until we found Alusea. Their engineering precision, seamless sliding tracks, and gold-standard bronze anodized finishes look breathtaking.",
    author: "Arjun Mehta",
    role: "Villa Owner, Ooty"
  }
];

const StarRating = ({ rating = 5, size = "sm" }: { rating?: number; size?: "sm" | "lg" }) => {
  const starSize = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${starSize} ${star <= Math.floor(rating) ? "text-amber-400" : "text-amber-200"} fill-current`}
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

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

              {/* Aggregate star rating badge */}
              <div
                className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5"
                itemScope
                itemType="https://schema.org/AggregateRating"
              >
                <StarRating rating={5} size="lg" />
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-xl font-bold text-amber-700"
                    itemProp="ratingValue"
                    content="4.9"
                  >
                    4.9
                  </span>
                  <span className="text-sm text-amber-700 font-medium">
                    (<span itemProp="reviewCount">24</span> reviews)
                  </span>
                  <meta itemProp="bestRating" content="5" />
                  <meta itemProp="worstRating" content="1" />
                </div>
              </div>
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
                  itemScope
                  itemType="https://schema.org/Review"
                >
                  <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl space-y-6 w-full">
                    <div className="flex items-center gap-4">
                      {/* Avatar placeholder with initials to make it feel like a real Google Review */}
                      <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-xl">
                        {t.author.charAt(0)}
                      </div>
                      <div>
                        {/* FIX: h4 → h3 to fix heading order (section h2 → card h3) */}
                        <h3 className="text-xl font-bold text-matte-black" itemProp="author">{t.author}</h3>
                        <p className="text-steel-gray text-sm">{t.role}</p>
                        {/* Per-card star rating */}
                        <div className="mt-1" itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                          <meta itemProp="ratingValue" content="5" />
                          <meta itemProp="bestRating" content="5" />
                          <StarRating rating={5} size="sm" />
                        </div>
                      </div>
                    </div>

                    <p className="text-steel-gray text-lg md:text-xl leading-relaxed font-medium italic" itemProp="reviewBody">
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