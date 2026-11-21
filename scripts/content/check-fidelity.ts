/**
 * Fidelity checks for content/ against the booklet Markdown.
 *
 *   node scripts/content/check-fidelity.ts
 *
 * 1. Verbatim: every da/fa string in content/ appears in the source after removing tags and
 *    normalising whitespace, and on the line recorded in .cache/content/provenance/.
 * 2. Round trip: each topic is re-rendered from its JSON into the booklet's Markdown form and
 *    compared line by line with the source block. Equality proves nothing was dropped, added,
 *    reordered or altered (including bold connectives, emoji, note markers, example labels).
 * 3. External: Danish questions quoted from SIRI's May–June 2024 examiner booklet in
 *    docs/resources/ABOUT_PD3_MUNDTLIG.md §3.4 are found in the content.
 *
 * Exit code 1 on any mismatch.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  FA_CLOSE,
  FA_OPEN,
  REPO_ROOT,
  contentTokens,
  loadSource,
  normalizeText,
  sessionLabel,
  stripTags,
} from "./lib/source.ts";
import { HEADINGS, topicBlocks } from "./lib/topic-parser.ts";
import { NOTE_KIND, type ProvenanceMap } from "./lib/build.ts";
import { ThemesFileSchema, TopicFileSchema, type LocalizedText, type QuestionSection, type ThemesFile, type TopicFile } from "@/lib/content/schema/authoring";
import { MarginNotesFileSchema, ProvenanceMapSchema, type MarginNote } from "./lib/pipeline-schema.ts";

const CONTENT = resolve(REPO_ROOT, "content");
const src = loadSource();
const plainLines = src.lines.map((l) => normalizeText(stripTags(l.raw)));
const plain = plainLines.join("\n");
const failures: string[] = [];
const fa = (s: string) => `${FA_OPEN}${s}${FA_CLOSE}`;
const MARKER = new Map(Object.entries(NOTE_KIND).map(([m, k]) => [k, m]));
const markerOf = (kind: MarginNote["kind"]) => MARKER.get(kind) ?? "?";

const topics: TopicFile[] = readdirSync(resolve(CONTENT, "topics"))
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => TopicFileSchema.parse(JSON.parse(readFileSync(resolve(CONTENT, "topics", f), "utf8"))));
const themes: ThemesFile = ThemesFileSchema.parse(JSON.parse(readFileSync(resolve(CONTENT, "themes.json"), "utf8")));
const margin: MarginNote[] = MarginNotesFileSchema.parse(JSON.parse(readFileSync(resolve(CONTENT, "internal/margin-notes.json"), "utf8"))).notes;
const topicNotes = (t: TopicFile) => margin.filter((n) => n.topicId === t.id && !n.sectionId);
const sectionNotes = (sectionId: string) => margin.filter((n) => n.sectionId === sectionId);

// ---------------------------------------------------------------------------
// 1. Verbatim check
// ---------------------------------------------------------------------------

interface Str {
  where: string;
  locale: string;
  value: string;
  provPath?: string;
}

function collect(topic: TopicFile): Str[] {
  const out: Str[] = [];
  const add = (where: string, t: LocalizedText | undefined, provPath?: (loc: string) => string) => {
    for (const [loc, v] of Object.entries(t ?? {})) out.push({ where: `${where}.${loc}`, locale: loc, value: v, provPath: provPath?.(loc) });
  };
  add(`${topic.id}.title`, topic.title, (l) => (l === "da" ? "title" : "title.fa"));
  // Margin notes live in content/internal/ but are booklet text too: check them the same way.
  for (const n of margin.filter((x) => x.topicId === topic.id)) add(n.id, n.text, () => `marginNotes:${n.id}`);
  // Situation intros are SIRI text, not booklet text: checked by check-siri.ts instead.
  const sec = (s: QuestionSection, path: string) => {
    add(s.question.id, s.question.text, (l) => `${path}.question.text.${l}`);
    s.question.keywords.forEach((k, i) => {
      add(k.id, k.text, () => `${path}.question.keywords[${i}]`);
    });
    add(s.question.modelAnswer.id, s.question.modelAnswer.text, () => `${path}.question.modelAnswer`);
    s.followups.forEach((f, i) => {
      add(f.id, f.text, (l) => `${path}.followups[${i}].text.${l}`);
      add(f.answer.id, f.answer.text, () => `${path}.followups[${i}].answer`);
    });
    s.personalExamples.forEach((e, i) => {
      add(`${e.id}.label`, e.label, () => `${path}.personalExamples[${i}]`);
      add(e.id, e.text, () => `${path}.personalExamples[${i}]`);
    });
  };
  topic.situations.forEach((s, i) => {
    add(`${s.id}.title`, s.title, () => `situations[${i}].title`);
    sec(s, `situations[${i}]`);
  });
  sec(topic.general, "general");
  return out;
}

let checked = 0;
let anchored = 0;
const byLocale = new Map<string, number>();
for (const topic of topics) {
  const provFile = resolve(REPO_ROOT, ".cache/content/provenance", `${topic.id}.json`);
  const prov: ProvenanceMap | null = existsSync(provFile) ? ProvenanceMapSchema.parse(JSON.parse(readFileSync(provFile, "utf8"))) : null;
  for (const s of collect(topic)) {
    checked++;
    byLocale.set(s.locale, (byLocale.get(s.locale) ?? 0) + 1);
    if (!plain.includes(s.value)) {
      failures.push(`verbatim: ${s.where} not found in source: ${JSON.stringify(s.value.slice(0, 80))}`);
      continue;
    }
    if (prov && s.provPath) {
      const p = prov[s.provPath];
      if (!p) failures.push(`verbatim: ${s.where}: no provenance entry ${s.provPath}`);
      else if (!plainLines[p.line - 1]!.includes(s.value)) failures.push(`verbatim: ${s.where} not on its recorded line ${p.line}`);
      else anchored++;
    }
  }
}
let themeStrings = 0;
for (const th of themes.themes) {
  for (const t of [th.title, ...th.subthemes.map((s) => s.title)]) {
    for (const [loc, v] of Object.entries(t)) {
      themeStrings++;
      if (!plain.includes(v)) failures.push(`verbatim: theme ${th.id}.${loc} not found: ${v}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Round trip
// ---------------------------------------------------------------------------

function render(topic: TopicFile): string[] {
  const tm = /^(\d{4})-(maj|nov)$/.exec(topic.termId);
  if (!tm) throw new Error(`bad termId ${topic.termId}`);
  const year = tm[1]!;
  const session = tm[2] === "maj" ? "maj" : "nov";
  const L: string[] = [
    `<a id="t-${session === "maj" ? "M" : "N"}${year.slice(2)}${topic.letter}"></a>`,
    `### ${topic.title.da}`,
    `${sessionLabel(session)} ${year} · Emne ${topic.letter}`,
    fa(topic.title.fa!),
    ...topic.situations.map((s) => `- **${s.key}** ${s.title.da} · ${fa(s.title.fa!)}`),
    ...topicNotes(topic).map((n) => fa(`${markerOf(n.kind)} ${n.text.fa}`)),
  ];
  const sec = (s: QuestionSection, heading: string) => {
    L.push(`#### ${heading}`, `> <strong>“${s.question.text.da}”</strong>`, fa(s.question.text.fa!));
    for (const k of s.question.keywords) L.push(`- ${k.emoji} <strong>${k.text.da}</strong> = ${fa(k.text.fa!)}`);
    const a = s.question.modelAnswer;
    let md = "";
    let last = 0;
    for (const r of a.emphasis) {
      md += a.text.da!.slice(last, r.start) + "<strong>" + a.text.da!.slice(r.start, r.end) + "</strong>";
      last = r.end;
    }
    L.push(`> ${md}${a.text.da!.slice(last)}`);
    for (const f of s.followups) L.push(`#### ${HEADINGS.followup}`, `<strong>“${f.text.da}”</strong>`, fa(f.text.fa!), `↳ ${f.answer.text.da}`);
    for (const e of s.personalExamples) L.push(fa(`🎯 ${e.label.fa}: ${e.text.da}`));
    for (const n of sectionNotes(s.id)) L.push(fa(`${markerOf(n.kind)} ${n.text.fa}`));
  };
  for (const s of topic.situations) sec(s, HEADINGS.situation(s.key));
  sec(topic.general, HEADINGS.general);
  return L;
}

const blocks = new Map(topicBlocks(src, "t-").map((b) => [b.anchor, b]));
let roundTripLines = 0;
for (const topic of topics) {
  const rendered = render(topic);
  const anchor = /^<a id="([^"]+)">/.exec(rendered[0]!)![1]!;
  const block = blocks.get(anchor);
  if (!block) {
    failures.push(`round trip: ${topic.id}: no source block ${anchor}`);
    continue;
  }
  const source = contentTokens(block.lines).map((t) => ({ text: normalizeText(t.line.raw), n: t.line.n }));
  const max = Math.max(source.length, rendered.length);
  for (let i = 0; i < max; i++) {
    if (source[i]?.text !== rendered[i]) {
      failures.push(`round trip: ${topic.id} differs at source line ${source[i]?.n ?? "(end)"}:\n    source:   ${JSON.stringify(source[i]?.text.slice(0, 120))}\n    rendered: ${JSON.stringify(rendered[i]?.slice(0, 120))}`);
      break;
    }
  }
  roundTripLines += source.length;
}

// ---------------------------------------------------------------------------
// 3. External: SIRI wording quoted in ABOUT_PD3_MUNDTLIG.md §3.4 (May–June 2024 set)
// ---------------------------------------------------------------------------

const about = readFileSync(resolve(REPO_ROOT, "docs/resources/ABOUT_PD3_MUNDTLIG.md"), "utf8").split("\n");
const start = about.findIndex((l) => l.startsWith("#### A real example"));
const end = about.findIndex((l, i) => i > start && l.startsWith("#"));
const quotes = about
  .slice(start, end)
  .flatMap((l) => [...l.matchAll(/\*"([^"]+)"/g)].map((m) => m[1]!))
  .filter((q) => q.split(" ").length > 3);
const allDa = topics.flatMap((t) => collect(t).filter((s) => s.locale === "da").map((s) => s.value));
// Questions must be in the content. Picture captions are expected NOT to be: the booklet has its own situation titles.
const external = quotes.filter((q) => q.endsWith("?")).map((q) => ({ q, found: allDa.some((d) => d.includes(q)) }));
const captions = quotes.filter((q) => !q.endsWith("?")).map((q) => ({ q, found: allDa.some((d) => d.includes(q)) }));
const builtM24 = topics.some((t) => t.termId === "2024-maj");
if (builtM24) for (const e of external) if (!e.found) failures.push(`external: SIRI quote not found in content: ${JSON.stringify(e.q)}`);

// ---------------------------------------------------------------------------

const lines = [
  `verbatim: ${checked} strings in ${topics.length} topic(s) (${[...byLocale].map(([k, v]) => `${k} ${v}`).join(", ")}), ${anchored} confirmed on their recorded source line; ${themeStrings} theme strings`,
  `round trip: ${topics.length} topic block(s), ${roundTripLines} source lines re-rendered from JSON`,
  `external (ABOUT_PD3_MUNDTLIG.md §3.4 quotes of SIRI 2024): ${builtM24 ? `${external.filter((e) => e.found).length}/${external.length} questions found verbatim` : "skipped (2024-maj not built)"}`,
  ...(builtM24 ? captions.map((c) => `  info: SIRI picture caption ${JSON.stringify(c.q)} ${c.found ? "appears" : "does not appear"} in the content (the booklet uses its own situation titles)`) : []),
  failures.length ? `FAILURES (${failures.length}):\n  ${failures.join("\n  ")}` : "result: PASS, no mismatches",
];
process.stdout.write(lines.join("\n") + "\n");
if (failures.length) process.exitCode = 1;
