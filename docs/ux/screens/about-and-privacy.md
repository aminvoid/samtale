# Screen: About and sources; Privacy

| | |
|---|---|
| **Routes** | `/fa/about`, `/fa/privacy` |
| **Stories** | US-058, US-059 (Must; final wording at M4), US-050 #4, US-068 (explaining wording sources), OQ-18 (legal wording), D-5 (analytics), D-12 (attribution form) |
| **Milestone** | M1 (draft), M4 (final) |

## Purpose

**About:** say who made the app, where the content comes from, that it's unofficial, and how to read the source labels, so learners trust it for the right reasons (US-058). **Privacy:** say plainly what is stored, what is sent and how to delete it (US-059).

## Content hierarchy

**About (`/fa/about`)**
1. `h1` "About this app and its sources"
1a. **What it is, first** (rev. 2, R-19): practice for delprøve 2 (part 2 of the PD3 oral), built on real questions from published exams 2016–2024, with wording checked against SIRI where marked. Only then: "Not made by SIRI". **SIRI is spelled out** at first use: Styrelsen for International Rekruttering og Integration, the Danish authority that runs the exam (with a Persian gloss), because "SIRI" is also Apple's assistant.
2. **Who made it** and why (one short paragraph; owner provides)
3. **The booklet:** title, author (Shery Rahimi), credit in the agreed form (D-12), and that its content is used with permission (once recorded)
4. **Not official:** not affiliated with SIRI, danskogproever.dk or any school (US-058 #2)
5. **Where the questions come from:** published exams May–June 2016 to May–June 2024; later exam material is confidential; SIRI says material from summer 2024 and earlier may still be used in teaching (US-058 #2; SIRI practical guide §2.7)
6. **How to read the labels** (US-058 #2, US-068): a small legend
   - "SIRI's wording": checked against SIRI's examiner booklet (term given)
   - "As given in the booklet": the booklet's text, from SIRI's examiner booklets, not yet checked word for word
   - "The app's wording": written by us (transition, *"Tak."*, intros for 2016–2023, the guide, the self-check), reviewed
   - "Suggested follow-up": SIRI's suggestion; real examiners ask what they judge necessary
7. **No grades:** the app gives no official or predicted grade
8. **Official sources** (links, each marked as external): SIRI's candidate page, the exam order, the examiner booklet (US-058 #3)
9. **Booklet sources list** (booklet lines 5884–5894), after review
10. "Report a problem" (D-9 channel)

**Privacy (`/fa/privacy`)**
1. `h1` "Privacy"
2. **Stored on this device only:** progress, review schedules, mock history and ticks, settings, and recordings only if you chose to keep them (US-059 #1)
3. **Sent to our server:** page and audio requests only. **Your voice never leaves this phone** (Persian without the loanword «آپلود»; draft «صدای شما از این گوشی بیرون نمی‌رود.», rev. 2).
3a. **Telegram's built-in browser** keeps its own separate storage (R-21): progress saved there won't appear in your usual browser.
4. **Analytics:** per D-5 (currently: none)
5. **Can be lost:** clearing browser data, private windows, automatic removal of website data, a new phone (US-050 #4; OQ-11)
6. **How to delete everything:** Settings → Delete my progress (link)
7. Last updated date

## Components

PageHeader, LabelLegend (SourceLabel examples), ExternalLink, InfoNote, CreditLine, Link.

## States

| State | Behaviour |
|---|---|
| First-time | As above. |
| Loading | Static text. |
| Empty / error | E1 only. |
| Slow network, mic, storage | Not applicable (privacy page mentions storage behaviour in text). |

## Responsive behaviour

Single reading column at all widths; label legend items stack on phones, two-up at 1280.

## RTL and bidi

Danish names (SIRI document titles, "danskogproever.dk", "delprøve 2") isolated inside Persian sentences. URLs are LTR isolates. External-link icon mirrors.

## Accessibility

Headings in order; external links say they open an external site; the label legend shows each label exactly as it appears elsewhere, with its explanation as text (not a tooltip).

## Copy needs

Most body text is long-form; keep it in messages (it's interface text, not booklet content) with keys under `about.*` and `privacy.*`. Final wording depends on OQ-18 (legal) and D-12 (attribution). Key examples:

| Key | Intended meaning |
|---|---|
| `about.title` | About this app and its sources |
| `about.whatItIs` | Practice for delprøve 2 (part 2 of the PD3 oral), built on real questions from published exams 2016–2024, with wording checked against SIRI where marked. |
| `about.siriSpelledOut` | SIRI (Styrelsen for International Rekruttering og Integration) is the Danish authority that runs the exam. |
| `about.labels.situationTitle` | The booklet's description of the picture |
| `about.notOfficial` | This app isn't made by or affiliated with SIRI, danskogproever.dk or any school. |
| `about.questionsSource` | The topics come from published exams between May–June 2016 and May–June 2024. Later exam material is confidential. SIRI says material from summer 2024 and earlier may still be used in teaching. |
| `about.labels.*` | One entry per source label |
| `about.noGrade` | The app gives no official or predicted grade. |
| `privacy.title` | Privacy |
| `privacy.stored` / `.sent` / `.neverUploaded` / `.analytics` / `.canBeLost` / `.howToDelete` | As listed above |

## Wireframe

**375 px, label legend**
```
│              How to read the labels │ h2
│ ┌─────────────────────────────────┐ │
│ │ ✓ SIRI's wording (May–June 2024)│ │
│ │  Checked word for word against  │ │
│ │       SIRI's examiner booklet.  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ As given in the booklet, not yet│ │
│ │ checked word for word           │ │
│ │  (same wording as on the topic  │ │
│ │   pages, rev. 2, R-16)          │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ The app's wording               │ │
│ │  Written and reviewed by us.    │ │
│ └─────────────────────────────────┘ │
```
