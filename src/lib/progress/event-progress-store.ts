import { reportError } from "@/lib/observability/report-error";
import { deriveProgress, history, orderEvents } from "./derive";
import type {
  ProgressStore,
  ProgressStoreOptions,
  ReadResult,
  SaveResult,
  StorageAvailability,
} from "./progress-store";
import { dueReviews, localDateOf, type ReviewClock } from "./review-schedule";
import {
  NewPracticeEventSchema,
  PROGRESS_SCHEMA_VERSION,
  ProgressEventSchema,
  type AttemptInput,
  type FocusItem,
  type InProgressMarker,
  type LastOpened,
  type NewPracticeEvent,
  type ProgressEvent,
  type ProgressExport,
  type SelfCheckTicks,
  type SettingsPatch,
} from "./schema";

export interface EventLogSnapshot extends Omit<ProgressExport, "v"> {
  keptRecordingIds?: ReadonlySet<string>;
}

export interface EventLog {
  availability(): Promise<StorageAvailability>;
  read(): Promise<ReadResult<EventLogSnapshot>>;
  append(event: ProgressEvent, assignOrder: boolean): Promise<SaveResult>;
  clear(): Promise<SaveResult>;
}

export interface MarkerStore {
  read(): Promise<ReadResult<InProgressMarker | null>>;
  write(marker: InProgressMarker): Promise<SaveResult>;
  clear(): Promise<SaveResult>;
}

export class EventProgressStore implements ProgressStore {
  private readonly listeners = new Set<() => void>();
  private readonly clock: ReviewClock;
  private readonly createId: () => string;

  constructor(
    private readonly log: EventLog,
    private readonly markers: MarkerStore,
    options: ProgressStoreOptions,
  ) {
    this.clock = options.clock ?? (() => new Date());
    this.createId = options.createId ?? (() => globalThis.crypto.randomUUID());
  }

  availability() {
    return this.log.availability();
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        reportError(new Error("Progress listener failed"), { area: "progress" });
      }
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  appendEvent(event: ProgressEvent): Promise<SaveResult> {
    return this.commit(event, false);
  }

  private async commit(event: ProgressEvent, assignOrder: boolean): Promise<SaveResult> {
    const parsed = ProgressEventSchema.safeParse(event);
    if (!parsed.success) return { ok: false, reason: "invalid" };

    const result = await this.log.append(parsed.data, assignOrder);
    if (result.ok) this.notify();
    return result;
  }

  private async appendGenerated(
    create: (
      envelope: { v: typeof PROGRESS_SCHEMA_VERSION; id: string; recordedAt: string },
      now: Date,
    ) => ProgressEvent,
    id?: string,
    assignOrder = true,
  ): Promise<SaveResult> {
    try {
      const now = this.clock();
      return await this.commit(
        create(
          {
            v: PROGRESS_SCHEMA_VERSION,
            id: id ?? this.createId(),
            recordedAt: now.toISOString(),
          },
          now,
        ),
        assignOrder,
      );
    } catch {
      return { ok: false, reason: "error" };
    }
  }

  recordPractice(event: NewPracticeEvent): Promise<SaveResult> {
    const parsed = NewPracticeEventSchema.safeParse(event);
    if (!parsed.success) return Promise.resolve({ ok: false, reason: "invalid" });
    const { id, recordedAt, localDate, ...practice } = parsed.data;
    return this.appendGenerated(
      (envelope, now) => ({
        ...envelope,
        ...practice,
        type: "practice",
        recordedAt: recordedAt ?? envelope.recordedAt,
        localDate: localDate ?? localDateOf(recordedAt === undefined ? now : new Date(recordedAt)),
      }),
      id,
      recordedAt === undefined,
    );
  }

  private async view<T>(select: (views: ReturnType<typeof deriveProgress>) => T): Promise<ReadResult<T>> {
    const result = await this.log.read();
    if (!result.ok) return result;
    try {
      const views = deriveProgress(result.value.events);
      const keptRecordingIds = result.value.keptRecordingIds;
      if (keptRecordingIds) {
        for (const attempt of views.attempts.values()) {
          attempt.kept = keptRecordingIds.has(attempt.attemptId);
        }
      }
      return { ok: true, value: select(views) };
    } catch {
      return { ok: false, reason: "error" };
    }
  }

  listPracticeEvents(filter?: { topicId?: string }) {
    return this.view(({ practices }) =>
      filter?.topicId === undefined
        ? practices
        : practices.filter(({ topicId }) => topicId === filter.topicId),
    );
  }

  getTopicStudyState(topicId: string) {
    return this.view(({ topics }) => topics.find((topic) => topic.topicId === topicId) ?? null);
  }

  listTopicStudyStates() {
    return this.view(({ topics }) => topics);
  }

  listReviewSchedule() {
    return this.view(({ schedules }) => schedules);
  }

  listDueReviews() {
    return this.view(({ schedules }) => dueReviews(schedules, this.clock));
  }

  startReviewCycle(topicId: string) {
    return this.appendGenerated((envelope, now) => ({
      ...envelope,
      type: "review-cycle-started",
      topicId,
      localDate: localDateOf(now),
    }));
  }

  saveAttempt(attempt: AttemptInput) {
    return this.appendGenerated((envelope, now) => ({
      ...attempt,
      ...envelope,
      type: "attempt-saved",
      localDate: localDateOf(now),
    }));
  }

  updateSelfCheck(attemptId: string, selfCheck: SelfCheckTicks) {
    return this.appendGenerated((envelope) => ({
      ...envelope,
      type: "attempt-reviewed",
      attemptId,
      selfCheck,
    }));
  }

  setFocusNextTime(attemptId: string, focusNextTime: FocusItem | null) {
    return this.appendGenerated((envelope) => ({
      ...envelope,
      type: "attempt-reviewed",
      attemptId,
      focusNextTime,
    }));
  }

  setAttemptKept(attemptId: string, kept: boolean) {
    return this.appendGenerated((envelope) => ({ ...envelope, type: "attempt-reviewed", attemptId, kept }));
  }

  listAttempts() {
    return this.view(({ attempts }) => history(attempts.values()));
  }

  getAttempt(attemptId: string) {
    return this.view(({ attempts }) => attempts.get(attemptId) ?? null);
  }

  getSettings() {
    return this.view(({ settings }) => settings);
  }

  updateSettings(patch: SettingsPatch) {
    return this.appendGenerated((envelope) => ({ ...envelope, type: "settings-updated", patch }));
  }

  getLastOpened() {
    return this.view(({ lastOpened }) => lastOpened);
  }

  setLastOpened(ref: LastOpened) {
    return this.appendGenerated((envelope) => ({ ...envelope, type: "last-opened", ref }));
  }

  getInProgressMarker() {
    return this.markers.read();
  }

  setInProgressMarker(marker: InProgressMarker) {
    return this.markers.write(marker);
  }

  clearInProgressMarker() {
    return this.markers.clear();
  }

  async clearAll(): Promise<SaveResult> {
    const [log, marker] = await Promise.all([this.log.clear(), this.markers.clear()]);
    if (log.ok || marker.ok) this.notify();
    if (log.ok && (marker.ok || marker.reason === "unavailable")) return { ok: true };
    return log.ok ? marker : log;
  }

  async exportProgress(): Promise<ReadResult<ProgressExport>> {
    const result = await this.log.read();
    if (!result.ok) return result;
    return {
      ok: true,
      value: {
        v: PROGRESS_SCHEMA_VERSION,
        events: orderEvents(result.value.events),
        skippedRecords: result.value.skippedRecords,
      },
    };
  }
}
