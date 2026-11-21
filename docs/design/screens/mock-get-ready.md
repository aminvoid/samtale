# Visual spec: Mock exam, get ready

| | |
|---|---|
| **UX spec** | [../../ux/screens/mock-get-ready.md](../../ux/screens/mock-get-ready.md) |
| **Routes** | `/fa/mock/practice`, `/fa/mock/exam` (first view) |
| **Components** | BackLink, PageHeader, RulesList, RadioGroup, Picker, Switch, ReadinessChecklist, SoundCheck, MicPermissionExplainer (inline), MicDeniedHelp, MicLevelMeter, PrimaryActionSlot, InfoNote, WakeLockTip, TipLine |

Normal app chrome (header) but **no tab bar** on phones, so the thumb zone belongs to Continue.

## 375 px

| Zone | Spec |
|---|---|
| Header | BackLink «آزمون تمرینی» · `h1` «تمرین: آماده شدن» / «شرایط آزمون: آماده شدن» |
| Exam rules (exam only) | A raised card with RulesList (compact) and tertiary «به‌جای آن تمرین کنید» |
| Tips | Exam: TipLine (`bell-off`) Do Not Disturb. Both: WakeLockTip **only in variant B** (below). Compact InfoNotes, 8 px apart. |
| Practice options | One summary row: «قرعه‌کشی یک موضوع · ممتحن موقعیت را انتخاب می‌کند» + tertiary «تغییر ›» opening a Sheet (RadioGroups for topic and situation, optional pacing Switch). With "always show text" on: a second summary line «متن ممتحن: همیشه نمایش داده می‌شود · تغییر». |
| Check 1: Sound | SoundCheck row: tile «۱», `h2` «آیا صدا به اندازهٔ کافی بلند است؟», status chip at the left. Secondary «پخش» · **the sample line placeholder (UX-OQ-10):** DanishText `line` *"Hej. Velkommen til prøven."* (draft, `content-engineer`), Persian meaning «سلام. به آزمون خوش آمدید.» · buttons «بله، می‌شنوم» (secondary) / «صدایی نمی‌آید» (tertiary). The design holds lines up to ~60 characters on two lines. |
| Check 2: Microphone | Never asked: MicPermissionExplainer inline (facts list, primary-style secondary «اجازه دادن به میکروفون», tertiary «ادامه بدون ضبط»). Granted: row collapses to `check` «میکروفون آماده است» + optional MicLevelMeter. Denied: MicDeniedHelp with «ادامه بدون ضبط» selected. |
| Primary | PrimaryActionSlot pinned: «ادامه به قرعه‌کشی». aria-disabled until the microphone row is decided, reason beneath: «اول دربارهٔ میکروفون تصمیم بگیرید.» |

Only one filled button on screen at a time: while the microphone is undecided, "Allow microphone" is styled **secondary** so Continue (aria-disabled) remains the single primary.

## 1280 px

Two columns under the h1 in `max-inline-page`: start (right) rules and options; end (left) the two checks. Continue (`md`, 240 px wide) under both, at the inline start, not pinned.

## Wake-lock tip: both variants (pending the OQ-9 spike)

| Variant | Design |
|---|---|
| **A. Wake Lock supported** | No tip. Nothing reserves space. |
| **B. Not supported** | WakeLockTip (`lock`): «ممکن است صفحه هنگام صحبت خاموش شود. قفل خودکار گوشی را روی ۲ دقیقه یا بیشتر بگذارید.» shown **once per device** in the tips zone, both modes, above the checks, dismissible. In exam conditions it sits under the Do Not Disturb line, same style. |

## Instruction step (Could)

After Continue the view becomes «دستور ممتحن»: ExaminerPanel speaking with the text visible (DanishText `line`), primary slot «رد شدن».

## States

Sound clip loading: PlayButton loading. Clip failed: inline «نمونه بارگیری نشد» + retry; Continue still enabled. `?topic=` invalid: InfoNote at the top.
