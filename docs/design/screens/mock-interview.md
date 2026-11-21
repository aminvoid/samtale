# Visual spec: Mock exam interview, dialogs, end

| | |
|---|---|
| **UX spec** | [../../ux/screens/mock-interview.md](../../ux/screens/mock-interview.md); behaviour: [state machine](../../ux/flows/mock-exam-state-machine.md) |
| **Routes** | states of `/fa/mock/practice` and `/fa/mock/exam` |
| **Components** | FocusedModeShell, ExamClock, TimersToggle, RecordingIndicator, StepIndicator, SituationCard (compact), ExaminerPanel, ShowTextToggle, GraceNotice, InfoNote, ElapsedTimer, RepeatControl, HintsSheet, PauseButton, RerecordButton, PacingAid, PrimaryActionSlot, TapToHear, LeaveDialog, InterruptionDialog, AudioErrorDialog, PauseOverlay, EndScreen, LiveRegion |

The screen is built in three stacked zones that never change position: **header** (top), **context + examiner** (middle, scrolls if needed), **answer area** (bottom, pinned). Only labels and contents change between phases, so the eye and the thumb always know where to go.

## 375 px

### Header (88 px: 56 + a 32 px indicator line; sticky only per "Pinning" below)
- Right: Leave (`log-out` mirrored + «خروج»).
- Middle: mode chip «شرایط آزمون» / «تمرین».
- Left: ExamClock «۲:۱۵ از حدود ۴:۳۰» (practice «۱:۰۲») + TimersToggle (`eye-off`).
- Line 2: RecordingIndicator pill, start-aligned: «● در حال ضبط» while answering with a microphone; «میکروفون آماده است» between answers; «ضبط نمی‌شود» without one.

### Context strip
- StepIndicator: two pills filling from the right + «بخش ۱ از ۲ · سؤال موقعیت».
- Two compact SituationCards side by side (A on the right), 8 px gap.
  - The chosen one is in the **selected** style with «موقعیت ممتحن»; the other is dashed.
  - Titles **wrap** to as many lines as they need (rev. 1.1, M5: no ellipsis), so the strip can grow to about 120 px.
  - They're not interactive.

### Examiner panel
- ExaminerPanel: RoleHeader of the unit («سؤال اجباری اول»), status («ممتحن صحبت می‌کند…» with animated bars on the examiner tint → «نوبت شماست» on the you tint with `mic`).
- ShowTextToggle; revealed Danish in a raised well. Practice: Persian meaning under fixed lines.
- Notices slot directly under the panel: GraceNotice (exam, after the limit), recording-cap InfoNote, "next answers won't be recorded" InfoNote. Only one shows at a time (the state machine guarantees it).

### Answer area (`bg-surface-raised`, `shadow-raised` on its top edge when pinned, safe-area padding; pinned only per "Pinning" below)

The RepeatControl is named by its action label alone; the Danish and Persian lines are its description (rev. 1.1, M2).
1. ElapsedTimer «۰:۴۱» (centred, `text-h2` size here to save height); practice adds «حدود ۴۵ تا ۶۰ ثانیه پیشنهاد می‌شود».
2. RepeatControl card (full width) + tertiary «شنیدن دوبارهٔ موقعیت» on the first question; practice from the second repeat: «آهسته‌تر بشنوید».
3. Practice row: secondary «راهنمایی» (`lightbulb`) · «توقف» (`pause`) · «دوباره ضبط کنید» (only while recording), each ≥ 44 px, wrapping to two rows at 200 % text.
4. PrimaryActionSlot 56 px: «گوش دهید…» (aria-disabled) ↔ «جوابم تمام شد».
5. First answer only: the hint line under the slot.

### Pinning (rev. 1.1, a11y audit S2 and S3; mandatory)

The header (88 px) and the answer area (about 300 px in practice, 250 px in exam conditions) are pinned **only when there's room for both**:

| Condition | Header | Answer area |
|---|---|---|
| Viewport height > 30 rem, answer area ≤ 40 % of the viewport height, text ≤ 150 % | `sticky` at the top | `sticky` at the bottom |
| Viewport height ≤ 30 rem (landscape phones, 200 % zoom on a laptop) | `static` | `static` |
| Answer area > 40 % of the viewport height (a long repeat card, wrapped practice row, large text) | `static` | `static` |

- **Both together:** when one unpins, both unpin. Content then flows: header, strip, panel, notices, answer area. Focus order is unchanged because the DOM order is the visual order.
- **Examples:** at 375 × 667 (300 / 667 = 45 %), practice unpins; exam conditions (250 / 667 = 37 %) stays pinned. At 375 × 812, both modes stay pinned.
- **Offsets:** `--sticky-offset` and `--bottom-offset` are the bars' **measured** heights (ResizeObserver, handoff H-9), or 0 when they're static. A focused control therefore never sits under a bar (2.4.11).
- **Primary stays reachable:** when unpinned, the primary action is the last element of the screen. On a short landscape screen the learner scrolls once to reach it, and it doesn't move again during the attempt. Keyboard and screen-reader users are unaffected: focus stays on the slot (UXD-08).

**Exam vs practice, visually:** identical layout; exam has no practice row, and the clock reads "of about 4:30". No colour difference between modes (the chip says which mode).

### Grace (exam)
GraceNotice (accent tint, `info`): «می‌توانید جمله‌تان را تمام کنید. بعد ممتحن آزمون را تمام می‌کند.» The clock keeps its normal style («۴:۳۶ از حدود ۴:۳۰»). Done and Repeat unchanged.

### Timers hidden
- The header's left side shows «زمان‌سنج‌ها پنهان است».
- The TimersToggle keeps its constant name «پنهان کردن زمان‌سنج‌ها» with `aria-pressed="true"`, the `eye` icon, and its 2 px accent outline (rev. 1.1, M3 and S4).
- The ElapsedTimer row collapses. When pinned, the primary doesn't move, because the area is anchored at the bottom.

## Dialogs (375: centred card, 16 px margins; 1280: 480 px)

| Dialog | Icon | Title | Body highlights | Actions (top to bottom) |
|---|---|---|---|---|
| Leave | `log-out` | «از این آزمون خارج می‌شوید؟» | practice «آزمون متوقف است.» / exam «ساعت همچنان کار می‌کند.» | primary «ادامهٔ آزمون» · secondary «پایان و دیدن پاسخ‌هایم» (after the first answer) · tertiary destructive «ترک بدون ذخیره» + note |
| Interruption | `circle-pause` | exam «آزمون وقتی نبودید متوقف شد.» / practice «آزمون متوقف است.» | reason; «ساعت در ۲:۳۰ متوقف شد و از همان‌جا ادامه می‌دهد.»; **«این آزمون "قطع‌شده" علامت می‌خورد. این یعنی رد شدن نیست.»** in 600 | primary «ادامه (سؤال دوباره پخش می‌شود)» · secondary «شروع دوباره (این آزمون نگه داشته نمی‌شود)» · secondary «پایان و دیدن پاسخ‌هایم» |
| Audio error | `circle-alert` | «صدای ممتحن پخش نشد.» | «ساعت متوقف است.» | primary «دوباره امتحان کنید» · secondary «پایان و دیدن پاسخ‌هایم» |
| Paused (practice) | `circle-pause` | «متوقف شد» | – | primary «ادامه» · secondary «پایان و دیدن پاسخ‌هایم» · tertiary destructive «ترک بدون ذخیره» |
| Hints (practice) | – | Bottom sheet «راهنمایی» | translation · key words · template | Close `x` |

None of these use danger colour except the "leave without saving" text button.

## Back-guard spike: both variants

| Variant | Design |
|---|---|
| **A. Guard enabled** (C19 on; expected) | System back opens the **LeaveDialog** exactly as Leave does, with the same default focus on «ادامهٔ آزمون». If a sheet or another dialog is open, back closes the topmost layer first (no visual of its own). |
| **B. Fallback** (guard unreliable) | Back leaves the runner; the attempt is saved as "ended early". There's no UI here; the notice appears on `/fa/mock` ([mock-start.md](mock-start.md#back-guard-spike-the-two-variants-of-the-notice-c19-pending-oq-9)) and the review/history show the neutral fact «زودتر تمام شد». |

## End view

FocusedModeShell with Close only. Centred column: closing line card (examiner tint, RoleHeader «جملهٔ ممتحن», SourceLabel «متن SIRI», *"Tak, så er prøven forbi."* in `text-da-line`) · `h1` «آزمون تمام شد» · «زمان کل: ۳:۵۲» `text-lead` (+ «قطع شد» and «زمان قطع شدن حساب نمی‌شود.» if so) · primary pinned «پاسخ‌هایم را ببینم و خودم را بسنجم». Nothing celebratory, nothing evaluative.

## 1280 px

Centred focused column 720 px inside a calm empty page (`bg-surface`). The header spans the full width (Leave far right, timers far left) and stays sticky above 30 rem of viewport height; at 200 % zoom on a laptop it becomes static (S3). Situation cards as a row; panel; the answer area **not pinned** (it sits under the panel), primary 48 px tall, 100 % of the column. Practice: the PacingAid may sit beside the answer area at ≥ 1280 (two columns 2:1).
