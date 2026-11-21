import { describe, expect, it } from "vitest";
import { manifestSchema } from "../../../src/lib/audio/manifest-schema";
import type { AudioItem } from "./items";
import { type GenerationConfig, planGeneration } from "./plan";
import { executePlan, type RunOptions } from "./run";
import { createMemoryStore } from "./store";
import { PermanentSynthesisError, type Synthesizer, TransientSynthesisError } from "./synthesizer";

const config: GenerationConfig = {
  generatorVersion: "test/1",
  outputFormat: "Audio24Khz48KBitRateMonoMp3",
  voices: { examiner: "da-DK-JeppeNeural", model: "da-DK-ChristelNeural" },
  settings: { examiner: {}, model: {} },
};

const items: AudioItem[] = [
  { id: "t.sitA.q1", role: "examiner", text: "Hvorfor tror du det?", words: false, kind: "question", topicId: "t" },
  { id: "t.sitA.q1.answer", role: "model", text: "Det er fx svært.", words: true, kind: "answer", topicId: "t" },
  { id: "u.sitA.q1.answer", role: "model", text: "Det er fx svært.", words: true, kind: "answer", topicId: "u" },
];

/** A fake Azure: 6 bytes per ms of "audio", one word event per word, with real SSML offsets. */
function fakeSynth(failFor: (ssml: string, call: number) => Error | undefined = () => undefined) {
  const calls: string[] = [];
  const synth: Synthesizer = {
    async synthesize(ssml) {
      await Promise.resolve(); // like the real adapter, always asynchronous
      calls.push(ssml);
      const err = failFor(ssml, calls.length);
      if (err) throw err;
      const bodyStart = ssml.indexOf('">', ssml.indexOf("<voice")) + 2;
      const body = ssml.slice(bodyStart, ssml.indexOf("</voice>"));
      const boundaries = [...body.matchAll(/[\p{L}]+/gu)].map((m, i) => ({
        kind: "word" as const,
        text: m[0],
        textOffset: bodyStart + m.index,
        wordLength: m[0].length,
        audioOffsetMs: i * 300,
        durationMs: 250,
      }));
      return { audio: new Uint8Array(body.length * 600), durationMs: body.length * 99, boundaries };
    },
    close() {},
  };
  return { synth, calls };
}

const opts = (prune = true): RunOptions => ({
  generatorVersion: "test/1",
  bytesPerMs: 6,
  prune,
  log: () => {},
  pool: { concurrency: 2, maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 2, sleep: () => Promise.resolve() },
});

async function generate(store: ReturnType<typeof createMemoryStore>, list: AudioItem[], synth: Synthesizer, prune = true) {
  const plan = planGeneration(list, config, store.loadManifest("test/1"), store);
  const report = await executePlan(plan, synth, store, opts(prune));
  return { plan, report, manifest: store.loadManifest("test/1") };
}

describe("audio generation run", () => {
  it("synthesizes each unique clip once and shares it between identical texts", async () => {
    const store = createMemoryStore();
    const { synth, calls } = fakeSynth();
    const { manifest, report } = await generate(store, items, synth);

    expect(calls).toHaveLength(2);
    expect(report).toMatchObject({ synthesized: 2, failed: [] });
    expect(manifestSchema.safeParse(manifest).success).toBe(true);
    const a = manifest.entries["t.sitA.q1.answer"]!;
    expect(manifest.entries["u.sitA.q1.answer"]!.hash).toBe(a.hash);
    expect(a).toMatchObject({ voiceRole: "model", voice: "da-DK-ChristelNeural" });
    expect(a.durationMs).toBe(Math.round(a.bytes / 6));
    expect(manifest.entries["t.sitA.q1"]!.words).toBeUndefined();
  });

  it("stores word timings against the display text, with the abbreviation as one word", async () => {
    const store = createMemoryStore();
    const { manifest } = await generate(store, items, fakeSynth().synth);
    const text = "Det er fx svært.";
    const words = manifest.entries["t.sitA.q1.answer"]!.words!;
    expect(words.map(([s, e]) => text.slice(s, e))).toEqual(["Det", "er", "fx", "svært"]);
    expect(words[2]).toEqual([7, 9, 600, 1150]); // "for" at 600 ms … "eksempel" ends 900 + 250
  });

  it("is idempotent: a second run makes no requests", async () => {
    const store = createMemoryStore();
    await generate(store, items, fakeSynth().synth);
    const second = fakeSynth();
    const { plan, report } = await generate(store, items, second.synth);
    expect(second.calls).toHaveLength(0);
    expect(plan.toSynthesize).toHaveLength(0);
    expect(report.cached).toBe(3);
  });

  it("regenerates only the item whose text changed, and prunes the orphaned clip", async () => {
    const store = createMemoryStore();
    await generate(store, items, fakeSynth().synth);
    const changed = items.map((i) => (i.id === "t.sitA.q1" ? { ...i, text: "Hvorfor mon?" } : i));
    const next = fakeSynth();
    const { report, manifest } = await generate(store, changed, next.synth);
    expect(next.calls).toHaveLength(1);
    expect(report.prunedClips).toHaveLength(1);
    expect(store.listClips().sort()).toEqual([...new Set(Object.values(manifest.entries).map((e) => e.hash))].sort());
  });

  it("changes the hash when the voice changes", () => {
    const plain = planGeneration(items, config, store0(), createMemoryStore());
    const other = planGeneration(items, { ...config, voices: { ...config.voices, examiner: "da-DK-ChristelNeural" } }, store0(), createMemoryStore());
    expect(other.items[0]!.hash).not.toBe(plain.items[0]!.hash);
    expect(other.items[1]!.hash).toBe(plain.items[1]!.hash);
  });

  it("retries transient errors and keeps going after permanent ones (resumable)", async () => {
    const store = createMemoryStore();
    const flaky = fakeSynth((ssml, call) => {
      if (call === 1) return new TransientSynthesisError("TooManyRequests");
      if (ssml.includes("Hvorfor")) return new PermanentSynthesisError("BadRequestParameters");
      return undefined;
    });
    const first = await generate(store, items, flaky.synth);
    expect(first.report.failed.map((f) => f.itemIds)).toEqual([["t.sitA.q1"]]);
    expect(Object.keys(first.manifest.entries).sort()).toEqual(["t.sitA.q1.answer", "u.sitA.q1.answer"]);
    expect(first.report.prunedClips).toEqual([]); // no pruning after a failed run

    const resume = fakeSynth();
    const second = await generate(store, items, resume.synth);
    expect(resume.calls).toHaveLength(1);
    expect(second.report.failed).toEqual([]);
    expect(Object.keys(second.manifest.entries)).toHaveLength(3);
  });

  it("reuses a clip whose manifest write was lost, without paying again", async () => {
    const store = createMemoryStore();
    await generate(store, items, fakeSynth().synth);
    store.saveManifest({ manifestVersion: 1, generatorVersion: "test/1", entries: {} }); // simulate a crash
    const again = fakeSynth();
    const { report, manifest } = await generate(store, items, again.synth);
    expect(again.calls).toHaveLength(0);
    expect(report.reused).toBe(3);
    expect(manifest.entries["t.sitA.q1.answer"]!.words).toHaveLength(4);
  });

  it("doesn't prune entries outside a filtered run", async () => {
    const store = createMemoryStore();
    await generate(store, items, fakeSynth().synth);
    const { manifest } = await generate(store, items.slice(0, 1), fakeSynth().synth, false);
    expect(Object.keys(manifest.entries)).toHaveLength(3);
  });
});

function store0() {
  return createMemoryStore().loadManifest("test/1");
}
