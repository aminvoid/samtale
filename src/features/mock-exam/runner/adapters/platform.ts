import { onHistoryBack } from "@/lib/navigation/history-back";
import type { Clock, VisibilityPort } from "../ports";

export const browserClock: Clock = {
  now: () => performance.timeOrigin + performance.now(),
  setTimeout(callback, delayMs) {
    const timer = window.setTimeout(callback, delayMs);
    return () => {
      window.clearTimeout(timer);
    };
  },
};

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
    // The App Router unmounts the runner from its own popstate listener; see @/lib/navigation/history-back.
    const unsubscribeBack = onHistoryBack(back);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pagehide);
      window.removeEventListener("pageshow", pageshow);
      unsubscribeBack();
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
