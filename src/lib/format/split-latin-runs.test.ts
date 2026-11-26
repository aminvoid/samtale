import { describe, expect, it } from "vitest";
import { splitLatinRuns } from "./split-latin-runs";

describe("splitLatinRuns", () => {
  it.each([
    { before: "از ", name: "Too Good To Go", after: " استفاده کرد." },
    { before: "ویتامین ", name: "B12", after: " مهم است." },
    { before: "وام ", name: "SU-lån", after: " را گرفت." },
    { before: "", name: "Too Good To Go", after: " یک برنامه است." },
    { before: "نام برنامه ", name: "Too Good To Go", after: "" },
    { before: "از ", name: "Too Good To Go", after: "، استفاده کرد." },
    { before: "از ", name: "Too Good To Go", after: "." },
    { before: "از ", name: "O’Neill and O'Connor", after: " پرسید." },
    { before: "نام برنامه ", name: "Too  Good To Go", after: " است." },
  ])("keeps the name together in '$before$name$after'", ({ before, name, after }) => {
    expect(splitLatinRuns(before + name + after)).toEqual([
      ...(before ? [{ text: before, isLatin: false }] : []),
      { text: name, isLatin: true },
      ...(after ? [{ text: after, isLatin: false }] : []),
    ]);
  });

  it("leaves standalone digits in the surrounding direction", () => {
    const runs = splitLatinRuns("سال 2024 و ۲۰۲۵");

    expect(runs.every(({ isLatin }) => !isLatin)).toBe(true);
    expect(runs.map(({ text }) => text).join("")).toBe("سال 2024 و ۲۰۲۵");
  });
});
