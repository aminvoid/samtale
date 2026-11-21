import { createProgressStore } from "@/lib/progress/create-progress-store";
import type { ProgressStore } from "@/lib/progress/progress-store";

let browserStore: ProgressStore | undefined;

export function getStudyProgressStore() {
  if (typeof window === "undefined") return createProgressStore();
  browserStore ??= createProgressStore();
  return browserStore;
}
