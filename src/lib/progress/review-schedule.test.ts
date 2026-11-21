import { describe, expect, it } from "vitest";
import { MemoryProgressStore } from "./memory-progress-store";
import { addCalendarDays, dueReviews, scheduleTopic } from "./review-schedule";

describe("spaced review", () => {
  it("uses calendar offsets of 2, 6 and 13 days and never completes a step early", () => {
    const dayOne = "2026-10-24";
    expect(scheduleTopic("topic", dayOne, [dayOne, "2026-10-25", "2026-10-25"])).toMatchObject({
      completedDays: [],
      nextReview: { day: 3, dueDate: "2026-10-26" },
    });
    expect(scheduleTopic("topic", dayOne, ["2026-10-26"])).toMatchObject({
      completedDays: [3],
      nextReview: { day: 7, dueDate: "2026-10-30" },
    });
    expect(scheduleTopic("topic", dayOne, ["2026-11-02"])).toMatchObject({
      completedDays: [3, 7],
      nextReview: { day: 14, dueDate: "2026-11-06" },
    });
    expect(scheduleTopic("topic", dayOne, ["2026-11-06"])).toMatchObject({
      completedDays: [3, 7, 14],
      nextReview: null,
    });
    expect(addCalendarDays("2028-02-28", 2)).toBe("2028-03-01");
    expect(addCalendarDays("2026-12-28", 6)).toBe("2027-01-03");
  });

  it("orders due topics by oldest due date and includes reviews due today", () => {
    const schedules = [
      scheduleTopic("future", "2026-10-25", []),
      scheduleTopic("today", "2026-10-24", []),
      scheduleTopic("old", "2026-10-20", []),
      scheduleTopic("done", "2026-10-10", ["2026-10-25"]),
    ];
    expect(dueReviews(schedules, () => new Date(2026, 9, 26, 0, 1))).toEqual([
      { topicId: "old", day: 3, dueDate: "2026-10-22" },
      { topicId: "today", day: 3, dueDate: "2026-10-26" },
    ]);
  });

  it("keeps day one and completed steps when the clock rolls back, then allows a new cycle", async () => {
    let now = new Date(2026, 9, 24, 12);
    const store = new MemoryProgressStore({ clock: () => now });
    await store.setLastOpened({ topicId: "topic", openedAt: now.toISOString() });
    expect(await store.listReviewSchedule()).toEqual({ ok: true, value: [] });

    await store.recordPractice({ topicId: "topic", kind: "shadowing" });
    now = new Date(2026, 9, 27, 12);
    await store.recordPractice({ topicId: "topic", kind: "answer-aloud" });
    now = new Date(2026, 9, 2, 12);
    await store.recordPractice({ topicId: "topic", kind: "answer-aloud" });
    await store.startReviewCycle("topic");
    expect(await store.listReviewSchedule()).toEqual({
      ok: true,
      value: [
        {
          topicId: "topic",
          firstStudyDate: "2026-10-24",
          completedDays: [3],
          nextReview: { day: 7, dueDate: "2026-10-30" },
        },
      ],
    });
    now = new Date(2026, 10, 7, 12);
    await store.recordPractice({ topicId: "topic", kind: "answer-aloud" });
    expect(await store.listReviewSchedule()).toMatchObject({
      ok: true,
      value: [{ completedDays: [3, 7, 14], nextReview: null }],
    });
    await store.startReviewCycle("topic");
    expect(await store.listReviewSchedule()).toMatchObject({
      ok: true,
      value: [
        {
          firstStudyDate: "2026-11-07",
          completedDays: [],
          nextReview: { day: 3, dueDate: "2026-11-09" },
        },
      ],
    });
    expect(await store.getTopicStudyState("topic")).toMatchObject({ ok: true, value: { practiceCount: 4 } });
  });
});
