import type { MarkerStore } from "../event-progress-store";
import type { ReadResult } from "../progress-store";
import { InProgressMarkerSchema, type InProgressMarker } from "../schema";
import { reportSkipped, storageFailure } from "../storage-result";
import { DEFAULT_DATABASE_NAME } from "./database";

const MARKER_KEY = "pd3:mock:in-progress:v1";

function withSession<T>(run: (storage: Storage) => ReadResult<T>): Promise<ReadResult<T>> {
  try {
    if (typeof window !== "undefined") return Promise.resolve(run(window.sessionStorage));
    return Promise.resolve({ ok: false, reason: "unavailable" });
  } catch (error) {
    return Promise.resolve(storageFailure(error));
  }
}

function parseMarker(raw: string): InProgressMarker | null {
  try {
    const decoded: unknown = JSON.parse(raw);
    const parsed = InProgressMarkerSchema.safeParse(decoded);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export class SessionMarkerStore implements MarkerStore {
  private readonly key: string;

  constructor(databaseName: string) {
    this.key = databaseName === DEFAULT_DATABASE_NAME ? MARKER_KEY : `${databaseName}:${MARKER_KEY}`;
  }

  read(): ReturnType<MarkerStore["read"]> {
    return withSession((storage) => {
      const raw = storage.getItem(this.key);
      if (raw === null) return { ok: true, value: null };
      const marker = parseMarker(raw);
      reportSkipped("progress-marker", marker === null ? 1 : 0);
      return { ok: true, value: marker };
    });
  }

  async write(marker: InProgressMarker): ReturnType<MarkerStore["write"]> {
    const parsed = InProgressMarkerSchema.safeParse(marker);
    if (!parsed.success) return { ok: false, reason: "invalid" };
    const result = await withSession((storage) => {
      storage.setItem(this.key, JSON.stringify(parsed.data));
      return { ok: true, value: undefined };
    });
    return result.ok ? { ok: true } : result;
  }

  async clear(): ReturnType<MarkerStore["clear"]> {
    const result = await withSession((storage) => {
      storage.removeItem(this.key);
      return { ok: true, value: undefined };
    });
    return result.ok ? { ok: true } : result;
  }
}
