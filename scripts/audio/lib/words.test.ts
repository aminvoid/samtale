import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { buildSsml } from "./ssml";
import { type BoundaryEvent, toWordTuples } from "./words";

const fixture = z
  .object({
    voice: z.string(),
    text: z.string(),
    ssml: z.string(),
    boundaries: z.array(
      z.object({
        kind: z.enum(["word", "punctuation", "sentence"]),
        text: z.string(),
        textOffset: z.number(),
        wordLength: z.number(),
        audioOffsetMs: z.number(),
        durationMs: z.number(),
      }),
    ),
  })
  .parse(JSON.parse(readFileSync(resolve(import.meta.dirname, "fixtures/q1-christel-boundaries.json"), "utf8")));

describe("toWordTuples with events recorded from Azure", () => {
  const built = buildSsml(fixture.text, fixture.voice);

  it("builds the same SSML the recording was made with", () => {
    expect(built.ssml).toBe(fixture.ssml);
  });

  it("maps every word to the display text, with fx as one word", () => {
    const tuples = toWordTuples(fixture.boundaries, built, fixture.text);
    const words = tuples.map(([s, e]) => fixture.text.slice(s, e));
    expect(words).toEqual([
      "Der", "mangler", "arbejdskraft", "i", "sundhedssektoren", "fx", "sygeplejersker", "og", "social",
      "og", "sundhedsassistenter", "Hvorfor", "tror", "du", "der", "gør", "det",
    ]);
    const fx = tuples[5]!;
    expect(fx[2]).toBe(2575); // starts with "for"
    expect(fx[3]).toBe(3113); // ends with "eksempel"
  });

  it("produces ascending, non-overlapping timings", () => {
    const tuples = toWordTuples(fixture.boundaries, built, fixture.text);
    for (let i = 1; i < tuples.length; i++) {
      expect(tuples[i]![0]).toBeGreaterThanOrEqual(tuples[i - 1]![1]);
      expect(tuples[i]![2]).toBeGreaterThanOrEqual(tuples[i - 1]![2]);
    }
  });
});

describe("toWordTuples fallbacks", () => {
  const text = "Hvorfor tror du det?";
  const built = buildSsml(text, "da-DK-JeppeNeural");
  const ev = (t: string, ms: number): BoundaryEvent => ({
    kind: "word",
    text: t,
    textOffset: -1,
    wordLength: t.length,
    audioOffsetMs: ms,
    durationMs: 100,
  });

  it("searches whole words forward when the offset is missing", () => {
    const tuples = toWordTuples([ev("Hvorfor", 0), ev("for", 150), ev("tror", 200)], built, text);
    // "for" must not match inside "Hvorfor"; it isn't a word of the text, so it's dropped.
    expect(tuples.map(([s, e]) => text.slice(s, e))).toEqual(["Hvorfor", "tror"]);
  });

  it("ignores punctuation and sentence boundaries", () => {
    const tuples = toWordTuples(
      [{ ...ev("?", 900), kind: "punctuation" }, { ...ev("x", 0), kind: "sentence" }],
      built,
      text,
    );
    expect(tuples).toEqual([]);
  });

  it("rounds times to whole milliseconds", () => {
    const [t] = toWordTuples([{ ...ev("du", 12.5), durationMs: 37.5 }], built, text);
    expect(t).toEqual([13, 15, 13, 50]);
  });
});
