# Visual design, v1

| | |
|---|---|
| **Status** | **Revision 1.1**: the [accessibility audit](../reviews/2026-11-21-a11y-audit.md) is applied (see below). Ready for `frontend-developer`. Identity (name, direction) still awaits the owner. |
| **Date** | 2026-11-19 (v1, finished 2026-11-20); rev. 1.1 2026-11-21 |
| **Author** | `ui-designer` |
| **Inputs** | [UX README rev. 2](../ux/README.md), [component inventory](../ux/component-inventory.md), all 18 [UX screens](../ux/screens/), [personas](../product/personas.md), [PRD §6](../product/prd.md#6-solution-overview), ADR-0004, ADR-0009, ADR-0014 |
| **Scope** | Visual only. Flows and IA are `ux-architect`'s; findings are listed below, not applied. |

## Contents

| File | What it is |
|---|---|
| [design-principles.md](design-principles.md) | Seven principles, each with a do and a don't |
| [identity.md](identity.md) | Three names and three visual directions, with recommendations; situation-visual options and costs |
| [tokens.md](tokens.md) | Every token, the type system, the Danish-in-RTL alignment rule, **contrast ratios for every pair in both themes**, motion |
| [`src/styles/tokens.css`](../../src/styles/tokens.css) | The tokens themselves (Tailwind v4 `@theme static`, light + dark) |
| [`src/app/globals.css`](../../src/app/globals.css) | Base styles, focus, sticky-bar scroll padding, reduced motion, `skip-link` and `text-align-flow` utilities |
| [components.md](components.md) | Visual spec for every inventory component: anatomy, variants, states, RTL, accessibility; role headers; icon map and mirroring; motion table |
| [screens/](screens/) | One visual spec per UX screen at 375 and 1280 px |
| [preview/index.html](preview/index.html) | Static, self-contained preview (RTL, real 2024-maj-b content, light/dark toggle). Open it in a browser. **Internal only**: it contains booklet content, which isn't cleared for publishing. |

## Revision 1.1: accessibility audit applied (2026-11-21)

| Audit item | What changed | Where |
|---|---|---|
| **S1** scrubber reverses in RTL | The player's media row sits in `<DirectionProvider direction="ltr"><div dir="ltr">`; SpeedControl stays outside it; a required test checks that ArrowRight increases `aria-valuenow` | components.md AudioPlayer, SpeedControl |
| **S2** sticky offsets don't match | The hard-coded `:has()` offsets were removed from `globals.css`; offsets are now measured (H-9) | globals.css, components.md §0.1, H-9 |
| **S3** pinned zones at 200 % zoom and in landscape | **DF-10 is now mandatory.** Both bars unpin when the viewport is ≤ 30 rem tall (new `short:` variant) or the answer area is > 40 % of the viewport height | globals.css, components.md §0.1, FocusedModeShell, PrimaryActionSlot, [mock-interview](screens/mock-interview.md#pinning-rev-11-a11y-audit-s2-and-s3-mandatory) |
| **S4** "current" relies on hue | A ≥ 3:1 shape cue on every current or selected state: 3 px accent bar (tab bar, MenuDrawer, SegmentedNav), 2 px accent outline (TermJumpList, TimersToggle, selected situation card) | components.md §0.1 and each component |
| M2 | RepeatControl: `aria-labelledby` for the action label, `aria-describedby` for the Danish and Persian lines | components.md RepeatControl |
| M3 | Toggles keep one constant name with `aria-pressed` or `aria-expanded` | §0.1, PlayButton, TimersToggle, TranslationToggle, ShowTextToggle, Disclosure |
| M4 | Collapsible blocks use `<h3><button>` | ModelAnswerBlock, PersonalExampleBlock, Disclosure |
| M5 | Compact situation cards wrap instead of truncating | SituationCard, mock-interview |
| M6 | `rec-pulse` and `speaking` run 3 iterations (4.8 s and 3.3 s) | tokens.css, tokens.md §7 |
| M9 | Toasts only for redundant confirmations; failures are persistent notices | components.md Toast (DF-12) |
| M10 | Shadowing sentences are real `<button>`s | components.md SentenceText |
| M11 | Forced colours: `Highlight` outline on current or selected states | globals.css, §0.1 |
| m5 | SpeedControl names «سرعت ۰٫۷۵ برابر» | SpeedControl |
| m6 | Switch off-thumb is `bg-text-muted` (6.41:1 / 9.27:1) | Switch |
| m7 | Fill vs track 2.01:1 kept as a documented choice (thumb ring and time text carry the value) | AudioPlayer, tokens.md §3.3 |
| m8 | Undrawn cards are native `disabled` | DrawCard, mock-draw-and-look |

**Not in this revision's brief, still open:** M1 (Danish inside `aria-label` and live-region text), M7 and M8 (exam-conditions announcements and screen-reader accommodations; these touch flows and need `ux-architect` and `pd3-exam-expert`), m1 to m4 and m9 to m11 (code and tests).

## Key decisions

1. **Direction "Fjord"** (pending the owner): warm paper surfaces, deep teal accent, four role hues (indigo examiner, plum sample, saffron key words, clay personal example). No green/red anywhere for performance.
2. **Danish face: Atkinson Hyperlegible Next** (free, OFL, variable 200–800, in Next 16.4.6's font data), chosen for character distinction (`o/ø`, `a/å`, `æ`). Vazirmatn stays for Persian; weights below 400 are removed from the tokens.
3. **Content roles = icon + label + colour** through one RoleHeader primitive used on every screen. Only examiner speech and key words get tinted blocks; the suggested follow-up is marked by a dashed examiner edge.
4. **Danish alignment in RTL:** paragraphs fill the reading column and align left; short labels align to the page start via `text-align: match-parent`. No floating LTR blocks at 1280.
5. **UX-OQ-16 decided:** lucide icons for themes and roles; the booklet's key-word and toolbox emoji stay as decorative recall hooks, limited to Emoji ≤ 12.0 by content validation.
6. **Timers never escalate** (UXD-05), and the only countdown (the look) changes digits, not colour.
7. **Skip link fixed:** a solid, padded button 12 px in from the corner, ring offset 3 px (utility `skip-link`).
8. **Both spike variants designed:** back guard vs "ended early" notice ([mock-interview](screens/mock-interview.md#back-guard-spike-both-variants), [mock-start](screens/mock-start.md#back-guard-spike-the-two-variants-of-the-notice-c19-pending-oq-9)); wake-lock tip supported vs unsupported ([get ready](screens/mock-get-ready.md#wake-lock-tip-both-variants-pending-the-oq-9-spike), [answer aloud](screens/answer-aloud.md#wake-lock-tip-pending-the-oq-9-spike-both-variants-designed), [shadowing](screens/shadowing.md#wake-lock-tip)).
9. **Placeholders:** UX-OQ-10 (sound-check line) in get ready; UX-OQ-19 (sample-answer label) and UX-OQ-20 (differs-from-SIRI slot) in topic study and components; UX-OQ-21 (report link) everywhere a ReportProblemLink appears, pointing to `/fa/about#report` for now.

## Handoffs (not done here: outside this brief's "tokens and global CSS only")

| ID | To | What |
|---|---|---|
| H-1 | `frontend-developer` | `src/app/[locale]/layout.tsx`: replace the skip link's `className="sr-only focus:not-sr-only"` with `className="skip-link"`; give `<main id="main">` `tabIndex={-1}` on every page. |
| H-2 | `frontend-developer` | `layout.tsx`: replace `Noto_Sans` with `Atkinson_Hyperlegible_Next({ subsets: ["latin"], display: "swap", variable: "--font-danish-face" })`. Keep the variable name; tokens already reference it. |
| H-3 | `frontend-developer` | `DanishText`: add `role` (maps to `text-da-*`) and `align: "own" \| "flow"` props ([tokens.md §2.4](tokens.md#24-how-danish-aligns-inside-the-rtl-column-scaffold-follow-up)). |
| H-4 | `qa-engineer` | A unit test that parses `tokens.css` (light and dark blocks) and asserts the ratios in [tokens.md §3](tokens.md#3-contrast-results-wcag-22-aa), so a colour edit can't silently break AA. The ratios in this release were computed by hand from the WCAG formula; the test also double-checks that arithmetic. |
| H-5 | `content-engineer` | Validation rule: emoji in key words and toolbox items must be Emoji 12.0 (2019) or older. |
| H-6 | `software-architect` | Agree the icon map in [components.md §0.3](components.md#03-icons) (it extends ADR-0009's theme-icon map; `bolig` uses `building-2` so it doesn't repeat the Home tab's `house`). |
| H-7 | `frontend-developer` | Mark sticky elements with `data-sticky="tab-bar" \| "section-nav" \| "focused-header" \| "answer-area"`; `globals.css` sets scroll padding from them (WCAG 2.4.11). |
| H-8 | main thread | Run `npm run lint` and `npm run build` after these token changes (this agent had no shell; see the final report). |
| **H-9** | `frontend-developer` | **Measured sticky offsets (rev. 1.1, a11y audit S2 and S3).** A small client hook (for example `useStickyOffsets()`, mounted once in AppShell and FocusedModeShell) that:<br>1. observes every `[data-sticky]` element with one `ResizeObserver`, and listens to `resize` / `visualViewport` changes;<br>2. decides whether each bar is **pinned**: its computed `position` is `sticky` or `fixed`, and for the answer area its height is ≤ 40 % of `visualViewport.height`, the viewport is > 30 rem tall, and the root font size is ≤ 24 px. When the answer area fails, it sets `data-pinned="false"` on **both** the answer area and the focused header (they use `data-[pinned=false]:static`);<br>3. sets `--sticky-offset` (sum of the pinned top bars' heights) and `--bottom-offset` (sum of the pinned bottom bars' heights, including the tab bar < 768) on `document.documentElement`, and **0 for any bar that isn't pinned**;<br>4. batches the writes in `requestAnimationFrame` and cleans up on unmount.<br>`globals.css` already turns the variables into `scroll-padding-block-start/end`. Test: at 375 × 667 in practice, and at 1280 × 800 with 200 % zoom, focus every control and assert that none is covered by a bar. |

## Open questions for `ux-architect`

Visual choices that touch behaviour or layout slightly. None was applied as a flow change; each is designed in the way described and can be reverted.

| ID | Finding | Designed as | Ask |
|---|---|---|---|
| DF-01 | The inventory asks the word highlight to use "underline + weight". A weight change re-flows the line on every word. | Underline + background tint, no weight change | Accept the substitution (the non-colour cue remains) |
| DF-02 | The agent brief allows timers that "escalate near the end"; UXD-05 forbids it. | No escalation anywhere; UXD-05 wins | Confirm |
| DF-03 | Until UX-OQ-21 is decided, ReportProblemLink needs a target. | A temporary `#report` section on About with a "coming soon" note | Confirm, or prefer hiding the link until then |
| DF-04 | Get ready (never asked): "Allow microphone" and "Continue to the draw" would both be primary. | "Allow microphone" styled secondary; Continue is the single primary (aria-disabled until decided) | Confirm the hierarchy reads clearly to Ahmad |
| DF-05 | Mock start: the practice card's button is filled, the exam card's is outlined, reinforcing D-1. | As described | Check it doesn't read as "exam conditions is discouraged" to Maryam (learner testing) |
| DF-06 | Guide "does / doesn't" lists: tick and cross icons would read as right/wrong. | Plain bullets | Confirm |
| DF-07 | AppHeader isn't sticky on any width (vertical space on phones; tab bar and section nav already orient). | Static header | Confirm; the IA doesn't specify |
| DF-08 | Draw → reveal: the two undrawn cards shrink into small thumbnails above the reveal panel instead of staying in the row. | Thumbnails, aria-disabled | Confirm it still reads as "the other slips" |
| DF-09 | Exam guide: inline play buttons inside step text need a 44 px hit area without breaking Persian line height. | 32 px visual button, 44 px hit area via padding and a negative block margin | Accept, or move each play button to its own line under the step |
| DF-10 | R-36 "unpin at large text" needs a threshold. **Rev. 1.1: no longer open; mandatory** per a11y audit S3. | Both the focused header and the answer area unpin when the viewport is ≤ 30 rem tall, the answer area is > 40 % of the viewport height, or the root font size is > 24 px. Mechanism in H-9. | Note only: at 375 × 667, practice mode now runs unpinned (the answer area is 45 % of the height) |
| DF-11 | Home returning state: "Start here" shown as three compact cards in a row. | Three across at 375, stacking at 200 % text | Confirm |
| DF-12 | Rev. 1.1 (a11y audit M9): the inventory's Toast example "We couldn't save just now" is a failure, which must not be a transient toast. | Failures are persistent StorageNotice / InfoNote next to what failed; toasts only confirm visible outcomes | Update the inventory's Toast row and the errors-and-recovery catalogue (E17 and similar) |
| DF-13 | Rev. 1.1: unpinning on short screens means the primary action can sit below the fold in landscape. | It's the last element, reached by one scroll, and never moves afterwards | Confirm this is acceptable for UXD-08 ("never moves") |

## Decisions needed from the owner

1. **Name:** A *Samtale* (recommended), B *هم‌صدا*, or C descriptive ([identity.md](identity.md)).
2. **Primary colour direction:** 1 Fjord (recommended), 2 Lapis and saffron, 3 Nordic plain.
3. **Situation visuals:** confirm typography-only cards with a theme icon for v1 (option a; no cost).
4. Still open from UX and shown as placeholders: UX-OQ-19 (sample-answer label), UX-OQ-20 (differs display), UX-OQ-21 (report channel), UX-OQ-25 (nurse-specific toolbox label).

## Owner decisions, confirmed by delegation (2026-11-20)

The owner delegated these decisions ("confirm on behalf of me"). They can be revisited.

| Decision | Choice |
|---|---|
| **Name** | **A, *Samtale*** (working name until launch; check availability and the domain before buying it) |
| **Visual direction** | **1, Fjord** |
| **Situation visuals in v1** | **Typography-only cards with a theme icon** (no cost). Illustrations are for later. |

**Applied handoffs:**
- **H-1:** skip-link class, and `tabIndex={-1}` on `<main>`.
- **H-2:** Atkinson Hyperlegible Next, `latin` subset.
- **H-8:** lint and build run. The build passes, and the app code lints clean. The remaining lint errors are in `scripts/audio/`, which `speech-engineer` is still working on. The e2e tests pass, with the font assertion updated.
