/**
 * Structural survey of the whole booklet Markdown.
 *
 *   node scripts/content/survey.ts            # prints the report
 *   node scripts/content/survey.ts --json     # also writes .cache/content/survey.json
 *
 * Read-only with respect to the source. Never modifies content/.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  REPO_ROOT,
  contentTokens,
  loadSource,
  parseStrongRuns,
  parseTopicAnchor,
  sessionLabel,
  stripTags,
  termIdOf,
  topicIdOf,
  uniqueSorted,
  type Source,
} from "./lib/source.ts";
import {
  checkTopic,
  contentPages,
  pagesOf,
  parseAppendix,
  parseTopic,
  topicBlocks,
  type Issue,
  type PTopic,
} from "./lib/topic-parser.ts";
import { parseChapters, parseMainToc } from "./lib/themes.ts";
import { confidentialityHits } from "./lib/confidentiality.ts";

const src = loadSource();
const out: string[] = [];
const log = (s = "") => out.push(s);
const json: Record<string, unknown> = {};

// ---------------------------------------------------------------------------
// 1. Main topics
// ---------------------------------------------------------------------------

const blocks = topicBlocks(src, "t-");
const parsed: PTopic[] = [];
const parseErrors: Array<{ anchor: string; error: string }> = [];
const issues: Issue[] = [];
for (const b of blocks) {
  try {
    const t = parseTopic(b);
    parsed.push(t);
    issues.push(...checkTopic(t));
  } catch (e) {
    parseErrors.push({ anchor: b.anchor, error: e instanceof Error ? e.message : String(e) });
  }
}

const chapters = parseChapters(src);
const mainToc = parseMainToc(src);
const themeOf = new Map<string, { themeId: string; subgroup: string | null }>();
for (const ch of chapters) {
  for (const t of ch.topics) {
    themeOf.set(t.anchor, { themeId: ch.themeId, subgroup: t.subgroup === null ? null : ch.subgroups[t.subgroup]!.da });
  }
}

log("# PD3 booklet structural survey");
log(`source: ${src.path.replace(REPO_ROOT + "/", "")} (${src.lines.length} lines, 116 pages)`);
log();
log("## 1. Main topics (anchors t-…)");
log(`blocks found: ${blocks.length}; parsed by strict grammar: ${parsed.length}; grammar errors: ${parseErrors.length}`);
for (const e of parseErrors) log(`  GRAMMAR ERROR ${e.anchor}: ${e.error}`);
log(`cardinality/script issues: ${issues.length}`);
for (const i of issues) log(`  ISSUE ${i.topic} line ${i.line} (p. ${i.page}): ${i.message}`);

const topicRows = parsed.map((t) => {
  const id = topicIdOf(t.year, t.session, t.letter);
  const splitSections = t.sections.filter((s) => pagesOf(s.lines).length > 1).map((s) => `${s.kind} p.${pagesOf(s.lines).join("–")}`);
  return {
    anchor: t.anchor,
    id,
    theme: themeOf.get(t.anchor)?.themeId ?? "?",
    subgroup: themeOf.get(t.anchor)?.subgroup ?? null,
    pages: contentPages(t.lines),
    lines: [t.anchorLine.n, t.lines.at(-1)!.n],
    situations: t.situations.length,
    sections: t.sections.map((s) => s.kind),
    keywords: t.sections.map((s) => s.keywords.length),
    followups: t.sections.map((s) => s.followups.length),
    examples: t.sections.flatMap((s) => s.examples.map((e) => `${s.kind}:${e.label}`)),
    notes: [...t.notes.map((n) => n.marker), ...t.sections.flatMap((s) => s.notes.map((n) => `${s.kind}:${n.marker}`))],
    splitSections,
  };
});

const conforming = topicRows.filter(
  (r) =>
    r.situations === 2 &&
    r.sections.join() === "sitA,sitB,general" &&
    r.keywords.every((k) => k === 3) &&
    r.followups.every((f) => f === 1),
);
log(`fully conforming (2 situations, sitA+sitB+general, 3 key words and 1 follow-up each): ${conforming.length}/${parsed.length}`);
log();
log("| topic | theme | pages | lines | kw | fu | examples | notes | sections split across pages |");
log("|---|---|---|---|---|---|---|---|---|");
for (const r of topicRows) {
  log(
    `| ${r.id} | ${r.theme}${r.subgroup ? " / " + r.subgroup : ""} | ${r.pages.join(",")} | ${r.lines.join("–")} | ${r.keywords.join("/")} | ${r.followups.join("/")} | ${r.examples.join("; ") || "–"} | ${r.notes.join(" ") || "–"} | ${r.splitSections.join("; ") || "–"} |`,
  );
}
json.topics = topicRows;
json.parseErrors = parseErrors;
json.issues = issues;

// Optional parts
const allExamples = parsed.flatMap((t) =>
  t.sections.flatMap((s) => s.examples.map((e) => ({ topic: topicIdOf(t.year, t.session, t.letter), section: s.kind, label: e.label, da: e.da, line: e.line.n, page: e.line.page }))),
);
log();
log(`personal examples (🎯 + Danish): ${allExamples.length}`);
for (const e of allExamples) log(`  ${e.topic} ${e.section} line ${e.line} p.${e.page} [${e.label}] ${e.da}`);
const allNotes = parsed.flatMap((t) => [
  ...t.notes.map((n) => ({ topic: topicIdOf(t.year, t.session, t.letter), where: "topic", marker: n.marker, line: n.line.n, page: n.line.page, text: n.text })),
  ...t.sections.flatMap((s) => s.notes.map((n) => ({ topic: topicIdOf(t.year, t.session, t.letter), where: s.kind, marker: n.marker, line: n.line.n, page: n.line.page, text: n.text }))),
]);
const byMarker = new Map<string, number>();
for (const n of allNotes) byMarker.set(n.marker, (byMarker.get(n.marker) ?? 0) + 1);
log(`notes: ${allNotes.length} (${[...byMarker].map(([m, c]) => `${m} ${c}`).join(", ")}); after the situation list: ${allNotes.filter((n) => n.where === "topic").length}; inside a section: ${allNotes.filter((n) => n.where !== "topic").map((n) => `${n.topic} ${n.where} ${n.marker} line ${n.line} p.${n.page}`).join(", ") || "none"}`);
for (const n of allNotes.filter((n) => n.marker === "⭐" || n.marker === "📌" || n.marker === "🩺")) log(`  ${n.marker} ${n.topic} ${n.where} line ${n.line} p.${n.page}: ${n.text}`);
log(`topics with more than one note: ${parsed.filter((t) => t.notes.length > 1).map((t) => topicIdOf(t.year, t.session, t.letter)).join(", ") || "none"}`);
const multiMarker = allNotes.filter((n) => /[🔁🔗⭐📌]/u.test(n.text));
log(`notes containing a second marker inside the text: ${multiMarker.map((n) => `${n.topic} (line ${n.line})`).join(", ") || "none"}`);
json.examples = allExamples;
json.notes = allNotes;

// ---------------------------------------------------------------------------
// 2. Themes and TOC counts
// ---------------------------------------------------------------------------

log();
log("## 2. Themes: counts and table-of-contents consistency");
log("| ch | theme | main TOC count | chapter header count | chapter TOC entries | topics in body | sub-groups (TOC/body) |");
log("|---|---|---|---|---|---|---|");
const tocProblems: string[] = [];
for (const ch of chapters) {
  const mt = mainToc.find((m) => m.anchorId === ch.anchorId);
  log(`| ${ch.chapter} | ${ch.themeId} (${ch.titleDa}) | ${mt?.declaredCount ?? "MISSING"} | ${ch.declaredCount} | ${ch.tocEntries.length} | ${ch.topics.length} | ${ch.tocSubgroups.length}/${ch.subgroups.length} |`);
  if (!mt) tocProblems.push(`${ch.anchorId}: missing from main TOC`);
  else {
    if (mt.chapter !== ch.chapter) tocProblems.push(`${ch.anchorId}: main TOC chapter ${mt.chapter} ≠ header ${ch.chapter}`);
    if (mt.titleDa !== ch.titleDa) tocProblems.push(`${ch.anchorId}: main TOC Danish title "${mt.titleDa}" ≠ header "${ch.titleDa}"`);
    if (mt.titleFa !== ch.titleFa) tocProblems.push(`${ch.anchorId}: main TOC Persian title "${mt.titleFa}" ≠ header "${ch.titleFa}"`);
    if (mt.emoji !== ch.emoji) tocProblems.push(`${ch.anchorId}: main TOC emoji ${mt.emoji} ≠ header ${ch.emoji}`);
  }
  const counts = new Set([mt?.declaredCount, ch.declaredCount, ch.tocEntries.length, ch.topics.length]);
  if (counts.size !== 1) tocProblems.push(`${ch.anchorId}: counts disagree`);
  const tocAnchors = ch.tocEntries.map((e) => e.anchor).join();
  const bodyAnchors = ch.topics.map((e) => e.anchor).join();
  if (tocAnchors !== bodyAnchors) tocProblems.push(`${ch.anchorId}: chapter TOC order/anchors differ from body (${tocAnchors} vs ${bodyAnchors})`);
  ch.tocSubgroups.forEach((g, k) => {
    const b = ch.subgroups[k];
    if (!b || b.da !== g.da || b.fa !== g.fa) tocProblems.push(`${ch.anchorId}: TOC sub-group ${k + 1} "${g.da} — ${g.fa}" ≠ body "${b?.da} · ${b?.fa}"`);
  });
  for (const e of ch.tocEntries) {
    const t = parsed.find((p) => p.anchor === e.anchor);
    const bodySub = ch.topics.find((x) => x.anchor === e.anchor)?.subgroup ?? null;
    if (e.subgroup !== bodySub) tocProblems.push(`${e.anchor}: TOC sub-group ${e.subgroup} ≠ body sub-group ${bodySub}`);
    if (!t) {
      tocProblems.push(`${e.anchor}: in chapter TOC (line ${e.line.n}) but not parsed`);
      continue;
    }
    if (t.titleDa.value !== e.titleDa) tocProblems.push(`${e.anchor}: TOC title "${e.titleDa}" ≠ topic title "${t.titleDa.value}" (lines ${e.line.n}/${t.titleDa.line.n})`);
    if (t.titleFa.value !== e.titleFa) tocProblems.push(`${e.anchor}: TOC Persian title "${e.titleFa}" ≠ topic "${t.titleFa.value}" (lines ${e.line.n}/${t.titleFa.line.n})`);
    if (t.session !== e.session || t.year !== e.year || t.letter !== e.letter) tocProblems.push(`${e.anchor}: TOC term differs`);
  }
}
const total = chapters.reduce((a, c) => a + c.topics.length, 0);
log(`total topics in chapters: ${total}; main TOC sum: ${mainToc.reduce((a, m) => a + m.declaredCount, 0)}; orphan anchors (not in any chapter): ${blocks.filter((b) => !themeOf.has(b.anchor)).map((b) => b.anchor).join(", ") || "none"}`);
log(`TOC consistency problems: ${tocProblems.length}`);
for (const p of tocProblems) log(`  ${p}`);
json.chapters = chapters.map((c) => ({
  themeId: c.themeId,
  chapter: c.chapter,
  emoji: c.emoji,
  titleDa: c.titleDa,
  titleFa: c.titleFa,
  declaredCount: c.declaredCount,
  topics: c.topics.length,
  subgroups: c.subgroups.map((g) => `${g.da} · ${g.fa}`),
  pages: uniqueSorted(c.lines.map((l) => l.page)),
}));
json.tocProblems = tocProblems;

// ---------------------------------------------------------------------------
// 3. Terms
// ---------------------------------------------------------------------------

log();
log("## 3. Exam terms");
const terms = new Map<string, string[]>();
for (const t of parsed) {
  const id = termIdOf(t.year, t.session);
  terms.set(id, [...(terms.get(id) ?? []), t.letter].sort());
}
const termIds = [...terms.keys()].sort();
log(`terms: ${termIds.length}; complete A/B/C sets: ${termIds.filter((k) => terms.get(k)!.join("") === "ABC").length}`);
log(`terms: ${termIds.map((k) => `${k}[${terms.get(k)!.join("")}]`).join(" ")}`);
const late = termIds.filter((k) => k > "2024-maj");
log(`terms after Maj-Juni 2024 (confidential period): ${late.join(", ") || "none"}`);
const expectedTerms: string[] = [];
for (let y = 2016; y <= 2024; y++) for (const s of ["maj", "nov"] as const) if (!(y === 2024 && s === "nov")) expectedTerms.push(`${y}-${s}`);
log(`missing terms between 2016-maj and 2024-maj: ${expectedTerms.filter((k) => !terms.has(k)).join(", ") || "none"}`);
json.terms = Object.fromEntries(termIds.map((k) => [k, terms.get(k)]));

// ---------------------------------------------------------------------------
// 4. Template conformance and question form
// ---------------------------------------------------------------------------

log();
log("## 4. Model answers vs the three templates; question form");
const seqCount = new Map<string, number>();
const seqTopics = new Map<string, string[]>();
const openers = new Map<string, number>();
const qForm: string[] = [];
for (const t of parsed) {
  const id = topicIdOf(t.year, t.session, t.letter);
  for (const s of t.sections) {
    const kind = s.kind === "general" ? "general" : "situation";
    const { text, ranges } = parseStrongRuns(s.answer.value);
    const seq = ranges.map((r) => text.slice(r.start, r.end)).join(" | ");
    seqCount.set(`${kind}: ${seq}`, (seqCount.get(`${kind}: ${seq}`) ?? 0) + 1);
    seqTopics.set(`${kind}: ${seq}`, [...(seqTopics.get(`${kind}: ${seq}`) ?? []), `${id}.${s.kind}`]);
    const opener = text.split(/(?<=\.)\s/)[0]!;
    openers.set(`${kind}: ${opener}`, (openers.get(`${kind}: ${opener}`) ?? 0) + 1);
    const q = s.question.value;
    if (kind === "situation" && !/Hvorfor tror du/.test(q)) qForm.push(`${id} ${s.kind} (line ${s.question.line.n}): no "Hvorfor tror du": …${q.slice(-70)}`);
    if (kind === "general" && !/Hvilke fordele og ulemper/.test(q)) qForm.push(`${id} general (line ${s.question.line.n}): no "Hvilke fordele og ulemper": …${q.slice(-70)}`);
  }
}
log("bold-connective sequences in model answers:");
for (const [k, v] of [...seqCount].sort((a, b) => b[1] - a[1])) log(`  ${v}× ${k}${v < 5 ? `  ← ${seqTopics.get(k)!.join(", ")}` : ""}`);
log("first sentences of model answers:");
for (const [k, v] of [...openers].sort((a, b) => b[1] - a[1])) log(`  ${v}× ${k}`);
log(`required questions not in the usual form: ${qForm.length}`);
for (const q of qForm) log(`  ${q}`);
json.connectiveSequences = Object.fromEntries(seqCount);
json.answerOpeners = Object.fromEntries(openers);
json.questionForm = qForm;

// ---------------------------------------------------------------------------
// 5. Characters and orthography
// ---------------------------------------------------------------------------

log();
log("## 5. Characters and orthography (whole file)");
interface CharCheck {
  name: string;
  re: RegExp;
}
const checks: CharCheck[] = [
  { name: "Arabic yeh ي U+064A", re: /\u064A/gu },
  { name: "Arabic kaf ك U+0643", re: /\u0643/gu },
  { name: "Arabic presentation forms U+FB50–FDFF, U+FE70–FEFE", re: /[\uFB50-\uFDFF\uFE70-\uFEFE]/gu },
  { name: "Arabic-Indic digits U+0660–0669", re: /[\u0660-\u0669]/gu },
  { name: "tatweel U+0640", re: /\u0640/gu },
  { name: "Arabic diacritics other than tanwin-fath U+064B and kasra U+0650 (both normal Persian)", re: /[\u064C-\u064F\u0651-\u065F\u0670]/gu },
  { name: "teh marbuta ة U+0629", re: /\u0629/gu },
  { name: "alef maksura ى U+0649", re: /\u0649/gu },
  { name: "heh with yeh above ۀ U+06C0", re: /\u06C0/gu },
  { name: "bidi controls (LRM/RLM/ALM/embeddings/isolates)", re: /[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069]/gu },
  { name: "NBSP / narrow NBSP", re: /[\u00A0\u202F]/gu },
  { name: "soft hyphen U+00AD", re: /\u00AD/gu },
  { name: "zero-width space / word joiner / BOM", re: /[\u200B\u2060\uFEFF]/gu },
  { name: "tab", re: /\t/gu },
  { name: "replacement char U+FFFD", re: /\uFFFD/gu },
  { name: "C0/C1 control characters", re: /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu },
  { name: "HTML entities (&…;)", re: /&[a-zA-Z#0-9]+;/gu },
  { name: "ZWNJ next to whitespace, punctuation or line edge", re: /(^|[\s.,;:!?،؛؟«»()])\u200C|\u200C($|[\s.,;:!?،؛؟«»()])/gu },
  { name: "doubled ZWNJ", re: /\u200C\u200C/gu },
  { name: "ZWNJ next to a Latin letter or digit", re: /[\p{Script=Latin}0-9]\u200C|\u200C[\p{Script=Latin}0-9]/gu },
  { name: "ZWJ U+200D outside emoji sequences", re: /(?<!\p{Extended_Pictographic}\uFE0F?)\u200D|\u200D(?!\p{Extended_Pictographic})/gu },
];
const charReport: Array<{ check: string; count: number; lines: number[] }> = [];
for (const c of checks) {
  const hits: number[] = [];
  let count = 0;
  for (const l of src.lines) {
    const m = l.raw.match(c.re);
    if (m) {
      count += m.length;
      hits.push(l.n);
    }
  }
  charReport.push({ check: c.name, count, lines: hits });
  log(`  ${count === 0 ? "ok  " : "FLAG"} ${c.name}: ${count}${hits.length ? ` (lines ${hits.slice(0, 12).join(", ")}${hits.length > 12 ? " …" : ""})` : ""}`);
}
const nonNfc = src.lines.filter((l) => l.raw !== l.raw.normalize("NFC")).map((l) => l.n);
log(`  ${nonNfc.length ? "FLAG" : "ok  "} lines not in NFC: ${nonNfc.length}${nonNfc.length ? ` (${nonNfc.slice(0, 12).join(", ")})` : ""}`);
const trailing = src.lines.filter((l) => /[ \t]+$/.test(l.raw)).map((l) => l.n);
log(`  ${trailing.length ? "note" : "ok  "} lines with trailing spaces: ${trailing.length}${trailing.length ? ` (${trailing.slice(0, 12).join(", ")}${trailing.length > 12 ? " …" : ""})` : ""}`);
const zwnj = (src.text.match(/\u200C/gu) ?? []).length;
log(`  info tanwin-fath U+064B (e.g. \u0645\u062B\u0644\u0627\u064B): ${(src.text.match(/\u064B/gu) ?? []).length}; kasra U+0650 marking ezafe: ${(src.text.match(/\u0650/gu) ?? []).length}`);
const ezafe = {
  "ه\u200Cی (heh + ZWNJ + yeh)": (src.text.match(/ه\u200Cی(?![\p{L}])/gu) ?? []).length,
  "ه\u0654 (heh + hamza above)": (src.text.match(/ه\u0654/gu) ?? []).length,
  "ۀ (U+06C0)": (src.text.match(/\u06C0/gu) ?? []).length,
};
log(`  info ZWNJ count: ${zwnj}; ezafe-after-heh spellings: ${Object.entries(ezafe).map(([k, v]) => `${k} ${v}`).join(", ")}`);
const digits = {
  persian: (src.text.match(/[۰-۹]/gu) ?? []).length,
  latinInsideFaSpans: [...src.text.matchAll(/<span lang="fa" dir="rtl">([^<]*)<\/span>/gu)].reduce((a, m) => a + (m[1]!.match(/[0-9]/g) ?? []).length, 0),
};
log(`  info digits: Persian ۰–۹ ${digits.persian}; Latin 0–9 inside Persian spans ${digits.latinInsideFaSpans}`);
json.characters = { checks: charReport, nonNfc, trailing, zwnj, ezafe, digits };

// Field-level facts for the topics
log();
log("## 6. Field-level facts (main topics)");
const daFields: Array<{ id: string; text: string }> = [];
const faFields: Array<{ id: string; text: string }> = [];
for (const t of parsed) {
  const id = topicIdOf(t.year, t.session, t.letter);
  daFields.push({ id: `${id}.title`, text: t.titleDa.value });
  faFields.push({ id: `${id}.title`, text: t.titleFa.value });
  for (const s of t.situations) {
    daFields.push({ id: `${id}.sit${s.key}.title`, text: s.da });
    faFields.push({ id: `${id}.sit${s.key}.title`, text: s.fa });
  }
  for (const s of t.sections) {
    const q = s.kind === "general" ? "q2" : "q1";
    daFields.push({ id: `${id}.${s.kind}.${q}`, text: s.question.value });
    daFields.push({ id: `${id}.${s.kind}.${q}.answer`, text: stripTags(s.answer.value) });
    faFields.push({ id: `${id}.${s.kind}.${q}`, text: s.translation.value });
    s.keywords.forEach((k, i) => {
      daFields.push({ id: `${id}.${s.kind}.${q}.kw${i + 1}`, text: k.da });
      faFields.push({ id: `${id}.${s.kind}.${q}.kw${i + 1}`, text: k.fa });
    });
    s.followups.forEach((f, i) => {
      daFields.push({ id: `${id}.${s.kind}.followup${i + 1}`, text: f.question.value });
      daFields.push({ id: `${id}.${s.kind}.followup${i + 1}.answer`, text: f.answer.value });
      faFields.push({ id: `${id}.${s.kind}.followup${i + 1}`, text: f.translation.value });
    });
    s.examples.forEach((e, i) => daFields.push({ id: `${id}.${s.kind}.example${i + 1}`, text: e.da }));
  }
}
const quoteChars = new Map<string, number>();
for (const f of daFields) for (const ch of f.text.match(/[“”„‟«»‹›"'‘’]/gu) ?? []) quoteChars.set(ch, (quoteChars.get(ch) ?? 0) + 1);
log(`Danish fields: ${daFields.length}; Persian fields: ${faFields.length}`);
log(`quote characters inside Danish fields: ${[...quoteChars].map(([k, v]) => `${k} ×${v}`).join(", ") || "none"}`);
const abbrev = new Map<string, number>();
for (const f of daFields) for (const m of f.text.matchAll(/(?<![\p{L}])(fx|f\.eks\.|ca\.|osv\.|bl\.a\.|dvs\.|pga\.|evt\.|mht\.|kr\.|nr\.)(?![\p{L}])/gu)) abbrev.set(m[1]!, (abbrev.get(m[1]!) ?? 0) + 1);
log(`abbreviations in Danish fields (TTS lexicon candidates): ${[...abbrev].map(([k, v]) => `${k} ×${v}`).join(", ") || "none"}`);
const numbers = daFields.filter((f) => /\d/.test(f.text));
log(`Danish fields containing digits (TTS number reading): ${numbers.length}`);
const ellipsis = daFields.filter((f) => /…|\.\.\./.test(f.text));
log(`Danish fields containing an ellipsis: ${ellipsis.length}${ellipsis.length ? " (" + ellipsis.map((f) => f.id).slice(0, 8).join(", ") + ")" : ""}`);
const latinInFa = faFields.filter((f) => /\p{Script=Latin}/u.test(f.text));
log(`Persian fields with Latin-script runs (need bidi isolation in UI): ${latinInFa.length}/${faFields.length}`);
const dupMap = new Map<string, string[]>();
for (const f of daFields.filter((x) => !/\.kw\d$|\.title$/.test(x.id))) dupMap.set(f.text, [...(dupMap.get(f.text) ?? []), f.id]);
const dups = [...dupMap].filter(([, ids]) => ids.length > 1);
log(`identical Danish questions/answers appearing in more than one place: ${dups.length}`);
for (const [text, ids] of dups) log(`  ${ids.join(" = ")}: "${text.slice(0, 70)}${text.length > 70 ? "…" : ""}"`);
json.fields = { da: daFields.length, fa: faFields.length, quoteChars: Object.fromEntries(quoteChars), abbreviations: Object.fromEntries(abbrev), daWithDigits: numbers.map((f) => f.id), latinInFa: latinInFa.map((f) => f.id), duplicates: dups.map(([text, ids]) => ({ ids, text })) };

// ---------------------------------------------------------------------------
// 7. Appendix
// ---------------------------------------------------------------------------

log();
log("## 7. Appendix (2013–2015 detailed topics, 2004–2012 titles)");
const app = parseAppendix(src);
log(`detailed appendix topics: ${app.topics.length}; with app- anchors: ${app.topics.filter((t) => t.anchor).length} (${app.topics.filter((t) => t.anchor).map((t) => t.anchor).join(", ")})`);
log("| term | title | emoji | anchor | sections | kw | follow-up (Danish only) | pages |");
log("|---|---|---|---|---|---|---|---|");
for (const t of app.topics) {
  log(`| ${sessionLabel(t.session)} ${t.year} ${t.letter} | ${t.titleDa.value} | ${t.emoji} | ${t.anchor ?? "–"} | ${t.sections.map((s) => s.label).join(",")} | ${t.sections.map((s) => s.keywords.length).join("/")} | ${t.sections.map((s) => (s.followup ? "1" : "0")).join("/")} | ${pagesOf(t.lines).join(",")} |`);
}
const emojiToTheme = new Map(chapters.map((c) => [c.emoji, c.themeId]));
const appThemes = app.topics.map((t) => `${t.year}-${t.session}-${t.letter.toLowerCase()} ${t.emoji}→${emojiToTheme.get(t.emoji) ?? "NO MATCHING CHAPTER"}`);
log(`appendix emoji → chapter theme: ${appThemes.join("; ")}`);
log(`2004–2012 titles-only table starts at line ${app.titleTableStart?.n ?? "?"} (p. ${app.titleTableStart?.page ?? "?"})`);
const titleRows = src.lines.filter((l) => /^\| (Maj-Juni|Nov-Dec) (\d{4}) \|/.test(l.raw));
const titleTerms = titleRows.map((l) => /^\| (Maj-Juni|Nov-Dec) (\d{4})/.exec(l.raw)!).map((m) => `${m[2]}-${m[1] === "Maj-Juni" ? "maj" : "nov"}`);
const expectedOld: string[] = [];
for (let y = 2004; y <= 2012; y++) for (const s of ["maj", "nov"]) expectedOld.push(`${y}-${s}`);
log(`titles-only rows: ${titleRows.length} terms × 3 = ${titleRows.length * 3} titles; missing terms 2004–2012: ${expectedOld.filter((k) => !titleTerms.includes(k)).join(", ") || "none"}`);
json.appendix = {
  topics: app.topics.map((t) => ({
    id: topicIdOf(t.year, t.session, t.letter),
    anchor: t.anchor,
    emoji: t.emoji,
    title: t.titleDa.value,
    sections: t.sections.map((s) => ({ label: s.label, keywords: s.keywords.length, followup: !!s.followup })),
    pages: pagesOf(t.lines),
  })),
  titleRows: titleTerms,
};

// ---------------------------------------------------------------------------
// 8. Non-topic sections
// ---------------------------------------------------------------------------

log();
log("## 8. Non-topic sections (outline: headings with item counts)");
function outline(src: Source, fromAnchor: string, toAnchor: string | null, fromLine?: number, toLine?: number) {
  const s = fromLine ?? src.lines.findIndex((l) => l.raw.trim() === `<a id="${fromAnchor}"></a>`) + 1;
  const e = toLine ?? (toAnchor ? src.lines.findIndex((l) => l.raw.trim() === `<a id="${toAnchor}"></a>`) + 1 : src.lines.length);
  const toks = contentTokens(src.lines.slice(s - 1, e - 1));
  const rows: Array<{ heading: string; line: number; page: number; counts: Record<string, number> }> = [];
  let cur: (typeof rows)[number] | null = null;
  for (const t of toks) {
    if (t.kind === "h3" || t.kind === "h4") {
      cur = { heading: `${t.kind === "h3" ? "###" : "####"} ${stripTags(t.content)}`, line: t.line.n, page: t.line.page, counts: {} };
      rows.push(cur);
      continue;
    }
    if (!cur) {
      cur = { heading: "(before first heading)", line: t.line.n, page: t.line.page, counts: {} };
      rows.push(cur);
    }
    let k: string = t.kind;
    if (t.kind === "tableRow") k = /^\|\s*-{3}/.test(t.content) ? "tableSep" : "tableRow";
    if (t.kind === "anchor") continue;
    cur.counts[k] = (cur.counts[k] ?? 0) + 1;
  }
  for (const r of rows) log(`  line ${r.line} p.${r.page} ${r.heading} → ${Object.entries(r.counts).filter(([k]) => k !== "tableSep").map(([k, v]) => `${k} ${v}`).join(", ") || "(empty)"}`);
  return { lines: [s, e - 1], pages: uniqueSorted(src.lines.slice(s - 1, e - 1).map((l) => l.page)), rows };
}
const sections: Record<string, unknown> = {};
log("### front matter (cover, guide, TOC)");
sections.front = outline(src, "", null, 1, src.lines.findIndex((l) => l.raw.trim() === '<a id="siri"></a>') + 1);
for (const [a, b] of [
  ["siri", "skeletons"],
  ["skeletons", "universal"],
  ["universal", "cat-arbejde"],
  ["recurring", "appendix"],
  ["vocab", null],
] as const) {
  log(`### ${a}`);
  sections[a] = outline(src, a, b);
}
json.sections = sections;

// Recurring table
log();
log("## 9. Recurring-questions table");
const recRows = src.lines.filter((l) => /^\| \d+ \| /.test(l.raw));
const REF = /\[(Maj-Juni|Nov-Dec) (\d{4}) · ([ABC])(?: \((overordnet|sit\. A|sit\. B)\)| 📜)\]\(#((?:t|app)-[MN]\d{2}[ABC])\)/gu;
const allAnchors = new Set(src.lines.flatMap((l) => {
  const a = /^<a id="([^"]+)"><\/a>$/.exec(l.raw.trim())?.[1];
  return a === undefined ? [] : [a];
}));
const recProblems: string[] = [];
let refCount = 0;
let appRefs = 0;
const rec = recRows.map((l) => {
  const m = /^\| (\d+) \| (.+?)<br><span lang="fa" dir="rtl">([^<]+)<\/span> \| (.+) \|$/.exec(l.raw);
  if (!m) {
    recProblems.push(`line ${l.n}: row does not match '| n | DA<br><span fa>FA</span> | refs |'`);
    return null;
  }
  const refs = [...m[4]!.matchAll(REF)].map((r) => ({ term: `${r[2]}-${r[1] === "Maj-Juni" ? "maj" : "nov"}`, letter: r[3], section: r[4] ?? "appendix", anchor: r[5]! }));
  const leftover = m[4]!.replace(REF, "").replace(/ · /g, "").trim();
  if (leftover) recProblems.push(`line ${l.n}: unparsed text in refs cell: "${leftover}"`);
  for (const r of refs) {
    refCount++;
    if (r.anchor.startsWith("app-")) appRefs++;
    if (!allAnchors.has(r.anchor)) recProblems.push(`line ${l.n}: ref #${r.anchor} does not resolve`);
    const a = parseTopicAnchor(r.anchor);
    if (termIdOf(a.year, a.session) !== r.term || a.letter !== r.letter) recProblems.push(`line ${l.n}: link text ${r.term} ${r.letter} ≠ anchor ${r.anchor}`);
  }
  return { n: Number(m[1]), da: m[2], fa: m[3], refs, line: l.n, page: l.page };
});
log(`rows: ${recRows.length} (numbered ${rec[0]?.n}–${rec.at(-1)?.n}); references: ${refCount} (${appRefs} to appendix topics); problems: ${recProblems.length}`);
for (const p of recProblems) log(`  ${p}`);
json.recurring = { rows: rec, problems: recProblems };

// Cover claims
log();
log("## 10. Cover / guide claims vs parsed counts");
const requiredQ = parsed.reduce((a, t) => a + t.sections.length, 0);
const followQ = parsed.reduce((a, t) => a + t.sections.reduce((b, s) => b + s.followups.length, 0), 0);
log(`cover: "۵۱ موضوع" → parsed ${parsed.length}; "۳۰۶ سؤال و جواب" → required ${requiredQ} + follow-up ${followQ} = ${requiredQ + followQ}; "۱۰ فصل موضوعی" → ${chapters.length}`);
const quotedQuestions = src.lines.filter((l) => /^> <strong>“/.test(l.raw)).length;
const otherQuotes = src.lines.filter((l) => /^> /.test(l.raw) && !/^> <strong>“/.test(l.raw)).length;
const arrows = src.lines.filter((l) => /^↳ /.test(l.raw)).length;
const strongQ = src.lines.filter((l) => /^<strong>“/.test(l.raw)).length;
log(`blockquoted questions: ${quotedQuestions}; follow-up questions (<strong>“…”</strong>): ${strongQ}; other blockquotes: ${otherQuotes}; ↳ answers: ${arrows}`);
json.claims = { topics: parsed.length, requiredQ, followQ, quotedQuestions, strongQ, otherQuotes, arrows };

// Confidentiality rule over the whole source
log();
log("## 11. Confidentiality rule (years 2025+, Skriftlig/Mundtlig 2024+, Nov-Dec 2024) over every line");
const conf = src.lines.map((l) => ({ n: l.n, page: l.page, hits: confidentialityHits(stripTags(l.raw)), text: stripTags(l.raw).trim() })).filter((x) => x.hits.length);
for (const c of conf) log(`  line ${c.n} p.${c.page}: ${c.hits.join(", ")} :: ${c.text.slice(0, 110)}`);
log(`hits: ${conf.length}`);
json.confidentiality = conf;

// ---------------------------------------------------------------------------

const text = out.join("\n") + "\n";
process.stdout.write(text);
if (process.argv.includes("--json")) {
  const dir = resolve(REPO_ROOT, ".cache/content");
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "survey.json"), JSON.stringify(json, null, 2) + "\n");
  writeFileSync(resolve(dir, "survey.txt"), text);
  process.stderr.write(`wrote .cache/content/survey.json and survey.txt\n`);
}
if (parseErrors.length) process.exitCode = 1;
