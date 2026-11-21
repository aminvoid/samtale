import type { DateTimeFormatOptions } from "next-intl";
import type { AppLocale } from "./routing";

const RTL_LANGUAGES = new Set(["ar", "ckb", "dv", "fa", "he", "ps", "sd", "ug", "ur", "yi"]);

export type Direction = "ltr" | "rtl";

/** The only place direction is decided (ADR-0004 §2). */
export function getDirection(locale: string): Direction {
  return RTL_LANGUAGES.has(new Intl.Locale(locale).language) ? "rtl" : "ltr";
}

/** The numbering systems next-intl's format types accept. */
export type NumberingSystem = NonNullable<DateTimeFormatOptions["numberingSystem"]>;

const NUMBERING_SYSTEMS: ReadonlySet<string> = new Set<NumberingSystem>([
  "arab",
  "arabext",
  "bali",
  "beng",
  "deva",
  "fullwide",
  "gujr",
  "guru",
  "hanidec",
  "khmr",
  "knda",
  "laoo",
  "latn",
  "limb",
  "mlym",
  "mong",
  "mymr",
  "orya",
  "tamldec",
  "telu",
  "thai",
  "tibt",
]);

function isNumberingSystem(value: string): value is NumberingSystem {
  return NUMBERING_SYSTEMS.has(value);
}

/**
 * Digit style (D-2). Empty = CLDR default per locale: fa → "arabext" (۰–۹), en → "latn".
 * To show Latin digits in the Persian interface, change to: { fa: "latn" }.
 */
export const NUMBERING_SYSTEM_OVERRIDES: Partial<Record<AppLocale, NumberingSystem>> = {};

export function numberingSystemFor(locale: AppLocale): NumberingSystem {
  const override = NUMBERING_SYSTEM_OVERRIDES[locale];
  if (override !== undefined) return override;
  const resolved = new Intl.NumberFormat(locale).resolvedOptions().numberingSystem;
  // CLDR's default for every locale we support is in the list; Latin digits are the safe fallback.
  return isNumberingSystem(resolved) ? resolved : "latn";
}

/** Proposed: Gregorian dates in Persian words and digits. Owner to confirm (ADR-0004 §5). */
export const CALENDAR = "gregory";

/**
 * Whose words name the months in Persian dates (ADR-0004 §5). "fa" = Iranian Gregorian names (نوامبر);
 * "fa-AF" = Afghan (Dari) names (نومبر). Digits and calendar still come from the knobs above.
 */
export type DateLocale = "fa" | "fa-AF";
export const DATE_LOCALE: DateLocale = "fa";

const DATE_LOCALES: Partial<Record<AppLocale, DateLocale>> = { fa: DATE_LOCALE };

/** The Intl locale to format dates with for an interface locale. Dates go through src/lib/format. */
export function dateLocaleFor(locale: AppLocale): string {
  return DATE_LOCALES[locale] ?? locale;
}

export const TIME_ZONE = "Europe/Copenhagen";
