/**
 * Audio manifest contract (ADR-0006 §2). Written only by `audio:generate`; read by
 * `content:build`. The full manifest never ships to the browser.
 */
import { z } from "zod";

// Strict CSP forbids eval. Zod v4 otherwise probes `Function("")` on first parse, which the browser
// reports as a CSP violation even though Zod catches it. jitless skips the probe (global, idempotent).
z.config({ jitless: true });

const hash = z.string().regex(/^[0-9a-f]{20}$/, { error: "hash must be 20 lowercase hex characters" });
const ms = z.number().int().nonnegative();

/** [charStart, charEnd, audioStartMs, audioEndMs]; char offsets index the display text (UTF-16). */
export const wordTimingSchema = z
  .tuple([ms, ms, ms, ms])
  .refine(([s, e, a, b]) => e > s && b >= a, { error: "word timing must have end > start" });

export const manifestEntrySchema = z.object({
  hash,
  voiceRole: z.enum(["examiner", "model"]),
  voice: z.string().min(1),
  textSha256: z.string().regex(/^[0-9a-f]{64}$/),
  durationMs: ms,
  bytes: z.number().int().positive(),
  words: z.array(wordTimingSchema).optional(),
});

export const manifestSchema = z
  .object({
    manifestVersion: z.literal(1),
    generatorVersion: z.string().min(1),
    entries: z.record(z.string().min(1), manifestEntrySchema),
  })
  .superRefine((m, ctx) => {
    for (const [id, entry] of Object.entries(m.entries)) {
      const words = entry.words ?? [];
      const at = words.findIndex((cur, i) => {
        const prev = words[i - 1];
        return prev !== undefined && (cur[0] < prev[1] || cur[2] < prev[2]);
      });
      if (at > 0) ctx.addIssue({ code: "custom", path: ["entries", id, "words", at], message: "word timings must ascend" });
    }
  });

export type WordTiming = z.infer<typeof wordTimingSchema>;
export type ManifestEntry = z.infer<typeof manifestEntrySchema>;
export type Manifest = z.infer<typeof manifestSchema>;

export function emptyManifest(generatorVersion: string): Manifest {
  return { manifestVersion: 1, generatorVersion, entries: {} };
}
