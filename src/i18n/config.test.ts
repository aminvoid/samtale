import { describe, expect, it, vi } from "vitest";
import {
  DATE_LOCALE,
  dateLocaleFor,
  getDirection,
  NUMBERING_SYSTEM_OVERRIDES,
  numberingSystemFor,
} from "./config";
import { buildFormats } from "./formats";

describe("i18n config", () => {
  it("derives direction from the locale", () => {
    expect(getDirection("fa")).toBe("rtl");
    expect(getDirection("ar")).toBe("rtl");
    expect(getDirection("en")).toBe("ltr");
    expect(getDirection("da")).toBe("ltr");
  });

  it("uses Persian digits for fa by default (D-2)", () => {
    expect(numberingSystemFor("fa")).toBe("arabext");
    const { integer, year } = buildFormats("fa").number;
    expect(new Intl.NumberFormat("fa", integer).format(51)).toBe("۵۱");
    expect(new Intl.NumberFormat("fa", year).format(2016)).toBe("۲۰۱۶");
  });

  it("uses Latin digits when Intl reports a numbering system unsupported by the named formats", () => {
    const resolved = new Intl.NumberFormat("fa").resolvedOptions();
    vi.spyOn(Intl.NumberFormat.prototype, "resolvedOptions").mockReturnValue({
      ...resolved,
      numberingSystem: "mathsans",
    });
    expect(numberingSystemFor("fa")).toBe("latn");
    expect(new Intl.NumberFormat("fa", buildFormats("fa").number.integer).format(51)).toBe("51");
  });

  it("switches every named format to Latin digits with the one-line override (D-2)", () => {
    NUMBERING_SYSTEM_OVERRIDES.fa = "latn";
    try {
      expect(numberingSystemFor("fa")).toBe("latn");
      expect(new Intl.NumberFormat("fa", buildFormats("fa").number.integer).format(51)).toBe("51");
    } finally {
      delete NUMBERING_SYSTEM_OVERRIDES.fa;
    }
    expect(numberingSystemFor("fa")).toBe("arabext");
  });

  // The expected strings come from the ICU data in Node 26 (CLDR). If a Node/ICU update changes a month's
  // spelling, check the new output with persian-localization-reviewer before updating; it isn't a bug here.
  it("formats dates in the Gregorian calendar", () => {
    const { date } = buildFormats("fa").dateTime;
    expect(
      new Intl.DateTimeFormat("fa", { ...date, timeZone: "UTC" }).format(new Date("2026-11-19T12:00:00Z")),
    ).toBe("۱۹ نوامبر ۲۰۲۶");
  });

  it("names months with the DATE_LOCALE knob: fa by default, fa-AF as the option", () => {
    expect(DATE_LOCALE).toBe("fa");
    expect(dateLocaleFor("fa")).toBe("fa");
    const { date } = buildFormats("fa").dateTime;
    const day = new Date("2026-11-19T12:00:00Z");
    const format = (locale: string) =>
      new Intl.DateTimeFormat(locale, { ...date, timeZone: "UTC" }).format(day);
    expect(format(dateLocaleFor("fa"))).toBe("۱۹ نوامبر ۲۰۲۶");
    // The fa-AF option keeps the Gregorian calendar and Persian digits, with Afghan month names.
    expect(format("fa-AF")).toBe("۱۹ نومبر ۲۰۲۶");
  });
});
