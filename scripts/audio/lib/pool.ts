/**
 * Runs tasks with a concurrency limit, an optional minimum interval between task starts
 * (the F0 tier allows 20 transactions per 60 s), and exponential backoff with jitter for
 * transient failures. Time and randomness are injected so tests are deterministic.
 */
export interface PoolOptions {
  concurrency: number;
  /** Minimum milliseconds between the starts of two attempts (rate limiting). */
  minIntervalMs?: number;
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  isRetryable: (error: unknown) => boolean;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  random?: () => number;
  onRetry?: (info: { index: number; attempt: number; delayMs: number; error: unknown }) => void;
}

export type Settled<R> = { ok: true; value: R } | { ok: false; error: unknown; attempts: number };

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Full-jitter exponential backoff: random in [0.5, 1] × min(cap, base × 2^(attempt-1)). */
export function backoffDelay(attempt: number, base: number, cap: number, random: () => number): number {
  const exp = Math.min(cap, base * 2 ** (attempt - 1));
  return Math.round(exp * (0.5 + random() / 2));
}

export async function runPool<T, R>(
  tasks: readonly T[],
  worker: (task: T, index: number) => Promise<R>,
  options: PoolOptions,
): Promise<Settled<R>[]> {
  const sleep = options.sleep ?? realSleep;
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  const results: Array<Settled<R> | undefined> = tasks.map(() => undefined);
  let nextStartAt = 0;

  // Reserves the next start slot synchronously, so concurrent workers never share a slot.
  const throttle = async () => {
    const interval = options.minIntervalMs ?? 0;
    if (interval <= 0) return;
    const t = now();
    const at = Math.max(t, nextStartAt);
    nextStartAt = at + interval;
    if (at > t) await sleep(at - t);
  };

  const runOne = async (task: T, index: number) => {
    for (let attempt = 1; ; attempt++) {
      await throttle();
      try {
        results[index] = { ok: true, value: await worker(task, index) };
        return;
      } catch (error) {
        if (attempt >= options.maxAttempts || !options.isRetryable(error)) {
          results[index] = { ok: false, error, attempts: attempt };
          return;
        }
        const delayMs = backoffDelay(attempt, options.baseDelayMs, options.maxDelayMs, random);
        options.onRetry?.({ index, attempt, delayMs, error });
        await sleep(delayMs);
      }
    }
  };

  // All lanes pull from one shared iterator, so each task runs exactly once.
  const queue = tasks.entries();
  const lanes = Array.from({ length: Math.max(1, Math.min(options.concurrency, tasks.length)) }, async () => {
    for (const [index, task] of queue) await runOne(task, index);
  });
  await Promise.all(lanes);
  return results.map((r) => r ?? { ok: false, error: new Error("task did not run"), attempts: 0 });
}
