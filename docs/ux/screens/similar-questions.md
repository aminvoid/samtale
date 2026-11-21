# Screen: Similar questions

| | |
|---|---|
| **Route** | `/fa/topics/similar` |
| **Stories** | US-007 (Should), US-064 #1 and #6, GA-10 |
| **Decisions** | D-15 (the booklet's framing at line 4885 and its prediction at line 54 are never shown), D-21 (margin-note text never shown) |
| **Content** | `recurring.json` (schema §11.4): 29 rows, each with a Danish and Persian label and links to topic sections |
| **Flows** | [browse-and-find-topic](../flows/browse-and-find-topic.md) |
| **Milestone** | M3 |

## Purpose

Show which similar questions came up in more than one published exam, so the learner can prepare **one set of ideas that covers several topics**, without implying any question is more likely to come up (PRD §6.7).

## Content hierarchy

1. Library header with the view switch (Similar questions selected)
2. `h1` "Similar questions in several exams"
3. **Our framing** (app wording; US-007 #2): a similar question came up in more than one published exam between 2016 and 2024; studying them together is efficient because one set of ideas covers several topics.
4. **Note** (US-007 #3), a short InfoNote: since winter 2024 SIRI reuses confidential tasks from a closed bank that nobody outside knows; the app's questions come from published exams up to May–June 2024, which SIRI says may be used in teaching.
5. **Rows** (29, in the booklet's order): Danish label (e.g. *30 timers arbejdsuge*), Persian label, then links, one per occurrence: "Maj–Juni 2019 · B · general question", "Maj–Juni 2022 · A · general question". Links to unpublished topics (appendix; topics not yet approved) are omitted; a row with no published link left is hidden (US-007 #4, US-064 #1).

## Components

PageHeader, SegmentedNav, InfoNote, SimilarRow, SectionLink (TermLabel + part label). Rev. 2 (R-05): no badge inside links; the term label already shows the era. Row data comes from the booklet table (`recurring.json`); topic-to-topic links on topic pages come from `content/topic-links.json`.

## States

| State | Behaviour |
|---|---|
| First-time | As above. |
| Loading | Server-rendered list. |
| Empty | During pilot content, rows with no published link are hidden; if none remain: "Similar questions will appear here as more topics are published." with a link to themes. |
| Error | E1. |
| Slow network | Text only. |
| Microphone denied / storage unavailable | Not applicable. |

## Responsive behaviour

| Width | Layout |
|---|---|
| 375 | One row per card: labels on top, links stacked as full-width rows (44 px targets). |
| 768 | Links wrap two per line. |
| 1280 | A two-column table-like layout: labels in the start column (right), links in the end column. |

## RTL and bidi

- Row labels: Danish on its own line (`lang="da"`), Persian beneath (`lang="fa"`).
- Link text mixes a Danish term label with a Persian part label («بخش کلی»). Build it from separate elements (TermLabel isolated, then the part label), never by concatenating strings (i18n rules). Use an ICU message with the term label as an isolated argument.
- Link chevrons mirror.

## Accessibility

- Each row is a list item with a heading-level label (`h2` per row would be too many; use a list with the Danish label as the item's first text, and the links in a nested list).
- Each link's accessible name: "{term label}, topic {letter}, {part}" with the term label marked `lang="da"`.

## Copy needs

| Key | Intended meaning |
|---|---|
| `similar.title` | Similar questions in several exams |
| `similar.intro` | A similar question came up in more than one published exam between 2016 and 2024. One set of ideas covers several topics, so studying them together is efficient. |
| `similar.confidentialityNote` | Since winter 2024, SIRI reuses confidential tasks from a closed bank that nobody outside knows. Our questions come from published exams up to May–June 2024, which SIRI says may be used in teaching. |
| `similar.link` | {termLabel} · {letter} · {part} |
| `similar.empty` | Similar questions will appear here as more topics are published. |

**Never in copy:** "recurring", "comes up often", "likely", "memorise one answer" (D-15, GA-10). `persian-localization-reviewer` checks that the Persian avoids «تکراری» in the sense of "will repeat".

## Wireframe

**375 px**
```
┌─────────────────────────────────────┐
│ •Similar questions │ Terms │ Themes │
│   Similar questions in several exams│ h1
│  A similar question came up in more │
│ than one published exam (2016–2024).│
│ One set of ideas covers several     │
│                              topics.│
│ ⓘ Since winter 2024 SIRI reuses     │
│   confidential tasks … teaching.    │
│ ┌─────────────────────────────────┐ │
│ │        [da: 30 timers arbejdsuge]│ │
│ │                  30-hour work week│ │
│ │ ‹ [da: Maj–Juni 2019 · B]·general│ │
│ │ ‹ [da: Maj–Juni 2022 · A]·general│ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │      [da: Dansk på arbejdspladsen]│ │
│ │             Danish at the workplace│ │
│ │ ‹ [da: Maj–Juni 2020 · C]·sit. A │ │
│ │   (2 appendix links hidden)      │ │  ← not shown to learners; note for devs
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```
