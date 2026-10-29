"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { CONSULTATION_HREF, SHOWROOM_MAP_URL } from "@/lib/site";
import { TOUR_SPOTS } from "@/lib/tour";

/** Shown instead of the 360° view on a device or browser that cannot draw it: still pictures of every spot and a way to visit in person. */
export default function TourFallback() {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-plate-white px-5 pb-12 pt-28 text-blueberry sm:px-10">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-display text-2xl sm:text-3xl">The 360° view is not available on this device</h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-berry-bloom">
          Your browser cannot show the walk-through, so here is a look at each part of the showroom instead. You are welcome to visit us in person.
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TOUR_SPOTS.map((spot) => (
            <li key={spot.id}>
              <figure className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {/* The phone copy of the 360° photo, shown flat and cropped to its middle. */}
                <div className="relative aspect-[16/9]">
                  <Image src={`/tour/${spot.image}-m.webp`} alt={`Alusea showroom, ${spot.name}`} fill sizes="(max-width: 640px) 92vw, 46vw" className="object-cover" />
                </div>
                <figcaption className="px-4 py-3 text-sm font-semibold">{spot.name}</figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={CONSULTATION_HREF}className="inline-flex items-center gap-2 rounded-full bg-blueberry px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-berry-bloom">
            <CalendarCheck aria-hidden="true" className="size-4" />
            Book a Visit
          </Link>
          <a href={SHOWROOM_MAP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-blueberry px-6 py-3 text-sm font-semibold transition-colors hover:bg-blueberry hover:text-white">
            Find the Showroom
          </a>
        </div>
      </div>
    </div>
  );
}
