# Visual spec: Mock exam, draw and look

| | |
|---|---|
| **UX spec** | [../../ux/screens/mock-draw-and-look.md](../../ux/screens/mock-draw-and-look.md) |
| **Routes** | states of `/fa/mock/practice` and `/fa/mock/exam` |
| **Components** | FocusedModeShell, DrawCard ×3, RevealPanel, TermLabel, Pre2023Badge, LoadProgress, PrimaryActionSlot, InfoNote, SituationCard (look), TranslationToggle, ExaminerPanel, ShowTextToggle, SourceLabel, Countdown, LookControls, ChoiceButtons, LeaveDialog, TapToHear |

Focused mode from here: header with Leave (right) and the mode chip; no timers yet.

## View 1: Draw (375)

- `h1` «یک موضوع قرعه بکشید» + `text-body text-text-muted` «مثل آزمون: سه برگهٔ یکسان. یکی را انتخاب کنید.»
- Three **DrawCards** in one row (each ≈ 100 × 134 px, 12 px gap), centred vertically in the remaining space. Identical; no marks.
- Nothing in the answer area (no primary until a card is drawn).

## View 2: Reveal and load (375)

- The tapped card flips (250 ms; crossfade under reduced motion) and grows into the RevealPanel at full width: letter tile «B» (72 px), *Mangel på arbejdskraft* (`text-da-question` 700, flow), «کمبود نیروی کار», TermLabel chip `Maj–Juni 2024 · B`, Pre2023Badge explained if older.
- First-time InfoNote compact: «حرفی که گرفتید حرف واقعی این موضوع در آزمون است.»
- LoadProgress (fills from the right) + «حدود ۱ مگابایت، فقط یک بار».
- Clock note `text-caption`: exam «ساعت وقتی شروع می‌شود که ممتحن موقعیت را معرفی کند.» / practice «هر وقت خواستید می‌توانید متوقف کنید.»
- PrimaryActionSlot: «شروع» aria-disabled with «در حال بارگیری…» → active. The other two cards fade to 60 % and move above the panel as small thumbnails. They're native `disabled`, so they leave the tab order (rev. 1.1, a11y audit m8).
- Slow / failed: LoadProgress states (calm InfoNote; «هنوز چیزی شروع نشده.»).

## View 3: Intro line and look (375, must fit 560 px of height: R-26)

| Zone | Height budget |
|---|---|
| Header | 56 |
| `h1` Danish topic name (`text-da-card` size, 600, flow) | 32 |
| SituationCard A (look) | ~120 |
| SituationCard B (look) | ~120 |
| Pictures note: InfoNote compact (one line after three attempts) | 28–48 |
| ExaminerPanel speaking (compact, one line + Show text) → Countdown ring 112 px + label | ~140 |
| Primary slot 56 + padding | ~80 |

Total ≈ 560–600 px; at 375 × 667 (iPhone SE) it fits; at smaller heights the card titles may wrap and the area scrolls; the primary stays pinned.

- **Exam:** primary «در حال نگاه کردن…» (aria-disabled). **Practice:** LookControls row (+۱۰ ثانیه · توقف) and primary «آماده‌ام»; tertiary «نمایش ترجمه‌ها» under the cards toggles Persian titles on both.
- Countdown: ring and digits, no colour change.

## View 4: Situation chosen / choose (375)

- Random: the chosen card gets the selected style + label «ممتحن این موقعیت را انتخاب کرد», the other gets the dashed style; after ~1 s both shrink into the compact strip of the interview (crossfade under reduced motion).
- Practice "let me choose": ChoiceButtons replace the countdown area.

## 1280 px

Centred focused column 720 px. Draw cards 160 × 213 px. Look: cards side by side (A right), countdown centred beneath, primary under it (not pinned).

## Playback blocked (iOS)

PrimaryActionSlot becomes TapToHear «برای شنیدن ممتحن ضربه بزنید»; the ExaminerPanel shows `volume-2`.
