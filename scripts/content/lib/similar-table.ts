/**
 * The booklet's similar-questions table (anchor `recurring`, pp. 99–100), reduced to structure:
 * row number and the (topic, section) cells it links. The row labels and the framing text are
 * booklet text and are not kept (D-15, D-21). Any row that doesn't match fails loudly.
 */
import { ParseError, parseTopicAnchor, termIdOf, topicIdOf, type Source } from "./source.ts";
import type { SimilarRow } from "./build.ts";
import type { SectionKind } from "@/lib/content/schema/authoring";

const ROW = /^\| (\d+) \| (.+?)<br><span lang="fa" dir="rtl">([^<]+)<\/span> \| (.+) \|$/;
const REF = /\[(Maj-Juni|Nov-Dec) (\d{4}) · ([ABC])(?: \((overordnet|sit\. A|sit\. B)\)| 📜)\]\(#((?:t|app)-[MN]\d{2}[ABC])\)/gu;

export function parseSimilarTable(src: Source): SimilarRow[] {
  const rows: SimilarRow[] = [];
  for (const line of src.lines) {
    if (!/^\| \d+ \| /.test(line.raw)) continue;
    const m = ROW.exec(line.raw);
    if (!m) throw new ParseError(line, "similar-questions row does not match '| n | DA<br><span fa>FA</span> | refs |'");
    const cell = m[4]!;
    if (cell.replace(REF, "").replace(/ · /g, "").trim()) throw new ParseError(line, "unparsed text in the references cell");
    const members = [...cell.matchAll(REF)].map((r) => {
      const a = parseTopicAnchor(r[5]!);
      if (termIdOf(a.year, a.session) !== `${r[2]}-${r[1] === "Maj-Juni" ? "maj" : "nov"}` || a.letter !== r[3]) {
        throw new ParseError(line, `link text ${r[1]} ${r[2]} ${r[3]} does not match anchor #${r[5]}`);
      }
      const label = r[4];
      const section: SectionKind | null = label === "overordnet" ? "general" : label === "sit. A" ? "sitA" : label === "sit. B" ? "sitB" : null;
      return { topicId: topicIdOf(a.year, a.session, a.letter), section };
    });
    rows.push({ n: Number(m[1]), members });
  }
  return rows;
}
