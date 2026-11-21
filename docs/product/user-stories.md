# User stories: PD3 Mundtlig v1

| | |
|---|---|
| **Status** | Draft, revision 3.2, for owner review |
| **Date** | 2026-11-18 (revisions 3 to 3.2: 2026-11-19) |
| **Author** | `product-manager` agent |
| **Read with** | [prd.md](prd.md), [personas.md](personas.md), [exam-accuracy review](../reviews/2026-11-18-pd3-exam-review-prd.md), [UX README](../ux/README.md), [ADRs](../adr/README.md) |

**Revision 3.3 (2026-11-19/20):** all decisions confirmed by owner delegation.
- **Changed:** US-015 (sample-answer label), US-018 (uniform label), US-022 (nurse sentence label), US-038 #2 ("start again"), US-065 (`mailto:`) and US-068 #4 (differs display).
- All "by delegation, owner to confirm" markers now read "confirmed by owner delegation, 2026-11-19".
- **Totals unchanged:** 45 Must, 20 Should, 6 Could.

**Revision 3.2 (2026-11-19):** applies the UX story updates and UX decisions RD-1 to RD-12 ([docs/ux/README.md](../ux/README.md)), the ADR decisions, and PM answers to UX-OQ-17, 18, 24, 26 and R-38. The UX and PM decisions were made by delegation and then **confirmed by owner delegation, 2026-11-19** (D-24, D-25).
- **New story:** US-071 (Could), a microphone level check.
- **Changed (27):** US-002, 009, 019, 021, 027, 028, 032, 034, 035, 036, 037, 038, 039, 040, 041, 042, 046, 047, 048, 053, 056, 057, 058, 059, 060, 061 and 069, plus config rows C17 to C20 and the calendar and term-label rows.
- **Milestone change:** US-002 moves from M3 to M2.
- **Totals:** 45 Must, 20 Should, 6 Could (71 stories).

**Revision 3.1 (2026-11-19):** applies D-18 to D-23, which were decided by delegation after the content pilot (owner to confirm).
- **Changed:** US-007, US-011, US-017, US-018, US-029, US-047, US-064 and US-068, plus GA-14 and the review-steps config row.
- **No new, withdrawn or reprioritised stories.**

**Revision 3 (2026-11-19):** applies the `pd3-exam-expert` review and owner decisions D-15, D-16 and D-17 (taken on 2026-11-18).
- **New stories:**
  - US-068 (Must): a verification record for every question
  - US-069 (Could): an optional delprøve 2 instruction
  - US-070 (Could): an optional pacing aid in practice mode
- **No story was withdrawn or renumbered.**
- **Changed stories (26):** US-001, US-002, US-004, US-007, US-009, US-011, US-012, US-017, US-022, US-027, US-028, US-029, US-030, US-031, US-032, US-033, US-034, US-035, US-036, US-037, US-041, US-042, US-052, US-058, US-062 and US-064.
- **Also changed:** global criteria GA-10 and GA-14, and the exam config table.
- **Retitled:** US-007, US-012, US-017, US-028 and US-030.
- **Totals:** 45 Must, 20 Should, 5 Could (70 stories).

**Revision 2 (2026-11-18):**
- Applied D-1 to D-4 and D-6 to D-8.
- Aligned the criteria with the Markdown content source.

## How to read this

- **IDs are permanent.** Other docs cite them (`US-0xx`). Never renumber or reuse an ID. Add new stories at the end. A story that is dropped is marked **Withdrawn**, with the date and reason, and keeps its ID.
- **Priority (MoSCoW):**
  - **Must:** v1 can't ship without it.
  - **Should:** planned for v1, but can move to v1.1 without breaking the product.
  - **Could:** only if it's cheap.
  - **Won't (this time):** listed in [PRD §5.2](prd.md#52-not-now-reassess-after-v1).
- **For:** the personas a story mainly serves (M = Maryam, A = Ahmad, S = Sara; see [personas.md](personas.md)).
- **Exam:** `§x.y` refers to a section of [ABOUT_PD3_MUNDTLIG.md](../resources/ABOUT_PD3_MUNDTLIG.md). "Review Qn, Bn, Sn" refers to the exam-accuracy review. "booklet:N" is line N of the content source. Where an exam fact drives behaviour, the criterion cites it.
- **Milestone:** where the story lands in the release plan ([PRD §12](prd.md#12-release-plan-capability-milestones-no-dates)).
- **Config:** timings and thresholds live in one exam config. Criteria use the proposed defaults below, and QA tests against whatever the config says.
- **"Booklet"** means the source booklet by Shery Rahimi, read from its Markdown extraction.
- **"Published"** means content with review status `approved` that is included in the build (US-064). In v1 the published set comes from the 51 main topics (2016–2024). The appendix (18 topics from 2013–2015, plus a title-only list for 2004–2012) is excluded (D-3).

### Global acceptance criteria (apply to every story)

| ID | Criterion |
|---|---|
| **GA-1** | All interface text comes from the `fa` messages, including accessible names, `alt`, `title`, page titles and error messages. No English appears in the interface. |
| **GA-2** | Pages have `lang="fa"` and `dir="rtl"`. Danish text has `lang="da"` and `dir="ltr"`. Danish inside a Persian sentence is isolated so its order and punctuation stay intact (US-052). |
| **GA-3** | Works from 320 px wide upwards with no horizontal scrolling. Checked in RTL at 375 px and 1280 px. |
| **GA-4** | Fully keyboard-operable. Focus is always visible and never hidden behind sticky bars. Touch targets are at least 44 × 44 px. A quick double tap never triggers an action twice. |
| **GA-5** | Every control has an accessible name. Important status changes are announced politely and sparingly. |
| **GA-6** | `prefers-reduced-motion` is respected. No animation is essential. |
| **GA-7** | Usable at 200% text zoom and with text-spacing overrides. |
| **GA-8** | Colour is never the only way to convey meaning. Contrast meets WCAG 2.2 AA in light and dark themes. |
| **GA-9** | Errors are calm Persian messages that offer a next step (retry, go back). No raw error text, no blank screens. |
| **GA-10** | Nowhere does the app show a grade, score, percentage, pass/fail or predicted grade. Nor does it claim that a topic or question is likely to come up. Nothing implies the app is official ([PRD §6.7](prd.md#67-what-the-app-may-and-may-not-say)). |
| **GA-11** | Audio plays only after a user action (or inside a mock exam that was started with one). Only one clip plays at a time. The text of every clip is available. |
| **GA-12** | Numbers and dates are formatted through the single locale and digit-style config (US-053). |
| **GA-13** | No user audio ever leaves the device. There are no third-party trackers. |
| **GA-14** | Booklet and SIRI text is shown exactly as in the approved content; how corrections are shown is decided in OQ-17. No booklet margin note text appears in v1 (US-064, D-21). Wording is called "official" only where its verification record says it matches SIRI (US-068). |

### Exam config: proposed defaults

| Key | Proposed default | Source |
|---|---|---|
| Look time before questions | 10 s | §1, §3.4 |
| Overall limit, exam conditions | 270 s (about 4½ min), counted from the start of the situation intro | §3.4; review Q1 |
| Grace period after the limit | 20 s. An answer in progress ends at the next "done" or when this runs out, whichever comes first. | Review suggestion 4; DL-049 |
| Answer-length guide (shown as a reference, never enforced) | 45–60 s | Booklet study method |
| Practice pacing aid (US-070, Could) | Off and collapsed by default. About 2 min for the first question with its follow-up, about 2½ min for the general question with its follow-up. | Booklet estimate; review Q1 |
| Maximum recording per answer | 180 s | Proposal (protects device memory) |
| "Taking longer than usual" notice for audio loading | 15 s | Proposal |
| Review steps | Day 3, 7 and 14, where day 1 is the day the topic is first studied (offsets +2, +6 and +13 days) | Booklet's intervals, applied per topic instead of per chapter (D-22, DL-042) |
| Digit style | Persian ۰–۹ | D-2 (decided) |
| Intro line (every topic) | *"Her er der to billeder, som viser nogle situationer, der handler om emnet [emne]. Du har nu 10 sekunder til at overveje emnet, og derefter vil jeg stille dig spørgsmål til én af situationerne."* | SIRI's wording, May–June 2024 examiner booklet (review Q3) |
| Transition line | *"Nu vil jeg stille dig et spørgsmål af en mere overordnet karakter."* | The app's wording, based on SIRI's instruction (review Q2; DL-050) |
| Line between answers | *"Tak."* | App convention. The Huskeliste asks examiners to say *"tak"* rather than *"fint"* (review suggestion 1). |
| Closing line | *"Tak, så er prøven forbi."* | SIRI's wording (§3.4; 2024 examiner booklet) |
| Repeat request shown on the repeat control | *"Undskyld, vil du godt gentage spørgsmålet?"* | Review Q5; DL-051 |
| **C17** Part-1 cut-off, exam conditions | **150 s** (2:30). After it, no new part-1 follow-up starts, so the second required question is always asked. | RD-6; validated by `pd3-exam-expert` on 2026-11-20 and set by delegation, 2026-11-20 (DL-073) |
| **C21** Part-1 handover, exam conditions only | **200 s** (3:20). If a part-1 answer is still running, a calm notice says "finish your sentence; then the examiner asks the next question", and the grace period (20 s) applies. Then come *"Tak."*, the transition and the second required question. | Exam review 2026-11-20 S1; by delegation, 2026-11-20 (DL-073) |
| Grace-extension ceiling, exam conditions | **330 s** absolute. Repeats during grace can't push the end of the exam past this. | Exam review suggestion 1; by delegation, 2026-11-20 (DL-073) |
| Spoken form of *"Hvorfor?/Hvorfor ikke?"* (and the older *"Hvorfor / hvorfor ikke?"*) | **Audio:** the question part, a pause of about 0.6–1 s, then *"Hvorfor eller hvorfor ikke?"* (an app `spoken` override, no comma before *eller*). **Display:** SIRI's text, verbatim. | Exam review 2026-11-20 Q5, S2; by delegation, 2026-11-20 (DL-073) |
| **C18** Microphone mute that counts as an interruption | Over 1,000 ms while answering | RD-3; ADR-0007 §3 |
| **C19** Browser back during an attempt | `leaveDialog` once the OQ-9 spike confirms the guard works; otherwise `endEarly` (the ADR-0007 flag) | RD-2 |
| **C20** Slower replay on repeat (practice only) | 0.75×, from the second repeat of the same question | R-13 |
| Calendar for absolute dates | Gregorian, with Persian month names and Persian digits, for example «۲ دسامبر ۲۰۲۶». Relative dates ("today", "in 4 days") wherever possible. | RD-10; UXD-23 |
| Exam term labels | Danish with Latin digits, for example "Maj–Juni 2024 · B" | RD-10; UXD-22 |

---

## Summary

| ID | Story | Priority | Milestone |
|---|---|---|---|
| **Exam guide** | | | |
| US-001 | Understand how delprøve 2 works | Must | M1 |
| US-002 | Hear the examiner's standard phrases | Should | M2 *(moved from M3 in rev. 3.2)* |
| US-003 | Learn the four follow-up question types | Should | M3 |
| US-004 | Learn the study method | Should | M3 |
| **Topic library** | | | |
| US-005 | Browse topics by theme | Must | M1 |
| US-006 | Browse topics by exam term | Should | M3 |
| US-007 | Find similar questions from several past exams *(retitled in rev. 3)* | Should | M3 |
| US-008 | Search topics in Danish or Persian | Should | M3 |
| US-009 | Recognise topics from before the 2023 format change | Must | M1 |
| US-010 | See my practice status in the library | Should | M3 |
| **Topic study page** | | | |
| US-011 | See a topic laid out the way the exam asks it | Must | M1 |
| US-012 | Hear and read the examiner's intro and question | Must | M1 |
| US-013 | Reveal the Persian translation when I need it | Must | M1 |
| US-014 | Learn the three key words for a question | Must | M1 |
| US-015 | Listen to the model answer at my speed | Must | M1 |
| US-016 | Follow the model answer word by word | Should | M3 |
| US-017 | Study the suggested follow-up question and its answer *(retitled in rev. 3)* | Must | M1 |
| US-018 | Use the personal example as a starting point | Should | M3 |
| US-019 | Answer a question aloud and compare with the model | Must (D-7) | M2 |
| US-020 | See which template a model answer uses | Could | M3 |
| US-068 | See which wording is verified against SIRI *(new in rev. 3)* | Must | M1 (gate at M4) |
| **Templates and phrases** | | | |
| US-021 | Learn the three answer templates | Must | M1 |
| US-022 | Use the toolbox | Should | M3 |
| US-023 | Browse key words and phrases with audio | Should | M3 |
| **Shadowing** | | | |
| US-024 | Shadow a model answer sentence by sentence | Should (D-7) | M3 |
| US-025 | Shadow template and toolbox phrases | Could | M3 |
| **Mock exam** | | | |
| US-026 | Choose between practice and exam conditions | Must | M2 |
| US-027 | Get ready: sound check, microphone and loading | Must | M2 |
| US-028 | Draw a topic from three unmarked cards | Must | M2 |
| US-029 | Look at the topic for about 10 seconds | Must | M2 |
| US-030 | Hear the situation intro and the first required question | Must | M2 |
| US-031 | Answer while the app times and records me | Must | M2 |
| US-032 | Ask the examiner to repeat the question | Must | M2 |
| US-033 | Answer the follow-up question | Must | M2 |
| US-034 | Hear the transition and the second required question | Must | M2 |
| US-035 | Hear the exam end with "Tak, så er prøven forbi." | Must | M2 |
| US-036 | Practise with pauses and hints (practice mode) | Must | M2 |
| US-037 | Take the exam under real conditions (exam conditions) | Must (D-1) | M2 |
| US-038 | Recover from an interruption | Must | M2 |
| US-039 | Leave the mock exam at any time | Must | M2 |
| US-040 | Choose the topic or theme for a practice mock | Should | M3 |
| US-069 | Hear the delprøve 2 instruction before the draw *(new in rev. 3)* | Could | M3 |
| US-070 | See an approximate time split in practice mode *(new in rev. 3)* | Could | M3 |
| US-071 | Check that my microphone picks up my voice *(new in rev. 3.2)* | Could | M2 (optional) |
| **After the mock exam** | | | |
| US-041 | Listen to my answers next to the model answers | Must | M2 |
| US-042 | Check my answers with a self-check list | Must | M2 |
| US-043 | See how long each answer was | Should | M3 |
| US-044 | Know what happens to my recordings | Must | M2 |
| US-045 | Keep my latest attempt on this device | Should (D-6) | M3 |
| **Progress** | | | |
| US-046 | Keep my progress on this device | Must | M2 |
| US-047 | See what is ready to review today | Should | M3 |
| US-048 | See my mock exam history | Should | M3 |
| US-049 | Delete my progress and recordings | Must | M2 |
| US-050 | Use the app when storage is unavailable or cleared | Must | M2 |
| **Settings and i18n** | | | |
| US-051 | Use the app in Persian, right to left | Must | M1 |
| US-052 | Read Danish correctly inside the Persian interface | Must | M1 |
| US-053 | See numbers in one consistent digit style | Must | M1 |
| US-054 | Follow my device's light or dark setting | Should | M3 |
| US-055 | Set my default speed and translation display | Could | M3 |
| US-056 | Add an interface language without code changes | Must | M1 |
| **Cross-cutting** | | | |
| US-057 | Know where to start | Must | M1 |
| US-058 | Know who made the content and that the app is unofficial | Must | M1 |
| US-059 | Understand what the app stores and sends | Must | M1 (final at M4) |
| US-060 | Use the app with assistive technology and a keyboard | Must | M1 |
| US-061 | Use the app on a phone with a slow connection | Must | M1 |
| US-062 | Handle audio that fails, is slow or is blocked | Must | M1 |
| US-063 | Handle microphone permission and failures | Must | M2 |
| US-064 | Publish only reviewed content from public exam terms | Must | M1 (gate at M4) |
| US-065 | Report a problem with content | Should | M3 |
| US-066 | Share a link to a topic | Should | M3 |
| US-067 | Study without pressure tactics | Must | M1 |

**Totals:** 45 Must, 20 Should, 6 Could (71 stories).

---

## Exam guide

### US-001 · Understand how delprøve 2 works
**Must** · For: M, A, S · Exam: §1, §3.2–§3.4, §4.1–§4.3, §6 · M1

As a learner preparing for PD3, I want a short explanation in Persian of how delprøve 2 runs, so that I know exactly what will happen and feel less anxious on the day.

1. **Given** I open the exam guide, **then** I see the delprøve 2 steps in this order (§3.4):
   1. Draw topic A, B or C.
   2. About 10 seconds to look at a sheet showing two situations.
   3. The examiner introduces one situation in one or two sentences, then asks the first required question. It is concrete and often starts *"Hvorfor tror du, …?"*.
   4. Follow-up questions.
   5. The examiner announces a more general question (listen for *overordnet* or *generelt*), then asks the second required question, usually about advantages and disadvantages.
   6. More follow-ups.
   7. *"Tak, så er prøven forbi."*
2. **Given** I view the guide, **then** I see a timeline: about 10 s to look, then about 4½ min of questions. All durations are shown as approximate, and no official split of the 4½ minutes is implied (§1, §3.4; review Q1). The timeline reads in the interface direction (it starts on the right in RTL) because it is a sequence of steps, not an audio progress bar.
3. **Then** the guide says plainly that candidates no longer describe the pictures, and that this task was removed in 2023 (§3.4, §6).
4. **Then** the guide explains what the examiner does and doesn't do, and what to expect:
   - repeats a question you didn't understand, with roughly the same words, before any rephrasing (§3.4; Huskeliste)
   - if you can't answer a required question, makes sure that's clear before moving on (§3.4). The guide links the rescue sentence *"Det har jeg ikke tænkt så meget over før, men jeg tror, at …"* (US-022).
   - asks harder follow-ups even when you're struggling, which is normal and not a bad sign (§3.4)
   - says *"tak"* rather than *"fint"*, so you can't read anything into it (§4.1)
   - doesn't correct or translate what you say (§4.1)
   - doesn't ask knowledge questions (§4.1)
   - accepts pauses (§4.1)
   - there are no notes in delprøve 2 (SIRI practical guide §4.3.5, per review suggestion 5)
5. **Then** the guide says in plain Persian what is assessed (§4.1; BEK bilag 1, pkt. 3.40):
   - understanding spoken Danish
   - answering questions that invite clarification, elaboration, justification and taking a position
   - expressing yourself **coherently**, in fairly nuanced language that fits the situation, with fairly high complexity and correctness
6. **Then** the guide states these facts:
   - there is one oral grade, on the 7-point scale, and it counts double
   - PD3 is passed with an average of at least 2.0 (§4.2, §4.3)
   - this app does not and cannot give a grade
7. **Then** the guide places delprøve 2 within the 15-minute oral, after delprøve 1 (§3.2), and says the app doesn't cover delprøve 1 yet.
   - **Given** the guide states any facts about delprøve 1, **then** they are limited to these (§3.3; review suggestion 9):
     - the topic is set by the teacher and approved by the head of school; the learner doesn't choose it
     - it is handed out 5 weekdays before the oral period. A term-specific date (24 Nov 2026 for winter 2026) appears only with its "last checked" date.
     - a presentation of about 2 minutes, "hverken kortere eller længere", then about 2½ minutes of questions
     - one A4 page of notes, for the presentation only, and no script
8. **Then** I see a "last checked" date and a link to SIRI's official candidate page (§9). The link's accessible name says that it opens an external site.

### US-002 · Hear the examiner's standard phrases
**Should** · For: A, M · Exam: §3.4, §7 · **M2** (moved from M3 in rev. 3.2, so the guide's audio ships with the mock; R-20)

As a learner who finds spoken Danish hard to follow, I want to hear the phrases the examiner always uses, so that I recognise them instantly on the day.

1. **Given** I open the phrases section of the guide, **then** I see these examiner lines, each with examiner-voice audio, Danish text and a Persian meaning:
   - SIRI's intro line, *"Her er der to billeder …"*
   - the announcement of the general question, *"Nu vil jeg stille dig et spørgsmål af en mere overordnet karakter."*, with a tip to listen for *overordnet* or *generelt* (review Q2)
   - SIRI's closing line, *"Tak, så er prøven forbi."*
2. **Then** I also see these candidate phrases, with model-voice audio, marked as suggestions rather than required wording (§7):
   - asking for a repeat: *"Undskyld, vil du godt gentage spørgsmålet?"*. The booklet's *"Undskyld, vil du gentage spørgsmålet?"* is shown as an equally correct variant (review Q5).
   - gaining time: *"Det er et godt spørgsmål. Lad mig lige tænke."*
3. **Then** the examiner lines use the same voice as the mock exam.
4. **Then** each line is labelled by source (review S3):
   - the intro and closing lines: "SIRI's wording (May–June 2024 examiner booklet)"
   - the transition: "the app's wording, based on SIRI's instruction to the examiner" (D-8)
   - the candidate phrases: suggestions
5. **Then** Danish exam terms used in the guide (for example *delprøve*, *eksaminator*, *censor*) have a Persian gloss and audio (R-20).

### US-003 · Learn the four follow-up question types
**Should** · For: S, M · Exam: §3.3, §4.1 · M3

As a learner, I want to know the four kinds of follow-up question, so that I'm not thrown when the examiner pushes for more.

1. **Given** I open this section, **then** I see the four types: *opklarende*, *uddybende*, *forklaring og begrundelse*, and *stillingtagen og argumentation*. Each has a Persian explanation and the official example wording from the examiner booklet (§3.3).
2. **Then** a note says that delprøve 2 is assessed on answering the same kinds of question (§4.1).
3. **Then** each type links to the template or toolbox phrases that help answer it. For example, *"Mener du, at …? Hvorfor?"* links to template 3, for follow-up questions (US-021).

### US-004 · Learn the study method
**Should** · For: M, A · Source: booklet guide · Decision: D-15 (decided 2026-11-18) · M3

As a learner with little time, I want a simple study method, so that I know how to use each topic and the app.

1. **Given** I open "how to study" (from the guide or home), **then** I see the booklet's method in steps, as written in the booklet and credited to its author:
   1. First learn the three answer templates.
   2. For each question, remember only the 3 key words, then rebuild the answer with the template.
   3. Say it aloud and record yourself: about 45–60 seconds per required answer.
   4. Review each chapter on day 1, 3, 7 and 14.
2. **Then** each step links to the feature that does it: templates (US-021), key words (US-014), answer aloud (US-019), ready to review (US-047, once built).
3. **Then** the method is presented as a suggestion. No step is enforced.
4. **Then** the booklet's fifth step (booklet:54, "read the recurring questions first; they are more likely to come up again") is **not shown** (D-15). In its place, the app's own sentence links to the similar-questions page (US-007), without any likelihood claim.
5. **Then** the booklet's estimated split of the 4½ minutes (booklet:225–235) may appear here verbatim, attributed to the booklet. It carries a note that SIRI's examiner booklet gives only "about 4½ minutes" in total (review Q1).

---

## Topic library

### US-005 · Browse topics by theme
**Must** · For: M, A, S · M1

As a learner, I want to browse past topics by theme, so that I can study the areas that matter to me.

1. **Given** I open the topic library, **then** I see the themes with their Persian names and the number of published topics in each. The counts come from the content and are never hard-coded.
2. **When** I open a theme, **then** I see its topics. Each shows:
   - the Danish topic name (LTR)
   - the Persian name
   - the exam term and letter (for example Nov–Dec 2016, Emne C)
   - the pre-2023 label where it applies (US-009)
3. **Then** topics are listed newest term first.
4. **Given** I have selected a theme, **then** the URL reflects it, and a reload or the back button returns me to the same view.
5. **Given** a theme has no published topics, **then** it doesn't appear.
6. **Given** I open the library, **then** no audio is downloaded.

### US-006 · Browse topics by exam term
**Should** · For: S · M3

As a learner who knows which term a topic came from, I want to browse by exam term, so that I can find it quickly and see the three topics of one exam together.

1. **Given** I choose to browse by term, **then** I see the terms newest first, each listing its topics with their letters A, B and C.
2. **Given** a term has fewer than three published topics, **then** only those topics show, with no error and no empty slot.
3. **Then** the selected term is reflected in the URL.

### US-007 · Find similar questions from several past exams
**Should** · For: M, A · Exam: §5, §6 · Decision: D-15 (decided 2026-11-18) · M3

As a learner with limited time, I want to see which similar questions came up in more than one published exam, so that I can prepare one set of ideas that covers several topics.

1. **Given** I open the "similar questions" page, **then** I see the rows of the booklet's table (29 rows, booklet:4887–4926). Each links to the exact topic and part (situation A, situation B or the general question) where a similar question appeared.
2. **Then** the heading and explanation are the app's own wording (D-15; review S4, Q7):
   - **They say:** a similar question came up in more than one published exam between 2016 and 2024, and studying these is efficient because one set of ideas covers several topics.
   - **They don't say or imply:** that these questions are more likely to come up, or that one answer should be memorised for all of them.
   - The booklet's introduction to the table (booklet:4885) isn't shown.
3. **Then** a short note explains (§5, §6; SIRI practical guide §2.7):
   - since winter 2024, SIRI has reused confidential tasks from a closed bank that nobody outside knows
   - the app's questions come from published exams up to May–June 2024, which SIRI says may be used in teaching
4. **Given** a row links to topics that aren't published, such as the appendix (2013–2015, D-3), **then** those links don't appear, and the row still shows its published links. Every row has at least one main topic.
5. **Given** a topic page whose question has a similar or related question in another topic, **then** the page links to it in the app's own neutral wording, for example "a similar question: May–June 2023 · C".
   - These links are structured data taken from the recurring table and the booklet's 🔁 and 🔗 notes.
   - The notes' own text is never shown (D-21, confirmed by owner delegation, 2026-11-19; US-064).

### US-008 · Search topics in Danish or Persian
**Should** · For: S, A · M3

As a learner who remembers a word from a topic, I want to search in Danish or Persian, so that I can find it without browsing.

1. **Given** I type a Danish word, **then** the results include topics whose name, questions or key words contain it, ignoring case. For example, "sundhed" finds topics that mention "sundhedssektoren".
2. **Given** I type Persian, **then** matching ignores:
   - Arabic versus Persian ي/ی and ك/ک
   - ZWNJ versus a space
   - diacritics

   For example, "كار" typed with the Arabic kāf finds "کار".
3. **Given** there are no results, **then** I see a friendly message and a link to browse by theme.
4. **Then** the search field has an accessible label, and the number of results is announced politely once I stop typing.
5. **Then** text in the field displays in the right direction for its script: Persian right to left, Danish left to right.

### US-009 · Recognise topics from before the 2023 format change
**Must** · For: S, M · Exam: §3.4, §6 · Decision: D-3 (decided 2026-11-18) · M1

As a learner, I want to know when a topic comes from the old exam format, so that I'm not confused about what today's exam asks.

1. **Given** a topic from May–June 2016 to Nov–Dec 2022 (42 of the 51 main topics), **then** it carries the pre-2023 label in the library, on its study page and on the mock exam reveal screen.
   - **Wording** (R-17): "older format (before Maj–Juni 2023)", with the term as a Danish label in Latin digits (US-053). `ux-architect` and `persian-localization-reviewer` set the final copy.
   - **In lists** the label is plain text, not a control. Its explanation sits at list level (an info button or an era divider), on the topic page and on the reveal (RD-5).
2. **Given** a topic from May–June 2023 or later, **then** it carries no such label.
3. **When** I open the label's explanation, **then** I read four things (review suggestion 8):
   - at that time the exam began with a short picture description
   - after the description came the same two required questions with follow-ups that the exam has today
   - the picture description no longer exists (§6)
   - so the questions are still good practice for today's exam
   - in the mock exam, this topic runs in today's format (R-17)
4. **Then** the app never presents a picture-description task anywhere (§3.4).
5. **Then** the label uses text, optionally with an icon, and never colour alone.
6. **Then** labelled topics appear everywhere unlabelled ones do: in the library, search and the mock exam draw (US-028). The appendix topics (2013–2015) don't appear anywhere in v1 (US-064).

### US-010 · See my practice status in the library
**Should** · For: M, A · M3

As a returning learner, I want to see which topics I've already practised, so that I can choose what to do next.

1. **Given** I have practised a topic (US-046), **then** its library entry shows that it has been practised, how many times and the last date.
2. **Given** a topic is due for review (US-047), **then** its entry shows "ready to review".
3. **Given** storage is unavailable, **then** no status is shown and nothing breaks (US-050).

---

## Topic study page

### US-011 · See a topic laid out the way the exam asks it
**Must** · For: M, A, S · Exam: §3.4 · Decision: D-16 (decided 2026-11-18) · M1

As a learner, I want each topic organised like the exam, so that studying it feels like rehearsing the real thing.

1. **Given** I open a topic, **then** I see a header with its Danish name, Persian name, term and letter, and theme.
2. **Then** I see three sections in this order:
   1. **Situation A:**
      - its short description from the booklet (Danish, with the Persian on request)
      - its examiner intro, with audio and a source label (US-012)
      - its first required question
   2. **Situation B:** the same
   3. **The general (second required) question**
3. **Then** a short Persian note explains that in the exam the examiner picks one of the two situations, introduces it, and later asks the general question (§3.4, steps 3–5).
4. **Then** I can jump to any of the three sections, and the current section is clear both visually and to assistive technology.
5. **Then** the URL contains the stable topic ID (for example `2016-nov-c`).
6. **Given** a topic ID that doesn't exist or isn't published, **then** I see a Persian "not found" page with a link to the library.
7. **Then** I see the source credit and page reference (US-058).
8. **Then** no booklet margin note text appears in v1 (D-21; US-064). Links to similar or related questions use the app's own neutral wording (US-007).

### US-012 · Hear and read the examiner's intro and question
**Must** · For: M, A, S · Exam: §3.4 · Decisions: D-16, D-17 (decided 2026-11-18) · M1

As a learner, I want to hear each situation's intro and each question in the examiner's voice and read them in Danish, so that I train my ear for the real exam.

1. **Given** a required or follow-up question, **then** its Danish text appears exactly as in the approved content, marked as Danish (`lang="da"`, LTR). It is described as "the question as given in the booklet (from SIRI's examiner booklets)", or as official wording only where its verification record matches SIRI (US-068).
2. **When** I tap play, **then** the examiner voice reads it. The examiner voice is different from the model-answer voice.
3. **Given** another clip is playing, **when** I play this one, **then** the other one stops.
4. **Given** the audio is still loading or fails to load, **then** the text stays readable and the player shows a loading state or a retry option (US-062).
5. **Given** a situation, **then** its examiner intro (one or two sentences, D-16) plays in the examiner voice, and its text is shown with a source label:
   - "SIRI's wording" for May–June 2024, and for 2023 where SIRI's booklet was found
   - "the app's wording" otherwise

### US-013 · Reveal the Persian translation when I need it
**Must** · For: A, M · Exam: §4.1 (listening is assessed) · M1

As a learner, I want the Persian translation hidden until I ask for it, so that I try to understand the Danish first but never get stuck.

1. **Given** I open a topic, **then** every Persian translation is hidden behind a "show translation" control (for example «نمایش ترجمه»).
2. **When** I use the control, **then** the translation appears next to its question without moving my scroll position away from it, and the control exposes its expanded or collapsed state to assistive technology.
3. **Then** the translation is marked `lang="fa"` and displays right to left.
4. **When** I use the control again, **then** the translation is hidden.

### US-014 · Learn the three key words for a question
**Must** · For: M, A, S · Source: booklet method · M1

As a learner, I want the three key words for each question with their Persian meaning, so that I can rebuild my answer from them.

1. **Given** a question with key words, **then** I see exactly three Danish–Persian pairs, as in the content.
2. **Then** each Danish word is `lang="da"` and LTR, and each Persian word is `lang="fa"` and RTL. A pair never reorders visually or swaps its punctuation. Check this with a screenshot at 375 px and with a screen reader.
3. **Then** a short Persian tip explains the method: use these three words to rebuild your answer with a template. The tip links to US-021.

### US-015 · Listen to the model answer at my speed
**Must** · For: M, A, S · M1

As a learner, I want to hear and read the model answer, slower if I need it, so that I learn how a clear answer sounds.

1. **Given** a question, **then** I see its model answer in Danish, exactly as in the approved content. It is labelled «یک پاسخ نمونهٔ ساده و روشن» ("a simple, clear sample answer"; D-28, OQ-14 closed), never as "the best" answer and never with a grade.
2. **When** I tap play, **then** the model-answer voice reads it, and I can pause, resume and seek.
3. **Then** I can choose 0.75×, 1× or 1.25×. The pitch stays natural. My choice applies to every clip and is remembered on this device when storage is available.
4. **Then** the audio progress bar and the play icon are not mirrored in RTL.
5. **Given** the clip fails to load, **then** I see a retry option and the text remains (US-062).

### US-016 · Follow the model answer word by word
**Should** · For: A, M · M3

As a learner who links sounds to written words, I want the current word highlighted while the answer plays, so that I can follow along.

1. **Given** a model answer is playing, **then** the word being spoken is highlighted, in step with the audio at every speed.
2. **When** I pause, **then** the highlight stays on the current word. **When** playback ends, **then** the highlight clears.
3. **Given** `prefers-reduced-motion`, **then** the highlight moves without animation or automatic smooth scrolling.
4. **Then** the highlight doesn't rely on colour alone (for example, it also underlines the word), and screen readers don't announce it word by word.

### US-017 · Study the suggested follow-up question and its answer
**Must** · For: M, A, S · Exam: §3.3, §3.4 · Decisions: D-17 (2026-11-18); D-19 (confirmed by owner delegation, 2026-11-19) · M1

As a learner, I want the suggested follow-up and a short answer for each required question, so that I'm ready for the next question too.

1. **Given** a required question, **then** I see its suggested follow-up question as given in the booklet, with examiner-voice audio, and its short answer, with model-voice audio.
   - **The follow-up question** has a Persian translation on request (US-013).
   - **The short answer, like the model answer, has no Persian translation in v1** (D-19). The booklet has none. No "show translation" control appears for answers.
   - Translations of answers are on the "later, possibly with the author" list (PRD §5.2).
2. **Then** the follow-up is labelled "suggested follow-up" (*forslag til opfølgende spørgsmål*), never "official follow-up" (US-068).
3. **Then** a Persian note says that real examiners ask follow-ups as they judge necessary, and may ask others depending on what you say (§3.3, §3.4).
4. **Given** a question has no follow-up in the content, **then** the follow-up block doesn't appear.

### US-018 · Use the personal example as a starting point
**Should** · For: M, A · Decision: D-20 (confirmed by owner delegation, 2026-11-19) · M3

As a learner, I want to see the booklet's personal example with a tip on adapting it, so that I can build an example from my own life.

1. **Given** the booklet gives a personal example for a question (7 in all, all nurse-specific), **then** it appears to every learner, with its audio. It is labelled in Persian as an example from a nurse's perspective. This is the app's own uniform label; the booklet's three label variants are treated as metadata and not shown (D-28, UX-OQ-13).
2. **Then** a short Persian prompt asks me to make my own example from my own work or life.
3. **Given** there is no example, **then** nothing is shown.

### US-019 · Answer a question aloud and compare with the model
**Must** · For: M, A, S · Exam: §4.1 · Source: booklet method · Decision: D-7 (decided 2026-11-18) · M2

As a learner, I want to answer a question out loud with a timer, then hear my answer next to the model answer, so that I practise speaking and not just reading.

1. **Given** I'm on a question, **when** I tap "answer aloud", **then** the question plays in the examiner voice. When it ends, recording starts (after microphone permission, US-063), and the recording state is visible and announced.
2. **While** I answer, **then** the question's Danish text is **shown by default**, with a control to hide it (UX-OQ-29). The model answer, translation and key words are hidden. A "hint" control reveals the three key words. Using it isn't judged.
3. **While** I answer, **then** a timer shows the elapsed time, with the booklet's 45–60 second guide as a neutral reference, not a limit.
4. **When** I tap "done" or reach the maximum recording length, **then** recording stops, and I can play my recording and the model answer, one at a time.
   - Focus moves to "Play your answer".
   - "Next question" is a separate control: "done" never turns into "Next question", so a second press can't skip the compare step (RD-4).
5. **When** I record again, **then** the new take replaces the previous one.
6. **Given** the microphone is denied or missing, **then** I can still do the exercise: I answer aloud without recording, tap "done", and see the model answer.
7. **When** I finish, with or without a recording, **then** the topic counts as practised (US-046).
8. **When** I leave the page, **then** my recording is discarded, as the app has told me it will be (US-044). It is never uploaded. Answer-aloud recordings are session-only; the opt-in to keep a recording applies only to mock exam attempts (D-6, US-045).

### US-020 · See which template a model answer uses
**Could** · For: S · M3

As a learner, I want to see which template a model answer is built on, so that I can connect answers to templates.

1. **Given** any model answer, **then** a link to its template appears next to it. The template follows from the question's role, as the booklet's markers show (OQ-8, closed):
   - first required question → template 1
   - second required question → template 2
   - follow-up question → template 3

*Note:* with OQ-8 closed, this is now cheap to build. It stays Could, but is a good candidate to pull into M1.

---

## Templates and phrases

### US-021 · Learn the three answer templates
**Must** · For: M, A, S · Exam: §3.3, §3.4, §4.1 · M1

As a learner, I want the booklet's three answer templates as clear cards with audio, so that I have a structure ready for any question.

1. **Given** I open templates, **then** I see the booklet's three templates ("golden skeletons"), in the booklet's order:
   1. for *"Hvorfor tror du, …?"* questions: reasons
   2. for *"Hvilke fordele og ulemper …?"* questions: both sides and an opinion
   3. for answering follow-up questions, including *"Mener du, at …?"* (taking a position)
2. **Then** each template shows its parts as in the booklet:
   - **Templates 1 and 2:** the steps in order, with their Danish phrases (for example *"Det kan der være flere grunde til. For det første … For det andet … Desuden … Så alt i alt …"*), the Persian meaning of each step, and the booklet's example
   - **Template 3:** each follow-up question form, with its Danish answer starter and Persian meaning
3. **Then** each Danish phrase has model-voice audio that plays when I tap it.
4. **Then** each template says which exam question it fits:
   - template 1: the first required question, often *"Hvorfor tror du …?"* (§3.4)
   - template 2: the second required question, usually *"Hvilke fordele og ulemper …?"* (§3.4)
   - template 3: follow-ups, such as *"Mener du, at …? Hvorfor?/Hvorfor ikke?"* (§3.3)
5. **When** I turn on "test myself", **then** the Danish phrases are hidden, and I can reveal them one step at a time.
6. **Then** the template pages include a collapsed "grammar in brief" section with the booklet's word-order (V2) table and template 2's grammar tip (booklet:271, 290–296), attributed to the booklet (UX-OQ-17; D-25, confirmed by owner delegation, 2026-11-19).

### US-022 · Use the toolbox
**Should** · For: M, A · M3

As a learner, I want the booklet's all-purpose reasons, personal sentences and rescue sentences with audio, so that I always have something to say.

1. **Given** I open the toolbox, **then** I see three groups: the 10 all-purpose reasons, the personal sentences and the rescue sentences. Each item is in Danish, with a Persian meaning and audio. The nurse-specific personal sentence (*"Jeg er selv sygeplejerske, og …"*) carries the same label as the personal examples (US-018; D-28, UX-OQ-25).
2. **Then** the rescue sentences group explains when to use them, including:
   - asking for a repeat when you didn't understand (§3.4)
   - keeping going when you can't answer, for example with *"Det har jeg ikke tænkt så meget over før, men jeg tror, at …"* (linked from the guide, US-001)
3. **Then** the booklet's *"Undskyld, vil du gentage spørgsmålet?"* is shown as written. A note says that the mock exam's repeat button uses the equally correct *"Undskyld, vil du godt gentage spørgsmålet?"* (OQ-20, closed).

### US-023 · Browse key words and phrases with audio
**Should** · For: A · M3

As a learner who learns by listening, I want the booklet's golden words and phrases with audio, so that I can learn them anywhere.

1. **Given** I open phrases, **then** I see the booklet's golden words and phrases, grouped as in the booklet, each in Danish with a Persian meaning and audio.
2. **Then** only one phrase plays at a time, and opening the list doesn't load the audio for the whole list.

---

## Shadowing

### US-024 · Shadow a model answer sentence by sentence
**Should** · For: A, M · Exam: §3.3 (pronunciation and intonation support what you say) · Decision: D-7 (decided 2026-11-18) · M3

As a learner, I want to hear one sentence, say it myself and compare the two, so that my pronunciation and rhythm get closer to natural Danish.

1. **Given** a model answer, **when** I start shadowing, **then** the answer is split into its sentences and I see "sentence 1 of N".
2. **When** I play a sentence, **then** only that sentence plays, at my chosen speed.
3. **When** I record myself, **then** I can play my take and the original, one after the other.
4. **Then** I can move to the next or previous sentence. The arrows mirror in RTL.
5. **Given** the microphone is unavailable, **then** I can still listen and repeat aloud without recording.
6. **When** I leave, **then** my takes are discarded (US-044).

### US-025 · Shadow template and toolbox phrases
**Could** · For: A · M3

As a learner, I want to shadow the template and toolbox phrases too, so that the phrases I'll use most come out fluently.

1. **Given** a template or toolbox phrase, **when** I choose "shadow", **then** the US-024 flow runs for that phrase.

---

## Mock exam

The sequence below follows §3.4 and SIRI's May–June 2024 examiner booklet, as cited in the review. It is summarised, with the deliberate differences, in [PRD §6.3–§6.5](prd.md#63-the-mock-exam-the-real-exam-and-the-app-step-by-step).

```
choose mode → get ready (sound, microphone, loading) → [optional instruction, US-069]
→ draw one of three unmarked cards → SIRI's intro line → ~10 s look
→ situation intro → first required question → answer → "Tak."
→ suggested follow-up → answer → "Tak."
→ transition (the app's line) → second required question → answer → "Tak."
→ suggested follow-up → answer → "Tak, så er prøven forbi." → review and self-check
```

### US-026 · Choose between practice and exam conditions
**Must** · For: M, A, S · Exam: §3.4 · WCAG 2.2.1 · Decision: D-1 (decided 2026-11-18) · M2

As a learner, I want to choose between a relaxed practice run and a run under exam conditions, and know the rules before I start, so that I can build confidence first and test myself later.

1. **Given** I open the mock exam, **then** I see two modes explained in Persian before I start ([PRD §6.4](prd.md#64-two-modes-one-sequence)):
   - **Practice:** pause, hints, choose a topic, no time limit.
   - **Exam conditions:** random topic, a continuous clock of about 4½ minutes, no pause, no hints (§3.4).
2. **Then** practice is listed first.
3. **Then** exam conditions says up front that it can't be paused, and offers practice as an alternative.
4. **Then** I see what I'll need: about 5–6 minutes, a quiet place, sound on, and a microphone if I want to hear myself back.
5. **Then** I see that the app gives no grade and that I'll check myself afterwards (US-042).

*Revision 2:* the former criterion 6 (only practice appears if D-1 drops exam conditions) is withdrawn, because D-1 keeps both modes in v1.

### US-027 · Get ready: sound check, microphone and loading
**Must** · For: M, A, S · Decision: D-16 (decided 2026-11-18) · M2

As a learner, I want the app to check my sound and microphone and load everything before the clock starts, so that nothing technical spoils the attempt.

1. **Given** I start a mock exam, **then** the sound check asks me to set my volume and plays a short, neutral examiner line, with its Danish text and Persian meaning. I confirm that I hear it before I continue (R-11). The line's content is UX-OQ-10; it is not the transition line.
   - Get ready is one screen with two checks, sound and microphone, and one primary action (R-12).
   - The "always show the examiner's text" preference lives in settings and applies to practice only (RD-9).
2. **Then**, before the browser asks for permission, I'm told in Persian why the app uses the microphone: so I can hear myself afterwards, and the audio never leaves the device. The browser prompt appears only after I tap (US-063).
3. **Given** I deny the microphone or don't have one, **then** I can continue without recording. The exam runs the same way, and the review shows the model answers and the self-check.
4. **Given** the topic has been drawn, **then** all the audio for the attempt is loaded before the 10-second look starts:
   - the intro line
   - the chosen situation's **intro**, question and follow-up
   - the transition line
   - the second question and its follow-up
   - *"Tak."*
   - the closing line
5. **Given** loading takes longer than the configured time (proposed: 15 s), **then** I see a Persian message with "retry" and "leave". No timer has started.
6. **Given** loading fails, **then** I get the same choices, and the attempt never starts with missing audio.
7. **Then** the tap that starts the exam is the user gesture that lets later examiner audio play on iOS Safari without further taps (US-062).
   - The order is: draw → reveal → load → an explicit **Start** tap → the intro line (UXD-06).
8. **Then** while the attempt runs, the screen is kept awake (US-038 #8).

### US-028 · Draw a topic from three unmarked cards
**Must** · For: M, A, S · Exam: §3.4 · Decision: D-3 (decided 2026-11-18) · M2

As a learner, I want to draw a topic the way I will at the exam, so that the surprise feels familiar.

1. **Given** I'm in exam conditions, **then** I see three identical face-down cards with no letters, numbers or other marks. SIRI's practical guide §4.3.5 says the real slips carry no marks on the side the candidate sees (review suggestion 2). I can't see or choose topics by name.
2. **When** I tap a card, **then** it reveals its **letter** and topic: the Danish name, Persian name, term and letter, and the pre-2023 label if it applies (US-009).
3. **Then** the three cards hold the published A, B and C topics of one real exam term, chosen at random from the 17 main terms, in random order. Every main term has a complete set (OQ-7, closed). The revealed letter is the topic's real letter.
4. **Then** terms from 2016–2022 can be drawn, with their topics labelled (D-3). Appendix topics (2013–2015) are never drawn.
5. **Given** a term has fewer than three published topics (for example while review is still in progress), **then** that term isn't used for the draw. **Given** no term is complete, **then** the cards hold three different published topics, and each reveal shows that topic's real term and letter.
6. **Given** I tap a card twice quickly, **then** only one draw happens.
7. **Then** the cards are buttons with accessible names that don't reveal anything ("card 1 of 3", "card 2 of 3", "card 3 of 3"), and they work with a keyboard.
8. **Given** practice mode, **then** I can draw the same way or choose a topic (US-040).
9. **Given** my history shows the term I drew last time, **then** the draw doesn't pick that same term again straight away. Otherwise it stays uniformly random (UX-OQ-18; D-25, confirmed by owner delegation, 2026-11-19).

*Note:* the draw uses an injected random source so tests can use a seed (CLAUDE.md rule 9).

### US-029 · Look at the topic for about 10 seconds
**Must** · For: M, A, S · Exam: §1, §3.4 · Decision: D-4 (decided 2026-11-18) · M2

As a learner, I want the same short look at the topic as in the exam, so that I learn to orient myself fast.

1. **Given** the topic has been revealed, **then** I see its name and two text cards, A and B. Each has the theme's icon and **the booklet's own situation title** in Danish, for example *"job med høj status og god løn"*. The same rule applies to all 51 topics.
   - SIRI's picture captions aren't used, even for 2024 (D-18, confirmed by owner delegation, 2026-11-19).
   - There are no photos or illustrations (D-4).
   - The examiner's situation intro comes later, as audio with its text, once a situation is chosen (US-030).
2. **Then** the examiner voice says SIRI's scripted intro line, verbatim, with the topic's name: *"Her er der to billeder, som viser nogle situationer, der handler om emnet [emne]. Du har nu 10 sekunder til at overveje emnet, og derefter vil jeg stille dig spørgsmål til én af situationerne."* (May–June 2024 examiner booklet; OQ-5, closed). It is used for every topic, including pre-2023 ones. The 2019 picture-description script is never used.
3. **When** the intro line ends, **then** a 10-second countdown runs (§1, §3.4).
4. **Given** exam conditions, **then** I can't pause, skip or extend the countdown, and no translations are shown.
5. **Given** practice mode, **then** I can pause, add time or skip ahead, and see the Persian translations of the situation descriptions on request.
6. **Then** the countdown is announced to assistive technology only when it starts and when it ends, not every second. With `prefers-reduced-motion` it isn't animated.
7. **Then** the theme icon is decorative. It has no accessible name of its own, and the card's text carries the meaning.
8. **Then**, during the intro line and the countdown, a one-line Persian note says that the real exam shows two pictures instead of these cards. Draft: «در آزمون واقعی، به‌جای این کارت‌ها دو عکس می‌بینید.» `ux-architect` and `persian-localization-reviewer` set the final copy (review Q3).

### US-030 · Hear the situation intro and the first required question
**Must** · For: M, A, S · Exam: §3.4 · WCAG 1.2.1 · Decisions: D-16, D-17 (decided 2026-11-18) · M2

As a learner, I want the examiner to introduce one situation and ask the first required question, so that I practise understanding both by ear, as in the exam.

1. **When** the 10 seconds end, **then** the app chooses situation A or B at random and shows which one it is. In practice mode I may choose it myself.
2. **Then** the examiner voice plays that situation's **intro**, one or two sentences (D-16; review B2). It is:
   - SIRI's *"Forslag til indledning"*, verbatim, for May–June 2024, and for 2023 where SIRI's booklet was found
   - otherwise, the app's own sentence, written from the booklet's description of the situation
3. **Then** the examiner voice asks the first required question as given in the booklet (§3.4, step 3). Neither the intro nor the question is called "official" unless its record says it matches SIRI (US-068).
4. **Given** exam conditions, **then** the overall clock starts when the situation intro starts (review Q1).
5. **Then** the text is hidden by default, and a "show text" control is always available. It shows the intro and the question. In exam conditions, using it is noted in the review without judgement.
6. **Given** practice mode, **then** I can also open the Persian translation, the three key words and a link to the matching template.
7. **When** the question audio ends, **then** the answer phase starts (US-031).
8. **Given** the browser blocks the audio, **then** a "tap to hear" button appears, and the answer phase doesn't start until both the intro and the question have played (US-062).

### US-031 · Answer while the app times and records me
**Must** · For: M, A, S · Exam: §3.4, §4.1 · M2

As a learner, I want to answer with the clock running and my voice recorded, so that I practise under pressure and can listen back.

1. **When** the examiner finishes a question, **then** recording starts automatically if the microphone is available. This is shown with an icon and text, and announced once.
2. **Then** I see the time for this answer. In exam conditions I also see the overall time out of about 4½ minutes (whether it's visible by default is OQ-19).
3. **When** I tap "done", **then** recording stops, and the examiner voice says *"Tak."* and asks the next question. *"Tak."* between answers is an app convention, not a SIRI rule (review suggestion 1).
4. **Then** the examiner voice never says *"fint"*, *"godt"* or anything evaluative, and never corrects me (§4.1).
5. **Then** the app never cuts me off in the middle of an answer. In exam conditions, the overall limit ends the exam only after a grace period (US-035). The real examiner accepts pauses and avoids interrupting (§4.1).
6. **Given** I reach the maximum recording length (proposed: 180 s), **then** recording for this answer stops with a calm message, and the exam continues.
7. **Given** I tap "done" twice quickly, **then** the exam moves on only once.
8. **While** the examiner voice is speaking, **then** nothing is recorded, so the recording contains only my voice.

### US-032 · Ask the examiner to repeat the question
**Must** · For: A, M · Exam: §3.4, §7 · M2

As a learner who didn't catch the question, I want to ask for a repeat the way I would in the exam, so that I practise the phrase and can still answer.

1. **Given** I'm answering any question, required or follow-up, **then** a repeat control is available. It shows *"Undskyld, vil du godt gentage spørgsmålet?"* with its Persian meaning, inviting me to say it aloud (OQ-20, closed). The toolbox shows the booklet's variant (US-022).
   - The control also has a visible action label that says what it does, not only the Danish phrase (R-13).
   - **In practice mode,** from the second repeat of the same question, I can choose to hear it slower (C20, 0.75×). Exam conditions always replays at normal speed.
2. **When** I use it, **then** recording pauses, the same question audio plays again, and recording resumes afterwards. This matches the Huskeliste: the examiner repeats with roughly the same words before any rephrasing (review Q5).
3. **Given** the first required question, **then** I can also choose to hear the situation intro again.
4. **Given** exam conditions, **then** the overall clock keeps running during the repeat.
5. **Then** the review shows how many times I asked for a repeat, as a neutral fact.

### US-033 · Answer the follow-up question
**Must** · For: M, A, S · Exam: §3.4 · Decision: D-17 (decided 2026-11-18) · M2

As a learner, I want a follow-up after my first answer, so that I practise going deeper, as the examiner will ask me to.

1. **When** I finish my answer to the first required question, **then** the examiner asks the booklet's suggested follow-up for that situation (§3.4, step 4).
2. **Then** answering and repeats work as in US-031 and US-032.
3. **Given** the content has no follow-up for that question, **then** the exam moves straight on to the transition (US-034) without an error.

### US-034 · Hear the transition and the second required question
**Must** · For: M, A, S · Exam: §3.4 · Decisions: D-8, D-17 (decided 2026-11-18) · M2

As a learner, I want the examiner to announce the general question and then ask it, so that I get used to the switch from concrete to broad.

1. **When** I finish the first follow-up, **then** the examiner voice says the transition line, *"Nu vil jeg stille dig et spørgsmål af en mere overordnet karakter."*
   - **Source:** this is the app's own sentence (D-8; DL-050). It is based on SIRI's instruction that the examiner announces *"et spørgsmål af en mere overordnet karakter"*; SIRI has no scripted line (review Q2, S2).
   - **Review:** `danish-language-reviewer` confirms that it sounds natural, and the TTS stress.
2. **Then** it asks the topic's second required question as given in the booklet (§3.4, step 5).
3. **When** I finish answering it, **then** the examiner asks its suggested follow-up (§3.4, step 6).
4. **Then** I can see that I'm now on the second of two parts.
5. **Given** exam conditions, **then** the second required question is **always asked**, however long part 1 took (RD-6):
   - When the clock passes the part-1 cut-off (C17, **150 s**), no new part-1 follow-up starts. An answer in progress finishes, then the transition and the second required question follow.
   - **Handover (C21, 200 s):** if a part-1 answer is still running at 200 s, a calm notice says "finish your sentence; then the examiner asks the next question". The grace period (20 s) applies, then come *"Tak."*, the transition and the second required question. This leaves time for a real answer to the second question.
   - If the overall limit (US-035) is reached before the second required question has been asked, it is still asked, and I answer it within the grace period.
   - These values were validated by `pd3-exam-expert` (2026-11-20) and set by delegation, 2026-11-20 (DL-073). They are app heuristics, since SIRI gives no split; tune them in usability sessions.

### US-035 · Hear the exam end with "Tak, så er prøven forbi."
**Must** · For: M, A, S · Exam: §3.4, §4.1, §4.2 · M2

As a learner, I want the exam to end exactly as the real one does, so that the ending feels familiar and final.

1. **When** I finish my last answer, **then** recording stops and the examiner says SIRI's closing line, *"Tak, så er prøven forbi."* (§3.4).
2. **Given** exam conditions, **when** the overall clock reaches the limit (proposed: 270 s, about 4½ minutes, from the situation intro; §3.4), **then** no new question starts, **except** the second required question if it hasn't been asked yet (US-034 #5). What happens next depends on where I am (review suggestion 4; DL-049; UXD-09):
   - **I'm answering:** the exam ends at my next "done" or when the grace period ends (proposed: 20 s), whichever comes first. The grace period counts answering time only.
   - **An examiner unit is playing** (intro and question, or transition and question): it finishes, and I get the grace period to answer.
   - **Between questions:** the closing line plays at once.
   - After the limit, the examiner voice doesn't say *"Tak."* before the closing line.
   - **Ceiling:** repeats during the grace period can't push the end of the exam past **330 s** in total. At 330 s the closing line plays (DL-073).
   - The 270 s limit and the 20 s grace period, counting answering time only, were validated by `pd3-exam-expert` (2026-11-20; DL-049).
   - A notice tells me calmly that time is up and that I can finish my sentence (R-09).
3. **Then** recording stops before the closing line plays, and a partial answer is kept.
4. **Then** the microphone is released, and the browser's microphone indicator turns off.
5. **Then** I see a calm end screen that leads to the review (US-041). There is no grade, score or pass/fail anywhere (§4.1, §4.2).
6. **Then** the attempt is saved to progress (US-046) as completed, as interrupted if US-038 applied, or as ended early (US-039).
7. **Given** I finished before the limit, **then** the review shows the total time, with a neutral note that in a real exam the examiner fills about 4½ minutes with more follow-ups.

### US-036 · Practise with pauses and hints (practice mode)
**Must** · For: A, M · WCAG 2.2.1 · M2

As an anxious learner, I want a mock exam I can pause and get hints in, so that I can learn the sequence without panic.

1. **Given** practice mode, **then** I can pause and resume at any point. While paused, no timer runs and nothing is recorded.
   - The pause overlay offers "Continue", "End and see my answers" (saved as ended early, US-039) and "Leave without saving" (RD-7).
2. **Then** I can open hints for the current question: the Persian translation of the question, the three key words and the matching template. Using hints isn't judged. The answer timer pauses while hints are open (R-14).
3. **Then** there is no overall time limit. Timers show elapsed time, with the 45–60 s guide as a neutral reference.
4. **Then** "Record again" is offered while I'm still answering (before "done"), and replaces the current take (R-14).
5. **Then** the questions come in the same order as in exam conditions, including the situation intro (US-028 to US-035).
6. **Then** if the optional pacing aid is built (US-070, Could), it appears only in practice mode.

### US-037 · Take the exam under real conditions (exam conditions)
**Must** · For: M, S · Exam: §3.4 · WCAG 2.2.1 (essential time limit, announced up front) · Decision: D-1 (decided 2026-11-18: exam conditions is in v1, and practice is shown first) · M2

As a learner close to my exam, I want a mock that runs like the real one, so that I can test whether I'm ready.

1. **Given** exam conditions, **then** the topic comes only from the draw (US-028), and the app chooses the situation.
2. **Then** the overall clock starts when the situation intro starts and runs without stopping, including during repeats. It ends the exam at the limit, with the grace period (US-035). There is no pause control, and there are no phase bands and no "move on" prompts (OQ-3, closed). The only automatic step is the part-1 cut-off, which makes sure the second required question is asked (US-034 #5, C17).
3. **Then** the translation, key words, model answer and templates are not available during the attempt. "Show text" for the Danish intro and question remains available (US-030).
4. **Then** I can't re-record an answer.
5. **Then** the attempt is labelled "exam conditions" in history. It also gets "interrupted" if US-038 applied, or "ended early" if I chose "End and see my answers" (US-039). It is never labelled "failed".

### US-038 · Recover from an interruption
**Must** · For: M, A, S · M2

As a learner whose phone rings mid-exam, I want the app to stop safely and let me choose what to do, so that I don't lose everything or feel I've failed.

1. **Given** an attempt is running, **when** the app goes to the background (tab hidden, screen locked, phone call), **then** audio stops, recording stops (keeping what was recorded so far), and all timers freeze.
2. **When** I return, **then** I see a calm message with three choices:
   - continue, which replays the current question
   - start again: in **exam conditions** this draws a **fresh topic**, and in **practice** it reuses the same topic. The interrupted attempt isn't saved (D-28, UX-OQ-31; a recommendation to validate with learners).
   - end and review what I have
3. **Given** exam conditions, **when** I continue, **then** the attempt is labelled "interrupted" in history.
4. **Given** the page reloads or the browser discards the tab mid-attempt, **then** I land on a clear screen. It says the attempt couldn't be kept and offers a new mock exam. The microphone isn't active, and there is no half-broken exam.
5. **Given** I use the browser's back button or back gesture mid-attempt, **then** (RD-2; C19):
   - it first closes any open sheet or dialog (Android)
   - otherwise it opens the leave dialog (US-039), the same as tapping "leave"
   - **Fallback:** if the OQ-9 spike finds the back guard unreliable (the ADR-0007 flag), back instead saves the attempt as "ended early". `/fa/mock` then shows a notice with "See my answers".
   - Either way, audio and recording stop, the microphone is released, and I land on a working page.
   - The review page uses the same guard for recordings that aren't kept.
6. **Given** the microphone is muted for more than 1 s (C18) or ends while I'm answering, for example because a call comes in, **then** this counts as an **interruption** (as in #1), not as "microphone unavailable" (RD-3).
   - When I continue, the app re-opens the microphone.
   - Only if it can't re-open the microphone are the later answers marked "not recorded", and the attempt continues without recording.
7. **Given** a clip fails to play mid-attempt despite preloading, **then** the timers pause and I can retry or end and review. In exam conditions the attempt is labelled "interrupted".
8. **Then** during the mock exam, answer aloud and shadowing, the app keeps the screen awake (Screen Wake Lock) (RD-1).
   - The lock is requested again when the page becomes visible, and released when I pause, finish or leave.
   - Where the browser doesn't support it, I see a one-time tip to raise my phone's auto-lock time. A screen lock is then handled as an interruption (#1).
   - Whether Telegram's in-app browser honours the lock is checked in the OQ-9 spike (UX-OQ-32).

### US-039 · Leave the mock exam at any time
**Must** · For: M, A, S · M2

As a learner, I want to leave whenever I need to, so that I never feel trapped.

1. **Given** an attempt is running, **then** a "leave" control is always visible, in both modes. Before **Start**, leaving needs no confirmation (UXD-30).
2. **When** I choose to leave after Start, **then** a dialog offers three choices (RD-7):
   - **Continue**
   - **End and see my answers:** saves the attempt as "ended early", in both modes, and opens the review
   - **Leave without saving:** says that the attempt and its recordings won't be kept
3. **When** I choose "Leave without saving", **then** audio, recording and timers stop, the microphone is released, and I return to the start of the mock exam. "End and see my answers" also stops everything and releases the microphone, then opens the review (US-041).
4. **When** I choose "Continue", including with Escape, **then** the dialog closes and the attempt carries on.
   - While the dialog is open, practice mode is paused.
   - In exam conditions the clock keeps running, but no new examiner line starts while the dialog is open (R-35).
5. **Then** an attempt left without saving isn't saved to history and doesn't count as practice. An attempt ended with "End and see my answers" is saved as "ended early" and counts as practice if at least one answer was given.

### US-040 · Choose the topic or theme for a practice mock
**Should** · For: S, M · M3

As a learner, I want to run a practice mock on a topic I've just studied, or within one theme, so that I can rehearse what I'm working on.

1. **Given** I'm on a topic page, **when** I choose "practise as a mock exam", **then** a practice-mode mock starts with that topic, skipping the draw.
2. **Given** I'm starting a practice mock, **then** I can limit the draw to one theme.
   - If the theme has fewer than three published topics, the draw shows one card per topic.
   - With only one topic, the draw is skipped (UX-OQ-24; D-25, confirmed by owner delegation, 2026-11-19).
3. **Then** exam conditions always draws from all published topics.

---

## After the mock exam

### US-041 · Listen to my answers next to the model answers
**Must** · For: M, A, S · Exam: §4.1, §4.2 · M2

As a learner, I want to hear what I said next to the model answer for each question, so that I can see the difference for myself.

1. **Given** I have finished or ended an attempt, **then** I see:
   - the situation intro I heard
   - each question I was asked, in order, with its Danish text, my recording (if there is one) and the model answer (text and audio)
2. **Then** only one clip plays at a time.
3. **Then** translations **of the questions** and the key words are available on request, with links to the topic page and the matching template. There are no translations of answers (D-19).
4. **Given** I have no recordings (microphone denied or skipped), **then** the review still shows the model answers and the self-check, with no error.
5. **Then** the review shows neutral facts:
   - the mode
   - the total time
   - whether the attempt was interrupted or ended early
   - the number of repeats
   - whether "show text" was used
6. **Then** nothing in the review shows a grade, score, percentage or pass/fail (§4.1, §4.2).
7. **Then** the review lives at `/fa/mock/review/{topicId}?attempt={id}` (RD-11; ADR-0005 §4). The attempt ID exists only on the device.
   - Opening the link on another device, or after the attempt has gone, shows a calm "this attempt is no longer on this device" page with a way back.
   - The "keep on this device" card is at the top of the review, so I see the deletion rule before I leave (UXD-21).

### US-042 · Check my answers with a self-check list
**Must** · For: M, A, S · Exam: §4.1 (pkt. 3.40), §7 · Content: our own, accepted under D-8 · M2

As a learner, I want a short checklist to judge my own answers, so that I know what to improve without pretending to be graded.

1. **Given** the review, **then** for each of the two required questions I can tick these items. They follow §4.1 and pkt. 3.40: explain, justify, take a position, argue, and express yourself coherently (review S5).
   - I answered the question I was asked.
   - I gave a reason.
   - I gave an example.
   - I linked my ideas (for example *fordi*, *derfor*, *men*, *alt i alt*).
   - I ended with my opinion or a conclusion.
   - I kept going: when I got stuck, I used a rescue phrase instead of stopping.
   - For the advantages-and-disadvantages question: I covered both sides.
   - **Optional, for learners aiming high (R-38):** I tried at least one longer sentence with *fordi*, *selvom* or *hvis*, and kept the word order after it. This links to "grammar in brief" (US-021 #6). It is shown collapsed under "more", so B1 learners aren't overloaded (D-25, confirmed by owner delegation, 2026-11-19).
2. **Then** each item has a short Persian explanation and a Danish example phrase (§7), for example:
   - *"fordi …"*
   - *"For eksempel …"*
   - *"Derfor …"*
   - *"På den ene side … på den anden side …"*
   - *"Alt i alt mener jeg, at …"*
   - *"Det har jeg ikke tænkt så meget over før, men jeg tror, at …"*
3. **Then** the list is labelled as a self-check. There is no total, score or grade.
4. **Then** I can skip it without any reminder or nagging.
5. **Given** storage is available, **then** my ticks are saved with the attempt. They are shown only in the review, not in history (US-048).
6. **Then** the self-check appears after each part of the review (UXD-21). At the end of the review I can optionally pick one item as **"focus next time"** (R-18). It is saved with the attempt and shown in history and on my next mock's get-ready screen.

### US-043 · See how long each answer was
**Should** · For: M, S · M3

As a learner, I want to see how long each answer lasted, so that I can tell whether I'm saying enough.

1. **Given** I have recordings, **then** the review shows the length of each recording in m:ss (US-053), labelled as recording length, not speaking time.
2. **Then** the booklet's 45–60 s guide is shown as a neutral reference. Nothing is marked in red or green, "too short" or "failed".

### US-044 · Know what happens to my recordings
**Must** · For: M, A, S · CLAUDE.md rule 10 · Decision: D-6 (decided 2026-11-18) · M2

As a learner, I want to know that my recordings stay private, so that I feel safe speaking.

1. **Given** I'm about to record for the first time, **then** I'm told in Persian that recordings stay on this device, are never uploaded, and by default are deleted when I leave. I'm also told that I can choose to keep my latest mock exam attempt (US-045).
2. **Given** I have recordings that aren't being kept, **when** I leave the review or an exercise through the app's navigation, **then** I'm told they will be discarded, and I can choose to stay or leave.
3. **Then** no network request contains recording data. QA verifies this with network inspection.
4. **When** I leave, **then** the microphone is released, and recordings that aren't kept are cleared from memory.
5. **Given** I haven't chosen to keep an attempt, **then** no recording remains in browser storage after the session (D-6). QA checks storage after leaving.

### US-045 · Keep my latest attempt on this device
**Should** · For: M, S · Decision: D-6 (decided 2026-11-18) · M3

As a learner, I want to keep my latest attempt for a topic, so that I can compare later and notice my progress.

1. **Given** the review of a mock exam, **then** "keep on this device" is off by default. **When** I choose it, **then** the attempt and its recordings are stored on this device. Keeping a newer attempt on the same topic replaces the old one, so at most one attempt is kept per topic.
2. **Then** I can play a kept attempt from history (US-048) and delete it.
3. **Then** settings show the total size of kept recordings and a "delete all recordings" option.
4. **Given** storage is full or unavailable, **then** I'm told the attempt couldn't be kept, and the review still works.

---

## Progress

### US-046 · Keep my progress on this device
**Must** · For: M, A, S · CLAUDE.md rule 6 · M2

As a returning learner, I want the app to remember what I've practised, so that I can pick up where I left off.

1. **Given** storage is available, **when** I do one of these on a topic, **then** the topic is recorded as practised, with the date:
   - complete an answer-aloud exercise (US-019)
   - complete a mock exam (US-035), or end one with "end and review" (US-038) or "End and see my answers" (US-039) after at least one answer
   - **shadow a whole model answer** (US-024) (UX-OQ-05)
2. **When** I reload, or come back another day in the same browser, **then** the topic page and home show how many times I've practised it and the last date.
3. **Then** the stored data contains only IDs, dates, modes, statuses, self-check ticks and settings. It contains no recordings unless kept (US-045) and no personal details.
4. **Given** the stored data is from an older version of the app or is invalid, **then** it is migrated or ignored without crashing, and valid records are kept.
5. **Then** home shows "continue where you left off", pointing to the last topic I opened (US-057).

### US-047 · See what is ready to review today
**Should** · For: M, A · Source: booklet method · Decision: D-22 (confirmed by owner delegation, 2026-11-19) · M3

As a learner, I want the app to tell me which topics to review today, following the booklet's schedule, so that I remember what I've learned without planning it myself.

1. **Given** I first study a topic on day D, **then** day D is day 1, and review steps are due on day 3, 7 and 14, that is D+2, D+6 and D+13, counted in local calendar days.
   - In the app, "first study" means the first day the topic is recorded as practised (US-046), which includes shadowing a whole answer. Opening a page by accident doesn't start a schedule.
   - The topic page says what completes a due review (UXD-17).
   - The schedule follows D-22 and OQ-2 (closed).
2. **Then** the app says plainly, in Persian, that it applies the booklet's day 1 → 3 → 7 → 14 method **per topic**, while the booklet applies it per chapter (booklet:52).
3. **Given** some topics are due today or earlier, **then** home lists them under "ready to review" (for example «آمادهٔ مرور»), and each one opens its topic.
4. **When** I practise a due topic, **then** that step, and any earlier steps that are overdue, are completed, and the next due date is shown.
5. **Then** overdue topics are shown only as "ready to review". They are never called "missed" or "late", never shown in warning colours, and missed days are never counted.
6. **After** the day-14 step, **then** the topic shows that its cycle is complete, and I can start a new cycle.
7. **Then** there are no push notifications, emails or badges.

### US-048 · See my mock exam history
**Should** · For: S, M · M3

As a learner, I want a list of my past mock exams, so that I can see what I've covered.

1. **Given** I've done mock exams, **then** I see them newest first (UX-OQ-28). Each shows:
   - the date (US-053)
   - the topic and situation
   - the mode
   - the status: completed, interrupted or ended early
   - the total time
   - my optional "focus next time" choice (US-042 #6)

   Self-check ticks are **not** shown in history, so nothing reads as a score (GA-10). History is one tap from the Mock exam tab and from Home (UX-OQ-27).
2. **When** I open one, **then** I see its details, and its recordings if I kept them (US-045).
3. **Given** there are none yet, **then** I see a short message and a way to start a mock exam.

### US-049 · Delete my progress and recordings
**Must** · For: M, A, S · M2

As a learner who shares a phone, I want to delete everything the app has stored, so that I'm in control of my data.

1. **Given** I open settings, **then** I see "delete my progress", and also "delete saved recordings" if any exist.
2. **When** I choose to delete, **then** a dialog says exactly what will be removed and that it can't be undone.
3. **When** I confirm, **then** all of the app's data on this device is removed, and the app shows the first-visit state.
4. **Given** the stored data is corrupted, **then** deleting still works.

### US-050 · Use the app when storage is unavailable or cleared
**Must** · For: M, A, S · M2

As a learner in a private window or with full storage, I want the app to keep working, so that I can still study.

1. **Given** storage is unavailable (blocked, limited in private mode, or full), **then** every study and mock exam feature works. Progress views show one short notice that progress can't be saved in this browser, with the reason.
2. **Given** storage was cleared (by me, by the browser, or by automatic removal of website data; OQ-11), **then** the app starts in the first-visit state without errors.
3. **Given** a save fails mid-session, **then** I'm told once, not on every action, and I can carry on.
4. **Then** the about and privacy pages explain that progress lives only in this browser on this device, that it can be lost when browser data is cleared, and that it doesn't move to another phone.

---

## Settings and i18n

### US-051 · Use the app in Persian, right to left
**Must** · For: M, A, S · M1

As a Persian speaker, I want the whole interface in Persian and laid out right to left, so that I can use it comfortably.

1. **Given** I open the app, **then** the locale is `fa`, and the page has `lang="fa"` and `dir="rtl"`.
2. **Then** all interface text is in Persian, including accessible names, alt text, page titles and error messages. No English words appear in the interface.
3. **Then** navigation, back and next arrows, chevrons and step indicators are mirrored. Play and pause icons, audio progress bars and clocks are not.
4. **Then** Persian text uses:
   - the Persian ی and ک
   - ZWNJ where it belongs (for example «می‌شود»)
   - Persian punctuation (، ؛ ؟ « »)
   - the formal «شما»
   - standard Persian that both Iranian and Afghan (Dari) readers understand

### US-052 · Read Danish correctly inside the Persian interface
**Must** · For: M, A, S · WCAG 3.1.2 · M1

As a learner, I want Danish to appear left to right and intact inside the Persian interface, so that I can read it without confusion.

1. **Then** every block of Danish (topic names, intros, questions, answers, key words, phrases) has `lang="da"` and `dir="ltr"`.
2. **Given** a Danish phrase inside a Persian sentence, **then** it is isolated, so its word order and punctuation stay correct. For example, «سؤال اول اغلب با Hvorfor tror du شروع می‌شود.» shows the Danish phrase intact, with the Persian full stop at the end of the sentence.
3. **Then** æ, ø and å render in the Danish typeface.
4. **Then** screen readers switch to Danish pronunciation for the Danish parts.

### US-053 · See numbers in one consistent digit style
**Must** · For: M, A, S · Decision: D-2 (decided 2026-11-18) · M1

As a learner, I want numbers shown in one consistent style, so that the interface feels coherent.

1. **Given** any number in the Persian interface (counts, dates, timers, durations, "1 of N"), **then** it uses Persian digits (۰–۹). For example, a timer shows «۴:۳۰» and a count shows «۵۱».
2. **Then** numbers inside Danish content, such as *"… 37 timer om ugen"* in a question, keep the Latin digits as written in the source.
3. **Then** the topic letters A, B and C stay Latin letters, as on the exam slips.
4. **Given** the owner changes the digit style in the single formatting config, **then** every interface number changes, with no other code change.
5. **Given** an absolute date (for example in history), **then** it uses the **Gregorian calendar with Persian month names and Persian digits**, for example «۲ دسامبر ۲۰۲۶». It never uses the Solar Hijri calendar that the `fa` locale defaults to. Relative dates ("today", "in 4 days") are used wherever possible (RD-10; UXD-23).
6. **Given** an exam term label, **then** it stays a Danish proper name with Latin digits, for example "Maj–Juni 2024 · B", isolated as Danish (RD-10; UXD-22). Each label uses one digit style only (R-17).

### US-054 · Follow my device's light or dark setting
**Should** · For: S · M3

As a learner who studies at night, I want the app to follow my device's dark mode, so that it's comfortable on my eyes.

1. **Given** my device uses dark mode, **then** the app shows its dark theme. Otherwise it shows the light theme.
2. **Then** both themes meet WCAG 2.2 AA contrast.
3. **Then** no page flashes the wrong theme while it loads.

### US-055 · Set my default speed and translation display
**Could** · For: A, S · M3

As a learner, I want to set my default playback speed and whether translations start shown, so that the app suits my level.

1. **Given** settings, **then** I can choose a default playback speed, and whether translations start shown or hidden.
2. **Then** my choices apply across the app and are remembered on this device when storage is available.

### US-056 · Add an interface language without code changes
**Must** · For: project owner · M1

As the project owner, I want to add an interface language by adding a messages file and one locale entry, so that the app can grow beyond Persian without a rewrite.

1. **Given** a new locale (for example `en`) is added to the locale list with a complete messages file, **then** the app serves it under `/<locale>/` with the correct direction (`ltr` for `en`), with no other code change.
2. **Given** a messages file is missing a key, or has a different ICU argument, compared with `fa.json`, **then** a message-parity test fails in CI (ADR-0004, ADR-0012). The type check keeps checking keys used in code against `fa.json`. *(Changed in rev. 3.2: the original "the type check fails" isn't practical for a second locale file.)*
3. **Given** only `fa` exists (as in v1), **then** no language switcher is shown.

---

## Cross-cutting

### US-057 · Know where to start
**Must** · For: M, A, S · M1

As a first-time visitor, I want to see at once what this app is and where to start, so that I don't waste my short study time.

1. **Given** my first visit, **then** home leads with what the app is: practice for delprøve 2 of the PD3 oral, not official. SIRI is spelled out on first mention (R-19). Below that come three starting points, one of them as the primary action:
   - how the exam works (US-001)
   - study topics (US-005)
   - try a mock exam (US-026)
2. **Given** any progress is stored on this device (a topic practised, a mock attempt or a kept recording), **then** home shows its returning state. "Continue where you left off" (US-046), and "ready to review" once US-047 is built, appear above the starting points (R-06).
3. **Then** the main navigation reaches home, the exam guide, topics, templates and phrases, the mock exam and progress. There is a skip link.
4. **Then** home shows no streaks, daily goals or badges (US-067).
5. **Then** home loads no audio.

### US-058 · Know who made the content and that the app is unofficial
**Must** · For: M, A, S · Exam: §6, §9 · M1

As a learner, I want to know where the content comes from and that the app isn't official, so that I can trust it for the right reasons.

1. **Given** any page with booklet content, **then** it credits the author (Shery Rahimi) and the source page, in the form agreed with the author (D-12).
2. **Given** the about page, **then** it explains:
   - who made the app
   - the booklet, with its credit
   - that the app isn't affiliated with SIRI (spelled out on first mention, R-19), danskogproever.dk or any school
   - for each question checked against SIRI: the verification date, the page and a link to the SIRI booklet. Unchecked questions read "not yet checked word for word" (R-16). The source of the situation-card titles is also given.
   - that the topics come from published exams between May–June 2016 and May–June 2024, and that later exam material is confidential (§6)
   - that SIRI says material from summer 2024 and earlier may still be used in teaching, as it is not confidential (SIRI practical guide, October 2026, §2.7; review suggestion 7)
   - which wording is SIRI's, which comes from the booklet, and which is the app's own, and that "official wording" appears only where it has been checked against SIRI's examiner booklets (US-068)
   - that the app gives no official or predicted grade
3. **Then** the about page links to the official sources (§9).
4. **Then** no SIRI exam picture appears anywhere in the app.

### US-059 · Understand what the app stores and sends
**Must** · For: M, A, S · M1 (final wording at M4)

As a learner, I want a plain explanation of my privacy, so that I'm comfortable using the microphone.

1. **Given** the privacy page, **then** it says in Persian:
   - what is stored on this device: progress, settings and kept recordings
   - what reaches the server: page and audio requests only
   - that recordings are never uploaded
   - whether any analytics is used (per D-5). In v1, per ADR-0013, there is **no analytics and no third-party error reporting**.
   - how to delete everything (US-049)
2. **Given** analytics is approved, **then** the page lists exactly what is counted. There is never advertising or cross-site tracking.
3. **Then** the page is linked from settings, from the footer and from the first microphone explanation (US-044).

### US-060 · Use the app with assistive technology and a keyboard
**Must** · For: M, A, S · WCAG 2.2 AA · M1

As a learner who uses a screen reader, a keyboard or large text, I want every feature to work for me, so that I can prepare like anyone else.

1. **Given** each core page (home, guide, library, topic, templates, each mock exam step, review, settings), **then** an `@axe-core/playwright` scan with the WCAG 2.2 A and AA rules finds no violations.
2. **Then** everything works with a keyboard, including audio controls, recording, the mock exam and dialogs. Focus is always visible and never hidden behind sticky bars.
3. **Then** pages have landmarks, one `h1`, headings in order and a skip link. Route changes move focus to the new page or announce it.
4. **Then** status changes are announced politely and sparingly: recording started or stopped, errors, and "one minute left" in exam conditions. The clock is not announced every second.
5. **Then** every audio clip has its text available (WCAG 1.2.1).
6. **Then** layouts work at 200% text zoom and with text-spacing overrides.
7. **Given** a manual check with VoiceOver on iOS and TalkBack on Android, **then** a learner can complete two journeys: browse → topic → play audio, and a full practice mock exam.
8. **Then** live-region announcements wait until examiner audio has stopped. Nothing is announced on "done", so a screen reader never talks over the examiner (UXD-31).
9. **Then** audio scrubbers move with the arrow keys and keep the media direction; they aren't mirrored (R-22).

### US-061 · Use the app on a phone with a slow connection
**Must** · For: A · M1

As a learner on an older phone with limited data, I want pages to open quickly and not waste data, so that I can study on the bus.

1. **Given** a screen 320 px wide, **then** no page scrolls horizontally, and primary actions can be reached with one hand.
2. **When** I open any page, **then** its text appears before any audio is downloaded, and audio downloads only when I press play. The mock exam preload (US-027) is the one exception.
3. **Given** a throttled connection (for example a "slow 3G" profile), **then** the topic page text is readable, and players show a loading state rather than a frozen interface.
4. **Then** the core pages meet the performance budget in ADR-0014, and QA checks it.
5. **Then** the app supports the browser floor in ADR-0014:
   - iOS and iPadOS Safari 16.4 or later
   - Chrome, Edge and Firefox 111 or later

   It's tested in Playwright, on a real iPhone and on a real low-end Android phone. Telegram's in-app browser is in the test matrix (R-21). On an older browser, the app shows a calm Persian note suggesting a browser update.

### US-062 · Handle audio that fails, is slow or is blocked
**Must** · For: M, A, S · M1

As a learner, I want audio problems handled gracefully, so that a glitch never stops me studying.

1. **Given** a clip fails to load, **then** its player shows a Persian error with "retry". The text stays, and other clips still work.
2. **Given** a clip is slow to load, **then** its play control shows a loading state, and tapping again doesn't start a second playback.
3. **Given** iOS Safari, **then** no audio plays on study pages without a tap.
4. **Given** the mock exam was started with a tap, **then** examiner lines play in sequence without further taps. If the browser blocks playback, a "tap to hear" button appears (US-030).
5. **Given** the microphone is open on a real iPhone, **then** examiner audio is audible at normal volume. The mitigation comes from the OQ-9 spike. QA checks this on a real device, not only in WebKit emulation.
6. **When** I go to another page, **then** playback stops.

### US-063 · Handle microphone permission and failures
**Must** · For: M, A, S · M2

As a learner, I want clear help when the microphone isn't available, so that I'm never stuck.

1. **Given** I tap an action that records, **then**, before the browser prompt, I see a Persian explanation of why the microphone is needed and that the audio stays on the device. The app never asks for the microphone when a page loads.
2. **Given** I deny permission, **then** I see Persian steps for my browser (iOS Safari, Android Chrome, desktop browsers) to allow it later, and I can continue without recording.
3. **Given** I denied permission before, **then** the app doesn't ask again on every action. It shows the guidance instead.
4. **Given** there is no microphone, or another app is using it, **then** I'm told plainly and can continue without recording.
5. **Given** Safari (iOS or macOS), Chrome or Firefox, **then** recording works and plays back on the same device.
6. **When** recording stops or I leave, **then** the microphone is released and the browser's indicator turns off.

### US-064 · Publish only reviewed content from public exam terms
**Must** · For: project owner · Exam: §5, §6 · Decisions: D-3, D-15, D-16, D-17 (decided 2026-11-18) · M1 (release gate at M4)

As the project owner, I want only reviewed content from public exam terms to reach the public app, so that learners can trust it and we respect copyright and exam confidentiality.

1. **Given** a production build, **then** it includes only topics with review status `approved`. Theme counts, term lists, search, the similar-questions page and the mock exam draw include only those topics.
2. **Given** a topic from any term after May–June 2024, **then** content validation fails, unless the owner has marked its source as public (§5, §6). (The main set ends at May–June 2024, so this is a guard.)
3. **Given** the author's written permission has not been recorded, **then** no booklet content is deployed publicly (release gate, [PRD §12](prd.md#121-milestones)).
4. **Then** the content coverage report shows counts by review status, theme and term, measured against the 51 main topics. It also shows counts of verification status (US-068), intro status and open later-exam flags.
5. **Given** the booklet's appendix (18 topics from 2013–2015, plus a title-only list for 2004–2012), **then** none of it is published in v1, whatever its review status (D-3; review Q6, S6).
6. **Given** any of the 45 booklet margin notes (marked 🔁, 🔗, 📌, ⭐ or 🩺), **then** its text is in no v1 build (D-21, confirmed by owner delegation, 2026-11-19; review B1).
   - 🔁 and 🔗 notes may be turned into structured links between topics, shown only in the app's own neutral wording (US-007).
   - A public note needs individual approval in a later version.
   - The note at booklet:1689, which mentions the 2026 written exam, is never published.
7. **Given** any content field, **then** content validation flags it if it contains:
   - a year of 2025 or later
   - *"Skriftlig 20xx"* or *"Mundtlig 20xx"* referring to a term after May–June 2024

   This applies to fields in any language, including Danish, Persian, notes, labels, titles and metadata. A flagged item can't be `approved` until a reviewer clears the flag with a recorded reason (review B1; DL-047). **QA test:**
   - a fixture field containing "Skriftlig 2026" is flagged and blocks approval
   - the booklet's citation of a SIRI guide from January 2025 (booklet:5892) is flagged and can be cleared with a reason
8. **Then** booklet:54 (the prediction sentence) and booklet:4885 ("memorise one answer for all of them") appear nowhere in the app (D-15).
9. **Given** a published topic, **then** the build fails unless:
   - every question has a verification record (US-068)
   - both situations have an approved examiner intro (D-16)

### US-065 · Report a problem with content
**Should** · For: S · M3

As a learner who spots a mistake, I want to report it easily, so that it gets fixed for everyone.

1. **Given** any topic, template or phrase page, **then** a "report a problem" link opens a `mailto:` message with the item's ID filled in. If an error occurred, its error code (ADR-0013) is filled in too (D-9, confirmed by owner delegation, 2026-11-19).
   - The address comes from config. It's a placeholder until the owner provides one, and the link isn't published with the placeholder.
   - There's no embedded form. Telegram may be added later.
2. **Then** the app itself collects no personal data in this process, and a short note says what happens next.

### US-066 · Share a link to a topic
**Should** · For: M, A · M3

As a learner in a study group, I want to share a link to a topic, so that my friends can open exactly the same page.

1. **Given** a topic or theme page, **then** its URL contains the stable ID and opens directly to that page in Persian.
2. **When** I tap "share", **then** the device's share sheet opens where available. Otherwise the link is copied and I'm told so.
3. **Given** the content has been updated, **then** existing topic links keep working.

### US-067 · Study without pressure tactics
**Must** · For: M, A, S · [PRD §5.1](prd.md#51-non-goals-not-this-product) · M1

As an anxious learner, I want an app that helps without pressuring me, so that studying lowers my stress rather than raising it.

1. **Then** nowhere in the app are there streaks, streak-loss warnings, daily goals, leaderboards, badges, countdown offers or fake urgency.
2. **Then** the app sends no push notifications or emails.
3. **Then** interface copy never uses failure words such as "wrong", "failed", "missed" or "late" for what the learner did. `persian-localization-reviewer` checks the `fa` messages for this.
4. **Then** progress shows what I've done, never a list of what I haven't done.

---

## Added in revision 3

### US-068 · See which wording is verified against SIRI
**Must** · Area: topic study page and content · For: S, project owner · Decision: D-17 (decided 2026-11-18) · M1 (release gate at M4)

As a learner who wants to trust the material, and as the project owner, I want every question to record whether its wording was checked against a public SIRI examiner booklet, so that the app says "official wording" only where that's true.

1. **Given** any required or follow-up question in the content, **then** it has a verification record with:
   - **a status:**
     - *matches SIRI*
     - *differs from SIRI*, with the difference recorded as a correction next to the booklet text (OQ-17)
     - *not checked*
   - **the SIRI source:** the examiner booklet and its term
   - **the date it was checked**
2. **Given** the status is *matches SIRI*, **then** the study page may show a short note such as "wording checked against SIRI's examiner booklet, May–June 2024".
3. **Given** the status is *not checked*, **then** the app describes the question as "the question as given in the booklet (from SIRI's examiner booklets)" and never as official.
4. **Given** the status is *differs from SIRI*, **then** the booklet text is shown as the main text, with a disclosure "SIRI's wording differs slightly" that reveals SIRI's version (D-28; OQ-17 closed). The booklet text is never silently overwritten (`.claude/rules/content-data.md`).
5. **Then** follow-ups are labelled "suggested follow-up" (*forslag til opfølgende spørgsmål*) whatever their status, never "official follow-up".
6. **Given** a situation intro, **then** it carries a source label:
   - "SIRI's wording (May–June 2024 examiner booklet)", or the 2023 booklet where it was found
   - "the app's wording" (D-16)
7. **Given** a published question without a verification record, **then** content validation fails (US-064).
8. **Then** the pilot term (May–June 2024) shows *matches SIRI* for all 9 required questions and all 9 follow-ups (pilot report §4.1).
9. **Given** a SIRI source that comes from a third-party mirror (Nov–Dec 2019, sokolova.dk), **then** no *matches SIRI* or *differs from SIRI* record based on it is approved until its authenticity is confirmed (OQ-22).

### US-069 · Hear the delprøve 2 instruction before the draw
**Could** · Area: mock exam · For: A, M · Exam: §3.4 · Content: our own, under D-8 · M3

As a learner, I want to hear a short instruction before the draw, as the examiner gives one, so that the start of the exam feels familiar.

1. **Given** I start a mock exam, **then** before the draw I can hear a short instruction in the examiner voice. It is based on SIRI's 2024 examiner booklet (p. 5), which says the task takes about 5 minutes.
2. **Then** the instruction is labelled as the app's wording. It has been reviewed by `pd3-exam-expert` and `danish-language-reviewer`.
3. **Then** I can skip it, and it doesn't count towards the overall clock.
4. **Then** its text is available. It's loaded at get ready, together with the sound-check clip, because it plays before the draw (UX-OQ-11; UXD-29).

### US-070 · See an approximate time split in practice mode
**Could** · Area: mock exam · For: M, S · Source: booklet:225–235; review Q1 · M3

As a learner learning to pace myself, I want an optional rough guide to how the 4½ minutes are usually spent, so that I don't use all my time on the first question.

1. **Given** practice mode, **then** an optional pacing aid is available. It is off and collapsed by default.
2. **When** I open it, **then** it shows two coarse phases, plus the booklet's 45–60 s guide per required answer:
   - the first question with its follow-up: about 2 minutes
   - the general question with its follow-up: about 2½ minutes
3. **Then** it's labelled: "An approximate split suggested by the booklet (Shery Rahimi). SIRI's examiner booklet gives only 'about 4½ minutes' in total."
4. **Then** it's never enforced: no colours, no alerts, no automatic moving on.
5. **Given** exam conditions, **then** the pacing aid isn't available (US-037).

---

## Added in revision 3.2

### US-071 · Check that my microphone picks up my voice
**Could** · Area: mock exam · For: A, M · Decision: D-25 (UX-OQ-26; confirmed by owner delegation, 2026-11-19) · M2, optional

As a learner who is nervous about technology, I want to see that my microphone hears me before the exam starts, so that I'm not surprised by a silent recording afterwards (H3).

1. **Given** the get-ready screen (US-027) and a granted microphone, **then** I can say a word (for example *"hej"*) and watch a simple level bar move.
2. **Then** the bar is decorative. Its meaning is also given in text, for example "we can hear you". Nothing is recorded or kept, and nothing leaves the device (GA-13).
3. **Given** no signal after a few seconds, **then** a calm Persian tip suggests checking the microphone or the browser permission (US-063). I can still continue.
4. **Then** the microphone is released when I leave get ready without starting.
