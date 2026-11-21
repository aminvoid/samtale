# Product decision log

| | |
|---|---|
| **Maintained by** | `product-manager` agent, for the project owner |
| **Started** | 2026-11-18 |
| **Last updated** | 2026-11-20, PRD revision 3.3: the owner delegated confirmation ("I want you to confirm on behalf of me", 2026-11-19). D-18 to D-25 are confirmed; D-5, D-9 to D-14 and D-26 to D-28 are confirmed as recommended (DL-035, DL-064 to DL-072). Earlier, revision 3.2: D-24 and D-25 by delegation (DL-058, DL-059); ADR decisions recorded (DL-060 to DL-063). Earlier, revision 3.1: decisions D-18 to D-23 taken by delegation (owner to confirm) after the content pilot. Revision 3 recorded D-15 to D-17 and the proposals from the exam-accuracy review. |
| **Related** | [prd.md](prd.md) (§7 trade-offs, §11 decisions), [exam-accuracy review](../reviews/2026-11-18-pd3-exam-review-prd.md), [CLAUDE.md](../../CLAUDE.md), `docs/adr/` (technical decisions) |

## How to use this log

- **Scope:** this log holds product decisions. Technical decisions go in ADRs (`docs/adr/`), which link here when a product decision drives them.
- **Statuses:**
  - **Decided:** made or approved by the owner. The date is given.
  - **Decided by delegation, owner to confirm:** taken on the owner's behalf while they were away, at their request. They count as decided, but stay flagged until the owner confirms or changes them.
  - **Confirmed by owner delegation:** the owner explicitly delegated confirmation on 2026-11-19, so these count as owner decisions.
  - **Proposed:** recommended by the product manager and waiting for owner approval.
  - **Superseded:** replaced by a later entry.
- **Append-only.**
  - When a proposal is approved, it moves to "Decided" with its approval date, and keeps its ID.
  - When a decision changes, add a new entry and mark the old one Superseded, with a link. Don't rewrite history.
  - Factual corrections to a description are added as a dated note in the row.
- **Owner decisions:** entries that depend on a decision only the owner can make link to its `D-x` item in [PRD §11](prd.md#11-decisions).
- **References:**
  - "booklet:N" means line N of `docs/resources/PD3_Mundtlig_Delproeve2.md`.
  - "Review Q/B/S" means an item in the exam-accuracy review.

---

## Decided

### From the brainstorm (by the owner, 2026-11-18)

Source: the brainstorm recorded in [concept.md](concept.md), and the "Decisions already made" section of [CLAUDE.md](../../CLAUDE.md).

| ID | Decision | Reason |
|---|---|---|
| **DL-001** | **Audience:** the Persian-speaking PD3 community. The app is **public**. | Good material in Persian exists only as a static PDF. The community needs a practice tool. |
| **DL-002** | **v1 covers delprøve 2 only.** Delprøve 1 comes later, and the design must leave room for it. | Delprøve 2 is unscripted and the hardest part to practise alone. Delprøve 1 depends on each learner's own topic. |
| **DL-003** | **Interface:** Persian (`fa`, RTL) first, and i18n-ready. Content translations are kept separate from interface strings. | Persian is the learners' strongest language. More interface languages (English first) should need no code changes. |
| **DL-004** | **No AI or LLM features.** The only external service is **Azure AI Speech**. | Keeps cost, privacy and quality risks low. AI can be reconsidered later. |
| **DL-005** | **Audio is pre-generated** with Azure TTS, with word timings. The examiner voice and the model-answer voice are different. | Consistent, cacheable audio. Word timings make highlighting possible. Two voices separate examiner from answer. |
| **DL-006** | **Responsive and phone-first.** Offline support isn't required. | Learners study on phones. Offline adds complexity for little gain. |
| **DL-007** | **No accounts in v1.** Progress is stored in the browser behind an interface, so a database can replace it later. | Privacy and scope. The interface keeps accounts cheap to add later. |
| **DL-008** | **Content goes into versioned data files** and is read only through a data-access layer. **IDs are stable.** | Easy to correct, easy to validate, and easy to move to a database. Audio, progress and URLs depend on the IDs. |
| **DL-009** | **Nothing from the booklet is published until the author gives written permission.** The source files are never committed to a public repository. | The booklet is copyrighted. |
| **DL-010** | **Recordings never leave the device** in v1. | Privacy and trust. Learners are anxious about being heard. |
| **DL-011** | **The app never claims to give an official or predicted grade.** | The grade is a holistic judgement by an examiner and a censor, and the criteria aren't public (ABOUT_PD3_MUNDTLIG.md §4.1). |
| **DL-012** | **SIRI's official exam pictures are not used.** | Rights. |
| **DL-013** | **Framework:** the latest stable Next.js (App Router), with the stack in CLAUDE.md. | Owner's technical choice. |
| **DL-014** | **The mock exam is a pure state machine,** with randomness and time injected. | It can be tested and stays faithful to the exam sequence. |
| **DL-015** | **No deadline. Quality comes before speed.** | Owner's stated priority. |
| **DL-016** | **ABOUT_PD3_MUNDTLIG.md is the source of truth** for exam format, timings and terminology. | Verified against the exam orders and SIRI sources (checked 17 Nov 2026). |
| **DL-017** | **The name and visual identity** will be proposed by `ui-designer`. | Not a product-management decision. |

### Proposed by the product manager, approved by the owner on 2026-11-18

| ID | Decision (as approved) | Reason | Owner decision |
|---|---|---|---|
| **DL-018** | **Two mock exam modes, practice and exam conditions, are both in v1 and run the same sequence.** Practice is shown first. | Realism builds readiness, and practice reduces anxiety. WCAG 2.2.1 requires an adjustable alternative to a strict time limit. One state machine serves both modes. | D-1 |
| **DL-027** | **Recordings are kept for the session only by default.** The learner can opt in to keep the latest attempt per topic on the device. | Private by default, useful for learners who want to compare over time, and storage stays bounded. | D-6 |
| **DL-029** | **Topics from 2016–2022 are shown with a label and included in mock draws. The 2004–2015 appendix stays out** until `pd3-exam-expert` confirms it has the same structure. | Keeps the library. 42 of the 51 main topics are from before the 2023 format change, and only 9 are in the current format. The questions are still good practice, and the label avoids confusion about the removed picture task (§6).<br><br>*Correction (2026-11-19, review S6):* the appendix holds 18 topics from **2013–2015**, plus a title-only list for 2004–2012. The review confirmed it lacks model answers and other parts (Q6), so the exclusion stands. The decision itself is unchanged. | D-3 |
| **DL-030** | **Situation visuals are text cards with a theme icon.** Illustrations may come later. | The SIRI pictures can't be used, and AI images are excluded. Learners no longer describe the pictures (§3.4). The booklet gives a short description of each situation that the cards can show. | D-4 |
| **DL-033** | **"Answer this question aloud" on the study page is Must. Shadowing is Should.** | Answering aloud is the booklet's own method and the smallest real speaking loop. It reuses the recorder. | D-7 |
| **DL-034** | **Content we write ourselves** (the Persian exam guide, examiner connecting phrases, the self-check) is accepted. It is labelled as the app's own and checked by the reviewer agents (`pd3-exam-expert`, `danish-language-reviewer`, `persian-localization-reviewer`). | The app needs this content, and keeping it separate protects fidelity to the booklet and to SIRI. *Extended by DL-045 (situation intros).* | D-8 |
| **DL-036** | **Persian digits (۰–۹) in the interface; Danish content keeps its own digits.** This is implemented as one config value. | Looks native to Iranian and Afghan readers, and is easy to reverse. Still worth checking in the learner interviews. | D-2 |
| **DL-044** | **Leave out the booklet's prediction sentence (booklet:54) and its "memorise one answer for all recurring questions" note (booklet:4885).** The app uses its own honest copy about similar questions.<br><br>*Approved on 2026-11-18, extended by the owner to include booklet:4885.* | It conflicts with the claims policy (PRD §6.7): nobody outside the exam system can know which topics will come up (§5, §6). Review Q7 found no official basis for the claim, and noted that the "recurring" rows are often only similar. The owner should tell the author (PRD §11.3). | D-15 |

### Owner decisions recorded directly

| ID | Date | Decision | Reason | Owner decision |
|---|---|---|---|---|
| **DL-041** | 2026-11-18 | **The content source is the owner's Markdown extraction of the booklet:** `docs/resources/PD3_Mundtlig_Delproeve2.md`. The PDF is used only for cross-checking. It holds 51 main topics (2016–2024, 17 terms × A/B/C, each with an anchor such as `t-N16C`) and an appendix. The owner still reviews the Persian before anything is approved.<br><br>*Correction (2026-11-19, review S6):* the appendix holds 18 topics from 2013–2015, plus a title-only list for 2004–2012. | The Persian in the PDF extracts scrambled. The Markdown has clean Unicode, and all 517 Danish passages match the PDF word for word. Source: [concept.md](concept.md) "Open issues". | n/a |
| **DL-045** | 2026-11-18 | **Every situation gets an examiner intro** of one or two sentences, played before the first required question, with audio. The source depends on the term:<br>**May–June 2024:** SIRI's *"Forslag til indledning"*, verbatim.<br>**2023:** SIRI's text, if those examiner booklets can be found.<br>**2016–2022, and any 2023 term not found:** one sentence we write from the booklet's situation description, labelled as the app's wording (an extension of DL-034) and reviewed by `danish-language-reviewer`. | The official sequence requires it. SIRI's 2024 examiner booklet (p. 5) says that before the first required question the examiner introduces the focus by describing the situation in one or two sentences (review B2). | D-16 |
| **DL-046** | 2026-11-18 | **Verify older terms.**<br>The content work checks older terms' questions against public SIRI examiner booklets where they can be found.<br>Every question carries a verification record, and "official wording" is shown only where verified.<br>Booklet text is kept as is, with corrections recorded next to it.<br>Follow-ups are called "suggested follow-ups" (*forslag til opfølgende spørgsmål*), never "official follow-ups". | The booklet says only May–June 2024 was compared word for word (booklet:38), and the review found small differences in Nov–Dec 2019 (review S1, Q4). *Note (2026-11-19):* the Nov–Dec 2019 SIRI booklet comes from a third-party mirror (sokolova.dk). Its authenticity must be confirmed before it's used for corrections (PRD OQ-22). | D-17 |

### Decided by delegation on 2026-11-19, then confirmed by owner delegation on 2026-11-19

*Status change (revision 3.3):* DL-042 and DL-053 to DL-059 were "owner to confirm". They are now **confirmed by owner delegation, 2026-11-19**.

The owner asked us to go ahead with our recommendations while away. These follow the M0 content pilot ([pilot report](../content/pilot-report.md) §6).

| ID | Decision | Reason | Owner decision |
|---|---|---|---|
| **DL-042** | **Spaced review runs per topic, at the booklet's intervals.** The app says plainly that it adapts the booklet's per-chapter method. **Day 1 is the day the learner first studies the topic,** so reviews fall on days 3, 7 and 14.<br><br>*Proposed on 2026-11-18; decided by delegation on 2026-11-19, with day 1 defined.* | The booklet says "review each **chapter** on day 1 → 3 → 7 → 14" (booklet:52). Chapters range from 2 to 16 topics, which is too much for a short phone session. Closes OQ-2. | D-22 |
| **DL-053** | **Situation cards show the booklet's own situation title** (Danish and Persian), the same for all 51 topics. SIRI's picture captions aren't used on cards. The examiner intro plays as audio, with its text, once a situation is chosen. | Every one of the 102 situations has a booklet title; SIRI's captions exist only for 2024 (pilot report §1.9). One consistent source for all topics. | D-18 |
| **DL-054** | **No Persian translation of model answers or follow-up answers in v1.** This moves to "later, possibly with the author". The Persian translation of each question stays. | The booklet has none (pilot report). Writing about 300 translations of our own is out of scope, and they would need Persian review. | D-19 |
| **DL-055** | **The 7 personal examples, all nurse-specific, are shown to everyone,** labelled in Persian as an example from a nurse's perspective, with a prompt to make your own example. | They're useful models of a personal example. The label stops non-nurses from feeling the material isn't for them. | D-20 |
| **DL-056** | **The repository stays private** while `content/` and the review pages contain booklet text. | The booklet is copyrighted and permission is pending (DL-009, CLAUDE.md). Pilot report risk R-C7. | D-23 |
| **DL-057** | **No booklet margin note is public in v1.**<br>🔁 (recurring) and 🔗 (related) notes may become **structured links between topics**, shown only in our own neutral wording, never the booklet's text.<br>📌 tips and the ⭐ and 🩺 notes stay hidden.<br>A public note needs individual approval later. *This supersedes the margin-note part of DL-047.* | There are 45 notes. One (booklet:1689) leaks a confidential 2026 exam topic; others predict or say "memorise the same answer" (review B1, pilot report §1.10). Turning links into data keeps their value without the booklet's wording. | D-21 |
| **DL-058** | **The UX decisions RD-1 to RD-12** ([docs/ux/README.md](../ux/README.md), "Revision 2"):<br>**RD-1:** the Screen Wake Lock in the mock, answer aloud and shadowing, with a one-time tip where it isn't supported.<br>**RD-2:** back opens the leave dialog; if the OQ-9 spike finds that unreliable, back saves the attempt as "ended early" (C19).<br>**RD-3:** a microphone mute over 1 s, or the microphone ending, while answering is an interruption (C18).<br>**RD-4:** answer aloud has a separate "Next question", and the compare step can't be skipped.<br>**RD-5:** no controls inside list links.<br>**RD-6:** the second required question is always asked; part-1 cut-off at about 2:45 (C17).<br>**RD-7:** "End and see my answers" or "Leave without saving"; new status "ended early".<br>**RD-8:** sample answers collapsed; shadowing counts as practice; history shows total time and "focus next time", not ticks; answer aloud shows the question text.<br>**RD-9:** the walkthrough fixes.<br>**RD-10:** Gregorian calendar with Persian month names and digits; Danish term labels in Latin digits.<br>**RD-11:** the review route.<br>**RD-12:** public topic links. | From the UX architecture and the learner walkthrough ([review](../reviews/2026-11-19-learner-walkthrough-ux.md)). They protect attempts from accidental loss, keep the real exam's two-question shape, and avoid anything that reads as a score. | D-24 |
| **DL-059** | **PM answers to the UX questions:**<br>**UX-OQ-17:** add a collapsed, attributed "grammar in brief" to the template pages.<br>**UX-OQ-18:** the draw avoids the immediately previous term.<br>**UX-OQ-24:** small themes show one card per topic, and with one topic the draw is skipped.<br>**UX-OQ-26:** a microphone level check as a Could (US-071).<br>**R-38:** one optional, collapsed self-check item on longer sentences and word order. | Each is cheap and helps learners who aim high (correctness, Maryam) or who fear technical failure (H3), without adding Musts. | D-25 |

### Recorded per ADR (2026-11-19)

These are technical decisions owned by `software-architect` and recorded here because they change stories.

| ID | Decision | ADR | Stories |
|---|---|---|---|
| **DL-060** | The review route is `/fa/mock/review/{topicId}?attempt={id}`. The attempt ID exists only on the device. | ADR-0005 §4 | US-041 #7 |
| **DL-061** | A missing message key, or a different ICU argument, fails a **message-parity test in CI**, not the type check. | ADR-0004, ADR-0012 | US-056 #2 |
| **DL-062** | The browser support floor is iOS/iPadOS Safari 16.4+ and Chrome/Edge/Firefox 111+. Closes PRD OQ-10. | ADR-0014 | US-061 #5 |
| **DL-063** | v1 has **no analytics and no third-party error reporting.** It has only a `reportError` seam and error codes. D-5 is now confirmed as none at launch (DL-035, 2026-11-19). | ADR-0013 | US-059 #1 |

### Confirmed as recommended, by owner delegation, 2026-11-19 (revision 3.3)

| ID | Decision | Reason | Owner decision |
|---|---|---|---|
| **DL-035** | **No analytics and no third-party error reporting at launch.** An optional, voluntary survey after each exam term. Revisit after one term. *Moved here from "Proposed".* | Privacy (GA-13). It matches ADR-0013, and a third-party service would break DL-004. | D-5 |
| **DL-064** | **"Report a problem" uses `mailto:`,** with the item ID and any error code filled in. The address is a placeholder until the owner provides one. No embedded form; Telegram is optional later. Closes UX-OQ-21. | No second external service, and no personal data collected by the app. | D-9 |
| **DL-065** | **A closed beta with 5–10 learners after M2,** only once the author's written permission exists. | It's the only way to test H2 and H3. Copyrighted content can't be shared without permission. | D-10 |
| **DL-066** | **At launch, all 51 topics have been through review,** and only approved topics are published. | Trust, and the launch doesn't wait for every last topic. | D-11 |
| **DL-067** | **The 10-item permission checklist** (PRD §11.1, D-12) is what we ask the author for. | It covers every use the app makes of her work. | D-12 |
| **DL-068** | **Free, with no ads and no tracking.** | Community tool; it also shapes the permission request. | D-13 |
| **DL-069** | **A second Persian reviewer** (ideally Dari-speaking) is optional and desirable, not a blocker. | The Persian is clean (DL-041); the value is in Dari naturalness and spreading the review load. | D-14 |
| **DL-070** | **Hosting on Vercel Hobby ($0) (ADR-0010),** with deployment protection until the author's permission is in writing. Re-check Vercel's non-commercial terms before the public launch. | No cost; protection keeps booklet content private (DL-009). | D-26 |
| **DL-071** | **A custom domain before the public launch.** The owner buys it. | Trust and stable links (US-066). | D-27 |
| **DL-072** | **The owner's UX questions, confirmed as the UX proposals:**<br>**UX-OQ-13:** uniform personal-example label; the booklet's labels are metadata.<br>**UX-OQ-19 / OQ-14:** sample-answer label «یک پاسخ نمونهٔ ساده و روشن»; mention it to the author.<br>**UX-OQ-20 / OQ-17:** booklet text is the main text, with a "SIRI's wording differs slightly" disclosure.<br>**UX-OQ-25:** the nurse toolbox sentence gets the personal-example label.<br>**UX-OQ-31:** "Start again" draws a fresh topic in exam conditions and reuses the topic in practice. *To validate with learners.* | Consistency, honesty about provenance, and realism in exam conditions. | D-28 |

### By delegation, 2026-11-20 (revision 3.4)

| ID | Decision | Reason | Source |
|---|---|---|---|
| **DL-073** | **Mock-exam timing and examiner audio, from the exam review:**<br>**C17:** part-1 cut-off at **150 s**.<br>**C21:** a new handover at **200 s**, exam conditions only. A running part-1 answer gets a "finish your sentence" notice and the 20 s grace, then *"Tak."*, the transition and the second required question.<br>**Ceiling:** repeats during grace can't push the end of the exam past **330 s**.<br>**Source labels:** situation intros and follow-ups are labelled "SIRI's suggested wording"; "SIRI's wording" stays for the intro line, the closing and verified required questions.<br>**Spoken form:** the audio for *"Hvorfor?/Hvorfor ikke?"* (and *"Hvorfor / hvorfor ikke?"*) is the question part, a pause of about 0.6–1 s, then *"Hvorfor eller hvorfor ikke?"*. The display text stays verbatim.<br>**§6.5:** new rows for the suggested wording, the visible clock and one-minute announcement, and the spoken form. | The C17 cut-off alone could leave the second required question only 20 s. SIRI's examiners drop follow-ups, never a required question (2024 booklet p. 5). Intros and follow-ups are suggestions examiners may reword. Saying only *"Hvorfor?"* assumes the learner agreed. These are app heuristics to tune in usability sessions. | [Exam review 2026-11-20](../reviews/2026-11-20-exam-review-mock-rules.md) (S1–S3, suggestions 1–2) |

---

## Proposed by the product manager, confirmed by owner delegation on 2026-11-20

The owner's delegation covers all open proposals. Every entry below, including DL-047's later-exam check, is **confirmed by owner delegation, 2026-11-20**. They were proposed on 2026-11-18 (DL-019 to DL-044) and on 2026-11-19 (DL-047 to DL-052).

**Exceptions: confirmed, pending validation.** These depend on an outside fact:
- **DL-040:** pending the author's agreement to the sample-answer label (D-28).
- ~~**DL-049:** pending `pd3-exam-expert`'s check.~~ **Validated 2026-11-20:** 270 s + 20 s grace is acceptable ([review](../reviews/2026-11-20-exam-review-mock-rules.md)). The part-1 values are in DL-073.
- ~~**DL-050:** pending `danish-language-reviewer`.~~ **Validated 2026-11-20; confirmed.**

Related, among the already-confirmed entries: DL-058's back guard (RD-2) is pending the OQ-9 real-device spike, which decides between the leave dialog and the "ended early" fallback (C19).

| ID | Decision | Reason | Owner decision |
|---|---|---|---|
| **DL-019** | **The learner taps "done" to end an answer.** The app never cuts off an answer, except at the overall limit of about 4½ minutes in exam conditions, where a short grace period applies (DL-049). | The examiner accepts pauses (§4.1). Without speech recognition, the app can't hear when an answer ends. | n/a |
| **DL-020** | **Only the booklet's suggested follow-up questions are used in v1.** We write no extra follow-ups or rephrasings.<br><br>*Wording updated 2026-11-19: "suggested", not "official" (DL-046).* | Fidelity. We can't react to what the learner said without AI. Writing and vetting new questions is a burden. The cost: mocks may run shorter than 4½ minutes, and the review says so. | n/a |
| **DL-021** | **Between answers the examiner voice says only *"Tak."*** It never says *"fint"* or *"godt"*, never evaluates and never corrects. | Real examiners don't signal success or correct the candidate (§4.1). *Clarified 2026-11-19 (review suggestion 1):* *"Tak."* between answers is an **app convention**, not a SIRI rule. The Huskeliste asks examiners to say *"tak"* rather than *"fint"*. | n/a |
| **DL-022** | **A repeat request replays the same question audio.** In exam conditions the clock keeps running. | The examiner must repeat with roughly the same words before rephrasing (Huskeliste; §3.4), and the real clock doesn't stop. The review confirmed this, and it applies to follow-ups too (Q5). | n/a |
| **DL-023** | **Persian translations are hidden until the learner asks for them.** | Encourages understanding Danish first, and listening is assessed (§4.1). Revisit if interviews show it frustrates B1 learners. | n/a |
| **DL-024** | **The microphone is optional everywhere.** Every speaking exercise can be done without recording. | Nobody is blocked by denied permissions, missing hardware or iOS quirks. | n/a |
| **DL-025** | **All audio for a mock exam, including the situation intro, is loaded before the 10-second look starts.** | Avoids stalls mid-exam on slow networks. The attempt never starts with missing audio. | n/a |
| **DL-026** | **No grades or scores of any kind.** A labelled self-check, based on the assessed skills (including coherence and keeping going, review S5), replaces them. | Honesty (DL-011) and learning value: the learner names what to improve. | n/a |
| **DL-028** | **Only `approved` content is published, and only from terms up to May–June 2024**, unless the owner confirms that a later source is public. | Trust, and exam confidentiality: material has been confidential since winter 2024 (§5, §6). *Extended by DL-047 (margin notes and later-exam references in any field).* | n/a |
| **DL-031** | **SIRI's intro line is kept word for word** (*"Her er der to billeder …"*) and used for every topic, even though the app shows text cards. The 2019 picture-description script is never used. A one-line Persian note says that the real exam shows two pictures. | Recognising the real line is the point. *Confirmed 2026-11-19 by review Q3 (OQ-5 closed):* it's SIRI's printed script in the 2024 examiner booklet, so it may be labelled as SIRI's wording. | n/a |
| **DL-032** | **No streaks, notifications, badges or other gamification.** Spaced review is shown as a calm in-app "ready to review" list. | Learning outcomes come before engagement. Reduces anxiety, needs no permissions, and needs no infrastructure. | n/a |
| **DL-037** | **Learning is measured qualitatively first:** interviews, usability sessions and a survey after each term. | No analytics decision yet, and these methods answer "is it helping?" better than click counts. | n/a |
| **DL-038** | **The M0 pilot content is the May–June 2024 term (topics A, B and C)**, plus enough topics to cover the three templates. | The content pilot confirmed that all 9 required questions and all 9 follow-ups match SIRI word for word, and took its 6 situation intros verbatim from SIRI (pilot report §4.1). A complete A/B/C set exercises the draw. | n/a |
| **DL-039** | **Exam timings and examiner lines live in one exam config.** | Rules can change (§6). One place to update, and tests can use the same values. | n/a |
| **DL-040** | **Model answers are described as simple sample answers,** never as "the best" answer or tied to a grade. *Confirmed, pending validation: the author's agreement to the label.* | Honesty, and the booklet's answers are deliberately pass-level. Final wording to be agreed with the author (OQ-14). | n/a |
| **DL-043** | **The app's exam guide is written from ABOUT_PD3_MUNDTLIG.md. The booklet's own rules chapter ("chapter 0") is not shown.** | DL-016 makes ABOUT_PD3_MUNDTLIG.md the source of truth, and the two differ in places. For example, the booklet presents the picture-description task as a feature of the pre-2016 exams (its appendix and its note on the 2013–2015 examiner booklets), but the task existed until 2023 (§6). | n/a |
| **DL-047** | ~~Booklet margin notes (⭐ 📌 🔁 🔗) are not published unless each one is individually reviewed and approved by `pd3-exam-expert`.~~ *The margin-note part is superseded by DL-057 (2026-11-19). The validation rule below remains proposed.*<br>Content validation flags any field, in any language, that contains a year of 2025 or later, or *"Skriftlig/Mundtlig 20xx"* referring to a term after May–June 2024. A flagged item can't be approved until a reviewer clears it with a recorded reason. | Review B1: booklet:1689 reveals a topic from the confidential 2026 written exam. Other notes act as predictions or "memorise the same answer" advice. Some flags will be harmless (for example a 2025 SIRI guide in the booklet's sources, booklet:5892), so this is a review flag, not an automatic block. | n/a |
| **DL-048** | **The draw uses three identical, unmarked face-down cards.** The letter and topic are revealed only after a tap. | SIRI's practical guide (§4.3.5) says the slips carry no marks on the side the candidate sees (review suggestion 2). | n/a |
| **DL-049** | **A grace period at the 4½-minute limit in exam conditions** (config, proposed 20 s). No new question starts after the limit. An answer in progress ends at the learner's next "done" or when the grace period runs out, whichever comes first. *Confirmed; validated by `pd3-exam-expert` on 2026-11-20 (UX-OQ-12; ceiling and part-1 values in DL-073).* | In the spirit of the examiner avoiding interruptions (review suggestion 4), while keeping the overall time realistic. | n/a |
| **DL-050** | **The transition before the general question is the app's own sentence:** *"Nu vil jeg stille dig et spørgsmål af en mere overordnet karakter."* It is labelled as ours and based on SIRI's instruction to the examiner. *Confirmed; validated by `danish-language-reviewer` on 2026-11-20.* | There is no scripted SIRI line, only an instruction to announce *"et spørgsmål af en mere overordnet karakter"*; the 2019 booklet has no announcement at all (review Q2, S2). `danish-language-reviewer` confirms naturalness. | n/a |
| **DL-051** | **The repeat control uses *"Undskyld, vil du godt gentage spørgsmålet?"*** The toolbox shows the booklet's *"Undskyld, vil du gentage spørgsmålet?"* as an equally correct variant. | It matches the examiners' register (review Q5, OQ-20 closed). | n/a |
| **DL-052** | **Exam conditions show one overall clock, with no phase bands or "move on" prompts.** The clock starts at the situation intro. Practice mode may offer an optional pacing aid, collapsed by default and labelled as the booklet's approximate split (US-070, Could). | SIRI gives no split of the 4½ minutes (review Q1, OQ-3 closed). | n/a |
