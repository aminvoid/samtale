# ADR-0003: Moving the content pipeline onto the app toolchain

| | |
|---|---|
| **Status** | Accepted (2026-11-19) |
| **Deciders** | `software-architect`, with `content-engineer` (owner of `scripts/content/`) |
| **Related** | [pipeline.md](../content/pipeline.md), `.claude/rules/content-data.md`, ADR-0001, ADR-0002, ADR-0012 |

## Context

- The pilot scripts (`scripts/content/*.ts`) run with Node's built-in type stripping: `node scripts/content/build-pilot.ts`. They have **no dependencies**, use only erasable TypeScript syntax and import siblings with explicit `.ts` extensions.
- Their types live in `scripts/content/lib/types.ts`. The rules want Zod schemas in `src/lib/content/schema.ts`, with types inferred from them, and `content:validate` in CI.
- The pipeline's most valuable property is **determinism**: re-running gives byte-identical output (verified on 14 files), and review approvals are bound to content hashes. Any toolchain change must keep that.
- `content:build` (ADR-0002) is new and must share the schemas with the app.

## Options considered

| Option | Gain | Give up |
|---|---|---|
| A. Keep plain `node` type stripping; shared schema modules must use `.ts` import specifiers and no path aliases | Zero extra dependency; consistent with the pilot | Forces an import style (`./x.ts`, no `@/`) on any `src/` module the scripts touch, and anything those modules import. Easy to break by accident. |
| **B. Run scripts with `tsx`; import Zod schemas and pure helpers from `src/lib/**`** | Scripts and app share one schema; `@/` aliases and extensionless imports work; the pilot's `.ts` specifiers keep working unchanged | One dev dependency (`tsx` 4.23.15, MIT, actively maintained, esbuild-based; no runtime footprint) |
| C. Compile scripts with `tsc` to JS before running | No loader at all | A build step for scripts; stale output risk; slower feedback |

## Decision

**Option B: `tsx` + Zod.**

### Scripts and npm commands

| npm script | Runs | Reads | Writes | In CI |
|---|---|---|---|---|
| `content:extract` | `tsx scripts/content/build-pilot.ts` (renamed `extract.ts` when it covers all 51 topics) | booklet Markdown, `scripts/content/data/`, ledger | `content/`, `docs/content/review/`, `.cache/` | **determinism check** (below) |
| `content:validate` | `tsx scripts/content/validate.ts` | `content/`, booklet Markdown (known IDs), SIRI data | stdout (errors, coverage report) | yes |
| `content:build` | `tsx scripts/content/build-read-model.ts` | public authoring files, `audio/manifest.json` (ADR-0002 §4) | `src/generated/content/`, `public/audio/` | yes (both channels) |
| `content:check` | `tsx scripts/content/check-fidelity.ts` | booklet Markdown, `content/` | stdout | yes |
| `content:check:pdf` | `check-pdf.ts`, `check-siri.ts` | `.cache/` (PDF text, macOS PDFKit) | stdout | **no** (needs local PDFs and Swift) |

### Rules that keep the output deterministic

1. **Zod validates; it doesn't write.** Files are still written by the pipeline's `toJson`/`writeJson` from the objects it builds, with explicit key order. Zod's parse output (which reorders keys to schema order and strips unknown keys) is never serialised. This is the single most important rule; it keeps every existing file byte-identical.
2. **No locale-sensitive sorting.** Sort with code-point comparison (`a < b ? -1 : a > b ? 1 : 0`), never `localeCompare` (its result depends on the ICU version).
3. **No clocks or randomness in output.** Dates in output (`checkedOn`, `reviewedOn`) come from inputs, never from `new Date()`.
4. **Pinned Node.js** (`.nvmrc` 26, `engines` 26.x) so Unicode normalisation (NFC) and JSON behaviour match between machines.
5. **Hashes over canonical JSON** only (the pilot's `contentHash` already does this).
6. **CI determinism check:** run `content:extract`, then `git diff --exit-code -- content docs/content/review`. Run `content:build` twice into two folders and compare them byte for byte.

### Migration steps (owned by `content-engineer`, before or alongside the scaffold's first content slice)

1. Add the Zod authoring schema in `src/lib/content/schema/authoring.ts`, mirroring `scripts/content/lib/types.ts` exactly. Keep `schemaVersion: 0` for this step.
2. Prove parity: `content:validate` with the Zod schema accepts exactly what the pilot validator accepts (run both over the pilot files and over the pilot's mutation fixtures).
3. Switch `scripts/content/lib/*.ts` to `import type { … } from "@/lib/content/schema/authoring"` (types via `z.infer`), delete `types.ts`.
4. Re-run `content:extract`; the diff must be empty.
5. Bump to `schemaVersion: 1` in one commit with its migration script (a version-number change only).
6. Write `content:build` (ADR-0002) and its tests.

The pure pieces the app needs at runtime (for example the Persian search normaliser, US-008) live in `src/lib/`, and the scripts import them, never the other way round (ADR-0001).

## Consequences

- **Gain:** one schema for the pipeline, the validator, the read-model build and the app; types can't drift.
- **Gain:** the pilot's fidelity and determinism guarantees carry over and are now checked in CI.
- **Give up:** the scripts are no longer runnable with a bare `node` and no install; `npm ci` is needed first. They still work with `node` alone until step 3 above, if someone needs that.
- The PDF checks stay local-only because they need the PDFs and macOS. That's acceptable: the Danish was fully verified once (1,501/1,501), and the fidelity check against the Markdown runs in CI.
