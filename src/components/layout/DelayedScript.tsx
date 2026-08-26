"use client";

import { useEffect, useState } from "react";
import Script, { type ScriptProps } from "next/script";

/**
 * Wraps next/script so the tag only mounts (and thus registers its
 * lazyOnload idle callback) after `delayMs`. Without this, multiple
 * lazyOnload scripts all fire in the same idle tick, piling their main
 * thread work into a single long task right as the browser goes idle.
 */
export default function DelayedScript({ delayMs = 0, ...scriptProps }: ScriptProps & { delayMs?: number }) {
  const [ready, setReady] = useState(delayMs === 0);

  useEffect(() => {
    if (delayMs === 0) return;
    const timer = setTimeout(() => setReady(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!ready) return null;
  return <Script {...scriptProps} />;
}
