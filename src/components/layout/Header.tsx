"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPagesOpen, setIsPagesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsPagesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Catalogue", href: "/catalogue" },
    { name: "Contact Us", href: "/contact" },
  ];

  const pagesDropdown = [
    { name: "Our Products", href: "/products" },
    { name: "Project Gallery", href: "/projects" },
    { name: "Our Team", href: "/team" },
    { name: "Careers", href: "/careers" },
  ];

  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-500 h-14 md:h-16 ${isScrolled
          ? "bg-matte-black/90 backdrop-blur-md py-2 shadow-2xl border-b border-white/5"
          : "bg-transparent py-4"
        }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 md:pl-6 md:pr-12 flex justify-between items-center h-full">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <div className="h-10 overflow-visible flex items-center">
            <Image
              src="/images/alusea-logo.svg"
              alt="Alusea Logo"
              width={300}
              height={108}
              className="object-contain h-16 w-auto brightness-0 invert"
              priority
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[13px] uppercase tracking-widest font-semibold text-white/80 hover:text-white transition-all"
            >
              {link.name}
            </Link>
          ))}

          {/* Pages Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsPagesOpen(!isPagesOpen)}
              className="flex items-center gap-1 text-[13px] uppercase tracking-widest font-semibold text-white/80 hover:text-white transition-all group"
            >
              Pages
              <svg
                className={`w-3 h-3 text-white/40 group-hover:text-white transition-all duration-200 ${isPagesOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isPagesOpen && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-52 rounded-sm border border-white/10 overflow-hidden"
                style={{
                  background: "rgba(17,17,17,0.95)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(182,139,76,0.1)",
                }}
              >
                <div className="h-0.5" style={{ background: "linear-gradient(to right, #B68B4C, #D4AF37)" }} />
                <div className="py-2">
                  {pagesDropdown.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsPagesOpen(false)}
                      className="flex items-center gap-3 px-5 py-3 text-[12px] uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all group/item"
                    >
                      <span className="w-1 h-1 rounded-full bg-alusea-gold/40 group-hover/item:bg-alusea-gold transition-colors" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/experience-center"
              className="hidden lg:flex px-6 py-3 bg-[#7A5418] text-white text-[12px] uppercase tracking-widest font-bold rounded-sm hover:-translate-y-1 hover:shadow-[0_8px_20px_-4px_rgba(122,84,24,0.4)] transition-all duration-300"
            >
              Experience Center
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 border border-white/30 text-white text-[12px] uppercase tracking-widest font-bold rounded-sm hover:bg-white hover:text-matte-black transition-all duration-300"
            >
              Get A Quote
            </Link>
          </div>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-white" aria-label="Open navigation menu"
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
        <div className="md:hidden absolute top-0 left-0 w-full h-screen bg-matte-black flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-300 overflow-y-auto">
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

          <div className="w-12 h-px bg-alusea-gold/30" />

          {pagesDropdown.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-lg uppercase tracking-[0.2em] font-light text-white/50 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}

          <div className="mt-6 flex flex-col gap-4 w-full px-10">
            <Link
              href="/experience-center"
              className="w-full py-4 bg-brushed-bronze text-white text-sm uppercase tracking-widest font-bold rounded-sm text-center shadow-lg shadow-brushed-bronze/20"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Experience Center
            </Link>
            <Link
              href="/contact"
              className="w-full py-4 border border-brushed-bronze text-brushed-bronze text-sm uppercase tracking-widest font-bold rounded-sm text-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Get A Quote
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;