import { latestRecordedAt, orderForAppend } from "../event-order";
import type { EventLog } from "../event-progress-store";
import type { SaveResult, StorageAvailability, StorageFailure } from "../progress-store";
import {
  LogClockRecordSchema,
  PROGRESS_SCHEMA_VERSION,
  SettingsLogEntrySchema,
  StableIdSchema,
  type ProgressEvent,
} from "../schema";
import { reportSkipped, storageFailure } from "../storage-result";
import type { ProgressDatabase, DatabaseUnavailable } from "./database";
import { migrateEvent } from "./migrate-record";
import { finishTransaction } from "./transaction";

function progressStores(): ["practiceEvents", "attempts", "settings"] {
  return ["practiceEvents", "attempts", "settings"];
}

type EventStore = ReturnType<typeof progressStores>[number];

function eventStore(event: ProgressEvent): EventStore {
  switch (event.type) {
    case "practice":
    case "review-cycle-started":
      return "practiceEvents";
    case "attempt-saved":
    case "attempt-reviewed":
      return "attempts";
    case "settings-updated":
    case "last-opened":
      return "settings";
  }
}

function parseEvent(store: EventStore, row: unknown): ProgressEvent | null {
  const entry = store === "settings" ? SettingsLogEntrySchema.safeParse(row) : undefined;
  const event = migrateEvent(entry?.success ? entry.data.value : row);
  if (event === null || eventStore(event) !== store) return null;
  if (store === "settings" && (entry?.success !== true || entry.data.key !== event.id)) return null;
  return event;
}

export class IndexedDbEventLog implements EventLog {
  private fallbackStatus: DatabaseUnavailable | undefined;
  private lastFailure: DatabaseUnavailable | undefined;

  constructor(
    private readonly database: ProgressDatabase,
    private readonly fallback?: EventLog,
  ) {}

  private async open() {
    if (this.fallbackStatus) return this.fallbackStatus;
    const result = await this.database.open();
    if (result.kind === "unavailable" && this.fallback) this.fallbackStatus = result;
    return result;
  }

  async availability(): Promise<StorageAvailability> {
    const open = await this.open();
    return open.kind === "available" ? (this.lastFailure ?? { kind: "available" }) : open;
  }

  private failure(error: unknown): StorageFailure {
    const failure = storageFailure(error);
    const reason = failure.reason === "unavailable" ? "blocked" : failure.reason;
    if (reason !== "invalid") this.lastFailure = { kind: "unavailable", reason };
    return failure;
  }

  private unavailable(status: DatabaseUnavailable): StorageFailure {
    return { ok: false, reason: status.reason === "quota" ? "quota" : "unavailable" };
  }

  async read(): ReturnType<EventLog["read"]> {
    const open = await this.open();
    if (open.kind === "unavailable") return this.fallback?.read() ?? this.unavailable(open);
    try {
      const stores = progressStores();
      const tx = open.db.transaction([...stores, "recordings"]);
      const [rows, keptRecordingIds] = await finishTransaction(tx, async () =>
        Promise.all([
          Promise.all(
            stores.map(async (store) => ({ store, records: await tx.objectStore(store).getAll() })),
          ),
          readKeptRecordingIds(),
        ]),
      );

      async function readKeptRecordingIds() {
        const keys = await tx.objectStore("recordings").getAllKeys();
        return new Set(keys.filter((key) => StableIdSchema.safeParse(key).success));
      }
      let skippedRecords = 0;
      const events: ProgressEvent[] = [];
      for (const { store, records } of rows) {
        for (const row of records) {
          const event = parseEvent(store, row);
          if (event) events.push(event);
          else skippedRecords += 1;
        }
      }
      reportSkipped("progress", skippedRecords);
      return { ok: true, value: { events, skippedRecords, keptRecordingIds } };
    } catch (error) {
      return this.failure(error);
    }
  }

  async append(event: ProgressEvent, assignOrder: boolean): Promise<SaveResult> {
    const open = await this.open();
    if (open.kind === "unavailable")
      return this.fallback?.append(event, assignOrder) ?? this.unavailable(open);
    try {
      const stores = progressStores();
      const tx = open.db.transaction([...stores, "meta"], "readwrite");
      const write = async (): Promise<SaveResult> => {
        const rows = await Promise.all(
          stores.map(async (store) => ({ store, row: await tx.objectStore(store).get(event.id) })),
        );
        for (const { store, row } of rows) {
          if (row !== undefined) {
            return parseEvent(store, row)?.type === event.type
              ? { ok: true }
              : { ok: false, reason: "invalid" };
          }
        }
        if (event.type === "attempt-saved") {
          const attempts = await tx.objectStore("attempts").index("attemptId").getAll(event.attemptId);
          if (attempts.some((row) => parseEvent("attempts", row)?.type === "attempt-saved"))
            return { ok: true };
        }
        const meta = tx.objectStore("meta");
        const clock = LogClockRecordSchema.safeParse(await meta.get("lastEventTime"));
        let latest = clock.success ? clock.data.recordedAt : undefined;
        if (!clock.success) {
          // Older databases did not checkpoint the event order. Rebuild it from valid rows.
          const allRows = await Promise.all(
            stores.map(async (store) => ({ store, records: await tx.objectStore(store).getAll() })),
          );
          for (const { store, records } of allRows) {
            for (const row of records) {
              const previous = parseEvent(store, row);
              if (previous) latest = latestRecordedAt(latest, previous.recordedAt);
            }
          }
        }
        const { entry, lastRecordedAt } = orderForAppend(event, latest, assignOrder);
        const store = eventStore(entry);
        await tx.objectStore(store).add(store === "settings" ? { key: entry.id, value: entry } : entry);
        if (lastRecordedAt !== latest || !clock.success) {
          await meta.put({ key: "lastEventTime", v: PROGRESS_SCHEMA_VERSION, recordedAt: lastRecordedAt });
        }
        return { ok: true };
      };
      const result = await finishTransaction(tx, write);
      if (result.ok) this.lastFailure = undefined;
      return result;
    } catch (error) {
      return this.failure(error);
    }
  }

  async clear(): Promise<SaveResult> {
    const open = await this.open();
    if (open.kind === "unavailable") return this.fallback?.clear() ?? this.unavailable(open);
    try {
      const stores: [...ReturnType<typeof progressStores>, "recordings"] = [
        ...progressStores(),
        "recordings",
      ];
      const tx = open.db.transaction([...stores, "meta"], "readwrite");
      await finishTransaction(tx, async () => {
        await Promise.all([...stores.map(async (store) => tx.objectStore(store).clear()), clearClock()]);
        async function clearClock() {
          await tx.objectStore("meta").delete("lastEventTime");
        }
      });
      this.lastFailure = undefined;
      return { ok: true };
    } catch (error) {
      return this.failure(error);
    }
  }
}
