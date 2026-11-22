# Persian review: mock exam screens

- **Reviewer:** `persian-localization-reviewer`, 2026-11-22 (read-only; saved by the main thread).
- **Scope:** the `mock` namespace in `messages/fa.json` (including `mock.ready.mic*` and `mock.review.*`), driven in Chromium at 375 px.
- **Gate:** **not passed until E1–E3 are fixed.** Once E1–E3 are fixed as proposed, the rest is signed off. S1–S14 should be fixed before release.

## Errors
- **E1 `mock.dialog.interruptedLabel`:** → «این نوبت با برچسب «قطع‌شده» ثبت می‌شود. این برچسب دربارهٔ پاسخ‌های شما چیزی نمی‌گوید.» Never mention failing: no «مردود», «رد شدن», «ناموفق» or «قبول‌نشده».
- **E2 `mock.start.interruptions`:** → «اگر تماسی برسد یا صفحه خاموش شود، آزمون به حالت مکث می‌رود و منتظر شما می‌ماند. این نوبت با برچسب «قطع‌شده» ثبت می‌شود؛ این برچسب دربارهٔ پاسخ‌های شما چیزی نمی‌گوید.»
- **E3 `mock.interview.firstStep` / `secondStep`:** «·» next to Persian digits looks like «۰», and «بخش» means delprøve. → «مرحلهٔ {current, number, integer} از {total, number, integer}: سؤال موقعیت» / «…: سؤال کلی».

## Should fix
- **S1 `mock.title`:** `{part, select, 1 {آزمون تمرینی بخش اول (<da>delprøve 1</da>)} other {آزمون تمرینی بخش دوم (<da>delprøve 2</da>)}}`. Latin digits inside Danish names; add a written exception to the "no literal digits" rule for fixed Danish names (delprøve 2, PD3).
- **S2 `mock.dialog.interruptedTitle`:** → «آزمون موقتاً قطع شد».
- **S3 `mock.start.noGrade`:** → «این برنامه نمره نمی‌دهد. بعد از آزمون، پاسخ‌هایتان را با پاسخ نمونه مقایسه و خودتان ارزیابی می‌کنید.»
- **S4 `mock.ready.continueBlocked`:** → «برای ادامه، اجازهٔ میکروفون را بدهید یا «ادامه بدون ضبط» را بزنید.»
- **S5 `mock.end.review`:** → «دیدن پاسخ‌ها و خودارزیابی».
- **S6 `mock.interview.repeatMeaning`:** → «ببخشید، می‌شود سؤال را تکرار کنید؟»
- **S7 `mock.live.recordingCapped`:** name the real button: «پاسخم تمام شد».
- **S8 `mock.ready.micExplanation`:** «مرور» → «صفحهٔ پاسخ‌ها».
- **S9 `mock.back.*`:** «رفتن به عقب» → «برگشتن به صفحهٔ قبل».
- **S10 `mock.review.part*` / `playTake`:** «مرحله» for steps, «تکه» for recording segments; keep «بخش» for delprøve only.
- **S11 `mock.start.limit` / `mock.review.short`:** not «حدود ۴:۳۰ دقیقه». Use «حدود {minutes} دقیقه و {seconds} ثانیه» or «حدود چهار دقیقه و نیم».
- **S12 `mock.live.saveFailed`:** → «… در سابقهٔ تمرین‌های شما ذخیره نشد.»
- **S13 `mock.review.skipped`:** → «برنامه به سؤال کلی رفت تا برای آن وقت کافی بماند.»
- **S14 `mock.ready.invalid`:** → «می‌توانید به‌جای آن قرعه بکشید.»

## Suggestions
- **`start.continuous`:** wording.
- **`examiner.tap`:** «برای شنیدن صدای ممتحن ضربه بزنید».
- **`examinerChooses` / `learnerChooses`:** make the pair parallel.
- **`micInUse`, `reveal.data`:** wording.
- **`live.revealed`:** use a colon.
- **ZWNJ consistency:** «پنهان‌کردن», «باز‌کردن», «قطع‌شدن», «این‌که».
- **`end.discardBody`:** add a no-recording variant.
- **`start.history`:** currently unused.

## Glossary additions
- «با برچسب «قطع‌شده»»; never contrast it with failing.
- «مرحله» for an interview step.
- «تکه» for a recording segment.
- «خودارزیابی».
- «صفحهٔ پاسخ‌ها».
- The repeat request, verbatim.
- No «·» next to Persian digits.

**Still for a Dari reader:** «زمان‌سنج», «قطع‌شده», «مزاحم نشوید».
