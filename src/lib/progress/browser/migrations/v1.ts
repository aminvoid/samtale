import type { IDBPDatabase } from "idb";
import type { ProgressDatabaseSchema } from "../database";

export function upgradeToV1(db: IDBPDatabase<ProgressDatabaseSchema>): void {
  db.createObjectStore("meta", { keyPath: "key" });
  const practice = db.createObjectStore("practiceEvents", { keyPath: "id" });
  practice.createIndex("topicId", "topicId");
  practice.createIndex("localDate", "localDate");
  const attempts = db.createObjectStore("attempts", { keyPath: "id" });
  attempts.createIndex("topicId", "topicId");
  attempts.createIndex("startedAt", "startedAt");
  attempts.createIndex("attemptId", "attemptId");
  db.createObjectStore("settings", { keyPath: "key" });
  db.createObjectStore("recordings", { keyPath: "attemptId" }).createIndex("topicId", "topicId");
}
