import Image from "next/image";
import { Rotate3d } from "lucide-react";
import TourButton from "@/components/tour/TourButton";
import { TOUR_SPOTS } from "@/lib/tour";

/** The way into the virtual showroom from this page: one large view to step into. */
export default function TourEntry() {
  const [first] = TOUR_SPOTS;

  return (
    <section className="shell section pb-0">
      <p className="eyebrow">Virtual Showroom</p>
      <h2 className="h-section mt-5 text-blueberry">Walk Through Our Showroom in 360°</h2>
      <p className="lede mt-4 max-w-2xl text-berry-bloom">Look around every corner, walk from room to room, and tap the products to learn more, from wherever you are.</p>

      {/* The Entrance, seen flat, as the doorway into the tour. */}
      <div className="group relative mt-10 aspect-[4/3] overflow-hidden rounded-card bg-blueberry sm:aspect-[21/9]">
        <Image src={`/tour/${first.image}-m.webp`} alt="The entrance of the Alusea showroom" fill priority sizes="(max-width: 1280px) 92vw, 1200px" className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-10">
          <p className="font-display max-w-md text-2xl text-white [text-shadow:0_1px_10px_rgb(0_0_0/0.4)] sm:text-3xl">Step inside the Alusea Experience Centre</p>
          <TourButton icon={false} className="inline-flex shrink-0 items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-blueberry shadow-lg transition-colors hover:bg-plate-white">
            <Rotate3d aria-hidden="true" className="size-5" />
            Enter the Virtual Showroom
          </TourButton>
        </div>
      </div>
    </section>
  );
}
