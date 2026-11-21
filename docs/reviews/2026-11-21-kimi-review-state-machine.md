# Independent review (Kimi): mock exam state machine

- **Reviewer:** Kimi Code CLI (`kimi -p`, read-only), 2026-11-21. Saved by the main thread.
- **Scope:** `src/features/mock-exam/machine/` (written by Codex), reviewed against `docs/ux/flows/mock-exam-state-machine.md` and ADR-0007.
- **Kimi changed no files:** `git status` was checked before and after, and every change seen was the main thread's own.
- **Main thread check:** finding 1 confirmed in the code. `BACK_PRESSED` calls `cancelLeave()` at `transition.ts:1333` without `drainDeadlines()`, while `LEAVE_CANCELLED` at line 1322 calls both.

• ## Summary

No blockers found. The machine is structurally pure and most deadline, repeat, interruption, and required-question behavior matches the specification. I found **two should-fix timing/navigation issues** and **one weak invariant test**. This was a static review; I did not execute the tests.

## Findings

### Should fix — Back does not process due deadlines when cancelling the leave dialog

**Code:** `src/features/mock-exam/machine/transition.ts:1319-1323`, `src/features/mock-exam/machine/transition.ts:1331-1333`, `src/features/mock-exam/machine/transition.ts:761-767`  
**Spec:** §7.6 says back in the leave dialog is `LEAVE_CANCELLED`; §10 R1 and I4 prohibit starting a new unit after the limit, except required U2.

`LEAVE_CANCELLED` calls `drainDeadlines()` before `cancelLeave()`, but the equivalent `BACK_PRESSED` path calls only `cancelLeave()`.

Consequently, if the exam clock passes C2 while a clip is deferred behind the leave dialog and the host’s `TICK` is delayed, back can restart that clip without first processing `LIMIT_REACHED`. For a second-part follow-up, this emits an impermissible `playClip`; ordinary leave cancellation instead processes the limit and advances toward closing.

**Fix:** Make back use the same sequence as `LEAVE_CANCELLED`:

```ts
drainDeadlines();
cancelLeave();
```

Add a regression test comparing back and ordinary cancellation with a deferred follow-up and a passed limit. Assert identical behavior and no follow-up `playClip`.

### Should fix — Late grace processing records time beyond the grace deadline

**Code:** `src/features/mock-exam/machine/transition.ts:846-848`, `src/features/mock-exam/machine/transition.ts:499-507`, `src/features/mock-exam/machine/transition.ts:531-541`  
**Spec:** §10 R4 ends the answer at `GRACE_EXPIRED`; §7.4 stops the exam clock and records `totalMs` when entering closing.

The grace branch correctly calls `finishAnswer(due.at)`, so `answerMs` stops at the grace deadline. However, when that directly enters closing, `closeAttempt()` and `makeAttempt()` still use the outer event’s `at`.

For example, if grace expires at 290 s but the next `TICK` or `DONE` arrives at 295 s, the persisted `totalMs` is 295 s rather than 290 s. The C22 path does not have this problem because it explicitly clamps the clock to 330 s.

**Fix:** Thread the effective transition timestamp through `finishAnswer` → `afterAnswer` → `closeAttempt`, using `due.at` when grace directly causes closing. Preserve the current outer timestamp when closing is genuinely deferred by an open leave dialog. Extend T13 with an overshooting tick and assert `totalMs === examLimit + grace`.

### Nit — I15 does not actually detect every prohibited answer-phase entry

**Test:** `src/features/mock-exam/machine/machine.test.ts:1416-1427`  
**Spec:** I15 / §7.6 R35: while the exam leave dialog is open, no answer phase starts.

The property only checks that `answersStarted` is unchanged. A resumed answer following a repeat uses `answer(true)` and deliberately does not increment `answersStarted`, so an erroneous `run.unit.repeating` → `run.unit.answering` transition behind the dialog would pass this test.

**Fix:** When `after.context.leaveDialog` is true, explicitly reject transitions from a non-answering state into `run.unit.answering`, independently of the counter. Keep the existing counter assertion to catch new answers as well.

## Verified as correct

- `src/lib/exam/config.ts` matches C1–C22, including C17 = 150 s, C21 = 200 s, C22 = 330 s, and their ordering constraints.
- Deadline arithmetic correctly compensates for accumulated elapsed time after freeze/thaw; exam deadlines do not run during technical holds.
- Grace counts answering time only and is suspended during repeats and holds. The recording cap independently preserves its remaining recording time across repeats and interruptions.
- C17 skips unstarted part-1 follow-ups while allowing already-started units to finish. Normal closing paths cannot bypass required U2.
- Repeat counts, slower practice repeats, interruption-recovery replays, and duplicate `DONE` handling match the specified rules.
- Normal completion, interruption, rerecording, and leaving paths correctly pair recording stop/discard behavior and release the microphone before closing audio or navigation.
- No hidden clock, randomness, DOM, media, or storage side effects were found in the pure machine modules.

