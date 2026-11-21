# Screen: Shadowing

| | |
|---|---|
| **Route** | `/fa/shadow/{contentId}` (focused mode) |
| **Stories** | US-024 (Should, D-7), US-025 (Could), US-015 #3 (speed), US-044, US-063 |
| **Flows** | [shadowing](../flows/shadowing.md) |
| **Dependency** | Sentence boundaries and per-sentence timings (UX-OQ-15) |
| **Milestone** | M3 |

## Purpose

Hear one sentence, say it, compare: pronunciation and rhythm practice on the exact sentences the learner is studying.

## Content hierarchy

1. **Focused header:** Close (start side, right) · title "Shadowing" · the source ("Sample answer · situation A · *Mangel på arbejdskraft*")
2. **Progress:** "Sentence 3 of 5" with a step indicator that fills from the right (mirrors) (US-024 #1)
3. **Context:** the full Danish text, the current sentence marked with an underline and weight (not colour alone); other sentences de-emphasised; tapping a sentence jumps to it
4. **Current sentence**, large, Danish
5. **Controls** (bottom, thumb zone):
   - **Listen** (play this sentence; speed control beside it)
   - **Record** / **Stop** (primary once listened)
   - **Compare** (plays original, then mine) — appears when a take exists
   - **Play mine** (secondary)
   - **Previous** · **Next** (arrows mirror)

## Components

FocusedModeShell, StepIndicator, SentenceText (with current-sentence marking), PlayButton, SpeedControl, RecordButton, RecordingIndicator, TakePlayer, CompareButton, PrevNextControls, ConfirmDialog, MicPermissionExplainer, MicDeniedHelp, LiveRegion.

## States

| State | Behaviour |
|---|---|
| First-time | MicPermissionExplainer appears at the first Record tap, not on open. |
| Loading | The sentence audio (from the answer's single clip with timings) loads on the first Listen. |
| Empty | Timing data missing → this page isn't linked to (no broken state). Direct URL with an unknown ID → not-found. |
| Error | Audio failed: Listen shows Retry; the text remains. |
| Slow network | Listen shows loading. |
| Microphone denied | Record replaced by "Say it aloud, then go to the next sentence" (US-024 #5); Compare hidden. |
| Storage unavailable | No effect. |
| Recording | RecordingIndicator (icon + "Recording" + elapsed); Stop is the primary; 30 s cap per sentence (proposal). |
| Interrupted (tab hidden, microphone muted while recording) | Audio and recording stop; the take so far is kept. The Screen Wake Lock is held while shadowing (rev. 2, R-01). |
| Finished a whole answer | Reaching "Done" on the last sentence counts the topic as practised (rev. 2, UX-OQ-05); a calm toast confirms it. |
| Close with takes | ConfirmDialog "Your recordings will be deleted." (US-044 #2) |

## Responsive behaviour

| Width | Layout |
|---|---|
| 375 | Context text collapsible (default collapsed to two lines around the current sentence); current sentence large; controls pinned at the bottom: Prev · [Record] · Next on one row, Listen and Compare above. |
| 768 | Context expanded. |
| 1280 | Centred focused column (~640 px); same order. |

## RTL and bidi

- All learning text is Danish (LTR blocks). Interface Persian.
- **Step indicator and Prev/Next arrows mirror** (US-024 #4): "Next" points left.
- Play, record and the audio progress bar don't mirror.
- "Sentence 3 of 5" uses Persian digits via an ICU message.

## Accessibility

- Focused mode: page `h1` is "Shadowing"; focus moves to it on open.
- Live region: "Sentence {n} of {total}" when moving; "Recording" / "Recording stopped". Not on every audio play.
- Prev/Next are buttons with names "Previous sentence" / "Next sentence"; disabled at the ends (`aria-disabled`, still focusable).
- The current-sentence marking is also exposed by moving the current sentence into its own labelled region ("current sentence").
- Keyboard: all controls in visual order; no single-key shortcuts.

## Copy needs

| Key | Intended meaning |
|---|---|
| `shadow.title` | Shadowing |
| `shadow.source` | {kind} · {part} · {topicName} |
| `shadow.progress` | Sentence {n} of {total} |
| `shadow.listen` / `.record` / `.stop` / `.compare` / `.playMine` | Listen · Record · Stop · Compare · Play mine |
| `shadow.prev` / `.next` / `.done` | Previous sentence · Next sentence · Done |
| `shadow.noMic` | Say it aloud, then go on to the next sentence. |
| `shadow.discard.body` | Your recordings will be deleted. |

## Wireframe

**375 px**
```
┌─────────────────────────────────────┐
│ Shadowing · Sample answer · sit. A ×│
├─────────────────────────────────────┤
│               Sentence 3 of 5       │
│  ○ ○ ● ● ●   (fills from the right) │
│ ▸ [da: … For det andet er lønnen    │
│   ikke høj nok …]  (context)        │
│                                     │
│ [da: For det andet er lønnen ikke   │
│  høj nok i forhold til ansvaret.]   │ large
│                                     │
│ [▶ Listen]   Speed [1×]             │
│ [Compare]   [Play mine]             │
│ ┌──────┐ ┌───────────────┐ ┌──────┐ │
│ │ Next │ │  ● Record     │ │ Prev │ │  Next on the left (mirrored)
│ │  ‹   │ │               │ │  ›   │ │
│ └──────┘ └───────────────┘ └──────┘ │
└─────────────────────────────────────┘
```
