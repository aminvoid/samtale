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
});
