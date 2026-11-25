import { examConfig } from "@/lib/exam/config";

export const MAX_ANSWER_RECORDING_MS = examConfig.maxRecordingSeconds * 1000;

export type MicIssue = "denied" | "unavailable" | "in-use" | "insecure";
type Practice = "idle" | "saving" | "saved" | "review" | "error";
type Phase =
  | "closed"
  | "listening"
  | "audio-error"
  | "permission"
  | "starting"
  | "answering"
  | "stopping"
  | "paused"
  | "compare";

export type AnswerTake = { url: string; durationMs: number };

export type AnswerAloudState = {
  phase: Phase;
  itemId: string;
  takes: readonly AnswerTake[];
  elapsedMs: number;
  startedAt: number | null;
  micIssue: MicIssue | null;
  recorderStatus: "loading" | "ready" | "failed";
  practice: Practice;
  capped: boolean;
  wakeLockTip: boolean;
};

export const initialAnswerAloudState: AnswerAloudState = {
  phase: "closed",
  itemId: "",
  takes: [],
  elapsedMs: 0,
  startedAt: null,
  micIssue: null,
  recorderStatus: "loading",
  practice: "idle",
  capped: false,
  wakeLockTip: false,
};

type Action =
  | { type: "open"; itemId: string; practice?: Practice }
  | { type: "listen"; elapsedMs: number }
  | { type: "audio-error" | "permission" | "starting" | "close" }
  | { type: "recorder-status"; status: AnswerAloudState["recorderStatus"] }
  | { type: "answer"; startedAt: number; micIssue: MicIssue | null }
  | { type: "pause"; elapsedMs: number }
  | { type: "stop"; elapsedMs: number; capped: boolean }
  | { type: "collect"; take: AnswerTake | null; paused: boolean; micIssue: MicIssue | null }
  | { type: "practice"; practice: Practice }
  | { type: "wake-lock-tip"; show: boolean };

export function answerAloudReducer(state: AnswerAloudState, action: Action): AnswerAloudState {
  switch (action.type) {
    case "open":
      return {
        ...initialAnswerAloudState,
        phase: "listening",
        itemId: action.itemId,
        practice: action.practice ?? "idle",
      };
    case "listen":
      return { ...state, phase: "listening", startedAt: null, elapsedMs: action.elapsedMs };
    case "audio-error":
    case "permission":
    case "starting":
      return { ...state, phase: action.type };
    case "answer":
      return { ...state, phase: "answering", startedAt: action.startedAt, micIssue: action.micIssue };
    case "recorder-status":
      return { ...state, recorderStatus: action.status };
    case "pause":
      return { ...state, phase: "paused", startedAt: null, elapsedMs: action.elapsedMs };
    case "stop":
      return {
        ...state,
        phase: "stopping",
        startedAt: null,
        elapsedMs: action.elapsedMs,
        capped: action.capped,
      };
    case "collect":
      if (state.phase !== "stopping") return state;
      return {
        ...state,
        phase: action.paused ? "paused" : "compare",
        takes: action.take === null ? state.takes : [...state.takes, action.take],
        micIssue: action.micIssue,
      };
    case "wake-lock-tip":
      return { ...state, wakeLockTip: action.show };
    case "practice":
      return { ...state, practice: action.practice };
    case "close":
      return initialAnswerAloudState;
  }
}

export function answerElapsed(state: AnswerAloudState, now: number) {
  return state.elapsedMs + (state.startedAt === null ? 0 : Math.max(0, now - state.startedAt));
}
