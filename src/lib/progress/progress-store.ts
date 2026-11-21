import type { TopicStudyState } from "./derive";
import type { DueReview, ReviewClock, ReviewSchedule } from "./review-schedule";
import type {
  AttemptInput,
  AttemptRecord,
  AttemptSummary,
  FocusItem,
  InProgressMarker,
  LastOpened,
  NewPracticeEvent,
  PracticeEvent,
  ProgressEvent,
  ProgressExport,
  SelfCheckTicks,
  Settings,
  SettingsPatch,
} from "./schema";

type UnavailableReason = "unsupported" | "blocked" | "quota" | "error";
export type StorageAvailability = { kind: "available" } | { kind: "unavailable"; reason: UnavailableReason };
export type StorageFailure = { ok: false; reason: "unavailable" | "quota" | "error" | "invalid" };
export type SaveResult = { ok: true } | StorageFailure;
export type ReadResult<T> = { ok: true; value: T } | StorageFailure;

export interface ProgressStoreOptions {
  clock?: ReviewClock;
  createId?: () => string;
}

export interface ProgressStore {
  /** Reports durable browser storage availability, including when writes are backed by memory. */
  availability(): Promise<StorageAvailability>;
  appendEvent(event: ProgressEvent): Promise<SaveResult>;
  recordPractice(event: NewPracticeEvent): Promise<SaveResult>;
  listPracticeEvents(filter?: { topicId?: string }): Promise<ReadResult<PracticeEvent[]>>;
  getTopicStudyState(topicId: string): Promise<ReadResult<TopicStudyState | null>>;
  listTopicStudyStates(): Promise<ReadResult<TopicStudyState[]>>;
  listReviewSchedule(): Promise<ReadResult<ReviewSchedule[]>>;
  listDueReviews(): Promise<ReadResult<DueReview[]>>;
  startReviewCycle(topicId: string): Promise<SaveResult>;

  saveAttempt(attempt: AttemptInput): Promise<SaveResult>;
  updateSelfCheck(attemptId: string, ticks: SelfCheckTicks): Promise<SaveResult>;
  setFocusNextTime(attemptId: string, focus: FocusItem | null): Promise<SaveResult>;
  /** Records the keep choice. Browser history uses actual device recording presence. */
  setAttemptKept(attemptId: string, kept: boolean): Promise<SaveResult>;
  listAttempts(): Promise<ReadResult<AttemptSummary[]>>;
  getAttempt(attemptId: string): Promise<ReadResult<AttemptRecord | null>>;

  getSettings(): Promise<ReadResult<Settings>>;
  updateSettings(patch: SettingsPatch): Promise<SaveResult>;
  getLastOpened(): Promise<ReadResult<LastOpened | null>>;
  setLastOpened(ref: LastOpened): Promise<SaveResult>;

  getInProgressMarker(): Promise<ReadResult<InProgressMarker | null>>;
  setInProgressMarker(marker: InProgressMarker): Promise<SaveResult>;
  clearInProgressMarker(): Promise<SaveResult>;

  clearAll(): Promise<SaveResult>;
  /** Returns the versioned progress log for local serialization. */
  exportProgress(): Promise<ReadResult<ProgressExport>>;
  subscribe(listener: () => void): () => void;
}
