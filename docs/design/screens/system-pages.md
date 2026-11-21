# Visual spec: System pages

| | |
|---|---|
| **UX spec** | [../../ux/screens/system-pages.md](../../ux/screens/system-pages.md) |
| **Routes** | not-found, page error, offline, mock "couldn't be kept" |
| **Components** | ErrorState, Button, Link |

## Layout (all four, 375 and 1280)

Normal chrome (header, tab bar), except "couldn't be kept" (mock route chrome, not focused mode). Centred column `max-inline-reading`, content vertically placed at about one third from the top (not dead centre, so the primary stays reachable above the tab bar):

1. Icon: 24 px in a 64 px `bg-surface-sunken` circle, `text-text-muted`.
2. `h1` `text-h1`.
3. Body `text-body text-text-muted`, max two short sentences.
4. Primary `lg` full width on phones (`md`, content width, at 1280), `mbs-6`.
5. Secondary as a tertiary link under it.

| Page | Icon | `h1` (draft) | Primary | Secondary |
|---|---|---|---|---|
| Not found | `file-question` | «این صفحه را پیدا نکردیم» | «مرور موضوع‌ها» | «خانه» |
| Page error | `circle-alert` | «این صفحه بارگیری نشد» | «دوباره امتحان کنید» (`rotate-ccw`) | «خانه» |
| Offline | `wifi-off` | «این صفحه بارگیری نشد» | «دوباره امتحان کنید» | «خانه» |
| Couldn't be kept | `circle-pause` | «آخرین آزمون شما نگه داشته نشد» | «شروع یک آزمون تازه» | «صفحهٔ آزمون تمرینی» |

No illustrations, no "oops", no error codes in the body (an echoed topic ID in not-found is an LTR isolate in `text-caption`). Calm colours only: nothing in danger red.

## Scaffold alignment

`src/app/[locale]/not-found.tsx` and `error.tsx` currently render a plain `h1` and an underlined link/button; `frontend-developer` swaps them for ErrorState when the primitives exist. Their `max-w-prose px-4 py-8` maps to `max-inline-reading` and the page padding tokens.
