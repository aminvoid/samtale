# Kimi review: native Button and the InfoNote split

- **Date:** 2026-11-26
- **Reviewer:** Kimi (`kimi -p`, read-only)
- **Scope:** `Button` moved from Base UI's button to a native `<button>`; `InfoNote` split so the static note imports no client components (home JS budget, ADR-0014).

## Findings

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | Blocking | `src/components/ui/button.tsx`: only `onClick` was guarded. While loading or unavailable, a caller's `onPointerDown`, `onMouseDown`, `onKeyDown` and `onKeyUp` still ran, which Base UI had blocked. No current caller passes these, but the primitive's contract changed. | Fixed: the four handlers are skipped while the button is inert. New test in `button.test.tsx` (it fails without the guard). |

## No findings

- **InfoNote:** the standard, compact, collapsible and dismissible notes keep the same markup, classes, icon sizes and order. `info-note.tsx` reaches no client module.
- **Keyboard and forms:** Enter and Space activation and submit clicks are refused through the guarded click's `preventDefault()`.

## Result

Home JavaScript before `load`: 170.7 KB → 161.8 KB (budget 170 KB).
