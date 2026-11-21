/** Public, versioned contract shared by content:build and the repository (ADR-0002). */
import { z } from "zod";

// Strict CSP forbids eval. Zod v4 otherwise probes `Function("")` on first parse, which the browser
// reports as a CSP violation even though Zod catches it. jitless skips the probe (global, idempotent).
z.config({ jitless: true });
import { wordTimingSchema } from "../../audio/manifest-schema";

const id = z.string().min(1);
const text = z.string().min(1);
const count = z.number().int().nonnegative();
const termId = z.string().regex(/^\d{4}-(maj|nov)$/);
const topicId = z.string().regex(/^\d{4}-(maj|nov)-[abc]$/);
const origin = z.enum(["siri", "app"]);

export const BilingualTextSchema = z.strictObject({ da: text, fa: text });
export const DanishTextSchema = z.strictObject({ da: text });
export const PersianTextSchema = z.strictObject({ fa: text });
export const SectionKindSchema = z.enum(["sitA", "sitB", "general"]);
export const TextRangeSchema = z
  .strictObject({ start: count, end: count })
  .refine(({ start, end }) => start < end);

export const AudioRefSchema = z.strictObject({
  url: text,
  durationMs: count,
  words: z.array(wordTimingSchema).optional(),
});

export const OfficialSourceUrlSchema = z.url({ protocol: /^https$/ });
const sourceDisplayFields = { title: text, pages: z.array(z.number().int().positive()).min(1) };
const verificationSource = z.discriminatedUnion("availability", [
  z.strictObject({
    ...sourceDisplayFields,
    availability: z.literal("official"),
    url: OfficialSourceUrlSchema,
  }),
  z.strictObject({
    ...sourceDisplayFields,
    availability: z.literal("third-party-copy"),
    note: text,
  }),
]);
const verified = { sourceTermId: termId, checkedOn: z.iso.date() };

export const VerificationSchema = z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("unchecked") }),
  z.strictObject({ status: z.literal("matches"), ...verified, sourceDisplay: verificationSource.optional() }),
  z.strictObject({
    status: z.literal("differs"),
    ...verified,
    sourceDisplay: verificationSource,
    alternative: DanishTextSchema,
  }),
]);

export const IntroSourceLabelSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("app") }),
  z.strictObject({ kind: z.literal("siri"), termId }),
]);

const DanishItemSchema = z.strictObject({ id, text: DanishTextSchema, audio: AudioRefSchema.optional() });
const BilingualItemSchema = z.strictObject({
  id,
  text: BilingualTextSchema,
  audio: AudioRefSchema.optional(),
});
export const SituationIntroSchema = DanishItemSchema.extend({ origin, sourceLabel: IntroSourceLabelSchema });
export const KeywordSchema = BilingualItemSchema.extend({ emoji: text });
export const AnswerSchema = DanishItemSchema.extend({ emphasis: z.array(TextRangeSchema) });
export const PersonalExampleSchema = DanishItemSchema.extend({
  label: PersianTextSchema,
  perspective: z.literal("nurse"),
});
export const FollowupSchema = BilingualItemSchema.extend({
  verification: VerificationSchema,
  answer: AnswerSchema,
});
export const QuestionSchema = BilingualItemSchema.extend({
  verification: VerificationSchema,
  keywords: z.array(KeywordSchema),
  modelAnswer: AnswerSchema,
});

export const QuestionSectionSchema = z.strictObject({
  id,
  question: QuestionSchema,
  followups: z.array(FollowupSchema),
  personalExamples: z.array(PersonalExampleSchema),
});

export const SituationSchema = QuestionSectionSchema.extend({
  key: z.enum(["A", "B"]),
  title: BilingualTextSchema,
  intro: SituationIntroSchema.optional(),
});

export const TermSchema = z.strictObject({
  id: termId,
  year: z.number().int(),
  session: z.enum(["maj", "nov"]),
});

export const TermSummarySchema = TermSchema.extend({ formatEraId: id, topicIds: z.array(topicId) });
export const ThemeSchema = z.strictObject({
  id,
  chapter: z.number().int(),
  emoji: text,
  title: BilingualTextSchema,
  subthemes: z.array(z.strictObject({ id, title: BilingualTextSchema })),
});
export const ThemeSummarySchema = ThemeSchema.omit({ subthemes: true }).extend({ topicCount: count });

const topicRef = z.strictObject({ topicId, section: SectionKindSchema.nullable() });
export const SimilarGroupSchema = z.strictObject({ id, members: z.array(topicRef).min(1) });
export const TopicLinkSchema = z.strictObject({
  fromSection: SectionKindSchema.nullable(),
  toTopicId: topicId,
  toSection: SectionKindSchema.nullable(),
  kind: z.enum(["similar", "related"]),
});

export const ExaminerLineSchema = DanishItemSchema.extend({
  role: z.enum(["sound-check", "intro", "transition", "between-answers", "closing"]),
  placeholders: z.array(z.literal("topic")).max(1),
  origin,
});
export const ExaminerLinesSchema = z.array(ExaminerLineSchema);
const TopicExaminerAudioSchema = z.array(z.strictObject({ lineId: id, audio: AudioRefSchema }));

export const TopicSummarySchema = z.strictObject({
  id: topicId,
  termId,
  term: TermSchema.omit({ id: true }),
  letter: z.enum(["A", "B", "C"]),
  themeId: id,
  subthemeId: id.optional(),
  title: BilingualTextSchema,
  formatEraId: id,
  draft: z.literal(true).optional(),
});

export const TopicSchema = TopicSummarySchema.extend({
  sourcePages: z.array(z.number().int().positive()),
  situations: z.tuple([SituationSchema, SituationSchema]).refine(([a, b]) => a.key === "A" && b.key === "B"),
  general: QuestionSectionSchema,
  links: z.array(TopicLinkSchema),
  examinerAudio: TopicExaminerAudioSchema,
});

const MockSectionSchema = z.strictObject({
  id,
  question: QuestionSchema.omit({ modelAnswer: true }),
  followups: z.array(FollowupSchema.omit({ answer: true })),
});
const MockSituationSchema = MockSectionSchema.extend({
  key: z.enum(["A", "B"]),
  title: BilingualTextSchema,
  intro: SituationIntroSchema,
});
const MockTopicSchema = TopicSummarySchema.extend({
  situations: z.tuple([MockSituationSchema, MockSituationSchema]),
  general: MockSectionSchema,
  examinerAudio: TopicExaminerAudioSchema,
});
export const MockDeckSchema = z.strictObject({
  terms: z.array(TermSummarySchema),
  topics: z.array(MockTopicSchema),
  examinerLines: ExaminerLinesSchema,
});

export const SearchDocumentSchema = z.strictObject({
  topicId,
  fields: z.array(
    z.strictObject({
      section: SectionKindSchema.nullable(),
      kind: z.enum(["topic-title", "situation-title", "question", "followup", "keyword"]),
      text: BilingualTextSchema,
    }),
  ),
});

export const ContentItemSchema = z.strictObject({
  id,
  topicId,
  section: SectionKindSchema,
  kind: z.enum([
    "intro",
    "question",
    "followup",
    "keyword",
    "model-answer",
    "followup-answer",
    "personal-example",
  ]),
  text: DanishTextSchema.extend({ fa: text.optional() }),
  audio: AudioRefSchema.optional(),
});

export const ReadModelSchema = z.strictObject({
  readModelVersion: z.literal(1),
  channel: z.enum(["preview", "production"]),
  themes: z.array(ThemeSchema),
  terms: z.array(TermSummarySchema),
  topics: z.array(TopicSchema),
  examinerLines: ExaminerLinesSchema,
  similarGroups: z.array(SimilarGroupSchema),
  searchIndex: z.array(SearchDocumentSchema),
});

export type ReadModel = z.infer<typeof ReadModelSchema>;
export type Topic = z.infer<typeof TopicSchema>;
export type TopicSummary = z.infer<typeof TopicSummarySchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type ThemeSummary = z.infer<typeof ThemeSummarySchema>;
export type TermSummary = z.infer<typeof TermSummarySchema>;
export type ExaminerLines = z.infer<typeof ExaminerLinesSchema>;
export type TopicLink = z.infer<typeof TopicLinkSchema>;
export type SimilarGroup = z.infer<typeof SimilarGroupSchema>;
export type SearchDocument = z.infer<typeof SearchDocumentSchema>;
export type MockDeck = z.infer<typeof MockDeckSchema>;
export type ContentItem = z.infer<typeof ContentItemSchema>;
export type TopicId = Topic["id"];
export type ThemeId = Theme["id"];
export type TermId = TermSummary["id"];
export type ContentItemId = ContentItem["id"];
export type AudioRef = z.infer<typeof AudioRefSchema>;
export type Verification = z.infer<typeof VerificationSchema>;
export type QuestionSection = z.infer<typeof QuestionSectionSchema>;
