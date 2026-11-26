import { afterEach, expect, it, vi } from "vitest";
import { createScreenWakeLock } from "./screen-wake-lock";

class ScreenLock extends EventTarget {
  released = false;

  lose() {
    this.released = true;
    this.dispatchEvent(new Event("release"));
  }

  release = vi.fn(() => {
    this.lose();
    return Promise.resolve();
  });
}

afterEach(() => vi.unstubAllGlobals());

it.each([undefined, {}])("reports wake lock unavailable without browser support (%s)", async (wakeLock) => {
  vi.stubGlobal("navigator", { wakeLock });
  const onLost = vi.fn();
  await expect(createScreenWakeLock().acquire(onLost)).resolves.toBe("unavailable");
  expect(onLost).not.toHaveBeenCalled();
});

it.each([
  ["visible", "unavailable"],
  ["hidden", "cancelled"],
] as const)("classifies a denied request on a %s page as %s", async (visibility, outcome) => {
  vi.spyOn(document, "visibilityState", "get").mockReturnValue(visibility);
  const request = vi.fn().mockRejectedValue(new DOMException("", "NotAllowedError"));
  vi.stubGlobal("navigator", { wakeLock: { request } });
  await expect(createScreenWakeLock().acquire(vi.fn())).resolves.toBe(outcome);
});

it("shares requests, reports a browser release, and can reacquire without reporting a deliberate release", async () => {
  const first = new ScreenLock();
  const next = new ScreenLock();
  const request = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(next);
  vi.stubGlobal("navigator", { wakeLock: { request } });
  const lock = createScreenWakeLock();
  const onLost = vi.fn();
  await expect(Promise.all([lock.acquire(onLost), lock.acquire(onLost)])).resolves.toEqual(["held", "held"]);
  await expect(lock.acquire(onLost)).resolves.toBe("held");
  expect(request).toHaveBeenCalledExactlyOnceWith("screen");

  first.lose();
  expect(onLost).toHaveBeenCalledOnce();
  await expect(lock.acquire(onLost)).resolves.toBe("held");
  lock.release();
  expect(next.release).toHaveBeenCalledOnce();
  expect(onLost).toHaveBeenCalledOnce();
});

it("releases a late grant after cancellation and rejects a lock the browser already released", async () => {
  const pending = Promise.withResolvers<ScreenLock>();
  const late = new ScreenLock();
  const released = new ScreenLock();
  released.lose();
  const request = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValueOnce(released);
  vi.stubGlobal("navigator", { wakeLock: { request } });
  const lock = createScreenWakeLock();
  const onLost = vi.fn();
  const acquisition = lock.acquire(onLost);
  lock.release();
  pending.resolve(late);
  await expect(acquisition).resolves.toBe("cancelled");
  expect(late.release).toHaveBeenCalledOnce();
  await expect(lock.acquire(onLost)).resolves.toBe("cancelled");
  expect(onLost).not.toHaveBeenCalled();
});

it("treats a late denial after cancellation as cancelled even while visible", async () => {
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  const pending = Promise.withResolvers<ScreenLock>();
  vi.stubGlobal("navigator", { wakeLock: { request: () => pending.promise } });
  const lock = createScreenWakeLock();
  const acquisition = lock.acquire(vi.fn());
  lock.release();
  pending.reject(new DOMException("", "NotAllowedError"));
  await expect(acquisition).resolves.toBe("cancelled");
});
