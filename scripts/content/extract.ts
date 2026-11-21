/**
 * content:extract — booklet Markdown → content/ (ADR-0003). Covers all 51 main topics by default.
 *
 *   npm run content:extract
 *   npm run content:extract -- --topics t-M24A,t-N16C   # a subset (other topic files are left as they are)
 *   npm run content:extract -- --force-review           # overwrite review pages even if a human edited them
 *   npm run content:extract -- --hashes                 # print each topic's contentHash (for the ledger)
 *
 * Stages: parse (strict grammar) → check → structure (normalise, IDs, SIRI checks, intros, spoken
 * overrides) → merge review ledger → write content/ → validate → review pages.
 * The appendix (2013–2015) stays out (D-3). Parse and check errors abort before anything is written.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import type { z } from "zod";
import { PublishedIdsFileSchema, SCHEMA_VERSION, TopicFileSchema, type PublishedIdsFile, type ReviewNote, type ReviewStatus, type TopicFile, type Review } from "@/lib/content/schema/authoring";
import { REPO_ROOT, loadSource, topicIdOf } from "./lib/source.ts";
import { checkTopic, parseAppendix, parseTopic, topicBlocks } from "./lib/topic-parser.ts";
import { parseChapters } from "./lib/themes.ts";
import { parseSimilarTable } from "./lib/similar-table.ts";
import {
  buildExaminerLines,
  buildTerms,
  buildThemes,
  buildTopic,
  buildTopicLinks,
  hashableTopic,
  subthemeIdOf,
  writeJson,
  type BuiltTopic,
} from "./lib/build.ts";
import { renderReviewPage, writeReviewPage } from "./lib/review-page.ts";
import { itemIdsOf, validateContent } from "./lib/validate.ts";
import {
  AppAuthoredSchema,
  MarginNotesFileSchema,
  ReviewLedgerSchema,
  SiriTranscriptionSchema,
  type LedgerTopic,
  type MarginNote,
  type SiriTranscription,
} from "./lib/pipeline-schema.ts";

const { values } = parseArgs({
  options: {
    topics: { type: "string" },
    "force-review": { type: "boolean", default: false },
    hashes: { type: "boolean", default: false },
  },
});

const CONTENT = resolve(REPO_ROOT, "content");
const DATA = resolve(REPO_ROOT, "scripts/content/data");
const CACHE = resolve(REPO_ROOT, ".cache/content");
const REVIEW_DIR = resolve(REPO_ROOT, "docs/content/review");
const readParsed = <S extends z.ZodType>(schema: S, path: string): z.infer<S> => schema.parse(JSON.parse(readFileSync(path, "utf8")));

// --- inputs ----------------------------------------------------------------

const ledger = ReviewLedgerSchema.parse(JSON.parse(readFileSync(resolve(CONTENT, "review-ledger.json"), "utf8")));
const app = readParsed(AppAuthoredSchema, resolve(DATA, "app-authored.json"));
const siriByTerm = new Map<string, SiriTranscription>();
for (const f of readdirSync(DATA).filter((x) => /^siri-.+\.json$/.test(x)).sort()) {
  const s = readParsed(SiriTranscriptionSchema, resolve(DATA, f));
  if (`${s.id}.json` !== f) throw new Error(`${f}: id ${s.id} does not match the file name`);
  siriByTerm.set(s.id.replace(/^siri-/, ""), s);
}

export function contentHash(topic: TopicFile): string {
  return createHash("sha256").update(hashableTopic(topic)).digest("hex").slice(0, 16);
}

/** Ledger (human or delegated decisions) + notes the pipeline raised itself. Pipeline notes force at least needs-review. */
function reviewFor(topic: TopicFile, pipelineNotes: ReviewNote[], e: LedgerTopic | undefined): Review {
  const notes = [...pipelineNotes, ...(e?.notes ?? [])];
  let status: ReviewStatus = e?.status ?? "extracted";
  if ((status === "reviewed" || status === "approved") && e?.contentHash !== contentHash(topic)) {
    notes.push({ text: `Ledger says "${status}", but the extracted content changed since that review (hash ${e?.contentHash ?? "missing"} ≠ ${contentHash(topic)}). Review again.` });
    status = "needs-review";
  }
  if (pipelineNotes.length && status === "extracted") status = "needs-review";
  const who = status === "reviewed" || status === "approved" ? { ...(e?.reviewedBy ? { reviewedBy: e.reviewedBy } : {}), ...(e?.reviewedOn ? { reviewedOn: e.reviewedOn } : {}) } : {};
  return { status, ...(notes.length ? { notes } : {}), ...who };
}

// --- parse -----------------------------------------------------------------

const src = loadSource();
const chapters = parseChapters(src);
const placement = new Map<string, { themeId: string; subthemeId?: string }>();
for (const ch of chapters) {
  for (const t of ch.topics) {
    const g = t.subgroup === null ? undefined : ch.subgroups[t.subgroup];
    placement.set(t.anchor, { themeId: ch.themeId, ...(g ? { subthemeId: subthemeIdOf(ch.themeId, g.da) } : {}) });
  }
}
const blocks = new Map(topicBlocks(src, "t-").map((b) => [b.anchor, b]));
const anchorToId = (a: string) => {
  const m = /^t-([MN])(\d\d)([ABC])$/.exec(a);
  if (!m) throw new Error(`bad anchor ${a}`);
  return topicIdOf(2000 + Number(m[2]), m[1] === "M" ? "maj" : "nov", m[3] === "A" ? "A" : m[3] === "B" ? "B" : "C");
};
const mainIds = new Set([...blocks.keys()].map(anchorToId));
const knownTopicIds = new Set<string>([...mainIds, ...parseAppendix(src).topics.map((t) => topicIdOf(t.year, t.session, t.letter))]);

const anchors = values.topics ? values.topics.split(",").map((s) => s.trim()).filter(Boolean) : [...blocks.keys()];
const built: BuiltTopic[] = [];
for (const anchor of anchors) {
  const block = blocks.get(anchor);
  if (!block) throw new Error(`no topic block with anchor ${anchor}`);
  const parsed = parseTopic(block); // throws ParseError on unexpected structure
  const issues = checkTopic(parsed);
  if (issues.length) {
    throw new Error(`${anchor}: refusing to build, structure does not conform:\n${issues.map((i) => `  line ${i.line} (p. ${i.page}): ${i.message}`).join("\n")}`);
  }
  const place = placement.get(anchor);
  if (!place) throw new Error(`${anchor}: not placed in any theme chapter`);
  const id = topicIdOf(parsed.year, parsed.session, parsed.letter);
  const entry = ledger.topics[id];
  const siri = siriByTerm.get(`${parsed.year}-${parsed.session}`);
  const b = buildTopic(parsed, { ...place, ...(siri ? { siri } : {}), app, ...(entry?.intros ? { introDecisions: entry.intros } : {}) });
  b.topic.review = reviewFor(b.topic, b.pipelineNotes, entry);
  built.push(b);
}
built.sort((a, b) => (a.topic.id < b.topic.id ? -1 : a.topic.id > b.topic.id ? 1 : 0));
if (values.hashes) {
  for (const b of built) process.stdout.write(`${b.topic.id} ${contentHash(b.topic)}\n`);
  process.exit(0);
}

// --- write -----------------------------------------------------------------

for (const { topic, prov } of built) {
  writeJson(resolve(CONTENT, "topics", `${topic.id}.json`), topic);
  writeJson(resolve(CACHE, "provenance", `${topic.id}.json`), prov);
}
const themesFile = buildThemes(chapters);
writeJson(resolve(CONTENT, "themes.json"), themesFile);
const topicsDir = resolve(CONTENT, "topics");
const allTopics: TopicFile[] = readdirSync(topicsDir)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => readParsed(TopicFileSchema, resolve(topicsDir, f)));
writeJson(resolve(CONTENT, "terms.json"), buildTerms(allTopics));

const siri2024 = siriByTerm.get("2024-maj");
if (!siri2024) throw new Error("scripts/content/data/siri-2024-maj.json is required for the examiner lines");
writeJson(resolve(CONTENT, "examiner-lines.json"), buildExaminerLines(siri2024, app, ledger.examinerLines ?? {}));

// Margin notes (internal): replace the notes of the topics built now, keep the others; code-point order.
const marginPath = resolve(CONTENT, "internal/margin-notes.json");
const builtIds = new Set(built.map((b) => b.topic.id));
const previous: MarginNote[] = existsSync(marginPath) ? readParsed(MarginNotesFileSchema, marginPath).notes : [];
const marginNotes = [...previous.filter((n) => !builtIds.has(n.topicId)), ...built.flatMap((b) => b.marginNotes)].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
writeJson(marginPath, { schemaVersion: SCHEMA_VERSION, notes: marginNotes });

// Public topic links: structure only (D-21).
writeJson(resolve(CONTENT, "topic-links.json"), buildTopicLinks(marginNotes, parseSimilarTable(src), mainIds));

// Published IDs: append-only. Every item ID of an approved topic is registered; nothing is ever removed.
const pubPath = resolve(CONTENT, "published-ids.json");
const pub: PublishedIdsFile = existsSync(pubPath) ? readParsed(PublishedIdsFileSchema, pubPath) : { schemaVersion: SCHEMA_VERSION, ids: [], retired: [] };
const ids = new Set(pub.ids);
for (const t of allTopics) if (t.review.status === "approved") for (const id of itemIdsOf(t)) ids.add(id);
writeJson(pubPath, { schemaVersion: SCHEMA_VERSION, ids: [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)), retired: pub.retired });

// --- validate ----------------------------------------------------------------

const v = validateContent(CONTENT, { knownTopicIds, mainTopicIds: mainIds, knownSources: new Set([...siriByTerm.values()].map((s) => s.id)), ledger });
if (v.errors.length) {
  process.stderr.write(`VALIDATION FAILED (${v.errors.length}):\n${v.errors.map((e) => `  ${e}`).join("\n")}\n`);
  process.exit(1);
}

// --- review pages ----------------------------------------------------------------

const sources = new Map([...siriByTerm.values()].map((s) => [s.id, `${s.document.title}${s.document.authenticity === "official" ? "" : " (copy of unconfirmed authenticity)"}`]));
const results = new Map<string, number>();
for (const { topic, prov, marginNotes: notes } of built) {
  const theme = themesFile.themes.find((t) => t.id === topic.themeId);
  if (!theme) throw new Error(`${topic.id}: theme ${topic.themeId} missing`);
  const page = renderReviewPage(topic, prov, theme, notes, sources, ledger.topics[topic.id]?.corrections ?? []);
  const r = writeReviewPage(resolve(REVIEW_DIR, `${topic.id}.md`), page, values["force-review"]);
  results.set(r, (results.get(r) ?? 0) + 1);
}

process.stdout.write(
  [
    `built ${built.length} topic(s)`,
    `wrote content/topics/, themes.json, terms.json, examiner-lines.json, topic-links.json, published-ids.json, internal/margin-notes.json (${marginNotes.length} notes)`,
    "validation: OK",
    ...v.report.map((r) => `  ${r}`),
    `review pages (docs/content/review/): ${[...results].map(([k, n]) => `${k} ${n}`).join(", ")}`,
  ].join("\n") + "\n",
);
