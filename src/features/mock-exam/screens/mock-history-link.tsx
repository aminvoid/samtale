"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { createLazyProgressStore } from "@/lib/progress/lazy-stores";
import { cn } from "@/lib/utils/cn";
import { useMockHandoff } from "./mock-handoff";
import { mockTextLink } from "./presentation";

export function MockHistoryLink() {
  const t = useTranslations("mock.start");
  const { destination } = useMockHandoff();
  const save = destination?.saveResult;
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    let active = true;
    const store = createLazyProgressStore();
    const listAttempts = () => (active ? store.listAttempts() : undefined);
    async function read() {
      await save;
      let attempts = await listAttempts();
      if (attempts?.ok === false && attempts.reason === "unavailable") {
        attempts = await listAttempts();
      }
      if (active) setHasHistory(attempts?.ok === true && attempts.value.length > 0);
    }
    void read();
    return () => {
      active = false;
    };
  }, [save]);

  return hasHistory ? (
    <Link href="/progress#history" className={cn(mockTextLink, "justify-self-start")}>
      {t("history")}
    </Link>
  ) : null;
}
