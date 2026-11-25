/**
 * content:validate — validation of content/ (ADR-0003): Zod schemas for shape, plus the cross-file
 * rules Zod can't express (IDs, references, scripts, origins, publishing gates, confidentiality).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { z } from "zod";
import {
  ExaminerLinesFileSchema,
  PublishedIdsFileSchema,
  TermsFileSchema,
  ThemesFileSchema,
  TopicFileSchema,
  TopicLinksFileSchema,
  type ExternalSource,
  type LocalizedText,
  type QuestionSection,
  type SiriCheck,
  type TopicFile,
} from "@/lib/content/schema/authoring";
import { answerItemsOf, translationSourceHash } from "./answer-translations.ts";
import { FORMAT_ERAS, decided, eraOf } from "./build.ts";
import { scanForConfidentiality } from "./confidentiality.ts";
import { AnswerTranslationsFileSchema, MarginNotesFileSchema, type CorrectionNote, type ReviewLedger } from "./pipeline-schema.ts";

const ARABIC_SCRIPT = /\p{Script=Arabic}/u;
const PERSIAN_LETTER = /(?=\p{L})\p{Script=Arabic}/u;
const LATEST_PUBLIC_TERM = "2024-maj";
const TOPIC_ID = /^(20\d\d)-(maj|nov)-([abc])$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** «امتحان» is never used for the exam (glossary); only app-authored Persian is checked, booklet text is the author's. */
const FORBIDDEN_FA = ["امتحان"];
const TRANSLATION_GLOSSARY = { امتحان: "آزمون", جواب: "پاسخ" };

function isPresentationForm(cp: number): boolean {
  return (cp >= 0xfb50 && cp <= 0xfdff) || (cp >= 0xfe70 && cp <= 0xfefe);
}
function isSurrogateBoundary(s: string, i: number): boolean {
  const c = s.charCodeAt(i);
  return i > 0 && i < s.length && c >= 0xdc00 && c <= 0xdfff;
}

/** Every stable ID inside a topic (topic, sections, questions, key words, answers, follow-ups, examples, intros). */
export function itemIdsOf(t: TopicFile): string[] {
  const out = [t.id];
  for (const s of [...t.situations, t.general]) {
    out.push(s.id, s.question.id, s.question.modelAnswer.id, ...s.question.keywords.map((k) => k.id));
    for (const f of s.followups) out.push(f.id, f.answer.id);
    for (const e of s.personalExamples) out.push(e.id);
  }
  for (const s of t.situations) if (s.intro) out.push(s.intro.id);
  return out;
}

/** Resolve a path like `situations[1].question.text.fa` in a JSON value. */
export function valueAt(root: unknown, path: string): unknown {
  let cur: unknown = root;
  for (const part of path.split(".")) {
    const m = /^(\w+)((?:\[\d+\])*)$/.exec(part);
    if (!m || cur === null || typeof cur !== "object") return undefined;
    const next: unknown = Reflect.get(cur, m[1]!);
    cur = next;
    for (const idx of m[2]!.matchAll(/\[(\d+)\]/g)) {
      const el: unknown = Array.isArray(cur) ? cur[Number(idx[1])] : undefined;
      cur = el;
    }
  }
  return cur;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  report: string[];
  topics: TopicFile[];
}

export interface ValidateOptions {
  /** All topic IDs in the booklet (main + appendix), for margin-note refs. */
  knownTopicIds?: Set<string>;
  /** The 51 main topic IDs, for topic links. */
  mainTopicIds?: Set<string>;
  /** IDs of registered external sources (scripts/content/data/siri-*.json). */
  knownSources?: Set<string>;
  /** The review ledger, to check correction notes against the current text. */
  ledger?: ReviewLedger;
}

export function validateContent(contentDir: string, opts: ValidateOptions = {}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);
  const read = <S extends z.ZodType>(rel: string, schema: S): z.infer<S> | null => {
    const p = resolve(contentDir, rel);
    if (!existsSync(p)) {
      err(rel, "missing");
      return null;
    }
    const raw = readFileSync(p, "utf8");
    if (!raw.endsWith("\n") || raw.endsWith("\n\n")) err(rel, "must end with exactly one newline");
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      err(rel, `invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
    const r = schema.safeParse(json);
    if (!r.success) {
      for (const issue of r.error.issues.slice(0, 10)) err(rel, `schema: ${issue.path.join(".")}: ${issue.message}`);
      return null;
    }
    return r.data;
  };

  const themes = read("themes.json", ThemesFileSchema);
  const terms = read("terms.json", TermsFileSchema);
  const examiner = read("examiner-lines.json", ExaminerLinesFileSchema);
  const translations = read("answer-translations.json", AnswerTranslationsFileSchema);
  const links = read("topic-links.json", TopicLinksFileSchema);
  const published = read("published-ids.json", PublishedIdsFileSchema);
  const margin = read("internal/margin-notes.json", MarginNotesFileSchema);
  const topicDir = resolve(contentDir, "topics");
  const topics: TopicFile[] = [];
  for (const f of existsSync(topicDir) ? readdirSync(topicDir).filter((x) => x.endsWith(".json")).sort() : []) {
    const t = read(`topics/${f}`, TopicFileSchema);
    if (!t) continue;
    if (`${t.id}.json` !== f) err(`topics/${f}`, `file name does not match id ${t.id}`);
    topics.push(t);
  }

  const ids = new Map<string, string>();
  const claimId = (id: string, where: string) => {
    if (!id) {
      err(where, "missing id");
      return;
    }
    const prev = ids.get(id);
    if (prev !== undefined) err(where, `duplicate id ${id} (also at ${prev})`);
    ids.set(id, where);
  };

  const text = (where: string, v: LocalizedText, required: Array<"da" | "fa">, opt: { allowed?: Array<"da" | "fa" | "en">; appAuthored?: boolean } = {}): void => {
    const allowed = opt.allowed ?? ["da", "fa", "en"];
    for (const k of Object.keys(v)) if (!allowed.some((a) => a === k)) err(where, `unexpected locale key "${k}"`);
    for (const loc of required) if (v[loc] === undefined) err(where, `missing required ${loc}`);
    for (const [loc, s] of Object.entries(v)) {
      const w = `${where}.${loc}`;
      if (s.length === 0) err(w, "empty string");
      if (s !== s.trim() || /\s{2,}/u.test(s)) err(w, "untrimmed or repeated whitespace");
      if (s !== s.normalize("NFC")) err(w, "not NFC");
      if (/<[^>]+>/.test(s)) err(w, "contains markup");
      if (loc === "da" && ARABIC_SCRIPT.test(s)) err(w, "Danish text contains Arabic-script letters");
      if (loc === "fa") {
        if (!PERSIAN_LETTER.test(s)) err(w, "Persian text has no Persian letters");
        for (const ch of s) {
          const cp = ch.codePointAt(0) ?? 0;
          if (cp === 0x064a || cp === 0x0643) err(w, `Arabic ${cp === 0x064a ? "yeh" : "kaf"} U+${cp.toString(16).toUpperCase()}`);
          if (isPresentationForm(cp)) err(w, `presentation form U+${cp.toString(16).toUpperCase()}`);
        }
        if (opt.appAuthored) {
          if (/[0-9۰-۹٠-٩]/u.test(s)) err(w, "app-authored Persian must not contain literal digits (use ICU number arguments in messages)");
          for (const word of FORBIDDEN_FA) if (s.includes(word)) err(w, `app-authored Persian uses «${word}» (glossary: «آزمون»)`);
        }
      }
    }
  };

  const pages = (where: string, src: { pages: number[] }, max = 116) => {
    if (src.pages.length === 0) err(where, "pages missing or empty");
    src.pages.forEach((p, i) => {
      if (p < 1 || p > max) err(where, `page ${p} out of range`);
      const prev = src.pages[i - 1];
      if (prev !== undefined && p <= prev) err(where, "pages not ascending/unique");
    });
  };
  const sourceRef = (where: string, r: ExternalSource | undefined) => {
    if (!r) {
      err(where, "sourceRef required");
      return;
    }
    if (opts.knownSources && !opts.knownSources.has(r.document)) err(where, `unknown source document ${r.document}`);
    pages(where, r, 999);
  };
  const review = (where: string, r: { status: string; notes?: unknown[]; reviewedBy?: string; reviewedOn?: string }) => {
    if (r.status === "needs-review" && !r.notes?.length) err(where, "needs-review without notes");
    if ((r.status === "approved" || r.status === "reviewed") && (!r.reviewedBy || !r.reviewedOn || !ISO_DATE.test(r.reviewedOn))) {
      err(where, `${r.status} needs reviewedBy and an ISO reviewedOn`);
    }
  };
  const siriCheck = (where: string, c: SiriCheck, bookletDa: string | undefined) => {
    if (c.status === "unchecked") {
      if (c.sourceRef || c.checkedOn || c.siriParts || c.sourceDisplay) err(where, "unchecked siriCheck must not carry sourceRef/checkedOn/siriParts/sourceDisplay");
      return;
    }
    sourceRef(`${where}.sourceRef`, c.sourceRef);
    if (!c.checkedOn || !ISO_DATE.test(c.checkedOn)) err(where, "checkedOn must be an ISO date");
    if (!c.sourceDisplay?.title || !c.sourceDisplay.note) err(where, "sourceDisplay (title, availability, note) required so the UI can name the source");
    if (!c.siriParts?.length) {
      err(where, "siriParts required");
      return;
    }
    if ((c.siriParts.join(" ") === bookletDa) !== (c.status === "matches")) err(where, `status ${c.status} contradicts the text comparison`);
  };

  let spokenCount = 0;
  const section = (where: string, s: QuestionSection, expectedId: string, q: "q1" | "q2") => {
    claimId(s.id, where);
    if (s.id !== expectedId) err(where, `id ${s.id}, expected ${expectedId}`);
    const qq = s.question;
    claimId(qq.id, `${where}.question`);
    if (qq.id !== `${expectedId}.${q}`) err(`${where}.question`, `id ${qq.id}, expected ${expectedId}.${q}`);
    text(`${where}.question.text`, qq.text, ["da", "fa"]);
    siriCheck(`${where}.question.siriCheck`, qq.siriCheck, qq.text.da);
    if (qq.keywords.length !== 3) err(`${where}.question.keywords`, "expected exactly 3 key words");
    qq.keywords.forEach((k, i) => {
      claimId(k.id, `${where}.question.keywords[${i}]`);
      if (k.id !== `${qq.id}.kw${i + 1}`) err(`${where}.question.keywords[${i}]`, `id ${k.id}`);
      if (!k.emoji) err(`${where}.question.keywords[${i}]`, "missing emoji");
      text(`${where}.question.keywords[${i}].text`, k.text, ["da", "fa"]);
    });
    const a = qq.modelAnswer;
    claimId(a.id, `${where}.question.modelAnswer`);
    if (a.id !== `${qq.id}.answer`) err(`${where}.question.modelAnswer`, `id ${a.id}`);
    text(`${where}.question.modelAnswer.text`, a.text, ["da"]);
    const da = a.text.da ?? "";
    let prevEnd = 0;
    for (const r of a.emphasis) {
      if (!(r.start >= prevEnd && r.end > r.start && r.end <= da.length)) err(`${where}.question.modelAnswer.emphasis`, `bad range ${JSON.stringify(r)}`);
      if (isSurrogateBoundary(da, r.start) || isSurrogateBoundary(da, r.end)) err(`${where}.question.modelAnswer.emphasis`, `range ${JSON.stringify(r)} splits a surrogate pair`);
      prevEnd = r.end;
    }
    s.followups.forEach((f, i) => {
      const w = `${where}.followups[${i}]`;
      claimId(f.id, w);
      if (f.id !== `${expectedId}.followup${i + 1}`) err(w, `id ${f.id}`);
      text(`${w}.text`, f.text, ["da", "fa"]);
      siriCheck(`${w}.siriCheck`, f.siriCheck, f.text.da);
      if (f.spoken) {
        spokenCount++;
        const [head, tail] = f.spoken.parts;
        const shown = f.text.da ?? "";
        if (f.spoken.parts.length !== 2 || head === undefined || tail === undefined) err(`${w}.spoken`, "expected exactly two parts");
        else if (!shown.startsWith(`${head} `) || !/^Hvorfor ?\?? ?\/ ?[Hh]vorfor ikke\?$/.test(shown.slice(head.length + 1))) {
          err(`${w}.spoken`, "part 1 must be the displayed text up to a 'Hvorfor?/Hvorfor ikke?' ending");
        }
        if (f.spoken.pauseMs < 300 || f.spoken.pauseMs > 1500) err(`${w}.spoken`, "pauseMs outside 300–1500");
      }
      claimId(f.answer.id, `${w}.answer`);
      if (f.answer.id !== `${f.id}.answer`) err(`${w}.answer`, `id ${f.answer.id}`);
      text(`${w}.answer.text`, f.answer.text, ["da"]);
    });
    s.personalExamples.forEach((e, i) => {
      const w = `${where}.personalExamples[${i}]`;
      claimId(e.id, w);
      if (e.id !== `${expectedId}.example${i + 1}`) err(w, `id ${e.id}`);
      text(`${w}.label`, e.label, ["fa"], { allowed: ["fa", "en"] });
      text(`${w}.text`, e.text, ["da"]);
    });
    pages(where, s.source);
  };

  // Themes
  const themeIds = new Set<string>();
  const subthemeIds = new Map<string, string>();
  themes?.themes.forEach((th, i) => {
    const w = `themes.json themes[${i}]`;
    claimId(`theme:${th.id}`, w);
    themeIds.add(th.id);
    text(`${w}.title`, th.title, ["da", "fa"]);
    if (!th.emoji) err(w, "missing emoji");
    pages(w, th.source);
    review(w, th.review);
    th.subthemes.forEach((s, k) => {
      claimId(`subtheme:${s.id}`, `${w}.subthemes[${k}]`);
      if (!s.id.startsWith(`${th.id}.`)) err(`${w}.subthemes[${k}]`, `id ${s.id} not under theme ${th.id}`);
      subthemeIds.set(s.id, th.id);
      text(`${w}.subthemes[${k}].title`, s.title, ["da", "fa"]);
    });
  });

  // Terms
  const termById = new Map(terms?.terms.map((t) => [t.id, t]) ?? []);
  if (terms) {
    if (JSON.stringify(terms.formatEras) !== JSON.stringify(FORMAT_ERAS)) err("terms.json", "formatEras differ from the pipeline definition");
    for (const t of terms.terms) {
      if (t.id !== `${t.year}-${t.session}`) err(`terms.json ${t.id}`, "id does not match year/session");
      if (t.formatEraId !== eraOf(t.id)) err(`terms.json ${t.id}`, `formatEraId ${t.formatEraId}, expected ${eraOf(t.id)}`);
      if (t.id > LATEST_PUBLIC_TERM) err(`terms.json ${t.id}`, `term after ${LATEST_PUBLIC_TERM}: exam material is confidential from winter 2024 (PRD R5, US-064)`);
    }
  }

  // Examiner lines
  examiner?.lines.forEach((l, i) => {
    const w = `examiner-lines.json lines[${i}]`;
    claimId(l.id, w);
    text(`${w}.text`, l.text, ["da"], { appAuthored: l.origin === "app" });
    const ph = [...(l.text.da ?? "").matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    if (JSON.stringify(ph) !== JSON.stringify(l.placeholders)) err(w, "placeholders do not match the text");
    if (l.origin === "siri") sourceRef(`${w}.sourceRef`, l.sourceRef);
    else if (l.sourceRef) err(w, "app-authored line must not claim a source");
    review(w, l.review);
  });

  // Topics
  const introOrigins: string[] = [];
  for (const t of topics) {
    const w = `topics/${t.id}.json`;
    claimId(t.id, w);
    const m = TOPIC_ID.exec(t.id);
    if (!m) err(w, "id does not match {year}-{maj|nov}-{a|b|c}");
    else {
      if (t.termId !== `${m[1]}-${m[2]}`) err(w, `termId ${t.termId} does not match id`);
      if (t.letter !== m[3]!.toUpperCase()) err(w, `letter ${t.letter} does not match id`);
    }
    if (!themeIds.has(t.themeId)) err(w, `themeId ${t.themeId} not in themes.json`);
    if (t.subthemeId !== undefined && subthemeIds.get(t.subthemeId) !== t.themeId) err(w, `subthemeId ${t.subthemeId} not under ${t.themeId}`);
    const term = termById.get(t.termId);
    if (!term) err(w, `termId ${t.termId} not in terms.json`);
    else if (!term.topicIds.includes(t.id)) err(w, `not listed in terms.json ${t.termId}.topicIds`);
    if (t.termId > LATEST_PUBLIC_TERM) err(w, "topic from a confidential term");
    text(`${w} title`, t.title, ["da", "fa"]);
    if (t.situations.map((s) => s.key).join("") !== "AB") err(w, "situations must be exactly A, B");
    t.situations.forEach((s, i) => {
      section(`${w} situations[${i}]`, s, `${t.id}.sit${s.key}`, "q1");
      text(`${w} situations[${i}].title`, s.title, ["da", "fa"]);
      const intro = s.intro;
      if (!intro) {
        introOrigins.push("missing");
        if (t.review.status === "approved") err(`${w} situations[${i}]`, "approved topic needs a situation intro (DL-045)");
        return;
      }
      introOrigins.push(`${intro.origin} ${intro.review.status}`);
      claimId(intro.id, `${w} situations[${i}].intro`);
      if (intro.id !== `${s.id}.intro`) err(`${w} situations[${i}].intro`, `id ${intro.id}`);
      text(`${w} situations[${i}].intro.text`, intro.text, ["da"], { appAuthored: intro.origin === "app" });
      if (intro.origin === "siri") sourceRef(`${w} situations[${i}].intro.sourceRef`, intro.sourceRef);
      else if (intro.sourceRef) err(`${w} situations[${i}].intro`, "app-authored intro must not claim a source");
      review(`${w} situations[${i}].intro`, intro.review);
      if (t.review.status === "approved" && intro.review.status !== "approved") err(`${w} situations[${i}].intro`, "an approved topic needs approved intros (US-064)");
    });
    section(`${w} general`, t.general, `${t.id}.general`, "q2");
    pages(w, t.source);
    review(w, t.review);
  }
  const topicIds = new Set(topics.map((t) => t.id));
  for (const term of terms?.terms ?? []) for (const id of term.topicIds) if (!topicIds.has(id)) err(`terms.json ${term.id}`, `topic ${id} has no file`);

  const answerTexts = new Map(topics.flatMap(answerItemsOf).map(({ id, text }) => [id, text.da]));
  const translationItems = new Map(Object.entries(translations?.items ?? {}));
  const translationDecisions = new Map(Object.entries(opts.ledger?.answerTranslations ?? {}));
  let translated = 0;
  let approved = 0;
  let stale = 0;
  for (const [id, item] of translationItems) {
    const where = `answer-translations.json items.${id}`;
    text(where, { fa: item.fa }, ["fa"]);
    for (const [word, preferred] of Object.entries(TRANSLATION_GLOSSARY)) {
      if (item.fa.includes(word)) err(`${where}.fa`, `uses «${word}» (glossary: «${preferred}»)`);
    }
    const da = answerTexts.get(id);
    if (da === undefined) {
      err(where, "unknown answer ID or missing Danish text");
      continue;
    }
    translated++;
    const decision = decided({ status: "extracted" }, translationDecisions.get(id));
    if (item.sourceHash !== translationSourceHash(da)) {
      stale++;
      const message = "stale translation (sourceHash does not match the current Danish text)";
      if (decision.status === "approved") err(where, `approved but ${message}`);
      else warnings.push(`${where}: ${message}`);
    } else if (decision.status === "approved") approved++;
  }
  for (const [id, decision] of translationDecisions) {
    const where = `review-ledger.json answerTranslations.${id}`;
    if (!translationItems.has(id) || !answerTexts.has(id)) err(where, "unknown answer translation ID");
    review(where, decision);
  }

  // Topic links: IDs and sections only, between main topics that exist.
  const checkRef = (where: string, r: { topicId: string }) => {
    if (opts.mainTopicIds && !opts.mainTopicIds.has(r.topicId)) err(where, `${r.topicId} is not a main topic`);
  };
  links?.similarGroups.forEach((g, i) => {
    if (g.members.length < 2) err(`topic-links.json similarGroups[${i}]`, "a group needs at least two members");
    g.members.forEach((r, k) => {
      checkRef(`topic-links.json similarGroups[${i}].members[${k}]`, r);
    });
  });
  links?.links.forEach((l, i) => {
    checkRef(`topic-links.json links[${i}].from`, l.from);
    checkRef(`topic-links.json links[${i}].to`, l.to);
    if (l.from.topicId === l.to.topicId) err(`topic-links.json links[${i}]`, "self link");
  });

  // Published IDs: append-only, never lost.
  if (published) {
    const allItemIds = new Set(topics.flatMap(itemIdsOf));
    const retired = new Set(published.retired.map((r) => r.id));
    const sorted = [...published.ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    if (JSON.stringify(sorted) !== JSON.stringify(published.ids) || new Set(published.ids).size !== published.ids.length) err("published-ids.json", "ids must be unique and sorted by code point");
    for (const id of published.ids) {
      if (retired.has(id)) err("published-ids.json", `${id} is both published and retired`);
      else if (!allItemIds.has(id)) err("published-ids.json", `published id ${id} disappeared from content without being retired`);
    }
    for (const t of topics) if (t.review.status === "approved") for (const id of itemIdsOf(t)) if (!published.ids.includes(id)) err("published-ids.json", `approved item ${id} is not registered`);
  }

  // Margin notes (internal)
  margin?.notes.forEach((n, i) => {
    const w = `internal/margin-notes.json notes[${i}]`;
    claimId(n.id, w);
    const prefix = n.sectionId ?? n.topicId;
    if (!n.id.startsWith(`${prefix}.note`) || !/^\d+$/.test(n.id.slice(prefix.length + 5))) err(w, `id ${n.id} not under ${prefix}`);
    text(`${w}.text`, n.text, ["fa"], { allowed: ["fa", "en"] });
    for (const r of n.refs) {
      if (!TOPIC_ID.test(r)) err(w, `ref ${r} is not a topic id`);
      else if (opts.knownTopicIds && !opts.knownTopicIds.has(r)) err(w, `ref ${r} does not exist in the booklet`);
    }
    if (n.visibility === "public") {
      if (n.review.status !== "approved") err(w, "a public margin note must be individually approved");
      if (n.confidentialityHits.length) err(w, `a note with confidentiality hits (${n.confidentialityHits.join(", ")}) can never be public`);
    }
    pages(w, n.source);
    review(w, n.review);
  });

  // Correction notes live next to the text: each must still find its target text (otherwise it's stale).
  const correctionCount = { total: 0, byKind: new Map<string, number>() };
  const checkCorrection = (where: string, c: CorrectionNote, target: unknown) => {
    correctionCount.total++;
    correctionCount.byKind.set(c.kind, (correctionCount.byKind.get(c.kind) ?? 0) + 1);
    if (typeof target !== "string") err(where, `${c.id}: path ${c.path} is not a text field`);
    else if (!target.includes(c.find)) err(where, `${c.id}: "${c.find}" no longer occurs in ${c.path} (stale correction)`);
  };
  const byId = new Map(topics.map((t) => [t.id, t]));
  for (const [topicId, entry] of Object.entries(opts.ledger?.topics ?? {})) {
    const t = byId.get(topicId);
    for (const c of entry.corrections ?? []) {
      if (!t) err(`review-ledger.json ${topicId}`, "topic file missing");
      else checkCorrection(`review-ledger.json ${topicId}`, c, valueAt(t, c.path));
    }
  }
  for (const c of opts.ledger?.marginNoteCorrections ?? []) {
    const note = margin?.notes.find((n) => c.path.startsWith(`${n.id}.`));
    checkCorrection("review-ledger.json marginNoteCorrections", c, note ? valueAt(note, c.path.slice(note.id.length + 1)) : undefined);
  }

  // Confidentiality rule over EVERY string of every public file.
  const publicFiles: Array<[string, unknown]> = [
    ["themes.json", themes],
    ["terms.json", terms],
    ["examiner-lines.json", examiner],
    ["answer-translations.json", translations],
    ["topic-links.json", links],
    ["published-ids.json", published],
    ...topics.map((t): [string, unknown] => [`topics/${t.id}.json`, t]),
  ];
  for (const [name, value] of publicFiles) {
    for (const h of scanForConfidentiality(value)) err(`${name} ${h.path}`, `confidentiality rule: mentions ${h.hits.join(", ")} (exam material after May–June 2024 is confidential)`);
  }

  // Coverage report
  const tally = (xs: string[]) =>
    [...xs.reduce((acc, x) => acc.set(x, (acc.get(x) ?? 0) + 1), new Map<string, number>())]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([k, v]) => `${k} ${v}`)
      .join(", ") || "–";
  const checks = topics.flatMap((t) => [...t.situations, t.general].flatMap((s) => [s.question.siriCheck, ...s.followups.map((f) => f.siriCheck)]));
  const report = [
    `topics: ${topics.length}; themes: ${themeIds.size}; terms: ${termById.size}; ids: ${ids.size}`,
    `by status: ${tally(topics.map((t) => t.review.status))}`,
    `by theme: ${tally(topics.map((t) => t.themeId))}`,
    `by term: ${tally(topics.map((t) => t.termId))}`,
    `by format era: ${tally(topics.map((t) => eraOf(t.termId)))}`,
    `SIRI wording checks (questions + follow-ups): ${tally(checks.map((c) => c.status))}`,
    `situation intros (origin status): ${tally(introOrigins)}`,
    `spoken overrides ("Hvorfor eller hvorfor ikke?"): ${spokenCount}`,
    `answer translations: ${answerTexts.size} total, ${translated} translated, ${approved} approved, ${stale} stale, ${answerTexts.size - translated} missing`,
    `examiner lines: ${examiner?.lines.map((l) => `${l.id} (${l.origin}, ${l.review.status})`).join("; ") ?? "–"}`,
    `topic links: ${links?.links.length ?? 0} links, ${links?.similarGroups.length ?? 0} similar-question groups`,
    `published ids: ${published?.ids.length ?? 0} (retired ${published?.retired.length ?? 0})`,
    `correction notes (alongside, never applied): ${correctionCount.total} (${tally([...correctionCount.byKind].flatMap(([k, v]) => Array<string>(v).fill(k)))})`,
    `margin notes (internal): ${margin?.notes.length ?? 0}; public: ${margin?.notes.filter((n) => n.visibility === "public").length ?? 0}; with confidentiality hits: ${margin?.notes.filter((n) => n.confidentialityHits.length).map((n) => n.id).join(", ") || "none"}`,
  ];
  return { errors, warnings, report, topics };
}
