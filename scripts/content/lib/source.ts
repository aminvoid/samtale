/**
 * Source access for the booklet Markdown (docs/resources/PD3_Mundtlig_Delproeve2.md).
 *
 * - Loads the file, tracks the PDF page of every line from the `## n / 116` markers.
 * - Classifies each line into a token kind. The classification is purely syntactic;
 *   the topic parser decides what a token means in context.
 *
 * No dependencies: Node built-ins only. Run scripts with `node <file>.ts` (Node >= 23.6).
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const SOURCE_REL_PATH = "docs/resources/PD3_Mundtlig_Delproeve2.md";
export const SOURCE_PATH = resolve(REPO_ROOT, SOURCE_REL_PATH);
export const TOTAL_PAGES = 116;

/** One physical line of the source file. */
export interface SourceLine {
  /** 1-based line number in the Markdown file. */
  n: number;
  /** PDF page (1..116) this line belongs to; 0 before the first page marker. */
  page: number;
  raw: string;
}

export interface Source {
  path: string;
  text: string;
  lines: SourceLine[];
}

const PAGE_RE = /^## (\d+) \/ (\d+)$/;

export function loadSource(path: string = SOURCE_PATH): Source {
  const text = readFileSync(path, "utf8");
  if (text.includes("\r")) {
    throw new Error(`${path}: contains CR characters; expected LF line endings`);
  }
  if (text.charCodeAt(0) === 0xfeff) {
    throw new Error(`${path}: starts with a byte-order mark`);
  }
  const rawLines = text.split("\n");
  let page = 0;
  const lines: SourceLine[] = rawLines.map((raw, i) => {
    const m = PAGE_RE.exec(raw);
    if (m) {
      const p = Number(m[1]);
      const total = Number(m[2]);
      if (total !== TOTAL_PAGES) {
        throw new Error(`line ${i + 1}: page marker total ${total}, expected ${TOTAL_PAGES}`);
      }
      if (p !== page + 1) {
        throw new Error(`line ${i + 1}: page marker ${p} follows page ${page}; markers must be consecutive`);
      }
      page = p;
    }
    return { n: i + 1, page, raw };
  });
  if (page !== TOTAL_PAGES) {
    throw new Error(`last page marker is ${page}, expected ${TOTAL_PAGES}`);
  }
  return { path, text, lines };
}

// ---------------------------------------------------------------------------
// Token classification
// ---------------------------------------------------------------------------

export const FA_OPEN = '<span lang="fa" dir="rtl">';
export const FA_CLOSE = "</span>";

export type Session = "maj" | "nov";
export type Letter = "A" | "B" | "C";

export type TokenKind =
  | "blank"
  | "page"
  | "comment"
  | "anchor"
  | "h1"
  | "h3"
  | "h4"
  | "quote"
  | "strongQuote"
  | "arrow"
  | "keyword"
  | "situationItem"
  | "faPara"
  | "term"
  | "appendixTerm"
  | "plusLine"
  | "listItem"
  | "tableRow"
  | "other";

export interface TokenBase {
  line: SourceLine;
}

export type Token = TokenBase &
  (
    | { kind: "blank" }
    | { kind: "page"; page: number }
    | { kind: "comment" }
    | { kind: "anchor"; id: string }
    | { kind: "h1"; content: string }
    | { kind: "h3"; content: string }
    | { kind: "h4"; content: string }
    /** `> …` blockquote line. `content` is everything after `> `. */
    | { kind: "quote"; content: string }
    /** A line that is exactly `<strong>“…”</strong>` (the follow-up question form). */
    | { kind: "strongQuote"; inner: string }
    /** `↳ …` follow-up answer line. */
    | { kind: "arrow"; content: string }
    /** `- <emoji> <strong>da</strong> = <span fa>fa</span>` */
    | { kind: "keyword"; emoji: string; da: string; fa: string }
    /** `- **A** da · <span fa>fa</span>` */
    | { kind: "situationItem"; key: "A" | "B"; da: string; fa: string }
    /** A line that is exactly one Persian span. */
    | { kind: "faPara"; content: string }
    /** `Maj-Juni 2024 · Emne B` */
    | { kind: "term"; session: Session; year: number; letter: Letter }
    /** `🌍 Maj-Juni 2013 · Emne A` (appendix) */
    | { kind: "appendixTerm"; emoji: string; session: Session; year: number; letter: Letter }
    /** `➕ …` (appendix follow-up, Danish only) */
    | { kind: "plusLine"; content: string }
    | { kind: "listItem"; content: string }
    | { kind: "tableRow"; content: string }
    | { kind: "other"; content: string }
  );

const ANCHOR_RE = /^<a id="([^"]+)"><\/a>$/;
const KEYWORD_RE = /^- (\S+) <strong>([^<]+)<\/strong> = <span lang="fa" dir="rtl">([^<]+)<\/span>$/;
const SITUATION_RE = /^- \*\*([AB])\*\* (.+?) · <span lang="fa" dir="rtl">([^<]+)<\/span>$/;
const TERM_RE = /^(Maj-Juni|Nov-Dec) (\d{4}) · Emne ([ABC])$/;
const APPENDIX_TERM_RE = /^(\S+) (Maj-Juni|Nov-Dec) (\d{4}) · Emne ([ABC])$/;
const STRONG_QUOTE_RE = /^<strong>“(.+)”<\/strong>$/;

export function toLetter(s: string): Letter {
  if (s === "A" || s === "B" || s === "C") return s;
  throw new Error(`not a topic letter: ${s}`);
}

export function toAB(s: string): "A" | "B" {
  if (s === "A" || s === "B") return s;
  throw new Error(`not a situation key: ${s}`);
}

/** Type predicate for token kinds (no casts). */
export function isKind<K extends TokenKind>(t: Token, kind: K): t is Extract<Token, { kind: K }> {
  return t.kind === kind;
}

export function sessionFromLabel(label: string): Session {
  if (label === "Maj-Juni") return "maj";
  if (label === "Nov-Dec") return "nov";
  throw new Error(`unknown session label: ${label}`);
}

/** Returns the inner text if `s` is exactly one Persian span with no nested tags, else null. */
export function faSpanInner(s: string): string | null {
  if (!s.startsWith(FA_OPEN) || !s.endsWith(FA_CLOSE)) return null;
  const inner = s.slice(FA_OPEN.length, s.length - FA_CLOSE.length);
  if (inner.includes("<span") || inner.includes("</span>")) return null;
  return inner;
}

export function classify(line: SourceLine): Token {
  const raw = line.raw;
  const t = raw.trim();
  if (t === "") return { line, kind: "blank" };
  let m: RegExpExecArray | null;
  if ((m = PAGE_RE.exec(t))) return { line, kind: "page", page: Number(m[1]) };
  if (t.startsWith("<!--") && t.endsWith("-->")) return { line, kind: "comment" };
  if ((m = ANCHOR_RE.exec(t))) return { line, kind: "anchor", id: m[1]! };
  if (t.startsWith("# ")) return { line, kind: "h1", content: t.slice(2) };
  if (t.startsWith("### ")) return { line, kind: "h3", content: t.slice(4) };
  if (t.startsWith("#### ")) return { line, kind: "h4", content: t.slice(5) };
  if (t.startsWith("> ")) return { line, kind: "quote", content: t.slice(2) };
  if ((m = STRONG_QUOTE_RE.exec(t))) return { line, kind: "strongQuote", inner: m[1]! };
  if (t.startsWith("↳ ")) return { line, kind: "arrow", content: t.slice(2) };
  if ((m = KEYWORD_RE.exec(t))) return { line, kind: "keyword", emoji: m[1]!, da: m[2]!, fa: m[3]! };
  if ((m = SITUATION_RE.exec(t))) {
    return { line, kind: "situationItem", key: toAB(m[1]!), da: m[2]!, fa: m[3]! };
  }
  const fa = faSpanInner(t);
  if (fa !== null) return { line, kind: "faPara", content: fa };
  if ((m = TERM_RE.exec(t))) {
    return { line, kind: "term", session: sessionFromLabel(m[1]!), year: Number(m[2]), letter: toLetter(m[3]!) };
  }
  if ((m = APPENDIX_TERM_RE.exec(t))) {
    return {
      line,
      kind: "appendixTerm",
      emoji: m[1]!,
      session: sessionFromLabel(m[2]!),
      year: Number(m[3]),
      letter: toLetter(m[4]!),
    };
  }
  if (t.startsWith("➕ ")) return { line, kind: "plusLine", content: t.slice(2).trim() };
  if (t.startsWith("- ")) return { line, kind: "listItem", content: t.slice(2) };
  if (t.startsWith("|")) return { line, kind: "tableRow", content: t };
  return { line, kind: "other", content: t };
}

/** Classify every line, dropping blanks, page markers and comments (which carry no content). */
export function contentTokens(lines: SourceLine[]): Token[] {
  return lines.map(classify).filter((t) => t.kind !== "blank" && t.kind !== "page" && t.kind !== "comment");
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/** Collapse every run of whitespace (incl. NBSP) to one space and trim. ZWNJ is not whitespace. */
export function normWs(s: string): string {
  return s.replace(/\s+/gu, " ").trim();
}

/** Remove HTML-ish tags (`<span …>`, `<strong>`, `<br>`, `<u>` …) without touching the text between them. */
export function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}

/** The normalisation applied to every extracted string: NFC + whitespace. */
export function normalizeText(s: string): string {
  return normWs(s.normalize("NFC"));
}

/** Split text with `<strong>` runs into plain text plus [start, end) ranges (UTF-16 offsets). */
export function parseStrongRuns(s: string): { text: string; ranges: Array<{ start: number; end: number }> } {
  const re = /<strong>(.*?)<\/strong>/g;
  let out = "";
  let last = 0;
  const ranges: Array<{ start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    out += s.slice(last, m.index);
    const start = out.length;
    out += m[1]!;
    ranges.push({ start, end: out.length });
    last = re.lastIndex;
  }
  out += s.slice(last);
  if (/<[^>]+>/.test(out)) {
    throw new Error(`unexpected markup left after removing <strong>: ${JSON.stringify(out.slice(0, 80))}`);
  }
  return { text: out, ranges };
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Parse a number written with Persian or Latin digits. */
export function parseLooseInt(s: string): number {
  const latin = Array.from(s).map((c) => {
    const i = PERSIAN_DIGITS.indexOf(c);
    return i >= 0 ? String(i) : c;
  });
  const v = Number(latin.join(""));
  if (!Number.isInteger(v)) throw new Error(`not an integer: ${s}`);
  return v;
}

/** `t-M24A` → `{ session: "maj", year: 2024, letter: "A" }` (also accepts `app-…`). */
export function parseTopicAnchor(anchor: string): { session: Session; year: number; letter: Letter } {
  const m = /^(?:t|app)-([MN])(\d{2})([ABC])$/.exec(anchor);
  if (!m) throw new Error(`not a topic anchor: ${anchor}`);
  return { session: m[1] === "M" ? "maj" : "nov", year: 2000 + Number(m[2]), letter: toLetter(m[3]!) };
}

export function termIdOf(year: number, session: Session): string {
  return `${year}-${session}`;
}

export function topicIdOf(year: number, session: Session, letter: Letter): string {
  return `${year}-${session}-${letter.toLowerCase()}`;
}

export function sessionLabel(session: Session): string {
  return session === "maj" ? "Maj-Juni" : "Nov-Dec";
}

/** ASCII slug from Danish text: æ→ae, ø→oe, å→aa, other diacritics dropped. */
export function slugDa(s: string): string {
  return s
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSorted(nums: number[]): number[] {
  return [...new Set(nums)].sort((a, b) => a - b);
}

export class ParseError extends Error {
  readonly lineNo: number;
  readonly page: number;
  constructor(line: SourceLine | undefined, message: string) {
    const where = line ? `line ${line.n} (page ${line.page})` : "end of block";
    const excerpt = line ? `: ${JSON.stringify(line.raw.trim().slice(0, 100))}` : "";
    super(`${where}: ${message}${excerpt}`);
    this.lineNo = line?.n ?? -1;
    this.page = line?.page ?? -1;
  }
}
