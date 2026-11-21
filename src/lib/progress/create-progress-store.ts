import { IndexedDbProgressStore, type IndexedDbProgressOptions } from "./indexeddb-progress-store";
import { MemoryEventLog, MemoryProgressStore } from "./memory-progress-store";
import type { ProgressStore } from "./progress-store";

export function createProgressStore(options: IndexedDbProgressOptions = {}): ProgressStore {
  if (typeof window === "undefined") return new MemoryProgressStore(options);
  return new IndexedDbProgressStore(options, new MemoryEventLog());
}
