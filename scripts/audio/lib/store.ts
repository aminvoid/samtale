/**
 * Where clips, per-clip metadata and the manifest live. The filesystem implementation is used by
 * the CLI; tests use the in-memory one.
 *
 *   audio/manifest.json            committed (ADR-0006)
 *   audio/clips/<hash>.mp3         committed, immutable
 *   .cache/audio/meta/<hash>.json  gitignored: duration, bytes and raw boundary events, so a clip
 *                                  can be reused for another item (or after a crash) without paying again
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { emptyManifest, type Manifest, manifestSchema } from "../../../src/lib/audio/manifest-schema.ts";
import { z } from "zod";

const clipMetaSchema = z.object({
  durationMs: z.number().int().nonnegative(),
  bytes: z.number().int().positive(),
  boundaries: z.array(
    z.object({
      kind: z.enum(["word", "punctuation", "sentence"]),
      text: z.string(),
      textOffset: z.number().int(),
      wordLength: z.number().int(),
      audioOffsetMs: z.number(),
      durationMs: z.number(),
    }),
  ),
});

export type ClipMeta = z.infer<typeof clipMetaSchema>;

export interface ClipStore {
  hasClip(hash: string): boolean;
  writeClip(hash: string, audio: Uint8Array): void;
  readMeta(hash: string): ClipMeta | undefined;
  writeMeta(hash: string, meta: ClipMeta): void;
  listClips(): string[];
  deleteClip(hash: string): void;
  loadManifest(generatorVersion: string): Manifest;
  saveManifest(manifest: Manifest): void;
}

function atomicWrite(path: string, data: string | Uint8Array) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${String(process.pid)}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, path);
}

/** Sorted keys so the committed manifest diffs cleanly. */
export function serializeManifest(manifest: Manifest): string {
  const entries = Object.fromEntries(Object.entries(manifest.entries).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  return `${JSON.stringify({ ...manifest, entries }, null, 2)}\n`;
}

export function createFsStore(root: string): ClipStore {
  const clipsDir = resolve(root, "audio/clips");
  const metaDir = resolve(root, ".cache/audio/meta");
  const manifestPath = resolve(root, "audio/manifest.json");
  const clipPath = (h: string) => resolve(clipsDir, `${h}.mp3`);
  const metaPath = (h: string) => resolve(metaDir, `${h}.json`);
  return {
    hasClip: (h) => existsSync(clipPath(h)),
    writeClip(h, audio) {
      atomicWrite(clipPath(h), audio);
    },
    readMeta(h) {
      if (!existsSync(metaPath(h))) return undefined;
      try {
        const parsed = clipMetaSchema.safeParse(JSON.parse(readFileSync(metaPath(h), "utf8")));
        return parsed.success ? parsed.data : undefined; // a torn or old file counts as missing
      } catch {
        return undefined;
      }
    },
    writeMeta(h, meta) {
      atomicWrite(metaPath(h), `${JSON.stringify(meta)}\n`);
    },
    listClips: () =>
      existsSync(clipsDir)
        ? readdirSync(clipsDir)
            .filter((f) => f.endsWith(".mp3"))
            .map((f) => f.slice(0, -4))
        : [],
    deleteClip(h) {
      rmSync(clipPath(h), { force: true });
      rmSync(metaPath(h), { force: true });
    },
    loadManifest(generatorVersion) {
      if (!existsSync(manifestPath)) return emptyManifest(generatorVersion);
      return manifestSchema.parse(JSON.parse(readFileSync(manifestPath, "utf8")));
    },
    saveManifest(m) {
      atomicWrite(manifestPath, serializeManifest(manifestSchema.parse(m)));
    },
  };
}

export function createMemoryStore(initial?: Manifest): ClipStore & { clips: Map<string, Uint8Array>; metas: Map<string, ClipMeta>; saved: number } {
  const clips = new Map<string, Uint8Array>();
  const metas = new Map<string, ClipMeta>();
  let manifest = initial;
  const store = {
    clips,
    metas,
    saved: 0,
    hasClip: (h: string) => clips.has(h),
    writeClip(h: string, a: Uint8Array) {
      clips.set(h, a);
    },
    readMeta: (h: string) => metas.get(h),
    writeMeta(h: string, m: ClipMeta) {
      metas.set(h, m);
    },
    listClips: () => [...clips.keys()],
    deleteClip(h: string) {
      clips.delete(h);
      metas.delete(h);
    },
    loadManifest: (v: string) => structuredClone(manifest ?? emptyManifest(v)),
    saveManifest(m: Manifest) {
      manifest = structuredClone(manifestSchema.parse(m));
      store.saved++;
    },
  };
  return store;
}
