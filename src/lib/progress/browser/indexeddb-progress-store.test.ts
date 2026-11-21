import { Blob as NodeBlob } from "node:buffer";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProgressStore } from "../create-progress-store";
import { IndexedDbProgressStore } from "../indexeddb-progress-store";
import { createRecordingStore } from "../recording-store";
import type { AttemptInput, InProgressMarker } from "../schema";
import { DEFAULT_DATABASE_NAME, ProgressDatabase } from "./database";

const TOPIC = "2016-nov-c";
const OTHER_TOPIC = "2021-maj-a";
const FIXED_DATE = new Date(2026, 9, 24, 12);
const MARKER_KEY = "pd3:mock:in-progress:v1";
const marker: InProgressMarker = {
  attemptId: "attempt:1",
  mode: "practice",
  topicId: TOPIC,
  startedAt: FIXED_DATE.getTime(),
};
const attempt: AttemptInput = {
  ...marker,
  part: 2,
  totalMs: 81_000,
  situationKey: "A",
  status: "endedEarly",
  askedItemIds: [`${TOPIC}.sitA.q1`],
  skippedFollowups: [`${TOPIC}.sitA.followup1`],
  answers: [
    {
      itemId: `${TOPIC}.sitA.q1`,
      answerMs: 38_000,
      repeats: 1,
      slowRepeats: 0,
      showTextUsed: false,
      recorded: true,
      recordingCapped: false,
      recordingParts: 1,
    },
  ],
};

function fixtureId(index: number) {
  return `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function options() {
  let index = 0;
  return { clock: () => new Date(FIXED_DATE), createId: () => fixtureId(++index) };
}

function audio(text: string) {
  return {
    itemId: `${TOPIC}.sitA.q1`,
    blob: new Blob([text], { type: "audio/webm" }),
    mimeType: "audio/webm",
    durationMs: 250,
  };
}

beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("Blob", NodeBlob);
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("IndexedDB progress", () => {
  it("opens lazily, saves an attempt and its practice once, and restores the history on a new store", async () => {
    const open = vi.spyOn(indexedDB, "open");
    const store = createProgressStore(options());
    expect(open).not.toHaveBeenCalled();

    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    expect(
      await Promise.all([store.saveAttempt(attempt), store.saveAttempt({ ...attempt, totalMs: 99_000 })]),
    ).toEqual([{ ok: true }, { ok: true }]);

    expect(
      await store.updateSelfCheck(marker.attemptId, { first: { gaveReason: true }, general: {} }),
    ).toEqual({ ok: true });
    expect(await store.setFocusNextTime(marker.attemptId, "gaveExample")).toEqual({ ok: true });
    expect(await store.updateSettings({ playbackRate: 0.75, timersVisible: false })).toEqual({ ok: true });
    expect(await store.updateSettings({ timersVisible: true })).toEqual({ ok: true });
    const ref = { topicId: TOPIC, openedAt: FIXED_DATE.toISOString() };
    expect(await store.setLastOpened(ref)).toEqual({ ok: true });
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    listener.mockClear();

    const restored = createProgressStore({ clock: () => new Date(2026, 9, 26, 12) });
    expect(await restored.getTopicStudyState(TOPIC)).toEqual({
      ok: true,
      value: { topicId: TOPIC, practiceCount: 1, lastPractisedOn: "2026-10-24" },
    });
    expect(await restored.listDueReviews()).toEqual({
      ok: true,
      value: [{ topicId: TOPIC, day: 3, dueDate: "2026-10-26" }],
    });
    expect(await restored.listAttempts()).toEqual({
      ok: true,
      value: [
        {
          ...marker,
          situationKey: "A",
          totalMs: 81_000,
          status: "endedEarly",
          focusNextTime: "gaveExample",
          kept: false,
        },
      ],
    });
    expect(await restored.getAttempt(marker.attemptId)).toMatchObject({
      ok: true,
      value: { ...attempt, selfCheck: { first: { gaveReason: true }, general: {} } },
    });
    expect(await restored.getSettings()).toMatchObject({
      ok: true,
      value: { playbackRate: 0.75, timersVisible: true, micExplanationSeen: false },
    });
    expect(await restored.getLastOpened()).toEqual({ ok: true, value: ref });
    expect(await store.clearAll()).toEqual({ ok: true });
    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps the machine marker scoped to the tab and clears it independently of history", async () => {
    const store = createProgressStore(options());
    expect(await store.setInProgressMarker(marker)).toEqual({ ok: true });
    expect(window.sessionStorage.getItem(MARKER_KEY)).toBe(JSON.stringify(marker));
    expect(await createProgressStore().getInProgressMarker()).toEqual({ ok: true, value: marker });
    expect(await store.exportProgress()).toEqual({
      ok: true,
      value: { v: 1, events: [], skippedRecords: 0 },
    });
    expect(await store.clearInProgressMarker()).toEqual({ ok: true });
    expect(await store.getInProgressMarker()).toEqual({ ok: true, value: null });

    window.sessionStorage.setItem(MARKER_KEY, "{");
    expect(await store.getInProgressMarker()).toEqual({ ok: true, value: null });
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw new DOMException("Disabled", "SecurityError");
    });
    expect(await store.setInProgressMarker(marker)).toEqual({ ok: false, reason: "unavailable" });
    expect(await store.clearAll()).toEqual({ ok: true });
  });

  it("migrates v0 fixture rows, skips and counts corrupt or future rows, and clears them all", async () => {
    const store = createProgressStore(options());
    expect(await store.availability()).toEqual({ kind: "available" });
    const connection = await new ProgressDatabase().open();
    if (connection.kind !== "available") throw new Error("Test database did not open");
    const { db } = connection;
    const practice = {
      v: 0,
      id: fixtureId(901),
      topicId: TOPIC,
      kind: "answer-aloud",
      recordedAt: FIXED_DATE.toISOString(),
      localDate: "2026-10-24",
    };
    try {
      await db.add("practiceEvents", practice);
      await db.add("practiceEvents", { ...practice, id: fixtureId(902), localDate: "2026-02-30" });
      await db.add("practiceEvents", { ...practice, id: fixtureId(903), type: "practice", v: 99 });
      await db.add("settings", {
        key: fixtureId(904),
        value: {
          v: 0,
          type: "settings-updated",
          id: fixtureId(904),
          recordedAt: FIXED_DATE.toISOString(),
          patch: { playbackRate: 1.25 },
        },
      });
      await db.add("settings", { key: fixtureId(905), value: { patch: 42 } });
      expect(await store.exportProgress()).toMatchObject({
        ok: true,
        value: {
          v: 1,
          skippedRecords: 3,
          events: [
            { ...practice, type: "practice", v: 1 },
            { id: fixtureId(904), type: "settings-updated", v: 1 },
          ],
        },
      });
      expect(await store.getSettings()).toMatchObject({ ok: true, value: { playbackRate: 1.25 } });
      expect(await db.get("practiceEvents", practice.id)).toEqual(practice);

      expect(await store.clearAll()).toEqual({ ok: true });
      expect(await store.exportProgress()).toEqual({
        ok: true,
        value: { v: 1, events: [], skippedRecords: 0 },
      });
    } finally {
      db.close();
    }
  });

  it("maps quota and invalid state to typed results and resumes using the database after a retry", async () => {
    const store = createProgressStore(options());
    expect(await store.availability()).toEqual({ kind: "available" });
    vi.spyOn(IDBObjectStore.prototype, "add").mockImplementationOnce(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    expect(await store.saveAttempt(attempt)).toEqual({ ok: false, reason: "quota" });
    expect(await store.availability()).toEqual({ kind: "unavailable", reason: "quota" });
    expect(await store.listAttempts()).toEqual({ ok: true, value: [] });
    expect(await store.listPracticeEvents()).toEqual({ ok: true, value: [] });
    vi.spyOn(IDBObjectStore.prototype, "getAll").mockImplementationOnce(() => {
      throw new DOMException("Closed", "InvalidStateError");
    });
    expect(await store.listAttempts()).toEqual({ ok: false, reason: "unavailable" });
    expect(await store.saveAttempt(attempt)).toEqual({ ok: true });
    expect(await store.availability()).toEqual({ kind: "available" });
  });

  it("keeps the first study day on a new store after the device clock moves backward", async () => {
    const first = createProgressStore(options());
    expect(await first.recordPractice({ topicId: TOPIC, kind: "answer-aloud" })).toEqual({ ok: true });
    expect(await first.updateSettings({ timersVisible: false })).toEqual({ ok: true });

    const reopened = createProgressStore({ clock: () => new Date(2026, 9, 2, 12) });
    expect(await reopened.recordPractice({ topicId: TOPIC, kind: "shadowing" })).toEqual({ ok: true });
    expect(await reopened.updateSettings({ timersVisible: true })).toEqual({ ok: true });
    expect(await reopened.listReviewSchedule()).toEqual({
      ok: true,
      value: [
        {
          topicId: TOPIC,
          firstStudyDate: "2026-10-24",
          completedDays: [],
          nextReview: { day: 3, dueDate: "2026-10-26" },
        },
      ],
    });
    expect(await reopened.getSettings()).toMatchObject({ ok: true, value: { timersVisible: true } });
  });

  it("reopens after versionchange when browser data is removed", async () => {
    const store = createProgressStore(options());
    expect(await store.saveAttempt(attempt)).toEqual({ ok: true });
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DEFAULT_DATABASE_NAME);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(new Error("Could not remove the fixture database", { cause: request.error }));
      };
    });
    expect(await store.listAttempts()).toEqual({ ok: true, value: [] });
  });

  it("falls back to memory on blocked IndexedDB and keeps the unavailability reason", async () => {
    vi.spyOn(indexedDB, "open").mockImplementation(() => {
      throw new DOMException("Disabled", "SecurityError");
    });
    const store = createProgressStore(options());
    expect(await store.availability()).toEqual({ kind: "unavailable", reason: "blocked" });
    expect(await store.saveAttempt(attempt)).toEqual({ ok: true });
    expect(await store.getTopicStudyState(TOPIC)).toMatchObject({ ok: true, value: { practiceCount: 1 } });
    expect(await createProgressStore().listAttempts()).toEqual({ ok: true, value: [] });
    expect(await new IndexedDbProgressStore().listAttempts()).toEqual({ ok: false, reason: "unavailable" });
  });

  it("falls back after the three-second open deadline", async () => {
    vi.useFakeTimers();
    vi.spyOn(indexedDB, "open").mockReturnValueOnce(new IDBOpenDBRequest());
    const store = createProgressStore(options());
    const availability = store.availability();
    await vi.advanceTimersByTimeAsync(3_000);
    expect(await availability).toEqual({ kind: "unavailable", reason: "blocked" });
    expect(await store.recordPractice({ topicId: TOPIC, kind: "answer-aloud" })).toEqual({ ok: true });
    expect(await store.getTopicStudyState(TOPIC)).toMatchObject({ ok: true, value: { practiceCount: 1 } });
  });

  it("uses memory without browser APIs on the server", async () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("indexedDB", undefined);
    const store = createProgressStore(options());
    expect(await store.availability()).toEqual({ kind: "unavailable", reason: "unsupported" });
    expect(await store.setInProgressMarker(marker)).toEqual({ ok: true });
    expect(await store.recordPractice({ topicId: TOPIC, kind: "shadowing" })).toEqual({ ok: true });
    expect(await store.clearAll()).toEqual({ ok: true });
    expect(await store.getInProgressMarker()).toEqual({ ok: true, value: null });
    expect(await store.listPracticeEvents()).toEqual({ ok: true, value: [] });
  });
});

describe("kept recordings", () => {
  it("requests persistence only on keep, replaces recordings per topic, and keeps exports free of audio", async () => {
    const persist = vi.fn().mockResolvedValue(false);
    Object.defineProperty(navigator, "storage", { configurable: true, value: { persist } });
    try {
      const store = createProgressStore(options());
      const recordings = createRecordingStore();
      const newer = { ...attempt, attemptId: "attempt:2", startedAt: FIXED_DATE.getTime() + 1 };
      expect(await store.saveAttempt(attempt)).toEqual({ ok: true });
      expect(await store.saveAttempt(newer)).toEqual({ ok: true });
      expect(await recordings.totalBytes()).toEqual({ ok: true, value: 0 });
      expect(persist).not.toHaveBeenCalled();

      expect(await recordings.putAttemptRecordings(attempt.attemptId, TOPIC, [audio("first")])).toEqual({
        ok: true,
      });
      expect(persist).toHaveBeenCalledTimes(1);
      expect(await store.getAttempt(attempt.attemptId)).toMatchObject({ ok: true, value: { kept: true } });
      expect(await recordings.putAttemptRecordings(newer.attemptId, TOPIC, [audio("latest")])).toEqual({
        ok: true,
      });
      expect(await recordings.putAttemptRecordings("another", OTHER_TOPIC, [audio("more")])).toEqual({
        ok: true,
      });
      expect(await recordings.getAttemptRecordings(attempt.attemptId)).toEqual({ ok: true, value: null });
      const stored = await recordings.getAttemptRecordings(newer.attemptId);
      expect(stored.ok && (await stored.value?.answers[0]?.blob.text())).toBe("latest");
      expect(await recordings.totalBytes()).toEqual({ ok: true, value: 10 });
      expect(await store.listAttempts()).toMatchObject({
        ok: true,
        value: [
          { attemptId: newer.attemptId, kept: true },
          { attemptId: attempt.attemptId, kept: false },
        ],
      });
      expect(JSON.stringify(await store.exportProgress())).not.toMatch(/blob|audio\/webm|latest/);

      expect(await recordings.deleteAttemptRecordings(newer.attemptId)).toEqual({ ok: true });
      expect(await store.getAttempt(newer.attemptId)).toMatchObject({ ok: true, value: { kept: false } });
      expect(await store.clearAll()).toEqual({ ok: true });
      expect(await recordings.totalBytes()).toEqual({ ok: true, value: 0 });
      expect(await recordings.deleteAll()).toEqual({ ok: true });
      expect(persist).toHaveBeenCalledTimes(3);
    } finally {
      Reflect.deleteProperty(navigator, "storage");
    }
  });

  it("preserves the previous recording if the replacement exceeds quota", async () => {
    const recordings = createRecordingStore();
    expect(await recordings.putAttemptRecordings("old", TOPIC, [audio("first")])).toEqual({ ok: true });
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementationOnce(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    expect(await recordings.putAttemptRecordings("replacement", TOPIC, [audio("new")])).toEqual({
      ok: false,
      reason: "quota",
    });
    expect(await recordings.getAttemptRecordings("old")).toMatchObject({
      ok: true,
      value: { attemptId: "old" },
    });
    expect(await recordings.getAttemptRecordings("replacement")).toEqual({ ok: true, value: null });
  });

  it("serializes simultaneous keep operations from two stores", async () => {
    const first = createRecordingStore();
    const second = createRecordingStore();
    expect(await first.totalBytes()).toEqual({ ok: true, value: 0 });
    expect(await second.totalBytes()).toEqual({ ok: true, value: 0 });
    expect(
      await Promise.all([
        first.putAttemptRecordings("one", TOPIC, [audio("123")]),
        second.putAttemptRecordings("two", TOPIC, [audio("456")]),
      ]),
    ).toEqual([{ ok: true }, { ok: true }]);
    expect(await first.totalBytes()).toEqual({ ok: true, value: 3 });
  });
});
