"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STAGGER_MS = 90;
const MAX_STAGGERED = 6;

/** Fades each `.reveal` element up as it scrolls into view, one after another within the same group. */
export default function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    // Visitors who ask for less motion see everything in place from the start.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const show = (el: HTMLElement) => el.setAttribute("data-in", "");
    // Kept per page visit: a mark left on the element itself would outlive the watcher that set it and leave the element hidden.
    const tracked = new WeakSet<HTMLElement>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    const track = (el: HTMLElement) => {
      if (el.hasAttribute("data-in") || tracked.has(el)) return;
      tracked.add(el);
      // Whatever is already on screen is shown at once, so nothing blinks when the page loads.
      if (el.getBoundingClientRect().top < window.innerHeight) {
        show(el);
        return;
      }
      // Siblings arrive in sequence: each waits a little longer than the one before it.
      const siblings = Array.from(el.parentElement?.children ?? []).filter((child) => child.classList.contains("reveal"));
      const position = Math.min(siblings.indexOf(el), MAX_STAGGERED);
      el.style.transitionDelay = `${position * STAGGER_MS}ms`;
      observer.observe(el);
    };

    const scan = (root: ParentNode) => root.querySelectorAll<HTMLElement>(".reveal").forEach(track);

    scan(document);
    document.documentElement.classList.add("js-reveal");

    // Content added later, such as a filtered catalogue, is picked up as it appears.
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.classList.contains("reveal")) track(node);
          scan(node);
        });
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);

  return null;
}
