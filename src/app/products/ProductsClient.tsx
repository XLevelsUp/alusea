"use client";

import Image from "next/image";

const products = [
  {
    id: 1,
    title: "Minimalist Sliding Doors",
    subtitle: "Seamless indoor-outdoor transitions with ultra-slim sightlines.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: 2,
    title: "Casement Windows",
    subtitle: "Classic design enhanced with modern thermal performance.",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: 3,
    title: "Curtain Walls",
    subtitle: "Structural glazing solutions for expansive commercial facades.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: 4,
    title: "Bi-Fold Doors",
    subtitle: "Maximize space and light with effortless folding mechanisms.",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: 5,
    title: "Shower Cubicles",
    subtitle: "Premium glass and aluminium framing for luxury bathrooms.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: 6,
    title: "Architectural Louvers",
    subtitle: "Sun shading, ventilation, and aesthetic facade enhancements.",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000",
  }
];

export default function ProductsClient() {
  const trackProductClick = (productName: string) => {
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "select_item",
        item_list_name: "Products Showcase",
        items: [{
          item_name: productName,
          item_category: "Aluminium Systems"
        }]
      });
    }
  };

  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-architectural-blue tracking-tight">
            Our Premium Collection
          </h1>
          <p className="text-steel-gray text-lg leading-relaxed">
            Discover our comprehensive range of high-performance aluminium systems designed to elevate modern architecture. Reach out to our team to learn the cost per square foot for aluminium windows tailored to your projects.
          </p>
        </header>

        <div className="grid grid-cols-1 tracking-tight md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <article 
              key={product.id} 
              className="group cursor-pointer"
              onClick={() => trackProductClick(product.title)}
            >
              <div className="relative h-80 w-full overflow-hidden rounded-md mb-6 bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-matte-black/0 group-hover:bg-matte-black/20 transition-colors duration-500" />
              </div>
              <h2 className="text-2xl font-bold text-matte-black mb-2 group-hover:text-brushed-bronze transition-colors">
                {product.title}
              </h2>
              <p className="text-steel-gray text-sm leading-relaxed">
                {product.subtitle}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
