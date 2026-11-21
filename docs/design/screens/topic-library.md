# Visual spec: Topic library (themes, theme page, terms, search)

| | |
|---|---|
| **UX spec** | [../../ux/screens/topic-library.md](../../ux/screens/topic-library.md) |
| **Routes** | `/fa/topics`, `/fa/topics/themes/{themeId}`, `/fa/topics/terms`, `/fa/topics/terms/{termId}`, `/fa/topics/search?q=` |
| **Components** | PageHeader, SearchField, ResultsCount, SegmentedNav, ThemeCard, FilterChips, TopicListItem, TermJumpList, TermGroup, EraDivider, ListInfoButton, TermLabel, Pre2023Badge, PracticeStatus, EmptyState, BackLink |

## Library header (all views)

- `h1` «موضوع‌های <bdi lang="da">delprøve 2</bdi>» `text-h1`; subtitle «موضوع‌های آزمون‌های گذشته، ۲۰۱۶ تا ۲۰۲۴» `text-lead text-text-muted`.
- SearchField full width, `mbs-4`.
- SegmentedNav «موضوع‌ها» · «دوره‌های آزمون» · «سؤال‌های مشابه», `mbs-4`, full width at 375 (three equal segments).

## 375 px

| View | Spec |
|---|---|
| Themes | ThemeCards, one per row, 12 px gap. Each 96 px min: icon tile at the right, Persian name, Danish name, count, chevron at the left. |
| Theme page | BackLink «موضوع‌ها» · `h1` Persian theme name · Danish name `text-da-card text-text-muted` flow-aligned · FilterChips (work theme only; «همه» first, wrapping) · tertiary «تمرین این موضوع به‌صورت آزمون» · ListInfoButton beside the list heading · TopicListItems, 12 px apart. |
| Terms | TermJumpList (wrapping chips) · TermGroups newest first; group heading = TermLabel link `h2` with a chevron; rows A/B/C as link cards with a 32 px letter tile. **EraDivider** once, between Maj–Juni 2023 and Nov–Dec 2022: a full-width rule with the two chips and the info button. Rows below the divider carry no badge. |
| Term page | One TermGroup, with Pre2023Badge (explained) on the heading where it applies. |
| Search | ResultsCount under the field; TopicListItems with an extra line «پیدا شد در: سؤال موقعیت B» (`text-caption`, `search` 16) linking to the section. No results: EmptyState «موضوعی برای «…» پیدا نشد.» + tertiary «مرور بر اساس موضوع». |

## 1280 px

- Reading frame `max-inline-page`; header block in the start two-thirds; SearchField 480 px wide beside the SegmentedNav on one row.
- Themes: three ThemeCards per row (grid, 24 px gap).
- Theme page: work theme: filter column on the start side (240 px) with the sub-themes as a vertical list of chips; list in the main column (`max-inline-reading`).
- Terms: each TermGroup is a full-width row: heading on its own line, then three link cards in three columns, **A on the right**, B middle, C left.

## States (visual)

| State | Look |
|---|---|
| Loading (after delay) | Skeleton cards at ThemeCard / TopicListItem size, static |
| Storage unavailable | No PracticeStatus; nothing else |
| Practised / ready to review | PracticeStatus caption / the «آمادهٔ مرور» chip in the meta row |
| Search typing | List updates in place; no spinner (results are local) |

## RTL and bidi

Danish names on their own line, flow-aligned. Term labels Latin. Counts Persian digits. Chevrons mirrored; the search icon isn't.
