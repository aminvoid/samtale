import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLazyProgressStore, createLazyRecordingStore } from "./lazy-stores";
import type { ProgressStore } from "./progress-store";
import type { RecordingStore } from "./recording-store";

const state = vi.hoisted(() => ({ fail: 0, loads: 0, options: new Array<unknown>() }));
const ok = { ok: true, value: "result" };
const progressMethods = [
  "appendEvent",
  "recordPractice",
  "listPracticeEvents",
  "getTopicStudyState",
  "listTopicStudyStates",
  "listReviewSchedule",
  "listDueReviews",
  "startReviewCycle",
  "saveAttempt",
  "updateSelfCheck",
  "setFocusNextTime",
  "setAttemptKept",
  "listAttempts",
  "getAttempt",
  "getSettings",
  "updateSettings",
  "getLastOpened",
  "setLastOpened",
  "getInProgressMarker",
  "setInProgressMarker",
  "clearInProgressMarker",
  "clearAll",
  "exportProgress",
] as const satisfies ReadonlyArray<keyof ProgressStore>;
const recordingMethods = [
  "putAttemptRecordings",
  "getAttemptRecordings",
  "deleteAttemptRecordings",
  "deleteAll",
  "totalBytes",
] as const satisfies ReadonlyArray<keyof RecordingStore>;

type Fake = ReturnType<typeof vi.fn>;
const fakes = vi.hoisted(() => ({ progress: new Map<string, Fake>(), recording: new Map<string, Fake>() }));

/** Calls a store method by name, so one loop covers the whole interface. */
function call(store: object, name: string, args: unknown[]): Promise<unknown> {
  const method: unknown = Reflect.get(store, name);
  if (typeof method !== "function") throw new Error(`${name} is not a method`);
  const result: unknown = Reflect.apply(method, store, args);
  return Promise.resolve(result);
}

function fake(fakes: Map<string, Fake>, name: string): Fake {
  const found = fakes.get(name);
  if (found === undefined) throw new Error(`no fake ${name}`);
  return found;
}

/** The inner method was called once, with every argument the lazy method declares. */
function expectForwarded(store: object, name: string, inner: Fake, args: unknown[]) {
  const method: unknown = Reflect.get(store, name);
  if (typeof method !== "function") throw new Error(`${name} is not a method`);
  expect(inner).toHaveBeenCalledOnce();
  expect(inner).toHaveBeenCalledWith(...args.slice(0, method.length));
}

function load<T>(store: T, options: unknown): T {
  state.loads += 1;
  state.options.push(options);
  if (state.fail > 0) {
    state.fail -= 1;
    throw new Error("chunk failed");
  }
  return store;
}

vi.mock("./create-progress-store", () => ({
  createProgressStore: (options: unknown) => load(Object.fromEntries(fakes.progress), options),
}));
vi.mock("./recording-store", () => ({
  createRecordingStore: (options: unknown) => load(Object.fromEntries(fakes.recording), options),
}));

beforeEach(() => {
  state.fail = 0;
  state.loads = 0;
  state.options = [];
  fakes.progress.clear();
  fakes.recording.clear();
  for (const name of progressMethods)
    fakes.progress.set(
      name,
      vi.fn(() => Promise.resolve(ok)),
    );
  fakes.progress.set(
    "availability",
    vi.fn(() => Promise.resolve({ kind: "available" })),
  );
  fakes.progress.set(
    "subscribe",
    vi.fn(() => vi.fn()),
  );
  for (const name of recordingMethods)
    fakes.recording.set(
      name,
      vi.fn(() => Promise.resolve(ok)),
    );
});

describe("createLazyProgressStore", () => {
  it("loads nothing until first use, then loads once and delegates every method with its arguments", async () => {
    const store = createLazyProgressStore({ databaseName: "test-db" });
    expect(state.loads).toBe(0);

    expect(await store.availability()).toEqual({ kind: "available" });
    for (const name of progressMethods) {
      expect(await call(store, name, ["a", "b"])).toEqual(ok);
      expectForwarded(store, name, fake(fakes.progress, name), ["a", "b"]);
    }
    expect(state.loads).toBe(1);
    expect(state.options).toEqual([{ databaseName: "test-db" }]);
  });

  it("subscribes once loaded and unsubscribes on cleanup", async () => {
    const store = createLazyProgressStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const subscribe = fake(fakes.progress, "subscribe");
    await vi.waitFor(() => {
      expect(subscribe).toHaveBeenCalledWith(listener);
    });
    const inner: unknown = subscribe.mock.results[0]?.value;
    unsubscribe();
    expect(inner).toHaveBeenCalledOnce();
  });

  it("doesn't subscribe when cleaned up before the store loads", async () => {
    const store = createLazyProgressStore();
    store.subscribe(vi.fn())();
    await store.listAttempts();
    expect(fake(fakes.progress, "subscribe")).not.toHaveBeenCalled();
  });

  it("attaches surviving subscriptions once when a later operation recovers the store", async () => {
    state.fail = 1;
    const store = createLazyProgressStore();
    const listener = vi.fn();
    const cancelled = vi.fn();
    const subscribe = fake(fakes.progress, "subscribe");
    const listeners = new Set<() => void>();
    subscribe.mockImplementation((callback: () => void) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    });
    fakes.progress.set(
      "clearAll",
      vi.fn<ProgressStore["clearAll"]>(() => {
        for (const callback of listeners) callback();
        return Promise.resolve({ ok: true });
      }),
    );

    const unsubscribe = store.subscribe(listener);
    store.subscribe(listener);
    const cancel = store.subscribe(cancelled);
    expect(await store.getSettings()).toEqual({ ok: false, reason: "unavailable" });
    expect(subscribe).not.toHaveBeenCalled();
    cancel();

    expect(await store.clearAll()).toEqual({ ok: true });
    expect(subscribe).toHaveBeenCalledExactlyOnceWith(listener);
    expect(listener).toHaveBeenCalledOnce();
    expect(cancelled).not.toHaveBeenCalled();

    unsubscribe();
    await store.clearAll();
    expect(listener).toHaveBeenCalledOnce();
    const later = vi.fn();
    const stop = store.subscribe(later);
    await store.clearAll();
    expect(later).toHaveBeenCalledOnce();
    stop();
  });

  it("reports unavailable storage when the store can't load, and retries on the next call", async () => {
    state.fail = 3;
    const store = createLazyProgressStore();
    expect(await store.availability()).toEqual({ kind: "unavailable", reason: "error" });
    expect(await store.listAttempts()).toEqual({ ok: false, reason: "unavailable" });
    expect(await store.clearInProgressMarker()).toEqual({ ok: false, reason: "unavailable" });
    const unsubscribe = store.subscribe(vi.fn());
    await expect(store.getSettings()).resolves.toEqual(ok);
    unsubscribe();
    // Three failed loads, then one that the subscription and the read share.
    expect(state.loads).toBe(4);
  });
});

describe("createLazyRecordingStore", () => {
  it("delegates every method after loading once", async () => {
    const store = createLazyRecordingStore({ databaseName: "test-db" });
    expect(state.loads).toBe(0);
    for (const name of recordingMethods) {
      expect(await call(store, name, ["a", "b", "c"])).toEqual(ok);
      expectForwarded(store, name, fake(fakes.recording, name), ["a", "b", "c"]);
    }
    expect(state.loads).toBe(1);
    expect(state.options).toEqual([{ databaseName: "test-db" }]);
  });

  it("reports unavailable storage when the store can't load", async () => {
    state.fail = 2;
    const store = createLazyRecordingStore();
    expect(await store.totalBytes()).toEqual({ ok: false, reason: "unavailable" });
    expect(await store.deleteAll()).toEqual({ ok: false, reason: "unavailable" });
    expect(await store.deleteAll()).toEqual(ok);
  });
});
