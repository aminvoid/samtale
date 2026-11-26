import type { IndexedDbProgressOptions } from "./indexeddb-progress-store";
import type {
  ProgressStore,
  ReadResult,
  SaveResult,
  StorageAvailability,
  StorageFailure,
} from "./progress-store";
import type { RecordingStore } from "./recording-store";

/*
 * Stores that load their implementation (IndexedDB, the Zod schemas) on first use. A page that only
 * mounts a provider or reads progress after hydration then doesn't carry that code in its own bundle,
 * or in the bundle Next.js prefetches for links to it (ADR-0014 JS budget). Behaviour is the same as
 * the eager stores; if the code can't be fetched (offline, a failed deploy) storage reads as
 * unavailable, as it does when IndexedDB itself is blocked, and the next call tries again.
 */

const unavailable: StorageFailure = { ok: false, reason: "unavailable" };

function memoized<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => {
    pending ??= load().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
}

export function createLazyProgressStore(options: IndexedDbProgressOptions = {}): ProgressStore {
  type Subscription = { unsubscribe?: () => void };
  const subscriptions = new Map<() => void, Subscription>();
  let loadedStore: ProgressStore | undefined;
  const load = memoized(() =>
    import("./create-progress-store").then(({ createProgressStore }) => {
      const store = createProgressStore(options);
      for (const [listener, subscription] of subscriptions) {
        subscription.unsubscribe = store.subscribe(listener);
      }
      loadedStore = store;
      return store;
    }),
  );
  const save = (run: (store: ProgressStore) => Promise<SaveResult>): Promise<SaveResult> =>
    load().then(run, () => unavailable);
  const read = <T>(run: (store: ProgressStore) => Promise<ReadResult<T>>): Promise<ReadResult<T>> =>
    load().then(run, () => unavailable);

  return {
    availability: (): Promise<StorageAvailability> =>
      load().then(
        (store) => store.availability(),
        () => ({ kind: "unavailable", reason: "error" }),
      ),
    appendEvent: (event) => save((store) => store.appendEvent(event)),
    recordPractice: (event) => save((store) => store.recordPractice(event)),
    listPracticeEvents: (filter) => read((store) => store.listPracticeEvents(filter)),
    getTopicStudyState: (topicId) => read((store) => store.getTopicStudyState(topicId)),
    listTopicStudyStates: () => read((store) => store.listTopicStudyStates()),
    listReviewSchedule: () => read((store) => store.listReviewSchedule()),
    listDueReviews: () => read((store) => store.listDueReviews()),
    startReviewCycle: (topicId) => save((store) => store.startReviewCycle(topicId)),
    saveAttempt: (attempt) => save((store) => store.saveAttempt(attempt)),
    updateSelfCheck: (attemptId, ticks) => save((store) => store.updateSelfCheck(attemptId, ticks)),
    setFocusNextTime: (attemptId, focus) => save((store) => store.setFocusNextTime(attemptId, focus)),
    setAttemptKept: (attemptId, kept) => save((store) => store.setAttemptKept(attemptId, kept)),
    listAttempts: () => read((store) => store.listAttempts()),
    getAttempt: (attemptId) => read((store) => store.getAttempt(attemptId)),
    getSettings: () => read((store) => store.getSettings()),
    updateSettings: (patch) => save((store) => store.updateSettings(patch)),
    getLastOpened: () => read((store) => store.getLastOpened()),
    setLastOpened: (ref) => save((store) => store.setLastOpened(ref)),
    getInProgressMarker: () => read((store) => store.getInProgressMarker()),
    setInProgressMarker: (marker) => save((store) => store.setInProgressMarker(marker)),
    clearInProgressMarker: () => save((store) => store.clearInProgressMarker()),
    clearAll: () => save((store) => store.clearAll()),
    exportProgress: () => read((store) => store.exportProgress()),
    subscribe(listener) {
      let subscription = subscriptions.get(listener);
      if (subscription === undefined) {
        subscription = { unsubscribe: loadedStore?.subscribe(listener) };
        subscriptions.set(listener, subscription);
        void load().catch(() => undefined);
      }
      const registered = subscription;
      return () => {
        if (subscriptions.get(listener) !== registered) return;
        subscriptions.delete(listener);
        registered.unsubscribe?.();
      };
    },
  };
}

export function createLazyRecordingStore(options: { databaseName?: string } = {}): RecordingStore {
  const load = memoized(() =>
    import("./recording-store").then(({ createRecordingStore }) => createRecordingStore(options)),
  );
  const save = (run: (store: RecordingStore) => Promise<SaveResult>): Promise<SaveResult> =>
    load().then(run, () => unavailable);
  const read = <T>(run: (store: RecordingStore) => Promise<ReadResult<T>>): Promise<ReadResult<T>> =>
    load().then(run, () => unavailable);

  return {
    putAttemptRecordings: (attemptId, topicId, answers) =>
      save((store) => store.putAttemptRecordings(attemptId, topicId, answers)),
    getAttemptRecordings: (attemptId) => read((store) => store.getAttemptRecordings(attemptId)),
    deleteAttemptRecordings: (attemptId) => save((store) => store.deleteAttemptRecordings(attemptId)),
    deleteAll: () => save((store) => store.deleteAll()),
    totalBytes: () => read((store) => store.totalBytes()),
  };
}
