# Independent review (Kimi): topic study page

- **Reviewer:** Kimi Code CLI (`kimi -p`, read-only), 2026-11-21. Saved by the main thread.
- **Scope:** commit 7eb73ac: `src/features/study/`, `src/app/[locale]/topics/[topicId]/page.tsx`, the UI components it uses, and `e2e/topic-study.spec.ts`.

• ## Summary

No blockers found in the reviewed scope. Content fidelity and the shared audio architecture are strong. The main gaps are the collapsed examiner transcript, the unfinished “SIRI differs” disclosure, and missing browser-level failure tests.

I found no code path that concatenates booklet text, inserts the hint into the author’s Persian, exposes margin notes, translates answers, or claims unverified wording is official. Tests were inspected but not executed, preserving the read-only constraint.

## Blocker

None.

## Should fix

1. **Examiner intro text is hidden by default**  
   `src/features/study/intro-audio.tsx:10`, `src/features/study/intro-audio.tsx:22-29`

   The Danish transcript starts behind a disclosure and only opens automatically after pressing play. US-012 and the screen specification require the intro’s text to be shown with its audio; playback, loading, and failure should not determine whether the transcript is initially available.

   **Fix:** render the `DanishText` transcript directly in `ExaminerIntro`. If hiding it is an intentional new requirement, update the UX specification and use an explicit show-text control consistently.

2. **“SIRI’s wording differs” does not reveal SIRI’s wording**  
   `src/features/study/verification-note.tsx:33-38`

   For `status === "differs"`, the disclosure displays only «متن کامل SIRI … در دسترس نیست». US-068 #4 requires the reviewed SIRI version beside the unchanged booklet wording. The current placeholder is honest, but does not satisfy that acceptance criterion.

   **Fix:** expose the approved alternative through an allow-listed published verification field and render it with `DanishText`. Continue using `question.text.da` as the primary text; never overwrite it.

3. **Required audio- and storage-failure E2E scenarios are missing**  
   `e2e/topic-study.spec.ts:9-58`, `e2e/topic-study.spec.ts:60-97`

   The playback stub always succeeds, and the only progress test exercises successful persistence. `.claude/rules/testing.md` explicitly requires Playwright coverage for audio failure and unavailable browser storage. Unit tests cover player logic, but not the complete page wiring.

   **Fix:** add E2E scenarios for:
   - rejected `play()` and media loading errors, followed by successful retry;
   - transcript remaining visible and controls retaining constant accessible names;
   - blocked or failed IndexedDB, ensuring no false saved-progress status;
   - session-only speed and layout-note behavior when persistence is unavailable.

## Nit

1. **Verification details omit the documented page reference and source link**  
   `src/features/study/verification-note.tsx:35-36`

   Only the term and check date are shown. The topic-study specification also calls for the examiner-booklet page and external source link, making the provenance harder to inspect.

   **Fix:** include allow-listed source pages and URL in the published verification data, format pages through the locale formatter, and use a translated external-link label.

2. **E2E audio assertions stop at visibility**  
   `e2e/topic-study.spec.ts:85-89`

   The test checks that a highlight and speed group appear, but not actual speed changes, seeking direction, pause/end highlighting, or cleanup. These behaviors have unit coverage, but browser integration remains unverified.

   **Fix:** assert ArrowRight seeks forward in the RTL page, 0.75×/1.25× applies across clips and survives reload, pause retains and ending clears the highlight, and navigation stops playback.

3. **Section navigation disables smooth scrolling for everyone**  
   `src/features/study/study-section-nav.tsx:11-13`

   `behavior: "instant"` is always used. The design specifies smooth fragment navigation normally and instant movement under reduced motion. The current behavior is safe for reduced motion, but does not implement the default visual behavior.

   **Fix:** select `instant` when `prefers-reduced-motion: reduce` matches and `smooth` otherwise, while preserving the existing heading-focus behavior.

## Done well

- **Fidelity:** Danish and Persian content fields are rendered directly. The «چرا؟ چرا نه؟» hint is a sibling of the author’s translation, with focused tests for the Danish ending variants.
- **Product rules:** model and short answers are collapsed by default and have no translation control; personal examples receive the uniform nurse label; related/similar links use structured data and app-authored wording.
- **Verification labels:** “official” is restricted to matched required questions. Intros and follow-ups use “SIRI’s suggested wording”; unchecked and differing entries avoid official claims.
- **Audio:** one shared `HTMLAudioElement`, `preload="none"`, gesture-synchronous `play()`, duplicate-load suppression, source-switch cancellation, retry states, pitch-preserving speeds, and thorough cleanup are implemented in `src/lib/audio/player/audio-player.ts`.
- **Highlighting:** manifest offsets explicitly index UTF-16 display text, and `AnswerAudio` applies them to `item.text.da`, including booklet emphasis without changing the resulting text.
- **Accessibility:** constant play-control names with `aria-pressed`, correct `h3 > button` disclosures, translated error live regions, keyboard-native controls, and the LTR `DirectionProvider` around only the media scrubber are all present.
- **i18n/RTL:** Danish and Persian blocks consistently set language and direction; numbers and dates go through message/formatting APIs. I found no Danish ARIA labels, `title` attributes, «امتحان», or directional physical CSS.
- **Architecture:** the route awaits params, statically generates repository-listed topic IDs, returns `notFound()` for unknown topics, and reads content only through the repository. Interactive client islands remain localized.
- **Progress safety:** browser storage is behind the asynchronous `ProgressStore`, with SSR guards, memory fallback, caught failures, duplicate-click protection, and reload coverage.
- **Testing:** component tests use real Persian messages and role-based queries; E2E covers deep-link focus, RTL at 375/1280 px, related-topic navigation, reload persistence, and axe scans in light and dark modes.

