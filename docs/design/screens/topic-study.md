# Visual spec: Topic study page

| | |
|---|---|
| **UX spec** | [../../ux/screens/topic-study.md](../../ux/screens/topic-study.md) |
| **Route** | `/fa/topics/{topicId}` (`#sitA`, `#sitB`, `#general`) |
| **Sample content** | `content/topics/2024-maj-b.json` (*Mangel på arbejdskraft*) |
| **Components** | BackLink, PageHeader, TermLabel, Pre2023Badge, PracticeStatus, ReviewBanner, OverflowMenu, ShareButton, InfoNote, SectionNav, SituationCard, TranslationToggle, ExaminerIntroBlock, SourceLabel, QuestionBlock, VerificationNote, SimilarQuestionLink, KeywordList, Button, ModelAnswerBlock, AudioPlayer, SpeedControl, WordHighlighter, PersonalExampleBlock, FollowupBlock, RelatedTopics, CreditLine, ReportProblemLink, Toast |

This is the page where content roles matter most. Every block opens with its RoleHeader ([components.md §0.2](../components.md#02-role-header-the-face-of-each-content-role)), so a learner scrolling quickly can tell question, key words, sample and follow-up apart by icon, label and tint.

## 375 px

### Header
| Element | Spec |
|---|---|
| Top row | BackLink «کار و بازار کار» at the right; OverflowMenu (`ellipsis`: share, report) at the left. |
| `h1` | *Mangel på arbejdskraft*: DanishText `title`, flow-aligned (right), `text-da-title` (26 px). |
| Persian name | «کمبود نیروی کار» `text-lead text-text-muted`. |
| Meta | TermLabel chip `Maj–Juni 2024 · B` · «کار و بازار کار» · Pre2023Badge explained (older topics only). `text-caption`, wraps. |
| Status | PracticeStatus caption, or ReviewBanner (due → InfoNote standard with `clock-3`). |
| Action | Secondary `md` button «تمرین این موضوع به‌صورت آزمون» (`messages-square`), full width. |
| Layout note | InfoNote *collapsible*, open on the first topic page, collapsed afterwards: «این صفحه چطور چیده شده». |

### SectionNav
Sticky bar under the header block: «A» · «B» · «سؤال کلی», 48 px, `data-sticky="section-nav"`.

### Section A (`#sitA`), top to bottom, 16 px between blocks
1. `h2` «موقعیت A» (`text-h2`).
2. **SituationCard (study):** letter tile A · *sygeplejerske med mange patienter* (`text-da-card`) · `briefcase-business` icon · SourceLabel «توصیف کتابچه از تصویر» · TranslationToggle → «پرستاری با بیماران زیاد و سرِ شلوغ».
3. **ExaminerIntroBlock** (examiner tint): RoleHeader «ممتحن موقعیت را معرفی می‌کند» + SourceLabel «متن SIRI (دفترچهٔ ممتحن <bdi lang="da">Maj–Juni 2024</bdi>)» + PlayButton · *Situation A viser en sygeplejerske, der har ansvar for mange patienter og har travlt.* (`text-da-intro`).
4. **QuestionBlock** (examiner tint): RoleHeader `h3` «سؤال اجباری اول» + PlayButton · *Der mangler arbejdskraft i sundhedssektoren, …? Hvorfor tror du, der gør det?* (`text-da-question`, 20 px/500) · VerificationNote matches (`badge-check`, details disclosure: «بررسی‌شده در ۱۸ نوامبر ۲۰۲۶ · دفترچهٔ ممتحن SIRI <bdi lang="da">Maj–Juni 2024</bdi>، صفحهٔ ۸ · باز کردن (سایت خارجی)») · **UX-OQ-20 slot** (empty here; when a question differs: the Disclosure «متن SIRI کمی فرق دارد») · TranslationToggle → «در بخش سلامت کمبود نیروی کار هست، مثلاً پرستار و دستیار بهداشتی-اجتماعی (<bdi dir="ltr">sosu</bdi>). به نظرت چرا؟» · SimilarQuestionLinks if any.
5. **KeywordList** (saffron tint): *hårdt arbejde* / «کار سخت» · *for lav løn* / «حقوق کم نسبت به مسئولیت» · *flere ældre* / «سالمندان بیشتر», each with its booklet emoji in the 28 px slot · tip link to template 1.
6. **Answer aloud:** primary `lg` full width «بلند جواب بدهید» + subtitle «شما صحبت می‌کنید، بعد مقایسه می‌کنید».
7. **ModelAnswerBlock** collapsed: RoleHeader «یک پاسخ نمونهٔ ساده و روشن» (**placeholder label, UX-OQ-19**: the string is `topic.sample.title` and the layout allows up to 40 characters on one line at 375, wrapping to two) · «بر اساس الگوی ۱ ›».
8. **PersonalExampleBlock** collapsed: `stethoscope` «مثال از دید یک پرستار».
9. **FollowupBlock** (dashed examiner border): RoleHeader «سؤال تکمیلی پیشنهادی» · note · *Hvilke problemer mener du, der kan være ved, …?* (`text-da-followup`) · VerificationNote · TranslationToggle · secondary «بلند جواب بدهید» · short answer Disclosure.

### Sample answer expanded (375)
AudioPlayer in a sunken well (play at the left, scrubber LTR, times under its ends, speed segmented below at the inline end) · the answer in `text-da-answer` (18/1.7) with *For det første*, *For det andet*, *Desuden*, *Så alt i alt* in 700 · while playing, the current word in the highlight style · tertiary «سایه‌خوانی جمله به جمله».

### Section B, General question
Same structure. The general section's `h2` «سؤال کلی (سؤال اجباری دوم)» is followed by an InfoNote compact: «اول ممتحن می‌گوید سؤال کلی‌تری می‌آید. به <bdi lang="da">overordnet</bdi> یا <bdi lang="da">generelt</bdi> گوش کنید.» → examiner phrases link. Key-word tip → template 2; follow-up → template 3.

### Page end
Related topics list · secondary «تمرین این موضوع به‌صورت آزمون» · CreditLine «از کتابچهٔ شری رحیمی، صفحه‌های ۳۶–۳۷» · ReportProblemLink «گزارش مشکل در این موضوع» (**target placeholder, UX-OQ-21**: renders as a link to `/fa/about#report` until the channel is decided) · Footer.

## 1280 px

- `max-inline-page`. Header block spans the full width: back link, `h1`, meta at the right; actions (secondary «تمرین … آزمون», secondary «اشتراک‌گذاری») aligned to the inline end of the h1 row.
- Below: **start column (right) 240 px**: sticky SectionNav side list («در این موضوع»: موقعیت A, موقعیت B, سؤال کلی, then موضوع‌های مرتبط and the mock link). **Main column** `max-inline-reading` (672 px), 48 px gap.
- Within a section, **KeywordList and "Answer aloud" sit side by side** under the QuestionBlock (key words 60 %, a card holding the Answer aloud button and subtitle 40 %, top-aligned) when the main column is ≥ 640 px; the sample answer is always full width.
- Danish paragraphs fill the main column (tokens.md §2.4): the question's left edge and right edge coincide with the block's padding edges; no floating LTR block.

## States (visual)

| State | Look |
|---|---|
| First visit | Layout note open (InfoNote) |
| Returning | Note collapsed to its title row |
| Review due | ReviewBanner (InfoNote) under the meta line; after practice, Toast «مرور انجام شد. مرور بعدی: ۴ روز دیگر.» |
| Player loading / error | Per AudioPlayer / PlayButton; the text never hides |
| Storage unavailable | No status, no banner; layout note shown collapsed after the first view in a session |
| Optional blocks absent | They don't render; the 16 px rhythm closes up |

## RTL and bidi

All learning text LTR blocks; titles and key words flow-aligned; Latin «sosu» isolated inside the Persian translation. Mirrored: back chevron, row chevrons, overflow placement. Not mirrored: play, scrubber, speed, mic, the question-mark icon.
