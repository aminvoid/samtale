import type { PreloadProgress } from "@/lib/audio/preload";
import type { RecordedAudio, RecorderSignal } from "@/lib/audio/recorder";
import type { ReadResult, SaveResult } from "@/lib/progress/progress-store";
import type { ScreenWakeLock } from "@/lib/screen-wake-lock";
import type { Settings, SettingsPatch } from "@/lib/progress/schema";
import type { AttemptRecord, Command } from "../machine";
import type { AnnouncementMessage, InProgressMarker } from "../machine/types";

type ClipSignal = "started" | "ended" | "failed" | "blocked" | "interrupted";

export interface AudioPort {
  preload(clipIds: readonly string[], progress: (value: PreloadProgress) => void): Promise<void>;
  /** Calls the media element's play in this stack, including on the START tap. */
  play(clipId: string, rate: number, notify: (signal: ClipSignal) => void): void;
  pause(): void;
  stop(): void;
  releaseAssets(): void;
}

export type MicResult =
  { type: "granted" } | { type: "denied" | "unavailable"; reason: "in-use" | "insecure" | "other" };

export interface RecorderPort {
  requestMic(reason: "permission" | "reacquire" | "check-grant"): Promise<MicResult>;
  start(timeslice: number): void | Promise<void>;
  pause(): void;
  resume(): void;
  stop(): Promise<RecordedAudio | null>;
  discard(): void;
  release(): void;
  subscribe(listener: (signal: RecorderSignal) => void): () => void;
}

export interface ProgressPort {
  getSettings(): Promise<ReadResult<Settings>>;
  savePreference(patch: SettingsPatch): Promise<SaveResult>;
  persistAttempt(attempt: AttemptRecord): Promise<SaveResult>;
}

export interface MarkerPort {
  read(): Promise<ReadResult<InProgressMarker | null>>;
  write(marker: InProgressMarker): Promise<SaveResult>;
  clear(): Promise<SaveResult>;
}

export interface AnnouncePort {
  emit(message: AnnouncementMessage): void;
}

export interface Clock {
  /** Nondecreasing epoch milliseconds, also used for persisted dates. */
  now(): number;
  /** Schedules one callback and returns its cancellation function. */
  setTimeout(callback: () => void, delayMs: number): () => void;
}

export type WakeLockPort = ScreenWakeLock;

export interface VisibilityPort {
  isVisible(): boolean;
  subscribe(listener: (event: "hidden" | "visible" | "pagehide" | "back") => void): () => void;
  armBackGuard(): void;
  disarmBackGuard(): void;
}

export interface SessionRecordingPort {
  collect(attemptId: string, itemId: string, recording: Promise<RecordedAudio | null>): void;
  discardAnswer(attemptId: string, itemId: string): void;
  discardAttempt(attemptId: string): void;
}

export type MockExamDestination = Extract<Command, { type: "navigate" }> & {
  /** The destination can show a storage warning even if the runner has unmounted. */
  saveResult?: Promise<SaveResult>;
};

export interface MockExamPorts {
  audio: AudioPort;
  recorder: RecorderPort;
  progress: ProgressPort;
  marker: MarkerPort;
  announce: AnnouncePort;
  clock: Clock;
  wakeLock: WakeLockPort;
  visibility: VisibilityPort;
  recordings: SessionRecordingPort;
  navigate(destination: MockExamDestination): void;
}
