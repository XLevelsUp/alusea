"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CalendarCheck, MessageCircle, X } from "lucide-react";
import { CONSULTATION_HREF } from "@/lib/site";
import type { TourHotspot } from "@/lib/tour";

/** The panel that opens when a hotspot is tapped: its text or film, then the ways to take it further. */
export default function TourHotspotPanel({
  spotName,
  hotspot,
  onClose,
}: {
  spotName: string;
  hotspot: TourHotspot;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus moves into the panel, so keyboard and screen-reader users land on what they just opened.
  useEffect(() => {
    closeRef.current?.focus();
  }, [hotspot.id]);

  const whatsapp = `https://wa.me/919626022722?text=${encodeURIComponent(`Hi, I saw the ${hotspot.title} in your virtual showroom and would like to know more.`)}`;

  return (
    <aside
      aria-label={hotspot.title}
      className="tour-panel-in absolute inset-x-0 bottom-0 z-30 flex max-h-[78svh] flex-col overflow-hidden rounded-t-3xl bg-plate-white text-blueberry shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-24 sm:max-h-none sm:w-[400px] sm:rounded-3xl"
    >
      <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-berry-bloom">{spotName}</p>
          <h2 className="font-display mt-1.5 text-2xl leading-tight">{hotspot.title}</h2>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-stem-grey/50 transition-colors hover:bg-blueberry hover:text-white"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {hotspot.video && (
          // Starts silent so it can play at once; the controls turn the sound on. Kept in its own shape, so upright reels are not cropped.
          <video key={hotspot.video} src={hotspot.video} controls autoPlay muted playsInline loop className="mx-auto max-h-[38svh] w-auto sm:max-h-[52svh] max-w-full rounded-2xl bg-black" />
        )}
        {hotspot.text && <p className={`text-[15px] leading-relaxed text-berry-bloom ${hotspot.video ? "mt-5" : ""}`}>{hotspot.text}</p>}
      </div>

      <div className="grid gap-2.5 border-t border-stem-grey/40 px-6 py-5">
        <Link href={CONSULTATION_HREF}className="flex items-center justify-center gap-2 rounded-full bg-blueberry py-3 text-sm font-semibold text-white transition-colors hover:bg-berry-bloom">
          <CalendarCheck aria-hidden="true" className="size-4" />
          Book a Visit
        </Link>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full border border-blueberry py-3 text-sm font-semibold transition-colors hover:bg-blueberry hover:text-white">
          <MessageCircle aria-hidden="true" className="size-4" />
          Enquire on WhatsApp
        </a>
      </div>
    </aside>
  );
}
