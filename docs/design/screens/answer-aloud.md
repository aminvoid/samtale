# Visual spec: Answer aloud (focused panel)

| | |
|---|---|
| **UX spec** | [../../ux/screens/answer-aloud.md](../../ux/screens/answer-aloud.md) |
| **Route** | none (panel over the topic page) |
| **Components** | FocusedModeShell (Close variant), ExaminerPanel, ShowTextToggle, RecordingIndicator, ElapsedTimer, HintDisclosure, RepeatControl, PrimaryActionSlot, TakePlayer, AudioPlayer, ConfirmDialog, MicPermissionExplainer, MicDeniedHelp, WakeLockTip, LiveRegion |

## Container

- **375:** a full-screen sheet (`bg-surface`), entering from the block end (250 ms; fade under reduced motion). Header 56 px: Close `x` at the right · title «بلند جواب بدهید» · the role in a neutral chip «سؤال اول · A».
- **≥ 768:** a centred dialog, `max-inline-dialog` (560 px), `rounded-sheet shadow-overlay`, max height 90 dvh with internal scroll; the answer area is pinned to the dialog's block end.

## Phase 1: Listen (375)

- ExaminerPanel *speaking* (examiner tint, animated bars) with the role RoleHeader.
- The Danish question **shown by default** (DanishText `question` in a raised well) with «پنهان کردن متن».
- Answer area (pinned): PrimaryActionSlot *waiting* «گوش دهید…».

## Phase 2: Your turn (375)

| Zone | Spec |
|---|---|
| Status | RecordingIndicator pill centred: «● در حال ضبط» (or «بلند جواب بدهید؛ این پاسخ ضبط نمی‌شود.» with `mic-off`). |
| Timer | ElapsedTimer «۰:۲۳» large, reference «کتابچه حدود ۴۵ تا ۶۰ ثانیه پیشنهاد می‌کند.» beneath. Never a limit, never a colour change. |
| Question | The Danish question well (still shown) + toggle. |
| Hint | HintDisclosure «نمایش کلمه‌های کلیدی» (required questions only) → the KeywordList (saffron) in place. |
| Answer area | RepeatControl card (full width) · 12 px · PrimaryActionSlot *active* «جوابم تمام شد» (56 px). |
| Cap | InfoNote compact `circle-stop` «ضبط در ۳ دقیقه متوقف شد…» above the answer area. |
| Interrupted | ExaminerPanel area shows `circle-pause` «متوقف شد» + secondary «ادامه (بخش دوم ضبط می‌شود)»; the primary stays «جوابم تمام شد». |

## Phase 3: Compare (375)

- **Your answer:** TakePlayer (you tint) with length; **focus lands on its play button** (the ring is visible).
- **Sample answer:** RoleHeader (sample) · AudioPlayer · Danish answer expanded.
- **Actions**, in a row at the block end but **not** where Done was: secondary «دوباره ضبط کنید» (`rotate-ccw`) at the right, primary «سؤال بعدی» with a mirrored `chevron-right` (points left) at the left. On the last question: «بازگشت به موضوع». The Done slot is gone (R-04), so a second press can't skip.

## 1280 (dialog)

Same order inside the 560 px dialog. **Phase 3:** at ≥ 1024 the dialog widens to `max-inline-focused` (720 px) and shows your answer (right) and the sample (left) side by side.

## Wake-lock tip (pending the OQ-9 spike; both variants designed)

| Variant | When | Design |
|---|---|---|
| **A. Wake Lock supported** (expected) | Default | Nothing visible. The lock is silent. |
| **B. Not supported** | First answer aloud on a device without the API | WakeLockTip (InfoNote compact, `lock`) at the top of Phase 1, above the ExaminerPanel, once per device, with a dismiss `x`. It takes one or two lines and pushes nothing below the fold at 375. |

## Microphone states

First time: MicPermissionExplainer **sheet** over the panel before Phase 1. Denied: Phase 2 without recording plus a tertiary «میکروفون خاموش است ›» link to MicDeniedHelp.

## Close with a take

ConfirmDialog (2-button DiscardGuard variant): «این پاسخ را رها می‌کنید؟» · «ضبط شما پاک می‌شود.» · primary «بمانم» (focus) · destructive tertiary «رفتن».
