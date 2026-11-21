# Danish review: May–June 2024 pilot and the app's own Danish lines

- **Reviewer:** `danish-language-reviewer`, 2026-11-20 (read-only; the main thread saved this report).
- **Scope:**
  - `content/topics/2024-maj-{a,b,c}.json`
  - `content/examiner-lines.json`
  - `messages/fa.json`
  - `src/lib/exam/config.ts`
  - the UX sound-check line

## Summary
- **Fidelity is clean.** Every booklet text matches word for word, and the SIRI questions, follow-ups and intros match SIRI. Nothing is wrong in the SIRI text.
- **No outright errors in the booklet's Danish.** The findings below are naturalness and coherence points. They go **next to** the author's text as notes, never over it.
- **Commas:** a comma before every subordinate clause, used consistently.
- **DL-050 is confirmed:** *"Nu vil jeg stille dig et spørgsmål af en mere overordnet karakter."* is correct and acceptable for an examiner.
  - A simpler variant, *"Nu vil jeg stille dig et mere overordnet spørgsmål."*, is optional; keep the current line.
  - Check the TTS stress on **o**verordnet and kara**kter**.
- **"Tak."** is correct. For audio, generate several takes and pick a neutral, friendly one. Optionally use `<prosody rate="-5%">`.
- **examiner.intro and closing:** verbatim SIRI, correct.
  - Display note: write `{topic}` in lower case mid-sentence, or put it in quotes. This doesn't affect audio.
- **Repeat request** (*"Undskyld, vil du godt gentage spørgsmålet?"*) is confirmed, with the booklet variant as equally correct.
  - Content idea: also teach *"Undskyld, kan du sige det igen?"* and *"Undskyld, hvad mener du med …?"*.

## Should fix (app-owned)
- **UX-OQ-10, the sound-check line:** use *"Hej, og velkommen til prøven."*
  - Optionally longer, for setting volume: *"Hej, og velkommen til prøven. Kan du høre mig godt?"*
- **`messages/fa.json` `home.intro`:** the copy says the first question often **begins** with *Hvorfor tror du*.
  - In all six pilot questions, a statement comes first and *"Hvorfor tror du, …?"* **ends** the question.
  - Fix the Persian to say "ends with", and show it as *Hvorfor tror du, …?* (`persian-localization-reviewer` handles the wording).

## Notes alongside the author's text (never overwrite)
- **a.general.q2.answer:**
  - *"at mange turister kommer"* → *"at der kommer mange turister, som …"* (the *der* construction)
  - *"stolte og inspireret"*: mixed forms, acceptable
  - *"kunne i stedet bruges"*: makes the contrast clearer
- **a.sitB.q1.answer:**
  - the conclusion should sum up the reasons given: *"økonomi, sprog og identitet"*
  - *"…på billetterne alene"*
- **a.sitB.followup1.answer:** *"gode film af mange forskellige slags"*.
- **a.sitA.q1.answer:** *"resten af livet"*.
- **a.general.followup1.answer:** *"give penge i kassen"* (optional).
- **b.sitB.q1.answer:**
  - *lav status* appears in the conclusion but not in the body
  - *"bliver der bygget"* instead of *"bygges der"*
- **b.general.followup1.answer:** *"brug for, for eksempel"* is hard to say and to hear; split it into two sentences.
- **b.sitA.q1.answer:** *"flere og flere ældre"*.
- **b.general.q2.answer:** *"selv uddanne"* (optional).
- **c.sitA.q1.answer:** *"blandt andet på grund af skærme"*.
- **c.sitB.followup1.answer:** *"deres børn"* (optional).
- **c.general.q2.answer:** *"lærer de begge noget"*.
- **c.sitB.q1.answer:** *"uden at føle sig presset"* (optional).

## Ideas for teaching (content, not defects)
1. Adverb before the verb in subordinate clauses: *så de ikke keder sig*, *at vi ofte har travlt*.
2. V2 after a fronted element: *For det første er …*, *Hvis niveauet bliver for lavt, kan det …*.
3. Formal subject *der*: *Der mangler arbejdskraft*.
4. Stranded preposition: *Det kan der være flere grunde til.* This opens six answers; drill it.
5. *så* as a conjunction or an adverb, with the matching word order.
6. *sin* or *deres*: *undervise alle på deres niveau*.
7. Prepositions in set phrases: *glad for*, *brug for*, *svært ved*, *i forhold til*, *går ud over*.
8. en/et nouns.
9. *Ja, det synes jeg / Ja, det mener jeg* as an opener for follow-up answers.
10. Plural adjective agreement.

## TTS hints (SSML only; the display text stays unchanged)

| Where | Text | SSML |
|---|---|---|
| a.sitA.q1, a.general.followup1, b.sitA.q1, b.sitB.q1 | `fx` | `<sub alias="for eksempel">fx</sub>` |
| a.sitA/sitB/general.followup1, b.general.followup1 | `Hvorfor?/Hvorfor ikke?` | `<sub alias="Hvorfor, eller hvorfor ikke?">…</sub>`, or play only *"Hvorfor?"* (ask `pd3-exam-expert`) |
| a.general.followup1 | en dash before `fx` | `<break time="250ms"/>` |
| examiner.intro | `10 sekunder` | `<sub alias="ti sekunder">` |
| b.sitA.q1, b.sitA.followup1 | `social- og sundhedsassistenter` | if it stumbles: `<sub alias="social og sundhedsassistenter">` |
| b.sitB.q1 | `jord- og betonarbejdere` | if needed: `<sub alias="jord og betonarbejdere">` |
| examiner.transition | `overordnet` | fallback: `<phoneme alphabet="ipa" ph="ˈɒwɐˌɒːˀdnəð">` (`<emphasis>` isn't supported for da-DK) |
| c.sitB.followup1.answer | `feedback` | if mispronounced: `<sub alias="fiidbæk">` |
| situation titles, if ever voiced | parentheses | `<break time="200ms"/>` |
| anywhere PD3 is voiced | `PD3` | `<sub alias="pe de tre">` |

**Not present in the pilot:** quotation marks, f.eks., bl.a., ca., osv., mv., pga., and years. The answers write out *for eksempel*; keep that style.
