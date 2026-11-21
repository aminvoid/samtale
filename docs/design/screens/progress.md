# Visual spec: My progress

| | |
|---|---|
| **UX spec** | [../../ux/screens/progress.md](../../ux/screens/progress.md) |
| **Route** | `/fa/progress` |
| **Components** | PageHeader, InfoNote, JumpLinks, ReviewDueList, UpcomingReviewItem, AttemptHistoryItem, PractisedTopicItem, PracticeStatus, EmptyState, StorageNotice |

What the learner **has done**, as plain lists. No charts, rings, percentages, streaks or calendars (US-067; principle 5).

## 375 px

| Zone | Spec |
|---|---|
| Header | `h1` «پیشرفت من» · `text-caption text-text-muted` «فقط در همین مرورگر روی همین دستگاه ذخیره می‌شود.» + Privacy link |
| Jump links | Chips: «آمادهٔ مرور» · «آزمون‌های من» · «موضوع‌های تمرین‌شده» (only for sections that exist) |
| `#review` | `h2` · ReviewDueItems (chip «مرور روز ۷») · «بعدی‌ها» subheading (`text-label`) · UpcomingReviewItems · the per-topic note as InfoNote compact |
| `#history` | `h2` «آزمون‌های من» · AttemptHistoryItem cards, newest first: date · Danish topic + «· A» · mode chip · «۴:۱۲» · «تمرکز: مثال زدن» (`sparkle`) · «ضبط‌ها نگه داشته شده» (`smartphone`) |
| `#practised` | `h2` · PractisedTopicItem rows |
| Footer link | Tertiary «تنظیمات ›» |
| Telegram note (if detectable, UX-OQ-30) | InfoNote standard at the top |

## 1280 px

Jump links kept (R-29). Two columns: start (right) Ready to review + Coming up; end (left) History. Practised topics full width below as a two-column list.

## States

| State | Look |
|---|---|
| Nothing stored | EmptyState: `notebook-text` icon circle, «تمرین‌های شما بعد از اینکه به سؤالی بلند جواب بدهید یا یک آزمون را تمام کنید اینجا می‌آید.», tertiary links «مطالعهٔ یک موضوع» · «امتحان یک آزمون تمرینی». No empty section boxes. |
| Storage unavailable | StorageNotice replaces all sections |
| Loading | Static skeleton rows only after the delay |
