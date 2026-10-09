"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";

type Options<T extends string> = {
  // When given, anything else in the address bar is ignored and the fallback is used.
  allowed?: readonly T[];
  // Write the value even when it equals the fallback, for when the fallback itself depends on the page.
  always?: boolean;
};

// Like useState, but the value is mirrored into the page address, so Back, refresh and a shared link all return to the same view.
// The address is rewritten in place without a server round-trip or a new history entry.
export function useUrlState<T extends string = string>(key: string, fallback: T, options: Options<T> = {}): [T, (next: T) => void] {
  const { allowed, always = false } = options;
  const params = useSearchParams();

  const [value, setValue] = useState<T>(() => {
    const fromUrl = params.get(key) as T | null;
    if (fromUrl === null) return fallback;
    return !allowed || allowed.includes(fromUrl) ? fromUrl : fallback;
  });

  const set = useCallback(
    (next: T) => {
      setValue(next);
      const query = new URLSearchParams(window.location.search);
      if (next === "" || (next === fallback && !always)) query.delete(key);
      else query.set(key, next);
      const text = query.toString();
      window.history.replaceState(null, "", text ? `${window.location.pathname}?${text}` : window.location.pathname);
    },
    [key, fallback, always]
  );

  return [value, set];
}
