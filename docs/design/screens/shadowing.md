# Visual spec: Shadowing

| | |
|---|---|
| **UX spec** | [../../ux/screens/shadowing.md](../../ux/screens/shadowing.md) |
| **Route** | `/fa/shadow/{contentId}` (focused mode) |
| **Components** | FocusedModeShell, StepIndicator, SentenceText, PlayButton, SpeedControl, RecordButton, RecordingIndicator, TakePlayer, CompareButton, PrevNextControls, ConfirmDialog, MicPermissionExplainer, MicDeniedHelp, WakeLockTip, LiveRegion |

## 375 px

| Zone | Spec |
|---|---|
| Header | Close `x` at the right · `h1` «سایه‌خوانی» (`text-h3` size) · source chip «پاسخ نمونه · موقعیت A · <bdi lang="da">Mangel på arbejdskraft</bdi>» (truncates; full text in the accessible name) |
| Progress | StepIndicator dots filling from the right + «جملهٔ ۳ از ۵» `text-label` |
| Context | Collapsible SentenceText (collapsed to two lines around the current sentence): `text-da-answer` at 16 px, others `text-text-muted`, the current one `text-text` with an accent underline |
| Current sentence | `text-da-sentence` (24/1.5/500) in a raised card, `p-5`, labelled region «جملهٔ فعلی» |
| Controls | Row 1: PlayButton *neutral* «گوش دادن» with visible label + SpeedControl compact. Row 2 (when a take exists): CompareButton · secondary «پخش صدای من». Row 3 pinned (answer area): PrevNextControls at the ends (next at the **left**, mirrored chevron) and the RecordButton (`lg`, 56 px) in the middle. |
| Recording | RecordButton becomes «توقف» (`bg-rec`); RecordingIndicator with elapsed above the row |
| No microphone | RecordButton replaced by InfoNote compact «بلند بگویید، بعد به جملهٔ بعد بروید»; Compare hidden |
| Finished | Next on the last sentence reads «تمام» (primary); Toast «این موضوع تمرین‌شده ثبت شد» |

## 1280 px

Centred focused column 640 px; context expanded by default; same vertical order; controls not pinned (they sit under the current sentence).

## Wake-lock tip

Same two variants as answer aloud: nothing (supported) / a one-time WakeLockTip at the top (unsupported).
