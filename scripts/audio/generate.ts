/**
 * audio:generate (ADR-0006, ADR-0015). Pre-generates Danish audio with Azure AI Speech.
 *
 *   npm run audio:generate -- --dry-run                         plan, characters, cost; no Azure call
 *   npm run audio:generate -- --dry-run --extrapolate-topics 51
 *   npm run audio:generate -- --yes [--tier s0] [--only 2024-maj-b]
 *
 * Idempotent (content-hashed clips), resumable (manifest written after every clip),
 * concurrency-limited with exponential backoff. A real run needs --yes: ask the owner first and
 * show the dry-run numbers (.claude/rules/speech-audio.md). Never run in CI or tests.
 */
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { BYTES_PER_MS, GENERATOR_VERSION, OUTPUT_FORMAT, PRICING, SSML_SETTINGS, VOICES } from "./config.ts";
import { parseSpeechEnv } from "./env.ts";
import { estimateCost, formatUsd } from "./lib/cost.ts";
import { collectItems } from "./lib/items.ts";
import { loadContent } from "./lib/load.ts";
import { planGeneration } from "./lib/plan.ts";
import { executePlan } from "./lib/run.ts";
import { createFsStore } from "./lib/store.ts";

const root = resolve(import.meta.dirname, "../..");
const out = (s = "") => process.stdout.write(`${s}\n`);
const n = (x: number) => x.toLocaleString("en-US");

const { values } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    yes: { type: "boolean", default: false },
    only: { type: "string" },
    tier: { type: "string", default: "f0" },
    concurrency: { type: "string" },
    "no-keywords": { type: "boolean", default: false },
    "extrapolate-topics": { type: "string" },
  },
});

const tier = values.tier;
if (tier !== "f0" && tier !== "s0") throw new Error("--tier must be f0 or s0");
const only = values.only;

const content = loadContent(root);
const allItems = collectItems(content.topics, content.lines, { keywords: !values["no-keywords"] }, content.extra);
const items = only === undefined ? allItems : allItems.filter((i) => i.id.startsWith(only) || i.topicId === only);
if (items.length === 0) throw new Error(`No items match --only ${only ?? ""}`);

const store = createFsStore(root);
const config = { generatorVersion: GENERATOR_VERSION, outputFormat: OUTPUT_FORMAT, voices: VOICES, settings: SSML_SETTINGS };
const plan = planGeneration(items, config, store.loadManifest(GENERATOR_VERSION), store);

const count = (s: string) => plan.items.filter((p) => p.status === s).length;
const est = estimateCost(plan.toSynthesize);
const uniqueClips = [...new Map(plan.items.map((p) => [p.hash, { voice: p.voice, billableChars: p.built.billableChars }])).values()];
const full = estimateCost(uniqueClips);
const examiner = items.filter((i) => i.role === "examiner").length;

out(`audio:generate${values["dry-run"] ? " (dry run, no Azure call)" : ""}`);
out(`  voices: examiner ${VOICES.examiner}, model ${VOICES.model}; ${OUTPUT_FORMAT}; ${GENERATOR_VERSION}`);
out(`  topics: ${n(content.topics.length)}; items: ${n(items.length)} (examiner ${n(examiner)}, model ${n(items.length - examiner)}); unique clips: ${n(plan.uniqueClips)}`);
out(`  display characters: ${n(items.reduce((s, i) => s + i.text.length, 0))}`);
out(`  status: cached ${n(count("cached"))}, reusable ${n(count("reuse"))}, to synthesize ${n(count("synthesize"))} items in ${n(plan.toSynthesize.length)} requests`);
out(`  billable characters this run: ${n(est.chars)} (full regeneration: ${n(full.chars)})`);
for (const l of est.lines) {
  out(`    ${l.priceClass}: ${n(l.chars)} chars at $${String(PRICING.perMillion[l.priceClass])}/1M = ${formatUsd(l.usd)}${l.verified ? "" : " (price UNVERIFIED)"}`);
}
const f0 = est.f0CharsOverAllowance === 0 ? "within the 0.5M free characters/month" : `${n(est.f0CharsOverAllowance)} chars over the free allowance`;
out(`  cost this run: S0 pay-as-you-go ${formatUsd(est.s0Usd)}; F0 ${f0}, at least ${n(est.f0Minutes)} min at 20 requests/min`);
out(`  prices: ${PRICING.region}, checked ${PRICING.checkedOn} (scripts/audio/config.ts)`);

if (values["extrapolate-topics"] !== undefined) {
  const topics = Number(values["extrapolate-topics"]);
  const perTopic = plan.items.filter((p) => p.item.topicId !== undefined);
  const shared = plan.items.filter((p) => p.item.topicId === undefined);
  const scale = topics / content.topics.length;
  const chars = Math.round(perTopic.reduce((s, p) => s + p.built.billableChars, 0) * scale + shared.reduce((s, p) => s + p.built.billableChars, 0));
  const requests = Math.round(perTopic.length * scale + shared.length);
  const x = estimateCost([{ voice: VOICES.model, billableChars: chars }]);
  out(`  extrapolated to ${n(topics)} topics (pilot average): ~${n(requests)} items, ~${n(chars)} billable chars, S0 ${formatUsd(x.s0Usd)}, F0 ${chars <= PRICING.f0FreeCharsPerMonth ? "free" : "over the allowance"} (at least ${n(Math.ceil(requests / PRICING.f0TransactionsPerMinute))} min)`);
}

if (values["dry-run"]) process.exit(0);
if (plan.toSynthesize.length === 0) {
  out("Nothing to synthesize.");
} else if (!values.yes) {
  process.stderr.write("Refusing to call Azure without --yes. Show the dry-run numbers to the owner first.\n");
  process.exit(2);
}

const { createAzureSynthesizer } = await import("./lib/azure.ts");
const synth = createAzureSynthesizer(parseSpeechEnv(process.env));
const report = await executePlan(plan, synth, store, {
  generatorVersion: GENERATOR_VERSION,
  bytesPerMs: BYTES_PER_MS,
  prune: only === undefined,
  log: out,
  pool: {
    concurrency: values.concurrency ? Number(values.concurrency) : tier === "f0" ? 1 : 4,
    // F0 allows 20 transactions per 60 s; stay at 18 to leave room for retries.
    minIntervalMs: tier === "f0" ? Math.ceil(60_000 / (PRICING.f0TransactionsPerMinute - 2)) : 0,
    maxAttempts: 6,
    baseDelayMs: 2_000,
    maxDelayMs: 60_000,
    onRetry: ({ attempt, delayMs, error }) => {
      out(`  retry ${n(attempt)} in ${n(delayMs)} ms: ${error instanceof Error ? error.message : "unknown error"}`);
    },
  },
});
synth.close();
out(`done: synthesized ${n(report.synthesized)}, reused ${n(report.reused)}, cached ${n(report.cached)}, failed ${n(report.failed.length)}`);
if (report.prunedEntries.length || report.prunedClips.length) {
  out(`pruned: ${n(report.prunedEntries.length)} entries, ${n(report.prunedClips.length)} clips`);
}
for (const f of report.failed) out(`  FAILED ${f.itemIds.join(", ")}: ${f.message}`);
process.exit(report.failed.length ? 1 : 0);
