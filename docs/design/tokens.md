# Design tokens (v1)

| | |
|---|---|
| **Status** | v1, ready for build. Visual direction "Fjord" (recommended in [identity.md](identity.md); the owner may still choose another, which changes colour values only). |
| **Date** | 2026-11-19 |
| **Author** | `ui-designer` |
| **Source of truth** | [`src/styles/tokens.css`](../../src/styles/tokens.css) (Tailwind v4 `@theme static`), imported by [`src/app/globals.css`](../../src/app/globals.css) |
| **Read with** | [design-principles.md](design-principles.md), [components.md](components.md), [screens/](screens/) |

Tokens are **semantic**: a component asks for "the examiner's colour" or "a Danish question", never for "indigo 700" or "20 px". Tailwind's default palette is removed (`--color-*: initial`), and the lint rule already forbids palette classes and raw hex.

---

## 1. Colour

### 1.1 Neutrals and actions

| Token | Utility examples | Light | Dark | Use |
|---|---|---|---|---|
| `--color-surface` | `bg-surface` | `#faf8f4` | `#121619` | Page background (warm paper / deep slate) |
| `--color-surface-raised` | `bg-surface-raised` | `#ffffff` | `#1b2126` | Cards, sheets, dialogs, the tab bar |
| `--color-surface-sunken` | `bg-surface-sunken` | `#f2efe9` | `#0c0f12` | Wells: Persian translation, slider tracks, the aria-disabled primary slot, skeletons |
| `--color-text` | `text-text` | `#1b2228` | `#eceae5` | Body text, headings, all Danish learning text |
| `--color-text-muted` | `text-text-muted` | `#4d5761` | `#aeb5bc` | Secondary text, meta lines, Persian translations, hints. AA on every surface. |
| `--color-border` | `border-border` | `#e2ddd3` | `#2b333a` | Decorative dividers and card edges. **No contrast duty**: never the only boundary of a control. |
| `--color-border-strong` | `border-border-strong` | `#7d848c` | `#7c858e` | Control boundaries: inputs, checkboxes, radio rings, switch tracks, the slider track (≥ 3:1) |
| `--color-scrim` | `bg-scrim` | `rgb(18 22 25 / .5)` | `rgb(0 0 0 / .6)` | Behind dialogs and sheets |
| `--color-shadow`, `--color-shadow-strong` | (inside shadows) | 8 % / 16 % ink | 35 % / 55 % black | Shadow colour; lets dark mode deepen shadows |
| `--color-accent` | `bg-accent`, `text-accent` | `#0d5c6b` | `#6cc4d1` | Primary buttons, links, selected states, progress fills |
| `--color-accent-hover` | `hover:bg-accent-hover` | `#0a4a57` | `#8ad3de` | Hover on accent fills |
| `--color-accent-active` | `active:bg-accent-active` | `#083e49` | `#a6dfe7` | Pressed accent fills |
| `--color-accent-subtle` | `bg-accent-subtle` | `#e3f0f1` | `#143a41` | Selected rows and segments, info notes, the grace notice, "you" tint |
| `--color-accent-contrast` | `text-accent-contrast` | `#ffffff` | `#0a1f24` | Text and icons on accent fills |
| `--color-focus` | (global `:focus-visible`) | `#0d5c6b` | `#6cc4d1` | 3 px focus ring, 2 px offset |
| `--color-danger` | `bg-danger`, `text-danger` | `#a3261d` | `#f2a49c` | **Destructive actions only** (delete my data). Never "wrong answer", never a timer. |
| `--color-danger-subtle` | `bg-danger-subtle` | `#faedeb` | `#3a1c1a` | Background of a destructive confirmation's warning line |
| `--color-danger-contrast` | `text-danger-contrast` | `#ffffff` | `#2a0d0a` | Text on danger fills |
| `--color-rec` | `text-rec`, `bg-rec` | `#a8341a` | `#ff8a6b` | The recording dot and its label. Always with the word "Recording". |
| `--color-highlight` | `bg-highlight` | `#fdf1d8` | `#4a3a14` | Word highlight while a sample answer plays; text selection |

There is **no success green and no error red for learner performance** anywhere (PRD §6.7, GA-10). Calm notices (grace, interruption, "not recorded") use the accent-subtle tint with an info icon.

### 1.2 Content roles

Each role is an **ink** (text, icon, border) and a **subtle** tint, and is always shown with its **icon and label** (components.md §0.2). Colour is the third signal, never the only one.

| Role | Ink token | Light | Dark | Subtle token | Light | Dark | Icon (lucide) |
|---|---|---|---|---|---|---|---|
| Examiner speech (intro, questions, follow-ups, examiner lines) | `--color-role-examiner` | `#33408f` | `#aab5f2` | `--color-role-examiner-subtle` | `#ebeefa` | `#1e2442` | `message-circle` (intro, lines) · `message-circle-question-mark` (required question) · `message-circle-more` (suggested follow-up) |
| Sample answer, short sample answer | `--color-role-sample` | `#6a3270` | `#ddb0e0` | `--color-role-sample-subtle` | `#f6eef6` | `#2c1d30` | `book-open-text` |
| Key words | `--color-role-keyword` | `#7a4e00` | `#f0c36a` | `--color-role-keyword-subtle` | `#fdf1d8` | `#352810` | `key-round` |
| Personal example (a nurse's perspective) | `--color-role-example` | `#8a3f1e` | `#f0a586` | `--color-role-example-subtle` | `#fbeee7` | `#36211a` | `stethoscope` |
| The learner's own recording / answer | `--color-role-you` (= accent) | `#0d5c6b` | `#6cc4d1` | `--color-role-you-subtle` | `#e3f0f1` | `#143a41` | `mic` |
| Persian translation | `--color-text-muted` on `--color-surface-sunken` | – | – | – | – | – | `languages` |

**Why these hues.** Indigo for the examiner: a cool, "other voice" colour, distinct from the teal of the learner's own actions. Plum for sample answers: clearly not green, so a sample never reads as "the correct answer". Saffron for key words: the highlighter colour, and a quiet nod to Persian visual culture. Clay for personal examples: warm and human, but brown enough to never read as an error red. The hues are spaced around the wheel so that the four inks stay distinguishable for the common colour-vision deficiencies by **lightness and icon** even where hue collapses.

---

## 2. Typography

### 2.1 Typefaces

| Script | Face | Why | Loading |
|---|---|---|---|
| Persian (interface, translations) | **Vazirmatn** (variable 100–900, checked in Next 16.4.6's font data) | Open, modern naskh-influenced sans; designed for screens; full Persian and Dari letter set including `ی ک ژ پ چ گ`, Persian digits ۰–۹ and ZWNJ handling. | Already in `layout.tsx` via `next/font/google`. Keep `subsets: ["arabic", "latin"]`. |
| Danish (all learning text) | **Atkinson Hyperlegible Next** (variable 200–800, `latin` + `latin-ext`, normal + italic; checked in Next 16.4.6's font data, line 1387) | Free (SIL OFL), designed by the Braille Institute for maximum character distinction: `o/ø`, `a/å`, `æ/ae`, `I/l/1` and `rn/m` are unmistakable, which matters for B1–B2 learners reading unfamiliar words. Its open, round forms sit comfortably beside Vazirmatn's. Free of any brand association. | **Change for `frontend-developer`** (layout.tsx is app code, outside this brief): replace `Noto_Sans` with `Atkinson_Hyperlegible_Next`, `subsets: ["latin"]` (æ ø å é are in Latin-1, which the `latin` subset covers; `latin-ext` isn't needed and costs bytes), `display: "swap"`, no `weight` (variable), keep `variable: "--font-danish-face"`. |

**Font budget (ADR-0014, ≤ 150 KB on first visit).** Two variable files: Vazirmatn arabic subset + Atkinson Hyperlegible Next latin subset. `check:budgets` will confirm; if it fails, pin Vazirmatn to weights 400/500/600/700 static files instead of the variable file, not drop the Danish face.

**Weights in use.** 400 (body, answers), 500 (Danish questions and lines, Persian emphasis), 600 (labels, buttons, card titles), 700 (headings, bold connectives). Tokens remove all weights below 400 (`--font-weight-*: initial`): Vazirmatn's 100–300 strokes break up on low-density Android screens, and thin Danish weakens `ø` and `å` marks.

**Never** add `letter-spacing` (`tracking-*`) to Persian: it breaks the joins between letters. Never use italic for Persian (it doesn't exist in the script). Avoid italic for Danish learning text too: emphasis uses weight.

### 2.2 Persian interface styles

| Token / utility | Size | Line height | Weight | Use |
|---|---|---|---|---|
| `text-h1` | 26 → 32 px (fluid) | 1.45 | 700 | Page `h1` in Persian |
| `text-h2` | 22 px | 1.5 | 700 | Section headings |
| `text-h3` | 18 px | 1.6 | 700 | Block headings (role labels inside sections use `text-label`) |
| `text-lead` | 18 px | 1.8 | 400 | Home purpose line, page intros |
| `text-body` | 16 px | **1.85** | 400 | Persian paragraphs (guide, notes, explanations) |
| `text-ui` | 16 px | 1.6 | 400 / 600 | Buttons (600), list rows, controls |
| `text-label` | 14 px | 1.6 | 600 | Role labels, field labels, meta lines, tab labels |
| `text-caption` | 14 px | 1.7 | 400 | Hints, credit lines, source labels. **14 px is the floor for Persian.** |
| `text-fa-translation` | 16 px | **1.9** | 400 | Persian translation of a Danish question or title |
| `text-display` | 56 px | 1.1 | 600 | The look countdown (Persian digits), the drawn letter (Latin) |

Persian line heights are deliberately generous (1.85–1.9 for reading): Persian has dots and marks above and below the baseline (`پ ث ی ج`), and ZWNJ-joined words get visually dense at tighter leading.

### 2.3 Danish learning styles (one per content role)

All set `font-family` through `:lang(da)` (DanishText sets `lang="da" dir="ltr"`), so the utility only carries size, line height and weight.

| Role | Utility | Size | Line height | Weight | Colour | Notes |
|---|---|---|---|---|---|---|
| **Examiner's required question** | `text-da-question` | 20 → 22 px | 1.5 | 500 | `text-text` | The largest learning text on a page: it's what the learner must understand first |
| **Suggested follow-up question** | `text-da-followup` | 18 px | 1.55 | 500 | `text-text` | One step below the required question; same voice, less weight in the hierarchy |
| **Situation intro** | `text-da-intro` | 17 px | 1.6 | 400 | `text-text` | Spoken context, read once |
| **Examiner lines, repeat phrase, phrase items** | `text-da-line` | 18 px | 1.55 | 500 | `text-text` | Fixed phrases to recognise and say |
| **Sample answer, short answer** | `text-da-answer` | 18 px | **1.7** | 400; connectives 700 | `text-text` | Reading text; the booklet's bold connectives (*For det første*) render at 700; word highlight per §2.5 |
| **Personal example** | `text-da-example` | 17 px | 1.65 | 400 | `text-text` | |
| **Key word (Danish half)** | `text-da-keyword` | 18 px | 1.4 | 600 | `text-text` | Persian half beneath in `text-ui`, `text-text-muted` |
| **Topic name as `h1`** | `text-da-title` | 26 → 32 px | 1.3 | 700 | `text-text` | |
| **Situation titles, topic names in cards and lists** | `text-da-card` | 18 px | 1.45 | 600 | `text-text` | |
| **Term label** `Maj–Juni 2024 · B` | `text-da-label` | 14 px | 1.5 | 600 | `text-text-muted` | Latin digits, tabular |
| **Current sentence (shadowing)** | `text-da-sentence` | 24 px | 1.5 | 500 | `text-text` | |
| **Persian translation** | `text-fa-translation` | 16 px | 1.9 | 400 | `text-text-muted` | In a sunken well, see components.md |
| **Interface text** | `text-ui` / `text-body` | 16 px | 1.6 / 1.85 | 400 | `text-text` | |

Danish runs inside Persian sentences (`<bdi lang="da">`) take the Danish face at the surrounding size and weight; they never change line height.

### 2.4 How Danish aligns inside the RTL column (scaffold follow-up)

The rule, at every width including 1280:

1. **The reading column is the measure.** Text content sits in a column capped at `--container-reading` (42 rem ≈ 672 px; about 70 Danish characters per line at 18 px). Danish paragraphs **fill the column's full inline size**; DanishText never sets its own `max-width`. Both edges of a Danish block therefore coincide with the column's edges and with the Persian text around it. Without this, a narrower LTR block in an RTL column would hug the right edge with its text starting mid-column, which looks broken.
2. **Danish paragraphs align to their own start (left)**, ragged right. That's how Danish is read, and learners compare it with printed material. Questions, answers, intros, examples, phrases and examiner lines are paragraphs.
3. **Short Danish labels align to the page's start (right)**, using the `text-align-flow` utility (`text-align: match-parent`): the `h1` topic name, topic names in cards and lists, situation titles, key words, term labels. These sit in a Persian reading line (the Persian name or meaning sits right under them), so a shared right edge keeps the pair scannable. If such a label wraps, its second line is ragged on the left; that's acceptable for two lines.
4. **Content blocks give the Danish a frame.** Role blocks have symmetric padding and a role header row (icon chip + Persian label) at the top start. There are no side bars, so nothing pulls the eye to only one edge.
5. **At 1280**, the topic page's main column is the reading column; the side navigation sits outside it on the start side (right). The review's two-column question item uses two half-columns, each with the same rules.

`DanishText` gets an `align` prop for `frontend-developer`: `"own"` (default, paragraphs) or `"flow"` (adds `text-align-flow`).

### 2.5 Word highlight while audio plays (US-016)

The current word gets `bg-highlight`, a 2 px underline in `--color-role-keyword` (offset 3 px), and a 2 px horizontal inset via `box-decoration-break: clone`. **No weight change**: a weight change re-flows the line on every word and makes the text jitter, which is worse for reading than any highlight. The underline is the non-colour cue required by the component inventory (finding DF-01 in [README](README.md#open-questions-for-ux-architect)). Under reduced motion there is no auto-scroll; the highlight itself still moves (it isn't motion, it's state).

---

## 3. Contrast results (WCAG 2.2 AA)

**Method.** Relative luminance per WCAG 2.x: each sRGB channel `c/255` linearised (`c/12.92` at or below 0.04045, else `((c+0.055)/1.055)^2.4`), `L = 0.2126 R + 0.7152 G + 0.0722 B`, ratio `(L1 + 0.05)/(L2 + 0.05)`. Computed to four significant figures and rounded down to two decimals. Targets: **4.5:1** text, **3:1** large text (≥ 24 px, or ≥ 18.67 px bold) and non-text UI parts (1.4.11). Every text pair below passes **4.5:1**, so no pair relies on the large-text exception. A unit test that parses `tokens.css` and asserts these ratios is recommended for `qa-engineer` (README, handoff H-4), so a later colour edit can't silently break them.

### 3.1 Luminance of every token

| Token | Light L | Dark L |
|---|---|---|
| surface | 0.9399 | 0.00773 |
| surface-raised | 1.0000 | 0.01461 |
| surface-sunken | 0.8649 | 0.00464 |
| accent-subtle (= role-you-subtle) | 0.8500 | 0.03557 |
| role-examiner-subtle | 0.8571 | 0.01931 |
| role-sample-subtle | 0.8740 | 0.01628 |
| role-keyword-subtle | 0.8875 | 0.02312 |
| highlight | 0.8875 | 0.04532 |
| role-example-subtle | 0.8743 | 0.01947 |
| danger-subtle | 0.8689 | 0.01805 |
| text | 0.01530 | 0.8234 |
| text-muted | 0.09256 | 0.4568 |
| accent (= focus, role-you) | 0.08802 | 0.4727 |
| accent-hover | 0.05650 | 0.5727 |
| accent-active | 0.03978 | 0.6665 |
| accent-contrast | 1.0000 | 0.01172 |
| role-examiner | 0.06354 | 0.4801 |
| role-sample | 0.06515 | 0.5180 |
| role-keyword | 0.09586 | 0.5860 |
| role-example | 0.09052 | 0.4716 |
| rec | 0.1086 | 0.4050 |
| danger | 0.09262 | 0.4783 |
| danger-contrast | 1.0000 | 0.00802 |
| border-strong | 0.2276 | 0.2301 |

### 3.2 Text on backgrounds (target 4.5:1)

| Text | on | Light | Dark |
|---|---|---|---|
| text | surface | **15.15** | **15.12** |
| text | surface-raised | **16.07** | **13.51** |
| text | surface-sunken | **14.01** | **15.98** |
| text | accent-subtle | **13.78** | **10.20** |
| text | role-examiner-subtle | **13.89** | **12.60** |
| text | role-sample-subtle | **14.14** | **13.17** |
| text | role-keyword-subtle / highlight | **14.35** / **14.35** | **11.94** / **9.16** |
| text | role-example-subtle | **14.15** | **12.57** |
| text | danger-subtle | **14.07** | **12.83** |
| text-muted | surface | **6.94** | **8.77** |
| text-muted | surface-raised | **7.36** | **7.84** |
| text-muted | surface-sunken | **6.41** | **9.27** |
| text-muted | accent-subtle | **6.31** | **5.92** |
| text-muted | role-examiner-subtle | **6.36** | **7.31** |
| text-muted | role-sample-subtle | **6.48** | **7.64** |
| text-muted | role-keyword-subtle | **6.57** | **6.93** |
| text-muted | role-example-subtle | **6.48** | **7.30** |
| text-muted | danger-subtle | **6.44** | **7.44** |
| accent (links, selected text) | surface | **7.17** | **9.05** |
| accent | surface-raised | **7.60** | **8.09** |
| accent | surface-sunken | **6.62** | **9.56** |
| accent | accent-subtle | **6.52** | **6.10** |
| accent | role-examiner-subtle | **6.57** | **7.54** |
| accent-contrast | accent | **7.60** | **8.46** |
| accent-contrast | accent-hover | **9.85** | **10.08** |
| accent-contrast | accent-active | **11.69** | **11.60** |
| role-examiner | surface / raised / own subtle / sunken | **8.71** / **9.24** / **7.98** / **8.05** | **9.18** / **8.20** / **7.64** / – |
| role-sample | surface / raised / own subtle | **8.59** / **9.11** / **8.02** | **9.84** / **8.79** / **8.57** |
| role-keyword | surface / raised / own subtle | **6.78** / **7.19** / **6.42** | **11.01** / **9.84** / **8.69** |
| role-example | surface / raised / own subtle | **7.04** / **7.47** / **6.57** | **9.03** / **8.07** / **7.50** |
| rec | surface / raised | **6.24** / **6.62** | **7.88** / **7.04** |
| danger | surface / raised / danger-subtle | **6.94** / **7.36** / **6.44** | **9.15** / **8.17** / **7.76** |
| danger-contrast | danger | **7.36** | **9.10** |

**Lowest text pair:** dark text-muted on accent-subtle, 5.92:1 (selected segment meta text). Every pair clears 4.5:1 by at least 30 %.

### 3.3 Non-text UI parts (target 3:1, WCAG 1.4.11)

| Part | against | Light | Dark |
|---|---|---|---|
| border-strong (input, checkbox, radio, switch track, slider track) | surface | **3.56** | **4.85** |
| border-strong | surface-raised | **3.78** | **4.33** |
| border-strong | surface-sunken | **3.29** | **5.12** |
| border-strong | accent-subtle | **3.24** | **3.27** |
| border-strong | role-examiner-subtle | **3.26** | **4.04** |
| border-strong | role-keyword-subtle | **3.37** | **3.83** |
| focus ring | surface | **7.17** | **9.05** |
| focus ring | surface-raised | **7.60** | **8.09** |
| focus ring | surface-sunken | **6.62** | **9.56** |
| focus ring | accent-subtle | **6.52** | **6.10** |
| focus ring | role-examiner-subtle | **6.57** | **7.54** |
| accent fill (primary button, checked box, progress fill, active tab pill edge) | surface / raised | **7.17** / **7.60** | **9.05** / **8.09** |
| role inks as icons and chip borders | their subtle tints | ≥ **6.42** | ≥ **7.50** |
| rec dot | surface / raised | **6.24** / **6.62** | **7.88** / **7.04** |

**Rev. 1.1 additions (a11y audit):**
- **Switch thumb:** the off thumb is `text-muted` on the sunken track, **6.41** light and **9.27** dark (m6; it was 1.15:1). The on thumb is raised on accent, **7.60** and **8.09**.
- **Current and selected cues:** the accent bars and outlines measure **≥ 6.52** against every neighbour (S4).
- **Fill vs track, a conscious choice (m7):** the accent fill against the border-strong track is **2.01:1** in the scrubber, the Countdown arc and LoadProgress. The value is never carried by the fill alone. The thumb's raised ring stands out from the track at 3.78:1, and elapsed/total times, the countdown digits and the load label are always shown as text. Lightening the track would break its own 3:1 boundary.

`--color-border` (decorative) is intentionally below 3:1 and never carries meaning: every card that is a control also has a text label and a hover/focus state. A design note: in an earlier pass the dark border-strong was `#6f7881`, which measured **2.73:1 on accent-subtle** and failed; it was raised to `#7c858e`.

---

## 4. Spacing, sizing and layout

- **Scale:** Tailwind's 4 px scale (`--spacing: 0.25rem`) stays. Layout uses 4 / 8 / 12 / 16 / 24 / 32 / 48 px (`1, 2, 3, 4, 6, 8, 12`).
- **Named sizes:** `--spacing-touch` (44 px; every target, `min-block-11 min-inline-11`), `--spacing-touch-primary` (56 px; focused-mode primary on phones, `min-block-14`), `--spacing-tabbar` (64 px + `env(safe-area-inset-bottom)`).
- **Page padding (inline):** 16 px below 768, 24 px at 768–1023, 32 px from 1024.
- **Vertical rhythm:** 24 px between blocks inside a section, 40 px between sections (`mbs-6`, `mbs-10`). Role blocks: 16 px padding on phones, 20 px from 768.
- **Containers:** `--container-reading` 42 rem (reading pages, the topic main column), `--container-focused` 45 rem (mock runner), `--container-dialog` 35 rem (answer aloud dialog, dialogs), `--container-page` 76 rem (outer frame at 1280).
- **Breakpoints:** Tailwind defaults; the UX breakpoints are `md` (768) and `lg` (1024). Designs are drawn at 375 and 1280 and must hold at 320 (no horizontal scroll) and at 200 % text.
- **Logical properties only:** `ms/me/ps/pe`, `mbs/mbe`, `pbs/pbe`, `inline-*`, `block-*`, `min-block-*`, `start-*/end-*`, `border-s`, `rounded-s`. The only physical case in the system is the audio scrubber, which is `dir="ltr"` by design.
- **Sticky bars and focus (2.4.11; rev. 1.1):**
  - Sticky elements carry `data-sticky="tab-bar" | "section-nav" | "focused-header" | "answer-area"`.
  - A measuring hook (README H-9) sets `--sticky-offset` and `--bottom-offset` from their real heights, or 0 when a bar isn't pinned. `globals.css` turns those into `scroll-padding` on `html`.
  - Bars unpin on short viewports through the `short:` variant (`max-height: 30rem`) and when the answer area exceeds 40 % of the viewport height.

## 5. Radius

| Token | Value | Use |
|---|---|---|
| `--radius-chip` (`rounded-chip`) | 8 px | Role chips, badges, term labels, filter chips |
| `--radius-control` (`rounded-control`) | 10 px | Buttons, inputs, segmented controls, the skip link |
| `--radius-card` (`rounded-card`) | 14 px | Cards and content blocks |
| `--radius-sheet` (`rounded-sheet`) | 20 px | Dialogs; bottom sheets use it on the two block-start corners only (`rounded-ss-sheet rounded-se-sheet`) |
| `rounded-full` | – | Play buttons, the record button, step dots |

## 6. Elevation

| Token | Light | Dark | Use |
|---|---|---|---|
| `shadow-card` | 1 px soft | deeper, mostly invisible: dark cards rely on `border-border` | Cards on the page |
| `shadow-raised` | two-layer | deeper | Sticky bars once scrolled, the pinned answer area, hover on link cards |
| `shadow-overlay` | two-layer, strong | deeper | Dialogs, sheets, menus, toasts, the skip link |

Layering (z-index, numeric utilities): content 0 · sticky section nav 20 · header and tab bar 30 · menus and popovers 40 · dialogs and sheets 50 · toasts 60 · skip link 70.

## 7. Motion

| Token | Value | Use |
|---|---|---|
| `--duration-fast` | 150 ms | Hover, press, colour, chevron rotation in disclosures |
| `--duration-base` | 200 ms | Disclosure height/opacity, toasts, crossfades, tab indicator |
| `--duration-slow` | 250 ms | Sheets, dialogs, the draw-card flip |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | State changes |
| `--ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Things appearing |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Things leaving (use ~80 % of the enter duration) |
| `animate-fade-in` | 200 ms opacity | Revealed content, toasts |
| `animate-rec-pulse` | 1.6 s opacity, **3 iterations** (4.8 s; rev. 1.1, M6) | The recording dot only, restarted when a recording starts |
| `animate-speaking` | 1.1 s scaleY, **3 iterations** (3.3 s) | The examiner activity bars only, restarted with each clip |

Usage: `transition-colors duration-(--duration-fast) ease-standard`.

**Reduced motion.** `globals.css` stops every keyframe animation (`animation: none`) and smooth scrolling. Transforms in transitions are gated per component with `motion-safe:` and replaced by an opacity crossfade (`motion-reduce:`). Each animated component lists its reduced variant in [components.md](components.md#04-motion-and-reduced-motion). No animation in the app is essential: every state change also has a text change.

**Timers.** No timer animates, counts down in colour, or escalates (UXD-05). The only countdown is the 10-second look, which ticks digits and a static ring segment, never colour.

## 8. Dark theme

Follows the device (`prefers-color-scheme`; US-054, no control in v1). Only colour tokens change. Dark surfaces are a cool slate, not pure black (less halation for Danish text at 18 px). Accent and role inks lighten to stay ≥ 6:1 on their tints. Shadows deepen but cards rely on `border-border` for their edge.

## 9. What changed from the placeholder

| Placeholder token | Now | Uses in code |
|---|---|---|
| `--color-surface`, `--color-surface-raised`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-accent-contrast`, `--color-focus`, `--color-danger` | **Kept**, new values | `globals.css`, `page.tsx` (`text-text-muted`) keep working |
| `--font-sans`, `--font-danish` | **Kept**, with fallbacks; `--font-danish-face` still comes from `layout.tsx` | unchanged |
| Tailwind default palette | **Removed** | none were used |
| Font weights 100–300, 800–900 | **Removed** | none were used |
