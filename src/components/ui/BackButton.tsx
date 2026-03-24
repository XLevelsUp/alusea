"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render on client to avoid hydration mismatch, and hide on homepage
  if (!mounted || pathname === "/") return null;

  return (
    <button
      onClick={() => router.back()}
      className="fixed top-32 left-6 md:left-8 z-40 flex items-center gap-2 px-5 py-3 bg-matte-black text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-brushed-bronze transition-all shadow-2xl border border-white/10 group animate-in fade-in slide-in-from-top-5 duration-500"
      aria-label="Go Back"
    >
      <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back
    </button>
  );
}
