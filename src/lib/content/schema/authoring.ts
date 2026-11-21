/**
 * Authoring schema for the PUBLIC content files in content/ (ADR-0002 §1, ADR-0003).
 * Types are inferred with z.infer; scripts/content and the read-model build share them.
 *
 * Pipeline-only files (margin notes, review ledger, SIRI transcriptions) have their schema in
 * scripts/content/lib/pipeline-schema.ts, so nothing on the app's import path describes them.
 *
 * Zod validates; it never writes. The pipeline serialises its own objects in schema order (ADR-0003).
 */
import { z } from "zod";

export const SCHEMA_VERSION = 0 as const;
const schemaVersion = z.literal(SCHEMA_VERSION);

/** Locale-keyed text. Required locales are enforced per field by content:validate (see schema-proposal §4). */
export const LocalizedTextSchema = z.strictObject({ da: z.string().optional(), fa: z.string().optional(), en: z.string().optional() });
export const ProvenanceSchema = z.strictObject({ pages: z.array(z.number().int()) });
/** A document other than the booklet, by registry key (scripts/content/data/siri-*.json). */
export const ExternalSourceSchema = z.strictObject({ document: z.string(), pages: z.array(z.number().int()) });
export const ReviewStatusSchema = z.enum(["extracted", "needs-review", "reviewed", "approved"]);
export const ReviewNoteSchema = z.strictObject({ path: z.string().optional(), pages: z.array(z.number().int()).optional(), text: z.string() });
export const ReviewSchema = z.strictObject({
  status: ReviewStatusSchema,
  notes: z.array(ReviewNoteSchema).optional(),
  /** Who approved: a person, or "delegated-agent-review" when the owner delegated the review. */
  reviewedBy: z.string().optional(),
  reviewedOn: z.string().optional(),
});
/** Half-open [start, end) range of UTF-16 code units (JS slice semantics). */
export const TextRangeSchema = z.strictObject({ start: z.number().int(), end: z.number().int() });
export const LetterSchema = z.enum(["A", "B", "C"]);
export const SessionSchema = z.enum(["maj", "nov"]);
export const SectionKindSchema = z.enum(["sitA", "sitB", "general"]);

/** SIRI wording check. The booklet text is never overwritten; SIRI's wording is kept alongside. */
export const SiriCheckSchema = z.strictObject({
  status: z.enum(["unchecked", "matches", "differs"]),
  sourceRef: ExternalSourceSchema.optional(),
  checkedOn: z.string().optional(),
  siriParts: z.array(z.string()).optional(),
  /**
   * What the UI shows as the source of SIRI's wording (exam review 2026-11-21, S5): the document's
   * title, whether it comes from SIRI itself or from a third-party copy, and a note in plain words.
   * Pages are in `sourceRef.pages`. The UI renders it through i18n messages.
   */
  sourceDisplay: z
    .strictObject({ title: z.string(), availability: z.enum(["official", "third-party-copy"]), note: z.string() })
    .optional(),
});

/**
 * What the examiner voice says instead of the displayed text (origin "app"). `parts` are played in
 * order with `pauseMs` between them; part 1 is always a verbatim prefix of the displayed text.
 * Used for follow-ups ending "Hvorfor?/Hvorfor ikke?" (exam review 2026-11-20, S2).
 */
export const SpokenOverrideSchema = z.strictObject({
  parts: z.array(z.string()),
  pauseMs: z.number().int(),
  origin: z.literal("app"),
  basis: z.string(),
});

export const KeywordSchema = z.strictObject({ id: z.string(), emoji: z.string(), text: LocalizedTextSchema });
export const ModelAnswerSchema = z.strictObject({ id: z.string(), text: LocalizedTextSchema, emphasis: z.array(TextRangeSchema) });
export const RequiredQuestionSchema = z.strictObject({
  id: z.string(),
  text: LocalizedTextSchema,
  siriCheck: SiriCheckSchema,
  keywords: z.array(KeywordSchema),
  modelAnswer: ModelAnswerSchema,
});
export const FollowupSchema = z.strictObject({
  id: z.string(),
  text: LocalizedTextSchema,
  siriCheck: SiriCheckSchema,
  spoken: SpokenOverrideSchema.optional(),
  answer: z.strictObject({ id: z.string(), text: LocalizedTextSchema }),
});
export const PersonalExampleSchema = z.strictObject({ id: z.string(), label: LocalizedTextSchema, text: LocalizedTextSchema });
export const SituationIntroSchema = z.strictObject({
  id: z.string(),
  text: LocalizedTextSchema,
  origin: z.enum(["siri", "app"]),
  sourceRef: ExternalSourceSchema.optional(),
  review: ReviewSchema,
});

const sectionShape = {
  id: z.string(),
  question: RequiredQuestionSchema,
  followups: z.array(FollowupSchema),
  personalExamples: z.array(PersonalExampleSchema),
  source: ProvenanceSchema,
};
export const QuestionSectionSchema = z.strictObject(sectionShape);
export const SituationSchema = z.strictObject({
  id: z.string(),
  key: z.enum(["A", "B"]),
  title: LocalizedTextSchema,
  intro: SituationIntroSchema.optional(),
  question: RequiredQuestionSchema,
  followups: z.array(FollowupSchema),
  personalExamples: z.array(PersonalExampleSchema),
  source: ProvenanceSchema,
});

export const TopicFileSchema = z.strictObject({
  schemaVersion,
  id: z.string(),
  termId: z.string(),
  letter: LetterSchema,
  themeId: z.string(),
  subthemeId: z.string().optional(),
  title: LocalizedTextSchema,
  situations: z.array(SituationSchema),
  general: QuestionSectionSchema,
  source: ProvenanceSchema,
  review: ReviewSchema,
});

export const ThemesFileSchema = z.strictObject({
  schemaVersion,
  themes: z.array(
    z.strictObject({
      id: z.string(),
      chapter: z.number().int(),
      emoji: z.string(),
      title: LocalizedTextSchema,
      subthemes: z.array(z.strictObject({ id: z.string(), title: LocalizedTextSchema, source: ProvenanceSchema })),
      source: ProvenanceSchema,
      review: ReviewSchema,
    }),
  ),
});

export const FormatEraSchema = z.strictObject({ id: z.string(), fromTermId: z.string().optional(), toTermId: z.string().optional(), basis: z.string() });
export const TermsFileSchema = z.strictObject({
  schemaVersion,
  formatEras: z.array(FormatEraSchema),
  terms: z.array(
    z.strictObject({ id: z.string(), year: z.number().int(), session: SessionSchema, formatEraId: z.string(), topicIds: z.array(z.string()) }),
  ),
});

export const ExaminerLineSchema = z.strictObject({
  id: z.string(),
  role: z.enum(["sound-check", "intro", "transition", "between-answers", "closing"]),
  text: LocalizedTextSchema,
  placeholders: z.array(z.string()),
  origin: z.enum(["siri", "app"]),
  sourceRef: ExternalSourceSchema.optional(),
  review: ReviewSchema,
});
export const ExaminerLinesFileSchema = z.strictObject({ schemaVersion, lines: z.array(ExaminerLineSchema) });

/**
 * Structured links between topics (D-21 / DL-057): IDs and sections only, never booklet text.
 * `similarGroups` come from the booklet's similar-questions table; `links` from its 🔁/🔗 notes.
 */
export const TopicRefSchema = z.strictObject({ topicId: z.string(), section: SectionKindSchema.nullable() });
export const TopicLinksFileSchema = z.strictObject({
  schemaVersion,
  similarGroups: z.array(z.strictObject({ id: z.string(), members: z.array(TopicRefSchema) })),
  links: z.array(z.strictObject({ from: TopicRefSchema, to: TopicRefSchema, kind: z.enum(["similar", "related"]) })),
});

/** Append-only register of every ID ever published (ADR-0002 §1). */
export const PublishedIdsFileSchema = z.strictObject({
  schemaVersion,
  ids: z.array(z.string()),
  retired: z.array(z.strictObject({ id: z.string(), retiredOn: z.string(), reason: z.string() })),
});

export type LocalizedText = z.infer<typeof LocalizedTextSchema>;
export type Provenance = z.infer<typeof ProvenanceSchema>;
export type ExternalSource = z.infer<typeof ExternalSourceSchema>;
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;
export type ReviewNote = z.infer<typeof ReviewNoteSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type TextRange = z.infer<typeof TextRangeSchema>;
export type Letter = z.infer<typeof LetterSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type SectionKind = z.infer<typeof SectionKindSchema>;
export type SiriCheck = z.infer<typeof SiriCheckSchema>;
export type SpokenOverride = z.infer<typeof SpokenOverrideSchema>;
export type Keyword = z.infer<typeof KeywordSchema>;
export type RequiredQuestion = z.infer<typeof RequiredQuestionSchema>;
export type Followup = z.infer<typeof FollowupSchema>;
export type PersonalExample = z.infer<typeof PersonalExampleSchema>;
export type SituationIntro = z.infer<typeof SituationIntroSchema>;
export type QuestionSection = z.infer<typeof QuestionSectionSchema>;
export type Situation = z.infer<typeof SituationSchema>;
export type TopicFile = z.infer<typeof TopicFileSchema>;
export type ThemesFile = z.infer<typeof ThemesFileSchema>;
export type Theme = ThemesFile["themes"][number];
export type FormatEra = z.infer<typeof FormatEraSchema>;
export type TermsFile = z.infer<typeof TermsFileSchema>;
export type Term = TermsFile["terms"][number];
export type ExaminerLine = z.infer<typeof ExaminerLineSchema>;
export type ExaminerLinesFile = z.infer<typeof ExaminerLinesFileSchema>;
export type TopicRef = z.infer<typeof TopicRefSchema>;
export type TopicLinksFile = z.infer<typeof TopicLinksFileSchema>;
export type PublishedIdsFile = z.infer<typeof PublishedIdsFileSchema>;
export type TopicId = string;
export type TermId = string;
export type ThemeId = string;
