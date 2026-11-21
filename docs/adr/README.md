# Architecture decision records

Format: `NNNN-kebab-title.md` with **Status, Context, Options considered (at least two, with trade-offs), Decision, Consequences**. Product decisions live in [decision-log.md](../product/decision-log.md); ADRs link to them. A superseded ADR keeps its number and points to its replacement. The overview is in [architecture.md](../architecture.md), and the scaffold steps in [scaffold-plan.md](../scaffold-plan.md).

| ADR | Decision in one line | Status |
|---|---|---|
| [0001](0001-project-structure-and-module-boundaries.md) | One Next.js app with `app → features → lib` layering, enforced with `import/no-restricted-paths` and `no-restricted-imports`; Node 26, TypeScript 6.0.3, ESLint 9.39.5, exact pins | Accepted |
| [0002](0002-content-storage-and-repository.md) | `content:build` projects the authoring files into an allow-listed, gitignored read model; the async repository reads only that; internal data never has a path into the app; answers OQ-A1 to A6 | Accepted |
| [0003](0003-content-pipeline-toolchain.md) | The pipeline moves to `tsx` + shared Zod schemas; Zod validates but never writes, so output stays byte-identical; CI checks determinism | Accepted |
| [0004](0004-i18n-rtl-and-formatting.md) | next-intl 4.15 with `proxy.ts` and `next/root-params`; direction from the locale; typed messages; one config for digits and calendar; Vazirmatn + a Danish face via `next/font` | Accepted (calendar: owner to confirm) |
| [0005](0005-rendering-and-caching.md) | Cache Components + Partial Prefetching, `ensureStatic = "navigation"` on the root layout: every route static, query parameters read in client islands; React Compiler off | Accepted (review route change: UX to confirm) |
| [0006](0006-audio-pipeline-and-hosting.md) | MP3 24 kHz 48 kbit/s mono, content-hashed names, committed manifest with word timings that never ships, same-origin hosting with immutable caching | Accepted (voices and SSML: speech-engineer) |
| [0007](0007-mock-exam-machine-and-client-media.md) | Pure reducer emitting commands, injected clock and seeded PRNG; one shared `<audio>` element; lazy MediaRecorder adapter; iOS microphone strategy behind one flag | Accepted (mic strategy: OQ-9 spike) |
| [0008](0008-progress-persistence.md) | Async `ProgressStore` over IndexedDB (`idb`), append-only events with derived views, record-level migrations, a separate device-only `RecordingStore`; answers OQ-11 | Accepted |
| [0009](0009-ui-primitives-and-icons.md) | Base UI 1.9 wrapped in `src/components/ui`; lucide-react icons with explicit RTL mirroring; React Aria rejected (no Persian built-in strings) | Accepted |
| [0010](0010-hosting-environments-and-secrets.md) | Recommend Vercel Hobby with deployment protection until permission; four environments; Zod-validated env; no secrets in any deployment | **Proposed (owner decides hosting)** |
| [0011](0011-security-headers.md) | Static CSP (inline scripts allowed, everything else locked down), `microphone=(self)` and all other powerful features off, HSTS, `same-origin` referrer, noindex until launch | Accepted |
| [0012](0012-testing-strategy-and-ci.md) | Vitest + Testing Library + fake-indexeddb + fast-check; Playwright on three projects against the production build with axe; GitHub Actions with content, determinism, leak and budget gates | Accepted |
| [0013](0013-error-reporting-and-analytics.md) | No analytics and no third-party error reporting in v1; a `reportError` seam and error codes the learner can include in "report a problem" | Accepted (D-5 pending) |
| [0014](0014-browser-support-and-performance-budget.md) | Support iOS 16.4+ and Chrome/Edge/Firefox 111+ (Next.js 16's floor); byte budgets per route checked in CI; LCP ≤ 2.5 s throttled | Accepted (floor: owner to confirm) |
| [0015](0015-voices-ssml-and-generation.md) | Examiner `da-DK-JeppeNeural`, model `da-DK-ChristelNeural` (the only `da-DK` voices with word timings); real-time SDK; reading hints as plain-text substitutions (not `<sub>`, which breaks offsets); pre-generated SSML-rate clips for the C20 slower repeat | **Proposed (owner picks voices; architect for §5)** |

Speech-specific ADRs (voices, SSML and lexicon, generation method) are written by `speech-engineer` after the listening test.
