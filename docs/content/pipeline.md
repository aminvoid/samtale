# Content pipeline (pilot, schemaVersion 0)

| | |
|---|---|
| **Status** | Full pipeline (51 topics). TypeScript run with `tsx`; shapes from Zod (`src/lib/content/schema/authoring.ts` for public files, `scripts/content/lib/pipeline-schema.ts` for pipeline-only files), ADR-0003. |
| **Owner** | `content-engineer` |
| **Last updated** | 2026-11-22 |
| **Related** | [schema-proposal.md](schema-proposal.md), [pilot-report.md](pilot-report.md), [.claude/rules/content-data.md](../../.claude/rules/content-data.md) |

## Requirements

- `npm ci` (Node 26, `.nvmrc`). The scripts run with `tsx` and import the Zod schemas through the `@/` alias.
- **macOS with Swift** (PDFKit), only for the local PDF cross-checks (`content:check:pdf`).

## Commands

| Command | What it does | Writes |
|---|---|---|
| `npm run content:extract` | `scripts/content/extract.ts`: all 51 topics → `content/`, validated, plus review pages. Options after `--`: `--topics t-M24A,…`, `--force-review`, `--hashes` (print each topic's `contentHash` for the ledger). | `content/`, `docs/content/review/`, `.cache/content/provenance/` |
| `npm run content:validate` | Zod schemas + cross-file rules + coverage report | stdout |
| `npm run content:check` | Booklet fidelity: verbatim, line-anchored and round trip | stdout |
| `npm run content:check:pdf` | Local only: Danish vs the booklet PDF text, and SIRI transcriptions vs SIRI's PDFs | stdout |
| `npm run content:build` | Publishes the read model and matching audio for the selected channel (ADR-0002) | `src/generated/content/`, `public/audio/` |
| `npx tsx scripts/content/survey.ts [--json]` | Structural survey of the whole booklet. Read-only. | stdout, `.cache/content/survey.*` |
| `swift scripts/content/pdf-text.swift <pdf> <outDir>` | Page text with PDFKit, **Danish only** | `<outDir>/page-NNN.txt` |

Every command exits 1 on any failure. CI runs `content:validate`, `content:check` and `content:extract` + `git diff --exit-code` (determinism).

### One-time setup for the PDF checks

The raw files go to the gitignored `.cache/` folder. Never commit them.

```sh
swift scripts/content/pdf-text.swift docs/resources/PD3_Mundtlig_Delproeve2.pdf .cache/content/booklet/text
mkdir -p .cache/content/sources/siri-2024-maj
curl -sSfL -o .cache/content/sources/siri-2024-maj/document.pdf \
  "https://danskogproever.dk/media/prob2ifo/censor-og-eksaminatorhaefte-pd3-mdt.pdf"
swift scripts/content/pdf-text.swift .cache/content/sources/siri-2024-maj/document.pdf .cache/content/sources/siri-2024-maj/text
# same for siri-2019-nov, from the URL in scripts/content/data/siri-2019-nov.json
```

`check-siri.ts` compares the downloaded PDF's SHA-256 with the hash recorded in `scripts/content/data/siri-2024-maj.json`. A different file fails the check.

## Stages

`parse → check → structure → merge review ledger → write → validate → review pages`

1. **Parse** (`lib/topic-parser.ts`, `lib/themes.ts`).
   - A strict grammar over classified lines. Blank lines, `## n / 116` page markers and HTML comments are skipped, but each line keeps its page number.
   - Any line the grammar doesn't expect throws a `ParseError` with its line and page. Nothing is skipped silently: every content line of a topic block must be consumed.
2. **Check** (`checkTopic`).
   - Cardinality: two situations; sections sitA, sitB and general; 3 key words and 1 follow-up per section.
   - Script checks.
   - The build refuses a topic with any issue.
3. **Structure** (`lib/build.ts`).
   - Normalisation (below), IDs and page provenance.
   - SIRI intros, and `siriCheck` computed by comparing the booklet text with the SIRI transcription. It is never set by hand.
   - Margin notes are split out into the internal file.
4. **Review ledger** (`content/review-ledger.json`).
   - Human review decisions live here, never in the generated topic files, so re-extraction can't erase them.
   - A `reviewed` or `approved` entry must carry the `contentHash` of the topic it was given for. If the extracted content changes, the status falls back to `needs-review` automatically.
   - Notes the pipeline raises itself (for example "SIRI wording differs") always force at least `needs-review`.
5. **Write.** Deterministic JSON: keys in schema order, 2-space indentation, one trailing newline. Re-running gives byte-identical output (verified on 14 files).
6. **Validate** (`lib/validate.ts`, run by `content:validate` and at the end of `content:extract`). Zod for shape, then the cross-file rules in [schema-proposal.md §9](schema-proposal.md#9-validation-rules), plus (2026-11-21):
   - topic links point only at main topics; similar groups have at least two members;
   - published IDs never disappear (unless retired) and every approved item ID is registered;
   - each correction note's `find` text still occurs in its field (a stale note fails);
   - spoken overrides: part 1 is the displayed text up to a "Hvorfor?/Hvorfor ikke?" ending;
   - app-authored Persian: no literal digits and no «امتحان» (glossary);
   - approved and reviewed items carry `reviewedBy` and an ISO `reviewedOn`; approved topics need approved intros;
   - emphasis ranges never split a surrogate pair (ADR-0002 OQ-A5).
7. **Review pages** (`lib/review-page.ts`).
   - One page per topic in `docs/content/review/`, rendered from the JSON with the booklet page of every item.
   - A page carries a hash of its generated text. Once the owner ticks a box or writes a finding, the build stops overwriting it (it reports `kept-human-edits`). `--force-review` overrides this.

**Note:** parse and check errors abort before anything is written. Validation runs after writing, so a failed validation leaves the new files on disk with exit code 1. Fix the cause and re-run.

## Inputs and outputs

| Path | Kind | Public? |
|---|---|---|
| `docs/resources/PD3_Mundtlig_Delproeve2.md` | Source (owner's extraction). Never modified. | no |
| `scripts/content/data/siri-2024-maj.json` | SIRI 2024 transcription (official host): intros, questions, suggested follow-ups, intro and closing lines, page and SHA-256 | input |
| `scripts/content/data/siri-2019-nov.json` | SIRI Nov–Dec 2019 transcription from a **third-party copy, authenticity unconfirmed**: questions and suggested follow-ups (2019 had no situation intros) | input |
| `scripts/content/data/app-authored.json` | Text written for the app (origin `app`): sound-check, transition and "Tak." lines; the 96 situation intros for 2016–2023; the spoken-override rule | input |
| `content/review-ledger.json` | Human and delegated decisions: topic status bound to `contentHash`, intro, examiner-line and answer translation decisions, **correction notes** | no |
| `content/answer-translations.json` | App-authored Persian translations keyed by answer item ID | yes, via the read model and translation gates |
| `content/topics/<id>.json`, `themes.json`, `terms.json`, `examiner-lines.json` | Authoring files; their allow-listed parts become public once approved (ADR-0002) | yes, via the read model |
| `content/topic-links.json` | 🔁/🔗 relations and the similar-questions table as **topic and section IDs only**, main topics only (D-21) | yes |
| `content/published-ids.json` | Append-only register of every item ID of an approved topic; `retired` entries for any ID ever withdrawn | yes |
| `content/internal/margin-notes.json` | The 45 margin notes. **Not public.** | no |
| `docs/content/review/<id>.md` | Review pages (51). Internal. | no |
| `.cache/content/**` | PDF text, downloaded SIRI PDFs, provenance, survey output | no (gitignored) |

**Copyright:** `content/`, `docs/content/review/` and `docs/resources/` all contain booklet text. The repository must stay private until the author's written permission exists (DL-009).

## Persian answer translations

`content/answer-translations.json` uses the current `schemaVersion` and an `items` map. Key each `{ fa, sourceHash, origin: "app" }` record by the exact ID in the topic file, for example `2024-maj-b.general.q2.answer`, `2024-maj-b.general.followup1.answer` or `2024-maj-b.sitA.example1`. Generate `sourceHash` with `translationSourceHash(da)` from `scripts/content/lib/answer-translations.ts`. It takes the first 16 lowercase hex characters of SHA-256 over the Danish field encoded as UTF-8 in NFC. Whitespace, punctuation and case are significant. Topic content hashes continue to cover the booklet files independently.

Record decisions in `review-ledger.json` under `answerTranslations`, keyed by the same item IDs. A translation without a decision is a draft. Preview publishes current translations at any status. Production requires an approved topic and an `approved` translation decision. The production build projects only translation statuses from the ledger. Both channels withhold stale translations.

`content:validate` checks the IDs, Persian script and glossary. Use «آزمون» and «پاسخ» in place of «امتحان» and «جواب». The command warns when the Danish hash has changed, and fails if the stale translation is approved. The coverage line counts answer IDs, including repeated Danish answers. `translated` counts IDs with a translation record, `approved` counts current approved translations, `stale` counts hash mismatches and `missing` counts IDs without a record.

Published answers and personal examples carry `translation: { fa, origin: "app" }` alongside their Danish `text`. Their search fields include normalized Danish and Persian. The leak scan allows the translations published in the selected channel and uses withheld Persian text and its normalized search form as production canaries.

## Normalisation rules

The source is already clean (see the [pilot report §1.5](pilot-report.md#15-characters-and-orthography)), so the only transformations are the ones listed here. The validator checks the rest.

| # | Rule | Applies to | Effect on this source |
|---|---|---|---|
| N1 | Unicode **NFC** | every string | none (all 5,897 lines are already NFC) |
| N2 | Collapse whitespace runs to one space and trim | every string | none (no NBSP, tabs, double or trailing spaces in fields) |
| N3 | Remove the **enclosing** `“…”` of a required question or follow-up. Inner quotes stay as printed (`„bedst før“`, `'en børnecheck'`, `30'erne`). | questions | structural only |
| N4 | Remove `<span lang="fa" dir="rtl">` and `<strong>` tags. In model answers, record the `<strong>` runs as `emphasis` ranges. | all fields | lossless (the round trip rebuilds the markup) |
| N5 | Note marker emoji → `kind` (🔁 recurring, 🔗 related, 📌 tip, ⭐ highlight, 🩺 nursing) | margin notes | lossless 1:1 mapping |
| N6 | `🎯 <label>: <Danish>` → `label.fa` + `text.da` | personal examples | lossless |
| N7 | SIRI transcriptions: join line-wrap hyphens (`Hvil-ke`); keep suspended-compound hyphens (`social- og`); remove enclosing `”…”`; one entry per quoted part | SIRI data | documented in the data file; verified by `check-siri.ts` |

**Not done, because nothing needs it** (checked over the whole file, and enforced by the validator):
- converting Arabic `ي`/`ك` to Persian `ی`/`ک`
- stripping presentation forms
- repairing ZWNJ
- changing quote styles

**Never done:** changing Danish wording, spelling or punctuation, or Persian wording. Corrections are recorded next to the original (`siriCheck.siriParts`, review notes, and later the corrections list proposed in the schema), never over it.

## Rules added in the full phase (2026-11-21)

- **Delegated approvals.** While the owner has delegated reviews, approvals carry `reviewedBy: "delegated-agent-review"` and the date, in the ledger and in the topic's `review`, so the owner can find and revisit every one of them.
- **Correction notes** (`review-ledger.json` → `topics.<id>.corrections`, `marginNoteCorrections`): `{ path, find, suggestion, reason, by, source, status }`. They are shown on the review pages and never applied to the booklet text. Whether learners see them is OQ-17.
- **«چرا؟ چرا نه؟» is an app-written display hint, never content** (Persian review of 48 topics, 2026-11-22). In 57 follow-ups across 32 topics the Danish ends *Hvorfor? / Hvorfor ikke?* but the booklet's Persian leaves it out. The UI shows «چرا؟ چرا نه؟» **beside** the author's Persian line, never inside it. It is derived at render time from the Danish ending; it is not stored in `content/`, not added to any `fa` field, and not a correction note. The booklet's Persian stays exactly as printed. (P-02 in the pilot remains a correction note for the record.)
- **Spoken overrides.** A follow-up whose text ends "Hvorfor?/Hvorfor ikke?" (or the booklet variants "Hvorfor / hvorfor ikke?", "Hvorfor/Hvorfor ikke?") gets `spoken: { parts: [<text before the ending>, "Hvorfor eller hvorfor ikke?"], pauseMs: 800, origin: "app" }`. The displayed text never changes (exam review S2).
- **Intros** come from SIRI where a booklet exists (2024), otherwise from `app-authored.json` (origin `app`). All 96 app intros were reviewed and approved by delegation on 2026-11-21 (Danish review of the intros; exam review of intros and 2019).
- **Topic approvals (2026-11-22, by delegation).** 49 of 51 topics are `approved` in the ledger, each bound to its `contentHash`. 2020-nov-b and 2016-nov-b stay `needs-review` until an Afghan (Dari) reader checks «حقوق» and «دعوا» (`docs/content/dari-check.md`). The 22 new correction notes from the 48-topic Persian review sit in the ledger next to the booklet text.
- **Writing rule for app-written intros** (both reviews, 2026-11-21):
  - describe what the picture would show, as "Situation A/B viser …";
  - never state the tension or anyone's state of mind (it gives the answer away);
  - never repeat the question's *selvom* clause (the tension belongs in the question);
  - never write "en person … hun": name the person ("en kvinde", "en mor").
- **SIRI source display.** Every checked `siriCheck` carries `sourceDisplay { title, availability, note }`, so the "SIRI's wording differs slightly" panel can name its source (exam review S5). The note comes from `document.availabilityNote` in the SIRI data file.
- **Confidentiality rule.** Exact ISO dates (`2026-11-20`) are removed before matching: they are our own process metadata. Everything else is unchanged.
- **Lint.** `scripts/content/**` gets the full type-aware rules with two narrow allowances (numbers in template literals; `!` on just-matched regex groups). `build-read-model.ts` gets none (ADR-0003, code review S6).

## Fidelity checks (what "verified" means)

| Check | Proves | Result (51 topics, 2026-11-21) |
|---|---|---|
| Verbatim (`content:check`) | Every da/fa string appears in the tag-stripped, whitespace-normalised source, **on its recorded line** | 2,201/2,201 (da 1,231, fa 970); 30 theme strings |
| Round trip (`content:check`) | Re-rendering the JSON gives back every source block exactly | 2,041/2,041 lines, 51 blocks |
| Mutation tests (manual, pilot) | The checks catch a ZWNJ replaced by a space, an emphasis range off by one, a dropped key word, a deleted word in a SIRI string | all caught |
| Booklet PDF (`content:check:pdf`) | Danish matches the PDF's own text on the recorded page | 1,231/1,231 (5 documented text-layer artefacts, 7 RTL final-period artefacts, all reported) |
| SIRI (`content:check:pdf`) | SIRI transcriptions match SIRI's PDF text; content uses them unchanged | 50/50 (2024: 32, 2019: 18) |
| Determinism | `content:extract` twice gives byte-identical output | 109 files identical |
| Persian vs PDF | **Not fully machine-checkable.** Pilot (2024): signed off by `persian-localization-reviewer`, visual comparison (2026-11-20). Other 48 topics: 870 strings byte-identical to the booklet Markdown, 839 matched to the PDF text layer automatically (31 line-wrap fragments), every string compared visually with the page images (2026-11-21). | 51/51 |
