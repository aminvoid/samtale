"use client";

import { useEffect, useRef } from "react";
import { useStickyOffsets } from "@/components/ui/use-sticky-offsets";
import { usePathname } from "@/i18n/navigation";

export function ShellEffects() {
  useStickyOffsets();
  const pathname = usePathname();
  const previous = useRef(pathname);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    if (document.activeElement?.closest("[data-keep-focus]")) return;
    const headings = document.querySelectorAll<HTMLElement>("#main h1");
    const heading = Array.from(headings).find((element) => element.getClientRects().length > 0);
    heading?.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}
