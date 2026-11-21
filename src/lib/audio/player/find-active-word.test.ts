import { describe, expect, it } from "vitest";
import type { WordTiming } from "../manifest-schema";
import { findActiveWord } from "./find-active-word";

const words: WordTiming[] = [
  [0, 3, 50, 200],
  [4, 8, 300, 500],
  [9, 14, 500, 750],
];

describe("findActiveWord", () => {
  it("returns UTF-16 text offsets for start-inclusive, end-exclusive timing intervals", () => {
    expect(findActiveWord(words, 50)).toEqual({ start: 0, end: 3 });
    expect(findActiveWord(words, 199)).toEqual({ start: 0, end: 3 });
    expect(findActiveWord(words, 499)).toEqual({ start: 4, end: 8 });
    expect(findActiveWord(words, 500)).toEqual({ start: 9, end: 14 });
  });

  it("clears the highlight in gaps and outside playback", () => {
    for (const time of [0, 49, 200, 299, 750, 1000, NaN, null]) {
      expect(findActiveWord(words, time)).toBeNull();
    }
    expect(findActiveWord([], 50)).toBeNull();
    expect(findActiveWord(undefined, 50)).toBeNull();
  });

  it("advances to the later cue when timings overlap", () => {
    const overlapping: WordTiming[] = [
      [0, 3, 0, 500],
      [4, 7, 400, 600],
    ];
    expect(findActiveWord(overlapping, 400)).toEqual({ start: 4, end: 7 });
  });
});
