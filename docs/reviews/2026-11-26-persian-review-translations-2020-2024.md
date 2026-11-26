# Persian review: answer translations 2020–2024 and the toggle labels

- **Reviewer:** `persian-localization-reviewer`, 2026-11-26 (read-only; saved by the main thread).
- **Scope:** 166 drafts (batches 3–6), and the new UI strings for the translation toggles.
- **Result:**
  - The orthography is clean.
  - 58 items have findings; 108 of 166 are signed off without findings.
  - **1 blocking rendering bug:** multi-word Latin names are reversed in RTL («Go To Good Too»).
  - The label «ترجمهٔ برنامه» is ambiguous.

## Decisions (main thread, by delegation, 2026-11-26)
1. **Bidi bug:** fixed in code. A run of Latin words, with the spaces between them, goes in one isolate. Regression test.
2. **Labels:**
   - `study.answerTranslationSource` → «ترجمه از این برنامه است، نه از کتابچه.»
   - `examiner.translation` → «ترجمهٔ این برنامه: {meaning}»
   - `study.shortAnswerTranslation` → «ترجمهٔ پاسخ کوتاه نمونه»
3. **Where this review disagrees with Kimi,** this review's view stands:
   - the Persian present tense carries the future, so 2021-nov-a.general.q2 and followup1 stay in the present
   - *sagtens* = «به‌راحتی», so 2020-nov-a.sitB.followup1 stays as drafted
   - Kimi's added «در بازی رایانه‌ای» (2020-maj-a.sitB.followup1) is not used
4. **Systematic rules 1–7** are adopted as written. Rules 8–10:
   - *børn* = «بچه‌ها»
   - compound infinitives with a space («صحبت کردن»), and the guide's example is updated
   - optional kasra only where it prevents a misreading
5. **Uncertain items, decided:**
   - *seje* = «جسور و نترس»
   - *økonomisk friplads* = «تخفیف هزینهٔ مهدکودک» (no Danish term)
   - *gymnasieuddannelse* keeps «gymnasium (دبیرستانِ پیش‌دانشگاهی)» per the glossary
   - the Danish words in parentheses are written in lowercase, as dictionary forms («ufaglærte»)
   - *B12* stays in Latin script («B12»), in this item and its 2019 copy
   - «سرقت به‌زور» for *røveri* is kept
   - 2021-maj-b.sitB.followup1 keeps the requirement reading («لازم است…»)
6. **Across both reviews, «شانس» → «امکان»,** including this review's own 2023-maj-a.sitB.followup1 suggestion.

## Full report

**Overall:** the orthography is clean. I found:
- no Arabic ي/ك and no presentation forms
- no Latin `, ; ?`
- no ZWNJ after a non-joining letter
- every «می/نمی» has its ZWNJ
- «هٔ» used throughout
- Persian digits everywhere

The guide's markers are applied consistently, and repeated texts (2021-maj-a / 2023-maj-c general.q2) have identical translations.

The remaining problems are calques, a few Iranian colloquialisms, five recurring terms that should change, one subject-agreement slip and one rendering bug (below).

**Rendering bug (Error, code, not a translation problem):** in `2021-nov-a.sitA.followup1.answer`, "Too Good To Go" displays as **"Go To Good Too"**. I confirmed this in Chromium.
- **Cause:** `latinRun` in `/Users/amin/Projects/PD3/the-app/src/features/study/translation-toggle.tsx` wraps each Latin word in its own `<bdi>`. The spaces between the `<bdi>`s then take the RTL direction, so the words come out in reverse order.
- **Fix:** let the run include the spaces between Latin words, so the whole name sits in one `<bdi>`. Example: `/([\p{Script=Latin}\d]+(?:[-+’' ][\p{Script=Latin}\d]+)*)/gu`. Then check the multi-word Danish names in batches 1–2.

## 1. Findings

The corrected Persian is given for each item.

**2020**
- `2020-maj-a.sitA.followup1.answer` – S – «مزیت‌ها مهم‌ترند» doesn't say "outweigh". – «اما به نظر من مزیت‌ها بیشتر است، چون بچه‌ها بیشتر با هم بازی می‌کنند.»
- `2020-maj-a.sitB.q1.answer` – SF – the double comma «، در نتیجه،» is heavy, and «دیدار می‌کنند» is too formal for meeting online. – «…هیجان‌انگیز باشند و در نتیجه دست کشیدن از بازی سخت است.» / «…آنلاین بازی می‌کنند و در نتیجه همان‌جا همدیگر را می‌بینند.»
- `2020-maj-a.sitB.followup1.answer` – S – «خواب نامناسب» is unidiomatic. Kimi's E fix adds «در بازی رایانه‌ای», which isn't in the Danish. – «…اضافه‌وزن و خواب بی‌کیفیت شود. مهارت‌های اجتماعی‌ای را هم که بازی رودررو یاد می‌دهد، یاد نمی‌گیرند.»
- `2020-maj-b.sitA.q1.answer` – SF – «دوم اینکه در نتیجه،» is clumsy here (*så* = "then"), and «مراجعانی … که بیمارند» is roundabout. – «دوم اینکه در این صورت، پزشکان وقت بیشتری برای بیمارانی خواهند داشت که واقعاً بیمارند.» (If «واقعاً» counts as an addition: «…برای کسانی خواهند داشت که بیمارند.»)
- `2020-maj-b.sitA.followup1.answer` – SF – «بیش از حد دیر» is a calque of *for sent*. – «در نتیجه، بیماری دیرتر از موقع تشخیص داده می‌شود و…»
- `2020-maj-b.sitB.followup1.answer` – S – «طوری که» should be «که در آن». – «…یک گروه درجه‌یک و یک گروه درجه‌دو به وجود می‌آورد که در آن ثروتمندان زودتر از فقیران کمک می‌گیرند.»
- `2020-maj-b.general.q2.answer` – S – «متخصصان بیشتری و تجهیزات بهتری» – «متخصصان بیشتر و تجهیزات بهتری دارند.»
- `2020-maj-b.general.followup1.answer` – S – heavy phrasing. – «ترجیح می‌دهم کمی بیشتر رانندگی کنم و بهترین درمان را بگیرم.»
- `2020-maj-c.sitA.q1.answer` – SF – «جا می‌افتند» is Iranian-colloquial, and in Dari «جا افتادن» suggests "be left out". – «اول اینکه کارکنان بهتر با محیط کار سازگار می‌شوند.»
- `2020-maj-c.general.q2.answer` – SF – same term; «مراجع رسمی» is formal Iranian. – «…افراد خارجی با جامعه سازگار نمی‌شوند. صحبت کردن با همسایه‌ها و اداره‌های دولتی برایشان سخت است.»
- `2020-maj-c.general.followup1.answer` – SF – «زبان کلید جا افتادن است» is unnatural. – «فکر می‌کنم این کار سازگار شدن با جامعه را دشوارتر می‌کند. … زبان کلید سازگار شدن با جامعه است.»
- `2020-nov-a.general.q2.answer` – S – «پیوند برقرار کند» – «…با او پیوند عاطفی برقرار کند.»
- `2020-nov-a.general.followup1.answer` – S – «برابری را کمتر می‌کند» is odd. – «فکر می‌کنم به برابری جنسیتی آسیب می‌زند.»
- `2020-nov-b.general.q2.answer` – S – *kan* here is a possibility (rule 4), not ability. – «کمون (شهرداری؛ دولت محلی) هم ممکن است از آن‌ها برای صرفه‌جویی در هزینه‌ها استفاده کند.» Kimi's E on «بیشتری» is correct.
- `2020-nov-c.sitA.q1.answer` – SF – «جا بیفتند» – «…می‌خواهند در جمع پذیرفته شوند.»
- `2020-nov-c.sitA.followup1.answer` – SF – «در وقت استراحتی که برای آن دارند» is opaque. – «سیگار کشیدن ممکن است در وقت‌های استراحت برای سیگار، حس با هم بودن ایجاد کند.»
- `2020-nov-c.sitB.followup1.answer` – S – «رابطهٔ نامناسبی با بدن» – «…ممکن است باعث شود نگاه ناسالمی به بدنشان پیدا کنند.»

**2021**
- `2021-maj-a.general.followup1.answer` – SF – after «، در نتیجه،» the subject is unclear (it reads as if the help can concentrate). *så man kan* expresses purpose. – «فکر می‌کنم این کمک به آدم آرامش می‌دهد تا بتواند روی جست‌وجوی شغل تمرکز کند.»
- `2021-maj-b.sitA.followup1.answer` – S – «طی کردن مسیر» – «سفر بیشتر طول می‌کشد، اما خودِ سفر بخشی از تجربه می‌شود.»
- `2021-maj-b.general.followup1.answer` – S – «با خودروی برقی رانندگی کنند» – «شاید مردم مجبور شوند از خودروی برقی استفاده کنند، …»
- `2021-maj-c.sitA.q1.answer` – SF (Dari) – «تنقلات» is Iranian-formal. – «…برای مثال شیرینی و شکلات یا لوازم آرایش.»
- `2021-maj-c.sitB.q1.answer` – SF – «سرسخت» first means "stubborn", which is not *seje* (show-off "tough/cool"). Kimi accepted it, but I disagree. – «…می‌خواهند نشان دهند که جسور و نترس‌اند.»
- `2021-maj-c.general.q2.answer` – S – «ارتکاب جرم‌های بیشتری را یاد بگیرند» is stiff. – «…جایی که ممکن است با جرم بیشتر آشنا شوند.» (The same applies to `general.followup1`.)
- `2021-nov-a.sitA.followup1.answer` – S – «برنامه» means both *madplan* and "app" in one text. – «…از اپلیکیشن‌هایی مثل Too Good To Go استفاده کرد.» (See also the rendering bug above.)
- `2021-nov-b.sitA.q1.answer` – SF – «در صف خودروها نمی‌ماند» is a calque. Persian says ترافیک. – «…چون آدم در ترافیک نمی‌ماند و لازم نیست دنبال جای پارک بگردد.»
- `2021-nov-b.sitB.followup1.answer` – SF – «ترافیک بیشتر می‌شود و آلودگی و سروصدا هم بیشتر می‌شود.»
- `2021-nov-b.general.q2.answer` – SF – «…و این باعث کاهش انتشار دی‌اکسید کربن و ترافیک کمتر می‌شود.»
- `2021-nov-b.general.followup1.answer` – S – «به دفعات زیاد حرکت کنند» – «…سریع باشند و مرتب حرکت کنند، …»

**2022**
- `2022-maj-a.sitA.q1.answer` – SF – «بربیایند» is colloquial Iranian, and «از پس … برآمدن» is opaque to Dari readers. Also «، در نتیجه، کار تمام‌وقت». – «…سخت باشد و در نتیجه کار تمام‌وقت برایشان بیش از حد سنگین باشد. … اگر شریک زندگی‌شان تمام‌وقت کار کند، می‌توانند هزینه‌هایشان را تأمین کنند.»
- `2022-maj-a.general.followup1.answer` – S/Dari – «سرحال‌ترند» is Iranian. – «…چون استراحت بیشتری کرده‌اند و بهتر از وقتشان استفاده می‌کنند.»
- `2022-maj-b.sitB.followup1.answer` – SF – «دزدها نمی‌خواهند از آن‌ها فیلم بگیرند» can be read as the thieves not wanting to film. – «…چون دزدها نمی‌خواهند از آن‌ها فیلم گرفته شود.»
- `2022-maj-c.sitB.q1.answer` – SF – there are two problems:
  - «مراکز نگهداری کودک» breaks the glossary (*daginstitution* = «مهدکودک»), and the same topic already uses «مهدکودک».
  - «بیش از حد زیادند / کم‌اند» is a calque.
  - Fix: «دوم اینکه به نظر برخی، در مهدکودک‌ها تعداد بچه‌ها بیش از اندازه زیاد و تعداد بزرگسالان بیش از اندازه کم است.»
- `2022-maj-c.general.q2.answer` – SF – «بیش از حد زود» – «برخی هم معتقدند که بچه‌ها زودتر از موقع از خانه دور می‌شوند.»
- `2022-maj-c.general.followup1.answer` – S – *økonomisk friplads* is a fee reduction, not a paid allowance. – «…با تخفیف هزینهٔ مهدکودک ارزان‌تر است.» (Uncertain, see 3.)
- `2022-nov-a.sitA.q1.answer` – SF – the second clause is a calque of *også*. – «دوم اینکه جوانان خودشان را با یکدیگر مقایسه می‌کنند، از جمله در شبکه‌های اجتماعی.» Also «انتظارهای بالایی».
- `2022-nov-a.sitA.followup1.answer` – SF – «احساس ناخوشبختی» is rare and awkward. – «…ممکن است دچار استرس شود و احساس ناراحتی کند.»
- `2022-nov-a.sitB.q1.answer` – SF – «دربیاورند» is colloquial. – «…خودشان برای لباس، تلفن و وقت آزادشان پول به دست آورند.»
- `2022-nov-a.general.q2.answer` – S – *faglærte* means skilled trades, not «آموزش‌دیده» (that is *uddannet*). – «…کمبود نیروی کار فنی ماهر وجود دارد، …»
- `2022-nov-b.sitA.q1.answer` – S – «…کافه و کنسرت هست و جوانان دیگر هم زیادند.»
- `2022-nov-c.sitA.followup1.answer` – SF – «در رزومه‌اش نشانهٔ بی‌ثباتی به نظر برسد» – «اما اگر آدم بیش از حد زیاد شغل عوض کند، ممکن است رزومه‌اش بی‌ثبات به نظر برسد و…»
- `2022-nov-c.sitB.q1.answer` – S – «گامی رو به بالا» – «…ممکن است یک پله پیشرفت در مسیر شغلی باشد.»
- `2022-nov-c.sitB.followup1.answer` – SF – «ایدهٔ خوبی» breaks the master «فکر خوبی», and «ممکن است» appears twice. – «…مدیر همکاران سابقش شود و این کار می‌تواند سخت باشد. … اما در کل فکر می‌کنم فکر خوبی است.» (Or «…کار خوبی است» to avoid the repeated فکر.)

**2023**
- `2023-maj-a.sitB.followup1.answer` – S – the last sentence has no subject. – «این کار ممکن است بعدها شانس پیدا کردن شغل را هم کم کند.»
- `2023-maj-b.sitB.followup1.answer` – SF (Dari) – «خوش بگذراند» – «…زمانی هم هست که آدم باید تفریح کند و با افراد تازه آشنا شود.»
- `2023-maj-b.general.followup1.answer` – SF – the subject «جامعه» doesn't agree with «بپذیرند». – «اما جامعه می‌تواند تعیین کند که در هر یک از دوره‌های تحصیلی چند نفر پذیرفته شوند.»
- `2023-maj-c.general.followup1.answer` – S – «تعیین محدودیت زمانی به مردم انگیزه می‌دهد…»
- `2023-nov-a.sitA.followup1.answer` – SF – «بیش از حد دیر» – «…ممکن است دیرتر از موقع تشخیص داده شوند و در نتیجه درمانشان سخت‌تر باشد.»
- `2023-nov-a.sitB.followup1.answer` – S – «از نظر پزشک دور بماند» – «…ممکن است مشکل جدی‌ای از چشم پزشک دور بماند.»
- `2023-nov-b.sitA.q1.answer` – SF – «دربیاورند» – «…می‌توانند برای بازنشستگی‌شان پول بیشتری به دست آورند.»
- `2023-nov-b.sitB.q1.answer` – SF – «دربیاورند» – «دوم اینکه می‌خواهند فوراً درآمد داشته باشند.»
- `2023-nov-b.sitB.followup1.answer` – S – the capital U inside the parentheses mid-sentence looks odd. Consider «(ufaglærte)»; the owner should decide, since rule 7 says "as in the Danish text".
- `2023-nov-b.general.followup1.answer` – S – «منصفانه نیست که مجبور باشند به‌اندازهٔ یک کارمند اداری کار کنند.»
- `2023-nov-c.sitA.q1.answer` – S – «…محصولات گیاهی در فروشگاه‌ها بسیار بیشتر شده‌اند.»
- `2023-nov-c.sitB.followup1.answer` – SF – «هواپیماها سبزتر شوند» is a calque. – «…شاید با فناوری تازه، هواپیماها پاک‌تر شوند…»

**2024**
- `2024-maj-a.general.q2.answer` – SF – «ایدهٔ خوبی» should be «فکر خوبی». *kunne bruges* is counterfactual. – «می‌شد این پول را برای مدرسه‌ها و مراقبت از سالمندان خرج کرد. … می‌تواند فکر خوبی باشد.»
- `2024-maj-a.sitA.followup1.answer` – S/Dari – «حوصلهٔ کودکان سر نرود» is Iranian. – «…تا کودکان خسته و بی‌حوصله نشوند.»
- `2024-maj-b.sitB.q1.answer` – SF – the glossary keeps *gymnasium* in Danish (as in `2022-nov-a.general.followup1`), and «این سال‌ها» needs «در». – «…ترجیح می‌دهند به‌جای آموزش فنی‌وحرفه‌ای به gymnasium (دبیرستانِ پیش‌دانشگاهی) بروند. علاوه بر این، در این سال‌ها…»
- `2024-maj-c.sitA.followup1.answer` – S – «قوانین روشنی بگذارند» is more natural than «مقررات» for classroom rules.
- `2024-maj-c.sitB.followup1.answer` – S – «گذار به نمره گرفتن» is a calque. – «…و تغییر به نظام نمره‌دهی در سال‌های آخر مدرسه ممکن است سخت باشد.»
- `2024-maj-c.general.q2.answer` – S – «…و عقب نماندن از کلاس برای دانش‌آموزان ضعیف سخت شود.»

**Where I disagree with Kimi:**
- **`2021-nov-a.general.q2.answer` and `2021-nov-a.general.followup1.answer`, the "future" E's:** Persian present tense («می‌خرند», «ادامه می‌دهند») naturally carries a future or predicted result. «خواهند خرید» is stiffer and not needed, so these are not E. At most they are S.
- **`2020-nov-a.sitB.followup1.answer`:** *sagtens* does mean "easily / without problem", so «به‌راحتی» is faithful. I would keep the draft.

## 2. Systematic rules (apply mechanically)

1. **Double comma with «در نتیجه»** (10 times «، در نتیجه،», 13 times «و در نتیجه،»):
   - Mid-sentence, drop the comma after «در نتیجه».
   - When *så* means purpose ("so that"), use «تا».
   - When *så* means "then" after a condition, use «در این صورت» or «آن وقت».
   - At the start of a sentence, «در نتیجه،» is fine.
2. **Calques of *for* + adjective/adverb:**
   - *for sent* → «دیرتر از موقع»
   - *for tidligt* → «زودتر از موقع»
   - *for mange / for få* + noun → «بیش از اندازه زیاد / کم»
   - Keep «بیش از حد» with verbs and quantities (*arbejde for meget*, *vare for længe*, *for passive*).
3. ***kø* (traffic) → «ترافیک»**, not «صف خودروها». This affects 3 items and the batch 4 master term.
4. ***integration / passe ind* → «سازگار شدن (با جامعه / با محیط کار)»** or «پذیرفته شدن در جمع», never «جا افتادن». This affects 4 items and the batch 3 master term. Grep earlier batches too.
5. **Colloquial subjunctives:** «دربیاورند» → «به دست آورند» / «درآمد داشته باشند», and «بربیایند» → «تأمین کنند».
6. ***god idé* → «فکر خوبی»** everywhere (it's the majority form, 9 of 11 across all batches).
7. ***fysisk* (body or health) → «جسمی»** (*fysisk og psykisk* → «جسمی و روانی»). Use «بدنی» only in «کار بدنی» (manual work). This affects `2022-maj-a.sitA.q1.answer` and `2023-nov-b.sitA.followup1.answer`.
8. ***børn*:** 2020–23 use «بچه‌ها» and batch 6 uses «کودکان». Both are acceptable, but pick one per register. I suggest «بچه‌ها» (the majority), or leave it and note it. S only.
9. **Optional kasra marks** («دانمارکیِ», «فوریِ», «خوبِ», «گرفتنِ») are used unevenly. Keep them only where they prevent a misreading. S.
10. **Compound infinitives:** the guide example uses «صحبت‌کردن» and the rest use the spaced form («صحبت کردن», «پیدا کردن»). Pick one. S.

## 3. Uncertain, for the owner to check

- **`2021-maj-b.sitB.followup1.answer`:** *Der skal produceres mindre nyt tøj* means "less needs to be produced". «لازم است … کمتری تولید شود» can read as a demand. One option: «دیگر لازم نیست به این اندازه لباس نو تولید شود».
- **`2021-maj-c.sitB.q1.answer`:** *seje*. I suggest «جسور و نترس».
- **`2022-maj-c.general.followup1.answer`:** should *økonomisk friplads* be «تخفیف هزینهٔ مهدکودک», and should the Danish term be kept?
- **`2024-maj-b.sitB.q1.answer`:** should *gymnasieuddannelse* keep the Danish *gymnasium*?
- **`2023-nov-b.sitB.followup1.answer`:** the capitalisation of «Ufaglærte» in the parentheses.
- **`2023-nov-c.sitA.followup1.answer`:** «ب۱۲» or Latin «B12». Afghan readers mostly see B12. This is a reuse from 2019, so change both.
- **`2022-maj-b.sitA.q1.answer`:** «سرقت به‌زور» for *røveri*.

## 4. Dari check list

These need a Dari reader to confirm (shared alternative in brackets):

**Everyday words**
- «خودرو» (Afghan «موتر»; «ماشین» is understood by both)
- «بازی رایانه‌ای» (better «بازی کامپیوتری», which both understand)
- «تلفن همراه» (Afghan «موبایل»)
- «اجارهٔ خانه» (Dari «کرایهٔ خانه»)
- «رزومه» (Dari «سی‌وی»)
- «برق‌کار»
- «بنّا»

**Health and care**
- «بیمارستان» / «شفاخانه»
- «پزشک» / «داکتر»
- «درمانگاه اورژانس» (Dari «عاجل»)
- «مهدکودک» (Afghan «کودکستان»)

**Work and money**
- «دستمزد» / «معاش»
- «مرخصی» / «رخصتی»
- «کمون (شهرداری؛ دولت محلی)» / «شاروالی»
- «ترفیع»

**Social and media terms**
- «جا افتادن», which I propose dropping
- «مراجع رسمی» (better «اداره‌های دولتی»)
- «گروه پیشاهنگی»
- «اتاق پژواک»
- «اضطراب اقلیمی»
- «پایدار» for *bæredygtig*
- «چرخهٔ معیوب»
- «بازده مالی»

**Iranian idioms**
- «سرحال»
- «حوصله سر رفتن»
- «خوش گذراندن»
- «تنقلات»
- «از پس … برآمدن»
- «دربیاورند»

## 5. UI strings

- **`study.answerTranslationSource` «ترجمهٔ برنامه»: not clear enough.**
  - «برنامه» also means "plan / programme / schedule". The answers themselves use «برنامهٔ غذایی» and «برنامه‌های وقت آزاد», so the label can read as "translation of the programme".
  - It also doesn't say what it is *not*, while the booklet's own question translations sit behind a plain «ترجمه» toggle on the same page.
  - **Fix:** «ترجمه از این برنامه است، نه از کتابچه.» It fits on its own caption row at 375 px.
  - For consistency, also change `examiner.translation` «ترجمهٔ برنامه: {meaning}» → «ترجمهٔ این برنامه: {meaning}», which matches mock `examiner.app` «متن این برنامه».
- **`study.sampleTranslation` «ترجمهٔ پاسخ نمونه»:** OK.
- **`study.shortAnswerTranslation` «ترجمهٔ پاسخ سؤال تکمیلی»:** it doesn't mirror the panel title «یک پاسخ کوتاه نمونه». Fix: «ترجمهٔ پاسخ کوتاه نمونه».
- **`study.exampleTranslation` «ترجمهٔ مثال از دید یک پرستار»:** OK. It matches `study.example`.
- **`mock.review.answerTranslation` «ترجمهٔ پاسخ نمونه به {question}»:** OK. The placeholder sits naturally, and the role labels (`سؤال اجباری اول` and so on) read well.

## 6. Count

- 58 items have findings above.
- **108 of the 166 items are signed off without findings** (some of them are still touched by the systematic rules 8–10, which are S only).
- The rendering bug in `translation-toggle.tsx` is separate and blocking for `2021-nov-a.sitA.followup1.answer`.

**Files:**
- Reviewed: `/private/tmp/claude-501/-Users-amin-Projects-PD3-the-app/f639efff-107e-4b74-b29b-928d045f530c/scratchpad/pairs-fa-2.md`
- UI strings: `/Users/amin/Projects/PD3/the-app/messages/fa.json` (lines 141, 308–311, 657)
- Bidi bug: `/Users/amin/Projects/PD3/the-app/src/features/study/translation-toggle.tsx`
- My bidi test script: `/private/tmp/claude-501/-Users-amin-Projects-PD3-the-app/f639efff-107e-4b74-b29b-928d045f530c/scratchpad/plr2/bidi.mjs`

**Heads-up:** `scratchpad/fa-only.txt` is being overwritten by another process in the same session (it held text from another batch when I read it). I re-ran all my checks on a private copy, but other agents shouldn't rely on that file.
