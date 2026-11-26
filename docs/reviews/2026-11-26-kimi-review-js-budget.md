# Independent code review (Kimi): home JavaScript budget changes

- **Reviewer:** Kimi Code CLI (`kimi -p`, read-only), 2026-11-26. Saved by the main thread.
- **Scope:** the uncommitted changes by `frontend-developer` that cut the home page JS from 281 KB to 191.5 KB:
  - generated global-error strings
  - the on-demand menu drawer
  - lazy progress and recording stores
  - direct imports on the mock routes
  - next-intl message precompile
- **Result:** no blocking findings, 4 Should fix, 3 Nits.

## Blocking

None.

## Should fix

1. **A delayed cleanup can erase the marker after returning to a mock route** — `src/features/mock-exam/screens/clear-mock-reload-marker.tsx:15-17`  
   **Scenario:** Navigate away from a running attempt, starting the lazy import, then quickly navigate back to `/mock/practice` before it resolves. The old effect has no cancellation or pathname recheck, so it clears the marker while the current route explicitly requires preservation; the reload notice/recovery semantics are lost.  
   **Fix:** Make cleanup cancellable: after the import resolves, check that the effect is still active and the current pathname is not a mock-running route before clearing. Add a deferred-chunk navigation regression test.

2. **A failed drawer chunk load is completely silent** — `src/features/app-shell/menu-drawer.tsx:41-54`  
   **Scenario:** On a failed deployment chunk or temporary network failure, a keyboard or screen-reader user activates the menu and receives no loading state, error, or announcement. Focus remains on the button and `aria-expanded` stays false, making the control appear broken; utility navigation is unavailable.  
   **Fix:** Track pending/failed state, expose pending through the existing button loading/`aria-busy` behavior, and render a translated polite status with retry guidance. Test Enter/Space activation, failed load followed by successful retry, and focus remaining on the trigger.

3. **Subscriptions never recover after their first chunk load fails** — `src/lib/progress/lazy-stores.ts:70-78`  
   **Scenario:** `subscribe()` encounters a rejected import and swallows it. A later method successfully retries the import, but the original listener is never attached and misses every subsequent progress notification. The test at `src/lib/progress/lazy-stores.test.ts:143-153` verifies loading retry but not subscription recovery.  
   **Fix:** Retain active pending listeners and attach them when any subsequent load succeeds, avoiding duplicate subscriptions and preserving early unsubscription. Test failure during subscribe, successful retry, and notification delivery.

4. **The runtime caches a lazy-load failure as the attempt’s permanent save result** — `src/features/mock-exam/runner/runtime.ts:320-327`, `src/lib/progress/lazy-stores.ts:36-39`  
   **Scenario:** If initialization/marker operations and then `saveAttempt` all encounter an unavailable chunk, `persisted` retains the failed promise. Although the store can retry on its next call, `persistAttempt` refuses every later call for that attempt, so connectivity recovery cannot persist it.  
   **Fix:** Evict the cached promise on failure when it is still the current attempt save, and provide a retry path that reissues persistence. Add a first-import-fails/second-succeeds integration test through the runtime.

## Nit

5. **The history lookup does not benefit from lazy-store retry unless something remounts it** — `src/features/mock-exam/screens/mock-history-link.tsx:20-24`  
   **Scenario:** With history enabled, one transient import failure returns `unavailable`, leaving `hasHistory=false`; the effect runs again only when `save` changes. Existing history can therefore remain hidden after connectivity returns.  
   **Fix:** Retry a failed read with a bounded retry or explicit user action, and test failure followed by recovery.

6. **Direct production builds do not enforce generated-message freshness** — `package.json:12-15`, `package.json:31`, `src/app/global-error.test.tsx:26-28`  
   **Scenario:** The CI test correctly prevents drift in the documented CI path, but `npm run build` neither regenerates nor checks the file. A direct deployment after editing `messages/fa.json` can ship stale global-error copy.  
   **Fix:** Run the generator from `prebuild`/the deployment build, or add a deterministic generation-and-diff check to the build. Keep the sync test as the local fast check.

7. **Tests mostly bypass the newly selected formatter** — `next.config.ts:45-49`, `src/test/render-with-intl.tsx:4-12`  
   **Scenario:** Vitest supplies raw JSON to the normal runtime parser, so it cannot detect precompile-specific behavior changes. Production E2E already exercises rich tags, plurals, and numbers, but select and named date formatting lack focused assertions. The installed formatter does support all ICU constructs currently used, and there are no `t.raw` calls or plural offsets.  
   **Fix:** Add focused production-build E2E assertions for the precompiled select message and named date output; document the experimental flag and its rollback in ADR-0004.

