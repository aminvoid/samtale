// @vitest-environment node
import { expect, it, vi } from "vitest";
import { onHistoryBack } from "./history-back";

it("allows server-side imports and subscriptions without a browser history", () => {
  const listener = vi.fn();
  const unsubscribe = onHistoryBack(listener);
  unsubscribe();
  expect(listener).not.toHaveBeenCalled();
});
