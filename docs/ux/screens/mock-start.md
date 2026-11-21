# Screen: Mock exam start (choose a mode)

| | |
|---|---|
| **Route** | `/fa/mock` |
| **Stories** | US-026 (Must, D-1), US-037 #2 (rules up front), US-038 #4 (reload notice), US-048 (history link), US-067 |
| **WCAG** | 2.2.1: the essential time limit is stated before starting, with practice as the adjustable alternative |
| **Flows** | [mock-exam-practice](../flows/mock-exam-practice.md), [mock-exam-exam-conditions](../flows/mock-exam-exam-conditions.md) |
| **Milestone** | M2 |

## Purpose

Let the learner choose between a relaxed practice run and a run under exam conditions, **knowing the rules before anything starts** (US-026).

## Content hierarchy

1. `h1` "Delprøve 2 mock exam"
2. One line: "The real sequence: draw a topic, 10 seconds to look, then about 4½ minutes of questions." + "What will happen?" → guide `#steps`
3. **Mode cards, practice first** (US-026 #2):
   - **Practice** (draft «تمرین»): pause any time · hints (translation, key words, template) · choose a topic or theme · no time limit · record an answer again (microphone optional). Button: "Start practice".
   - **Exam conditions** (draft «شرایط آزمون»): random topic · one continuous clock of about 4½ minutes · **can't be paused** · no hints · answers can't be re-recorded · you can leave at any time · "show text" stays available · **if a call or the screen interrupts, the exam stops and waits; it's marked "interrupted", not failed** (rev. 2, R-07) · **at the time limit your answer ends after a short notice that lets you finish your sentence** (rev. 2.2, a11y M7: stated before starting, WCAG 2.2.1). Line: "Prefer to take it slowly? Use practice." Button: "Start under exam conditions".
4. **What you'll need** (US-026 #4): about 5–6 minutes · a quiet place · sound on · a microphone if you want to hear yourself back (optional)
5. **No grade** (US-026 #5): "The app gives no grade. Afterwards you listen back and check yourself."
6. Link: "My past mock exams" → `/fa/progress#history` (only if any exist)

## Components

PageHeader, ModeCard ×2, RulesList, InfoNote, Link.

## States

| State | Behaviour |
|---|---|
| First-time | As above. |
| Loading | Static text. |
| Empty | Not applicable. |
| Error | E1. |
| Slow network | Text only. Nothing is preloaded here. |
| Microphone denied | Not asked here. The cards say the microphone is optional. |
| Storage unavailable | No history link. |
| After a lost attempt | If redirected here after a reload-lost attempt, an InfoNote at the top: "Your last mock exam stopped when the page reloaded, so it couldn't be kept." (E11) |
| After leaving an attempt | No message (the learner chose "Leave without saving"). |
| After back ended an attempt (fallback flag `endEarly`, R-02) | InfoNote: "Your mock exam ended when you went back. Your answers so far are saved." + **See my answers**; or "… Nothing was saved." if no answer had begun. |
| Content not ready for a draw (M1/M2 pilot) | If fewer than three published topics exist, exam conditions is unavailable with the reason "available when more topics are published"; practice with a chosen topic still works. |

## Responsive behaviour

| Width | Layout |
|---|---|
| 375 | Cards stacked, practice on top. Each card's button at its bottom (thumb reach while scrolling). |
| 768 | Cards side by side if each rules list fits without truncation; otherwise stacked. Practice on the start side (right). |
| 1280 | Side by side, practice on the right (start). "What you'll need" and "No grade" in a row beneath. |

## RTL and bidi

- "Delprøve 2" in the heading is an isolated Danish term inside Persian.
- "About 4½ minutes", "5–6 minutes", "10 seconds" use Persian digits via formatters.
- Card buttons: no directional icons needed; if a chevron is used, it mirrors.

## Accessibility

- Mode cards are regions with `h2` headings; each has one button. The rules are lists.
- The "can't be paused" rule is plain text inside the exam-conditions card, before its button, so screen-reader users hear it before activating (WCAG 2.2.1).
- No live regions.

## Copy needs

| Key | Intended meaning | Draft |
|---|---|---|
| `mock.start.title` | Delprøve 2 mock exam | – |
| `mock.start.sequence` | The real sequence: draw a topic, about 10 seconds to look, then about 4½ minutes of questions. | – |
| `mock.start.whatHappens` | What will happen? | – |
| `mock.mode.practice` | Practice | «تمرین» (PRD draft) |
| `mock.mode.practice.rules` | Pause any time · hints · choose a topic or theme · no time limit · record again | – |
| `mock.mode.practice.start` | Start practice | – |
| `mock.mode.exam` | Exam conditions | «شرایط آزمون» (PRD draft) |
| `mock.mode.exam.rules` | Random topic · one continuous clock of about 4½ minutes · can't be paused · no hints · no re-recording · you can leave at any time · "show text" stays available | – |
| `mock.mode.exam.limitEnds` | At the time limit, your answer ends after a short notice that lets you finish your sentence. (rev. 2.2) | – |
| `mock.mode.exam.interruptions` | If a call or the screen interrupts, the exam stops and waits. It's marked "interrupted", not failed. | – |
| `mock.mode.exam.alternative` | Prefer to take it slowly? Use practice. | – |
| `mock.backEnded.saved` / `.nothing` / `.see` | Your mock exam ended when you went back. Your answers so far are saved. · … Nothing was saved. · See my answers | – |
| `mock.mode.exam.start` | Start under exam conditions | – |
| `mock.mode.exam.unavailable` | Available when more topics are published. | – |
| `mock.need.title` / `.items` | What you'll need · About 5–6 minutes · A quiet place · Sound on · A microphone, if you want to hear yourself back (optional) | – |
| `mock.noGrade` | The app gives no grade. Afterwards you listen back and check yourself. | – |
| `mock.history` | My past mock exams | – |
| `mock.lostNotice` | Your last mock exam stopped when the page reloaded, so it couldn't be kept. | – |

## Wireframe

**375 px**
```
┌─────────────────────────────────────┐
│ [≡]                        App name │
├─────────────────────────────────────┤
│          [da: Delprøve 2] mock exam │ h1
│  Draw a topic, ~10 s to look, then  │
│        ~4½ min of questions.        │
│                 What will happen? › │
│ ┌─────────────────────────────────┐ │
│ │                        Practice │ │ h2
│ │  • Pause any time               │ │
│ │  • Hints: translation, key words│ │
│ │  • Choose a topic or theme      │ │
│ │  • No time limit                │ │
│ │  • Record an answer again       │ │
│ │ [        Start practice       ] │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │                 Exam conditions │ │ h2
│ │  • Random topic                 │ │
│ │  • One clock, about 4½ min      │ │
│ │  • Can't be paused              │ │
│ │  • No hints, no re-recording    │ │
│ │  • Leave at any time            │ │
│ │  Prefer it slower? Use practice.│ │
│ │ [ Start under exam conditions ] │ │
│ └─────────────────────────────────┘ │
│  You'll need: ~5–6 min · quiet ·    │
│     sound on · mic optional         │
│  No grade. You check yourself after.│
├─────────────────────────────────────┤
│ Guide Templates [•Mock] Topics Home │
└─────────────────────────────────────┘
```
