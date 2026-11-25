# Independent code review (Kimi): answer aloud

- **Reviewer:** Kimi Code CLI (`kimi -p`, read-only), 2026-11-25. Saved by the main thread.
- **Scope:** the uncommitted answer-aloud change (US-019): `src/features/study/answer-aloud*`, `src/lib/screen-wake-lock.ts`, the mock exam port changes, `messages/fa.json`, `e2e/topic-study.spec.ts`.
- **Result:** 1 Blocking, 5 Should fix, 2 Nits. The wake-lock extraction is clean; no mock exam behaviour changed; no upload path.

## Blocking

1. **`src/features/study/answer-aloud-session.ts:151-164`, `:191-200` — microphone acquisition loses iOS user activation.**  
   **Failure:** `getUserMedia` runs only after `await import(...)`. On retake and Next question it runs later still, from the audio `ended` callback. iOS Safari can reject either path with `NotAllowedError`; the rejection is then persisted as a denial, so subsequent questions stop attempting recording. Playback WebKit tests do not enforce real-iPhone activation rules.  
   **Fix:** preload the recorder module before enabling Allow, then invoke `requestMic()` synchronously in the Allow tap. For Record again/Next, acquire the stream during that tap—after the existing explanation—and defer `MediaRecorder.start()` until examiner playback ends. Verify on a real iPhone or with an activation-enforcing harness.

## Should fix

2. **`src/features/study/answer-aloud.tsx:70` — the history sentinel discards Next.js router state.**  
   **Failure:** the new entry contains only `pd3AnswerAloud`, dropping `__NA` and the router tree. After Back closes the panel, navigating Forward to the sentinel makes Next.js treat it as foreign history and reload the page.  
   **Fix:** merge the existing state as the mock-exam guard does in `src/features/mock-exam/runner/adapters/platform.ts:43-48`, and catch `pushState` failures. Add a Back → Forward regression test that asserts no reload.

3. **`src/features/study/answer-aloud.tsx:36-38`, `:65-79` — stale sentinels are mistaken for history owned by the current opening.**  
   **Failure:** open the exercise, reload, then open it again. Because the restored entry still has `pd3AnswerAloud`, no fresh entry is pushed; Close or Back now navigates away from the topic instead of merely closing the panel. BFCache restoration has the same ownership problem.  
   **Fix:** track ownership per opening, not merely by key presence. Push a fresh entry for every new opening, or strip stale markers on reload/page restore/unmount while preserving router state. Test reload → reopen → Close/Back.

4. **`src/features/study/answer-aloud-session.ts:296-305` — backgrounding an unrecorded answer does not pause it.**  
   **Failure:** choose Continue without recording, answer for 20 seconds, hide the tab for a minute, and return. The timer includes the hidden minute and the UI never enters the specified Paused state. Hiding during microphone startup similarly transitions to an actively timing unrecorded answer.  
   **Fix:** for `answering` and `starting` without an active recorder, freeze elapsed time and transition to `paused` without saving practice. Resume only through the explicit Continue action. Add no-microphone and pending-permission visibility tests.

5. **`src/features/study/answer-aloud-session.ts:167-169` — every recorder signal except `unmute` interrupts immediately.**  
   **Failure:** a mute lasting less than the configured one second stops the take. A mute during examiner repeat also calls `finish()`, stops playback, and releases the microphone—even though the interruption rule applies while answering, not while recording is paused for playback. This is particularly fragile with iOS audio-session changes.  
   **Fix:** apply `examConfig.micMuteInterruptMs`, cancel the pending interruption on unmute, and only arm it while answering. Handle ended/error separately and clean up the timer in `releaseMic()`. Test short mute, sustained mute, and mute during repeat.

6. **`src/features/study/answer-aloud-state.ts:1`, `src/features/study/answer-aloud-session.ts:13` — configured timings are duplicated locally.**  
   **Failure:** changing C5 or C6 in `examConfig` leaves answer-aloud at 180 seconds and 15 seconds, while tests continue passing against the local constants.  
   **Fix:** derive the recording cap from `examConfig.maxRecordingSeconds` and the loading timeout from `examConfig.slowLoadNoticeSeconds`.

## Nit

7. **`e2e/topic-study.spec.ts:239-241`, `:257-259` — the integration test depends on real elapsed time.**  
   **Failure:** expecting exactly `۰:۰۱` can become flaky on a loaded CI worker if more than two seconds elapse before the assertion or Done action.  
   **Fix:** install Playwright’s clock and advance it explicitly before asserting the timer and stopping.

8. **`src/features/study/answer-aloud.test.tsx:260-278` — the cap test is coupled to timer implementation.**  
   **Failure:** mocking `setTimeout`, checking its exact delay, and manually invoking the captured callback tests scheduling mechanics rather than the observable cap behavior; a valid scheduling refactor would break it.  
   **Fix:** use fake timers, advance to the configured cap, and assert that tracks stop and comparison opens without advancing.

The wake-lock extraction is clean and byte-equivalent; I found no mock-exam behavior change or cross-feature internal import. Recordings remain in-memory Blobs/object URLs with no upload path, and the reviewed stop/unmount paths release tracks, revoke URLs, clear timers, and invalidate late completions. Tests were not run, per the read-only instruction.

