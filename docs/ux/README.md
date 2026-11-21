# UX architecture, v1

| | |
|---|---|
| **Status** | **Revision 2**: walkthrough and architecture feedback applied; ready for `ui-designer` |
| **Date** | 2026-11-19 (revision 2: 2026-11-19) |
| **Revision 2 inputs** | [learner walkthrough](../reviews/2026-11-19-learner-walkthrough-ux.md) (R-01 to R-38), ADR-0005 §4, ADR-0007, ADR-0002 (topic links) |
| **Author** | `ux-architect` |
| **Inputs** | [PRD rev. 3.1](../product/prd.md), [user stories rev. 3.1](../product/user-stories.md) (US-001 to US-070, GA-1 to GA-14, config table), [personas](../product/personas.md), [decision log](../product/decision-log.md), [exam-accuracy review](../reviews/2026-11-18-pd3-exam-review-prd.md), ABOUT_PD3_MUNDTLIG.md §3.4 and §10, [schema proposal](../content/schema-proposal.md), [pilot report](../content/pilot-report.md) §1–2, `content/topics/2024-maj-b.json`, `content/examiner-lines.json`, the booklet's `skeletons`, `universal`, `vocab` and `recurring` sections and lines 44–56 |
| **Not in scope** | Colours, type, visual style (`ui-designer`); libraries and technical architecture (`software-architect`) |

## Contents of this folder

| File | What it is |
|---|---|
| [information-architecture.md](information-architecture.md) | Sitemap, navigation (phone, tablet, desktop), URL scheme, first-time orientation, cross-links, where delprøve 1 slots in |
| [component-inventory.md](component-inventory.md) | Every component the screens need, with behaviour, states, RTL and accessibility. Input for `ui-designer`. |
| **Flows** | |
| [flows/first-visit.md](flows/first-visit.md) | First visit and orientation |
| [flows/browse-and-find-topic.md](flows/browse-and-find-topic.md) | Themes, terms, similar questions, search |
| [flows/study-topic.md](flows/study-topic.md) | Studying a topic, including **answer this question aloud** (D-7) |
| [flows/templates-and-phrases.md](flows/templates-and-phrases.md) | Templates, toolbox, words and phrases |
| [flows/shadowing.md](flows/shadowing.md) | Sentence-by-sentence shadowing |
| [flows/mock-exam-practice.md](flows/mock-exam-practice.md) | Mock exam, practice mode |
| [flows/mock-exam-exam-conditions.md](flows/mock-exam-exam-conditions.md) | Mock exam, exam conditions |
| [flows/mock-exam-state-machine.md](flows/mock-exam-state-machine.md) | **The behavioural spec for the mock-exam reducer** |
| [flows/mock-review.md](flows/mock-review.md) | Review and self-check after a mock |
| [flows/spaced-review.md](flows/spaced-review.md) | Day 1 → 3 → 7 → 14 per topic |
| [flows/recording-consent-and-microphone.md](flows/recording-consent-and-microphone.md) | Recording consent and microphone permission |
| [flows/errors-and-recovery.md](flows/errors-and-recovery.md) | Error catalogue and the default states every screen shares |
| [flows/progress-and-data.md](flows/progress-and-data.md) | What's stored, progress, deleting data |
| **Screens** | |
| [screens/home.md](screens/home.md) · [screens/exam-guide.md](screens/exam-guide.md) · [screens/topic-library.md](screens/topic-library.md) · [screens/similar-questions.md](screens/similar-questions.md) · [screens/topic-study.md](screens/topic-study.md) · [screens/answer-aloud.md](screens/answer-aloud.md) · [screens/templates.md](screens/templates.md) · [screens/toolbox-and-vocabulary.md](screens/toolbox-and-vocabulary.md) · [screens/shadowing.md](screens/shadowing.md) · [screens/mock-start.md](screens/mock-start.md) · [screens/mock-get-ready.md](screens/mock-get-ready.md) · [screens/mock-draw-and-look.md](screens/mock-draw-and-look.md) · [screens/mock-interview.md](screens/mock-interview.md) · [screens/mock-review.md](screens/mock-review.md) · [screens/progress.md](screens/progress.md) · [screens/settings.md](screens/settings.md) · [screens/about-and-privacy.md](screens/about-and-privacy.md) · [screens/system-pages.md](screens/system-pages.md) | One file per screen: purpose, stories, content hierarchy, components, all states, 375/768/1280 behaviour, RTL and bidi, accessibility, copy keys, ASCII wireframes |

## Conventions used in every file

- **Breakpoints:** *phone* below 768 px (designed at 375, works from 320; GA-3), *tablet* 768–1023 (designed at 768), *desktop* 1024 and up (designed at 1280).
- **Wireframes** are ASCII, drawn **as seen in RTL**: the inline start is on the right. Labels are English glosses of the intended Persian. `[da: …]` marks Danish, rendered LTR. Where ASCII can't show RTL well (checkbox position), a note says so.
- **Danish vs Persian:** every Danish block goes through one component with `lang="da" dir="ltr"`; Danish inside a Persian sentence is isolated (`<bdi lang="da">`); Persian content fields carry `lang="fa"` ([i18n rules](../../.claude/rules/i18n-rtl.md)). Danish paragraphs align to their own start (left); how short Danish labels align inside Persian rows is a `ui-designer` decision.
- **Numbers** use Persian digits (D-2) through the single formatter, except inside Danish content and in term labels (UXD-22). Durations `m:ss` sit in LTR isolates.
- **Copy keys** are suggestions (feature-grouped camelCase). Each has an *intended meaning* in English; Persian drafts appear only where the PRD already proposed one or where a short draft helps layout testing. **All Persian is draft** for `persian-localization-reviewer`.
- **Shared states** ("loading", "slow network", "error", "storage unavailable", "microphone denied") have default behaviour in [errors-and-recovery.md](flows/errors-and-recovery.md#states-common-to-every-screen); screens list only what differs.
- **IDs:** `US-xxx` stories, `GA-x` global criteria, `D-x` decisions, `OQ-x` PRD open questions, `C1`–`C16` exam config ([state machine §2](flows/mock-exam-state-machine.md#2-config-values)), `UXD-xx` UX decisions (below), `UX-OQ-xx` UX open questions (below).

## Principles applied

| Principle | How it shows up |
|---|---|
| **Orientation** | `h1` on every page, back links that name the parent, section nav on topic pages, step indicator in the mock ("part 1 of 2"), the "how this page is laid out" note (US-011 #3) |
| **Thumb reach** | Bottom tab bar on phones; in focused mode the one primary action sits in the bottom thumb zone and never moves (UXD-08); Leave is at the top, far from Done |
| **Low cognitive load** | One primary action per screen; progressive disclosure for translations, sample answers, hints and explanations; recognition over recall (key words and the repeat phrase visible when needed) |
| **Anxiety-aware** | Practice first everywhere (D-1); rules before timed tasks; no countdown except the 10-second look; calm grace notice; no grades, scores or failure words (GA-10, US-067); always a way out; "interrupted, not failed" |
| **Faithful to the exam** | SIRI's lines verbatim; unmarked cards; situation intro; the clock starts at the intro; repeat replays the same audio; *"Tak."* only; situation cards visible throughout like the sheet on the table (UXD-07). Deliberate differences follow PRD §6.5. |
| **Accessibility from the start** | Keyboard paths, focus rules, live regions and timing are specified per screen and in the state machine (§15–§16); WCAG 2.2.1 and 2.2.2 handled explicitly |
| **Bidi explicit** | Each screen lists its Danish text, mirrored icons and mixed lines; [component inventory §9](component-inventory.md#9-icon-mirroring-in-rtl) is the mirroring table |

## Decisions D-18 to D-22 applied here

PRD rev. 3.1 records these as decided by delegation on 2026-11-19, owner to confirm.

| Decision | Where applied |
|---|---|
| **D-18** Situation cards show the booklet's own title (Danish + Persian) for all 51 topics; SIRI captions unused; the intro plays as audio with its text once a situation is chosen | SituationCard everywhere. Danish always visible; Persian on request on the study page (US-011 #2) and in practice (US-029 #5); **not shown in exam conditions** (US-029 #4) (UXD-18). In the mock the intro's text is available through "show text", hidden by default (US-030 #5; UX-OQ-06). |
| **D-19** No Persian translation of model answers or follow-up answers | No translation control on any answer (topic page, answer aloud, review, hints) |
| **D-20** Personal examples shown to everyone, labelled as from a nurse's perspective, with a prompt to make your own | PersonalExampleBlock; uniform app label instead of the booklet's three label variants (UXD-19; UX-OQ-13) |
| **D-21** No margin-note text; 🔁 and 🔗 become structured links in our wording | SimilarQuestionLink and RelatedTopics; dependency on a public link file (UX-OQ-14) |
| **D-22** Spaced review per topic; day 1 = first study day (= first day recorded as practised) | [spaced-review.md](flows/spaced-review.md); per-topic statement on progress and the study method (US-047 #2) |

## Revision 2: decisions by delegation, 2026-11-19

The owner asked us to go ahead with our recommendations while away. Each item below is **decided by delegation, 2026-11-19**, owner to confirm.

| # | Decision | Where |
|---|---|---|
| RD-1 | **Screen Wake Lock (R-01)** in every focused mode (mock runner, answer aloud, shadowing); re-requested when the page becomes visible; released when paused, finished or left. If unsupported: a one-time tip to raise the auto-lock time. A screen lock remains an interruption as the fallback. | state machine §5, §9, §12.1, T34; IA §3.3; get ready; component inventory |
| RD-2 | **Back (R-02, UX-OQ-01):** back opens the leave dialog; it first closes any open sheet or dialog (Android). If the OQ-9 spike finds the guard unreliable, back saves the attempt as "ended early" and `/fa/mock` shows a notice. Behind the ADR-0007 flag (C19) until the spike confirms it. The review page uses the same guard for unkept recordings (R-34). | state machine C19, §7.6, §12.4, T38, T40; mock-start; mock-interview |
| RD-3 | **Calls while answering (R-03):** a microphone mute (over 1 s) or end while answering is an **interruption**, not "microphone unavailable". If the microphone can't be re-opened on Continue, later answers are "not recorded". | state machine C18, §7.3, §7.5, §12.1, I17, T28 |
| RD-4 | **Answer aloud (R-04):** the compare step moves focus to "Play your answer"; "Next question" is a separate control; Done never becomes "Next question". | answer-aloud; study-topic flow; component inventory |
| RD-5 | **Topic lists (R-05):** no interactive control inside a link; the pre-2023 badge is plain text in lists; the explanation lives at list level (info button, era divider), on the topic page and on the reveal. | topic-library; browse flow; component inventory |
| RD-6 | **Both required questions always asked (R-10):** a part-1 cut-off (C17; set to 150 s in rev. 2.1, plus the C21 handover, RD-13); answers in progress finish; no new part-1 follow-up starts; U2 is asked even after the limit if it hasn't been. | state machine C17, §4, §10 (R0, R1a, R1), I4, I14, T35–T37 |
| RD-7 | **UX-OQ-02:** "End and see my answers" in the leave dialog and the practice pause overlay; the other option is "Leave without saving". New status `endedEarly` in both modes. | state machine §7.5–§7.6, §14, T39 |
| RD-8 | **Positions adopted from the walkthrough:** UX-OQ-04 (sample answers stay collapsed on the topic page; expanded after answering and when not recorded; subtitle under "Answer aloud"), UX-OQ-05 (shadowing a whole answer counts as practised), UX-OQ-06 (intro text hidden by default in the mock; practice keeps it open once opened, with Persian meaning for fixed lines), UX-OQ-27 (keep UXD-01; history one tap from Mock and Home), UX-OQ-28 (no ticks in history; total time and an optional "focus next time"), UX-OQ-29 (answer aloud shows the question text by default). | screens and flows as listed |
| RD-9 | **P1 findings applied:** R-06 (returning Home on any progress), R-07, R-08, R-09 (grace notice leads with permission), R-11 (neutral sound-check clip with text and meaning), R-12 (simplified get ready; "always show text" moved to settings and practice-only), R-13 (visible repeat label; slower replay in practice), R-14, R-16 (verification date, page and link; "not yet checked word for word"; situation-card source), R-17 (one digit style per label; era divider), R-18, R-19 (what it is first; SIRI spelled out), R-20 (Persian gloss and audio for Danish terms in the guide), R-21 (Telegram in-app browser in the test matrix), R-22 (scrubber arrow keys; media direction, not mirrored), R-23. | as cited in each file |
| RD-10 | **Calendar (UX-OQ-08):** Gregorian, Persian month names, Persian digits, e.g. «۲ دسامبر ۲۰۲۶». **Term labels (UX-OQ-09):** Danish with Latin digits, e.g. "Maj–Juni 2024". | IA §4.3 |
| RD-11 | **Review route (ADR-0005 §4):** `/fa/mock/review/{topicId}?attempt={id}`. | IA §4.2; state machine; review |
| RD-12 | **Topic links (UX-OQ-14):** from the public `content/topic-links.json` (ADR-0002, created by `content-engineer`); the app never reads `content/internal/`. | IA §7; topic-study |

**P2 findings applied (cheap):** R-25 (data note at the reveal), R-26 (compact picture note; look fits 560 px), R-27, R-28, R-29 (term jump list; progress jump links at all widths), R-30 (short tab labels at 360 px), R-31 (My progress last in the top nav), R-33, R-34, R-35 (no new prompt while the leave dialog is open in exam conditions), R-36 (unpin the answer area at large text), R-37.

**Deferred:** R-32 (formal, Dari-friendly wording in **content** translations) → `persian-localization-reviewer` and `content-engineer`, outside `docs/ux/`. R-38 (a language-quality self-check item) → PM question (story update below). Walkthrough M7's "fresh draw on Start again" → owner question (UX-OQ-31).

**UXD changes in revision 2:** UXD-13 (show text: practice persists and the setting is practice-only; exam conditions resets per unit), UXD-14 (answer aloud shows text by default; separate "Next question"), UXD-17 (shadowing a whole answer also counts), UXD-21 (adds "focus next time"), UXD-22/23 (calendar and term labels decided), **UXD-28 superseded** (the sound check uses a neutral new line, not the transition). New: **UXD-32** wake lock (RD-1), **UXD-33** back (RD-2), **UXD-34** part-1 cut-off (RD-6), **UXD-35** no interactive controls inside list links (RD-5).

### Open-question status after revision 2

| Status | IDs |
|---|---|
| **Closed** | UX-OQ-01, 02, 04, 05, 06, 07, 08, 09, 14, 27, 28, 29 (as above); UX-OQ-11 and 22 (applied; story updates below); UX-OQ-23 (accepted, now practice-only) |
| **Still open** | ~~UX-OQ-03~~ (closed in rev. 2.2, RD-19; whether timers are visible by default remains a usability-test item) · **UX-OQ-33** adjusted exam (rev. 2.2) · **UX-OQ-10** content for the neutral sound-check line, draft *"Hej. Velkommen til prøven."* (`content-engineer`, `danish-language-reviewer`) · ~~UX-OQ-12~~ (closed in rev. 2.1, RD-13) · **UX-OQ-13** app label instead of the booklet's personal-example labels (owner) · **UX-OQ-15** sentence timings for shadowing (`speech-engineer`) · **UX-OQ-16** emoji vs icons (`ui-designer`) · **UX-OQ-17** V2 table and grammar tip (PM) · **UX-OQ-18** avoid repeating the last drawn term (PM) · **UX-OQ-19** sample-answer label (owner) · **UX-OQ-20** "differs from SIRI" display (owner, `content-engineer`) · **UX-OQ-21** report channel (owner) · **UX-OQ-24** theme draws with fewer than three topics (PM) · **UX-OQ-25** nurse-specific toolbox sentence (owner) · **UX-OQ-26** microphone level meter (PM) |
| **New** | **UX-OQ-30** Can Telegram's in-app browser be detected reliably enough to show the "open in your browser" note? (`software-architect`, spike) · **UX-OQ-31** Should "Start again" after an interruption draw a fresh topic instead of reusing it? (owner; walkthrough M7) · **UX-OQ-32** Is the Screen Wake Lock honoured in Telegram's in-app browser and on the ADR-0014 floor devices? (OQ-9 spike) |

## Revision 2.1: decided by delegation, 2026-11-20

From the [exam review of the mock rules](../reviews/2026-11-20-exam-review-mock-rules.md). Each item is **decided by delegation, 2026-11-20**, owner to confirm.

| # | Decision | Where |
|---|---|---|
| RD-13 | **S1:** C17 = 150 s (2:30). New **C21 `part1HandoverSeconds` = 200 s** (exam conditions only): a part-1 answer still running at 3:20 gets the notice "You can finish your sentence. Then the examiner will ask the next question." and C3 grace, then *"Tak."*, the transition and `q2`. C17 and C21 are app heuristics, to tune in usability sessions. | state machine C17, C21, §10 R1a/R1b, L9–L12, I18–I19, T35–T37, T42–T44; exam-conditions flow; mock-interview |
| RD-14 | **S3:** a SourceLabel variant **"SIRI's suggested wording"** for situation intros and suggested follow-ups; "SIRI's wording" stays for the intro line, closing and verified required questions. One guide line and a topic-page note: the examiner may reword intros and follow-ups. | component inventory; topic-study; study-topic flow; exam-guide |
| RD-15 | **Suggestion 1:** grace extended by repeats has an absolute ceiling of 330 s (C22); then the closing at the next Done, or when the playing replay ends. | state machine C22, R3, L12, I20, T45 |
| RD-16 | **Suggestion 3:** the slower repeat is labelled a practice aid ("the real examiner doesn't do this"); no "stand-in for rephrasing". | state machine §11; mock-interview |
| RD-17 | **Suggestion 4:** the hints sheet says "Not available in the real exam: there are no notes in delprøve 2". | mock-interview |
| RD-18 | **Suggestion 7:** the skipped-follow-up review note carries no SIRI or "real examiner" attribution: "The app moved on to the general question to leave time for it." | mock-review (flow and screen) |

UX-OQ-12 is now **closed** (values set by `pd3-exam-expert`, still to tune in sessions).

## Revision 2.2: decided by delegation, 2026-11-21

From the [accessibility audit](../reviews/2026-11-21-a11y-audit.md). Owner to confirm.

| # | Decision | Where |
|---|---|---|
| RD-19 | **M7:** the exam-conditions rules say up front that answers end at the limit after a short notice. The handover and grace notices are **always** shown and announced, whatever the timer setting (**closes UX-OQ-03**). The one-minute notice is independent of timer visibility. | mock-start; state machine C9, R7, §8, §15, I21, T47–T49; mock-interview |
| RD-20 | **M8:** a headphones tip on get ready; in-answer announcements queued until after Done, except the handover and grace notices. | mock-get-ready; state machine §15, I22, T49–T51; mock-interview |
| RD-21 | **M1:** Danish never goes in `aria-label`, `title` or plain-string announcements; names come from content, and the live region renders `<span lang="da">`. | component inventory (DanishText, LiveRegion); state machine §15; mock-interview |
| RD-22 | **m1, m2:** the system-pages spec stands; the 404 and error pages use the title template. | system-pages |

**New open question — UX-OQ-33:** offer an **"adjusted exam"** mode (longer look time and grace, recorded on the attempt and shown in history) for learners who need it? Pending `pd3-exam-expert`'s answer on PD3 special arrangements (*særlige prøvevilkår*). Owner: `pd3-exam-expert`, then the owner.

### Changes since 2.1 (for reconciling `src/features/mock-exam/machine/`)

1. **C9 one-minute deadline** fires regardless of `timersVisible` (previously conditional).
2. **`LIMIT_REACHED` and `PART1_HANDOVER`** emit `announce` (and show their notices) regardless of `timersVisible`.
3. **Announcement queue during `unit.answering`:** every `announce` except "your turn" (on entry), the handover notice and the grace notice is queued and flushed after `DONE` / `GRACE_EXPIRED`; queued messages that are no longer true (e.g. one-minute after the limit) are dropped. Affects `recordingCapped`, `notRecording`, `oneMinuteLeft`, `rerecording`, `paused`/`resumed` if raised mid-answer.
4. **`announce` params:** Danish params are passed as content references (rendered as `<span lang="da">`), never interpolated into strings.
5. **New invariants I21–I22 and scenarios T47–T51.**
6. No change to states, events, transitions, timers or persistence.

## UX decisions (`UXD-xx`)

Decisions this work makes within the PRD's scope. Each can be revisited after the walkthrough or learner testing.

| ID | Decision | Why | Stories |
|---|---|---|---|
| **UXD-01** | Phone navigation: five bottom tabs (Home · Topics · Mock exam · Templates and phrases · Guide); My progress, Settings, About and Privacy in the header menu; Home surfaces progress. Top nav with all six sections from 768 px. | Guide supports G1 and pre-exam anxiety; Home already carries actionable progress | US-057 #3 |
| **UXD-02** | Focused mode (no tabs, one exit, primary action in the thumb zone) for the mock runner, answer aloud and shadowing | Fewer distractions and mis-taps during timed or recording tasks | US-031, US-039 |
| **UXD-03** | URL scheme: locale prefix, English slugs, verbatim content IDs, sections as fragments, no URL per mock state | Stable shareable links; a reload can't resume an attempt anyway | US-011 #5, US-066, US-038 #4 |
| **UXD-04** | Sample answers collapsed by default on the topic page, right after "Answer aloud" | R7: answer before reading the model | US-015, US-019 |
| **UXD-05** | Exam conditions show elapsed time "m:ss of about 4:30" and the answer timer, visible by default, hideable together with one remembered toggle; nothing counts down or changes colour | Learners need to learn what 4½ minutes feels like; hiding gives realism and satisfies 2.2.2 (answers OQ-19, to validate) | US-031 #2, OQ-19 |
| **UXD-06** | Draw → reveal → preload → explicit **Start** tap → intro line | No timer before everything is loaded; the Start tap unlocks iOS audio; the learner controls the moment | US-027 #4–#7 |
| **UXD-07** | Both situation cards stay visible (compact) through the interview, the chosen one marked | Like the sheet that stays on the exam table | US-029, US-030 |
| **UXD-08** | One persistent primary-action slot ("Listen…" aria-disabled ↔ "I've finished my answer") | Stable focus for keyboard and screen-reader users; no layout jumps | GA-4, US-060 |
| **UXD-09** | Limit rules: a started unit finishes (intro + q1, transition + q2); grace counts answering time only; no *"Tak."* after the limit | Natural examiner behaviour; fair grace | US-035 #2 |
| **UXD-10** | "Continue" after an interruption replays from the interrupted clip to the end of the unit; a cut answer keeps both recording parts; an interrupted look restarts at 10 s | Matches "continue replays the current question"; nothing recorded is lost | US-038 #2 |
| **UXD-11** | "Start again" after an interruption = same topic, new attempt; the interrupted one isn't saved | Learner explicitly chose to redo | US-038 #2 |
| **UXD-12** | Reaching the 3-minute recording cap stops recording but not the answer; the learner still taps Done | "Never cut off" | US-031 #5–#6 |
| **UXD-13** | *(Revised in rev. 2: practice keeps it open once opened and the setting is practice-only; exam conditions resets per unit.)* "Show text" resets per examiner unit by default; an "always show the examiner's text" preference for learners who need it | Keeps listening practice by default without burdening deaf or hard-of-hearing learners (1.2.1) | US-030 #5 |
| **UXD-14** | *(Revised in rev. 2: text shown by default; separate "Next question".)* Answer aloud is a focused panel over the topic page (no route); question text hidden by default with "show text"; Repeat available; "Next question" walks the topic in order | Consistent with the mock; quick loop through a topic | US-019 |
| **UXD-15** | Practice situation: "examiner chooses" by default; "let me choose after the look" as a set-up option | Same flow as exam by default; choice without an extra step every time | US-030 #1 |
| **UXD-16** | Get ready is one screen with two checks (sound, microphone) and one adaptive primary action | Fewer steps before the exam | US-027 |
| **UXD-17** | Spaced review starts on the first day a topic is practised (answer aloud Done or a saved mock, with or without microphone); a banner on the topic page says what completes a due review | Opening a page by accident shouldn't start a schedule (now US-047 #1) | US-047 |
| **UXD-18** | Situation titles: Danish always; Persian on request (study, practice); hidden in exam conditions | D-18 with US-011 #2 and US-029 #4–#5 | US-011, US-029 |
| **UXD-19** | Personal examples carry one uniform app label ("an example from a nurse's perspective"), not the booklet's three variant labels | D-20 consistency | US-018 |
| **UXD-20** | Per-question "a similar question: …" links and a topic-level "related topics" list, our wording only | D-21, US-007 #5 | US-007 |
| **UXD-21** | Review: "keep on this device" card at the top; self-check after each part | Learner sees the deletion rule before leaving; checks while the answer is fresh | US-042, US-045 |
| **UXD-22** | Term labels shown as Danish proper names ("Maj–Juni 2024 · B"), Latin digits | How SIRI and the booklet name terms; recognisable (UX-OQ-09) | US-005, US-053 #3 |
| **UXD-23** | Relative dates ("today", "in 4 days") for recency and due dates; absolute dates only in history | Calm, and avoids the calendar question in most places (UX-OQ-08) | US-010, US-047 |
| **UXD-24** | Key-word pairs (and every Danish–Persian pair) stacked on two lines, never one line | Prevents bidi reordering | US-014 #2 |
| **UXD-25** | Guide tab goes to `/fa/guide/delproeve-2` in v1; `/fa/guide` is the oral-exam overview and becomes the tab target when delprøve 1 ships | One fewer tap now; no URL changes later | US-001 #7 |
| **UXD-26** | At most one dismissible first-time note per screen; never blocking | No forced onboarding (Sara) with light guidance (Ahmad) | US-057 |
| **UXD-27** | The pre-2023 label's explanation is a disclosure, not a tooltip | Works on touch, keyboard and screen readers | US-009 |
| **UXD-28** | *(Superseded in rev. 2, R-11: a neutral new line with text and meaning.)* Sound-check sample: reuse `examiner.transition` (proposal) | No new content; previews a line learners must recognise (UX-OQ-10) | US-027 #1 |
| **UXD-29** | The instruction (US-069) and sound-check clips load at get ready, not with the attempt | They play before the draw (UX-OQ-11) | US-069 #4 |
| **UXD-30** | Before **Start**, Leave needs no confirmation; after it, the leave dialog applies | Nothing to lose before the attempt exists | US-039 |
| **UXD-31** | Live-region announcements wait until examiner audio has stopped; nothing announced on Done | A screen reader must never talk over the examiner | US-060 #4 |

## Open questions (`UX-OQ-xx`)

Gaps, contradictions or choices that need someone else. Each has a recommendation.

| ID | Question | Recommendation | Owner |
|---|---|---|---|
| **UX-OQ-01** | US-038 #5 says browser back ends a running mock attempt. An accidental iOS edge swipe or Android back would throw away a nearly finished attempt. | Back opens the leave dialog (same as Leave); a second back confirms. Needs PM agreement and an ADR check for iOS reliability. | product-manager, software-architect |
| **UX-OQ-02** | US-039's leave dialog offers only leave/continue. A learner who must stop after 3 of 4 answers loses their recordings. | Add a secondary "End and review what I have" in the leave dialog (saved as ended early / interrupted). | product-manager |
| **UX-OQ-03** | OQ-19: is the overall clock visible by default in exam conditions? | Visible as elapsed "of about 4:30", hideable (UXD-05). Validate in the five usability sessions. | owner, learner testing |
| **UX-OQ-04** | Sample answers collapsed by default (UXD-04) vs US-015 #1 "I see its model answer". Ahmad (listening-first) may find the extra tap annoying. | Keep collapsed; consider a US-055 preference "show sample answers open". Validate with Ahmad-type learners. | product-manager, learner testing |
| **UX-OQ-05** | US-047 #1: "first study" = first day recorded as practised. A listen-only learner (or shadowing only) never starts a review cycle. | Accept for v1 (answer aloud works without a microphone). If interviews show many listen-only learners, add an explicit "I studied this today" action. | owner |
| **UX-OQ-06** | D-18 says the intro plays "with its text"; US-030 #5 says the text is hidden by default with "show text". | Treat "with its text" as "text available": hidden by default in the mock, shown on the study page. Confirm. | product-manager |
| **UX-OQ-07** | *(Closed by D-22 / US-047 rev. 3.1.)* Meaning of "day 1". | Day 1 = first study day; reviews D+2, D+6, D+13. | – |
| **UX-OQ-08** | Calendar for absolute dates in history: Intl's `fa` locale defaults to the Solar Hijri calendar; Afghan Dari uses different month names; exam dates are Gregorian. | Use relative dates wherever possible (UXD-23). For absolute dates, decide with interviews; consider Gregorian with Persian month names, or both. One formatter config either way. | owner, persian-localization-reviewer |
| **UX-OQ-09** | Term labels: Danish ("Maj–Juni 2024 · B", Latin digits) or Persian («مه–ژوئن ۲۰۲۴»)? D-2 says Persian digits in the interface. | Danish proper name, isolated, Latin digits (UXD-22): it matches SIRI, the booklet and what learners will search for. Add to the interview's digits question. | owner, persian-localization-reviewer |
| **UX-OQ-10** | No content exists for the sound-check sample (US-027 #1). | Reuse `examiner.transition` (UXD-28), or have `content-engineer` add a short app-authored line reviewed by `danish-language-reviewer`. | content-engineer, owner |
| **UX-OQ-11** | US-069 #4 says the instruction loads with the attempt's audio, which loads after the draw, but the instruction plays before the draw. | Load it with the sound check (UXD-29); update US-069 #4. | product-manager |
| **UX-OQ-12** | The limit rules in the state machine §10 (a started unit finishes; grace counts answering time only; repeat suspends grace; no *"Tak."* after the limit) refine US-035 #2. | Confirm with `pd3-exam-expert` that this matches examiner practice closely enough. | pd3-exam-expert |
| **UX-OQ-13** | GA-14 says booklet text is shown exactly. The personal examples' booklet labels («مثال شخصی», «به‌عنوان پرستار», «مثال شخصی خودت») would be replaced by our uniform label. | Treat labels as booklet metadata, not learning text; show our label only (UXD-19). Confirm. | product-manager, owner |
| **UX-OQ-14** | The 🔁/🔗 references live only in `content/internal/margin-notes.json`, which the repository must never read (schema §13). | `content-engineer` publishes a public, structured link file (topic/section → topic/section, no note text), validated in CI. | content-engineer, software-architect |
| **UX-OQ-15** | Shadowing needs sentence boundaries and per-sentence audio timings. | `speech-engineer` derives them from TTS word timings; `content-engineer` stores sentence ranges per answer. Items without them don't show the shadow link. | speech-engineer, content-engineer |
| **UX-OQ-16** | Emoji: theme icons (themes.json), key-word emoji, toolbox reason emoji. Old Android phones may render newer emoji as boxes. | `ui-designer` decides: emoji vs a consistent icon set for themes; key-word emoji decorative (recall hooks from the booklet) if they render reliably. | ui-designer |
| **UX-OQ-17** | The V2 word-order table and template 2's grammar tip (booklet lines 271, 290–296) have no story. | Include as a collapsed "grammar in brief" on the template pages, attributed. Cheap; helps correctness. | product-manager |
| **UX-OQ-18** | Exam-conditions draw is uniformly random over terms; the same term can come up twice in a row. | Keep uniform (realistic); optionally avoid the immediately previous term when history exists. | product-manager |
| **UX-OQ-19** | OQ-14: the sample-answer label wording. | «یک پاسخ نمونهٔ ساده و روشن» as proposed; agree with the author. Affects `topic.sample.title`. | owner |
| **UX-OQ-20** | OQ-17: how a "differs from SIRI" question is shown. | Booklet text as the main text, with a Disclosure "SIRI's wording differs slightly" showing SIRI's version. The QuestionBlock reserves this slot. | content-engineer, owner |
| **UX-OQ-21** | D-9: the "report a problem" channel. | Needed before M3 for the link target and copy. | owner |
| **UX-OQ-22** | History labels for a practice attempt ended from a hold. PRD §6.4 lists "Interrupted" only for exam conditions. | Label "Practice" with the neutral fact "ended before the last question". | product-manager |
| **UX-OQ-23** | The "always show the examiner's text" preference (UXD-13) is new. | Accept: it's an accessibility accommodation, not a hint. Its use is still recorded neutrally per question. | product-manager, accessibility-auditor |
| **UX-OQ-24** | Practice "draw from a theme" for themes with fewer than three published topics (two themes have 2). | Show as many cards as topics (two cards); with one topic, skip the draw. | product-manager |
| **UX-OQ-25** | The toolbox's first personal sentence (*"Jeg er selv sygeplejerske, og …"*) is nurse-specific, like the personal examples. | Same label as personal examples, or a group note; owner's call (D-20 covers examples only). | owner |
| **UX-OQ-26** | A microphone level meter in get ready ("say «hej» and watch the bar move") isn't in any story. | Worth it for H3 (no technical surprises); cheap once recording exists. Optional for M2. | product-manager, speech-engineer |
| **UX-OQ-27** | Tabs include Guide but not Progress (UXD-01); first-visit primary is the guide. | Validate in the walkthrough, especially with Sara (who may want the mock first). | learner-persona, owner |
| **UX-OQ-28** | US-048 #1 shows "my self-check ticks" in history; a "5/7" would read as a score (GA-10). | Show ticked items as short words ("reason · example · opinion"), never a fraction. | product-manager |
| **UX-OQ-29** | Answer-aloud hides the question text by default (UXD-14). B1 learners may need it. | Keep hidden with "show text", remembered per device; validate with Ahmad-type learners. | learner testing |

## Story updates for the PM

- **US-038 #5:** back opens the leave dialog (closing any open sheet or dialog first); fallback "save as ended early + notice"; behind the ADR-0007 flag until the OQ-9 spike (RD-2).
- **US-038 #6:** a microphone mute or end **while answering** is an interruption; "continue without recording" only if the microphone can't be re-opened (RD-3).
- **US-038 (new criterion):** the Screen Wake Lock is held during the mock, answer aloud and shadowing; unsupported → a one-time tip (RD-1).
- **US-039 #2–#3, #5:** the leave dialog offers Continue · End and see my answers · Leave without saving; "End and see my answers" saves the attempt as "ended early" (RD-7).
- **US-036:** the pause overlay also offers "End and see my answers"; the answer timer pauses while hints are open; "record again" only while recording (R-14).
- **US-032:** a visible action label; practice offers "hear it slower" from the second repeat (R-13).
- **US-035 #2 and US-034:** the second required question is always asked; part-1 cut-off at 2:30 (C17 = 150 s) and a part-1 handover at 3:20 (C21 = 200 s) with the notice "You can finish your sentence. Then the examiner will ask the next question." and 20 s grace; grace ceiling 330 s (C22). New config rows C17, C21, C22 in `user-stories.md:92` and PRD §6.3–§6.4 (RD-6, RD-13, RD-15).
- **US-012 #5, US-017, US-068 #6 and PRD §6.5:** label situation intros and suggested follow-ups "SIRI's suggested wording"; add the PRD §6.5 row "A real examiner may word the intro and follow-ups differently; practise understanding, not memorising"; US-001 #4 gains that guide line (RD-14).
- **US-032 and US-036 #2:** the slower repeat is a labelled practice aid; the hints sheet notes "no notes in delprøve 2" (RD-16, RD-17).
- **US-026 #3 / US-037 (rev. 2.2):** the exam-conditions rules say answers end at the limit after a short notice; **US-060 #4:** the one-minute, handover and grace announcements don't depend on the timer setting, and in-answer announcements wait until after Done; **US-027:** headphones tip for screen-reader users (RD-19, RD-20).
- **PRD §6.5 (review suggestion 2, not a UX change):** list the visible clock and the one-minute announcement as deliberate differences.
- **US-037 #5 and PRD §6.4 (history labels):** add "ended early" for both modes.
- **US-048 #1:** history shows mode, total time and an optional "focus next time", **not** self-check ticks (UX-OQ-28).
- **US-042:** add the optional "focus next time" choice at the end of the review (R-18). **Question:** add a language-quality self-check item for learners aiming for a 10 (R-38)?
- **US-046 #1 / US-047 #1:** shadowing a whole answer counts as practised (UX-OQ-05).
- **US-019:** the question text is shown by default in answer aloud (UX-OQ-29); the compare step can't be skipped by a second press (RD-4).
- **US-027 #1:** the sound check asks about volume and plays a neutral line with its text and meaning (R-11).
- **US-009 #1 and #3:** label wording "older format (before Maj–Juni 2023)" with the Danish term label; the explanation adds "in the mock this topic runs in today's format" (R-17).
- **US-002 milestone:** the three examiner lines and the repeat phrase get audio in the guide at **M2** (with the mock), not M3 (R-20).
- **US-057 #1 / US-058:** Home leads with what the app is; SIRI spelled out (R-19). Home's returning state starts on any stored progress (R-06).
- **US-069 #4:** the instruction loads with the sound check, not with the attempt (UX-OQ-11).
- **US-041 #3:** "translations … on request" should say "translations of the questions" (D-19).
- **US-053 / config:** dates are Gregorian with Persian month names and digits; term labels stay Danish with Latin digits (RD-10).

## Ready for `ui-designer`

Everything in this folder is ready, with these notes:
- **Ready now:** information architecture and navigation; the component inventory (including the new EraDivider, ListInfoButton, TermJumpList, WakeLockTip, TipLine, FocusNextTimePicker and the revised dialogs); all 18 screen specs; the icon-mirroring table; the content-role list (inventory §10).
- **Design with placeholders:** the sound-check line (UX-OQ-10), the sample-answer label (UX-OQ-19), the "differs from SIRI" disclosure (UX-OQ-20) and the report link (UX-OQ-21).
- **`ui-designer` decides:** emoji vs an icon set for themes and key words (UX-OQ-16); alignment of short Danish labels inside Persian rows; how calm "not recording", grace and interruption states look.
- **Behaviour still pending the OQ-9 spike** (design both variants where they differ visibly): the back guard vs the "ended early" fallback notice (C19), and the wake-lock tip.

## Traceability (story → where it's specified)

| Story | Flows | Screens |
|---|---|---|
| US-001 | first-visit | exam-guide |
| US-002, US-003, US-004 | templates-and-phrases (links) | exam-guide (sub-pages) |
| US-005, US-006, US-008 | browse-and-find-topic | topic-library |
| US-007 | browse-and-find-topic | similar-questions, topic-study |
| US-009 | browse-and-find-topic | topic-library, topic-study, mock-draw-and-look |
| US-010 | spaced-review | topic-library, topic-study |
| US-011 to US-018, US-020, US-068 | study-topic | topic-study |
| US-019 | study-topic, recording-consent-and-microphone | answer-aloud |
| US-021 | templates-and-phrases | templates |
| US-022, US-023 | templates-and-phrases | toolbox-and-vocabulary |
| US-024, US-025 | shadowing | shadowing |
| US-026 | mock-exam-practice, mock-exam-exam-conditions | mock-start |
| US-027 | mock-exam-state-machine, recording-consent-and-microphone | mock-get-ready, mock-draw-and-look |
| US-028, US-029 | mock-exam-state-machine | mock-draw-and-look |
| US-030 to US-035 | mock-exam-state-machine | mock-interview |
| US-036, US-040, US-070 | mock-exam-practice, mock-exam-state-machine | mock-get-ready, mock-interview |
| US-037 | mock-exam-exam-conditions, mock-exam-state-machine | mock-interview |
| US-038, US-039 | mock-exam-state-machine, errors-and-recovery | mock-interview, system-pages |
| US-069 | mock-exam-practice | mock-get-ready |
| US-041 to US-045 | mock-review | mock-review |
| US-046, US-048 | progress-and-data | progress, home |
| US-047 | spaced-review | home, progress, topic-study |
| US-049 | progress-and-data | settings |
| US-050 | errors-and-recovery, progress-and-data | all (state tables) |
| US-051 to US-053, US-056 | README conventions, information-architecture | all (RTL sections) |
| US-054, US-055 | – | settings |
| US-057 | first-visit | home |
| US-058, US-059 | first-visit | about-and-privacy, topic-study (credit) |
| US-060 | all | all (accessibility sections), component-inventory |
| US-061, US-062 | errors-and-recovery | all (state tables) |
| US-063 | recording-consent-and-microphone | mock-get-ready, answer-aloud, shadowing |
| US-064 | information-architecture §2.2 | topic-library, similar-questions (only published content appears) |
| US-065, US-066 | study-topic | topic-study, templates |
| US-067 | all | home, progress, review (no pressure tactics) |

## Next steps

1. ~~`learner-persona` walkthrough~~ — done 2026-11-19 and applied in revision 2.
2. **`ui-designer`** reads this folder for tokens, components and visual screen specs (see "Ready for `ui-designer`").
2a. **`qa-engineer` / `software-architect`:** add Telegram's in-app browser to the test matrix (microphone, separate storage, wake lock, back) and to the OQ-9 spike, together with an incoming-call banner while answering (R-03, R-21).
3. **`software-architect`** reconciles the state-machine ADR with [mock-exam-state-machine.md](flows/mock-exam-state-machine.md) (§16 invariants and §17 scenarios are the acceptance tests).
4. **`product-manager`** takes the open questions marked for them, and the small story updates above.

**Recommended walkthrough order for `learner-persona`:**
1. **Ahmad, 375 px, first visit → guide → a practice mock without a microphone,** including the draw, the look, a repeat request and the end/review. Tests orientation, anxiety, listening-first needs and the no-microphone path.
2. **Maryam, 375 px, exam conditions** on `2024-maj-b`, with a phone call at about 2:30 and the limit reached mid-answer. Tests interruption, grace and "interrupted, not failed".
3. **Sara, 1280 px, keyboard only:** browse by term → topic page (verification labels, pre-2023 label) → answer aloud → review history. Tests trust signals, efficiency and keyboard paths.
