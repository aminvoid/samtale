# Independent review (Kimi): mock exam screens

- **Reviewer:** Kimi Code CLI (`kimi -p`, read-only), 2026-11-22. Saved by the main thread.
- **Scope:** `src/features/mock-exam/screens/`, `src/app/[locale]/mock/**`, the runner and machine wiring, the recorder, and `e2e/mock-exam.spec.ts`.

• ## Summary

No blocker found in the main mock-exam flow. The screens generally dispatch the correct events, `START` reaches `HTMLAudioElement.play()` synchronously, deadline scheduling is centralized, and recording cleanup/privacy are well handled.

The main concerns are a review-navigation race that can discard recordings before the guard activates, a missing visible notice when the first recording fails, and E2E coverage that does not exercise the important browser/media failure modes.

This was a static, read-only review; I did not run tests or modify files.

## Blocker

None.

## Should fix

- **Review navigation is unguarded while recordings are still loading.**  
  `src/features/mock-exam/screens/mock-review.tsx:68-69`, `src/features/mock-exam/screens/mock-review.tsx:117-121`, `src/features/mock-exam/screens/mock-review.tsx:165-172`, `src/features/mock-exam/screens/mock-review.tsx:283-294`  
  `unkept` remains false until the asynchronous attempt/recording read finishes, but the back link and next-step links are already available. Navigating during that window unmounts the review and discards session recordings without the promised discard dialog. Slow persistence or a pending `MediaRecorder.stop()` makes this reachable.  
  **Fix:** establish the guard before asynchronous loading completes, or withhold/guard navigation until the read settles. Add a test with deferred persistence/recording reads that attempts navigation during loading.

- **A failure to record the first answer never produces the specific visible notice.**  
  `src/features/mock-exam/screens/focused-run.tsx:401-403`; emitted by `src/features/mock-exam/machine/transition.ts:1173-1180`  
  The notice requires both `micState === "unavailable"` and some previously successful recording. If the first recorder start fails, that condition remains false for the entire attempt. The generic “Not recording” header changes, but “Your next answers won’t be recorded. The exam continues” is never visibly shown. Its live announcement is also correctly queued until after Done, leaving no immediate explanation during the answer.  
  **Fix:** track recording failure/reacquisition failure explicitly rather than inferring it from earlier takes; render the notice immediately while retaining the queued announcement behavior. Cover first-answer `RECORDING_FAILED` in a component test.

- **The E2E suite does not exercise the highest-risk browser integrations.**  
  `e2e/mock-exam.spec.ts:6-13`, `e2e/mock-exam.spec.ts:20-89`, `e2e/mock-exam.spec.ts:222-246`  
  All examiner playback is replaced with a permissive stub, including on WebKit, and WebKit always skips recording. Consequently the suite cannot detect a broken iOS gesture unlock, real `play()` rejection/interruption behavior, actual WebKit `MediaRecorder` behavior, or track cleanup. There is also no full exam-conditions E2E run, reload-marker journey, browser-back journey, preload/playback failure, unavailable storage, keep/delete/reload-of-kept-recording, or no-upload assertion.  
  **Fix:** retain the deterministic happy-path tests, but add targeted integration tests with real media-element behavior where supported, explicit WebKit denial/unsupported-path tests, and a real-iPhone/manual protocol for unlock, interruptions and recording. Add deterministic E2E coverage for exam timing/notices, reload, back, failures, storage and kept recordings; monitor requests to prove recorded blobs are never uploaded.

## Nit

- **Sample answers ignore the responsive disclosure design.**  
  `src/features/mock-exam/screens/review-question.tsx:46-65`, `src/features/mock-exam/screens/review-question.tsx:133-138`  
  The sample is always expanded. The review specification calls for collapsed samples on phones, expanded when no recording exists, and expanded in the wide two-column layout. The current version makes mobile reviews substantially longer.  
  **Fix:** wrap the sample in the specified responsive `Disclosure`, defaulting it open for the no-recording and wide-layout cases.

- **SIRI situation intros receive the wrong source-label message.**  
  `src/features/mock-exam/screens/review-material.tsx:76-78`  
  A SIRI-origin intro uses `examiner.suggested` (“Suggested SIRI text”) instead of `examiner.siri`, mislabelling the source.  
  **Fix:** use `examiner.siri` when `situation.intro.origin === "siri"` and add a source-label assertion.

- **The mock start page never exposes the past-exams link.**  
  `src/features/mock-exam/screens/mock-start.tsx:14-84`; unused copy at `messages/fa.json:398`  
  The specification requires “My past mock exams” when attempts exist, but the component receives only `topicCount`.  
  **Fix:** add a storage-aware client leaf that reads attempts and renders the link only when history exists.

- **Leftover reload markers are only cleared by opening a runner.**  
  `src/features/mock-exam/runner/runtime.ts:437-449`  
  The specification says a marker encountered on any other route is cleared silently. Currently, visiting Home or Topics leaves it intact, so a later runner visit can show an old “couldn’t be kept” view.  
  **Fix:** clear leftover markers from the appropriate non-runner route boundary, with guarded storage access.

## Done well

- **Synchronous iOS unlock:** `send()` drains commands directly rather than inside a React effect (`src/features/mock-exam/runner/runtime.ts:101-119`), and the audio adapter calls `player.play()` in that stack. The shared player then invokes `media.play()` immediately.
- **Machine wiring:** the screens use the expected typed events; duplicate actions are guarded by the reducer. Request IDs reject stale preload, audio, microphone and recorder feedback.
- **Timers:** deadlines remain pure in the machine, with one host timeout, late-tick draining, frozen technical holds, running exam time during repeats/dialogs, and independent grace/recording-cap handling.
- **Recording privacy and cleanup:** no upload path exists; capture stays in session memory unless explicitly kept in IndexedDB. Tracks are stopped on final release, preloaded/review object URLs are revoked, and pending recording parts are handed safely to review.
- **Safe review reads:** attempt IDs and stored data are validated, topic/attempt mismatches are rejected, stale reads are aborted, and in-memory fallback remains available after save failure.
- **Accessibility:** the primary button uses `aria-disabled` without losing focus; dialogs set safe initial focus and restore focus to the primary slot; live regions explicitly use `aria-live="polite"` and tag Danish content; `RepeatControl` correctly separates its accessible name and description.
- **Audit fixes:** sticky bars use measured offsets and unpin together on short/large-text/tall-content viewports; animations are reduced-motion-safe and finite; drawn-card thumbnails are natively disabled.
- **Product and i18n:** practice appears first, rules and alternatives are shown before starting, grace/handover notices remain visible with timers hidden, and no grading or scoring is introduced. Scoped UI strings are localized, numbers use formatters, Danish uses `DanishText`, no physical Tailwind spacing classes or «امتحان» were found.
- **Next.js 16:** routes retain the static setup, review topics use `generateStaticParams`, and `useSearchParams` clients are inside `Suspense`. Client providers preserve session recordings across the runner-to-review handoff.

