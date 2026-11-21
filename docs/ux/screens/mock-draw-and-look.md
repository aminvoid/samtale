# Screen: Mock exam, draw and look

| | |
|---|---|
| **Routes** | Same route as get ready (`/fa/mock/practice` or `/fa/mock/exam`); these are states, not URLs (IA §4.1 rule 6) |
| **Stories** | US-028, US-029, US-027 #4–#7, US-009, US-030 #1, US-062 #4, US-039 |
| **Decisions** | D-4 (text cards), D-18 (booklet situation titles), DL-031 (SIRI's intro line), DL-048 (unmarked cards) |
| **State machine** | `prepare.draw`, `prepare.reveal`, `run.introLine`, `run.look`, `run.chooseSituation` ([§7.1–§7.2](../flows/mock-exam-state-machine.md#71-prepare)) |
| **Milestone** | M2 |

## Purpose

Make the surprise of the draw and the 10-second look feel familiar (US-028, US-029), and load everything before any clock starts (US-027).

## Views and content hierarchy

Focused mode starts here (UXD-02): no tab bar; the Screen Wake Lock is requested (R-01). Header: **Leave** (start side, right) · mode label ("Practice" / "Exam conditions") · nothing else.

### View 1: Draw (`prepare.draw`)
1. `h1` "Draw a topic"
2. One line: "Like the exam: three identical slips. Tap one."
3. **Three identical face-down DrawCards** in a row, no letters, numbers or marks (US-028 #1). Accessible names "card 1 of 3" … (US-028 #7).
4. Leave works without a dialog (nothing is lost yet).

### View 2: Reveal and load (`prepare.reveal`)
1. The tapped card turns face up (flip; crossfade with reduced motion) showing: **letter** (large, Latin), Danish topic name, Persian topic name, TermLabel, Pre2023Badge (US-028 #2, US-009). The other two stay face down and recede.
2. **LoadProgress** beneath: "Getting the examiner ready…" as a plain bar, with "about 1 MB, downloaded once" (rev. 2, R-25; no "9 of 12"). First time only, under the card: "The letter you got is the real letter of this exam topic." (moved here from the draw, R-23). The pre-2023 explanation is available here as a Disclosure (R-05).
3. **Start** (primary, bottom): aria-disabled until loaded; then "Start" (US-027 #7: this tap unlocks audio). Line above it: "The clock starts when the examiner introduces the situation." (exam conditions) or "You can pause at any time." (practice)
4. **Slow** (after C6): "Loading is taking longer than usual. Nothing has started yet." · Keep waiting (loading continues) · Retry · Leave (US-027 #5).
5. **Failed:** "The exam audio didn't load. Nothing has started yet." · Retry · Leave (US-027 #6).

### View 3: Intro line and look (`run.introLine`, `run.look`)
1. `h1` the Danish topic name
2. **Two SituationCards, A and B** (look variant): decorative theme icon, key letter, the booklet's Danish title (D-18). Practice: "show translations" toggles the Persian titles on both cards (US-029 #5). Exam conditions: no translations (US-029 #4).
3. **InfoNote** (US-029 #8): "In the real exam you see two pictures instead of these cards." (PRD draft «در آزمون واقعی، به‌جای این کارت‌ها دو عکس می‌بینید.»). After the learner's first three attempts it becomes a compact one-line icon note (rev. 2, R-26). The whole look view must fit about 560 px of visible height at 375 px width without scrolling (R-26).
4. **ExaminerPanel** while the intro line plays: "The examiner is speaking…" with "Show text" (SIRI's line, with source label "SIRI's wording").
5. **Countdown** after the line ends (US-029 #3): "10" counting down to "0", with a text label "Time to look". The only countdown in the app (state machine §8).
6. **Practice controls:** Pause / Resume · "+10 s" · "I'm ready" (skip) (US-029 #5).
7. Primary slot: "Looking…" (aria-disabled) in exam conditions; "I'm ready" in practice.

### View 4: Situation chosen (transition, ~1 s) or choose (`run.chooseSituation`, practice only)
- **Random:** the chosen card is marked "The examiner chose this situation" (a label and a heavier border, not colour alone); the other card is de-emphasised but stays visible. The layout moves into the interview (cards shrink to the compact strip, UXD-07).
- **Practice, "let me choose":** "Which situation should the examiner ask about?" · Situation A · Situation B · Let the examiner choose.

## Components

FocusedModeShell, DrawCard ×3, RevealPanel, TermLabel, Pre2023Badge, LoadProgress, PrimaryActionSlot, InfoNote, SituationCard (look variant), TranslationToggle, ExaminerPanel, ShowTextToggle, SourceLabel, Countdown, LookControls (practice), ChoiceButtons, LeaveDialog, TapToHear, LiveRegion.

## States

| State | Behaviour |
|---|---|
| First-time | The letter hint appears on the **reveal**, after the letter is visible (rev. 2, R-23). |
| Loading | View 2 as above; no timer runs (US-027 #5). |
| Empty | No eligible term or topics → never reached; mock start shows exam conditions as unavailable (see [mock-start](mock-start.md)). |
| Error | View 2 failure; mid-intro clip failure → audio-error dialog ([mock-interview](mock-interview.md#dialogs)). |
| Slow network | View 2 slow state. |
| Microphone denied | No change here; the header shows a small "not recording" indicator from the interview on. |
| Storage unavailable | No change. |
| Playback blocked (iOS) | ExaminerPanel shows "Tap to hear the examiner" as the primary (US-062 #4); the look doesn't start until the intro line has played. |
| Interrupted during the look | On return, the interruption dialog; Continue restarts the full 10 s (UXD-10). |
| Practice paused | Countdown frozen; "Paused" label; Resume as the primary. |

## Responsive behaviour

| Width | Layout |
|---|---|
| 375 | Draw: three cards in one row (each about a third of the width, portrait like slips). Reveal: the tapped card enlarges in place to show its text; Start pinned at the bottom. Look: the two situation cards stacked (A on top), countdown between the cards and the primary slot; practice controls in one row above the primary slot. |
| 768 | Look: cards side by side, A on the right (start). |
| 1280 | Centred focused column (~720 px). Cards side by side; countdown centred beneath. |

## RTL and bidi

- **Danish:** topic name, situation titles, SIRI's intro-line text (when shown), TermLabel. Letters A/B/C Latin (US-053 #3).
- Situation A sits at the start (right) when side by side, B at the end (left), because A comes first in reading order.
- Countdown digits are Persian (D-2) inside an LTR isolate. The countdown ring (if any) is a clock-like element: **not mirrored**.
- The draw-card flip animation direction is irrelevant to meaning; with reduced motion it's a crossfade.

## Accessibility

- DrawCards are buttons with non-revealing names ("card 1 of 3"); after a draw the other two are `aria-disabled`. Double taps produce one draw (US-028 #6).
- On reveal, focus moves to the revealed card's heading (the letter and topic), and the live region announces "You drew topic B: *Mangel på arbejdskraft*".
- Countdown: announced only at start ("10 seconds to look at the topic") and end ("The time to look is over") (US-029 #6). The visual number is `aria-hidden`; a visually hidden static label carries the meaning.
- Theme icons are decorative (US-029 #7).
- Start's aria-disabled state has a visible reason ("Loading…").
- WCAG 2.2.1: the look's fixed 10 s in exam conditions is part of the announced essential time limit; practice offers pause, extend and skip.

## Copy needs

| Key | Intended meaning | Draft |
|---|---|---|
| `mock.draw.title` | Draw a topic | – |
| `mock.draw.hint` | Like the exam: three identical slips. Tap one. | – |
| `mock.draw.card` | Card {n} of 3 | – |
| `mock.reveal.letterHint` | The letter you got is the real letter of this exam topic. (shown on the reveal, R-23) | – |
| `mock.reveal.dataNote` | About 1 MB, downloaded once | – |
| `mock.reveal.loading` | Getting the examiner ready… | – |
| `mock.reveal.start` | Start | «شروع» |
| `mock.reveal.clockNote.exam` | The clock starts when the examiner introduces the situation. | – |
| `mock.reveal.clockNote.practice` | You can pause at any time. | – |
| `mock.reveal.slow` / `.failed` / `.keepWaiting` / `.retry` / `.leave` | Loading is taking longer than usual. Nothing has started yet. · The exam audio didn't load. Nothing has started yet. · Keep waiting · Try again · Leave | – |
| `mock.look.picturesNote` | In the real exam you see two pictures instead of these cards. | «در آزمون واقعی، به‌جای این کارت‌ها دو عکس می‌بینید.» (PRD draft) |
| `mock.look.timeToLook` | Time to look | – |
| `mock.look.pause` / `.resume` / `.addTime` / `.ready` | Pause · Continue · +10 seconds · I'm ready | – |
| `mock.look.showTranslations` / `.hideTranslations` | Show translations · Hide translations | – |
| `mock.situation.chosen` | The examiner chose this situation | – |
| `mock.situation.choose.title` / `.a` / `.b` / `.random` | Which situation should the examiner ask about? · Situation A · Situation B · Let the examiner choose | – |
| `mock.examiner.speaking` | The examiner is speaking… | – |
| `mock.tapToHear` | Tap to hear the examiner | – |
| `mock.leave` | Leave | «خروج» |

## Wireframes

**375 px, draw**
```
┌─────────────────────────────────────┐
│ Practice                     Leave ×│
├─────────────────────────────────────┤
│                       Draw a topic  │ h1
│   Like the exam: three identical    │
│                 slips. Tap one.     │
│                                     │
│  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │░░░░░░░░│  │░░░░░░░░│  │░░░░░░░░│ │
│  │░░░░░░░░│  │░░░░░░░░│  │░░░░░░░░│ │
│  │░░░░░░░░│  │░░░░░░░░│  │░░░░░░░░│ │
│  └────────┘  └────────┘  └────────┘ │
│   card 3       card 2      card 1   │ (names for AT only)
└─────────────────────────────────────┘
```

**375 px, reveal and load**
```
┌─────────────────────────────────────┐
│ Exam conditions              Leave ×│
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │               B               │  │
│  │ [da: Mangel på arbejdskraft]  │  │
│  │               Labour shortage │  │
│  │      [da: Maj–Juni 2024 · B]  │  │
│  └───────────────────────────────┘  │
│   Getting the examiner ready…       │
│   ░░░░░░▓▓▓▓▓▓▓▓▓▓  about 1 MB, once│
│ The clock starts when the examiner  │
│          introduces the situation.  │
│ ┌─────────────────────────────────┐ │
│ │        Start (Loading…)         │ │ aria-disabled until loaded
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**375 px, look (exam conditions)**
```
┌─────────────────────────────────────┐
│ Exam conditions              Leave ×│
├─────────────────────────────────────┤
│        [da: Mangel på arbejdskraft] │ h1
│ ┌─────────────────────────────────┐ │
│ │ (icon)                        A │ │
│ │ [da: sygeplejerske med mange    │ │
│ │      patienter]                 │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ (icon)                        B │ │
│ │ [da: byggeplads, hvor arbejdet  │ │
│ │      ikke er gået i gang]       │ │
│ └─────────────────────────────────┘ │
│ ⓘ In the real exam you see two      │
│   pictures instead of these cards.  │
│               Time to look          │
│                  7                  │
│ ┌─────────────────────────────────┐ │
│ │            Looking…             │ │ aria-disabled
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**375 px, look (practice) — controls row**
```
│ [Show translations]                 │
│   [ +10 s ]   [ Pause ]             │
│ ┌─────────────────────────────────┐ │
│ │           I'm ready             │ │
│ └─────────────────────────────────┘ │
```
