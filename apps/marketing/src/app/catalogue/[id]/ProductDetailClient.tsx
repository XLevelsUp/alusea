"use client";

import Image from "next/image";
import { useState } from "react";

type Product = {
  id: string;
  category: string;
  name: string;
  image_url: string;
  image_urls?: string[];
  description: string;
  specs: Record<string, string>;
};

export default function ProductDetailClient({ product }: { product: Product }) {
  const images = product.image_urls && product.image_urls.length > 0 ? product.image_urls : [product.image_url];
  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16">
      {/* Image gallery */}
      <div>
        <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-[#0a0a0a]">
          <Image
            src={images[activeImage]}
            alt={product.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute top-5 left-5 bg-white/90 dark:bg-black/80 backdrop-blur-md text-matte-black dark:text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm border border-black/10 dark:border-white/10 shadow-lg">
            {product.category}
          </div>
        </div>

        {images.length > 1 && (
          <div className="mt-4 flex gap-3 overflow-x-auto">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
                className={`relative w-20 h-20 shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                  i === activeImage ? "border-[#A67C52]" : "border-transparent hover:border-gray-300"
                }`}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col">
        <h1 className="text-3xl md:text-4xl font-bold text-matte-black dark:text-white mb-4">
          {product.name}
        </h1>
        <p className="text-steel-gray dark:text-gray-400 leading-relaxed mb-8">
          {product.description}
        </p>

        <div className="w-full h-px bg-gray-200 dark:bg-white/10 mb-6" />

        <div className="space-y-4 mb-10">
          <h4 className="text-[11px] uppercase tracking-[0.15em] text-[#A67C52] font-semibold mb-3 flex items-center gap-2">
            <span className="w-4 h-px bg-[#A67C52]" />
            Technical Specifications
          </h4>
          {Object.entries(product.specs || {}).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center text-[14px]">
              <span className="text-gray-500 dark:text-gray-400 font-medium">{key}</span>
              <span className="text-matte-black dark:text-white font-semibold text-right ml-4">{value}</span>
            </div>
          ))}
        </div>

        <a
          href={`https://wa.me/919626022722?text=${encodeURIComponent(
            `Hi, I am interested in getting a quote for the product: ${product.name}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto w-full group/btn relative overflow-hidden inline-flex items-center justify-center py-4 border border-[#A67C52] rounded-sm transition-all duration-300 bg-transparent"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-[#A67C52] to-[#D4AF37] transform scale-x-0 group-hover/btn:scale-x-100 origin-left transition-transform duration-500 ease-out" />
          <span className="relative text-[12px] font-bold uppercase tracking-[0.2em] text-[#A67C52] group-hover/btn:text-white transition-colors duration-300 flex items-center gap-2">
            Request Quote on WhatsApp
            <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </a>
      </div>
    </div>
  );
}
