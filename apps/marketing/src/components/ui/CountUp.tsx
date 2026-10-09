"use client";

import { useEffect, useRef } from "react";

const DURATION_MS = 1400;

/** Shows a figure such as "1,500+" and counts up to it the first time it scrolls into view. */
export default function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    // The figure is split into what comes before the number, the number, and what follows it.
    const match = value.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!el || !match || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const [, prefix, digits, suffix] = match;
    const target = Number(digits.replace(/,/g, ""));
    const decimals = digits.includes(".") ? digits.split(".")[1].length : 0;
    const format = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    let frame = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / DURATION_MS, 1);
          // Fast at first, then settling gently on the final figure.
          const eased = 1 - Math.pow(1 - progress, 4);
          el.textContent = progress < 1 ? `${prefix}${format(target * eased)}${suffix}` : value;
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = value;
    };
  }, [value]);

  // The final figure is in the page from the start, so it is correct without JavaScript and for search engines.
  return <span ref={ref} className="tabular-nums">{value}</span>;
}
