"use client";

import MediaCarousel, { productMedia } from "@/components/ui/MediaCarousel";

type Product = {
  id: string;
  category: string;
  name: string;
  image_url: string;
  image_urls?: string[] | null;
  video_urls?: string[] | null;
  description: string;
  specs: Record<string, string>;
};

export default function ProductDetailClient({ product }: { product: Product }) {
  const specs = Object.entries(product.specs || {});

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
      {/* Photos and films in one strip, with thumbnails beneath. */}
      <div className="min-w-0 lg:col-span-7">
        <MediaCarousel media={productMedia(product)} alt={product.name} className="aspect-[4/3]" sizes="(max-width: 1024px) 92vw, 56vw" thumbs priority />
      </div>

      <div className="flex flex-col lg:col-span-5">
        <p className="eyebrow">{product.category}</p>
        <h1 className="h-section mt-5 text-blueberry">{product.name}</h1>
        <p className="lede mt-5 text-berry-bloom">{product.description}</p>

        {specs.length > 0 && (
          <div className="mt-10">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-berry-bloom">Technical Specifications</h2>
            <dl className="mt-3 border-t border-stem-grey/50">
              {specs.map(([key, value]) => (
                <div key={key} className="flex items-baseline justify-between border-b border-stem-grey/50 py-3 text-sm">
                  <dt className="text-berry-bloom">{key}</dt>
                  <dd className="ml-4 text-right font-semibold text-blueberry">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <a
          href={`https://wa.me/919626022722?text=${encodeURIComponent(`Hi, I am interested in getting a quote for the product: ${product.name}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary mt-10 w-full"
        >
          Request Quote on WhatsApp
          <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
