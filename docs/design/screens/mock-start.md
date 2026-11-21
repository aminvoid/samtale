# Visual spec: Mock exam start

| | |
|---|---|
| **UX spec** | [../../ux/screens/mock-start.md](../../ux/screens/mock-start.md) |
| **Route** | `/fa/mock` |
| **Components** | PageHeader, ModeCard ×2, RulesList, InfoNote, Link |

## 375 px

| Zone | Spec |
|---|---|
| `h1` | «آزمون تمرینی <bdi lang="da">delprøve 2</bdi>» `text-h1` |
| Sequence | `text-lead`: draw · about 10 s · about 4½ min; tertiary «چه اتفاقی می‌افتد؟ ›» to the guide |
| Notice slot | InfoNote at the top when applicable (lost attempt; back-ended attempt, see below) |
| Practice card | ModeCard, `h2` «تمرین», RulesList, **primary** full-width «شروع تمرین» |
| Exam card | ModeCard, `h2` «شرایط آزمون», RulesList with «قابل توقف نیست» in 600, the interruption note as InfoNote compact (`circle-pause`), the alternative line, **secondary** full-width «شروع در شرایط آزمون» |
| What you'll need | `h2` + a compact list with icons (`clock-3` about 5–6 min · `ear` a quiet place · `volume-2` sound on · `mic` microphone optional) |
| No grade | InfoNote compact `info`: «این برنامه نمره نمی‌دهد. بعد از آزمون خودتان گوش می‌دهید و خودتان را می‌سنجید.» |
| History | Tertiary «آزمون‌های قبلی من ›» if any exist |

Cards 16 px apart; each card's button sits at its bottom.

## 1280 px

`max-inline-page`, the two ModeCards side by side (practice on the right), equal height, buttons aligned at the bottom. "What you'll need" and "No grade" in a row beneath, two columns.

## Back-guard spike: the two variants of the notice (C19, pending OQ-9)

| Variant | Design |
|---|---|
| **A. Back guard works** (flag on, expected) | Nothing on this screen: back inside the runner opens the LeaveDialog (see [mock-interview.md](mock-interview.md#back-guard-spike-both-variants)). |
| **B. Fallback "ended early"** | An InfoNote standard at the top of the page, above the mode cards, with `circle-pause`: «آزمون تمرینی شما با رفتن به عقب تمام شد. پاسخ‌هایتان تا اینجا ذخیره شده.» + a secondary `md` button «دیدن پاسخ‌هایم». If no answer had begun: «… چیزی ذخیره نشد.» without the button. Dismissible (`x`). Calm accent tint, never danger. |

## States

Pilot (fewer than three topics): exam card button aria-disabled with «وقتی موضوع‌های بیشتری منتشر شود فعال می‌شود.» beneath; practice works.
