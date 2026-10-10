"use client";

import Link from "next/link";
import PageBanner from "@/components/layout/PageBanner";
import MediaCarousel, { mediaCountLabel, productMedia } from "@/components/ui/MediaCarousel";
import { motion, Variants } from "framer-motion";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

type Product = {
  id: string;
  category: string;
  name: string;
  image_url: string;
  image_urls?: string[];
  video_urls?: string[] | null;
  description: string;
  specs: Record<string, string>;
};

function ProductCard({ product, itemVariants }: { product: Product, itemVariants: Variants }) {
  const media = productMedia(product);
  const href = `/catalogue/${product.id}`;

  return (
    <motion.article variants={itemVariants} className="flex flex-col">
      {/* Photos and films in one strip; the specifications wait on the product's own page. */}
      <MediaCarousel media={media} alt={product.name} className="aspect-[4/5]" sizes="(max-width: 768px) 92vw, (max-width: 1024px) 46vw, 30vw" />

      <p className="mt-5 flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-berry-bloom">
        <span>{product.category}</span>
        <span className="font-medium normal-case tracking-normal">{mediaCountLabel(media)}</span>
      </p>
      <h3 className="font-display mt-2 text-2xl font-normal text-blueberry">
        <Link href={href} className="transition-colors hover:text-berry-bloom">{product.name}</Link>
      </h3>
      <p className="mt-2 line-clamp-2 flex-grow text-[15px] leading-relaxed text-berry-bloom">{product.description}</p>

      <div className="mt-5 flex items-center justify-between border-t border-stem-grey/50 pt-4">
        <Link href={href} aria-label={`View details of ${product.name}`} className="link-arrow text-blueberry">
          View Details <span aria-hidden="true">→</span>
        </Link>
        <a
          href={`https://wa.me/919626022722?text=${encodeURIComponent(`Hi, I am interested in getting a quote for the product: ${product.name}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Request a quote for ${product.name}`}
          className="rounded-full bg-blueberry px-5 py-2.5 text-[13px] font-semibold text-white transition-colors duration-300 hover:bg-berry-bloom"
        >
          Request Quote
        </a>
      </div>
    </motion.article>
  );
}

export default function CatalogueClient({ initialProducts }: { initialProducts: Product[] }) {
  const products = useMemo(() => {
    return initialProducts.map(p => ({
      ...p,
      category: p.category === "Windows & Sliding" ? "Sliding Systems" : p.category
    }));
  }, [initialProducts]);

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  const [activeCategory, setActiveCategory] = useState("All");
  const [prevCategoryParam, setPrevCategoryParam] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  if (categoryParam !== prevCategoryParam) {
    setPrevCategoryParam(categoryParam);
    if (categoryParam) {
      const matched = categories.find(
        (c) => c.toLowerCase() === categoryParam.toLowerCase()
      );
      if (matched) {
        setActiveCategory(matched);
      }
    } else {
      setActiveCategory("All");
    }
  }

  const filteredProducts = activeCategory === "All"
    ? products
    : products.filter(p => p.category === activeCategory);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 40, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-plate-white">
      <PageBanner crumb="Our Collection" eyebrow="Product Collection" title={<>Our <span className="text-plate-white/80">Catalogue</span></>}>
        <p>
          Discover our range of meticulously engineered premium aluminum systems. Uncompromising quality, exceptional aesthetics, and unparalleled performance designed for modern architecture.
        </p>
      </PageBanner>

      {/* Catalogue Filter */}
      <section className="shell pb-4 pt-[clamp(2.5rem,5vw,4rem)]">
        <div className="flex flex-wrap items-center gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              type="button"
              aria-pressed={activeCategory === category}
              className={`btn capitalize ${activeCategory === category ? "btn-primary" : "btn-outline"}`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Catalogue Grid */}
      <section className="shell flex-grow pb-[var(--section-y)] pt-8">
        <motion.div 
          key={activeCategory}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} itemVariants={itemVariants} />
          ))}
        </motion.div>
      </section>

      {/* Bespoke CTA Section */}
      <section className="section window-grid relative w-full overflow-hidden bg-blueberry text-white">
        <div className="shell grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-20">
          <h2 className="h-section text-white lg:col-span-6">Bespoke Architectural Solutions</h2>
          <div className="lg:col-span-6">
            <p className="lede text-plate-white">
              Looking for something specific? Our team specializes in custom structural glazing and framing tailored to your project&apos;s unique overarching vision.
            </p>
            <Link href="/contact" className="btn btn-light mt-8">
              Consult with our experts
              <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
