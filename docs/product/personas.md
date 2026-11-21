# Personas

| | |
|---|---|
| **Status** | Draft for owner review. **Not yet validated with real learners.** |
| **Date** | 2026-11-18 |
| **Author** | `product-manager` agent |
| **Used by** | [prd.md](prd.md), [user-stories.md](user-stories.md), the `learner-persona` agent (which prefers this file over its built-in personas) |

These three personas match the names the `learner-persona` agent already uses, so walkthroughs stay consistent. They are **tools for making decisions, not facts about users.** Every detail is tagged with its basis.

| Tag | Meaning |
|---|---|
| **[E]** | **Evidence:** a documented source, cited |
| **[O]** | **Owner insight:** from the 18 Nov 2026 brainstorm. Plausible, but not yet checked with learners. |
| **[A]** | **Assumption:** the product manager's inference, made to keep the persona concrete. Must be validated. |

Quotes are **illustrative**, written to capture the persona. They are not quotes from real people.

---

## Shared context (true for all three)

| Detail | Basis |
|---|---|
| PD3 is at B2 level and is the final exam after module 5 of Danskuddannelse 3 | [E] ABOUT_PD3_MUNDTLIG.md §1 |
| Delprøve 2: draw 1 of 3 topics, about 10 s to look, about 4½ min of questions, two required questions plus follow-ups | [E] §1, §3.4 |
| Listening is part of the oral grade | [E] §1, §4.1 |
| The oral grade counts double. PD3 is passed at an average of at least 2.0, with no rounding up. | [E] §4.3 |
| Oral exams happen twice a year (Nov–Dec and May–June) | [E] §2 |
| Exam material has been confidential since winter 2024. The published sets up to May–June 2024 are the latest public practice material. | [E] §5, §6 |
| The booklet is distributed through a Telegram channel for Persian-speaking nurses migrating to Denmark. Its ready-made personal examples are written from the perspective of "a nurse and immigrant". | [E] the booklet ([PD3_Mundtlig_Delproeve2.md](../resources/PD3_Mundtlig_Delproeve2.md), legend of symbols) and its channel |
| The booklet covers 51 topics from 2016–2024, of which only 9 are in the current format (May–June 2023 onwards) | [E] the booklet; §6 |
| **Nurses who are citizens of, or educated in, countries outside the EU/EEA** need PD3 with at least **10 in oral communication**, 7 in reading and 7 in writing, for Danish authorisation (from 1 July 2025) | [E] [Danish Patient Safety Authority, "Language test"](https://en.stps.dk/health-professionals-and-authorities/registration-of-healthcare-professionals/nurse/non-eu-countries/language-test), checked 2026-11-18. Re-check before using it in app copy. The app itself makes no claims about authorisation. |
| The audience includes Iranian and Afghan (Dari) backgrounds, mostly at B1+ to B2 | [O] |
| Many are working adults who study in short sessions on a phone | [O] |
| Many are anxious about speaking under time pressure | [O] |
| The community shares study material and links in Telegram groups | [E] for the booklet's own distribution; [A] as a general habit |

---

## Persona 1: Maryam, "I don't just need to pass. I need a 10."

**Primary persona.** She stands for the nurse segment the booklet was written for.

| Detail | Basis |
|---|---|
| 34, trained as a nurse in Iran, now in Denmark | [A] a persona construct; the nurse segment itself is [E] |
| Needs at least 10 in the oral for authorisation | [E] for nurses educated outside the EU/EEA (see above); [A] that Maryam is in exactly this situation |
| Danish at B1+/B2 | [O] |
| Studies on her phone in short breaks and on the bus. Confident with apps. | [O] for short phone sessions; [A] for the details |
| Her oral exam is about 3 weeks away | [A] |
| Very anxious about speaking under time pressure. Wants to feel "ready". | [O] for the anxiety; [A] for the details |
| Found the booklet through the Telegram channel and has studied parts of it | [A] |
| Persian (Iranian) at home | [A] |

**Goals**
- Run through the real delprøve 2 sequence many times, so that nothing surprises her.
- Give answers with depth (reasons, examples, both sides, a position), because a pass isn't enough for her.
- Handle hard follow-up questions without freezing.

**Frustrations and anxieties**
- She can't tell whether she's "good enough for a 10", and nobody is there to practise with.
- The booklet's model answers are deliberately simple. She suspects they're aimed at a pass, not a 10. ([E] the booklet's answers are pass-level by design; [A] that she notices this.)
- She has very little time between shifts.

**What she needs from the app**
- Exam conditions, with the full sequence and the clock (US-026, US-037).
- Follow-up practice (US-017, US-033) and templates for structure (US-021).
- Her own recordings next to the model answer, a self-check and answer lengths (US-041 to US-043).
- History, so she can see she has covered the themes (US-048).
- Honest labelling of the model answers, so she doesn't mistake a pass-level sample for her target (OQ-14).

**What would put her off**
- Fake grades or scores. She would know they're meaningless.
- Content errors in the Danish.
- Anything slow to start when she only has ten minutes.

**Product implications**
- Never imply that a model answer earns a particular grade (PRD §6.7).
- Depth comes from templates, follow-ups and the self-check, not from new content in v1. Richer answers aimed at a 10 are on the "not now" list, to be revisited with the author.

---

## Persona 2: Ahmad, "Just show me simply what will happen."

**Primary persona.** He stands for learners who are less confident readers, learn by listening, have a modest phone and limited data, and speak Dari.

| Detail | Basis |
|---|---|
| 46, from Afghanistan, Dari speaker | [O] for Afghan/Dari learners in the audience; [A] for the person |
| Danish at B1 | [O] for the range (B1+ to B2); [A] that he is at the lower end |
| Works shifts | [A] |
| Less confident reading long texts. Prefers to listen. | [A] |
| An older, small Android phone with limited mobile data | [A] |
| Put off by clutter and English words. Trusts things that look official and simple. | [A] |
| Needs to pass PD3 for his plans in Denmark | [A]. We make no claim about which residence or citizenship rules apply to him. |
| Reads standard Persian easily, but some Iranian expressions feel foreign | [A]; to validate (OQ-15) |

**Goals**
- Understand exactly what happens in the exam room.
- Understand the examiner's question, or know how to ask for a repeat.
- Have ready-made phrases so he never goes silent.
- Pass.

**Frustrations and anxieties**
- Fast spoken Danish, long texts, and screens full of options.
- Fear of not understanding the question at all.
- Data costs, and slow pages on his phone.

**What he needs from the app**
- The Persian exam guide and examiner phrases (US-001, US-002).
- Audio at 0.75× (US-015) and translation on request (US-013).
- The repeat phrase in the mock exam (US-032), and rescue sentences (US-022).
- Practice mode with pauses and hints (US-036).
- Light pages, with audio only on demand (US-061).
- A microphone that's optional (US-063).
- Large touch targets and simple navigation (GA-4).

**What would put him off**
- English words in the interface.
- Clutter.
- A permission prompt with no explanation.
- Anything that feels like a test he is failing.

**Product implications**
- Use plain, standard Persian that both Iranian and Dari readers understand (`.claude/rules/i18n-rtl.md`).
- Listening comes first.
- Use calm language (US-067).
- Practice mode is shown before exam conditions.

---

## Persona 3: Sara, "Show me that this matches the real exam."

**Secondary persona.** She stands for strong, sceptical learners who want efficiency and proof.

| Detail | Basis |
|---|---|
| 27, master's student in Denmark, from Iran | [A] |
| A strong reader, at B2 | [A] |
| Often studies on a laptop | [A] |
| Wants to drill efficiently and to check sources | [A] |
| Sceptical of low-quality material. Annoyed by hand-holding. | [A] |
| Needs PD3 for her plans in Denmark | [A]. We make no claim about which rules apply to her. |

**Goals**
- Cover many topics quickly.
- Be sure that the material and the mock exam match the current format.
- Test herself under real conditions.

**Frustrations**
- Unverifiable claims, long introductions and forced tutorials.
- Old material passed off as current.

**What she needs from the app**
- Browse by term, and search (US-006, US-008).
- Pre-2023 labels (US-009).
- Sources, and a "last checked" date (US-001, US-058).
- To see which questions are checked word for word against SIRI's examiner booklets, and which wording is the app's own (US-068).
- Exam conditions (US-037).
- Full keyboard use on a laptop (US-060).
- A way to report errors (US-065).

**What would put her off**
- Onboarding she can't skip.
- Vague claims such as "official" or "guaranteed".
- Content errors that go unacknowledged.

**Product implications**
- No forced onboarding: home offers starting points, not a tutorial (US-057).
- Show provenance everywhere (US-058).
- Desktop layouts matter even though the app is phone-first.

---

## Where their needs conflict, and how v1 resolves it

| Tension | Maryam | Ahmad | Sara | v1 resolution | Confidence |
|---|---|---|---|---|---|
| Persian translation shown or hidden | Hidden (push the Danish) | Shown (less effort) | Hidden | Hidden by default behind an obvious control (US-013). A default setting is a Could (US-055). | Medium; test in interviews |
| Exam conditions | Wants it | May find it frightening | Wants it | Both modes. Practice is shown first, and exam conditions is opt-in and explained up front (US-026). | Medium-high |
| Explanations and guidance | Some | A lot | Little | Short guide, progressive disclosure, no forced onboarding (US-001, US-057) | Medium |
| Model answer level | Wants more depth | Wants simple | Neutral | Show the booklet as it is, labelled honestly. Depth comes from templates and follow-ups. Richer content is "not now". | Medium |
| Device | Phone | Old Android phone | Laptop | Phone-first, with keyboard and desktop support as Must (US-060, US-061) | High |
| Digits | ? | ? | ? | Persian digits (D-2, decided 2026-11-18). Still show both in interviews; switching is one config value. | Medium |

---

## Who v1 is not for

- **Teachers and classes.** There are no class features.
- **PD2 and Studieprøven candidates.** They take different exams.
- **Delprøve 1 preparation.** It's planned for later.
- **Learners who don't read Persian.** They are served later through more interface languages.

---

## Validation plan

Cheap, quick and private. The owner runs it (OQ-16), ideally before UX design is finalised.

### 1. Five short interviews (20 minutes each, remote, in Persian)

**Recruiting:** through the community, for example the booklet's Telegram channel if the admin agrees. Aim for:
- at least 2 nurses
- at least 2 Afghan/Dari speakers
- at least 1 iPhone user and at least 1 user of an older Android phone
- at least 1 person who has already taken the PD3 oral

**Consent and notes:** ask for consent, and keep anonymised notes with no names.

**Questions:**
1. When is your oral exam? How long have you been preparing for delprøve 2?
2. How do you prepare today? Which materials do you use (the booklet, teachers, videos, groups)?
3. When, where and on what device do you study? How long is a typical session?
4. What worries you most about delprøve 2: understanding the question, finding words, the time, or something else?
5. Have you practised answering aloud with a timer, or recorded yourself? How did it feel?
6. What grade do you need, and why?
7. *(Show two screenshots.)* Which looks more natural to you: ۴:۳۰ or 4:30?
8. Would you rather see the Persian translation straight away, or try the Danish first?
9. *(Show the pre-2023 label.)* What do you understand from this?
10. What would make you trust, or distrust, a study app like this?
11. *(For Dari speakers)* Does this Persian text feel natural to you? Is anything strange?

### 2. Five usability sessions on a prototype (before M2 exits)

Tasks:
- After reading the guide, explain the steps of delprøve 2 (H1).
- Find a health topic and play its model answer more slowly.
- Answer one question aloud and compare with the model answer.
- Complete a mock exam under exam conditions on your own phone (H3), including at least 2 sessions on an iPhone.
- Find your recording again, and say one thing you'd improve (H5).

### 3. A voluntary survey after each exam term (five questions, anonymous)

1. Did you use the app before your exam?
2. How similar did the mock exam feel to the real one? (H4)
3. How helpful was the app?
4. What was missing?
5. Optionally, the oral grade you received. (We never use this to make claims about the app.)

### What would change our minds

| If we learn that… | We would… |
|---|---|
| Most learners study on laptops, not phones | Rebalance design effort towards desktop |
| Most won't record themselves, even when it's easy | Lead with listening and shadowing. Keep recording optional and lower in the layout. |
| Dari speakers find the interface unnatural | Run a dedicated localisation pass with a Dari-speaking reviewer (D-14) |
| Most learners need a 10, not a pass | Prioritise depth content (with the author) in the next release |
| Learners prefer Latin digits | Change the single digit-style config (US-053) |
| Text situation cards feel wrong without pictures | Revisit illustrations (D-4) |

---

## Sources

- [ABOUT_PD3_MUNDTLIG.md](../resources/ABOUT_PD3_MUNDTLIG.md), sections 1–6, checked 17 Nov 2026
- [Danish Patient Safety Authority: Language test (nurses, non-EU countries)](https://en.stps.dk/health-professionals-and-authorities/registration-of-healthcare-professionals/nurse/non-eu-countries/language-test), checked 2026-11-18
- The PRD brief's description of the source booklet and its distribution channel
- The concept brainstorm with the owner ([concept.md](concept.md)), 18 Nov 2026
