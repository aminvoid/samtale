import type { ProgressStore } from "@/lib/progress/progress-store";
import type { MarkerPort, ProgressPort } from "../ports";

export function createProgressPorts(store: ProgressStore): { progress: ProgressPort; marker: MarkerPort } {
  return {
    progress: {
      getSettings: () => store.getSettings(),
      savePreference: (patch) => store.updateSettings(patch),
      async persistAttempt(attempt) {
        const result = await store.saveAttempt(attempt);
        if (!result.ok) return result;
        const availability = await store.availability();
        return availability.kind === "available" ? result : { ok: false, reason: "unavailable" };
      },
    },
    marker: {
      read: () => store.getInProgressMarker(),
      write: (marker) => store.setInProgressMarker(marker),
      clear: () => store.clearInProgressMarker(),
    },
  };
}
