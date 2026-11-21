/**
 * Voice listening set (speech-engineer, 2026-11-20). Writes a few short clips per candidate voice
 * into .cache/audio/samples/ (gitignored), each with a JSON sidecar holding its SSML and word
 * boundaries, so the owner can choose voices before any real generation run.
 *
 *   npm run audio:samples -- --phase probe [--dry-run]       q1 of 2024-maj-b in every native da-DK voice
 *   npm run audio:samples -- --phase set --examiner a,b --answer c,d --slow a,c [--dry-run]
 *   npm run audio:samples -- --phase hints --examiner a,b [--dry-run]   sound check + "Hvorfor eller hvorfor ikke?"
 *
 * A hard cap on billable characters (ledger in usage.json, failed requests included) stops it
 * from ever spending more than the agreed sample budget. Existing files are never re-synthesized.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { parseSpeechEnv } from "./env.ts";
import { createAzureSynthesizer } from "./lib/azure.ts";
import { collectItems } from "./lib/items.ts";
import { loadContent } from "./lib/load.ts";
import { buildSsml, type SsmlSettings } from "./lib/ssml.ts";
import { toWordTuples } from "./lib/words.ts";

const CAP = 5_000;
const root = resolve(import.meta.dirname, "../..");
const outDir = resolve(root, ".cache/audio/samples");
const ledgerPath = resolve(outDir, "usage.json");
const out = (s: string) => process.stdout.write(`${s}\n`);

const content = loadContent(root);
const byId = new Map(collectItems(content.topics, content.lines, { keywords: false }, content.extra).map((i) => [i.id, i.text]));
const textOf = (id: string) => {
  const t = byId.get(id);
  if (t === undefined) throw new Error(`No audio item ${id}`);
  return t;
};
const texts = {
  intro: textOf("examiner.intro:2024-maj-b"),
  sitIntro: textOf("2024-maj-b.sitA.intro"),
  q1: textOf("2024-maj-b.sitA.q1"),
  answer: textOf("2024-maj-b.sitA.q1.answer"),
  soundCheck: textOf("examiner.soundCheck"),
  whyFollowup: textOf("2024-maj-b.general.followup1"),
};

/** The same factor as C20 slowRepeatRate 0.75, for a fair comparison with playbackRate. */
const SLOW: SsmlSettings = { rate: "-25%" };

/** Native da-DK voices in swedencentral on 2026-11-20 (npm run audio:voices). */
const ALL = [
  "da-DK-ChristelNeural",
  "da-DK-JeppeNeural",
  "da-DK-Christel:DragonLatestNeural",
  "da-DK-Harper:MAI-Voice-2.1",
  "da-DK-Grant:MAI-Voice-2.1",
  "da-DK-Harper:MAI-Voice-2.1-Flash",
  "da-DK-Grant:MAI-Voice-2.1-Flash",
];

interface Job {
  file: string;
  voice: string;
  text: string;
  settings?: SsmlSettings;
}

const slug = (voice: string) => voice.replace(/^da-DK-/, "").replace(/[:.]/g, "-");

const { values } = parseArgs({
  options: {
    phase: { type: "string", default: "probe" },
    "dry-run": { type: "boolean", default: false },
    examiner: { type: "string", default: "" },
    answer: { type: "string", default: "" },
    slow: { type: "string", default: "" },
  },
});
const list = (s: string | undefined) => (s ?? "").split(",").filter(Boolean);
const examiners = list(values.examiner);
const answers = list(values.answer);
const slow = new Set(list(values.slow));

const jobs: Job[] = [];
switch (values.phase) {
  case "probe":
    for (const voice of ALL) jobs.push({ file: `q1--${slug(voice)}.mp3`, voice, text: texts.q1 });
    break;
  case "set":
    for (const voice of examiners) {
      jobs.push({ file: `intro--${slug(voice)}.mp3`, voice, text: texts.intro });
      jobs.push({ file: `sitA-intro--${slug(voice)}.mp3`, voice, text: texts.sitIntro });
      if (slow.has(voice)) jobs.push({ file: `q1-slow--${slug(voice)}.mp3`, voice, text: texts.q1, settings: SLOW });
    }
    for (const voice of answers) {
      jobs.push({ file: `answer--${slug(voice)}.mp3`, voice, text: texts.answer });
      if (slow.has(voice)) jobs.push({ file: `answer-slow--${slug(voice)}.mp3`, voice, text: texts.answer, settings: SLOW });
    }
    break;
  case "hints":
    for (const voice of examiners) jobs.push({ file: `soundcheck--${slug(voice)}.mp3`, voice, text: texts.soundCheck });
    for (const voice of examiners.slice(0, 1)) {
      jobs.push({ file: `why-followup--${slug(voice)}.mp3`, voice, text: texts.whyFollowup });
    }
    break;
  default:
    throw new Error("--phase must be probe, set or hints");
}

const ledgerSchema = z.object({
  totalBillable: z.number().int().nonnegative(),
  requests: z.array(z.object({ file: z.string(), voice: z.string(), billable: z.number(), at: z.string() })),
});
mkdirSync(outDir, { recursive: true });
const ledger = existsSync(ledgerPath)
  ? ledgerSchema.parse(JSON.parse(readFileSync(ledgerPath, "utf8")))
  : { totalBillable: 0, requests: [] };

const pending = jobs
  .filter((j) => !existsSync(resolve(outDir, j.file)))
  .map((j) => ({ ...j, built: buildSsml(j.text, j.voice, j.settings) }));
const planned = pending.reduce((s, j) => s + j.built.billableChars, 0);
out(`samples: ${String(pending.length)} new clips, ${String(planned)} billable characters; spent so far ${String(ledger.totalBillable)}; cap ${String(CAP)}`);
if (ledger.totalBillable + planned > CAP) {
  process.stderr.write(`Refusing: this would exceed the ${String(CAP)}-character sample cap.\n`);
  process.exit(1);
}
if (values["dry-run"]) {
  for (const j of pending) out(`  ${j.file}  ${String(j.built.billableChars)}`);
  process.exit(0);
}

const synth = createAzureSynthesizer(parseSpeechEnv(process.env));
let failures = 0;
for (const j of pending) {
  try {
    const result = await synth.synthesize(j.built.ssml);
    writeFileSync(resolve(outDir, j.file), result.audio);
    const words = toWordTuples(result.boundaries, j.built, j.text);
    const sidecar = {
      voice: j.voice,
      settings: j.settings ?? {},
      text: j.text,
      ssml: j.built.ssml,
      billableChars: j.built.billableChars,
      durationMs: result.durationMs,
      bytes: result.audio.byteLength,
      words,
      boundaries: result.boundaries,
    };
    writeFileSync(resolve(outDir, j.file.replace(/\.mp3$/, ".json")), `${JSON.stringify(sidecar, null, 2)}\n`);
    out(`  ok  ${j.file}  ${String(result.durationMs)} ms  words ${String(words.length)}/${String(result.boundaries.length)} events`);
  } catch (error) {
    failures++;
    out(`  ERR ${j.file}  ${error instanceof Error ? error.message : "unknown error"}`);
  } finally {
    // Azure bills a processed request even when it fails, so count it either way.
    ledger.totalBillable += j.built.billableChars;
    ledger.requests.push({ file: j.file, voice: j.voice, billable: j.built.billableChars, at: new Date().toISOString() });
    writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
  }
}
synth.close();
out(`samples: done, ${String(failures)} failed; total billable so far ${String(ledger.totalBillable)}`);
