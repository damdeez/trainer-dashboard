"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR-safe media query hook built on useSyncExternalStore: subscribes to the
 * MediaQueryList and reads its current match on every render. The server
 * snapshot is always false, so the first client render matches the server
 * (no hydration mismatch) and then settles to the real value.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Tailwind's `md` breakpoint (768px). True on desktop-ish widths. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 768px)");
}
