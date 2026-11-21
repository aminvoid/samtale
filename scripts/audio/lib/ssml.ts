/**
 * Builds the SSML for one clip and keeps a map from SSML character positions back to the
 * display text (`text.da`), so word-boundary offsets can be stored against the text the
 * learner sees (ADR-0006 §2). The display text itself is never changed.
 */
import { findMatches, type Replacement } from "./lexicon.ts";

export interface SsmlSettings {
  /** Relative speaking rate, e.g. "-25%". Omitted means the voice's default rate. */
  rate?: string;
  /** Extra silence at sentence boundaries (standard neural voices only). */
  sentencePauseMs?: number;
}

export interface BuiltSsml {
  ssml: string;
  /** For each SSML index: display-text start, or -1 for markup. */
  displayStart: Int32Array;
  /** For each SSML index: display-text end (exclusive), or -1 for markup. */
  displayEnd: Int32Array;
  /** Characters Azure bills: everything except the `<speak>` and `<voice>` tags. */
  billableChars: number;
}

const XML_ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => XML_ESCAPES[c] ?? c);
}

const RATE = /^[+-]\d{1,2}%$/;

const breakTag = (ms: number) => `<break time="${String(ms)}ms"/>`;

/** Markup before the replacement (maps to nothing) and the replacement itself (maps to the written form). */
function replacementSsml(r: Replacement, written: string): { lead: string; body: string } {
  switch (r.kind) {
    case "say":
      return { lead: r.pauseBeforeMs === undefined ? "" : breakTag(r.pauseBeforeMs), body: escapeXml(r.text) };
    case "pause":
      return { lead: breakTag(r.ms), body: "" };
    case "phoneme":
      return { lead: "", body: `<phoneme alphabet="ipa" ph="${escapeXml(r.ipa)}">${escapeXml(written)}</phoneme>` };
  }
}

export function buildSsml(text: string, voice: string, settings: SsmlSettings = {}): BuiltSsml {
  if (settings.rate !== undefined && !RATE.test(settings.rate)) {
    throw new Error(`Invalid SSML rate "${settings.rate}" (expected e.g. "-25%")`);
  }
  if (!/^[\w.:-]+$/.test(voice)) throw new Error(`Invalid voice name "${voice}"`);

  const pause = settings.sentencePauseMs;
  const speakOpen =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"` +
    (pause === undefined ? "" : ` xmlns:mstts="http://www.w3.org/2001/mstts"`) +
    ` xml:lang="da-DK">`;
  const voiceOpen = `<voice name="${voice}">`;
  const innerOpen =
    (pause === undefined ? "" : `<mstts:silence type="Sentenceboundary" value="${String(Math.round(pause))}ms"/>`) +
    (settings.rate ? `<prosody rate="${settings.rate}">` : "");
  const innerClose = settings.rate ? "</prosody>" : "";
  const voiceClose = "</voice>";
  const speakClose = "</speak>";

  const parts: string[] = [];
  const starts: number[] = [];
  const ends: number[] = [];
  const push = (s: string, start: number, end: number) => {
    parts.push(s);
    for (let i = 0; i < s.length; i++) {
      starts.push(start);
      ends.push(end);
    }
  };
  // Each display character (escaped entities included) maps to itself.
  const pushText = (from: number, to: number) => {
    for (let i = from; i < to; i++) push(escapeXml(text.charAt(i)), i, i + 1);
  };

  push(speakOpen + voiceOpen + innerOpen, -1, -1);
  let cursor = 0;
  for (const m of findMatches(text)) {
    pushText(cursor, m.start);
    const { lead, body } = replacementSsml(m.replacement, text.slice(m.start, m.end));
    push(lead, -1, -1);
    push(body, m.start, m.end);
    cursor = m.end;
  }
  pushText(cursor, text.length);
  push(innerClose + voiceClose + speakClose, -1, -1);

  const ssml = parts.join("");
  const unbilled = speakOpen.length + voiceOpen.length + voiceClose.length + speakClose.length;
  return {
    ssml,
    displayStart: Int32Array.from(starts),
    displayEnd: Int32Array.from(ends),
    billableChars: ssml.length - unbilled,
  };
}
