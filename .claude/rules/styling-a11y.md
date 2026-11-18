---
paths:
  - "src/**/*.{tsx,css}"
---

# Styling and accessibility

## Styling (Tailwind CSS v4)
- **Tokens:** design tokens live in one global stylesheet using `@theme`. Use semantic names (`--color-surface`, `--color-text-muted`, `--color-accent`). Components never use raw hex values or arbitrary one-off sizes.
- **Primitives:** build them in `src/components/ui` on an accessible headless library chosen by ADR. Don't hand-roll dialogs, menus, tabs, popovers or sliders.
- **Variants** use a consistent API across components (e.g. `variant`, `size`).
- **Mobile first.** No horizontal scrolling at 320 px.
- **Dark mode** is driven by tokens, not by per-component overrides.

## Accessibility (WCAG 2.2 AA minimum)
- **Contrast:** 4.5:1 for body text, 3:1 for large text and UI parts. Check both light and dark themes.
- **Focus:** a visible `:focus-visible` style, never removed. Focus must not be hidden behind sticky bars (2.4.11).
- **Target size:** at least 44×44 px on touch (beyond the 24 px minimum in 2.5.8).
- **Structure:**
  - semantic landmarks
  - one `<h1>` per page and headings in order
  - a skip link
  - route changes move focus or announce the new page
- **Language of parts (3.1.2):** Danish content always has `lang="da"`.
- **Timing (2.2.1):** practice mode lets users pause or extend timers. The strict mock exam is an essential time limit, but it must say so up front and offer a practice alternative.
- **Status updates** (timer milestones, "recording started", errors) go through a polite live region, and sparingly. Don't announce every second.
- **Colour alone never carries meaning:** add an icon, a text label or a pattern.
- **Motion:** respect `prefers-reduced-motion`. Animations are short (150–250 ms) and never essential.
- **Audio** always has its text shown (1.2.1). Media controls are keyboard-operable and labelled.
- **Zoom:** layouts survive 200% text zoom and text-spacing overrides (1.4.12).
