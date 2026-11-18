---
paths:
  - "**/*.test.{ts,tsx}"
  - "e2e/**"
  - "vitest.config.*"
  - "playwright.config.*"
---

# Testing

## What to test where
- **Vitest (unit):**
  - content schemas and validators
  - the content repository
  - the mock exam state machine
  - formatters (digits, durations)
  - storage adapters and their migrations
  - the audio manifest lookup
- **Testing Library (components):**
  - query by role and accessible name, the way users find things
  - load the real `fa` messages in the test provider, so tests catch missing or wrong strings
- **Playwright (E2E):**
  - browse → topic → play audio
  - a full mock exam
  - progress survives a reload
  - microphone permission denied
  - audio fails to load
  - browser storage unavailable
- **Playwright projects:** mobile Chromium, mobile WebKit (for iOS Safari behaviour) and desktop Chromium, all in the `fa` locale.
- **Accessibility checks:** run `@axe-core/playwright` on each core page with WCAG 2.2 A/AA tags. A clean scan is necessary but not sufficient.

## Rules
- **Test behaviour, not implementation details.**
- **Deterministic tests:**
  - control time with `vi.useFakeTimers()` or Playwright `page.clock`
  - inject a seeded random number generator for topic draws
  - no real network calls
- **Never call Azure in tests.** Mock the speech client. Stub `HTMLMediaElement.play`, `MediaRecorder` and `getUserMedia`, or use Chromium's fake-media flags.
- **Bugs:** every fixed bug gets a regression test.
- **Coverage is a signal, not a target.** Aim for full coverage of `src/lib/` logic and the state machine.
- **Artifacts:** test output and screenshots go to gitignored folders (`test-results/`, `playwright-report/`).
