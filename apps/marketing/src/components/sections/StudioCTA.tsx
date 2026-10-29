import Image from "next/image";
import { MapPin, Rotate3d } from "lucide-react";
import TourButton from "@/components/tour/TourButton";
import { SHOWROOM_MAP_URL } from "@/lib/site";
import { TOUR_SPOTS } from "@/lib/tour";

/** The last stop before the footer: an invitation to walk into the 360° Experience Centre, or to visit it in person. */
export default function StudioCTA() {
  const hall = TOUR_SPOTS.find((spot) => spot.id === "central-hall") ?? TOUR_SPOTS[0];

  return (
    <section aria-labelledby="studio-cta-title" className="section bg-plate-white">
      <div className="shell">
        <div className="reveal group relative isolate overflow-hidden rounded-card bg-blueberry">
          {/* A real view inside the showroom, slowly drifting closer on hover, as if stepping in. */}
          <Image
            src={`/tour/${hall.image}-m.webp`}
            alt="Inside the Alusea Experience Centre"
            fill
            sizes="(max-width: 1280px) 92vw, 1200px"
            className="-z-10 object-cover object-[50%_55%] transition-transform duration-[1.6s] ease-out group-hover:scale-105"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgb(47_58_85/0.92)_0%,rgb(47_58_85/0.7)_45%,rgb(47_58_85/0.15)_100%)]" />

          <div className="flex min-h-[26rem] flex-col justify-end gap-8 p-8 sm:p-12 lg:min-h-[30rem] lg:p-16">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
              <Rotate3d aria-hidden="true" className="size-4" />
              360° Experience Centre
            </span>
            <div className="max-w-xl">
              <h2 id="studio-cta-title" className="h-section text-white">Enter the Studio</h2>
              <p className="lede mt-4 text-white/85">Walk through our showroom from wherever you are: look around every room, and tap any door or window to see what makes it special.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <TourButton icon={false} className="btn btn-light">
                <Rotate3d aria-hidden="true" className="size-5" />
                Enter the Studio
              </TourButton>
              <a href={SHOWROOM_MAP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light">
                <MapPin aria-hidden="true" className="size-5" />
                Visit in Person
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
