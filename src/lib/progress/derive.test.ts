import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { deriveProgress, history } from "./derive";
import { MemoryProgressStore } from "./memory-progress-store";
import { addCalendarDays } from "./review-schedule";
import type { ProgressEvent } from "./schema";

function eventId(index: number): string {
  return `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function eventTime(index: number): string {
  return new Date(Date.UTC(2026, 9, 24, 0, 0, index)).toISOString();
}

const envelope = (index: number) => ({ v: 1 as const, id: eventId(index), recordedAt: eventTime(index) });

describe("progress projections", () => {
  it("ignores event arrival order and replays of the same UUID across all derived views", () => {
    const rows = fc.array(
      fc.record({
        topicId: fc.constantFrom("a", "b", "c"),
        offset: fc.integer({ min: 0, max: 21 }),
        totalMs: fc.integer({ min: 1, max: 300_000 }),
        kind: fc.constantFrom("study", "mock", "settings", "open", "restart"),
      }),
      { minLength: 1, maxLength: 40 },
    );
    const eventLogs = rows.chain((data) => {
      const events = data.flatMap<ProgressEvent>(({ topicId, offset, totalMs, kind }, index) => {
        const order = index * 2;
        const envelope: Pick<ProgressEvent, "v" | "id" | "recordedAt"> = {
          v: 1,
          id: eventId(order),
          recordedAt: eventTime(order),
        };
        const localDate = addCalendarDays("2026-10-24", offset);
        switch (kind) {
          case "study":
            return [{ ...envelope, topicId, localDate, type: "practice", kind: "shadowing" }];
          case "mock": {
            const attemptId = `attempt:${String(index)}`;
            return [
              {
                ...envelope,
                topicId,
                localDate,
                type: "attempt-saved",
                attemptId,
                part: 2,
                mode: "exam",
                startedAt: Date.parse(envelope.recordedAt),
                totalMs,
                situationKey: "B",
                status: "interrupted",
                askedItemIds: [],
                skippedFollowups: [],
                answers: [],
              },
              {
                ...envelope,
                id: eventId(order + 1),
                recordedAt: eventTime(order + 1),
                type: "attempt-reviewed",
                attemptId,
                focusNextTime: "gaveExample",
                selfCheck: { first: { gaveExample: true }, general: {} },
              },
            ];
          }
          case "settings":
            return [{ ...envelope, type: "settings-updated", patch: { timersVisible: offset % 2 === 0 } }];
          case "open":
            return [{ ...envelope, type: "last-opened", ref: { topicId, openedAt: envelope.recordedAt } }];
          case "restart":
            return [{ ...envelope, topicId, localDate, type: "review-cycle-started" }];
        }
      });
      const replay = [...events, ...events];
      return fc
        .shuffledSubarray(replay, { minLength: replay.length, maxLength: replay.length })
        .map((permutation) => ({ events, permutation, data }));
    });

    fc.assert(
      fc.property(eventLogs, ({ events, permutation, data }) => {
        const canonical = deriveProgress(events);
        expect(deriveProgress(permutation)).toEqual(canonical);

        const studyRows = data.filter(({ kind }) => kind === "study" || kind === "mock");
        expect(canonical.topics.reduce((total, topic) => total + topic.practiceCount, 0)).toBe(
          studyRows.length,
        );
        const summaries = history(canonical.attempts.values());
        expect(summaries.map(({ totalMs }) => totalMs)).toEqual(
          data
            .filter(({ kind }) => kind === "mock")
            .reverse()
            .map(({ totalMs }) => totalMs),
        );
        for (const summary of summaries) {
          expect(summary.focusNextTime).toBe("gaveExample");
          expect(summary).not.toHaveProperty("selfCheck");
        }
      }),
      { seed: 42008 },
    );
  });

  it("replays an exported log without duplicate practice or loss of review annotations", async () => {
    let next = 0;
    const store = new MemoryProgressStore({ createId: () => eventId(++next) });
    const practice: ProgressEvent = {
      v: 1,
      id: eventId(100),
      recordedAt: eventTime(10),
      type: "practice",
      kind: "answer-aloud",
      topicId: "topic",
      localDate: "2026-10-24",
    };
    expect(await store.appendEvent(practice)).toEqual({ ok: true });
    expect(await store.updateSettings({ micExplanationSeen: true })).toEqual({ ok: true });
    const saved = await store.exportProgress();
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const replay = new MemoryProgressStore();
    for (const event of [...saved.value.events, ...saved.value.events].reverse()) {
      expect(await replay.appendEvent(event)).toEqual({ ok: true });
    }
    expect(await replay.exportProgress()).toEqual(saved);
    expect(await replay.listTopicStudyStates()).toEqual(await store.listTopicStudyStates());
  });

  it("counts standalone mocks once and prefers a saved attempt over linked practice or duplicate saves", () => {
    const legacyPractice = {
      ...envelope(1),
      type: "practice",
      kind: "mock",
      mode: "exam",
      topicId: "topic",
      localDate: "2026-10-24",
    } as const;
    const savedAttempt = {
      ...envelope(5),
      type: "attempt-saved",
      attemptId: "saved",
      part: 2,
      topicId: "topic",
      localDate: "2026-10-26",
      mode: "exam",
      startedAt: 1_700_000_000_000,
      totalMs: 12_000,
      situationKey: "A",
      status: "completed",
      askedItemIds: [],
      skippedFollowups: [],
      answers: [],
    } satisfies ProgressEvent;
    const projection = deriveProgress([
      legacyPractice,
      { ...legacyPractice, ...envelope(2), attemptId: "missing-save" },
      { ...legacyPractice, ...envelope(3), attemptId: "missing-save" },
      { ...legacyPractice, ...envelope(4), attemptId: "saved" },
      savedAttempt,
      { ...savedAttempt, ...envelope(6), totalMs: 99_000 },
      { ...envelope(7), type: "attempt-reviewed", attemptId: "unknown", kept: true },
      { ...envelope(8), type: "attempt-reviewed", attemptId: "saved", kept: true },
      { ...savedAttempt, ...envelope(9), attemptId: "also-saved", topicId: "other" },
    ]);

    expect(projection.practices.map(({ id }) => id)).toEqual([
      eventId(1),
      eventId(2),
      eventId(5),
      eventId(9),
    ]);
    expect(projection.topics).toContainEqual({
      topicId: "topic",
      practiceCount: 3,
      lastPractisedOn: "2026-10-26",
    });
    expect(projection.attempts.get("saved")).toMatchObject({ totalMs: 12_000, kept: true });
    expect(projection.attempts.has("unknown")).toBe(false);
    expect(history(projection.attempts.values()).map(({ attemptId }) => attemptId)).toEqual([
      "also-saved",
      "saved",
    ]);
  });

  it("orders simultaneous settings events by ID and preserves preferences omitted from a patch", () => {
    const at = eventTime(0);
    const { settings } = deriveProgress([
      { ...envelope(2), recordedAt: at, type: "settings-updated", patch: { timersVisible: false } },
      {
        ...envelope(1),
        recordedAt: at,
        type: "settings-updated",
        patch: { timersVisible: true, playbackRate: 0.75 },
      },
      { ...envelope(3), type: "settings-updated", patch: { playbackRate: undefined } },
    ]);
    expect(settings).toMatchObject({ timersVisible: false, playbackRate: 0.75 });
  });

  it("rejects a premature or backdated review restart and accepts one after the completed cycle", () => {
    const practice = {
      ...envelope(1),
      type: "practice",
      kind: "shadowing",
      topicId: "topic",
      localDate: "2026-10-24",
    } as const;
    const restart = {
      ...envelope(2),
      type: "review-cycle-started",
      topicId: practice.topicId,
      localDate: "2026-10-25",
    } as const;
    const events = [
      practice,
      restart,
      { ...practice, ...envelope(3), localDate: "2026-11-06" },
      { ...restart, ...envelope(4), localDate: "2026-11-05" },
    ] satisfies ProgressEvent[];
    expect(deriveProgress(events).schedules).toEqual([
      { topicId: "topic", firstStudyDate: "2026-10-24", completedDays: [3, 7, 14], nextReview: null },
    ]);
    const restarted = deriveProgress([...events, { ...restart, ...envelope(5), localDate: "2026-11-07" }]);
    expect(restarted.schedules).toEqual([
      {
        topicId: "topic",
        firstStudyDate: "2026-11-07",
        completedDays: [],
        nextReview: { day: 3, dueDate: "2026-11-09" },
      },
    ]);
    expect(restarted.topics).toEqual([{ topicId: "topic", practiceCount: 2, lastPractisedOn: "2026-11-06" }]);
  });
});
