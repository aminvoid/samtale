# Visual spec: Similar questions

| | |
|---|---|
| **UX spec** | [../../ux/screens/similar-questions.md](../../ux/screens/similar-questions.md) |
| **Route** | `/fa/topics/similar` |
| **Components** | Library header (SegmentedNav), PageHeader, InfoNote, SimilarRow, SectionLink, TermLabel |

## 375 px

- Library header with «سؤال‌های مشابه» current.
- `h1` «سؤال‌های مشابه در چند آزمون» `text-h1`.
- Our framing paragraph `text-body`.
- Confidentiality note: InfoNote standard (`info`).
- **SimilarRows** as cards (`bg-surface-raised border border-border rounded-card p-4`), 12 px apart: Danish label `text-da-card` flow-aligned · Persian label `text-ui text-text-muted` · a nested list of SectionLinks, each a full-width 44 px row: TermLabel · «· B · سؤال کلی» · chevron (mirrored), separated by 1 px `border-border`.
- No count badge, no "recurring" icon, no frequency indicator (D-15): rows look equal, whatever the number of occurrences.

## 1280 px

A table-like two-column list inside `max-inline-page`: start column (right, 40 %) holds the Danish and Persian labels; end column holds the links, wrapping two per line as chip-links (`rounded-chip border border-border px-3`, 44 px). Rows separated by 1 px rules, 20 px vertical padding.

## States

Empty (pilot): EmptyState «سؤال‌های مشابه با انتشار موضوع‌های بیشتر اینجا می‌آیند.» + tertiary link to themes.
