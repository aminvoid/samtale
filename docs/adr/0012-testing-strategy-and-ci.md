# ADR-0012: Testing strategy and the CI pipeline

| | |
|---|---|
| **Status** | Accepted (2026-11-19) |
| **Deciders** | `software-architect`, with `qa-engineer` |
| **Related** | `.claude/rules/testing.md`, CLAUDE.md "Definition of done", GA-1 to GA-14, US-060, US-061, US-064; ADR-0002, ADR-0003, ADR-0004, ADR-0007, ADR-0011, ADR-0014 |

## Context

- The rules already fix the tools (Vitest + Testing Library, Playwright + `@axe-core/playwright`) and what to test where. This ADR decides configuration, the CI jobs and gates, and the project-specific checks (content gates, leak scan, bidi, budgets).
- Next.js docs: Vitest doesn't support `async` Server Components; test them end-to-end.
- The repository is private (D-23) and hosted on GitHub (assumed); CI must not need any secret.

## Options considered

| Concern | Options | Chosen | Why / give up |
|---|---|---|---|
| CI service | GitHub Actions · Vercel build only · other CI | **GitHub Actions** | Free minutes for private repos cover this project; Vercel builds don't run tests. Gives up: one more YAML file to maintain. |
| Unit test DOM | jsdom 31 · happy-dom 21 | **jsdom** | The Next.js guide's default, closest to browsers; slower than happy-dom (irrelevant at this size) |
| Path aliases in Vitest | `vite-tsconfig-paths` · Vite 8's built-in `resolve.tsconfigPaths` | **built-in** | One fewer dependency (Vitest 5 runs on Vite 8.3) |
| Property tests for the machine invariants | hand-rolled random sequences · `fast-check` 4.10.3 | **fast-check** (MIT, dev-only) | Shrinking gives minimal failing event sequences; no bundle cost |
| IndexedDB in unit tests | mocks · `fake-indexeddb` 6.2.8 | **fake-indexeddb** | Real IndexedDB semantics for migrations |
| E2E against | `next dev` · production build (`next start`) | **production build** | Tests what ships (static output, headers, proxy) |
| Visual regression | `toHaveScreenshot` gating · screenshots as evidence | **evidence only** (for now) | Font rendering differs between machines; gating screenshots would be flaky. QA attaches RTL screenshots at 375/1280 px. |

## Decision

### 1. Test layers

| Layer | Tool | Covers |
|---|---|---|
| Content | Vitest + scripts | Zod authoring schema; `content:validate` rules (shape, IDs, references, scripts, origins, publishing gates, confidentiality, ID registry); the read-model projection allow-list; **a test that `build-read-model.ts` never references `content/internal` or the ledger**; determinism of `content:build` |
| Pure logic | Vitest | content repository (against a small fixture read model); mock exam `transition`/`nextDeadline`/script/draw, with **property tests for invariants I1–I13** and the UX spec's §17 scenarios; spaced-review and progress derivations; formatters (`formatClock`, digits, years, calendar); `getDirection`; audio manifest lookup and staleness; security header builder; env schema |
| Storage | Vitest + fake-indexeddb | `IndexedDBProgressStore` and `RecordingStore`: every migration from every earlier version, corrupted records skipped, quota errors, unavailable storage → memory store |
| Messages | Vitest | every `messages/*.json` has exactly `fa.json`'s keys and ICU arguments; no bare `#` in plurals (ADR-0004); Latin runs in `fa` messages are inside `<da>`/`<ltr>` tags (allow-list for `metadata.*`); no Arabic ي/ك or presentation forms; no failure words from US-067 #3 (`persian-localization-reviewer` maintains the list) |
| Components | Vitest + Testing Library + user-event | interactive client components with the **real `fa` messages** in a test provider (`renderWithIntl`): audio controls, disclosure toggles, recorder UI with a stubbed `MediaRecorder`, the mock runner with fake ports and a fake clock; query by role and accessible name |
| End to end | Playwright | journeys below, on three projects |
| Accessibility | `@axe-core/playwright` | each core page and each mock step, tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` |
| Manual | QA on real devices | real iPhone (Safari) and a low-end Android phone for the mock exam and recording (PRD §4.4); VoiceOver and TalkBack journeys (US-060 #7) |

### 2. Playwright configuration

- Projects, all with `locale: "fa-IR"` and `timezoneId: "Europe/Copenhagen"`:
  - `mobile-chromium` (Pixel 7)
  - `mobile-webkit` (iPhone 15; stands in for iOS Safari behaviour, not a replacement for a real iPhone)
  - `desktop-chromium` (1280 × 800)
- Chromium launch flags `--use-fake-ui-for-media-stream` and `--use-fake-device-for-media-stream`; WebKit gets `getUserMedia`/`MediaRecorder` stubs through `addInitScript` where needed.
- Time is controlled with `page.clock`; the mock's seed is injected through a test-only query parameter that **only works in the preview channel**, never in production builds.
- `webServer`: `next start` on a fixed port against the build made earlier in the job.
- Core journeys (from the testing rule and the stories): browse → topic → play audio; a full practice mock and a full exam-conditions mock (including the 270 s limit and grace period with `page.clock`); progress survives a reload; microphone denied; audio fails to load (route the clip to a 500); storage unavailable (IndexedDB blocked by an init script); interruption (`visibilitychange`); leave dialog; no recording ever sent (network assertion); CSP violation listener and header checks (ADR-0011); `html[dir=rtl][lang=fa]` and `[lang=da][dir=ltr]` on Danish blocks; **no Latin-letter accessible names outside `lang="da"`** (catches a forgotten library default, ADR-0009).
- E2E content: the real pilot topics (`2024-maj-a/b/c`) in the `preview` channel. Their IDs are permanent, so tests can name them.

### 3. Coverage

A signal, not a gate, except: `src/lib/**` and `src/features/mock-exam/machine/**` must keep **≥ 90 % line and branch coverage** (enforced with Vitest thresholds on those paths only).

### 4. CI pipeline (`.github/workflows/ci.yml`)

Triggered on pull requests and pushes to `main`. Node from `.nvmrc`, `npm ci` with the npm cache. No secrets.

| Job | Steps | Blocks merge |
|---|---|---|
| **verify** | `npm run format:check` → `npm run lint` → `npm run typecheck` (`next typegen && tsc --noEmit`) → `npm run content:validate` → `npm run content:check` → **determinism**: `npm run content:extract` then `git diff --exit-code -- content docs/content/review` → `npm test -- --coverage` | yes |
| **build-preview-e2e** (needs verify) | `CONTENT_RELEASE=preview npm run build` (runs `content:build` first and the leak scan as `postbuild`) → `npx playwright install --with-deps chromium webkit` (cached) → `npm run test:e2e` (all three projects, axe included) → `npm run check:budgets` → upload the Playwright report on failure | yes |
| **build-production** (needs verify) | `CONTENT_RELEASE=production npm run build` (the `postbuild` leak scan reads the channel and also fails on unapproved topic IDs and text) | yes. *Amended 2026-11-20 (code review S2):* blocking now, while it passes; when `content:build` starts refusing zero approved topics, gate the job with an explicit `if:` in that change instead of `continue-on-error` |
| **audit** (weekly schedule and on `package-lock.json` changes; `.github/workflows/audit.yml`) | `npm audit --omit=dev --audit-level=high` | informational |

- `main` is protected: the three blocking jobs must pass; Vercel deploys `main` only after the checks pass (Vercel's "required checks" or GitHub's deployment protection).
- Dependabot (`.github/dependabot.yml`): weekly npm updates grouped by tool family (Next/React, lint, test), monthly GitHub Actions updates. Each update PR runs the full pipeline.
- `content:check:pdf` and `audio:generate` never run in CI (local inputs, cost).

## Consequences

- **Gain:** the project's specific risks each have an automated gate: confidential or unapproved content reaching a build (validation + leak scan), non-deterministic content (diff check), missing translations or broken bidi in messages (messages test), an app that silently turns dynamic (`ensureStatic`), CSP regressions and audio upload (E2E).
- **Give up:** CI takes several minutes per push (three Playwright projects); Playwright browsers are cached to keep it reasonable.
- **Give up:** WebKit in Playwright is not iOS Safari. Real-device checks stay manual and are part of the M2 exit criteria.
