# Screen: Mock exam interview (questions, answers, dialogs, end)

| | |
|---|---|
| **Routes** | Same route as get ready (`/fa/mock/practice` or `/fa/mock/exam`) |
| **Stories** | US-030 to US-039, US-070 (Could), US-060 #4, US-062 #4, US-063, GA-4, GA-10, GA-11 |
| **State machine** | `run.unit.*`, `run.thanks`, `run.closing`, `finished`, `hold.*`, leave dialog ([§7.3–§7.6](../flows/mock-exam-state-machine.md#73-units)) — **the source of truth for behaviour** |
| **Milestone** | M2 |

## Purpose

Let the learner answer the examiner's questions under the conditions they chose, with **one obvious action at a time** ("Done"), a way to ask for a repeat, and a way out, while always knowing where they are in the exam.

## Content hierarchy

**Focused header** (top)
- **Leave** (start side, right)
- Mode label: "Practice" / "Exam conditions"
- **Timers** (end side, left), exam conditions: "2:15 of about 4:30" (UXD-05); practice: elapsed "2:15" only. A **hide/show timers** toggle beside them (remembered).
- Recording state (icon + text): "● Recording" only while answering with the microphone on; "Microphone ready" between answers; "Not recording" when the learner has no microphone for this attempt

**Context strip**
- **StepIndicator:** "Part 1 of 2 · situation question" / "Part 2 of 2 · general question" (US-034 #4); two segments filling from the right
- **Compact situation cards** A and B, the chosen one marked "the examiner's situation" (UXD-07). Tapping a card does nothing (they're context, like the sheet on the table). In practice, a Persian title is available through hints, not on the strip.

**Examiner panel** (middle)
- Role label of the current unit: "First required question" / "Suggested follow-up" / "Second required question (general)" (US-034)
- Status: "The examiner is speaking…" with an audio activity indicator / "Your turn" / "The examiner is repeating the question…"
- **Show text** toggle (US-030 #5): reveals the Danish text of what the examiner has said in this unit (intro + question; transition + question; follow-up). **Exam conditions:** resets per unit. **Practice (rev. 2, R-27, R-28):** stays open for the rest of the attempt once opened (or always, if the practice setting is on), and fixed examiner lines (intro line, transition, *"Tak."*, closing) show their Persian meaning too.
- **Grace notice** (exam conditions, after the limit; state machine R7, rev. 2 R-09), leading with permission: "You can finish your sentence. Then the examiner will end the exam." No countdown, no "time is up".
- **Recording-cap notice** (UXD-12) / **"your next answers won't be recorded"** notice (only if the microphone can't be re-opened after an interruption, R-03) when they apply

**Answer area** (bottom, thumb zone)
- **Answer timer:** "0:41"; practice adds "about 45–60 s suggested" (US-036 #3). Hidden with the timers toggle.
- **RepeatControl** (US-032; rev. 2, R-13): a **visible action label** "Ask the examiner to repeat" (draft «درخواست تکرار سؤال»), then *"Undskyld, vil du godt gentage spørgsmålet?"* with Persian meaning beneath; first time only, the hint "Say it aloud, then tap". First question only: a small "Hear the situation again" link (US-032 #3). Practice, from the second repeat of a question: a second option "Hear it slower".
- **Practice only:** **Hints** (opens HintsSheet: Persian translation of the question · three key words (required questions) · the matching template card; US-036 #2; the answer timer pauses while it's open, R-14; the sheet carries the line "Not available in the real exam: there are no notes in delprøve 2", rev. 2.1) · **Pause** · **Record again** (shown only while recording, R-14)
- **Pacing aid** (practice, Could, collapsed): "Part 1: about 2 min · Part 2: about 2½ min · about 45–60 s per required answer", with the part's elapsed time; labelled as the booklet's approximate split (US-070)
- **PrimaryActionSlot** (UXD-08): "Listen…" (aria-disabled) while the examiner speaks · **"I've finished my answer"** while answering · "Tap to hear the examiner" if playback is blocked

### Dialogs

| Dialog | Trigger | Content | Actions | Story |
|---|---|---|---|---|
| **Leave** | Leave, or back (R-02) | "Leave this mock exam?" Practice: "The exam is paused." Exam conditions: "The clock is still running." | **Continue the exam** (primary, default focus) · **End and see my answers** (after the first answer has begun) · **Leave without saving** ("this attempt and its recordings won't be kept") (rev. 2, UX-OQ-02) | US-039 |
| **Interrupted / paused** | Return after the page was hidden, a call, or the microphone muted while answering | Exam: "The exam stopped while you were away." Practice: "The exam is paused." A reason: "The screen turned off, a call came in, or another app opened." Exam: "The clock stopped at {m:ss} and continues from there." and "This attempt will be marked 'interrupted'. That's not a fail." (rev. 2, R-08) | **Continue** (replays the current question) · Start again (this attempt won't be kept) · End and see my answers | US-038 #2–#3 |
| **Audio error** | A clip failed | "The examiner's audio didn't play. The clock is paused." | **Try again** · End and see my answers | US-038 #7 |
| **Paused** (practice) | Pause | "Paused." | **Continue** · End and see my answers (after the first answer) · Leave without saving (rev. 2) | US-036 #1 |

**Back (rev. 2, R-02, behind the ADR-0007 flag):** back closes the topmost layer first (the hints sheet, or the leave dialog); on the pause, interruption and audio-error dialogs it opens the leave dialog on top; otherwise it opens the leave dialog. It never ends the attempt by itself. Fallback: [state machine §12.4](../flows/mock-exam-state-machine.md#124-back-navigation).

**Screen Wake Lock (R-01):** held throughout, so the screen doesn't lock while the learner speaks without touching it.
| **Hints** (practice, sheet) | Hints | Tabs or stacked: Translation · Key words · Template | Close | US-036 #2 |

### End view (`finished`)
- Closing line text: *"Tak, så er prøven forbi."* (Danish, with "SIRI's wording")
- `h1` "The exam is over"
- One neutral fact: total time (and "interrupted" if it applies, with "time during the interruption isn't counted", R-37). **No grade, score or pass/fail** (US-035 #5).
- **See my answers and check myself** (primary) → review
- Close → if recordings exist, the discard guard (US-044 #2), then `/fa/mock`

## Components

FocusedModeShell, ExamClock, TimersToggle, RecordingIndicator, StepIndicator, SituationCard (compact), ExaminerPanel, ShowTextToggle, GraceNotice, InfoNote, ElapsedTimer, RepeatControl, HintsSheet, PauseButton, RerecordButton, PacingAid, PrimaryActionSlot, TapToHear, LeaveDialog, InterruptionDialog, AudioErrorDialog, PauseOverlay, EndScreen, LiveRegion.

## States

| State | Behaviour |
|---|---|
| First-time | Under the primary slot during the **first** answer phase only: "Tap when you've finished speaking. The app never cuts you off." (dismisses itself after the first Done). |
| Loading | Not applicable: everything was preloaded (US-027 #4). |
| Empty | Not applicable. A section with no follow-up is skipped silently (US-033 #3). |
| Error | Audio error dialog; "Tak." failures skipped silently; closing failure goes straight to the end view (state machine §7.3–§7.4). |
| Slow network | Not applicable during the attempt (preloaded). |
| Microphone denied / none | Header shows "Not recording"; "Your turn" without the recording indicator; everything else identical (US-027 #3). |
| Microphone muted or ended while answering (e.g. a call banner) | Interruption dialog (R-03). On Continue the microphone is re-opened; only if that fails, the notice "your next answers won't be recorded" and "Not recording" in the header. |
| Storage unavailable | No visible change; a single "couldn't save" notice may appear at the end (US-050 #3). |
| Grace (exam) | Grace notice; Done still the primary; Repeat still available (state machine R3). |
| Recording capped | Notice; recording indicator changes to "Recording stopped at 3 min"; Done still needed. |
| Timers hidden | Header shows "Timers hidden" with the show toggle. Only the numbers are hidden: the one-minute announcement, the handover notice and the grace notice are still shown and announced (rev. 2.2, a11y M7; state machine §15). |
| Screen reader, answering | In-answer announcements are queued until after Done, except the handover and grace notices (rev. 2.2, a11y M8). |
| Leave dialog open (exam) | The clock keeps running and the current clip finishes, but no new clip or answer phase starts until the dialog closes (rev. 2, R-35). |
| Part-1 cut-off (exam, 2:30) | Nothing visible. After the current answer, the general question comes next (R-10). |
| Part-1 handover (exam, 3:20; rev. 2.1) | If a part-1 answer is still running: the handover notice "You can finish your sentence. Then the examiner will ask the next question." (same calm style as the grace notice, announced once), 20 s of grace, then the general question. |
| Large text sizes (≥ 150%) | The bottom answer area is no longer pinned; it scrolls with the content so it never covers the examiner panel (rev. 2, R-36). |

## Responsive behaviour

| Width | Layout |
|---|---|
| 375 | Header one line (Leave · mode · timers). Context strip: step indicator + two compact cards side by side, each one line of Danish title (truncated with full text available on focus). Examiner panel in the middle. Answer area pinned to the bottom: repeat control full width above the primary slot; practice row (Hints · Pause · Record again) between them. Nothing interactive in the top third except Leave and the timers toggle. |
| 768 | Same order, centred column (~600 px); compact cards show the full titles. |
| 1280 | Centred focused column (~720 px). Situation cards as a row above the examiner panel. Practice: the pacing aid may sit beside the answer area. No side navigation, no app nav (focused). |

## RTL and bidi

- **Danish:** situation titles, the examiner text (when shown), the repeat phrase, the closing line on the end view, key words and template phrases in hints.
- **Timers and the countdown digits:** Persian digits in LTR isolates; "2:15 of about 4:30" is an ICU message with two isolated duration arguments, never "2:15 / 4:30" (bidi-safe).
- **Step indicator mirrors** (part 1 on the right). **Don't mirror:** the audio activity indicator, play icons in hints, the recording dot, the microphone icon, clocks.
- Leave on the start side (right); timers on the end side (left).

## Accessibility

- **Focus stays put.** The primary slot is one persistent button whose label and `aria-disabled` state change with the phase (UXD-08), so a keyboard or screen-reader user who leaves focus on it can answer the whole exam with Space/Enter. Focus is never moved automatically during the interview, except into dialogs (and back to the primary slot when they close).
- **Danish never goes in `aria-label`, `title` or plain-string announcements** (rev. 2.2, a11y M1): accessible names that include Danish are built from content elements (`aria-labelledby` pointing at a `<span lang="da">`), and live-region messages render Danish params as `<span lang="da">`.
- **Announcements** (polite, never during examiner audio; queued during answers except handover and grace, rev. 2.2; state machine §15): "your turn" (with "recording" the first time), the one-minute notice (if timers shown), time up, recording capped, microphone lost, paused/continuing, exam over. Not every second. Not on Done.
- **Timing (2.2.1):** practice has pause and no limit; exam conditions is an essential time limit announced before starting (mock start, get ready), with practice offered as the alternative.
- **2.2.2:** the auto-updating timers can be hidden with one control.
- **Dialogs:** modal, focus trapped, initial focus on the safest action (Continue), Escape = Continue/cancel (US-039 #4).
- **Repeat control:** accessible name starts with the visible action label ("Ask the examiner to repeat"), then the Danish phrase (`lang="da"`) as the description (WCAG 2.5.3 label in name; rev. 2).
- **Show text** is a Disclosure; the revealed Danish text is `lang="da"`.
- **Targets:** primary ≥ 56 px tall on phones (≥ 44 px minimum everywhere); Done and Leave are far apart to avoid slips.
- **Reduced motion:** no pulsing recording dot (static icon + text); no animated audio indicator (static "speaking" icon + text).

## Copy needs

| Key | Intended meaning | Draft |
|---|---|---|
| `mock.mode.label.practice` / `.exam` | Practice · Exam conditions | «تمرین» · «شرایط آزمون» |
| `mock.timers.elapsedOfLimit` | {elapsed} of about {limit} | – |
| `mock.timers.hide` / `.show` / `.hidden` | Hide timers · Show timers · Timers hidden | – |
| `mock.rec.on` / `.ready` / `.off` / `.capped` | Recording · Microphone ready · Not recording · Recording stopped at 3 min | – |
| `mock.step.part1` / `.part2` | Part 1 of 2 · situation question · Part 2 of 2 · general question | – |
| `mock.role.firstRequired` / `.followup` / `.secondRequired` | First required question · Suggested follow-up · Second required question (general) | – |
| `mock.situation.marked` | The examiner's situation | – |
| `mock.examiner.speaking` / `.repeating` / `.yourTurn` | The examiner is speaking… · The examiner is repeating the question… · Your turn | – |
| `mock.showText` / `.hideText` | Show text · Hide text | «نمایش متن» |
| `mock.done` | I've finished my answer | «جوابم تمام شد» |
| `mock.listen` | Listen… | – |
| `mock.firstDoneHint` | Tap when you've finished speaking. The app never cuts you off. | – |
| `mock.repeat.meaning` | Sorry, could you repeat the question? | – |
| `mock.repeat.intro` | Hear the situation again | – |
| `mock.hints` / `.translation` / `.keywords` / `.template` | Hints · Translation · Key words · Template | – |
| `mock.pause` / `.continue` / `.rerecord` | Pause · Continue · Record again | – |
| `mock.answer.guide` | About 45–60 s suggested | – |
| `mock.pacing.title` / `.part1` / `.part2` / `.perAnswer` / `.source` | Approximate time split · Part 1: about 2 min · Part 2: about 2½ min · About 45–60 s per required answer · Suggested by the booklet (Shery Rahimi). SIRI's examiner booklet gives only "about 4½ minutes" in total. | – |
| `mock.grace` | You can finish your sentence. Then the examiner will end the exam. (rev. 2, R-09) | «می‌توانید جمله‌تان را تمام کنید. بعد ممتحن آزمون را تمام می‌کند.» (walkthrough draft) |
| `mock.capped` | Recording for this answer stopped at 3 minutes. Tap "I've finished" when you're ready. | – |
| `mock.notRecording` | Your next answers won't be recorded. The exam continues. | – |
| `mock.repeat.action` / `.firstHint` / `.slower` / `.slowerNote` | Ask the examiner to repeat · Say it aloud, then tap · Hear it slower · A practice aid: the real examiner doesn't do this (rev. 2.1) | «درخواست تکرار سؤال» (walkthrough draft) |
| `mock.handover` | You can finish your sentence. Then the examiner will ask the next question. (rev. 2.1) | – |
| `mock.hints.noNotes` | Not available in the real exam: there are no notes in delprøve 2. (rev. 2.1) | – |
| `mock.leave.title` / `.pausedNote` / `.runningNote` / `.continue` / `.endReview` / `.leaveNoSave` / `.leaveNoSaveNote` | Leave this mock exam? · The exam is paused. · The clock is still running. · Continue the exam · End and see my answers · Leave without saving · This attempt and its recordings won't be kept. | – |
| `mock.interrupt.title.exam` / `.title.practice` / `.reason` / `.clockStopped` / `.labelNote` / `.continue` / `.restart` / `.endReview` | The exam stopped while you were away. · The exam is paused. · The screen turned off, a call came in, or another app opened. · The clock stopped at {time} and continues from there. · This attempt will be marked "interrupted". That's not a fail. · Continue · Start again (this attempt won't be kept) · End and see my answers | – |
| `mock.end.interruptedNote` | Time during the interruption isn't counted. | – |
| `mock.audioError.title` / `.body` / `.retry` | The examiner's audio didn't play. · The clock is paused. · Try again | – |
| `mock.end.title` / `.totalTime` / `.interrupted` / `.review` / `.close` | The exam is over · Total time: {duration} · Interrupted · See my answers and check myself · Close | «آزمون تمام شد» |
| `mock.live.*` | See [state machine §15](../flows/mock-exam-state-machine.md#15-announcements) | – |

## Wireframes

**375 px, exam conditions, answering**
```
┌─────────────────────────────────────┐
│ 2:15 of ~4:30 [hide]  Exam  Leave × │  timers at the end (left)
│ ● Recording                         │
├─────────────────────────────────────┤
│ ▭▭▭▭▭▭▭▭▭▭▭▭  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬  Part 1 │  step indicator fills from right
│ ┌──────────────┐ ┌───────────────┐  │
│ │B [da: bygge- │ │A ★ [da: syge- │  │  ★ = "the examiner's situation"
│ │   plads …]   │ │   plejerske …]│  │     (label, not colour)
│ └──────────────┘ └───────────────┘  │
│                                     │
│            First required question  │
│                        Your turn    │
│                     ▸ Show text     │
│                                     │
│                   0:41              │  answer timer
│ ┌─────────────────────────────────┐ │
│ │      Ask the examiner to repeat │ │  visible label (R-13)
│ │ [da: Undskyld, vil du godt      │ │
│ │  gentage spørgsmålet?]          │ │
│ │ Sorry, could you repeat it?     │ │
│ └─────────────────────────────────┘ │
│             Hear the situation again│
│ ┌─────────────────────────────────┐ │
│ │     I've finished my answer     │ │  PRIMARY
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**375 px, practice, examiner speaking**
```
┌─────────────────────────────────────┐
│ 1:02 [hide]       Practice  Leave × │
│ ○ Microphone ready (not recording)  │
├─────────────────────────────────────┤
│                       Part 1 of 2   │
│ [B …]                 [A ★ …]       │
│                 Suggested follow-up │
│      ))) The examiner is speaking…  │
│                     ▸ Show text     │
│ ▸ Approximate time split            │  pacing aid (Could), collapsed
│                                     │
│  [Record again] [Pause]  [Hints]    │  (inactive while examiner speaks)
│ ┌─────────────────────────────────┐ │
│ │            Listen…              │ │  aria-disabled
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**375 px, grace**
```
│ 4:36 of ~4:30           Exam Leave ×│
│ ┌─────────────────────────────────┐ │
│ │ ⓘ You can finish your sentence. │ │
│ │   Then the examiner will end    │ │
│ │   the exam.                     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │     I've finished my answer     │ │
│ └─────────────────────────────────┘ │
```

**375 px, interruption dialog (exam conditions)**
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │   The exam stopped while you    │ │
│ │                     were away.  │ │
│ │ The screen turned off, a call   │ │
│ │ came in, or another app opened. │ │
│ │ The clock stopped at ۲:۳۰ and   │ │
│ │ continues from there.           │ │
│ │ Marked "interrupted" — that's   │ │
│ │                    not a fail.  │ │
│ │ [ Continue (replays question) ] │ │  default focus
│ │ [ Start again (not kept) ]      │ │
│ │ [ End and see my answers ]      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**375 px, end view**
```
┌─────────────────────────────────────┐
│                              Close ×│
├─────────────────────────────────────┤
│   [da: Tak, så er prøven forbi.]    │
│                  SIRI's wording     │
│                The exam is over     │ h1
│                Total time: 3:52     │
│ ┌─────────────────────────────────┐ │
│ │ See my answers and check myself │ │ PRIMARY
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**1280 px, answering (centred focused column)**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 2:15 of about 4:30 [hide]        Exam conditions · ● Recording       Leave × │
├──────────────────────────────────────────────────────────────────────────────┤
│                    ┌──────────────────────────────────────────┐              │
│                    │ ▭▭▭▭▭▭  ▬▬▬▬▬▬▬▬  Part 1 of 2             │              │
│                    │ [B: byggeplads …]   [A ★: sygeplejerske …]│              │
│                    │                  First required question  │              │
│                    │                               Your turn   │              │
│                    │                             ▸ Show text   │              │
│                    │                     0:41                  │              │
│                    │ [ Undskyld, vil du godt gentage …? ]      │              │
│                    │ [        I've finished my answer       ]  │              │
│                    └──────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────────────────┘
```
