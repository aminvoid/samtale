# Visual spec: Home

| | |
|---|---|
| **UX spec** | [../../ux/screens/home.md](../../ux/screens/home.md) (behaviour, states, copy keys) |
| **Route** | `/fa` |
| **Components** | AppShell, PageHeader, PrimaryActionCard, StartingPointCard, ContinueCard, ReviewDueList, TermLabel, InfoNote, StorageNotice, Footer, BottomTabBar / TopNav ([components.md](../components.md)) |

## 375 px, first visit

| Zone | Spec |
|---|---|
| Header | AppHeader, 56 px. Wordmark at the right, menu at the left. |
| `h1` | The app name, `text-h1` (26 px), `pbs-8`. With name A: `<bdi lang="da">Samtale</bdi>` set in the Danish face. Under it the descriptor «تمرین گفت‌وگوی آزمون شفاهی PD3» in `text-label text-text-muted`. |
| Purpose | `text-lead` (18/1.8), `mbs-4`: what it is, with «delprøve 2» as a `<bdi lang="da">`. The gloss line ("part 2 of the oral: the unprepared conversation") in `text-body text-text-muted`. |
| Source line | `text-caption text-text-muted`, `mbs-3`: what it is first, then «ساخت SIRI نیست…» and a tertiary link to About. SIRI spelled out. |
| Primary | **PrimaryActionCard** (the only filled card): «delprøve 2 چطور برگزار می‌شود؟» + hint «حدود ۳ دقیقه مطالعه», `signpost` tile, `mbs-6`. |
| Secondary | Two StartingPointCards stacked, 12 px apart: «مطالعهٔ موضوع‌های گذشته» (`library-big`, hint with the topic count) and «امتحان یک آزمون تمرینی» (`messages-square`). Two-up only if both titles fit on one line (they don't at 375 in Persian drafts, so stacked). |
| Fit | At default text size, h1 + purpose + source + the three cards fit above the 64 px tab bar on a 375 × 812 viewport (≈ 690 px of content). If the source line wraps to 4 lines it may push the last card under the fold; acceptable, nothing is cut. |
| Storage unavailable | StorageNotice (InfoNote compact) under the cards. |

## 375 px, returning

- `h1` compact: `text-h3` size but still the `h1` element, `pbs-6`.
- **Continue where you left off** (`h2`, `text-h2`): ContinueCard with the Danish name (`text-da-card`, flow-aligned), Persian name, TermLabel, primary `md` «ادامه» at the inline start of the card's last row.
- **Ready to review** (`h2`): up to three ReviewDueItems, then a tertiary «همه را ببینید ›». Not rendered when nothing is due (no empty box).
- **Start here** (`h2`): three compact StartingPointCards in one row of three (icon above a one-line label, 88 px tall), or stacked if a label wraps at 200 %.
- Tertiary link «پیشرفت من» (`notebook-text`).
- **No-jump rule:** the first-visit and returning states share the top region's height until storage is read (architect's mechanism). The design reserves a 160 px slot for the Continue card.

## 1280 px

- Content in `max-inline-page`, two columns (7 / 5 of a 12-column grid, 32 px gap), start column on the right.
- First visit: start column = h1, purpose, source and the PrimaryActionCard; end column = the two StartingPointCards stacked. Vertical alignment: both columns start at the h1 baseline.
- Returning: start column = Continue; end column = Ready to review (or starting points). Starting points row beneath both columns, three across.
- Header with TopNav; no tab bar; Footer at the bottom.

## States (visual)

| State | Look |
|---|---|
| Loading | Server text immediately; the returning slot is reserved (no skeleton for static text) |
| Error | Falls back to first visit silently |
| Last topic unpublished | Continue card not rendered; starting points move up within the reserved slot |

## RTL and bidi

Danish names and term labels isolated and flow-aligned; card chevrons mirrored (point left). No other directional icons.
