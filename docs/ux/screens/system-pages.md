# Screen: System pages (not found, page error, offline, "couldn't be kept")

| | |
|---|---|
| **Routes** | Not-found (any unknown route or unpublished ID, HTTP 404); page error boundary (any route); the mock exam "couldn't be kept" view (on `/fa/mock/practice` or `/fa/mock/exam`) |
| **Stories** | US-011 #6, US-038 #4, US-061, US-062, GA-9, US-060 #3 |
| **Flows** | [errors-and-recovery](../flows/errors-and-recovery.md) |
| **Milestone** | M1 (not found, error), M2 ("couldn't be kept") |

## Purpose

Never leave the learner on a blank or technical screen. Say what happened in calm Persian and offer one clear next step (GA-9).

## Content hierarchy

| Page | `h1` | Body | Primary | Secondary |
|---|---|---|---|---|
| **Not found** | "We couldn't find this page" | "The link may be old, or this topic isn't available yet." | Browse topics | Home |
| **Page error** (E1) | "This page didn't load" | "Check your connection and try again." | Try again | Home |
| **Offline** (navigation failed while offline) | Same as page error | "You seem to be offline. Pages you already opened may still work." | Try again | Home |
| **Couldn't be kept** (E11) | "Your last mock exam couldn't be kept" | "It stopped when the page reloaded. Nothing was saved, and the microphone is off." | Start a new mock exam | Mock exam page |

All keep the normal app chrome (header, tab bar), except "couldn't be kept", which keeps the mock's route chrome without focused mode.

## Components

ErrorState (illustration-free: icon + text), Button, Link.

## States

These pages are themselves states. Microphone and storage aren't relevant, except that "couldn't be kept" must not request the microphone or play audio.

## Responsive behaviour

Centred single column at all widths; primary button full width on phones, in the thumb zone.

## RTL and bidi

No Danish except possibly an echoed topic ID in not-found ("`2016-nov-x`"), which is an LTR isolate. No directional icons.

## Accessibility

- Focus moves to the `h1` on arrival; the page title says the same (US-060 #3). **Confirmed (rev. 2.2, a11y m1–m2):** the 404 and error pages use the standard title template `{page title} · {app name}` (IA §4.4), with a `document.title` that describes the error; this spec is unchanged, and the code is being fixed to match.
- Not-found returns HTTP 404 (so it isn't indexed as content).
- No live regions; no auto-redirects or countdowns.

## Copy needs

| Key | Intended meaning |
|---|---|
| `errors.notFound.title` / `.body` / `.topics` / `.home` | We couldn't find this page · The link may be old, or this topic isn't available yet. · Browse topics · Home |
| `errors.page.title` / `.body` / `.retry` | This page didn't load · Check your connection and try again. · Try again |
| `errors.offline.body` | You seem to be offline. Pages you already opened may still work. |
| `mock.lost.title` / `.body` / `.new` / `.back` | Your last mock exam couldn't be kept · It stopped when the page reloaded. Nothing was saved, and the microphone is off. · Start a new mock exam · Mock exam page |

## Wireframe

**375 px, not found**
```
┌─────────────────────────────────────┐
│ [≡]                        App name │
├─────────────────────────────────────┤
│                                     │
│                 (icon)              │
│        We couldn't find this page   │ h1
│   The link may be old, or this topic│
│            isn't available yet.     │
│ ┌─────────────────────────────────┐ │
│ │          Browse topics          │ │
│ └─────────────────────────────────┘ │
│                              Home › │
├─────────────────────────────────────┤
│ Guide Templates [Mock] Topics Home  │
└─────────────────────────────────────┘
```
