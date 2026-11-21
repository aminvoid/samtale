# Flow: mock exam under exam conditions

| | |
|---|---|
| **Stories** | US-026 to US-035, US-037, US-038, US-039, US-069 (Could), US-062, US-063 |
| **WCAG** | 2.2.1 Timing adjustable: an essential time limit, announced up front, with practice as the adjustable alternative (styling-a11y rules) |
| **Behaviour spec** | [mock-exam-state-machine.md](mock-exam-state-machine.md) |
| **Screens** | [mock-start](../screens/mock-start.md), [mock-get-ready](../screens/mock-get-ready.md), [mock-draw-and-look](../screens/mock-draw-and-look.md), [mock-interview](../screens/mock-interview.md), [mock-review](../screens/mock-review.md) |

## Goal

Run delprøve 2 as close to the real thing as the app can (US-037), so that "nothing about delprøve 2 is new on exam day" (PRD §1): a random topic from one real exam term, a fixed 10-second look, one continuous clock of about 4½ minutes from the situation intro, no pause, no hints, the examiner's real lines, and a calm end.

## Entry points

`/fa/mock` → **Exam conditions** (second card). There's no shortcut from a topic page, because the topic must come from the draw (US-040 #3).

## Journey, with the clock

```mermaid
sequenceDiagram
  autonumber
  participant L as Learner
  participant A as App screen
  participant E as Examiner voice
  participant C as Exam clock
  L->>A: Choose "Exam conditions" (rules shown up front)
  A->>L: Get ready: sound check, microphone
  L->>A: Continue
  A->>L: Three identical face-down cards
  L->>A: Tap a card
  A->>L: Reveal: letter, topic, term, pre-2023 label; audio loading
  L->>A: Start (the audio-unlocking tap)
  E->>L: "Her er der to billeder … emnet [emne] … 10 sekunder …"
  A->>L: 10-second countdown (fixed); Danish situation titles only
  A->>L: "The examiner chose situation A"
  E->>L: Situation intro
  C-->>C: clock starts at the intro's first sound
  E->>L: First required question
  L->>A: Answer (recording) … Done
  E->>L: "Tak." → suggested follow-up
  L->>A: Answer … Done
  E->>L: "Tak." → "Nu vil jeg stille dig et spørgsmål af en mere overordnet karakter." → general question
  L->>A: Answer … Done
  E->>L: "Tak." → suggested follow-up
  L->>A: Answer … Done (or the grace period ends after 4:30)
  E->>L: "Tak, så er prøven forbi."
  A->>L: End view → review
```

## Steps

1. **Choose mode** (US-026): the exam-conditions card says plainly, **before anything starts**: random topic; a continuous clock of about 4½ minutes; **it can't be paused**; no hints; no re-recording; you can leave at any time; "show text" stays available; **if a call or the screen interrupts, the exam stops and waits, and is marked "interrupted", not failed** (rev. 2, R-07). It offers practice as the alternative (US-026 #3; WCAG 2.2.1).
2. **Get ready** (US-027): the rules again in a compact list; a "turn on Do Not Disturb" tip (R-07); the auto-lock tip if the wake lock is unsupported (R-01); sound check; microphone; Continue. No topic options, and no "always show text" (it doesn't apply here, R-12).
3. **Instruction** (US-069, Could): optional, skippable, outside the clock.
4. **Draw** (US-028): three identical, unmarked face-down cards ("card 1 of 3" etc. as accessible names). The cards hold the A, B and C topics of one real term, in random order (US-028 #3). Tap one.
5. **Reveal and load** (US-027 #4–#7): letter and topic; all audio for the attempt loads before anything starts. **Start** is the tap that unlocks audio on iOS (UXD-06). No timer runs before Start.
6. **Intro line and look** (US-029): SIRI's line, verbatim; two text cards with the Danish titles only (no translations, US-029 #4); the note that the real exam shows pictures; a fixed 10-second countdown. No pause, extend or skip.
7. **Situation**: the app picks A or B at random and marks it (US-030 #1). The cards stay visible in compact form for the rest of the interview, like the sheet on the exam table (UXD-07).
8. **Interview** (US-030 to US-034): the clock starts with the situation intro (US-030 #4). Each answer: recording (if on), **Done**, **Repeat** (the clock keeps running, US-032 #4), **Show text** (noted neutrally in the review, US-030 #5). Timers show "elapsed m:ss of about 4:30" and the answer's elapsed time, both hideable together (UXD-05; OQ-19). No phase bands, no "move on" prompts (OQ-3).
9. **Part-1 cut-off** (rev. 2, R-10, decided by delegation; state machine §10 R0–R1a): both required questions are always asked. From 2:30 (C17) no new part-1 follow-up starts. If a part-1 answer is still running at 3:20 (C21; rev. 2.1, decided by delegation, 2026-11-20), a calm notice says "You can finish your sentence. Then the examiner will ask the next question." and the answer gets 20 s of grace; then the general question comes. The cut-off is noted neutrally in the review, without SIRI attribution.
10. **The limit** (US-035 #2; state machine §10): no new question starts after 4:30 (except the general question if it hasn't been asked). An answer in progress ends at the learner's Done or after 20 s of answering (grace), with a calm notice that leads with permission: "You can finish your sentence. Then the examiner will end the exam." (R-09). A question already being asked finishes first.
11. **Closing** (US-035): recording stops, the microphone is released, *"Tak, så er prøven forbi."*
12. **End view** (US-035 #5): "The exam is over." No grade, score or pass/fail. One action: see my answers.
13. **Review** ([mock-review.md](mock-review.md)): total time; if under 4:30, the neutral note that a real examiner fills about 4½ minutes with more follow-ups (US-035 #7).

## Differences from practice (summary)

See [state machine §13](mock-exam-state-machine.md#13-differences-between-the-modes). The learner-visible ones: no options, no pause, no hints, no record again, no look controls, no translations, a running clock with a grace period, "interrupted" label after any interruption.

## States and edge cases

| Situation | Behaviour | Ref |
|---|---|---|
| Microphone denied or none | Same run without recording | US-027 #3 |
| Leave pressed | Dialog: Continue the exam · End and see my answers · Leave without saving. The **clock keeps running**; no new question or answer phase starts while it's open (R-35). | US-039 #4; UX-OQ-02 |
| Phone call (incl. a call banner while answering), tab hidden, screen locked | Everything stops and freezes; on return the dialog gives a reason and "the clock stopped at m:ss": Continue (replays the current question) · Start again (this attempt won't be kept) · End and see my answers. Continuing or ending labels the attempt "Interrupted" (never "failed"). | US-038 #1–#3, US-037 #5; R-03, R-08 |
| Screen would auto-lock while the learner speaks | Prevented by the Screen Wake Lock; where unsupported, the get-ready tip, and the lock is an interruption | R-01 |
| Clip fails to play despite preloading | Timers pause; Retry · End and review; labelled "Interrupted" | US-038 #7 |
| Browser blocks audio | "Tap to hear the examiner"; the clock is frozen until the clip starts; not labelled interrupted | US-030 #8, state machine §7.5 |
| Microphone can't be re-opened after an interruption | Notice "your next answers won't be recorded"; the attempt continues | R-03 |
| Reload or tab discarded | "Couldn't be kept" view; nothing saved | US-038 #4 |
| Browser or system back | Closes any open sheet or dialog first, then opens the leave dialog (behind the ADR-0007 flag; fallback: saved as "ended early" with a notice on `/fa/mock`) | R-02; state machine §12.4 |
| Part 1 runs long | From 2:30 no new part-1 follow-up; at 3:20 handover notice + grace; the general question is always asked | R-10; exam review S1 |
| Repeats during grace | Never beyond 5:30 on the clock (C22) | exam review suggestion 1 |
| Learner finishes all four answers by 3:00 | Closing plays after the last Done; review shows 3:00 and the neutral note | US-035 #7 |
| No term has a complete published A/B/C set (during content review) | Cards hold three different published topics; each reveal shows its real term and letter | US-028 #5 |

## Exits

- **Completed** → review; history label "Exam conditions".
- **Interrupted, then continued or ended** → review; label "Interrupted".
- **"End and see my answers"** (leave dialog), or back under the fallback → review; label "Exam conditions · ended early".
- **Left without saving, restarted, reload-lost** → not saved (US-039 #5).
