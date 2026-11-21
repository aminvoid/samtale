"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/**
 * Throws on the client only: prerender and hydration use the server snapshot (false), then React
 * re-renders with the client snapshot (true) and the segment's error.tsx must catch the error.
 */
export function ThrowAfterMount() {
  const onClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (onClient) throw new Error("E2E: intentional render error (test-error route)");
  return null;
}
