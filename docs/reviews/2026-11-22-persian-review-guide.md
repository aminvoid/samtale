# Persian review: exam guide (`guide` namespace)

- **Reviewer:** `persian-localization-reviewer`, 2026-11-22 (read-only; saved by the main thread).
- **Scope:** all 95 `guide` strings in `messages/fa.json`, `src/features/exam-guide/` and `content/examiner-lines.json`, with screenshots at 375 px.
- **Sign-off:** **signed off with notes.** No Errors. Orthography, terminology and bidi are clean; there's no horizontal overflow and arrows are mirrored. Apply Should fix 1–12 before public release.

## Should fix
1. **`guide.followUps.justify.meaning`** → «گفتید که …، اما پس چرا فکر می‌کنید که …؟». *men … så* is a challenge.
2. **`guide.followUps.takePosition.meaning`** → «آیا فکر می‌کنید که …؟ چرا؟ / چرا نه؟». A yes/no stance question.
3. **`guide.examiner.thanks`** → «بعد از پاسخ شما معمولاً فقط می‌گوید <da>tak</da> («ممنون»)، نه <da>fint</da> («خوب بود»). از این کلمه نتیجه‌ای دربارهٔ نمرهٔ خود نگیرید.»
4. **`guide.examiner.cannotAnswer`:** don't use «موضوع» (that's the glossary term for *emne*). → «… مطمئن می‌شود که واقعاً نمی‌توانید به آن پاسخ دهید.»
5. **`guide.repeat.body`:** «حدوداً» → «تقریباً».
6. **`guide.overview.start`:** → «در آغاز، ارزیاب بیرونی (<da>censor</da>) کارت شناسایی شما را بررسی می‌کند. سپس شما، ممتحن (<da>eksaminator</da>) و ارزیاب بیرونی خودتان را معرفی می‌کنید.» Also gloss *eksaminator* at first use in `guide.steps.look`.
7. **`guide.fits.arrangements`:** → «اگر معلولیت جسمی یا روانی یا دشواری مشابهی دارید، می‌توانید شرایط ویژهٔ آزمون، مثلاً وقت اضافه، درخواست کنید. درخواست کتبی را دست‌کم {weeks, number, integer} هفته پیش از دورهٔ آزمون به مدیر مدرسهٔ زبان بدهید. مدیر مدرسه دربارهٔ آن تصمیم می‌گیرد.» Combine this with exam review S1: the winter 2026 deadline has passed.
8. **`guide.grade.scale`:** CLDR `fa` renders «، و» for lists. Show the grades as an LTR row with no conjunction, or join them with one Persian-specific helper.
9. **`guide.sources.external`:** → «{label} (به سایت دیگری می‌روید)». «خارجی» can read as "foreign", and the link doesn't open a new tab.
10. **`guide.lines.siri` and `guide.followUps.source`:** «مه تا ژوئن» → «دورهٔ <da>maj–juni</da> {year, number, year}».
11. **Danish font:** Atkinson's slashed zero makes "10" look like "1Ø". Ask `ui-designer` for an unslashed zero (an OpenType feature or a digit fallback under `:lang(da)`).
12. **`guide.examiner.mayReword`:** → «ممتحن واقعی ممکن است موقعیت را با جمله‌هایی متفاوت از این برنامه معرفی کند یا سؤال‌های تکمیلی را به شکل دیگری بپرسد. تمرین کنید منظور سؤال را بفهمید، نه فقط واژه‌های آن را.»

## Suggestions
- **`introMeaning`:** use a more standard register; the agent's report has the full draft.
- **`examiner.harder`:** add "this is a normal part of the exam, not a bad sign".
- **`followUps.clarify.meaning`:** keep *det*.
- **Follow-up type titles:** روشن‌کردن گفته‌ها / توضیح بیشتر / دلیل‌آوردن / موضع‌گیری و استدلال.
- **`followUps.intro`:** say «دفترچهٔ ممتحن».
- **`assessment.*`:** avoid bare imperatives; «درک شنیداری».
- **`grade.oral`:** «برای کل آزمون شفاهی (هر دو بخش با هم) فقط یک نمره…».
- **`grade.pass`:** add "the average isn't rounded up; ۱٫۹ isn't enough", using a number argument.
- **`overview.partOneNotes`:** add "reading from a script isn't assessed".
- **`sources.independent`:** start the sentence with «آزمون را SIRI … برگزار می‌کند».
- **`repeat.suggestion`:** «عبارتی که می‌توانید بگویید».
- **`lines.play` (aria-label):** «پخش صدای ممتحن به دانمارکی: {meaning}».
- **The hard-coded «و نیم»:** document the coupling in `exam-facts.ts`.

## Glossary additions (proposed)
prøvedeltager (داوطلب / prefer «شما»), opklarende spørgsmål, uddybende spørgsmål, forklaring og begrundelse, stillingtagen og argumentation, særlige prøvevilkår (شرایط ویژهٔ آزمون, not just «وقت اضافه»), lytteforståelse (درک شنیداری), term labels (دورهٔ <da>maj–juni</da> {year}), fint (خوب بود).

## Side note
The reviewer's local build reported the `siriParts` canary in client chunks. To be checked by the main thread.
