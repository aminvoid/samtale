/**
 * Confidentiality rule (PRD R5 / US-064; pd3-exam-expert review 2026-11-18).
 *
 * Exam material from the winter 2024 term onwards is confidential. Booklet text that refers to a
 * later exam (e.g. a margin note "… در Skriftlig 2026 هم آمد") could leak it. This rule flags, in ANY
 * string field:
 *   - any year 2025 or later (Latin, Persian or Arabic-Indic digits),
 *   - written/oral exam references from 2024 onwards, unless explicitly in the public spring term,
 *   - winter 2024 references in Danish, English month abbreviations, or Persian.
 * Public content must have no hits. Internal margin notes may, but then can never be made public.
 * Hits on documents dated 2025+ (e.g. a 2025 guidance note) are expected noise: a human decides.
 */
const YEAR = String.raw`20\d{2}`;
const WORD = String.raw`[\p{L}\p{M}\p{N}_]`;
const WINTER =
  "(?:nov(?:ember)?(?: dec(?:ember)?)?|dec(?:ember)?|vinter(?:en|prøven?|termin(?:en)?|eksamen)?|winter|زمستان|(?:نوامبر|نومبر)(?: (?:و )?دسامبر)?|دسامبر)";
const EXAM_MODE =
  "(?:(?:skriftlig|mundtlig)(?:e| ?prøven?| eksamen)?|(?:آزمون|امتحان) (?:کتبی|شفاهی)|کتبی|شفاهی)";
const EXAM = `(?:${EXAM_MODE}|eksamen(?:en)?|prøven?(?: i dansk 3)?|exam(?:ination)?|pd ?3|آزمون|امتحان)`;
const BEFORE_YEAR = "(?: (?:i|in|fra|from|of|year|سال|در|در سال))? ";
const SPRING_2024 =
  /(?<![\p{L}\p{M}\p{N}_])(?:(?:maj|may|juni|june|مه|می|ژوئن) 2024|2024 (?:maj|may|juni|june|مه|می|ژوئن))(?![\p{L}\p{M}\p{N}_])/giu;

function referencesBeforeYear(context: string): RegExp {
  return new RegExp(`(?<!${WORD})${context}${BEFORE_YEAR}(${YEAR})(?!${WORD})`, "giu");
}

function referencesAfterYear(context: string): RegExp {
  return new RegExp(`(?<!${WORD})(${YEAR}) ${context}(?!${WORD})`, "giu");
}

const MONTH =
  "(?:januar|february|februar|january|march|marts|april|maj|may|juni|june|juli|july|august|september|oktober|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|okt|oct|nov|dec|ژانویه|فوریه|مارس|آوریل|مه|می|ژوئن|ژوئیه|اوت|سپتامبر|اکتبر|نوامبر|دسامبر|جنوری|فبروری|مارچ|اپریل|جون|جولای|اگست|سپتمبر|اکتوبر|نومبر|دسمبر)";
/** A day number next to a month name and a year: a calendar date, never an exam term. */
const CALENDAR_DATE = new RegExp(
  String.raw`(?<![\p{L}\p{N}])(?:\d{1,2}\.?\s+${MONTH}\.?,?\s+20\d{2}|${MONTH}\.?\s+\d{1,2},?\s+20\d{2})(?![\p{L}\p{N}])`,
  "giu",
);

const MODE_BEFORE_YEAR = referencesBeforeYear(EXAM_MODE);
const WINTER_REFERENCES = [referencesBeforeYear(WINTER), referencesAfterYear(WINTER)];
const EXAM_REFERENCES = [referencesBeforeYear(EXAM), referencesAfterYear(EXAM), ...WINTER_REFERENCES];

function latinDigits(text: string): string {
  return text
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

export function bareExamYear(text: string): string | undefined {
  const year = latinDigits(text.trim());
  return /^20\d{2}$/.test(year) ? year : undefined;
}

function normaliseReference(text: string): string {
  return (
    latinDigits(text)
      .normalize("NFC")
      .replace(/[\p{Bidi_Control}\u0640]/gu, "")
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[ِٔ]/gu, "")
      .replace(/\p{Dash}/gu, "-")
      // Process metadata uses ISO dates and timestamps.
      .replace(/(?<![\d-])\d{4}-\d{2}-\d{2}(?![\d-])/g, " ")
      // Written calendar dates ("18 نوامبر 2026", "18. november 2026", "November 18, 2026") are
      // review/check dates, not exam terms: exam references never carry a day number.
      .replace(CALENDAR_DATE, " ")
      .replace(/[\s/\u2044\u2215\uFF0F.,،:()\u200b\u200c-]+/g, " ")
  );
}

/** Finds years adjacent to an exam or session name, for matching otherwise ambiguous canaries. */
export function examReferenceYears(text: string): Set<string> {
  const s = normaliseReference(text);
  const years = new Set<string>();
  for (const pattern of EXAM_REFERENCES) {
    for (const [, year] of s.matchAll(pattern)) if (year !== undefined) years.add(year);
  }
  return years;
}

export function confidentialityHits(text: string): string[] {
  const s = normaliseReference(text);
  const hits = new Set<string>();
  // A year is a standalone token: no letter or digit on either side. Without the letter check,
  // content-hashed audio file names such as "/audio/…a2026b….mp3" were flagged as the year 2026.
  for (const [year] of s.matchAll(/(?<![\p{L}\p{N}])20\d{2}(?![\p{L}\p{N}])/gu)) {
    if (Number(year) >= 2025) hits.add(year);
  }
  const springYears = new Set(
    Array.from(s.matchAll(SPRING_2024), (match) => match.index + match[0].indexOf("2024")),
  );
  for (const match of s.matchAll(MODE_BEFORE_YEAR)) {
    const [reference, year] = match;
    if (Number(year) > 2024 || (year === "2024" && !springYears.has(match.index + reference.length - 4))) {
      hits.add(reference);
    }
  }
  for (const pattern of WINTER_REFERENCES) {
    for (const [reference, year] of s.matchAll(pattern)) if (year === "2024") hits.add(reference);
  }
  return [...hits];
}

/**
 * Walk any JSON value and return [path, hits] for every string with a hit. The only exemption is
 * our own process metadata: a value that is exactly an ISO date under a key ending in "On"
 * (checkedOn, reviewedOn, retrievedOn). Review notes are scanned like everything else.
 */
export function scanForConfidentiality(value: unknown, path = "$"): Array<{ path: string; hits: string[] }> {
  const out: Array<{ path: string; hits: string[] }> = [];
  const walk = (v: unknown, p: string) => {
    if (typeof v === "string" && /On$/.test(p) && /^\d{4}-\d{2}-\d{2}$/.test(v)) return;
    if (typeof v === "string") {
      const h = confidentialityHits(v);
      if (h.length) out.push({ path: p, hits: h });
    } else if (Array.isArray(v)) {
      v.forEach((x: unknown, i) => {
        walk(x, `${p}[${i}]`);
      });
    } else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${p}.${k}`);
  };
  walk(value, path);
  return out;
}
