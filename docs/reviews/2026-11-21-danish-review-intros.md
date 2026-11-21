# Danish review: 96 app-written situation intros (2016–2023)

- **Reviewer:** `danish-language-reviewer`, 2026-11-21 (read-only; saved by the main thread).
- **Source:** `scripts/content/data/app-authored.json` and `sitA.intro` / `sitB.intro` (`origin: "app"`) in `content/topics/*.json`.
- **Result:** **32 changes, 64 approved as they are.** All 96 follow the "Situation A/B viser …" pattern and are one sentence; commas are consistent; no spelling errors; **none contradicts its question.**

**Recurring problems:**
- **Some intros give the answer away** (3 blocking).
- **Some repeat the question's *selvom* clause.** SIRI intros describe the picture only; the tension belongs in the question.
- **"en person …, hun …" gender switches.** Use "en kvinde", "en mor" and so on.
- **A few vague or abstract phrasings.**

**New writing rule for intros:**
- describe what the picture shows
- never state the tension or anyone's state of mind
- never repeat the question's *selvom* clause
- never write "en person … hun"

## Changes

**E** = Error (blocking), **SF** = Should fix, **S** = Suggestion.

| ID | Sev | Suggested text |
|---|---|---|
| 2020-nov-b.sitA | E | Situation A viser nogle forældre, der har børn derhjemme og samtidig arbejder frivilligt. |
| 2020-nov-a.sitA | E | Situation A viser et par, der er sidst i trediverne og endnu ikke har fået børn. |
| 2022-nov-a.sitA | E | Situation A viser en gymnasieelev, der læser meget for at få topkarakterer. |
| 2016-maj-b.sitA | SF | Situation A viser en ung familie, der flytter i hus i en forstad eller en mindre by. |
| 2016-nov-a.sitB | SF | … et hurtigt og dyrt sms-lån. (lowercase *sms*, per Retskrivningsordbogen) |
| 2017-maj-b.sitA | SF | Situation A viser en ældre medarbejder, der stadig går på arbejde. |
| 2017-nov-a.sitA | SF | Situation A viser en person, der arbejder freelance. |
| 2017-nov-b.sitA | SF | Situation A viser nogle unge, der deler private billeder på sociale medier. |
| 2018-maj-b.sitA | SF | Situation A viser en forkølet kvinde på sit arbejde. |
| 2018-nov-a.sitA | SF | Situation A viser nogle kolleger, der er til firmafest. |
| 2018-nov-b.sitA | SF | Situation A viser en studerende på et universitet i udlandet. |
| 2018-nov-b.sitB | SF | Situation B viser nogle unge, der har et job, før de begynder på en uddannelse. |
| 2020-maj-b.sitA | SF | Situation A viser en patient i venteværelset hos lægen. (The fee is only a proposal in the question.) |
| 2020-maj-c.sitB | SF | Situation B viser nogle studerende, der bliver undervist på engelsk. |
| 2021-nov-c.sitB | SF | Situation B viser en uddannelse til lærer eller pædagog, hvor der er ledige studiepladser. |
| 2022-maj-a.sitB | SF | Situation B viser en mor, der arbejder mange timer om ugen. |
| 2022-maj-b.sitA | SF | Situation A viser et overvågningskamera på et offentligt sted. |
| 2022-maj-b.sitB | SF | Situation B viser et overvågningskamera på et hus i et boligområde. |
| 2023-maj-b.sitB | SF | Situation B viser en studerende, der tager et SU-lån. |
| 2023-nov-b.sitB | SF | Situation B viser et ungt menneske, der arbejder uden at have en uddannelse. |
| 2016-maj-a.sitA | S | Situation A viser nogle unge, der begår småkriminalitet. |
| 2016-nov-c.sitB | S | Situation B viser en person, der arbejder med mennesker i sit job. |
| 2017-maj-a.sitB | S | Situation B viser en studerende, der er i ulønnet praktik. |
| 2017-nov-b.sitB | S | Situation B viser en person, der deler mange billeder og opslag fra sin hverdag på sociale medier. |
| 2018-maj-a.sitA | S | Situation A viser en studerende, der laver frivilligt arbejde. |
| 2019-maj-a.sitB | S | Situation B viser en travl gade med mange cyklister og fodgængere. |
| 2019-nov-a.sitB | S | Situation B viser en mandlig pædagog sammen med nogle børn. |
| 2021-nov-a.sitB | S | Situation B viser en person, der køber en ny smartphone. |
| 2021-nov-b.sitB | S | Situation B viser en person, der tager bilen på arbejde. |
| 2023-maj-c.sitA | S | Situation A viser to arbejdsløse, der søger job. Den ene er ung, og den anden er ældre. |
| 2021-maj-c.sitB | generic | Situation B viser en gruppe unge, både drenge og piger. |
| 2023-nov-c.sitB | generic | Situation B viser et fly, der letter fra en lufthavn. |

## Approved as they are (64)
All other `origin: "app"` intros in 2016–2023.

## TTS hints

| Text | Where | SSML |
|---|---|---|
| SU | 2016-nov-a.sitA, 2023-maj-b.sitB | `<sub alias="es u">SU</sub>` |
| SU-lån | 2023-maj-b.sitB | `<sub alias="es u lån">SU-lån</sub>` |
| sms-lån | 2016-nov-a.sitB | `<sub alias="es em es lån">sms-lån</sub>` |
| it | 2019-nov-a.sitA | `<sub alias="i te">it</sub>` (risk of the English pronoun) |
| 55 år | 2021-maj-a.sitB | optional: `<sub alias="femoghalvtreds år">55 år</sub>` |

**Loanwords** (online, smartphone, freelance, teambuilding, fitnesscenter, chips): check by ear in the dry-run samples.

## Ideas for teaching
- which noun a relative clause *der/som* attaches to (2020-nov-b.sitA, 2023-nov-b.sitB)
- adverb before the verb in subordinate clauses
- the *selvom … alligevel* question pattern
