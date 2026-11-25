# PD3 Mundtlig: learning app

A responsive web app that helps **Persian-speaking learners** prepare for **delprøve 2 of the PD3 oral exam** (*Prøve i Dansk 3, mundtlig kommunikation*). Learners browse real past exam topics, read and listen to questions and model answers, practise speaking, and take timed mock exams.

**Status (2026-11-22):** in build. Done: content (51 topics, 49 approved), audio, topic library, topic study page, exam guide, mock exam runtime. In progress: mock exam screens. Agreed concept: [docs/product/concept.md](docs/product/concept.md).

## Decisions already made (don't reopen these without the user)

- **Audience:** the Persian-speaking PD3 community. The app will be public.
- **Interface language:** Persian (`fa`, right-to-left) first, i18n-ready so more languages (e.g. `en`) can be added without code changes.
- **No AI/LLM features for now.** The only external service is **Azure AI Speech**.
- **Responsive, phone first.** Offline support is not required.
- **No accounts in v1.** Progress is stored in the browser **behind an interface**, so a database can replace it later.
- **Content** is extracted from the source PDF into **versioned data files** and read only through a **data-access layer**, so moving it to a database later is a swap, not a rewrite.
- **Delprøve 1** (prepared presentation) comes later. Design so it can be added.
- **Framework:** latest stable **Next.js** (App Router).
- **No deadline.** Quality over speed.

## Source materials

All in `docs/resources/`.

| File | What it is | Rules |
|---|---|---|
| `PD3_Mundtlig_Delproeve2.md` | **The primary content source.** The owner's Markdown extraction of the booklet by Shery Rahimi: 51 topics from 2016–2024 (17 terms × A/B/C, each with an anchor such as `<a id="t-N16C">`), 18 older topics (2004–2015) in an appendix, the answer templates, the toolbox, the repeated-questions table and the word list. Clean Unicode: Persian is NFC, uses ZWNJ, and has no presentation forms or Arabic ي/ك. | **Copyrighted.** The author's written permission was obtained by the owner on 2026-11-21. It covers the app's use of the booklet; its exact scope follows the checklist in PRD §11 (D-12). Don't publish beyond that scope, and ask the owner if in doubt. Parse this file, not the PDF. Treat it as faithful to the PDF, but report any mismatch you find. |
| `PD3_Mundtlig_Delproeve2.pdf` | The original 116-page PDF the Markdown was made from | Use it only to cross-check the Markdown, using its `## n / 116` page markers. Don't parse it again. **Copyrighted**, same rules. |
| `ABOUT_PD3_MUNDTLIG.md` | Verified notes on the 2026 exam rules, with sources | The source of truth for exam format, timings and terminology |

## Tech stack

Versions were chosen in [ADR-0001](docs/adr/0001-project-structure-and-module-boundaries.md), checked on 2026-11-19, and are pinned exactly. The full list is in [docs/scaffold-plan.md](docs/scaffold-plan.md). The architecture overview is [docs/architecture.md](docs/architecture.md), and all ADRs are listed in [docs/adr/README.md](docs/adr/README.md).

| Concern | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack, Cache Components; every route static) | 16.4.6 |
| UI | React | 19.3.x |
| Language | TypeScript, `strict` | **6.0.3**: typescript-eslint requires a version below 6.1, so 7 isn't usable yet |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens) | 4.3.x |
| UI primitives and icons | Base UI (wrapped in `src/components/ui`) and lucide-react | Base UI 1.9.0 |
| i18n | next-intl (`proxy.ts`, root params) | 4.15.1 |
| Validation | Zod | 4.x |
| Browser persistence | IndexedDB via `idb`; progress is stored as append-only events | see ADR-0008 |
| Unit and component tests | Vitest + Testing Library + fake-indexeddb + fast-check | 5.x |
| E2E tests | Playwright + @axe-core/playwright | 1.65.x |
| Lint and format | ESLint (flat config) + Prettier | **ESLint 9.39.5**: plugins in eslint-config-next don't support ESLint 10 |
| Speech | Azure AI Speech, used only by the local `audio:generate` script | SDK 1.53.x |

**Check Next.js 16 APIs** against current docs (the `next-devtools` MCP server in `.mcp.json`, or nextjs.org) before using one you aren't sure about. Next.js changed a lot in versions 15 and 16, so patterns remembered from older versions are often wrong.

## Planned structure

```
content/                  data files (source of truth), checked by Zod in CI
messages/                 interface strings per locale (fa.json; later en.json)
scripts/content/          PDF extraction, normalisation, validation
scripts/audio/            Azure TTS generation + audio manifest
src/app/[locale]/         routes only: thin pages that compose features
src/features/<feature>/   topic-library, study, mock-exam, templates, phrases, exam-guide, progress
src/components/ui/        design-system primitives (no business logic)
src/lib/content/          schemas, types, repository (the only way to read content)
src/lib/progress/         ProgressStore interface + browser implementation
src/lib/audio/            manifest lookup, playback hooks
src/lib/env.ts            validated environment variables
src/i18n/                 next-intl routing and request config
e2e/                      Playwright tests
docs/                     product, ux, design, adr, content, reviews
```

## Core engineering rules

1. **One way in to the data.** UI code and routes never import JSON from `content/` directly. They call async functions in `src/lib/content` (e.g. `getTopic(id)`, `listThemes()`). Keep those signatures async and independent of storage, so a database implementation can be dropped in.
2. **Schemas are the single source of truth.** Domain types are inferred from Zod schemas (`z.infer`). Validate content at build/CI time, environment variables at startup, and anything read from browser storage.
3. **IDs are stable.** IDs like `2016-nov-c` and `2016-nov-c.sitA.q1` never change once published. Audio files, progress records and URLs depend on them.
4. **Keep the two kinds of translation apart.** Interface strings live in `messages/<locale>.json` (next-intl). Content translations live inside content files as locale-keyed fields (`{ "da": "...", "fa": "..." }`).
5. **No hard-coded user-facing strings** in components. This includes `aria-label`, `alt`, `title` and metadata.
6. **Persistence goes behind interfaces.** `ProgressStore` is async, with a browser implementation now and a server one later. Version the storage keys, write migrations, and guard every storage access (unavailable storage, server rendering, quota).
7. **Server Components by default.** Add `"use client"` only to interactive leaf components (audio player, recorder, timers, mock exam runner).
8. **Secrets never reach the browser.** Azure keys live only in scripts and server code, never in `NEXT_PUBLIC_*`. Speech-to-text, if added, uses short-lived tokens issued by the server.
9. **The mock exam is a pure state machine** (a reducer with typed events), unit-tested separately from React. Randomness (drawing a topic) and time are injected so they can be tested.
10. **Recordings stay on the device** in v1. User audio is never uploaded.
11. **Prefer simple decisions that are easy to reverse.** Record significant ones as ADRs in `docs/adr/`.

Detailed rules for specific folders are in [.claude/rules/](.claude/rules/):
- [nextjs-react.md](.claude/rules/nextjs-react.md)
- [i18n-rtl.md](.claude/rules/i18n-rtl.md)
- [content-data.md](.claude/rules/content-data.md)
- [speech-audio.md](.claude/rules/speech-audio.md)
- [styling-a11y.md](.claude/rules/styling-a11y.md)
- [testing.md](.claude/rules/testing.md)

## Definition of done (every change)

- Type checks, lint, unit tests and the relevant e2e tests pass.
- No literal interface strings, and the `fa` messages are complete.
- Checked in RTL at 375 px and 1280 px wide. Danish text renders left-to-right correctly inside the Persian interface.
- Keyboard-operable, with visible focus and WCAG 2.2 AA contrast.
- The relevant reviewer agent has been run and its blocking findings are fixed.
- Docs and ADRs are updated if behaviour or architecture changed.

## Agents and workflow

The project's agents are in `.claude/agents/`. Several adapt ideas from [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) (MIT licence), rewritten for this project.

| Phase | Agent | Output |
|---|---|---|
| Product | `product-manager` | `docs/product/`: PRD, user stories, scope |
| Content | `content-engineer`, reviewed by `pd3-exam-expert`, `danish-language-reviewer` and `persian-localization-reviewer` | `content/`, `scripts/content/`, `docs/content/` |
| UX | `ux-architect`, then a walkthrough by `learner-persona` | `docs/ux/` |
| Visual design | `ui-designer` | `docs/design/`, design tokens |
| Architecture | `software-architect` | `docs/adr/`, `docs/architecture.md` |
| Audio | `speech-engineer` | `scripts/audio/`, `src/lib/audio/` |
| Build | `frontend-developer` | `src/`, tests |
| Review and QA | `code-reviewer`, `accessibility-auditor`, `qa-engineer` | Findings reported back; saved to `docs/reviews/` when asked |

How to work with the agents:
- **Give each agent a self-contained brief:** the goal, the files to read, where to write the output, and the acceptance criteria. Agents don't see this conversation.
- **Reviewers are read-only.** They report findings, and the main thread or a builder agent applies the fixes.
- **Run independent reviews in parallel.**
- **Ask the user first** before any decision that changes scope, costs money (Azure resources, large audio generation runs), publishes something, or touches content permission.

## Commands

The app was scaffolded on 2026-11-19 following [docs/scaffold-plan.md](docs/scaffold-plan.md). Use Node 26 (`.nvmrc`). For local settings, copy `.env.example` to `.env.local`.

**[AGENTS.md](AGENTS.md) is maintained by Next.js.** Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.

| Command | What it does |
|---|---|
| `npm run dev` | Builds the content read model (preview channel), then starts Next.js at http://localhost:3000 (redirects to `/fa`) |
| `npm run build` | `content:build`, then the production build. With `CONTENT_RELEASE=production`, only approved topics are published |
| `npm run start` | Serves the last build |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run lint` | ESLint: module boundaries, i18n and RTL rules, Tailwind tokens and logical properties, type-aware rules; no warnings allowed |
| `npm run format` / `npm run format:check` | Prettier with Tailwind class sorting |
| `npm test` | Vitest unit and component tests (`npm run test:watch` to watch) |
| `npm run test:e2e` | Playwright on mobile Chromium, mobile WebKit and desktop Chromium, with axe (builds first when run locally) |
| `npm run check:budgets` | Performance budgets (Playwright, Chromium) |
| `npm run check:leaks` | Scans the build output for internal content. Run it after `npm run build` (add `-- --production` for the production channel) |
| `npm run content:extract` | Booklet Markdown → `content/` and the review pages |
| `npm run content:validate` | Validates `content/`: schema, IDs, scripts, publishing gates, confidentiality |
| `npm run content:build` | `content/` → the published read model in `src/generated/content/`, and published audio into `public/audio/` |
| `npm run content:check` | Fidelity check against the booklet Markdown (`npm run content:check:pdf` needs the local PDFs and macOS) |
| `npm run audio:generate` | Azure TTS generation. **It costs money:** run `--dry-run` first and ask the owner |

**Tailwind logical classes:** the lint rule also enforces the vertical axis. Use `mbs-*`/`mbe-*`, `min-block-*`, `min-inline-*` and similar, not `mt-*`, `min-h-*` or `min-w-*`.

## Git

- Use Conventional Commits.
- Never commit `.env*` files (except `.env.example`), raw extraction output or user data.
- The source booklet files in `docs/resources/` are tracked. The `origin` remote (`github.com/aminvoid/samtale`) is **public**. The owner confirmed on 2026-11-25 that this is fine, because the booklet is itself published free of charge. Push only when the owner asks.
