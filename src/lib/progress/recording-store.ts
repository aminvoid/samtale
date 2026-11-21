import { IndexedDbRecordingStore } from "./browser/indexeddb-recording-store";
import type { ReadResult, SaveResult } from "./progress-store";
import type { RecordingAnswer, RecordingRecord } from "./schema";

export interface RecordingStore {
  /** Call only from the learner's explicit choice to keep this attempt on the device. */
  putAttemptRecordings(
    attemptId: string,
    topicId: string,
    answers: readonly RecordingAnswer[],
  ): Promise<SaveResult>;
  getAttemptRecordings(attemptId: string): Promise<ReadResult<RecordingRecord | null>>;
  deleteAttemptRecordings(attemptId: string): Promise<SaveResult>;
  deleteAll(): Promise<SaveResult>;
  totalBytes(): Promise<ReadResult<number>>;
}

export function createRecordingStore(options: { databaseName?: string } = {}): RecordingStore {
  return new IndexedDbRecordingStore(options.databaseName);
}
