# Exam-fact review: exam guide (delprøve 2)

- **Reviewer:** `pd3-exam-expert`, 2026-11-22 (read-only; saved by the main thread).
- **Scope:** `src/features/exam-guide/`, the `guide` namespace in `messages/fa.json`, `content/examiner-lines.json`, and `/fa/guide` and `/fa/guide/delproeve-2`.
- **Result:** no blockers, 3 Should fix, 6 Suggestions.

## Should fix
- **S1. Special arrangements reads as a promise** (`guide.fits.arrangements`). Reword:
  - you can **apply in writing** to the head of your school for special arrangements (for example extra time or a separate room), at least 8 weeks before the exam term, with an expert statement if needed
  - the school decides
  - the **winter 2026 deadline has passed**; ask about May–June 2027
  - optionally: the same grading criteria apply (§ 29), and the certificate doesn't mention it (§ 51(4))
  - link the exam order and SIRI's practical guide § 3
- **S2. Some facts have no source on screen.** Add links for:
  - examiner behaviour → the Huskeliste (`https://danskogproever.dk/media/spjba3cd/huskeliste-til-eksaminator-og-censor-ved-den-mundtlige-proeve.pdf`)
  - assessment criteria → BEK 1687/2025, bilag 1, pkt. 3.40
  - no notes and unmarked slips → SIRI practical guide October 2026, § 4.3.5 (`https://danskogproever.dk/media/yqxa0zdu/vejledning-om-den-praktiske-proeveafholdelse-okt-2026.pdf`)
  - put the URLs in `exam-facts.ts`
- **S3. The "last checked" date (2026-11-17) is older than some of the facts shown** (the §10 addenda of 19 and 21 November). Set it to the date this review is accepted.

## Suggestions
1. **`steps.first`:** "usually ends with *Hvorfor tror du*" is too strong. Use «سؤال اول اغلب یک سؤال <da>Hvorfor tror du, …?</da> است».
2. **`steps.second`:** add the Danish cue *"Hvilke fordele og ulemper mener du, der kan være ved …?"*.
3. **Add two facts:** the grade is holistic and the detailed criteria aren't public; 2.0 can't be reached by rounding (1.9 fails).
4. **The pass-rule citation "BEK 1687/2025 § 48, stk. 2"** is **not verified** (retsinformation needs JavaScript). Confirm it, or drop the paragraph number.
5. **`overview.partOneTopic`:** the *examiner* sets the topic (preferably not your own teacher), and you **can't choose or request** it.
6. **Code:**
   - the "no notes" comment cites §3.2; it should cite §3.3 and §10
   - `conversationWholeMinutes = 4` with a hard-coded «و نیم» is fragile; use one value

## Verified as correct
- **The sequence and ~4½ min** with no official split; the 15-minute frame.
- **No picture description** is presented as current.
- **The intro and closing lines** are SIRI's verbatim and attributed; the transition is labelled as the app's own.
- **Examiner behaviour:** repeat before rephrasing, *tak* not *fint*, no corrections or knowledge questions, pauses accepted.
- **The repeat-request wording.**
- **The four follow-up types.**
- **The assessment criteria,** including language quality.
- **The grade scale and pass rule:** oral counted double, average ≥ 2.0.
- **No notes in delprøve 2.**
- **No grade prediction, and no "official" claims** about the app.
- **The examiner-line records.**
