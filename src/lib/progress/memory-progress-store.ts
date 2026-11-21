import { orderForAppend } from "./event-order";
import { EventProgressStore, type EventLog, type MarkerStore } from "./event-progress-store";
import type { ProgressStoreOptions, StorageAvailability } from "./progress-store";
import {
  InProgressMarkerSchema,
  ProgressEventSchema,
  type InProgressMarker,
  type ProgressEvent,
} from "./schema";

export class MemoryEventLog implements EventLog {
  private readonly events = new Map<string, ProgressEvent>();
  private readonly attemptIds = new Set<string>();
  private lastRecordedAt: string | undefined;

  constructor(
    private readonly status: StorageAvailability = { kind: "unavailable", reason: "unsupported" },
  ) {}

  availability() {
    return Promise.resolve(this.status);
  }

  read(): ReturnType<EventLog["read"]> {
    return Promise.resolve({
      ok: true,
      value: {
        events: Array.from(this.events.values(), (event) => ProgressEventSchema.parse(event)),
        skippedRecords: 0,
      },
    });
  }

  append(event: ProgressEvent, assignOrder: boolean): ReturnType<EventLog["append"]> {
    const existing = this.events.get(event.id);
    if (existing) {
      return Promise.resolve(existing.type === event.type ? { ok: true } : { ok: false, reason: "invalid" });
    }
    if (event.type === "attempt-saved") {
      if (this.attemptIds.has(event.attemptId)) return Promise.resolve({ ok: true });
      this.attemptIds.add(event.attemptId);
    }
    const { entry, lastRecordedAt } = orderForAppend(event, this.lastRecordedAt, assignOrder);
    this.events.set(entry.id, entry);
    this.lastRecordedAt = lastRecordedAt;
    return Promise.resolve({ ok: true });
  }

  clear(): ReturnType<EventLog["clear"]> {
    this.events.clear();
    this.attemptIds.clear();
    this.lastRecordedAt = undefined;
    return Promise.resolve({ ok: true });
  }
}

class MemoryMarkerStore implements MarkerStore {
  private marker: InProgressMarker | null = null;

  read(): ReturnType<MarkerStore["read"]> {
    return Promise.resolve({ ok: true, value: this.marker && { ...this.marker } });
  }

  write(marker: InProgressMarker): ReturnType<MarkerStore["write"]> {
    const parsed = InProgressMarkerSchema.safeParse(marker);
    if (!parsed.success) return Promise.resolve({ ok: false, reason: "invalid" });
    this.marker = parsed.data;
    return Promise.resolve({ ok: true });
  }

  clear(): ReturnType<MarkerStore["clear"]> {
    this.marker = null;
    return Promise.resolve({ ok: true });
  }
}

export class MemoryProgressStore extends EventProgressStore {
  constructor(options: ProgressStoreOptions = {}) {
    super(new MemoryEventLog(), new MemoryMarkerStore(), options);
  }
}
