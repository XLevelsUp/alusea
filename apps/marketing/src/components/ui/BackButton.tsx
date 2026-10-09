"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  // True once the page is scrolled to the footer, where the button would sit on top of the legal links.
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const update = () => setAtFooter(window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  // Only render on client to avoid hydration mismatch, and hide on homepage or admin panel
  if (!mounted || pathname === "/" || pathname?.startsWith("/admin")) return null;

  return (
    <button
      onClick={() => router.back()}
      // While hidden at the footer it also leaves the keyboard order.
      tabIndex={atFooter ? -1 : 0}
      className={`swatch-shadow group fixed bottom-6 left-4 z-40 flex size-12 items-center justify-center rounded-full border border-stem-grey/60 bg-plate-white text-blueberry transition-[background-color,color,opacity] duration-300 hover:bg-blueberry hover:text-white md:bottom-8 md:left-6 ${
        atFooter ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-label="Go Back"
    >
      <svg aria-hidden="true" className="size-5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span className="sr-only">Back</span>
    </button>
  );
}
