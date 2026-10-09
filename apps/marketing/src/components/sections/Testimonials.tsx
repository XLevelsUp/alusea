"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play, X } from "lucide-react";

type Story =
  | { kind: "video"; id: string; label: string; video: string; fallback: string; thumbnail: string; poster: string }
  | { kind: "text"; id: string; author: string; role: string; quote: string };

// Each story is one card in the deck; a written review can be swapped for a film as more customers record one.
const stories: Story[] = [
  {
    kind: "video",
    id: "review-01",
    label: "an Alusea customer",
    video: "/videos/review-01.webm",
    // The same film as MP4, for phones that cannot play WebM.
    fallback: "/videos/review-01.mp4",
    thumbnail: "/images/reviews/review-01.webp",
    poster: "/images/reviews/review-01-poster.webp",
  },
  {
    kind: "text",
    id: "rajesh",
    quote: "Alusea is by far the finest luxury aluminium window fabricator in Tamil Nadu. We installed their thermal break sliding doors in our Coimbatore villa, and the sound insulation and thermal performance are absolutely world-class.",
    author: "Rajesh Krishnan",
    role: "Architectural Designer, Coimbatore",
  },
  {
    kind: "text",
    id: "priya",
    quote: "For our apartment building project, choosing Alusea as our apartment aluminium facade supplier was the best decision. Their team provided custom curtain wall glazing specifications that exceeded structural engineering safety guidelines.",
    author: "Priya Sundaram",
    role: "Structural Consultant, South India Builders",
  },
  {
    kind: "text",
    id: "arjun",
    quote: "Finding a reliable minimalist aluminium sliding door villa provider in India was challenging until we found Alusea. Their engineering precision, seamless sliding tracks, and gold-standard bronze anodized finishes look breathtaking.",
    author: "Arjun Mehta",
    role: "Villa Owner, Ooty",
  },
];

/** The window that opens over the page when a story is chosen: the film plays, or the written review is shown. */
const StoryDialog = ({ story, onClose }: { story: Story; onClose: () => void }) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes it, the page behind stays still, and focus starts on the close button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={story.kind === "video" ? `Review film from ${story.label}` : `Review from ${story.author}`}
      className="sheet-in fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className={`relative overflow-hidden rounded-card bg-plate-white ${story.kind === "video" ? "" : "w-full max-w-3xl"}`} onClick={(e) => e.stopPropagation()}>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center rounded-full bg-white text-blueberry shadow-md transition-colors hover:bg-blueberry hover:text-white"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
        {story.kind === "video" ? (
          // The film is only fetched once this window is opened.
          <video className="block max-h-[86vh] w-auto max-w-[92vw] bg-black" poster={story.poster} controls autoPlay playsInline>
            <source src={story.video} type="video/webm" />
            <source src={story.fallback} type="video/mp4" />
          </video>
        ) : (
          <figure className="p-8 md:p-14">
            <blockquote className="font-display text-xl font-light leading-snug text-blueberry md:text-3xl md:leading-[1.35]">&ldquo;{story.quote}&rdquo;</blockquote>
            <figcaption className="mt-8 flex items-center gap-4">
              <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blueberry font-display text-lg text-white">
                {story.author.charAt(0)}
              </span>
              <span>
                <span className="block text-lg font-medium text-blueberry">{story.author}</span>
                <span className="block text-sm text-berry-bloom">{story.role}</span>
              </span>
            </figcaption>
          </figure>
        )}
      </div>
    </div>
  );
};

// How a card sits at each depth of the deck: the front card is square-on; those behind fan out, smaller and turned.
const DEPTHS = [
  "translate3d(0,0,0) rotate(0deg) scale(1)",
  "translate3d(9%,3%,0) rotate(5deg) scale(0.95)",
  "translate3d(-9%,5%,0) rotate(-6deg) scale(0.9)",
  "translate3d(15%,7%,0) rotate(9deg) scale(0.85)",
];

const TURN_MS = 5500;

/** Reviews: a large heading and rating beside a deck of cards; the front card is the one being read, and it slips to the back as the next comes forward. */
const Testimonials = () => {
  const [open, setOpen] = useState<Story | null>(null);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const count = stories.length;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The deck turns by itself while it is on screen and nothing is open, except for visitors who ask for less motion.
  useEffect(() => {
    if (!inView || open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => setActive((a) => (a + 1) % count), TURN_MS);
    return () => clearTimeout(timer);
  }, [active, count, inView, open]);

  const turn = (step: number) => setActive((a) => (a + step + count) % count);
  const current = stories[active];
  const arrow = "flex size-12 items-center justify-center rounded-full border border-blueberry/30 text-blueberry transition-colors duration-300 hover:bg-blueberry hover:text-white";

  return (
    <section id="reviews" className="section overflow-hidden bg-plate-white pt-0">
      <div className="shell grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="reveal lg:col-span-5">
          <p className="eyebrow">Testimonial</p>
          <h2 className="h-display mt-6 text-blueberry">Client&apos;s Success Stories</h2>
          <p className="mt-8 flex items-center gap-4 border-y border-stem-grey/50 py-5 text-blueberry" itemScope itemType="https://schema.org/AggregateRating">
            <span className="font-display text-5xl font-light tabular-nums" itemProp="ratingValue" content="4.9">4.9</span>
            <span>
              <span aria-hidden="true" className="block text-[13px] tracking-[0.25em]">★★★★★</span>
              <span className="mt-1 block text-sm text-berry-bloom">
                (<span itemProp="reviewCount">24</span> reviews)
              </span>
            </span>
            <meta itemProp="bestRating" content="5" />
            <meta itemProp="worstRating" content="1" />
          </p>

          <div className="mt-8 flex items-center gap-3">
            <button type="button" aria-label="Previous story" onClick={() => turn(-1)} className={arrow}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current" strokeWidth="1.5">
                <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" aria-label="Next story" onClick={() => turn(1)} className={arrow}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current" strokeWidth="1.5">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span data-counter className="ml-3 text-sm tabular-nums text-berry-bloom">
              {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
            {/* One bar per story; the current one fills as its time runs. */}
            <span aria-hidden="true" className="ml-4 flex flex-1 gap-1.5">
              {stories.map((story, index) => (
                <span key={story.id} className="relative h-px flex-1 bg-blueberry/20">
                  {index === active && (
                    <span key={active} className={`segment-fill absolute inset-0 origin-left bg-blueberry ${inView && !open ? "" : "[animation-play-state:paused]"}`} style={{ animationDuration: `${TURN_MS}ms` }} />
                  )}
                </span>
              ))}
            </span>
          </div>
        </div>

        <div ref={stageRef} className="reveal relative mx-auto aspect-[4/5] w-[min(100%,22rem)] sm:w-[26rem] lg:col-span-7 lg:w-[28rem]">
          {stories.map((story, index) => {
            const depth = (index - active + count) % count;
            const isFront = depth === 0;
            return (
              <button
                key={story.id}
                type="button"
                data-card={isFront ? "front" : "back"}
                onClick={() => (isFront ? setOpen(story) : setActive(index))}
                aria-label={isFront ? (story.kind === "video" ? `Play the review film from ${story.label}` : `Read the full review from ${story.author}`) : "Bring this story to the front"}
                // Only the front card is reached by keyboard; the arrows bring the others forward.
                tabIndex={isFront ? 0 : -1}
                className="group absolute inset-0 overflow-hidden rounded-card text-left shadow-[0_40px_70px_-35px_rgb(47_58_85/0.6)] ring-1 ring-blueberry/10 transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ transform: DEPTHS[Math.min(depth, DEPTHS.length - 1)], zIndex: count - depth }}
              >
                {story.kind === "video" ? (
                  <>
                    <Image src={story.poster} alt="" fill sizes="(max-width: 640px) 22rem, 28rem" className="object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex size-20 items-center justify-center rounded-full bg-white text-blueberry shadow-[0_10px_30px_-8px_rgb(0_0_0/0.5)] transition-transform duration-500 group-hover:scale-110">
                        <Play aria-hidden="true" className="ml-1 size-7 fill-current" />
                      </span>
                    </span>
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-0 p-7 text-[13px] tracking-[0.25em] text-white">★★★★★</span>
                  </>
                ) : (
                  <span className="flex size-full flex-col justify-between bg-white p-7 sm:p-10">
                    <span>
                      <span aria-hidden="true" className="font-display block h-12 text-7xl leading-none text-stem-grey/60">&ldquo;</span>
                      <span className="font-display mt-2 line-clamp-[8] text-lg font-light leading-snug text-blueberry sm:text-[1.375rem]">{story.quote}</span>
                    </span>
                    <span className="flex items-center gap-4 border-t border-stem-grey/40 pt-6">
                      <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blueberry font-display text-lg text-white">{story.author.charAt(0)}</span>
                      <span>
                        <span className="block font-medium text-blueberry">{story.author}</span>
                        <span className="block text-sm text-berry-bloom">{story.role}</span>
                      </span>
                    </span>
                  </span>
                )}
              </button>
            );
          })}
          {/* Tells screen readers which story has come to the front. */}
          <p className="sr-only" aria-live="polite">{current.kind === "video" ? "Customer review film" : `Review from ${current.author}`}</p>
        </div>
      </div>

      {open && <StoryDialog story={open} onClose={() => setOpen(null)} />}
    </section>
  );
};

export default Testimonials;
