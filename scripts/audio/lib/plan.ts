/**
 * Decides, for every audio item, which clip it needs and whether that clip must be paid for.
 * Pure apart from the store's existence checks.
 */
import type { Manifest } from "../../../src/lib/audio/manifest-schema.ts";
import { clipHash, sha256 } from "./hash.ts";
import type { AudioItem, VoiceRole } from "./items.ts";
import { LEXICON_VERSION } from "./lexicon.ts";
import { type BuiltSsml, buildSsml, type SsmlSettings } from "./ssml.ts";
import type { ClipStore } from "./store.ts";

export interface GenerationConfig {
  generatorVersion: string;
  outputFormat: string;
  voices: Record<VoiceRole, string>;
  settings: Record<VoiceRole, SsmlSettings>;
}

/**
 * - `cached`: the manifest entry already matches (same hash, same display text) and the clip exists.
 * - `reuse`: the clip and its metadata exist (another item with the same SSML, or an interrupted
 *   run), so the entry is derived without a request.
 * - `synthesize`: needs a paid request.
 */
export type ItemStatus = "cached" | "reuse" | "synthesize";

export interface PlannedItem {
  item: AudioItem;
  voice: string;
  hash: string;
  textSha256: string;
  built: BuiltSsml;
  status: ItemStatus;
}

export interface PlannedClip {
  hash: string;
  voice: string;
  ssml: string;
  billableChars: number;
  items: PlannedItem[];
}

export interface Plan {
  items: PlannedItem[];
  /** Unique clips that need a request, one per hash. */
  toSynthesize: PlannedClip[];
  /** Billable characters if every unique clip had to be generated from scratch. */
  fullBillableChars: number;
  uniqueClips: number;
}

export function planGeneration(items: readonly AudioItem[], config: GenerationConfig, manifest: Manifest, store: ClipStore): Plan {
  const planned: PlannedItem[] = [];
  const byHash = new Map<string, PlannedClip>();
  const allHashes = new Map<string, number>();

  for (const item of items) {
    const voice = config.voices[item.role];
    const settings = config.settings[item.role];
    const built = buildSsml(item.text, voice, settings);
    const hash = clipHash({
      ssml: built.ssml,
      voice,
      outputFormat: config.outputFormat,
      ssmlSettings: settings,
      lexiconVersion: LEXICON_VERSION,
      generatorVersion: config.generatorVersion,
    });
    const textSha256 = sha256(item.text);
    allHashes.set(hash, built.billableChars);

    const existing = manifest.entries[item.id];
    const wordsOk = !item.words || existing?.words !== undefined;
    let status: ItemStatus;
    if (existing?.hash === hash && existing.textSha256 === textSha256 && wordsOk && store.hasClip(hash)) status = "cached";
    else if (store.hasClip(hash) && store.readMeta(hash)) status = "reuse";
    else status = "synthesize";

    const p: PlannedItem = { item, voice, hash, textSha256, built, status };
    planned.push(p);
    if (status !== "synthesize") continue;
    const clip = byHash.get(hash);
    if (clip) clip.items.push(p);
    else byHash.set(hash, { hash, voice, ssml: built.ssml, billableChars: built.billableChars, items: [p] });
  }

  return {
    items: planned,
    toSynthesize: [...byHash.values()],
    fullBillableChars: [...allHashes.values()].reduce((a, b) => a + b, 0),
    uniqueClips: allHashes.size,
  };
}
