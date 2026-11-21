/**
 * Confidentiality rule (PRD R5 / US-064; pd3-exam-expert review 2026-11-18).
 *
 * Exam material from the winter 2024 term onwards is confidential. Booklet text that refers to a
 * later exam (e.g. a margin note "… در Skriftlig 2026 هم آمد") could leak it. This rule flags, in ANY
 * string field:
 *   - any year 2025 or later (Latin or Persian digits),
 *   - "Skriftlig"/"Mundtlig" followed by a year from 2024 on,
 *   - Nov-Dec / november / december / vinter + 2024.
 * Public content must have no hits. Internal margin notes may, but then can never be made public.
 * Hits on documents dated 2025+ (e.g. a 2025 guidance note) are expected noise: a human decides.
 */
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function latinDigits(s: string): string {
  return Array.from(s).map((c) => {
    const i = PERSIAN_DIGITS.indexOf(c);
    return i >= 0 ? String(i) : c;
  }).join("");
}

export function confidentialityHits(text: string): string[] {
  // Exact ISO calendar dates (2026-11-20) are the pipeline's own process metadata (review dates,
  // review file names), never an exam reference; they are removed before matching.
  const s = latinDigits(text).replace(/(?<![\d-])\d{4}-\d{2}-\d{2}(?![\d-])/g, " ");
  const hits: string[] = [];
  for (const m of s.matchAll(/(?<!\d)(20\d\d)(?!\d)/g)) if (Number(m[1]) >= 2025) hits.push(m[1]!);
  for (const m of s.matchAll(/\b(skriftlig|mundtlig)\s+(20\d\d)/gi)) if (Number(m[2]) >= 2024) hits.push(m[0]);
  for (const m of s.matchAll(/\b(nov-dec|november|december|vinter\w*)\s+2024\b/gi)) hits.push(m[0]);
  return [...new Set(hits)];
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
