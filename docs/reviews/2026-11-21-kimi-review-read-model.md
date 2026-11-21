# Independent security review (Kimi): published content read model and leak scan

- **Reviewer:** Kimi Code CLI (`kimi -p`, read-only), 2026-11-21. Saved by the main thread.
- **Scope:** `scripts/content/build-read-model.ts`, `src/lib/content/{schema/published,repository,source/file-source,search}.ts`, `scripts/ci/leak-scan.ts` and `check-build-leaks.ts`, against ADR-0002.
- **Kimi changed no files.** The only changes during the run were Codex's concurrent state machine fixes.

• ## Summary

No blocker was found in the normal `npm run build` path. The published read model uses a genuine allow-list, production filters unapproved topics before constructing derived data, and the repository is protected by `server-only`.

The main weaknesses are in the defence-in-depth leak scanner: it can discard valid canaries, ignores short strings, and has several fail-open cases. No current generated read model exists, so I could not inspect that artifact directly.

## Blocker

None found.

## Should fix

1. **Raw, non-published authoring fields suppress leak canaries**  
   `scripts/ci/leak-scan.ts:205-212`, `scripts/ci/leak-scan.ts:225-231`

   **Leak path:** Every string outside `review` in an approved topic—or any topic in preview—is treated as legitimately public. This includes fields the read model explicitly excludes, such as `siriParts`, `sourceDisplay`, and `spoken.basis`. Matching windows from margin notes, ledger entries, review notes, or unapproved topics are then discarded.

   **Failure scenario:** An internal note repeats text from `spoken.basis`. A future regression accidentally publishes that basis text in an RSC payload. The scanner has dropped the corresponding canary and passes.

   **Fix:** Build `PublicCorpus` from explicitly allow-listed published fields, not raw topic/public authoring objects. Add a regression test where text exists only in `spoken.basis` and an internal note and must remain a canary.

2. **Short internal strings and bare future years are not detected**  
   `scripts/ci/leak-scan.ts:25-31`, `scripts/ci/leak-scan.ts:222-233`, `scripts/ci/leak-scan.ts:253-256`, `scripts/ci/leak-scan.ts:269-276`

   **Leak path:** Internal strings below 16 characters are ignored; unapproved-topic strings below 24 characters are ignored in production. Confidentiality hits below six characters, including bare `2026`, are printed and skipped by `scripts/ci/check-build-leaks.ts:24-27`.

   **Failure scenario:** A short correction reason, review note, or unapproved title reaches HTML or a client chunk. The post-build scan reports success. The ledger already contains short correction values, so this is not merely theoretical input shapes.

   **Fix:** Collect sensitive note/correction fields at every length. Use context-aware or boundary matching for short values, with an explicit benign allow-list where necessary. Detect bare years in exam-reference contexts rather than simply skipping them. Add short-note, short-correction, and short-unapproved-title tests.

3. **Internal-note visibility fails open on malformed or nested data**  
   `scripts/ci/leak-scan.ts:83-99`

   **Leak path:** Any object whose `visibility` is anything other than exactly `"internal"` is skipped in full. A typo such as `"Internal"` therefore suppresses all its canaries; a public-marked parent also suppresses nested internal children.

   **Failure scenario:** Schema drift or malformed JSON introduces an unrecognised visibility value. If that text subsequently leaks, the scan passes instead of refusing to scan.

   **Fix:** Parse internal files with `MarginNotesFileSchema`, skip only an explicitly valid public note, and throw on unknown values. Do not let a parent’s visibility silently override nested internal records. CI schema validation mitigates this today, but `postbuild` itself should fail closed.

4. **Confidentiality matching misses equivalent winter-2024 formats**  
   `scripts/content/lib/confidentiality.ts:22-30`

   **Leak path:** The winter-2024 expression recognises only `Nov-Dec` with an ASCII hyphen and a limited set of full words. Forms such as `Nov–Dec 2024` or `Nov/Dec 2024` produce no hit. If placed in an allow-listed field, they pass `scanForConfidentiality` and are written to the read model.

   **Fix:** Normalise Unicode dashes and separators before matching; cover abbreviated month forms and relevant Persian wording. Add positive and negative tests for every accepted date format. I found no such reference in the current publishable fields.

## Nit

1. **A failed production projection leaves stale preview artifacts usable outside the supported build command**  
   `scripts/content/build-read-model.ts:337`, `scripts/content/build-read-model.ts:445-475`

   **Leak path:** Validation fails before replacing existing output, so an older preview `read-model.json` and its audio remain. A subsequent direct `next build`, or a deployment that ignores the failed prebuild, could bundle those unapproved topics.

   **Failure scenario:** Preview is built, then production content building fails because there are zero approved topics; someone invokes Next directly against the stale output.

   **Fix:** Make the Next production build assert that the generated model’s channel matches `CONTENT_RELEASE`, or invalidate/remove stale published output when a production projection fails. The supported `npm run build` path already stops correctly.

2. **The scanner neither scans `src/generated/` nor rejects an empty scan**  
   `scripts/ci/leak-scan.ts:395-416`, `scripts/ci/check-build-leaks.ts:30-37`

   **Leak path:** Internal data present only in `src/generated/content/read-model.json`, but tree-shaken from `.next`, is not scanned. Separately, an existing but empty `.next` with no `public/` can produce `OK (… 0 files scanned)`.

   **Fix:** Add the generated read model to the scan roots and fail when zero files are scanned or expected build artifacts are absent.

3. **Binary classification and additional encodings can hide text**  
   `scripts/ci/leak-scan.ts:281-317`, `scripts/ci/leak-scan.ts:377-413`

   **Leak path:** A file containing NUL in its first 8192 bytes is skipped entirely. JavaScript `\xNN` escapes, URL encoding, and Base64 are not decoded.

   **Failure scenario:** Internal text occurs after an early NUL or is emitted using one of those encodings. Normal Next HTML, RSC, and chunk output is covered better than these unusual cases; there is no evidence that the current build emits them.

   **Fix:** Scan known text-like extensions regardless of NUL heuristics and add JavaScript hex decoding. Treat other encodings as documented residual limitations unless the build actually produces them.

## Verified safe

- `scripts/content/build-read-model.ts:323-379` reads only topics, themes, terms, examiner lines, topic links, and audio metadata—not `content/internal/**` or the review ledger. The import-graph test also checks transitive local imports.
- The projection explicitly picks fields. Review metadata, correction notes, `siriParts`, `sourceDisplay`, `spoken`, answer translations, and unknown fields do not enter the model. `src/lib/content/schema/published.ts` uses strict output objects.
- Production selects only `approved` topics and fails on zero approved topics at `scripts/content/build-read-model.ts:329-337`.
- Unapproved topics are removed from term membership, links, similar-group membership, search, and the mock deck. The mock deck derives only from the already-filtered model at `src/lib/content/source/file-source.ts:52-76`.
- Only referenced published audio is copied into `public/audio/`; the manifest itself and its internal metadata are not copied.
- Both `src/lib/content/repository.ts:2` and `src/lib/content/source/file-source.ts:1` import `server-only`. A runtime import from a client component should fail the build rather than silently bundle the repository.
- ESLint blocks app imports from `content/` and confines generated-content imports to `src/lib/content/source/**` at `eslint.config.mjs:35-38`, `eslint.config.mjs:53-56`, and `eslint.config.mjs:194-196`.
- Confidentiality scanning covers every output string before writing. Term and SIRI source references are capped at `2024-maj`. A targeted search found the future exam reference only in the internal margin note, not in a publishable field.
- `postbuild` is correctly wired to `npm run check:leaks`, and CI has a blocking production build with `CONTENT_RELEASE=production`.
- Targeted searches of the existing `.next/` and `public/` found none of the selected internal-note or review-ledger strings.

This was read-only: no files were changed, and no builds or tests were run.

