"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "#about" },
    { name: "Services", href: "#services" },
    { name: "Pages", href: "#", hasDropdown: true },
    { name: "Contact Us", href: "#contact" },
  ];

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled 
          ? "bg-matte-black/90 backdrop-blur-md py-4 shadow-2xl border-b border-white/5" 
          : "bg-transparent py-8"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-tighter text-white group">
          ALUSEA<span className="text-brushed-bronze group-hover:text-bronze-light transition-colors">.</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[13px] uppercase tracking-widest font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1 group"
            >
              {link.name}
              {link.hasDropdown && (
                <svg className="w-3 h-3 text-white/40 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </Link>
          ))}
          <Link
            href="#quote"
            className="px-8 py-3 border border-white/30 text-white text-[12px] uppercase tracking-widest font-bold rounded-sm hover:bg-white hover:text-matte-black transition-all duration-300"
          >
            Get A Quote
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 16h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-0 left-0 w-full h-screen bg-matte-black flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-300">
          <button 
            className="absolute top-8 right-6 text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-2xl uppercase tracking-[0.2em] font-light text-white/70 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="#quote"
            className="mt-4 px-10 py-4 border border-brushed-bronze text-brushed-bronze text-sm uppercase tracking-widest font-bold rounded-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Get A Quote
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;

