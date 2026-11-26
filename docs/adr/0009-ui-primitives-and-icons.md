# ADR-0009: UI primitives library and icon set

| | |
|---|---|
| **Status** | Accepted (2026-11-19) |
| **Deciders** | `software-architect`, with `ui-designer` (styling) and `accessibility-auditor` (verification) |
| **Related** | `.claude/rules/styling-a11y.md`, `.claude/rules/i18n-rtl.md`, GA-1 to GA-8, US-051, US-060, ADR-0001 (import confinement), ADR-0004 (direction) |

## Context

- The rules forbid hand-rolled dialogs, menus, tabs, popovers and sliders, and ask for a headless, accessible, RTL-capable library chosen by ADR.
- Needed in v1: dialog and alert dialog (leave the mock, delete my data), collapsible/disclosure (translations, hints, pacing aid), radio group / toggle group (mode choice, playback speed), switch (keep on this device, test myself), slider (audio scrubber, which **must not mirror** in RTL), tabs (library views), progress/meter, toast or status region.
- **GA-1:** no English anywhere in the interface, including accessible names.
- Phone-first, slow networks: client JavaScript matters (ADR-0014).

## Options considered

| Option | Licence, maintenance (checked 2026-11-19) | RTL | Gain | Give up |
|---|---|---|---|---|
| **A. Base UI (`@base-ui/react` 1.9.0)** | MIT; v1.0 Dec 2025, 1.9.0 Oct 2026; MUI team (authors of Radix and Floating UI) | `DirectionProvider` | Unstyled, Tailwind-friendly (`className` functions, `data-*` state attributes); covers every component we need; its few built-in English labels are ordinary props we override (for example the toast viewport's `aria-label="Notifications"`) | Younger than Radix; some components inject an inline `<style>` (needs `style-src 'unsafe-inline'`, which we have anyway, ADR-0011, or its `CSPProvider`) |
| B. React Aria Components 1.22.1 | Apache-2.0; Adobe; very active | from the `I18nProvider` locale | Best-in-class screen-reader and touch testing (`usePress`) | **Ships translated hidden strings for 34 locales and none for Persian** (checked in the `react-aria` 3.53.1 package: `ar-AE … zh-TW`, no `fa`). Hidden labels such as overlay dismiss buttons would fall back to English, breaking GA-1, and can't be overridden per element. Heavier. |
| C. Radix UI (`radix-ui` 1.8.1) | MIT; maintained, slower cadence | `Direction.Provider` | Proven, popular | Fewer components we need are first-class (no meter); slower release pace |
| D. Native elements only (`<dialog>`, `<details>`, `<input type="range">`) | – | browser | Zero JS | Violates the rule for dialogs and sliders; inconsistent focus handling and styling across iOS versions |

## Decision

**Base UI 1.9.0**, wrapped in our own primitives in `src/components/ui/`, plus **lucide-react 1.75.0** for icons and **clsx 2.1.1 + tailwind-merge 3.7.0** for class composition.

### Rules

- **Features never import `@base-ui/react` or `lucide-react` directly** (lint, ADR-0001). They use our primitives: `Button`, `IconButton`, `Dialog`, `AlertDialog`, `Disclosure`, `RadioGroup`, `ToggleGroup`, `Switch`, `Slider`, `Tabs`, `Progress`, `StatusRegion`, the individual icon components, `DanishText`, `PersianText`, `VisuallyHidden`, `SkipLink`.
- **Every accessible name comes from messages,** passed in by the caller or read from a `ui.*` namespace inside the primitive. Primitives contain no business logic.
- **Variants** use one API across components (`variant`, `size`) implemented with plain lookup objects and `cn()` (`clsx` + `tailwind-merge`). No variant library (class-variance-authority hasn't been released since 2024; `tailwind-variants` isn't needed for a dozen components).
- **Direction:** `DirectionProvider` in the root layout gets `getDirection(locale)`. The **audio scrubber** wraps its `Slider` in a local LTR direction context and `dir="ltr"`, because media progress never mirrors (`.claude/rules/i18n-rtl.md`); its `aria-valuetext` is the formatted time from messages.
- **Touch targets** ≥ 44 × 44 px and visible `:focus-visible` styles are part of each primitive, so features can't forget them.
- **Native first** where the rule allows: `<button>`, `<a>`, headings, lists. Base UI's `render` prop keeps the right element. `Button` is a plain `<button>`: Base UI added nothing it needs beyond staying focusable while unavailable or loading, which it does with `aria-disabled` and a refused click (ADR-0014, 2026-11-26).
- **Server-safe primitives stay free of client imports.** A variant that needs state lives in its own component (`DismissibleInfoNote`, `CollapsibleInfoNote`), so static uses don't ship it (ADR-0014).

### Icons: lucide-react 1.75.0

| Option | Gain | Give up |
|---|---|---|
| **lucide-react** | ISC; updated 2026-11-18; one consistent stroke style; per-icon ES modules (tree-shaken, ~0.5–1 KB each) | General-purpose set; theme icons may need custom SVGs later |
| Tabler Icons 3.52.0 | MIT, active, large set | Heavier style; overlaps lucide |
| Phosphor 2.1.10 | MIT | No release since May 2025 |

- Import individual components by name from `src/components/ui/icon.tsx` (for example, `IconChevronRight` or `IconPlay`). This lets the bundler drop unused glyphs from each client island (ADR-0014). Pass rendered elements to controls such as `Button`, `IconButton` and `Disclosure`, including across the Server Component boundary. Keep data-driven icon maps in the feature or primitive that uses them, with entries limited to the glyphs it renders.
- The shared icon rendering is decorative by default. A supplied label gives the SVG an accessible name. Only directional glyphs (such as left and right arrows, horizontal chevrons and exit icons) mirror in RTL, with a `mirrored={false}` opt-out. Play, pause, the scrubber, clocks, checkmarks and logos keep their direction.
- Theme icons (D-4) are a decorative map from `themeId` to a glyph in `src/components/ui/theme-icon.tsx` (US-029 #7). The icon and theme-icon modules are the Lucide import boundaries. `ui-designer` may replace theme glyphs with custom SVGs.

## Consequences

- **Gain:** accessible behaviour (focus traps, Escape, ARIA wiring, keyboard support in RTL) comes from a maintained library, and every visible or hidden string is ours, in Persian.
- **Gain:** swapping the headless library later touches only `src/components/ui/`.
- **Give up:** we style every state ourselves (that's the point of headless) and must keep Base UI's defaults in mind: an e2e check (ADR-0012) fails if any accessible name outside `lang="da"` contains Latin letters, catching a forgotten default label.
- **Give up:** Base UI is younger than Radix. Its v1 has been stable for 11 months with monthly releases, which is acceptable; `accessibility-auditor` verifies the primitives with VoiceOver and TalkBack (US-060 #7).
