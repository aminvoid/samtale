# Persian review: answer translations 2016–2019

- **Reviewer:** `persian-localization-reviewer`, 2026-11-26 (read-only; saved by the main thread).
- **Scope:** 147 drafts (batches 1–2), checked against `docs/content/answer-translation-guide.md`, the glossary and the i18n rules, alongside Kimi's fidelity reviews.
- **Result:**
  - No new meaning errors; about 23 SF and 19 S.
  - 91 of 147 signed off without findings.
  - The mechanical orthography is clean: no Arabic ي/ك, no presentation forms, ZWNJ and ezafe correct.

## Decisions (main thread, by delegation, 2026-11-26)
1. **SU forms:** use the glossary's base forms «SU» / «SU-lån» inside Persian, never the Danish inflected forms with an apostrophe. Guide rule 7 is updated.
2. **RKI:** new glossary row «RKI (فهرست بدهکاران)».
3. **Photos:** social-media photos are «عکس». The glossary's "تصویر, not عکس" row is limited to the exam picture card.
4. **Recurring terms:**
   - *gøre en forskel* = «تأثیر مثبت گذاشتن»
   - *I teorien* = «از لحاظ نظری»
   - a house garden = «باغچه»
   - *kede sig* = «بی‌حوصله شدن»
   - *også* = «هم» («همچنین» is reserved for *Derudover*)
5. **«در نتیجه»** takes a comma only at the start of a sentence.
6. **Where this review disagrees with Kimi** (2017-nov-c.sitA.q1, 2017-nov-b.sitB.followup1), this review's wording is used. «بله، قطعاً همین‌طور فکر می‌کنم» stays as drafted.
7. **The Iranian idioms** listed under "Systematic" 4 are replaced everywhere.

## Full report

I read all 147 items in /private/tmp/claude-501/-Users-amin-Projects-PD3-the-app/f639efff-107e-4b74-b29b-928d045f530c/scratchpad/pairs-fa-1.md against the translation guide, the glossary, the i18n-rtl rules, the two batch reports and Kimi's two reviews. I didn't edit any project file.

**The mechanical orthography is clean.** A script over every FA line found:
- no Arabic ي or ك, no presentation forms, and every line is NFC
- no Latin digits or Latin punctuation, apart from the apostrophe in `SU'en`
- no «می» without ZWNJ and no ZWNJ after a non-joining letter
- every ها-plural and every ‌اند/‌ای suffix written correctly
- «هٔ» used throughout, with no «ه‌ی» and no missing ezafe that I could find
- compound infinitives consistently written with a space («پیدا کردن»)

So nearly all the findings below are about naturalness, consistency and Dari.

## 1. Findings

### Errors (E)
None. I found no meaning error that Kimi missed.

### Should fix (SF)
- `2016-maj-a.general.q2` – SF – «به زندان نمی‌افتند» is Iranian colloquial, and «ارتکاب جرم‌های بیشتری را یاد بگیرند» is a calque – «یک مزیت این است که جوانان همراه با مجرمان بزرگسال به زندان نمی‌روند، جایی که ممکن است جرم‌های بیشتری یاد بگیرند.»
- `2016-maj-b.sitA.q1` – SF – «باغ» means an orchard or a large garden; a house garden is «باغچه», which both Iranian and Afghan readers use. «مراکز» is vague for *institutioner* (daycare) – «اول اینکه با همان پول می‌شود فضای بیشتر و یک باغچه داشت.» / «علاوه بر این، اغلب مدرسه‌ها و مهدکودک‌های خوبی در نزدیکی هستند.»
- `2016-maj-b.sitA.followup1.answer` – SF – same «باغ» problem – «فکر می‌کنم زندگی روزمره آرام‌تر می‌شود و بچه‌ها می‌توانند بیرون در باغچه بازی کنند.»
- `2016-maj-b.general.followup1.answer` – SF – «بستگی دارد که …» is ungrammatical – «اما بستگی دارد به اینکه همهٔ اعضای خانواده این را بخواهند یا نه.»
- `2016-maj-c.general.q2` – SF – «بیش از حد زود» is a calque. The «بیش از حد» rule covers *for meget*, not *for tidligt* – «از طرف دیگر، یک عیب این است که برخی از بیماران را زودتر از موعد به خانه می‌فرستند.»
- `2016-nov-a.sitA.q1.answer` – SF (owner decision) – «SU'en» and «SU-lånet» put a Danish definite suffix and a Latin apostrophe inside a Persian sentence. The suffix means nothing to a Persian reader, and the glossary's forms are «SU» and «SU-lån» – «اول اینکه SU (کمک‌هزینهٔ تحصیلی دولت) کافی نیست، چون اجارهٔ خانه بالاست، به‌ویژه در شهرهای بزرگ.» / «علاوه بر این، SU-lån (وام تحصیلی دولت) کم‌هزینه است و نرخ بهرهٔ پایینی دارد.»
- `2016-nov-a.sitB.followup1.answer` – SF – «RKI» has no gloss, so a learner can't follow it. «سال‌های زیادی» is stiff. (Proposed glossary row below.) – «نام برخی از جوانان در RKI (فهرست بدهکاران) ثبت می‌شود و بعداً نمی‌توانند پول قرض بگیرند. این ممکن است تا سال‌ها باعث استرس شود.»
- `2016-nov-b.sitA.followup1.answer` – SF – «همچنین» here renders *også*, but «همچنین» is reserved for the *Derudover* marker. «بلدند کاری انجام بدهند» is also clumsy – «…چون از عهدهٔ کارهایی برمی‌آیند. این را هم یاد می‌گیرند که همهٔ اعضای خانواده باید به هم کمک کنند.»
- `2016-nov-c.sitB.q1.answer` – SF (Dari) – «حوصله‌اش سر نمی‌رود» is Iranian colloquial – «علاوه بر این، آدم هر روز با دیگران در ارتباط است و در نتیجه بی‌حوصله نمی‌شود.»
- *gøre en forskel* is rendered three ways (`2016-nov-c.sitB.followup1.answer` «کارش اثر دارد», `2016-nov-c.sitB.example1` «کارم … اثر داشته باشد», `2018-maj-a.sitA.q1.answer` «تأثیری بگذارند») – SF (inconsistent) – I suggest one master choice, «تأثیر مثبت گذاشتن»:
  - «وقتی آدم می‌بیند که تأثیر مثبتی می‌گذارد، خوشحال می‌شود و انگیزه پیدا می‌کند.»
  - «من خودم پرستارم و خیلی دوست دارم تأثیر مثبتی بر بیمارانم بگذارم.»
  - «اول اینکه می‌خواهند به دیگران کمک کنند و تأثیر مثبتی بگذارند.»
- `2017-nov-a.sitA.q1.answer` – SF – «برای وقتش تصمیم می‌گیرد» uses the wrong preposition – «اول اینکه آدم رئیس خودش است و خودش دربارهٔ وقتش تصمیم می‌گیرد.»
- `2017-nov-a.sitB.q1.answer` – SF (Dari) – «از پسشان بربیاید» is an Iranian idiom – «…آن‌قدر بزرگ‌اند که یک نفر نمی‌تواند به‌تنهایی انجامشان دهد.»
- `2017-nov-b.sitA.q1.answer` – SF – «توجه جلب کنند» lacks its object – «اول اینکه می‌خواهند لایک بگیرند و توجه دیگران را جلب کنند.»
- `2017-nov-b.sitA.followup1.answer` – SF – «شانس» means "luck" in Dari and in careful Persian – «ممکن است بعدها امکان پیدا کردن شغل را هم کم کند.»
- `2017-nov-c.general.q2` – SF – «کاربردی» reads as "applied"; *praktisk* here means convenient. «با انعطاف کار کرد» is stiff – «یک مزیت این است که می‌شود به‌شکل انعطاف‌پذیر کار کرد، برای مثال از خانه.» / «در مجموع معتقدم که این روش راحت است، اما باید قوانین روشنی وجود داشته باشد که مشخص کند آدم چه وقت از کار فارغ است.»
- `2018-maj-a.general.q2` – SF – three problems:
  - «هم» sits on «صرفه‌جویی», but *også* belongs to the clause ("the kommune can also…")
  - *kan* is a possibility here, so «ممکن است»
  - «هدفمندی» breaks the master «معنا» for *mening*
  
  «مزیت دیگر این است که خود داوطلبان حس با هم بودن و معنا پیدا می‌کنند.» / «کمون (شهرداری؛ دولت محلی) هم ممکن است از داوطلبان استفاده کند تا در هزینهٔ کارکنان صرفه‌جویی کند.»
- `2018-nov-b.sitA.followup1.answer` – SF (Dari) – «از پس زندگی بربیاید» – «آدم زبان‌های خارجی را خوب بلد است و نشان داده است که می‌تواند با فرهنگی تازه کنار بیاید.»
- `2019-maj-b.sitA.followup1.answer` – SF – the subject jumps from "they" («می‌سپارند») to «آدم» without being named – «به آدم کار کمتری سپرده می‌شود و تجربهٔ کمتری به دست می‌آورد و ممکن است وقتی قرار است کسی ترفیع بگیرد، آدم را در نظر نگیرند.»
- `2019-maj-b.general.followup1.answer` – SF – «از نظر نظری» repeats itself. Change the master marker for *I teorien* in batch-2.md – «از لحاظ نظری، افراد بیکار بیشتری می‌توانند شغل پیدا کنند.»
- `2019-nov-b.sitA.q1.answer` – SF (Dari) – «حوصله‌شان سر می‌رود» – «…وقتی دچار استرس می‌شوند یا بی‌حوصله‌اند، غذای ناسالم می‌خورند.»
- `2019-nov-b.sitA.followup1.answer` – SF – «نه، اگر فقط هر از گاهی باشد» can be read as a negative condition – «نه، به شرطی که فقط هر از گاهی باشد.»
- `2019-nov-c.sitA.q1.answer` – SF – «جریان دارد و جوانان زیادی و برنامه‌های … در آن هست» is awkward – «دوم اینکه زندگی دانشجویی خوبی در آنجا هست، با جوانان زیاد و برنامه‌های فرهنگی فراوان.»

### Style (S)
- `2016-maj-a.sitA.q1.answer` – S – «رفتار بدون فکر قبلی» – «پس در مجموع، مسئله فشار همسالان، رفتار عجولانه و کمبود حمایت است.»
- `2016-maj-a.sitA.followup1.answer` – S – the glossary master «سابقهٔ کیفری‌ای که دیگر پاک نیست» is wordy – «اگر سابقهٔ کیفری پیدا کنند، پیدا کردن جایی برای کارآموزی یا شغل ممکن است دشوار باشد.»
- `2016-maj-a.sitB.q1.answer` – S – «بازتاب منفی» – «علاوه بر این، شرکت می‌خواهد از مشکلات و بدنامی دوری کند.»
- `2016-maj-b.sitB.q1.answer` – S – *andre* is lost, and the item mixes «کودکان» and «بچه‌ها» – «…برای مثال در نگهداری از بچه‌ها و آشپزی. علاوه بر این، بچه‌ها می‌توانند با بسیاری از بچه‌های دیگر بازی کنند.»
- `2016-nov-a.general.q2` – S – «خوب است اگر …» follows English/Danish structure – «در مجموع معتقدم که اگر جوانان خودشان بخشی از اجارهٔ خانه را بپردازند، اشکالی ندارد.»
- `2016-nov-b.sitB.q1.answer` – S – «علاوه بر این، مهم است که به بچه‌ها یاد بدهیم تعادل را حفظ کنند.»
- `2016-nov-b.general.followup1.answer` – S – «افراد صاحب اختیار» and «اهل نقد» – «فکر می‌کنم ممکن است احترام گذاشتن به بزرگ‌ترها و مسئولان برای برخی از بچه‌ها سخت‌تر شود…» / «…آن‌ها را مستقل و منتقد هم بار بیاورد…»
- `2017-maj-a.sitA.followup1.answer` – S – «آدم» is repeated – «کارفرمایان می‌توانند ببینند که آدم تجربه دارد و شاید از قبل کسانی را در آن حوزه بشناسد.»
- `2017-maj-a.general.followup1.answer` – S – «اما از طرف دیگر، شاید رشته‌ای را انتخاب کنند که واقعاً دوست دارند و در نتیجه افراد کمتری ترک تحصیل کنند.»
- `2017-maj-c.general.q2` – S – «بازی‌هایی با زبان و اعداد» → «بازی‌های مربوط به زبان و اعداد». «به هم بزند» is colloquial – «ممکن است به خواب و تمرکزشان هم آسیب بزند.»
- `2017-nov-b.general.q2` – S – «احمقانه» is harsh for *dumme* in a polite register – «…تصاویر و نظرهای نسنجیدهٔ دوران جوانی هیچ‌وقت از بین نمی‌روند.»
- `2018-maj-b.sitB.followup1.answer` – S – «مهم است که همه دربارهٔ آن آشکارا صحبت کنند و با هم راه‌حل پیدا کنند.»
- `2018-nov-a.sitA.q1.answer` – S – *lære at kende* means "get to know" – «اول اینکه همکاران بیرون از محیط کار با هم بهتر آشنا می‌شوند.»
- `2018-nov-a.sitB.followup1.answer` – S – *hold* and *teamet* (`general.q2`) should both be «تیم» – «…چون احساس می‌کنند یک تیم‌اند.»
- `2018-nov-b.sitB.q1.answer` – S – «وقفه» is fine but bookish – «…و نیاز دارند مدتی استراحت کنند.» The summary would then read «مسئله استراحت، پول و روشن شدن مسیر است.»
- `2019-maj-a.sitA.followup1.answer` – S – «…ممکن است حوادث بیشتری رخ دهد، به‌ویژه برای سالمندان. تحرک بدنی آدم هم کمی کمتر می‌شود.»
- `2019-maj-c.sitA.followup1.answer` – S – «بعضی» goes against the guide's «برخی» rule – «اما برخی موزه‌ها روزهای رایگان دارند و این کمک می‌کند.»
- `2019-nov-a.sitA.q1.answer` – S – «علاوه بر این، فرهنگ محیط کار ممکن است مردانه باشد.»

### Where I disagree with Kimi
- **Word order of «قطعاً»** (`2016-nov-a.sitB.followup1`, `2017-nov-b.sitA.followup1`): «بله، قطعاً همین‌طور فکر می‌کنم» is natural Persian, not Danish word order. Either version is fine. If you adopt Kimi's version, update the batch-1 marker table so later batches follow it.
- **`2017-nov-c.sitA.q1`:** Kimi's fix «بیش از حد از توانش برای آن کار کند» is unnatural. Use «اول اینکه آدم شاید چون عاشق کارش است، بیش از حد خودش را وقف آن کند.» It's also clear to Dari readers.
- **`2017-nov-b.sitB.followup1`:** Kimi's «زندگی‌کردنش» breaks the draft's convention of writing compound infinitives with a space. Use «…شاید بیشتر برای نشان دادن زندگی‌اش زندگی کند تا برای اینکه واقعاً آن را زندگی کند.»
- **Repeated texts:** apply Kimi's E fix for `2017-maj-b.sitB.q1` identically to `2018-maj-a.sitB.q1` (guide rule 14).

## 2. Systematic
1. **«در نتیجه» comma.** This is the one real orthography pattern, and batches 1 and 2 split on it.
   - Rule: «در نتیجه، …» only at the start of a sentence. In mid-sentence, write «…، در نتیجه …» or «… و در نتیجه …» with **no comma after it**.
   - Remove the comma after «در نتیجه» in:
     - `2018-maj-b.sitB.q1`
     - `2018-maj-c.sitA.followup1`
     - `2018-maj-c.sitB.q1`
     - `2018-nov-a.general.followup1`
     - `2018-nov-b.sitB.q1`
     - `2018-nov-b.general.followup1`
     - `2018-nov-c.sitB.q1`
     - `2019-maj-a.sitA.followup1`
     - `2019-maj-a.general.q2`
     - `2019-nov-a.general.q2`
     - `2019-nov-c.general.followup1`
     - `2016-maj-c.sitA.followup1` («و در نتیجه،»)
     - `2016-nov-c.sitB.q1` («و در نتیجه،»)
     - `2017-maj-a.general.followup1` («و در نتیجه،»)
   - The five batch-1 items that already use «، در نتیجه X» are correct.
2. **Photos.** *billeder* of social-media photos is rendered «تصویر/تصاویر». «عکس» is the natural word for both readers. The glossary's "تصویر, not عکس" row is about the exam picture card. Affected:
   - `2017-nov-b.sitA.q1`
   - `2017-nov-b.sitA.followup1`
   - `2017-nov-b.general.q2`
   - `2017-nov-b.general.followup1`
   - `2019-nov-b.general.followup1`
   
   Change these to «عکس/عکس‌ها» if the owner agrees.
3. **Danish inflected forms in glossary terms.** Use the glossary's base form («SU», «SU-lån»), not the inflected Danish form («SU'en», «SU-lånet»). This avoids the Latin apostrophe and a meaningless suffix. Guide rule 7 ("exactly as in the Danish text") should say this explicitly.
4. **Iranian idioms to swap everywhere:**
   - «حوصله سر رفتن» → «بی‌حوصله شدن»
   - «از پس … برآمدن» → «انجام دادن / کنار آمدن با»
   - «شانس» (chance) → «امکان»
   - «به هم زدن» (sleep) → «آسیب زدن / مختل کردن»
5. **«همچنین»** is reserved for *Derudover*. Render *også* as «هم».
6. ***gøre en forskel*** → «تأثیر مثبت گذاشتن» everywhere (add it to the batch-1 recurring terms).
7. ***I teorien*** → «از لحاظ نظری» (replace the batch-2 master).

## 3. Uncertain for the owner
- `2016-nov-a.sitA.q1` – keep «SU'en»/«SU-lånet» as the guide literally says, or use the base forms (systematic item 3)?
- `2016-nov-a.sitB.followup1` – gloss RKI? This needs a glossary row first, because the guide allows only glossary glosses.
- `2017-nov-b.*` and `2019-nov-b.general.followup1` – «عکس» or «تصویر» for social-media photos?
- `2018-maj-a.general.q2` – my fix also resolves the drafter's open question on *spare på personalet*: «در هزینهٔ کارکنان صرفه‌جویی کند» covers both fewer staff and fewer hours.
- `2016-maj-a.sitA.followup1` – simplify the glossary master for *plettet straffeattest* to «سابقهٔ کیفری پیدا کردن»?
- I agree with the drafter's own uncertain items and have nothing to add.

## 4. Dari check list
These are in addition to the drafter's lists in batch-1.md and batch-2.md.

**From this review:**
- «باغچه» (house garden)
- «تأثیر مثبت گذاشتن»
- «بی‌حوصله شدن»
- «پول درآوردن» (5 items; the alternative is «پول به دست آوردن / درآمد داشتن»)
- «بلد بودن»
- «حواس پرت کردن» (`2017-maj-c.sitB.followup1`)
- «سراغ شبکه‌های اجتماعی رفتن»
- «سرماخوردگی» (Dari «ریزش»)
- «قرص»
- «ب۱۲» (Afghan readers often write B12 in Latin script)
- «اوقات خوش» for *hygge*
- «ترفیع»
- «بی‌پرده»
- «تبهکار»

**From the drafter's lists, the ones I'd prioritise:**
- «خوابگاه دانشجویی» (Afghan usage «لیلیه»)
- «مستمری بازنشستگی» / «بازنشسته» (Dari «تقاعد / متقاعد»)
- «خودرو» (Dari «موتر»)
- «دانش‌آموز» (Dari «شاگرد / متعلم»)
- «نظافتچی»
- «رزومه»
- «بیمارستان»
- «مرخصی»
- «کمون»

## 5. Proposed glossary additions
- **RKI** → «RKI (فهرست بدهکاران)»: the Danish register of people with unpaid debts; anyone on it can't borrow money.
- **billede** (social-media photo) → «عکس». Limit the existing "تصویر, not عکس" row to the exam picture card.
- **gøre en forskel** → «تأثیر مثبت گذاشتن».
- **I teorien** → «از لحاظ نظری».
- **have** (house garden) → «باغچه».
- **kede sig** → «بی‌حوصله شدن».
- **Punctuation note:** «در نتیجه» takes a comma only at the start of a sentence.

**91 of the 147 items are signed off without findings.** The other 56 have at least one finding above: the itemised findings, the «در نتیجه» comma or photo-wording lists in "Systematic", or the Kimi disagreements.
