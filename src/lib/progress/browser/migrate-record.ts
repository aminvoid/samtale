import { z } from "zod";

// Strict CSP forbids eval. Zod v4 otherwise probes `Function("")` on first parse, which the browser
// reports as a CSP violation even though Zod catches it. jitless skips the probe (global, idempotent).
z.config({ jitless: true });
import {
  PracticeEventSchema,
  PROGRESS_SCHEMA_VERSION,
  ProgressEventSchema,
  RecordingRecordSchema,
  type ProgressEvent,
  type RecordingRecord,
} from "../schema";

const LegacyPracticeSchema = PracticeEventSchema.omit({ type: true }).extend({ v: z.literal(0) });
const LegacyVersionSchema = z.looseObject({ v: z.literal(0) });

export function migrateEvent(record: unknown): ProgressEvent | null {
  const v0 = LegacyVersionSchema.safeParse(record);
  const legacyPractice = LegacyPracticeSchema.safeParse(record);
  const current = legacyPractice.success
    ? { ...legacyPractice.data, v: PROGRESS_SCHEMA_VERSION, type: "practice" }
    : v0.success
      ? { ...v0.data, v: PROGRESS_SCHEMA_VERSION }
      : record;
  const parsed = ProgressEventSchema.safeParse(current);
  return parsed.success ? parsed.data : null;
}

export function migrateRecording(record: unknown): RecordingRecord | null {
  const legacy = LegacyVersionSchema.safeParse(record);
  const parsed = RecordingRecordSchema.safeParse(
    legacy.success ? { ...legacy.data, v: PROGRESS_SCHEMA_VERSION } : record,
  );
  return parsed.success ? parsed.data : null;
}
