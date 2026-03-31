"use client";

const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          {/* Left Side: Arched Image and Badge */}
          <div className="relative">
            <div className="relative w-full max-w-[500px] mx-auto lg:mx-0">
              <div className="absolute -top-10 -left-10 w-32 h-32 opacity-20 hidden md:block" style={{ backgroundImage: 'radial-gradient(var(--color-brushed-bronze) 2px, transparent 2px)', backgroundSize: '20px 20px' }} />
              <img
                src="/images/aboutus.jpg"
                alt="Modern architectural window system"
                className="w-full h-auto relative z-10"
              />
            </div>
          </div>

          {/* Right Side: Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7A5418]" />
                {/* FIX: darkened from text-brushed-bronze to #7A5418 for AA contrast on white */}
                <span className="text-[#7A5418] text-xs uppercase tracking-[0.2em] font-bold">About Us</span>
              </div>
              <h2 className="text-[42px] md:text-[52px] font-bold text-architectural-blue leading-tight">
                Expertise in Windows & Doors
              </h2>
            </div>

            <p className="text-steel-gray text-lg leading-relaxed">
              At ALU-SEA, we believe your doors and windows are more than just fittings—they're the first impression of your home. As reputable suppliers of aluminium sliding doors and premium architectural systems, we provide affordable aluminium windows and doors that elevate your living spaces without compromising on quality or aesthetics.
            </p>

            <div className="space-y-8 pt-4">
              {/* Our Mission */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-16 h-16 border-2 border-[#7A5418] p-3 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-full h-full fill-none stroke-[#7A5418]" strokeWidth="1.5">
                    <path d="M3 3h18v18H3z" />
                    <path d="M12 3v18M3 10h18M3 14h18" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-architectural-blue text-xl font-bold mb-2">Our Mission</h3>
                  <p className="text-steel-gray text-base leading-relaxed">
                    Our mission is to deliver premium doors and windows that blend durability, design, and functionality, with precise installation that enhances every space with secure and stylish solutions.
                  </p>
                </div>
              </div>

              {/* Our Vision */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-16 h-16 border-2 border-[#7A5418] p-3 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-full h-full fill-none stroke-[#7A5418]" strokeWidth="1.5">
                    <path d="M4 4h16v16H4z" />
                    <path d="M9 4v16M15 4v16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-architectural-blue text-xl font-bold mb-2">Our Vision</h3>
                  <p className="text-steel-gray text-base leading-relaxed">
                    Our vision is to be the most trusted name in doors and windows by delivering unmatched quality and innovative designs, creating homes and spaces where beauty meets strength.
                  </p>
                </div>
              </div>
            </div>

            {/* FIX: darkened bg from brushed-bronze to #7A5418 for white text contrast */}
            <button className="mt-4 bg-[#7A5418] hover:bg-[#5C3D0E] text-white px-8 py-4 text-sm font-bold transition-all shadow-lg">
              Get Your Free Quote
            </button>
          </div>
        </div>

        {/* Bottom Feature Icons */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 pt-12 border-t border-gray-100">
          {[
            { label: "Energy Saving Technologies", icon: <path d="M3 3h18v18H3z M9 3v8 M15 3v8 M3 11h18" /> },
            { label: "Quality without compromise", icon: <path d="M4 4h16v16H4z M10 4v16 M14 4v16 M4 10h16 M4 14h16" /> },
            { label: "Customer-first approach", icon: <path d="M3 3h18v18H3z M12 3v18 M3 12h18" /> },
            { label: "Long Durability", icon: <path d="M4 4h16v10 c0 3.3-2.7 6-6 6 s-6-2.7-6-6 V4" /> },
            { label: "Eco - Friendly Materials", icon: <path d="M4 4h16v16H4z M12 4v16 M12 10h8" /> },
            { label: "Lifetime Support", icon: <path d="M4 4h16v16H4z M12 4v16" /> },
          ].map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                {/* FIX: icon stroke darkened to #7A5418 */}
                <svg viewBox="0 0 24 24" className="w-10 h-10 fill-none stroke-[#7A5418]" strokeWidth="1">
                  {feature.icon}
                </svg>
              </div>
              <span className="text-[13px] font-medium text-steel-gray leading-snug">
                {feature.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;