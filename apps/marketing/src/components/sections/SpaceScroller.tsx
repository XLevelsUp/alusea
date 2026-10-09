"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SpaceVisual from "@/components/ui/SpaceVisual";
import type { Space } from "@/lib/spaces";

const Chevron = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current" strokeWidth="1.5">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// The rooms are laid out three times in a row; the visitor is kept in the middle copy, so the row never reaches an end.
const COPIES = [0, 1, 2];
const MIDDLE = 1;

/** A single row of rooms that scrolls sideways without end; the cards curve gently towards the viewer at either edge, like the inside of a bay. */
const SpaceScroller = ({ spaces, heading }: { spaces: Space[]; heading: string }) => {
  const rowRef = useRef<HTMLUListElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cards = () => Array.from(row.querySelectorAll<HTMLElement>("[data-card]"));

    // The width of one full set of rooms: how far the row can jump without anything appearing to move.
    const setWidth = () => {
      const items = row.querySelectorAll<HTMLElement>("li");
      return items.length > spaces.length ? items[spaces.length].offsetLeft - items[0].offsetLeft : 0;
    };

    let frame = 0;
    let idle = 0;
    // Drag state lives here so that a jump between copies can carry the drag with it.
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let moved = false;
    let active = false;
    let glideFrame = 0;

    const jump = (distance: number) => {
      row.scrollLeft += distance;
      startScroll += distance;
    };

    // Brings the visitor back into the middle copy; the three copies are identical, so the jump cannot be seen.
    const recentre = () => {
      const width = setWidth();
      if (!width) return;
      if (row.scrollLeft < width * 0.5) jump(width);
      else if (row.scrollLeft > width * 1.5) jump(-width);
    };

    // As the row moves, each card turns a little according to how far it is from the middle of the screen.
    const curve = () => {
      frame = 0;
      if (reduceMotion) return;
      const bounds = row.getBoundingClientRect();
      const middle = bounds.left + bounds.width / 2;
      for (const card of cards()) {
        const rect = card.getBoundingClientRect();
        if (rect.right < bounds.left - 200 || rect.left > bounds.right + 200) continue;
        // -1 at the left edge of the row, 0 in the middle, 1 at the right edge.
        const offset = Math.max(-1.2, Math.min(1.2, (rect.left + rect.width / 2 - middle) / (bounds.width / 2)));
        card.style.transform = `perspective(1400px) rotateY(${(-offset * 16).toFixed(2)}deg) scale(${(1 + Math.abs(offset) * 0.07).toFixed(3)})`;
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(curve);
      // While a drag or a throw is moving the row the jump happens at once; otherwise it waits until the row has settled, so a smooth scroll is never cut short.
      if (active || glideFrame) recentre();
      clearTimeout(idle);
      idle = window.setTimeout(recentre, 140);
    };

    // Start in the middle copy.
    row.scrollLeft = setWidth();
    curve();

    const glide = () => {
      velocity *= 0.94;
      row.scrollLeft -= velocity * 16;
      glideFrame = Math.abs(velocity) > 0.02 ? requestAnimationFrame(glide) : 0;
    };

    // With a mouse the row is grabbed and thrown: it follows the pointer, then glides on with the speed it was let go at.
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      cancelAnimationFrame(glideFrame);
      glideFrame = 0;
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
      if (!reduceMotion) glideFrame = requestAnimationFrame(glide);
    };
    // Letting go after a drag must not open the room that happened to be under the pointer.
    const onClick = (e: MouseEvent) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    };
    const onResize = () => {
      recentre();
      onScroll();
    };

    row.addEventListener("scroll", onScroll, { passive: true });
    row.addEventListener("pointerdown", onDown);
    row.addEventListener("pointermove", onMove);
    row.addEventListener("pointerup", onUp);
    row.addEventListener("pointercancel", onUp);
    row.addEventListener("click", onClick, true);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(glideFrame);
      clearTimeout(idle);
      row.removeEventListener("scroll", onScroll);
      row.removeEventListener("pointerdown", onDown);
      row.removeEventListener("pointermove", onMove);
      row.removeEventListener("pointerup", onUp);
      row.removeEventListener("pointercancel", onUp);
      row.removeEventListener("click", onClick, true);
      window.removeEventListener("resize", onResize);
    };
  }, [spaces.length]);

  // Each press of an arrow moves the row along by one card.
  const move = (direction: 1 | -1) => {
    const row = rowRef.current;
    const card = row?.querySelector("li");
    if (!row || !card) return;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    row.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: "smooth" });
  };

  const arrowButton = "flex size-12 items-center justify-center rounded-full border border-blueberry/40 text-blueberry transition-colors duration-300 hover:bg-blueberry hover:text-white";

  return (
    <section className="section overflow-hidden border-t border-stem-grey/50">
      <div className="shell flex items-end justify-between gap-8">
        <h2 className="h-section reveal text-blueberry">{heading}</h2>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => move(-1)} aria-label="Previous rooms" className={arrowButton}>
            <Chevron d="M15 18l-6-6 6-6" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="More rooms" className={arrowButton}>
            <Chevron d="M9 18l6-6-6-6" />
          </button>
        </div>
      </div>

      {/* The row runs the full width of the screen, so the curve at each edge is seen against the page and not cut off. */}
      <ul
        ref={rowRef}
        className={`mt-10 flex select-none gap-4 overflow-x-auto px-[var(--gutter)] py-10 [scrollbar-width:none] [&_img]:pointer-events-none lg:gap-5 [&::-webkit-scrollbar]:hidden ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        {COPIES.map((copy) =>
          spaces.map((space) => (
            // Only the middle copy is offered to keyboards and screen readers, so each room is met once.
            <li key={`${copy}-${space.slug}`} aria-hidden={copy !== MIDDLE} className="w-[62vw] shrink-0 sm:w-[38vw] lg:w-[22vw] lg:max-w-[21rem]">
              <Link
                href={`/spaces/${space.slug}`}
                draggable={false}
                tabIndex={copy === MIDDLE ? 0 : -1}
                data-card
                className="group relative block aspect-[3/4] overflow-hidden rounded-card shadow-[0_30px_50px_-30px_rgb(47_58_85/0.55)] [transform-origin:center] [will-change:transform]"
              >
                <SpaceVisual image={space.image} drawing={space.drawing} alt={`${space.name} with Alusea aluminium windows and doors`} sizes="(max-width: 640px) 62vw, (max-width: 1024px) 38vw, 22vw" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/65 to-transparent p-5 pt-20">
                  <span className="font-display text-xl leading-tight text-white lg:text-2xl">{space.name}</span>
                  <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-blueberry transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                    <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.5">
                      <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </section>
  );
};

export default SpaceScroller;
