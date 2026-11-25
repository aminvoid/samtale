export interface ScreenWakeLock {
  acquire(onLost: () => void): Promise<"held" | "unavailable" | "cancelled">;
  release(): void;
}

export function createScreenWakeLock(): ScreenWakeLock {
  let current: WakeLockSentinel | undefined;
  let pending: Promise<"held" | "unavailable" | "cancelled"> | undefined;
  let generation = 0;

  return {
    acquire(onLost) {
      if (current?.released === false) return Promise.resolve("held");
      if (pending !== undefined) return pending;
      const request = generation;
      async function acquireLock() {
        try {
          if (typeof navigator.wakeLock === "undefined" || typeof navigator.wakeLock.request !== "function")
            return "unavailable";
          const lock = await navigator.wakeLock.request("screen");
          if (request !== generation) {
            await lock.release();
            return "cancelled";
          }
          if (lock.released) return "cancelled";
          current = lock;
          lock.addEventListener(
            "release",
            () => {
              if (current !== lock) return;
              current = undefined;
              onLost();
            },
            { once: true },
          );
          return "held";
        } catch {
          return request === generation && document.visibilityState === "visible"
            ? "unavailable"
            : "cancelled";
        }
      }
      pending = acquireLock().finally(() => {
        if (request === generation) pending = undefined;
      });
      return pending;
    },
    release() {
      generation += 1;
      pending = undefined;
      const lock = current;
      current = undefined;
      void lock?.release().catch(() => undefined);
    },
  };
}
