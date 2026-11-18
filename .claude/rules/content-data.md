---
paths:
  - "content/**"
  - "scripts/content/**"
  - "src/lib/content/**"
---

# Content data

## Fidelity comes first
- **Match the source exactly.** Content must say what the source booklet says. Never invent, paraphrase, "improve" or silently fix source text.
- **Corrections go alongside, not over.** Put a correction in a separate field or a review note with a reason, and keep the original.
- **Official exam questions must match the official SIRI wording.** If they differ, flag it. Don't rewrite.

## Pipeline
- **Stages:** `extract → normalise → structure → validate → human review → approved`.
- **Scripts are deterministic and idempotent.** Re-running them gives byte-identical output: stable key order, 2-space JSON, trailing newline.
- **Raw output stays out of `content/`.** Raw extraction output and page images go in a gitignored folder (e.g. `.cache/content/`).
- **Normalisation:**
  - Unicode NFC
  - Persian `ی`/`ک`
  - strip presentation forms
  - ZWNJ repair
  - trim whitespace
  - one consistent quote style
  - **never change Danish wording**
- **Document every normalisation rule** in `docs/content/pipeline.md`.

## Schema
- **Zod schemas live in `src/lib/content/schema.ts`.** TypeScript types are inferred from them.
- **Every file has a `schemaVersion`.** A breaking change bumps the version and comes with a migration script, updated repository code and tests.
- **Localised text:** `LocalizedText = { da?: string; fa?: string; en?: string }`. Document which locales each field requires.
- **Provenance and review status on every topic:**
  - `source: { pages: number[] }`
  - `review: { status: "extracted" | "needs-review" | "reviewed" | "approved", notes?: string }`

## IDs
- **Topic IDs:** `{year}-{term}-{letter}`, where `term` is `maj` or `nov`. Example: `2016-nov-c`.
- **Nested items use dots:** `2016-nov-c.sitA.q1`, `2016-nov-c.sitA.followup1`, `2016-nov-c.general.q2`.
- **IDs are permanent.** Never reuse or renumber an ID. Audio, progress and URLs depend on them.

## Validation (`content:validate`, runs in CI)
- **Structure:** schema validity, unique IDs, and references that resolve (for example, theme IDs exist).
- **Text:** no empty strings.
- **Script check:**
  - Danish fields contain no Arabic-script letters
  - `fa` fields contain Persian letters and no presentation forms or Arabic `ي`/`ك`
- **Coverage report:** count per status, per theme and per term.

## Repository (`src/lib/content`)
- **The only way the app reads content.**
- **Async functions** that return domain types and never expose file paths or storage details.
- **Caching:** memoising or `"use cache"` is fine. The interface stays the same when a database replaces the files.
