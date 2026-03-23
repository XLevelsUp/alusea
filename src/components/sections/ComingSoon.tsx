"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ComingSoonProps {
  pageName: string;
  description?: string;
  icon?: React.ReactNode;
}

const defaultIcon = (
  <svg
    className="w-16 h-16 text-alusea-gold"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export default function ComingSoon({
  pageName,
  description = "We're crafting something extraordinary. This page will be ready soon.",
  icon = defaultIcon,
}: ComingSoonProps) {
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; opacity: number; speed: number }[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 20 + 10,
    }));
    setParticles(generated);
  }, []);

  return (
    <section className="relative min-h-screen bg-matte-black flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(182,139,76,0.18) 0%, transparent 70%)",
          }}
        />
        {/* Gold accent lines */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px opacity-30"
          style={{
            background: "linear-gradient(to right, transparent, #B68B4C, transparent)",
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-20"
          style={{
            background: "linear-gradient(to right, transparent, #B68B4C, transparent)",
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-alusea-gold"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animation: `floatUp ${p.speed}s linear infinite`,
              animationDelay: `${Math.random() * -20}s`,
            }}
          />
        ))}
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(182,139,76,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(182,139,76,0.6) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center border border-alusea-gold/30"
            style={{
              background: "rgba(182,139,76,0.08)",
              boxShadow: "0 0 60px rgba(182,139,76,0.15), inset 0 0 30px rgba(182,139,76,0.05)",
            }}
          >
            {icon}
          </div>
        </div>

        {/* Label */}
        <p className="text-alusea-gold/80 text-xs uppercase tracking-[0.4em] font-semibold mb-4">
          {pageName}
        </p>

        {/* Heading */}
        <h1
          className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
          style={{ letterSpacing: "-0.03em" }}
        >
          Coming
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #B68B4C 0%, #D4AF37 50%, #A67C52 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Soon
          </span>
        </h1>

        {/* Description */}
        <p className="text-white/50 text-lg md:text-xl leading-relaxed mb-12 max-w-xl mx-auto">
          {description}
        </p>

        {/* Divider */}
        <div className="flex items-center gap-4 justify-center mb-12">
          <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(to right, transparent, rgba(182,139,76,0.4))" }} />
          <div className="w-1.5 h-1.5 rounded-full bg-alusea-gold/60" />
          <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(to left, transparent, rgba(182,139,76,0.4))" }} />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="group inline-flex items-center gap-3 px-8 py-4 text-white text-sm uppercase tracking-widest font-bold rounded-sm transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #B68B4C 0%, #D4AF37 100%)",
              boxShadow: "0 4px 24px rgba(182,139,76,0.3)",
            }}
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <a
            href="mailto:aluseacbe@gmail.com"
            className="inline-flex items-center gap-3 px-8 py-4 border border-white/20 text-white/80 text-sm uppercase tracking-widest font-bold rounded-sm hover:border-alusea-gold/50 hover:text-white transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Get Notified
          </a>
        </div>
      </div>

      {/* Bottom accent text */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-white/20 text-xs uppercase tracking-[0.3em]">Alusea · Premium Aluminium</p>
      </div>

      <style jsx>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
