"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { createProgressStore } from "@/lib/progress/create-progress-store";

export function ClearMockReloadMarker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname === "/mock/practice" || pathname === "/mock/exam") return;
    void createProgressStore().clearInProgressMarker();
  }, [pathname]);
  return null;
}
