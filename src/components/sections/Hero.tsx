"use client";

import Image from "next/image";

const Hero = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero_night.png"
          alt="Modern luxury house with aluminium windows"
          fill
          priority
          className="object-cover animate-slow-zoom"
        />
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-matte-black/80 via-matte-black/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-matte-black/20 z-10" />
      </div>

      <div className="max-container relative z-20 w-full">
        <div className="max-w-3xl space-y-8 px-6 md:px-0">
          {/* Tagline */}
          <div className="flex items-center space-x-3 mb-6 animate-in slide-in-from-left duration-700">
            <span className="inline-block w-2 h-2 rounded-full bg-brushed-bronze" />
            <span className="text-brushed-bronze text-[11px] uppercase tracking-[0.4em] font-bold">
              Transform Your Home Today
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-8xl font-bold text-white leading-[1.1] tracking-tight animate-in slide-in-from-bottom duration-1000 delay-200">
            Premium Imported <br />
            <span className="text-white/90">Windows and Doors</span>
          </h1>

          {/* Button */}
          <div className="pt-8 animate-in fade-in duration-1000 delay-500">
            <button className="px-10 py-5 bg-brushed-bronze text-white text-sm uppercase tracking-widest font-bold rounded-sm hover:bg-bronze-light hover:translate-y-[-4px] transition-all duration-300 shadow-2xl">
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Decorative vertical line */}
      <div className="absolute bottom-0 left-12 w-[1px] h-32 bg-gradient-to-t from-brushed-bronze to-transparent hidden md:block" />
    </section>
  );
};

export default Hero;
