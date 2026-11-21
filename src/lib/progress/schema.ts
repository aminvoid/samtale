import { z } from "zod";

export const PROGRESS_SCHEMA_VERSION = 1;

export const StableIdSchema = z
  .string()
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
const eventId = z.uuid();
const duration = z.number().nonnegative();
const count = z.int().nonnegative();
const instant = z.iso.datetime();
const version = z.literal(PROGRESS_SCHEMA_VERSION);

export const LocalDateSchema = z.iso.date();
export const ModeSchema = z.enum(["practice", "exam"]);

export const InProgressMarkerSchema = z.strictObject({
  attemptId: StableIdSchema,
  mode: ModeSchema,
  topicId: StableIdSchema,
  startedAt: duration.max(8_640_000_000_000_000),
});

export const AnswerFactsSchema = z.strictObject({
  itemId: StableIdSchema,
  answerMs: duration,
  repeats: count,
  slowRepeats: count,
  showTextUsed: z.boolean(),
  recorded: z.boolean(),
  recordingCapped: z.boolean(),
  recordingParts: count,
});

export const AttemptInputSchema = InProgressMarkerSchema.extend({
  part: z.literal(2),
  situationKey: z.enum(["A", "B"]).nullable(),
  totalMs: duration,
  status: z.enum(["completed", "interrupted", "endedEarly"]),
  askedItemIds: z.array(StableIdSchema).readonly(),
  skippedFollowups: z.array(StableIdSchema).readonly(),
  answers: z.array(AnswerFactsSchema).readonly(),
});

const FirstQuestionCheckSchema = z.enum([
  "answeredQuestion",
  "gaveReason",
  "gaveExample",
  "linkedIdeas",
  "concluded",
  "keptGoing",
]);
export const FocusItemSchema = z.enum([...FirstQuestionCheckSchema.options, "coveredBothSides"]);

export const SelfCheckTicksSchema = z.strictObject({
  first: z.partialRecord(FirstQuestionCheckSchema, z.boolean()),
  general: z.partialRecord(FocusItemSchema, z.boolean()),
});

export const AttemptRecordSchema = AttemptInputSchema.extend({
  selfCheck: SelfCheckTicksSchema.optional(),
  focusNextTime: FocusItemSchema.nullable(),
  kept: z.boolean(),
});

export const AttemptSummarySchema = AttemptRecordSchema.pick({
  attemptId: true,
  topicId: true,
  mode: true,
  situationKey: true,
  startedAt: true,
  status: true,
  totalMs: true,
  focusNextTime: true,
  kept: true,
});

export const SettingsSchema = z.strictObject({
  playbackRate: z.union([z.literal(0.75), z.literal(1), z.literal(1.25)]).default(1),
  timersVisible: z.boolean().default(true),
  alwaysShowExaminerText: z.boolean().default(false),
  translationsStartShown: z.boolean().default(false),
  micExplanationSeen: z.boolean().default(false),
  micDenied: z.boolean().default(false),
  wakeLockTipPending: z.boolean().default(false),
  wakeLockTipSeen: z.boolean().default(false),
});
export const SettingsPatchSchema = z.strictObject({
  playbackRate: SettingsSchema.shape.playbackRate.unwrap().optional(),
  timersVisible: z.boolean().optional(),
  alwaysShowExaminerText: z.boolean().optional(),
  translationsStartShown: z.boolean().optional(),
  micExplanationSeen: z.boolean().optional(),
  micDenied: z.boolean().optional(),
  wakeLockTipPending: z.boolean().optional(),
  wakeLockTipSeen: z.boolean().optional(),
});

export const LastOpenedSchema = z.strictObject({
  topicId: StableIdSchema,
  openedAt: instant,
});

const envelope = { v: version, id: eventId, recordedAt: instant };
export const PracticeEventSchema = z.strictObject({
  ...envelope,
  type: z.literal("practice"),
  topicId: StableIdSchema,
  kind: z.enum(["answer-aloud", "mock", "shadowing"]),
  itemId: StableIdSchema.optional(),
  mode: ModeSchema.optional(),
  attemptId: StableIdSchema.optional(),
  localDate: LocalDateSchema,
});

export const NewPracticeEventSchema = PracticeEventSchema.omit({
  v: true,
  type: true,
  id: true,
  recordedAt: true,
  localDate: true,
}).extend({
  id: eventId.optional(),
  recordedAt: instant.optional(),
  localDate: LocalDateSchema.optional(),
});

export const AttemptSavedEventSchema = AttemptInputSchema.extend({
  ...envelope,
  type: z.literal("attempt-saved"),
  localDate: LocalDateSchema,
});

export const AttemptReviewedEventSchema = z.strictObject({
  ...envelope,
  type: z.literal("attempt-reviewed"),
  attemptId: StableIdSchema,
  selfCheck: SelfCheckTicksSchema.optional(),
  focusNextTime: FocusItemSchema.nullable().optional(),
  kept: z.boolean().optional(),
});

export const SettingsUpdatedEventSchema = z.strictObject({
  ...envelope,
  type: z.literal("settings-updated"),
  patch: SettingsPatchSchema,
});

export const LastOpenedEventSchema = z.strictObject({
  ...envelope,
  type: z.literal("last-opened"),
  ref: LastOpenedSchema,
});

export const ReviewCycleStartedEventSchema = z.strictObject({
  ...envelope,
  type: z.literal("review-cycle-started"),
  topicId: StableIdSchema,
  localDate: LocalDateSchema,
});

export const ProgressEventSchema = z.discriminatedUnion("type", [
  PracticeEventSchema,
  AttemptSavedEventSchema,
  AttemptReviewedEventSchema,
  SettingsUpdatedEventSchema,
  LastOpenedEventSchema,
  ReviewCycleStartedEventSchema,
]);

export const ProgressExportSchema = z.strictObject({
  v: version,
  events: z.array(ProgressEventSchema),
  skippedRecords: count,
});

const RecordingAnswerSchema = z.strictObject({
  itemId: StableIdSchema,
  blob: z.custom<Blob>((value) => typeof Blob !== "undefined" && value instanceof Blob),
  mimeType: z.string().regex(/^audio\/[a-z0-9.+-]+(?:;\s*codecs=[a-z0-9., "-]+)?$/i),
  durationMs: duration,
});

export const RecordingRecordSchema = z.strictObject({
  v: version,
  attemptId: StableIdSchema,
  topicId: StableIdSchema,
  answers: z.array(RecordingAnswerSchema).min(1).readonly(),
});

export const MetaRecordSchema = z.strictObject({ key: z.literal("schemaVersion"), v: version });
export const LogClockRecordSchema = z.strictObject({
  key: z.literal("lastEventTime"),
  v: version,
  recordedAt: instant,
});
export const SettingsLogEntrySchema = z.strictObject({ key: eventId, value: z.unknown() });

export type LocalDate = z.infer<typeof LocalDateSchema>;
export type InProgressMarker = z.infer<typeof InProgressMarkerSchema>;
export type AttemptInput = z.infer<typeof AttemptInputSchema>;
export type AttemptRecord = z.infer<typeof AttemptRecordSchema>;
export type AttemptSummary = z.infer<typeof AttemptSummarySchema>;
export type SelfCheckTicks = z.infer<typeof SelfCheckTicksSchema>;
export type FocusItem = z.infer<typeof FocusItemSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type SettingsPatch = z.infer<typeof SettingsPatchSchema>;
export type LastOpened = z.infer<typeof LastOpenedSchema>;
export type PracticeEvent = z.infer<typeof PracticeEventSchema>;
export type NewPracticeEvent = z.infer<typeof NewPracticeEventSchema>;
export type ProgressEvent = z.infer<typeof ProgressEventSchema>;
export type ProgressExport = z.infer<typeof ProgressExportSchema>;
export type RecordingAnswer = z.infer<typeof RecordingAnswerSchema>;
export type RecordingRecord = z.infer<typeof RecordingRecordSchema>;
