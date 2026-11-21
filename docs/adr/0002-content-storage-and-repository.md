# ADR-0002: Content storage, the published read model and the repository

| | |
|---|---|
| **Status** | Accepted (2026-11-19) |
| **Deciders** | `software-architect`; schema details with `content-engineer` |
| **Related** | CLAUDE.md rules 1–4, `.claude/rules/content-data.md`, [schema-proposal.md](../content/schema-proposal.md), [pilot-report.md](../content/pilot-report.md) §6, ADR-0003 (pipeline toolchain), ADR-0005 (rendering), ADR-0006 (audio), PRD D-11, D-16 to D-21, US-064, US-068 |

## Context

- The pilot produced the **authoring files**: `content/topics/2024-maj-{a,b,c}.json`, `themes.json`, `terms.json`, `examiner-lines.json`, `review-ledger.json` and `content/internal/margin-notes.json` (schemaVersion 0).
- The authoring files mix what learners may see with what they must never see:
  - topic files carry `review.notes` (internal reviewer text), `siriCheck.siriParts`, provenance and review status
  - margin notes are internal; one (`2024-maj-b.note1`) names a confidential 2026 exam (review B1)
  - the review ledger and the review pages are internal
- **D-21:** no margin note text is public in v1. 🔁/🔗 notes may become structured links between topics, in our own wording.
- **D-18:** situation cards show the booklet's situation title for all topics. **D-19:** no Persian translation of answers. **D-20:** the 7 personal examples are shown to everyone, labelled.
- US-064: a production build contains only `approved` topics; the build fails if a published topic lacks verification records or approved intros for both situations.
- The repository interface must survive a move to a database (CLAUDE.md rule 1).
- Content is Danish and Persian text, about 51 topics × ~13 KB of authoring JSON (~660 KB), so size is not a concern.

## Options considered

| Option | Gain | Give up |
|---|---|---|
| A. The repository imports `content/**/*.json` directly and filters at runtime | No build step | Internal fields (review notes, SIRI parts, ledger notes) are bundled into server chunks and are one careless prop away from the client. Filtering logic runs on every render. The read path depends on the authoring shape, so every authoring change ripples into the UI. |
| **B. A `content:build` step projects the authoring files into a *published read model* (`src/generated/content/`, gitignored); the repository reads only that** | Internal data never enters the app's module graph. The read model is shaped for the UI and for a future database table layout. The publish policy (approved only, gates) runs once, at build time, and fails loudly. | One more generated artefact and one more script; `dev`/`build` must run it first (`predev`/`prebuild`). |
| C. Load content into a database now (SQLite/Postgres) | Rehearses the future | Infrastructure and cost for 51 static topics; no requirement needs it in v1 |

## Decision

**Option B.** Two models, one projection, one repository.

### 1. Authoring model (`content/`, owned by `content-engineer`)

- Zod schema in `src/lib/content/schema/authoring.ts`, replacing `scripts/content/lib/types.ts` (ADR-0003). Types are `z.infer`.
- One file per topic stays (OQ-A4). `schemaVersion` goes from 0 to **1** when the Zod schema lands (per the schema proposal §1).
- New public authoring file **`content/topic-links.json`** (proposed for `content-engineer`): structured links between topics derived from the 🔁/🔗 notes and the booklet's similar-questions table, **IDs and sections only, no booklet text** (D-21). It replaces any need for the read-model build to open `content/internal/`.
- New append-only **`content/published-ids.json`** (proposed): every ID that has ever been published. `content:validate` fails if a published ID disappears without being marked retired, or a retired ID comes back. This makes "IDs are permanent" machine-checked, which audio, progress records and shared URLs depend on.

### 2. Published read model (`src/generated/content/`, written by `content:build`)

- Schema in `src/lib/content/schema/published.ts`, separate from the authoring schema, with **strict objects** (unknown keys rejected).
- The projection is an **allow-list**: each field is copied on purpose. Nothing is "deleted".

| Included | Excluded |
|---|---|
| Topic: id, term (year, session), letter, theme/sub-theme, title `da`+`fa`, format era (pre-2023 label, US-009), source pages (for the credit, US-011 #7) | `review` (status and notes), the ledger, `contentHash`, pipeline provenance (`line`), raw `siriCheck.siriParts` |
| Situations: key, **booklet title `da`+`fa`** (D-18), intro `{ text.da, origin: "siri" \| "app", sourceLabel }` | SIRI picture captions (D-18) |
| Questions and suggested follow-ups: text `da`+`fa`, verification status, source term, check date and source display details. `alternative.da` is included for `differs` only (US-068 #4). | Third-party URLs and alternate wording for other statuses |
| Key words (`da`+`fa`, emoji), model answers and follow-up answers **`da` only** (D-19) with emphasis ranges | any answer translation (none exists) |
| Personal examples: label `fa` as printed, text `da`, `perspective: "nurse"` so the UI can add the D-20 label from messages | – |
| Examiner lines: text, origin, placeholders | review notes |
| Topic links: `{ fromSection, toTopicId, toSection, kind: "similar" \| "related" }`, filtered to published topics | **all margin-note text, of every kind** (D-21) |
| Audio refs per item: `{ url, durationMs, words? }` joined from `audio/manifest.json` (ADR-0006) | the manifest itself, unreferenced clips |
| A search index (normalised `da`/`fa` text of names, situation titles, questions, follow-ups, key words; IA §9) | – |

- **Release channels**, from the `CONTENT_RELEASE` build variable (ADR-0010):
  - `production`: only topics with review status `approved`. The build **fails** if a published topic lacks a verification record on any question, an approved intro for both situations, or audio for any item (US-064 #9), or if any output string trips the confidentiality rule. A term with fewer than three published topics is still listed; the draw excludes it (US-028 #5).
  - `preview`: every topic from `extracted` upwards, each marked `draft: true` so the UI shows a "not reviewed yet" banner. Used locally, in CI and on protected preview deployments only.
- **Output is deterministic** (stable key order, 2-space JSON, trailing newline) so two builds of the same commit are byte-identical (ADR-0003).
- **Verification allow-list extension (2026-11-21).** The study page shows the SIRI comparison beside the primary booklet text and identifies the source. The projection joins the Danish parts with spaces only for `differs`. For checked records with source display metadata, `sourceDisplay` includes the title, pages and availability. A third-party copy carries its source note. An official source carries the HTTPS URL from its official transcription registry entry. The leak scan includes this prose and official URL for topics published in the selected channel.

### 3. Repository (`src/lib/content/`), the only way the app reads content

```ts
// src/lib/content/repository.ts — server-only, async, storage-agnostic
listThemes(): Promise<ThemeSummary[]>                      // with published topic counts (US-005 #1)
getTheme(id: ThemeId): Promise<Theme | null>
listTerms(): Promise<TermSummary[]>
listTopics(filter?: { themeId?: ThemeId; termId?: TermId }): Promise<TopicSummary[]>  // newest term first
getTopic(id: TopicId): Promise<Topic | null>               // null → notFound()
listTopicIds(): Promise<TopicId[]>                         // generateStaticParams
getExaminerLines(): Promise<ExaminerLines>
getMockDeck(): Promise<MockDeck>                           // compact data for the draw and the runner (ADR-0005)
getSearchIndex(): Promise<SearchDocument[]>
listSimilarQuestionGroups(): Promise<SimilarGroup[]>       // US-007
getContentItem(id: ContentItemId): Promise<ContentItem | null>   // shadowing (US-024)
// later, as content-engineer delivers them: getTemplates(), getToolbox(), getVocabulary(), getGuide()
```

- Implementation: `src/lib/content/source/file-source.ts` (`import "server-only"`) **statically imports** `@/generated/content/*.json`. Static imports keep the data in the server bundle, so on-demand renders (for example an unknown topic ID that ends in `notFound()`) need no file tracing.
- Functions are `async` even though the file source is synchronous, so a database source drops in without touching callers.
- Domain types returned to pages are the published read-model types. Client components receive only the props they need.

### 4. How internal data is kept out of every build (defence in depth)

1. **No path:** `src/` never imports `content/**` (lint, ADR-0001). Only `src/lib/content/source/**` may import `@/generated/**`.
2. **No read:** `scripts/content/build-read-model.ts` (`content:build`) reads only `content/topics/`, `themes.json`, `terms.json`, `examiner-lines.json`, `topic-links.json`, `audio/manifest.json` and the referenced official `scripts/content/data/siri-*.json` entries for source URLs. It never opens `content/internal/**` or `review-ledger.json` (the pipeline has already merged ledger status into topic files). A unit test asserts that the script's source doesn't mention `internal` or `review-ledger`.
3. **Allow-list projection** validated by the strict published schema.
4. **Confidentiality rule** (`scripts/content/lib/confidentiality.ts`) runs over every output string; any hit fails `content:build`.
5. **Post-build leak scan** (`scripts/ci/check-build-leaks.ts` on `scripts/ci/leak-scan.ts`). The scan searches `.next/`, `public/` and `src/generated/` for canaries taken from the authoring files. Any hit fails the build. *Amended 2026-11-21 following the independent read-model review.*
   - It runs as **`postbuild`** for `npm run build`. Next also checks the generated read-model channel against `CONTENT_RELEASE` at the start of its production build phase, including direct `next build` invocations.
   - **Canary sources.** The scanner parses every JSON file under `content/internal/` with the strict margin-notes schema. It skips the text of an explicitly public, individually approved note with no confidentiality hits. Review notes remain canaries. The review ledger, topic review notes, the keys `siriParts` and `review-ledger`, and the quoted `"needs-review"` also supply canaries. The **production** channel adds unapproved topic text and IDs. ID matching covers route paths and nested IDs such as `2024-maj-a.sitA.q1`.
   - **Public corpus.** Duplicate text is suppressed using an independent allow-list of published prose for the selected channel, including search-index text and interface messages. Generated artifacts are scan targets.
   - **Fail closed.** Missing canary sources, unreadable topic review status, invalid margin-note records, missing or empty expected build artifacts, and scans with zero text files fail the check. The expected artifacts include the Next build ID and manifests and the generated read model. `.next/cache/` and `.next/dev/` are excluded.
   - **Matching.** Long strings use 24-character windows at step 8. Short prose matches at word boundaries, with a small punctuation allow-list. A bare confidentiality year matches in exam references. The date matcher normalises Unicode dashes, separators and digits and recognises winter term variants in Danish and Persian.
   - **Encodings.** Known text extensions are scanned even when the file contains NUL bytes. The scanner searches raw text, JSON and JavaScript escapes (including `\xNN`, decoded up to twice for RSC), and HTML with entities decoded and tags and React's `<!-- -->` separators removed. Each view uses NFC and whitespace normalisation. URL encoding and Base64 are residual limitations.
   - A Vitest self-test (`scripts/ci/leak-scan.test.ts`) plants canaries in each encoding and asserts that each one is found.

### 5. Schema versioning and migrations

- **Authoring files:** `schemaVersion` per file. A breaking change bumps it, ships a one-off migration script `scripts/content/migrations/NNNN-<name>.ts` (run once, output committed), updates the Zod schema, the projection and tests in the same change. `content:validate` rejects files with an unexpected version.
- **Read model:** carries `readModelVersion` but is regenerated on every build, so it never needs data migration.
- **Browser storage** has its own versioning (ADR-0008).

### 6. Path to a database

1. Add `src/lib/content/source/db-source.ts` implementing the same internal source interface, with `"use cache"`, `cacheLife("max")` and `cacheTag("content")` on reads (Cache Components, ADR-0005). The repository signatures don't change.
2. Add `content:publish`: load the read model produced by `content:build` into the database (tables mirror the read model: `topics`, `sections`, `items`, `links`, `audio_refs`), then call `revalidateTag("content")`.
3. Authoring stays in files and the pipeline until an editing UI exists (not planned). The database is a **publish target**, not the editorial source of truth.
4. `ensureStatic = "navigation"` (ADR-0005) makes the build fail if a database read is accidentally left uncached.

## Answers to the pilot's open questions (pilot report §6, schema proposal §14)

| ID | Question | Answer |
|---|---|---|
| **OQ-A1** | Structured `ReviewNote[]` instead of `notes?: string`? | **Yes.** It lets a note point at a field and page. The read model never contains notes, so the shape is internal. `.claude/rules/content-data.md` still says `notes?: string`; the main thread should update that rule (agents don't edit configuration). |
| **OQ-A2** | Keep the review ledger separate, with `contentHash`? | **Yes.** Human decisions must survive re-extraction, and a hash-bound approval can't silently cover changed text. `content:build` never reads the ledger; it relies on the status the pipeline merged into each topic. |
| **OQ-A3** | `content/internal/` inside `content/` or at a separate root? | **Keep it inside `content/`.** The protection is that nothing on the app's path opens it (no import path, `content:build` never reads it, leak scan). Moving it would add no real protection. With D-21 the only consumer is the pipeline, which turns 🔁/🔗 notes into `content/topic-links.json`. |
| **OQ-A4** | One file per topic, or per term? | **Per topic.** Small diffs and reviews, one ID per file, maps to one row per topic later. The read model may bundle differently; that's an output concern. |
| **OQ-A5** | `TextRange` in UTF-16 code units? | **Accepted.** It matches JavaScript string indexing, which is what the UI and the word-highlighting code use. `content:validate` adds a check that no range starts or ends inside a surrogate pair. A database stores them as integers with the same meaning; this is documented in the schema. |
| **OQ-A6** | Where do pipeline inputs (`scripts/content/data/`) live once a database exists? | **Where they are, in git.** They are provenance for authoring (SIRI transcriptions with hashes, app-authored text). The database receives only the published read model (§6). |

## Consequences

- **Gain:** internal text has no route into the app; the UI codes against a clean, UI-shaped model; publishing rules run once and fail the build instead of failing a learner.
- **Gain:** the database move is an adapter plus a publish script; pages and features don't change.
- **Give up:** two schemas to maintain (authoring and published), and a generated folder that must exist before `next dev`/`next build` (handled by `predev`/`prebuild`).
- **Give up:** a production build with zero approved topics fails (static params need at least one topic, ADR-0005). Until the first topics are approved, only preview builds are deployed, which suits DL-009 anyway.
- `content-engineer` is asked for `content/topic-links.json`, `content/published-ids.json` and the Zod authoring schema (ADR-0003).
