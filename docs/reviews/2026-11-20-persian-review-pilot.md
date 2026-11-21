# Persian review: content pilot, interface copy and spec drafts

- **Reviewer:** `persian-localization-reviewer`, 2026-11-20 (read-only; the main thread saved this condensed record).
- **The glossary** it proposed is in `docs/content/glossary.md`.

## Summary
- **All 58 pilot Persian strings match the printed booklet.** The reviewer rendered PDF pp. 36–37, 78–79 and 97–98 to images and compared them visually with the JSON. Orthography is clean on all 82 Persian strings: no Arabic ي/ك, no presentation forms, ZWNJ correct.
- **The missing «چرا؟»** in `2024-maj-b.general.followup1` is the author's own text (p. 37), not an extraction error.
- **Decision by delegation (2026-11-20) on P-01:** the booklet's informal «به نظرت» is kept as the author's voice. `.claude/rules/i18n-rtl.md` gets an exception for booklet text: the formal «شما» rule applies to app copy only. Raise it with the author.

## Content: correction notes to store next to the original (never overwrite)
- **P-02** `2024-maj-b.general.followup1`: add «چرا؟ چرا نه؟» (the Danish ends *Hvorfor?/Hvorfor ikke?*).
- **P-03** `2024-maj-c.sitB.q1`, `sitB.followup1` and `note1`: «کلاس‌های اول» → «سال‌های اولِ folkeskole / مدرسه». *De første klasser* means the first school years, not grade 1.
- **P-04** `2024-maj-b.general.q2.kw3`: «مجوز» → «گرفتن مجوز حرفه‌ای (autorisation)».
- **P-05** `2024-maj-c.general.followup1`: «چه معنایی دارد» → «چه تأثیری دارد».
- **Optional notes:**
  - a `sitA.q1.kw3` and a `general.q2`
  - b `sitB.q1`, `sitB.q1.kw1` and `general.q2`
  - c `title` (*pædagogik* means teaching methods) and `sitB.title`
  - spelling consistency: «شناخته‌شدن», «این‌که»; search must fold the variants

## Needs a human Afghan (Dari) reader (planned learner sessions)
- D-01: «سرِ شلوغ» (b `sitA.title`)
- D-02: «دبیرستان نظری» → «دبیرستان (gymnasium)»
- D-03: «حقوق» → «دستمزد»
- D-04: «شهرداری» for *kommune* (glossary)
- D-05: «به نظرت» register

## Interface copy (`messages/fa.json`)
- **Error `home.intro`:** factually wrong. Use «سؤال اول معمولاً با <da>Hvorfor tror du, …?</da> تمام می‌شود.» The same wrong sentence is in ADR-0004 §3 and `docs/ux/screens/exam-guide.md`:68.
- **`home.repeatLabel`:** «نفهمیدید» → «متوجه نشدید».
- **`error.retry`:** «دوباره امتحان کنید» → «دوباره تلاش کنید». Never use «امتحان»; the exam is «آزمون».
- **`metadata.description`:** «آمادگی برای بخش دوم آزمون شفاهی PD3 (delprøve 2)، با توضیح فارسی».
- **`home.topicCount`:** «{count, number, integer} موضوع». Also, `page.tsx` hard-codes `count: 51`.

## Spec drafts (UX and design screens)
- **Error:** `review.keep.switch` «نگه دار» (informal) → «نگه‌داشتن این آزمون روی همین دستگاه».
- **Should fix:**
  - `mock.grace` / `mock.handover`: «می‌توانید جمله‌تان را کامل کنید. بعد ممتحن آزمون را به پایان می‌رساند / سؤال بعدی را می‌پرسد.»
  - autolock and Do Not Disturb tips
  - «عکس» → «تصویر»
  - the leave dialog and interruption dialog texts (full drafts in the agent report)
  - «رد شدن» → «گذشتن از توضیح» (it also means "fail an exam")
  - «دستور» → «توضیح»
  - «توقف» → «مکث» for pause
  - «موقعیتی که ممتحن انتخاب کرد»
  - «اجازهٔ استفاده از میکروفون»
  - «دستگاه» instead of «گوشی» in the privacy line
  - «به … گوش دهید»
  - «علامت بزنید» instead of «تیک بزنید»
- **i18n hygiene:** no literal digits in messages. Use `{n, number, integer}` so the digit switch works, and add a `messages.test.ts` check.
- **One word for "answer":** «پاسخ», not «جواب».
- **`home.start.mock`:** «شروع یک آزمون تمرینی».
- **New drafts:** `mock.firstDoneHint`, `mock.repeat.firstHint`, `mock.repeat.slowerNote`, `mock.hints.noNotes`, `mock.notRecording`, `labels.pre2023` (with a `{termLabel}` argument), `home.notBySiri` (never transliterate SIRI as «سیری»), and Persian meanings of the examiner lines:
  - intro: «اینجا دو تصویر هست…»
  - transition: «حالا سؤالی کلی‌تر از شما می‌پرسم.»
  - *Tak.*: «ممنون.»
  - closing: «ممنون، آزمون تمام شد.»
- **Signed off:** the sample-answer label «یک پاسخ نمونهٔ ساده و روشن» (ezafe as U+0647 U+0654), the tab labels, the mode names and the core mock-exam labels.

## Calendar and digits
- **Calendar:** Gregorian confirmed.
- **Month names:** CLDR `fa` (ژانویه … دسامبر), e.g. «۲ دسامبر ۲۰۲۶». Some are weak for Dari readers (ژانویه, فوریه, ژوئیه, اوت, مه).
- **Mitigation:**
  - add a `DATE_LOCALE` knob (`fa` / `fa-AF`) next to `CALENDAR`
  - keep absolute dates rare
  - test with an Afghan reader
- **Digits:**
  - Persian digits in the interface through formatters only
  - Latin digits for Danish content and term labels
  - grades in LTR isolates

## Sign-off (delegated owner gate)
- **Fidelity and orthography:** all 58 strings signed off.
- **Translation:** signed off, with notes P-02 to P-05 attached.
- **Still open:** D-01 to D-05 (one Afghan reader).
- **`2024-maj-b.note1`** (confidentiality hit) stays internal. **`2024-maj-c.note1`** may be approved for public use with the P-03 wording.
