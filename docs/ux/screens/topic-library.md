# Screen: Topic library (themes, theme page, terms, search)

| | |
|---|---|
| **Routes** | `/fa/topics` (themes), `/fa/topics/themes/{themeId}`, `/fa/topics/terms`, `/fa/topics/terms/{termId}`, `/fa/topics/search?q=` |
| **Stories** | US-005, US-009 (Must); US-006, US-008, US-010 (Should); US-064 #1; US-066 |
| **Flows** | [browse-and-find-topic](../flows/browse-and-find-topic.md) |
| **Milestone** | M1 (themes, labels); M3 (terms, search, status) |

## Purpose

Find a past delprøve 2 topic quickly by theme, exam term or a remembered word, and see at a glance which ones you've practised.

## Content hierarchy

**Library header (all views)**
1. `h1` "Delprøve 2 topics" (IA §8: named so delprøve 1 can sit beside it later)
2. One line: "Past exam topics, 2016–2024" (PRD §6.7)
3. Search field (US-008)
4. View switch: **Themes** · **Exam terms** · **Similar questions** (links styled as a segmented control; each is a URL)

**Themes view** (`/fa/topics`)
- 10 ThemeCards (only themes with published topics; US-005 #5): decorative theme icon, Persian name, Danish name, "{count} topics" (counted from content; US-005 #1)

**Theme page** (`/fa/topics/themes/{themeId}`)
1. Back link "‹ Topics" · `h1` Persian theme name · Danish theme name
2. Sub-theme filter chips for the work theme only (`?sub=`; "All" first)
3. Optional "practise this theme as a mock exam" link (US-040 #2)
4. TopicListItems, newest term first (US-005 #3)

**Terms view** (`/fa/topics/terms`)
- A compact **term jump list** at the top (rev. 2, R-29)
- Terms newest first; each a TermGroup whose heading is a **link** to the term page, with its term label (UXD-22) and its topics as rows labelled A, B, C (US-006 #1); only published topics (US-006 #2)
- **One era divider** between Maj–Juni 2023 and Nov–Dec 2022 (rev. 2, R-17): "Today's format (from Maj–Juni 2023)" above, "Older format (before Maj–Juni 2023)" below, with an info button that opens the US-009 #3 explanation. Rows below the divider carry no badge in this view.

**Term page** (`/fa/topics/terms/{termId}`): the same group alone, with the pre-2023 label on the term heading where it applies.

**Search** (`/fa/topics/search?q=`)
- The field, a result count (visually and in a polite live region after typing stops; US-008 #4), and TopicListItems with a "matched in: situation B's question" line linking to the section fragment

**TopicListItem** — one link, **no interactive control inside it** (rev. 2, R-05)
- Danish topic name (primary, LTR) · Persian name · term label and letter · the pre-2023 label as **plain text** ("older format") · PracticeStatus ("practised 2 times · 3 days ago" or "ready to review"; US-010)
- The pre-2023 explanation lives at list level: an **info button next to the list heading** on theme and search pages ("What does 'older format' mean?"), the era divider in the terms view, the topic page header and the mock reveal.

## Components

PageHeader, SearchField, ResultsCount (live), SegmentedNav, ThemeCard, FilterChips, TopicListItem, TermGroup, TermLabel, Pre2023Badge (+ explanation Disclosure), PracticeStatus, EmptyState, BackLink.

## States

| State | Behaviour |
|---|---|
| First-time | No practice status; no empty-progress messages. |
| Loading | Server-rendered lists; skeleton rows only after a delay (errors-and-recovery "common states"). |
| Empty | Theme with no published topics doesn't appear. Search with no results: "No topics found for «{query}»." + "Browse by theme" (US-008 #3). During pilot content (M1), counts are small but honest. |
| Error | E1. Unknown theme or term → not-found page. |
| Slow network | Text lists only; no audio, no images (US-005 #6). |
| Microphone denied | Not applicable. |
| Storage unavailable | No PracticeStatus; no notice here (US-010 #3, US-050 #1). |
| Search typing | Results update after a short pause; the count is announced once per pause, not per keystroke. |

## Responsive behaviour

| Width | Layout |
|---|---|
| 375 | Single column. Search field full width under the `h1`. View switch scrolls horizontally only if labels don't fit at 200% text (they wrap first). ThemeCards one per row; TopicListItems full width. |
| 768 | ThemeCards two per row; topic list single column. |
| 1280 | ThemeCards three per row. Theme page: optional filter column on the start side (right) for the work theme's sub-themes; list in the main column. Terms view: three-column rows (A · B · C) per term. |

## RTL and bidi

- Danish topic and theme names: `lang="da"`, `dir="ltr"`, isolated. In a list item, the Danish name is on its own line, so no mixed-direction line is needed.
- Term label (`Maj–Juni 2024 · B`) is rendered as a Danish proper name with Latin digits (UXD-22; UX-OQ-09). The letter A/B/C stays Latin (US-053 #3).
- Counts and relative dates use Persian digits (D-2).
- Search input: `dir="auto"` so Persian and Danish queries each display in their own direction (US-008 #5); the query echoed in "No topics found for «…»" is isolated.
- Chevrons on rows mirror (point left). Search icon isn't mirrored.

## Accessibility

- `h1` per page; ThemeCards and TopicListItems are single links whose accessible name begins with the visible Danish name (`lang="da"`), then the Persian name, term and status.
- The view switch is a `nav` with `aria-current="page"` on the current view (they are links, not tabs, because each has its own URL).
- Search field has a visible label; results count in a polite live region, debounced (US-008 #4).
- Filter chips are toggle buttons with `aria-pressed`, or links if they change the URL (recommended: links, `?sub=`).
- No disclosure inside a list-item link (rev. 2, R-05). The pre-2023 explanation is a Disclosure **outside** the list (UXD-27).
- Long lists: the term jump list and linked term headings let keyboard users skip ahead (R-29).

## Copy needs

| Key | Intended meaning | Draft |
|---|---|---|
| `library.title` | Delprøve 2 topics | – |
| `library.subtitle` | Past exam topics, 2016–2024 | – |
| `library.view.themes` / `.terms` / `.similar` | Themes · Exam terms · Similar questions | – |
| `library.theme.count` | {count, plural, other {# topics}} | – |
| `library.theme.all` | All | – |
| `library.theme.practiseMock` | Practise this theme as a mock exam | – |
| `library.search.label` | Search topics in Danish or Persian | – |
| `library.search.placeholder` | e.g. sundhed, سلامت | – |
| `library.search.count` | {count, plural, =0 {No topics found} other {# topics found}} | – |
| `library.search.noResults` | No topics found for «{query}». | – |
| `library.search.browseInstead` | Browse by theme | – |
| `library.search.matchedIn` | Matched in: {part} | – |
| `labels.pre2023` | Older format (before {termLabel}), with `termLabel` = `Maj–Juni 2023` as an isolated Danish TermLabel, so the year keeps Latin digits (rev. 2, R-17; replaces the PRD draft «… در ۲۰۲۳») | – |
| `labels.pre2023.short` | Older format (plain text in list items) | – |
| `labels.pre2023.explain` | Four sentences per US-009 #3, plus: "In the mock exam this topic runs in today's format." and a link to the guide (R-17) | – |
| `labels.pre2023.whatIs` | What does "older format" mean? | – |
| `library.era.current` / `.older` | Today's format (from {termLabel}) · Older format (before {termLabel}) | – |
| `library.terms.jump` | Jump to a term | – |
| `labels.part.sitA` / `.sitB` / `.general` | Situation A · Situation B · The general question | – |
| `progress.status.practised` | Practised {count, plural, other {# times}} · {relativeDate} | – |
| `progress.status.readyToReview` | Ready to review | «آمادهٔ مرور» |

## Wireframes

**375 px, themes view**
```
┌─────────────────────────────────────┐
│ [≡]                        App name │
├─────────────────────────────────────┤
│              [da: Delprøve 2] topics│ h1
│         Past exam topics, 2016–2024 │
│ ┌─────────────────────────────────┐ │
│ │ 🔍         Search (da or fa)    │ │
│ └─────────────────────────────────┘ │
│  Similar questions │ Terms │•Themes │
│ ┌─────────────────────────────────┐ │
│ │ ‹            (icon) Work and the│ │
│ │                   labour market │ │
│ │ [da: Arbejde og arbejdsmarked]  │ │
│ │                       16 topics │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ‹  (icon) Education and student │ │
│ │                            life │ │
│ │ [da: Uddannelse og studieliv]   │ │
│ │                        6 topics │ │
│ └─────────────────────────────────┘ │
│   …                                 │
├─────────────────────────────────────┤
│ Guide Templates [Mock] •Topics Home │
└─────────────────────────────────────┘
```

**375 px, theme page (work)**
```
┌─────────────────────────────────────┐
│                           › Topics  │ back link (mirrored arrow)
│        Work and the labour market   │ h1
│     [da: Arbejde og arbejdsmarked]  │
│ [Pension] [Work time] [Job] [•All]  │ chips (wrap)
│ ┌─────────────────────────────────┐ │
│ │ ‹ [da: Mangel på arbejdskraft]  │ │
│ │                 Labour shortage │ │
│ │ [da: Maj–Juni 2024 · B]         │ │
│ │       Practised 2 times · 3d ago│ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ‹ [da: Ældre på arbejdsmarkedet]│ │
│ │        Older people at work     │ │
│ │ [da: Nov–Dec 2017 · A]          │ │
│ │  Older format  (plain text)     │ │
│ │                 Ready to review │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```
*(Topic names other than 2024-maj-b are placeholders.)*

**1280 px, terms view**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                      [da: Delprøve 2] topics            h1    │
│  [🔍 Search …………………………………………]     Similar questions │ •Terms │ Themes     │
│  ── [da: Maj–Juni 2024] ──────────────────────────────────────────────────── │
│   C [da: Pædagogik i folkeskolen]  B [da: Mangel på arbejdskraft]  A [da: Støtte til kultur] │
│  ── [da: Nov–Dec 2023] ───────────────────────────────────────────────────── │
│   …                                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```
