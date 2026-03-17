"use client";

const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          {/* Left Side: Arched Image and Badge */}
          <div className="relative">
            {/* Arched image container */}
            <div className="relative w-full aspect-[4/5] max-w-[500px] mx-auto lg:mx-0">
              {/* Background dots pattern */}
              <div className="absolute -top-10 -left-10 w-32 h-32 opacity-20 hidden md:block" style={{ backgroundImage: 'radial-gradient(var(--color-brushed-bronze) 2px, transparent 2px)', backgroundSize: '20px 20px' }} />
              
              <div className="w-full h-full rounded-t-[250px] overflow-hidden border-[12px] border-white shadow-2xl">
                <img 
                   src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1000" 
                  alt="Modern architectural window system"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Arched Badge */}
              <div className="absolute bottom-4 right-0 md:-right-8 bg-brushed-bronze text-white p-8 rounded-t-[100px] w-48 text-center shadow-xl">
                <span className="block text-4xl font-bold mb-1">98%</span>
                <span className="block text-sm font-medium leading-tight">Happy<br />Customer</span>
              </div>
            </div>
          </div>

          {/* Right Side: Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brushed-bronze" />
                <span className="text-brushed-bronze text-xs uppercase tracking-[0.2em] font-bold">About Us</span>
              </div>
              <h2 className="text-[42px] md:text-[52px] font-bold text-architectural-blue leading-tight">
                Expertise in Windows & Doors
              </h2>
            </div>
            
            <p className="text-steel-gray text-lg leading-relaxed">
              At ALU-SEA, we believe your doors and windows are more than just fittings they're the first impression of your home.
            </p>

            <div className="space-y-8 pt-4">
              {/* Our Mission */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-16 h-16 border-2 border-brushed-bronze p-3 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-full h-full fill-none stroke-brushed-bronze" strokeWidth="1.5">
                    <path d="M3 3h18v18H3z" />
                    <path d="M12 3v18M3 10h18M3 14h18" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-architectural-blue text-xl font-bold mb-2">Our Mission</h4>
                  <p className="text-steel-gray text-base leading-relaxed">
                    Our mission is to deliver premium doors and windows that blend durability, design, and functionality, with precise installation that enhances every space with secure and stylish solutions.
                  </p>
                </div>
              </div>

              {/* Our Vision */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-16 h-16 border-2 border-brushed-bronze p-3 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-full h-full fill-none stroke-brushed-bronze" strokeWidth="1.5">
                    <path d="M4 4h16v16H4z" />
                    <path d="M9 4v16M15 4v16" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-architectural-blue text-xl font-bold mb-2">Our Vision</h4>
                  <p className="text-steel-gray text-base leading-relaxed">
                    Our vision is to be the most trusted name in doors and windows by delivering unmatched quality and innovative designs, creating homes and spaces where beauty meets strength.
                  </p>
                </div>
              </div>
            </div>

            <button className="mt-4 bg-brushed-bronze hover:bg-bronze-dark text-white px-8 py-4 text-sm font-bold transition-all shadow-lg">
              Get Your Free Quote
            </button>
          </div>
        </div>

        {/* Bottom Feature Icons */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 pt-12 border-t border-gray-100">
          {[
            { 
              label: "Energy Saving Technologies", 
              icon: <path d="M3 3h18v18H3z M9 3v8 M15 3v8 M3 11h18" /> 
            },
            { 
              label: "Quality without compromise", 
              icon: <path d="M4 4h16v16H4z M10 4v16 M14 4v16 M4 10h16 M4 14h16" /> 
            },
            { 
              label: "Customer-first approach", 
              icon: <path d="M3 3h18v18H3z M12 3v18 M3 12h18" /> 
            },
            { 
              label: "Long Durability", 
              icon: <path d="M4 4h16v10 c0 3.3-2.7 6-6 6 s-6-2.7-6-6 V4" /> 
            },
            { 
              label: "Eco - Friendly Materials", 
              icon: <path d="M4 4h16v16H4z M12 4v16 M12 10h8" /> 
            },
            { 
              label: "Lifetime Support", 
              icon: <path d="M4 4h16v16H4z M12 4v16" /> 
            },
          ].map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10 fill-none stroke-brushed-bronze" strokeWidth="1">
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
