"use client";

import { useLocale, useTranslations } from "next-intl";
import { useContext } from "react";
import { dateLocaleFor, numberingSystemFor } from "@/i18n/config";
import { LibraryProgressContext } from "./library-progress";

const millisecondsPerDay = 86_400_000;

export function PracticeStatus({ topicId }: { topicId: string }) {
  const t = useTranslations("library.progress");
  const locale = useLocale();
  const progress = useContext(LibraryProgressContext);

  if (progress === null) return null;
  if (progress.due.has(topicId)) {
    return (
      <span className="inline-block rounded-chip bg-accent-subtle px-2 text-caption text-accent">
        {t("due")}
      </span>
    );
  }

  const studied = progress.studied.get(topicId);
  if (studied === undefined) return null;
  const dateLocale = new Intl.Locale(dateLocaleFor(locale), { numberingSystem: numberingSystemFor(locale) });
  const format = new Intl.RelativeTimeFormat(dateLocale, { numeric: "auto" });
  const days = Math.round((Date.parse(studied.lastPractisedOn) - progress.today) / millisecondsPerDay);

  return (
    <span className="text-caption text-text-muted">
      {t.rich("practised", {
        count: studied.practiceCount,
        date: () => <time dateTime={studied.lastPractisedOn}>{format.format(days, "day")}</time>,
      })}
    </span>
  );
}
