// @vitest-environment node
import { readFileSync } from "node:fs";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { examConfig as config } from "@/lib/exam/config";
import {
  buildDelproeve2Script,
  chooseSituation,
  drawCards,
  elapsed,
  initialize,
  nextDeadline,
  preloadClipIds,
  remaining,
  transition,
} from "./index";
import type { Command, Event, Mode, Setup, State } from "./index";

const sec = (seconds: number) => seconds * 1000;
const limit = sec(config.examLimitSeconds);
const minuteNotice = limit - sec(config.oneMinuteNoticeSeconds);
const cutoff = sec(config.part1CutoffSeconds);
const handover = sec(config.part1HandoverSeconds);
const ceiling = sec(config.graceCeilingSeconds);
const grace = sec(config.graceSeconds);
const lines = config.examinerLineIds;
const modes: readonly Mode[] = ["exam", "practice"];

function readFixture(path: string): unknown {
  return JSON.parse(readFileSync(new URL(`../../../../content/${path}`, import.meta.url), "utf8"));
}

const text = z.object({ da: z.string() });
const prompt = z.object({
  id: z.string(),
  text,
  siriCheck: z.object({ siriParts: z.array(z.string()).optional() }).optional(),
  spoken: z.object({ parts: z.array(z.string()), pauseMs: z.number() }).optional(),
});
const section = z.object({ question: prompt, followups: z.array(prompt) });
const situation = section.extend({ key: z.enum(["A", "B"]), intro: prompt });
const topicSchema = z.object({
  id: z.string(),
  termId: z.string(),
  themeId: z.string(),
  letter: z.enum(["A", "B", "C"]),
  title: text,
  situations: z.tuple([situation, situation]),
  general: section,
});
const topic = topicSchema.parse(readFixture("topics/2024-maj-b.json"));
const topics = [
  topicSchema.parse(readFixture("topics/2024-maj-a.json")),
  topic,
  topicSchema.parse(readFixture("topics/2024-maj-c.json")),
];
const lineData = z.object({ lines: z.array(prompt) }).parse(readFixture("examiner-lines.json"));
const intro = `${lines.intro}:${topic.id}`;
const q2 = topic.general.question.id;
const secondFollowup = required(topic.general.followups[0]);

type WithoutAt<T> = T extends Event ? Omit<T, "at"> : never;
type Input = WithoutAt<Event>;

function required<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) throw new Error("Expected a value");
  return value;
}

function commandsOf<K extends Command["type"]>(commands: readonly Command[], name: K) {
  return commands.filter((command): command is Command & { type: K } => command.type === name);
}

const announcements = (commands: readonly Command[]) =>
  commandsOf(commands, "announce").map(({ key }) => key);
const played = (commands: readonly Command[]) => commandsOf(commands, "playClip").map(({ clipId }) => clipId);

class Harness {
  at = 10_000;
  state: State;
  log: Command[];
  last: readonly Command[];
  observations: Observation[] = [];

  constructor(mode: Mode, setup: Partial<Setup> = {}) {
    const result = initialize({
      mode,
      seed: 17,
      topics: [topic],
      attemptId: "test-attempt",
      backBehaviour: "leaveDialog",
      ...setup,
    });
    this.state = result.state;
    this.log = [...result.commands];
    this.last = result.commands;
  }

  send(input: Input, advance = 0) {
    this.at += advance;
    const event = { ...input, at: this.at };
    const result = transition(this.state, event);
    this.observations.push({ before: this.state, event, after: result.state, commands: result.commands });
    this.state = result.state;
    this.last = result.commands;
    this.log.push(...result.commands);
    return result.commands;
  }

  tick(advance: number) {
    return this.send({ type: "TICK" }, advance);
  }
  get context() {
    return this.state.context;
  }
  get clock() {
    return elapsed(this.context.examClock, this.at);
  }
  get answerMs() {
    return elapsed(this.context.answerClock, this.at);
  }
  get graceMs() {
    return this.context.grace && remaining(this.context.grace, this.at);
  }
  get play() {
    return required(commandsOf(this.log, "playClip").at(-1));
  }
  get item() {
    return required(this.context.script[this.context.cursor]);
  }
  get answer() {
    return required(this.context.answers.find(({ itemId }) => itemId === this.item.id));
  }
  get persisted() {
    return required(commandsOf(this.log, "persistAttempt").at(-1)).attempt;
  }

  clockTo(target: number) {
    expect(target).toBeGreaterThanOrEqual(this.clock);
    return this.tick(target - this.clock);
  }

  startClip() {
    const { clipId, requestId } = this.play;
    return this.send({ type: "CLIP_STARTED", clipId, requestId });
  }

  endClip(duration = 0) {
    const { clipId, requestId } = this.play;
    return this.send({ type: "CLIP_ENDED", clipId, requestId }, duration);
  }

  clip(duration = 0) {
    this.startClip();
    return this.endClip(duration);
  }

  gap() {
    return this.tick(config.examinerGapMs);
  }

  acknowledgeRecording() {
    if (this.context.recording === "starting") {
      this.send({ type: "RECORDING_STARTED", requestId: required(this.context.recordingRequest) });
    }
  }

  ready(mic: "granted" | "denied" | "skipped" = "granted") {
    if (mic === "skipped") this.send({ type: "MIC_SKIP" });
    else {
      this.send({ type: "MIC_ALLOW" });
      this.send({
        type: mic === "granted" ? "MIC_GRANTED" : "MIC_DENIED",
        requestId: required(this.context.micRequest),
      });
    }
    this.send({ type: "CONTINUE" });
    return this;
  }

  reveal(mic: "granted" | "denied" | "skipped" = "granted") {
    this.ready(mic);
    if (this.state.type === "prepare.draw") this.send({ type: "CARD_TAPPED", index: 0 });
    return this;
  }

  load() {
    this.send({ type: "ASSETS_LOADED" });
    return this;
  }
  start() {
    this.send({ type: "START" });
    return this;
  }

  look() {
    this.reveal().load().start().clip();
    return this;
  }
  speaking(mic: "granted" | "denied" | "skipped" = "granted") {
    this.reveal(mic).load().start().clip();
    this.tick(sec(config.lookSeconds));
    return this;
  }

  first(mic: "granted" | "denied" | "skipped" = "granted") {
    this.speaking(mic).clip();
    this.gap();
    this.clip();
    this.acknowledgeRecording();
    return this;
  }

  done() {
    return this.send({ type: "DONE" });
  }
  finishThanks() {
    this.clip();
    this.gap();
  }
  repeat(rate = 1) {
    return this.send({ type: "REPEAT", rate });
  }

  enterNext() {
    this.done();
    if (this.state.type !== "run.thanks") return;
    this.finishThanks();
    if (this.item.clips.length > 1) {
      this.clip();
      this.gap();
    }
    this.clip();
    this.acknowledgeRecording();
  }

  second() {
    this.enterNext();
    while (this.item.role === "firstFollowup") this.enterNext();
    expect(this.item.role).toBe("secondRequired");
    return this;
  }

  full(mic: "granted" | "denied" | "skipped") {
    this.first(mic);
    for (let count = 0; this.state.type === "run.unit.answering" && count < 10; count++) this.enterNext();
    expect(this.state.type).toBe("run.closing");
    this.clip();
    expect(this.state.type).toBe("finished");
    return this;
  }
}

describe("mock exam scenarios", () => {
  it("T1 draws one real term, reveals A once and preloads once on a duplicate tap", () => {
    const h = new Harness("exam", { topics, seed: 5 });
    h.ready();
    expect(h.state.type === "prepare.draw" && h.state.cards.map(({ letter }) => letter)).toEqual([
      "C",
      "A",
      "B",
    ]);
    const reveal = h.send({ type: "CARD_TAPPED", index: 1 });
    expect(h.context.topic?.id).toBe("2024-maj-a");
    expect(commandsOf(reveal, "preload")).toHaveLength(1);
    expect(commandsOf(reveal, "announce")).toEqual([
      {
        type: "announce",
        key: "mock.live.revealed",
        params: { letter: "A", topicName: { topicId: "2024-maj-a", field: "title" } },
      },
    ]);
    expect(h.send({ type: "CARD_TAPPED", index: 1 }, 25)).toEqual([]);
  });

  it("T2 shows slow loading at C6 and leaves Start disabled", () => {
    const h = new Harness("exam").reveal();
    h.tick(sec(config.slowLoadNoticeSeconds));
    expect(h.state).toMatchObject({ type: "prepare.reveal", status: "slow" });
    expect(nextDeadline(h.state)).toBeNull();
    expect(h.send({ type: "START" })).toEqual([]);
  });

  it("T3 writes the marker and plays U0 without starting the exam clock", () => {
    const h = new Harness("exam").reveal().load().start();
    expect(h.last).toContainEqual({
      type: "setInProgressMarker",
      marker: { attemptId: "test-attempt", mode: "exam", topicId: topic.id, startedAt: h.at },
    });
    expect(played(h.last)).toEqual([intro]);
    expect(h.context.examClock).toBeNull();
  });

  it("T4 chooses the seeded situation at C1 and starts the clock on the actual intro start", () => {
    const h = new Harness("exam").look();
    const { key } = chooseSituation(h.context.rng);
    h.tick(sec(config.lookSeconds));
    expect(h.context.situationKey).toBe(key);
    expect(h.play.clipId).toBe(topic.situations.find((sit) => sit.key === key)?.intro.id);
    expect(h.context.examClock).toBeNull();
    h.startClip();
    expect(h.context.examClock).toEqual({ elapsedMs: 0, since: h.at });
  });

  it("T5 ignores practice look controls in exam conditions", () => {
    const h = new Harness("exam").look();
    const original = h.state;
    const lookControls: Input[] = [{ type: "LOOK_PAUSE" }, { type: "LOOK_EXTEND" }, { type: "LOOK_SKIP" }];
    for (const input of lookControls) {
      h.send(input);
      expect(h.state).toBe(original);
    }
    h.tick(sec(config.lookSeconds));
    expect(h.state.type).toBe("run.unit.speaking");
  });

  it("T6 starts recording and announces the first turn after q1 ends", () => {
    const h = new Harness("exam").speaking();
    h.clip();
    h.gap();
    expect(announcements(h.startClip())).not.toContain("mock.live.yourTurnRecording");
    const end = h.endClip();
    expect(commandsOf(end, "startRecording")).toHaveLength(1);
    expect(announcements(end)).toContain("mock.live.yourTurnRecording");
    expect(h.state.type).toBe("run.unit.answering");
    h.acknowledgeRecording();
    expect(h.answer.recorded).toBe(true);
  });

  it("T7 accepts duplicate Done once in both modes", () => {
    for (const mode of modes) {
      const h = new Harness(mode).first();
      const done = h.done();
      expect(commandsOf(done, "stopRecording")).toHaveLength(1);
      expect(played(done)).toEqual([lines.thanks]);
      expect(h.send({ type: "DONE" }, 25)).toEqual([]);
      h.finishThanks();
      expect(played(h.last)).toEqual([h.item.id]);
    }
  });

  it("T8 ignores Done while the examiner speaks in both modes", () => {
    for (const mode of modes) {
      const h = new Harness(mode).speaking();
      const previous = h.state;
      expect(h.done()).toEqual([]);
      expect(h.state).toBe(previous);
    }
  });

  it("T9 repeats q1 at normal speed and leaves the exam clock running", () => {
    const h = new Harness("exam").first();
    h.clockTo(sec(70));
    const question = h.item.id;
    const commands = h.repeat();
    expect(played(commands)).toEqual([question]);
    expect(commandsOf(commands, "pauseRecording")).toHaveLength(1);
    expect(h.answer.repeats).toBe(1);
    h.clip(sec(5));
    expect(h.clock).toBe(sec(75));
    expect(h.answerMs).toBe(sec(70) - config.examinerGapMs);
  });

  it("T10 repeats the U1 situation intro and q1 as one repeat", () => {
    const h = new Harness("exam").first();
    const [first, question] = h.item.clips;
    expect(played(h.send({ type: "REPEAT_INTRO" }))).toEqual([first.id]);
    h.clip();
    expect(played(h.gap())).toEqual([question?.id]);
    h.clip();
    expect(h.answer.repeats).toBe(1);
  });

  it("T11 announces the limit during the general follow-up answer and continues recording", () => {
    const h = new Harness("exam").first().second();
    h.clockTo(limit - sec(3));
    h.enterNext();
    h.clockTo(limit - sec(1));
    expect(h.item.id).toBe(secondFollowup.id);
    expect(announcements(h.clockTo(limit))).toContain("mock.live.finishSentence");
    expect(h.graceMs).toBe(grace);
    expect(h.context.recording).toBe("recording");
  });

  it("T12 suspends grace through a nine-second replay", () => {
    const h = new Harness("exam").first().second();
    h.clockTo(limit + sec(8));
    h.repeat();
    h.clip(sec(9));
    expect(h.graceMs).toBe(grace - sec(8));
    expect(h.state.type).toBe("run.unit.answering");
  });

  it.each([
    { type: "TICK", delay: 0 },
    { type: "TICK", delay: sec(5) },
    { type: "DONE", delay: sec(5) },
  ] satisfies readonly { type: "TICK" | "DONE"; delay: number }[])(
    "T13 stops the partial take and releases the microphone before closing after C3 ($type, $delay ms late)",
    ({ type, delay }) => {
      const h = new Harness("exam").first().second();
      h.clockTo(limit - sec(3));
      h.enterNext();
      h.clockTo(limit);
      const result = h.send({ type }, grace + delay);
      expect(result.map(({ type }) => type)).toEqual([
        "stopRecording",
        "releaseMic",
        "persistAttempt",
        "clearInProgressMarker",
        "playClip",
      ]);
      expect(played(result)).toEqual([lines.closing]);
      expect(h.persisted.answers.at(-1)?.recorded).toBe(true);
      expect(h.persisted.totalMs).toBe(limit + grace);
      expect(h.clock).toBe(limit + grace);
    },
  );

  it("T14 completes a transition already playing at the limit and asks q2", () => {
    const h = new Harness("exam").first();
    h.clockTo(handover);
    h.repeat();
    h.clip(limit - handover - sec(2));
    h.done();
    h.finishThanks();
    expect(h.play.clipId).toBe(lines.transition);
    h.startClip();
    h.clockTo(limit);
    h.endClip();
    expect(played(h.gap())).toEqual([q2]);
    h.clip();
    expect(h.context.u2Asked).toBe(true);
    expect(h.graceMs).toBe(grace);
  });

  it("T15 closes after Tak when the limit lands between part-two units", () => {
    const h = new Harness("exam").first().second();
    h.clockTo(limit - sec(1));
    expect(played(h.done())).toEqual([lines.thanks]);
    h.startClip();
    h.clockTo(limit);
    expect(played(h.endClip())).toEqual([lines.closing]);
    expect(h.persisted.askedItemIds).not.toContain(secondFollowup.id);
  });

  it("T16 persists the actual elapsed time and completed status before the limit", () => {
    const h = new Harness("exam").first().second();
    h.enterNext();
    h.clockTo(sec(220));
    h.done();
    expect(h.state.type).toBe("run.closing");
    expect(h.persisted).toMatchObject({ totalMs: sec(220), status: "completed" });
  });

  it("T17 caps the recording at C5 and continues accepting the answer", () => {
    const h = new Harness("practice").first();
    h.tick(sec(config.maxRecordingSeconds - 1));
    expect(h.context.recording).toBe("recording");
    const cap = h.tick(sec(1));
    expect(commandsOf(cap, "stopRecording")).toHaveLength(1);
    expect(announcements(cap)).toEqual([]);
    expect(h.answer.recordingCapped).toBe(true);
    expect(h.state.type).toBe("run.unit.answering");
    expect(played(h.done())).toEqual([lines.thanks]);
    expect(announcements(h.clip())).toEqual(["mock.live.recordingCapped"]);
  });

  it("T18 freezes practice timers and resumes the same recording and answer", () => {
    const h = new Harness("practice").first();
    h.tick(sec(5));
    const before = h.clock;
    h.send({ type: "PAUSE" });
    h.tick(sec(300));
    expect(nextDeadline(h.state)).toBeNull();
    expect(h.clock).toBe(before);
    expect(commandsOf(h.send({ type: "RESUME" }), "resumeRecording")).toHaveLength(1);
    expect(h.answerMs).toBe(sec(5));
    expect(h.answer.recordingParts).toBe(1);
  });

  it("T19 replaces the take and resets both answer and recording timers", () => {
    const h = new Harness("practice").first();
    h.tick(sec(8));
    const result = h.send({ type: "RERECORD" });
    expect(commandsOf(result, "discardRecording")).toHaveLength(1);
    expect(h.answerMs).toBe(0);
    h.acknowledgeRecording();
    expect(nextDeadline(h.state)).toBe(h.at + sec(config.maxRecordingSeconds));
    expect(h.answer.recordingParts).toBe(1);
  });

  it("T20 freezes a hidden attempt, replays the question and starts a second part", () => {
    const h = new Harness("exam").first();
    h.enterNext();
    h.tick(sec(30));
    const frozen = h.clock;
    h.send({ type: "APP_HIDDEN" });
    h.tick(sec(60));
    expect(h.clock).toBe(frozen);
    expect(nextDeadline(h.state)).toBeNull();
    h.send({ type: "APP_VISIBLE" });
    h.send({ type: "CONTINUE_AFTER_INTERRUPTION" });
    expect(played(h.send({ type: "MIC_REACQUIRED" }))).toEqual([h.item.id]);
    h.clip();
    h.acknowledgeRecording();
    expect(h.answer.recordingParts).toBe(2);
    expect(h.answerMs).toBe(sec(30));
    expect(h.context.interrupted).toBe(true);
  });

  it("T21 persists an interrupted exam once and goes straight to review", () => {
    const h = new Harness("exam").first();
    h.send({ type: "AUDIO_INTERRUPTED" });
    const result = h.send({ type: "END_AND_REVIEW" });
    expect(h.persisted.status).toBe("interrupted");
    expect(commandsOf(result, "releaseMic")).toHaveLength(1);
    expect(commandsOf(result, "navigate")).toMatchObject([{ to: "review" }]);
    expect(h.send({ type: "END_AND_REVIEW" })).toEqual([]);
  });

  it("T22 restarts an interrupted practice with a new marker and no save", () => {
    const h = new Harness("practice").first();
    const old = h.context.marker?.attemptId;
    h.send({ type: "AUDIO_INTERRUPTED" });
    const result = h.send({ type: "RESTART" });
    expect(h.context.marker?.attemptId).not.toBe(old);
    expect(commandsOf(result, "discardAttemptRecordings")).toEqual([
      { type: "discardAttemptRecordings", attemptId: old },
    ]);
    expect(commandsOf(h.log, "persistAttempt")).toEqual([]);
    expect(played(result)).toEqual([intro]);
  });

  it("T23 reports reload loss and clears the marker without playing or requesting the microphone", () => {
    for (const mode of modes) {
      const h = new Harness(mode, {
        reloadMarker: { attemptId: "lost", mode, topicId: topic.id, startedAt: 5 },
      });
      expect(h.state).toMatchObject({ type: "prepare.getReady", reloadNotice: true });
      expect(commandsOf(h.log, "clearInProgressMarker")).toHaveLength(1);
      expect(commandsOf(h.log, "persistAttempt")).toEqual([]);
      expect(played(h.log)).toEqual([]);
      expect(commandsOf(h.log, "requestMic")).toEqual([]);
      expect(h.send({ type: "START" })).toEqual([]);
    }
  });

  it("T24 delays the first answer behind the exam leave dialog while the clock advances", () => {
    const h = new Harness("exam").speaking();
    h.clip();
    h.gap();
    h.startClip();
    h.send({ type: "LEAVE_REQUESTED" });
    h.endClip();
    const before = h.clock;
    h.tick(sec(30));
    expect(h.clock - before).toBe(sec(30));
    expect(h.context.answersStarted).toBe(0);
    expect(commandsOf(h.send({ type: "LEAVE_CANCELLED" }), "startRecording")).toHaveLength(1);
    expect(h.context.answersStarted).toBe(1);
  });

  it("T25 pauses practice when leave opens and resumes when Escape cancels", () => {
    const h = new Harness("practice").first();
    h.send({ type: "LEAVE_REQUESTED" });
    expect(h.state).toMatchObject({ type: "hold.paused", pausedByDialog: true });
    const before = h.clock;
    h.tick(sec(30));
    h.send({ type: "LEAVE_CANCELLED" });
    expect(h.state.type).toBe("run.unit.answering");
    expect(h.clock).toBe(before);
  });

  it("T26 discards without saving and releases the microphone in both modes", () => {
    for (const mode of modes) {
      const h = new Harness(mode).first();
      h.send({ type: "LEAVE_REQUESTED" });
      const result = h.send({ type: "LEAVE_CONFIRMED" });
      expect(h.state.type).toBe("left");
      expect(commandsOf(result, "discardAttemptRecordings")).toHaveLength(1);
      expect(commandsOf(result, "releaseMic")).toHaveLength(1);
      expect(commandsOf(h.log, "persistAttempt")).toEqual([]);
    }
  });

  it("T27 finishes both modes after microphone denial with the same clips and no recording commands", () => {
    for (const mode of modes) {
      const denied = new Harness(mode).full("denied");
      const granted = new Harness(mode).full("granted");
      expect(played(denied.log)).toEqual(played(granted.log));
      expect(denied.log.filter(({ type }) => type.endsWith("Recording"))).toEqual([]);
    }
  });

  it("T28 treats a microphone mute as an interruption and resumes into a second take", () => {
    const h = new Harness("exam").first();
    h.tick(sec(40));
    const frozen = h.clock;
    h.send({ type: "MIC_MUTED" });
    expect(h.state).toMatchObject({ type: "hold.interrupted", status: "choosing" });
    expect(h.context.micState).toBe("granted");
    h.tick(sec(60));
    expect(h.clock).toBe(frozen);
    const result = h.send({ type: "CONTINUE_AFTER_INTERRUPTION" });
    expect(commandsOf(result, "requestMic")).toMatchObject([{ reason: "reacquire" }]);
    expect(played(h.send({ type: "MIC_REACQUIRED" }))).toEqual([h.item.id]);
    h.clip();
    h.acknowledgeRecording();
    expect(h.answer.recordingParts).toBe(2);
    expect(h.answerMs).toBe(sec(40));
    expect(h.context.interrupted).toBe(true);
  });

  it("T29 recovers blocked U1 playback without labelling an interruption or starting early", () => {
    const h = new Harness("exam").speaking();
    h.send({ type: "PLAYBACK_BLOCKED", clipId: h.play.clipId });
    expect(h.state.type).toBe("hold.blocked");
    h.send({ type: "TAP_TO_HEAR" });
    expect(h.context.examClock).toBeNull();
    h.startClip();
    expect(h.context.examClock?.since).toBe(h.at);
    expect(h.context.interrupted).toBe(false);
  });

  it("T30 freezes during a q2 audio error and retries at the frozen clock", () => {
    const h = new Harness("exam").first();
    h.enterNext();
    h.done();
    h.finishThanks();
    h.clip();
    h.gap();
    h.clockTo(sec(130));
    h.send({ type: "CLIP_FAILED", clipId: q2 });
    expect(h.state.type).toBe("hold.audioError");
    expect(h.context.interrupted).toBe(true);
    h.tick(sec(17));
    expect(played(h.send({ type: "RETRY_AUDIO" }))).toEqual([q2]);
    h.tick(sec(3));
    expect(h.clock).toBe(sec(130));
    h.startClip();
    h.tick(sec(1));
    expect(h.clock).toBe(sec(131));
  });

  it("T31 closes after q2 in either mode when there is no general follow-up", () => {
    const noFollowups = { ...topic, general: { ...topic.general, followups: [] } };
    for (const mode of modes) {
      const h = new Harness(mode, { topics: [noFollowups] }).first().second();
      expect(played(h.done())).toEqual([lines.closing]);
      expect(h.persisted.askedItemIds.at(-1)).toBe(q2);
    }
  });

  it("T32 uses the learner's situation B in the practice script", () => {
    const h = new Harness("practice", { options: { situationPolicy: "learnerChooses" } }).look();
    h.tick(sec(config.lookSeconds));
    expect(h.state.type).toBe("run.chooseSituation");
    expect(played(h.send({ type: "SITUATION_CHOSEN", key: "B" }))).toEqual([topic.situations[1].intro.id]);
    expect(h.context.situationKey).toBe("B");
  });

  it("T33 reports failed storage once and keeps review available in both modes", () => {
    for (const mode of modes) {
      const h = new Harness(mode).full("skipped");
      const attemptId = h.persisted.attemptId;
      expect(announcements(h.send({ type: "PERSIST_FAILED", attemptId }))).toEqual(["mock.live.saveFailed"]);
      expect(h.send({ type: "PERSIST_FAILED", attemptId })).toEqual([]);
      expect(commandsOf(h.send({ type: "GO_TO_REVIEW" }), "navigate")).toMatchObject([{ to: "review" }]);
    }
  });

  it("T34 handles auto-lock as an interruption and consumes the tip on next get ready", () => {
    for (const mode of modes) {
      const h = new Harness(mode).first();
      const result = h.send({ type: "WAKE_LOCK_UNSUPPORTED" });
      expect(commandsOf(result, "savePreference")).toEqual([
        { type: "savePreference", key: "wakeLockTipPending", value: true },
      ]);
      expect(h.send({ type: "WAKE_LOCK_UNSUPPORTED" })).toEqual([]);
      h.send({ type: "APP_HIDDEN" });
      expect(h.state).toMatchObject({ type: "hold.interrupted", status: "away" });
      const next = new Harness(mode, { wakeLockTipPending: true });
      expect(next.state).toMatchObject({ wakeLockTip: true });
      expect(commandsOf(next.log, "savePreference")).toContainEqual({
        type: "savePreference",
        key: "wakeLockTipPending",
        value: false,
      });
      expect(new Harness(mode).state).toMatchObject({ wakeLockTip: false });
    }
  });

  it("T35 skips the unstarted part-one follow-up at C17 and records a neutral ID", () => {
    const h = new Harness("exam").first();
    h.clockTo(cutoff - sec(1));
    h.clockTo(cutoff + sec(25));
    expect(played(h.done())).toEqual([lines.thanks]);
    h.finishThanks();
    expect(h.play.clipId).toBe(lines.transition);
    const sit = required(topic.situations.find(({ key }) => key === h.context.situationKey));
    expect(h.context.skippedFollowups).toEqual(sit.followups.map(({ id }) => id));
    h.clip();
    h.gap();
    h.clip();
    h.clockTo(limit);
    h.done();
    expect(h.persisted.skippedFollowups).toEqual(h.context.skippedFollowups);
  });

  it("T36 finishes and answers a part-one follow-up started before C17", () => {
    const h = new Harness("exam").first();
    h.clockTo(cutoff - sec(5) - config.examinerGapMs);
    h.done();
    h.finishThanks();
    h.startClip();
    h.clockTo(cutoff);
    h.endClip();
    expect(h.item.role).toBe("firstFollowup");
    expect(h.state.type).toBe("run.unit.answering");
    h.enterNext();
    expect(h.item.role).toBe("secondRequired");
    expect(h.context.skippedFollowups).toEqual([]);
  });

  it("T37 gives q1 a single handover notice and advances to q2 when C3 expires", () => {
    const h = new Harness("exam").speaking();
    h.clip();
    h.gap();
    h.clip(sec(15) - config.examinerGapMs);
    h.acknowledgeRecording();
    const result = h.clockTo(handover);
    expect(announcements(result)).toContain("mock.live.handover");
    expect(h.graceMs).toBe(grace);
    expect(played(h.tick(grace))).toEqual([lines.thanks]);
    h.finishThanks();
    h.clip();
    h.gap();
    h.clip();
    expect(h.item.id).toBe(q2);
    expect(h.graceMs).toBeNull();
    expect(announcements(h.log).filter((key) => key === "mock.live.handover")).toHaveLength(1);
  });

  it("T38 closes hints before toggling the exam leave dialog on subsequent back presses", () => {
    for (const mode of modes) {
      const h = new Harness(mode).first();
      if (mode === "practice") {
        h.send({ type: "HINTS_OPENED" });
        h.send({ type: "BACK_PRESSED" });
        expect(h.context.sheet).toBe("none");
        expect(h.context.leaveDialog).toBe(false);
      }
      expect(commandsOf(h.send({ type: "BACK_PRESSED" }), "rearmBackGuard")).toHaveLength(1);
      expect(h.context.leaveDialog).toBe(true);
      h.send({ type: "BACK_PRESSED" });
      expect(h.context.leaveDialog).toBe(false);
      expect(h.state.type).toBe("run.unit.answering");
    }
  });

  it("T39 persists two completed answers and takes the learner to early review", () => {
    for (const mode of modes) {
      const h = new Harness(mode).first();
      h.enterNext();
      h.done();
      h.send({ type: "LEAVE_REQUESTED" });
      const result = h.send({ type: "END_AND_REVIEW" });
      expect(commandsOf(result, "persistAttempt")).toHaveLength(1);
      expect(h.persisted.status).toBe("endedEarly");
      expect(h.persisted.answers).toHaveLength(2);
      expect(commandsOf(result, "navigate")).toMatchObject([{ to: "review" }]);
    }
  });

  it("T40 saves once and returns an early-end notice when using fallback back handling", () => {
    for (const mode of modes) {
      const h = new Harness(mode, { backBehaviour: "endEarly" }).first();
      h.done();
      const result = h.send({ type: "NAVIGATED_AWAY", reason: "back" });
      expect(h.persisted.status).toBe("endedEarly");
      expect(commandsOf(result, "navigate")).toMatchObject([{ to: "mock", noticeKey: "mock.back.saved" }]);
      expect(h.send({ type: "NAVIGATED_AWAY", reason: "back" })).toEqual([]);
    }
  });

  it("T41 permits slower playback from the second repeat in practice only", () => {
    for (const mode of modes) {
      const h = new Harness(mode).first();
      expect(h.repeat(config.slowRepeatRate)).toEqual([]);
      h.repeat();
      h.clip();
      const slow = h.repeat(config.slowRepeatRate);
      if (mode === "practice")
        expect(commandsOf(slow, "playClip")).toMatchObject([{ rate: config.slowRepeatRate }]);
      else expect(slow).toEqual([]);
      expect(h.answer.slowRepeats).toBe(Number(mode === "practice"));
    }
  });

  it("T42 lets the ongoing part-one follow-up finish before granting handover time", () => {
    const h = new Harness("exam").first();
    h.done();
    h.finishThanks();
    h.startClip();
    expect(announcements(h.clockTo(handover))).not.toContain("mock.live.handover");
    expect(announcements(h.endClip(sec(4)))).toContain("mock.live.handover");
    expect(h.graceMs).toBe(grace);
    h.clockTo(handover + sec(10));
    expect(played(h.done())).toEqual([lines.thanks]);
    h.finishThanks();
    expect(h.play.clipId).toBe(lines.transition);
  });

  it("T43 suspends handover grace during a repeat and uses the remaining allowance", () => {
    const h = new Harness("exam").first();
    h.clockTo(handover + sec(6));
    h.repeat();
    h.clip(sec(8));
    expect(h.graceMs).toBe(grace - sec(6));
    expect(played(h.tick(grace - sec(6)))).toEqual([lines.thanks]);
    h.finishThanks();
    expect(h.play.clipId).toBe(lines.transition);
  });

  it("T44 gives q2 only the normal limit grace", () => {
    const h = new Harness("exam").first().second();
    h.clockTo(limit - sec(1));
    expect(h.graceMs).toBeNull();
    h.clockTo(limit);
    expect(h.graceMs).toBe(grace);
    expect(announcements(h.log)).not.toContain("mock.live.handover");
  });

  it("T45 closes when the replay ends after the grace ceiling", () => {
    const h = new Harness("exam").first().second();
    h.clockTo(limit);
    h.repeat();
    h.startClip();
    h.clockTo(ceiling);
    expect(h.context.graceCeilingReached).toBe(true);
    expect(h.graceMs).toBeNull();
    expect(played(h.endClip(sec(2)))).toEqual([lines.closing]);
    expect(h.persisted.totalMs).toBe(ceiling);
  });

  it("T46 leaves a four-minute practice answer running without exam limits", () => {
    const h = new Harness("practice").first();
    h.tick(sec(240));
    expect(h.state.type).toBe("run.unit.answering");
    expect(h.answerMs).toBe(sec(240));
    expect(h.context).toMatchObject({
      part1CutoffReached: false,
      part1HandoverReached: false,
      limitReached: false,
      graceCeilingReached: false,
    });
  });

  it("T47 shows and announces limit grace immediately with hidden timers", () => {
    const h = new Harness("exam", { timersVisible: false }).first();
    h.clockTo(cutoff);
    h.second();
    h.clockTo(limit - sec(1));
    expect(h.context.graceNotice).toBeNull();
    expect(announcements(h.tick(sec(1)))).toEqual(["mock.live.finishSentence"]);
    expect(h.context.graceNotice).toBe("limit");
    expect(h.graceMs).toBe(grace);
    expect(h.context.recording).toBe("recording");
  });

  it("T48 shows and announces the part-one handover immediately with hidden timers", () => {
    const h = new Harness("exam", { timersVisible: false }).first();
    h.clockTo(handover - sec(1));
    expect(h.context.graceNotice).toBeNull();
    expect(announcements(h.tick(sec(1)))).toEqual(["mock.live.handover"]);
    expect(h.context.graceNotice).toBe("handover");
    expect(h.graceMs).toBe(grace);
    expect(h.state.type).toBe("run.unit.answering");
  });

  it("T49 queues the one-minute notice with hidden timers and delivers it after Done", () => {
    const h = new Harness("exam", { timersVisible: false }).first();
    h.clockTo(cutoff);
    h.second();
    h.clockTo(minuteNotice - sec(1));
    expect(nextDeadline(h.state)).toBe(h.at + sec(1));
    expect(announcements(h.tick(sec(1)))).toEqual([]);
    expect(announcements(h.context.announcements)).toEqual(["mock.live.oneMinuteLeft"]);
    h.clockTo(minuteNotice + sec(15));
    expect(announcements(h.done())).toEqual([]);
    expect(announcements(h.clip())).toEqual(["mock.live.oneMinuteLeft"]);
    expect(h.context.announcements).toEqual([]);
  });

  it("T50 queues the exam recording-cap notice until after Done", () => {
    const h = new Harness("exam").first();
    const cap = h.tick(sec(config.maxRecordingSeconds));
    expect(commandsOf(cap, "stopRecording")).toHaveLength(1);
    expect(announcements(cap)).toEqual([]);
    expect(announcements(h.context.announcements)).toEqual(["mock.live.recordingCapped"]);
    expect(h.state.type).toBe("run.unit.answering");
    expect(announcements(h.done())).toEqual([]);
    expect(announcements(h.clip())).toEqual(["mock.live.recordingCapped"]);
    expect(h.context.announcements).toEqual([]);
  });

  it("T51 drops the queued one-minute notice at the limit and announces grace immediately", () => {
    const h = new Harness("exam").first();
    h.clockTo(cutoff);
    h.second();
    expect(announcements(h.clockTo(minuteNotice))).toEqual([]);
    expect(announcements(h.context.announcements)).toEqual(["mock.live.oneMinuteLeft"]);
    expect(announcements(h.clockTo(limit))).toEqual(["mock.live.finishSentence"]);
    expect(h.context.announcements).toEqual([]);
    h.done();
    expect(announcements(h.clip())).toEqual(["mock.live.examOver"]);
    expect(announcements(h.log)).not.toContain("mock.live.oneMinuteLeft");
  });
});

describe("pure core boundary cases", () => {
  it("delivers the one-minute notice in an examiner gap with hidden timers", () => {
    const h = new Harness("exam", { timersVisible: false }).first();
    h.clockTo(cutoff);
    h.done();
    h.finishThanks();
    h.startClip();
    expect(announcements(h.clockTo(minuteNotice))).toEqual([]);
    expect(announcements(h.endClip())).toEqual(["mock.live.oneMinuteLeft"]);
  });

  it("delivers queued notices after handover grace expires and examiner audio ends", () => {
    const h = new Harness("exam").first();
    expect(announcements(h.clockTo(handover))).toEqual(["mock.live.handover"]);
    expect(announcements(h.clockTo(handover + grace))).toEqual([]);
    expect(h.state.type).toBe("run.thanks");
    expect(announcements(h.clip())).toEqual(["mock.live.recordingCapped", "mock.live.oneMinuteLeft"]);
  });

  it("drops a queued recording cap when the learner replaces the take", () => {
    const h = new Harness("practice").first();
    h.tick(sec(config.maxRecordingSeconds));
    expect(announcements(h.send({ type: "RERECORD" }))).toEqual([]);
    h.acknowledgeRecording();
    h.done();
    expect(announcements(h.clip())).toEqual(["mock.live.rerecording"]);
  });

  it("drops the queued pause notice on resume and defers the resume notice until Done", () => {
    const h = new Harness("practice").first();
    expect(announcements(h.send({ type: "PAUSE" }))).toEqual([]);
    expect(announcements(h.send({ type: "RESUME" }))).toEqual([]);
    h.done();
    expect(announcements(h.clip())).toEqual(["mock.live.resumed"]);
  });

  it("uses the authored fixed-line IDs and the original audio asset for the spoken follow-up", () => {
    expect(lineData.lines.map(({ id }) => id)).toEqual(expect.arrayContaining(Object.values(lines)));
    const script = buildDelproeve2Script(topic, "A");
    const followup = required(script.find(({ role }) => role === "secondFollowup"));
    expect(followup.clips).toEqual([
      {
        id: secondFollowup.id,
        textDa: secondFollowup.text.da,
        spoken: {
          question: secondFollowup.siriCheck?.siriParts?.[0],
          pauseMs: 800,
          ending: "Hvorfor eller hvorfor ikke?",
        },
      },
    ]);
    expect(preloadClipIds(topic)).toHaveLength(12);
    expect(preloadClipIds(topic)).toContain(topic.situations[1].intro.id);
    expect(preloadClipIds(topic)).toContain(lines.thanks);
  });

  it("draws unique published topics in small fallback pools and limits theme draws", () => {
    expect(drawCards([topics[0] ?? topic, topic, topic], { type: "draw" }, 1).cards).toHaveLength(2);
    expect(
      drawCards(topics, { type: "drawFromTheme", themeId: topic.themeId }, 1).cards.every(
        ({ themeId }) => themeId === topic.themeId,
      ),
    ).toBe(true);
  });
});

interface Observation {
  before: State;
  event: Event;
  after: State;
  commands: readonly Command[];
}

const noise: readonly Input[] = [
  { type: "DONE" },
  { type: "REPEAT", rate: 1 },
  { type: "REPEAT", rate: config.slowRepeatRate },
  { type: "REPEAT_INTRO" },
  { type: "PAUSE" },
  { type: "RESUME" },
  { type: "RERECORD" },
  { type: "LOOK_PAUSE" },
  { type: "LOOK_RESUME" },
  { type: "LOOK_SKIP" },
  { type: "LOOK_EXTEND" },
  { type: "HINTS_OPENED" },
  { type: "HINTS_CLOSED" },
  { type: "LEAVE_REQUESTED" },
  { type: "LEAVE_CANCELLED" },
  { type: "BACK_PRESSED" },
  { type: "APP_HIDDEN" },
  { type: "APP_VISIBLE" },
  { type: "AUDIO_INTERRUPTED" },
  { type: "MIC_MUTED" },
  { type: "MIC_ENDED" },
  { type: "SHOW_TEXT" },
  { type: "HIDE_TEXT" },
  { type: "TIMERS_TOGGLED" },
  { type: "WAKE_LOCK_LOST" },
  { type: "WAKE_LOCK_UNSUPPORTED" },
  { type: "INSTRUCTION_SKIP" },
  { type: "CARD_TAPPED", index: 0 },
  { type: "START" },
];

const move = fc.record({
  wait: fc.oneof(fc.integer({ min: 0, max: 1000 }), fc.integer({ min: 0, max: sec(110) })),
  action: fc.integer({ min: 0, max: 99 }),
});
const moves = fc.array(move, { minLength: 20, maxLength: 90 });

function forward(h: Harness, action = 0) {
  if (h.context.pageHidden) h.send({ type: "APP_VISIBLE" });
  if (h.context.leaveDialog) h.send({ type: "LEAVE_CANCELLED" });
  const state = h.state;
  switch (state.type) {
    case "prepare.getReady":
      h.ready(action % 2 === 0 ? "granted" : "denied");
      return;
    case "prepare.instruction":
    case "run.closing":
      h.clip();
      return;
    case "prepare.draw":
      h.send({ type: "CARD_TAPPED", index: action % state.cards.length });
      return;
    case "prepare.reveal":
      if (state.status === "loaded") h.start();
      else if (state.status === "failed") h.send({ type: "RETRY_LOAD" });
      else h.load();
      return;
    case "run.look": {
      const deadline = nextDeadline(state);
      if (deadline === null) h.send({ type: "LOOK_RESUME" });
      else h.tick(Math.max(0, deadline - h.at));
      return;
    }
    case "run.chooseSituation":
      h.send({ type: "SITUATION_CHOSEN", key: action % 2 === 0 ? "A" : "B" });
      return;
    case "run.introLine":
    case "run.unit.speaking":
    case "run.unit.repeating":
    case "run.thanks": {
      const playback = state.audio.playback;
      if (playback.phase === "pending") h.startClip();
      if (playback.phase === "playing") h.endClip();
      if (playback.phase === "gap") h.tick(Math.max(0, required(playback.timer.deadline) - h.at));
      return;
    }
    case "run.unit.answering":
      if (h.context.micRequest !== null)
        h.send({ type: action % 2 === 0 ? "MIC_REACQUIRED" : "MIC_REACQUIRE_FAILED" });
      else if (h.context.recording === "starting") h.acknowledgeRecording();
      else h.done();
      return;
    case "hold.paused":
      h.send({ type: "RESUME" });
      return;
    case "hold.blocked":
    case "hold.audioError":
      if (state.retryId === null)
        h.send({ type: state.type === "hold.blocked" ? "TAP_TO_HEAR" : "RETRY_AUDIO" });
      else h.startClip();
      return;
    case "hold.interrupted":
      if (state.reacquiring) h.send({ type: action % 2 === 0 ? "MIC_REACQUIRED" : "MIC_REACQUIRE_FAILED" });
      else h.send({ type: "CONTINUE_AFTER_INTERRUPTION" });
      return;
    case "finished":
      h.send({ type: "GO_TO_REVIEW" });
      return;
    case "left":
      return;
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}

function exercise(h: Harness, steps: readonly { wait: number; action: number }[]) {
  for (const { wait, action } of steps) {
    h.tick(wait);
    if (action < 59) forward(h, action);
    else if (action < 65 && "audio" in h.state) {
      // Report real pending media failures as well as random platform and user events.
      const audio = h.state.audio;
      const clip = audio.clips[audio.index];
      if (clip && (audio.playback.phase === "pending" || audio.playback.phase === "playing"))
        h.send({
          type: action % 2 === 0 ? "CLIP_FAILED" : "PLAYBACK_BLOCKED",
          clipId: clip.id,
          requestId: audio.playback.requestId,
        });
    } else {
      const input = noise[action % noise.length];
      if (input) h.send(input);
    }
  }
  return h;
}

const modeArb = fc.constantFrom<Mode>("exam", "practice");

function randomRuns(seed: number, verify: (h: Harness) => void, setup?: (mode: Mode) => Harness) {
  fc.assert(
    fc.property(modeArb, moves, (mode, steps) => {
      verify(exercise(setup?.(mode) ?? new Harness(mode), steps));
    }),
    { seed, numRuns: 65 },
  );
}

describe("mock exam invariants (fixed-seed properties)", () => {
  it("I1 records only while answering and keeps playback and recording disjoint", () => {
    randomRuns(
      101,
      (h) => {
        for (const { after, commands } of h.observations) {
          if (after.context.recording === "recording" || after.context.recording === "starting") {
            expect(after.type).toBe("run.unit.answering");
            expect(played(commands)).toHaveLength(0);
          }
          if (commandsOf(commands, "startRecording").length > 0)
            expect(after.type).toBe("run.unit.answering");
        }
      },
      (mode) => new Harness(mode).first(),
    );
  });

  it("I2 never starts overlapping clips on random media and user events", () => {
    randomRuns(102, (h) => {
      let playingId: number | null = null;
      for (const { event, commands } of h.observations) {
        if (event.type === "CLIP_STARTED" && event.requestId !== undefined) {
          expect(playingId).toBeNull();
          playingId = event.requestId;
        }
        if ("clipId" in event && event.type !== "CLIP_STARTED" && event.requestId === playingId)
          playingId = null;
        for (const command of commands) {
          if (command.type === "stopAudio" || command.type === "pauseAudio") playingId = null;
          if (command.type === "playClip") expect(playingId).toBeNull();
        }
      }
    });
  });

  it("I3 freezes a started exam clock only for technical holds, the ceiling or termination", () => {
    randomRuns(
      103,
      (h) => {
        for (const { after } of h.observations) {
          if (after.context.mode === "exam" && after.context.examClock?.since === null) {
            expect(
              after.context.graceCeilingReached ||
                [
                  "hold.interrupted",
                  "hold.audioError",
                  "hold.blocked",
                  "run.closing",
                  "finished",
                  "left",
                ].includes(after.type),
            ).toBe(true);
          }
        }
      },
      (mode) => new Harness(mode).first(),
    );
  });

  it("I4 starts neither late follow-ups nor any new post-limit unit except required q2", () => {
    randomRuns(
      104,
      (h) => {
        for (const { before, event, after } of h.observations) {
          if (
            after.context.mode !== "exam" ||
            event.type !== "CLIP_STARTED" ||
            after.type !== "run.unit.speaking" ||
            !after.context.unitStarted ||
            before.context.unitStarted
          )
            continue;
          const unit = after.context.script[after.context.cursor];
          if (after.context.limitReached) expect(unit?.role).toBe("secondRequired");
          if (after.context.part1CutoffReached) expect(unit?.role).not.toBe("firstFollowup");
        }
      },
      (mode) => new Harness(mode).first(),
    );
  });

  it("I5 accepts only specified exits from an active answer, with no practice time exit", () => {
    randomRuns(
      105,
      (h) => {
        for (const { before, event, after } of h.observations) {
          if (before.type !== "run.unit.answering" || after.type === "run.unit.answering") continue;
          if (after.type === "left" || after.type.startsWith("hold.")) continue;
          if (after.type === "run.unit.repeating") expect(["REPEAT", "REPEAT_INTRO"]).toContain(event.type);
          else if (before.waitingToAdvance) expect(["LEAVE_CANCELLED", "BACK_PRESSED"]).toContain(event.type);
          else if (event.type !== "DONE") {
            expect(before.context.mode).toBe("exam");
            const clock = elapsed(before.context.examClock, event.at);
            const partOne = !before.context.u2Asked;
            const graceDue = before.context.grace?.deadline;
            const threshold = partOne ? handover : limit;
            expect(
              graceDue !== undefined && graceDue !== null ? event.at >= graceDue : clock >= threshold + grace,
            ).toBe(true);
          }
        }
      },
      (mode) => new Harness(mode).first(),
    );
  });

  it("I6 applies each Done once to the same answer under rapid duplication", () => {
    randomRuns(
      106,
      (h) => {
        for (const { before, after, event } of h.observations) {
          if (
            event.type !== "DONE" ||
            before.type !== "run.unit.answering" ||
            after.type === "run.unit.answering"
          )
            continue;
          const duplicate = transition(after, { type: "DONE", at: event.at });
          expect(duplicate.state).toBe(after);
          expect(duplicate.commands).toEqual([]);
        }
      },
      (mode) => new Harness(mode).first(),
    );
  });

  it("I7 releases the microphone on closing, leaving and navigation", () => {
    randomRuns(
      107,
      (h) => {
        if (h.state.type !== "left") h.send({ type: "NAVIGATED_AWAY", reason: "route" });
        for (const { before, after, commands } of h.observations) {
          if (before.type !== after.type && (after.type === "run.closing" || after.type === "left")) {
            expect(commandsOf(commands, "releaseMic")).toHaveLength(1);
          }
          if (after.type === "finished") expect(after.context.micRequest).toBeNull();
        }
      },
      (mode) => new Harness(mode).first(),
    );
  });

  it("I8 persists eligible ends once and never saves discarded attempts", () => {
    fc.assert(
      fc.property(
        modeArb,
        moves,
        fc.constantFrom("complete", "leave", "review", "back", "restart", "reload"),
        (mode, steps, exit) => {
          const h = new Harness(mode, {
            backBehaviour: exit === "back" ? "endEarly" : "leaveDialog",
          }).first();
          const original = h.context.marker?.attemptId;
          if (exit === "leave") h.send({ type: "LEAVE_CONFIRMED" });
          if (exit === "review") {
            h.send({ type: "LEAVE_REQUESTED" });
            h.send({ type: "END_AND_REVIEW" });
          }
          if (exit === "back") h.send({ type: "NAVIGATED_AWAY", reason: "back" });
          if (exit === "restart") {
            h.send({ type: "AUDIO_INTERRUPTED" });
            h.send({ type: "RESTART" });
          }
          if (exit === "reload") {
            const reloaded = initialize({
              mode,
              seed: 3,
              topics: [topic],
              attemptId: "next",
              reloadMarker: required(h.context.marker),
            });
            expect(commandsOf(reloaded.commands, "persistAttempt")).toEqual([]);
          }
          if (exit === "complete") {
            for (let step = 0; step < 40 && h.state.type !== "finished"; step++) forward(h);
            expect(h.state.type).toBe("finished");
          }
          if (exit !== "reload") exercise(h, steps);
          const saves = commandsOf(h.log, "persistAttempt").map(({ attempt }) => attempt.attemptId);
          expect(new Set(saves).size).toBe(saves.length);
          expect(saves.filter((id) => id === original)).toHaveLength(
            exit === "complete" || exit === "back" || exit === "review" ? 1 : 0,
          );
        },
      ),
      { seed: 108, numRuns: 90 },
    );
  });

  it("I9 plays the same baseline clips in both modes for seeded draws and randomized pacing", () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.array(fc.integer({ min: 0, max: 3000 }), { minLength: 36, maxLength: 40 }),
        (seed, durations) => {
          function playMode(mode: Mode) {
            const h = new Harness(mode, { seed });
            for (const duration of durations) {
              h.tick(duration);
              forward(h);
            }
            for (let index = 0; index < 36 && h.state.type !== "finished"; index++) forward(h);
            expect(h.state.type).toBe("finished");
            return played(h.log);
          }
          expect(playMode("practice")).toEqual(playMode("exam"));
        },
      ),
      { seed: 109, numRuns: 65 },
    );
  });

  it("I10 ignores all practice-only events in exam at random phases", () => {
    const practiceOnly: Input[] = [
      { type: "PAUSE" },
      { type: "RERECORD" },
      { type: "LOOK_PAUSE" },
      { type: "LOOK_EXTEND" },
      { type: "LOOK_SKIP" },
      { type: "HINTS_OPENED" },
      { type: "HINTS_CLOSED" },
    ];
    randomRuns(
      110,
      (h) => {
        for (const { after, event } of h.observations)
          for (const input of practiceOnly) {
            const result = transition(after, { ...input, at: event.at });
            expect(result.state).toBe(after);
            expect(result.commands).toEqual([]);
          }
      },
      () => new Harness("exam"),
    );
  });

  it("I11 ties the first clock start to the actual U1 situation intro callback", () => {
    randomRuns(111, (h) => {
      for (const { before, event, after } of h.observations) {
        if (before.context.examClock || !after.context.examClock) continue;
        expect(after.context.examClock.since).toBe(event.at);
        const sit = topic.situations.find(({ key }) => key === after.context.situationKey);
        expect(event).toMatchObject({ type: "CLIP_STARTED", clipId: sit?.intro.id });
      }
    });
  });

  it("I12 emits neither grades, scores, judgements nor punitive labels", () => {
    randomRuns(112, (h) => {
      const banned = /"(grade|score|judgement|judgment|passed|failed)"\s*:/i;
      expect(JSON.stringify(h.log)).not.toMatch(banned);
      for (const { attempt } of commandsOf(h.log, "persistAttempt")) {
        expect(["completed", "interrupted", "endedEarly"]).toContain(attempt.status);
      }
    });
  });

  it("I13 runs through the full script for randomized denied or skipped microphone runs", () => {
    fc.assert(
      fc.property(
        modeArb,
        fc.constantFrom("denied", "skipped"),
        fc.integer(),
        moves,
        (mode, mic, seed, steps) => {
          for (const microphone of [mic, "granted"] satisfies ("granted" | typeof mic)[]) {
            const h = new Harness(mode, { seed }).first(microphone);
            for (const { action, wait } of steps) {
              h.tick(wait % 2500);
              forward(h, action);
            }
            for (let index = 0; index < 36 && h.state.type !== "finished"; index++) forward(h);
            expect(h.state.type).toBe("finished");
            if (microphone !== "granted")
              expect(h.log.filter(({ type }) => type.endsWith("Recording"))).toHaveLength(0);
            expect(played(h.log)).toEqual(played(new Harness(mode, { seed }).full("granted").log));
          }
        },
      ),
      { seed: 113, numRuns: 65 },
    );
  });

  it("I14 has asked required q2 on every exam run that enters closing", () => {
    randomRuns(
      114,
      (h) => {
        for (let step = 0; step < 45 && h.state.type !== "left" && h.state.type !== "finished"; step++)
          forward(h);
        expect(h.state.type).toBe("finished");
        for (const { attempt } of commandsOf(h.log, "persistAttempt"))
          expect(attempt.askedItemIds).toContain(q2);
      },
      () => new Harness("exam").first(),
    );
  });

  it("I15 neither starts a clip nor enters a new answer behind the exam leave dialog", () => {
    randomRuns(
      115,
      (h) => {
        for (const { before, after, commands } of h.observations) {
          if (!after.context.leaveDialog) continue;
          expect(played(commands)).toHaveLength(0);
          expect(after.context.answersStarted).toBe(before.context.answersStarted);
          if (after.type === "run.unit.answering") expect(before.type).toBe("run.unit.answering");
        }
      },
      () => new Harness("exam").speaking(),
    );
  });

  it("I16 cannot end an attempt by any sequence of guarded Back presses alone", () => {
    fc.assert(
      fc.property(
        modeArb,
        moves,
        fc.array(fc.integer({ min: 0, max: sec(60) }), { minLength: 1, maxLength: 25 }),
        (mode, steps, offsets) => {
          const h = exercise(new Harness(mode).first(), steps.slice(0, 12));
          for (const offset of offsets) {
            const armed = h.context.marker !== null || h.state.type === "run.closing";
            h.send({ type: "BACK_PRESSED" }, offset);
            if (armed) expect(commandsOf(h.last, "rearmBackGuard")).toHaveLength(1);
            expect(h.state.type).not.toBe("left");
            expect(commandsOf(h.last, "navigate")).toHaveLength(0);
          }
          expect(
            commandsOf(h.log, "persistAttempt").every(({ attempt }) => attempt.status !== "endedEarly"),
          ).toBe(true);
        },
      ),
      { seed: 116, numRuns: 65 },
    );
  });

  it("I17 never treats a mic mute or end as a failed reopen or recorder failure", () => {
    randomRuns(
      117,
      (h) => {
        for (const { before, event, after } of h.observations) {
          if (
            before.type === "run.unit.answering" &&
            (event.type === "MIC_MUTED" || event.type === "MIC_ENDED")
          ) {
            expect(after.context.micState).toBe(before.context.micState);
          }
          if (after.context.micState === "unavailable" && before.context.micState === "granted") {
            expect(["RECORDING_FAILED", "MIC_REACQUIRE_FAILED"]).toContain(event.type);
          }
        }
      },
      (mode) => new Harness(mode).first(),
    );
  });

  it("I18 bounds part-one answering by C3 after handover and takes q2 next", () => {
    fc.assert(
      fc.property(fc.array(move, { minLength: 0, maxLength: 15 }), (steps) => {
        const h = new Harness("exam").first();
        h.clockTo(handover);
        const itemId = h.item.id;
        const atHandover = h.answerMs;
        for (const { wait, action } of steps) {
          if (h.state.type !== "run.unit.answering" || h.item.id !== itemId) break;
          if (action % 2 === 0) {
            h.repeat();
            if (h.state.context.graceCeilingReached) break;
            h.clip(wait % sec(3));
          } else h.tick(wait % sec(3));
        }
        if (h.state.type === "run.unit.answering") h.tick(grace);
        expect(h.context.answers.find((answer) => answer.itemId === itemId)?.answerMs).toBeLessThanOrEqual(
          atHandover + grace,
        );
        expect(h.state.type).toBe("run.thanks");
        h.finishThanks();
        expect(h.item.role).toBe("secondRequired");
      }),
      { seed: 118, numRuns: 65 },
    );
  });

  it("I19 grants handover at most once per attempt and only before q2 is asked", () => {
    randomRuns(
      119,
      (h) => {
        const counts = new Map<string, number>();
        for (const { before, after } of h.observations) {
          if (before.context.handoverGraceStarted || !after.context.handoverGraceStarted) continue;
          expect(after.context.u2Asked).toBe(false);
          const id = required(after.context.marker?.attemptId);
          counts.set(id, (counts.get(id) ?? 0) + 1);
          expect(counts.get(id)).toBe(1);
        }
      },
      () => {
        const h = new Harness("exam").first();
        h.clockTo(handover - 1);
        return h;
      },
    );
  });

  it("I20 cannot suspend grace after C22 and closes at Done or replay end", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        fc.array(move, { minLength: 0, maxLength: 15 }),
        (atReplayEnd, partOne, steps) => {
          const h = new Harness("exam").first();
          if (!partOne) h.second();
          h.clockTo(partOne ? handover : limit);
          for (const { wait } of steps) {
            h.repeat();
            h.clip(wait % sec(2));
          }
          if (!atReplayEnd && !partOne) {
            // A long started question can first enter its answer after the ceiling.
            const other = new Harness("exam").first();
            other.clockTo(cutoff);
            other.done();
            other.finishThanks();
            other.startClip();
            other.clockTo(ceiling);
            other.endClip();
            other.gap();
            other.clip();
            expect(other.context.graceCeilingReached).toBe(true);
            expect(other.repeat()).toEqual([]);
            expect(played(other.done())).toEqual([lines.closing]);
            return;
          }
          h.repeat();
          h.startClip();
          h.clockTo(ceiling);
          expect(h.graceMs).toBeNull();
          expect(h.clock).toBe(ceiling);
          h.endClip();
          if (partOne) {
            h.finishThanks();
            h.clip();
            h.gap();
            h.clip();
            expect(h.repeat()).toEqual([]);
            h.done();
          }
          expect(h.state.type).toBe("run.closing");
          expect(h.persisted.totalMs).toBe(ceiling);
        },
      ),
      { seed: 120, numRuns: 65 },
    );
  });

  it("I21 delivers all three exam warnings with hidden timers", () => {
    fc.assert(
      fc.property(
        fc.nat(),
        fc.integer({ min: 1, max: sec(5) }),
        fc.integer({ min: 0, max: limit - minuteNotice - config.examinerGapMs - 1 }),
        (seed, lead, answerTime) => {
          const setup = { seed, timersVisible: false };
          const partOne = new Harness("exam", setup).first();
          expect(announcements(partOne.clockTo(handover - lead))).toEqual([]);
          expect(announcements(partOne.tick(lead))).toEqual(["mock.live.handover"]);

          const partTwo = new Harness("exam", setup).first();
          partTwo.clockTo(cutoff);
          partTwo.second();
          expect(announcements(partTwo.clockTo(minuteNotice - lead))).toEqual([]);
          expect(nextDeadline(partTwo.state)).toBe(partTwo.at + lead);
          expect(announcements(partTwo.tick(lead))).toEqual([]);
          expect(announcements(partTwo.context.announcements)).toEqual(["mock.live.oneMinuteLeft"]);
          partTwo.send({ type: "DONE" }, answerTime);
          expect(announcements(partTwo.clip())).toEqual(["mock.live.oneMinuteLeft"]);
          partTwo.gap();
          partTwo.clip();
          expect(announcements(partTwo.clockTo(limit))).toEqual(["mock.live.finishSentence"]);
        },
      ),
      { seed: 121, numRuns: 65 },
    );
  });

  it("I22 delivers only entry and grace notices live and defers answer notices through repeats", () => {
    randomRuns(122, (h) => {
      for (const { before, after, commands } of h.observations) {
        if (after.type !== "run.unit.answering" || after.waitingToAdvance) continue;
        for (const key of announcements(commands)) {
          if (key === "mock.live.yourTurn" || key === "mock.live.yourTurnRecording") {
            expect(after.context.answersStarted).toBe(before.context.answersStarted + 1);
          } else expect(["mock.live.handover", "mock.live.finishSentence"]).toContain(key);
        }
      }
    });

    fc.assert(
      fc.property(modeArb, fc.nat(), fc.integer({ min: 0, max: sec(5) }), (mode, seed, replayTime) => {
        const capped = new Harness(mode, { seed }).first();
        expect(announcements(capped.tick(sec(config.maxRecordingSeconds)))).toEqual([]);
        expect(announcements(capped.repeat())).toEqual([]);
        expect(announcements(capped.clip(replayTime))).toEqual([]);
        expect(announcements(capped.done())).toEqual([]);
        expect(announcements(capped.clip())).toEqual(["mock.live.recordingCapped"]);

        const failed = new Harness(mode, { seed }).speaking();
        failed.clip();
        failed.gap();
        failed.clip();
        const requestId = required(failed.context.recordingRequest);
        expect(announcements(failed.send({ type: "RECORDING_FAILED", requestId }))).toEqual([]);
        expect(announcements(failed.context.announcements)).toEqual(["mock.live.notRecording"]);
        expect(announcements(failed.done())).toEqual([]);
        expect(announcements(failed.clip())).toEqual(["mock.live.notRecording"]);
      }),
      { seed: 122, numRuns: 65 },
    );
  });
});

describe("media and deadline races", () => {
  it("keeps the exam look countdown running behind the leave dialog", () => {
    const h = new Harness("exam").reveal().load().start();
    h.startClip();
    h.send({ type: "LEAVE_REQUESTED" });
    h.endClip();
    expect(h.state.type).toBe("run.look");
    expect(played(h.tick(sec(config.lookSeconds)))).toEqual([]);
    expect(h.context.situationKey).not.toBeNull();
    expect(played(h.send({ type: "LEAVE_CANCELLED" }))).toEqual([h.item.clips[0].id]);
    expect(announcements(h.clip())).toEqual(["mock.live.lookEnded", "mock.live.situationChosen"]);
  });

  it("ignores stale audio callbacks even when a real deadline is due", () => {
    const h = new Harness("exam").speaking();
    h.clip();
    const before = h.state;
    expect(
      h.send({ type: "CLIP_ENDED", clipId: "stale", requestId: h.play.requestId }, config.examinerGapMs),
    ).toEqual([]);
    expect(h.state).toBe(before);
    expect(played(h.tick(0))).toEqual([h.item.id]);
  });

  it("does not schedule a part-one follow-up when a late gap tick also crosses C17", () => {
    const h = new Harness("exam").first();
    h.clockTo(cutoff - config.examinerGapMs - 1);
    h.done();
    h.clip();
    expect(played(h.tick(config.examinerGapMs + 2))).toEqual([lines.transition]);
    expect(h.context.skippedFollowups).toHaveLength(1);
  });

  it("drains the exam limit before Back or Cancel can play a deferred follow-up", () => {
    const h = new Harness("exam").first().second();
    h.clockTo(limit - sec(2));
    h.done();
    h.finishThanks();
    expect(played(h.send({ type: "LEAVE_REQUESTED" }))).toEqual([]);
    expect(h.item.id).toBe(secondFollowup.id);
    expect(h.state).toMatchObject({ type: "run.unit.speaking", audio: { playback: { phase: "deferred" } } });

    const at = h.at + sec(3);
    const cancel = transition(h.state, { type: "LEAVE_CANCELLED", at });
    const back = transition(h.state, { type: "BACK_PRESSED", at });
    expect(cancel.state.type).toBe("run.closing");
    expect(back.state).toEqual(cancel.state);
    expect(back.commands).toEqual([{ type: "rearmBackGuard" }, ...cancel.commands]);
    expect(played(back.commands)).toEqual([lines.closing]);

    const tick = transition(h.state, { type: "TICK", at });
    expect(tick.state.context.leaveDialog).toBe(true);
    expect(tick.state.type).not.toBe("run.unit.answering");
    expect(played(tick.commands)).toEqual([]);
    expect(transition(tick.state, { type: "LEAVE_CANCELLED", at })).toEqual(cancel);
  });

  it("does not play a closing clip or commit the attempt until an open leave dialog is cancelled", () => {
    const h = new Harness("exam").first().second();
    h.clockTo(limit);
    h.send({ type: "LEAVE_REQUESTED" });
    expect(played(h.tick(grace + sec(2)))).toEqual([]);
    expect(commandsOf(h.log, "persistAttempt")).toHaveLength(0);
    expect(played(h.send({ type: "LEAVE_CANCELLED" }, sec(3)))).toEqual([lines.closing]);
    expect(h.persisted.totalMs).toBe(limit + grace + sec(5));
    expect(h.clock).toBe(h.persisted.totalMs);
  });

  it("handles interruption during a practice leave dialog without advancing frozen timers", () => {
    const h = new Harness("practice").first();
    h.tick(sec(10));
    h.send({ type: "LEAVE_REQUESTED" });
    const clock = h.clock;
    h.tick(sec(30));
    h.send({ type: "APP_HIDDEN" });
    expect(h.state).toMatchObject({ type: "hold.interrupted", status: "away" });
    expect(h.context.leaveDialog).toBe(false);
    expect(h.clock).toBe(clock);
    h.send({ type: "APP_VISIBLE" });
    expect(h.state).toMatchObject({ status: "choosing" });
  });

  it("keeps the first recording part when the track ends during a repeat", () => {
    const h = new Harness("practice").first();
    h.tick(sec(10));
    h.repeat();
    expect(commandsOf(h.send({ type: "MIC_ENDED" }), "stopRecording")).toHaveLength(1);
    expect(h.state.type).toBe("run.unit.repeating");
    h.clip();
    expect(commandsOf(h.last, "requestMic")).toMatchObject([{ reason: "reacquire" }]);
    const result = h.send({ type: "MIC_REACQUIRED" });
    expect(commandsOf(result, "startRecording")).toHaveLength(1);
    expect(commandsOf(result, "resumeRecording")).toHaveLength(0);
    h.acknowledgeRecording();
    expect(h.answer.recordingParts).toBe(2);
    expect(nextDeadline(h.state)).toBe(h.at + sec(config.maxRecordingSeconds - 10));
  });

  it("rearms guarded Back during the closing clip and announces completion on return", () => {
    const h = new Harness("exam").first().second();
    h.enterNext();
    h.done();
    expect(h.state.type).toBe("run.closing");
    expect(commandsOf(h.send({ type: "BACK_PRESSED" }), "rearmBackGuard")).toHaveLength(1);
    expect(h.state.type).toBe("run.closing");
    expect(announcements(h.send({ type: "APP_HIDDEN" }))).toEqual([]);
    expect(h.state.type).toBe("finished");
    expect(announcements(h.send({ type: "APP_VISIBLE" }))).toContain("mock.live.examOver");
  });

  it("honours authored spoken parts while keeping the displayed wording and asset ID", () => {
    const spoken = {
      parts: [required(secondFollowup.siriCheck?.siriParts?.[0]), "Hvorfor eller hvorfor ikke?"],
      pauseMs: 800,
    };
    const withOverride = {
      ...topic,
      general: { ...topic.general, followups: [{ ...secondFollowup, spoken }] },
    };
    const script = buildDelproeve2Script(withOverride, "B");
    expect(script.find(({ role }) => role === "secondFollowup")?.clips).toEqual([
      {
        id: secondFollowup.id,
        textDa: secondFollowup.text.da,
        spoken: { question: spoken.parts[0], ending: spoken.parts[1], pauseMs: spoken.pauseMs },
      },
    ]);
  });
});
