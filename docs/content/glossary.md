# Glossary: exam and app terms (fa)

Proposed by `persian-localization-reviewer` on 2026-11-20, and adopted by owner delegation. Afghan (Dari) wording still needs a human check (see `docs/reviews/2026-11-20-persian-review-pilot.md`, D-01 to D-05).

**Additions on 2026-11-22** (by delegation) from the Persian review of the remaining 48 topics (`docs/reviews/2026-11-21-persian-review-48-topics.md`): the rows from *ren straffeattest* to *ufaglært arbejde* at the end of the table, and the notes on *kommune* and *løn*. The Dari words that review lists still need the same human check (`docs/content/dari-check.md`).

**Rules:**
- **Interface copy uses the Persian form.**
- **Show the Danish term** wherever learners must recognise it at the exam: isolated, `lang="da"`, with the Persian explanation.
- **Booklet text keeps the author's wording,** including her register («به نظرت»).
- **«چرا؟ چرا نه؟» is an app display hint, never content.** When a Danish follow-up ends *Hvorfor? / Hvorfor ikke?* and the booklet's Persian leaves it out, the app shows «چرا؟ چرا نه؟» beside the author's line, never inside it (see `pipeline.md`).

**Style:**
- **Exam:** «آزمون», never «امتحان» (also not for "try"). Use «تلاش» for retry.
- **Answer:** «پاسخ», not «جواب».
- **Ezafe after a silent h in interface copy:** «هٔ» (U+0647 U+0654). Booklet text keeps «ه‌ی».
- **Search folds** «ه‌ی»/«هٔ»/«ه», ي/ی, ك/ک and ZWNJ.
- **Persian digits:** use a colon or another clear separator. A middle dot («·») next to a Persian digit can look like «۰».

| Danish | Persian (interface) | Explanation for learners | Note |
|---|---|---|---|
| Prøve i Dansk 3 (PD3) | آزمون دانمارکی ۳ (PD3) | آزمون زبان دانمارکی سطح ۳ | Keep "PD3" in Latin, isolated |
| mundtlig prøve | آزمون شفاهی | | |
| skriftlig prøve | آزمون کتبی | | |
| delprøve | بخش (آزمون) | آزمون شفاهی دو بخش دارد | Gloss *delprøve 1/2* at first use |
| delprøve 1 | بخش اول: ارائهٔ آماده‌شده | موضوعی که از قبل آماده کرده‌اید | |
| delprøve 2 | بخش دوم: گفت‌وگو دربارهٔ موضوع آماده‌نشده | قرعه، حدود ۱۰ ثانیه نگاه، حدود ۴½ دقیقه سؤال | |
| eksaminator | ممتحن | معلمی از مدرسهٔ زبانی که آزمون را برگزار می‌کند؛ همهٔ سؤال‌ها را می‌پرسد | |
| censor | ارزیاب بیرونی | معلمی از مدرسهٔ زبانِ دیگر؛ کارت شناسایی را بررسی می‌کند، یادداشت برمی‌دارد، وقت را نگه می‌دارد و در نمره‌دادن اول نظر می‌دهد | **Never «سانسور»** |
| beskikket censor | ارزیاب منصوب SIRI | | |
| votering | تصمیم‌گیری دربارهٔ نمره | شما بیرون منتظر می‌مانید | |
| karakter | نمره | | |
| 7-trinsskalaen | مقیاس نمرهٔ هفت‌درجه‌ای | 12، 10، 7، 4، 02، 00، −3 | Keep the grade digits in an LTR isolate |
| bestået / ikke bestået | قبول / قبول‌نشده | | Avoid «رد شدن» in buttons |
| emne | موضوع | | |
| tema | دسته | | |
| forberedt / uforberedt emne | موضوع آماده‌شده / آماده‌نشده | | |
| lodtrækning, trække et emne | قرعه‌کشی، قرعه کشیدن | یکی از سه موضوع A، B یا C | |
| situation (A/B) | موقعیت A / B | | Avoid «موقعیت ممتحن» |
| billede | تصویر | | Not «عکس» |
| indledning (forslag til indledning) | معرفی موقعیت | ممتحن موقعیت را در یکی دو جمله معرفی می‌کند | SIRI's suggested wording |
| obligatorisk spørgsmål | سؤال اجباری | سؤالی که حتماً پرسیده می‌شود | |
| første obligatoriske spørgsmål | سؤال اجباری اول | اغلب یک سؤال *Hvorfor tror du, …?* است | |
| andet obligatoriske spørgsmål / overordnet spørgsmål | سؤال اجباری دوم (سؤال کلی) | دربارهٔ مزایا و معایب | |
| (af en mere) overordnet (karakter) | کلی‌تر | ممتحن می‌گوید سؤال کلی‌تری می‌آید | Teach recognition |
| opfølgende spørgsmål | سؤال تکمیلی | سؤالی که ممتحن بعد از پاسخ شما می‌پرسد | |
| forslag til opfølgende spørgsmål | سؤال تکمیلی پیشنهادی | ممتحن واقعی ممکن است سؤال دیگری بپرسد | |
| Undskyld, vil du godt gentage spørgsmålet? | ببخشید، می‌شود سؤال را تکرار کنید؟ | درخواست تکرار در آزمون مجاز است | Use this wording verbatim for the repeat request. |
| Tak, så er prøven forbi. | ممنون، آزمون تمام شد. | | |
| censor- og eksaminatorhæfte | دفترچهٔ ممتحن (SIRI) | | Distinct from «کتابچه» |
| (Shery Rahimi's booklet) | کتابچه | | |
| SIRI | SIRI | ادارهٔ دولتی دانمارک که آزمون را برگزار می‌کند | Never «سیری» |
| sprogcenter / sprogskole | مدرسهٔ زبان | | |
| bedømmelse / bedømmelseskriterier | ارزیابی / معیارهای ارزیابی | | |
| modelsvar | پاسخ نمونه | «یک پاسخ نمونهٔ ساده و روشن» | Never «بهترین پاسخ» |
| nøgleord | کلمه‌های کلیدی | | |
| skabelon | الگو | | |
| prøveforhold / øvelse | شرایط آزمون / تمرین | | Mock-exam modes |
| prøve (mock) | آزمون تمرینی | | |
| afbrudt | قطع‌شده | «با برچسب «قطع‌شده»» | Explain that the label describes the interruption. Never contrast it with failing. |
| trin (i interviewet) | مرحله | مرحلهٔ گفت‌وگو با ممتحن | Reserve «بخش» for delprøve. |
| optagelsessegment | تکه | تکه‌ای از ضبط یک پاسخ | |
| selvevaluering | خودارزیابی | پاسخ‌های خودتان را با نمونه مقایسه کنید | |
| svarsiden | صفحهٔ پاسخ‌ها | صفحهٔ پاسخ‌های شما و پاسخ‌های نمونه | |
| timer | زمان‌سنج | | Dari reader check pending, along with «قطع‌شده» and «مزاحم نشوید». |
| pause | مکث | | Not «توقف» |
| optagelse | ضبط | | |
| kommune | کمون (شهرداری؛ دولت محلی) | مدرسه، نگهداری کودک و مراقبت از سالمندان هم با کمون است | Afghan usage: «شاروالی». The booklet writes «شهرداری» (e.g. 2020-nov-b); its text stays as printed. A Danish kommune does far more than a city hall, so interface copy uses «کمون» and glosses it once |
| folkeskole | folkeskole (مدرسهٔ دولتی، کلاس ۰ تا ۹) | | |
| de første klasser | سال‌های اول مدرسه | | Not «کلاس‌های اول» |
| gymnasium | gymnasium (دبیرستانِ پیش‌دانشگاهی) | | Avoid «دبیرستان نظری» |
| erhvervsuddannelse | آموزش فنی‌وحرفه‌ای | | |
| social- og sundhedsassistent (SOSU) | دستیار بهداشتی‌ـ‌اجتماعی (SOSU) | | |
| autorisation | مجوز حرفه‌ای | | Not just «مجوز» |
| løn | دستمزد / حقوق | | Dari: «معاش»; «حقوق» means "rights" in Dari. **Interface copy uses «دستمزد».** The booklet's «حقوق» stays as printed; where it can be misread, a correction note suggests «دستمزد» (2020-nov-b blocks on it) |
| trivsel | حال خوب، رضایت | | |
| shadowing | سایه‌خوانی (تکرار هم‌زمان با صدا) | | Gloss at first use |
| Forstyr ikke / Do Not Disturb | مزاحم نشوید | | Device setting name |
| ren straffeattest | سابقهٔ کیفری پاک (ren straffeattest) | گواهی پلیس که نشان می‌دهد شخص محکومیت کیفری ندارد | Not «سوءپیشینهٔ پاک», which contradicts itself |
| ungdomsuddannelse | آموزش متوسطه (ungdomsuddannelse) | تحصیل بعد از folkeskole: دبیرستان (gymnasium) یا آموزش فنی‌وحرفه‌ای | Not just «دبیرستان». Dari: «لیسه» |
| SU (Statens Uddannelsesstøtte) | SU (کمک‌هزینهٔ تحصیلی دولت) | پولی که دولت ماهانه به دانش‌آموزان و دانشجویان بالای ۱۸ سال می‌دهد؛ SU-lån وام تحصیلی دولت است | Keep "SU" in Latin, isolated. A Persian field that starts with "SU" needs an explicit `dir="rtl"` |
| dagpenge / kontanthjælp | dagpenge (کمک‌هزینهٔ بیکاری) / kontanthjælp (کمک‌هزینهٔ اجتماعی) | dagpenge را صندوق بیمهٔ بیکاری (a-kasse) به عضوهایش می‌دهد؛ kontanthjælp کمک مالی کمون به کسی است که درآمد و حق dagpenge ندارد | Two different benefits: keep both Danish words, never merge them into «حمایت مالی» |
| folkepension | folkepension (مستمری بازنشستگی دولتی) | مستمری پایه‌ای که دولت از سن بازنشستگی به ساکنان دانمارک می‌دهد | |
| daginstitution | مهدکودک (daginstitution) | شامل vuggestue (برای بچه‌های زیر سه سال) و børnehave (از سه سالگی تا مدرسه) | Dari reader: «مهدکودک» still open |
| pædagog | مربی (pædagog) | کارشناس آموزش‌دیده برای کار با کودکان و جوانان، مثلاً در مهدکودک | Not «معلم» (that is *lærer*) |
| sygehjælper | کمک‌بهیار (sygehjælper) | عنوان قدیمی؛ امروز social- og sundhedshjælper | Dari reader: «کمک‌بهیار» still open |
| barsel / forældreorlov | مرخصی زایمان / مرخصی والدین | barsel مرخصی مادر و پدر بعد از تولد بچه است؛ forældreorlov بخشی از آن است که والدین بین خودشان تقسیم می‌کنند | Dari: «رخصتی» for «مرخصی» |
| sygemeldt | در مرخصی استعلاجی | کسی که به‌خاطر بیماری به کارفرما خبر داده و سر کار نمی‌رود | Dari: «رخصتی» for «مرخصی» |
| bofællesskab | bofællesskab (خانهٔ اشتراکی) | چند خانوار یا چند نفر، هرکدام با خانهٔ خودشان، که فضاهای مشترک و گاهی غذا را با هم تقسیم می‌کنند | Keep the Danish word; inside a Persian string it has no `lang="da"` (known limitation) |
| ufaglært arbejde | کار غیرتخصصی (ufaglært) | کاری که آموزش حرفه‌ای رسمی لازم ندارد | Not «کار بدون مهارت» |
| prøvedeltager | داوطلب | کسی که در آزمون شرکت می‌کند | Prefer direct «شما» in interface copy |
| opklarende spørgsmål | سؤال برای روشن‌کردن گفته‌ها | ممتحن می‌خواهد نکته‌ای را روشن‌تر بیان کنید | Guide title «روشن‌کردن گفته‌ها» |
| uddybende spørgsmål | سؤال برای توضیح بیشتر | ممتحن جزئیات بیشتر یا یک مثال می‌خواهد | Guide title «توضیح بیشتر» |
| forklaring og begrundelse | دلیل‌آوردن | ممتحن می‌خواهد توضیح دهید چرا چیزی اتفاق می‌افتد یا چرا چنین نظری دارید | |
| stillingtagen og argumentation | موضع‌گیری و استدلال | ممتحن می‌خواهد نظر خود را بیان کنید و برای آن دلیل بیاورید | |
| særlige prøvevilkår | شرایط ویژهٔ آزمون | برای نمونه وقت اضافه، وسایل کمکی یا اتاق جداگانه | |
| lytteforståelse | درک شنیداری | توانایی فهم آنچه می‌شنوید | |
| prøvetermin | دورهٔ `<da>maj–juni</da>` `{year, number, year}` | دورهٔ برگزاری آزمون | Keep the Danish term label isolated and format the year with ICU |
| fint | خوب بود | ممتحن معمولاً بعد از پاسخ شما می‌گوید *tak* | |
