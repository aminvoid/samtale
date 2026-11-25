/**
 * Structure stage: parsed blocks (+ SIRI transcriptions + app-authored inputs) → content objects.
 *
 * Normalisation applied to every string: NFC + whitespace collapse/trim (see docs/content/pipeline.md).
 * Structural markup is removed, never text: the enclosing “…” of questions, <strong>/<span> tags,
 * the note marker emoji (kept as `kind`) and the "🎯 label:" prefix of personal examples (kept as `label`).
 * Objects are built in schema key order; ADR-0003: Zod validates, the pipeline writes.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { normalizeText, parseStrongRuns, slugDa, termIdOf, topicIdOf, type SourceLine } from "./source.ts";
import { contentPages, pagesOf, type NoteMarker, type PNote, type PSection, type PTopic } from "./topic-parser.ts";
import type { PChapter } from "./themes.ts";
import { confidentialityHits } from "./confidentiality.ts";
import {
  SCHEMA_VERSION,
  type ExaminerLine,
  type ExaminerLinesFile,
  type Followup,
  type FormatEra,
  type Keyword,
  type QuestionSection,
  type ReviewNote,
  type SectionKind,
  type SiriCheck,
  type Situation,
  type SituationIntro,
  type SpokenOverride,
  type Term,
  type TermsFile,
  type ThemesFile,
  type TopicFile,
  type TopicLinksFile,
  type TopicRef,
} from "@/lib/content/schema/authoring";
import type { AppAuthored, ItemDecision, MarginNote, NoteKind, SiriItem, SiriTopic, SiriTranscription } from "./pipeline-schema.ts";

/** Field path → source line, for the review pages and line-anchored fidelity checks. Kept in .cache only. */
export type ProvenanceMap = Record<string, { line: number; page: number }>;

export const NOTE_KIND: Record<NoteMarker, NoteKind> = {
  "🔁": "recurring",
  "🔗": "related",
  "📌": "tip",
  "⭐": "highlight",
  "🩺": "nursing",
};

const TOPIC_REF = /(Maj-Juni|Nov-Dec) (\d{4}) ([ABC])(?![\p{L}\p{N}])/gu;

/** Topic IDs named explicitly as "<Maj-Juni|Nov-Dec> <yyyy> <A|B|C>" in a note. Order of first mention, unique. */
export function refsInNote(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(TOPIC_REF)) {
    const letter = m[3] === "A" ? "A" : m[3] === "B" ? "B" : "C";
    const id = topicIdOf(Number(m[2]), m[1] === "Maj-Juni" ? "maj" : "nov", letter);
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

export interface BuildOptions {
  themeId: string;
  subthemeId?: string;
  /** SIRI transcription for this topic's term, if one exists. */
  siri?: SiriTranscription;
  app: AppAuthored;
  /** Ledger decisions on intros, by intro id. */
  introDecisions?: Record<string, ItemDecision>;
}

export interface BuiltTopic {
  topic: TopicFile;
  marginNotes: MarginNote[];
  prov: ProvenanceMap;
  /** Review notes raised by the pipeline itself (e.g. SIRI wording differs). */
  pipelineNotes: ReviewNote[];
}

function siriItemFor(t: SiriTopic | undefined, kind: SectionKind, key: "q" | "followup1" | "intro"): SiriItem | undefined {
  if (!t) return undefined;
  if (kind === "general") return key === "q" ? t.general.q2 : key === "followup1" ? t.general.followup1 : undefined;
  const s = kind === "sitA" ? t.sitA : t.sitB;
  return key === "q" ? s.q1 : key === "followup1" ? s.followup1 : s.intro;
}

function siriCheckOf(bookletDa: string, item: SiriItem | undefined, siri: SiriTranscription | undefined): SiriCheck {
  if (!item || !siri) return { status: "unchecked" };
  const parts = item.parts.map(normalizeText);
  return {
    status: parts.join(" ") === bookletDa ? "matches" : "differs",
    sourceRef: { document: siri.id, pages: [item.page] },
    checkedOn: siri.checkedOn,
    siriParts: parts,
    sourceDisplay: {
      title: siri.document.title,
      availability: siri.document.authenticity === "official" ? "official" : "third-party-copy",
      note: siri.document.availabilityNote,
    },
  };
}

/** The examiner-voice override for a follow-up ending "Hvorfor?/Hvorfor ikke?" (or a variant), if any. */
export function spokenOverrideFor(da: string, app: AppAuthored): SpokenOverride | undefined {
  const o = app.spokenOverrides;
  const ending = o.endings.find((e) => da.endsWith(` ${e}`));
  if (ending === undefined) return undefined;
  return {
    parts: [da.slice(0, da.length - ending.length - 1), o.replacement],
    pauseMs: o.pauseMs,
    origin: "app",
    basis: `Displayed text ends "${ending}"; the examiner voice says the question, pauses, then "${o.replacement}" (exam review 2026-11-20, S2).`,
  };
}

export function decided(review: SituationIntro["review"], d: ItemDecision | undefined): SituationIntro["review"] {
  if (!d) return review;
  return {
    status: d.status,
    ...(d.notes?.length ? { notes: d.notes } : {}),
    ...(d.reviewedBy ? { reviewedBy: d.reviewedBy } : {}),
    ...(d.reviewedOn ? { reviewedOn: d.reviewedOn } : {}),
  };
}

export function buildTopic(t: PTopic, opts: BuildOptions): BuiltTopic {
  const id = topicIdOf(t.year, t.session, t.letter);
  const prov: ProvenanceMap = {};
  const at = (path: string, line: SourceLine) => {
    prov[path] = { line: line.n, page: line.page };
  };
  const n = normalizeText;
  const siriTopic = opts.siri?.topics[id];
  const pipelineNotes: ReviewNote[] = [];
  const marginNotes: MarginNote[] = [];
  const siriLabel = opts.siri ? `${opts.siri.id}${opts.siri.document.authenticity === "official" ? "" : " (authenticity unconfirmed)"}` : "";

  if (siriTopic && siriTopic.title !== n(t.titleDa.value)) {
    pipelineNotes.push({ path: "title.da", text: `SIRI's topic name is "${siriTopic.title}"; the booklet prints "${n(t.titleDa.value)}".` });
  }
  at("title", t.titleDa.line);
  at("title.fa", t.titleFa.line);
  at("term", t.termLine);

  const sectionOf = (kind: PSection["kind"]) => {
    const s = t.sections.find((x) => x.kind === kind);
    if (!s) throw new Error(`${t.anchor}: missing section ${kind}`);
    return s;
  };

  const noteRecord = (nt: PNote, noteId: string, sectionId?: string): MarginNote => {
    const text = n(nt.text);
    return {
      id: noteId,
      topicId: id,
      ...(sectionId ? { sectionId } : {}),
      kind: NOTE_KIND[nt.marker],
      text: { fa: text },
      refs: refsInNote(text),
      confidentialityHits: confidentialityHits(text),
      visibility: "internal",
      source: { pages: [nt.line.page] },
      review: { status: "extracted" },
    };
  };

  const buildSection = (s: PSection, path: string): QuestionSection => {
    const secId = `${id}.${s.kind}`;
    const qId = `${secId}.${s.kind === "general" ? "q2" : "q1"}`;
    at(`${path}.question.text.da`, s.question.line);
    at(`${path}.question.text.fa`, s.translation.line);
    at(`${path}.question.modelAnswer`, s.answer.line);
    const keywords: Keyword[] = s.keywords.map((k, i) => {
      at(`${path}.question.keywords[${i}]`, k.line);
      return { id: `${qId}.kw${i + 1}`, emoji: k.emoji, text: { da: n(k.da), fa: n(k.fa) } };
    });
    const answer = parseStrongRuns(n(s.answer.value));
    const qDa = n(s.question.value);
    const qItem = siriItemFor(siriTopic, s.kind, "q");
    const qCheck = siriCheckOf(qDa, qItem, opts.siri);
    if (qCheck.status === "differs" && qItem) {
      pipelineNotes.push({ path: `${path}.question.text.da`, pages: [s.question.line.page], text: `Booklet wording differs from SIRI (${siriLabel} p. ${qItem.page}). SIRI: "${qItem.parts.map(n).join(" ")}"` });
    }
    const followups: Followup[] = s.followups.map((f, i) => {
      at(`${path}.followups[${i}].text.da`, f.question.line);
      at(`${path}.followups[${i}].text.fa`, f.translation.line);
      at(`${path}.followups[${i}].answer`, f.answer.line);
      const fId = `${secId}.followup${i + 1}`;
      const fDa = n(f.question.value);
      const fItem = i === 0 ? siriItemFor(siriTopic, s.kind, "followup1") : undefined;
      const fCheck = siriCheckOf(fDa, fItem, opts.siri);
      if (fCheck.status === "differs" && fItem) {
        pipelineNotes.push({ path: `${path}.followups[${i}].text.da`, pages: [f.question.line.page], text: `Booklet wording differs from SIRI (${siriLabel} p. ${fItem.page}). SIRI: "${fItem.parts.map(n).join(" ")}"` });
      }
      const spoken = spokenOverrideFor(fDa, opts.app);
      return {
        id: fId,
        text: { da: fDa, fa: n(f.translation.value) },
        siriCheck: fCheck,
        ...(spoken ? { spoken } : {}),
        answer: { id: `${fId}.answer`, text: { da: n(f.answer.value) } },
      };
    });
    const personalExamples = s.examples.map((e, i) => {
      at(`${path}.personalExamples[${i}]`, e.line);
      return { id: `${secId}.example${i + 1}`, label: { fa: n(e.label) }, text: { da: n(e.da) } };
    });
    s.notes.forEach((nt, i) => {
      at(`marginNotes:${secId}.note${i + 1}`, nt.line);
      marginNotes.push(noteRecord(nt, `${secId}.note${i + 1}`, secId));
    });
    return {
      id: secId,
      question: { id: qId, text: { da: qDa, fa: n(s.translation.value) }, siriCheck: qCheck, keywords, modelAnswer: { id: `${qId}.answer`, text: { da: answer.text }, emphasis: answer.ranges } },
      followups,
      personalExamples,
      source: { pages: pagesOf(s.lines) },
    };
  };

  t.notes.forEach((nt, i) => {
    at(`marginNotes:${id}.note${i + 1}`, nt.line);
    marginNotes.push(noteRecord(nt, `${id}.note${i + 1}`));
  });

  const introFor = (secId: string, kind: SectionKind): SituationIntro | undefined => {
    const introId = `${secId}.intro`;
    const siriIntro = siriItemFor(siriTopic, kind, "intro");
    if (siriIntro && opts.siri) {
      return {
        id: introId,
        text: { da: siriIntro.parts.map(n).join(" ") },
        origin: "siri",
        sourceRef: { document: opts.siri.id, pages: [siriIntro.page] },
        review: decided({ status: "extracted" }, opts.introDecisions?.[introId]),
      };
    }
    const appText = opts.app.intros.texts[secId];
    if (appText === undefined) return undefined;
    return {
      id: introId,
      text: { da: n(appText) },
      origin: "app",
      review: decided(
        { status: "needs-review", notes: [{ text: "Written for the app from the booklet's situation title (DL-045). Needs danish-language-reviewer and pd3-exam-expert." }] },
        opts.introDecisions?.[introId],
      ),
    };
  };

  const situations: Situation[] = t.situations.map((sit, i) => {
    const kind: SectionKind = sit.key === "A" ? "sitA" : "sitB";
    const s = sectionOf(kind);
    const path = `situations[${i}]`;
    at(`${path}.title`, sit.line);
    const body = buildSection(s, path);
    const intro = introFor(body.id, kind);
    return {
      id: body.id,
      key: sit.key,
      title: { da: n(sit.da), fa: n(sit.fa) },
      ...(intro ? { intro } : {}),
      question: body.question,
      followups: body.followups,
      personalExamples: body.personalExamples,
      source: { pages: pagesOf([sit.line, ...s.lines]) },
    };
  });
  const general = buildSection(sectionOf("general"), "general");

  const topic: TopicFile = {
    schemaVersion: SCHEMA_VERSION,
    id,
    termId: termIdOf(t.year, t.session),
    letter: t.letter,
    themeId: opts.themeId,
    ...(opts.subthemeId ? { subthemeId: opts.subthemeId } : {}),
    title: { da: n(t.titleDa.value), fa: n(t.titleFa.value) },
    situations,
    general,
    source: { pages: contentPages(t.lines) },
    review: pipelineNotes.length ? { status: "needs-review", notes: pipelineNotes } : { status: "extracted" },
  };
  return { topic, marginNotes, prov, pipelineNotes };
}

export function subthemeIdOf(themeId: string, da: string): string {
  return `${themeId}.${slugDa(da)}`;
}

export function buildThemes(chapters: PChapter[]): ThemesFile {
  return {
    schemaVersion: SCHEMA_VERSION,
    themes: chapters.map((ch) => ({
      id: ch.themeId,
      chapter: ch.chapter,
      emoji: ch.emoji,
      title: { da: normalizeText(ch.titleDa), fa: normalizeText(ch.titleFa) },
      subthemes: ch.subgroups.map((g) => ({
        id: subthemeIdOf(ch.themeId, g.da),
        title: { da: normalizeText(g.da), fa: normalizeText(g.fa) },
        source: { pages: [g.line.page] },
      })),
      source: { pages: pagesOf(ch.headerLines) },
      review: { status: "extracted" },
    })),
  };
}

/** SIRI's verbatim lines (from the 2024 transcription) + the app's own lines (data/app-authored.json). */
export function buildExaminerLines(siri: SiriTranscription, app: AppAuthored, decisions: Record<string, ItemDecision> = {}): ExaminerLinesFile {
  const fromSiri = (lineId: string, role: ExaminerLine["role"], key: "intro" | "closing"): ExaminerLine => {
    const src = siri.examinerLines[key];
    if (!src) throw new Error(`${siri.id}: no examiner line "${key}"`);
    const text = normalizeText(src.text);
    return {
      id: lineId,
      role,
      text: { da: text },
      placeholders: [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!),
      origin: "siri",
      sourceRef: { document: siri.id, pages: src.pages },
      review: decided({ status: "extracted" }, decisions[lineId]),
    };
  };
  const fromApp = (lineId: string): ExaminerLine => {
    const a = app.examinerLines.find((x) => x.id === lineId);
    if (!a) throw new Error(`data/app-authored.json: missing examiner line ${lineId}`);
    return {
      id: a.id,
      role: a.role,
      text: { da: normalizeText(a.text.da) },
      placeholders: [],
      origin: "app",
      review: decided({ status: "needs-review", notes: [{ text: `App-authored. ${a.rationale} Needs danish-language-reviewer and owner approval.` }] }, decisions[lineId]),
    };
  };
  return {
    schemaVersion: SCHEMA_VERSION,
    lines: [
      fromApp("examiner.soundCheck"),
      fromSiri("examiner.intro", "intro", "intro"),
      fromApp("examiner.transition"),
      fromApp("examiner.thanks"),
      fromSiri("examiner.closing", "closing", "closing"),
    ],
  };
}

/** A row of the booklet's similar-questions table, as parsed by the pipeline (IDs and sections only). */
export interface SimilarRow {
  n: number;
  members: Array<{ topicId: string; section: SectionKind | null }>;
}

/**
 * content/topic-links.json (D-21 / DL-057): structure only, never booklet text.
 * Links come from 🔁/🔗 margin notes (topic level; the note's own wording is not kept),
 * groups from the similar-questions table. Topics outside `mainIds` (the appendix) are dropped.
 */
export function buildTopicLinks(notes: MarginNote[], rows: SimilarRow[], mainIds: Set<string>): TopicLinksFile {
  const ref = (topicId: string, section: SectionKind | null): TopicRef => ({ topicId, section });
  const links: TopicLinksFile["links"] = [];
  const seen = new Set<string>();
  for (const note of notes) {
    if (note.kind !== "recurring" && note.kind !== "related") continue;
    for (const to of note.refs) {
      if (!mainIds.has(to) || to === note.topicId) continue;
      const kind = note.kind === "recurring" ? "similar" : "related";
      const key = `${note.topicId}>${to}>${kind}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ from: ref(note.topicId, null), to: ref(to, null), kind });
    }
  }
  links.sort((a, b) => {
    const ka = `${a.from.topicId}>${a.to.topicId}>${a.kind}`;
    const kb = `${b.from.topicId}>${b.to.topicId}>${b.kind}`;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  const similarGroups = rows
    .map((r) => ({ id: `similar.${r.n}`, members: r.members.filter((m) => mainIds.has(m.topicId)).map((m) => ref(m.topicId, m.section)) }))
    .filter((g) => g.members.length >= 2);
  return { schemaVersion: SCHEMA_VERSION, similarGroups, links };
}

/**
 * Format eras. The boundary (picture description removed from May–June 2023, BEK 347/2023)
 * is from docs/resources/ABOUT_PD3_MUNDTLIG.md §6 and owner decision DL-029 / D-3.
 */
export const FORMAT_ERAS: FormatEra[] = [
  {
    id: "pre-2023",
    toTermId: "2022-nov",
    basis: "ABOUT_PD3_MUNDTLIG.md §6: candidates described the pictures before the interview until BEK 347/2023 (from May–June 2023).",
  },
  {
    id: "from-2023",
    fromTermId: "2023-maj",
    basis: "ABOUT_PD3_MUNDTLIG.md §6: BEK 347/2023, interview only, two required questions.",
  },
];

export function eraOf(termId: string): string {
  for (const e of FORMAT_ERAS) {
    if ((e.fromTermId === undefined || termId >= e.fromTermId) && (e.toTermId === undefined || termId <= e.toTermId)) return e.id;
  }
  throw new Error(`no format era for term ${termId}`);
}

export function buildTerms(topics: TopicFile[]): TermsFile {
  const byTerm = new Map<string, TopicFile[]>();
  for (const t of topics) byTerm.set(t.termId, [...(byTerm.get(t.termId) ?? []), t]);
  const terms: Term[] = [...byTerm.keys()].sort().map((termId) => {
    const m = /^(\d{4})-(maj|nov)$/.exec(termId);
    if (!m) throw new Error(`bad term id ${termId}`);
    return {
      id: termId,
      year: Number(m[1]),
      session: m[2] === "maj" ? "maj" : "nov",
      formatEraId: eraOf(termId),
      topicIds: (byTerm.get(termId) ?? []).map((t) => t.id).sort(),
    };
  });
  return { schemaVersion: SCHEMA_VERSION, formatEras: FORMAT_ERAS, terms };
}

/** Canonical JSON of the topic without any `review` field (topic and intros): the basis of the ledger's contentHash. */
export function hashableTopic(topic: TopicFile): string {
  return JSON.stringify(topic, (k, v: unknown) => (k === "review" ? undefined : v));
}

/** Deterministic JSON: insertion-ordered keys (builders construct objects in schema order), 2 spaces, trailing newline. */
export function toJson(value: unknown): string {
  return `${JSON.stringify(
    value,
    (_k, v: unknown) => {
      if (v === undefined) throw new Error("undefined value in content object");
      return v;
    },
    2,
  )}\n`;
}

export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, toJson(value));
}
