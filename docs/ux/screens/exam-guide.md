# Screen: Exam guide (delprøve 2), with its sub-pages

| | |
|---|---|
| **Routes** | `/fa/guide/delproeve-2` (main), `/fa/guide` (overview), `/fa/guide/delproeve-2/phrases`, `/fa/guide/delproeve-2/follow-up-types`, `/fa/guide/study-method` |
| **Stories** | US-001 (Must), US-002, US-003, US-004 (Should), US-058, US-009 #3, US-067 |
| **Content** | App-authored guide content (schema §11.5, `guide/*.json`, origin `app`, reviewed by `pd3-exam-expert`), written from ABOUT_PD3_MUNDTLIG.md (DL-016, DL-043). Long-form guide text is **content**, not interface messages. |
| **Flows** | [first-visit](../flows/first-visit.md) |
| **Milestone** | M1 (main guide), M3 (sub-pages) |

## Purpose

Make delprøve 2 predictable: what happens, in what order, how long, what the examiner will and won't do, what is assessed, and that the app gives no grade (G1, H1).

## Content hierarchy: `/fa/guide/delproeve-2`

1. Back link (when entered from somewhere other than the tab) · `h1` "How delprøve 2 works" · last-checked date (US-001 #8)
2. **In one sentence:** an unprepared conversation of about 4½ minutes on a topic you draw (US-001). Directly beneath, the most calming fact (rev. 2, walkthrough A2): "If you don't understand a question, you may ask for a repeat. The examiner must repeat a required question." with the repeat phrase and its play button.
2a. **Every Danish word or phrase in the guide gets a Persian gloss** beside it (e.g. *overordnet* «کلی‌تر», *generelt* «به‌طور کلی»), and the three examiner lines (intro, transition, closing) and the repeat phrase get **inline play buttons** that load on tap (rev. 2, R-20). Their audio ships with the mock exam (M2), not M3 (story update for the PM).
3. Contents (fragment links)
4. **`#steps` The steps** (US-001 #1): a numbered StepList, seven steps. Danish phrases inside steps (*"Hvorfor tror du, …?"*, *overordnet*, *generelt*, *"Tak, så er prøven forbi."*) are isolated. Steps 2 and 3 carry one-line Persian notes: "the real exam shows two pictures; the app shows text cards" and "the examiner introduces the chosen situation in one or two sentences".
5. **`#timeline` The timeline** (US-001 #2): a horizontal sequence (vertical on phones) reading in the interface direction: draw → about 10 s look → about 4½ min of questions → "Tak, så er prøven forbi." All durations "about". No split of the 4½ minutes.
6. **No picture description any more** (US-001 #3): one short paragraph.
7. **`#examiner` What the examiner does and doesn't do** (US-001 #4): two short lists; each item one line. Includes (rev. 2.1, exam review S3, decided by delegation, 2026-11-20): "The examiner may word the situation intro and the follow-up questions differently from the examples in this app. Practise understanding the question, not memorising its wording." Links: the rescue sentence → toolbox; the repeat request → examiner phrases.
8. **`#assessment` What is assessed** (US-001 #5): three plain-Persian points, including speaking coherently in fairly nuanced language. Optional: the BEK quote in Danish, attributed, collapsed.
9. **`#grade` The grade** (US-001 #6): one oral grade on the 7-point scale, counts double; PD3 is passed at an average of at least 2.0; **this app doesn't and can't give a grade**.
10. **Where delprøve 2 fits** (US-001 #7): within the 15-minute oral, after delprøve 1; "the app doesn't cover delprøve 1 yet" → `/fa/guide`.
11. **More** (cards): Examiner phrases (US-002) · Four follow-up types (US-003) · How to study (US-004)
12. **Next:** "Study a topic" · "Try a practice mock exam"
13. **`#sources` Sources:** link to SIRI's official candidate page; the link says it opens an external site (US-001 #8); "Not affiliated with SIRI" (US-058).

## Sub-pages

| Page | Content | Story |
|---|---|---|
| `/fa/guide` (overview) | The 15-minute oral in order (table from ABOUT §3.2), delprøve 1 "coming later" with only the facts US-001 #7 allows (each date with its last-checked date), link to the delprøve 2 guide | US-001 #7; IA §8 |
| `/phrases` | **Examiner lines**: SIRI's intro line, the transition (with the tip: listen for *overordnet* or *generelt*), SIRI's closing line. Each: examiner-voice audio, Danish text, Persian meaning, **source label** ("SIRI's wording (examiner booklet May–June 2024)" / "the app's wording, based on SIRI's instruction to the examiner"). **Candidate phrases** (model voice), marked as suggestions: the repeat request (and the booklet's variant as equally correct), gaining time. | US-002 |
| `/follow-up-types` | The four types: *opklarende*, *uddybende*, *forklaring og begrundelse*, *stillingtagen og argumentation*; each with a Persian explanation, SIRI's example wording (Danish, attributed), and a link to the template or toolbox phrases that help; a note that delprøve 2 assesses answering these kinds of question | US-003 |
| `/fa/guide/study-method` | The booklet's method, steps 1–4, credited to the author; each step links to the feature that does it; presented as a suggestion; **step 5 is not shown** (D-15), replaced by our sentence linking to similar questions without any likelihood claim; the per-topic note for step 4 (D-22, US-047 #2); optionally the booklet's time-split table, verbatim and attributed, with the note that SIRI gives only "about 4½ minutes" | US-004 |

## Components

PageHeader, LastChecked, ContentsList, StepList, Timeline, InfoNote, Disclosure (BEK quote), PhraseItem (examiner and candidate variants), SourceLabel, PlayButton, NextStepsCard, ExternalLink, CreditLine.

## States

| State | Behaviour |
|---|---|
| First-time | Same page; the guide is itself the orientation. |
| Loading | Text-first; the main page's few inline play buttons load audio only when tapped (rev. 2, R-20). |
| Empty | Not applicable (static content). If the guide content fails validation at build time, the build fails; there is no runtime empty state. |
| Error | E1 full-page error. |
| Slow network | Text only on the main page; phrases page loads audio per tap. |
| Microphone denied | Not applicable. |
| Storage unavailable | Not applicable. |
| Audio fails (phrases) | Per-item retry; text stays (US-062). |

## Responsive behaviour

| Width | Layout |
|---|---|
| 375 | Single column. Timeline vertical (top to bottom). Contents list collapsed into a Disclosure "On this page". |
| 768 | Single column; timeline horizontal if it fits at default text size, else vertical. |
| 1280 | Reading column at a comfortable measure; contents list as a sticky side list on the start side (right); timeline horizontal. |

## RTL and bidi

- Persian body; every Danish phrase isolated with `lang="da"` (US-052 #2), for example «سؤال اول اغلب با <bdi lang="da">Hvorfor tror du</bdi> شروع می‌شود.»
- **The timeline reads right to left** (it's a sequence of steps, not an audio bar; US-001 #2). Its connecting arrows mirror. Durations ("about 10 s", "about 4½ min") are Persian with Persian digits (D-2); "4½" uses the locale's formatter.
- External-link icon mirrors (it points towards the inline end).
- Phrases page: each Danish line is a block (`dir="ltr"`); Persian meaning beneath it.

## Accessibility

- `h1` per page; `h2` per section; StepList is an ordered list; Timeline is an ordered list with visible text for each segment (not a picture); its visual connectors are decorative.
- Focus on route change to `h1`. Fragment links move focus to the target heading.
- Phrase audio buttons: accessible name "Play: {Persian meaning}" with the Danish text as the description; only one plays at a time.
- External link's accessible name says it opens an external site (US-001 #8).
- No timing, no live regions.

## Copy needs

Guide **body** is content (`guide/*.json`). Interface keys:

| Key | Intended meaning |
|---|---|
| `guide.title` | How delprøve 2 works |
| `guide.lastChecked` | Last checked: {date} |
| `guide.onThisPage` | On this page |
| `guide.section.steps` / `.timeline` / `.examiner` / `.assessment` / `.grade` / `.fits` / `.sources` | Section headings |
| `guide.timeline.look` | About {seconds} seconds to look |
| `guide.timeline.questions` | About {minutes} minutes of questions |
| `guide.noGrade` | This app doesn't give, and can't give, a grade. |
| `guide.repeatAllowed` | If you don't understand a question, you may ask for a repeat. The examiner must repeat a required question. |
| `guide.siriSpelledOut` | SIRI (Styrelsen for International Rekruttering og Integration), the Danish authority that runs the exam |
| `common.playDanish` | Play: {meaning} (names an inline play button for a Danish term) |
| `guide.more.phrases` / `.followUpTypes` / `.studyMethod` | Examiner phrases · Four kinds of follow-up question · How to study |
| `guide.next.topics` / `.mock` | Study a topic · Try a practice mock exam |
| `guide.externalLink` | {label} (opens an external site) |
| `labels.source.siri` | SIRI's wording ({document}) — intro line, closing, verified required questions |
| `labels.source.siriSuggested` | SIRI's suggested wording ({document}) — situation intros and suggested follow-ups (rev. 2.1) |
| `guide.examiner.mayReword` | The examiner may word the situation intro and the follow-up questions differently. Practise understanding, not memorising. |
| `labels.source.app` | The app's wording |
| `labels.source.appBasedOnSiri` | The app's wording, based on SIRI's instruction to the examiner |
| `labels.suggestion` | A suggestion, not required wording |
| `studyMethod.credit` | From the booklet by {author} |
| `studyMethod.perTopic` | The booklet suggests reviewing each chapter on day 1, 3, 7 and 14. The app applies the same days to each topic. |
| `studyMethod.similarInstead` | Some similar questions came up in more than one published exam. Studying them together is efficient. |
| `studyMethod.timeSplitNote` | An approximate split suggested by the booklet. SIRI's examiner booklet gives only "about 4½ minutes" in total. |

## Wireframes

**375 px, `/fa/guide/delproeve-2`**
```
┌─────────────────────────────────────┐
│ [≡]                        App name │
├─────────────────────────────────────┤
│        How [da: delprøve 2] works   │ h1
│              Last checked: 17 Nov   │
│ ▾ On this page                      │
│ An unprepared talk of about 4½ min  │
│              on a topic you draw.   │
│                          The steps  │ h2
│  1. Draw topic A, B or C (identical │
│     slips)                          │
│  2. About 10 s to look at two       │
│     situations ⓘ real exam: pictures│
│  3. Examiner introduces ONE         │
│     situation, asks the first       │
│     question, often                 │
│     [da: Hvorfor tror du, …?]       │
│  4. Follow-up questions             │
│  5. "A more general question" —     │
│     listen for [da: overordnet] [▶] │
│     («more general»)                │
│  6. More follow-ups                 │
│  7. [da: Tak, så er prøven forbi.]  │
│                       The timeline  │ h2
│            ● Draw                   │
│            │                        │
│            ● ~10 s look             │
│            │                        │
│            ● ~4½ min questions      │
│            │                        │
│            ● "Tak, så er …"         │
│   … examiner · assessment · grade … │
│ ┌─────────────────────────────────┐ │
│ │ ‹ Next: Try a practice mock     │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ •Guide Templates [Mock] Topics Home │
└─────────────────────────────────────┘
```

**1280 px, timeline horizontal (reads right to left)**
```
   "Tak, så er prøven forbi." ◄── ~4½ min questions ◄── ~10 s look ◄── Draw A/B/C
```

**375 px, phrases page item**
```
┌─────────────────────────────────────┐
│ Examiner line · SIRI's wording      │
│ (examiner booklet May–June 2024)    │
│ [▶]                                 │
│ [da: Tak, så er prøven forbi.]      │
│            Thanks, the exam is over │
└─────────────────────────────────────┘
```
