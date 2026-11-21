# ADR-0008: Progress persistence: `ProgressStore`, IndexedDB, migrations and the path to accounts

| | |
|---|---|
| **Status** | Accepted (2026-11-19) |
| **Deciders** | `software-architect` |
| **Related** | CLAUDE.md rules 2, 6, 10; US-042, US-044 to US-050, US-055, US-057; D-6, D-22 (DL-042: spaced review per topic, day 1 = first study day); PRD OQ-11, R9; [state machine §14](../ux/flows/mock-exam-state-machine.md#14-what-is-persisted); ADR-0007 |

## Context

- v1 has no accounts. Progress stays in the browser **behind an async interface**, so a server store can replace it when accounts arrive (DL-007).
- What is stored (US-046 #3): IDs, dates, modes, statuses, self-check ticks and settings; no personal data. Recordings only when the learner opts to keep a mock attempt (D-6, US-045).
- Every access must survive: storage unavailable (blocked, private mode limits, full), server rendering, corrupted or older data (US-046 #4, US-050).
- The spaced-review schedule (US-047, D-22): reviews on days 3, 7 and 14, where day 1 is the first study day, so due dates are D+2, D+6, D+13. OQ-2 is closed, but the schedule is product config that may still change.
- **OQ-11** (assigned here): WebKit's storage policy.

## Options considered

### Storage engine

| Option | Gain | Give up |
|---|---|---|
| A. `localStorage` for progress, IndexedDB only for kept recordings | Simple synchronous API for small data | Two engines with different failure modes; ~5 MB limit; no versioned upgrade hook; synchronous writes on the main thread |
| **B. IndexedDB for everything, through the small `idb` wrapper** | One engine; Blobs for recordings; built-in versioned upgrades (`onupgradeneeded`) for structural migrations; async like the interface | Async reads (a "continue where you left off" link appears just after hydration rather than in the first paint; acceptable, the page is static anyway) |
| C. A sync-capable local database (for example PGlite, RxDB) | Ready-made sync story | Large bundles and complexity for a few KB of data |

### Data shape

| Option | Gain | Give up |
|---|---|---|
| A. Mutable aggregates per topic (`{ practisedCount, lastDate, nextReview }`) | Direct reads | A schedule change (OQ-2 was open until D-22 and could change again) needs a data migration; merging two devices' data later is lossy |
| **B. Append-only practice events + attempt records; aggregates derived by pure functions** | Schedule and "practised" rules can change with no data migration; merging device data into an account later is a union by event ID; easy to test | Derivation runs on read (trivial at this scale: hundreds of events) |

## Decision

**IndexedDB via `idb` 8.0.4 (ISC, ~1 KB gzipped, maintained), append-only events, derived views.**

### 1. The interface (`src/lib/progress/store.ts`)

```ts
export type StorageAvailability =
  | { kind: "available" }
  | { kind: "unavailable"; reason: "unsupported" | "blocked" | "quota" | "error" };

export type SaveResult = { ok: true } | { ok: false; reason: "unavailable" | "quota" | "error" };

export interface ProgressStore {
  availability(): Promise<StorageAvailability>;

  recordPractice(event: NewPracticeEvent): Promise<SaveResult>;        // answer-aloud done, mock completed/ended
  listPracticeEvents(filter?: { topicId?: TopicId }): Promise<PracticeEvent[]>;

  saveAttempt(attempt: AttemptRecord): Promise<SaveResult>;            // exactly once per attempt (UX I8)
  updateSelfCheck(attemptId: AttemptId, ticks: SelfCheckTicks): Promise<SaveResult>;
  setAttemptKept(attemptId: AttemptId, kept: boolean): Promise<SaveResult>;
  listAttempts(): Promise<AttemptSummary[]>;                           // newest first (US-048)
  getAttempt(attemptId: AttemptId): Promise<AttemptRecord | null>;

  getSettings(): Promise<Settings>;                                    // defaults when nothing stored
  updateSettings(patch: Partial<Settings>): Promise<SaveResult>;
  getLastOpened(): Promise<LastOpened | null>;                         // "continue where you left off"
  setLastOpened(ref: LastOpened): Promise<SaveResult>;

  clearAll(): Promise<SaveResult>;                                     // works even on corrupted data (US-049 #4)
  subscribe(listener: () => void): () => void;                         // for useSyncExternalStore
}
```

- Domain types are Zod schemas in `src/lib/progress/schema.ts`:
  - `PracticeEvent { id (UUID), v, topicId, kind: "answer-aloud" | "mock", itemId?, mode?, recordedAt (ISO instant), localDate ("YYYY-MM-DD" on the device) }`
  - `AttemptRecord` exactly as UX §14 lists: attempt ID, `part: 2`, mode, topic, situation, start, total time, status (`completed` / `endedEarly` / `interrupted`), per-question facts, self-check ticks, `kept`
  - `Settings { playbackRate, timersVisible, alwaysShowExaminerText, translationsStartShown, micExplanationSeen, micDenied }`
- **Never stored:** names, free text, recordings in `ProgressStore`, hint use (UX §14), anything from the server.
- Pure derivations in `src/lib/progress/derive.ts`: `topicProgress(events)` (count, last date; US-046 #2, US-010), `dueReviews(events, today, schedule)` (US-047), `history(attempts)`. The schedule is config in `src/lib/progress/review-schedule.ts`: `{ reviewDays: [3, 7, 14], dayOne: "first-study-day" }` (D-22).
- React access: `ProgressProvider` (root layout) + hooks (`useTopicProgress`, `useDueReviews`, `useSettings`). Features never see IndexedDB.

### 2. Recordings are a separate, device-only store

`RecordingStore` (`src/lib/recordings/`): `putAttemptRecordings(attemptId, topicId, answers[])`, `getAttemptRecordings`, `deleteAttemptRecordings`, `deleteAll`, `totalBytes` (US-045 #3). Kept apart from `ProgressStore` because a future server store **must not** receive audio (CLAUDE.md rule 10). Keeping a newer attempt for a topic deletes the older one (at most one per topic, US-045 #1).

### 3. Browser implementation

- Database `pd3-mundtlig`, opened **lazily on first use** (not on page load), with object stores:

| Store | Key | Indexes | Holds |
|---|---|---|---|
| `meta` | key | – | `schemaVersion` |
| `practiceEvents` | `id` | `topicId`, `localDate` | events |
| `attempts` | `id` | `topicId`, `startedAt` | attempt records |
| `settings` | key | – | one settings record, one last-opened record |
| `recordings` | `attemptId` | `topicId` | kept attempts' blobs + MIME types + durations |

- **Guards:**
  - `typeof indexedDB === "undefined"` (server rendering or unsupported) → the in-memory store (`MemoryProgressStore`).
  - `open()` failure or timeout (3 s) → memory store with `availability: unavailable`.
  - `QuotaExceededError` and `InvalidStateError` on writes → `SaveResult` errors, never thrown into the UI.
  - `versionchange` and `blocked` (another tab with an older version) → close and reopen on next use.
  - The UI shows the "progress can't be saved in this browser" notice once (US-050 #1, #3).
- The in-memory store implements the same interface, so every feature works with storage unavailable (US-050 #1).

### 4. Migrations

- **Structural** (stores, indexes): the IndexedDB version number. `upgrade(db, oldVersion)` runs ordered steps in `src/lib/progress/browser/migrations/` (`v1.ts`, `v2.ts`, …). Never edit a released step; add a new one.
- **Records:** every record has `v`. Reads parse with the Zod schema for its version, migrate in memory to the latest (`migrate-record.ts`), and **skip invalid records** (counted, logged through `reportError`, ADR-0013) instead of crashing; valid records are kept (US-046 #4). A migrated record is written back lazily on its next update.
- Unit tests use `fake-indexeddb` 6.2.8 (Apache-2.0, dev-only): every migration step from every earlier version, plus corrupted fixtures.

### 5. Persistence durability (answers OQ-11)

- **WebKit (Safari, and every browser on iOS):** since Safari 13.1 / iOS 13.4, script-writable storage (including IndexedDB) is deleted after **7 days of Safari use without the learner interacting with the site**; Home Screen web apps are exempt. Since Safari 17, `navigator.storage.persist()` exists, but WebKit grants it by heuristics (mainly Home Screen apps). Sources: WebKit "Updates to Storage Policy" and MDN "Storage quotas and eviction criteria". *(Not re-verified against a 2026 WebKit announcement; the iOS spike should confirm.)*
- **Chromium:** best-effort storage, evicted only under storage pressure; `persist()` is granted by engagement heuristics without a prompt.
- **Firefox:** `persist()` shows a permission prompt.
- **Decision:**
  - Call `navigator.storage.persist()` **only when the learner chooses "keep on this device"** for an attempt (US-045), because that is when losing data matters most and a Firefox prompt makes sense.
  - Don't call it on page load.
  - The privacy and about pages say plainly that progress lives in this browser only, can be deleted by the browser (on iPhone after about a week without opening the app), and doesn't move to another phone (US-050 #4). `persian-localization-reviewer` writes the copy.
  - Export/import of progress stays "not now" (PRD §5.2) until learners report loss (R9).

### 6. Path to server storage and accounts

1. Add `ServerProgressStore` implementing the same interface over authenticated route handlers (`/api/progress/events`, `/api/progress/attempts`). Writes are idempotent by event or attempt ID.
2. `ProgressProvider` chooses the implementation from the session.
3. On first sign-in, offer to upload the local events and attempts (union by ID, no conflicts by construction), then keep reading from the server.
4. Recordings stay in `RecordingStore` on the device; nothing changes for them.
5. This adds dynamic route handlers; pages stay static (ADR-0005).

## Consequences

- **Gain:** the UI depends on one async interface; IndexedDB, the memory fallback and a future server store are interchangeable.
- **Gain:** changes to the review schedule or to what counts as "practised" need no data migration.
- **Give up:** progress appears just after hydration, not in the server HTML. Pages reserve space to avoid layout shift.
- **Give up:** on iPhones, data can vanish after a week without use. We can't fix that without accounts; we explain it.
- The sessionStorage in-progress marker (ADR-0007) is UI state, not progress, and stays outside `ProgressStore`.
