# Code review: mock exam review fixes

- **Reviewer:** `code-reviewer`, 2026-11-22 (read-only; saved by the main thread).
- **Scope:** the uncommitted changes that applied the Kimi and Persian mock reviews: `src/features/mock-exam`, `src/app/[locale]/mock`, `e2e/mock-exam.spec.ts`, `messages/fa.json`.
- **Result:** 1 Blocking, 5 Should fix, 5 Nits. The machine change is sound.

## Blocking
1. **`review-material.tsx` uses `useSyncExternalStore` but has no `"use client"`.** The review page renders it from a server component (the Suspense fallback), and the React server build doesn't export that hook, so the prerender fails. Move the breakpoint hook into `review-question.tsx` (already a client component) and drop the `wideSamples` prop.

## Should fix
2. **The review page can trap the user while loading.**
   - Problem: in `"loading"`, link clicks are swallowed silently. Loading waits on the recorder's stop promise, which has no timeout, so it can stay "loading" forever (Safari can skip the `stop` event when the track ends first).
   - Fix: a stop timeout in the recorder that resolves `null`, and queue the intercepted navigation instead of dropping it.
3. **The leftover reload marker is cleared only inside `/mock/*`.** State machine §12.3 says any other route. Mount the cleaner in the `[locale]` layout or the app shell, through the feature's public index.
4. **The history link goes to the placeholder progress page.** Hide it until the history exists.
5. **e2e: the history-link `toHaveCount(0)` check can't fail.** It runs before the async IndexedDB read completes. The component test has the same gap.
6. **e2e strings are hard-coded and depend on the digit style.** Build them from `messages` with the formatter. Use a predicate for the recording time.

## Nits
7. **Machine tests:**
   - a stale `requestId` on `RECORDING_FAILED` or `MIC_REACQUIRE_FAILED`
   - the flag surviving a practice `RESTART` (document it)
8. **The sample-answer default flips** after mount and when recordings arrive late. Decide it once.
9. **`mock.title` is called with `part: "two"`.** Pass `"other"` or add an explicit branch.
10. **`seedDraw` in e2e overrides `getRandomValues` globally.** Scope it, or document it.
11. **Redundant ZWNJ in «باز‌کردن».** Already fixed by the main thread.

## Decisions (main thread, by delegation)
- Loading guard: queue the navigation (2b) and keep the protection against discarding takes before the keep decision.
- The browser Back button in `"loading"` and `"unkept"` silently discarding session takes: accepted for v1. Recorded as a known limitation.
