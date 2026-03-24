"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const showroomSteps = [
  {
    id: 1,
    title: "The Grand Entrance",
    desc: "Welcome to the Alusea Experience Center. Begin your journey by stepping into our fully functional architectural studio.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200",
    action: "Enter Showroom"
  },
  {
    id: 2,
    title: "Minimalist Sliding Doors",
    desc: "Feel the effortless glide of our ultra-slim structural systems perfectly designed to blur the line between indoor and outdoor living.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
    action: "Explore Next Gallery"
  },
  {
    id: 3,
    title: "The Material Library",
    desc: "Get hands-on with our exclusive marine-grade powder coatings, anodized bronze finishes, and specialized acoustic glass.",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1200",
    action: "Visit Lounge"
  },
  {
    id: 4,
    title: "Consultation Lounge",
    desc: "Sit down with our master engineers to review architectural blueprints and design your bespoke aluminium solution over a cup of coffee.",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1200",
    action: "Finish Tour"
  }
];

export default function ExperienceCenterPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < showroomSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Loop back to start
      setCurrentStep(0);
    }
  };

  const step = showroomSteps[currentStep];

  return (
    <div className="pt-32 pb-24 min-h-screen bg-white overflow-hidden">
      {/* Interactive Tour Section */}
      <div className="px-6 max-w-7xl mx-auto mb-24">
        <header className="mb-12 text-center">
           <h1 className="text-4xl md:text-5xl font-bold text-architectural-blue tracking-tight mb-4">
             Interactive <span className="text-brushed-bronze">Virtual Tour</span>
           </h1>
           <p className="text-steel-gray text-lg">Click the images to walk through our Experience Center.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Side: Dynamic Text Content */}
          <div className="relative h-[250px] md:h-[300px] flex items-center order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <span className="text-brushed-bronze font-bold tracking-widest uppercase text-sm">Zone 0{step.id}</span>
                  <div className="h-[1px] w-12 bg-brushed-bronze/40" />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-matte-black leading-tight">
                  {step.title}
                </h2>
                <p className="text-steel-gray text-lg leading-relaxed">
                  {step.desc}
                </p>
                
                <div className="flex gap-2 pt-4">
                  {showroomSteps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 transition-all duration-500 rounded-full ${i === currentStep ? 'w-10 bg-brushed-bronze' : 'w-2 bg-gray-200 cursor-pointer hover:bg-gray-300'}`}
                      onClick={() => setCurrentStep(i)}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Side: Interactive Image */}
          <div className="relative aspect-[4/5] md:aspect-square w-full order-1 lg:order-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 cursor-pointer rounded-2xl overflow-hidden shadow-2xl group"
                onClick={nextStep}
              >
                 <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    priority
                    className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-110"
                 />
                 {/* Click Overlay */}
                 <div className="absolute inset-0 bg-matte-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full text-white font-bold tracking-widest uppercase text-sm flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      {step.action}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                 </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Visit Us Section */}
      <div className="bg-gray-50 border-t border-gray-100 py-24 px-6 mt-12">
        <div className="max-w-4xl mx-auto text-center space-y-6">
           <h2 className="text-3xl md:text-4xl font-bold text-matte-black">Ready to see it in person?</h2>
           <p className="text-steel-gray text-lg pb-4">
             Walk-ins are always welcome. Come visit us during our operating hours to explore the showroom and speak directly with our engineering team. No appointment necessary.
           </p>
           <a href="/contact" className="inline-block px-10 py-5 bg-brushed-bronze text-white font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-brushed-bronze/20 hover:translate-y-[-2px] hover:shadow-xl transition-all">
             Get Directions & Hours
           </a>
        </div>
      </div>
    </div>
  );
}
