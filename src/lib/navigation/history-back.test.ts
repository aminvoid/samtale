import { afterEach, describe, expect, it, vi } from "vitest";
import { onHistoryBack } from "./history-back";

describe("history Back signal", () => {
  const cleanups: (() => void)[] = [];

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
  });

  /**
   * Stands in for the App Router: added after this module, it unmounts the runner on popstate.
   * jsdom, like WebKit, runs capture listeners first at the target; Chromium runs window listeners
   * in the order they were added, which is the case the e2e Back test covers.
   */
  function routerThatUnmounts(unmount: () => void) {
    const onPopState = () => {
      unmount();
    };
    window.addEventListener("popstate", onPopState);
    cleanups.push(() => {
      window.removeEventListener("popstate", onPopState);
    });
  }

  it("reaches the runner before a later popstate listener unmounts it", () => {
    const runner = vi.fn();
    const unsubscribe = onHistoryBack(runner);
    cleanups.push(unsubscribe);
    routerThatUnmounts(unsubscribe);

    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(runner).toHaveBeenCalledOnce();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = onHistoryBack(listener);
    window.dispatchEvent(new PopStateEvent("popstate"));
    unsubscribe();
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(listener).toHaveBeenCalledOnce();
  });
});
