# Visual spec: Exam guide and sub-pages

| | |
|---|---|
| **UX spec** | [../../ux/screens/exam-guide.md](../../ux/screens/exam-guide.md) |
| **Routes** | `/fa/guide/delproeve-2`, `/fa/guide`, `/phrases`, `/follow-up-types`, `/fa/guide/study-method` |
| **Components** | PageHeader, LastChecked, ContentsList, StepList, Timeline, InfoNote, Disclosure, PhraseItem, SourceLabel, PlayButton, NextStepsCard, ExternalLink, CreditLine |

## 375 px, `/fa/guide/delproeve-2`

| Zone | Spec |
|---|---|
| Header | `h1` «<bdi lang="da">delprøve 2</bdi> چطور برگزار می‌شود» `text-h1`; LastChecked under it. |
| In one sentence | `text-lead`, then the **calming fact** as InfoNote standard: «اگر سؤالی را نفهمیدید، می‌توانید درخواست تکرار کنید…» with the repeat phrase as DanishText `line` and an examiner PlayButton beside it. This is the most prominent block after the h1. |
| Contents | ContentsList as a Disclosure «در این صفحه» (collapsed). |
| `#steps` | StepList, seven steps; Danish phrases in steps are `<bdi lang="da">` with a Persian gloss in «» after them and an inline PlayButton (32 px visual, 44 px hit area through padding; it's inside text, so it doesn't push the line height beyond 1.85 × 16 = 30 px: use a negative block margin of 7 px). Step notes as `text-caption` with `info`. |
| `#timeline` | Timeline **vertical**: nodes on the right, connectors downward; the "about 4½ min" segment drawn three times taller than the others. |
| `#examiner` | Two short lists under `h2`s "does" / "doesn't", each item one line; `check` / `x` icons are **not** used (they'd read as right/wrong): plain dots. Links to toolbox and phrases as tertiary links. |
| `#assessment`, `#grade` | `text-body`; the BEK quote in a Disclosure as DanishText `line` with SourceLabel. The grade section ends with «این برنامه نمره نمی‌دهد و نمی‌تواند بدهد.» in 600 weight. |
| More | Three StartingPointCards (phrases, follow-up types, study method). |
| Next | NextStepsCard: "Study a topic" · "Try a practice mock exam". |
| `#sources` | ExternalLink to SIRI; «وابسته به SIRI نیست» caption. |

Reading measure: `max-inline-reading`, centred at 375 it's simply the page width minus 32 px.

## 1280 px

- Two columns: sticky ContentsList as a side list on the start side (right, 240 px), reading column `max-inline-reading` beside it.
- Timeline **horizontal** across the reading column, reading right to left; connectors with mirrored `arrow-left`.
- More cards three across; Next cards two across.

## Sub-pages

| Page | Visual notes |
|---|---|
| `/fa/guide` overview | A simple ordered table of the 15-minute oral as two StepList groups; delprøve 1 shown with a neutral chip «به‌زودی» (no "locked" icon) |
| `/phrases` | **Examiner lines** as PhraseItem examiner variant (examiner tint, RoleHeader «جملهٔ ممتحن», SourceLabel, examiner PlayButton, Danish `line`, Persian meaning). The transition carries "the app's wording, based on SIRI's instruction" and the tip "listen for *overordnet*" as InfoNote compact. **Candidate phrases** below on white cards with model-voice PlayButtons and a neutral chip «پیشنهاد، نه متن اجباری». |
| `/follow-up-types` | Four cards, each: Danish type name `text-da-card` (flow) + Persian name `text-h3`, explanation, SIRI's example as DanishText `followup` in an examiner-tinted inset with SourceLabel, tertiary link to the helping template |
| `/study-method` | StepList of four steps, each with a tertiary link to the feature; CreditLine; the optional time-split table as a plain bordered table (`border-border`), attributed, with the "SIRI gives only about 4½ minutes" note under it |

## States

Audio per PlayButton (loading, error with retry; text stays). No page-level loading UI beyond text.
