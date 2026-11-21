# Visual spec: Toolbox, and words and phrases

| | |
|---|---|
| **UX spec** | [../../ux/screens/toolbox-and-vocabulary.md](../../ux/screens/toolbox-and-vocabulary.md) |
| **Routes** | `/fa/toolbox`, `/fa/vocabulary` |
| **Components** | SegmentedNav, PageHeader, JumpLinks, PhraseItem, PlayButton, InfoNote, CreditLine, ReportProblemLink |

## 375 px

- SegmentedNav (Toolbox or Words current) · `h1` «جعبه‌ابزار: وقتی ذهنتان خالی می‌شود» / «کلمه‌ها و عبارت‌های طلایی».
- JumpLinks as wrapping chips.
- Each group: `h2` + intro line (`text-body text-text-muted`) + a list of PhraseItems in one card (`bg-surface-raised border border-border rounded-card`), items separated by 1 px rules, 16 px padding: emoji slot (reasons only, decorative) at the right · Danish line (`text-da-line`, `/` alternatives as printed) · Persian meaning beneath · model-voice PlayButton at the left, top-aligned.
- **Personal sentences:** the nurse-specific first item carries the example label chip «از دید یک پرستار» with `stethoscope` (**UX-OQ-25 pending**: if the owner picks a group note instead, the chip is replaced by one InfoNote compact at the top of the group).
- **Rescue sentences:** the when-to-use explanation as InfoNote standard; under the repeat request, InfoNote compact «دکمهٔ تکرار در آزمون تمرینی از <bdi lang="da">Undskyld, vil du godt …</bdi> استفاده می‌کند. هر دو درست‌اند.»
- Vocabulary words keep grammar markers in the Danish line («livskvalitet (en)»).
- Footer: CreditLine · ReportProblemLink (**placeholder, UX-OQ-21**).

## 1280 px

Toolbox: one column `max-inline-reading` (sentences are long), JumpLinks as a sticky side list on the start side. Vocabulary: two columns of PhraseItems per group (each column its own card), JumpLinks side list.

## States

One clip at a time: the playing item's PlayButton shows `pause` with its ring; others idle. Per-item error with retry.
