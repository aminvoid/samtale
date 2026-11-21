import type { createRecorder, RecorderSignal } from "@/lib/audio/recorder";
import type { MicResult, RecorderPort } from "../ports";

export type MicrophoneStrategy = "keep-open" | "per-answer";

export function createRecorderPort(strategy: MicrophoneStrategy): RecorderPort {
  let adapter: ReturnType<typeof createRecorder> | undefined;
  let generation = 0;
  let openingAnswer = false;
  let approved = false;
  const listeners = new Set<(signal: RecorderSignal) => void>();

  function release() {
    generation += 1;
    openingAnswer = false;
    adapter?.release();
  }

  async function hasGrant() {
    try {
      const permission = await navigator.permissions.query({ name: "microphone" });
      return permission.state === "granted";
    } catch {
      // Without a confirmed grant, getUserMedia could open a second permission prompt.
      return false;
    }
  }

  async function canReopen() {
    return approved && (adapter?.isAvailable() === true || (await hasGrant()));
  }

  return {
    async requestMic(reason): Promise<MicResult> {
      const request = generation;
      if (reason === "check-grant" && !(await hasGrant())) return { type: "denied", reason: "other" };
      if (request !== generation) return { type: "unavailable", reason: "other" };
      const recorderModule = await import("@/lib/audio/recorder").catch(() => null);
      if (recorderModule === null || request !== generation) return { type: "unavailable", reason: "other" };
      if (adapter === undefined) {
        adapter = recorderModule.createRecorder();
        adapter.subscribe((signal) => {
          for (const listener of listeners) listener(signal);
        });
      }

      try {
        if (reason === "reacquire" && !(await canReopen())) return { type: "unavailable", reason: "other" };
        if (request !== generation) return { type: "unavailable", reason: "other" };
        await adapter.requestMic();
        if (request !== generation) return { type: "unavailable", reason: "other" };
        approved = true;
        if (strategy === "per-answer") adapter.release();
        return { type: "granted" };
      } catch (error) {
        if (request === generation) {
          approved = false;
          adapter.release();
        }
        if (error instanceof recorderModule.RecorderError) {
          return {
            type: error.code === "permission-denied" ? "denied" : "unavailable",
            reason: error.reason,
          };
        }
        return { type: "unavailable", reason: "other" };
      }
    },
    start(timeslice) {
      const recorder = adapter;
      if (recorder === undefined) throw new Error("Microphone permission is required");
      if (recorder.isAvailable()) {
        return recorder.start(timeslice);
      }
      const request = generation;
      openingAnswer = true;
      const openAndStart = async () => {
        try {
          if (!(await canReopen()) || request !== generation) throw new Error("Microphone unavailable");
          await recorder.requestMic();
          if (request !== generation) return;
          await recorder.start(timeslice);
        } finally {
          if (request === generation) openingAnswer = false;
        }
      };
      return openAndStart();
    },
    pause: () => adapter?.pause(),
    resume: () => adapter?.resume(),
    stop() {
      const recording = adapter?.stop() ?? Promise.resolve(null);
      if (strategy === "per-answer" || openingAnswer) release();
      return recording;
    },
    discard() {
      adapter?.discard();
      if (strategy === "per-answer" || openingAnswer) release();
    },
    release,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
