import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { RecorderError, type RecorderSignal } from "@/lib/audio/recorder";
import { examConfig } from "@/lib/exam/config";
import type { RecordingStore } from "@/lib/progress/recording-store";
import { SettingsSchema } from "@/lib/progress/schema";
import type { MockTopic } from "../machine";
import { createSessionRecordings } from "./adapters/session-recordings";
import type { AudioPort, MockExamPorts, VisibilityPort } from "./ports";
import type { MockExamSetup } from "./runtime";
import { useMockExam, type MockExamAction } from "./use-mock-exam";

function topic(letter: MockTopic["letter"]): MockTopic {
  const id = `test-${letter}`;
  const prompt = (suffix: string) => ({ id: `${id}.${suffix}`, text: { da: suffix } });
  return {
    id,
    termId: "term",
    themeId: "theme",
    letter,
    title: { da: id },
    situations: [
      { key: "A", intro: prompt("a.intro"), question: prompt("a.question"), followups: [] },
      { key: "B", intro: prompt("b.intro"), question: prompt("b.question"), followups: [] },
    ],
    general: { question: prompt("general.question"), followups: [] },
  };
}

const topics = [topic("A"), topic("B"), topic("C")];

function fakeClock() {
  let time = 1700000000000;
  let timer: { at: number; run: () => void } | undefined;
  return {
    now: () => time,
    setTimeout(callback: () => void, delayMs: number) {
      if (timer !== undefined) throw new Error("Only one deadline can be armed");
      const pending = { at: time + delayMs, run: callback };
      timer = pending;
      return () => {
        if (timer === pending) timer = undefined;
      };
    },
    advance(ms: number) {
      const until = time + ms;
      while (timer !== undefined && timer.at <= until) {
        const due = timer;
        time = due.at;
        timer = undefined;
        due.run();
      }
      time = until;
    },
    hasTimer: () => timer !== undefined,
  };
}

function fakePorts() {
  const clock = fakeClock();
  let audioSignal: Parameters<AudioPort["play"]>[2] | undefined;
  let recorderSignal: ((signal: RecorderSignal) => void) | undefined;
  let pageSignal: Parameters<VisibilityPort["subscribe"]>[0] | undefined;
  let visible = true;

  const recordingStore = {
    getAttemptRecordings: vi
      .fn<RecordingStore["getAttemptRecordings"]>()
      .mockResolvedValue({ ok: true, value: null }),
    putAttemptRecordings: vi.fn<RecordingStore["putAttemptRecordings"]>().mockResolvedValue({ ok: true }),
    deleteAttemptRecordings: vi
      .fn<RecordingStore["deleteAttemptRecordings"]>()
      .mockResolvedValue({ ok: true }),
    deleteAll: vi.fn<RecordingStore["deleteAll"]>().mockResolvedValue({ ok: true }),
    totalBytes: vi.fn<RecordingStore["totalBytes"]>().mockResolvedValue({ ok: true, value: 0 }),
  };
  const setAttemptKept = vi.fn().mockResolvedValue({ ok: true });
  const recordings = createSessionRecordings(recordingStore, { setAttemptKept });

  const ports = {
    clock,
    audio: {
      preload: vi.fn<AudioPort["preload"]>().mockImplementation(async (ids, progress) => {
        await Promise.resolve();
        progress({ loaded: ids.length, total: ids.length });
      }),
      play: vi.fn<AudioPort["play"]>().mockImplementation((_id, _rate, notify) => {
        audioSignal = notify;
        notify("started");
      }),
      stop: vi.fn(),
      pause: vi.fn(),
      releaseAssets: vi.fn(),
    },
    recorder: {
      requestMic: vi.fn<MockExamPorts["recorder"]["requestMic"]>().mockResolvedValue({ type: "granted" }),
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      stop: vi.fn().mockResolvedValue({ blob: new Blob(["audio"]), mimeType: "audio/webm", durationMs: 1 }),
      discard: vi.fn(),
      release: vi.fn(),
      subscribe(listener) {
        recorderSignal = listener;
        return () => {
          recorderSignal = undefined;
        };
      },
    },
    progress: {
      getSettings: vi.fn<MockExamPorts["progress"]["getSettings"]>().mockResolvedValue({
        ok: true,
        value: SettingsSchema.parse({}),
      }),
      savePreference: vi.fn<MockExamPorts["progress"]["savePreference"]>().mockResolvedValue({ ok: true }),
      persistAttempt: vi.fn<MockExamPorts["progress"]["persistAttempt"]>().mockResolvedValue({ ok: true }),
    },
    marker: {
      read: vi.fn<MockExamPorts["marker"]["read"]>().mockResolvedValue({ ok: true, value: null }),
      write: vi.fn<MockExamPorts["marker"]["write"]>().mockResolvedValue({ ok: true }),
      clear: vi.fn<MockExamPorts["marker"]["clear"]>().mockResolvedValue({ ok: true }),
    },
    announce: { emit: vi.fn<MockExamPorts["announce"]["emit"]>() },
    wakeLock: {
      acquire: vi.fn<MockExamPorts["wakeLock"]["acquire"]>().mockResolvedValue("held"),
      release: vi.fn(),
    },
    visibility: {
      isVisible: () => visible,
      subscribe(listener) {
        pageSignal = listener;
        return () => {
          pageSignal = undefined;
        };
      },
      armBackGuard: vi.fn(),
      disarmBackGuard: vi.fn(),
    },
    recordings,
    navigate: vi.fn<MockExamPorts["navigate"]>(),
  } satisfies MockExamPorts;

  return {
    ports,
    recordingStore,
    setAttemptKept,
    audio: (signal: Parameters<NonNullable<typeof audioSignal>>[0] = "ended") => {
      act(() => {
        audioSignal?.(signal);
      });
    },
    mic: (signal: RecorderSignal) => {
      act(() => {
        recorderSignal?.(signal);
      });
    },
    advance(ms: number) {
      act(() => {
        clock.advance(ms);
      });
    },
    page(event: Parameters<NonNullable<typeof pageSignal>>[0]) {
      if (event !== "back") visible = event === "visible";
      act(() => {
        pageSignal?.(event);
      });
    },
  };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function mount(setup: Partial<MockExamSetup> = {}, fakes = fakePorts()) {
  const { ports } = fakes;
  const { result, unmount } = renderHook(
    () => useMockExam({ mode: "exam", topics, seed: 41, attemptId: "attempt-test", ...setup }, ports),
    { wrapper: StrictMode },
  );
  await flush();

  function send(action: MockExamAction) {
    act(() => {
      result.current.send(action);
    });
  }

  async function draw(microphone = true) {
    send({ type: microphone ? "MIC_ALLOW" : "MIC_SKIP" });
    await flush();
    send({ type: "CONTINUE" });
    expect(result.current.state?.type).toBe("prepare.draw");
    send({ type: "CARD_TAPPED", index: 0 });
    await flush();
    expect(result.current.state).toMatchObject({ type: "prepare.reveal", status: "loaded" });
  }

  function beginAnswer() {
    send({ type: "START" });
    fakes.audio();
    fakes.advance(examConfig.lookSeconds * 1000);
    fakes.audio();
    fakes.advance(examConfig.examinerGapMs);
    fakes.audio();
    expect(result.current.state?.type).toBe("run.unit.answering");
  }

  function secondAnswer() {
    send({ type: "DONE" });
    fakes.audio();
    fakes.advance(examConfig.examinerGapMs);
    fakes.audio();
    fakes.advance(examConfig.examinerGapMs);
    fakes.audio();
    expect(result.current.state?.type).toBe("run.unit.answering");
  }

  return { result, send, draw, beginAnswer, secondAnswer, unmount, ...fakes };
}

describe("mock exam host", () => {
  it("plays START inside the gesture, runs both answers and hands session recordings to review", async () => {
    const exam = await mount();
    await exam.draw();
    const { ports } = exam;
    ports.audio.play.mockClear();

    act(() => {
      exam.result.current.send({ type: "START" });
      expect(ports.audio.play).toHaveBeenCalledWith(
        expect.stringMatching(/^examiner\.intro:/),
        1,
        expect.any(Function),
      );
    });
    expect(ports.marker.write).toHaveBeenCalledOnce();
    exam.audio();
    exam.advance(examConfig.lookSeconds * 1000);
    exam.audio();
    exam.advance(examConfig.examinerGapMs);
    exam.audio();
    expect(ports.recorder.start).toHaveBeenCalledWith(1000);
    exam.advance(1500);
    exam.secondAnswer();
    exam.advance(2500);
    exam.send({ type: "DONE" });

    expect(ports.progress.persistAttempt).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        attemptId: "attempt-test",
        status: "completed",
        answers: [
          expect.objectContaining({ answerMs: 1500, recorded: true, recordingParts: 1 }),
          expect.objectContaining({ answerMs: 2500, recorded: true, recordingParts: 1 }),
        ],
      }),
    );
    expect(ports.marker.clear).toHaveBeenCalledOnce();
    expect(ports.recorder.release).toHaveBeenCalledOnce();
    expect(ports.wakeLock.release).not.toHaveBeenCalled();

    exam.audio();
    expect(exam.result.current.state?.type).toBe("finished");
    expect(ports.wakeLock.release).toHaveBeenCalledOnce();
    expect(ports.audio.releaseAssets).toHaveBeenCalledOnce();
    expect(ports.clock.hasTimer()).toBe(false);
    exam.send({ type: "GO_TO_REVIEW" });
    exam.unmount();
    expect(ports.navigate).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ to: "review" }));
    const captured = await ports.recordings.readAttempt("attempt-test");
    expect(captured.ok && captured.value).toHaveLength(2);
    expect(exam.recordingStore.putAttemptRecordings).not.toHaveBeenCalled();
    const attempt = ports.progress.persistAttempt.mock.calls[0]?.[0];
    expect(await ports.recordings.keepAttempt("attempt-test", attempt?.topicId ?? "")).toEqual({ ok: true });
    expect(exam.recordingStore.putAttemptRecordings).toHaveBeenCalledOnce();
  });

  it("debounces mute, keeps separate recording parts after recovery, and persists interruption", async () => {
    const exam = await mount();
    await exam.draw();
    exam.beginAnswer();
    const mute = { type: "mute", error: new RecorderError("track-muted") } satisfies RecorderSignal;
    exam.mic(mute);
    exam.advance(examConfig.micMuteInterruptMs - 1);
    exam.mic({ type: "unmute" });
    exam.advance(examConfig.micMuteInterruptMs);
    expect(exam.result.current.state?.type).toBe("run.unit.answering");

    exam.mic(mute);
    exam.advance(examConfig.micMuteInterruptMs);
    expect(exam.result.current.state).toMatchObject({ type: "hold.interrupted", status: "choosing" });
    expect(exam.ports.recorder.stop).toHaveBeenCalledOnce();
    exam.send({ type: "CONTINUE_AFTER_INTERRUPTION" });
    await flush();
    exam.audio();
    expect(exam.result.current.state?.type).toBe("run.unit.answering");
    expect(exam.ports.recorder.start).toHaveBeenCalledTimes(2);
    exam.secondAnswer();
    exam.send({ type: "DONE" });
    exam.audio();
    expect(exam.ports.progress.persistAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "interrupted",
        answers: [
          expect.objectContaining({ recordingParts: 2 }),
          expect.objectContaining({ recordingParts: 1 }),
        ],
      }),
    );
    const captured = await exam.ports.recordings.readAttempt("attempt-test");
    expect(captured.ok && captured.value).toHaveLength(3);
  });

  it("runs the examiner script after denial and remembers the permission result", async () => {
    const fakes = fakePorts();
    fakes.ports.recorder.requestMic.mockResolvedValueOnce({ type: "denied", reason: "other" });
    const exam = await mount({}, fakes);
    expect(exam.ports.recorder.requestMic).not.toHaveBeenCalled();
    await exam.draw();
    expect(exam.result.current.micPreviouslyDenied).toBe(true);
    expect(exam.ports.progress.savePreference).toHaveBeenCalledWith({ micDenied: true });
    exam.beginAnswer();
    exam.secondAnswer();
    exam.send({ type: "DONE" });
    exam.audio();
    expect(exam.result.current.state?.type).toBe("finished");
    expect(exam.ports.recorder.start).not.toHaveBeenCalled();
    expect(exam.ports.progress.persistAttempt).toHaveBeenCalledOnce();
  });

  it("requires a current browser grant when denial was remembered", async () => {
    const fakes = fakePorts();
    fakes.ports.progress.getSettings.mockResolvedValue({
      ok: true,
      value: SettingsSchema.parse({ micDenied: true }),
    });
    fakes.ports.recorder.requestMic.mockResolvedValueOnce({ type: "denied", reason: "other" });
    const exam = await mount({}, fakes);
    expect(exam.result.current.micPreviouslyDenied).toBe(true);
    exam.send({ type: "MIC_ALLOW" });
    await flush();
    expect(exam.ports.recorder.requestMic).toHaveBeenCalledExactlyOnceWith("check-grant");
    expect(exam.result.current.state?.context.micState).toBe("denied");
  });

  it("stops at the recording cap and delivers its announcement after the answer", async () => {
    const exam = await mount({ mode: "practice" });
    await exam.draw();
    exam.beginAnswer();
    exam.advance(examConfig.maxRecordingSeconds * 1000);
    expect(exam.ports.recorder.stop).toHaveBeenCalledOnce();
    expect(exam.result.current.state?.type).toBe("run.unit.answering");
    function hasAnnouncedCap() {
      return exam.ports.announce.emit.mock.calls.some(
        ([message]) => message.key === "mock.live.recordingCapped",
      );
    }
    expect(hasAnnouncedCap()).toBe(false);
    exam.send({ type: "DONE" });
    exam.audio();
    expect(hasAnnouncedCap()).toBe(true);
  });

  it("releases and reacquires a wake lock over visibility changes and discards on route exit", async () => {
    const exam = await mount();
    await exam.draw(false);
    expect(exam.ports.wakeLock.acquire).toHaveBeenCalledOnce();
    exam.beginAnswer();
    exam.page("hidden");
    expect(exam.result.current.state).toMatchObject({ type: "hold.interrupted", status: "away" });
    expect(exam.ports.wakeLock.release).toHaveBeenCalledOnce();
    exam.page("visible");
    expect(exam.result.current.state).toMatchObject({ type: "hold.interrupted", status: "choosing" });
    expect(exam.ports.wakeLock.acquire).toHaveBeenCalledTimes(2);
    exam.unmount();
    expect(exam.ports.wakeLock.release).toHaveBeenCalledTimes(2);
    expect(exam.ports.marker.clear).toHaveBeenCalledOnce();
    expect(exam.ports.progress.persistAttempt).not.toHaveBeenCalled();
    expect(exam.ports.clock.hasTimer()).toBe(false);
  });

  it("persists the one-time auto-lock tip when wake lock is unavailable", async () => {
    const fakes = fakePorts();
    fakes.ports.wakeLock.acquire.mockResolvedValue("unavailable");
    const exam = await mount({}, fakes);
    await exam.draw(false);
    expect(exam.result.current.state?.context.wakeLock).toBe("unsupported");
    expect(exam.ports.progress.savePreference).toHaveBeenCalledWith({ wakeLockTipPending: true });
    exam.unmount();

    const next = fakePorts();
    next.ports.progress.getSettings.mockResolvedValue({
      ok: true,
      value: SettingsSchema.parse({ wakeLockTipPending: true }),
    });
    const fresh = await mount({}, next);
    expect(fresh.result.current.state).toMatchObject({ type: "prepare.getReady", wakeLockTip: true });
    expect(fresh.ports.progress.savePreference).toHaveBeenCalledWith({ wakeLockTipPending: false });
    expect(fresh.ports.progress.savePreference).toHaveBeenCalledWith({ wakeLockTipSeen: true });
  });

  it("preserves the reload marker on pagehide and reads it on the next mount", async () => {
    const exam = await mount();
    await exam.draw(false);
    exam.beginAnswer();
    const marker = exam.ports.marker.write.mock.calls[0]?.[0] ?? null;
    exam.page("pagehide");
    exam.unmount();
    expect(exam.ports.marker.clear).not.toHaveBeenCalled();
    expect(exam.ports.recorder.release).toHaveBeenCalled();
    const fakes = fakePorts();
    fakes.ports.marker.read.mockResolvedValue({ ok: true, value: marker });
    const fresh = await mount({}, fakes);
    expect(fresh.result.current.state).toMatchObject({ type: "prepare.getReady", reloadNotice: true });
    expect(fresh.ports.marker.clear).toHaveBeenCalledOnce();
    expect(fresh.ports.audio.play).not.toHaveBeenCalled();
    expect(fresh.ports.recorder.requestMic).not.toHaveBeenCalled();
  });

  it("routes back through the leave dialog when C19 is enabled", async () => {
    const exam = await mount({ backBehaviour: "leaveDialog" });
    await exam.draw(false);
    exam.beginAnswer();
    expect(exam.ports.visibility.armBackGuard).toHaveBeenCalledOnce();
    exam.page("back");
    expect(exam.result.current.state?.context.leaveDialog).toBe(true);
    exam.page("back");
    expect(exam.result.current.state?.context.leaveDialog).toBe(false);
    expect(exam.ports.visibility.armBackGuard).toHaveBeenCalledTimes(3);
    expect(exam.ports.progress.persistAttempt).not.toHaveBeenCalled();
  });

  it("persists answered items when back ends the exam under the C19 fallback", async () => {
    const exam = await mount();
    await exam.draw(false);
    exam.beginAnswer();
    exam.page("back");
    expect(exam.result.current.state?.type).toBe("left");
    expect(exam.ports.progress.persistAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ status: "endedEarly" }),
    );
    expect(exam.ports.navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "mock",
        noticeKey: "mock.back.saved",
      }),
    );
  });

  it("carries late save failure to the destination after the runner unmounts", async () => {
    const exam = await mount();
    await exam.draw(false);
    exam.beginAnswer();
    const save = Promise.withResolvers<Awaited<ReturnType<MockExamPorts["progress"]["persistAttempt"]>>>();
    exam.ports.progress.persistAttempt.mockReturnValueOnce(save.promise);
    exam.page("back");
    const destination = exam.ports.navigate.mock.calls[0]?.[0];
    exam.unmount();
    save.resolve({ ok: false, reason: "quota" });
    expect(await destination?.saveResult).toEqual({ ok: false, reason: "quota" });
  });
});
