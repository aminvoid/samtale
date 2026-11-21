# Screen: Mock exam, get ready

| | |
|---|---|
| **Routes** | `/fa/mock/practice` (with `?topic=` or `?theme=`), `/fa/mock/exam` — this is the first view of each; the draw and the interview follow on the same route |
| **Stories** | US-027 (Must), US-040 (Should), US-069 (Could), US-070 (Could), US-063, US-044 #1, US-026 #3 |
| **State machine** | `prepare.getReady`, `prepare.instruction` ([§7.1](../flows/mock-exam-state-machine.md#71-prepare)) |
| **Milestone** | M2 (M3 for the options and Coulds) |

## Purpose

Make sure nothing technical spoils the attempt: the learner can hear the examiner, has decided about the microphone, and (in practice) has chosen what to practise. One screen, one primary action (UXD-16).

## Content hierarchy

1. **Header** (normal app chrome is still visible here; focused mode begins at the draw): back link "‹ Mock exam" · `h1` "Practice: get ready" or "Exam conditions: get ready"
2. **Exam conditions only: the rules**, compact (US-026 #3, WCAG 2.2.1): about 4½ minutes, one continuous clock · can't be paused · no hints · can't re-record · leave any time · show text available. Link: "Use practice instead".
2a. **Tips** (rev. 2): exam conditions shows "Turn on Do Not Disturb so calls don't interrupt" (R-07). Both modes show "Using a screen reader? Wear headphones, so its speech isn't recorded with your answer." (rev. 2.2, a11y M8; shown to everyone, since the app can't detect screen readers). Both modes show, once, "Your screen may turn off while you speak. Set your phone's auto-lock to 2 minutes or more." if the Screen Wake Lock isn't supported (R-01).
3. **Practice only: options, collapsed into one summary line** (rev. 2, R-12): "Draw a topic · the examiner chooses the situation" with **Change**. Change opens a sheet (US-040; UXD-15; US-070):
   - **Topic:** ◉ Draw a topic (like the exam) · ○ Draw from one theme [theme picker] · ○ Choose a topic [topic picker]
   - **Situation:** ◉ The examiner chooses (like the exam) · ○ Let me choose after the 10 seconds
   - **Pacing aid** (Could): switch, off by default, "an approximate time split suggested by the booklet"
4. **Check 1: Sound** (US-027 #1; rev. 2, R-11) — it checks **volume, not understanding**: "Is the sound loud enough?" → "Play" → plays C13, a short neutral examiner line, with its Danish text and Persian meaning shown (draft *"Hej. Velkommen til prøven."* «سلام. به آزمون خوش آمدید.») → "Yes, I can hear it" ✓ / "No sound" → help (volume, silent switch on iPhone, Bluetooth headphones)
5. **Check 2: Microphone** (US-027 #2–#3, US-063):
   - Never asked: the explanation (recordings stay on this device, are never uploaded, deleted when you leave unless you keep them; optional) → "Allow microphone" / "Continue without recording"
   - Granted: "Microphone ready ✓". Optional level meter: "Say «hej» and watch the bar move" (UX-OQ-26)
   - Denied: help for this browser + "Continue without recording" (selected) + "Try again"
   - Unavailable: plain message; continue without recording
6. **"Always show the examiner's text"** (UXD-13) is **no longer on this screen** (rev. 2, R-12). It lives in Settings and applies to practice only; practice get ready shows its state in the summary line when it's on ("examiner's text: always shown · change"). Exam conditions never carries it.
7. **Primary action** (bottom, thumb zone): "Continue to the draw" (or "Continue" when a topic was chosen). Enabled once the microphone row is decided. The sound check is recommended, not required.
8. **Instruction step** (US-069, Could), after Continue: the screen changes to "The examiner's instruction", plays it with text visible, "Skip" as the primary. Ends → draw.

## Components

BackLink, PageHeader, RulesList, RadioGroup, Picker (sheet: themes or topics), Switch, ReadinessChecklist, SoundCheck, MicPermissionExplainer (inline variant), MicDeniedHelp, MicLevelMeter (optional), PrimaryActionSlot, InfoNote.

## States

| State | Behaviour |
|---|---|
| First-time | Microphone explanation shown in full in the microphone row (US-044 #1). |
| Returning, microphone granted | Microphone row collapsed to "Microphone ready ✓". Sound check still offered. |
| Loading | The sound-check clip (and the instruction, if on) load when the page opens; the play button shows loading until then (UXD-29). |
| Empty | Practice "choose a topic" with no published topics → option disabled with reason. |
| Error | Sound-check clip failed: "The sample didn't load" + retry; the learner can still continue (the attempt's own preload will retry). |
| Slow network | As loading; nothing else is fetched until the draw. |
| Microphone denied | Row shows help; Continue is enabled with "without recording". |
| Storage unavailable | Choices aren't remembered next time; nothing else changes. |
| `?topic=` invalid | InfoNote "This topic isn't available; you can draw one instead." Topic option set to draw. |
| `?topic=` valid | Topic option preselected: "Chosen topic: [Danish name]" with "change". |
| Reload-lost marker present | The "couldn't be kept" view replaces this screen first ([state machine §12.3](../flows/mock-exam-state-machine.md#123-reload-or-discarded-tab-us-038-4)). |

## Responsive behaviour

| Width | Layout |
|---|---|
| 375 | Single column; the checklist rows stack; Continue pinned at the bottom above the safe area (the tab bar is hidden on this screen to free the thumb zone). |
| 768 | Centred column; Continue at the end of the content. |
| 1280 | Two columns: start (right) rules/options; end (left) checks; Continue under both. |

## RTL and bidi

- Danish only in the level-meter prompt («hej») and the chosen topic's name; both isolated.
- Radio buttons and switches: the control sits at the inline start (right) of its label.
- No directional icons except the back link.

## Accessibility

- Each check is a group with a heading (`h2`) and a status text ("Not checked yet" / "Heard" / "Ready" / "Off: continuing without recording") that is part of the group's accessible description.
- Status changes in the checks are announced politely ("Microphone ready").
- The browser permission prompt is only ever triggered by "Allow microphone" (US-063 #1).
- Pickers are dialogs/sheets with focus management and Escape to close.
- Continue's disabled state uses `aria-disabled` with a visible reason ("Choose what to do about the microphone first").

## Copy needs

| Key | Intended meaning |
|---|---|
| `mock.ready.title.practice` / `.exam` | Practice: get ready · Exam conditions: get ready |
| `mock.ready.rules` | (reuses `mock.mode.exam.rules`) |
| `mock.ready.usePractice` | Use practice instead |
| `mock.ready.topic.label` / `.draw` / `.drawTheme` / `.choose` / `.chosen` / `.change` | Topic · Draw a topic (like the exam) · Draw from one theme · Choose a topic · Chosen topic: {name} · Change |
| `mock.ready.situation.label` / `.examiner` / `.mine` | Situation · The examiner chooses (like the exam) · Let me choose after the 10 seconds |
| `mock.ready.pacing.label` / `.hint` | Show an approximate time split · Suggested by the booklet; SIRI gives only "about 4½ minutes" |
| `mock.ready.summary` / `.change` | {topicChoice} · {situationChoice} · Change |
| `mock.ready.tip.dnd` | Turn on Do Not Disturb so calls don't interrupt. |
| `mock.ready.tip.headphones` | Using a screen reader? Wear headphones, so its speech isn't recorded with your answer. (rev. 2.2) |
| `mock.ready.tip.autolock` | Your screen may turn off while you speak. Set your phone's auto-lock to 2 minutes or more. |
| `mock.ready.sound.title` / `.play` / `.yes` / `.no` / `.help` | Is the sound loud enough? · Play · Yes, I can hear it · No sound · Check your volume, the silent switch on iPhone, and Bluetooth headphones. (rev. 2, R-11: about volume, never understanding) |
| `mock.ready.sound.meaning` | The Persian meaning of the sound-check line, shown under its Danish text |
| `mic.explain.title` | Why the microphone? |
| `mic.explain.body` | So you can hear yourself afterwards. Recordings stay on this device and are never uploaded. They're deleted when you leave, unless you choose to keep your latest mock exam. The microphone is optional. |
| `mic.allow` / `mic.withoutRecording` / `mic.ready` / `mic.tryAgain` | Allow microphone · Continue without recording · Microphone ready · Try again |
| `mic.levelPrompt` | Say {word} and watch the bar move. |
| `mock.ready.alwaysTextStatus` | Examiner's text: always shown · Change (practice only, when the setting is on) |
| `mock.ready.continue` / `.continueChosen` | Continue to the draw · Continue |
| `mock.ready.continueBlocked` | Choose what to do about the microphone first. |
| `mock.instruction.title` / `.skip` | The examiner's instruction · Skip |

## Wireframe

**375 px, practice**
```
┌─────────────────────────────────────┐
│                       › Mock exam   │
│                Practice: get ready  │ h1
│ Change ›   Draw a topic · examiner  │ one summary line (R-12)
│                chooses the situation│
│ ─────────────────────────────────── │
│ 1 Is the sound loud enough?     ✓   │
│ [▶ Play]                            │
│ [da: Hej. Velkommen til prøven.]    │
│          Hello. Welcome to the exam.│
│ [Yes, I can hear it]   [No sound]   │
│ ─────────────────────────────────── │
│ 2 Why the microphone?               │
│  So you can hear yourself after.    │
│  Stays on this device, never        │
│  uploaded, deleted when you leave.  │
│ [ Allow microphone ]                │
│ [ Continue without recording ]      │
│ ┌─────────────────────────────────┐ │
│ │      Continue to the draw       │ │ PRIMARY (thumb zone)
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**375 px, exam conditions (top part)**
```
│        Exam conditions: get ready   │ h1
│ ┌─────────────────────────────────┐ │
│ │ • About 4½ min, one clock       │ │
│ │ • Can't be paused · no hints    │ │
│ │ • Leave any time · show text ok │ │
│ │              Use practice instead│ │
│ └─────────────────────────────────┘ │
│  1 Sound …   2 Microphone …         │
```
