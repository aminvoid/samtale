import type { Followup, TopicFile } from "@/lib/content/schema/authoring";

export type Mode = "practice" | "exam";
export type SituationKey = "A" | "B";
export type TopicSource =
  { type: "draw" } | { type: "drawFromTheme"; themeId: string } | { type: "chosen"; topicId: string };
export type BackBehaviour = "leaveDialog" | "endEarly";
export type MicState = "undecided" | "granted" | "denied" | "unavailable" | "skipped";
export type MicReason = "none" | "in-use" | "insecure" | "other";

/** Structural projection of the published topic. Titles and prompts use text.da,
 * situation keys come from situations[].key, and section question/followups
 * map directly to q1/q2 and their suggested follow-ups. The host only supplies
 * mock-ready topics with both situation intros and both required questions. */
export interface MockTopic extends Readonly<Pick<TopicFile, "id" | "termId" | "themeId" | "letter">> {
  readonly title: { readonly da: string };
  readonly situations: readonly [MockSituation, MockSituation];
  readonly general: MockSection;
}

export interface MockPrompt {
  readonly id: string;
  readonly text: { readonly da: string };
  readonly spoken?: Readonly<Pick<NonNullable<Followup["spoken"]>, "pauseMs">> & {
    readonly parts: readonly string[];
  };
}

interface MockSection {
  readonly question: MockPrompt;
  readonly followups: readonly MockPrompt[];
}

interface MockSituation extends MockSection {
  readonly key: SituationKey;
  readonly intro: MockPrompt;
}

export interface Clip {
  readonly id: string;
  readonly textDa?: string;
  /** A single prerecorded asset contains both phrases and the silence (SSML). */
  readonly spoken?: {
    readonly question: string;
    readonly pauseMs: number;
    readonly ending: string;
  };
}

export interface QuestionUnit {
  readonly role: "firstRequired" | "firstFollowup" | "secondRequired" | "secondFollowup";
  readonly id: string;
  readonly clips: readonly [Clip, ...Clip[]];
  readonly question: Clip;
}

export type Unit = QuestionUnit | { readonly role: "intro" | "closing"; readonly clips: readonly [Clip] };

export interface ModePolicy {
  readonly canPause: boolean;
  readonly lookAdjustable: boolean;
  readonly examLimitMs: number | null;
  readonly graceMs: number;
  readonly hints: boolean;
  readonly reRecord: boolean;
  readonly topicChoice: boolean;
  readonly situationChoice: boolean;
  readonly keepShowTextOpen: boolean;
  readonly showFixedLineMeaning: boolean;
  readonly slowRepeat: boolean;
  readonly labelInterruptions: boolean;
}

export interface PracticeOptions {
  readonly topicSource: TopicSource;
  readonly situationPolicy: "random" | "learnerChooses";
  readonly pacingAidOpen: boolean;
}

export interface InProgressMarker {
  readonly attemptId: string;
  readonly mode: Mode;
  readonly topicId: string;
  readonly startedAt: number;
}

export interface Setup {
  readonly mode: Mode;
  readonly seed: number;
  /** Unique per runner instance, generated outside the reducer. */
  readonly attemptId: string;
  readonly topics: readonly MockTopic[];
  readonly options?: Partial<PracticeOptions>;
  readonly timersVisible?: boolean;
  readonly alwaysShowExaminerText?: boolean;
  readonly instructionLineId?: string | null;
  readonly backBehaviour?: BackBehaviour;
  readonly micExplanationSeen?: boolean;
  readonly wakeLockTipPending?: boolean;
  readonly wakeLockTipSeen?: boolean;
  readonly reloadMarker?: InProgressMarker;
}

export interface Stopwatch {
  readonly elapsedMs: number;
  readonly since: number | null;
}

export interface Countdown {
  readonly remainingMs: number;
  readonly deadline: number | null;
}

export interface AnswerFacts {
  readonly itemId: string;
  readonly answerMs: number;
  readonly repeats: number;
  readonly slowRepeats: number;
  readonly showTextUsed: boolean;
  readonly recorded: boolean;
  readonly recordingCapped: boolean;
  readonly recordingParts: number;
}

export interface AttemptRecord extends InProgressMarker {
  readonly part: 2;
  readonly situationKey: SituationKey | null;
  readonly totalMs: number;
  readonly status: "completed" | "interrupted" | "endedEarly";
  readonly askedItemIds: readonly string[];
  readonly skippedFollowups: readonly string[];
  readonly answers: readonly AnswerFacts[];
}

export type MessageKey = `mock.live.${
  | "revealed"
  | "lookStarted"
  | "lookEnded"
  | "situationChosen"
  | "yourTurnRecording"
  | "yourTurn"
  | "oneMinuteLeft"
  | "handover"
  | "finishSentence"
  | "recordingCapped"
  | "notRecording"
  | "paused"
  | "resumed"
  | "rerecording"
  | "examOver"
  | "saveFailed"}`;

export type AnnouncementMessage =
  | {
      readonly key: "mock.live.revealed";
      readonly params: {
        readonly letter: MockTopic["letter"];
        readonly topicName: { readonly topicId: MockTopic["id"]; readonly field: "title" };
      };
    }
  | {
      readonly key: "mock.live.situationChosen";
      readonly params: { readonly key: SituationKey };
    }
  | {
      readonly key: Exclude<MessageKey, "mock.live.revealed" | "mock.live.situationChosen">;
      readonly params?: never;
    };

type Announcement = { readonly type: "announce" } & AnnouncementMessage;

export type Command =
  | Announcement
  | { type: "playClip"; clipId: string; rate: number; requestId: number }
  | { type: "stopAudio" | "pauseAudio" | "releaseMic" | "requestWakeLock" | "releaseWakeLock" }
  | { type: "preload"; clipIds: readonly string[]; requestId: number }
  | { type: "requestMic"; reason: "permission" | "reacquire"; requestId: number }
  | { type: "startRecording"; attemptId: string; itemId: string; requestId: number }
  | {
      type: "pauseRecording" | "resumeRecording" | "stopRecording" | "discardRecording";
      attemptId: string;
      itemId: string;
    }
  | { type: "discardAttemptRecordings"; attemptId: string }
  | { type: "persistAttempt"; attempt: AttemptRecord }
  | { type: "setInProgressMarker"; marker: InProgressMarker }
  | { type: "clearInProgressMarker" | "armBackGuard" | "rearmBackGuard" | "disarmBackGuard" }
  | {
      type: "savePreference";
      key: "timersVisible" | "micExplanationSeen" | "wakeLockTipPending" | "wakeLockTipSeen";
      value: boolean;
    }
  | {
      type: "navigate";
      to: "mock";
      noticeKey?: "mock.back.saved" | "mock.back.unsaved";
      attempt?: AttemptRecord;
    }
  | { type: "navigate"; to: "review"; attempt: AttemptRecord };

type SimpleEventType =
  | "SOUND_CHECK_PLAY"
  | "SOUND_CHECK_HEARD"
  | "SOUND_CHECK_PROBLEM"
  | "MIC_ALLOW"
  | "MIC_SKIP"
  | "CONTINUE"
  | "INSTRUCTION_SKIP"
  | "START"
  | "RETRY_LOAD"
  | "LOOK_PAUSE"
  | "LOOK_RESUME"
  | "LOOK_EXTEND"
  | "LOOK_SKIP"
  | "TAP_TO_HEAR"
  | "DONE"
  | "HINTS_OPENED"
  | "HINTS_CLOSED"
  | "BACK_PRESSED"
  | "REPEAT_INTRO"
  | "RERECORD"
  | "PAUSE"
  | "RESUME"
  | "SHOW_TEXT"
  | "HIDE_TEXT"
  | "TIMERS_TOGGLED"
  | "LEAVE_REQUESTED"
  | "LEAVE_CONFIRMED"
  | "LEAVE_CANCELLED"
  | "CONTINUE_AFTER_INTERRUPTION"
  | "RESTART"
  | "END_AND_REVIEW"
  | "RETRY_AUDIO"
  | "GO_TO_REVIEW"
  | "MIC_MUTED"
  | "MIC_ENDED"
  | "WAKE_LOCK_UNSUPPORTED"
  | "WAKE_LOCK_LOST"
  | "APP_HIDDEN"
  | "APP_VISIBLE"
  | "AUDIO_INTERRUPTED"
  | "TICK"
  | "DISMISS_RELOAD_NOTICE";

/** Echo the command's request ID to reject stale feedback for a replay or retry. */
type Feedback<T extends string> = { type: T; requestId?: number };

/** The host supplies nondecreasing millisecond timestamps from one clock. */
export type Event = { readonly at: number } & (
  | { type: SimpleEventType }
  | { type: "OPTIONS_SET"; options: Partial<PracticeOptions> }
  | { type: "CARD_TAPPED"; index: number }
  | { type: "SITUATION_CHOSEN"; key: SituationKey | "random" }
  | { type: "REPEAT"; rate: number }
  | { type: "NAVIGATED_AWAY"; reason?: "back" | "route" }
  | { type: "PERSIST_FAILED"; attemptId: string }
  | Feedback<
      | "ASSETS_LOADED"
      | "ASSETS_FAILED"
      | "RECORDING_STARTED"
      | "RECORDING_FAILED"
      | "MIC_REACQUIRED"
      | "MIC_REACQUIRE_FAILED"
    >
  | (Feedback<"CLIP_STARTED" | "CLIP_ENDED" | "CLIP_FAILED" | "PLAYBACK_BLOCKED"> & { clipId: string })
  | (Feedback<"MIC_GRANTED" | "MIC_DENIED" | "MIC_UNAVAILABLE"> & { reason?: MicReason })
);

export interface Context {
  readonly mode: Mode;
  readonly policy: ModePolicy;
  readonly topics: readonly MockTopic[];
  readonly options: PracticeOptions;
  readonly rng: number;
  readonly baseAttemptId: string;
  readonly generation: number;
  readonly sequence: number;
  readonly marker: InProgressMarker | null;
  readonly topic: MockTopic | null;
  readonly situationKey: SituationKey | null;
  readonly script: readonly QuestionUnit[];
  readonly cursor: number;
  readonly examClock: Stopwatch | null;
  readonly answerClock: Stopwatch | null;
  readonly look: Countdown | null;
  readonly load: Countdown | null;
  readonly grace: Countdown | null;
  readonly recordingCap: Countdown | null;
  readonly limitReached: boolean;
  readonly part1CutoffReached: boolean;
  readonly part1HandoverReached: boolean;
  readonly handoverGraceStarted: boolean;
  readonly graceCeilingReached: boolean;
  readonly graceNotice: "handover" | "limit" | null;
  readonly minuteNoticePassed: boolean;
  readonly u2Asked: boolean;
  readonly unitStarted: boolean;
  readonly interrupted: boolean;
  readonly answersStarted: number;
  readonly skippedFollowups: readonly string[];
  readonly askedItemIds: readonly string[];
  readonly answers: readonly AnswerFacts[];
  readonly micState: MicState;
  readonly micReason: MicReason;
  readonly micNeedsReopening: boolean;
  readonly micRequest: number | null;
  readonly recording: "idle" | "starting" | "recording" | "paused";
  readonly recordingRequest: number | null;
  readonly timersVisible: boolean;
  readonly alwaysShowExaminerText: boolean;
  readonly showTextOpen: boolean;
  readonly unitShowTextUsed: boolean;
  readonly sheet: "none" | "hints";
  readonly leaveDialog: boolean;
  readonly wakeLock: "released" | "held" | "unsupported";
  readonly wakeLockTipSeen: boolean;
  readonly backBehaviour: BackBehaviour;
  readonly instructionLineId: string | null;
  readonly announcements: readonly Announcement[];
  readonly part2StartedAtMs: number | null;
  readonly pageHidden: boolean;
}

export type Playback =
  | { readonly phase: "pending" | "playing"; readonly requestId: number }
  | { readonly phase: "deferred" }
  | { readonly phase: "gap"; readonly timer: Countdown };

export interface AudioSequence {
  readonly clips: readonly [Clip, ...Clip[]];
  readonly index: number;
  readonly rate: number;
  readonly playback: Playback;
}

type WithContext = { readonly context: Context };

export type AudioRun = WithContext &
  (
    | { readonly type: "run.introLine" | "run.unit.speaking" | "run.thanks"; readonly audio: AudioSequence }
    | { readonly type: "run.unit.repeating"; readonly audio: AudioSequence; readonly recovering: boolean }
  );

export type Run =
  | AudioRun
  | (WithContext &
      (
        | { readonly type: "run.look" | "run.chooseSituation" }
        | { readonly type: "run.unit.answering"; readonly waitingToAdvance: boolean }
      ));

export type State =
  | Run
  | (WithContext &
      (
        | {
            readonly type: "prepare.getReady";
            readonly soundOk: boolean;
            readonly soundHelp: boolean;
            readonly wakeLockTip: boolean;
            readonly reloadNotice: boolean;
          }
        | { readonly type: "prepare.instruction"; readonly clipId: string; readonly requestId: number }
        | { readonly type: "prepare.draw"; readonly cards: readonly MockTopic[] }
        | {
            readonly type: "prepare.reveal";
            readonly status: "loading" | "slow" | "loaded" | "failed";
            readonly requestId: number;
          }
        | {
            readonly type: "run.closing";
            readonly attempt: AttemptRecord;
            readonly requestId: number;
            readonly saveFailed: boolean;
          }
        | {
            readonly type: "finished";
            readonly attempt: AttemptRecord;
            readonly reviewed: boolean;
            readonly saveFailed: boolean;
          }
        | { readonly type: "hold.paused"; readonly point: Run; readonly pausedByDialog: boolean }
        | {
            readonly type: "hold.blocked" | "hold.audioError";
            readonly point: AudioRun;
            readonly retryId: number | null;
            readonly failedAgain: boolean;
          }
        | {
            readonly type: "hold.interrupted";
            readonly status: "away" | "choosing";
            readonly point: Run;
            readonly frozenAtMs: number;
            readonly reacquiring: boolean;
          }
        | { readonly type: "left"; readonly attempt?: AttemptRecord; readonly saveFailed?: boolean }
      ));

export interface Transition {
  readonly state: State;
  readonly commands: readonly Command[];
}
