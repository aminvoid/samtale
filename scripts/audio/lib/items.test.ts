import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { collectItems, examinerLinesSchema, topicSchema } from "./items";

const root = resolve(import.meta.dirname, "../../..");
const read = (p: string): unknown => JSON.parse(readFileSync(resolve(root, p), "utf8"));
const topic = topicSchema.parse(read("content/topics/2024-maj-b.json"));
const lines = examinerLinesSchema.parse(read("content/examiner-lines.json"));

describe("collectItems (pilot topic 2024-maj-b)", () => {
  const items = collectItems([topic], lines, { keywords: true });
  const byId = new Map(items.map((i) => [i.id, i]));

  it("collects the shared examiner lines once, including the sound check from content", () => {
    expect(items.filter((i) => !i.topicId).map((i) => i.id)).toEqual([
      "examiner.soundCheck",
      "examiner.transition",
      "examiner.thanks",
      "examiner.closing",
    ]);
  });

  it("appends app-owned extra lines and rejects one that duplicates a content line", () => {
    const withExtra = collectItems([topic], lines, { keywords: true }, [
      { id: "examiner.extraProbe", text: "Prøve." },
    ]);
    expect(withExtra.filter((i) => !i.topicId).map((i) => i.id)).toContain("examiner.extraProbe");
    expect(() =>
      collectItems([topic], lines, { keywords: true }, [
        { id: "examiner.soundCheck", text: "Hej, og velkommen til prøven." },
      ]),
    ).toThrow(/Duplicate/);
  });

  it("fills the topic into the examiner intro line", () => {
    const intro = byId.get("examiner.intro:2024-maj-b");
    expect(intro?.role).toBe("examiner");
    expect(intro?.text).toContain("emnet Mangel på arbejdskraft.");
  });

  it("assigns voices and word timings per schema §10 and ADR-0006", () => {
    expect(byId.get("2024-maj-b.sitA.intro")).toMatchObject({ role: "examiner", words: false });
    expect(byId.get("2024-maj-b.sitA.q1")).toMatchObject({ role: "examiner", words: false });
    expect(byId.get("2024-maj-b.sitA.q1.kw1")).toMatchObject({ role: "model", words: false });
    expect(byId.get("2024-maj-b.sitA.q1.answer")).toMatchObject({ role: "model", words: true });
    expect(byId.get("2024-maj-b.sitA.followup1")).toMatchObject({ role: "examiner", words: false });
    expect(byId.get("2024-maj-b.sitA.followup1.answer")).toMatchObject({ role: "model", words: true });
    expect(byId.get("2024-maj-b.sitA.example1")).toMatchObject({ role: "model", words: true });
    expect(byId.get("2024-maj-b.general.q2.answer")).toMatchObject({ role: "model", words: true });
  });

  it("can leave out key words", () => {
    const without = collectItems([topic], lines, { keywords: false });
    expect(without.some((i) => i.kind === "keyword")).toBe(false);
    expect(items.length - without.length).toBe(9);
  });

  it("rejects duplicate IDs", () => {
    expect(() => collectItems([topic, topic], lines, { keywords: true })).toThrow(/Duplicate/);
  });
});
