/**
 * How the voices should read Danish text that TTS gets wrong or that reads badly
 * (OQ-S4; TTS hints in docs/reviews/2026-11-20-danish-review-pilot.md; .claude/rules/speech-audio.md).
 *
 * The display text never changes; only the SSML sent to Azure does.
 * - `say`: the spoken form goes into the SSML as plain text. This has the effect of
 *   `<sub alias>`, but `<sub>` breaks Azure's word-boundary offsets for the rest of the clip
 *   (textOffset -1 and markup inside the event text; observed 2026-11-20 on
 *   da-DK-ChristelNeural). Every character of the spoken form maps back to the whole written
 *   form, so word highlighting still points at the text the learner sees.
 * - `pause`: replaces the written character (a dash) with `<break>` (billed as markup).
 * - `phoneme`: wraps the written form in an IPA `<phoneme>` (standard neural voices only).
 *
 * Rules marked `enabled: false` are the reviewer's conditional hints ("if it stumbles", "fallback").
 * Switch one on only after the listening test shows the problem. Enabled rules are part of
 * LEXICON_VERSION and so of every clip hash: a change regenerates exactly the affected clips.
 */
import { createHash } from "node:crypto";

export type Rule =
  | {
      id: string;
      kind: "say";
      pattern: RegExp;
      spoken: string;
      /** Silence before the spoken form (a `<break>`, billed as markup). */
      pauseBeforeMs?: number;
      /** Capitalise the spoken form when the written form starts a sentence ("Fx" → "For eksempel"). */
      followCase?: boolean;
      enabled: boolean;
      source: string;
    }
  | { id: string; kind: "pause"; pattern: RegExp; ms: number; enabled: boolean; source: string }
  | { id: string; kind: "phoneme"; pattern: RegExp; ipa: string; enabled: boolean; source: string };

/** Not part of a longer word on either side. */
const word = (body: string) => new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, "gu");
const abbr = (written: string) => {
  const first = written.charAt(0);
  const rest = written.slice(1).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return word(`[${first}${first.toUpperCase()}]${rest}`);
};

const SPEECH_RULES = ".claude/rules/speech-audio.md";
const REVIEW = "docs/reviews/2026-11-20-danish-review-pilot.md";
const EXAM_REVIEW = "docs/reviews/2026-11-20-exam-review-mock-rules.md";
const INTRO_REVIEW = "docs/reviews/2026-11-21-danish-review-intros.md";

export const RULES: readonly Rule[] = [
  // Abbreviations from the speech rules (only fx occurs in the pilot; the answers write "for eksempel").
  { id: "f.eks.", kind: "say", pattern: abbr("f.eks."), spoken: "for eksempel", followCase: true, enabled: true, source: SPEECH_RULES },
  { id: "fx", kind: "say", pattern: abbr("fx"), spoken: "for eksempel", followCase: true, enabled: true, source: REVIEW },
  { id: "bl.a.", kind: "say", pattern: abbr("bl.a."), spoken: "blandt andet", followCase: true, enabled: true, source: SPEECH_RULES },
  { id: "ca.", kind: "say", pattern: abbr("ca."), spoken: "cirka", followCase: true, enabled: true, source: SPEECH_RULES },
  { id: "osv.", kind: "say", pattern: abbr("osv."), spoken: "og så videre", followCase: true, enabled: true, source: SPEECH_RULES },
  { id: "mv.", kind: "say", pattern: abbr("mv."), spoken: "med videre", followCase: true, enabled: true, source: SPEECH_RULES },
  { id: "pga.", kind: "say", pattern: abbr("pga."), spoken: "på grund af", followCase: true, enabled: true, source: SPEECH_RULES },
  // Danish review, TTS hints table.
  // Exam review #5 / S2 (supersedes the Danish review's comma version): the question part,
  // a 0.6–1 s pause, then both alternatives, never only "Hvorfor?". No comma before "eller".
  // Also matches the older variant "Hvorfor / hvorfor ikke?".
  {
    id: "hvorfor-hvorfor-ikke",
    kind: "say",
    pattern: /Hvorfor\s*\??\s*\/\s*[Hh]vorfor ikke\s*\?/gu,
    spoken: "Hvorfor eller hvorfor ikke?",
    pauseBeforeMs: 800,
    enabled: true,
    source: EXAM_REVIEW,
  },
  { id: "10-sekunder", kind: "say", pattern: word("10 sekunder"), spoken: "ti sekunder", enabled: true, source: REVIEW },
  { id: "PD3", kind: "say", pattern: word("PD3"), spoken: "pe de tre", enabled: true, source: REVIEW },
  // Danish review of the app-written intros, TTS hints table. Longer forms first: on a tie at the
  // same start, the earlier rule wins (see findMatches).
  { id: "SU-lån", kind: "say", pattern: word("SU-lån"), spoken: "es u lån", enabled: true, source: INTRO_REVIEW },
  { id: "SU", kind: "say", pattern: word("SU"), spoken: "es u", enabled: true, source: INTRO_REVIEW },
  { id: "sms-lån", kind: "say", pattern: word("[Ss][Mm][Ss]-lån"), spoken: "es em es lån", enabled: true, source: INTRO_REVIEW },
  // Standalone lowercase "it" in Danish text is the noun (information technology), not the English pronoun.
  { id: "it", kind: "say", pattern: word("it"), spoken: "i te", enabled: true, source: INTRO_REVIEW },
  { id: "55-år", kind: "say", pattern: word("55 år"), spoken: "femoghalvtreds år", enabled: true, source: INTRO_REVIEW },
  // " – fx" in 2024-maj-a.general.followup1; applied to every spaced en dash for consistency.
  { id: "en-dash-pause", kind: "pause", pattern: /(?<= )–(?= )/gu, ms: 250, enabled: true, source: REVIEW },
  // Conditional hints: off until the listening test shows the problem.
  {
    id: "social-og-sundhedsassistenter",
    kind: "say",
    pattern: word("social- og sundhedsassistenter"),
    spoken: "social og sundhedsassistenter",
    enabled: false,
    source: `${REVIEW} (if it stumbles)`,
  },
  {
    id: "jord-og-betonarbejdere",
    kind: "say",
    pattern: word("jord- og betonarbejdere"),
    spoken: "jord og betonarbejdere",
    enabled: false,
    source: `${REVIEW} (if needed)`,
  },
  { id: "feedback", kind: "say", pattern: word("feedback"), spoken: "fiidbæk", enabled: false, source: `${REVIEW} (if mispronounced)` },
  {
    id: "overordnet",
    kind: "phoneme",
    pattern: word("overordnet"),
    ipa: "ˈɒwɐˌɒːˀdnəð",
    enabled: false,
    source: `${REVIEW} (fallback for the stress)`,
  },
];

export const LEXICON_VERSION = createHash("sha256")
  .update(
    JSON.stringify(
      RULES.filter((r) => r.enabled).map((r) => ({ ...r, pattern: `${r.pattern.source}/${r.pattern.flags}` })),
    ),
  )
  .digest("hex")
  .slice(0, 12);

export type Replacement =
  | { kind: "say"; text: string; pauseBeforeMs?: number }
  | { kind: "pause"; ms: number }
  | { kind: "phoneme"; ipa: string };

export interface Match {
  start: number;
  end: number;
  ruleId: string;
  replacement: Replacement;
}

function replacementFor(rule: Rule, matched: string, rest: string): Replacement {
  switch (rule.kind) {
    case "pause":
      return { kind: "pause", ms: rule.ms };
    case "phoneme":
      return { kind: "phoneme", ipa: rule.ipa };
    case "say": {
      let text = rule.spoken;
      // "Fx" at the start of a sentence → "For eksempel".
      const first = matched.charAt(0);
      if (rule.followCase === true && first !== first.toLowerCase()) {
        text = text.charAt(0).toUpperCase() + text.slice(1);
      }
      // An abbreviation that also ends the sentence keeps its full stop, so the voice pauses.
      if (matched.endsWith(".") && !text.endsWith(".") && (rest === "" || /^\s+\p{Lu}/u.test(rest))) text += ".";
      return rule.pauseBeforeMs === undefined ? { kind: "say", text } : { kind: "say", text, pauseBeforeMs: rule.pauseBeforeMs };
    }
  }
}

/** Every enabled rule's matches, in text order, without overlaps (the earlier rule in RULES wins a tie). */
export function findMatches(text: string, rules: readonly Rule[] = RULES): Match[] {
  const found: Array<Match & { order: number }> = [];
  rules.forEach((rule, order) => {
    if (!rule.enabled) return;
    for (const m of text.matchAll(rule.pattern)) {
      const end = m.index + m[0].length;
      found.push({ start: m.index, end, ruleId: rule.id, replacement: replacementFor(rule, m[0], text.slice(end)), order });
    }
  });
  found.sort((a, b) => a.start - b.start || a.order - b.order);
  const result: Match[] = [];
  for (const m of found) {
    const last = result.at(-1);
    if (last && m.start < last.end) continue;
    result.push({ start: m.start, end: m.end, ruleId: m.ruleId, replacement: m.replacement });
  }
  return result;
}
