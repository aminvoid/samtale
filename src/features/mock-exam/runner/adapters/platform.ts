import type { Clock, VisibilityPort, WakeLockPort } from "../ports";

export const browserClock: Clock = {
  now: () => performance.timeOrigin + performance.now(),
  setTimeout(callback, delayMs) {
    const timer = window.setTimeout(callback, delayMs);
    return () => {
      window.clearTimeout(timer);
    };
  },
};

export function createWakeLockPort(): WakeLockPort {
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

const guardKey = "pd3MockExamGuard";

export const browserVisibility: VisibilityPort = {
  isVisible: () => document.visibilityState === "visible",
  subscribe(listener) {
    const visibility = () => {
      listener(browserVisibility.isVisible() ? "visible" : "hidden");
    };
    const pagehide = () => {
      listener("pagehide");
    };
    const pageshow = (event: PageTransitionEvent) => {
      if (event.persisted) visibility();
    };
    const back = () => {
      listener("back");
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pagehide);
    window.addEventListener("pageshow", pageshow);
    // The App Router can unmount the runner from its own popstate listener.
    window.addEventListener("popstate", back, true);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pagehide);
      window.removeEventListener("pageshow", pageshow);
      window.removeEventListener("popstate", back, true);
    };
  },
  armBackGuard() {
    try {
      const state: unknown = window.history.state;
      if (typeof state === "object" && state !== null && guardKey in state) return;
      window.history.pushState({ ...(typeof state === "object" ? state : {}), [guardKey]: true }, "");
    } catch {
      // Navigation handling on devices stays behind C19.
    }
  },
  disarmBackGuard() {
    try {
      const state: unknown = window.history.state;
      if (typeof state !== "object" || state === null || !(guardKey in state)) return;
      const replacement = { ...state };
      Reflect.deleteProperty(replacement, guardKey);
      window.history.replaceState(replacement, "");
    } catch {
      // History may be unavailable while the document is leaving.
    }
  },
};
