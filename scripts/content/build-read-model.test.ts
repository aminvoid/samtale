// @vitest-environment node
/**
 * ADR-0002 §4.2 / ADR-0012 §1: content:build must never read internal data. Neither the script nor any
 * module it imports may mention content/internal or the review ledger.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Manifest } from "../../src/lib/audio/manifest-schema";
import { TopicFileSchema } from "../../src/lib/content/schema/authoring";
import { ReadModelSchema } from "../../src/lib/content/schema/published";
import { sha256 } from "../audio/lib/hash";
import { collectItems, examinerLinesSchema, topicSchema } from "../audio/lib/items";
import { buildReadModel } from "./build-read-model";

const ROOT = resolve(import.meta.dirname, "../..");
const ENTRY = resolve(import.meta.dirname, "build-read-model.ts");
const FORBIDDEN = /content[\\/]+internal|["'`/]internal["'`/]|review-ledger|reviewLedger/;

function resolveImport(from: string, specifier: string): string | undefined {
  const base = specifier.startsWith("@/")
    ? resolve(ROOT, "src", specifier.slice(2))
    : resolve(dirname(from), specifier);
  return [base, `${base}.ts`, `${base}.tsx`, resolve(base, "index.ts")].find(
    (p) => existsSync(p) && p.endsWith(".ts"),
  );
}

/** The script and every local module it imports, transitively. */
function importGraph(entry: string): Map<string, string> {
  const files = new Map<string, string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop();
    if (file === undefined || files.has(file)) continue;
    const text = readFileSync(file, "utf8");
    files.set(file, text);
    for (const m of text.matchAll(
      /(?:import|export)\s[^"'`]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g,
    )) {
      const specifier = m[1] ?? m[2];
      if (specifier === undefined || !(specifier.startsWith(".") || specifier.startsWith("@/"))) continue;
      const target = resolveImport(file, specifier);
      if (target === undefined) throw new Error(`Unresolved import ${specifier} in ${file}`);
      queue.push(target);
    }
  }
  return files;
}

describe("content:build (build-read-model.ts)", () => {
  it("follows its imports", () => {
    const files = [...importGraph(ENTRY).keys()].map((f) => relative(ROOT, f));
    expect(files).toContain("scripts/content/build-read-model.ts");
    expect(files).toContain("src/lib/env/schema.ts");
    expect(files).toContain("src/lib/content/schema/published.ts");
    expect(files).toContain("scripts/content/lib/confidentiality.ts");
  });

  it("never references content/internal or the review ledger, directly or through an import", () => {
    for (const [file, text] of importGraph(ENTRY)) {
      expect(FORBIDDEN.test(text), relative(ROOT, file)).toBe(false);
    }
  });

  it("the check would catch a reference", () => {
    expect(FORBIDDEN.test('readFileSync("content/internal/margin-notes.json")')).toBe(true);
    expect(FORBIDDEN.test('join(contentDir, "internal", file)')).toBe(true);
    expect(FORBIDDEN.test('join(root, "content/review-ledger.json")')).toBe(true);
  });
});

const APPROVED = ["2024-maj-a", "2024-maj-b", "2024-maj-c"];
const preview = { CONTENT_RELEASE: "preview", AUDIO_BASE_URL: "/audio" } satisfies Parameters<
  typeof buildReadModel
>[1];
const production = { ...preview, CONTENT_RELEASE: "production" } satisfies Parameters<
  typeof buildReadModel
>[1];
const hidden = "Hidden authoring data Skriftlig 2026";

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, JSON.stringify(value));
}

function topicPath(root: string, id: string): string {
  return join(root, "content", "topics", `${id}.json`);
}

function addFixtureAudio(root: string, topicIds: string[]): Manifest {
  const topics = topicIds.map((id) => topicSchema.parse(readJson(topicPath(root, id))));
  const lines = examinerLinesSchema.parse(readJson(join(root, "content/examiner-lines.json")));
  // The collector is also used by audio:generate. These bytes exercise only the publisher.
  const items = collectItems(topics, lines, { keywords: true });
  mkdirSync(join(root, "audio/clips"), { recursive: true });
  const entries: Manifest["entries"] = {};
  for (const [index, item] of items.entries()) {
    const hash = `abcdef${index.toString(16).padStart(14, "0")}`;
    entries[item.id] = {
      hash,
      voiceRole: item.role,
      voice: "fixture-voice",
      textSha256: sha256(item.text),
      durationMs: 300,
      bytes: 4,
      words: item.words ? [[0, 1, 0, 200]] : undefined,
    };
    writeFileSync(join(root, "audio/clips", `${hash}.mp3`), "clip");
  }
  const manifest: Manifest = { manifestVersion: 1, generatorVersion: "fixture", entries };
  writeJson(join(root, "audio/manifest.json"), manifest);
  return manifest;
}

describe("published read model", () => {
  let root: string;
  let output: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "pd3-content-"));
    mkdirSync(join(root, "content"));
    for (const file of ["topics", "themes.json", "terms.json", "examiner-lines.json", "topic-links.json"]) {
      cpSync(join(ROOT, "content", file), join(root, "content", file), { recursive: true });
    }
    output = join(root, "src/generated/content/read-model.json");
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("publishes the preview topics including needs-review and marks all as drafts", () => {
    const model = buildReadModel(root, preview);
    expect(model.topics).toHaveLength(51);
    expect(model.topics.every((topic) => topic.draft === true)).toBe(true);
    const needsReview = readdirSync(join(root, "content/topics")).flatMap((file) => {
      const topic = TopicFileSchema.parse(readJson(join(root, "content/topics", file)));
      return topic.review.status === "needs-review" ? [topic.id] : [];
    });
    expect(needsReview).toHaveLength(3);
    expect(model.topics.map(({ id }) => id)).toEqual(expect.arrayContaining(needsReview));
    expect(model.searchIndex).toHaveLength(51);
  });

  it("drops review metadata, provenance beyond page numbers, and unknown fields at every level", () => {
    const file = topicPath(root, "2024-maj-b");
    const topic = TopicFileSchema.parse(readJson(file));
    const { question } = topic.general;
    writeJson(file, {
      ...topic,
      futureField: hidden,
      contentHash: hidden,
      review: { ...topic.review, notes: [{ text: hidden }] },
      source: { ...topic.source, line: hidden },
      title: { ...topic.title, en: hidden },
      situations: topic.situations.map((situation) => ({ ...situation, pictureCaption: hidden })),
      general: {
        ...topic.general,
        question: {
          ...question,
          siriCheck: { ...question.siriCheck, siriParts: [hidden] },
          modelAnswer: {
            ...question.modelAnswer,
            text: { ...question.modelAnswer.text, fa: hidden },
            emphasis: [{ start: 0, end: 1, future: hidden }],
          },
        },
      },
    });
    const { topics } = buildReadModel(root, preview);
    const published = topics.find(({ id }) => id === topic.id);
    const json = readFileSync(output, "utf8");
    expect(json).not.toContain(hidden);
    expect(json).not.toMatch(/"review"|"siriParts"|"contentHash"|"needs-review"|"pictureCaption"/);
    expect(published?.sourcePages).toEqual(topic.source.pages);
    expect(published?.general.question.modelAnswer.text).toEqual({ da: question.modelAnswer.text.da });
    expect(published?.general.question.modelAnswer.emphasis).toEqual([{ start: 0, end: 1 }]);
    expect(published?.general.question.verification).toEqual({
      status: "matches",
      sourceTermId: "2024-maj",
      checkedOn: question.siriCheck.checkedOn,
    });
    expect(ReadModelSchema.safeParse({ ...readModel(root), unexpected: hidden }).success).toBe(false);
  });

  it("refuses confidential strings in allowed fields before writing anything", () => {
    const file = topicPath(root, "2024-maj-a");
    const topic = TopicFileSchema.parse(readJson(file));
    writeJson(file, { ...topic, title: { ...topic.title, da: hidden } });
    expect(() => buildReadModel(root, preview)).toThrow(/confidentiality check.*title\.da/);
    expect(existsSync(output)).toBe(false);
  });

  it("refuses a winter 2024 source term", () => {
    const file = topicPath(root, "2024-maj-a");
    const topic = TopicFileSchema.parse(readJson(file));
    const { question } = topic.general;
    writeJson(file, {
      ...topic,
      general: {
        ...topic.general,
        question: {
          ...question,
          siriCheck: { ...question.siriCheck, sourceRef: { document: "siri-2024-nov" } },
        },
      },
    });
    expect(() => buildReadModel(root, preview)).toThrow(/public exam period/);
  });

  it("fails production with zero approved topics", () => {
    for (const id of APPROVED) {
      const file = topicPath(root, id);
      const topic = TopicFileSchema.parse(readJson(file));
      writeJson(file, { ...topic, review: { status: "reviewed" } });
    }
    expect(() => buildReadModel(root, production)).toThrow(/zero approved topics/);
    expect(existsSync(output)).toBe(false);
  });

  it("fails production on a missing verification record or unapproved intro", () => {
    addFixtureAudio(root, APPROVED);
    const file = topicPath(root, "2024-maj-a");
    const topic = TopicFileSchema.parse(readJson(file));
    writeJson(file, {
      ...topic,
      general: {
        ...topic.general,
        question: { ...topic.general.question, siriCheck: undefined },
      },
    });
    expect(() => buildReadModel(root, production)).toThrow(/siriCheck/);
    writeJson(file, {
      ...topic,
      situations: topic.situations.map((situation) => ({
        ...situation,
        intro: { ...situation.intro, review: { status: "reviewed" } },
      })),
    });
    expect(() => buildReadModel(root, production)).toThrow(/requires an approved intro/);
  });

  it("fails production on missing and stale audio, while preview leaves it out", () => {
    expect(() => buildReadModel(root, production)).toThrow(/requires audio\/manifest\.json/);
    const manifest = addFixtureAudio(root, APPROVED);
    const entry = manifest.entries["2024-maj-a.general.q2"];
    if (entry === undefined) throw new Error("Missing fixture audio entry");
    entry.textSha256 = sha256("previous display text");
    writeJson(join(root, "audio/manifest.json"), manifest);
    expect(() => buildReadModel(root, production)).toThrow(/matching audio.*2024-maj-a\.general\.q2/);
    const model = buildReadModel(root, preview);
    expect(model.topics.find(({ id }) => id === "2024-maj-a")?.general.question.audio).toBeUndefined();
    expect(existsSync(join(root, "public/audio", `${entry.hash}.mp3`))).toBe(false);
  });

  it("publishes exactly the three approved topics and only their referenced audio", () => {
    const manifest = addFixtureAudio(root, [...APPROVED, "2023-nov-a"]);
    const unpublished = manifest.entries["2023-nov-a.general.q2"];
    if (unpublished === undefined) throw new Error("Missing fixture audio entry");
    const clip = `${unpublished.hash}.mp3`;
    buildReadModel(root, preview);
    expect(existsSync(join(root, "public/audio", clip))).toBe(true);

    const model = buildReadModel(root, production);
    expect(model.topics.map(({ id }) => id)).toEqual(APPROVED);
    expect(model.topics.every((topic) => topic.draft === undefined)).toBe(true);
    expect(model.terms.flatMap((term) => term.topicIds)).toEqual(APPROVED);
    expect(model.searchIndex.map(({ topicId }) => topicId)).toEqual(APPROVED);
    expect(
      model.similarGroups
        .flatMap(({ members }) => members)
        .every(({ topicId }) => APPROVED.includes(topicId)),
    ).toBe(true);
    expect(model.similarGroups.some(({ members }) => members.length === 1)).toBe(true);
    expect(
      model.topics.flatMap(({ links }) => links).every(({ toTopicId }) => APPROVED.includes(toTopicId)),
    ).toBe(true);
    expect(model.topics[0]?.general.question.modelAnswer.audio?.words).toEqual([[0, 1, 0, 200]]);
    expect(model.topics[0]?.examinerAudio.map(({ lineId }) => lineId)).toEqual(["examiner.intro"]);
    expect(readFileSync(output, "utf8")).not.toMatch(/2023-nov-a|textSha256|generatorVersion|fixture-voice/);
    expect(existsSync(join(root, "public/audio", clip))).toBe(false);
    expect(readdirSync(join(root, "public/audio"))).toHaveLength(
      Object.keys(manifest.entries).length -
        Object.keys(manifest.entries).filter((id) => id.includes("2023-nov-a")).length,
    );
  });

  it("writes byte-identical, versioned JSON on repeated builds", () => {
    buildReadModel(root, preview);
    const first = readFileSync(output, "utf8");
    buildReadModel(root, preview);
    expect(readFileSync(output, "utf8")).toBe(first);
    expect(first.endsWith("\n")).toBe(true);
    expect(readModel(root).readModelVersion).toBe(1);
  });
});

function readModel(root: string) {
  return ReadModelSchema.parse(readJson(join(root, "src/generated/content/read-model.json")));
}
