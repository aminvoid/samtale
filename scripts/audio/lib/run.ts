/**
 * Executes a plan: synthesizes the missing clips through the injected Synthesizer and writes
 * the manifest after every finished clip, so an interrupted run resumes where it stopped.
 */
import type { Manifest, ManifestEntry } from "../../../src/lib/audio/manifest-schema.ts";
import type { Plan, PlannedItem } from "./plan.ts";
import { runPool, type PoolOptions } from "./pool.ts";
import type { ClipMeta, ClipStore } from "./store.ts";
import { type Synthesizer, TransientSynthesisError } from "./synthesizer.ts";
import { toWordTuples } from "./words.ts";

export interface RunOptions {
  generatorVersion: string;
  bytesPerMs: number;
  /** Drop manifest entries for items that no longer exist and delete unreferenced clips. */
  prune: boolean;
  pool: Omit<PoolOptions, "isRetryable">;
  log: (line: string) => void;
}

export interface RunReport {
  synthesized: number;
  reused: number;
  cached: number;
  failed: Array<{ hash: string; itemIds: string[]; message: string }>;
  prunedEntries: string[];
  prunedClips: string[];
}

export function entryFor(p: PlannedItem, meta: ClipMeta): ManifestEntry {
  const entry: ManifestEntry = {
    hash: p.hash,
    voiceRole: p.item.role,
    voice: p.voice,
    textSha256: p.textSha256,
    durationMs: meta.durationMs,
    bytes: meta.bytes,
  };
  if (p.item.words) entry.words = toWordTuples(meta.boundaries, p.built, p.item.text);
  return entry;
}

export async function executePlan(plan: Plan, synth: Synthesizer, store: ClipStore, opts: RunOptions): Promise<RunReport> {
  const manifest: Manifest = store.loadManifest(opts.generatorVersion);
  manifest.generatorVersion = opts.generatorVersion;
  const report: RunReport = { synthesized: 0, reused: 0, cached: 0, failed: [], prunedEntries: [], prunedClips: [] };

  for (const p of plan.items) {
    if (p.status === "cached") report.cached++;
    if (p.status !== "reuse") continue;
    const meta = store.readMeta(p.hash);
    if (!meta) continue; // planGeneration only marks "reuse" when meta exists
    manifest.entries[p.item.id] = entryFor(p, meta);
    report.reused++;
  }
  if (report.reused > 0) store.saveManifest(manifest);

  const total = plan.toSynthesize.length;
  let done = 0;
  const results = await runPool(
    plan.toSynthesize,
    async (clip) => {
      const result = await synth.synthesize(clip.ssml);
      const meta: ClipMeta = {
        // CBR: the file length gives the duration browsers report (the SDK's value omits MP3 padding).
        durationMs: Math.round(result.audio.byteLength / opts.bytesPerMs),
        bytes: result.audio.byteLength,
        boundaries: result.boundaries,
      };
      // Clip, then metadata, then manifest: a crash between steps leaves a state the next plan
      // recognises (clip without meta → synthesize again; clip with meta → reuse).
      store.writeClip(clip.hash, result.audio);
      store.writeMeta(clip.hash, meta);
      for (const p of clip.items) manifest.entries[p.item.id] = entryFor(p, meta);
      store.saveManifest(manifest);
      report.synthesized++;
      done++;
      opts.log(`  [${String(done)}/${String(total)}] ${clip.hash} ${clip.items.map((p) => p.item.id).join(", ")}`);
    },
    { ...opts.pool, isRetryable: (e) => e instanceof TransientSynthesisError },
  );

  plan.toSynthesize.forEach((clip, i) => {
    const r = results[i];
    if (!r || r.ok) return;
    report.failed.push({
      hash: clip.hash,
      itemIds: clip.items.map((p) => p.item.id),
      message: r.error instanceof Error ? r.error.message : String(r.error),
    });
  });

  if (opts.prune && report.failed.length === 0) {
    const live = new Set(plan.items.map((p) => p.item.id));
    report.prunedEntries.push(...Object.keys(manifest.entries).filter((id) => !live.has(id)));
    manifest.entries = Object.fromEntries(Object.entries(manifest.entries).filter(([id]) => live.has(id)));
    store.saveManifest(manifest);
    const referenced = new Set(Object.values(manifest.entries).map((e) => e.hash));
    for (const hash of store.listClips()) {
      if (referenced.has(hash)) continue;
      store.deleteClip(hash);
      report.prunedClips.push(hash);
    }
  }
  return report;
}
