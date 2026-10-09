"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SpaceVisual from "@/components/ui/SpaceVisual";
import { SPACES } from "@/lib/spaces";

const Chevron = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current" strokeWidth="1.5">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Browse by room: one row of large arched aluminium-and-glass doors that scrolls sideways, each door swinging open onto its room. */
const SpacesSection = () => {
  const rowRef = useRef<HTMLUListElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [dragging, setDragging] = useState(false);

  // The arrows switch off at either end of the row, and the progress line follows the row as it moves.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const update = () => {
      const travel = row.scrollWidth - row.clientWidth;
      setAtStart(row.scrollLeft <= 4);
      setAtEnd(row.scrollLeft >= travel - 4);
      const thumb = thumbRef.current;
      if (!thumb) return;
      const share = row.clientWidth / row.scrollWidth;
      const progress = travel > 0 ? row.scrollLeft / travel : 0;
      thumb.style.width = `${share * 100}%`;
      thumb.style.transform = `translateX(${(progress * (1 - share) * 100) / share}%)`;
    };
    update();
    row.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      row.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // With a mouse the row is grabbed and thrown: it follows the pointer exactly, then glides on with the speed it was let go at.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let moved = false;
    let active = false;
    let frame = 0;

    const glide = () => {
      // Speed bleeds away a little each frame, like a real object slowing down.
      velocity *= 0.94;
      row.scrollLeft -= velocity * 16;
      if (Math.abs(velocity) > 0.02) frame = requestAnimationFrame(glide);
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      cancelAnimationFrame(frame);
      active = true;
      moved = false;
      startX = lastX = e.clientX;
      startScroll = row.scrollLeft;
      lastTime = performance.now();
      velocity = 0;
    };

    const onMove = (e: PointerEvent) => {
      if (!active) return;
      const dx = e.clientX - startX;
      // A small movement is still a click; past that it becomes a drag.
      if (!moved && Math.abs(dx) < 6) return;
      if (!moved) {
        moved = true;
        row.setPointerCapture(e.pointerId);
        setDragging(true);
      }
      row.scrollLeft = startScroll - dx;
      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 0) velocity = 0.8 * ((e.clientX - lastX) / dt) + 0.2 * velocity;
      lastX = e.clientX;
      lastTime = now;
    };

    const onUp = (e: PointerEvent) => {
      if (!active) return;
      active = false;
      if (!moved) return;
      if (row.hasPointerCapture(e.pointerId)) row.releasePointerCapture(e.pointerId);
      setDragging(false);
      if (!reduceMotion) frame = requestAnimationFrame(glide);
    };

    // Letting go after a drag must not open the door that happened to be under the pointer.
    const onClick = (e: MouseEvent) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    };

    row.addEventListener("pointerdown", onDown);
    row.addEventListener("pointermove", onMove);
    row.addEventListener("pointerup", onUp);
    row.addEventListener("pointercancel", onUp);
    row.addEventListener("click", onClick, true);
    return () => {
      cancelAnimationFrame(frame);
      row.removeEventListener("pointerdown", onDown);
      row.removeEventListener("pointermove", onMove);
      row.removeEventListener("pointerup", onUp);
      row.removeEventListener("pointercancel", onUp);
      row.removeEventListener("click", onClick, true);
    };
  }, []);

  // Each press of an arrow moves the row along by one door.
  const move = (direction: 1 | -1) => {
    const row = rowRef.current;
    const door = row?.querySelector("li");
    if (!row || !door) return;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    row.scrollBy({ left: direction * (door.getBoundingClientRect().width + gap), behavior: "smooth" });
  };

  const arrowButton = "flex size-12 items-center justify-center rounded-full border border-blueberry/40 text-blueberry transition-colors duration-300 hover:bg-blueberry hover:text-white disabled:pointer-events-none disabled:opacity-30";

  return (
    <section id="spaces" className="section overflow-hidden bg-plate-white">
      <div className="shell">
        <div className="reveal flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <div>
            <p className="eyebrow">Design by Space</p>
            <h2 className="h-section mt-5 text-blueberry">Every Room, Its Own Light</h2>
            <p className="lede mt-4 max-w-xl text-berry-bloom">Open a door to see the windows and doors that suit the room behind it.</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => move(-1)} disabled={atStart} aria-label="Previous rooms" className={arrowButton}>
              <Chevron d="M15 18l-6-6 6-6" />
            </button>
            <button type="button" onClick={() => move(1)} disabled={atEnd} aria-label="More rooms" className={arrowButton}>
              <Chevron d="M9 18l6-6-6-6" />
            </button>
          </div>
        </div>

        {/* One row that runs past the right edge of the screen, so it reads as something to scroll. */}
        <ul
          ref={rowRef}
          className={`-mx-[var(--gutter)] mt-10 flex select-none [&_img]:pointer-events-none scroll-px-[var(--gutter)] gap-4 overflow-x-auto px-[var(--gutter)] pb-10 pt-4 [scrollbar-width:none] lg:mt-14 lg:gap-8 [&::-webkit-scrollbar]:hidden [@media(hover:none)]:snap-x [@media(hover:none)]:snap-mandatory ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        >
          {SPACES.map((space, index) => (
            <li key={space.slug} className="reveal door w-[62vw] shrink-0 snap-start sm:w-[38vw] lg:w-[24vw] lg:max-w-[24rem]">
              {/* The outer aluminium frame of the doorway; it stays in place when the door opens. */}
              <Link
                href={`/spaces/${space.slug}`}
                draggable={false}
                className="door-frame swatch-shadow group block aspect-[3/4] rounded-b-[0.25rem] rounded-t-[999px] bg-gradient-to-b from-stem-grey to-stem-grey-deep p-1.5 lg:p-2.5"
              >
                <span className="relative block size-full overflow-hidden rounded-t-[999px] bg-stem-grey/30">
                  {/* The room behind the door. */}
                  <SpaceVisual image={space.image} drawing={space.drawing} alt={`${space.name} with Alusea aluminium windows and doors`} sizes="(max-width: 640px) 62vw, (max-width: 1024px) 38vw, 24vw" />
                  <span className="door-caption absolute inset-x-0 bottom-0 flex items-end justify-end gap-4 bg-gradient-to-t from-black/60 to-transparent p-5 pt-24 lg:p-8 lg:pt-32">
                    <span className="font-display text-right text-2xl leading-tight text-white lg:text-4xl">{space.name}</span>
                    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-blueberry lg:size-12">
                      <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.25">
                        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </span>

                  {/* The door: a slim aluminium frame around frosted glass, hinged on the left, swinging into the room. */}
                  <span aria-hidden="true" className="door-leaf absolute inset-0">
                    <span className="door-label absolute inset-0 bg-white/15 backdrop-blur-[5px]" />
                    <span className="absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/0.32)_0%,transparent_32%,transparent_62%,rgb(255_255_255/0.14)_100%)]" />
                    <span className="absolute inset-0 rounded-t-[999px] border-[6px] border-stem-grey-deep lg:border-[10px]" />
                    <span className="absolute inset-x-0 top-[36%] h-1.5 bg-stem-grey-deep lg:h-2.5" />
                    <span className="absolute right-4 top-[58%] h-16 w-1.5 rounded-full bg-gradient-to-b from-plate-white to-stem-grey shadow-[0_2px_6px_rgb(0_0_0/0.35)] lg:right-7 lg:h-28 lg:w-2" />
                    <span className="door-label absolute inset-x-0 top-[14%] text-center text-sm tabular-nums text-white [text-shadow:0_1px_6px_rgb(0_0_0/0.4)] lg:text-base">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="door-label font-display absolute bottom-5 left-5 text-2xl leading-tight text-white [text-shadow:0_1px_10px_rgb(0_0_0/0.45)] lg:bottom-9 lg:left-10 lg:text-4xl">
                      {space.name}
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* A fine line shows how far along the row the visitor is. */}
        <div aria-hidden="true" className="h-px w-full overflow-hidden bg-stem-grey/50">
          <span ref={thumbRef} className="block h-full w-1/3 bg-blueberry" />
        </div>
      </div>
    </section>
  );
};

export default SpacesSection;
