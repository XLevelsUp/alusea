"use client";

import { useState } from "react";
import PageBanner from "@/components/layout/PageBanner";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type DbZone = {
  id: string;
  page: string;
  section: string;
  title: string | null;
  description: string | null;
  action_text: string | null;
  image_url: string;
  sort_order: number;
};

const fallbackSteps = [
  {
    id: 1,
    section: "zone_1",
    title: "The Grand Entrance",
    desc: "Welcome to the Alusea Experience Center. Begin your journey by stepping into our fully functional architectural studio.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200",
    action: "Enter Showroom"
  },
  {
    id: 2,
    section: "zone_2",
    title: "Minimalist Sliding Doors",
    desc: "Feel the effortless glide of our ultra-slim structural systems perfectly designed to blur the line between indoor and outdoor living.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
    action: "Explore Next Gallery"
  },
  {
    id: 3,
    section: "zone_3",
    title: "The Material Library",
    desc: "Get hands-on with our exclusive marine-grade powder coatings, anodized bronze finishes, and specialized acoustic glass.",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1200",
    action: "Visit Lounge"
  },
  {
    id: 4,
    section: "zone_4",
    title: "Consultation Lounge",
    desc: "Sit down with our master engineers to review architectural blueprints and design your bespoke aluminium solution over a cup of coffee.",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1200",
    action: "Finish Tour"
  }
];

function buildSteps(dbZones: DbZone[]) {
  return fallbackSteps.map((fallback) => {
    const db = dbZones.find((z) => z.section === fallback.section);
    return {
      id: fallback.id,
      title: db?.title || fallback.title,
      desc: db?.description || fallback.desc,
      image: db?.image_url || fallback.image,
      action: db?.action_text || fallback.action,
    };
  });
}

export default function ExperienceCenterClient({ dbZones }: { dbZones: DbZone[] }) {
  const showroomSteps = buildSteps(dbZones);
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
    <div className="overflow-hidden bg-plate-white">
      <PageBanner crumb="Experience Center" title={<>Interactive <span className="text-plate-white/80">Virtual Tour</span></>}>
        <p>Click the images to walk through our Experience Center.</p>
      </PageBanner>

      {/* Interactive Tour Section */}
      <div className="shell section">

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
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-berry-bloom">Zone 0{step.id}</span>
                  <div className="h-[1px] w-12 bg-stem-grey" />
                </div>
                <h2 className="h-section text-blueberry">
                  {step.title}
                </h2>
                <p className="text-berry-bloom text-lg leading-relaxed">
                  {step.desc}
                </p>
                
                <div className="flex gap-2 pt-4">
                  {showroomSteps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 transition-all duration-500 rounded-full ${i === currentStep ? 'w-10 bg-berry-bloom' : 'w-2 bg-stem-grey/35 cursor-pointer hover:bg-stem-grey/40'}`}
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
                className="swatch-shadow group absolute inset-0 cursor-pointer overflow-hidden rounded-card"
                onClick={nextStep}
              >
                 <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    priority
                    className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
                 />
                 {/* Click Overlay */}
                 <div className="absolute inset-0 bg-blueberry/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
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
      <section className="section border-t border-stem-grey/50 bg-stem-grey/20">
        <div className="shell grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-20">
          <h2 className="h-section text-blueberry lg:col-span-6">Ready to see it in person?</h2>
          <div className="lg:col-span-6">
            <p className="lede text-blueberry/80">
              Walk-ins are always welcome. Come visit us during our operating hours to explore the showroom and speak directly with our engineering team. No appointment necessary.
            </p>
            <a href="/contact" className="btn btn-primary mt-8">
              Get Directions &amp; Hours
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
