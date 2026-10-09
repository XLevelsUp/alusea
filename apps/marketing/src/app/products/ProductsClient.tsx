"use client";

import { useState } from "react";
import Image from "next/image";
import PageBanner from "@/components/layout/PageBanner";
import "@/lib/fpixel"; // Ensures global window typings are loaded

const products = [
  {
    id: 1,
    title: "Minimalist Sliding Doors",
    subtitle: "Seamless indoor-outdoor transitions with ultra-slim sightlines. Engineered for minimalist aluminium sliding door villa projects in India.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: 2,
    title: "Casement Windows",
    subtitle: "Classic design enhanced with modern thermal performance. Custom thermal break aluminium windows in Coimbatore built to withstand high wind loads.",
    image: "/images/casement-window.webp",
  },
  {
    id: 3,
    title: "Curtain Walls",
    subtitle: "Structural glazing solutions for commercial facades. Provided by the premier curtain wall glazing supplier and installer in Coimbatore.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: 4,
    title: "Bi-Fold Doors",
    subtitle: "Maximize space and light with effortless folding mechanisms. Elegant custom aluminium glass door solutions for luxury Tamil Nadu residences.",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: 5,
    title: "Shower Cubicles",
    subtitle: "Premium glass and aluminium framing for luxury bathrooms. Crafted by the leading luxury aluminium window fabricator in Tamil Nadu.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: 6,
    title: "Architectural Louvers",
    subtitle: "Sun shading, ventilation, and aesthetic facade enhancements. Designed to meet high-performance apartment aluminium facade supplier specifications.",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000",
  }
];

const faqs = [
  {
    id: 1,
    question: "What are the advantages of thermal break aluminium windows in Coimbatore?",
    answer: "Thermal break aluminium windows offer exceptional thermal and acoustic insulation, which is crucial for modern villas and apartments. By placing a polyamide barrier between the interior and exterior frames, these systems prevent heat conduction, thereby dramatically reducing indoor cooling costs in Coimbatore's tropical climate. Additionally, as a premier aluminium window supply Tamil Nadu provider, Alusea's thermal break systems prevent dust, moisture, and noise infiltration."
  },
  {
    id: 2,
    question: "How does Alusea stand out as an aluminium windows manufacturer in Coimbatore?",
    answer: "Alusea is a leading aluminium windows manufacturer in Coimbatore, focusing on high-precision European engineering and customized architectural solutions. Our fabrications use supreme grade raw aluminium profiles, advanced multi-point locking mechanisms, and premium finishes. We maintain standard-setting QC processes that satisfy complex architectural projects, commercial builders, and private residential clients alike."
  },
  {
    id: 3,
    question: "Do you supply minimalist aluminium sliding doors for modern villas in India?",
    answer: "Yes, we specialize in high-end minimalist aluminium sliding doors for luxury villas across India (Pan-India and South India). Our sliding doors are designed with ultra-slim sightlines (interlocks as thin as 20mm) and can support heavy floor-to-ceiling glass panels up to 6 meters high, creating seamless indoor-outdoor integrations while offering flawless gliding performance."
  },
  {
    id: 4,
    question: "What is your standard thermal break aluminium window specification?",
    answer: "Our typical thermal break aluminium window specification includes high-strength 6063-T6 extruded aluminium profiles, a 24mm polyamide thermal barrier, double or triple glazing options with argon gas filling, low-E coatings, and multi-point security hardware. This specification ensures a low U-value (superior heat resistance), a high acoustic rating (up to 42 dB noise reduction), and compliance with structural load certifications for multi-story apartments."
  },
  {
    id: 5,
    question: "Are you a curtain wall glazing supplier and contractor in Coimbatore?",
    answer: "Absolutely! Alusea is a premier curtain wall glazing supplier in Coimbatore and a commercial aluminium facade contractor in Coimbatore. We design, manufacture, and install custom structural glazing, point-supported glass facades, spider glazing, and high-performance architectural louvers for landmark commercial buildings and high-rise apartments across South India."
  }
];

export default function ProductsClient() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const trackProductClick = (productName: string) => {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "select_item",
        item_list_name: "Products Showcase",
        items: [{
          item_name: productName,
          item_category: "Aluminium Systems"
        }]
      });
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Alusea Premium Aluminium Systems Collection",
    "description": "Premium collection of minimalist sliding doors, thermal-break windows, and commercial facade curtain walls in Coimbatore, South India.",
    "numberOfItems": products.length,
    "itemListElement": products.map((product, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "item": {
        "@type": "Product",
        "name": product.title,
        "description": product.subtitle,
        "image": product.image,
        "brand": {
          "@type": "Brand",
          "name": "Alusea"
        },
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "INR",
          "lowPrice": "800",
          "highPrice": "2500",
          "offerCount": "1",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "priceType": "https://schema.org/ListPrice",
            "unitText": "SQFT",
            "description": "Custom aluminum doors and windows price per square foot depending on structural specifications."
          }
        }
      }
    }))
  };

  return (
    <div className="bg-plate-white">
      {/* Inject Structured Data Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <PageBanner crumb="Our Products" eyebrow="Premium Products" title="Our Premium Collection">
        <p>
          Discover our comprehensive range of high-performance aluminium systems designed to elevate modern architecture. As a premier <strong className="font-semibold text-white">aluminium windows manufacturer in Coimbatore</strong>, Alusea custom-tailors each specification for luxury residential and high-rise commercial structures across Tamil Nadu.
        </p>
      </PageBanner>

      <div className="shell section">

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="reveal group cursor-pointer"
              onClick={() => trackProductClick(product.title)}
            >
              <div className="media mb-6 aspect-[4/5] w-full">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <h2 className="font-display text-2xl font-normal text-blueberry transition-colors group-hover:text-berry-bloom">
                {product.title}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-berry-bloom">
                {product.subtitle}
              </p>
            </article>
          ))}
        </div>

        {/* Interactive FAQ Accordion Section */}
        <section className="mt-[var(--section-y)] border-t border-stem-grey/50 pt-[var(--section-y)]">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
            <header className="lg:col-span-4">
              <p className="eyebrow">Product Help Center</p>
              <h2 className="h-section mt-5 text-blueberry">Frequently Asked Questions</h2>
              <p className="mt-5 leading-relaxed text-berry-bloom">
                Get premium insights on <strong className="font-semibold text-blueberry">thermal break aluminium window specifications</strong>, local delivery across Tamil Nadu, and custom glass architectural facades.
              </p>
            </header>

            <div className="border-t border-stem-grey/50 lg:col-span-8">
              {faqs.map((faq) => {
                const isOpen = activeFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="border-b border-stem-grey/50"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : faq.id)}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="font-display text-lg leading-snug text-blueberry transition-colors hover:text-berry-bloom md:text-xl">
                        {faq.question}
                      </span>
                      <svg
                        className={`w-5 h-5 text-berry-bloom transform transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180" : ""
                          }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                    >
                      <p className="max-w-2xl overflow-hidden leading-relaxed text-berry-bloom [&]:pb-0">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
