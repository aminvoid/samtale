import type { AudioClip, AudioPlayerController } from "@/lib/audio/player";
import type { createRecorder, RecorderSignal } from "@/lib/audio/recorder";
import { examConfig } from "@/lib/exam/config";
import { createScreenWakeLock } from "@/lib/screen-wake-lock";
import {
  answerAloudReducer,
  answerElapsed,
  initialAnswerAloudState,
  MAX_ANSWER_RECORDING_MS,
  type MicIssue,
} from "./answer-aloud-state";
import { getStudyProgressStore } from "./study-progress-store";

const QUESTION_LOADING_TIMEOUT_MS = examConfig.slowLoadNoticeSeconds * 1000;

function microphoneBrowserApis(): Partial<Pick<Navigator, "permissions" | "userActivation">> {
  // The DOM types declare these APIs even in browsers that do not implement them.
  return navigator;
}

async function isMicDenied(inUserGesture: boolean) {
  if (inUserGesture) return true;
  const { permissions } = microphoneBrowserApis();
  try {
    return (await permissions?.query({ name: "microphone" }))?.state === "denied";
  } catch {
    // Some browsers cannot report microphone permissions.
    return false;
  }
}

export function createAnswerAloudSession(topicId: string, player: AudioPlayerController) {
  const wakeLock = createScreenWakeLock();
  const listeners = new Set<() => void>();
  let state = initialAnswerAloudState;
  let recorderFactory: typeof createRecorder | undefined;
  let recorderLoad: Promise<void> | undefined;
  let recorder: ReturnType<typeof createRecorder> | undefined;
  let unsubscribeRecorder: (() => void) | undefined;
  let cancelPrompt: (() => void) | undefined;
  let cap: ReturnType<typeof setTimeout> | undefined;
  let muteTimer: ReturnType<typeof setTimeout> | undefined;
  let micMuted = false;
  let activeAttempt: symbol | undefined;
  let micRequest: symbol | undefined;
  let micAcquisition: Promise<MicIssue | null> | undefined;
  let recordingStarted = false;
  let captureStartedAt: number | undefined;
  let captureElapsedMs = 0;
  let micChoice: "ask" | "allow" | "skip" | "denied" = "ask";
  let practice: Promise<"saved" | "review" | "error"> | undefined;
  let ownsPlayback = false;
  let wakeLockTipSeen = false;

  function send(action: Parameters<typeof answerAloudReducer>[1]) {
    state = answerAloudReducer(state, action);
    for (const listener of listeners) listener();
  }

  function releaseMic() {
    micRequest = undefined;
    micAcquisition = undefined;
    recordingStarted = false;
    micMuted = false;
    clearMuteTimer();
    unsubscribeRecorder?.();
    unsubscribeRecorder = undefined;
    recorder?.release();
    recorder = undefined;
    releaseWakeLock();
  }

  function releaseWakeLock() {
    if (captureStartedAt !== undefined) captureElapsedMs += performance.now() - captureStartedAt;
    captureStartedAt = undefined;
    clearTimeout(cap);
    wakeLock.release();
  }

  function clearQuestion() {
    activeAttempt = undefined;
    cancelPrompt?.();
    if (ownsPlayback) player.stop();
    ownsPlayback = false;
    releaseMic();
    for (const take of state.takes) URL.revokeObjectURL(take.url);
  }

  function close() {
    clearQuestion();
    practice = undefined;
    send({ type: "close" });
  }

  function armRecording() {
    armMuteTimer();
    captureStartedAt = performance.now();
    const remaining = Math.max(0, MAX_ANSWER_RECORDING_MS - captureElapsedMs);
    cap = setTimeout(() => {
      void finish(true);
    }, remaining);
    const take = micRequest;
    void wakeLock
      .acquire(() => undefined)
      .then(async (result) => {
        if (result !== "unavailable" || take !== micRequest) return;
        const settings = await getStudyProgressStore().getSettings();
        if (take !== micRequest || state.phase !== "answering" || wakeLockTipSeen) return;
        wakeLockTipSeen = true;
        if (settings.ok && settings.value.wakeLockTipSeen) return;
        send({ type: "wake-lock-tip", show: true });
        void getStudyProgressStore().updateSettings({ wakeLockTipSeen: true });
      });
  }

  async function recordPractice(itemId: string) {
    try {
      const store = getStudyProgressStore();
      const due = await store.listDueReviews();
      const result = await store.recordPractice({ topicId, itemId, kind: "answer-aloud" });
      if (result.ok && (await store.availability()).kind === "available")
        return due.ok && due.value.some((review) => review.topicId === topicId) ? "review" : "saved";
    } catch {
      // Browser storage can be restricted independently of microphone access.
    }
    return "error";
  }

  async function finish(capped = false, paused = false, micIssue = state.micIssue) {
    if (state.phase !== "answering" && state.phase !== "paused" && !recordingStarted) return;
    if (state.phase === "stopping" || state.phase === "compare" || state.phase === "closed") return;

    const attempt = activeAttempt;
    const itemId = state.itemId;
    const elapsedMs = answerElapsed(state, performance.now());
    cancelPrompt?.();
    player.stop();
    send({ type: "stop", elapsedMs, capped });
    // Call stop before release so the adapter can collect the final data and still release tracks now.
    const recording = stopRecording();

    if (!paused && practice === undefined) {
      send({ type: "practice", practice: "saving" });
      const result = recordPractice(itemId);
      practice = result;
      void result.then((status) => {
        if (practice !== result) return;
        if (status === "error") practice = undefined;
        send({ type: "practice", practice: status });
      });
    }

    const recorded = await recording;
    if (attempt !== activeAttempt) return;
    let take = null;
    try {
      if (recorded !== null)
        take = { url: URL.createObjectURL(recorded.blob), durationMs: recorded.durationMs };
    } catch {
      // Keep the model answer available if a browser cannot expose the recording for playback.
    }
    send({ type: "collect", take, paused, micIssue });
  }

  function stopRecording() {
    try {
      return recorder?.stop().catch(() => null) ?? Promise.resolve(null);
    } catch {
      return Promise.resolve(null);
    } finally {
      releaseMic();
    }
  }

  function answerWithoutMic(micIssue: MicIssue | null = null) {
    send({ type: "answer", startedAt: performance.now(), micIssue });
  }

  function preloadRecorder() {
    if (recorderFactory !== undefined) {
      send({ type: "recorder-status", status: "ready" });
      return;
    }
    send({ type: "recorder-status", status: "loading" });
    recorderLoad ??= import("@/lib/audio/recorder")
      .then((module) => {
        recorderFactory = module.createRecorder;
      })
      .catch(() => undefined)
      .finally(() => {
        recorderLoad = undefined;
        if (state.phase !== "closed")
          send({ type: "recorder-status", status: recorderFactory === undefined ? "failed" : "ready" });
      });
  }

  function clearMuteTimer() {
    clearTimeout(muteTimer);
    muteTimer = undefined;
  }

  function armMuteTimer() {
    if (!micMuted || state.phase !== "answering" || muteTimer !== undefined) return;
    muteTimer = setTimeout(() => {
      void finish(false, true, "unavailable");
    }, examConfig.micMuteInterruptMs);
  }

  function trackSignal(signal: RecorderSignal) {
    if (signal.type === "ended" || signal.type === "error") {
      void finish(false, true, "unavailable");
    } else if (signal.type === "unmute") {
      micMuted = false;
      clearMuteTimer();
    } else {
      micMuted = true;
      armMuteTimer();
    }
  }

  function acquireMic() {
    if (recorderFactory === undefined) return;
    micChoice = "allow";
    const request = Symbol();
    micRequest = request;
    const next = recorderFactory();
    recorder = next;
    // Browsers without UserActivation still reach this function directly from a learner action.
    const { userActivation } = microphoneBrowserApis();
    const inUserGesture = userActivation?.isActive ?? true;
    // No await before requestMic: getUserMedia needs the activation from this tap.
    micAcquisition = next.requestMic().then(
      () => {
        if (micRequest === request)
          void getStudyProgressStore().updateSettings({ micDenied: false, micExplanationSeen: true });
        return null;
      },
      async (error: unknown): Promise<MicIssue> => {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "permission-denied" &&
          micRequest === request &&
          (await isMicDenied(inUserGesture)) &&
          micRequest === request
        ) {
          micChoice = "denied";
          void getStudyProgressStore().updateSettings({ micDenied: true, micExplanationSeen: true });
          return "denied";
        }
        if (
          error instanceof Error &&
          "reason" in error &&
          (error.reason === "in-use" || error.reason === "insecure")
        )
          return error.reason;
        return "unavailable";
      },
    );
  }

  async function startRecording() {
    const request = micRequest;
    const next = recorder;
    const acquisition = micAcquisition;
    if (acquisition === undefined) return;
    send({ type: "starting" });
    let issue = await acquisition;
    if (micRequest !== request) return;
    if (issue === null && next !== undefined) {
      try {
        await next.start();
      } catch {
        // A MediaRecorder start failure does not indicate a microphone permission denial.
        issue = "unavailable";
      }
      if (micRequest !== request) return;
      if (issue === null) {
        recordingStarted = true;
        unsubscribeRecorder = next.subscribe(trackSignal);
        send({ type: "answer", startedAt: performance.now(), micIssue: null });
        armRecording();
        return;
      }
    }
    releaseMic();
    answerWithoutMic(issue);
  }

  async function questionEnded() {
    if (micAcquisition !== undefined) {
      await startRecording();
      return;
    }
    if (micChoice === "ask") {
      const attempt = activeAttempt;
      const settings = await getStudyProgressStore().getSettings();
      if (attempt !== activeAttempt || state.phase !== "listening") return;
      if (settings.ok && settings.value.micDenied) micChoice = "denied";
    }
    if (micChoice === "skip" || micChoice === "denied")
      answerWithoutMic(micChoice === "denied" ? "denied" : null);
    else send({ type: "permission" });
  }

  function playQuestion(clip: AudioClip | undefined, repeat = false) {
    cancelPrompt?.();
    if (repeat) {
      clearMuteTimer();
      releaseWakeLock();
      recorder?.pause();
      send({ type: "listen", elapsedMs: answerElapsed(state, performance.now()) });
    } else {
      send({ type: "listen", elapsedMs: 0 });
    }

    function continueAnswer() {
      cancelPrompt?.();
      if (repeat) {
        recorder?.resume();
        send({ type: "answer", startedAt: performance.now(), micIssue: state.micIssue });
        if (recordingStarted) armRecording();
      } else {
        void questionEnded();
      }
    }

    function audioError() {
      cancelPrompt?.();
      player.stop();
      if (repeat) continueAnswer();
      else {
        releaseMic();
        send({ type: "audio-error" });
      }
    }

    if (clip === undefined) {
      audioError();
      return;
    }
    if (!repeat && micChoice === "allow") acquireMic();
    // Reset even if the same examiner clip was already active in the study page.
    player.stop();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let previousStatus: string | undefined;
    const unsubscribe = player.subscribe(() => {
      const snapshot = player.getSnapshot();
      if (snapshot.status === previousStatus && snapshot.clipId === clip.id) return;
      previousStatus = snapshot.status;
      clearTimeout(timeout);
      if (snapshot.clipId !== clip.id || snapshot.status === "error" || snapshot.status === "paused")
        audioError();
      else if (snapshot.status === "ended") continueAnswer();
      else if (snapshot.status === "loading") timeout = setTimeout(audioError, QUESTION_LOADING_TIMEOUT_MS);
    });
    cancelPrompt = () => {
      unsubscribe();
      clearTimeout(timeout);
      cancelPrompt = undefined;
    };
    // This call stays in the tap/keyboard handler for WebKit user activation.
    player.play(clip);
  }

  function start(itemId: string, clip: AudioClip | undefined) {
    const sameItem = state.itemId === itemId;
    clearQuestion();
    if (!sameItem) practice = undefined;
    if (sameItem && micChoice === "skip") micChoice = "ask";
    activeAttempt = Symbol();
    captureElapsedMs = 0;
    ownsPlayback = true;
    send({ type: "open", itemId, practice: sameItem ? state.practice : "idle" });
    preloadRecorder();
    playQuestion(clip);
  }

  function requestMic() {
    if (state.recorderStatus !== "ready") return;
    // Keep elapsed time when the learner enables recording partway through an unrecorded answer.
    send({ type: "listen", elapsedMs: answerElapsed(state, performance.now()) });
    acquireMic();
    void startRecording();
  }

  function canResumeRecording() {
    return micChoice === "allow";
  }

  return {
    start,
    close,
    getSnapshot: () => state,
    getServerSnapshot: () => initialAnswerAloudState,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    retryQuestion: playQuestion,
    readQuestion: () => {
      send({ type: "listen", elapsedMs: 0 });
      if (micChoice === "allow") acquireMic();
      void questionEnded();
    },
    requestMic: () => {
      if (state.phase === "permission" || state.phase === "answering") requestMic();
    },
    preloadRecorder,
    canResumeRecording,
    resume: () => {
      if (state.phase !== "paused") return;
      if (canResumeRecording()) requestMic();
      else answerWithoutMic(state.micIssue);
    },
    skipMic: () => {
      if (state.phase !== "permission" && state.phase !== "starting" && state.phase !== "paused") return;
      micChoice = "skip";
      releaseMic();
      answerWithoutMic();
    },
    finish: () => void finish(),
    interrupt() {
      if (state.phase === "closed") return;
      cancelPrompt?.();
      player.stop();
      if (recordingStarted) void finish(false, true);
      else if (state.phase === "starting" || state.phase === "answering") {
        releaseMic();
        send({ type: "pause", elapsedMs: answerElapsed(state, performance.now()) });
      } else if (state.phase === "listening") {
        releaseMic();
        send({ type: "audio-error" });
      }
    },
    dismissWakeLockTip: () => {
      send({ type: "wake-lock-tip", show: false });
    },
    isRecording: () => recordingStarted && state.phase === "answering",
    hasTake: () => state.takes.length > 0 || recordingStarted || state.phase === "stopping",
  };
}
