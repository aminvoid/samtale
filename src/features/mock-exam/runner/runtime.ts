import type { PreloadProgress } from "@/lib/audio/preload";
import type { RecorderSignal } from "@/lib/audio/recorder";
import { examConfig } from "@/lib/exam/config";
import type { SaveResult } from "@/lib/progress/progress-store";
import { initialize, nextDeadline, transition } from "../machine";
import type { AttemptRecord, Command, Event, Setup, Transition } from "../machine";
import type { MockExamPorts } from "./ports";

export type MockExamSetup = Omit<Setup, "attemptId" | "seed"> & Partial<Pick<Setup, "attemptId" | "seed">>;

type Untimed<T = Event> = T extends Event ? Omit<T, "at"> : never;
type Input = Untimed;

type RuntimeAction =
  | { type: "initialize"; setup: Setup; micPreviouslyDenied: boolean }
  | { type: "event"; event: Event }
  | { type: "preloadProgress"; progress: PreloadProgress | null };

interface Snapshot {
  machine: Transition | null;
  micPreviouslyDenied: boolean;
  preloadProgress: PreloadProgress | null;
}

export const initialSnapshot: Snapshot = {
  machine: null,
  micPreviouslyDenied: false,
  preloadProgress: null,
};

export function reduceMockExam(snapshot: Snapshot, action: RuntimeAction): Snapshot {
  switch (action.type) {
    case "initialize":
      return {
        ...initialSnapshot,
        machine: initialize(action.setup),
        micPreviouslyDenied: action.micPreviouslyDenied,
      };
    case "event": {
      if (snapshot.machine === null) return snapshot;
      const machine = transition(snapshot.machine.state, action.event);
      const micPreviouslyDenied =
        action.event.type === "MIC_DENIED" && machine.state.context.micState === "denied"
          ? true
          : action.event.type === "MIC_GRANTED" && machine.state.context.micState === "granted"
            ? false
            : snapshot.micPreviouslyDenied;
      return { ...snapshot, machine, micPreviouslyDenied };
    }
    case "preloadProgress":
      return { ...snapshot, preloadProgress: action.progress };
  }
}

type RecordingTarget = { attemptId: string; itemId: string };
type Take = RecordingTarget & { started: boolean; paused: boolean };

function sameAnswer(take: Take | undefined, target: RecordingTarget): take is Take {
  return take !== undefined && take.attemptId === target.attemptId && take.itemId === target.itemId;
}

function createSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}

function createAttemptId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function createMockExamRuntime(ports: MockExamPorts, publish: (action: RuntimeAction) => void) {
  let snapshot = initialSnapshot;
  let disposed = false;
  let draining = false;
  let pageHiding = false;
  let lastAt = 0;
  let activeTake: Take | undefined;
  let activePreload: number | undefined;
  let muted = false;
  let muteDeadline: number | undefined;
  let cancelTimer: (() => void) | undefined;
  let unsubscribeVisibility: (() => void) | undefined;
  let unsubscribeRecorder: (() => void) | undefined;
  let handedOffAttemptId: string | undefined;
  let wakeRequest = 0;
  let micRequest = 0;
  let audioRequest = 0;
  const queue: Event[] = [];
  const persisted = new Map<string, Promise<SaveResult>>();

  function update(action: RuntimeAction) {
    snapshot = reduceMockExam(snapshot, action);
    if (!disposed) publish(action);
  }

  function isDisposed() {
    return disposed;
  }

  function send(input: Input) {
    if (disposed || snapshot.machine === null) return;
    lastAt = Math.max(lastAt, ports.clock.now());
    queue.push({ ...input, at: lastAt });
    if (draining) return;
    draining = true;
    try {
      // React replays the same pure actions for rendering. Execute commands here so
      // play() and history.pushState() still run in the START gesture.
      for (const event of queue) {
        if (isDisposed()) break;
        update({ type: "event", event });
        runCommands();
      }
    } finally {
      queue.length = 0;
      draining = false;
      schedule();
    }
  }

  function schedule() {
    cancelTimer?.();
    cancelTimer = undefined;
    const state = snapshot.machine?.state;
    if (disposed || state === undefined) return;
    const deadline = nextDeadline(state);
    const due = Math.min(deadline ?? Infinity, muteDeadline ?? Infinity);
    if (!Number.isFinite(due)) return;
    cancelTimer = ports.clock.setTimeout(
      () => {
        cancelTimer = undefined;
        const now = ports.clock.now();
        if (muteDeadline !== undefined && now >= muteDeadline) {
          muteDeadline = undefined;
          if (ports.visibility.isVisible()) send({ type: "MIC_MUTED" });
        }
        const machineDue = snapshot.machine && nextDeadline(snapshot.machine.state);
        if (machineDue !== null && now >= machineDue) send({ type: "TICK" });
        schedule();
      },
      Math.max(0, due - ports.clock.now()),
    );
  }

  function trackSignal(signal: RecorderSignal) {
    if (disposed || snapshot.machine?.state.type === "left") return;
    if (signal.type === "ended" || signal.type === "error") {
      muted = false;
      muteDeadline = undefined;
      send({ type: "MIC_ENDED" });
    } else if (signal.type === "unmute") {
      muted = false;
      muteDeadline = undefined;
    } else if (!muted) {
      muted = true;
      if (ports.visibility.isVisible()) muteDeadline = ports.clock.now() + examConfig.micMuteInterruptMs;
    }
    if (!draining) schedule();
  }

  function pageSignal(event: "hidden" | "visible" | "pagehide" | "back") {
    const state = snapshot.machine?.state;
    if (state === undefined || state.type === "left") return;
    switch (event) {
      case "back":
        if (state.context.backBehaviour === "leaveDialog") send({ type: "BACK_PRESSED" });
        else if (state.context.marker) send({ type: "NAVIGATED_AWAY", reason: "back" });
        return;
      case "visible":
        pageHiding = false;
        if (muted) muteDeadline = ports.clock.now() + examConfig.micMuteInterruptMs;
        send({ type: "APP_VISIBLE" });
        return;
      case "hidden":
      case "pagehide":
        if (event === "pagehide") pageHiding = true;
        muteDeadline = undefined;
        if (!state.context.pageHidden) send({ type: "APP_HIDDEN" });
        if (event === "pagehide") {
          // Freeze a practice take that the machine intentionally left paused.
          if (snapshot.machine?.state.context.recording === "paused") send({ type: "MIC_ENDED" });
          stopAudio();
          ports.recorder.release();
          releaseWakeLock();
        }
        schedule();
        return;
    }
  }

  function releaseWakeLock() {
    wakeRequest += 1;
    ports.wakeLock.release();
  }

  function requestWakeLock() {
    const request = ++wakeRequest;
    void ports.wakeLock
      .acquire(() => {
        send({ type: "WAKE_LOCK_LOST" });
      })
      .then(
        (result) => {
          if (request !== wakeRequest) return;
          if (result === "unavailable") send({ type: "WAKE_LOCK_UNSUPPORTED" });
          if (result === "cancelled") send({ type: "WAKE_LOCK_LOST" });
        },
        () => {
          if (request === wakeRequest) send({ type: "WAKE_LOCK_UNSUPPORTED" });
        },
      );
  }

  function preload(command: Extract<Command, { type: "preload" }>) {
    const { requestId, clipIds } = command;
    activePreload = requestId;
    if (requestId !== 0) update({ type: "preloadProgress", progress: { loaded: 0, total: clipIds.length } });
    void ports.audio
      .preload(clipIds, (progress) => {
        if (!disposed && activePreload === requestId && requestId !== 0)
          update({ type: "preloadProgress", progress });
      })
      .then(
        () => {
          if (activePreload === requestId) send({ type: "ASSETS_LOADED", requestId });
        },
        () => {
          if (activePreload === requestId) send({ type: "ASSETS_FAILED", requestId });
        },
      );
  }

  function play({ clipId, requestId, rate }: Extract<Command, { type: "playClip" }>) {
    const request = ++audioRequest;
    ports.audio.play(clipId, rate, (signal) => {
      if (request !== audioRequest) return;
      if (signal !== "started") audioRequest += 1;
      const feedback = { clipId, requestId };
      switch (signal) {
        case "started":
          send({ type: "CLIP_STARTED", ...feedback });
          return;
        case "ended":
          send({ type: "CLIP_ENDED", ...feedback });
          return;
        case "failed":
          send({ type: "CLIP_FAILED", ...feedback });
          return;
        case "blocked":
          send({ type: "PLAYBACK_BLOCKED", ...feedback });
          return;
        case "interrupted":
          send({ type: "AUDIO_INTERRUPTED" });
          // A stopped closing line has no retry and can be treated as a failed clip.
          if (snapshot.machine?.state.type === "run.closing") send({ type: "CLIP_FAILED", ...feedback });
          return;
      }
    });
  }

  function stopAudio() {
    audioRequest += 1;
    ports.audio.stop();
  }

  function requestMic({ reason, requestId }: Extract<Command, { type: "requestMic" }>) {
    const request = ++micRequest;
    function unavailable() {
      if (request !== micRequest || disposed) return;
      send({ type: reason === "permission" ? "MIC_UNAVAILABLE" : "MIC_REACQUIRE_FAILED", requestId });
    }
    const purpose = reason === "permission" && snapshot.micPreviouslyDenied ? "check-grant" : reason;
    void ports.recorder.requestMic(purpose).then((result) => {
      if (request !== micRequest || disposed) return;
      if (reason === "reacquire") {
        send({ type: result.type === "granted" ? "MIC_REACQUIRED" : "MIC_REACQUIRE_FAILED", requestId });
      } else if (result.type === "granted") {
        if (snapshot.micPreviouslyDenied) savePreference({ micDenied: false });
        send({ type: "MIC_GRANTED", requestId });
      } else {
        if (result.type === "denied" && !snapshot.micPreviouslyDenied) savePreference({ micDenied: true });
        send({
          type: result.type === "denied" ? "MIC_DENIED" : "MIC_UNAVAILABLE",
          requestId,
          reason: result.reason,
        });
      }
    }, unavailable);
  }

  function startRecording({ attemptId, itemId, requestId }: Extract<Command, { type: "startRecording" }>) {
    const take: Take = { attemptId, itemId, started: false, paused: false };
    activeTake = take;
    function started() {
      if (activeTake !== take || disposed) return;
      take.started = true;
      if (take.paused) ports.recorder.pause();
      send({ type: "RECORDING_STARTED", requestId });
    }
    function failed() {
      if (activeTake === take) send({ type: "RECORDING_FAILED", requestId });
    }
    try {
      const opening = ports.recorder.start(1000);
      if (opening === undefined) started();
      else void opening.then(started).catch(failed);
    } catch {
      failed();
    }
  }

  function stopRecording(target: RecordingTarget) {
    if (!sameAnswer(activeTake, target)) return;
    activeTake = undefined;
    const recording = ports.recorder.stop();
    ports.recordings.collect(target.attemptId, target.itemId, recording);
  }

  function persistAttempt(attempt: AttemptRecord) {
    const pending = persisted.get(attempt.attemptId);
    if (pending !== undefined) return pending;
    const saving = ports.progress
      .persistAttempt(attempt)
      .catch((): SaveResult => ({ ok: false, reason: "error" }));
    persisted.set(attempt.attemptId, saving);
    void saving.then((result) => {
      if (!result.ok && persisted.get(attempt.attemptId) === saving) {
        persisted.delete(attempt.attemptId);
        send({ type: "PERSIST_FAILED", attemptId: attempt.attemptId });
      }
    });
    return saving;
  }

  function savePreference(patch: Parameters<MockExamPorts["progress"]["savePreference"]>[0]) {
    void ports.progress.savePreference(patch).catch(() => undefined);
  }

  function execute(command: Command) {
    switch (command.type) {
      case "playClip":
        play(command);
        return;
      case "preload":
        preload(command);
        return;
      case "stopAudio":
        stopAudio();
        return;
      case "pauseAudio":
        audioRequest += 1;
        ports.audio.pause();
        return;
      case "requestMic":
        requestMic(command);
        return;
      case "releaseMic":
        micRequest += 1;
        ports.recorder.release();
        return;
      case "startRecording":
        startRecording(command);
        return;
      case "pauseRecording":
      case "resumeRecording":
        if (sameAnswer(activeTake, command)) {
          activeTake.paused = command.type === "pauseRecording";
          if (activeTake.started) {
            if (activeTake.paused) ports.recorder.pause();
            else ports.recorder.resume();
          }
        }
        return;
      case "stopRecording":
        stopRecording(command);
        return;
      case "discardRecording":
        if (sameAnswer(activeTake, command)) {
          activeTake = undefined;
          ports.recorder.discard();
        }
        ports.recordings.discardAnswer(command.attemptId, command.itemId);
        return;
      case "discardAttemptRecordings":
        ports.recordings.discardAttempt(command.attemptId);
        return;
      case "requestWakeLock":
        requestWakeLock();
        return;
      case "releaseWakeLock":
        releaseWakeLock();
        return;
      case "announce":
        ports.announce.emit(command);
        return;
      case "persistAttempt":
        void persistAttempt(command.attempt);
        return;
      case "savePreference":
        savePreference({ [command.key]: command.value });
        return;
      case "setInProgressMarker":
        void ports.marker.write(command.marker).catch(() => undefined);
        return;
      case "clearInProgressMarker":
        if (!(disposed && pageHiding)) void ports.marker.clear().catch(() => undefined);
        return;
      case "armBackGuard":
      case "rearmBackGuard":
        ports.visibility.armBackGuard();
        return;
      case "disarmBackGuard":
        ports.visibility.disarmBackGuard();
        return;
      case "navigate":
        handedOffAttemptId = command.attempt?.attemptId;
        ports.navigate({
          ...command,
          saveResult: command.attempt === undefined ? undefined : persistAttempt(command.attempt),
        });
        return;
    }
  }

  function releaseAudio() {
    activePreload = undefined;
    stopAudio();
    ports.audio.releaseAssets();
  }

  function runCommands() {
    const machine = snapshot.machine;
    if (machine === null) return;
    for (const command of machine.commands) execute(command);
    if ((machine.state.type === "finished" || machine.state.type === "left") && activePreload !== undefined)
      releaseAudio();
  }

  return {
    send,
    async start(setup: MockExamSetup) {
      const [settings, marker] = await Promise.all([
        ports.progress.getSettings().catch(() => null),
        ports.marker.read().catch(() => null),
      ]);
      if (disposed) return;
      const preferences = settings?.ok ? settings.value : undefined;
      update({
        type: "initialize",
        setup: {
          ...preferences,
          reloadMarker: marker?.ok ? (marker.value ?? undefined) : undefined,
          ...setup,
          attemptId: setup.attemptId ?? createAttemptId(),
          seed: setup.seed ?? createSeed(),
        },
        micPreviouslyDenied: preferences?.micDenied ?? false,
      });
      unsubscribeVisibility = ports.visibility.subscribe(pageSignal);
      unsubscribeRecorder = ports.recorder.subscribe(trackSignal);
      runCommands();
      if (!ports.visibility.isVisible()) pageSignal("hidden");
      schedule();
    },
    dispose() {
      disposed = true;
      cancelTimer?.();
      unsubscribeVisibility?.();
      unsubscribeRecorder?.();
      const state = snapshot.machine?.state;
      if (state && state.type !== "left") {
        if (
          (state.type === "finished" || state.type === "run.closing") &&
          state.attempt.attemptId !== handedOffAttemptId
        )
          ports.recordings.discardAttempt(state.attempt.attemptId);
        update({
          type: "event",
          event: { type: "NAVIGATED_AWAY", reason: "route", at: Math.max(lastAt, ports.clock.now()) },
        });
        runCommands();
      }
      if (activePreload !== undefined) releaseAudio();
    },
  };
}
