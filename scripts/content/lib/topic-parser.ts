/**
 * Strict parsers for topic blocks in the booklet Markdown.
 *
 * - Grammar violations (an unexpected line, wrong order, unknown heading) throw ParseError
 *   with line and page. Nothing is skipped silently: every content line of a block must be
 *   consumed by the grammar.
 * - Cardinality checks (3 key words, 1 follow-up per section, 2 situations …) are reported
 *   by `checkTopic()` as issues, so the survey can list them and the build can refuse them.
 */
import {
  ParseError,
  contentTokens,
  isKind,
  parseTopicAnchor,
  uniqueSorted,
  type Letter,
  type Session,
  type Source,
  type SourceLine,
  type Token,
} from "./source.ts";

export interface At<T> {
  value: T;
  line: SourceLine;
}

export type SectionKind = "sitA" | "sitB" | "general";

export interface PKeyword {
  emoji: string;
  da: string;
  fa: string;
  line: SourceLine;
}

export interface PFollowup {
  headingLine: SourceLine;
  /** Inner text of `<strong>“…”</strong>` (raw, before normalisation). */
  question: At<string>;
  translation: At<string>;
  answer: At<string>;
}

export interface PExample {
  label: string;
  da: string;
  line: SourceLine;
}

export interface PSection {
  kind: SectionKind;
  headingLine: SourceLine;
  /** Inner text of `> <strong>“…”</strong>`. */
  question: At<string>;
  translation: At<string>;
  keywords: PKeyword[];
  /** Raw blockquote content, still containing `<strong>` runs. */
  answer: At<string>;
  followups: PFollowup[];
  examples: PExample[];
  /** Notes placed inside the section, after the follow-up (only t-N16A has one). */
  notes: PNote[];
  /** All source lines of the section (for page provenance). */
  lines: SourceLine[];
}

export type NoteMarker = "🔁" | "🔗" | "⭐" | "📌" | "🩺";
export const NOTE_MARKERS: readonly NoteMarker[] = ["🔁", "🔗", "⭐", "📌", "🩺"];

export interface PNote {
  marker: NoteMarker;
  /** Text after the marker and its following space. */
  text: string;
  line: SourceLine;
}

export interface PTopic {
  anchor: string;
  session: Session;
  year: number;
  letter: Letter;
  anchorLine: SourceLine;
  titleDa: At<string>;
  termLine: SourceLine;
  titleFa: At<string>;
  situations: Array<{ key: "A" | "B"; da: string; fa: string; line: SourceLine }>;
  notes: PNote[];
  sections: PSection[];
  /** Every source line from the anchor to the end of the block, including blanks/page markers. */
  lines: SourceLine[];
}

export interface Issue {
  topic: string;
  line: number;
  page: number;
  message: string;
}

const H4_SITUATION = /^<span lang="fa" dir="rtl">🔴 سؤال اجباری اول · Situation ([AB])<\/span>$/;
const H4_GENERAL = '<span lang="fa" dir="rtl">🟡 سؤال اجباری دوم · Overordnet spørgsmål</span>';
const H4_FOLLOWUP = '<span lang="fa" dir="rtl">➕ سؤال تکمیلی</span>';

/** The exact heading lines, for re-rendering a block in the fidelity round-trip check. */
export const HEADINGS = {
  situation: (key: "A" | "B") => `<span lang="fa" dir="rtl">🔴 سؤال اجباری اول · Situation ${key}</span>`,
  general: H4_GENERAL,
  followup: H4_FOLLOWUP,
} as const;
const QUESTION_QUOTE = /^<strong>“(.+)”<\/strong>$/;
const EXAMPLE_RE = /^🎯 ([^:]+): (.+)$/;
const ARABIC_SCRIPT = /\p{Script=Arabic}/u;
const LATIN_LETTER = /\p{Script=Latin}/u;

/** Is this content-line token a note line (fa paragraph starting with a note marker)? */
export function noteOf(tok: Token): PNote | null {
  if (tok.kind !== "faPara") return null;
  for (const marker of NOTE_MARKERS) {
    if (tok.content.startsWith(marker + " ")) {
      return { marker, text: tok.content.slice(marker.length + 1), line: tok.line };
    }
  }
  return null;
}

export function exampleOf(tok: Token): PExample | null {
  if (tok.kind !== "faPara") return null;
  const m = EXAMPLE_RE.exec(tok.content);
  if (!m) return null;
  return { label: m[1]!, da: m[2]!, line: tok.line };
}

class Cursor {
  private readonly toks: Token[];
  private i = 0;
  private readonly lastLine: SourceLine | undefined;
  constructor(toks: Token[]) {
    this.toks = toks;
    this.lastLine = toks.at(-1)?.line;
  }
  peek(): Token | undefined {
    return this.toks[this.i];
  }
  done(): boolean {
    return this.i >= this.toks.length;
  }
  next(): Token {
    const t = this.toks[this.i];
    if (!t) throw new ParseError(this.lastLine, "unexpected end of block");
    this.i++;
    return t;
  }
  expect<K extends Token["kind"]>(kind: K, what: string): Extract<Token, { kind: K }> {
    const t = this.peek();
    if (!t) throw new ParseError(this.lastLine, `expected ${what}, reached end of block`);
    if (!isKind(t, kind)) throw new ParseError(t.line, `expected ${what}, found ${t.kind}`);
    this.i++;
    return t;
  }
  /** Consume and return the next token if it has this kind. */
  take<K extends Token["kind"]>(kind: K): Extract<Token, { kind: K }> | undefined {
    const t = this.peek();
    if (!t || !isKind(t, kind)) return undefined;
    this.i++;
    return t;
  }
  /** The next token if it is an H4 heading. */
  peekH4(): Extract<Token, { kind: "h4" }> | undefined {
    const t = this.peek();
    return t && isKind(t, "h4") ? t : undefined;
  }
}

// ---------------------------------------------------------------------------
// Block extraction
// ---------------------------------------------------------------------------

export interface Block {
  anchor: string;
  /** Raw source lines of the block: anchor line … line before the next anchor / H3 / H1. */
  lines: SourceLine[];
}

/**
 * Find the blocks that start at `<a id="t-…">` anchors. A block ends before the next anchor,
 * the next H1/H3 heading after the topic's own title, or the end of the file.
 */
export function topicBlocks(src: Source, prefix: "t-" | "app-" = "t-"): Block[] {
  const blocks: Block[] = [];
  const L = src.lines;
  for (let i = 0; i < L.length; i++) {
    const m = /^<a id="([^"]+)"><\/a>$/.exec(L[i]!.raw.trim());
    if (!m || !m[1]!.startsWith(prefix)) continue;
    const start = i;
    let sawTitle = false;
    let j = i + 1;
    for (; j < L.length; j++) {
      const raw = L[j]!.raw.trim();
      if (/^<a id="/.test(raw)) break;
      if (raw.startsWith("# ")) break;
      if (raw.startsWith("### ")) {
        if (sawTitle) break;
        sawTitle = true;
      }
    }
    // Trailing blank lines and page markers belong to the gap, not the topic.
    let end = j;
    while (end > start && /^(\s*|## \d+ \/ \d+)$/.test(L[end - 1]!.raw)) end--;
    blocks.push({ anchor: m[1]!, lines: L.slice(start, end) });
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Main topics (2016–2024)
// ---------------------------------------------------------------------------

export function parseTopic(block: Block): PTopic {
  const toks = contentTokens(block.lines);
  const c = new Cursor(toks);
  const anchorTok = c.expect("anchor", "topic anchor");
  const { session, year, letter } = parseTopicAnchor(anchorTok.id);

  const titleTok = c.expect("h3", "### topic title");
  const termTok = c.expect("term", "term line ('Maj-Juni 2024 · Emne A')");
  if (termTok.session !== session || termTok.year !== year || termTok.letter !== letter) {
    throw new ParseError(termTok.line, `term line does not match anchor ${anchorTok.id}`);
  }
  const titleFaTok = c.expect("faPara", "Persian topic title");
  if (noteOf(titleFaTok) || exampleOf(titleFaTok)) {
    throw new ParseError(titleFaTok.line, "expected Persian topic title, found a note/example");
  }

  const situations: PTopic["situations"] = [];
  for (let s = c.take("situationItem"); s; s = c.take("situationItem")) {
    situations.push({ key: s.key, da: s.da, fa: s.fa, line: s.line });
  }

  const notes: PNote[] = [];
  for (let t = c.peek(); t && noteOf(t); t = c.peek()) {
    notes.push(noteOf(c.next())!);
  }

  const sections: PSection[] = [];
  while (!c.done()) {
    sections.push(parseSection(c));
  }

  return {
    anchor: anchorTok.id,
    session,
    year,
    letter,
    anchorLine: anchorTok.line,
    titleDa: { value: titleTok.content, line: titleTok.line },
    termLine: termTok.line,
    titleFa: { value: titleFaTok.content, line: titleFaTok.line },
    situations,
    notes,
    sections,
    lines: block.lines,
  };
}

function parseSection(c: Cursor): PSection {
  const h = c.expect("h4", "required-question heading (🔴 Situation A/B or 🟡 Overordnet)");
  let kind: SectionKind;
  const sm = H4_SITUATION.exec(h.content);
  if (sm) kind = sm[1] === "A" ? "sitA" : "sitB";
  else if (h.content === H4_GENERAL) kind = "general";
  else throw new ParseError(h.line, "unknown section heading");

  const lines: SourceLine[] = [h.line];
  const q = c.expect("quote", "> <strong>“question”</strong>");
  const qm = QUESTION_QUOTE.exec(q.content);
  if (!qm) throw new ParseError(q.line, "question blockquote is not exactly <strong>“…”</strong>");
  lines.push(q.line);

  const tr = c.expect("faPara", "Persian translation of the question");
  if (noteOf(tr) || exampleOf(tr)) throw new ParseError(tr.line, "expected translation, found note/example");
  lines.push(tr.line);

  const keywords: PKeyword[] = [];
  for (let k = c.take("keyword"); k; k = c.take("keyword")) {
    keywords.push({ emoji: k.emoji, da: k.da, fa: k.fa, line: k.line });
    lines.push(k.line);
  }

  const a = c.expect("quote", "> model answer");
  if (QUESTION_QUOTE.test(a.content)) throw new ParseError(a.line, "expected model answer, found a second question quote");
  lines.push(a.line);

  const followups: PFollowup[] = [];
  while (c.peekH4()?.content === H4_FOLLOWUP) {
    const fh = c.next();
    const fq = c.expect("strongQuote", "<strong>“follow-up question”</strong>");
    const ft = c.expect("faPara", "Persian translation of the follow-up");
    if (noteOf(ft) || exampleOf(ft)) throw new ParseError(ft.line, "expected follow-up translation, found note/example");
    const fa = c.expect("arrow", "↳ follow-up answer");
    followups.push({
      headingLine: fh.line,
      question: { value: fq.inner, line: fq.line },
      translation: { value: ft.content, line: ft.line },
      answer: { value: fa.content, line: fa.line },
    });
    lines.push(fh.line, fq.line, ft.line, fa.line);
  }

  // After the follow-up: personal examples (🎯) and, rarely, notes, in any order.
  const examples: PExample[] = [];
  const notes: PNote[] = [];
  for (let t = c.peek(); t && (exampleOf(t) || noteOf(t)); t = c.peek()) {
    const tok = c.next();
    const ex = exampleOf(tok);
    if (ex) examples.push(ex);
    else notes.push(noteOf(tok)!);
    lines.push(tok.line);
  }

  const nxt = c.peek();
  if (nxt && !(nxt.kind === "h4" && (H4_SITUATION.test(nxt.content) || nxt.content === H4_GENERAL))) {
    throw new ParseError(nxt.line, `unexpected ${nxt.kind} after section ${kind}`);
  }

  return {
    kind,
    headingLine: h.line,
    question: { value: qm[1]!, line: q.line },
    translation: { value: tr.content, line: tr.line },
    keywords,
    answer: { value: a.content, line: a.line },
    followups,
    examples,
    notes,
    lines,
  };
}

/** Cardinality and script checks on a parsed main topic. Empty array = conforms. */
export function checkTopic(t: PTopic): Issue[] {
  const issues: Issue[] = [];
  const add = (line: SourceLine, message: string) =>
    issues.push({ topic: t.anchor, line: line.n, page: line.page, message });

  const keys = t.situations.map((s) => s.key).join("");
  if (keys !== "AB") add(t.titleDa.line, `situation list is "${keys}", expected "AB"`);
  const kinds = t.sections.map((s) => s.kind).join(",");
  if (kinds !== "sitA,sitB,general") add(t.titleDa.line, `sections are [${kinds}], expected [sitA,sitB,general]`);

  for (const s of t.sections) {
    if (s.keywords.length !== 3) add(s.headingLine, `${s.kind}: ${s.keywords.length} key words, expected 3`);
    if (s.followups.length !== 1) add(s.headingLine, `${s.kind}: ${s.followups.length} follow-ups, expected 1`);
    for (const ex of s.examples) {
      if (ARABIC_SCRIPT.test(ex.da)) add(ex.line, "personal example Danish part contains Arabic-script letters");
      if (LATIN_LETTER.test(ex.label)) add(ex.line, "personal example label contains Latin letters");
    }
  }

  // Script checks on every field.
  const da: Array<[string, SourceLine]> = [[t.titleDa.value, t.titleDa.line]];
  const fa: Array<[string, SourceLine]> = [[t.titleFa.value, t.titleFa.line]];
  for (const s of t.situations) {
    da.push([s.da, s.line]);
    fa.push([s.fa, s.line]);
  }
  for (const n of t.notes) fa.push([n.text, n.line]);
  for (const s of t.sections) {
    for (const n of s.notes) fa.push([n.text, n.line]);
    da.push([s.question.value, s.question.line], [s.answer.value, s.answer.line]);
    fa.push([s.translation.value, s.translation.line]);
    for (const k of s.keywords) {
      da.push([k.da, k.line]);
      fa.push([k.fa, k.line]);
    }
    for (const f of s.followups) {
      da.push([f.question.value, f.question.line], [f.answer.value, f.answer.line]);
      fa.push([f.translation.value, f.translation.line]);
    }
  }
  for (const [v, line] of da) if (ARABIC_SCRIPT.test(v)) add(line, `Danish field contains Arabic-script letters: ${v.slice(0, 40)}`);
  for (const [v, line] of fa) if (!ARABIC_SCRIPT.test(v)) add(line, `Persian field has no Persian letters: ${v.slice(0, 40)}`);
  return issues;
}

export function pagesOf(lines: SourceLine[]): number[] {
  return uniqueSorted(lines.map((l) => l.page));
}

/** Content lines only (no blanks/page markers): used for page provenance. */
export function contentPages(lines: SourceLine[]): number[] {
  return pagesOf(contentTokens(lines).map((t) => t.line));
}

// ---------------------------------------------------------------------------
// Appendix topics (2013–2015)
// ---------------------------------------------------------------------------

export interface PAppendixSection {
  label: "A" | "B" | "overordnet";
  headingLine: SourceLine;
  question: At<string>;
  translation: At<string>;
  keywords: PKeyword[];
  followup: At<string> | null;
}

export interface PAppendixTopic {
  anchor: string | null;
  emoji: string;
  session: Session;
  year: number;
  letter: Letter;
  termLine: SourceLine;
  titleDa: At<string>;
  titleFa: At<string>;
  sections: PAppendixSection[];
  lines: SourceLine[];
}

const H4_APPENDIX = /^(A|B|overordnet) (🔴|🟡)$/;

/**
 * Parse the appendix (anchor `appendix` up to anchor `vocab`): 2013–2015 topics, each starting
 * with an `<emoji> <term> · Emne X` line, optionally preceded by an `app-` anchor.
 * Stops at the first H4 that is not an appendix section heading (the 2004–2012 title table).
 */
export function parseAppendix(src: Source): { topics: PAppendixTopic[]; titleTableStart: SourceLine | null } {
  const startIdx = src.lines.findIndex((l) => l.raw.trim() === '<a id="appendix"></a>');
  const endIdx = src.lines.findIndex((l) => l.raw.trim() === '<a id="vocab"></a>');
  if (startIdx < 0 || endIdx < 0) throw new Error("appendix or vocab anchor not found");
  const toks = contentTokens(src.lines.slice(startIdx, endIdx));
  const c = new Cursor(toks);
  c.expect("anchor", "appendix anchor");
  c.expect("h3", "appendix heading");
  c.expect("faPara", "appendix introduction");

  const topics: PAppendixTopic[] = [];
  let titleTableStart: SourceLine | null = null;
  while (!c.done()) {
    let anchor: string | null = null;
    const first = c.peek()!;
    if (first.kind === "h4" && !H4_APPENDIX.test(first.content)) {
      titleTableStart = first.line;
      break;
    }
    if (first.kind === "anchor") {
      c.next();
      anchor = first.id;
    }
    const term = c.expect("appendixTerm", "appendix term line ('🌍 Maj-Juni 2013 · Emne A')");
    if (anchor) {
      const a = parseTopicAnchor(anchor);
      if (a.session !== term.session || a.year !== term.year || a.letter !== term.letter) {
        throw new ParseError(term.line, `term line does not match anchor ${anchor}`);
      }
    }
    const title = c.expect("h3", "### appendix topic title");
    const titleFa = c.expect("faPara", "Persian appendix topic title");
    const sections: PAppendixSection[] = [];
    const firstLine = term.line;
    let lastLine = titleFa.line;
    for (let h = c.peekH4(); h && H4_APPENDIX.test(h.content); h = c.peekH4()) {
      c.next();
      const rawLabel = H4_APPENDIX.exec(h.content)![1];
      const label: PAppendixSection["label"] = rawLabel === "A" ? "A" : rawLabel === "B" ? "B" : "overordnet";
      const q = c.expect("quote", "> <strong>“question”</strong>");
      const qm = QUESTION_QUOTE.exec(q.content);
      if (!qm) throw new ParseError(q.line, "question blockquote is not exactly <strong>“…”</strong>");
      const tr = c.expect("faPara", "Persian translation");
      const keywords: PKeyword[] = [];
      for (let k = c.take("keyword"); k; k = c.take("keyword")) {
        keywords.push({ emoji: k.emoji, da: k.da, fa: k.fa, line: k.line });
      }
      let followup: At<string> | null = null;
      const p = c.take("plusLine");
      if (p) followup = { value: p.content, line: p.line };
      lastLine = followup?.line ?? keywords.at(-1)?.line ?? tr.line;
      sections.push({
        label,
        headingLine: h.line,
        question: { value: qm[1]!, line: q.line },
        translation: { value: tr.content, line: tr.line },
        keywords,
        followup,
      });
    }
    const nxt = c.peek();
    if (nxt && !(nxt.kind === "anchor" || nxt.kind === "appendixTerm" || nxt.kind === "h4")) {
      throw new ParseError(nxt.line, `unexpected ${nxt.kind} in appendix topic`);
    }
    topics.push({
      anchor,
      emoji: term.emoji,
      session: term.session,
      year: term.year,
      letter: term.letter,
      termLine: term.line,
      titleDa: { value: title.content, line: title.line },
      titleFa: { value: titleFa.content, line: titleFa.line },
      sections,
      lines: src.lines.slice(firstLine.n - 1, lastLine.n),
    });
  }
  return { topics, titleTableStart };
}
