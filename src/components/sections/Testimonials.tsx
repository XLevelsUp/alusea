"use client";

import React from 'react';

const testimonials = [
  {
    quote: "Their attention to detail and creative design approach transformed our website into a visually stunning and highly functional platform. We've seen a 30% increase in traffic since the relaunch.",
    author: "John Anderson",
    role: "CEO at Innovate Solutions",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"
  },
  {
    quote: "The precision and quality of the installation were top-notch. Alusea's team ensured every window was perfectly aligned and functional. Truly a premium experience.",
    author: "James Harrington",
    role: "Architect, HAID Studio",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
  },
  {
    quote: "Exceptional service from start to finish. Their energy-smart designs have significantly reduced our cooling costs while looking absolutely stunning.",
    author: "Sarah Al-Maktoum",
    role: "Luxury Developer",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200"
  }
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-24 px-6 bg-white overflow-hidden relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content and Controls */}
          <div className="space-y-8 relative z-10">
            <div className="space-y-4">
              <span className="text-brushed-bronze text-xs uppercase tracking-[0.3em] font-bold block">
                Testimonial
              </span>
              <h2 className="text-[42px] md:text-[52px] font-bold text-matte-black leading-tight max-w-sm">
                Client’s Success Stories
              </h2>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button 
                onClick={prevSlide}
                className="w-12 h-12 rounded-full border border-brushed-bronze/30 flex items-center justify-center text-brushed-bronze hover:bg-brushed-bronze hover:text-white transition-all duration-300"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2.5">
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={nextSlide}
                className="w-12 h-12 rounded-full border border-brushed-bronze/30 flex items-center justify-center text-brushed-bronze hover:bg-brushed-bronze hover:text-white transition-all duration-300"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2.5">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right: Carousel Area */}
          <div className="relative h-[500px] lg:h-[600px] flex items-center">
            {/* Decorative Gold Arc */}
            <div className="absolute top-0 right-[-10%] w-[120%] h-[100%] bg-alusea-gold rounded-l-full -z-0 opacity-100 transform translate-x-1/4" />
            
            {/* Carousel Container */}
            <div className="relative w-full z-10 overflow-visible">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 85}%)` }}
              >
                {testimonials.map((t, index) => (
                  <div 
                    key={index}
                    className={`min-w-[85%] px-4 transition-all duration-700 ${index === currentIndex ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}`}
                  >
                    <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl space-y-8">
                      <div className="flex items-center gap-6">
                        <img 
                          src={t.image} 
                          alt={t.author}
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <div>
                          <h4 className="text-xl font-bold text-matte-black">{t.author}</h4>
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
      </div>
    </section>
  );
};

export default Testimonials;
