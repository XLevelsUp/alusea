"use client";

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Energy Efficient",
    description: "Advanced thermal break technology reduces energy consumption and maximizes comfort year-round."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Secure & Robust",
    description: "Multi-point locking systems and toughened glass options provide peace of mind for your property."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.183.244l-.28.14a2 2 0 00-.547 1.022l-.477 2.387a2 2 0 001.022 1.022l2.387.477a2 2 0 001.022-.547l.14-.28a2 2 0 00.244-1.183l-.158-3.178a6 6 0 01.517-3.86l.158-.318a6 6 0 013.86-.517l2.179.436a2 2 0 001.183-.244l.28-.14a2 2 0 00.547-1.022l.477-2.387a2 2 0 00-1.022-1.022l-2.387-.477a2 2 0 00-1.022.547l-.14.28a2 2 0 00-.244 1.183l.158 3.178a6 6 0 01-.517 3.86l-.158.318a6 6 0 01-3.86.517l-2.179-.436a2 2 0 00-1.183.244l-.28.14z" />
      </svg>
    ),
    title: "Acoustic Insulation",
    description: "Engineered to keep the noise out, creating a serene and quiet interior environment."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3.32m-1.428-1H11" />
      </svg>
    ),
    title: "Low Maintenance",
    description: "Premium powder coating and anodized finishes ensure your systems look new for decades."
  }
];

const Features = () => {
  return (
    <section className="section-padding bg-white">
      <div className="max-container">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h2 className="text-brushed-bronze text-sm uppercase tracking-[0.3em] font-bold">Why Alusea</h2>
          <p className="text-4xl md:text-5xl font-bold text-matte-black leading-tight">
            Superior Engineering for <br />
            <span className="text-architectural-blue">Tomorrow&apos;s Architecture</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="p-10 border border-gray-100 hover:border-brushed-bronze/30 transition-all duration-500 rounded-sm hover:shadow-2xl hover:translate-y-[-8px] group"
            >
              <div className="text-brushed-bronze mb-8 group-hover:scale-110 transition-transform duration-500">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-matte-black mb-4">{feature.title}</h3>
              <p className="text-steel-gray text-sm leading-relaxed font-light">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
