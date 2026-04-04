"use client";

import React from 'react';
import Image from 'next/image';

const WhyWorkWithUs = () => {
  const benefits = [
    "Unmatched Quality",
    "Expert Craftsmanship",
    "Tailored Solutions",
    "Energy Efficiency"
  ];

  const stats = [
    { value: "98%", label: "Satisfied Clients" },
    { value: "1,500+", label: "Projects Delivered" },
    { value: "17+", label: "Years of Expertise" }
  ];

  const features = [
    {
      title: "Free Shipping",
      subtitle: "*Only in Coimbatore",
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-none stroke-current" strokeWidth="1.5">
          <path d="M1 12h5m1 0h11m1 0h4m-4 0a3 3 0 11-6 0m6 0a3 3 0 116 0" />
          <path d="M3 5h11a2 2 0 012 2v5" />
          <path d="M16 7h2l3 3v2" />
        </svg>
      )
    },
    {
      title: "Secure Payment",
      subtitle: "Get 100% payment safe",
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-none stroke-current" strokeWidth="1.5">
          <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    },
    {
      title: "Support 24/7",
      subtitle: "Help anytime you need.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-none stroke-current" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      )
    },
    {
      title: "Serving All Tamil Nadu",
      subtitle: "Trusted Doors & Windows",
      icon: (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-none stroke-current" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      )
    }
  ];

  const categories = [
    "Windows",
    "Doors",
    "Shower Cubicals",
    "Railings",
    "Facades Windows"
  ];

  return (
    <section className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
          {/* Left: Image */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
              <Image
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000"
                alt="Modern window installation"
                className="w-full h-full object-cover"
                width={1000}
                height={750}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Right: Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7A5418]" />
                {/* FIX: darkened for AA contrast on white */}
                <span className="text-[#7A5418] text-xs uppercase tracking-[0.2em] font-bold">Why Work With Us</span>
              </div>
              <h2 className="text-[42px] md:text-[52px] font-bold text-architectural-blue leading-tight">
                The Trusted Choice for Your Windows & Doors
              </h2>
            </div>

            <p className="text-steel-gray text-base leading-relaxed">
              We are committed to delivering doors and windows that combine strength, elegance, and precision. From consultation to installation, every step is handled with care to create secure, stylish, and lasting solutions for your space.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {/* FIX: checkmark bg darkened */}
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7A5418] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-3 h-3 text-white fill-none stroke-current" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <span className="text-steel-gray font-medium text-sm">{benefit}</span>
                </div>
              ))}
            </div>

            {/* FIX: button bg darkened for white text contrast */}
            <a
              href="#contact"
              className="inline-block mt-8 bg-[#7A5418] hover:bg-[#5C3D0E] text-white px-8 py-4 text-sm font-bold transition-all shadow-lg rounded-sm hover:translate-y-[-3px]"
            >
              Get Your Free Quote
            </a>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-10 border-t border-gray-100">
              {stats.map((stat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-3xl font-bold text-architectural-blue">{stat.value}</div>
                  <div className="text-xs text-steel-gray uppercase tracking-widest leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12 border-y border-gray-100 mb-16 px-4">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-6">
              {/* FIX: icon color darkened */}
              <div className="flex-shrink-0 text-[#7A5418]">
                {feature.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-architectural-blue font-bold text-base whitespace-nowrap">{feature.title}</span>
                <span className="text-steel-gray text-[13px]">{feature.subtitle}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-between gap-4">
          {categories.map((category, idx) => (
            <button
              key={idx}
              className={`flex-1 min-w-[180px] flex items-center justify-between px-6 py-4 border rounded-lg transition-all text-left group
                ${idx === 0
                  /* FIX: active state uses darker bg for white text contrast */
                  ? 'bg-[#7A5418] border-[#7A5418] text-white'
                  /* FIX: inactive text darkened for contrast on white */
                  : 'border-[#7A5418]/40 text-[#7A5418] hover:border-[#7A5418]'
                }`}
            >
              <span className="font-bold text-sm">{category}</span>
              <svg
                viewBox="0 0 24 24"
                className={`w-4 h-4 transition-transform duration-300 ${idx === 0 ? 'text-white' : 'text-[#7A5418]'} group-hover:translate-y-1`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyWorkWithUs;