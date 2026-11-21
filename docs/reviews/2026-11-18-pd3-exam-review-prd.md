# PD3 exam-accuracy review: product docs (PRD rev. 2)

- **Reviewer:** `pd3-exam-expert` agent, 2026-11-18
- **Scope:**
  - `docs/product/prd.md` (revision 2)
  - `docs/product/user-stories.md`
  - `docs/product/decision-log.md`
  - the booklet source
- "ABOUT" means `docs/resources/ABOUT_PD3_MUNDTLIG.md`, and "booklet:N" means line N of `docs/resources/PD3_Mundtlig_Delproeve2.md`.

**Owner decisions taken after this review (2026-11-18):**
- **Situation intros for 2016–2023:** write our own, labelled as the app's wording.
- **D-15:** leave out the prediction sentence.
- **Older terms:** check them against SIRI booklets where those can be found.

**Primary sources read for this review:**
- SIRI May–June 2024 examiner booklet
- SIRI Nov–Dec 2019 examiner booklet
- SIRI Huskeliste (April 2026)
- SIRI practical guide (October 2026)
- BEK 1687/2025
- the ministry's consultation letter of 9 September 2024
- the Danish Patient Safety Authority's language-test page

---

## 1. Answers to the open questions

### Q1 (OQ-3): how to split the ~4½ minutes
**Answer:** SIRI gives no split, so don't build one into the exam-conditions mock.

**What the official booklets say:**
- **2024 booklet:**
  - "ca. 4½ min" after "ca. 10 sekunder"
  - "Hver af de to delprøver varer 5 minutter, inkl. instruktioner" (p. 3)
  - follow-ups "i den udstrækning, eksaminator vurderer, det er nødvendigt"
  - "Efter ca. 4½ minut siger eksaminator: 'Tak, så er prøven forbi.'" (p. 5)
- **2019 booklet:** no split either.
- **The booklet's own table** (booklet:225–235) says it is an estimate that isn't in the official booklet.

**What the app should use:**
- **Exam conditions:** one overall clock (270 s), with no phase bands and no "move on" prompts. If the situation intro is played, the clock starts at the intro.
- **Practice mode:** an optional pacing aid, collapsed by default, with two coarse phases:
  - first question + follow-up: about 2 min
  - general question + follow-up: about 2½ min
  - plus the booklet's 45–60 s per required answer
- **Label:** "An approximate split suggested by the booklet (Shery Rahimi). SIRI's examiner booklet gives only 'about 4½ minutes' in total." Never enforce it and never colour it.
- **The booklet's five-band table** may appear verbatim and attributed in the study method. Don't use it as live mock UI: its 0:00–0:10 band is too tight.

**Confidence:** high that no official split exists; medium on the presentation, which `ux-architect` owns.

### Q2 (OQ-4): the transition wording
**Answer:** there is no official sentence.
- **The 2024 booklet** (pp. 7, 9, 11) gives a stage direction, not a line to say: "Eksaminator informerer om, at der nu stilles et spørgsmål af en mere overordnet karakter."
- **The 2019 booklet** has no transition announcement at all. Whether the 2023 and 2013–2015 booklets have one is **(not verified)**.

**Recommended app sentence:** *"Nu vil jeg stille dig et spørgsmål af en mere overordnet karakter."*
- Alternative: *"Nu kommer der et spørgsmål af en mere overordnet karakter."*
- Label it as the app's own wording, based on SIRI's examiner instruction (D-8).
- In the guide, teach recognition: listen for *overordnet* or *generelt*.
- `danish-language-reviewer` confirms naturalness and TTS stress.

### Q3 (OQ-5): keep "Her er der to billeder…" word for word?
**Answer:** yes, keep it verbatim. It is SIRI's printed script (2024 booklet pp. 6, 8, 10; matches booklet:140):
"Her er der to billeder, som viser nogle situationer, der handler om emnet [X]. Du har nu 10 sekunder til at overveje emnet, og derefter vil jeg stille dig spørgsmål til én af situationerne."
- **On screen,** show a one-line Persian note during the intro and countdown. Draft: «در آزمون واقعی، به‌جای این کارت‌ها دو عکس می‌بینید.» ("In the real exam you see two pictures instead of these cards.")
- **Add the same point** to PRD §6.5.
- **Use the 2024 script for every topic.** Never use the 2019 picture-description script.
- **It may be called official wording,** citing the May–June 2024 booklet. Whether it is unchanged in later, confidential booklets is **(not verified)**.

### Q4 (OQ-6): do the 2016–2022 questions fit today's format?
**Answer:** yes, they can be used unchanged as mock questions.
- **The interview skeleton is the same in the 2019 booklet:** the examiner picks A or B, asks "Hvorfor tror du…?" with a follow-up, then "Hvilke fordele og ulemper…?" with a follow-up.
- **No question depends on the pictures.** Every "billede(r)" in the booklet is subject matter.

**Caveats:**
1. **Wording fidelity.** The pre-2024 text is not word for word SIRI's. In Nov–Dec 2019 Emne B:
   - "mennesker" and one "fx" are dropped (booklet:2417)
   - "fx" is dropped (booklet:2429)
   - "Hvorfor tror du ikke, de gør det?" becomes "Hvorfor tror du, de ikke gør det?" (booklet:2437)
2. **The app adds two steps these terms never had** (intro and transition), so the intros have to be written.
3. **Time-bound premises** (booklet:1397, 3347, 4133) work as discussion prompts. Whether any is now untrue is **(not verified)**.

**Unsuitable topics:** none found.

### Q5 (OQ-20): wording for asking for a repeat
**Answer:** teach *"Undskyld, vil du godt gentage spørgsmålet?"* as the main form.
- **It matches the examiners' register** ("Vil du godt forklare det lidt nærmere?").
- **Show the booklet's variant** *"Undskyld, vil du gentage spørgsmålet?"* (booklet:166, 333) as equally correct.
- **Relax US-032's "one wording everywhere":** the repeat control uses one wording, and the toolbox shows the booklet's as a variant.
- **Replay behaviour matches the Huskeliste:** "Forstår prøvedeltager ikke spørgsmålet, skal det gentages med ca. samme ordlyd, inden man eventuelt vælger at omformulere." This applies to follow-ups too.

### Q6: could the appendix ever be used for mock exams?
**What it contains:**
- **18 complete topics, May–June 2013 to Nov–Dec 2015** (6 terms × A/B/C). For situation A, situation B and the general question, each has:
  - the Danish question with a Persian translation
  - 3 key words
  - one follow-up in Danish only, **without** a Persian translation or an answer
- **What's missing:** situation descriptions, model answers, follow-up answers and personal examples.
- **2004–2012:** a table of titles only (booklet:5780–5809), from the paired-exam era, so never usable for mocks.

**Verdict:** structurally usable, but it would need:
- card text written by us
- a "no model answer" review state
- Persian for the follow-ups
- a wording check

**Recommendation:** keep D-3's exclusion for v1. A later option is a "questions only" practice set.

### Q7 (D-15): is there any basis for "more likely to come up again"?
**Answer:** no official basis.
- **The SIRI practical guide (October 2026) §2.7:** confidential tasks from winter 2024 onwards go into a closed bank and are reused. Material from summer 2024 and earlier "fortsat gerne må anvendes i undervisning, idet det ikke er fortroligt".
- **The same guide, §2.8.2:** delprøve 2 material reaches examiners as three-topic sheets per exam day.
- **The September 2024 consultation letter** proposed widening the unprepared part from 3 to about 20 questions. Whether that was implemented is **(not verified)**.
- **The booklet's "recurring" rows** are often only similar, not identical (booklet:563 vs 727).

**What the app can honestly say (its own copy):**
- Since winter 2024 SIRI reuses confidential tasks, and nobody outside knows the bank.
- The app's questions come from published exams up to May–June 2024, which SIRI says may be used for teaching.
- Some similar questions came up in more than one of those exams, so studying them is efficient because the same ideas cover several topics. It is not a prediction.

**Leave out** booklet:54 (the prediction) and booklet:4885 (memorise one answer for all recurring questions).

---

## 2. Findings

### Blockers

**B1. A booklet note reveals a confidential 2026 exam topic.**
- **Where:** booklet:1689 (`t-M24B`): «⭐ همین موضوع (نیروی کار خارجی) در Skriftlig 2026 هم آمد…» ("the same topic, foreign labour, also came up in the 2026 written exam"). The specs don't stop it being published:
  - PRD §6.6 doesn't exclude per-topic notes
  - GA-14 says booklet text is shown exactly
  - the US-064 guard checks only term labels
- **What's wrong:** it discloses confidential post-2024 exam content (practical guide §2.7; ABOUT §5–6; PRD §5.1 non-goal), and it reads as a prediction.
- **Fix:**
  - Exclude all booklet margin notes (⭐ 🔁 📌) unless each is reviewed individually.
  - Add a validation rule flagging any year ≥ 2025, or "Skriftlig/Mundtlig 20xx" after May–June 2024, in any field.
  - Add a "booklet notes" item to PRD §6.6 under "not in v1 unless reviewed".

**B2. The mock leaves out the examiner's situation intro.**
- **Where:**
  - PRD §6.3 row 3 (no intro), while §6.5 claims "the examiner introduces the situation out loud"
  - US-030 #1–2
  - US-027 #4 (no intro clip)
  - no intro field in §6.6
- **What's wrong:** the official sequence requires it. 2024 booklet p. 5: "Inden første obligatoriske spørgsmål introducerer eksaminator fokus i spørgsmålet ved i en eller to sætninger at beskrive situationen…". Each topic has a "Forslag til indledning", e.g. "Situation A viser en sygeplejerske, der har ansvar for mange patienter og har travlt."
- **Fix:**
  - Add an `intro` field per situation.
  - **2024:** SIRI's text verbatim. **2023:** SIRI's, if those booklets can be found. **2016–2022:** one sentence written by us from the booklet's description, labelled as ours (D-8) and reviewed by `danish-language-reviewer`.
  - Add the clip to US-027 #4, play it before the question in US-030, and let a repeat replay the question (optionally the intro too).
  - **Owner decision (2026-11-18):** write them.

### Should fix

**S1. "Official wording" is claimed for every question, but only the 2024 set is verified.**
- **Where:**
  - US-030 #2, US-034 #1, US-017
  - PRD §2.2, §6.1, §6.3 rows 4–6, §6.6
  - DL-020
  - concept.md
- **What's wrong:** the booklet says only May–June 2024 was compared word for word (booklet:38), and there are differences in Nov–Dec 2019.
- **Fix:**
  - Say "the question as given in the booklet (from SIRI's examiner booklets)".
  - Add a per-question `verifiedAgainstSiri` field, and show "official wording" only where it's true.
  - Use "suggested follow-up" (*forslag til opfølgende spørgsmål*).
  - Check further terms against public SIRI booklets and record differences as corrections (OQ-17).
  - **Owner decision (2026-11-18):** verify.

**S2. The transition is presented as official wording.**
- **Where:** PRD §6.3 row 5, US-034 #1, OQ-4.
- **Fix:** reword as "SIRI instructs the examiner to announce *et spørgsmål af en mere overordnet karakter*", and adopt the Q2 sentence labelled as the app's own.

**S3. SIRI's scripted lines are classed as content we write.**
- **Where:** PRD §6.6 "Content we write", US-002 #4, DL-031.
- **What's wrong:** the intro and the closing phrase are SIRI's verbatim scripts. Only the transition and *"Tak."* between answers are ours.
- **Fix:** classify the intro and closing as verified SIRI wording, and label the transition and *"Tak."* as the app's own. Resolve OQ-5 and DL-031 as in Q3.

**S4. The "recurred" claims overstate identity, and the US-007 framing implies prediction.**
- **Where:** PRD §6.7 row 2; US-007 #1–2 ("so that I can prioritise them"); the booklet's 🔁 notes.
- **Fix:**
  - Say "a similar question came up in more than one published exam (2016–2024)".
  - Give the honest reason: one set of ideas covers several topics.
  - Use the app's own neutral links, and don't show booklet:4885.

**S5. The assessment criteria are incomplete in the guide spec.**
- **Where:** US-001 #5, US-042 #1.
- **What's wrong:** the guide leaves out the language-quality part of pkt. 3.40: "udtrykke sig sammenhængende i et forholdsvis nuanceret og situationstilpasset sprog med en forholdsvis høj grad af kompleksitet og korrekthed".
- **Fix:**
  - Add it in plain Persian.
  - Add self-check items such as "I linked my ideas (fordi, derfor, men, alt i alt)" and "I kept going (I used a rescue phrase instead of stopping)".

**S6. The appendix is mislabelled "2004–2015".**
- **Where:**
  - PRD §2.2, §5.2, §6.6, D-3, K12, OQ-6
  - US-009 #6, US-064 #5
  - DL-029, DL-041
- **Fix:** say "18 topics from 2013–2015 (plus a list of 2004–2012 titles only)", and close OQ-6(b) with the Q6 answer.

### Suggestions
1. ***"Tak."* between answers** is an app convention, not a rule. The Huskeliste is about saying "tak" rather than "fint" so as not to signal success.
2. **Unmarked draw cards.** The SIRI practical guide §4.3.5 says the slips must carry no numbers or other marks on the side the candidate sees. Use three identical, unlabelled cards (accessible names such as "card 1 of 3"), and reveal the letter and topic on tap. This affects US-028 #1 and #7 and PRD §6.3 row 1.
3. **An optional delprøve 2 instruction** before the draw (the examiner says the task takes about 5 minutes; 2024 booklet p. 5), labelled as the app's own.
4. **Soften the hard stop at 270 s** (US-035 #2): add a short grace period in config, for example end at the next "Done" or after about 15–20 s, in the spirit of "undlade at afbryde".
5. **Add two points to the guide** (US-001 #4):
   - If you can't answer a required question, the examiner makes that clear before moving on. Link the rescue sentence *"Det har jeg ikke tænkt så meget over før, men jeg tror, at …"*.
   - There are no notes in delprøve 2 (practical guide §4.3.5).
6. **List the text cards** as a deliberate difference in PRD §6.5: they give a written Danish cue that real pictures don't.
7. **Strengthen the about page** (US-058 #2) with SIRI's statement that material from summer 2024 and earlier may be used in teaching (practical guide §2.7).
8. **Expand the pre-2023 label explanation** (US-009 #3): those terms had the same two-required-question structure after the description.
9. **Delprøve 1 facts, if the guide mentions it now:**
   - the topic is set by the teacher and approved by the head of school, not chosen by the learner
   - handed out 24 Nov 2026 this term
   - about 2 minutes, "hverken kortere eller længere", then about 2½ minutes of questions
   - one A4 page of notes for the presentation only, and no script
10. **Gaps in ABOUT_PD3_MUNDTLIG.md** (for the owner):
    - delprøve 2 material arrives per exam day as three-topic sheets
    - the "summer 2024 and earlier may be used in teaching" statement
    - the September 2024 "3 → ca. 20" proposal **(not verified)**
    - the 2019 format had no transition announcement
    - the Huskeliste is now dated April 2026

---

## 3. Verified as correct
- **The delprøve 2 format:**
  - draw 1 of 3
  - about 10 s
  - about 4½ min
  - two required questions with follow-ups
  - the examiner picks one situation
  - the closing phrase

  (2024 booklet pp. 3–11; BEK 1687/2025 bilag 1 pkt. 3.38–3.39; ABOUT §3.4)
- **No picture description is presented as part of today's exam.**
- **The intro script and closing phrase** match the 2024 booklet word for word.
- **All 9 required questions and 6 follow-ups of May–June 2024** match SIRI word for word.
- **Examiner behaviour in US-001 #4:**
  - repeats before rephrasing
  - asks harder follow-ups
  - doesn't correct or translate
  - asks no knowledge questions
  - accepts pauses
- **The four follow-up types in US-003.**
- **Repeat replays the same audio,** and the clock keeps running in exam conditions.
- **The pass rule:** an average of at least 2.0 with the oral counted double (BEK 1687/2025 § 48, stk. 2). The 7-point scale is correct. The grade is given straight after grading.
- **No recording in the real exam,** as noted in §6.5.
- **The claims policy** is consistent (GA-10, US-035 #4, US-041 #6, US-042 #3, K4, DL-011, DL-026).
- **Confidentiality** from winter 2024; the latest public set is May–June 2024; the US-064 term guard.
- **Counts:** 17 terms × 3 = 51 topics; 9 in the current format; 42 pre-2023.
- **Nurse authorisation:** at least 10 in oral, 7 in reading and 7 in writing, since 1 July 2025.
- **D-15's recommendation** to leave out the prediction sentence.

## Sources
- [SIRI, Censor- og eksaminatorhæfte PD3 mundtlig, May–June 2024](https://danskogproever.dk/media/prob2ifo/censor-og-eksaminatorhaefte-pd3-mdt.pdf)
- [SIRI, Censor- og eksaminatorhæfte PD3 mundtlig, Nov–Dec 2019 (hosted on sokolova.dk)](https://sokolova.dk/2019-nov-censor-mundtlig.pdf)
- [SIRI, Huskeliste til eksaminator og censor (April 2026)](https://danskogproever.dk/media/spjba3cd/huskeliste-til-eksaminator-og-censor-ved-den-mundtlige-proeve.pdf)
- [SIRI, Vejledning om den praktiske prøveafholdelse (October 2026)](https://danskogproever.dk/media/yqxa0zdu/vejledning-om-den-praktiske-proeveafholdelse-okt-2026.pdf)
- [BEK nr. 1687 af 16/12/2025](https://www.retsinformation.dk/eli/lta/2025/1687)
- [UIM consultation letter, 9 September 2024](https://prodstoragehoeringspo.blob.core.windows.net/a2ed38f4-5906-4981-9046-0e27583014b0/H%C3%B8ringsbrev.pdf)
- [Danish Patient Safety Authority, language test for nurses from outside the EU/EEA](https://en.stps.dk/health-professionals-and-authorities/registration-of-healthcare-professionals/nurse/non-eu-countries/language-test)
