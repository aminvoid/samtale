"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

export function useReviewNavigation(hasRecordings: boolean) {
  const locale = useLocale();
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    if (!hasRecordings) return;
    const prefix = `/${locale}`;
    function guard(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (
        !(link instanceof HTMLAnchorElement) ||
        (link.target && link.target !== "_self") ||
        link.hasAttribute("download")
      )
        return;
      const url = new URL(link.href);
      if (
        url.origin !== window.location.origin ||
        (!url.pathname.startsWith(`${prefix}/`) && url.pathname !== prefix)
      )
        return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      setNext((url.pathname.slice(prefix.length) || "/") + url.search + url.hash);
    }

    document.addEventListener("click", guard, true);
    return () => {
      document.removeEventListener("click", guard, true);
    };
  }, [hasRecordings, locale]);

  return {
    next,
    clear: () => {
      setNext(null);
    },
  };
}
