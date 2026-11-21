# Visual spec: Templates (hub and template pages)

| | |
|---|---|
| **UX spec** | [../../ux/screens/templates.md](../../ux/screens/templates.md) |
| **Routes** | `/fa/templates`, `/fa/templates/why`, `/pros-cons`, `/follow-ups` |
| **Components** | PageHeader, SegmentedNav, InfoNote, TemplateCard, Switch, TemplateStep, CueRow, RevealButton, PlayButton, Disclosure, CreditLine, ReportProblemLink, BackLink |

## 375 px

**Hub:** `h1` «الگوها و عبارت‌ها» · SegmentedNav «الگوها» · «جعبه‌ابزار» · «کلمه‌ها و عبارت‌ها» · first-time InfoNote (dismissible) · three TemplateCards stacked: number tile (۱ ۲ ۳), title with the Danish cue isolated («الگوی ۱: «<bdi lang="da">Hvorfor tror du, …?</bdi>»، دلیل‌ها»), "fits" caption, chevron.

**Template page:**
| Zone | Spec |
|---|---|
| Header | BackLink · `h1` with the isolated cue · "fits" line `text-lead text-text-muted` |
| Test myself | Switch row (44 px) «خودم را امتحان کنم», switch at the inline start; when on, tertiary «همه را نشان بده» / «همه را پنهان کن» appear at the end of the row |
| Steps | `ol` of TemplateStep cards, 12 px apart: step tile + Persian label («شروع»، «دلیل ۱»…) and model-voice PlayButton in the header; the Danish phrase (`text-da-line`, grammar notation exactly as printed, e.g. *For det første + verbum + subjekt …*); Persian meaning beneath |
| Test myself on | Each Danish line becomes a dashed sunken placeholder of the same height with «نشان بده» (`eye`); the label and meaning stay visible; reveals fade in |
| Template 3 | CueRows: the examiner's cue (examiner ink, `message-circle` 16) above the answer starter |
| Example (template 1) | A sample-role card: RoleHeader «مثال کتابچه» + PlayButton + Danish with bold connectives |
| Grammar in brief | Collapsed Disclosure (UX-OQ-17 pending; design is a plain Disclosure with a bordered table inside) |
| Footer | CreditLine «صفحه‌های ۷–۸» · ReportProblemLink (**target placeholder, UX-OQ-21**) |

## 1280 px

Hub: three TemplateCards side by side. Template page in `max-inline-page`: steps become a three-column table-like grid (`grid-cols-[12rem_1fr_16rem]`): Persian label (start/right) · Danish phrase with the PlayButton at its left · Persian meaning (end/left). Rows separated by 1 px rules instead of cards.

## States

Audio per PlayButton. Test-myself state isn't stored; turning the switch off shows every line.
