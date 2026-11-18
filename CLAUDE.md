# PD3 Mundtlig: learning app

A responsive web app that helps **Persian-speaking learners** prepare for **delprøve 2 of the PD3 oral exam** (*Prøve i Dansk 3, mundtlig kommunikation*). Learners browse real past exam topics, read and listen to questions and model answers, practise speaking, and take timed mock exams.

**Status (2026-11-18):** pre-build. Agreed concept: [docs/product/concept.md](docs/product/concept.md). No app code yet.

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

| File | What it is | Rules |
|---|---|---|
| `PD3_Mundtlig_Delproeve2.pdf` | The primary content: a 116-page booklet by Shery Rahimi with about 69 delprøve 2 topics from 2013 to 2024 (Danish questions, Persian translations, key words, model answers) | **Copyrighted.** Written permission from the author is being requested. Don't commit the PDF to a public repo, and don't publish its content until permission is confirmed. The Persian text extracts **scrambled** with PDFKit (right-to-left order and Arabic presentation forms); the Danish extracts cleanly. |
| `PD3-mundtlig.md` | Verified notes on the 2026 exam rules, with sources | The source of truth for exam format, timings and terminology |

## Tech stack

Latest versions on npm as of 2026-11-18. Pin exact versions when scaffolding, and check again then.

| Concern | Choice | Latest seen |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.4.6 |
| UI | React | 19.3.x |
| Language | TypeScript, `strict` | npm latest is 7.0; use the newest version Next.js documents as supported |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens) | 4.3.x |
| i18n | next-intl | 4.15.x |
| Validation | Zod | 4.x |
| Unit and component tests | Vitest + Testing Library | 5.x |
| E2E tests | Playwright + @axe-core/playwright | 1.65.x |
| Lint and format | ESLint (flat config) + Prettier | ESLint 10 |
| Speech | Azure AI Speech | SDK 1.53.x |

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

The app isn't scaffolded yet. Once these exist, list them here: `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `content:validate`, `audio:generate`.

**Scaffolding:** `create-next-app` refuses a non-empty folder like this one. Scaffold into a temporary folder, move the result in, and reconcile `.gitignore`.

## Git

This isn't a git repository yet. Once it is:
- Use Conventional Commits.
- Never commit `.env*` files (except `.env.example`), the source PDF, raw extraction output or user data.
