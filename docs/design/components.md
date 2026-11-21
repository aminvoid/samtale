# Components: visual specification (v1)

| | |
|---|---|
| **Status** | v1, ready for `frontend-developer` |
| **Date** | 2026-11-19 |
| **Author** | `ui-designer` |
| **Input** | [UX component inventory](../ux/component-inventory.md) (behaviour, states, accessibility contract; that file stays the source of truth for **behaviour**), ADR-0009 (Base UI + lucide-react), ADR-0004 |
| **Tokens** | [tokens.md](tokens.md); utilities named here (`bg-role-examiner-subtle`, `text-da-question` …) come from [`src/styles/tokens.css`](../../src/styles/tokens.css) |

How to read this file: **§0** defines what every component shares (states, role headers, icons, motion, bidi, targets), so each entry below lists only what's specific to it. Every interactive component gets the §0.1 states unless its entry says otherwise. Persian strings quoted here are layout drafts; final copy comes from `messages/fa.json` and `persian-localization-reviewer`.

---

## 0. Foundations

### 0.1 Interaction states (all interactive components)

| State | Primary (filled) | Secondary (outlined) | Tertiary (text) | Link card / row |
|---|---|---|---|---|
| **Default** | `bg-accent text-accent-contrast` | `bg-surface-raised text-text border border-border-strong` | `text-accent` (600), no border | `bg-surface-raised border border-border rounded-card shadow-card` |
| **Hover** (pointer only, `@media (hover:hover)`) | `bg-accent-hover` | `bg-surface-sunken` | `bg-accent-subtle` | `border-border-strong shadow-raised` |
| **Focus-visible** | 3 px `--color-focus` ring, 2 px offset (global). Never removed. Cards get the ring on the whole card. | same | same | same |
| **Active / pressed** | `bg-accent-active` | `bg-surface-sunken` + `border-text-muted` | `bg-accent-subtle` | `bg-surface-sunken` |
| **Disabled** (native `disabled`, rare: only where the control truly can't apply) | `bg-surface-sunken text-text-muted`, no border, `cursor-not-allowed` | same | `text-text-muted` | not used |
| **aria-disabled** (the default way to disable: stays focusable, UX GA-4) | `bg-surface-sunken text-text-muted border border-dashed border-border-strong`; a visible reason in `text-caption text-text-muted` directly below | same | `text-text-muted` + reason | – |
| **Loading** | label stays; `loader-circle` 20 px `animate-spin` at the inline start; `aria-busy="true"`; second activation ignored by state | same | same | – |
| **Error** | Buttons never turn red. Errors appear as an InfoNote or inline text next to the control (`circle-alert` + text in `text-text`), and the control offers "Try again". | | | |

Transitions: `transition-colors duration-(--duration-fast) ease-standard`. No transforms on press (no scale), so there is nothing to reduce.

**Current and selected states (rev. 1.1, a11y audit S4 and M11).** Every current or selected state carries a **shape cue of at least 3:1** against its neighbours, never a tint alone. The cue is one of three things: a 3 px `bg-accent` bar (7.17:1 light, 9.05:1 dark on the surface), a 2 px `border-accent` outline, or a `check` icon. Tints such as `bg-accent-subtle` (about 1.15:1) are decoration on top of the cue. In forced-colours mode, `globals.css` draws a `Highlight` outline on `[aria-current]`, `[aria-pressed="true"]`, `[aria-selected="true"]`, checked radios and `[data-selected]`. Components that show selection another way add `data-selected`.

**Toggle names (rev. 1.1, M3).** A toggle button keeps one **constant** accessible name and reports its state with `aria-pressed` (or `aria-expanded` for a disclosure). Changing the visible icon is fine; changing the name as well isn't. A button that switches between two *different actions* (Record ↔ Stop) changes its label and has **no** `aria-pressed`. Never do both.

**Pinned bars (rev. 1.1, S2 and S3; mandatory).** The focused header (`data-sticky="focused-header"`) and the answer area (`data-sticky="answer-area"`) are pinned only when there's room for them.
- **Unpin both** on short viewports: `short:static`, where the `short` variant is `max-height: 30rem` (in `globals.css`).
- **Unpin both** when the answer area is taller than **40 % of the viewport height**. The measuring hook (handoff H-9) sets `data-pinned="false"`, and the bar uses `data-[pinned=false]:static`.
- Unpinned bars scroll with the content, in the same DOM order.
- `--sticky-offset` and `--bottom-offset` are **measured** from the pinned bars, and set to 0 when they aren't pinned. They are never hard-coded.

### 0.2 Role header (the "face" of each content role)

The **RoleHeader** primitive opens every content block. Anatomy, in reading order (right to left):

1. **Role chip:** 28 × 28 px, `rounded-chip`, `bg-role-*-subtle`, icon 16 px in `text-role-*`, `aria-hidden`.
2. **Role label:** Persian, `text-label` (14/600) in `text-role-*`. When the block has its own heading, the label **is** the `h3`.
3. **Source label** (optional, wraps to its own line under 360 px): `text-caption text-text-muted`, see SourceLabel.
4. **PlayButton** (optional) at the inline end (left), so it sits directly above where the Danish text begins.

| Role | Icon | Ink / tint | Label (draft) | Block surface |
|---|---|---|---|---|
| Situation intro | `message-circle` | examiner | «ممتحن موقعیت را معرفی می‌کند» | `bg-role-examiner-subtle` |
| First / second required question | `message-circle-question-mark` | examiner | «سؤال اجباری اول» / «سؤال اجباری دوم (کلی)» | `bg-role-examiner-subtle` |
| Suggested follow-up | `message-circle-more` | examiner | «سؤال تکمیلی پیشنهادی» | `bg-surface-raised`, **1.5 px dashed** `border-role-examiner` (suggested, not scripted) |
| Examiner lines (intro line, transition, *Tak.*, closing) | `message-circle` | examiner | «جملهٔ ممتحن» | `bg-role-examiner-subtle` |
| Sample answer / short sample answer | `book-open-text` | sample | «یک پاسخ نمونهٔ ساده و روشن» (placeholder, UX-OQ-19) / «یک پاسخ کوتاه نمونه» | `bg-surface-raised border border-border` |
| Key words | `key-round` | keyword | «سه کلمهٔ کلیدی» | `bg-role-keyword-subtle` |
| Personal example | `stethoscope` | example | «مثال از دید یک پرستار» | `bg-surface-raised border border-border` |
| Persian translation | `languages` | neutral (`text-text-muted`) | «ترجمه» | `bg-surface-sunken` well |
| The learner's own recording | `mic` | you (accent) | «پاسخ شما» | `bg-role-you-subtle` |

Rules: the same role always gets the same chip, label and surface on every screen (topic page, answer aloud, mock hints, review, phrases page). Only examiner speech and key words are tinted: they're what the learner must **understand** and **remember**; answers and examples are reading text on a calm white card.

### 0.3 Icons

- **Set:** lucide-react 1.75.0 only, through `<Icon>` (ADR-0009). Stroke 2 px at every size. Sizes: **16** (inside chips and captions), **20** (buttons, rows), **24** (tab bar, header, empty states at 48 in a circle). Icons are `aria-hidden` unless they are the only content of an IconButton, which then has an accessible name from messages.
- **Colour:** icons inherit `currentColor`; decorative icons in rows use `text-text-muted`.

**Mirroring in RTL** (`<Icon mirrored>` → `rtl:-scale-x-100`; final list, matching UX inventory §9):

| Mirror | Don't mirror |
|---|---|
| `chevron-left` / `chevron-right` used as back / forward (BackLink, row chevrons, Next/Previous sentence, "Next question"), `arrow-left`/`arrow-right` in the guide timeline connectors, `log-out` (Leave), `external-link`, the StepIndicator fill direction, LoadProgress fill direction, the MenuDrawer's slide direction | `play`, `pause`, `rotate-ccw` (try again), `repeat-2` (repeat), `snail` (slower), the audio scrubber and its fill, `clock-3`, the Countdown ring, `circle-dot` / the record dot, `mic`, `mic-off`, `volume-2`, `check`, `badge-check`, `info`, `circle-alert`, `circle-help`, `search`, `x`, `menu`, **`message-circle-question-mark`** (mirroring would mirror the question mark), all role icons, all theme icons, emoji, the logo |

Rule for authors: always pick the icon that is correct **in LTR** and add `mirrored` only for direction; never pick a "right" chevron for RTL by hand.

**Icon map (semantic → lucide)**

| Meaning | Icon | | Meaning | Icon |
|---|---|---|---|---|
| Home tab | `house` | | Leave (focused mode) | `log-out` (mirrored) |
| Topics tab | `library-big` | | Close | `x` |
| Mock exam tab | `messages-square` | | Menu | `menu` |
| Templates and phrases tab | `quote` | | Overflow | `ellipsis` |
| Guide tab | `signpost` | | Share | `share-2` |
| My progress | `notebook-text` | | Report a problem | `flag` |
| Settings | `settings` | | External link | `external-link` (mirrored) |
| About | `info` | | Search | `search` |
| Privacy | `shield-check` | | Show / hide text | `captions` / `captions-off` |
| Play / pause | `play` / `pause` | | Translation | `languages` |
| Try again | `rotate-ccw` | | Hints (practice) | `lightbulb` |
| Loading | `loader-circle` (spins) | | Template link | `layout-template` |
| Repeat request | `repeat-2` | | Similar question | `layers` |
| Hear it slower | `snail` | | Shadowing | `audio-waveform` |
| Examiner speaking | `audio-lines` (animated bars) | | Draw a topic | `shuffle` |
| Recording | `circle-dot` + dot | | Clock | `clock-3` |
| Microphone ready / off | `mic` / `mic-off` | | Ready to review | `clock-3` |
| Recording capped | `circle-stop` | | Pre-2023 info | `circle-help` |
| Kept on this device | `smartphone` | | Verified against SIRI | `badge-check` |
| Auto-lock tip (wake lock) | `lock` | | Booklet wording / picture description | `book-open` |
| Do Not Disturb tip | `bell-off` | | The app's wording | `pen-line` |
| Interrupted / paused | `circle-pause` | | Info note | `info` |
| Calm error | `circle-alert` | | Offline | `wifi-off` |
| Not found | `file-question` | | Self-check | `list-checks` |
| Focus next time | `sparkle` | | Delete | `trash-2` |
| Compare (shadowing) | `headphones` | | Sound check | `volume-2` |

**Theme icons** (`src/components/ui/theme-icon.tsx`, decorative): arbejde `briefcase-business` · uddannelse `graduation-cap` · sundhed `heart-pulse` · medier `smartphone` · klima `leaf` · boern `backpack` · krim `scale` · bolig `building-2` · frivillig `hand-heart` · kultur `drama`. (`bolig` avoids `house`, which is the Home tab.)

#### Decision on UX-OQ-16: emoji or icons

| Where | Decision | Why |
|---|---|---|
| **Theme icons** (themes.json `emoji`) | **lucide icons**, not emoji. The `emoji` field stays in content but the UI doesn't render it. | One consistent stroke style with the rest of the UI; monochrome, so they take the calm palette and work in dark mode; identical on every device (emoji differ between iOS, Samsung, Google and old Android, and some, like ⚖️ with its variation selector, fall back to text glyphs); no font dependency. |
| **Content roles** | **lucide icons** (§0.2) | Roles need one look everywhere, theme-aware colour and a guaranteed rendering. Emoji can't take the role colour. |
| **Key-word emoji and toolbox reason emoji** | **Keep**, as decorative content (`aria-hidden`), in a fixed 28 px slot at the pair's inline start. | They are the author's recall hooks (booklet method step 2), not interface. Condition: `content-engineer` adds a validation rule that rejects emoji newer than **Emoji 12.0 (2019)** in these fields, so the ADR-0014 floor devices render them all (the pilot's 🏋️ 💵 👵 🌧️ 🎓 🏗️ ⚡ 💰 🗣️ are all Emoji 1.0–4.0). If a glyph still fails on a test device, the slot stays empty-sized, and the layout doesn't shift. |
| **Margin-note emoji** (🔁 🔗 📌 ⭐ 🩺) | Never shown (D-21). | – |

### 0.4 Motion and reduced motion

| Component | Default motion | Reduced-motion variant |
|---|---|---|
| Disclosure (all collapsibles) | Chevron rotates 180° (150 ms); panel fades in (200 ms). No height animation (avoids layout jank on slow phones). | Chevron swaps instantly; panel fade stays (opacity isn't motion). |
| Dialog | Fade + scale 0.98 → 1 (200 ms enter, 160 ms exit) | Fade only |
| Bottom sheet (Hints, Picker, menus on phones) | Slide up from block end (250 ms) + scrim fade | Fade only |
| MenuDrawer | Slide in from the inline end (left in RTL; 250 ms) | Fade only |
| Toast | Fade + 8 px rise (200 ms) | Fade only |
| DrawCard flip | 3D flip around the vertical axis (250 ms); the other two cards recede 4 px and fade to 60 % | Crossfade face-down → face-up (200 ms); others fade only |
| Situation chosen → compact strip | Cards shrink into the strip (250 ms) | Crossfade between the two layouts |
| Recording dot | Opacity pulse, 1.6 s × **3** (`animate-rec-pulse`; rev. 1.1, M6), then solid | Static dot |
| ExaminerPanel "speaking" | Five bars `animate-speaking`, staggered, 1.1 s × **3**, then at rest | Static `audio-lines` icon |
| Loading spinner | `animate-spin` | Static `loader-circle` + the text "Loading…" |
| Word highlight | Highlight moves with the audio; the page auto-scrolls the current line into view (smooth) | Highlight still moves (state, not motion); **no auto-scroll** |
| SectionNav scroll-spy, fragment jumps | Smooth scroll | Instant jump |
| Countdown | Digits change each second; the ring segment steps (no interpolation) | Same (nothing interpolates) |
| Progress fills (LoadProgress, StepIndicator, scrubber) | Width transition 200 ms | No width transition |

Rules: 150–250 ms, never essential, never blocking input. `globals.css` stops all keyframe animations under `prefers-reduced-motion: reduce`; components gate transforms with `motion-safe:` and provide the crossfade with `motion-reduce:`.

### 0.5 Bidi patterns (visual side)

- **Danish paragraph:** `<DanishText as="p">`, fills its container, `text-align: start` (left). See [tokens.md §2.4](tokens.md#24-how-danish-aligns-inside-the-rtl-column-scaffold-follow-up).
- **Short Danish label in a Persian row:** `<DanishText align="flow">` → `text-align-flow` (right).
- **Danish–Persian pair:** always two lines, Danish first, Persian beneath; both aligned to the page start. Never one line (UXD-24).
- **Durations and clocks:** Persian digits inside `<bdi dir="ltr">` with `tabular-nums`; "m:ss از حدود m:ss" built by ICU with each duration an isolated argument.
- **Term labels:** Latin digits, `<bdi lang="da">`, `tabular-nums`.

### 0.6 Targets and spacing

Every target ≥ 44 × 44 px (`min-block-11 min-inline-11`), the focused-mode primary 56 px tall on phones (`min-block-14`). Adjacent targets have ≥ 8 px between their hit areas. Inline links inside Persian paragraphs are exempt from the 44 px rule (WCAG 2.5.8 inline exception) but get `underline-offset-4` and 1 px underline thickness 2 px on hover.

---

## 1. Layout and navigation

### SkipLink (new primitive; scaffold follow-up fixed)
- **Anatomy:** a link "رفتن به محتوای اصلی" to `#main`.
- **Visual:** hidden until focused; then a solid accent button fixed **12 px from the block-start and inline-start edges** (top-right in RTL), `min-block-size` 44 px, padding 8 × 16 px, `rounded-control`, `shadow-overlay`, ring offset 3 px so it's never clipped by the viewport. Utility: `skip-link` in `globals.css`.
- **Handoff:** `layout.tsx` replaces `className="sr-only focus:not-sr-only"` with `className="skip-link"`. `<main id="main" tabIndex={-1}>` so focus lands in it; it gets no ring (`globals.css`).
- **States:** focus (shown) only; hover darkens to accent-hover.
- **RTL:** inline-start corner (right). **A11y:** first focusable element; text from `common.skipToContent`.

### AppShell
- **Anatomy:** SkipLink · AppHeader · `main` (`max-inline-page`, page padding 16/24/32) · Footer · BottomTabBar (< 768) or TopNav inside the header (≥ 768). Focused mode swaps in FocusedModeShell.
- **Layout:** body `bg-surface`; on phones `main` gets `pbe` = tab bar + safe area + 16 px so the footer clears the bar.
- **States:** normal · focused mode (no nav, no footer).

### AppHeader
- **Anatomy (RTL order):** wordmark (logo mark 28 px + app name, `text-h3`, links home) at the start · TopNav (≥ 768) · menu IconButton (`menu`) at the end.
- **Size:** 56 px tall, `bg-surface`, `border-be border-border`. **Not sticky** on any width (the tab bar and section nav carry orientation; vertical space matters on phones).
- **A11y:** `header` landmark; the menu button has `aria-expanded` and a name from messages. The app name wordmark is `<bdi lang="da">Samtale</bdi>` if name A is chosen.

### BottomTabBar (< 768)
- **Anatomy:** five equal items: icon 24 + label `text-label` (14/600), one line each (labels must fit at 360 px: «خانه» «موضوع‌ها» «آزمون» «عبارت‌ها» «راهنما»).
- **Size:** 64 px + `env(safe-area-inset-bottom)`, `bg-surface-raised`, `border-bs border-border`, `shadow-raised`, fixed at the block end; `data-sticky="tab-bar"`.
- **States:**
  - **Inactive:** `text-text-muted`.
  - **Active** (rev. 1.1, S4): a **3 px × 32 px `bg-accent` bar** at the item's block-start edge (7.60:1 against the raised bar), plus the 56 × 32 px `bg-accent-subtle` pill behind the icon (decorative), icon and label in `text-accent`, label weight 700, and `aria-current="page"`.
  - **Hover:** `text-text`.
  - **Pressed:** the pill appears at `bg-surface-sunken`.
  - **Focus:** the ring is inset −3 px, so the screen edge doesn't cut it.
- **RTL:** Home at the far right. Icons don't mirror.
- **At 200 % text:** labels may wrap to two lines; the bar grows, it never truncates.

### TopNav (≥ 768)
- **Anatomy:** six text links in the header, `text-ui` 600, 44 px tall, 16 px apart; My progress last (leftmost).
- **States:** current: `text-accent` + 3 px accent bar under the label (`border-be-3`), `aria-current="page"`; hover: `text-text` + 1 px underline; focus ring.

### MenuDrawer
- **Anatomy:** Base UI Dialog. Header (app name + close `x`), list of 44 px rows with icons (all sections, then a divider, then Settings, About, Privacy).
- **Size:** 320 px (max 85 vw), full height, `bg-surface-raised`, `shadow-overlay`, slides from the inline **end** (left in RTL).
- **States:**
  - **Row hover:** `bg-surface-sunken`.
  - **Current page row** (rev. 1.1, S4): a **3 px `bg-accent` bar on the inline start** (right), plus `bg-accent-subtle text-accent`, weight 700 and `aria-current="page"`.
- **Motion:** §0.4. **A11y:** focus trap, Escape, returns focus to the menu button.

### FocusedModeShell
- **Anatomy (RTL):** Leave/Close at the start · mode or activity label in the middle (`text-label`, in a neutral chip: `border border-border rounded-chip px-2`) · timers + TimersToggle at the end. Second line (mock only): RecordingIndicator.
- **Size:** 56 px (+ 32 px indicator line, so 88 px in the mock), `bg-surface-raised`, `border-be border-border`. Content column `max-inline-focused`, centred.
- **Pinning** (rev. 1.1, S2 and S3): `sticky` with `data-sticky="focused-header"`. It unpins on short viewports and whenever the answer area unpins (§0.1, "Pinned bars"). Its measured height feeds `--sticky-offset`.
- **Leave:** tertiary button with `log-out` (mirrored) + «خروج»; Close variant: IconButton `x` with «بستن» label visible on ≥ 768.
- **A11y:** Leave never adjacent to the primary action (it's at the top; the primary is at the bottom).

### BackLink
- **Anatomy:** `chevron-left` (mirrored → points right) 20 px + parent name, `text-ui` 600 `text-accent`; 44 px tall; hover underline.
- **RTL:** chevron at the inline start, pointing to the start edge (back).

### SectionNav (topic page)
- **Phone/tablet:** sticky bar under the page header (`data-sticky="section-nav"`), `bg-surface/95 backdrop-blur-sm` (solid `bg-surface` under reduced transparency), `border-be border-border`, three equal segments 48 px tall: «A» «B» «سؤال کلی». Current: `text-accent` 700 + 3 px accent bar at the block end; others `text-text-muted` 600.
- **1280:** a sticky side list in the start column (right), 240 px wide, `inset-block-start` 24 px: heading «در این موضوع», items 44 px; current: `bg-accent-subtle text-accent` 700 + 3 px accent bar on the inline start. Then "Related topics" and "Practise as a mock exam" as secondary links.
- **A11y:** `nav` with a name, `aria-current="true"`; scroll padding handled by `globals.css` via `data-sticky`.

### SegmentedNav (library views, templates/toolbox/words)
- **Anatomy:** a row of links inside a `bg-surface-sunken rounded-control p-1` track; each segment 40 px tall inside a 48 px track (44 px hit area with the padding).
- **States:**
  - **Current** (rev. 1.1, S4): `bg-surface-raised shadow-card text-text` 700, a **3 px `bg-accent` bar along the segment's block-end edge** (inset 8 px from each side), and `aria-current="page"`.
  - **Others:** `text-text-muted` 600.
  - **Hover:** `text-text`.
- **Overflow:** wraps to a second row at 200 % text; never scrolls horizontally unless wrapping fails (then `overflow-x-auto` with visible edge fade).
- **RTL:** first option at the right.

### JumpLinks
- Wrapping row of chip links (`rounded-chip border border-border px-3`, 44 px tall, `text-label`). Hover `bg-surface-sunken`. Focus moves to the target heading. At 1280 on long pages they become a sticky side list like SectionNav.

### PageHeader
- **Anatomy:** optional BackLink · `h1` (`text-h1`, or `text-da-title` + `text-align-flow` when the title is Danish) · subtitle (`text-lead text-text-muted`) · meta line (`text-caption text-text-muted`, items separated by «·» with 8 px spacing).
- **Spacing:** `pbs-6` (24 px) from the header; 8 px between h1 and subtitle; 24 px to content.

### Footer
- `bg-surface-sunken`, `pbs-8 pbe-8`, `text-caption text-text-muted`; links About · Privacy in `text-accent`; the "not an official SIRI product" line; the booklet credit. On phones it sits above the tab bar's area. Not shown in focused mode.

---

## 2. Text and labels

### DanishText (primitive; exists)
- **Props to add:** `role` → maps to the Danish type utility (`question`, `followup`, `intro`, `line`, `answer`, `example`, `keyword`, `title`, `card`, `label`, `sentence`); `align: "own" | "flow"` (§0.5); `emphasis` ranges render as `<strong>` (700).
- **Colour:** inherits `text-text`.

### PersianText
- `lang="fa"`; Latin runs inside (e.g. «(sosu)») wrapped in `<bdi dir="ltr">` by content markup. Translation role uses `text-fa-translation text-text-muted`.

### TermLabel
- **Variants:** *inline* (`text-da-label text-text-muted`, tabular) · *chip* (header and reveal: `rounded-chip border border-border px-2 bbs`, same type).
- Example: `Maj–Juni 2024 · B`. The middle dot has 4 px space each side.

### Pre2023Badge
- **Plain** (inside list items): text only, «قالب قدیمی», `text-caption text-text-muted` inside a neutral chip (`border border-border-strong rounded-chip px-2`). No icon, no colour fill (it's information, not a warning).
- **Explained** (topic header, reveal): the same chip + a tertiary Disclosure trigger `circle-help` «این یعنی چه؟»; the panel is an InfoNote with the US-009 #3 points and "in the mock this topic runs in today's format".
- **A11y:** never inside a link (R-05); the disclosure is never hover-only.

### EraDivider (terms view)
- A full-width row: 1 px `border-border` rule · chip «قالب امروز (از <bdi lang="da">Maj–Juni 2023</bdi>)» above the line and «قالب قدیمی (پیش از …)» below it · ListInfoButton. `h2`-level heading text in `text-label`.

### ListInfoButton
- Tertiary button, `circle-help` 20 px + «"قالب قدیمی" یعنی چه؟»; opens a Disclosure panel directly below the list heading (outside the list).

### SourceLabel
| Variant | Icon (16) | Text (draft) |
|---|---|---|
| SIRI's wording | `badge-check` | «متن SIRI (دفترچهٔ ممتحن …)» |
| As given in the booklet | `book-open` | «همان‌طور که در کتابچه آمده» |
| The app's wording | `pen-line` | «متن این برنامه» |
| The app's wording, based on SIRI's instruction | `pen-line` | «متن این برنامه، بر اساس دستور SIRI به ممتحن» |
| The booklet's description of the picture | `book-open` | «توصیف کتابچه از تصویر» |
- `text-caption text-text-muted`, icon `text-text-muted`. Plain text, never a badge-like fill: provenance is information, not decoration.

### VerificationNote
- **Matches:** `badge-check` in `text-accent` + «متن با دفترچهٔ ممتحن SIRI بررسی شده است» (`text-caption`) + tertiary Disclosure «جزئیات». Panel: a small definition list (checked on «۱۸ نوامبر ۲۰۲۶» · SIRI examiner booklet `Maj–Juni 2024`, page ۸ · ExternalLink).
- **Booklet, not yet checked word for word:** `book-open` muted + text. No disclosure.
- **Differs (UX-OQ-20, placeholder):** `info` + «متن SIRI کمی فرق دارد» Disclosure; the panel shows SIRI's version as a DanishText `line` in a sunken well. Reserved slot directly under the note; design final when OQ-17 is decided.
- **A11y:** the icon is never the only signal; the text says it.

### CreditLine
- `book-open` 16 + «از کتابچهٔ شری رحیمی، صفحه‌های ۳۶–۳۷», `text-caption text-text-muted`. Page numbers via the formatter.

### InfoNote
- **Anatomy:** `info` 20 px (or a variant icon) at the inline start · body `text-body` (or `text-ui` when one line) · optional dismiss IconButton `x` at the inline end (name «بستن این یادداشت»).
- **Surface:** `bg-accent-subtle rounded-card p-4`, no border. Icon `text-accent`.
- **Variants:** *standard* · *compact* (one line, `text-caption`, no surface; used for the pictures note after three attempts, R-26) · *collapsible* (header row is a Disclosure trigger; collapsed shows title only) · *dismissible*.
- **States:** open · collapsed · dismissed (removed; no animation needed beyond fade).

### ExternalLink
- Link text + `external-link` 16 px (mirrored) after it, 4 px gap; the accessible name appends «(سایت خارجی باز می‌شود)» from messages.

---

## 3. Content blocks (topic study)

Section rhythm on the topic page: blocks 16 px apart inside a section, sections 40 px apart, each section opens with its `h2` (`text-h2`).

### SituationCard
| Variant | Anatomy | Visual |
|---|---|---|
| **Study** | Letter tile · Danish title · theme icon · SourceLabel «توصیف کتابچه از تصویر» · TranslationToggle | `bg-surface-raised border border-border rounded-card shadow-card p-4`. Letter tile 40 × 40, `rounded-control bg-accent-subtle text-accent`, Latin letter at 22 px 700, at the inline start. Theme icon 20 px `text-text-muted` in the inline-end corner, `aria-hidden`. Title `text-da-card`, `text-align-flow`. |
| **Look** (mock, 10 s) | Letter tile · Danish title · theme icon; practice adds the Persian title under it when "show translations" is on | Larger: letter tile 48 px; title at `text-da-question` size, 600. The two cards fit in 560 px of height at 375 (R-26). |
| **Compact** (interview strip) | Letter · full title, **wrapping** (rev. 1.1, M5: no ellipsis, no `title` attribute) | At least 44 px tall, `rounded-control border border-border bg-surface-raised px-3 py-2`; letter 16 px 700 `text-accent`, top-aligned; title 15 px Danish at line height 1.4, wrapping to as many lines as it needs. The two cards in the strip share a row and stretch to the taller one. |
| **Selected** ("the examiner's situation") | + label row: `message-circle` 16 + «موقعیت ممتحن» | 2 px solid `border-accent` (≥ 7:1, the S4 shape cue), label in `text-accent text-label`, `data-selected`. The **other** card: 1 px dashed `border-border-strong`, title in `text-text-muted` (still AA). Never opacity. |

- **RTL:** A at the right when side by side. **A11y:** title text carries meaning; icon decorative; selected state is the visible label.

### TranslationToggle
- **Trigger:** a tertiary button, 44 px: `languages` 20 + the constant label «ترجمه» + a `chevron-down` that rotates when open. State is carried by `aria-expanded` (rev. 1.1, M3: the name stays the same and doesn't flip between "show" and "hide").
- **Revealed:** directly below the trigger: a well `bg-surface-sunken rounded-control px-4 py-3`, `text-fa-translation text-text-muted`, `lang="fa"`; fades in (200 ms).
- **States:** hidden (default) · shown. Hover per tertiary.

### ExaminerIntroBlock
- `bg-role-examiner-subtle rounded-card p-4`. RoleHeader (intro, `h3`) + SourceLabel + PlayButton (examiner) · DanishText `intro`.

### QuestionBlock
- `bg-role-examiner-subtle rounded-card p-4 md:p-5`. RoleHeader (`h3` «سؤال اجباری اول») + PlayButton (examiner) at the inline end · DanishText `question` (the largest learning text in the section) · 12 px · VerificationNote · TranslationToggle · SimilarQuestionLinks (each a tertiary link row with `layers` 16).
- **"Differs from SIRI" slot** (UX-OQ-20): reserved under the VerificationNote.

### KeywordList
- **Surface:** `bg-role-keyword-subtle rounded-card p-4`. RoleHeader (`h3` «سه کلمهٔ کلیدی»).
- **Pairs:** an `ol` of three; each pair is a row: emoji slot 28 px (decorative) at the inline start · stack of Danish (`text-da-keyword`, `text-align-flow`) over Persian (`text-ui text-text-muted`). Pairs separated by 1 px `border-role-keyword/20` rules (12 px vertical padding).
- **Tip:** tertiary link `layout-template` + «با این سه کلمه و الگوی ۱ پاسخ‌تان را بسازید».
- **RTL:** both lines align right; never on one line.

### "Answer aloud" (section primary)
- Primary button, full width on phones (`lg`, 56 px), `mic` 20 + «بلند جواب بدهید», subtitle line under the button in `text-caption text-text-muted`: «شما صحبت می‌کنید، بعد مقایسه می‌کنید». At 1280: `md`, beside the key words if the measure allows.

### ModelAnswerBlock
- **Collapsed:** a Disclosure card (`bg-surface-raised border border-border rounded-card`).
  - **Markup** (rev. 1.1, M4, the APG accordion pattern): `<h3><button aria-expanded aria-controls>…</button></h3>`. The **button sits inside the heading**, never a heading inside the button.
  - The button fills the 56 px row: role chip, label, and a chevron-down at the inline end.
  - Under the heading, «بر اساس الگوی ۱ ›» is a separate tertiary link, outside the button.
- **Expanded:** AudioPlayer (sample voice) · DanishText `answer` with bold connectives and WordHighlighter · tertiary link `audio-waveform` «سایه‌خوانی جمله به جمله». **No translation control** (D-19).
- **States:** collapsed · expanded · playing (the player state; the block itself doesn't change).

### PersonalExampleBlock
- A collapsed Disclosure card with the same `h3 > button` markup as ModelAnswerBlock, and the example RoleHeader (`stethoscope`). The FollowupBlock's nested short answer and every other collapsible content block use the same pattern. Expanded: PlayButton (sample voice) · DanishText `example` · prompt «مثال خودتان را از کار یا زندگی‌تان بسازید» + link to toolbox personal sentences.

### FollowupBlock
- `bg-surface-raised rounded-card p-4` with **1.5 px dashed `border-role-examiner`**. RoleHeader (`h3` «سؤال تکمیلی پیشنهادی», `message-circle-more`) + PlayButton · note (`text-caption text-text-muted`, «ممتحن واقعی ممکن است سؤال‌های دیگری بپرسد…») · DanishText `followup` · VerificationNote · TranslationToggle · secondary button «بلند جواب بدهید» (`mic`) · short answer as a nested Disclosure with the sample RoleHeader.

### SimilarQuestionLink
- Tertiary link row, 44 px: `layers` 16 + «یک سؤال مشابه:» + TermLabel (isolated) + «· موقعیت A». Built by ICU with isolated arguments.

### RelatedTopics
- `h2`-level list; rows like TopicListItem *compact* (Danish name + Persian name + chevron).

### ThemeCard
- **Anatomy:** icon tile 40 px (`bg-accent-subtle text-accent rounded-control`, theme icon 24) · Persian name `text-h3` · Danish name `text-da-intro text-text-muted text-align-flow` · count `text-caption text-text-muted` («۱۶ موضوع») · chevron (mirrored) at the inline end.
- Link card (§0.1). 1 per row at 375, 2 at 768, 3 at 1280. Min height 96 px.

### TopicListItem
- **Anatomy (stacked, right-aligned):** Danish name `text-da-card` (`text-align-flow`) · Persian name `text-ui text-text-muted` · meta row (`text-caption`): TermLabel · Pre2023Badge (plain) · PracticeStatus. Chevron (mirrored) centred at the inline end.
- Link card, `p-4`, 12 px gap between items. **No interactive descendants** (R-05).
- **Compact** variant (related topics, review due): one row, no meta.

### TermJumpList
- A `nav` holding a wrapping row of TermLabel chips (links, 44 px).
- **Current term** (term pages; rev. 1.1, S4): a **2 px `border-accent`** outline (≥ 6.5:1), plus `bg-accent-subtle text-accent` and `aria-current="page"`.

### TermGroup
- Heading: TermLabel as `h2` link (`text-da-card`, chevron) · rows A/B/C: letter tile 32 px + Danish name + Persian name, each a link card. **1280:** three columns in one row (A at the right).

### FilterChips
- Wrapping links, `rounded-chip px-3`, 44 px, `border border-border-strong text-text`. Current: `bg-accent text-accent-contrast` + `check` 16 at the inline start + `aria-current`. «همه» first.

### SearchField
- **Anatomy:** visible label above (`text-label`) · input 48 px, `bg-surface-raised border border-border-strong rounded-control ps-11 pe-11`, `text-ui`, `dir="auto"` · `search` 20 at the inline start (inside) · clear IconButton `x` at the inline end when not empty.
- **States:** empty (placeholder `text-text-muted`: «مثلاً sundhed، سلامت») · focus (ring, border `border-accent`) · typing · results · no results · error (not expected; if search data fails: InfoNote under the field).

### ResultsCount
- `text-label text-text-muted` under the field; the same text in the polite LiveRegion, debounced.

### StepList
- `ol`; each step: number tile 28 px (`rounded-full bg-accent-subtle text-accent`, Persian digit, 600) at the inline start · text `text-body`. Optional note `text-caption text-text-muted` with `info` 16. Steps 16 px apart, a 2 px `border-border` line joining the tiles (decorative).

### Timeline
- **Horizontal (≥ 768):** an `ol` of four segments in reading order (right to left): node 12 px `bg-accent` · label (`text-label`) · duration (`text-caption`, «حدود ۱۰ ثانیه»). Connectors 2 px `bg-border-strong` with an arrowhead `arrow-left` 16 (mirrored, so in RTL it points left = forward). The "about 4½ min" segment is visually longest (flex 3) but carries no internal split.
- **Vertical (< 768):** nodes on the inline-start side, connectors run downward. Last node: the closing line in DanishText `line`.

### TemplateCard
- Link card: number tile (template 1/2/3) · Persian title `text-h3` with the Danish cue as `<bdi lang="da">` · "fits" line `text-caption text-text-muted` · chevron. Hub: stacked at 375, three across at 1280.

### TemplateStep / CueRow
- **Card:** `bg-surface-raised border border-border rounded-card p-4`. Header: step tile (Persian digit) + Persian label (`text-label`) · PlayButton (sample voice) at the inline end. Body: DanishText `line` (grammar notation as printed) · Persian meaning `text-ui text-text-muted`.
- **Test myself on (hidden):** the Danish line is replaced by a dashed `bg-surface-sunken rounded-control` placeholder of the same height containing a secondary button `eye` + «نشان بده». **Revealed:** fades in; the container takes focus (`tabindex=-1`, no ring).
- **1280:** a three-column row: label (start) · Danish + play · meaning.
- **CueRow** adds the examiner's cue on top as DanishText `line` in `text-role-examiner` with the `message-circle` 16 icon, then the answer starter.

### PhraseItem
- Row (toolbox, vocabulary, examiner phrases): DanishText `line` · Persian meaning `text-ui text-text-muted` beneath · PlayButton at the inline end, top-aligned · optional decorative emoji slot at the inline start · optional tertiary «سایه‌خوانی». Rows 16 px padding, 1 px `border-border` separators. Examiner-line variant: wrapped in `bg-role-examiner-subtle` with the RoleHeader and SourceLabel.

---

## 4. Audio and recording

### PlayButton
- **Anatomy:** 44 px circle, icon 20. Optional visible label to its side («پخش») in rows where the icon isn't self-evident.
- **Variants by voice:** *examiner* (`bg-role-examiner-subtle text-role-examiner`, 1 px `border-role-examiner/30`) · *model* (`bg-role-sample-subtle text-role-sample`) · *neutral* (`bg-accent-subtle text-accent`).
- **Name** (rev. 1.1, M3): one constant name from messages that says what plays, for example «پخش سؤال ممتحن». Playing is reported by `aria-pressed="true"`. The name never flips to "pause".
- **States:** idle `play` · loading `loader-circle` spin, `aria-busy` · playing `pause` icon + 2 px ring in the role ink, `aria-pressed="true"` · paused `play` (ring stays 1 px) · error `rotate-ccw` + adjacent text «پخش نشد · دوباره» in `text-caption`, `circle-alert` 16 before it · hover: fill darkens via `bg-*` → `bg-surface-sunken` mix (use `hover:brightness-95`; dark: `hover:brightness-110`).
- **RTL:** never mirrored. **A11y:** name says what plays (from messages).

### AudioPlayer
- **Direction context** (rev. 1.1, a11y audit S1, blocking):
  - Base UI's Slider reads direction from **React context**, not from the DOM `dir`.
  - So the media part of the player (play button, scrubber, times) is wrapped in `<DirectionProvider direction="ltr"><div dir="ltr">…</div></DirectionProvider>`.
  - **SpeedControl sits outside that wrapper**, in the page's RTL context. It's a Persian radio group, so its options read right to left and its arrow keys follow RTL.
  - Required test: with focus on the thumb, **ArrowRight increases `aria-valuenow`** (seeks forward) in the RTL page.
- **Anatomy:**
  - LTR media row: a 44 px play/pause button (accent fill, `text-accent-contrast`) at the left, then the scrubber.
  - Times: elapsed under the scrubber's left end, total under its right end (`text-caption tabular-nums`, Persian digits, each an isolate).
  - **Outside the LTR wrapper:** SpeedControl on a second row, at the inline end.
- **Scrubber:** Base UI Slider.
  - Track: 4 px `bg-border-strong rounded-full` (≥ 3.29:1 against its well).
  - Fill: `bg-accent`, left to right.
  - Thumb: 20 px `bg-accent` with a 2 px `ring-surface-raised`; grows to 24 px on hover and drag (`motion-safe`).
  - Hit area: 44 px tall.
- **Fill vs track** (rev. 1.1, m7, a conscious choice): the fill measures **2.01:1** against the track. The position is still perceivable without the fill: the thumb's raised ring stands out from the track (3.78:1), and the elapsed and total times are always shown as text. The track keeps its ≥ 3:1 boundary instead of being lightened. The same reasoning covers the Countdown arc (the digits carry the value) and LoadProgress (it has value text).
- **States:** idle (duration «–:––» until loaded) · loading (button spinner, scrubber `aria-disabled`) · playing · paused · ended (position resets to 0, button shows `play`) · error (button `rotate-ccw`, text «صدا بارگیری نشد · دوباره امتحان کنید»; the Danish text below stays).
- **Container:** inside a content block, `bg-surface-sunken rounded-control p-3`.
- **A11y:** slider value text "۰:۱۲ از ۰:۳۱" from messages; → seeks forward (R-22).

### SpeedControl
- A Base UI RadioGroup styled as a 3-segment control (`rounded-control border border-border-strong`), each segment 44 × 56 px.
- **Visible labels:** «۰٫۷۵×» «۱×» «۱٫۲۵×».
- **Accessible names** (rev. 1.1, m5), from messages with ICU numbers: «سرعت ۰٫۷۵ برابر», «سرعت ۱ برابر», «سرعت ۱٫۲۵ برابر». A bare «۰٫۷۵×» is read badly.
- **Selected:** `bg-accent text-accent-contrast` (a filled shape, 7.60:1 against its neighbours) + `aria-checked`.
- Group label «سرعت» before it.
- **Placement:** always outside the AudioPlayer's LTR context (S1). Settings uses the same control at full width.

### WordHighlighter
- Current word: `bg-highlight` + 2 px underline `decoration-role-keyword` offset 3 px, `box-decoration-break: clone`, 2 px inline padding. **No weight change** (avoids reflow; tokens.md §2.5). States: off · on · paused (stays) · ended (clears).

### ExaminerPanel
- **Anatomy (centred column):** RoleHeader for the current unit (role label) · status row: activity icon 24 + status text `text-h3` · ShowTextToggle · revealed Danish text.
- **States:**
  - *Speaking:* `bg-role-examiner-subtle rounded-card p-5`, five 3 px bars in `text-role-examiner` (`animate-speaking`, staggered 0.1 s), «ممتحن صحبت می‌کند…».
  - *Waiting / your turn:* `bg-role-you-subtle`, `mic` icon, «نوبت شماست».
  - *Repeating:* the examiner surface, `repeat-2` icon, «ممتحن سؤال را تکرار می‌کند…».
  - *Blocked:* TapToHear takes the primary slot; the panel shows `volume-2` + «برای شنیدن ضربه بزنید».
- **Motion** (rev. 1.1, M6): the bars animate 3 times (3.3 s) each time the examiner starts a clip, then rest at full height. The status text carries the state. Reduced motion: a static `audio-lines` icon. **RTL:** the indicator isn't mirrored.

### ShowTextToggle
- A Disclosure trigger, tertiary: `captions` icon + the constant label «متن ممتحن» + a chevron. State is carried by `aria-expanded` (rev. 1.1, M3). Revealed text: DanishText (`question` or `line`) in a `bg-surface-raised rounded-control p-3` well inside the panel; practice adds Persian meaning for fixed lines beneath (`text-ui text-text-muted`).

### TapToHear
- Replaces the primary slot: primary `lg` button `volume-2` + «برای شنیدن ممتحن ضربه بزنید». Same position as the slot.

### RecordingIndicator
| Variant | Visual |
|---|---|
| Recording | 10 px dot `bg-rec` (`animate-rec-pulse`) + «در حال ضبط» `text-label text-rec` |
| Microphone ready | `mic` 16 `text-text-muted` + «میکروفون آماده است» `text-label text-text-muted` |
| Not recording | `mic-off` 16 + «ضبط نمی‌شود» `text-label text-text-muted` |
| Stopped at 3 min | `circle-stop` 16 + «ضبط در ۳ دقیقه متوقف شد» `text-label text-text` |
- Pill: `rounded-full px-3 min-block-8 border border-border`.
- **Motion** (rev. 1.1, M6): the pulse runs 3 times (4.8 s) at the start of each recording, then the dot stays solid. The word «در حال ضبط» carries the state throughout. Reduced motion: a static dot.

### RecordButton (shadowing)
- `lg` pill, 56 px, min 160 px wide. **Idle:** accent fill, `circle-dot` + «ضبط». **Requesting permission:** aria-disabled + spinner + «در انتظار اجازه…». **Recording:** `bg-rec text-danger-contrast` (6.62:1 light, 7.84:1 dark), `square` icon + «توقف» + elapsed. **Stopped:** returns to idle with «ضبط دوباره».

### TakePlayer
- An AudioPlayer in the *you* role: RoleHeader «پاسخ شما» (`mic`, accent tint) · player · length «طول: ۰:۵۲» + reference «حدود ۴۵ تا ۶۰ ثانیه پیشنهاد می‌شود» (`text-caption text-text-muted`, neutral, no colour) · «در ۲ بخش ضبط شده» when parts > 1.
- **None:** `mic-off` + «ضبط نشده» in a sunken well. **Ready · playing** as AudioPlayer.

### CompareButton
- Secondary button `headphones` + «مقایسه»; while running, the label changes to «اول اصل، بعد صدای شما…» (status text, not announced beyond the button).

### MicLevelMeter (optional, UX-OQ-26)
- `dir="ltr"`, 10 segments 8 × 16 px in a row, 2 px gap; lit segments `bg-accent`, unlit `bg-surface-sunken border border-border-strong`. Text under it: «بگویید <bdi lang="da">hej</bdi> و نوار را ببینید» → «صدای شما را می‌شنویم» with `check` once past the threshold. No colour change by level.

### SoundCheck
- A ReadinessChecklist row: number tile «۱» · `h2` «آیا صدا به اندازهٔ کافی بلند است؟» · secondary button `play` «پخش» · the sample line (placeholder UX-OQ-10: *"Hej. Velkommen til prøven."*) as DanishText `line` + Persian meaning · two buttons: secondary «بله، می‌شنوم» and tertiary «صدایی نمی‌آید».
- **States:** not checked (status chip «هنوز بررسی نشده», neutral) · playing (PlayButton state) · heard (`check` + «شنیده شد», `text-accent`) · problem (InfoNote with the help list).

### WakeLockTip and TipLine
- InfoNote *compact* variants: `lock` + «ممکن است صفحه هنگام صحبت خاموش شود. قفل خودکار گوشی را روی ۲ دقیقه یا بیشتر بگذارید.» · `bell-off` + «حالت مزاحم نشوید را روشن کنید تا تماس‌ها آزمون را قطع نکنند.» See [screens/mock-get-ready.md](screens/mock-get-ready.md) for both spike variants.

### MicPermissionExplainer
- **Inline** (get ready) and **sheet** (first answer aloud, first Record) variants. Anatomy: `mic` 24 in a 48 px `bg-accent-subtle` circle · title («چرا میکروفون؟», `text-h3`) · three facts as a list with 16 px icons: `smartphone` «فقط روی همین دستگاه می‌ماند» · `shield-check` «صدای شما از این گوشی بیرون نمی‌رود» · `trash-2` «وقتی صفحه را ترک کنید پاک می‌شود، مگر اینکه نگهش دارید» · «اختیاری است» · primary «اجازه دادن به میکروفون» · secondary «ادامه بدون ضبط».

### MicDeniedHelp
- Heading with the detected browser («Safari روی آیفون») · `ol` steps (StepList style) · secondary «دوباره امتحان کنید» · primary «ادامه بدون ضبط» (selected state per UX).

---

## 5. Timers and progress through an activity

### ExamClock
- `clock-3` 16 `text-text-muted` + «۲:۱۵ از حدود ۴:۳۰» (`text-ui` 600 `tabular-nums`, ICU with isolated durations); practice shows «۲:۱۵» only. **Never changes colour, size or weight**, including in grace (UXD-05).
- **Hidden:** «زمان‌سنج‌ها پنهان است» + TimersToggle.

### TimersToggle
- An IconButton, 44 px.
- **Name** (rev. 1.1, M3): the constant «پنهان کردن زمان‌سنج‌ها», with `aria-pressed="true"` while the timers are hidden.
- The icon swaps between `eye-off` and `eye`; the name doesn't change.
- The label is visible from 768 px.
- **Pressed:** a 2 px `border-accent` outline (the S4 shape cue).

### ElapsedTimer
- Large centred «۰:۴۱» (`text-h1` size, 600, `tabular-nums`) with the reference line beneath in `text-caption text-text-muted` («حدود ۴۵ تا ۶۰ ثانیه پیشنهاد می‌شود»). Running · paused («متوقف» chip) · hidden.

### Countdown (the 10-second look; the only countdown)
- **Anatomy:** label «زمان نگاه کردن» (`text-label`) · a 112 px ring: track 6 px `stroke-border-strong`, remaining arc 6 px `stroke-accent`, starting at 12 o'clock and shrinking **clockwise** (clock-like, not mirrored) · centre digit `text-display` in Persian digits, `aria-hidden`.
- **States:** counting · paused (practice: digit stays, chip «متوقف» under the ring) · ended (ring empty; label «زمان نگاه کردن تمام شد»).
- **No escalation:** no colour change in the last seconds. The arc steps once per second; nothing interpolates, so reduced motion needs no variant.

### PacingAid (Could)
- Collapsed Disclosure «تقسیم تقریبی زمان» in practice; panel: three lines in `text-caption` + the part's elapsed time; source line «پیشنهاد کتابچه». No bars, no colours.

### StepIndicator
- **Mock:** two segments, each a 6 px pill (flex 1, 4 px gap) in a row that **fills from the right** (mirrored): done/current `bg-accent`, upcoming `bg-surface-sunken border border-border-strong`; text «بخش ۱ از ۲ · سؤال موقعیت» (`text-label`) beside it.
- **Shadowing:** up to 8 dots (10 px; current 10 × 24 px pill) in the same fill direction; more than 8 → the two-segment bar style with a numeric label only.

### LoadProgress
- 8 px track `bg-surface-sunken border border-border-strong rounded-full`, fill `bg-accent` growing **from the right** (it's progress, not media). Label «ممتحن آماده می‌شود…» + data note «حدود ۱ مگابایت، فقط یک بار» (`text-caption`).
- **Slow:** InfoNote «بارگیری بیشتر از معمول طول می‌کشد. هنوز چیزی شروع نشده.» + secondary «صبر می‌کنم» · tertiary «دوباره امتحان کنید» · tertiary «خروج». **Failed:** `circle-alert` + text + secondary «دوباره امتحان کنید» + tertiary «خروج». **Done:** bar full, then hidden; Start becomes active.

---

## 6. Mock exam specific

### ModeCard
- `bg-surface-raised border border-border rounded-card p-5`, `h2` (`text-h2`) · RulesList · (exam) the alternative line «ترجیح می‌دهید آرام‌تر پیش بروید؟ تمرین را انتخاب کنید.» · full-width button at the bottom. **Practice** card button is **primary**; **Exam conditions** button is **secondary** (practice-first, D-1). Exam card adds the interruption note in an InfoNote compact.
- **Unavailable** (pilot): button aria-disabled with the reason beneath.

### RulesList
- `ul` with 6 px `bg-text-muted` dots at the inline start, `text-ui`, 8 px between items. The "can't be paused" rule in 600 weight (it's the essential time-limit statement, WCAG 2.2.1).

### ReadinessChecklist
- Rows separated by 1 px `border-border`; each row: number tile · `h2` (`text-h3` size) · status chip at the inline end (neutral «هنوز بررسی نشده», `check` + «آماده», `mic-off` + «خاموش: ادامه بدون ضبط») · body.

### DrawCard
- **Face down:** portrait 3:4, `rounded-card`, `bg-accent-subtle` with a subtle diagonal line pattern (`repeating-linear-gradient` in accent at 8 % alpha), `border border-border-strong`. All three identical: no letters, numbers or marks.
- **States:**
  - **Hover** (pointer only): lifts 2 px + `shadow-raised` (`motion-safe`).
  - **Focus:** the ring.
  - **Pressed:** `bg-surface-sunken`.
  - **Revealing:** flip, 250 ms (a crossfade under reduced motion).
  - **Revealed:** face up, `bg-surface-raised`, the letter in `text-display`.
  - **The other two after a draw** (rev. 1.1, m8): native `disabled`, so they leave the tab order. They fade to 60 % and recede into thumbnails; inactive components are exempt from contrast. The single-draw rule doesn't depend on this: the state machine already ignores them.
- **375:** three in one row, each ~100 px wide, 44 px+ tall obviously.

### RevealPanel
- The tapped card enlarges in place into a card: letter tile 72 px (`rounded-card bg-accent-subtle text-accent`, `text-display`) · Danish topic name at `text-da-question` 700 · Persian name `text-ui text-text-muted` · TermLabel chip · Pre2023Badge explained (if any) · first-time hint InfoNote compact «حرفی که گرفتید حرف واقعی این موضوع در آزمون است.» · LoadProgress · clock note `text-caption` · Start in the primary slot.
- **States:** loading · slow · failed · ready (per LoadProgress).

### LookControls (practice)
- One row above the primary slot: secondary «+۱۰ ثانیه» · secondary «توقف» / «ادامه» (`pause`/`play`), each ≥ 44 px, 8 px apart. «آماده‌ام» is the primary slot.

### ChoiceButtons (practice, "let me choose")
- Legend `text-h3` «ممتحن دربارهٔ کدام موقعیت بپرسد؟» · two large secondary buttons with the letter tile and the Danish title (`text-da-card`) · tertiary `shuffle` «بگذارید ممتحن انتخاب کند». A first (right/top).

### PrimaryActionSlot
- **One persistent button**, `lg` (56 px on phones, 48 px from 768), the full width of the focused column. It lives in the answer area (`data-sticky="answer-area"`): a `bg-surface-raised` area with `shadow-raised` on its block-start edge and safe-area padding.
- **Pinning** (rev. 1.1, S3, mandatory): the answer area is pinned to the bottom **only** when all three hold:
  - the viewport is taller than 30 rem (`short:static` otherwise)
  - the area is no more than 40 % of the viewport height
  - text is at 150 % or less (R-36)

  If any condition fails, the area and the focused header both become `static` and scroll with the content. The answer area keeps its place after the examiner panel in the DOM. The measured `--bottom-offset` is set to 0 when the area isn't pinned (handoff H-9).
- **States:** *waiting* (aria-disabled) «گوش دهید…» with static `audio-lines` 20, dashed border, sunken fill · *active* (accent fill) «جوابم تمام شد» · *busy* spinner · *tap to hear* · *start* · *continue*.
- **Large text (≥ 150 %, R-36):** covered by the pinning rule above. The hook measures the root font size and the area's height; no CSS-only guess.
- First-answer hint under it: `text-caption text-text-muted` «وقتی صحبتتان تمام شد ضربه بزنید. برنامه هیچ‌وقت حرفتان را قطع نمی‌کند.»

### RepeatControl
- One button rendered as a card: `bg-surface-raised border border-border-strong rounded-card p-4`, at least 88 px tall.
  - Line 1: `repeat-2` 20 + the visible action label «درخواست تکرار سؤال» (`text-ui` 600, `text-accent`).
  - Line 2: DanishText `line` *"Undskyld, vil du godt gentage spørgsmålet?"*.
  - Line 3: the Persian meaning, `text-caption text-text-muted`.
- **Naming** (rev. 1.1, M2):
  - `aria-labelledby` → the line-1 element only, so the name is the action.
  - `aria-describedby` → the Danish line (`lang="da"`) and the Persian line.
  - No `aria-label`, so nothing is read twice.
- **States:** available (hover `bg-surface-sunken`) · unavailable while the examiner speaks (aria-disabled per §0.1) · first-time hint «اول آن را بلند بگویید، بعد ضربه بزنید» under it · *slower offered* (practice, from the second repeat): a tertiary `snail` «آهسته‌تر بشنوید» beside it. "Hear the situation again" (first question only): tertiary link under it.

### HintsSheet (practice)
- Bottom sheet, max 85 dvh, grabber 4 × 36 px, title «راهنمایی» + `x`. Three stacked sections, each with its RoleHeader: translation (sunken well) · key words (KeywordList) · template (TemplateCard compact). Scrolls inside.

### GraceNotice
- InfoNote standard on `bg-accent-subtle`, `info` icon, `text-body` 600 first sentence: «می‌توانید جمله‌تان را تمام کنید. بعد ممتحن آزمون را تمام می‌کند.» Appears with a fade; never red, never a countdown.

### LeaveDialog, InterruptionDialog, AudioErrorDialog, PauseOverlay
- Base UI AlertDialog. **Phone:** centred card `max-inline-dialog`, 16 px from the edges, `rounded-sheet p-6 shadow-overlay`. **≥ 768:** 480 px wide.
- **Anatomy:** icon 24 in a 48 px circle (`circle-pause` for interruption/pause, `circle-alert` for audio error, `log-out` for leave) · title `text-h2` · body `text-body` (facts: "the clock stopped at ۲:۳۰"; "marked interrupted, not a fail" in 600) · actions stacked full-width, 12 px apart: **primary** (Continue, default focus) · **secondary** (End and see my answers) · 8 px extra gap · **tertiary destructive** «ترک بدون ذخیره» in `text-danger` with its note `text-caption` under it.
- **States per variant:** practice (paused) vs exam (clock running: the body says so). Escape = Continue.

### EndScreen
- Centred focused column: the closing line in an examiner-tinted quote card (RoleHeader «جملهٔ ممتحن» + SourceLabel SIRI + DanishText `line` *"Tak, så er prøven forbi."*) · `h1` «آزمون تمام شد» · one fact `text-lead`: «زمان کل: ۳:۵۲» (+ interrupted note) · primary "See my answers and check myself" (`mock.end.review`) · Close at the header start. **No illustration, no confetti, no score.**

### FocusNextTimePicker
- RadioGroup of 44 px rows with the radio at the inline start: «بدون انتخاب» first and selected by default, then the self-check items. Card `bg-surface-raised border border-border rounded-card p-4`, legend `text-h3` with `sparkle`.

---

## 7. Review and progress

### KeepCard
- `bg-surface-raised border border-border rounded-card p-4`, `smartphone` RoleHeader-like row. Text «ضبط‌های شما وقتی این صفحه را ترک کنید پاک می‌شوند.» · Switch at the inline start with its label «روی همین دستگاه نگه دار» · replaces-note `text-caption`.
- **States:** off · on (switch on + `check` «روی این دستگاه نگه داشته شد», announced) · failed (`circle-alert` + text, switch returns off) · unavailable (switch aria-disabled + reason) · from history (kept: text + secondary destructive `trash-2` «حذف»).

### FactsList
- `dl` in a `bg-surface-sunken rounded-card p-4`; rows: term `text-text-muted` · value `text-text` 600, two per row at ≥ 768. Notes («درخواست تکرار در آزمون واقعی هم مجاز است.», the short-attempt note) as `info` + `text-caption` lines under the related fact. No icons for good/bad; no colours.

### ReviewQuestionItem
- `h3` RoleHeader (question role) · QuestionBlock (compact: no similar links) with Disclosures for translation and key words · **your answer** panel (TakePlayer) · **sample** panel (ModelAnswerBlock; collapsed on phones, expanded from 768; expanded when not recorded) · tertiary «این سؤال را در موضوع باز کنید».
- **1280:** two equal columns, your answer on the start side (right), sample on the end side, top-aligned, 24 px gap.
- **States:** recorded · not recorded · parts.

### SelfCheckList
- `fieldset` card (`bg-surface-raised border border-border rounded-card p-4`), legend `text-h3` with `list-checks` «خودارزیابی: سؤال اجباری اول».
- **Row:** 44 px min; checkbox 22 px box (2 px `border-border-strong`, `rounded-md`) at the inline start; checked: `bg-accent` + white `check` 16; label `text-ui`; Danish example phrase beneath as DanishText `line` at 16 px in `text-text-muted`; tertiary Disclosure «این یعنی چه؟» with the explanation.
- **No row colour change when ticked, no total, no count** (US-042 #3). Private note `text-caption`: «هیچ‌کس جز شما این را نمی‌بیند.»
- **States:** unticked · ticked · saved (silent) · not saved (one StorageNotice for the page).

### DiscardGuardDialog
- AlertDialog as §6; actions: primary «بمانم» (default focus) · secondary «نگه داشتن و رفتن» · tertiary destructive «رفتن بدون نگه داشتن». 2-button variant (answer aloud, shadowing): «بمانم» · destructive «رفتن».

### ReviewDueList / ReviewDueItem
- List of link rows: Danish name `text-da-card` (flow) · Persian name `text-caption text-text-muted` · chip «مرور روز ۳» (`rounded-chip bg-accent-subtle text-accent text-label`, `clock-3` 16) · chevron. Never "missed", never overdue colours.

### UpcomingReviewItem
- Non-link row: Danish name + «مرور بعدی: ۳ روز دیگر» in `text-caption text-text-muted`.

### ReviewBanner (topic page)
| Variant | Visual |
|---|---|
| Due | InfoNote standard, `clock-3`, «آمادهٔ مرور روز ۷…» |
| Next | `text-caption text-text-muted` line «مرور بعدی: ۴ روز دیگر» |
| Complete | `check` 16 + «چرخهٔ مرور کامل شد» caption |
| New cycle | tertiary button «شروع چرخهٔ تازه» |

### PracticeStatus
- `text-caption text-text-muted`: «۲ بار تمرین شده · ۳ روز پیش». "Ready to review": the ReviewDueItem chip style.

### AttemptHistoryItem
- Link card: date (`text-caption`) · Danish topic name + «· A» · chips row: mode chip (neutral border: «تمرین» / «شرایط آزمون» / «قطع شده»; "ended early" as text) · total time `tabular-nums` · optional `sparkle` «تمرکز: مثال زدن» · optional `smartphone` «ضبط‌ها نگه داشته شده». **No ticks** (UX-OQ-28).

### PractisedTopicItem
- Link row: Danish + Persian names · «۳ بار تمرین شده · امروز» · review status caption.

---

## 8. Feedback and system

### LiveRegion
- Visually hidden (`sr-only`), one per page. No visual.

### Toast
- **Use** (rev. 1.1, a11y audit M9): **redundant confirmations only**, where the outcome is already visible on the page. Examples: «مرور انجام شد», «پیوند کپی شد», «داده‌های شما حذف شد», «این موضوع تمرین‌شده ثبت شد».
- **Errors and failures are never toasts.** "We couldn't save just now", "keep failed" and similar use a **persistent** StorageNotice or InfoNote next to what failed. It stays until the learner dismisses it or the condition clears. (This changes the UX inventory's example; see DF-12.)
- **Visual:** bottom centre, 16 px above the tab bar or the answer area, at most 420 px wide; `bg-surface-raised border border-border rounded-control shadow-overlay px-4 py-3`; icon 20 (`check`) + `text-ui`.
- **Behaviour:** shown for at least 6 s; pauses on hover and focus; never steals focus. Motion §0.4.

### StorageNotice
- InfoNote compact with `info`, text + Privacy link. Shown once per session where specified.

### ErrorState
- Centred column, `max-inline-reading`: icon 24 in a 64 px `bg-surface-sunken` circle (`file-question` not found, `circle-alert` page error, `wifi-off` offline, `circle-pause` couldn't be kept) · `h1` · body `text-body text-text-muted` · primary button (full width on phones, in the thumb zone) · tertiary secondary link. No illustration.

### EmptyState
- Like ErrorState but inline in a section: 48 px icon circle, `h2`-sized title optional, body, one or two tertiary links. Never lists what isn't done.

### Skeleton
- Static `bg-surface-sunken rounded-control` blocks at the real content's sizes (title 60 % width, two lines, a card). **No shimmer** (calm, and nothing to reduce). Shown only after the delay threshold; the region gets `aria-busy`.

### ConfirmDialog
- AlertDialog: title names the action («همه چیز حذف شود؟») · body lists exactly what goes · a `bg-danger-subtle rounded-control p-3` line «این کار برگشت‌پذیر نیست.» · actions: secondary «انصراف» (default focus, first) · destructive primary `bg-danger text-danger-contrast` «همه چیز را حذف کن». At ≥ 768 the two sit side by side, cancel at the start.

### Dialog / Sheet (primitives)
- Dialog: scrim `bg-scrim`, panel per §6 dialogs. Sheet: block-end anchored, `rounded-ss-sheet rounded-se-sheet`, grabber, `pbe` safe area. Both: focus trap, Escape, return focus, `aria-labelledby`. Motion §0.4.

### Disclosure
- **Trigger:** a 44 px row, label `text-ui` 600 `text-accent` (or the RoleHeader for content blocks), and a `chevron-down` 20 at the inline end that rotates 180° when open.
- **Constant name** with `aria-expanded` (M3).
- When the disclosure has a heading, the **button goes inside the heading** (`<h3><button>`, M4).
- The panel follows in the DOM and fades in.
- States: collapsed · expanded · hover (`bg-accent-subtle` on tertiary triggers) · focus ring.

### Switch / Checkbox / RadioGroup
- **Switch:** track 44 × 26 px.
  - **Off:** track `bg-surface-sunken border border-border-strong`; thumb `bg-text-muted` (rev. 1.1, m6: 6.41:1 light, 9.27:1 dark against the track; it was 1.15:1).
  - **On:** track `bg-accent`; thumb `bg-surface-raised` (7.60:1 light, 8.09:1 dark).
  - The thumb is 20 px and moves 18 px (150 ms, `motion-safe`; instant under reduced motion).
  - The whole row, with its label, is the 44 px target. The switch sits at the inline start of the label (UX).
  - In RTL, "on" moves the thumb toward the inline end (left). Base UI's DirectionProvider handles this.
- **Checkbox:** as SelfCheckList.
- **Radio:** 22 px circle, 2 px `border-border-strong`; selected: 2 px `border-accent` + 10 px `bg-accent` dot; rows 44 px; control at the inline start.
- **Segmented RadioGroup** (settings speed, translations default): SpeedControl style.
- All: visible labels; disabled per §0.1.

### OverflowMenu
- IconButton `ellipsis` 44 px; Base UI Menu as a popover anchored to the button's inline start edge (≥ 768) or a bottom sheet (< 768); items 44 px with icons (`share-2`, `flag`).

### ShareButton
- Secondary button `share-2` «اشتراک‌گذاری» (header at ≥ 768) or a menu item (phones). Fallback copy confirmation via Toast «پیوند کپی شد».

### ReportProblemLink
- Tertiary link `flag` 16 + «گزارش مشکل در این موضوع» + ExternalLink icon if it leaves the app. **Target is a placeholder** until UX-OQ-21.

### Button (primitive)
- **Variants:** primary · secondary · tertiary · destructive (filled `bg-danger text-danger-contrast`; hover darkens via `brightness-90`/`110`) · destructive-tertiary (`text-danger`) · icon-only (44 × 44, transparent, `text-text-muted`, hover `bg-surface-sunken text-text`; accessible name required).
- **Sizes:** `md` 44 px (`px-4`, `text-ui` 600, icon 20, 8 px gap) · `lg` 56 px (`px-5`, 17 px 600; focused primary, section primary on phones). There is **no size below 44 px**.
- **Widths:** content width by default; `block` (full width) on phones for primary actions.
- **States:** §0.1. Loading keeps the width (no layout shift).

### IconButton, Icon, VisuallyHidden, Card, Chip, Progress, Slider, StatusRegion
- Covered by the specs above: IconButton = Button icon-only; Icon §0.3; Card = link card / content block surfaces; Chip = `rounded-chip` neutral or accent-subtle; Progress = LoadProgress; Slider = AudioPlayer scrubber; StatusRegion = LiveRegion.

### Screen-level compositions named in the screen specs
| Component | Spec |
|---|---|
| PrimaryActionCard (Home, first visit) | Link card at full width with `bg-accent text-accent-contrast`, `signpost` icon tile in `bg-accent-hover`, title `text-h3`, hint `text-caption` also in `text-accent-contrast` (7.60:1; never reduced opacity), chevron mirrored. Hover `bg-accent-hover`. The only filled card on the page. |
| StartingPointCard | Link card (§0.1) with an icon tile (`library-big`, `messages-square`, `signpost`), title `text-h3`, hint `text-caption text-text-muted`, chevron |
| ContinueCard | Content card: RoleHeader-less; Danish name `text-da-card`, Persian name, TermLabel, primary `md` button «ادامه»; mock variant: «آخرین آزمون شما» + date + secondary «دیدن پاسخ‌هایم» |
| NextStepsCard | Two link cards side by side at ≥ 768 («مطالعهٔ یک موضوع» · «امتحان یک آزمون تمرینی»), stacked on phones |
| LastChecked | `text-caption text-text-muted` with `clock-3` 16: «آخرین بررسی: ۱۷ نوامبر ۲۰۲۶» |
| ContentsList | Disclosure «در این صفحه» on phones; sticky side list at 1280 (SectionNav side style) |
| SimilarRow / SectionLink | Card: Danish label `text-da-card` (flow) + Persian label; nested list of link rows: TermLabel + «· B · سؤال کلی» + chevron |
| LabelLegend | Cards per SourceLabel variant: the label exactly as it appears elsewhere + explanation `text-body` |
| Picker (themes or topics) | Sheet with a SearchField and a radio list |
| PauseButton, RerecordButton | Secondary buttons `pause` «توقف» · `rotate-ccw` «دوباره ضبط کنید» in the practice row |
| HintDisclosure (answer aloud) | Tertiary Disclosure `key-round` «نمایش کلمه‌های کلیدی» → KeywordList |
| PrevNextControls | Two secondary `lg` buttons with `chevron-right` (next, mirrored → points left) and `chevron-left` (previous, mirrored → points right), labels visible |
| SentenceText | The context paragraph (rev. 1.1, M10): **each sentence is a real `<button type="button">`**, styled inline (`display: inline`, no border or background, `text-align: inherit`, a 44 px line box from the 24 px line height + padding), inside a `lang="da" dir="ltr"` container. Names come from the sentence text itself. The current one: `text-text`, a 2 px underline `decoration-accent`, `aria-current="true"` (the underline is the shape cue). Others: `text-text-muted`. Focus ring as usual. |
| RevealButton | Secondary `eye` «نشان بده» in the test-myself placeholder |
