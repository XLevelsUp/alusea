"use client";

import dynamic from "next/dynamic";

// The tour checks the browser's 3D support and the address as it starts, so it only runs in the browser.
const TourExperience = dynamic(() => import("@/components/tour/TourExperience"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <span aria-hidden="true" className="size-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
    </div>
  ),
});

export default function VrRoom() {
  return <TourExperience />;
}
