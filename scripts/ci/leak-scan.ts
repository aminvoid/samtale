/**
 * Leak scan core (ADR-0002 §4.5). Collects canaries from the internal authoring data and searches the
 * build output for them. The CLI is check-build-leaks.ts; the self-test is leak-scan.test.ts.
 *
 * Fail closed: a missing internal folder, ledger or topics folder, or a topic file without a readable
 * review status, throws instead of silently scanning for nothing.
 *
 * Canary sources (owner decision, 2026-11-20):
 * - internal-visibility margin notes (every file under content/internal/, recursively);
 * - the review ledger, and any review notes inside topic files (the same internal review data);
 * - production channel only: the IDs and the text of topics that aren't approved.
 * A canary that also occurs in text the channel legitimately publishes (messages, themes, terms,
 * examiner lines, topic links, published topics) is dropped, so quoting a published title in a
 * review note doesn't fail the build.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { z } from "zod";

export type Channel = "preview" | "production";

/** Length of the text windows matched in the output (UTF-16 code units, after normalisation). */
export const WINDOW = 24;
const WINDOW_STEP = 8;
/** Internal strings shorter than a window but at least this long are matched whole. */
const MIN_WHOLE = 16;
/**
 * Confidentiality hits shorter than this are not canaries: a bare year like "2026" would match hashes,
 * dates and future topic IDs. Longer hits ("Skriftlig 2026") are matched as tokens whatever their length.
 */
const MIN_HIT = 6;

const FIXED_TOKENS = ["siriParts", "review-ledger"];
/** ADR-0002 §4.5: the review status value, quoted as it appears in JSON. */
const FIXED_TEXTS = ['"needs-review"'];
const PUBLIC_FILES = ["themes.json", "terms.json", "examiner-lines.json", "topic-links.json"];

const topicSchema = z.object({
  id: z.string().min(1),
  review: z.object({
    status: z.enum(["extracted", "needs-review", "reviewed", "approved"]),
    notes: z.array(z.unknown()).optional(),
  }),
});

export type Canaries = {
  /** Text windows of exactly WINDOW code units → source label. */
  windows: Map<string, string>;
  /** Shorter text canaries, matched as substrings → source label. */
  texts: Map<string, string>;
  /** Tokens matched with identifier boundaries (IDs, keys, confidentiality hits) → source label. */
  tokens: Map<string, string>;
  /** Number of canaries per source label. */
  counts: Map<string, number>;
  /** Confidentiality hits too short to be canaries. */
  skippedHits: string[];
};

export type Leak = { file: string; source: string; canary: string };

export function normalise(text: string): string {
  return text.normalize("NFC").replace(/\s+/g, " ").trim();
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Collects every string value; objects with a `visibility` other than "internal" are skipped. */
function collectStrings(value: unknown, out: string[], options: { skipKeys?: Set<string> } = {}): void {
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out, options);
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (options.skipKeys?.has(key) === true) continue;
      collectStrings(child, out, options);
    }
  }
}

function collectInternal(value: unknown, strings: string[], hits: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectInternal(item, strings, hits);
    return;
  }
  if (value === null || typeof value !== "object") {
    if (typeof value === "string") strings.push(value);
    return;
  }
  const record = Object.fromEntries(Object.entries(value));
  // Approved for public use (D-21): no longer a canary.
  if ("visibility" in record && record.visibility !== "internal") return;
  for (const [key, child] of Object.entries(record)) {
    if (key === "confidentialityHits") collectStrings(child, hits);
    collectInternal(child, strings, hits);
  }
}

function jsonFilesUnder(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...jsonFilesUnder(path));
    else if (entry.name.endsWith(".json")) files.push(path);
  }
  return files.sort();
}

// Rolling hash over fixed-length windows (polynomial, mod 2^32).
const BASE = 31;
const BASE_POW = (() => {
  let p = 1;
  for (let i = 1; i < WINDOW; i++) p = Math.imul(p, BASE) >>> 0;
  return p;
})();

export function hashWindow(text: string, start = 0): number {
  let h = 0;
  for (let i = start; i < start + WINDOW; i++) h = (Math.imul(h, BASE) + text.charCodeAt(i)) >>> 0;
  return h;
}

/** Calls `visit(hash, index)` for every window of `text`. */
function forEachWindow(text: string, visit: (hash: number, index: number) => void): void {
  if (text.length < WINDOW) return;
  let h = hashWindow(text);
  visit(h, 0);
  for (let i = 1; i + WINDOW <= text.length; i++) {
    const out = Math.imul(text.charCodeAt(i - 1), BASE_POW) >>> 0;
    h = (Math.imul((h - out) >>> 0, BASE) + text.charCodeAt(i + WINDOW - 1)) >>> 0;
    visit(h, i);
  }
}

function windowsOf(text: string): string[] {
  const windows = new Set<string>();
  for (let i = 0; i + WINDOW <= text.length; i += WINDOW_STEP) windows.add(text.slice(i, i + WINDOW));
  if (text.length >= WINDOW) windows.add(text.slice(text.length - WINDOW));
  return [...windows];
}

class PublicCorpus {
  private readonly hashes = new Set<number>();
  private readonly joined: string;

  constructor(strings: string[]) {
    const normalised = strings.map(normalise);
    for (const s of normalised) forEachWindow(s, (h) => this.hashes.add(h));
    this.joined = normalised.join("\u0000");
  }

  contains(text: string): boolean {
    if (text.length >= WINDOW && !this.hashes.has(hashWindow(text))) return false;
    return this.joined.includes(text);
  }
}

export function collectCanaries(options: {
  contentDir: string;
  messagesDir: string;
  channel: Channel;
}): Canaries {
  const { contentDir, messagesDir, channel } = options;
  const internalDir = join(contentDir, "internal");
  const ledgerPath = join(contentDir, "review-ledger.json");
  const topicsDir = join(contentDir, "topics");
  for (const [path, what] of [
    [internalDir, "content/internal/"],
    [ledgerPath, "content/review-ledger.json"],
    [topicsDir, "content/topics/"],
  ] as const) {
    if (!existsSync(path))
      throw new Error(`Leak scan: ${what} is missing; refusing to scan without canaries.`);
  }
  const internalFiles = jsonFilesUnder(internalDir);
  if (internalFiles.length === 0) throw new Error("Leak scan: content/internal/ has no JSON files.");

  // Topics: every file must have a readable review status (fail closed on schema drift).
  const topics: Array<{ id: string; approved: boolean; raw: unknown; reviewNotes: unknown }> = [];
  for (const file of readdirSync(topicsDir)
    .filter((f) => f.endsWith(".json"))
    .sort()) {
    const raw = readJson(join(topicsDir, file));
    const parsed = topicSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Leak scan: content/topics/${file} has no readable id and review status.`);
    }
    topics.push({
      id: parsed.data.id,
      approved: parsed.data.review.status === "approved",
      raw,
      reviewNotes: parsed.data.review.notes,
    });
  }

  // Text this channel legitimately publishes.
  const publicStrings: string[] = [];
  if (existsSync(messagesDir)) {
    for (const file of readdirSync(messagesDir).filter((f) => f.endsWith(".json"))) {
      collectStrings(readJson(join(messagesDir, file)), publicStrings);
    }
  }
  const skipReview = { skipKeys: new Set(["review"]) };
  for (const file of PUBLIC_FILES) {
    const path = join(contentDir, file);
    if (existsSync(path)) collectStrings(readJson(path), publicStrings, skipReview);
  }
  const published = topics.filter((t) => channel === "preview" || t.approved);
  for (const topic of published) collectStrings(topic.raw, publicStrings, skipReview);
  const corpus = new PublicCorpus(publicStrings);

  const canaries: Canaries = {
    windows: new Map(),
    texts: new Map(),
    tokens: new Map(),
    counts: new Map(),
    skippedHits: [],
  };
  const count = (source: string) => canaries.counts.set(source, (canaries.counts.get(source) ?? 0) + 1);
  const addText = (value: string, source: string, minWhole: number) => {
    const text = normalise(value);
    if (text.length >= WINDOW) {
      for (const w of windowsOf(text)) {
        if (corpus.contains(w) || canaries.windows.has(w)) continue;
        canaries.windows.set(w, source);
        count(source);
      }
    } else if (text.length >= minWhole && !corpus.contains(text) && !canaries.texts.has(text)) {
      canaries.texts.set(text, source);
      count(source);
    }
  };
  const addToken = (value: string, source: string) => {
    if (canaries.tokens.has(value)) return;
    canaries.tokens.set(value, source);
    count(source);
  };

  for (const token of FIXED_TOKENS) addToken(token, "fixed");
  for (const text of FIXED_TEXTS) {
    canaries.texts.set(text, "fixed");
    count("fixed");
  }

  for (const file of internalFiles) {
    const source = `internal:${relative(internalDir, file).split(sep).join("/")}`;
    const strings: string[] = [];
    const hits: string[] = [];
    collectInternal(readJson(file), strings, hits);
    for (const s of strings) addText(s, source, MIN_WHOLE);
    for (const hit of hits.map(normalise)) {
      if (hit.length >= MIN_HIT) addToken(hit, `${source} (confidentiality)`);
      else canaries.skippedHits.push(hit);
    }
  }

  const ledgerStrings: string[] = [];
  collectStrings(readJson(ledgerPath), ledgerStrings);
  for (const s of ledgerStrings) addText(s, "review-ledger", MIN_WHOLE);

  for (const topic of topics) {
    const notes: string[] = [];
    collectStrings(topic.reviewNotes, notes);
    for (const s of notes) addText(s, `review-notes:${topic.id}`, MIN_WHOLE);
  }

  if (channel === "production") {
    for (const topic of topics.filter((t) => !t.approved)) {
      const source = `unapproved:${topic.id}`;
      addToken(topic.id, source);
      const strings: string[] = [];
      collectStrings(topic.raw, strings);
      for (const s of strings) addText(s, source, WINDOW);
    }
  }
  return canaries;
}

/** Decodes JSON string escapes (\" \\ \n \uXXXX …), as found in RSC flight data and JS chunks. */
export function decodeJsonEscapes(text: string): string {
  const simple: Record<string, string> = {
    '"': '"',
    "\\": "\\",
    "/": "/",
    b: "\b",
    f: "\f",
    n: "\n",
    r: "\r",
    t: "\t",
  };
  return text.replace(/\\(u[0-9a-fA-F]{4}|["\\/bfnrt])/g, (_match, escape: string) =>
    escape.length === 5
      ? String.fromCharCode(Number.parseInt(escape.slice(1), 16))
      : (simple[escape] ?? escape),
  );
}

/** Removes HTML comments (React's text-node separators) and tags, and decodes character references. */
export function decodeHtml(text: string): string {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, ref: string) => {
      if (ref.startsWith("#x")) return String.fromCodePoint(Number.parseInt(ref.slice(2), 16));
      if (ref.startsWith("#")) return String.fromCodePoint(Number.parseInt(ref.slice(1), 10));
      return named[ref] ?? match;
    });
}

/** The normalised views of a file that are searched: raw, JSON-decoded (once, twice), HTML-decoded. */
export function textViews(text: string): string[] {
  const once = decodeJsonEscapes(text);
  const twice = decodeJsonEscapes(once);
  return [...new Set([text, once, twice, decodeHtml(text), decodeHtml(twice)].map(normalise))];
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Compiled matcher for a set of canaries. */
export class CanaryMatcher {
  private readonly byHash = new Map<number, string[]>();
  private readonly tokenPatterns: Array<{ token: string; pattern: RegExp }>;

  constructor(private readonly canaries: Canaries) {
    for (const w of canaries.windows.keys()) {
      const h = hashWindow(w);
      const bucket = this.byHash.get(h);
      if (bucket === undefined) this.byHash.set(h, [w]);
      else bucket.push(w);
    }
    // A topic ID followed by "." still matches (2024-maj-a.sitA.q1); 2024-maj-ab doesn't.
    this.tokenPatterns = [...canaries.tokens.keys()].map((token) => ({
      token,
      pattern: new RegExp(`(?<![\\p{L}\\p{N}_-])${escapeRegExp(token)}(?![\\p{L}\\p{N}_-])`, "u"),
    }));
  }

  /**
   * Returns the canaries found in `text` (searched in every view): one window hit per source (the rest
   * of that text is the same leak), and every text and token canary.
   */
  match(text: string): Array<{ source: string; canary: string }> {
    const found = new Map<string, { source: string; canary: string }>();
    const record = (key: string, canary: string, source: string | undefined) => {
      if (source !== undefined && !found.has(key)) found.set(key, { source, canary });
    };
    for (const view of textViews(text)) {
      forEachWindow(view, (h, i) => {
        const bucket = this.byHash.get(h);
        if (bucket === undefined) return;
        for (const w of bucket) {
          const source = this.canaries.windows.get(w);
          if (view.startsWith(w, i)) record(`window:${source ?? ""}`, w, source);
        }
      });
      for (const [t, source] of this.canaries.texts) if (view.includes(t)) record(`text:${t}`, t, source);
      for (const { token, pattern } of this.tokenPatterns) {
        if (pattern.test(view)) record(`token:${token}`, token, this.canaries.tokens.get(token));
      }
    }
    return [...found.values()];
  }

  /** Token canaries in a file path (for example a route file named after an unapproved topic). */
  matchPath(path: string): Array<{ source: string; canary: string }> {
    return this.tokenPatterns
      .filter(({ pattern }) => pattern.test(path))
      .map(({ token }) => ({ source: this.canaries.tokens.get(token) ?? "token", canary: token }));
  }
}

function isBinary(path: string): boolean {
  const buffer = readFileSync(path);
  return buffer.subarray(0, 8192).includes(0);
}

function* walk(dir: string, skip: Set<string>): Generator<string> {
  for (const entry of readdirSync(dir).sort()) {
    const path = join(dir, entry);
    if (skip.has(path)) continue;
    if (statSync(path).isDirectory()) yield* walk(path, skip);
    else yield path;
  }
}

/**
 * Scans `.next/` (except the top-level `cache/` and `dev/`, which are never deployed) and `public/`.
 * Every non-binary file is read, whatever its extension.
 */
export function scanBuild(options: { rootDir: string; canaries: Canaries }): {
  leaks: Leak[];
  filesScanned: number;
} {
  const { rootDir, canaries } = options;
  const buildDir = join(rootDir, ".next");
  if (!existsSync(buildDir)) throw new Error("Leak scan: no .next build output. Run `npm run build` first.");
  const matcher = new CanaryMatcher(canaries);
  const skip = new Set([join(buildDir, "cache"), join(buildDir, "dev")]);
  const roots = [buildDir, join(rootDir, "public")].filter((root) => existsSync(root));
  const leaks: Leak[] = [];
  let filesScanned = 0;
  for (const root of roots) {
    for (const path of walk(root, skip)) {
      const file = relative(rootDir, path).split(sep).join("/");
      for (const hit of matcher.matchPath(file)) leaks.push({ file, ...hit });
      if (isBinary(path)) continue;
      filesScanned++;
      for (const hit of matcher.match(readFileSync(path, "utf8"))) leaks.push({ file, ...hit });
    }
  }
  return { leaks, filesScanned };
}
