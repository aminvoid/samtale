# Visual spec: Mock exam review

| | |
|---|---|
| **UX spec** | [../../ux/screens/mock-review.md](../../ux/screens/mock-review.md) |
| **Route** | `/fa/mock/review/{topicId}?attempt={attemptId}` |
| **Components** | BackLink, PageHeader, TermLabel, KeepCard, FactsList, ReviewQuestionItem, AudioPlayer, TakePlayer, Disclosure, VerificationNote, SourceLabel, KeywordList, SelfCheckList, FocusNextTimePicker, DiscardGuardDialog, StorageNotice, Toast, NextStepsCard |

Normal app chrome returns (header, tab bar). The tone is a quiet listening room: no scores, no colours for "good" or "bad", no totals.

## 375 px

| Zone | Spec |
|---|---|
| Header | BackLink «آزمون تمرینی» (or «پیشرفت من») · `h1` «پاسخ‌های شما» · meta: *Mangel på arbejdskraft* (flow) · «موقعیت A» · TermLabel · mode chip · date «۱۹ نوامبر ۲۰۲۶» |
| First-time note | InfoNote compact: «اول پاسخ خودتان را گوش دهید، بعد نمونه را. بعد تیک بزنید چه کارهایی کردید. هیچ‌کس جز شما این را نمی‌بیند.» |
| KeepCard | Raised card, `smartphone` icon, «ضبط‌های شما وقتی این صفحه را ترک کنید پاک می‌شوند.», Switch row «روی همین دستگاه نگه دار» (switch at the right) |
| Facts | FactsList in a sunken card: «زمان کل: ۳:۵۲» · «تعداد درخواست تکرار: ۱» + note «درخواست تکرار در آزمون واقعی هم مجاز است.» · «نمایش متن: استفاده نشد» · short-attempt note when relevant |
| Part 1 | `h2` «بخش ۱: موقعیت A» · "what the examiner said first" (examiner tint, intro) · ReviewQuestionItem (first required) · ReviewQuestionItem (follow-up) · SelfCheckList (six items) |
| Transition | A small examiner-tinted line with SourceLabel «متن این برنامه» |
| Part 2 | `h2` «بخش ۲: سؤال کلی» · items · SelfCheckList (seven items, adds "covered both sides") |
| Focus next time | FocusNextTimePicker card |
| Next | NextStepsCard: «تمرین این موضوع» · «شروع یک آزمون تازه» · tertiary «خانه» |

**ReviewQuestionItem at 375:** role RoleHeader `h3` · the Danish question with examiner PlayButton · VerificationNote · Disclosures «ترجمه» and «کلمه‌های کلیدی» on one row (wrapping) · **your answer** panel (you tint: TakePlayer, «طول: ۰:۵۲», «حدود ۴۵ تا ۶۰ ثانیه پیشنهاد می‌شود» as a neutral reference) · **sample** Disclosure (collapsed; expanded when not recorded) · tertiary «باز کردن این سؤال در موضوع».

**SelfCheckList:** each row 44 px+, checkbox at the right, Persian item, the Danish example phrase beneath in `text-text-muted` (*fordi …*), «این یعنی چه؟» disclosure. Ticked rows look exactly like unticked rows except the box.

## 1280 px

`max-inline-page`. Header and KeepCard + Facts in two columns (Keep at the start/right, Facts at the end). Each ReviewQuestionItem: question full width, then **two columns: your answer (right) | sample answer (left)**, top-aligned, both expanded. SelfCheckList spans both columns, items in two columns of rows.

## States (visual)

| State | Look |
|---|---|
| Not recorded | TakePlayer *none* («ضبط نشده» with `mic-off`), samples expanded, its own first-time note |
| From history, kept | KeepCard: «روی این دستگاه نگه داشته شده» + secondary destructive «حذف» |
| From history, not kept | KeepCard replaced by InfoNote compact «ضبط‌های این آزمون نگه داشته نشد.» |
| Keep failed | KeepCard shows `circle-alert` + «این آزمون روی این دستگاه نگه داشته نشد. هنوز می‌توانید گوش دهید.» |
| Storage unavailable | Switch aria-disabled + reason; one StorageNotice above Part 1 |
| Attempt not on this device | InfoNote at the top «این آزمون روی این دستگاه نیست.» + secondary «شروع یک آزمون» · tertiary «پیشرفت من»; questions and samples below |
| Leaving with unkept recordings | DiscardGuardDialog (Stay focused) |
