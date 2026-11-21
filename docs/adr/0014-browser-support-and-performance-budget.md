# ADR-0014: Supported browsers and the performance budget

| | |
|---|---|
| **Status** | Accepted (2026-11-19). The minimum versions answer PRD OQ-10 and need the owner's confirmation. |
| **Deciders** | `software-architect`; owner confirms the support floor |
| **Related** | PRD OQ-10, §4.4; personas (Ahmad: older Android phone, limited data); US-061 (asks `software-architect` for a performance budget), US-062, US-063; ADR-0005, ADR-0006, ADR-0007, ADR-0012 |

## Context

- Next.js 16's own browser floor (upgrade guide): **Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+**. The framework's output isn't guaranteed below that.
- Features the app depends on: `MediaRecorder` (iOS Safari 14.3+), `audio/mp4` recording on Safari, Blobs in IndexedDB, `HTMLMediaElement.preservesPitch`, CSS logical properties and `:lang()`, `Intl.NumberFormat` with `numberingSystem`.
- All iOS browsers use WebKit, so iOS Safari's version is the floor on iPhones. Android Chrome updates through the Play Store independently of the Android version.
- Learners study on phones, often on mobile data; Ahmad uses an older Android phone (personas).

## Options considered

| Option | Gain | Give up |
|---|---|---|
| **A. Follow Next.js 16's floor: iOS/iPadOS Safari 16.4+, Chrome/Edge/Firefox 111+** | Matches what the framework supports; covers iPhone 8 / X and later (they can update to iOS 16.4 or newer) and any Android phone with a current Chrome | iPhone 7 and older (iOS 15 at most), and iPhones that were never updated past iOS 16.3, are unsupported |
| B. A lower floor with polyfills and a legacy build | A few more old devices | Next.js doesn't support it; polyfills cost every learner bytes |
| C. Latest two versions only | Simpler testing | Excludes learners who don't update often |

## Decision

**Option A.**

| Platform | Minimum | Tested by |
|---|---|---|
| iPhone / iPad (any browser) | iOS / iPadOS **16.4** | Playwright WebKit (CI) + a real iPhone (manual, M2 exit) |
| Android | Chrome **111+** on Android 8 or later (in practice: any phone that gets Chrome updates) | Playwright mobile Chromium (CI) + a real low-end Android phone (manual) |
| Desktop | Current Chrome, Edge, Firefox, Safari 16.4+ | Playwright desktop Chromium (CI); Firefox and Safari by hand before M4 |

- Below the floor the app isn't blocked, but it isn't tested. If recording isn't supported, the existing "continue without recording" path applies (US-027 #3, US-063 #4).
- Each release, `qa-engineer` checks one current and one floor-version device for the mock exam.

### Performance budget (US-061 #4)

Measured on the production build. "Transfer" is compressed bytes over the network on a cold load, excluding fonts and audio unless stated.

| Metric | Budget | How it's checked |
|---|---|---|
| JavaScript on content pages (home, guide, library, topic, templates) | **≤ 170 KB** transfer | `check:budgets` (Playwright, Chromium): sums `request.sizes()` for script responses per page; fails CI |
| JavaScript on mock exam routes (before the recorder is loaded) | ≤ 230 KB transfer | same |
| Recorder module (lazy) | ≤ 15 KB transfer | same, after triggering it |
| Mock deck payload (`getMockDeck()` props) | ≤ 60 KB transfer | same |
| Search index payload (search page) | ≤ 40 KB transfer | same |
| HTML + RSC payload of a topic page | ≤ 45 KB transfer | same |
| Fonts | ≤ 150 KB transfer in total on first visit (Vazirmatn arabic subset + the Danish face) | same |
| Audio on page load | **0 bytes**, except the mock preload after the draw (~1 MB per attempt) | E2E network assertion (US-061 #2) |
| LCP, mobile, throttled (1.6 Mbit/s down, 150 ms RTT, 4× CPU slowdown) | ≤ 2.5 s on home and topic pages | Playwright + CDP throttling on mobile Chromium; **reported, not blocking** until the numbers are stable, then blocking |
| INP | ≤ 200 ms for audio play, translation toggle, "Done" | manual on the low-end Android phone |
| CLS | ≤ 0.1 (progress widgets reserve their space, ADR-0008) | same Playwright run |

- At 320 px wide no page scrolls horizontally (US-061 #1; E2E on the mobile projects).
- If a budget fails, the fix is smaller payloads or lazier loading, not a raised budget, unless the PR explains why.

## Consequences

- **Gain:** a clear support promise that matches the framework, and budgets that protect learners on slow phones and data plans. The budgets are checked in CI rather than remembered.
- **Give up:** very old iPhones are outside the promise. The owner should confirm this floor (it's the answer to OQ-10).
- **Give up:** byte budgets need occasional review as features land; the numbers above leave room for React 19 and Next.js's runtime plus our islands.
