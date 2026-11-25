import { describe, expect, it } from "vitest";
import { answerAloudReducer, answerElapsed, initialAnswerAloudState } from "./answer-aloud-state";

describe("answer aloud state", () => {
  const listening = answerAloudReducer(initialAnswerAloudState, { type: "open", itemId: "question" });
  const take = { url: "blob:answer", durationMs: 2500 };

  it("freezes elapsed time while repeating and stops counting after Done", () => {
    const answering = answerAloudReducer(listening, { type: "answer", startedAt: 100, micIssue: null });
    const repeating = answerAloudReducer(answering, {
      type: "listen",
      elapsedMs: answerElapsed(answering, 2200),
    });
    expect(answerElapsed(repeating, 5000)).toBe(2100);
    const resumed = answerAloudReducer(repeating, { type: "answer", startedAt: 5000, micIssue: null });
    const stopped = answerAloudReducer(resumed, {
      type: "stop",
      elapsedMs: answerElapsed(resumed, 5500),
      capped: false,
    });
    expect(answerElapsed(stopped, 6000)).toBe(2600);
  });

  it("retains interrupted parts and clears them when a new question or take starts", () => {
    const stopping = answerAloudReducer(listening, { type: "stop", elapsedMs: 2500, capped: false });
    const paused = answerAloudReducer(stopping, { type: "collect", take, paused: true, micIssue: null });
    expect(paused).toMatchObject({ phase: "paused", takes: [take], elapsedMs: 2500 });
    const again = answerAloudReducer(paused, { type: "open", itemId: "question", practice: "saved" });
    expect(again).toMatchObject({ phase: "listening", takes: [], elapsedMs: 0, practice: "saved" });
    expect(answerAloudReducer(paused, { type: "close" })).toEqual(initialAnswerAloudState);
  });

  it("enters comparison after stop with or without a recording and ignores late recordings", () => {
    const stopping = answerAloudReducer(listening, { type: "stop", elapsedMs: 0, capped: true });
    const collect = { type: "collect", take: null, paused: false, micIssue: null } as const;
    expect(answerAloudReducer(stopping, collect)).toMatchObject({
      phase: "compare",
      capped: true,
      takes: [],
    });
    expect(answerAloudReducer(initialAnswerAloudState, { ...collect, take })).toEqual(
      initialAnswerAloudState,
    );
  });
});
