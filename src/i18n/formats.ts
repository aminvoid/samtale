import type { Formats } from "next-intl";
import { CALENDAR, numberingSystemFor } from "./config";
import type { AppLocale } from "./routing";

export function buildFormats(locale: AppLocale) {
  const numberingSystem = numberingSystemFor(locale);
  return {
    number: {
      integer: { maximumFractionDigits: 0, numberingSystem },
      year: { useGrouping: false, numberingSystem },
      twoDigit: { minimumIntegerDigits: 2, numberingSystem },
    },
    dateTime: {
      date: { day: "numeric", month: "long", year: "numeric", calendar: CALENDAR, numberingSystem },
      dayMonth: { day: "numeric", month: "long", calendar: CALENDAR, numberingSystem },
    },
  } satisfies Formats;
}

export type AppFormats = ReturnType<typeof buildFormats>;
