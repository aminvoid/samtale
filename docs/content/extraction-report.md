# Content extraction report

| | |
|---|---|
| **Author** | `content-engineer` |
| **Updated** | 2026-11-21 (full phase: all 51 topics) |
| **Reproduce** | `npm run content:extract`, `npm run content:validate`, `npm run content:check`, `npm run content:check:pdf` (local) |
| **Read with** | [pipeline.md](pipeline.md), [schema-proposal.md](schema-proposal.md), [pilot-report.md](pilot-report.md), review pages in [review/](review/) |

## Counts

| | |
|---|---|
| Topics | 51 (17 terms × A/B/C); appendix out (D-3) |
| By status | **approved 3** (2024-maj-a/b/c, by delegation), **needs-review 3** (2019-nov-a/b/c: SIRI differences), **extracted 45** |
| By theme | arbejde 16, uddannelse 6, sundhed 5, medier 5, klima 5, boern 4, krim 3, bolig 3, frivillig 2, kultur 2 |
| By format era | pre-2023: 42 topics (14 terms); from-2023: 9 topics (3 terms) |
| Stable IDs | 1,449 (82 registered as published: the 3 approved topics) |
| Situation intros | 6 SIRI (2024, approved); 96 app-written (2016–2023, needs-review) |
| SIRI wording checks | 36 checked (2024: 18 match; 2019: 11 match, 7 differ); 270 unchecked (no public booklet found) |
| Spoken overrides | 64 follow-ups ending "Hvorfor?/Hvorfor ikke?" or a variant |
| Topic links | 41 links from 🔁/🔗 notes; 23 similar-question groups (main topics only) |
| Correction notes | 23 (17 Danish naturalness, 5 Persian translation, 1 terminology), all on the pilot; none applied |
| Margin notes | 45, all internal; 1 confidentiality hit (`2024-maj-b.note1`, p. 36) |
| Examiner lines | 5, all approved by delegation: sound check (app), intro (SIRI), transition (app), "Tak." (app), closing (SIRI) |

**Failures:** none. Parse, validation, fidelity (2,201 strings, 2,041 lines), PDF (1,231 Danish strings) and SIRI (50 strings) checks all pass. Output is deterministic (109 files).

## Delegated approvals (owner to see)

Every approval below was made under the owner's delegation (decision log rev. 3.3) and carries `reviewedBy: "delegated-agent-review"`:

| Item | Date | Basis |
|---|---|---|
| Topics 2024-maj-a, -b, -c | 2026-11-20 | Danish fidelity clean (Danish pilot review); Persian signed off by `persian-localization-reviewer` after visual comparison with PDF pp. 36–37, 78–79, 97–98 (Persian pilot review); SIRI text verified by `pd3-exam-expert` (exam review of mock rules). Bound to content hashes in the ledger. |
| Their 6 SIRI intros | 2026-11-20 | Same reviews |
| Examiner lines intro and closing | 2026-11-20 | Verified verbatim against SIRI 2024 (closing now cites pp. 5, 7, 9, 11) |
| Examiner lines transition, "Tak.", sound check | 2026-11-20 | DL-050 / DL-021; Danish review (the sound-check wording is the Danish reviewer's own proposal) |

Still open on the pilot: D-01 to D-05 need one Afghan (Dari) reader.

## SIRI verification (D-17 / DL-046)

**Booklets searched on 2026-11-21:** SIRI and danskogproever.dk, Studieskolen (its 2023 folder only ever held the written-part booklet, and now returns 404), nyidanmark.dk and the Wayback Machine's indexes for those hosts, plus web search. Found for the oral part: only 2009 (out of scope), Nov–Dec 2019 (third-party copy) and May–June 2024 (official). **No 2023 booklet**, so all 2023 intros are app-written.

| Term | Source | Authenticity | Result |
|---|---|---|---|
| 2024-maj | danskogproever.dk | official | 9 questions + 9 follow-ups match; 6 intros taken verbatim |
| 2019-nov | sokolova.dk | **unconfirmed** | 11 match, 7 differ (below) |
| 15 other terms | none found | – | `unchecked` |

**Nov–Dec 2019 differences** (booklet text kept, SIRI's wording stored alongside in `siriCheck.siriParts`; topics set to needs-review):

| Item | Page | Booklet | SIRI 2019 |
|---|---|---|---|
| 2019-nov-b.sitA.q1 | 50 | *De fleste spiser … drikker cola …* | *De fleste **mennesker** spiser … drikker **fx** cola …* |
| 2019-nov-b.sitA.followup1 | 50 | *… drikke cola … Hvorfor / hvorfor ikke?* | *… drikke **fx** cola … Hvorfor?/Hvorfor ikke?* |
| 2019-nov-b.sitB.q1 | 50 | *Hvorfor tror du, de ikke gør det?* | *Hvorfor tror du **ikke**, de gør det?* |
| 2019-nov-a.sitA.followup1, 2019-nov-a.general.followup1, 2019-nov-b.sitB.followup1, 2019-nov-c.general.followup1 | 32–33, 50–51, 87–88 | *… Hvorfor / hvorfor ikke?* | *… Hvorfor?/Hvorfor ikke?* (tag only) |

The tag-only pattern is systematic: 39 follow-ups in the booklet use "Hvorfor / hvorfor ikke?". Expect the same difference wherever older booklets are found.

## Situation intros written for 2016–2023 (DL-045)

96 sentences in `scripts/content/data/app-authored.json`, one per situation, in the style of SIRI's 2024 "Forslag til indledning" ("Situation A viser …"). Written only from the booklet's own situation title. For 19 titles that are ambiguous on their own, the situation's question was read so the two don't contradict each other. Two titles don't describe a scene, so the intro says "handler om …" or stays generic: 2023-nov-c.sitB ("Situation B handler om flyrejser og klimaet.") and 2021-maj-c.sitB. All have status `needs-review`; each review page shows them marked "WRITTEN FOR THE APP".

## Needs human review

| What | Where | Who |
|---|---|---|
| 96 app-written intros | `scripts/content/data/app-authored.json`; each review page | `danish-language-reviewer` (language), `pd3-exam-expert` (fit with the question) |
| 2019 SIRI differences: which wording the app shows (OQ-17 / DL-072: booklet text main, "SIRI's wording differs slightly" disclosure) | 2019-nov-a/b/c, pp. 32–33, 50–51, 87–88 | `pd3-exam-expert`, then approve |
| Authenticity of the 2019 copy | `siri-2019-nov.json` | owner or `pd3-exam-expert` (an official or archived copy) |
| Persian of 48 topics (882 − 58 strings) | review pages | `persian-localization-reviewer` (delegated), Afghan reader for Dari points |
| Danish of 48 topics | review pages | `danish-language-reviewer` |
| D-01 to D-05 (Dari) | pilot | one Afghan reader |
| Margin note `2024-maj-c.note1`, candidate for public use with P-03 | internal | delegated decision (D-21) |

## Known issues outside `scripts/content`

- **`scripts/audio` (speech-engineer):** `scripts/audio/lib/load.ts` adds the sound-check line from the exam config as an "extra" line "not in content/ yet". It is now in `content/examiner-lines.json` with the same ID and text, so `collectItems` reports a duplicate and `scripts/audio/lib/items.test.ts` fails (1 of 255 tests). The fix is to drop the extra line there (and in its test) and read it from content.
- **`content:build` is still the scaffold stub.** ADR-0002's allow-list projection (read model, release channels, gates) is the next content task. The authoring data it needs is now complete: approved topics, intros, SIRI checks, topic links, published IDs.
