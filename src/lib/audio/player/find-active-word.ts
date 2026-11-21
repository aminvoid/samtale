import type { WordTiming } from "../manifest-schema";

export type WordRange = { start: number; end: number };

/** Find the latest word that has started. Overlapping cues give precedence to the newer cue. */
export function findActiveWord(
  words: readonly WordTiming[] | undefined,
  currentTimeMs: number | null,
): WordRange | null {
  if (words === undefined || currentTimeMs === null) return null;

  let low = 0;
  let high = words.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const word = words[middle];
    if (word === undefined) return null;
    if (word[2] <= currentTimeMs) low = middle + 1;
    else high = middle;
  }

  const word = words[low - 1];
  return word !== undefined && currentTimeMs < word[3] ? { start: word[0], end: word[1] } : null;
}
