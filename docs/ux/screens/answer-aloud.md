# Screen: Answer aloud (focused panel on the topic page)

| | |
|---|---|
| **Route** | No route of its own. A focused panel over `/fa/topics/{topicId}` (full-screen sheet on phones, dialog at 768 px and up). System back closes it (UXD-14). |
| **Stories** | US-019 (Must, D-7), US-032 (repeat, same control as the mock), US-044, US-046, US-047, US-063, US-031 #6 (cap) |
| **Flows** | [study-topic](../flows/study-topic.md#sub-flow-answer-this-question-aloud-us-019-d-7), [recording-consent-and-microphone](../flows/recording-consent-and-microphone.md) |
| **Milestone** | M2 |

## Purpose

The smallest real speaking loop: hear the question, answer out loud with a timer, then hear yourself next to the sample answer (US-019; booklet method step 3).

## Content hierarchy

**Header (focused):** Close (start side, right) · title "Answer aloud" · the question's role ("First required question · situation A")

**Phase 1: Listen** (the question plays)
1. ExaminerPanel: "The examiner is asking…" with an audio activity indicator
2. The Danish question text, **shown by default** with "hide text" (rev. 2, UX-OQ-29: the learner has just read it on the page; choice remembered on the device; UXD-14). The Screen Wake Lock is held while the panel is open (R-01).

**Phase 2: Your turn** (recording)
1. RecordingIndicator (icon + "Recording") or "Answer aloud (not recording)" without a microphone
2. ElapsedTimer "0:23" with the reference "The booklet suggests about 45–60 seconds" (never a limit; US-019 #3)
3. **Hint** (required questions only): reveals the three key words (US-019 #2)
4. **Repeat**: *"Undskyld, vil du godt gentage spørgsmålet?"* with Persian meaning
5. Primary: **Done** (bottom, full width)

**Phase 3: Compare** (rev. 2, R-04: a new view, not a relabelled Done)
1. "Your answer" TakePlayer with length (or "not recorded"). **Focus moves to its play button** when Phase 3 opens, so a second press of Space or Enter plays the learner's answer instead of skipping ahead.
2. "Sample answer" (or "short sample answer" for a follow-up): AudioPlayer + Danish text, expanded
3. Actions: **Record again** (replaces the take; US-019 #5) · **Next question** · Close. "Next question" is a **separate button** placed away from where Done was; the Done slot itself disappears in Phase 3.
4. The last question of the topic shows "Back to the topic" instead of "Next question"

## Components

FocusedModeShell, ExaminerPanel, ShowTextToggle, RecordingIndicator, ElapsedTimer, HintDisclosure (KeywordList), RepeatControl, PrimaryActionSlot, TakePlayer, AudioPlayer, ConfirmDialog (discard), MicPermissionExplainer, MicDeniedHelp, LiveRegion.

## States

| State | Behaviour |
|---|---|
| First-time | MicPermissionExplainer first (once per device), then Phase 1. |
| Loading | The question clip loads on open; the ExaminerPanel shows "Loading the question…" with Retry after the slow threshold. Recording doesn't start until the question has played. |
| Empty | Not applicable. |
| Error (clip failed) | "The question audio didn't load." Retry · "Read the question instead" (shows the text and goes to Phase 2). |
| Slow network | As loading; the sample answer in Phase 3 loads on play. |
| Microphone denied / none | Phase 2 without recording: "Answer aloud now; this answer isn't being recorded." Small "microphone off" link to help. Phase 3 shows the sample answer only (US-019 #6). |
| Storage unavailable | Works; practice isn't remembered; no notice here. |
| Cap reached (180 s) | Recording stops; inline note "Recording stopped at 3 minutes. Tap Done when you're ready." |
| Interrupted (tab hidden) | Audio and recording stop; the take so far is kept; on return Phase 2 shows "Paused" with Continue (records a second part) or Done. |
| Close with a take | ConfirmDialog: "Your recording will be deleted." Leave · Stay (US-044 #2). |

## Responsive behaviour

| Width | Layout |
|---|---|
| 375 | Full-screen sheet. Done pinned in the bottom thumb zone; Repeat and Hint above it; timer and indicator in the middle. |
| 768 | Centred dialog, max ~560 px wide, same vertical order. |
| 1280 | Same dialog. Phase 3: "your answer" and "sample answer" side by side (yours on the start side, right). |

## RTL and bidi

- Danish: question text (when shown), key words (Danish half), repeat phrase, sample answer.
- Timer `m:ss` in Persian digits, inside an LTR isolate so minutes stay left of seconds.
- Close (×) isn't directional. "Next question" arrow mirrors. Play, record and microphone icons don't.

## Accessibility

- The panel is a modal dialog: focus moves into it (to the title), is trapped, and returns to the "Answer aloud" button on close. Escape = Close (with the discard guard if needed).
- Live region (polite): "Recording" when Phase 2 starts; "Recording stopped" on Done; cap message; errors. Nothing per second.
- Done keeps the same position through Phases 1–2 (UXD-08): during Phase 1 it's aria-disabled with the label "Listen…". **It never becomes "Next question"** (R-04): Phase 3 removes it and moves focus to "Play your answer".
- Back closes the panel (with the discard guard if a take exists). Interruptions (page hidden, microphone muted while answering) pause and keep the take (R-03).
- No time limit: WCAG 2.2.1 doesn't apply beyond the 3-minute recording cap, which never ends the exercise.

## Copy needs

| Key | Intended meaning | Draft |
|---|---|---|
| `answerAloud.title` | Answer aloud | «بلند جواب بدهید» |
| `answerAloud.listening` | The examiner is asking… | – |
| `answerAloud.showText` / `.hideText` | Show the text · Hide the text (text shown by default, rev. 2) | «نمایش متن» |
| `mock.repeat.action` | Ask the examiner to repeat (visible label, shared with the mock) | «درخواست تکرار سؤال» |
| `answerAloud.yourTurn` | Your turn. Answer aloud. | – |
| `answerAloud.notRecording` | This answer isn't being recorded. | – |
| `answerAloud.guide` | The booklet suggests about 45–60 seconds. | – |
| `answerAloud.hint` / `.hintHide` | Show the key words · Hide them | – |
| `answerAloud.done` | I've finished my answer | «جوابم تمام شد» |
| `answerAloud.waiting` | Listen… | – |
| `answerAloud.yourAnswer` | Your answer | – |
| `answerAloud.notRecorded` | Not recorded | – |
| `answerAloud.recordAgain` | Record again | «دوباره ضبط کنید» |
| `answerAloud.next` | Next question | – |
| `answerAloud.backToTopic` | Back to the topic | – |
| `answerAloud.capped` | Recording stopped at 3 minutes. Tap "I've finished" when you're ready. | – |
| `answerAloud.discard.title` / `.body` / `.leave` / `.stay` | Leave this answer? · Your recording will be deleted. · Leave · Stay | – |
| `mock.repeat.label` | Ask to repeat (shared with the mock) | – |
| `mock.repeat.meaning` | Sorry, could you repeat the question? | «ببخشید، می‌شود سؤال را تکرار کنید؟» (booklet's meaning) |
| `answerAloud.live.recording` / `.stopped` | Recording · Recording stopped | – |

## Wireframes

**375 px, Phase 2 (your turn)**
```
┌─────────────────────────────────────┐
│  Answer aloud · First question · A ×│  × Close at the start (right)
├─────────────────────────────────────┤
│                                     │
│               ● Recording           │
│                  0:23               │
│   The booklet suggests about 45–60 s│
│                                     │
│ [da: Der mangler arbejdskraft i …   │
│  Hvorfor tror du, der gør det?]     │
│                     ▸ Hide the text │
│                ▸ Show the key words │
│        Ask the examiner to repeat   │ visible label (R-13)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [da: Undskyld, vil du godt      │ │
│ │  gentage spørgsmålet?]          │ │ Repeat
│ │  Sorry, could you repeat the    │ │
│ │                       question? │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │      I've finished my answer    │ │ PRIMARY (thumb zone)
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**375 px, Phase 3 (compare)**
```
┌─────────────────────────────────────┐
│                       Answer aloud ×│
├─────────────────────────────────────┤
│                        Your answer  │
│ [▶]← focus ━━━━━━━━━━━━━  0:52      │
│                     Sample answer   │
│ [▶] ━━━━━━━━━━━━━━━━━━━   0:31      │
│ [da: Det kan der være flere grunde  │
│  til. For det første …]             │
│                                     │
│                                     │
│ [ ‹ Next question ]  [Record again] │ separate controls; no button
│                                     │ where Done used to be (R-04)
└─────────────────────────────────────┘
```
