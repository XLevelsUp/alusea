"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

export type Media = { type: "image" | "video"; src: string };

type ProductMedia = { image_url: string; image_urls?: string[] | null; video_urls?: string[] | null };

/** A product's photos first, then its films, as one list for the strip. */
export const productMedia = (product: ProductMedia): Media[] => {
  const images = product.image_urls && product.image_urls.length > 0 ? product.image_urls : [product.image_url];
  return [...images.map((src) => ({ type: "image" as const, src })), ...(product.video_urls ?? []).map((src) => ({ type: "video" as const, src }))];
};

/** "3 photos · 1 film", for the line under a product's strip. */
export const mediaCountLabel = (media: Media[]) => {
  const films = media.filter((item) => item.type === "video").length;
  const photos = media.length - films;
  return [photos > 0 ? `${photos} ${photos === 1 ? "photo" : "photos"}` : "", films > 0 ? `${films} ${films === 1 ? "film" : "films"}` : ""].filter(Boolean).join(" · ");
};

type MediaCarouselProps = {
  media: Media[];
  alt: string;
  className: string;
  sizes: string;
  /** Shows a row of thumbnails beneath in place of the dots. */
  thumbs?: boolean;
  priority?: boolean;
};

/** One product's photos and films in a single strip: swipe or use the arrows, and a film plays when it is reached. */
const MediaCarousel = ({ media, alt, className, sizes, thumbs = false, priority = false }: MediaCarouselProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);

  // Films only run while the strip is on screen.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Only the film that is showing plays; the others are paused.
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === active && inView && !still) video.play().catch(() => {});
      else video.pause();
    });
  }, [active, inView]);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== active) setActive(index);
  };

  const go = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const next = (index + media.length) % media.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  const arrow = "absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-blueberry opacity-0 backdrop-blur-sm transition-opacity duration-300 hover:bg-white focus-visible:opacity-100 group-hover/media:opacity-100";
  const slideLabel = (item: Media, index: number) => (item.type === "video" ? `Show film, slide ${index + 1}` : `Show photo, slide ${index + 1}`);

  return (
    <div>
      <div className={`group/media media ${className}`}>
        <div ref={trackRef} onScroll={onScroll} className="flex size-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {media.map((item, index) => (
            <div key={item.src + index} className="relative size-full shrink-0 snap-center">
              {item.type === "image" ? (
                <Image src={item.src} alt={index === 0 ? alt : ""} fill sizes={sizes} priority={priority && index === 0} className="object-cover" />
              ) : (
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el;
                  }}
                  src={item.src}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={`${alt} film`}
                  className="size-full object-cover"
                />
              )}
            </div>
          ))}
        </div>

        {media[active]?.type === "video" && (
          <span className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-blueberry/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
            <Play aria-hidden="true" className="size-3 fill-current" />
            Film
          </span>
        )}

        {media.length > 1 && (
          <>
            <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-semibold tabular-nums text-blueberry backdrop-blur-sm">
              {active + 1} / {media.length}
            </span>
            <button type="button" aria-label="Previous" onClick={() => go(active - 1)} className={`${arrow} left-3`}>
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button type="button" aria-label="Next" onClick={() => go(active + 1)} className={`${arrow} right-3`}>
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
            {!thumbs && (
              <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2">
                {media.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={slideLabel(item, index)}
                    onClick={() => go(index)}
                    className={`flex items-center justify-center rounded-full text-blueberry transition-all duration-300 ${index === active ? "bg-white" : "bg-white/55 hover:bg-white"} ${item.type === "video" ? "size-5" : index === active ? "h-2 w-6" : "size-2"}`}
                  >
                    {item.type === "video" && <Play aria-hidden="true" className="size-2.5 fill-current" />}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {thumbs && media.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {media.map((item, index) => (
            <button
              key={index}
              type="button"
              aria-label={slideLabel(item, index)}
              onClick={() => go(index)}
              className={`relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all md:w-28 ${index === active ? "border-blueberry" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              {item.type === "image" ? (
                <Image src={item.src} alt="" fill sizes="112px" className="object-cover" />
              ) : (
                <>
                  <video src={item.src} muted playsInline preload="metadata" className="size-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-blueberry/35">
                    <span className="flex size-8 items-center justify-center rounded-full bg-white text-blueberry">
                      <Play aria-hidden="true" className="size-3.5 fill-current" />
                    </span>
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaCarousel;
