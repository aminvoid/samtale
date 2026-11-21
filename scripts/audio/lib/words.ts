/**
 * Turns Azure word-boundary events into manifest word tuples that index the DISPLAY text
 * (ADR-0006 §2): [charStart, charEnd, audioStartMs, audioEndMs].
 */
import type { BuiltSsml } from "./ssml.ts";

/** What the synthesizer adapter reports per boundary (times already in ms). */
export interface BoundaryEvent {
  kind: "word" | "punctuation" | "sentence";
  text: string;
  /** Offset in the SSML string, or -1 when the service didn't give one. */
  textOffset: number;
  wordLength: number;
  audioOffsetMs: number;
  durationMs: number;
}

export type WordTuple = [charStart: number, charEnd: number, audioStartMs: number, audioEndMs: number];

const round = (n: number) => Math.round(n);

function viaOffset(e: BoundaryEvent, built: BuiltSsml): [number, number] | null {
  const { displayStart, displayEnd } = built;
  if (e.textOffset < 0 || e.wordLength <= 0) return null;
  const last = e.textOffset + e.wordLength - 1;
  if (last >= displayStart.length) return null;
  // Characters of an expanded abbreviation map to the abbreviation as a whole; markup (-1)
  // means the offset is unusable.
  const start = displayStart[e.textOffset] ?? -1;
  const end = displayEnd[last] ?? -1;
  if (start < 0 || end < 0 || end <= start) return null;
  return [start, end];
}

const isWordChar = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}]/u.test(c);

/** Whole-word, case-insensitive search forward from the cursor ("for" must not match "Hvorfor"). */
function viaSearch(e: BoundaryEvent, text: string, cursor: number): [number, number] | null {
  const needle = e.text.trim().toLocaleLowerCase("da-DK");
  if (!needle) return null;
  const hay = text.toLocaleLowerCase("da-DK");
  for (let at = hay.indexOf(needle, cursor); at >= 0; at = hay.indexOf(needle, at + 1)) {
    if (!isWordChar(hay[at - 1]) && !isWordChar(hay[at + needle.length])) return [at, at + needle.length];
  }
  return null;
}

/**
 * Maps word events to display ranges. Uses the SSML offset when the service gives a usable
 * one, otherwise searches forward from the previous word. Several events inside one expanded
 * abbreviation ("for", "eksempel" for "fx") collapse into one tuple spanning the abbreviation.
 */
export function toWordTuples(events: readonly BoundaryEvent[], built: BuiltSsml, displayText: string): WordTuple[] {
  const tuples: WordTuple[] = [];
  let cursor = 0;
  for (const e of events) {
    if (e.kind !== "word") continue;
    const range = viaOffset(e, built) ?? viaSearch(e, displayText, cursor);
    if (!range) continue;
    const [start, end] = range;
    const audioStart = round(e.audioOffsetMs);
    const audioEnd = round(e.audioOffsetMs + e.durationMs);
    const prev = tuples.at(-1);
    if (prev && prev[0] === start && prev[1] === end) {
      prev[3] = Math.max(prev[3], audioEnd);
      continue;
    }
    if (prev && start < prev[1]) continue; // never go backwards or overlap
    tuples.push([start, end, audioStart, audioEnd]);
    cursor = end;
  }
  return tuples;
}
