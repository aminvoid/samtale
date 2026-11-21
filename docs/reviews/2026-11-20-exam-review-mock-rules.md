# PD3 exam-accuracy review: mock-exam timing rules and the pilot's examiner lines

- **Reviewer:** `pd3-exam-expert`, 2026-11-20 (read-only; the main thread saved this condensed record).
- **Source:** SIRI examiner booklet May–June 2024, re-read in full (pp. 1–12).
- **Result:** no blockers, 3 Should fix. **Every SIRI text in the pilot is verbatim:** 6 intros, 9 required questions and 9 suggested follow-ups, with correct pages.

## Answers
1. **Part-1 cut-off and limits (UX-OQ-12, DL-049).**
   - Always asking the second required question matches SIRI (p. 5: examiners drop follow-ups, never a required question).
   - **C17 alone is not enough.** A follow-up started at about 2:45 with a long answer, or a long q1 answer (L11), leaves `q2` only the 20 s grace.
   - **Recommended:**
     - **C17 = 150 s.**
     - New **C21 `part1HandoverSeconds` = 200 s**, for exam conditions only. If a part-1 answer is still running at C21, show a calm notice ("finish your sentence; then the examiner asks the next question") and allow C3 grace seconds. Then *"Tak."*, the transition and `q2`.
     - These are app heuristics; SIRI gives no split. Tune them in usability sessions.
   - **270 s limit and 20 s grace (answering time only):** acceptable.
2. **The exam-conditions sequence and timing** follow the real exam: intro line → 10 s look → situation intro → q1 → follow-up → transition → q2 → follow-up → closing, with the clock starting at the intro. All documented deliberate differences are acceptable.
3. **Pilot examiner content** is correct and correctly attributed. `examiner.intro` and `examiner.closing` are SIRI verbatim; the transition and *"Tak."* are correctly marked as the app's own.
4. **Practice aids** don't misrepresent the real exam, provided they're labelled as practice aids.
5. **"Hvorfor?/Hvorfor ikke?" in audio:** say both, never only *"Hvorfor?"* (which assumes the learner agreed).
   - Play `siriParts[0]`, then a pause of about 0.6–1 s, then the `spoken` override *"Hvorfor eller hvorfor ikke?"* (`origin: "app"`, no comma before *eller*).
   - The displayed text stays SIRI's verbatim.
   - The same applies to the older variant *"Hvorfor / hvorfor ikke?"*.

## Should fix
- **S1.** The second required question isn't protected from a long part 1. Set C17 = 150 s, add C21 = 200 s with the handover notice, update L11 and T37, and add C21 tests.
  - **Where:** `docs/ux/flows/mock-exam-state-machine.md` §2 and §10, `user-stories.md:92`, PRD §6.3 and §6.4.
- **S2.** Follow-ups ending "Hvorfor?/Hvorfor ikke?" need the spoken variant above.
  - **Where:** `2024-maj-a.json` lines 109, 238 and 347; `2024-maj-b.json` line 357; schema OQ-S3.
- **S3.** Situation intros and follow-ups are SIRI **suggestions** ("eksaminator kan også vælge en anden formulering", p. 5).
  - Add a SourceLabel variant "SIRI's suggested wording". Keep "SIRI's wording" for the intro line, the closing and verified required questions.
  - Add a PRD §6.5 row: "A real examiner may word the intro and follow-ups differently; practise understanding, not memorising."
  - Add one line about this to the guide.

## Suggestions
1. **Cap the grace extension:** only the first repeat during grace suspends it, or set an absolute ceiling of about 330 s.
2. **List the visible clock and the one-minute announcement** as deliberate differences in PRD §6.5.
3. **Label the slower repeat as a practice aid.** Prefer SSML `rate` synthesis over 0.75× time-stretching.
4. **Hints sheet:** add "Not available in the real exam: no notes in delprøve 2".
5. **`examiner-lines.json`:**
   - add page 5 to `closing.sourceRef`
   - attribute "godt" in the thanks note to DL-021
   - record intro and closing as verified in the ledger
6. **`2024-maj-b.general.followup1.fa`** leaves out «چرا؟». This is for `persian-localization-reviewer`.
7. **The skipped-follow-up review note:** keep it free of SIRI attribution, since the cut-off is the app's rule.
