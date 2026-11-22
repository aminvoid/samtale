"use client";

import { useLocale } from "next-intl";
import { startTransition, useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";

export function useReviewNavigation(status: "loading" | "unkept" | "free") {
  const locale = useLocale();
  const router = useRouter();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (status === "free" && target !== null) {
      startTransition(() => {
        setTarget(null);
        router.push(target);
      });
    }
  }, [status, target, router]);

  useLayoutEffect(() => {
    if (status === "free") return;
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
      setTarget((url.pathname.slice(prefix.length) || "/") + url.search + url.hash);
    }

    document.addEventListener("click", guard, true);
    return () => {
      document.removeEventListener("click", guard, true);
    };
  }, [status, locale]);

  return {
    next: status === "unkept" ? target : null,
    clear: () => {
      setTarget(null);
    },
  };
}
