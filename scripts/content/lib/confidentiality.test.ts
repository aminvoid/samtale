import { describe, expect, it } from "vitest";
import { confidentialityHits, examReferenceYears, scanForConfidentiality } from "./confidentiality";

describe("confidentialityHits", () => {
  it("treats written calendar dates as dates, not exam terms", () => {
    expect(examReferenceYears("تاریخ بررسی: ۱۸ نوامبر ۲۰۲۶")).toEqual(new Set());
    expect(examReferenceYears("checked 18. november 2026")).toEqual(new Set());
    expect(examReferenceYears("November 18, 2026")).toEqual(new Set());
    // Still caught without a day number.
    expect(examReferenceYears("نوامبر ۲۰۲۶")).toEqual(new Set(["2026"]));
    expect(examReferenceYears("Skriftlig 2026")).toEqual(new Set(["2026"]));
    expect(examReferenceYears("Nov–Dec 2026")).toEqual(new Set(["2026"]));
  });

  it("ignores year-like digits inside content-hashed file names", () => {
    expect(confidentialityHits("/audio/7a2026bc19336a71e8da.mp3")).toEqual([]);
    expect(confidentialityHits("/audio/20271ed1f92995695bee.mp3")).toEqual([]);
    expect(confidentialityHits("Skriftlig 2026")).toContain("2026");
  });

  it.each([
    ["Nov-Dec 2024", "Nov Dec 2023"],
    ["Nov–Dec 2024", "Maj–Jun 2024"],
    ["Nov—Dec 2024", "November—December 2023"],
    ["Nov−Dec 2024", "Nov−Dec 2023"],
    ["Nov/Dec 2024", "Maj/Juni 2024"],
    ["Nov／Dec\u202f2024", "Maj／Juni\u202f2024"],
    ["Nov. / Dec. 2024", "Nov. / Dec. 2023"],
    ["novembre 2024, nov. 2024", "novembre 2024"],
    ["dec. 2024", "decan 2024"],
    ["november 2024", "november 2023"],
    ["december 2024", "december 2023"],
    ["November/December 2024", "November/December 2023"],
    ["2024-nov", "2024-maj"],
    ["2024 / Nov–Dec", "2024 / maj–juni"],
    ["vinter 2024", "sommer 2024"],
    ["vinteren 2024", "vinteren 2023"],
    ["vinterprøven 2024", "vinterprøven 2023"],
    ["vintertermin 2024", "vintertermin 2023"],
    ["winter 2024", "winter 2023"],
    ["زمستانِ ۲۰۲۴", "زمستانِ ۲۰۲۳"],
    ["آزمون زمستان سال ۲۰۲۴", "آزمون بهار سال ۲۰۲۴"],
    ["نوامبر–دسامبر ۲۰۲۴", "نوامبر–دسامبر ۲۰۲۳"],
    ["نومبر و دسامبر ۲۰۲۴", "نومبر و دسامبر ۲۰۲۳"],
    ["دسامبر ٢٠٢٤", "دسامبر ٢٠٢٣"],
    ["۲۰۲۴، نوامبر", "۲۰۲۴، مه"],
    ["Skriftlig 2024", "Skriftlig maj 2024"],
    ["Skriftlig prøve (2024)", "Skriftlig prøve (maj 2024)"],
    ["Mundtlig: 2024", "Mundtlig: 2024-maj"],
    ["آزمون شفاهی ۲۰۲۴", "آزمون شفاهی ۲۰۲۴ ژوئن"],
    ["آزمون کتبی سال ۲۰۲۴", "آزمون کتبی سال ۲۰۲۳"],
  ])("flags %s and allows %s", (confidential, publicReference) => {
    expect(confidentialityHits(confidential)).not.toEqual([]);
    expect(confidentialityHits(publicReference)).toEqual([]);
  });

  it("still flags future years even without exam wording", () => {
    expect(confidentialityHits("2025، ۲۰۲۶، ٢٠٢٧")).toEqual(["2025", "2026", "2027"]);
    expect(confidentialityHits("2024 12025 20256 2026-11-20")).toEqual([]);
    expect(confidentialityHits("Skriftlig 2026")).toEqual(["2026", "Skriftlig 2026"]);
  });

  it("retains the path of a confidential reference and skips ISO process dates", () => {
    expect(
      scanForConfidentiality({ review: { checkedOn: "2026-11-20" }, items: ["2024-maj", "Nov–Dec 2024"] }),
    ).toEqual([{ path: "$.items[1]", hits: ["Nov Dec 2024"] }]);
  });
});

describe("examReferenceYears", () => {
  it.each([
    ["exam in 2026", "a plan in 2026"],
    ["exam year 2026", "calendar year 2026"],
    ["2026 exam", "2026 calendar"],
    ["PD3: 2026", "2026-11-20"],
    ["prøven i 2026", "prøven i a2026"],
    ["Prøve i Dansk 3 2026", "Dansk 3 2026"],
    ["eksamen 2026", "eksamen A2026B"],
    ["آزمون کتبی سال ۲۰۲۶", "تاریخ سال ۲۰۲۶"],
    ["Skriftlig\u00a0–\u00a02026", "imports2026"],
    ["Nov/Dec 2026", "Nov/Dec 20260"],
  ])("finds the year in %s and skips %s", (reference, otherYear) => {
    expect([...examReferenceYears(reference)]).toEqual(["2026"]);
    expect([...examReferenceYears(otherYear)]).toEqual([]);
  });
});
