import { compareText, scheduleTopic, type ReviewSchedule } from "./review-schedule";
import {
  PROGRESS_SCHEMA_VERSION,
  SettingsSchema,
  type AttemptRecord,
  type AttemptSummary,
  type LastOpened,
  type LocalDate,
  type PracticeEvent,
  type ProgressEvent,
} from "./schema";

export interface TopicStudyState {
  topicId: string;
  practiceCount: number;
  lastPractisedOn: LocalDate;
}

export function orderEvents(events: readonly ProgressEvent[]): ProgressEvent[] {
  const sorted = [...events].sort(
    (left, right) =>
      Date.parse(left.recordedAt) - Date.parse(right.recordedAt) || compareText(left.id, right.id),
  );
  const unique = new Map<string, ProgressEvent>();
  for (const event of sorted) {
    if (!unique.has(event.id)) unique.set(event.id, event);
  }
  return [...unique.values()];
}

interface TopicCycle {
  first: LocalDate;
  latest: LocalDate;
}

export function deriveProgress(events: readonly ProgressEvent[]) {
  const ordered = orderEvents(events);
  const attempts = new Map<string, AttemptRecord>();
  const canonicalAttemptEvents = new Set<string>();
  for (const event of ordered) {
    if (event.type !== "attempt-saved" || attempts.has(event.attemptId)) continue;
    const {
      attemptId,
      topicId,
      mode,
      startedAt,
      part,
      situationKey,
      totalMs,
      status,
      askedItemIds,
      skippedFollowups,
      answers,
    } = event;
    attempts.set(attemptId, {
      attemptId,
      topicId,
      mode,
      startedAt,
      part,
      situationKey,
      totalMs,
      status,
      askedItemIds,
      skippedFollowups,
      answers,
      focusNextTime: null,
      kept: false,
    });
    canonicalAttemptEvents.add(event.id);
  }

  const practices: PracticeEvent[] = [];
  const topics = new Map<string, TopicStudyState>();
  const cycles = new Map<string, TopicCycle>();
  const settings = SettingsSchema.parse({});
  let lastOpened: LastOpened | null = null;
  const linkedMocks = new Set<string>();

  function study(practice: PracticeEvent) {
    const { topicId, localDate } = practice;
    if (practice.kind === "mock" && practice.attemptId !== undefined) {
      if (linkedMocks.has(practice.attemptId)) return;
      linkedMocks.add(practice.attemptId);
    }
    practices.push(practice);
    const topic = topics.get(topicId) ?? { topicId, practiceCount: 0, lastPractisedOn: localDate };
    topic.practiceCount += 1;
    if (localDate > topic.lastPractisedOn) topic.lastPractisedOn = localDate;
    topics.set(topicId, topic);

    const cycle = cycles.get(topicId) ?? { first: localDate, latest: localDate };
    if (localDate > cycle.latest) cycle.latest = localDate;
    cycles.set(topicId, cycle);
  }

  for (const event of ordered) {
    switch (event.type) {
      case "practice":
        // A saved attempt supplies its own practice date and facts.
        if (event.kind !== "mock" || event.attemptId === undefined || !attempts.has(event.attemptId)) {
          study(event);
        }
        break;
      case "attempt-saved":
        if (canonicalAttemptEvents.has(event.id)) {
          study({
            v: PROGRESS_SCHEMA_VERSION,
            id: event.id,
            type: "practice",
            recordedAt: event.recordedAt,
            localDate: event.localDate,
            kind: "mock",
            topicId: event.topicId,
            attemptId: event.attemptId,
            mode: event.mode,
          });
        }
        break;
      case "attempt-reviewed": {
        const attempt = attempts.get(event.attemptId);
        if (attempt === undefined) break;
        if (event.selfCheck !== undefined) attempt.selfCheck = event.selfCheck;
        if (event.focusNextTime !== undefined) attempt.focusNextTime = event.focusNextTime;
        if (event.kept !== undefined) attempt.kept = event.kept;
        break;
      }
      case "settings-updated":
        for (const key of Object.keys(settings)) {
          if (Object.hasOwn(event.patch, key)) {
            const value: unknown = Reflect.get(event.patch, key);
            if (value !== undefined) Reflect.set(settings, key, value);
          }
        }
        break;
      case "last-opened":
        lastOpened = event.ref;
        break;
      case "review-cycle-started": {
        const cycle = cycles.get(event.topicId);
        if (
          cycle &&
          event.localDate >= cycle.latest &&
          scheduleTopic(event.topicId, cycle.first, [cycle.latest]).nextReview === null
        ) {
          cycles.set(event.topicId, { first: event.localDate, latest: event.localDate });
        }
        break;
      }
    }
  }

  const sortedTopics = [...topics.values()].sort((left, right) => compareText(left.topicId, right.topicId));
  const schedules: ReviewSchedule[] = [];
  for (const { topicId } of sortedTopics) {
    const cycle = cycles.get(topicId);
    if (cycle) schedules.push(scheduleTopic(topicId, cycle.first, [cycle.latest]));
  }
  return { practices, topics: sortedTopics, schedules, attempts, settings, lastOpened };
}

export function history(attempts: Iterable<AttemptRecord>): AttemptSummary[] {
  return Array.from(
    attempts,
    ({ attemptId, topicId, mode, situationKey, startedAt, status, totalMs, focusNextTime, kept }) => ({
      attemptId,
      topicId,
      mode,
      situationKey,
      startedAt,
      status,
      totalMs,
      focusNextTime,
      kept,
    }),
  ).sort((left, right) => right.startedAt - left.startedAt || compareText(left.attemptId, right.attemptId));
}
