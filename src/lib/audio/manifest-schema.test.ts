import { describe, expect, it } from "vitest";
import { emptyManifest, manifestSchema } from "./manifest-schema";

const entry = {
  hash: "0123456789abcdef0123",
  voiceRole: "model" as const,
  voice: "da-DK-ChristelNeural",
  textSha256: "a".repeat(64),
  durationMs: 9384,
  bytes: 56304,
  words: [
    [0, 3, 50, 213],
    [4, 11, 213, 575],
  ],
};

describe("manifestSchema", () => {
  it("accepts an entry in the ADR-0006 format", () => {
    const m = { ...emptyManifest("audio-gen/1"), entries: { "2024-maj-b.sitA.q1.answer": entry } };
    expect(manifestSchema.parse(m)).toEqual(m);
  });

  it("accepts entries without words (questions, examiner lines)", () => {
    const noWords = { ...entry, words: undefined };
    expect(manifestSchema.safeParse({ ...emptyManifest("g"), entries: { "examiner.thanks": noWords } }).success).toBe(true);
  });

  it("rejects bad hashes, empty words and words out of order", () => {
    const bad = (e: object) => manifestSchema.safeParse({ ...emptyManifest("g"), entries: { x: { ...entry, ...e } } }).success;
    expect(bad({ hash: "XYZ" })).toBe(false);
    expect(bad({ words: [[3, 3, 0, 10]] })).toBe(false);
    expect(
      bad({
        words: [
          [4, 11, 213, 575],
          [0, 3, 50, 213],
        ],
      }),
    ).toBe(false);
    expect(manifestSchema.safeParse({ ...emptyManifest("g"), manifestVersion: 2 }).success).toBe(false);
  });
});
