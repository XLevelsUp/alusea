"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero_night.webp"
          alt="Modern luxury house with aluminium windows"
          fill
          priority
          className="object-cover animate-slow-zoom"
        />
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-matte-black/80 via-matte-black/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-matte-black/20 z-10" />
      </div>

      {/*
        ALIGNMENT FIX:
        Header inner container uses: max-w-[1440px] mx-auto px-4 md:pl-6 md:pr-12
        Hero must mirror that exactly so content left-edges line up.
        Removed the extra inner padding block — the outer container now carries
        all horizontal spacing, just like the header does.
      */}
      <div className="w-full max-w-[1440px] mx-auto relative z-20 px-4 md:pl-6 md:pr-12">
        <div className="max-w-3xl space-y-1 mt-14 md:mt-16">
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex items-center space-x-3 mt-2 md:mt-3"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-brushed-bronze" />
            <span className="text-brushed-bronze text-[11px] uppercase tracking-[0.4em] font-bold">
              Transform Your Home Today
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="text-3xl sm:text-5xl md:text-[5.5rem] font-bold text-white leading-[1.1] tracking-tight mt-2 md:mt-3"
          >
            Premium Imported <br />
            <span className="text-white/90">Aluminium Windows and Doors</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="text-white/80 text-lg md:text-xl font-medium max-w-2xl hidden md:block"
          >
            Working alongside top-rated aluminium window and door brands to deliver
            unparalleled architectural beauty and performance to your spaces.
          </motion.p>

          {/* Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="pt-8"
          >
            <a
              href="#contact"
              className="inline-block px-10 py-5 bg-[#7A5418] text-white text-sm uppercase tracking-widest font-bold rounded-sm hover:bg-[#5C3D0E] hover:-translate-y-1 transition-all duration-300 shadow-2xl"
            >
              Get Started
            </a>
          </motion.div>
        </div>
      </div>

      {/* Decorative vertical line */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "8rem" }}
        transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
        className="absolute bottom-0 left-12 w-[1px] bg-gradient-to-t from-brushed-bronze to-transparent hidden md:block"
      />
    </section>
  );
};

export default Hero;