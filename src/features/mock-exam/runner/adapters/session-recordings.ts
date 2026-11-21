import type { ProgressStore, ReadResult, SaveResult } from "@/lib/progress/progress-store";
import type { RecordingStore } from "@/lib/progress/recording-store";
import type { RecordingAnswer } from "@/lib/progress/schema";
import type { SessionRecordingPort } from "../ports";

type PendingRecording = Promise<RecordingAnswer | null>;

export function createSessionRecordings(
  store: RecordingStore,
  progress: Pick<ProgressStore, "setAttemptKept">,
) {
  const attempts = new Map<string, Map<string, PendingRecording[]>>();

  const capture: SessionRecordingPort = {
    collect(attemptId, itemId, recording) {
      const answers = attempts.get(attemptId) ?? new Map<string, PendingRecording[]>();
      const parts = answers.get(itemId) ?? [];
      parts.push(
        recording.then((part) => (part && part.blob.size > 0 ? { itemId, ...part } : null)).catch(() => null),
      );
      answers.set(itemId, parts);
      attempts.set(attemptId, answers);
    },
    discardAnswer: (attemptId, itemId) => {
      const answers = attempts.get(attemptId);
      answers?.delete(itemId);
      if (answers?.size === 0) attempts.delete(attemptId);
    },
    discardAttempt: (attemptId) => {
      attempts.delete(attemptId);
    },
  };

  async function readSession(attemptId: string): Promise<RecordingAnswer[]> {
    const answers = attempts.get(attemptId);
    if (answers === undefined) return [];
    const pending = [...answers].map(([itemId, parts]) => ({
      itemId,
      parts,
      recording: Promise.all(parts),
    }));
    const resolved = await Promise.all(pending.map(({ recording }) => recording));
    return resolved.flatMap((parts, index) => {
      const entry = pending[index];
      return entry && attempts.get(attemptId) === answers && answers.get(entry.itemId) === entry.parts
        ? parts.flatMap((part) => (part === null ? [] : [part]))
        : [];
    });
  }

  return {
    ...capture,
    /** Parts for the same item stay in capture order and are played separately. */
    async readAttempt(attemptId: string): Promise<ReadResult<readonly RecordingAnswer[]>> {
      const session = await readSession(attemptId);
      if (session.length > 0) return { ok: true, value: session };
      const result = await store.getAttemptRecordings(attemptId);
      return result.ok ? { ok: true, value: result.value?.answers ?? [] } : result;
    },
    /** Call from the review's explicit keep action. Discard session copies on review exit. */
    async keepAttempt(attemptId: string, topicId: string): Promise<SaveResult> {
      const answers = await readSession(attemptId);
      if (answers.length === 0) return { ok: false, reason: "invalid" };
      const result = await store.putAttemptRecordings(attemptId, topicId, answers);
      if (result.ok) await progress.setAttemptKept(attemptId, true);
      return result;
    },
    clear() {
      attempts.clear();
    },
  };
}

export type MockSessionRecordings = ReturnType<typeof createSessionRecordings>;
