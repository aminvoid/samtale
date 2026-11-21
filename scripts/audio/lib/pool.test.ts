import { describe, expect, it, vi } from "vitest";
import { backoffDelay, runPool } from "./pool";

class Retryable extends Error {}

function fakeClock() {
  let t = 0;
  const sleeps: number[] = [];
  return {
    now: () => t,
    sleep: (ms: number) => {
      sleeps.push(ms);
      t += ms;
      return Promise.resolve();
    },
    sleeps,
  };
}

const base = { maxAttempts: 4, baseDelayMs: 1000, maxDelayMs: 8000, random: () => 1 };

describe("runPool", () => {
  it("never runs more tasks at once than the concurrency limit", async () => {
    let running = 0;
    let peak = 0;
    const results = await runPool(
      [1, 2, 3, 4, 5, 6, 7],
      async (n) => {
        running++;
        peak = Math.max(peak, running);
        await new Promise((r) => setTimeout(r, 1));
        running--;
        return n * 2;
      },
      { ...base, concurrency: 3, isRetryable: () => false },
    );
    expect(peak).toBe(3);
    expect(results).toEqual([2, 4, 6, 8, 10, 12, 14].map((value) => ({ ok: true, value })));
  });

  it("retries transient failures with exponential backoff", async () => {
    const clock = fakeClock();
    let calls = 0;
    const [result] = await runPool(
      ["a"],
      async () => {
        await Promise.resolve();
        calls++;
        if (calls < 3) throw new Retryable("429");
        return "done";
      },
      { ...base, concurrency: 1, isRetryable: (e) => e instanceof Retryable, sleep: clock.sleep, now: clock.now },
    );
    expect(result).toEqual({ ok: true, value: "done" });
    expect(clock.sleeps).toEqual([1000, 2000]);
  });

  it("gives up after maxAttempts and does not retry permanent errors", async () => {
    const clock = fakeClock();
    let transientCalls = 0;
    let permanentCalls = 0;
    const [transient, permanent] = await runPool(
      ["t", "p"],
      async (kind) => {
        await Promise.resolve();
        if (kind === "t") {
          transientCalls++;
          throw new Retryable("busy");
        }
        permanentCalls++;
        throw new Error("bad SSML");
      },
      { ...base, concurrency: 1, isRetryable: (e) => e instanceof Retryable, sleep: clock.sleep, now: clock.now },
    );
    expect(transient).toMatchObject({ ok: false, attempts: 4 });
    expect(transientCalls).toBe(4);
    expect(permanent).toMatchObject({ ok: false, attempts: 1 });
    expect(permanentCalls).toBe(1);
  });

  it("spaces task starts by the minimum interval (F0 rate limit), across lanes", async () => {
    vi.useFakeTimers({ now: 0 });
    try {
      const starts: number[] = [];
      const done = runPool(
        [1, 2, 3],
        () => {
          starts.push(Date.now());
          return Promise.resolve();
        },
        { ...base, concurrency: 2, minIntervalMs: 3000, isRetryable: () => false },
      );
      await vi.runAllTimersAsync();
      await done;
      expect(starts).toEqual([0, 3000, 6000]);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("backoffDelay", () => {
  it("doubles up to the cap, with jitter between half and full delay", () => {
    expect([1, 2, 3, 4, 5].map((a) => backoffDelay(a, 1000, 8000, () => 1))).toEqual([1000, 2000, 4000, 8000, 8000]);
    expect(backoffDelay(3, 1000, 8000, () => 0)).toBe(2000);
  });
});
