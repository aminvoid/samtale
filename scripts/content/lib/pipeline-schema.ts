/**
 * Schemas for pipeline-only files: they never reach the app (ADR-0002 §4).
 *   content/internal/margin-notes.json, content/review-ledger.json,
 *   scripts/content/data/siri-*.json, scripts/content/data/app-authored.json
 * Public content files use src/lib/content/schema/authoring.ts.
 */
import { z } from "zod";
import {
  LocalizedTextSchema,
  ProvenanceSchema,
  ReviewNoteSchema,
  ReviewSchema,
  ReviewStatusSchema,
  SCHEMA_VERSION,
} from "@/lib/content/schema/authoring";

const schemaVersion = z.literal(SCHEMA_VERSION);

/** 1:1 with the booklet's leading marker: 🔁 recurring, 🔗 related, 📌 tip, ⭐ highlight, 🩺 nursing. */
export const NoteKindSchema = z.enum(["recurring", "related", "tip", "highlight", "nursing"]);
export const MarginNoteSchema = z.strictObject({
  id: z.string(),
  topicId: z.string(),
  sectionId: z.string().optional(),
  kind: NoteKindSchema,
  text: LocalizedTextSchema,
  refs: z.array(z.string()),
  confidentialityHits: z.array(z.string()),
  visibility: z.enum(["internal", "public"]),
  source: ProvenanceSchema,
  review: ReviewSchema,
});
export const MarginNotesFileSchema = z.strictObject({ schemaVersion, notes: z.array(MarginNoteSchema) });

/**
 * A correction or naturalness note recorded NEXT TO the booklet text (never applied to it).
 * `find` must still occur in the field at `path`, so a stale note fails validation.
 */
export const CorrectionNoteSchema = z.strictObject({
  id: z.string(),
  path: z.string(),
  kind: z.enum(["translation", "naturalness", "terminology", "dari"]),
  find: z.string(),
  suggestion: z.string(),
  reason: z.string(),
  by: z.string(),
  source: z.string(),
  status: z.enum(["proposed", "accepted", "rejected"]),
});

/** A human (or delegated) review decision for one item inside a topic. */
export const ItemDecisionSchema = z.strictObject({
  status: ReviewStatusSchema,
  reviewedBy: z.string().optional(),
  reviewedOn: z.string().optional(),
  notes: z.array(ReviewNoteSchema).optional(),
});

export const LedgerTopicSchema = z.strictObject({
  status: ReviewStatusSchema,
  /** "delegated-agent-review" marks approvals made under the owner's delegation (2026-11-19). */
  reviewedBy: z.string().optional(),
  reviewedOn: z.string().optional(),
  /** Required for reviewed/approved: hash of the topic JSON without any review fields. */
  contentHash: z.string().optional(),
  notes: z.array(ReviewNoteSchema).optional(),
  intros: z.record(z.string(), ItemDecisionSchema).optional(),
  corrections: z.array(CorrectionNoteSchema).optional(),
});

export const ReviewLedgerSchema = z.strictObject({
  schemaVersion,
  topics: z.record(z.string(), LedgerTopicSchema),
  examinerLines: z.record(z.string(), ItemDecisionSchema).optional(),
  /** Correction notes on internal margin notes (by note id). */
  marginNoteCorrections: z.array(CorrectionNoteSchema).optional(),
});

export const SiriItemSchema = z.strictObject({ parts: z.array(z.string()), page: z.number().int() });
const siriSituation = z.strictObject({ intro: SiriItemSchema.optional(), q1: SiriItemSchema, followup1: SiriItemSchema });
export const SiriTopicSchema = z.strictObject({
  title: z.string(),
  sitA: siriSituation,
  sitB: siriSituation,
  general: z.strictObject({ q2: SiriItemSchema, followup1: SiriItemSchema }),
});
export const SiriTranscriptionSchema = z.strictObject({
  schemaVersion,
  id: z.string(),
  document: z.strictObject({
    title: z.string(),
    publisher: z.string(),
    url: z.string(),
    sha256: z.string(),
    retrievedOn: z.string(),
    /** "official" (SIRI's own host) or "unconfirmed" (a third-party copy). */
    authenticity: z.enum(["official", "unconfirmed"]),
    /** Plain-words note on where the copy comes from, shown with SIRI's wording. */
    availabilityNote: z.string(),
  }),
  checkedOn: z.string(),
  transcriptionRules: z.array(z.string()),
  examinerLines: z.strictObject({
    intro: z.strictObject({ text: z.string(), pages: z.array(z.number().int()) }).optional(),
    closing: z.strictObject({ text: z.string(), pages: z.array(z.number().int()) }).optional(),
  }),
  topics: z.record(z.string(), SiriTopicSchema),
});

export const AppAuthoredSchema = z.strictObject({
  schemaVersion,
  note: z.string(),
  examinerLines: z.array(
    z.strictObject({
      id: z.string(),
      role: z.enum(["sound-check", "transition", "between-answers"]),
      text: z.strictObject({ da: z.string() }),
      rationale: z.string(),
    }),
  ),
  /** One sentence per situation, written from the booklet's situation title (DL-045). Key: section id. */
  intros: z.strictObject({ rationale: z.string(), texts: z.record(z.string(), z.string()) }),
  spokenOverrides: z.strictObject({
    rationale: z.string(),
    pauseMs: z.number().int(),
    /** Follow-up endings (verbatim, as printed) that the examiner voice replaces. */
    endings: z.array(z.string()),
    replacement: z.string(),
  }),
});

/** .cache/content/provenance/<topic>.json: field path → source line and page. */
export const ProvenanceMapSchema = z.record(z.string(), z.strictObject({ line: z.number().int(), page: z.number().int() }));

export type NoteKind = z.infer<typeof NoteKindSchema>;
export type MarginNote = z.infer<typeof MarginNoteSchema>;
export type MarginNotesFile = z.infer<typeof MarginNotesFileSchema>;
export type CorrectionNote = z.infer<typeof CorrectionNoteSchema>;
export type ItemDecision = z.infer<typeof ItemDecisionSchema>;
export type LedgerTopic = z.infer<typeof LedgerTopicSchema>;
export type ReviewLedger = z.infer<typeof ReviewLedgerSchema>;
export type SiriItem = z.infer<typeof SiriItemSchema>;
export type SiriTopic = z.infer<typeof SiriTopicSchema>;
export type SiriTranscription = z.infer<typeof SiriTranscriptionSchema>;
export type AppAuthored = z.infer<typeof AppAuthoredSchema>;
