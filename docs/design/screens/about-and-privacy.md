# Visual spec: About and sources; Privacy

| | |
|---|---|
| **UX spec** | [../../ux/screens/about-and-privacy.md](../../ux/screens/about-and-privacy.md) |
| **Routes** | `/fa/about`, `/fa/privacy` |
| **Components** | PageHeader, LabelLegend, SourceLabel, VerificationNote, ExternalLink, InfoNote, CreditLine, ReportProblemLink |

Single reading column (`max-inline-reading`) at all widths; long-form Persian in `text-body` (16/1.85), `h2` sections 40 px apart.

## About (375)

1. `h1` «دربارهٔ این برنامه و منابع آن».
2. **What it is first:** `text-lead`. SIRI spelled out with the Danish name as `<bdi lang="da">Styrelsen for International Rekruttering og Integration</bdi>` and a Persian gloss.
3. Who made it · The booklet (CreditLine-style block with `book-open`) · Not official (InfoNote standard, `info`) · Where the questions come from.
4. **How to read the labels (LabelLegend):** one card per label, stacked at 375, two-up at 1280. Each card shows the label **exactly** as elsewhere: VerificationNote *matches* (`badge-check`), *booklet* (`book-open`), SourceLabel *the app's wording* (`pen-line`), *the booklet's description of the picture*, and the follow-up RoleHeader («سؤال تکمیلی پیشنهادی», dashed examiner edge, so learners learn to recognise the dashed style). Explanation `text-body` under each.
5. No grades (`text-body` 600 first sentence).
6. Official sources: list of ExternalLinks.
7. Booklet sources list (after review).
8. **Report a problem: placeholder (UX-OQ-21).** A section `#report` with `flag` and a neutral InfoNote «راه گزارش مشکل به‌زودی اضافه می‌شود.» until the channel is decided; every ReportProblemLink points here meanwhile.

## Privacy (375)

`h1` «حریم خصوصی» · sections with a 20 px icon before each `h2` (`smartphone` stored on this device · `shield-check` sent to our server · `info` Telegram's built-in browser · `circle-alert` can be lost · `trash-2` how to delete) · the key sentence «صدای شما از این گوشی بیرون نمی‌رود.» as an InfoNote standard so it stands out · last-updated caption.

## 1280

Same column, centred; LabelLegend two-up; URLs as LTR isolates.
