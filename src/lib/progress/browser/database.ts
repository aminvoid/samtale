import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { MetaRecordSchema, PROGRESS_SCHEMA_VERSION } from "../schema";
import { openFailure } from "../storage-result";
import type { StorageAvailability } from "../progress-store";
import { upgradeToV1 } from "./migrations/v1";

const DATABASE_VERSION = 1;
export const DEFAULT_DATABASE_NAME = "pd3-mundtlig";
const OPEN_TIMEOUT_MS = 3_000;

export interface ProgressDatabaseSchema extends DBSchema {
  meta: { key: string; value: unknown };
  practiceEvents: { key: string; value: unknown; indexes: { topicId: string; localDate: string } };
  attempts: {
    key: string;
    value: unknown;
    indexes: { topicId: string; startedAt: number; attemptId: string };
  };
  settings: { key: string; value: unknown };
  recordings: { key: string; value: unknown; indexes: { topicId: string } };
}

export type Database = IDBPDatabase<ProgressDatabaseSchema>;
export type DatabaseUnavailable = Extract<StorageAvailability, { kind: "unavailable" }>;
type OpenResult = { kind: "available"; db: Database } | DatabaseUnavailable;

export class ProgressDatabase {
  private pending: Promise<OpenResult> | undefined;

  constructor(private readonly name = DEFAULT_DATABASE_NAME) {}

  open(): Promise<OpenResult> {
    if (this.pending) return this.pending;
    const pending = this.connect();
    this.pending = pending;
    void pending.then((result) => {
      if (result.kind === "unavailable" && this.pending === pending) this.pending = undefined;
    });
    return pending;
  }

  private async connect(): Promise<OpenResult> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let expired = false;
    try {
      if (typeof window === "undefined" || typeof indexedDB === "undefined") {
        return { kind: "unavailable", reason: "unsupported" };
      }
      const unavailable = new Promise<DatabaseUnavailable>((resolve) => {
        timer = setTimeout(() => {
          resolve({ kind: "unavailable", reason: "blocked" });
        }, OPEN_TIMEOUT_MS);
      });
      let opened: Database | undefined;
      const opening = openDB<ProgressDatabaseSchema>(this.name, DATABASE_VERSION, {
        upgrade(db, oldVersion, _newVersion, transaction) {
          void transaction.done.catch(() => undefined);
          try {
            if (oldVersion < 1) upgradeToV1(db);
            const metadata = MetaRecordSchema.parse({ key: "schemaVersion", v: PROGRESS_SCHEMA_VERSION });
            void transaction
              .objectStore("meta")
              .put(metadata)
              .catch(() => undefined);
          } catch {
            transaction.abort();
          }
        },
        // Close this connection when another tab needs a version change.
        blocking: () => {
          opened?.close();
          this.pending = undefined;
        },
        terminated: () => {
          this.pending = undefined;
        },
      }).then<OpenResult>((db) => {
        opened = db;
        if (expired) db.close();
        return { kind: "available", db };
      });
      const result = await Promise.race([opening, unavailable]);
      expired = result.kind === "unavailable";
      return result;
    } catch (error) {
      return openFailure(error);
    } finally {
      clearTimeout(timer);
    }
  }
}
