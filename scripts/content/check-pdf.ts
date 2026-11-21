/**
 * Cross-check the Danish text in content/ against the PDF's own text layer.
 *
 *   swift scripts/content/pdf-text.swift docs/resources/PD3_Mundtlig_Delproeve2.pdf .cache/content/booklet/text
 *   node scripts/content/check-pdf.ts
 *
 * For every Danish string, looks for it (whitespace-collapsed) on the PDF page recorded in
 * .cache/content/provenance/, then on the neighbouring pages. Persian is NOT checked: PDFKit
 * returns it fragmented and partly as presentation forms, so the owner reviews it by eye.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT } from "./lib/source.ts";
import type { ProvenanceMap } from "./lib/build.ts";
import { TopicFileSchema, type QuestionSection, type TopicFile } from "@/lib/content/schema/authoring";
import { ProvenanceMapSchema } from "./lib/pipeline-schema.ts";

const PDF_DIR = resolve(REPO_ROOT, ".cache/content/booklet/text");
if (!existsSync(PDF_DIR)) {
  process.stderr.write("missing .cache/content/booklet/text; run the swift extractor first (see header)\n");
  process.exit(2);
}
const norm = (s: string) => s.normalize("NFC").replace(/\s+/gu, " ").trim();
const pageText = (p: number): string => {
  const f = resolve(PDF_DIR, `page-${String(p).padStart(3, "0")}.txt`);
  return existsSync(f) ? norm(readFileSync(f, "utf8")) : "";
};

const CONTENT = resolve(REPO_ROOT, "content");
const topics: TopicFile[] = readdirSync(resolve(CONTENT, "topics"))
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => TopicFileSchema.parse(JSON.parse(readFileSync(resolve(CONTENT, "topics", f), "utf8"))));

interface Item {
  id: string;
  kind: string;
  da: string;
  provPath: string;
}

function items(t: TopicFile): Item[] {
  const out: Item[] = [{ id: t.id, kind: "topic title", da: t.title.da!, provPath: "title" }];
  const sec = (s: QuestionSection, path: string) => {
    out.push({ id: s.question.id, kind: "required question", da: s.question.text.da!, provPath: `${path}.question.text.da` });
    s.question.keywords.forEach((k, i) => out.push({ id: k.id, kind: "key word", da: k.text.da!, provPath: `${path}.question.keywords[${i}]` }));
    out.push({ id: s.question.modelAnswer.id, kind: "model answer", da: s.question.modelAnswer.text.da!, provPath: `${path}.question.modelAnswer` });
    s.followups.forEach((f, i) => {
      out.push({ id: f.id, kind: "follow-up question", da: f.text.da!, provPath: `${path}.followups[${i}].text.da` });
      out.push({ id: f.answer.id, kind: "follow-up answer", da: f.answer.text.da!, provPath: `${path}.followups[${i}].answer` });
    });
    s.personalExamples.forEach((e, i) => out.push({ id: e.id, kind: "personal example", da: e.text.da!, provPath: `${path}.personalExamples[${i}]` }));
  };
  t.situations.forEach((s, i) => {
    out.push({ id: `${s.id}.title`, kind: "situation title", da: s.title.da!, provPath: `situations[${i}].title` });
    sec(s, `situations[${i}]`);
  });
  sec(t.general, "general");
  return out;
}

/**
 * Differences that are PDF text-layer artefacts, verified by hand (pilot report §1.11). Each is still
 * reported on every run; anything not listed here fails the check.
 */
const KNOWN_ARTEFACTS: Record<string, string> = {
  "2018-maj-c.sitB.q1.answer": "line-end hyphen in 'online-nyheder' (p. 61); the PDF prints 'online-medier' mid-line, so the hyphen is the author's",
  "2020-maj-a.general.followup1": "line-end hyphen in 'online-fællesskaber' (p. 63); same convention",
  "2021-nov-a.sitA.q1.answer": "text layer inserts a space in '„bedst før“-datoen' (p. 68)",
  "2018-nov-c.sitA.q1.kw2": "bidi: the RTL line moves '?' before 'virker undervisningen' (p. 75)",
  "2020-maj-b.general.example1": "bidi: Persian fragments interleaved into the Danish line (p. 53)",
};
const knownNotes: string[] = [];

const byKind = new Map<string, { ok: number; total: number }>();
const problems: string[] = [];
const bidiNotes: string[] = [];
for (const t of topics) {
  const prov: ProvenanceMap = ProvenanceMapSchema.parse(JSON.parse(readFileSync(resolve(REPO_ROOT, ".cache/content/provenance", `${t.id}.json`), "utf8")));
  for (const it of items(t)) {
    const k = byKind.get(it.kind) ?? { ok: 0, total: 0 };
    k.total++;
    byKind.set(it.kind, k);
    const page = prov[it.provPath]!.page;
    const needle = norm(it.da);
    if (pageText(page).includes(needle)) {
      k.ok++;
      continue;
    }
    // Danish embedded in a Persian (RTL) line: the PDF text layer stores the sentence-final
    // period at the start ("…: .Jeg arbejder … travlt"). Same words; reported, not hidden.
    if (needle.endsWith(".") && pageText(page).includes("." + needle.slice(0, -1))) {
      k.ok++;
      bidiNotes.push(`${it.id} (${it.kind}): matches page ${page}; the final "." appears before the sentence in the PDF text layer (RTL line, bidi artefact)`);
      continue;
    }
    const known = KNOWN_ARTEFACTS[it.id];
    if (known !== undefined) {
      k.ok++;
      knownNotes.push(`${it.id} (${it.kind}): known artefact: ${known}`);
      continue;
    }
    const near = [page - 1, page + 1].find((p) => pageText(p).includes(needle));
    if (near) problems.push(`${it.id} (${it.kind}): found on PDF page ${near}, not on recorded page ${page}`);
    else if (pageText(page).includes(needle.replace(/ /g, "")) || pageText(page).replace(/ /g, "").includes(needle.replace(/ /g, ""))) {
      problems.push(`${it.id} (${it.kind}): matches page ${page} only when spaces are ignored (line-break artefact?)`);
    } else problems.push(`${it.id} (${it.kind}): NOT found on PDF page ${page} or neighbours: ${JSON.stringify(needle.slice(0, 90))}`);
  }
}

const total = [...byKind.values()].reduce((a, b) => a + b.total, 0);
const ok = [...byKind.values()].reduce((a, b) => a + b.ok, 0);
process.stdout.write(
  [
    `PDF cross-check (Danish only): ${ok}/${total} strings found verbatim on their recorded PDF page`,
    ...[...byKind].map(([k, v]) => `  ${k}: ${v.ok}/${v.total}`),
    ...bidiNotes.map((n) => `  note: ${n}`),
    ...knownNotes.map((n) => `  note: ${n}`),
    problems.length ? `differences (${problems.length}):\n  ${problems.join("\n  ")}` : "no differences",
  ].join("\n") + "\n",
);
if (problems.length) process.exitCode = 1;
