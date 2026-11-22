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
 * A canary that also occurs in allow-listed prose or interface messages is dropped, so quoting
 * a published title in a review note doesn't fail the build.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, sep } from "node:path";
import { z } from "zod";
import { ReviewNoteSchema, ReviewStatusSchema } from "../../src/lib/content/schema/authoring.ts";
import { bareExamYear, confidentialityHits, examReferenceYears } from "../content/lib/confidentiality.ts";
import { MarginNotesFileSchema, ReviewLedgerSchema } from "../content/lib/pipeline-schema.ts";
import { READ_MODEL_PATH, requireArtifact, type Channel } from "./build-artifacts.ts";
import {
  publicItemIds,
  publishedTopicText,
  publicTextFiles,
  publicTopicText,
  searchIndexText,
} from "./public-corpus.ts";

/** Length of the text windows matched in the output (UTF-16 code units, after normalisation). */
export const WINDOW = 24;
const WINDOW_STEP = 8;
/** Keep existing coverage for longer authoring metadata. Prose is collected at every length. */
const MIN_METADATA = 16;
const BENIGN_TEXTS = new Set([".", "…", "...", "-", "–", "—", "?", "!", "،", "؟"]);

const FIXED_TOKENS = ["siriParts", "review-ledger"];
/** ADR-0002 §4.5: the review status value, quoted as it appears in JSON. */
const FIXED_TEXTS = ['"needs-review"'];
const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".csv",
  ".htm",
  ".html",
  ".js",
  ".json",
  ".jsonl",
  ".jsx",
  ".map",
  ".md",
  ".meta",
  ".mjs",
  ".ndjson",
  ".rsc",
  ".svg",
  ".text",
  ".ts",
  ".tsx",
  ".txt",
  ".webmanifest",
  ".xml",
  ".yaml",
  ".yml",
]);

const topicSchema = z.object({
  id: z.string().min(1),
  review: z.object({
    status: ReviewStatusSchema,
  }),
});

export type Canaries = {
  /** Text windows of exactly WINDOW code units → source label. */
  windows: Map<string, string>;
  /** Shorter text canaries, matched at word boundaries → source label. */
  texts: Map<string, string>;
  /** Tokens matched with identifier boundaries (IDs, keys, confidentiality hits) → source label. */
  tokens: Map<string, string>;
  /** Number of canaries per source label. */
  counts: Map<string, number>;
  /** Bare confidentiality years, matched in exam references → source label. */
  years: Map<string, string>;
};

export type Leak = { file: string; source: string; canary: string };

export function normalise(text: string): string {
  return text.normalize("NFC").replace(/\s+/g, " ").trim();
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  } else if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) collectStrings(child, out);
  }
}

const notesSchema = z.object({ notes: z.array(ReviewNoteSchema).optional() });
const TOPIC_PROSE_KEYS = new Set(["text", "title", "label", "basis", "sourceDisplay", "siriParts"]);

function collectTopicText(value: unknown, out: string[], reviewOnly: boolean): void {
  if (Array.isArray(value)) {
    for (const item of value) collectTopicText(item, out, reviewOnly);
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "review") {
        if (reviewOnly) for (const { text } of notesSchema.parse(child).notes ?? []) out.push(text);
      } else if (!reviewOnly && TOPIC_PROSE_KEYS.has(key)) {
        collectStrings(child, out);
      } else {
        collectTopicText(child, out, reviewOnly);
      }
    }
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
const WINDOW_HASH_MASK = (1 << 18) - 1;
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
    return this.joined.includes(text) && (text.length >= WINDOW || textPattern(text).test(this.joined));
  }

  containsWindow(text: string): boolean {
    if (this.contains(text)) return true;
    // Quotes in review notes can meet JSON delimiters around otherwise public text.
    const unquoted = text.replace(/^[: ]*["“«] *| *["”»]$/g, "");
    return unquoted !== text && unquoted.length > 0 && this.joined.includes(unquoted);
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
  for (const [path, what] of new Map([
    [internalDir, "content/internal/"],
    [ledgerPath, "content/review-ledger.json"],
    [topicsDir, "content/topics/"],
  ])) {
    if (!existsSync(path))
      throw new Error(`Leak scan: ${what} is missing; refusing to scan without canaries.`);
  }
  const internalFiles = jsonFilesUnder(internalDir);
  if (internalFiles.length === 0) throw new Error("Leak scan: content/internal/ has no JSON files.");

  // Topics: every file must have a readable review status (fail closed on schema drift).
  const topics: Array<{ id: string; approved: boolean; raw: unknown }> = [];
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
    });
  }

  // Text this channel legitimately publishes.
  const publicStrings: string[] = [];
  if (existsSync(messagesDir)) {
    for (const file of readdirSync(messagesDir).filter((f) => f.endsWith(".json"))) {
      collectStrings(readJson(join(messagesDir, file)), publicStrings);
    }
  }
  for (const [file, schema] of Object.entries(publicTextFiles)) {
    const path = join(contentDir, file);
    if (existsSync(path)) collectStrings(schema.parse(readJson(path)), publicStrings);
  }
  const published = topics.filter((t) => channel === "preview" || t.approved);
  const officialUrls = new Map<string, string>();
  for (const topic of published) {
    const text = publicTopicText(topic.raw, officialUrls, dirname(contentDir));
    collectStrings(text, publicStrings);
    publicStrings.push(...searchIndexText(text));
    publicStrings.push(...publicItemIds(topic.raw));
  }
  const corpus = new PublicCorpus(publicStrings);

  const canaries: Canaries = {
    windows: new Map(),
    texts: new Map(),
    tokens: new Map(),
    counts: new Map(),
    years: new Map(),
  };
  const count = (source: string) => canaries.counts.set(source, (canaries.counts.get(source) ?? 0) + 1);
  const addText = (value: string, source: string) => {
    const text = normalise(value);
    if (text.length === 0 || BENIGN_TEXTS.has(text)) return;
    if (text.length >= WINDOW) {
      for (const w of windowsOf(text)) {
        if (corpus.containsWindow(w) || canaries.windows.has(w)) continue;
        canaries.windows.set(w, source);
        count(source);
      }
    } else if (!corpus.contains(text) && !canaries.texts.has(text)) {
      canaries.texts.set(text, source);
      count(source);
    }
  };
  const addToken = (value: string, source: string) => {
    if (canaries.tokens.has(value)) return;
    canaries.tokens.set(value, source);
    count(source);
  };
  const addMetadata = (value: unknown, source: string) => {
    const strings: string[] = [];
    collectStrings(value, strings);
    for (const s of strings) if (normalise(s).length >= MIN_METADATA) addText(s, source);
  };

  for (const token of FIXED_TOKENS) addToken(token, "fixed");
  for (const text of FIXED_TEXTS) {
    canaries.texts.set(text, "fixed");
    count("fixed");
  }

  for (const file of internalFiles) {
    const source = `internal:${relative(internalDir, file).split(sep).join("/")}`;
    const parsed = MarginNotesFileSchema.safeParse(readJson(file));
    if (!parsed.success) throw new Error(`Invalid ${source}:\n${z.prettifyError(parsed.error)}`);
    for (const note of parsed.data.notes) {
      // The strict file schema also rejects nested records in public notes or their metadata.
      const texts = Object.values(note.text);
      const hits = new Set(
        [...note.confidentialityHits, ...texts.flatMap(confidentialityHits)].map(
          (hit) => bareExamYear(hit) ?? normalise(hit),
        ),
      );
      for (const { text } of note.review.notes ?? []) addText(text, source);
      if (note.visibility === "public") {
        if (note.review.status !== "approved" || hits.size > 0) {
          throw new Error(`Invalid public margin note ${note.id} in ${source}.`);
        }
        continue;
      }
      addMetadata([note.id, note.sectionId, note.review], source);
      for (const value of texts) {
        const year = bareExamYear(value);
        if (year !== undefined && hits.has(year)) continue;
        addText(value, source);
      }
      const confidentiality = `${source} (confidentiality)`;
      for (const hit of hits) {
        if (/^20\d{2}$/.test(hit)) {
          if (canaries.years.has(hit)) continue;
          canaries.years.set(hit, confidentiality);
          count(confidentiality);
        } else if (hit.length > 0) {
          addToken(hit, confidentiality);
        }
      }
    }
  }

  const ledger = ReviewLedgerSchema.parse(readJson(ledgerPath));
  addMetadata(ledger, "review-ledger");
  const decisions = [
    ...Object.values(ledger.topics),
    ...Object.values(ledger.topics).flatMap(({ intros }) => Object.values(intros ?? {})),
    ...Object.values(ledger.examinerLines ?? {}),
  ];
  const corrections = [
    ...Object.values(ledger.topics).flatMap((topic) => topic.corrections ?? []),
    ...(ledger.marginNoteCorrections ?? []),
  ];
  for (const decision of decisions) {
    for (const { text } of decision.notes ?? []) addText(text, "review-ledger");
  }
  for (const { find, suggestion, reason } of corrections) {
    for (const text of [find, suggestion, reason]) addText(text, "review-ledger");
  }

  for (const topic of topics) {
    const notes: string[] = [];
    collectTopicText(topic.raw, notes, true);
    for (const s of notes) addText(s, `review-notes:${topic.id}`);
  }

  if (channel === "production") {
    for (const topic of topics.filter((t) => !t.approved)) {
      const source = `unapproved:${topic.id}`;
      addToken(topic.id, source);
      addMetadata(topic.raw, source);
      const strings: string[] = [];
      collectTopicText(topic.raw, strings, false);
      const text = publishedTopicText.safeParse(topic.raw);
      if (text.success) strings.push(...searchIndexText(text.data));
      for (const s of strings) addText(s, source);
    }
  }
  return canaries;
}

/** Decodes JSON and JavaScript string escapes, as found in RSC flight data and JS chunks. */
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
  return text.replace(/\\(u[\da-fA-F]{4}|x[\da-fA-F]{2}|["\\/bfnrt])/g, (_match, escape: string) =>
    escape.length > 1
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
  const decoded = new Set([text, once, twice, decodeHtml(text), decodeHtml(twice)]);
  return [...new Set([...decoded].map(normalise))];
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const WORD = String.raw`[\p{L}\p{M}\p{N}\p{Join_Control}_]`;
const WORD_START = new RegExp(`(?<!${WORD})`, "uy");

function textPattern(text: string): RegExp {
  return new RegExp(`(?<!${WORD})${escapeRegExp(text)}(?!${WORD})`, "u");
}

/** Compiled matcher for a set of canaries. */
export class CanaryMatcher {
  private readonly byHash = new Map<number, string[]>();
  private readonly windowHashFilter = new Uint8Array(WINDOW_HASH_MASK + 1);
  private readonly tokenPatterns: Array<{ token: string; source: string; pattern: RegExp }>;
  private readonly shortPattern: RegExp | undefined;
  private readonly yearPattern: RegExp | undefined;

  constructor(private readonly canaries: Canaries) {
    for (const w of canaries.windows.keys()) {
      const h = hashWindow(w);
      this.windowHashFilter[h & WINDOW_HASH_MASK] = 1;
      const bucket = this.byHash.get(h);
      if (bucket === undefined) this.byHash.set(h, [w]);
      else bucket.push(w);
    }
    // A topic ID followed by "." still matches (2024-maj-a.sitA.q1); 2024-maj-ab doesn't.
    this.tokenPatterns = [...canaries.tokens].map(([token, source]) => ({
      token,
      source,
      pattern: new RegExp(`(?<![\\p{L}\\p{M}\\p{N}_-])${escapeRegExp(token)}(?![\\p{L}\\p{M}\\p{N}_-])`, "u"),
    }));
    const shortTexts = [...canaries.texts]
      .filter(([, source]) => source !== "fixed")
      .map(([text]) => text)
      .sort((a, b) => b.length - a.length);
    if (shortTexts.length > 0) {
      // Start with literals so the regex engine can skip past non-candidates in large chunks.
      this.shortPattern = new RegExp(`(?:${shortTexts.map(escapeRegExp).join("|")})(?!${WORD})`, "gu");
    }
    if (canaries.years.size > 0) {
      const years = [...canaries.years.keys()].map((year) =>
        Array.from(
          year,
          (digit) =>
            `[${digit}${String.fromCharCode(0x06f0 + Number(digit))}${String.fromCharCode(0x0660 + Number(digit))}]`,
        ).join(""),
      );
      this.yearPattern = new RegExp(years.join("|"));
    }
  }

  /**
   * Returns the canaries found in `text` (searched in every view): one window hit per source (the rest
   * of that text is the same leak), plus short text and token matches.
   */
  match(text: string): Array<{ source: string; canary: string }> {
    const found = new Map<string, { source: string; canary: string }>();
    const record = (key: string, canary: string, source: string | undefined) => {
      if (source !== undefined && !found.has(key)) found.set(key, { source, canary });
    };
    for (const view of textViews(text)) {
      if (this.byHash.size > 0) {
        forEachWindow(view, (h, i) => {
          // Most windows aren't candidates. Avoid a map lookup for those hashes.
          if (this.windowHashFilter[h & WINDOW_HASH_MASK] === 0) return;
          const bucket = this.byHash.get(h);
          if (bucket === undefined) return;
          for (const w of bucket) {
            const source = this.canaries.windows.get(w);
            if (view.startsWith(w, i)) record(`window:${source ?? ""}`, w, source);
          }
        });
      }
      for (const fixed of FIXED_TEXTS) {
        if (view.includes(fixed)) record(`text:${fixed}`, fixed, this.canaries.texts.get(fixed));
      }
      const pattern = this.shortPattern;
      if (pattern !== undefined) {
        for (let hit = pattern.exec(view); hit !== null; hit = pattern.exec(view)) {
          const [short] = hit;
          WORD_START.lastIndex = hit.index;
          if (!WORD_START.test(view)) {
            // A rejected substring may overlap a valid match at the next word boundary.
            pattern.lastIndex = hit.index + ((short.codePointAt(0) ?? 0) > 0xffff ? 2 : 1);
            continue;
          }
          record(`text:${short}`, short, this.canaries.texts.get(short));
        }
      }
      for (const { token, source, pattern } of this.tokenPatterns) {
        if (view.includes(token) && pattern.test(view)) record(`token:${token}`, token, source);
      }
      if (this.yearPattern?.test(view) === true) {
        for (const year of examReferenceYears(view)) {
          record(`year:${year}`, year, this.canaries.years.get(year));
        }
      }
    }
    return [...found.values()];
  }

  /** Token canaries in a file path (for example a route file named after an unapproved topic). */
  matchPath(path: string): Array<{ source: string; canary: string }> {
    return this.tokenPatterns
      .filter(({ token, pattern }) => path.includes(token) && pattern.test(path))
      .map(({ token, source }) => ({ source, canary: token }));
  }
}

function* walk(dir: string, skip: Set<string>): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const path = join(dir, entry.name);
    if (skip.has(path)) continue;
    if (entry.isDirectory() || (entry.isSymbolicLink() && statSync(path).isDirectory()))
      yield* walk(path, skip);
    else yield path;
  }
}

/**
 * Scans production output, public assets and generated sources. Known text extensions are
 * always scanned. Files with other extensions are scanned if their headers look like text.
 */
export function scanBuild(options: { rootDir: string; canaries: Canaries }): {
  leaks: Leak[];
  filesScanned: number;
} {
  const { rootDir, canaries } = options;
  const buildDir = join(rootDir, ".next");
  for (const path of [
    ".next/BUILD_ID",
    ".next/build-manifest.json",
    ".next/server/app-paths-manifest.json",
    READ_MODEL_PATH,
  ]) {
    requireArtifact(rootDir, path);
  }
  const matcher = new CanaryMatcher(canaries);
  const skip = new Set([join(buildDir, "cache"), join(buildDir, "dev")]);
  const roots = [buildDir, join(rootDir, "src/generated"), join(rootDir, "public")].filter((root) =>
    existsSync(root),
  );
  const leaks: Leak[] = [];
  let filesScanned = 0;
  for (const root of roots) {
    for (const path of walk(root, skip)) {
      const file = relative(rootDir, path).split(sep).join("/");
      for (const hit of matcher.matchPath(file)) leaks.push({ file, ...hit });
      const buffer = readFileSync(path);
      if (!TEXT_EXTENSIONS.has(extname(path).toLowerCase()) && buffer.subarray(0, 8192).includes(0)) continue;
      filesScanned++;
      for (const hit of matcher.match(buffer.toString("utf8"))) leaks.push({ file, ...hit });
    }
  }
  if (filesScanned === 0) throw new Error("Leak scan: zero text files scanned.");
  return { leaks, filesScanned };
}
