"use client";

import React from 'react';
import Image from 'next/image';

const ServicesSection = () => {
  const leftServices = [
    {
      title: "Luxury Windows",
      description: "Crafted for elegance, durability, and timeless style to enhance your living space.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-none stroke-current" strokeWidth="1.5">
          <path d="M3 3h18v18H3z" />
          <path d="M12 3v18M3 12h18" />
        </svg>
      )
    },
    {
      title: "Warranty & Service",
      description: "1-year replacement, lifetime free service pay only for hardware parts.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-none stroke-current" strokeWidth="1.5">
          <path d="M8 3v18M16 3v18M3 12h18" />
          <path d="M3 3h18v18H3z" />
        </svg>
      )
    },
    {
      title: "Energy-Smart Designs",
      description: "Energy-efficient aluminium windows and doors built to save energy year round.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-none stroke-current" strokeWidth="1.5">
          <path d="M4 4h16v16H4zM4 12h16M12 4v16" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    }
  ];

  const rightServices = [
    {
      title: "Trusted Service",
      description: "Genuine care and reliable repairs that ensure durability and beauty.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-none stroke-current" strokeWidth="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    },
    {
      title: "Quality Assurance",
      description: "Premium materials for strength and lasting durability.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-none stroke-current" strokeWidth="1.5">
          <path d="M4 4h16v16H4zM10 4v16M14 4v16M4 10h16M4 14h16" />
        </svg>
      )
    },
    {
      title: "All-in-One Solutions",
      description: "Durable doors and windows, designed to enhance every home.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-none stroke-current" strokeWidth="1.5">
          <path d="M3 3h18v18H3zM12 3v18" />
        </svg>
      )
    }
  ];

  return (
    <section id="services" className="py-24 px-6 bg-alusea-light-gray overflow-hidden relative">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start mb-20 gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7A5418]" />
              {/* FIX: darkened label text for AA contrast on light gray bg */}
              <span className="text-[#7A5418] text-xs uppercase tracking-[0.2em] font-bold">Our Services</span>
            </div>
            <h2 className="text-[42px] md:text-[52px] font-bold text-architectural-blue leading-tight">
              Complete Door & Window Solutions
            </h2>
          </div>
          <div className="lg:max-w-md pt-12 lg:pt-0">
            <p className="text-steel-gray text-base leading-relaxed">
              Transform your spaces with expertly crafted doors and windows, designed for strength, elegance, and long-lasting performance. Every project is delivered with unmatched precision and care.
            </p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-16">
            {leftServices.map((service, idx) => (
              <div key={idx} className="flex gap-6 items-start lg:text-right lg:flex-row-reverse">
                {/* FIX: icon color darkened */}
                <div className="flex-shrink-0 text-[#7A5418] pt-1">
                  {service.icon}
                </div>
                <div>
                  <h3 className="text-architectural-blue text-xl font-bold mb-2">{service.title}</h3>
                  <p className="text-steel-gray text-sm leading-relaxed max-w-xs ml-auto">
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Center Image */}
          <div className="relative z-10">
            <div className="bg-white p-4 shadow-2xl rounded-sm">
              <div className="relative w-full aspect-[3/4]">
                <Image
                  src="/images/ourservice.webp"
                  alt="Our services – premium windows and doors"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[80%] bg-slate-50 -z-10 rounded-full blur-3xl opacity-50" />
          </div>

          {/* Right Column */}
          <div className="space-y-16">
            {rightServices.map((service, idx) => (
              <div key={idx} className="flex gap-6 items-start">
                {/* FIX: icon color darkened */}
                <div className="flex-shrink-0 text-[#7A5418] pt-1">
                  {service.icon}
                </div>
                <div>
                  <h3 className="text-architectural-blue text-xl font-bold mb-2">{service.title}</h3>
                  <p className="text-steel-gray text-sm leading-relaxed max-w-xs">
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;