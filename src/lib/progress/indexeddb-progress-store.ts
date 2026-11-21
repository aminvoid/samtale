import { DEFAULT_DATABASE_NAME, ProgressDatabase } from "./browser/database";
import { IndexedDbEventLog } from "./browser/indexeddb-event-log";
import { SessionMarkerStore } from "./browser/session-marker-store";
import { EventProgressStore, type EventLog } from "./event-progress-store";
import type { ProgressStoreOptions } from "./progress-store";

export interface IndexedDbProgressOptions extends ProgressStoreOptions {
  databaseName?: string;
}

export class IndexedDbProgressStore extends EventProgressStore {
  constructor(options: IndexedDbProgressOptions = {}, fallback?: EventLog) {
    const name = options.databaseName ?? DEFAULT_DATABASE_NAME;
    super(new IndexedDbEventLog(new ProgressDatabase(name), fallback), new SessionMarkerStore(name), options);
  }
}
