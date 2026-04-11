"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

type Product = {
  id: string;
  category: string;
  name: string;
  image_url: string;
  image_urls?: string[];
  description: string;
  specs: Record<string, string>;
};

function ProductCard({ product, itemVariants }: { product: Product, itemVariants: any }) {
  const [imgIndex, setImgIndex] = useState(0);
  
  let images = product.image_urls && product.image_urls.length > 0 ? product.image_urls : [product.image_url];
  // For demo: auto-repeat generic images to test slider
  if (images.length === 1) {
    images = [images[0], images[0], images[0]];
  }

  useEffect(() => {
    if (images.length > 1) {
      const timer = setInterval(() => {
        setImgIndex((i) => (i + 1) % images.length);
      }, 3500); // Auto slide every 3.5s
      return () => clearInterval(timer);
    }
  }, [images.length]);

  return (
    <motion.div 
      variants={itemVariants}
      className="group flex flex-col bg-white dark:bg-[#151515] rounded-xl overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)] hover:shadow-2xl transition-all duration-700 border border-gray-100 dark:border-white/5 relative"
    >
      {/* Product Image Container */}
      <div className="relative w-full h-[320px] xl:h-[380px] overflow-hidden bg-gray-100 dark:bg-[#0a0a0a] group/img">
        <Image
          src={images[imgIndex]}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {images.length > 1 && (
          <>
            <button aria-label="Previous image" onClick={(e) => { e.preventDefault(); setImgIndex((i) => i === 0 ? images.length - 1 : i - 1); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/20 hover:bg-black/60 backdrop-blur-sm text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 z-20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button aria-label="Next image" onClick={(e) => { e.preventDefault(); setImgIndex((i) => (i + 1) % images.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/20 hover:bg-black/60 backdrop-blur-sm text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 z-20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
            <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2 z-20">
              {images.map((_, i) => (
                <button 
                  key={i} 
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={(e) => { e.preventDefault(); setImgIndex(i); }} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === imgIndex ? "bg-white scale-150" : "bg-white/50 hover:bg-white"}`} 
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="absolute top-5 left-5 bg-white/90 dark:bg-black/80 backdrop-blur-md text-matte-black dark:text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm border border-black/10 dark:border-white/10 shadow-lg z-10 pointer-events-none">
          {product.category}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-8 flex flex-col flex-grow relative z-10 bg-white dark:bg-[#151515]">
        <h3 className="text-2xl font-bold text-matte-black dark:text-white mb-4 group-hover:text-[#B68B4C] transition-colors duration-300">
          {product.name}
        </h3>
        <p className="text-sm text-steel-gray dark:text-gray-400 mb-8 flex-grow leading-relaxed">
          {product.description}
        </p>

        <div className="w-full h-px bg-gray-200 dark:bg-white/10 mb-6" />

        {/* Technical Specifications */}
        <div className="space-y-4 mb-10">
          <h4 className="text-[11px] uppercase tracking-[0.15em] text-[#A67C52] font-semibold mb-3 flex items-center gap-2">
            <span className="w-4 h-px bg-[#A67C52]"></span>
            Technical Specifications
          </h4>
          {Object.entries(product.specs).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center text-[13px]">
              <span className="text-gray-500 dark:text-gray-400 font-medium">{key}</span>
              <span className="text-matte-black dark:text-white font-semibold text-right ml-4">{value}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <a 
          href={`https://wa.me/919626022722?text=${encodeURIComponent(`Hi, I am interested in getting a quote for the product: ${product.name}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto w-full group/btn relative overflow-hidden inline-flex items-center justify-center py-4 border border-[#A67C52] rounded-sm transition-all duration-300 bg-transparent"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-[#A67C52] to-[#D4AF37] transform scale-x-0 group-hover/btn:scale-x-100 origin-left transition-transform duration-500 ease-out" />
          <span className="relative text-[12px] font-bold uppercase tracking-[0.2em] text-[#A67C52] group-hover/btn:text-white transition-colors duration-300 flex items-center gap-2">
            Request Quote
            <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </a>
      </div>
    </motion.div>
  );
}

export default function CatalogueClient({ initialProducts }: { initialProducts: Product[] }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(initialProducts.map(p => p.category)))];

  const filteredProducts = activeCategory === "All"
    ? initialProducts
    : initialProducts.filter(p => p.category === activeCategory);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-matte-black pt-24 pb-0 flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full py-24 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
        <div 
          className="absolute inset-0 max-w-7xl mx-auto opacity-10 dark:opacity-20 pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle at center, #B68B4C 0%, transparent 60%)' }}
        />
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="inline-block px-4 py-1.5 mb-6 border border-[#A67C52]/30 rounded-full bg-white/5 backdrop-blur-sm">
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#A67C52]">Product Collection</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tight mb-6 text-matte-black dark:text-white">
            Our <span className="text-gradient">Catalogue</span>
          </h1>
          
          <p className="text-lg md:text-xl text-steel-gray dark:text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
            Discover our range of meticulously engineered premium aluminum systems. 
            Uncompromising quality, exceptional aesthetics, and unparalleled performance designed for modern architecture.
          </p>
        </motion.div>
      </section>

      {/* Catalogue Filter */}
      <section className="w-full max-w-[1440px] mx-auto px-6 md:px-12 pt-12 pb-4">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                activeCategory === category
                  ? "bg-[#B68B4C] border-[#B68B4C] text-white"
                  : "bg-transparent border-gray-200 dark:border-white/10 text-steel-gray dark:text-gray-300 hover:border-[#B68B4C] dark:hover:text-white hover:text-[#B68B4C]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Catalogue Grid */}
      <section className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-8 md:py-12 flex-grow">
        <motion.div 
          key={activeCategory}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-12"
        >
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} itemVariants={itemVariants} />
          ))}
        </motion.div>
      </section>

      {/* Bespoke CTA Section */}
      <section className="relative w-full mt-12 py-24 bg-[#111111] text-white flex flex-col items-center text-center overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-[url('/images/Rectangle%2087.webp')] bg-cover bg-center opacity-[0.05]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl mx-auto px-6"
        >
          <div className="w-16 h-1 bg-[#B68B4C] mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight mb-6">
            Bespoke Architectural Solutions
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Looking for something specific? Our team specializes in custom structural glazing and framing tailored to your project&apos;s unique overarching vision.
          </p>
          <Link 
            href="/contact"
            className="inline-flex items-center justify-center px-10 py-5 bg-white text-[#111111] text-xs uppercase tracking-[0.2em] font-bold rounded-sm hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.4)] transition-all duration-400 group"
          >
            Consult with our experts
            <svg className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
