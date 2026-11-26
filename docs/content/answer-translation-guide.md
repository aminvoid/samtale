# Translation guide: Persian translations of the sample answers

- **Status:** adopted 2026-11-25. The owner decided to translate the answers in v1; this supersedes D-19. The author's permission covers it.
- **Reviewed:** Kimi's review of this guide (2026-11-25) is folded in.
- **Scope:** every model answer, follow-up answer and personal example in `content/topics/` (313 texts, 300 unique).
- **Where translations live:** `content/answer-translations.json`, outside the topic files (see `docs/content/pipeline.md`).
- **Who uses this guide:** the drafter (Codex), the fidelity reviewer (Kimi), the Persian reviewer (`persian-localization-reviewer`) and the owner.

## What the translation is for

A learner reads the Danish answer first. Then they open the translation to check that they understood it, and to see which Danish sentence carries which idea. The translation is a **reading aid**, not a text to learn. In the app it's hidden behind «ترجمه» and labelled as the app's translation, not the author's.

## The rules

1. **Translate the author's Danish exactly as printed.**
   - Don't fix it, improve it or add anything.
   - The only additions allowed are the glossary's first-use glosses (rule 6).
   - Some answers have Danish correction notes in `content/review-ledger.json` (`corrections`). Translate what's printed, not the suggestion. Where the printed Danish is unclear, translate its most likely meaning, and list the ID under "Uncertain".
2. **Close but natural.**
   - **One Danish sentence → one Persian sentence, in the same order.** A learner must be able to put a finger on the Danish sentence and find its Persian partner. Don't merge sentences or split one into two.
   - **Inside a sentence, use natural Persian word order:** the verb at the end, and Persian connectors. Never copy Danish word order.
   - **Keep every idea and drop none.** That includes small words that carry meaning: *også*, *desuden*, *selvom*, *stadig*, *ofte*, *mange*, *nogle*, *for meget* («بیش از حد», not just «زیاد»).
   - Render additive *også* with «هم». Use «همچنین» for the *Derudover* marker. When *også* introduces an example or an included group, «از جمله» fits.
   - Translate *for sent* as «دیرتر از موقع» and *for tidligt* as «زودتر از موقع». Use «بیش از اندازه زیاد / کم» for *for mange / for få*. Use «بیش از حد» with verbs and quantities such as *arbejde for meget* and *vare for længe*.
3. **Keep the text markers. They're what the learner is learning.** Render the answer templates' structure words consistently:

| Danish | Persian |
|---|---|
| Det kan der være flere grunde til. | می‌تواند چند دلیل داشته باشد. |
| For det første … / For det andet … | اول اینکه … / دوم اینکه … |
| Desuden … | علاوه بر این، … |
| Derudover … | همچنین … |
| En fordel er, at … / En anden fordel er, at … | یک مزیت این است که … / مزیت دیگر این است که … |
| En ulempe er, at … | یک عیب این است که … |
| På den ene side … På den anden side … | از یک طرف … از طرف دیگر … |
| Så alt i alt … | پس در مجموع … |
| Alt i alt mener jeg, at … | در مجموع معتقدم که … |
| Jeg synes, at … / Jeg tror, at … / Jeg mener, at … | به نظر من … / فکر می‌کنم … / معتقدم … |
| for eksempel / fx | برای مثال |
| Som sygeplejerske … | به‌عنوان پرستار … |

   - **The table applies only when the words mark an opinion or the text structure. Context overrides it:**
     - *synes om* = «دوست داشتن»
     - *det synes* = «به نظر می‌رسد»
     - *tro på* in a religious sense = «باور/ایمان داشتن»
     - *mene noget med* = «منظور داشتن از»
   - If a marker isn't in this table, choose one rendering, record it in the batch report, and use it everywhere.
4. **Modal verbs: translate the meaning, not the word.**
   - *kan*: ability «می‌تواند», or possibility «ممکن است».
   - *skal*: obligation «باید», or an arrangement or plan «قرار است».
   - *bør*: «بهتر است» / «باید».
   - *vil*: intention «می‌خواهد», or the future.
   - *må*: permission «می‌تواند / اجازه دارد», or necessity «باید»; *må ikke* = «نباید».
   - Fixed expressions keep their meaning: *kan godt lide* = «دوست دارد» (never «می‌تواند دوست داشته باشد»), *har brug for* = «نیاز دارد».
5. **Register: a polite learner speaking to an examiner.**
   - **Use standard, neutral spoken-written Persian:** not literary, and not slang. Keep the Danish person: first person stays first person, and third person stays third person.
   - **Don't use «شما» to address the examiner** unless the Danish has *du/I* addressed to the examiner.
   - **Generic *man* and generic *du*:** use «آدم» or an impersonal form («می‌شود …», «باید …»), whichever reads more naturally. Never «انسان», and not automatically «مردم».
   - **Don't use a passive** if it hides a needed actor or changes the modality.
   - **Pronouns:** keep who does what. Dummy *det/der* has no Persian partner. *sin/sit/sine* refer to the subject; add «خود» only when it removes ambiguity, and don't replace a clear possessive with an ambiguous «او/آن‌ها».
6. **Words both Iranian and Afghan (Dari) readers understand.**
   - Prefer shared neutral forms: «بسیاری از مردم» and «برخی» rather than «خیلی‌ها» and «بعضی‌ها»; «با اینکه» or «با آنکه» for *selvom*.
   - Avoid Iranian-only colloquialisms («یه», «حال می‌ده»).
   - Follow the Dari notes in `docs/content/glossary.md`. For pay, use «دستمزد», not «حقوق».
   - The glossary's Dari check is still pending, so every new recurring word choice goes into the batch report for the Dari check. In particular: «مرخصی»/«رخصتی», «دبیرستان»/«لیسه», «بیمارستان»/«شفاخانه», and month names.
7. **Danish institutions and fixed names:** the glossary decides which names stay in Danish, and in what order the Danish and the Persian appear.
   - Don't keep a Danish word just because it's Danish.
   - Where the glossary keeps the Danish (*folkeskole*, *gymnasium*, *SU*, *dagpenge*, *kontanthjælp*, *a-kasse*, *bofællesskab*, *pædagog* …), use the glossary form and word order in Latin script with its Persian gloss **in the same sentence** at first use.
   - Use «SU (کمک‌هزینهٔ تحصیلی دولت)» and «SU-lån (وام تحصیلی دولت)» with no Danish inflection or apostrophe. Write Danish words in parentheses in lowercase dictionary form, as in «کارهای غیرتخصصی (ufaglærte)».
   - *kommune* → «کمون (شهرداری؛ دولت محلی)» at first use in a text, then «کمون».
   - *dagpenge* → «dagpenge (کمک‌هزینهٔ بیکاری)». It's the payment, not the insurance fund (*a-kasse* = «صندوق بیمهٔ بیکاری»).
   - Brand names and apps stay as they are (*Too Good To Go*).
8. **Countries, languages and places:**
   - *Danmark* «دانمارک».
   - *dansk*: «دانمارکی» (the language or the adjective).
   - *danskere*: «دانمارکی‌ها» / «مردم دانمارک».
   - Cities with an established Persian form use it («کپنهاگ»); other Danish place names stay in Latin script.
9. **Compound nouns: translate the whole compound, not its parts.** Record recurring choices in the batch report and reuse them:
   - *madspild* = «اتلاف غذا»
   - *arbejdsmarked* = «بازار کار»
   - *børnefamilier* = «خانواده‌های دارای فرزند»
10. **Terminology:** follow `docs/content/glossary.md`. «آزمون», never «امتحان»; «پاسخ», never «جواب». The validator rejects both. Render *børn* as «بچه‌ها».
11. **Orthography:**
    - ZWNJ where it belongs: «می‌شود», «بچه‌ها», «نمی‌توانند». No ZWNJ after a letter that never joins the next one: «کارها», not «کار‌ها».
    - Persian «ی» and «ک», never Arabic ي/ك.
    - Persian punctuation «،» «؛» «؟» and «…» guillemets.
    - Put a comma after «در نتیجه» at the start of a sentence. Mid-sentence, write «…، در نتیجه …» or «… و در نتیجه …». Use «تا» when *så* expresses purpose, and «در این صورت» or «آن وقت» when it means “then” after a condition.
    - Ezafe after silent h: «هٔ» («برنامهٔ غذایی»).
    - Use optional kasra only where it prevents misreading, as in «از درِ مبدأ».
    - Separate the parts of a compound infinitive with a space, as in «صحبت کردن» and «پیدا کردن».
    - No presentation-form characters.
12. **Numbers, money, dates and times:**
    - Persian digits («۱۰ تا ۱۵ ساعت», «سال ۲۰۳۰»), and a Persian decimal separator («۲٫۵»).
    - Keep the vitamin name «B12» in Latin script.
    - Percent: «۵۰ درصد».
    - *kroner / kr.*: «کرون».
    - *kl. 8*: «ساعت ۸».
    - Danish months use Persian transliterations of the European month names («مه», «ژوئن»). Record them for the Dari check.
13. **Quotation marks** in the Danish („bedst før“) become «…». *bedst før* is «بهترین زمان مصرف», **never** «تاریخ انقضا». That one is only for real expiry wording such as *udløbsdato* / *sidste anvendelsesdato*, and the difference matters for food safety.
14. **Repeated answers:** identical Danish text gets an identical translation.

## Examples

**Model answer (2021-nov-a.sitA.q1.answer)**

> Det kan der være flere grunde til. For det første køber mange for meget mad, for eksempel på tilbud. For det andet planlægger de ikke deres måltider. Desuden smider nogle maden ud, når „bedst før“-datoen er overskredet, selvom den stadig kan spises. Så alt i alt handler det om dårlig planlægning og manglende viden.

✅ Good: five sentences, the same order, the markers kept, natural verbs, nothing lost.
> می‌تواند چند دلیل داشته باشد. اول اینکه بسیاری از مردم بیش از حد غذا می‌خرند، برای مثال وقتی تخفیف دارد. دوم اینکه وعده‌های غذایی‌شان را برنامه‌ریزی نمی‌کنند. علاوه بر این، برخی غذا را وقتی تاریخ «بهترین زمان مصرف» آن گذشته باشد دور می‌ریزند، با اینکه هنوز قابل خوردن است. پس در مجموع، مسئله برنامه‌ریزی ضعیف و کمبود آگاهی است.

❌ Too free: the sentences are merged, the markers are lost, «بیش از حد» becomes «زیاد», and *bedst før* becomes an expiry date.
> مردم چون زیاد خرید می‌کنند و برنامه ندارند و به تاریخ انقضا توجه می‌کنند، غذا را دور می‌ریزند.

❌ Too literal, in Danish word order:
> این می‌تواند وجود داشته باشد چند دلیل برای.

**Personal example (2020-maj-c.sitA.example1)**

> Jeg har selv lært dansk, og det har gjort det meget nemmere at tale med patienter og kolleger.

✅ «من خودم دانمارکی یاد گرفته‌ام و این کار صحبت کردن با بیماران و همکاران را خیلی آسان‌تر کرده است.»

## What reviewers check

**Kimi (fidelity, Danish → Persian):**
- the same sentence count and order
- no idea added or missing
- the meaning is right, including negation, quantifiers (*mange / nogle / alle / for meget*), modality (rule 4) and pronoun reference
- markers and recurring terms rendered consistently

**`persian-localization-reviewer`:**
- orthography, ZWNJ and punctuation
- glossary terms
- register
- whether a Dari reader can follow it
- naturalness, with no Danish word order

**Severity:**
- **E:** wrong meaning, or a missing or added idea
- **SF:** unnatural, inconsistent, or breaks the glossary or orthography
- **S:** style

**Uncertain items:** any item a reviewer marks "uncertain" goes into the owner's sample check.

## Drafting batches

Six batches, grouped by year:
- 2016–17
- 2018–19
- 2020
- 2021
- 2022–23
- 2024

Each batch report lists:
- the IDs drafted
- the repeated texts reused
- the new marker choices and new recurring terms (one master choice, reused in later batches; the drafter reads earlier batch reports first)
- the choices that need the Dari check
- uncertain items, each with a reason

Batch reports go in `docs/content/translation-batches/batch-N.md`.
