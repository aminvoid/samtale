/**
 * Verify SIRI transcriptions (scripts/content/data/siri-*.json) against the SIRI PDF's own text,
 * and that content/ uses them unchanged.
 *
 * Setup per source (raw files stay in gitignored .cache/):
 *   mkdir -p .cache/content/sources/<id> && curl -sSfL -o .cache/content/sources/<id>/document.pdf "<document.url>"
 *   swift scripts/content/pdf-text.swift .cache/content/sources/<id>/document.pdf .cache/content/sources/<id>/text
 *   node scripts/content/check-siri.ts
 *
 * Matching: whitespace, hyphen-minus and quotation marks are ignored (SIRI wraps lines with hyphens
 * and quotes each part), everything else must be identical. A text-layer line-order swap (the end of
 * the sentence stored immediately before its start) is accepted and reported; any gap fails.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT, normalizeText } from "./lib/source.ts";
import { TopicFileSchema, type TopicFile } from "@/lib/content/schema/authoring";
import { SiriTranscriptionSchema, type SiriItem, type SiriTranscription } from "./lib/pipeline-schema.ts";

const DATA = resolve(REPO_ROOT, "scripts/content/data");
const key = (s: string) => s.normalize("NFC").replace(/[\s\-"”“„«»]/gu, "");
const failures: string[] = [];
const notes: string[] = [];
let checked = 0;
let contiguous = 0;

function pieces(target: string, page: string): 0 | 1 | 2 {
  const t = key(target);
  if (page.includes(t)) return 1;
  // A text-layer line-order swap stores the end of the sentence immediately BEFORE its start.
  // Only that exact signature is accepted; a gap (missing words) is not.
  for (let i = 8; i < t.length - 8; i++) if (page.includes(t.slice(i) + t.slice(0, i))) return 2;
  return 0;
}

for (const f of readdirSync(DATA).filter((x) => /^siri-.+\.json$/.test(x)).sort()) {
  const s: SiriTranscription = SiriTranscriptionSchema.parse(JSON.parse(readFileSync(resolve(DATA, f), "utf8")));
  const dir = resolve(REPO_ROOT, ".cache/content/sources", s.id);
  if (!existsSync(resolve(dir, "text"))) {
    failures.push(`${s.id}: missing ${dir}/text (see setup in the header)`);
    continue;
  }
  const pdf = resolve(dir, "document.pdf");
  const sha = existsSync(pdf) ? createHash("sha256").update(readFileSync(pdf)).digest("hex") : "missing";
  if (sha !== s.document.sha256) failures.push(`${s.id}: document sha256 ${sha} ≠ recorded ${s.document.sha256} (different file than the one transcribed)`);
  const page = (p: number) => key(readFileSync(resolve(dir, "text", `page-${String(p).padStart(3, "0")}.txt`), "utf8"));
  const verify = (label: string, text: string, pages: number[]) => {
    checked++;
    const results = pages.map((p) => pieces(text, page(p)));
    const best = results.includes(1) ? 1 : results.includes(2) ? 2 : 0;
    if (best === 0) failures.push(`${s.id} ${label}: not found on p. ${pages.join(", ")}: ${JSON.stringify(text.slice(0, 90))}`);
    else if (best === 2) notes.push(`${s.id} ${label}: found in two pieces on p. ${pages.join(", ")} (text-layer line-order swap)`);
    else contiguous++;
  };

  const topics = Object.entries(s.topics);
  const { intro, closing } = s.examinerLines;
  if (intro) for (const [, t] of topics) verify(`examinerLines.intro ({topic} = ${t.title})`, intro.text.replace("{topic}", t.title), intro.pages);
  if (closing) verify("examinerLines.closing", closing.text, closing.pages);

  for (const [id, t] of topics) {
    const items: Array<[string, SiriItem | undefined]> = [
      ["sitA.intro", t.sitA.intro], ["sitA.q1", t.sitA.q1], ["sitA.followup1", t.sitA.followup1],
      ["sitB.intro", t.sitB.intro], ["sitB.q1", t.sitB.q1], ["sitB.followup1", t.sitB.followup1],
      ["general.q2", t.general.q2], ["general.followup1", t.general.followup1],
    ];
    for (const [label, it] of items) {
      if (!it) continue;
      it.parts.forEach((part, i) => {
        verify(`${id}.${label}${it.parts.length > 1 ? ` part ${i + 1}` : ""}`, part, [it.page]);
      });
    }

    // content/ must use the transcription unchanged.
    const file = resolve(REPO_ROOT, "content/topics", `${id}.json`);
    if (!existsSync(file)) continue;
    const topic: TopicFile = TopicFileSchema.parse(JSON.parse(readFileSync(file, "utf8")));
    const join = (it: SiriItem) => it.parts.map(normalizeText).join(" ");
    for (const sit of topic.situations) {
      const src = sit.key === "A" ? t.sitA : t.sitB;
      if (src.intro && sit.intro?.text.da !== join(src.intro)) failures.push(`content ${sit.id}.intro differs from the transcription`);
      if (sit.question.siriCheck.siriParts?.join(" ") !== join(src.q1)) failures.push(`content ${sit.question.id} siriParts differ from the transcription`);
    }
  }
}

process.stdout.write(
  [
    `SIRI transcription check: ${checked - failures.filter((x) => x.includes("not found")).length}/${checked} strings found in the SIRI PDF text (${contiguous} contiguous, ${notes.length} in two pieces)`,
    ...notes.map((n) => `  note: ${n}`),
    failures.length ? `FAILURES (${failures.length}):\n  ${failures.join("\n  ")}` : "result: PASS",
  ].join("\n") + "\n",
);
if (failures.length) process.exitCode = 1;
