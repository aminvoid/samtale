# ADR-0001: Project structure, module boundaries and toolchain

| | |
|---|---|
| **Status** | Accepted (2026-11-19) |
| **Deciders** | `software-architect` |
| **Related** | CLAUDE.md "Planned structure", `.claude/rules/nextjs-react.md`, ADR-0002, ADR-0009, ADR-0012 |

## Context

- CLAUDE.md already sketches the folders: `src/app/[locale]` (thin routes), `src/features/<feature>`, `src/components/ui`, `src/lib/{content,progress,audio}`, `src/i18n`, `scripts/`, `content/`, `messages/`, `e2e/`.
- The rules require one-way dependencies (`app → features → lib`), no feature reaching into another feature's internals, storage and vendor SDKs behind interfaces, and "enforce this with ESLint import rules once scaffolded".
- Tomorrow's changes (a database, accounts, `en`, delprøve 1, speech-to-text) must land inside existing modules rather than force a re-layout.
- The toolchain versions in CLAUDE.md were "latest seen" on 2026-11-18. Some of them don't fit together (see "Versions checked").

## Options considered

### Structure

| Option | Gain | Give up |
|---|---|---|
| **A. Single Next.js app with feature folders and a shared `lib` layer** (the CLAUDE.md sketch) | Simple; matches the agents' instructions; one `package.json`; fast builds | Boundaries are by convention plus lint, not by package manifests |
| B. npm workspaces monorepo (`apps/web`, `packages/content`, `packages/progress`) | Hard boundaries; packages could later be reused by a server | Much more config (TS project references, per-package builds, lint per package) for one app with one developer. Nothing needs to be shared outside the app today. |

### Enforcement

| Option | Gain | Give up |
|---|---|---|
| **A. `import/no-restricted-paths` + `no-restricted-imports`** (eslint-plugin-import already ships inside `eslint-config-next`) | No new dependency; zones can be generated from the feature list in a few lines | Error messages are less semantic; zones are written by hand |
| B. `eslint-plugin-boundaries` 7.4.4 (MIT, maintained) | Purpose-built "element types" and entry-point rules | Another plugin and config vocabulary for something A already covers |
| C. `dependency-cruiser` 18.8.0 in CI | Whole-graph rules, cycle detection, diagrams | A second tool and config; errors arrive in CI, not in the editor |

## Decision

**Structure A, enforced with option A.** If the zone list grows awkward, switching to `eslint-plugin-boundaries` is a lint-only change.

### Folder layout

```
content/                  authoring data (owned by content-engineer; never imported by src/)
audio/                    generated TTS: manifest.json + clips/<hash>.mp3 (ADR-0006; never imported by src/)
messages/                 fa.json (reference), later en.json
scripts/content/          extract, validate, build read model (ADR-0002, ADR-0003)
scripts/audio/            Azure TTS generation (speech-engineer)
scripts/ci/               build leak scan, budget checks
src/
  app/[locale]/           routes only: layout (root layout), pages, error/not-found; no business logic
  app/robots.ts           metadata routes outside the locale tree
  features/<feature>/     exam-guide, topic-library, study, templates, phrases, mock-exam, progress, settings
    components/ hooks/ model/   (model = pure TS: reducers, derivations)
    index.ts                    the feature's public API (what routes may import)
  components/ui/          design-system primitives on Base UI (ADR-0009); no business logic
  lib/
    content/              schema/, repository.ts (public), source/ (server-only, reads src/generated)
    progress/             ProgressStore interface, IndexedDB + memory implementations, migrations, derive.ts
    recordings/           RecordingStore (device-only, ADR-0008)
    audio/                player provider, clip types, preload, recorder/ (lazy-loaded)
    exam/                 exam config (timings, examiner line IDs; DL-039)
    format/               clock, durations, dates with the digit/calendar config (ADR-0004)
    env/                  schema.ts (pure), server.ts (server-only), public.ts
    security/             headers.ts (ADR-0011)
    observability/        reportError (ADR-0013)
    storage/              guarded sessionStorage helper (mock in-progress marker)
    utils/                cn() and other tiny helpers
  i18n/                   routing.ts, navigation.ts, request.ts, config.ts, formats.ts
  styles/tokens.css       design tokens (@theme), owned by ui-designer
  generated/              gitignored build output of `content:build` (ADR-0002)
  proxy.ts                next-intl locale proxy (ADR-0004)
e2e/                      Playwright specs
```

### Dependency rules (what may import what)

| From ↓ may import → | `app` | `features/x` | other feature | `components/ui` | `lib` | `i18n` | `generated` | `content/`, `audio/`, `scripts/` |
|---|---|---|---|---|---|---|---|---|
| `src/app/**` | yes | public `index.ts` only | – | yes | yes | yes | no | no |
| `src/features/x/**` | no | yes | public `index.ts` only, sparingly | yes | yes | yes | no | no |
| `src/components/ui/**` | no | no | no | yes | `utils`, `format` only | yes | no | no |
| `src/lib/**` | no | no | no | no | yes | `config`/`routing` only | only `lib/content/source/**` | no |
| `scripts/**` | no | no | no | no | pure modules (schemas, format, env schema) | no | writes it | yes |

Vendor packages are confined too:

| Package | Only allowed in |
|---|---|
| `@base-ui/react` | `src/components/ui/**` |
| `lucide-react` | `src/components/ui/icon.tsx` (and theme-icon map in `src/components/ui/`) |
| `idb` | `src/lib/progress/browser/**`, `src/lib/recordings/**` |
| `microsoft-cognitiveservices-speech-sdk` | `scripts/audio/**` (later also `src/lib/speech/server/**`) |
| `@/generated/**` | `src/lib/content/source/**` |

Server-only modules (`src/lib/content/**` except `schema/published.ts` types, `src/lib/env/server.ts`) start with `import "server-only"`.

### Lint rules that enforce this (in `eslint.config.mjs`, see the scaffold plan for the exact file)

- `import/no-restricted-paths` zones: `lib` cannot import `features`/`app`/`components`; `components/ui` cannot import `features`/`app`; `features` cannot import `app`; feature-to-feature zones are generated from the feature list with `except: ["./index.ts"]`.
- `no-restricted-imports`: the vendor table above; `content/**`, `audio/**`, `scripts/**`, `@/generated/**` from `src/`.
- `react/jsx-no-literals` (`noStrings: true, ignoreProps: true`) and `no-restricted-syntax` on literal `aria-label`, `aria-description`, `aria-valuetext`, `alt`, `title`, `placeholder` attributes: rule 5 of CLAUDE.md.
- `react/no-danger`: error (no `dangerouslySetInnerHTML`).
- `better-tailwindcss/enforce-logical-properties`, `no-unknown-classes`, `no-restricted-classes` (no raw palette colours or arbitrary hex values; tokens only): `.claude/rules/i18n-rtl.md` and `styling-a11y.md`.
- `typescript-eslint` strict type-checked set, plus `switch-exhaustiveness-check`, `no-floating-promises`, `consistent-type-imports`, `consistent-type-assertions` (`assertionStyle: "never"`; `as const` stays allowed), `no-non-null-assertion` (a disable comment must give the reason).

### Toolchain (pinned exactly; `.npmrc` has `save-exact=true` and `engine-strict=true`)

| Tool | Version | Why this one |
|---|---|---|
| Node.js | 26.x LTS (`.nvmrc`: `26`; `engines.node`: `"26.x"`) | Active LTS; local is v26.13.1; Vercel's default is 26.x; jsdom 31 and Vitest 5 need ≥ 22.22 / 24.15 / 26 |
| npm | 11 (bundled) | Lockfile committed, `npm ci` in CI. **Install scripts** (amended 2026-11-20, see below) |
| Module system | `"type": "module"` in `package.json` | The pilot scripts are ES modules (`import.meta.url`, `.ts` specifiers); `tsx`, Node 26's TypeScript support and `next.config.ts` then all load files as ESM |
| TypeScript | **6.0.3**, not 7.0.2 | `typescript-eslint` 8.73.0 requires `typescript <6.1.0`, so TS 7 would break type-aware linting. Next.js 16.4 supports TS 6 (and TS 7 only through its new CLI checker). TS 6 changes defaults (`strict` on, **`types` defaults to `[]`**), so `tsconfig` sets `"types": ["node"]` explicitly. Move to 7 when typescript-eslint supports it. |
| ESLint | **9.39.5**, not 10.15.0 | `create-next-app@16.4.6` itself installs `eslint ^9`. Next's docs say `eslint-config-next` 16.4 works with ESLint 10, but `eslint-plugin-react` 7.37.5, `eslint-plugin-jsx-a11y` 6.10.2 and `eslint-plugin-import` 2.32.0 (all inside it) declare `eslint ≤ 9`, so npm fails with ERESOLVE without overrides. ESLint is dev-only; upgrading is a one-line change once those plugins declare 10. |
| Prettier | 3.10.1 + `prettier-plugin-tailwindcss` 0.8.1 | Class sorting; ESLint does correctness only |
| React Compiler | **off** | See ADR-0005 |

**Install-script policy (amended 2026-11-20, code review S10).** npm 11.20's `allowScripts` is advisory by default (scripts still run), so `.npmrc` sets `strict-allow-scripts=true`: a dependency with an install script that isn't listed in `package.json` `allowScripts` fails `npm ci`. Current entries:

| Package | Decision | Why |
|---|---|---|
| `esbuild@0.28.2` (via `tsx`, `vite`) | allowed, pinned to the version | The postinstall only checks and optimises the native binary |
| `@swc/core` (via `next-intl`) | denied | The postinstall only falls back to `@swc/wasm` if the native binding fails; the platform binding is an optional dependency. Used by next-intl's message extraction, which we don't use |
| `@parcel/watcher` (via `next-intl`) | denied | Builds from source only when no prebuilt binary exists; prebuilt Linux and macOS binaries are optional dependencies |
| `fsevents` (macOS only, optional, via `tsx`) | denied | Its `package.json` has no install script and it ships a prebuilt `fsevents.node`; npm flags it only because the registry metadata marks an implicit `node-gyp` build. Not installed on Linux (CI, Vercel) |

Risk: a platform without prebuilt binaries (musl/Alpine, unusual CPUs) would break; CI and Vercel aren't such platforms. A new dependency with an install script needs a reviewed `npm approve-scripts <pkg>` (pinned) or `npm deny-scripts <pkg>`.

## Consequences

- **Gain:** one app, one manifest, clear layering, and violations show up in the editor. Swapping a storage or vendor adapter touches one folder.
- **Give up:** boundaries are lint-enforced, so a determined `eslint-disable` can break them; the code reviewer must reject undocumented disables.
- Feature-to-feature imports go through `index.ts`. If two features keep needing each other, the shared part moves to `lib` or `components`.
- TS 6 and ESLint 9 are deliberate one-step-behind choices; each has a named trigger for upgrading (typescript-eslint support; plugin peer ranges).
- `.ts` import specifiers are needed where Node loads TS directly (`next.config.ts` on Node 26, `scripts/`), so `tsconfig` sets `allowImportingTsExtensions: true` (allowed because `noEmit` is on).

## Versions checked (npm registry, 2026-11-19)

next 16.4.6 · react / react-dom 19.3.1 · @types/react / @types/react-dom 19.3.0 · typescript 7.0.2 latest, **6.0.3 chosen** · @types/node 26.6.6 · next-intl 4.15.1 · zod 4.6.7 · tailwindcss / @tailwindcss/turbopack / @tailwindcss/postcss 4.3.5 · eslint 10.15.0 latest, **9.39.5 chosen** · @eslint/js 9.39.5 · eslint-config-next 16.4.6 · typescript-eslint 8.73.0 (peer `typescript >=4.8.4 <6.1.0`) · eslint-config-prettier 10.1.8 · eslint-plugin-better-tailwindcss 4.11.0 · prettier 3.10.1 · prettier-plugin-tailwindcss 0.8.1 · vitest / @vitest/coverage-v8 5.1.1 · vite 8.3.8 · @vitejs/plugin-react 6.3.0 · jsdom 31.0.1 · @testing-library/react 16.3.3 · @testing-library/dom 10.4.2 · @testing-library/user-event 14.6.13 · @testing-library/jest-dom 8.0.0 · fake-indexeddb 6.2.8 · fast-check 4.10.3 · @playwright/test 1.65.1 · @axe-core/playwright 4.14.0 · tsx 4.23.15 · @base-ui/react 1.9.0 · lucide-react 1.75.0 · idb 8.0.4 · clsx 2.1.1 · tailwind-merge 3.7.0 · server-only 0.0.1 · microsoft-cognitiveservices-speech-sdk 1.53.0 · create-next-app 16.4.6.

Docs read: the Next.js 16.4.6 docs bundled in the `next` tarball (`dist/docs/`: TypeScript, ESLint, upgrading to v16, CSP, Cache Components, `ensureStatic`, proxy, static exports, deploying, Vitest, Playwright, fonts); next-intl docs (routing setup, TypeScript, "Next.js root params" post of 2026-08-04); Tailwind CSS v4.3 Next.js guide; Vite 8.3 `resolve.tsconfigPaths`; Vercel plan, limits and Node.js version pages.
