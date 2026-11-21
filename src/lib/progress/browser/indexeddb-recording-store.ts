import type { ReadResult, SaveResult } from "../progress-store";
import type { RecordingStore } from "../recording-store";
import { PROGRESS_SCHEMA_VERSION, RecordingRecordSchema, type RecordingAnswer } from "../schema";
import { reportSkipped, storageFailure } from "../storage-result";
import { ProgressDatabase, type Database } from "./database";
import { migrateRecording } from "./migrate-record";
import { finishTransaction } from "./transaction";

export class IndexedDbRecordingStore implements RecordingStore {
  private readonly database: ProgressDatabase;

  constructor(databaseName?: string) {
    this.database = new ProgressDatabase(databaseName);
  }

  private async access<T>(run: (db: Database) => Promise<T>): Promise<ReadResult<T>> {
    const open = await this.database.open();
    if (open.kind === "unavailable") {
      return { ok: false, reason: open.reason === "quota" ? "quota" : "unavailable" };
    }
    try {
      return { ok: true, value: await run(open.db) };
    } catch (error) {
      return storageFailure(error);
    }
  }

  async putAttemptRecordings(
    attemptId: string,
    topicId: string,
    answers: readonly RecordingAnswer[],
  ): Promise<SaveResult> {
    const parsed = RecordingRecordSchema.safeParse({
      v: PROGRESS_SCHEMA_VERSION,
      attemptId,
      topicId,
      answers,
    });
    if (!parsed.success) return { ok: false, reason: "invalid" };

    const result = await this.access(async (db) => {
      const tx = db.transaction("recordings", "readwrite");
      await finishTransaction(tx, async () => {
        const previous = await tx.store.index("topicId").getAllKeys(topicId);
        for (const id of previous) {
          await tx.store.delete(id);
        }
        await tx.store.put(parsed.data);
      });
    });
    if (!result.ok) return result;

    void requestPersistence();
    return { ok: true };
  }

  getAttemptRecordings(attemptId: string) {
    return this.access(async (db) => {
      const row = await db.get("recordings", attemptId);
      if (row === undefined) return null;
      const parsed = migrateRecording(row);
      reportSkipped("recordings", parsed === null ? 1 : 0);
      return parsed;
    });
  }

  async deleteAttemptRecordings(attemptId: string): Promise<SaveResult> {
    const result = await this.access((db) => db.delete("recordings", attemptId));
    return result.ok ? { ok: true } : result;
  }

  async deleteAll(): Promise<SaveResult> {
    const result = await this.access((db) => db.clear("recordings"));
    return result.ok ? { ok: true } : result;
  }

  totalBytes() {
    return this.access(async (db) => {
      let total = 0;
      let skipped = 0;
      for (const row of await db.getAll("recordings")) {
        const record = migrateRecording(row);
        if (record) {
          for (const { blob } of record.answers) total += blob.size;
        } else {
          skipped += 1;
        }
      }
      reportSkipped("recordings", skipped);
      return total;
    });
  }
}

async function requestPersistence(): Promise<void> {
  try {
    // Older browsers may lack the StorageManager method despite the DOM typings.
    if (typeof navigator === "undefined") return;
    const storage = navigator.storage;
    if (typeof storage !== "undefined" && typeof storage.persist === "function") {
      await storage.persist();
    }
  } catch {
    // Persistence is best effort. A denial still leaves the recording in IndexedDB.
  }
}
