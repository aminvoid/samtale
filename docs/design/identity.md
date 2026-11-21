# Identity: name and visual direction

| | |
|---|---|
| **Status** | **Options for the owner to choose.** Everything else in `docs/design/` is designed in the recommended combination (name A + direction 1). Choosing differently changes only the app name message and the colour values in `tokens.css`; components and screens don't change. |
| **Date** | 2026-11-19 |
| **Author** | `ui-designer` |
| **Feeds** | `metadata.appName` and `titleTemplate` in `messages/fa.json` (IA §4.4, DL-017), the Home `h1`, the header wordmark, the favicon |

## Constraints the name must meet

- Read naturally by Persian speakers from Iran and Afghanistan, in a Telegram message and in a browser tab.
- Not sound or look official (PRD §6.7: the app isn't made by SIRI and must never imply it).
- Not tie the app to delprøve 2 only: delprøve 1 comes later.
- Not imitate an existing language-learning brand.
- Short enough for the phone header (about 12 characters) and the tab title.

---

## Name ideas

### A. **Samtale** (recommended)

Danish for *conversation*, which is exactly what delprøve 2 is: a conversation with the examiner. Shown with a fixed Persian descriptor.

| | |
|---|---|
| Wordmark | `Samtale` (Atkinson Hyperlegible Next, 700) with the descriptor «تمرین گفت‌وگوی آزمون شفاهی PD3» beneath it on Home |
| Tab title | «موضوع‌ها · Samtale» |
| For | Names the real activity; covers delprøve 1 later (still a spoken exchange); a Danish word they'll use in the exam, so the brand itself is a tiny lesson; keeps "PD3" in the descriptor where it helps search, not in the name where it looks official |
| Against | Latin-script name in a Persian interface (Ahmad dislikes English words; Danish is less alien, but still Latin); Persian speakers may say «سام‌تاله»; a common word is hard to protect or search for alone |
| Check before choosing | `persian-localization-reviewer`: whether a Persian transliteration («سامتاله») should appear in metadata for search |

### B. **هم‌صدا** (Hamseda)

Persian for *in one voice, in unison*: speaking along, shadowing, practising together.

| | |
|---|---|
| Wordmark | «هم‌صدا» (Vazirmatn, 700) with the descriptor «تمرین آزمون شفاهی دانمارکی PD3» |
| For | Persian-first and warm; easy to say and share in Telegram; alludes to shadowing and speaking aloud; no Latin in the name |
| Against | Says nothing about Danish or the exam without its descriptor; the word is in general use, and other Persian products may already use it (the owner should search Telegram and app stores); transliteration varies (Hamseda, Hamsedaa) |

### C. **«تمرین شفاهی PD3»** (descriptive; the current placeholder)

*PD3 oral practice.*

| | |
|---|---|
| For | Instantly clear and searchable; no explanation needed |
| Against | Generic; hard to make distinctive; the closest of the three to sounding official; mixes Latin into every mention |

**Recommendation: A, Samtale**, with the Persian descriptor always visible on Home and in the page `description`. It's the only option that is distinctive, honest about the activity, and future-proof for delprøve 1. If the owner prefers a Persian-script name, B is a strong alternative.

---

## Visual directions

All three keep the same type system (Vazirmatn + Atkinson Hyperlegible Next), components, role icons and layout. They differ in palette and mood. The preview ([preview/index.html](preview/index.html)) shows direction 1.

### 1. **Fjord** (recommended)

Warm paper surfaces, deep teal ink for actions, and four quiet role hues (indigo examiner, plum sample, saffron key words, clay personal example).

| | |
|---|---|
| Mood | Calm, focused, warm; Nordic clarity with a little Persian warmth (saffron) |
| Palette | surface `#faf8f4` · text `#1b2228` · accent `#0d5c6b` · examiner `#33408f` · sample `#6a3270` · key words `#7a4e00` · example `#8a3f1e` |
| Logo idea | Two rounded speech bubbles overlapping: one with its tail on the right (Persian), one on the left (Danish), the overlap filled in accent. A conversation between the two languages. Geometric, original, drawable at 16 px. |
| For | Teal reads as trustworthy without the "bank blue" of official sites; warm neutrals stop it feeling clinical; the role hues stay distinct in both themes |
| Against | Teal is common in health apps (fitting for the nurse audience, but less distinctive) |

### 2. **Lapis and saffron**

Deep lapis blue for actions, saffron as a second accent, a faint geometric pattern (inspired by, not copied from, tile work) only on Home and empty states.

| | |
|---|---|
| Mood | Richer, more culturally expressive |
| Palette | accent `#1f3f8f` · secondary saffron `#b07800` (decorative only) · same neutrals |
| For | Feels made for this community; memorable |
| Against | Lapis and gold can feel ornamental or institutional ("official"); a pattern adds bytes and visual noise; the examiner indigo would need a new hue to stay distinct from the accent |

### 3. **Nordic plain**

Near-monochrome cool greys, one clear blue, no tints except for roles.

| | |
|---|---|
| Mood | Minimal, efficient (Sara would like it) |
| Palette | surface `#ffffff` · text `#16191d` · accent `#2457a6` |
| For | Maximum clarity and the least design maintenance |
| Against | Cold and corporate for anxious learners (Ahmad, Maryam); closest to generic government and SaaS styling |

**Recommendation: 1, Fjord.** It best fits "calm, focused, warm, neither childish nor corporate", and its contrast is already verified in both themes ([tokens.md §3](tokens.md#3-contrast-results-wcag-22-aa)).

---

## Situation visuals (the official SIRI pictures can't be used)

D-4 already decided text cards with a theme icon. The options and what each costs, for the owner's later reference:

| Option | What it is | Cost | Licence risk | Recommendation |
|---|---|---|---|---|
| **a. Typography-only cards + theme icon** | The booklet's Danish situation title, large, with a decorative lucide theme icon in a tinted chip (components.md, SituationCard) | **None**: built from tokens and the existing icon set | None (ISC-licensed icons, booklet text under the pending permission) | **v1** |
| b. Theme icon compositions | 10 original spot illustrations, one per theme, monoline at lucide's 2 px stroke, used on theme cards and situation cards | About 2–3 designer days; ~1–2 KB per SVG | None if drawn in-house (work for hire) | Optional polish after launch |
| c. Original per-situation illustrations | 102 commissioned drawings (51 topics × 2 situations) | Roughly 100–300 illustrator hours; review of each picture against the situation; image weight on slow phones | Low with a work-for-hire contract; **no AI images** (PRD) | Only if learner testing shows text cards feel wrong (personas, "what would change our minds") |

Option c also changes the exercise: cards with a Danish caption are easier than real pictures (PRD §6.5). Pictures would make the look more realistic, but drawing 102 scenes that hint at neither too much nor too little is content work as much as design work.

---

## Decisions needed from the owner

1. **Name:** A (Samtale), B (هم‌صدا) or C (descriptive).
2. **Visual direction:** 1 (Fjord), 2 (Lapis and saffron) or 3 (Nordic plain).
3. **Situation visuals:** confirm (a) for v1.
