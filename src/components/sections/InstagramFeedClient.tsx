"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/alusea_aluminum/";

const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

const PlayIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 5.14v13.72a1 1 0 0 0 1.5.87l11-6.86a1 1 0 0 0 0-1.74l-11-6.86A1 1 0 0 0 8 5.14z" />
  </svg>
);

/* Flanking reel — hover to preview, click to bring it centre stage */
const SideReel = ({
  item,
  onSelect,
}: {
  item: InstagramMedia;
  onSelect: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const play = () => videoRef.current?.play().catch(() => {});
  const stop = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  };

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      onMouseEnter={play}
      onMouseLeave={stop}
      onFocus={play}
      onBlur={stop}
      aria-label={`Preview reel: ${item.caption?.slice(0, 80) ?? "Alusea reel"}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="group relative w-[22vw] max-w-[150px] md:w-[130px] lg:w-[165px] aspect-[9/16] shrink-0 overflow-hidden rounded-sm bg-alusea-light-gray shadow-[0_16px_36px_-16px_rgba(17,17,17,0.3)] ring-1 ring-black/15 transition-all duration-500 hover:-translate-y-1.5 hover:ring-brushed-bronze focus-visible:outline-2 focus-visible:outline-brushed-bronze"
    >
      <video
        ref={videoRef}
        src={item.media_url}
        poster={item.thumbnail_url}
        muted
        loop
        playsInline
        preload="none"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors duration-500 group-hover:bg-transparent">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-black/20 text-white backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-0 md:h-11 md:w-11">
          <PlayIcon className="ml-0.5 h-3 w-3 md:h-4 md:w-4" />
        </span>
      </span>
    </motion.button>
  );
};

const InstagramFeedClient = ({ items }: { items: InstagramMedia[] }) => {
  // Items arrive newest-first; the latest reel opens centre stage
  const [activeId, setActiveId] = useState(items[0]?.id);
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  const active = items.find((item) => item.id === activeId) ?? items[0];
  const others = items.filter((item) => item.id !== active.id);
  const leftItems = others.filter((_, i) => i % 2 === 0);
  const rightItems = others.filter((_, i) => i % 2 === 1);
  const isLatest = active.id === items[0]?.id;

  return (
    <section
      className="relative overflow-hidden bg-[#F7F4EF] py-20 md:py-28"
      aria-label="Instagram reels"
    >
      {/* Bronze accent lines, echoing the hero */}
      <div className="absolute bottom-0 left-12 hidden h-32 w-[1px] bg-gradient-to-t from-brushed-bronze to-transparent md:block" />
      <div className="absolute right-12 top-0 hidden h-32 w-[1px] bg-gradient-to-b from-brushed-bronze to-transparent md:block" />

      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-12">
        <div className="grid items-center gap-12 md:gap-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          {/* Left: hero-style content block */}
          <div className="max-w-xl space-y-1">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex items-center space-x-3"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-brushed-bronze" />
              <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-brushed-bronze">
                From Our Instagram
              </span>
            </motion.div>

            <h2 className="mt-2 text-3xl font-bold leading-[1.1] tracking-tight text-matte-black sm:text-5xl md:mt-3 md:text-[4rem]">
              Crafted in Motion, <br />
              <span className="text-matte-black/70">On Every Project</span>
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="max-w-2xl pt-4 text-base font-medium text-steel-gray sm:text-lg md:text-xl"
            >
              Watch our premium aluminium doors, windows and facades come to
              life — filmed on site, straight from our Instagram.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 1, delay: 0.4 }}
              className="pt-8"
            >
              <a
                href={INSTAGRAM_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-3 rounded-sm bg-[#7A5418] px-10 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#5C3D0E] sm:w-auto sm:py-5"
              >
                <InstagramIcon className="h-5 w-5" />
                Follow Us
              </a>
            </motion.div>
          </div>

          {/* Right: reels cluster — latest in the centre */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              {leftItems.map((item, i) => (
                // Phones fit one reel per side; extras join from tablet up
                <div key={item.id} className={i > 0 ? "hidden md:block" : ""}>
                  <SideReel item={item} onSelect={() => setActiveId(item.id)} />
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative w-[40vw] max-w-[290px] md:w-[250px] lg:w-[290px] aspect-[9/16] shrink-0"
            >
              {/* Offset bronze frame, like an architectural drawing */}
              <div
                aria-hidden
                className="absolute inset-0 translate-x-3 translate-y-3 rounded-sm border border-brushed-bronze/50 md:translate-x-4 md:translate-y-4"
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.985 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute inset-0 overflow-hidden rounded-sm bg-alusea-light-gray shadow-[0_40px_80px_-32px_rgba(122,84,24,0.5)] ring-1 ring-black/10"
                >
                  <video
                    src={active.media_url}
                    poster={active.thumbnail_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  {isLatest && (
                    <span className="absolute left-2.5 top-2.5 rounded-sm bg-brushed-bronze px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white shadow-md md:left-4 md:top-4 md:px-3 md:py-1.5 md:text-[10px]">
                      Latest
                    </span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-3 pb-3 pt-10 md:space-y-3 md:px-5 md:pb-5 md:pt-16">
                    {active.caption && (
                      <p className="hidden text-sm font-medium leading-snug text-white line-clamp-2 sm:block">
                        {active.caption}
                      </p>
                    )}
                    <Link
                      href={active.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-sm border border-white/40 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-colors duration-300 hover:border-brushed-bronze hover:text-brushed-bronze md:gap-2 md:px-4 md:py-2 md:text-[11px]"
                    >
                      <InstagramIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      Watch Reel
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              {rightItems.map((item, i) => (
                <div key={item.id} className={i > 0 ? "hidden md:block" : ""}>
                  <SideReel item={item} onSelect={() => setActiveId(item.id)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstagramFeedClient;
