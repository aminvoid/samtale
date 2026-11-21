# Content pilot report (M0)

| | |
|---|---|
| **Author** | `content-engineer` |
| **Date** | 2026-11-19 (work started 2026-11-18) |
| **Scope** | Survey of the whole booklet source; schema proposal; pilot parse of May–June 2024 (`2024-maj-a/b/c`) with SIRI intros and wording checks; fidelity checks; review pages |
| **Read with** | [schema-proposal.md](schema-proposal.md), [pipeline.md](pipeline.md), the review pages in [review/](review/), [exam-accuracy review](../reviews/2026-11-18-pd3-exam-review-prd.md) |
| **Reproduce** | `node scripts/content/survey.ts`, `node scripts/content/build-pilot.ts`, then the three `check-*.ts` scripts ([pipeline.md](pipeline.md#commands)) |

## Summary

- **The source is in excellent shape.**
  - All 51 main topics parse under a strict grammar, with no exceptions needed after two deliberate grammar extensions (§1.6).
  - Every topic has the full expected structure: 2 situations, 3 required questions, 3 key words per question, a model answer, and 1 suggested follow-up with translation and answer.
  - The table of contents, chapter counts and cover claims (51 topics, 306 Q&A, 10 chapters) all agree with the parsed content.
  - No character or orthography problems were found anywhere in the 5,897 lines, so normalisation is NFC only.
- **The Danish matches the PDF exactly.**
  - **1,501/1,501 Danish strings** of all 51 topics and the appendix match the booklet PDF's text layer.
  - The 8 apparent differences are all extraction artefacts (§1.11).
  - This extends the owner's baseline, which covered questions and model answers, to key words, situation titles, follow-up answers, examples and the appendix.
- **The May–June 2024 pilot is built, validated and verified:**
  - 131/131 strings appear verbatim on their recorded source line.
  - The round trip reproduces the source block exactly (121 lines).
  - All 18 questions and suggested follow-ups **match SIRI's 2024 examiner booklet**.
  - The 6 situation intros come verbatim from SIRI.
  - The output is deterministic, and the mutation tests show the checks catch subtle corruption.
- **Findings for product and exam:**
  - The booklet's **margin notes can leak confidential exam content**: line 1689 names a 2026 exam. They are now internal-only data.
  - **Pre-2024 Danish wording is not guaranteed to be SIRI's.** Nov–Dec 2019 has 3 confirmed differences, and 39 follow-ups use the booklet's own "Hvorfor / hvorfor ikke?" form.
  - **The booklet has no Persian translations of answers.**

---

## 1. Survey of the whole source

Source: `docs/resources/PD3_Mundtlig_Delproeve2.md` (5,897 lines, 116 pages; page markers consecutive 1–116). Full output: `node scripts/content/survey.ts`.

### 1.1 Main topics

| Check | Result |
|---|---|
| `t-` anchors found | 51 |
| Parsed by the strict grammar | **51/51** |
| 2 situation titles (A, B), each da + fa | 51/51 |
| Sections sitA, sitB, general in that order | 51/51 |
| Each section: question da + fa translation, **3** key words, model answer, **1** suggested follow-up (da + fa) with a `↳` answer | 153/153 sections |
| Key words per question | always 3 (459 in total) |
| Sections that run across a page break | 23 of 153. Handled: page provenance per item. |
| Danish fields with Arabic script, or Persian fields without Persian letters | 0 |

**Optional parts:**

- **Personal examples: 7, not the 4 in the brief.** They are Danish text inside a Persian span, with three different labels:

  | Topic | Section | Line | Page | Label |
  |---|---|---|---|---|
  | 2016-nov-c | sitB | 473 | 13 | «مثال شخصی خودت» |
  | 2018-maj-b | sitA | 951 | 22 | «به‌عنوان پرستار» |
  | 2020-maj-c | sitA | 1623 | 34 | «مثال شخصی» |
  | 2024-maj-b | sitA | 1711 | 36 | «مثال شخصی» |
  | 2016-maj-c | sitA | 2353 | 49 | «به‌عنوان پرستار» |
  | 2020-maj-b | general | 2567 | 53 | «به‌عنوان پرستار» |
  | 2020-nov-b | general | 4687 | 94 | «به‌عنوان پرستار» |

  All 7 are nurse-specific.
- **Margin notes: 45, not only 🔗.** By marker: 🔁 25, 🔗 16, 📌 2, ⭐ 1, 🩺 1.
  - 44 sit at topic level, right after the situation list.
  - At most one per topic.
  - One note (line 3997, p. 80) holds a second marker inside its text (`🔁 … 📌 …`).
- **Notes and cross-references:**
  - 52 explicit topic references ("Maj-Juni 2019 C") appear in the notes, 10 of them to appendix (2013–2015) topics.
  - 5 notes have no explicit reference: lines 1689, 1847, 2325, 3895 and 4163.
  - Line 4163 refers to "Nov-Dec 2012" without a letter.

### 1.2 Themes and table of contents

| Ch. | Theme ID | Main TOC | Chapter header | Chapter TOC | Topics in body | Sub-groups |
|---|---|---|---|---|---|---|
| 2 | arbejde | 16 | 16 | 16 | 16 | 5 |
| 3 | uddannelse | 6 | 6 | 6 | 6 | – |
| 4 | sundhed | 5 | 5 | 5 | 5 | – |
| 5 | medier | 5 | 5 | 5 | 5 | – |
| 6 | klima | 5 | 5 | 5 | 5 | – |
| 7 | boern | 4 | 4 | 4 | 4 | – |
| 8 | krim | 3 | 3 | 3 | 3 | – |
| 9 | bolig | 3 | 3 | 3 | 3 | – |
| 10 | frivillig | 2 | 2 | 2 | 2 | – |
| 11 | kultur | 2 | 2 | 2 | 2 | – |

- **0 inconsistencies.** Every chapter-TOC entry (title, term, letter, Persian title, order) equals the topic's own header. Sub-group headings match between the TOC (`####`) and the body (`###`).
- **Only chapter 2 has sub-groups.** There are 5 of them, modelled as `subthemes`.

### 1.3 Terms

- **17 terms, 2016-maj to 2024-maj.** All have a **complete A/B/C set** (answers PRD OQ-7).
- **No term after May–June 2024** (OQ-12). However, a margin note mentions a later written exam (§1.10).
- **By format era:** 14 terms are `pre-2023` (2016–2022) and 3 are `from-2023`.

### 1.4 Templates and question form (answers PRD OQ-8)

- **The booklet doesn't label each answer with its template,** but the structure is uniform:
  - **Situation answers:** 102/102 open with *Det kan der være flere grunde til.* and bold exactly *For det første | For det andet | Desuden | Så alt i alt* (template 1).
  - **General answers:** 51/51 open with *Der er både fordele og ulemper ved det* (sometimes "… for samfundet / virksomhederne / …"). 50/51 bold the template-2 connectives.
- **Two exceptions:**
  - **2022-nov-b general** (line 4491, p. 90) uses *En fordel for de store byer er, at | En fordel for de små byer kan være, at*.
  - **2023-nov-a sitB question** (line 2697, p. 56) has no "Hvorfor tror du": *Hvorfor bruger flere og flere videokonsultation med lægen?*
- **Conclusion:** template linking (US-020) can be derived by rule, without guessing.

### 1.5 Characters and orthography

Over the whole file:

| Check | Result |
|---|---|
| Arabic ي/ك, presentation forms, Arabic-Indic digits, tatweel, teh marbuta, alef maksura, ۀ | 0 |
| Bidi controls, NBSP, soft hyphen, zero-width space, BOM, tabs, control characters, HTML entities, U+FFFD | 0 |
| ZWNJ misuse (next to a space, punctuation or Latin letters; doubled) | 0 (1,234 ZWNJ in total) |
| Lines not in NFC; trailing spaces | 0 |
| Diacritics | Only normal Persian ones: tanwin-fath 51 (مثلاً) and kasra-ezafe 9 (سرِ) |
| Ezafe after heh | Consistently «ه‌ی» (153 times); no «هٔ» or «ۀ». A style point for `persian-localization-reviewer` only. |
| Digits | Both styles occur inside Persian text: Persian ۰–۹ 278 times, Latin 0–9 290 times (e.g. "16 موضوع"). Content keeps its digits (owner decision). |
| Quotes inside Danish fields | ASCII apostrophe in contractions (30'erne, CV'et, SU'en) and one `„bedst før“` |
| Persian fields with Latin runs | 25 of 882 (e.g. "folkeskole", "(sosu)"). The UI must isolate them (`<bdi>`). |
| TTS candidates | `fx` 34 times, `ca.` 3 times; 35 Danish fields contain digits |

### 1.6 Anomalies and how they were handled

| # | Where | What | Handling |
|---|---|---|---|
| A1 | t-N16A, line 1847, p. 39 | A 📌 note printed **inside** section B, after the follow-up. It explains "RKI", used in the answer above it. | Grammar extended deliberately. Modelled as a section-level margin note (`sectionId`). |
| A2 | t-M16C, line 2325, p. 48 | A 5th marker **🩺** ("this topic is your specialty, use nursing examples") | Grammar extended. `kind: "nursing"`. |
| A3 | 7 lines (§1.1) | Personal examples: 7 instead of 4, with 3 different labels | `label` kept verbatim |
| A4 | line 3997, p. 80 | One note contains two markers (🔁 … 📌 …) | Kept as one note. The inner 📌 stays in the text. |
| A5 | lines 2697, 4491 | Non-standard question and connective forms (§1.4) | None needed; reported |
| A6 | 39 follow-ups on 30 pages (14–96) | "Hvorfor / hvorfor ikke?" where SIRI prints "Hvorfor?/Hvorfor ikke?" (40 follow-ups use SIRI's form, 1 uses "Hvorfor/Hvorfor ikke?") | Kept verbatim. Expected `siriCheck: differs` once older booklets are checked (§4). |
| A7 | 11 answer pairs | Identical Danish answers in different topics (the booklet repeats them on purpose for recurring questions) | Separate IDs. Shared audio is optional (schema §10). |
| A8 | – | **No Persian translation of any model answer or follow-up answer** in the booklet | Schema requires `da` only. PRD US-017 ("each has a translation on request") can't be met for answers without writing new translations, which is a product decision. |

**No page break falls inside a single line or field.** 23 sections run across pages, but every field is on one line.

### 1.7 Appendix (anchor `appendix`, pp. 101–114)

**18 detailed topics from 2013–2015** (May–June 2013 to Nov–Dec 2015, all 6 terms complete A/B/C), plus a **titles-only table for 2004–2012** (line 5780, p. 113, onwards).

| | Main topics (2016–2024) | Appendix (2013–2015) |
|---|---|---|
| Header | anchor → `### title` → term line → Persian title | **emoji + term line first**, then `### title` and the Persian title. Only 6 of 18 have anchors (`app-N13A`, `app-N13B`, `app-M14A`, `app-M14C`, `app-N14A`, `app-N14C`), the ones the recurring table links to. |
| Situation titles | da + fa | **none** |
| Sections | `#### 🔴 … Situation A` etc. | `#### A 🔴`, `#### B 🔴`, `#### overordnet 🟡` |
| Required question | quoted da + fa | same (54 questions) |
| Key words | 3 | 3 (162 in total) |
| Model answer | yes | **none** |
| Follow-up | quoted da + fa + `↳` answer | **Danish only**, an unquoted `➕ …` line: no Persian, no answer |
| Situation intro | from SIRI (2024) or our own | none |

- **The same two-required-question skeleton applies.** That is also the expected interview shape (exam review Q6).
- **It lacks** model answers, follow-up translations and answers, situation titles and intros. Those exams also had the picture description first (p. 4, line 156).
- **Theme mapping by emoji works for 17/18.** "Offentlige ydelser" (2015-maj-c) uses 🏛️, which no chapter uses.
- **The 2004–2012 table** covers 17 terms × 3 titles. **Maj-Juni 2010 is missing** (the table goes from Nov-Dec 2009 to Nov-Dec 2010). It's titles only, from the paired-exam era, so it can never be used for mocks.
- **Status:** stays out of the app (owner decision). If it's ever used, it should be a separate `ArchiveTopic` type (schema §11.6).

### 1.8 Non-topic sections and how to model them

| Section | Pages / lines | Content | Proposed model |
|---|---|---|---|
| Cover and guide | pp. 1–3 | Claims; "what's in it" (4 bullets); **study method, 5 steps (lines 46–54)**; marker legend (7 rows); TOC | `study-method.json`, steps 1–4. **Step 5 (line 54, prediction) excluded** (D-15). The legend is UI knowledge, not content. |
| `siri` | pp. 4–6, lines 112–237 | Format table; level and grade bullets; the 7 delprøve 2 steps with SIRI quotes (intro line 140, situation example line 144, closing line 152); picture note; 4 examiner rules; **4 follow-up types table** (lines 176–181); BEK assessment quote (line 185); old assessment form; tips; **time-split table** (lines 225–235, labelled by the booklet as its own estimate) | Exam guide is app-authored from ABOUT (DL-034). Reuse the follow-up types table and the BEK quote with attribution. Time split: attributed, never a live timer (exam review). |
| `skeletons` | pp. 7–8, lines 241–296 | Template 1 (5 rows + example), template 2 (5 rows + grammar tip, no example), template 3 (6 cue → answer rows), V2 table (3 rows) | `templates.json` (schema §11.1). Needs `spoken` variants for TTS. |
| `universal` | pp. 9–10, lines 302–347 | 10 reasons (emoji + da + fa), 6 personal sentences, 9 rescue sentences (6 on p. 9, 3 on p. 10) | `toolbox.json` (schema §11.2) |
| `recurring` | pp. 99–100, lines 4879–4926 | Framing text (line 4885, **excluded**, D-15); 29 rows (da + fa label); 63 links with section (`overordnet`, `sit. A`, `sit. B`, or 📜 for the appendix) | `recurring.json` (schema §11.4). All 63 links resolve; 0 problems. |
| `vocab` | pp. 115–116, lines 5815–5896 | 30 words with (en)/(et)/(pl.), 20 verb phrases (9 + 11 across the page break), 5 sources | `vocabulary.json` (schema §11.3). Sources go to the attribution page. |

### 1.9 Answers to PRD open questions

| OQ | Answer |
|---|---|
| **OQ-1** situation titles | Yes, every situation (102) has a booklet title, da + fa. They are the booklet's descriptions, **not** SIRI's picture captions. For 2024 we now also have SIRI's spoken intro. |
| **OQ-2** review schedule | Line 52 says «هر فصل را روز ۱ → ۳ → ۷ → ۱۴ مرور کن», meaning review **each chapter** on day 1, 3, 7, 14. It doesn't say counting from what. The owner should confirm the reading. |
| **OQ-3** time split | Yes: lines 225–235. The booklet itself says it's an estimate that isn't in SIRI's booklet. |
| **OQ-6** pre-2023 fit | Structurally all 51 have the two-required-question shape. Exam fit is per the exam review. |
| **OQ-7** complete A/B/C | All 17 terms |
| **OQ-8** template per answer | Not labelled, but derivable by rule (§1.4) |
| **OQ-12** after May–June 2024 | No topics. One margin note refers to a 2026 written exam (§1.10). |
| **OQ-13** recurring table | Structured enough: 29 rows, 63 resolving links |

### 1.10 Confidentiality scan (exam review B1)

The rule (schema §9) over every line of the source:

| Line | Page | Hit | Verdict |
|---|---|---|---|
| 1689 | 36 | `Skriftlig 2026` (⭐ note, 2024-maj-b) | **True positive.** Now internal margin note `2024-maj-b.note1` with `confidentialityHits`; it can never be public. |
| 213 | 6 | `2025` (the October 2025 assessment guide isn't public) | Citation of a document, not exam content. A human decides if it's ever used. |
| 5892 | 116 | `2025` (SIRI guidance, January 2025, in sources) | Citation. Fine for an attribution page after review. |

**Also excluded from app content** (D-15, owner decision 2026-11-18):
- line 54, the "more likely to come up again" sentence in the study method
- line 4885, "memorise one answer for all recurring questions"

### 1.11 Danish vs the booklet PDF, all topics

This was a one-off check over all 51 topics and the appendix, in memory; nothing was written to `content/`. The pilot's own check is `check-pdf.ts`.

- **1,493/1,501 Danish strings match exactly on their PDF page.** That includes 6 personal examples whose final "." the RTL line moves to the front in the PDF text layer.
- **The 8 others are all text-layer artefacts:**
  - **4 bidi:** Persian fragments interleaved into the Danish line, or "?" moved to the front (p. 53, 75, 106, 108).
  - **2 hyphens at line end:** *online-nyheder* and *online-fællesskaber* (pp. 61, 63). The PDF writes *online-medier* mid-line on pp. 60–61, so the hyphenated compound is the author's form, and the Markdown is right.
  - **2 spacing artefacts:** *„bedst før“-datoen* (p. 68) and *'en børnecheck',* (p. 111, appendix).
- **There are no wording differences** between the Markdown and the PDF.

---

## 2. Schema summary

Full proposal: [schema-proposal.md](schema-proposal.md).

- **Files:**
  - one public file per topic (`content/topics/<id>.json`)
  - `themes.json`, `terms.json` (with format eras), `examiner-lines.json`
  - **internal** `content/internal/margin-notes.json`
  - `review-ledger.json` for human decisions
- **Topic:** `situations[A, B]` (title, **intro**, q1, key words, model answer with `emphasis` ranges, suggested follow-up(s), personal examples) + `general` (q2 …).
- **Per question and follow-up:** `siriCheck { status, sourceRef, checkedOn, siriParts }`, computed by the build. The booklet text is never overwritten.
- **Origins:**
  - booklet text has `source.pages`
  - SIRI text has `origin: "siri"` plus document and page
  - our text has `origin: "app"` and a required review
- **IDs:** dotted and structural. Every audio item has its own ID, about 24–25 per topic (schema §10).
- **Validation:** shape, IDs, references, script, origins, publishing gates, and the confidentiality rule over every public string.

---

## 3. Pilot results: May–June 2024

### 3.1 What was built

| Topic | Title | Theme / sub-theme | Booklet pages | Status | Intros | SIRI checks |
|---|---|---|---|---|---|---|
| `2024-maj-a` | Støtte til kultur | kultur | 97–98 | extracted | 2 × SIRI p. 6 | 6/6 match |
| `2024-maj-b` | Mangel på arbejdskraft | arbejde / Køn, sprog og udenlandsk arbejdskraft | 36–37 | extracted (2 informational notes) | 2 × SIRI p. 8 | 6/6 match |
| `2024-maj-c` | Pædagogik i folkeskolen | boern | 78–79 | extracted (1 informational note) | 2 × SIRI p. 10 | 6/6 match |

**Totals:**
- 3 topics, 104 IDs, 131 booklet strings (73 da, 58 fa)
- 6 SIRI intros
- 18 SIRI checks: 9 questions and 9 suggested follow-ups, all `matches`
- 4 examiner lines: 2 SIRI (intro, closing; verified on all 3 topic pages), 2 app (transition, "Tak."; `needs-review`)
- 3 internal margin notes (1 with a confidentiality hit)
- 10 themes, 1 term

**Why `extracted` and not `needs-review`:** nothing in the extraction is uncertain. The ledger notes are product decisions:
- **2024-maj-b:** the situation card text, and the nurse-specific example.
- **2024-maj-c:** situation B shows group work while its question is about grades. SIRI's own intro says the same, so the task is set that way, not a booklet error. The booklet's 📌 tip warns about it.

The next status step is the owner's Persian review.

**Files:**
- `content/topics/2024-maj-{a,b,c}.json`, `content/themes.json`, `content/terms.json`, `content/examiner-lines.json`, `content/internal/margin-notes.json`, `content/review-ledger.json`
- `docs/content/review/2024-maj-{a,b,c}.md`
- inputs: `scripts/content/data/siri-2024-maj.json`, `scripts/content/data/app-authored.json`

### 3.2 Fidelity (all PASS)

| Check | Result |
|---|---|
| Verbatim in the tag-stripped, whitespace-normalised source, **on the recorded line** | **131/131** (da 73, fa 58); theme strings 30/30 |
| Round trip: JSON re-rendered to Markdown equals the source blocks | **121/121 lines**, 3 blocks |
| Booklet PDF text, Danish | **73/73** (1 personal example with the RTL final-period artefact, reported) |
| SIRI 2024 PDF text: transcription | **32/32** strings (29 contiguous; 3 rejoined text-layer line swaps on pp. 7, 8, 10, and only that exact pattern is accepted); document SHA-256 matches |
| SIRI wording quoted in ABOUT §3.4 | 4/4 questions found verbatim. SIRI's picture captions are correctly *not* in the content. |
| Validation | 0 errors |
| Idempotency | 14 output files byte-identical on re-run |

**Persian was not compared with the PDF:** PDFKit returns it fragmented and partly as presentation forms. It *was* checked to be verbatim from the Markdown, NFC, without Arabic ي/ك or presentation forms, with correctly placed ZWNJ. **The owner's review is the Persian fidelity gate.**

### 3.3 Mutation tests (the checks catch real errors)

| Corruption introduced | Caught by |
|---|---|
| One ZWNJ in a Persian key word replaced by a space | verbatim + round trip |
| A model-answer emphasis range shifted by 1 | **round trip only** |
| A key word removed | **round trip only** |
| The word *endnu* deleted from a SIRI intro | SIRI PDF check + content-consistency check. A first version of the check accepted it through its line-swap fallback; it was tightened to accept only the exact swap pattern. |
| The owner ticks a box on a review page | The build keeps the page (`kept-human-edits`). `--force-review` regenerates it. |

### 3.4 Review pages

`docs/content/review/2024-maj-{a,b,c}.md` show, in reading order:
- every field with its ID, its booklet page and a checkbox
- Danish and Persian in correctly directed blocks
- bold connectives
- SIRI intros and SIRI check results under every question and follow-up
- the pipeline notes
- margin notes in a separate "internal, NOT shown in the app" section

There are 33–34 checkboxes per topic. The owner's estimated time is **10–15 minutes per topic**.

---

## 4. Verification against SIRI's examiner booklets

### 4.1 May–June 2024 (done)

- All 9 required questions and 9 suggested follow-ups match SIRI word for word.
- SIRI prints 4 of the follow-ups as two quoted parts ("…?" + "Hvorfor?/Hvorfor ikke?"), which the booklet joins. That is kept as `siriParts`.
- Intros and examiner lines were taken verbatim, with pages.
- Source: https://danskogproever.dk/media/prob2ifo/censor-og-eksaminatorhaefte-pd3-mdt.pdf (12 pages, SHA-256 `d4f62051…`, retrieved 2026-11-18).

### 4.2 Known and expected public booklets

| Term(s) | Status | Location |
|---|---|---|
| May–June 2024 | **Known, verified, used** | danskogproever.dk (above). Official host. |
| Nov–Dec 2019 | **Known, downloaded, compared** (§4.3) | https://sokolova.dk/2019-nov-censor-mundtlig.pdf (SHA-256 `aa9265c2…`). **Third-party mirror:** the PDF looks like SIRI's, but authenticity should be confirmed, ideally against an official or archived copy. |
| Other 2016–2023 terms (15) | **Expected to have been public; locations not verified** | Exam sets were published every term until winter 2024 (ABOUT §6, "Past exam sets: Published"). Where to look: the Wayback Machine for danskogproever.dk, siri.dk and nyidanmark.dk; teachers' sites and mirrors like the one above; SIRI on request. |
| 2013–2015 | Expected (the booklet's author used them: sources, p. 116; appendix intro) | Same; not needed while the appendix is out of the app |
| From Nov–Dec 2024 | **Confidential**, never to be used | – |

### 4.3 Nov–Dec 2019, topic B (*Kostvaner og livsstil*): confirmed differences

| Booklet line | Booklet | SIRI 2019 (p. 8) |
|---|---|---|
| 2417 (sitA q1) | De fleste spiser fx slik eller chips eller drikker cola mellem hovedmåltiderne … | De fleste **mennesker** spiser fx slik eller chips eller drikker **fx** cola mellem hovedmåltiderne … |
| 2429 (sitA follow-up) | … eller drikke cola en gang imellem? **Hvorfor / hvorfor ikke?** | … eller drikke **fx** cola en gang imellem? **Hvorfor?/Hvorfor ikke?** |
| 2437 (sitB q1) | Hvorfor tror du, de ikke gør det? | Hvorfor tror du **ikke**, de gør det? |

The 2019 booklet also confirms the older format:
- a different intro phrase
- the request *"Vil du godt beskrive kort, hvad der sker i de to situationer?"*
- the examiner choosing question A or B, with no situation intro

**Takeaway:** for 2016–2023, `siriCheck` must be run before any question is called "official wording". A39 suggests that differences in the "Hvorfor?/Hvorfor ikke?" tag will be common.

### 4.4 Effort for older terms (estimate)

**Per term (6 questions + 6 follow-ups; plus 6 intros for 2023):**
- find the booklet: 0.5–2 h, very uncertain
- download, hash, extract and transcribe: about 1 h
- check, then review the differences with `pd3-exam-expert`: about 0.5–1 h

That is **about 2–4 hours per term, or 4–8 working days for all 16 older terms** if the booklets can be found. Transcription is mechanical and checked by `check-siri.ts`. The search is the unknown.

---

## 5. Full parse: effort and risks

### 5.1 Effort

| Work | Estimate | Notes |
|---|---|---|
| Build all 51 topics | **under 1 day** | The grammar already accepts all 51 (survey). It needs a `--all` mode and terms/themes for all 17 terms. |
| Non-topic sections (templates, toolbox, vocabulary, recurring, study method) | 1–2 days | Small, regular blocks (§1.8). `spoken` variants are separate. |
| SIRI checks for 2016–2023 | 4–8 days | §4.4. Depends on finding the booklets. |
| App-authored intros, 2016–2022 (+ 2023 if not found) | about 1 day of drafting, plus review | 14–16 terms × 3 × 2 = **84–96 sentences**, origin `app`. `danish-language-reviewer` + owner. |
| `spoken` variants for template and toolbox stems | 0.5 day + review | With `speech-engineer` |
| **Owner Persian review** | **about 9–13 hours in total** | 882 Persian fields in 51 topics, about 10–15 min per topic, plus margin-note decisions (45 notes, about 1 h) |
| Move to Zod + `tsx` + `content:validate` at scaffolding | 0.5–1 day | Types already mirror the proposal |

### 5.2 Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-C1 | Older SIRI booklets can't be found, so pre-2024 wording stays `unchecked` | Medium-High | Medium | Show "official wording" only where `siriCheck: matches` (PRD §6.7). The UI copy for unchecked items is a product decision. |
| R-C2 | Systematic wording drift in older terms (A6, §4.3) | High | Medium | Corrections next to the original; OQ-17 decides display |
| R-C3 | Margin notes or other booklet text leak confidential exam content | Low (scan: 1 hit) | High | Internal file and the confidentiality rule on every public string. Keep the rule in CI. |
| R-C4 | The owner is the only Persian reviewer (PRD R11) | High | Medium | Review pages with ticks protected from regeneration; a second reviewer (D-14) |
| R-C5 | App-authored intros are mistaken for exam text | Medium | Medium | `origin: "app"` is required and validated; the UI labels by origin |
| R-C6 | Source revision (a new booklet edition) shifts structure or numbering | Low | High | The strict grammar fails loudly. IDs come from structure, numbering is never reused, and ledger hashes invalidate stale approvals. |
| R-C7 | The repository becomes public with booklet text in it | Low | High | Keep the repo private (DL-009). `content/`, `docs/content/review/` and `docs/resources/` all contain booklet text. |
| R-C8 | Third-party mirrors serve altered PDFs | Low | Medium | Record SHA-256; prefer official or archived copies |

---

## 6. Open questions

**For the owner**
1. **Situation card text** (OQ-1/D-4): the booklet title, SIRI's picture caption (known only for 2024-maj-b), or the intro?
2. **Answers have no Persian translation in the booklet** (A8). US-017 promises one for follow-up answers. Drop the promise, or commission translations (app-authored and reviewed)?
3. **Nurse-specific content:** 7 personal examples, the 🩺 note, and the ⭐ note (already internal). Show them to everyone, label them, or hide them?
4. **Margin notes:** approve any for public use? The 📌 tip in 2024-maj-c is a good candidate.
5. **Review schedule reading** (OQ-2): "each chapter on day 1, 3, 7, 14" (line 52). Is that how you read it?
6. **The repository must stay private** until permission is given (R-C7). Is that agreed?

**For `software-architect`**
- OQ-A1 to OQ-A6 in [schema-proposal.md §14](schema-proposal.md#14-open-questions): structured review notes, the separate ledger with `contentHash`, the location of `content/internal/`, the file granularity, `TextRange` units, and where pipeline inputs live.

**For `pd3-exam-expert`**
- **E1:** use SIRI's 2024 intro phrase for pre-2023 topics too?
- **E2:** is the 2019 drift (§4.3) typical? Which differences matter for learners?
- **E3:** final wording for `examiner.transition`.
- **E4:** authenticity of the 2019 mirror copy.
- **E5:** check the time-bound premises flagged in the exam review (lines 1397, 3347, 4133) when those topics are built.

**For `speech-engineer`**
- OQ-S1 to OQ-S4 (schema §14): `spoken` variants, shared audio for identical answers, pauses between SIRI's quoted parts, and the `fx`/`ca.` lexicon.
- **Size for the dry run:** 1,078 Danish items and 124,752 characters, plus about 102 intros.
