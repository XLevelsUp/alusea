"use client";

import { useEffect, useRef, useState } from "react";
import WhatsAppButton from "@/components/ad/WhatsAppButton";

// How long the visitor sees the page before the prompt appears, in milliseconds.
const DELAY_MS = 3000;
// Remembers for this browser tab that the prompt was shown, so it appears once per visit.
const SEEN_KEY = "alusea-ad-whatsapp-prompt";

/** A few seconds after arrival, the page blurs and dims behind a card that invites the visitor to WhatsApp. */
export default function WhatsAppPrompt() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {
      // Storage can be blocked; the prompt then simply shows.
    }
    const timer = window.setTimeout(() => {
      setOpen(true);
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // Nothing to do when storage is blocked.
      }
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // While open: Escape closes it, focus starts inside the card, and the page behind does not scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus moves into the card for keyboard users without drawing a ring for mouse and touch visitors.
    closeRef.current?.focus({ focusVisible: false } as FocusOptions);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-prompt-title"
      className="wa-prompt fixed inset-0 z-[70] flex items-end justify-center bg-[rgb(20_26_40/0.55)] p-4 backdrop-blur-md sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="wa-prompt-card relative w-full max-w-md rounded-card bg-white p-7 text-center shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)] sm:p-9">
        <button
          ref={closeRef}
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-berry-bloom transition-colors hover:bg-plate-white hover:text-blueberry"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current" strokeWidth="1.75">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        {/* A pulsing WhatsApp mark draws the eye to the action. */}
        <span aria-hidden="true" className="wa-prompt-ring relative mx-auto flex size-16 items-center justify-center rounded-full bg-[#1FA855] text-white">
          <svg viewBox="0 0 24 24" className="size-8 fill-current">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.03c-.25.69-1.44 1.33-2 1.41-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.62-2.98-1.29-4.92-4.29-5.07-4.49-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.6-.37.8-.37l.57.01c.18.01.43-.07.67.51.25.59.84 2.05.91 2.2.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.06 1.14 1.01 2.09 1.33 2.39 1.48.3.15.47.12.64-.07.17-.2.74-.87.94-1.16.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.5.22.57.35.07.12.07.71-.17 1.4Z" />
          </svg>
        </span>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-berry-bloom">Free site visit &amp; quotation</p>
        <h2 id="wa-prompt-title" className="mt-3 font-display text-2xl font-medium leading-snug text-blueberry sm:text-[1.75rem]">Get your free quote on WhatsApp</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-berry-bloom">Tell us what you need and our team will reply with options, prices and a time for a free site visit.</p>

        <WhatsAppButton label="Chat on WhatsApp Now" className="mt-7 w-full" />
      </div>
    </div>
  );
}
