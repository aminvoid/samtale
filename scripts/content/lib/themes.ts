/**
 * Theme chapters (anchors `cat-…`) and the main table of contents.
 */
import {
  ParseError,
  contentTokens,
  faSpanInner,
  isKind,
  toLetter,
  parseLooseInt,
  sessionFromLabel,
  type Letter,
  type Session,
  type Source,
  type SourceLine,
} from "./source.ts";

export interface PSubgroup {
  da: string;
  fa: string;
  line: SourceLine;
}

export interface PTocEntry {
  titleDa: string;
  session: Session;
  year: number;
  letter: Letter;
  titleFa: string;
  anchor: string;
  /** Index into `tocSubgroups`, or null when the chapter has no sub-groups. */
  subgroup: number | null;
  line: SourceLine;
}

export interface PChapter {
  anchorId: string;
  themeId: string;
  anchorLine: SourceLine;
  emoji: string;
  chapter: number;
  titleDa: string;
  titleFa: string;
  declaredCount: number;
  headerLines: SourceLine[];
  /** Sub-group headings in the chapter's own TOC (`#### <span fa>DA — FA</span>`). */
  tocSubgroups: PSubgroup[];
  tocEntries: PTocEntry[];
  /** Sub-group headings placed before the topics (`### DA · <span fa>FA</span>`). */
  subgroups: PSubgroup[];
  /** Topic anchors in the chapter body, with the body sub-group they sit under. */
  topics: Array<{ anchor: string; subgroup: number | null; line: SourceLine }>;
  lines: SourceLine[];
}

export interface PMainTocEntry {
  emoji: string;
  chapter: number;
  titleFa: string;
  titleDa: string;
  anchorId: string;
  declaredCount: number;
  line: SourceLine;
}

const CHAPTER_LABEL = /^(\S+) فصل (\S+)$/;
const COUNT_LABEL = /^(\S+) موضوع$/;
const TOC_ENTRY =
  /^- \[(.+?) · (Maj-Juni|Nov-Dec) (\d{4}) · ([ABC]) · <span lang="fa" dir="rtl">([^<]+)<\/span>\]\(#(t-[MN]\d{2}[ABC])\)$/;
const SUBGROUP_H3 = /^(.+?) · <span lang="fa" dir="rtl">([^<]+)<\/span>$/;
const MAIN_TOC_ENTRY =
  /^- \[<span lang="fa" dir="rtl">(\S+) فصل (\S+) · (.+) \((.+)\)<\/span>\]\(#(cat-[a-z]+)\) · <span lang="fa" dir="rtl">(\S+) موضوع<\/span>$/;

export function parseMainToc(src: Source): PMainTocEntry[] {
  const out: PMainTocEntry[] = [];
  for (const line of src.lines) {
    if (line.page > 3) break;
    const m = MAIN_TOC_ENTRY.exec(line.raw.trim());
    if (!m) continue;
    out.push({
      emoji: m[1]!,
      chapter: parseLooseInt(m[2]!),
      titleFa: m[3]!,
      titleDa: m[4]!,
      anchorId: m[5]!,
      declaredCount: parseLooseInt(m[6]!),
      line,
    });
  }
  return out;
}

export function parseChapters(src: Source): PChapter[] {
  const L = src.lines;
  const starts: number[] = [];
  let endIdx = -1;
  L.forEach((l, i) => {
    const t = l.raw.trim();
    if (/^<a id="cat-[a-z]+"><\/a>$/.test(t)) starts.push(i);
    if (t === '<a id="recurring"></a>') endIdx = i;
  });
  if (endIdx < 0) throw new Error("recurring anchor not found");
  return starts.map((s, k) => parseChapter(L.slice(s, k + 1 < starts.length ? starts[k + 1] : endIdx)));
}

function parseChapter(lines: SourceLine[]): PChapter {
  const toks = contentTokens(lines);
  let i = 0;
  const want = <K extends (typeof toks)[number]["kind"]>(kind: K, what: string) => {
    const t = toks[i];
    if (!t || !isKind(t, kind)) throw new ParseError(t?.line, `chapter header: expected ${what}`);
    i++;
    return t;
  };
  const anchor = want("anchor", "cat- anchor");
  const label = want("faPara", "'<emoji> فصل N'");
  const lm = CHAPTER_LABEL.exec(label.content);
  if (!lm) throw new ParseError(label.line, "chapter label does not match '<emoji> فصل N'");
  const title = want("h3", "### chapter title (Danish)");
  const titleFa = want("faPara", "Persian chapter title");
  const count = want("faPara", "'N موضوع'");
  const cm = COUNT_LABEL.exec(count.content);
  if (!cm) throw new ParseError(count.line, "topic count does not match 'N موضوع'");
  const headerLines = [anchor.line, label.line, title.line, titleFa.line, count.line];

  const tocSubgroups: PSubgroup[] = [];
  const tocEntries: PTocEntry[] = [];
  for (; i < toks.length; i++) {
    const t = toks[i]!;
    if (t.kind === "h4") {
      const inner = faSpanInner(t.content);
      const parts = inner?.split(" — ");
      if (!parts || parts.length !== 2) throw new ParseError(t.line, "chapter TOC sub-group heading is not '<span fa>DA — FA</span>'");
      tocSubgroups.push({ da: parts[0]!, fa: parts[1]!, line: t.line });
      continue;
    }
    if (t.kind === "listItem") {
      const m = TOC_ENTRY.exec(t.line.raw.trim());
      if (!m) throw new ParseError(t.line, "chapter TOC entry does not match the expected link form");
      tocEntries.push({
        titleDa: m[1]!,
        session: sessionFromLabel(m[2]!),
        year: Number(m[3]),
        letter: toLetter(m[4]!),
        titleFa: m[5]!,
        anchor: m[6]!,
        subgroup: tocSubgroups.length ? tocSubgroups.length - 1 : null,
        line: t.line,
      });
      continue;
    }
    break;
  }

  const subgroups: PSubgroup[] = [];
  const topics: PChapter["topics"] = [];
  for (; i < toks.length; i++) {
    const t = toks[i]!;
    if (t.kind === "anchor" && t.id.startsWith("t-")) {
      topics.push({ anchor: t.id, subgroup: subgroups.length ? subgroups.length - 1 : null, line: t.line });
    } else if (t.kind === "h3") {
      const m = SUBGROUP_H3.exec(t.content);
      if (m) subgroups.push({ da: m[1]!, fa: m[2]!, line: t.line });
    }
  }

  return {
    anchorId: anchor.id,
    themeId: anchor.id.replace(/^cat-/, ""),
    anchorLine: anchor.line,
    emoji: lm[1]!,
    chapter: parseLooseInt(lm[2]!),
    titleDa: title.content,
    titleFa: titleFa.content,
    declaredCount: parseLooseInt(cm[1]!),
    headerLines,
    tocSubgroups,
    tocEntries,
    subgroups,
    topics,
    lines,
  };
}
