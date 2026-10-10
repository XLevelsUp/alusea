"use client";

import { useEffect, useRef } from "react";
import { Allura } from "next/font/google";

// The handwritten face used for the one flourished word in the headline.
const script = Allura({ weight: "400", subsets: ["latin"], display: "swap" });

const Hero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Visitors who ask their device for less motion get a still frame instead of a playing video.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) videoRef.current?.pause();
  }, []);

  return (
    <section className="relative flex h-svh min-h-[560px] w-full items-end overflow-hidden bg-blueberry">
      {/* Full-screen film: silent, looping, and decorative, so screen readers skip it. */}
      {/* The file is already cropped clear of the maker's mark and sharpened, so it is shown at its own size. */}
      <video
        ref={videoRef}
        className="hero-film absolute inset-0 size-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/images/posters/hero.webp"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/videos/hero-desktop.webm" type="video/webm" />
      </video>

      {/* Nothing is laid over the film, so a soft shadow under the letters keeps them readable on bright scenes. */}
      <div className="hero-copy gutter relative w-full pb-12 text-left [text-shadow:0_1px_12px_rgb(0_0_0/0.45)] md:pb-16">
        <h1 className="text-4xl font-light leading-tight tracking-normal text-white sm:text-5xl md:text-6xl">
          Frame Every View{" "}
          {/* The handwritten word is painted in shaded gold, light at the top and deeper at the foot, like foil. */}
          <span className={`${script.className} text-[1.35em] bg-[linear-gradient(180deg,#FFE9A8_0%,var(--color-champagne)_45%,#C98F1E_100%)] bg-clip-text px-[0.15em] leading-none text-transparent [filter:drop-shadow(0_1px_3px_rgb(0_0_0/0.55))] [text-shadow:none]`}>Elegantly</span>
        </h1>
        <p className="mt-2 text-base text-white md:mt-3 md:text-xl">
          Slim aluminium windows and doors, made to measure for your home
        </p>
      </div>
    </section>
  );
};

export default Hero;
