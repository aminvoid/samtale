"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";
import { getPathname, usePathname } from "@/i18n/navigation";
import { hasInProgressMarker } from "@/lib/progress/in-progress-marker";

const runningRoutes = ["/mock/practice", "/mock/exam"];

/**
 * Mounted on every page by the locale layout, so it stays tiny: it checks session storage directly
 * and loads the progress store (IndexedDB and its schemas) only when a leftover marker exists, not on
 * every page view (home JS budget, ADR-0014).
 */
export function ClearMockReloadMarker() {
  const pathname = usePathname();
  const locale = useLocale();
  useEffect(() => {
    if (runningRoutes.includes(pathname) || !hasInProgressMarker()) return;
    let active = true;
    void import("@/lib/progress/create-progress-store").then(
      ({ createProgressStore }) => {
        if (!active) return;
        // The browser may have navigated before React has cleaned up this effect.
        const currentPath = window.location.pathname.replace(/\/$/, "");
        if (runningRoutes.some((href) => getPathname({ locale, href }) === currentPath)) return;
        void createProgressStore().clearInProgressMarker();
      },
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [locale, pathname]);
  return null;
}
