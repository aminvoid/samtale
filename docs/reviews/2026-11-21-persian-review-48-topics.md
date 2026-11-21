# Persian review: the remaining 48 topics

- **Reviewer:** `persian-localization-reviewer`, 2026-11-21 (read-only; saved by the main thread).
- **Delegated gate:** this review stands in for the owner's Persian check.

## Result
**Fidelity and orthography are signed off for all 48 topics.** All 870 Persian strings were checked three ways:
1. **Against the booklet Markdown:** every string matches byte for byte.
2. **Against the PDF text layer:** 839 of 870 match automatically. The other 31 are line-wrap fragments in the PDF.
3. **Visually, every string:** compared against images of all 81 booklet pages these topics use.

**Orthography:** zero hits for Arabic ي/ك/ى, presentation forms, ZWNJ errors, Latin punctuation, non-NFC text or bidi control characters.

## Repeating pattern (Should fix, as a display rule)
57 follow-ups in 32 topics drop the *Hvorfor / hvorfor ikke?* ending in Persian.
- **Proposal:** one display convention. When the Danish ends that way, show an app-written «چرا؟ چرا نه؟» **beside** the author's line, never inside it.

## Topic-specific correction notes (stored next to the original; never overwrite)

| ID | Severity | Current | Note |
|---|---|---|---|
| 2017-maj-a.general.followup1 | SF | چه معنایی دارد | چه تأثیری دارد |
| 2018-nov-c.sitB.title, sitB.q1 | SF | دبیرستان | آموزش متوسطه (ungdomsuddannelse): دبیرستان یا آموزش فنی‌وحرفه‌ای |
| 2016-nov-c.general.followup1 | SF | …چقدر مهم است که آدم کار داشته باشد… | …برای کیفیت زندگی آدم چقدر مهم است که… |
| 2020-nov-b.general.followup1 | SF | حقوق نیروی حرفه‌ای | دستمزد نیروی حرفه‌ای (Dari: «حقوق» means "rights") |
| 2020-nov-c.sitA.q1.kw3 | SF | بزرگ‌نما و باحال | بزرگ‌تر و جذاب به نظر رسیدن |
| 2020-maj-c.sitA.title | SF | …کلاس زبان دانمارکی می‌گیرد | شرکت هزینه‌ی کلاس دانمارکی کارمندان خارجی را می‌دهد |
| 2022-nov-a.general.q2, general.followup1 | SF | دبیرستان نظری | دبیرستان (gymnasium) |
| 2017-nov-c.sitA.title | S | شغل رؤیایی | شغل جالب |
| 2017-nov-b.general.q2.kw2 | S | مدرک | مدرک و شاهد (برای پلیس) |
| 2023-maj-c.sitA.followup1 | S | کار بدون مهارت | کار غیرتخصصی (ufaglært) |
| 2023-nov-b.sitB.followup1 | S | تحصیلات نمی‌گیرند | ادامه‌ی تحصیل نمی‌دهند |
| 2022-nov-b.title | S | مهاجرت به شهرهای بزرگ‌تر | نقل‌مکان به شهرهای بزرگ‌تر |
| 2016-maj-a.sitB (title, q1, followup1) | S | سوءپیشینه‌ی پاک | سابقه‌ی کیفری پاک (ren straffeattest) |
| 2021-nov-c.sitB (title, q1, followup1) | S | صندلی خالی | ظرفیت خالی |
| 2018-nov-c.sitA.q1.kw2 | S | آیا آموزش جواب می‌دهد؟ | آیا آموزش مؤثر است؟ |
| 2016-nov-b.general.q2 | S | بدون دعوا و تنبیه | بدون سرزنش و تنبیه (Dari: «دعوا» means fighting) |

## Rendering (app, not content)
- **Persian fields that start with a Latin word** (SU, CO2): render with an explicit `dir="rtl"`, never `auto`.
- **Danish words inside Persian strings** (bofællesskab, SMS-lån, gymnasium, dagpenge, kontanthjælp, ufaglært, folkepension, SU, IT, …): they have no `lang="da"`, so a screen reader uses the Persian voice. Decide on a markup convention, or record this as a known limitation.
- **Search:** must treat a space, a ZWNJ and no separator as the same («این که» / «اینکه», «به جای» / «به‌جای»).

## Needs an Afghan (Dari) reader
- **From the pilot:** «دبیرستان» (Dari «لیسه»), «حقوق» for pay («معاش»), «شهرداری» («شاروالی»), «به نظرت».
- **New:** مهدکودک, سوءپیشینه, کمک‌بهیار, مرخصی (Dari «رخصتی»), ترخیص, بیمارستان (Dari «شفاخانه»), ویزیت, چکاپ, یارانه, شهریه (Dari «فیس»), کارجو, نظافتچی, پمپ‌بنزین, باشگاه, قلدری, باحال, جواب می‌دهد, دعوا, صندلی خالی, فریلنس.

## Sign-off (translation)
- **Signed off:** every topic not listed below.
- **Signed off with notes (13):** 2016-maj-a, 2016-nov-c, 2017-maj-a, 2017-nov-b, 2017-nov-c, 2018-nov-c, 2020-maj-c, 2020-nov-c, 2021-nov-c, 2022-nov-a, 2022-nov-b, 2023-maj-c, 2023-nov-b.
- **Needs an Afghan reader before publishing (2):**
  - **2020-nov-b:** «حقوق» reads as "rights"
  - **2016-nov-b:** «دعوا» reads as "fighting"

## Glossary additions (proposed)
ren straffeattest, ungdomsuddannelse, SU, dagpenge/kontanthjælp, folkepension, daginstitution, pædagog, sygehjælper, barsel/forældreorlov, sygemeldt, bofællesskab, ufaglært arbejde, the «چرا؟ چرا نه؟» display hint, and notes for kommune and løn. The wording is in the agent's report; apply it to `docs/content/glossary.md`.
