# Independent review (Kimi): answer translation guide

- **Reviewer:** Kimi Code CLI (`kimi -p`, read-only), 2026-11-25. Saved by the main thread.
- **Scope:** `docs/content/answer-translation-guide.md` and `docs/content/glossary.md`.
- **Result:** 2 E, 10 SF, 5 S. All E and SF items, and S 1, 13, 14, 15 and 17, are folded into the guide. E9 also corrected the glossary gloss for *dagpenge*.

1. **S — *flere* is not exactly “different.”** (`docs/content/answer-translation-guide.md:25`) «دلیل‌های مختلفی می‌تواند داشته باشد» is natural, but *flere grunde* means “several reasons,” not explicitly “different reasons.” Closer: «می‌تواند چند دلیل داشته باشد». The current wording is acceptable if consistency is preferred over this small distinction.

2. **SF — *mener* has two inconsistent fixed renderings.** (`docs/content/answer-translation-guide.md:32-33`) *Alt i alt mener jeg* becomes «در مجموع فکر می‌کنم که», while *Jeg mener* becomes «معتقدم». Use «در مجموع معتقدم که …» in the first row, or deliberately change both mappings.

3. **SF — Restrict the *synes/tror/mener* mappings to opinion-marking uses.** (`docs/content/answer-translation-guide.md:33`) The proposed mappings are good there, but mechanical reuse would cause errors: *synes om* = «دوست داشتن», *det synes* = «به نظر می‌رسد», *tro* in religious contexts = «باور داشتن/ایمان داشتن», and *mene noget med* = «منظور داشتن از». State that context overrides the marker table.

4. **E — The good example loses “too much.”** (`docs/content/answer-translation-guide.md:72,75`) *For meget mad* is «غذای بیش از حد», whereas «غذای زیادی» merely means “a lot of food.” A more faithful and neutral sentence is: «اول اینکه بسیاری از مردم بیش از حد غذا می‌خرند، مثلاً وقتی تخفیف دارد.»

5. **SF — Explicitly distinguish *bedst før* from an expiry date.** (`docs/content/answer-translation-guide.md:65,72-78`) The good translation’s «بهترین زمان مصرف» preserves the distinction, but the bad example’s «تاریخ انقضا» is criticised only for freedom and lost markers. Add that *bedst før* must not become «تاریخ انقضا»; reserve that for genuine expiry wording such as *udløbsdato*. This distinction affects food-safety meaning.

6. **SF — Add a modal-verb rule, including lexicalised expressions.** (`docs/content/answer-translation-guide.md:94`) Reviewers check modality, but drafters receive no guidance. Cover at least: *kan* = ability «می‌تواند» versus possibility «ممکن است»; *skal* = obligation «باید» versus arrangement «قرار است»; *bør* = recommendation «بهتر است/باید»; *vil* = intention «می‌خواهد» versus future; *må* = permission or necessity by context. Explicitly list *kan godt lide* = «دوست دارد», never «می‌تواند دوست داشته باشد».

7. **SF — Extend the otherwise sound *man* rule to generic *du* and passive paraphrases.** (`docs/content/answer-translation-guide.md:39-42`) Danish generic *du* should not automatically become examiner-addressing «شما»; use «آدم» or an impersonal construction. Also, do not use a passive where it removes a necessary actor or changes modality. Clarify that “first person” in the register rule describes the examples, not an instruction to recast third-person Danish.

8. **SF — Add a compound-noun rule.** (`docs/content/answer-translation-guide.md:17-20,50-53`) Require translators to interpret the compound as a whole rather than translate its components independently. Record recurring choices, for example *madspild* = «اتلاف غذا», *arbejdsmarked* = «بازار کار», and *børnefamilier* = «خانواده‌های دارای فرزند». Include a warning that Danish compound boundaries do not determine Persian wording.

9. **E — The *dagpenge* gloss confuses a benefit with insurance.** (`docs/content/glossary.md:82`; adopted through `docs/content/answer-translation-guide.md:46-53`) *Dagpenge* is the unemployment benefit payment, not «بیمهٔ بیکاری» itself. Prefer **dagpenge (کمک‌هزینهٔ بیکاری)** and distinguish **a-kasse (صندوق بیمهٔ بیکاری)**. Otherwise sentences about receiving *dagpenge* will systematically convey the wrong institution/payment relationship.

10. **SF — Align the *kommune* gloss with the glossary.** (`docs/content/answer-translation-guide.md:53`; `docs/content/glossary.md:68`) The guide specifies «کمون (شهرداری)», but the glossary specifies «کمون (شهرداری؛ دولت محلی)» and warns that a *kommune* is broader than a city hall. Use the fuller glossary wording consistently; the shorter gloss can reinforce the very misconception the glossary seeks to prevent.

11. **SF — Make institution-name precedence and the gloss exception explicit.** (`docs/content/answer-translation-guide.md:14-16,46-49`) “And so on” leaves unclear which names remain in Latin. Say that the glossary controls both retention and Persian–Danish order; do not infer that every Danish institution must remain Danish. Also state that mandated first-use glosses are the exception to “don’t add anything,” and keep them parenthetical within the same sentence.

12. **SF — Track recurring terminology, not only new markers.** (`docs/content/answer-translation-guide.md:37-38,121-125`) The glossary cannot cover all recurring vocabulary in 300 answers. Batch reports should also record new or revised translations for repeated concepts such as *madspild*, *trivsel*, *ensomhed*, and *bæredygtighed*, with one master choice reused across batches.

13. **S — Extend the numbers rule to currency, decimals, dates, and times.** (`docs/content/answer-translation-guide.md:61-65`) Specify *kroner/kr.* = «کرون», conversion of Danish decimal commas, and consistent renderings for month names and *kl.* times. Otherwise numerical content can remain formally correct while becoming inconsistent or ambiguous.

14. **S — Define country, nationality, language, and place-name handling.** (`docs/content/answer-translation-guide.md:46-49`) Common words such as *Danmark*, *dansk*, and *dansker* need explicit treatment: «دانمارک», «دانمارکی» for the language or adjective by context, and «دانمارکی‌ها/مردم دانمارک». Also specify when Danish place names use an established Persian form and when they remain in Latin.

15. **S — Prefer more neutral shared wording in the good example.** (`docs/content/answer-translation-guide.md:75`) «خیلی‌ها»، «بعضی‌ها»، and «با اینکه» are intelligible, but «بسیاری از مردم»، «برخی»، and «با آنکه» better match the stated neutral spoken-written register and reduce reliance on Iranian conversational phrasing. This is a style improvement, not a claim that the originals are incomprehensible in Dari.

16. **SF — The Dari requirement still needs an operational review gate.** (`docs/content/glossary.md:3-5`; `docs/content/dari-check.md:3-6`) Both documents say Afghan/Dari human review is pending. Do not treat the current glossary as Dari-approved: require review of new recurring choices, especially «مرخصی» versus «رخصتی»، «دبیرستان» versus «لیسه»، «بیمارستان» versus «شفاخانه»، and month names. Keep «دستمزد» rather than «حقوق»; let the Dari reviewer decide whether a first-use «معاش» gloss is helpful.

17. **S — Add a pronoun-reference rule.** (`docs/content/answer-translation-guide.md:17-20`) Distinguish dummy *det/der* from referential pronouns, and preserve the subject-oriented reference of *sin/sit/sine*. Persian «خود» should be added only where it resolves reference, not mechanically; conversely, replacing every possessive with an ambiguous «او/آن‌ها» can change who owns or performs something.

The remaining marker rows are accurate, natural, and mutually consistent. Apart from findings 1 and 4, the five-sentence model translation is faithful; the personal example at `docs/content/answer-translation-guide.md:85-87` is also faithful and natural.

