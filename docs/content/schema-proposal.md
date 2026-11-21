# Content schema proposal (schemaVersion 0)

| | |
|---|---|
| **Status** | **Implemented** (2026-11-21) as Zod: public files in `src/lib/content/schema/authoring.ts`, pipeline-only files in `scripts/content/lib/pipeline-schema.ts`. Still `schemaVersion: 0`. Additions since this proposal: `Followup.spoken` (examiner-voice override), `Review.reviewedBy/reviewedOn` (delegated approvals), examiner-line role `sound-check`, `content/topic-links.json`, `content/published-ids.json`, ledger `intros`, `examinerLines` and `corrections`. §11 entities (templates, toolbox, vocabulary, recurring, study method) are still proposals. |
| **Author** | `content-engineer` |
| **Date** | 2026-11-19 |
| **Exact definition** | [`src/lib/content/schema/authoring.ts`](../../src/lib/content/schema/authoring.ts) and [`scripts/content/lib/pipeline-schema.ts`](../../scripts/content/lib/pipeline-schema.ts) |
| **Inputs** | [Survey and pilot](pilot-report.md); `.claude/rules/content-data.md`; PRD and user stories; exam-accuracy review [2026-11-18](../reviews/2026-11-18-pd3-exam-review-prd.md); owner decisions of 2026-11-18 (intros, D-15, verifying older terms) |

## 1. Why schemaVersion 0

The shape is a proposal and has had no architect review yet. **Version 0 means it may still change without a migration.** It becomes `1`, with the rule's migration discipline, when the Zod schema lands and the first topic is `approved`.

## 2. Principles

1. **Source fidelity is structural.** Every booklet string is stored verbatim (NFC and whitespace only; see [pipeline.md](pipeline.md#normalisation-rules)). Markup becomes data, never edits: bold runs become `emphasis` ranges, markers become `kind`, labels become `label`. A round trip rebuilds the source block exactly.
2. **Every text says where it comes from.** Booklet text carries `source.pages`. Text from SIRI carries `origin: "siri"` plus a `sourceRef` (document and page). Text we write carries `origin: "app"` and needs review. This keeps the app's own text visibly separate from booklet and SIRI text (DL-034).
3. **Public and internal content are separate files.**
   - The booklet's margin notes live in `content/internal/`, which the app's repository never reads (exam review B1).
   - Review notes and SIRI-check metadata stay in the topic file but are never rendered.
4. **Human decisions don't live in generated files.** Review status comes from `content/review-ledger.json`. An approval is tied to a content hash, so re-extraction can't silently keep an approval for changed text.
5. **Booklet text is never overwritten.** SIRI's wording and future corrections sit next to it (§12). Which version the learner sees is a display decision (PRD OQ-17).
6. **IDs are stable and dotted** (`.claude/rules/content-data.md`). **Every item that can get audio has its own ID** (§10).

## 3. Files

```
content/
  topics/<topicId>.json        one per topic (public once approved)
  themes.json                  10 themes (+ sub-themes)
  terms.json                   terms + format eras
  examiner-lines.json          intro, transition, "Tak.", closing
  review-ledger.json           human review decisions (not rendered)
  internal/margin-notes.json   booklet margin notes: NOT public
  (proposed, §11) templates.json, toolbox.json, vocabulary.json, recurring.json, study-method.json, guide/*.json
scripts/content/data/
  siri-<term>.json             SIRI examiner-booklet transcriptions (pipeline input, verified against the PDF)
  app-authored.json            text written for the app (pipeline input)
```

**One file per topic** keeps diffs and reviews small. A database later maps one row per topic, or normalises further behind the same repository functions.

## 4. Common types

```ts
type LocalizedText = { da?: string; fa?: string; en?: string };
interface Provenance { pages: number[] }                    // booklet PDF pages (1–116), ascending
interface ExternalSource { document: string; pages: number[] } // e.g. { document: "siri-2024-maj", pages: [8] }
type ReviewStatus = "extracted" | "needs-review" | "reviewed" | "approved";
interface ReviewNote { path?: string; pages?: number[]; text: string }
interface Review { status: ReviewStatus; notes?: ReviewNote[] }
interface TextRange { start: number; end: number }          // UTF-16 offsets, JS slice semantics
```

### Which locales each field requires

| Field | Required | Why |
|---|---|---|
| topic, theme and sub-theme titles; situation titles; required questions; suggested follow-ups; key words | `da` + `fa` | The booklet gives both |
| model answers, follow-up answers, personal examples, situation intros, examiner lines | `da` only | **The booklet has no Persian translation of answers.** SIRI text is Danish. We don't write translations. |
| margin notes, personal-example labels | `fa` only | Persian in the booklet |
| any | `en` optional | Future interface languages. Content translations need the author's permission (D-12 item 7). |

**`ReviewNote` is a deviation from the rule's `notes?: string`.** A list of `{ path, pages, text }` lets a note point at a field and a page, which the review pages and the agent instructions need. To be confirmed by `software-architect` (OQ-A1).

## 5. Topics: `content/topics/<topicId>.json`

```ts
interface TopicFile {
  schemaVersion: 0;
  id: TopicId;                   // "2024-maj-b"
  termId: TermId;                // "2024-maj"
  letter: "A" | "B" | "C";
  themeId: ThemeId;              // "arbejde"
  subthemeId?: string;           // "arbejde.koen-sprog-og-udenlandsk-arbejdskraft" (chapter 2 only)
  title: LocalizedText;          // da+fa
  situations: [Situation, Situation];   // A, B
  general: QuestionSection;      // second required question
  source: Provenance;
  review: Review;
}
interface QuestionSection {
  id: string;                    // "<topic>.sitA" | "<topic>.sitB" | "<topic>.general"
  question: RequiredQuestion;
  followups: Followup[];         // SIRI's suggested follow-up(s) as printed in the booklet; 1 per section everywhere
  personalExamples: PersonalExample[];  // 7 in the whole booklet
  source: Provenance;
}
interface Situation extends QuestionSection {
  key: "A" | "B";
  title: LocalizedText;          // booklet's short description, da+fa
  intro?: SituationIntro;        // examiner's spoken introduction of the situation
}
interface SituationIntro {
  id: string;                    // "<topic>.sitA.intro"
  text: LocalizedText;           // da
  origin: "siri" | "app";
  sourceRef?: ExternalSource;    // required for "siri"; forbidden for "app"
  review: Review;
}
interface RequiredQuestion {
  id: string;                    // "<topic>.sitA.q1" | "<topic>.general.q2"
  text: LocalizedText;           // da (as printed, no enclosing quotes) + fa
  siriCheck: SiriCheck;
  keywords: Keyword[];           // exactly 3: { id: "<q>.kw1", emoji, text: da+fa }
  modelAnswer: { id: string /* "<q>.answer" */; text: LocalizedText /* da */; emphasis: TextRange[] };
}
interface Followup {
  id: string;                    // "<section>.followup1"
  text: LocalizedText;           // da+fa
  siriCheck: SiriCheck;
  answer: { id: string /* "<followup>.answer" */; text: LocalizedText /* da */ };
}
interface SiriCheck {
  status: "unchecked" | "matches" | "differs";
  sourceRef?: ExternalSource;    // document registry key + page
  checkedOn?: string;            // ISO date
  siriParts?: string[];          // SIRI's wording, one entry per quoted part; "matches" ⇔ text.da === siriParts.join(" ")
}
interface PersonalExample { id: string /* "<section>.example1" */; label: LocalizedText /* fa, as printed */; text: LocalizedText /* da */ }
```

### Choices, and why

- **`situations[]` + `general`, not three generic sections.** The exam has two kinds of block: situation A/B, which carry a title and an intro, and the general question, which has neither. Typing that keeps the mock-exam state machine simple: pick one situation, then the general question.
- **The situation `title` is the booklet's description, not SIRI's caption.** May–June 2024 proves the difference. SIRI's captions ("Mangel på medarbejdere i sundhedssektoren") and SIRI's spoken intro ("Situation A viser en sygeplejerske, der har ansvar for mange patienter og har travlt.") are both different texts. The text card can show either; that's PRD OQ-1/D-4.
- **`intro` (owner decision, 2026-11-18).**
  - May–June 2024: SIRI's "Forslag til indledning", verbatim (filled in the pilot, 6/6).
  - 2023: SIRI's text if the booklets are found.
  - 2016–2022 and any 2023 not found: one sentence written by us (`origin: "app"`), reviewed by `danish-language-reviewer`.
  - The field is optional in the type, but **validation requires it before a topic can be `approved`**.
  - App intros will come from `scripts/content/data/app-authored.json`, keyed by situation ID. They are never stored inside the booklet fields.
- **`siriCheck` is per question and per follow-up**, not per topic (exam review finding 3).
  - It records the source, the page, the date and the result.
  - SIRI's text is kept in `siriParts`, split the way SIRI quotes it (for example `["…museum?", "Hvorfor?/Hvorfor ikke?"]`). The mock exam can use that split for natural examiner pauses.
  - The status is **computed by the build**, never typed by hand.
  - Only checked questions may be called "official wording" (PRD §6.7).
- **Terminology:** "suggested follow-up" (*forslag til opfølgende spørgsmål*), never "official follow-up".
- **`emphasis` ranges instead of inline markup.**
  - TTS and word highlighting need plain text.
  - The ranges are the booklet's bold template connectives: 102/102 situation answers use *For det første / For det andet / Desuden / Så alt i alt*, and 50/51 general answers the template-2 set. That answers OQ-8 without guessing (§11.1).
- **Key-word `emoji` is kept.** It's source content and cheap. Whether to show it is a UI decision.
- **No `role` field on questions.** `q1`/`q2` and the position already say it.
- **Format era is on the term, not the topic** (§8). The pre-2023 label is data (owner decision DL-029).

## 6. Margin notes: `content/internal/margin-notes.json` (not public)

```ts
interface MarginNote {
  id: string;                    // "<topic>.note1" or "<section>.note1" (printed inside a section)
  topicId: TopicId; sectionId?: string;
  kind: "recurring" | "related" | "tip" | "highlight" | "nursing";   // 🔁 🔗 📌 ⭐ 🩺, 1:1
  text: LocalizedText;           // fa
  refs: TopicId[];               // topics named explicitly as "<Maj-Juni|Nov-Dec> yyyy X"
  confidentialityHits: string[]; // §9 rule; non-empty ⇒ can never be public
  visibility: "internal" | "public";   // default "internal"
  source: Provenance; review: Review;
}
```

- **The booklet has 45 margin notes:** 25 🔁, 16 🔗, 2 📌, 1 ⭐ and 1 🩺. 44 are printed after the situation list and 1 inside a section.
- **They are excluded from the app by default** (exam review B1). The ⭐ note at line 1689 names a 2026 exam.
- **A note becomes public only if all three hold:** it is individually `approved`, its `visibility` is `"public"`, and it has no confidentiality hit.
- **`refs` can drive a "related topics" link without exposing any note text.** Ten refs point at appendix (2013–2015) topics that aren't in the app.

## 7. Examiner lines: `content/examiner-lines.json`

```ts
interface ExaminerLine {
  id: "examiner.intro" | "examiner.transition" | "examiner.thanks" | "examiner.closing";
  role: "intro" | "transition" | "between-answers" | "closing";
  text: LocalizedText;           // da; may contain {topic}
  placeholders: string[];        // ["topic"]
  origin: "siri" | "app";
  sourceRef?: ExternalSource;
  review: Review;
}
```

| ID | Text | Origin | Status |
|---|---|---|---|
| `examiner.intro` | *Her er der to billeder, som viser nogle situationer, der handler om emnet {topic}. Du har nu 10 sekunder til at overveje emnet, og derefter vil jeg stille dig spørgsmål til én af situationerne.* | SIRI 2024, pp. 6, 8, 10 (verified for all 3 topics) | extracted |
| `examiner.transition` | *Nu vil jeg stille dig et spørgsmål af en mere overordnet karakter.* | **app** (SIRI 2024 only gives a stage direction, pp. 7, 9, 11; 2019 has none) | needs-review |
| `examiner.thanks` | *Tak.* | **app** (ABOUT §4.1, DL-021) | needs-review |
| `examiner.closing` | *Tak, så er prøven forbi.* | SIRI 2024, pp. 7, 9, 11 | extracted |

**Audio for a filled-in template** is keyed `<line id>:<topic id>`, for example `examiner.intro:2024-maj-a`. These lines belong in content, not in the exam config, because they're Danish text with provenance that needs audio. **The exam config (DL-039) should reference them by ID.**

**Not verified:** the 2019 booklet's intro is different (*"… der viser … emnet 'Kostvaner og livsstil'. Du har nu ca. 10 sekunder til at kigge på billederne."*), followed by the picture-description request. Using the 2024 intro for every topic is a product choice; the exam review recommends it (DL-031).

## 8. Themes, terms, format eras

```ts
interface Theme { id: ThemeId /* "kultur" */; chapter: number /* 2–11 */; emoji: string; title: LocalizedText; subthemes: Subtheme[]; source: Provenance; review: Review }
interface Subtheme { id: string /* "arbejde.<slug>" */; title: LocalizedText; source: Provenance }
interface Term { id: TermId; year: number; session: "maj" | "nov"; formatEraId: string; topicIds: TopicId[] }
interface FormatEra { id: string; fromTermId?: TermId; toTermId?: TermId; basis: string }
```

- **Theme IDs** come from the booklet anchors: `arbejde uddannelse sundhed medier klima boern krim bolig frivillig kultur`.
- **Eras:** `pre-2023` (up to `2022-nov`) and `from-2023` (from `2023-maj`), from ABOUT §6 (BEK 347/2023).
  - The UI shows the pre-2023 label from `term.formatEraId`; the label wording lives in the messages.
  - If the exam changes again, we add an era. No component changes.
- **Topic counts aren't stored.** They come from the content (US-005).

## 9. Validation rules

These are implemented in `scripts/content/lib/validate.ts` and become `content:validate`.

1. **Shape.** Every required field and locale is present. Strings are non-empty, NFC and trimmed, with no markup. There are exactly 2 situations, A then B, and exactly 3 key words per question.
2. **IDs.** IDs are unique across all files. Nested IDs follow their parent (`<q>.kw1`, `<section>.followup1`, `<followup>.answer`, …), and the topic ID matches its term and letter.
3. **References.** These must resolve:
   - `themeId` and `subthemeId`
   - `termId`, and the term's `topicIds`
   - each margin-note `refs` entry, against the 69 booklet topics
   - every `sourceRef.document`, against the registered SIRI transcriptions
4. **Script.** Danish has no Arabic-script letters. Persian has Persian letters and no `ي`, `ك` or presentation forms.
5. **Emphasis ranges.** They lie within the text, ascend, don't overlap and aren't empty.
6. **Origin.**
   - `origin: "siri"` requires a `sourceRef`.
   - `origin: "app"` must not claim a source.
   - `siriCheck.status` must agree with the actual text comparison.
7. **Publishing gates.**
   - `needs-review` needs notes.
   - An `approved` topic needs an intro for both situations.
   - A public margin note must be individually approved and free of confidentiality hits.
   - Public files may not contain margin notes.
8. **Confidentiality** (exam review B1). No term after `2024-maj` is allowed. **Any string in any public file** fails if it mentions:
   - a year from 2025 on (Latin or Persian digits)
   - "Skriftlig" or "Mundtlig" with a year from 2024 on
   - "Nov-Dec", "november", "december" or "vinter" with 2024

   The only exemption is our own ISO dates in `checkedOn`, `reviewedOn` and `retrievedOn`.

   Over the whole source this rule hits 3 lines: the ⭐ note (line 1689) and two citations of 2025 documents (lines 213 and 5892). The citations are expected noise for a human to decide.

## 10. IDs and audio

**Every audio-bearing item has its own ID.** The audio manifest maps `(id, locale, voice)` to a file. Persian audio isn't planned (PRD §5.2), but the same ID would serve it.

| Item | ID pattern | Voice | Per topic |
|---|---|---|---|
| Situation intro | `<topic>.sitA.intro`, `.sitB.intro` | examiner | 2 |
| Required question | `<topic>.sitA.q1`, `.sitB.q1`, `.general.q2` | examiner | 3 |
| Model answer | `<q>.answer` | model | 3 |
| Key word | `<q>.kw1` … `.kw3` | model | 9 (optional audio, US-014) |
| Suggested follow-up | `<section>.followup1` | examiner | 3 |
| Follow-up answer | `<followup>.answer` | model | 3 |
| Personal example | `<section>.example1` | model | 0–1 (7 in total) |
| Examiner intro for the topic | `examiner.intro:<topic>` | examiner | 1 |
| Examiner lines | `examiner.transition`, `examiner.thanks`, `examiner.closing` | examiner | shared |

**Size:**
- That is about 24 to 25 clips per topic with key words, or about 15 without, which is more than the PRD's estimate of about 13 because it adds intros and key words.
- The booklet's Danish (51 topics, without intros) is **1,078 items and 124,752 characters**: questions 20.6k, model answers 50.6k, key words 7.3k, follow-ups 17.4k, follow-up answers 28.3k, examples 0.6k. This is for `speech-engineer`'s cost dry run.

**ID rules:**
- IDs are derived from structure (section, position), never from text, so a corrected word keeps its ID.
- Numbering (`kw2`, `followup1`, `note3`) follows source order at the first extraction. **It is never renumbered:** an item added later gets the next free number.
- 11 Danish answers are identical across topics. The booklet repeats them on purpose for recurring questions. Audio can be shared by content hash, but each keeps its own ID (OQ-S2).

## 11. Other content (proposals; not built in the pilot)

### 11.1 Answer templates: `templates.json` (booklet pp. 7–8)

```ts
interface AnswerTemplate {
  id: "tpl.why" | "tpl.prosCons" | "tpl.followup";
  fits: "first-required" | "second-required" | "followup";
  title: LocalizedText;                       // fa heading incl. the Danish cue «Hvorfor tror du, …?»
  steps: Array<{ id: string /* "tpl.why.step1" */; label: LocalizedText /* fa: شروع، دلیل ۱ … */; text: LocalizedText /* da+fa */;
                 underline: TextRange[]; spoken?: { text: LocalizedText; origin: "app"; review: Review } }>;
  cueRows?: Array<{ id: string /* "tpl.followup.row1" */; cue: LocalizedText /* da: "… betyder for X?" */; text: LocalizedText /* da+fa */ }>;
  example?: { id: "tpl.why.example"; text: LocalizedText };   // only template 1 has an example
  tip?: LocalizedText;                         // template 2's 📌 grammar tip (fa with Danish runs)
  source: Provenance; review: Review;
}
```

- **Template 1** has 5 steps and an example.
- **Template 2** has 5 steps and a grammar tip, with **no example**.
- **Template 3** has 6 cue → answer rows.
- **The V2 word-order table** (3 rows) becomes `grammarNotes`.
- **Steps contain grammar notation.** For example, *For det første + <u>verbum</u> + subjekt …* and placeholders such as X/Y/Z, "…" and "/" alternatives.
  - `text` keeps the notation verbatim. A reviewed, app-authored `spoken` variant is what TTS reads (OQ-S1).
- **Linking answers to templates (US-020)** is derivable, not guessed:
  - `fits` + section kind: situation answers use template 1, general answers template 2.
  - Exceptions: one general answer (`2022-nov-b`) varies the connectives, and one situation question (`2023-nov-a.sitB.q1`) isn't a "Hvorfor tror du" question.

### 11.2 Toolbox: `toolbox.json` (pp. 9–10)

```ts
interface ToolboxGroup { id: "toolbox.reasons" | "toolbox.personal" | "toolbox.rescue"; title: LocalizedText;
  items: Array<{ id: string /* "toolbox.reasons.1" */; emoji?: string; text: LocalizedText /* da+fa */; spoken?: {…} }> }
```

- **Group sizes:** 10 reasons, 6 personal sentences, 9 rescue sentences. The rescue list runs across pp. 9–10.
- **Many items are sentence stems** ending in "…" or offering "/" alternatives, so they need a `spoken` variant too.
- **The booklet's repeat request** *"Undskyld, vil du gentage spørgsmålet?"* (lines 166, 333) is shown as equally correct alongside US-002's wording (exam review Q5).

### 11.3 Vocabulary: `vocabulary.json` (pp. 115–116)

```ts
interface VocabItem { id: string /* "vocab.words.1" | "vocab.phrases.1" */; text: LocalizedText; grammar?: "en" | "et" | "pl." }
```

- **30 words and 20 verb phrases.** The phrases run across pages.
- **`grammar`** is split losslessly from "livskvalitet (en)". Alternatives such as "ledig / arbejdsløs" stay as printed.

### 11.4 Recurring questions: `recurring.json` (pp. 99–100)

```ts
interface RecurringRow { id: string /* "recurring.1" */; label: LocalizedText;
  occurrences: Array<{ topicId: TopicId; section: "sitA" | "sitB" | "general" | null }> }   // null = appendix (no section given)
```

- **The table is structured enough for US-007 (OQ-13):** 29 rows and 63 references, all resolving. 7 references point at appendix topics.
- **The booklet's framing text (line 4885) is excluded** (D-15). The app writes its own neutral framing (origin `app`).
- **Rows are often only *similar*** (exam review), so label them "similar questions in other terms".

### 11.5 Study method and exam guide

- **`study-method.json`.** The booklet's method steps 1–4 (line 46–52), attributed.
  - **Step 5 (line 54, the prediction) is excluded** (D-15).
  - The booklet's time-split table (pp. 6, lines 225–235) may be included verbatim and attributed. The booklet itself labels it an estimate that isn't from SIRI.
  - "Review on day 1 → 3 → 7 → 14" says **each chapter** (هر فصل), not each topic, and doesn't say counting from what (OQ-2).
- **`guide/*.json`.** The Persian exam guide is **app-authored** (origin `app`) from ABOUT_PD3_MUNDTLIG.md, with sources and a `lastChecked` date. It is content, not interface messages, because it is long-form, reviewed and versioned.
  - The booklet's SIRI chapter (pp. 4–6) overlaps it. Reuse only what is attributable: the follow-up-types table quotes SIRI's examiner phrases, and the BEK assessment quote (line 185).

### 11.6 Appendix (2013–2015): out of the app (owner decision)

If it is ever used, it should be an **`ArchiveTopic` type, not a weakened `TopicFile`**. It lacks situation titles, intros, model answers, Persian for follow-ups and follow-up answers (pilot report §1.7).

## 12. Corrections (proposed)

Corrections are recorded in the ledger, never in the booklet fields:

```ts
interface Correction { path: string; original: string; corrected: string; reason: string;
  source?: ExternalSource; proposedBy: string; status: "proposed" | "accepted" | "rejected" }
```

The build validates that `original` still equals the field, so a stale correction fails loudly. It exposes accepted corrections next to the original. **Whether learners see the correction, the original, or both is OQ-17.** For SIRI wording, `siriCheck.siriParts` already is the correction.

## 13. Repository implications (`src/lib/content`)

The functions stay async and independent of storage, for example:
- `listThemes()`, `listTopics({ themeId?, termId? })`, `getTopic(id)`, `listTerms()`, `getExaminerLines()`, `getRecurring()`, `getTemplates()`.

They return **only `approved` items from public files**. They never read `content/internal/`, never return `review` or `siriCheck` metadata, and filter out any situation without an intro.

## 14. Open questions

**For `software-architect`**
- **OQ-A1:** accept structured `ReviewNote[]` instead of `notes?: string`?
- **OQ-A2:** keep the review ledger separate from topic files, with `contentHash`?
- **OQ-A3:** should `content/internal/` live inside `content/` or at a separate root, to make the public/internal split physical?
- **OQ-A4:** keep one file per topic, or one per term?
- **OQ-A5:** is `TextRange` in UTF-16 units acceptable? (All Danish text is in the BMP.)
- **OQ-A6:** where do pipeline inputs (`scripts/content/data/`) live once a database exists?

**For the owner**
- **OQ-O1:** situation card text: the booklet title, SIRI's caption (only known for 2024-maj-b), or the intro?
- **OQ-O2:** show the 7 nurse-specific personal examples and the 🩺 note to everyone?
- **OQ-O3:** approve individual margin notes (for example the 📌 tip in 2024-maj-c) for public use?
- **OQ-O4:** will a SIRI difference be shown to learners, or only the booklet text (OQ-17)?

**For `pd3-exam-expert`**
- **OQ-E1:** is SIRI's 2024 intro phrase right for pre-2023 topics too?
- **OQ-E2:** are SIRI's 2019 differences (pilot report §4.3) the pattern for every pre-2024 term?
- **OQ-E3:** is the `examiner.transition` wording final?

**For `speech-engineer`**
- **OQ-S1:** `spoken` variants for template and toolbox stems.
- **OQ-S2:** share audio between identical texts?
- **OQ-S3:** play SIRI's quoted parts with a pause in between?
- **OQ-S4:** abbreviations to cover: `fx` (34 times) and `ca.` (3).
