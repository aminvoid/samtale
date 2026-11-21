# Independent review (Kimi): app shell, home page and topic library

- **Reviewer:** Kimi Code CLI (`kimi -p`, read-only), 2026-11-21. Saved by the main thread.
- **Scope:** commit 0554f88: `src/features/app-shell`, `home` and `topic-library`; `src/app/[locale]`; the new UI components; `e2e/topic-library.spec.ts`.
- **Kimi changed no files.** The changes seen during the run were Codex's concurrent topic study page work.

• ## Summary

Reviewed **HEAD `0554f88`** only; later working-tree edits were excluded. No blockers found. The static-rendering architecture, content access, search normalization, pre-2023 markup, and current-state shape cues are generally solid. The main issues are desktop navigation, search recovery, and first-result announcement reliability.

This was a static, read-only review; I did not run builds or tests.

## Blocker

None.

## Should fix

1. **Desktop navigation omits “My progress”**
   - **Where:** `src/features/app-shell/primary-navigation.tsx:7`, `src/features/app-shell/primary-navigation.tsx:25`; entrenched by `e2e/topic-library.spec.ts:109`.
   - **Issue:** Both navigation variants render only `primaryLinks`, so the ≥768 px navigation has five links. UXD-01 requires six, with **My progress** last; only the drawer currently includes it.
   - **Why:** A primary section disappears exactly where the specification says all six should be visible. The e2e assertion incorrectly approves the deviation.
   - **Fix:** Render `[...primaryLinks, progressLink]` for `variant="top"` only, preserving five bottom tabs. Change the e2e test to expect six top links and assert that Progress is present and last.

2. **A failed initial search navigation permanently blocks further searches**
   - **Where:** `src/features/topic-library/library-search-box.tsx:31`, `src/features/topic-library/library-search-box.tsx:45`.
   - **Issue:** `submitted` is cleared only when the pathname or query changes. If the initial `router.push()` fails or is cancelled without changing location, `submitted !== null` remains true, so every later debounce and explicit submit returns without navigating.
   - **Why:** One interrupted transition can leave search unusable until the user navigates elsewhere or reloads.
   - **Fix:** Let a newer draft supersede the pending submission, and clear pending state on failure/cancellation rather than using it as a blanket lock. Add a regression test where the first mocked `push` never updates `useSearchParams`, then enter another query and verify that a second navigation occurs.

3. **The first search result count can be silent to screen readers**
   - **Where:** `src/features/topic-library/search-results.tsx:46`; mount path at `src/features/topic-library/url-search-results.tsx:15`.
   - **Issue:** On the first navigation to search, the `role="status"` region mounts already containing the count. Unlike updates to an existing live region, initial content in a newly mounted polite region is not reliably announced, particularly across screen-reader/browser combinations.
   - **Why:** The first pause after typing—the transition from themes to search—may not produce the announcement required by US-008 #4. Subsequent query changes are more reliable because they update existing content.
   - **Fix:** Keep the live region mounted empty, then populate it after the debounced query/result commit. Test that sequence structurally, and verify actual announcement manually with VoiceOver/WebKit; an axe scan cannot catch this.

4. **The live-search e2e test is timing-sensitive and can accept stale results**
   - **Where:** `e2e/topic-library.spec.ts:63-91`.
   - **Issue:** It drives three real 300 ms debounce/navigation cycles using default timeouts. The initial `router.push` and subsequent React/history updates are plausible mobile-WebKit flake points under parallel load. Also, after entering Danish, the generic positive-count regex and “first topic is visible” assertion can pass against the preceding Persian results before the Danish results render.
   - **Why:** This makes CI timing-dependent while not proving that each query produced its own results.
   - **Fix:** Control the debounce with `page.clock`, explicitly advance it, and wait for a query-specific topic and exact count after each input. Avoid fixing this solely by increasing timeouts. Splitting direct-query rendering from the single live-typing scenario would also isolate failures.

5. **Topic document titles omit the Danish topic name**
   - **Where:** `src/app/[locale]/topics/[topicId]/page.tsx:12-16`.
   - **Issue:** Metadata uses only `topic.title.fa`. IA §4.4 requires `Danish name — Persian name · app name`.
   - **Why:** The page title is part of route-change announcement and is especially important when the visible `h1` is Danish.
   - **Fix:** Add a translated title message accepting both content names and return that message from `generateMetadata`.

## Nit

1. **PD3 is direction-isolated but not language-marked**
   - **Where:** `messages/fa.json:15-16`, using `src/i18n/rich-tags.tsx:9`.
   - **Issue:** Home wraps PD3 in `<ltr>`, producing `<bdi dir="ltr">` without `lang="da"`, despite the Home bidi contract explicitly requesting `<bdi lang="da">`.
   - **Fix:** Use the existing `<da>` rich tag for PD3 in these messages.

2. **“Theme” is translated as “topic” in navigation and recovery copy**
   - **Where:** `messages/fa.json:78`, `messages/fa.json:109`.
   - **Issue:** `library.view.themes` is «موضوع‌ها» and “Browse by theme” becomes «مرور بر اساس موضوع». This obscures the distinction between the theme view and individual topics.
   - **Fix:** Use a reviewed Persian equivalent for “theme,” such as «دسته‌ها», consistently in both keys.

3. **Templates tab uses the wrong specified icon**
   - **Where:** `src/features/app-shell/section-links.ts:15`.
   - **Issue:** It uses `layout-template`; `docs/design/components.md` §0.3 specifies `quote` for the Templates and phrases tab.
   - **Fix:** Change the tab icon to `quote`.

4. **Important route and interaction states lack regression coverage**
   - **Where:** `e2e/topic-library.spec.ts:25-38`, `e2e/topic-library.spec.ts:114-139`.
   - **Issue:** Filter history is covered, but unknown/unpublished theme, term, and topic IDs are not; neither are search back/forward restoration, empty terms/similar states, or drawer Tab containment. Axe covers only the four main library routes, not detail, empty, no-results, or open-drawer states.
   - **Fix:** Add focused cases for those behaviors, especially 404 status plus library link for each unknown ID type and search restoration after opening a topic and going back.

## Done well

- **Search correctness:** `src/lib/content/search.ts:2-10` and `src/features/topic-library/search-topics.ts:12-27` correctly handle Danish case, Arabic/Persian ي/ی and ك/ک, Arabic diacritics, ZWNJ/space variants, mixed scripts, and all-token matching across fields. The component fixtures exercise the important Persian variants.
- **Static architecture:** `ensureStatic = "navigation"` is present, dynamic content routes generate static params, and query state is read in client components behind `Suspense`. I found no server-side `searchParams`, request-data API, or accidental dynamic-route directive in scope.
- **Content boundaries:** All scoped content reads go through `src/lib/content/repository`; no feature imports another feature’s internals or reads content JSON directly.
- **Pre-2023 behavior:** `src/features/topic-library/topic-list-item.tsx:32-35` keeps the label plain and inside the single topic link, while explanations remain outside through `ListInfoButton`. Terms correctly omit row badges below the era divider.
- **Current indicators:** Bottom/top navigation, segmented library navigation, drawer rows, filters, and term jump links all have bars, borders, filled shapes, or checkmarks rather than tint alone.
- **i18n/RTL:** Danish content consistently uses `DanishText`/isolated term labels; numeric counts and dates use ICU/Intl. I found no Danish interpolated into `aria-label`/`title`, no «امتحان», and no directional physical Tailwind classes in the scoped features.
- **Accessibility structure:** Skip link, landmarks, one `h1` per page, route-focus handling with view-switch exceptions, explicit polite live-region attributes, and native links rather than ARIA tabs are all implemented appropriately. The drawer uses Base UI’s dialog behavior.
- **Audio primitives:** The LTR slider context, RTL speed control, constant play-button names, and reduced-motion/forced-colour handling follow the audit guidance and have focused component tests.

