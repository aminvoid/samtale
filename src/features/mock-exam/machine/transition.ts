import { examConfig } from "@/lib/exam/config";
import { countdown, elapsed, freeze, ms, nextDue, remaining, thaw } from "./deadlines";
import { chooseSituation, drawCards } from "./random";
import { buildDelproeve2Script, closingClip, introClip, preloadClipIds, thanksClip } from "./script";
import type {
  AnswerFacts,
  AnnouncementMessage,
  AttemptRecord,
  AudioRun,
  AudioSequence,
  Clip,
  Command,
  Context,
  Event,
  MessageKey,
  MockTopic,
  Mode,
  ModePolicy,
  Run,
  Setup,
  SituationKey,
  State,
  Transition,
} from "./types";

const modePolicies: Readonly<Record<Mode, ModePolicy>> = {
  practice: {
    canPause: true,
    lookAdjustable: true,
    examLimitMs: null,
    graceMs: 0,
    hints: true,
    reRecord: true,
    topicChoice: true,
    situationChoice: true,
    keepShowTextOpen: true,
    showFixedLineMeaning: true,
    slowRepeat: true,
    labelInterruptions: false,
  },
  exam: {
    canPause: false,
    lookAdjustable: false,
    examLimitMs: ms(examConfig.examLimitSeconds),
    graceMs: ms(examConfig.graceSeconds),
    hints: false,
    reRecord: false,
    topicChoice: false,
    situationChoice: false,
    keepShowTextOpen: false,
    showFixedLineMeaning: false,
    slowRepeat: false,
    labelInterruptions: true,
  },
};

export function initialize(setup: Setup): Transition {
  const policy = modePolicies[setup.mode];
  const options: Context["options"] = {
    topicSource: { type: "draw" },
    situationPolicy: "random",
    pacingAidOpen: examConfig.pacingAid.expanded,
    ...(policy.topicChoice ? setup.options : {}),
  };
  const context: Context = {
    mode: setup.mode,
    policy,
    topics: setup.topics,
    options,
    rng: setup.seed >>> 0,
    baseAttemptId: setup.attemptId,
    generation: 0,
    sequence: 0,
    marker: null,
    topic: null,
    situationKey: null,
    script: [],
    cursor: 0,
    examClock: null,
    answerClock: null,
    look: null,
    load: null,
    grace: null,
    recordingCap: null,
    limitReached: false,
    part1CutoffReached: false,
    part1HandoverReached: false,
    handoverGraceStarted: false,
    graceCeilingReached: false,
    graceNotice: null,
    minuteNoticePassed: false,
    u2Asked: false,
    unitStarted: false,
    interrupted: false,
    answersStarted: 0,
    skippedFollowups: [],
    askedItemIds: [],
    answers: [],
    micState: "undecided",
    micReason: "none",
    micNeedsReopening: false,
    micRequest: null,
    recording: "idle",
    recordingRequest: null,
    timersVisible: setup.timersVisible ?? examConfig.defaultTimersVisible,
    alwaysShowExaminerText: policy.keepShowTextOpen && !!setup.alwaysShowExaminerText,
    showTextOpen: false,
    unitShowTextUsed: false,
    sheet: "none",
    leaveDialog: false,
    wakeLock: "released",
    wakeLockTipSeen: !!(setup.wakeLockTipSeen || setup.wakeLockTipPending),
    backBehaviour: setup.backBehaviour ?? examConfig.backBehaviour,
    instructionLineId:
      setup.instructionLineId === undefined ? examConfig.instructionLineId : setup.instructionLineId,
    announcements: [],
    part2StartedAtMs: null,
    pageHidden: false,
  };
  const commands: Command[] = [];
  if (setup.reloadMarker) commands.push({ type: "clearInProgressMarker" });
  if (setup.wakeLockTipPending) {
    commands.push({ type: "savePreference", key: "wakeLockTipPending", value: false });
    commands.push({ type: "savePreference", key: "wakeLockTipSeen", value: true });
  }
  if (!setup.micExplanationSeen)
    commands.push({ type: "savePreference", key: "micExplanationSeen", value: true });
  commands.push({
    type: "preload",
    clipIds: context.instructionLineId
      ? [examConfig.soundCheckClipId, context.instructionLineId]
      : [examConfig.soundCheckClipId],
    requestId: 0,
  });
  return {
    state: {
      type: "prepare.getReady",
      context,
      soundOk: false,
      soundHelp: false,
      wakeLockTip: !!setup.wakeLockTipPending && !setup.wakeLockTipSeen,
      reloadNotice: !!setup.reloadMarker,
    },
    commands,
  };
}

function activeRun(state: State): state is Run {
  return (
    "audio" in state ||
    state.type === "run.look" ||
    state.type === "run.chooseSituation" ||
    state.type === "run.unit.answering"
  );
}

function isHold(state: State) {
  return (
    state.type === "hold.paused" ||
    state.type === "hold.interrupted" ||
    state.type === "hold.blocked" ||
    state.type === "hold.audioError"
  );
}

function matches(expected: number | null, received?: number): boolean {
  return expected !== null && (received === undefined || received === expected);
}

export function transition(state: State, event: Event): Transition {
  if (!Number.isFinite(event.at)) return { state, commands: [] };
  let context = state.context;
  let next = state;
  const commands: Command[] = [];
  const { at } = event;

  function patch(update: Partial<Context>) {
    context = { ...context, ...update };
  }

  function requestId(): number {
    const id = context.sequence + 1;
    patch({ sequence: id });
    return id;
  }

  function queueAnnouncement(message: AnnouncementMessage) {
    patch({ announcements: [...context.announcements, { type: "announce", ...message }] });
  }

  function discardAnnouncements(...keys: MessageKey[]) {
    const announcements = context.announcements.filter(({ key }) => !keys.includes(key));
    if (announcements.length !== context.announcements.length) patch({ announcements });
  }

  function wake() {
    if (context.wakeLock === "unsupported" || context.pageHidden) return;
    patch({ wakeLock: "held" });
    commands.push({ type: "requestWakeLock" });
  }

  function releaseWake() {
    if (context.wakeLock !== "unsupported") patch({ wakeLock: "released" });
    commands.push({ type: "releaseWakeLock" });
  }

  function play(clip: Clip, rate = 1) {
    const id = requestId();
    commands.push({ type: "playClip", clipId: clip.id, rate, requestId: id });
    return id;
  }

  function startAudio(run: AudioRun) {
    const clip = run.audio.clips[run.audio.index];
    if (!clip) {
      next = run;
      afterAudio(run);
      return;
    }
    const playback = context.leaveDialog
      ? deferredPlayback()
      : ({ phase: "pending", requestId: play(clip, run.audio.rate) } satisfies AudioSequence["playback"]);
    next = { ...run, audio: { ...run.audio, playback } };
  }

  function deferredPlayback(): AudioSequence["playback"] {
    return { phase: "deferred" };
  }

  function sequence(clips: AudioSequence["clips"], rate = 1): AudioSequence {
    return { clips, index: 0, rate, playback: deferredPlayback() };
  }

  function gap(run: AudioRun, index: number) {
    const waiting = { ...run, audio: { ...run.audio, index } };
    if (examConfig.examinerGapMs === 0) startAudio(waiting);
    else
      next = {
        ...waiting,
        audio: {
          ...waiting.audio,
          playback: { phase: "gap", timer: countdown(examConfig.examinerGapMs, at) },
        },
      };
  }

  function reveal(topic: MockTopic) {
    patch({ topic });
    const id = requestId();
    patch({ load: countdown(ms(examConfig.slowLoadNoticeSeconds), at) });
    commands.push({ type: "preload", clipIds: preloadClipIds(topic), requestId: id });
    next = { type: "prepare.reveal", context, status: "loading", requestId: id };
  }

  function afterReady() {
    wake();
    const source = context.options.topicSource;
    const chosen =
      source.type === "chosen" ? context.topics.find(({ id }) => id === source.topicId) : undefined;
    if (chosen) {
      reveal(chosen);
      return;
    }
    const draw = drawCards(context.topics, source, context.rng);
    patch({ rng: draw.state });
    next = { type: "prepare.draw", context, cards: draw.cards };
  }

  function startAttempt() {
    if (!context.topic) return;
    const { id: topicId } = context.topic;
    const { baseAttemptId, generation } = context;
    const marker = {
      attemptId: generation === 0 ? baseAttemptId : `${baseAttemptId}:${String(generation)}`,
      mode: context.mode,
      topicId,
      startedAt: at,
    };
    patch({ marker, showTextOpen: context.alwaysShowExaminerText });
    commands.push({ type: "setInProgressMarker", marker });
    if (context.backBehaviour === "leaveDialog" && generation === 0) commands.push({ type: "armBackGuard" });
    startAudio({ type: "run.introLine", context, audio: sequence([introClip(topicId)]) });
  }

  function decideSituation(choice: SituationKey | "random") {
    if (!context.topic) return;
    const draw = choice === "random" ? chooseSituation(context.rng) : { state: context.rng, key: choice };
    const script = buildDelproeve2Script(context.topic, draw.key).filter((unit) => "question" in unit);
    if (!script.length) return;
    patch({ rng: draw.state, situationKey: draw.key, script, look: null });
    if (choice === "random")
      queueAnnouncement({ key: "mock.live.situationChosen", params: { key: draw.key } });
    startUnit(0);
  }

  function endLook() {
    patch({ look: null });
    discardAnnouncements("mock.live.lookStarted");
    queueAnnouncement({ key: "mock.live.lookEnded" });
    if (context.policy.situationChoice && context.options.situationPolicy === "learnerChooses") {
      next = { type: "run.chooseSituation", context };
    } else decideSituation("random");
  }

  function startUnit(cursor: number) {
    const unit = context.script[cursor];
    if (!unit) return;
    patch({
      cursor,
      unitStarted: false,
      unitShowTextUsed: false,
      showTextOpen:
        context.policy.keepShowTextOpen && (context.showTextOpen || context.alwaysShowExaminerText),
    });
    startAudio({ type: "run.unit.speaking", context, audio: sequence(unit.clips) });
  }

  function unitAfterAnswer(): number | null {
    let cursor = context.cursor + 1;
    if (context.u2Asked && context.limitReached) return null;
    const skipped: string[] = [];
    if (context.part1CutoffReached || context.limitReached) {
      for (
        let unit = context.script[cursor];
        unit?.role === "firstFollowup";
        unit = context.script[++cursor]
      ) {
        skipped.push(unit.id);
      }
    }
    if (skipped.length) patch({ skippedFollowups: [...new Set([...context.skippedFollowups, ...skipped])] });
    return context.script[cursor] ? cursor : null;
  }

  function nextAfterThanks() {
    const cursor = unitAfterAnswer();
    if (cursor === null) closeAttempt();
    else startUnit(cursor);
  }

  function changeAnswer(update: Partial<AnswerFacts>) {
    const itemId = context.script[context.cursor]?.id;
    patch({
      answers: context.answers.map((answer) =>
        answer.itemId === itemId ? { ...answer, ...update } : answer,
      ),
    });
  }

  function facts() {
    const itemId = context.script[context.cursor]?.id;
    return context.answers.find((answer) => answer.itemId === itemId);
  }

  function recordingTarget() {
    const attemptId = context.marker?.attemptId;
    const itemId = context.script[context.cursor]?.id;
    return attemptId && itemId ? { attemptId, itemId } : null;
  }

  function stopRecording() {
    const target = recordingTarget();
    if (target && context.recording !== "idle") commands.push({ type: "stopRecording", ...target });
    patch({ recording: "idle", recordingRequest: null });
  }

  function pauseRecording() {
    const target = recordingTarget();
    if (!target) return;
    if (context.recording === "recording" || context.recording === "starting") {
      commands.push({ type: "pauseRecording", ...target });
      patch({ recording: "paused", recordingCap: freeze(context.recordingCap, at) });
    }
  }

  function requestMic(reason: "permission" | "reacquire") {
    const id = requestId();
    patch({ micRequest: id });
    commands.push({ type: "requestMic", reason, requestId: id });
  }

  function enableRecording() {
    const target = recordingTarget();
    if (!target || context.micState !== "granted" || facts()?.recordingCapped) return;
    if (context.micNeedsReopening) {
      if (context.micRequest === null) requestMic("reacquire");
      return;
    }
    if (context.recording === "paused") {
      commands.push({ type: "resumeRecording", ...target });
      patch({
        recording: context.recordingRequest === null ? "recording" : "starting",
        recordingCap: thaw(context.recordingCap, at),
      });
    } else if (context.recording === "idle") {
      const id = requestId();
      patch({ recording: "starting", recordingRequest: id });
      commands.push({ type: "startRecording", ...target, requestId: id });
    }
  }

  function startGrace(atMs: number) {
    const role = context.script[context.cursor]?.role;
    const handover =
      (role === "firstRequired" || role === "firstFollowup") &&
      context.part1HandoverReached &&
      !context.handoverGraceStarted &&
      !context.u2Asked;
    if (context.graceNotice || context.graceCeilingReached) return;
    if (handover) {
      patch({ handoverGraceStarted: true, graceNotice: "handover" });
      commands.push({ type: "announce", key: "mock.live.handover" });
    } else if (context.limitReached) {
      patch({ graceNotice: "limit" });
      commands.push({ type: "announce", key: "mock.live.finishSentence" });
    } else return;
    patch({ grace: countdown(context.policy.graceMs, atMs) });
  }

  function answer(resuming = false) {
    const unit = context.script[context.cursor];
    if (!unit) return;
    next = { type: "run.unit.answering", context, waitingToAdvance: false };
    patch({
      answerClock: {
        elapsedMs: resuming ? elapsed(context.answerClock, at) : 0,
        since: context.sheet === "hints" ? null : at,
      },
      grace: thaw(context.grace, at),
    });
    if (!resuming) {
      const newAnswer: AnswerFacts = {
        itemId: unit.id,
        answerMs: 0,
        repeats: 0,
        slowRepeats: 0,
        showTextUsed: context.showTextOpen || context.unitShowTextUsed,
        recorded: false,
        recordingCapped: false,
        recordingParts: 0,
      };
      patch({ answersStarted: context.answersStarted + 1, answers: [...context.answers, newAnswer] });
      commands.push({
        type: "announce",
        key:
          context.answersStarted === 1 && context.micState === "granted" && !context.micNeedsReopening
            ? "mock.live.yourTurnRecording"
            : "mock.live.yourTurn",
      });
    }
    startGrace(at);
    enableRecording();
  }

  function saveAnswer(atMs: number) {
    if (context.answerClock) changeAnswer({ answerMs: elapsed(context.answerClock, atMs) });
  }

  function finishAnswer(atMs: number) {
    stopRecording();
    saveAnswer(atMs);
    patch({ answerClock: null, grace: null, graceNotice: null, recordingCap: null, sheet: "none" });
    if (context.leaveDialog) next = { type: "run.unit.answering", context, waitingToAdvance: true };
    else afterAnswer();
  }

  function afterAnswer() {
    if (unitAfterAnswer() === null) closeAttempt();
    else startAudio({ type: "run.thanks", context, audio: sequence([thanksClip]) });
  }

  function afterAudio(run: AudioRun) {
    if (context.leaveDialog && run.type !== "run.introLine") {
      next = { ...run, audio: { ...run.audio, index: run.audio.clips.length, playback: deferredPlayback() } };
      return;
    }
    switch (run.type) {
      case "run.introLine":
        patch({ look: countdown(ms(examConfig.lookSeconds), at) });
        next = { type: "run.look", context };
        queueAnnouncement({ key: "mock.live.lookStarted" });
        return;
      case "run.unit.speaking":
        answer();
        return;
      case "run.unit.repeating":
        if (context.graceCeilingReached) finishAnswer(at);
        else answer(true);
        return;
      case "run.thanks":
        nextAfterThanks();
        return;
      default: {
        const exhaustive: never = run;
        return exhaustive;
      }
    }
  }

  function makeAttempt(status: AttemptRecord["status"]): AttemptRecord | null {
    if (!context.marker) return null;
    saveAnswer(at);
    return {
      ...context.marker,
      part: 2,
      situationKey: context.situationKey,
      totalMs: elapsed(context.examClock, at),
      status,
      askedItemIds: context.askedItemIds,
      skippedFollowups: context.skippedFollowups,
      answers: context.answers,
    };
  }

  function releaseMic() {
    patch({ micNeedsReopening: context.micState === "granted", micRequest: null });
    commands.push({ type: "releaseMic" });
  }

  function clearTimers() {
    patch({
      look: null,
      load: null,
      grace: null,
      graceNotice: null,
      recordingCap: null,
      answerClock: null,
      examClock: context.examClock && { elapsedMs: elapsed(context.examClock, at), since: null },
    });
  }

  function closeAttempt() {
    const attempt = makeAttempt(context.interrupted ? "interrupted" : "completed");
    if (!attempt) return;
    discardAnnouncements("mock.live.oneMinuteLeft");
    stopRecording();
    releaseMic();
    clearTimers();
    commands.push({ type: "persistAttempt", attempt }, { type: "clearInProgressMarker" });
    patch({ marker: null });
    const id = play(closingClip);
    next = { type: "run.closing", context, attempt, requestId: id, saveFailed: false };
  }

  function finishClosing(closing: Extract<State, { type: "run.closing" }>) {
    releaseWake();
    if (context.backBehaviour === "leaveDialog") commands.push({ type: "disarmBackGuard" });
    next = {
      type: "finished",
      context,
      attempt: closing.attempt,
      reviewed: false,
      saveFailed: closing.saveFailed,
    };
    queueAnnouncement({ key: "mock.live.examOver" });
  }

  function leave(
    action: "leave" | "route" | "review" | "back",
    status: AttemptRecord["status"] = "endedEarly",
  ) {
    const attempt =
      action === "review" || (action === "back" && context.answersStarted > 0) ? makeAttempt(status) : null;
    const marker = context.marker;
    commands.push({ type: "stopAudio" });
    stopRecording();
    if (marker && !attempt) commands.push({ type: "discardAttemptRecordings", attemptId: marker.attemptId });
    releaseMic();
    releaseWake();
    clearTimers();
    if (attempt) commands.push({ type: "persistAttempt", attempt });
    if (marker) {
      commands.push({ type: "clearInProgressMarker" });
      if (context.backBehaviour === "leaveDialog") commands.push({ type: "disarmBackGuard" });
    } else if (next.type === "run.closing" && context.backBehaviour === "leaveDialog") {
      commands.push({ type: "disarmBackGuard" });
    }
    patch({ marker: null, leaveDialog: false, sheet: "none", announcements: [] });
    if (action === "review" && attempt) commands.push({ type: "navigate", to: "review", attempt });
    if (action === "leave" || action === "back")
      commands.push({
        type: "navigate",
        to: "mock",
        ...(action === "back"
          ? { noticeKey: attempt ? "mock.back.saved" : "mock.back.unsaved", attempt: attempt ?? undefined }
          : {}),
      });
    next = { type: "left", context, attempt: attempt ?? undefined };
  }

  function freezeRun() {
    patch({
      examClock: context.examClock && { elapsedMs: elapsed(context.examClock, at), since: null },
      answerClock: context.answerClock && { elapsedMs: elapsed(context.answerClock, at), since: null },
      look: freeze(context.look, at),
      grace: freeze(context.grace, at),
      recordingCap: freeze(context.recordingCap, at),
    });
  }

  function thawExam() {
    if (context.examClock && !context.graceCeilingReached)
      patch({ examClock: { ...context.examClock, since: at } });
  }

  function pausedPoint(point: Run): Run {
    if ("audio" in point && point.audio.playback.phase === "gap") {
      return {
        ...point,
        audio: {
          ...point.audio,
          playback: { phase: "gap", timer: countdown(remaining(point.audio.playback.timer, at), null) },
        },
      };
    }
    return point;
  }

  function pause(point: Run, pausedByDialog: boolean) {
    if ("audio" in point) commands.push({ type: "pauseAudio" });
    pauseRecording();
    freezeRun();
    releaseWake();
    next = { type: "hold.paused", context, point: pausedPoint(point), pausedByDialog };
    discardAnnouncements("mock.live.resumed");
    queueAnnouncement({ key: "mock.live.paused" });
  }

  function resumePaused(point: Run) {
    wake();
    thawExam();
    discardAnnouncements("mock.live.paused");
    queueAnnouncement({ key: "mock.live.resumed" });
    if ("audio" in point) {
      const playback = point.audio.playback;
      if (playback.phase === "gap")
        next = {
          ...point,
          audio: {
            ...point.audio,
            playback: { phase: "gap", timer: countdown(playback.timer.remainingMs, at) },
          },
        };
      else if (point.type === "run.unit.repeating" && !point.recovering) {
        startAudio({ ...point, audio: sequence(point.audio.clips, point.audio.rate) });
      } else startAudio(point);
    } else if (point.type === "run.unit.answering") {
      if (point.waitingToAdvance) afterAnswer();
      else answer(true);
    } else {
      if (point.type === "run.look" && point.context.look?.deadline != null) {
        patch({ look: thaw(context.look, at) });
      }
      next = point;
    }
  }

  function interrupt(point: Run, away: boolean) {
    discardAnnouncements("mock.live.paused", "mock.live.resumed");
    const hadRecording = context.recording !== "idle";
    commands.push({ type: "stopAudio" });
    stopRecording();
    if (hadRecording) patch({ micNeedsReopening: true });
    freezeRun();
    if (away) releaseWake();
    patch({ interrupted: context.interrupted || context.policy.labelInterruptions, leaveDialog: false });
    next = {
      type: "hold.interrupted",
      context,
      point,
      status: away ? "away" : "choosing",
      frozenAtMs: elapsed(context.examClock, at),
      reacquiring: false,
    };
  }

  function resumeInterrupted(point: Run) {
    thawExam();
    if (point.type === "run.look") {
      patch({ look: countdown(ms(examConfig.lookSeconds), at) });
      next = point;
    } else if (point.type === "run.chooseSituation") next = point;
    else if (point.type === "run.thanks") nextAfterThanks();
    else if (point.type === "run.unit.answering" && point.waitingToAdvance) afterAnswer();
    else if (point.type === "run.unit.answering" || point.type === "run.unit.repeating")
      replay(false, 1, true);
    else if ("audio" in point) startAudio(point);
  }

  function restart() {
    const marker = context.marker;
    if (!marker) return;
    commands.push({ type: "stopAudio" }, { type: "discardAttemptRecordings", attemptId: marker.attemptId });
    patch({
      generation: context.generation + 1,
      situationKey: null,
      script: [],
      cursor: 0,
      look: null,
      examClock: null,
      answerClock: null,
      recordingCap: null,
      grace: null,
      limitReached: false,
      part1CutoffReached: false,
      part1HandoverReached: false,
      handoverGraceStarted: false,
      graceCeilingReached: false,
      graceNotice: null,
      minuteNoticePassed: false,
      interrupted: false,
      skippedFollowups: [],
      askedItemIds: [],
      answersStarted: 0,
      answers: [],
      unitStarted: false,
      u2Asked: false,
      micRequest: null,
      sheet: "none",
      leaveDialog: false,
      showTextOpen: false,
      announcements: [],
      part2StartedAtMs: null,
    });
    startAttempt();
  }

  function replay(withIntro: boolean, rate: number, recovering = false) {
    const unit = context.script[context.cursor];
    if (!unit) return;
    const current = facts();
    if (!recovering && current) {
      changeAnswer({ repeats: current.repeats + 1, slowRepeats: current.slowRepeats + Number(rate !== 1) });
    }
    pauseRecording();
    patch({
      answerClock: { elapsedMs: elapsed(context.answerClock, at), since: null },
      grace: freeze(context.grace, at),
      sheet: "none",
    });
    startAudio({
      type: "run.unit.repeating",
      context,
      recovering,
      audio: sequence(withIntro ? unit.clips : [unit.question], rate),
    });
  }

  function openLeave() {
    if (context.leaveDialog || (!activeRun(next) && !isHold(next))) return;
    patch({ leaveDialog: true });
    if (context.policy.canPause && activeRun(next)) pause(next, true);
    else if ("audio" in next && next.audio.playback.phase === "pending") {
      commands.push({ type: "stopAudio" });
      next = { ...next, audio: { ...next.audio, playback: deferredPlayback() } };
    } else if ((next.type === "hold.blocked" || next.type === "hold.audioError") && next.retryId !== null) {
      commands.push({ type: "stopAudio" });
      next = { ...next, retryId: null };
    }
  }

  function cancelLeave() {
    if (!context.leaveDialog) return;
    patch({ leaveDialog: false });
    if (next.type === "hold.paused" && next.pausedByDialog) resumePaused(next.point);
    else if ("audio" in next && next.audio.playback.phase === "deferred") startAudio(next);
    else if (next.type === "run.unit.answering" && next.waitingToAdvance) afterAnswer();
  }

  function setHints(open: boolean) {
    if (!context.policy.hints || next.type !== "run.unit.answering" || next.waitingToAdvance) return;
    if ((context.sheet === "hints") === open) return;
    patch({
      sheet: open ? "hints" : "none",
      answerClock: {
        elapsedMs: elapsed(context.answerClock, at),
        since: open ? null : at,
      },
    });
  }

  function skipPendingFollowup(limit: boolean) {
    if (next.type !== "run.unit.speaking" || context.unitStarted) return;
    const unit = context.script[context.cursor];
    if (unit?.role === "firstFollowup") {
      if (next.audio.playback.phase === "pending") commands.push({ type: "stopAudio" });
      patch({ skippedFollowups: [...context.skippedFollowups, unit.id] });
      const cursor = unitAfterAnswer();
      if (cursor !== null) startUnit(cursor);
    } else if (limit && unit?.role === "secondFollowup") {
      if (next.audio.playback.phase === "pending") commands.push({ type: "stopAudio" });
      if (context.leaveDialog) {
        next = { type: "run.unit.answering", context, waitingToAdvance: true };
      } else closeAttempt();
    }
  }

  function drainDeadlines() {
    let delayedGap: AudioRun | undefined;
    let due = nextDue({ ...next, context });
    while (due && due.at <= at) {
      switch (due.kind) {
        case "load":
          patch({ load: null });
          if (next.type === "prepare.reveal") next = { ...next, status: "slow" };
          break;
        case "look":
          endLook();
          break;
        case "gap":
          if ("audio" in next) {
            delayedGap = { ...next, audio: { ...next.audio, playback: deferredPlayback() } };
            next = delayedGap;
          }
          break;
        case "cutoff":
          patch({ part1CutoffReached: true });
          skipPendingFollowup(false);
          break;
        case "handover":
          patch({ part1HandoverReached: true });
          if (next.type === "run.unit.answering" && !next.waitingToAdvance) startGrace(due.at);
          break;
        case "minute":
          patch({ minuteNoticePassed: true });
          queueAnnouncement({ key: "mock.live.oneMinuteLeft" });
          break;
        case "limit":
          patch({ limitReached: true });
          discardAnnouncements("mock.live.oneMinuteLeft");
          if (next.type === "run.unit.answering" && !next.waitingToAdvance) startGrace(due.at);
          if (
            next.type === "run.thanks" &&
            (next.audio.playback.phase === "gap" || next.audio.playback.phase === "deferred") &&
            context.u2Asked
          )
            afterAudio(next);
          else skipPendingFollowup(true);
          break;
        case "ceiling":
          patch({
            graceCeilingReached: true,
            grace: null,
            examClock: { elapsedMs: ms(examConfig.graceCeilingSeconds), since: null },
          });
          break;
        case "grace":
          finishAnswer(due.at);
          break;
        case "cap":
          stopRecording();
          patch({ recordingCap: null });
          changeAnswer({ recordingCapped: true });
          discardAnnouncements("mock.live.rerecording");
          queueAnnouncement({ key: "mock.live.recordingCapped" });
          break;
        default: {
          const exhaustive: never = due.kind;
          return exhaustive;
        }
      }
      due = nextDue({ ...next, context });
    }
    if (delayedGap && next === delayedGap) startAudio(delayedGap);
  }

  function clipStarted(run: AudioRun) {
    const playback = run.audio.playback;
    if (playback.phase !== "pending") return;
    next = { ...run, audio: { ...run.audio, playback: { ...playback, phase: "playing" } } };
    if (run.type !== "run.unit.speaking") return;
    const unit = context.script[context.cursor];
    if (!unit) return;
    if (run.audio.index === 0) {
      patch({ unitStarted: true });
      if (unit.role === "firstRequired" && context.examClock === null) {
        patch({ examClock: { elapsedMs: 0, since: at } });
      }
      if (unit.role === "secondRequired" && context.part2StartedAtMs === null) {
        patch({ part2StartedAtMs: elapsed(context.examClock, at) });
      }
    }
    if (
      run.audio.clips[run.audio.index]?.id === unit.question.id &&
      !context.askedItemIds.includes(unit.id)
    ) {
      patch({
        askedItemIds: [...context.askedItemIds, unit.id],
        u2Asked: context.u2Asked || unit.role === "secondRequired",
      });
    }
  }

  function matchesRunClip(run: AudioRun, feedback: Extract<Event, { clipId: string }>) {
    const playback = run.audio.playback;
    if (playback.phase !== "playing" && playback.phase !== "pending") return false;
    if (feedback.type === "CLIP_STARTED" && playback.phase !== "pending") return false;
    if (feedback.type === "CLIP_ENDED" && playback.phase !== "playing") return false;
    return (
      matches(playback.requestId, feedback.requestId) &&
      feedback.clipId === run.audio.clips[run.audio.index]?.id
    );
  }

  function audioFeedback(feedback: Extract<Event, { clipId: string }>) {
    if (next.type === "prepare.instruction") {
      if (
        feedback.clipId === next.clipId &&
        matches(next.requestId, feedback.requestId) &&
        feedback.type === "CLIP_ENDED"
      ) {
        commands.push({ type: "stopAudio" });
        afterReady();
      }
      return;
    }
    if (next.type === "run.closing") {
      if (
        feedback.clipId === closingClip.id &&
        matches(next.requestId, feedback.requestId) &&
        feedback.type !== "CLIP_STARTED"
      ) {
        finishClosing(next);
      }
      return;
    }
    if (next.type === "hold.blocked" || next.type === "hold.audioError") {
      if (
        !matches(next.retryId, feedback.requestId) ||
        feedback.clipId !== next.point.audio.clips[next.point.audio.index]?.id
      )
        return;
      if (feedback.type === "CLIP_STARTED" && next.retryId !== null) {
        const point = next.point;
        const id = next.retryId;
        thawExam();
        clipStarted({ ...point, audio: { ...point.audio, playback: { phase: "pending", requestId: id } } });
      } else if (feedback.type !== "CLIP_ENDED") {
        const blocked = feedback.type === "PLAYBACK_BLOCKED";
        if (!blocked && context.policy.labelInterruptions) patch({ interrupted: true });
        next = {
          ...next,
          type: blocked ? "hold.blocked" : "hold.audioError",
          retryId: null,
          failedAgain: true,
        };
      }
      return;
    }
    if (!("audio" in next)) return;
    if (!matchesRunClip(next, feedback)) return;
    drainDeadlines();
    if (!("audio" in next) || !matchesRunClip(next, feedback)) return;
    if (feedback.type === "CLIP_STARTED") clipStarted(next);
    else if (
      feedback.type === "CLIP_ENDED" ||
      (feedback.type === "CLIP_FAILED" && next.type === "run.thanks")
    ) {
      if (next.audio.index + 1 < next.audio.clips.length) gap(next, next.audio.index + 1);
      else if (next.type === "run.thanks" && (!context.limitReached || !context.u2Asked))
        gap(next, next.audio.clips.length);
      else afterAudio(next);
    } else {
      const blocked = feedback.type === "PLAYBACK_BLOCKED";
      freezeRun();
      if (!blocked && context.policy.labelInterruptions) patch({ interrupted: true });
      next = {
        type: blocked ? "hold.blocked" : "hold.audioError",
        context,
        point: next,
        retryId: null,
        failedAgain: false,
      };
    }
  }

  function canActOnAnswer(): boolean {
    return next.type === "run.unit.answering" && !next.waitingToAdvance && !context.leaveDialog;
  }

  function handle() {
    switch (event.type) {
      case "OPTIONS_SET":
        if (next.type === "prepare.getReady" && context.policy.topicChoice)
          patch({ options: { ...context.options, ...event.options } });
        return;
      case "DISMISS_RELOAD_NOTICE":
        if (next.type === "prepare.getReady" && next.reloadNotice) next = { ...next, reloadNotice: false };
        return;
      case "SOUND_CHECK_PLAY":
        if (next.type === "prepare.getReady" && !next.reloadNotice) {
          commands.push({ type: "stopAudio" });
          play({ id: examConfig.soundCheckClipId });
        }
        return;
      case "SOUND_CHECK_HEARD":
      case "SOUND_CHECK_PROBLEM":
        if (next.type === "prepare.getReady" && !next.reloadNotice)
          next = {
            ...next,
            soundOk: event.type === "SOUND_CHECK_HEARD",
            soundHelp: event.type === "SOUND_CHECK_PROBLEM",
          };
        return;
      case "MIC_ALLOW":
        if (
          next.type === "prepare.getReady" &&
          !next.reloadNotice &&
          context.micState === "undecided" &&
          context.micRequest === null
        ) {
          requestMic("permission");
        }
        return;
      case "MIC_SKIP":
        if (next.type === "prepare.getReady" && !next.reloadNotice && context.micState !== "skipped") {
          if (context.micState === "granted" || context.micRequest !== null) releaseMic();
          patch({ micState: "skipped" });
        }
        return;
      case "MIC_GRANTED":
      case "MIC_DENIED":
      case "MIC_UNAVAILABLE":
        if (next.type === "prepare.getReady" && matches(context.micRequest, event.requestId))
          patch({
            micState:
              event.type === "MIC_GRANTED"
                ? "granted"
                : event.type === "MIC_DENIED"
                  ? "denied"
                  : "unavailable",
            micReason: event.reason ?? "none",
            micRequest: null,
          });
        return;
      case "CONTINUE":
        if (next.type === "prepare.getReady" && !next.reloadNotice && context.micState !== "undecided") {
          commands.push({ type: "stopAudio" });
          const clipId = context.instructionLineId;
          if (clipId)
            next = { type: "prepare.instruction", context, clipId, requestId: play({ id: clipId }) };
          else afterReady();
        }
        return;
      case "INSTRUCTION_SKIP":
        if (next.type === "prepare.instruction") {
          commands.push({ type: "stopAudio" });
          afterReady();
        }
        return;
      case "CARD_TAPPED":
        if (next.type === "prepare.draw") {
          const topic = next.cards[event.index];
          if (topic) {
            reveal(topic);
            queueAnnouncement({
              key: "mock.live.revealed",
              params: { letter: topic.letter, topicName: { topicId: topic.id, field: "title" } },
            });
          }
        }
        return;
      case "RETRY_LOAD":
        if (
          next.type === "prepare.reveal" &&
          (next.status === "failed" || next.status === "slow") &&
          context.topic
        )
          reveal(context.topic);
        return;
      case "ASSETS_LOADED":
      case "ASSETS_FAILED":
        if (
          next.type === "prepare.reveal" &&
          (next.status === "loading" || next.status === "slow") &&
          matches(next.requestId, event.requestId)
        ) {
          patch({ load: null });
          next = { ...next, status: event.type === "ASSETS_LOADED" ? "loaded" : "failed" };
        }
        return;
      case "START":
        if (next.type === "prepare.reveal" && next.status === "loaded") startAttempt();
        return;
      case "LOOK_PAUSE":
      case "LOOK_RESUME":
      case "LOOK_EXTEND":
      case "LOOK_SKIP":
        if (next.type !== "run.look" || !context.policy.lookAdjustable || !context.look) return;
        if (event.type === "LOOK_PAUSE" && context.look.deadline !== null)
          patch({ look: freeze(context.look, at) });
        if (event.type === "LOOK_RESUME" && context.look.deadline === null)
          patch({ look: thaw(context.look, at) });
        if (event.type === "LOOK_EXTEND")
          patch({
            look: countdown(
              remaining(context.look, at) + ms(examConfig.lookExtendSeconds),
              context.look.deadline === null ? null : at,
            ),
          });
        if (event.type === "LOOK_SKIP") endLook();
        return;
      case "SITUATION_CHOSEN":
        if (next.type === "run.chooseSituation" && !context.leaveDialog) decideSituation(event.key);
        return;
      case "CLIP_STARTED":
      case "CLIP_ENDED":
      case "CLIP_FAILED":
      case "PLAYBACK_BLOCKED":
        audioFeedback(event);
        return;
      case "DONE":
        if (canActOnAnswer()) {
          drainDeadlines();
          if (canActOnAnswer()) finishAnswer(at);
        }
        return;
      case "REPEAT":
      case "REPEAT_INTRO": {
        if (!canActOnAnswer()) return;
        const rate = event.type === "REPEAT" ? event.rate : 1;
        if (event.type === "REPEAT_INTRO" && context.script[context.cursor]?.role !== "firstRequired") return;
        if (
          rate !== 1 &&
          !(context.policy.slowRepeat && rate === examConfig.slowRepeatRate && (facts()?.repeats ?? 0) >= 1)
        )
          return;
        drainDeadlines();
        if (canActOnAnswer() && !context.graceCeilingReached) replay(event.type === "REPEAT_INTRO", rate);
        return;
      }
      case "RERECORD": {
        if (
          next.type !== "run.unit.answering" ||
          !context.policy.reRecord ||
          context.leaveDialog ||
          context.micState !== "granted" ||
          context.recording === "starting"
        )
          return;
        const target = recordingTarget();
        if (!target || facts()?.recorded !== true) return;
        stopRecording();
        commands.push({ type: "discardRecording", ...target });
        changeAnswer({ recorded: false, recordingParts: 0, recordingCapped: false });
        patch({
          answerClock: { elapsedMs: 0, since: context.sheet === "hints" ? null : at },
          recordingCap: null,
        });
        enableRecording();
        discardAnnouncements("mock.live.recordingCapped", "mock.live.rerecording");
        queueAnnouncement({ key: "mock.live.rerecording" });
        return;
      }
      case "RECORDING_STARTED":
        if (
          matches(context.recordingRequest, event.requestId) &&
          (context.recording === "starting" || context.recording === "paused")
        ) {
          const recording = context.recording === "starting";
          changeAnswer({ recorded: true, recordingParts: (facts()?.recordingParts ?? 0) + 1 });
          patch({
            recording: recording ? "recording" : "paused",
            recordingRequest: null,
            recordingCap: context.recordingCap
              ? recording
                ? thaw(context.recordingCap, at)
                : context.recordingCap
              : countdown(ms(examConfig.maxRecordingSeconds), recording ? at : null),
          });
        }
        return;
      case "RECORDING_FAILED":
        if (matches(context.recordingRequest, event.requestId)) {
          stopRecording();
          patch({ micState: "unavailable", recordingCap: null });
          releaseMic();
          discardAnnouncements("mock.live.rerecording");
          queueAnnouncement({ key: "mock.live.notRecording" });
        }
        return;
      case "HINTS_OPENED":
      case "HINTS_CLOSED":
        if (!context.leaveDialog) setHints(event.type === "HINTS_OPENED");
        return;
      case "SHOW_TEXT":
      case "HIDE_TEXT":
        if (
          !activeRun(next) ||
          context.leaveDialog ||
          (event.type === "HIDE_TEXT" && context.policy.keepShowTextOpen)
        )
          return;
        if (context.showTextOpen !== (event.type === "SHOW_TEXT"))
          patch({ showTextOpen: event.type === "SHOW_TEXT" });
        if (event.type === "SHOW_TEXT") {
          if (next.type === "run.unit.speaking") patch({ unitShowTextUsed: true });
          if (next.type === "run.unit.answering" || next.type === "run.unit.repeating") {
            changeAnswer({ showTextUsed: true });
          }
        }
        return;
      case "TIMERS_TOGGLED":
        if (next.type !== "left" && !context.leaveDialog) {
          patch({ timersVisible: !context.timersVisible });
          commands.push({ type: "savePreference", key: "timersVisible", value: context.timersVisible });
        }
        return;
      case "PAUSE":
        if (context.policy.canPause && activeRun(next)) pause(next, false);
        return;
      case "RESUME":
        if (next.type === "hold.paused" && !context.leaveDialog) resumePaused(next.point);
        return;
      case "APP_HIDDEN":
      case "AUDIO_INTERRUPTED":
        if (event.type === "APP_HIDDEN" && next.type !== "left") patch({ pageHidden: true });
        if (next.type === "run.closing" && event.type === "APP_HIDDEN") {
          commands.push({ type: "stopAudio" });
          finishClosing(next);
        } else if (activeRun(next)) interrupt(next, event.type === "APP_HIDDEN");
        else if (next.type === "hold.paused" && next.pausedByDialog) {
          interrupt(next.point, event.type === "APP_HIDDEN");
        } else if (isHold(next)) {
          patch({ leaveDialog: false });
          if (event.type === "APP_HIDDEN" && next.type !== "hold.paused") {
            releaseWake();
            if (context.policy.labelInterruptions) patch({ interrupted: true });
            if (next.type === "hold.interrupted") next = { ...next, status: "away" };
            if ((next.type === "hold.audioError" || next.type === "hold.blocked") && next.retryId !== null) {
              commands.push({ type: "stopAudio" });
              next = { ...next, retryId: null };
            }
          }
        } else if (
          event.type === "APP_HIDDEN" &&
          (next.type === "prepare.draw" || next.type === "prepare.reveal")
        )
          releaseWake();
        return;
      case "APP_VISIBLE":
        if (next.type === "left") return;
        patch({ pageHidden: false });
        if (next.type === "finished") return;
        if (next.type === "hold.interrupted" && next.status === "away")
          next = { ...next, status: "choosing" };
        if (
          next.type !== "hold.paused" &&
          next.type !== "prepare.getReady" &&
          next.type !== "prepare.instruction"
        )
          wake();
        return;
      case "MIC_MUTED":
      case "MIC_ENDED":
        if (context.micState !== "granted" || (!activeRun(next) && !isHold(next))) return;
        patch({ micNeedsReopening: true });
        if (next.type === "run.unit.answering" && !next.waitingToAdvance) interrupt(next, false);
        else if (context.recording === "paused") stopRecording();
        return;
      case "CONTINUE_AFTER_INTERRUPTION":
        if (
          next.type === "hold.interrupted" &&
          next.status === "choosing" &&
          !next.reacquiring &&
          !context.leaveDialog
        ) {
          if (
            context.micState === "granted" &&
            context.micNeedsReopening &&
            (next.point.type === "run.unit.answering" || next.point.type === "run.unit.repeating")
          ) {
            if (context.micRequest === null) requestMic("reacquire");
            next = { ...next, reacquiring: true };
          } else resumeInterrupted(next.point);
        }
        return;
      case "MIC_REACQUIRED":
      case "MIC_REACQUIRE_FAILED":
        if (context.micState !== "granted" || !matches(context.micRequest, event.requestId)) return;
        patch({ micNeedsReopening: false, micRequest: null });
        if (event.type === "MIC_REACQUIRE_FAILED") {
          patch({ micState: "unavailable", recordingCap: null });
          stopRecording();
          releaseMic();
          discardAnnouncements("mock.live.rerecording");
          queueAnnouncement({ key: "mock.live.notRecording" });
        }
        if (next.type === "hold.interrupted" && next.reacquiring) {
          if (!context.leaveDialog && next.status === "choosing") resumeInterrupted(next.point);
          else next = { ...next, reacquiring: false };
        } else if (next.type === "run.unit.answering" && !next.waitingToAdvance) enableRecording();
        return;
      case "TAP_TO_HEAR":
      case "RETRY_AUDIO":
        if (
          ((event.type === "TAP_TO_HEAR" && next.type === "hold.blocked") ||
            (event.type === "RETRY_AUDIO" && next.type === "hold.audioError")) &&
          next.retryId === null &&
          !context.leaveDialog &&
          !context.pageHidden
        ) {
          const clip = next.point.audio.clips[next.point.audio.index];
          if (clip) next = { ...next, retryId: play(clip, next.point.audio.rate) };
        }
        return;
      case "RESTART":
        if (
          next.type === "hold.interrupted" &&
          next.status === "choosing" &&
          !context.leaveDialog &&
          !next.reacquiring
        )
          restart();
        return;
      case "LEAVE_REQUESTED":
        if (next.type.startsWith("prepare.")) leave("leave");
        else openLeave();
        return;
      case "LEAVE_CANCELLED":
        if (context.leaveDialog) {
          drainDeadlines();
          cancelLeave();
        }
        return;
      case "LEAVE_CONFIRMED":
        if (context.leaveDialog || activeRun(next) || isHold(next)) leave("leave");
        return;
      case "BACK_PRESSED":
        if (context.backBehaviour !== "leaveDialog" || (!context.marker && next.type !== "run.closing"))
          return;
        commands.push({ type: "rearmBackGuard" });
        if (context.leaveDialog) cancelLeave();
        else if (context.sheet === "hints") {
          if (next.type === "hold.paused") patch({ sheet: "none" });
          else setHints(false);
        } else openLeave();
        return;
      case "NAVIGATED_AWAY":
        if (next.type !== "left")
          leave(
            context.marker && event.reason === "back" && context.backBehaviour === "endEarly"
              ? "back"
              : "route",
          );
        return;
      case "END_AND_REVIEW":
        if (context.leaveDialog || next.type === "hold.paused") {
          if (context.answersStarted > 0) leave("review");
        } else if (
          next.type === "hold.audioError" ||
          (next.type === "hold.interrupted" && next.status === "choosing")
        ) {
          leave("review", context.interrupted ? "interrupted" : "endedEarly");
        }
        return;
      case "GO_TO_REVIEW":
        if (next.type === "finished" && !next.reviewed) {
          commands.push({ type: "navigate", to: "review", attempt: next.attempt });
          next = { ...next, reviewed: true };
        }
        return;
      case "PERSIST_FAILED":
        if (
          (next.type === "run.closing" || next.type === "finished" || next.type === "left") &&
          next.attempt?.attemptId === event.attemptId &&
          !next.saveFailed
        ) {
          next = { ...next, saveFailed: true };
          queueAnnouncement({ key: "mock.live.saveFailed" });
        }
        return;
      case "WAKE_LOCK_UNSUPPORTED":
        if (context.wakeLock !== "unsupported" && next.type !== "left") {
          patch({ wakeLock: "unsupported" });
          if (!context.wakeLockTipSeen)
            commands.push({ type: "savePreference", key: "wakeLockTipPending", value: true });
        }
        return;
      case "WAKE_LOCK_LOST":
        if (context.wakeLock === "held") patch({ wakeLock: "released" });
        return;
      case "TICK":
        drainDeadlines();
        return;
      default: {
        const exhaustive: never = event;
        return exhaustive;
      }
    }
  }

  handle();
  const audioBusy =
    next.type === "run.closing" ||
    ("audio" in next &&
      (next.audio.playback.phase === "playing" || next.audio.playback.phase === "pending")) ||
    ((next.type === "hold.audioError" || next.type === "hold.blocked") && next.retryId !== null);
  // The answer clock stays present while the answer is suspended by a repeat or hold.
  if (
    context.answerClock === null &&
    !audioBusy &&
    !context.pageHidden &&
    !context.leaveDialog &&
    context.announcements.length > 0
  ) {
    commands.push(...context.announcements);
    patch({ announcements: [] });
  }
  return { state: next.context === context ? next : { ...next, context }, commands };
}
