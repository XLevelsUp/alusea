"use client";

const products = [
  {
    title: "Sliding Door Systems",
    description: "Ultra-slim profiles for panoramic views and seamless indoor-outdoor living.",
    image: "https://images.unsplash.com/photo-1600607687940-4e2a09695d51?auto=format&fit=crop&q=80&w=800",
    category: "Doors"
  },
  {
    title: "Thermal Casement Windows",
    description: "High-performance aluminium windows with superior insulation and security.",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800",
    category: "Windows"
  },
  {
    title: "Bi-Fold Enclosures",
    description: "Elegant folding systems that transform your living space with maximum flexibility.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
    category: "Doors"
  }
];

const ProductShowcase = () => {
  return (
    <section id="services" className="section-padding bg-aluminum-light">
      <div className="max-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl space-y-4">
            <h2 className="text-matte-black text-sm uppercase tracking-[0.3em] font-bold">Our Collection</h2>
            <p className="text-4xl md:text-5xl font-bold text-matte-black leading-tight">
              Precision Engineered <br />
              <span className="text-brushed-bronze italic">Architectural Solutions</span>
            </p>
          </div>
          <button className="text-sm font-bold uppercase tracking-widest border-b-2 border-brushed-bronze pb-1 hover:text-brushed-bronze transition-colors">
            View All Products
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {products.map((product, index) => (
            <div 
              key={index} 
              className="group cursor-pointer"
            >
              <div className="relative h-[500px] overflow-hidden rounded-sm mb-6">
                <img 
                  src={product.image} 
                  alt={product.title}
                  className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-700 group-hover:scale-110 group-hover:grayscale-0"
                />
                <div className="absolute top-6 left-6">
                   <span className="px-4 py-1 bg-white/90 backdrop-blur-sm text-[10px] uppercase tracking-widest font-bold text-matte-black">
                     {product.category}
                   </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-matte-black mb-2 group-hover:text-brushed-bronze transition-colors">
                {product.title}
              </h3>
              <p className="text-steel-gray text-sm leading-relaxed max-w-xs">
                {product.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
