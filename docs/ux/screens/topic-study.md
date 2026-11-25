# Screen: Topic study page

| | |
|---|---|
| **Route** | `/fa/topics/{topicId}` (fragments `#sitA`, `#sitB`, `#general`) |
| **Stories** | Must: US-011 to US-015, US-017, US-019 (entry), US-068, US-009, US-058, US-062. Should: US-007 #5, US-010, US-016, US-018, US-024 (entry), US-040, US-047, US-065, US-066. Could: US-020. |
| **Decisions** | D-16 (intros), D-17 (verification), D-18 (situation titles), D-20 (personal examples), D-21 (no margin notes), 2026-11-25 (answer translations) |
| **Flows** | [study-topic](../flows/study-topic.md), [spaced-review](../flows/spaced-review.md) |
| **Content example** | [`content/topics/2024-maj-b.json`](../../../content/topics/2024-maj-b.json) |
| **Milestone** | M1 (core), M2 (answer aloud), M3 (Should items) |

## Purpose

Study one topic laid out the way the exam asks it (US-011), with everything the booklet method needs in reach: the examiner's voice, the question, three key words, **answering aloud**, then the sample answer and the suggested follow-up.

## Content hierarchy

1. **Header**
   - Back link naming the origin ("‹ Work and the labour market", or "‹ Search results")
   - `h1`: Danish topic name (`lang="da"`), e.g. *Mangel på arbejdskraft*
   - Persian topic name (subtitle)
   - Meta line: TermLabel `Maj–Juni 2024 · B` · theme name · Pre2023Badge with its explanation (US-009)
   - PracticeStatus or ReviewBanner (US-010, US-047): "Practised 2 times · last 3 days ago" / "Ready for your day-7 review: answer at least one question aloud, or practise it as a mock exam." / "Next review in 4 days" / "Review cycle complete · Start a new cycle"
   - Header actions: **Practise as a mock exam** (US-040), **Share** (US-066). On phones, Share sits in an overflow menu.
2. **"How this page is laid out" note** (US-011 #3; UXD-26): open on the learner's first topic page, collapsed afterwards. "In the exam the examiner picks one of the two situations, introduces it in one or two sentences and asks the first question. Later comes a more general question. Study both situations."
3. **Section navigation** (sticky): **A** · **B** · **General question** (US-011 #4)
4. **Section A** (`#sitA`, `h2` "Situation A")
   1. **SituationCard:** decorative theme icon; Danish title (*sygeplejerske med mange patienter*); SourceLabel "the booklet's description of the picture" (rev. 2, R-16); "show translation" reveals the Persian title (US-011 #2, D-18; UXD-18)
   2. **ExaminerIntroBlock:** label "The examiner introduces the situation" · SourceLabel (**"SIRI's suggested wording · examiner booklet May–June 2024"** or "the app's wording"; rev. 2.1, exam review S3, decided by delegation, 2026-11-20) · PlayButton (examiner voice) · Danish text (US-012 #5). A one-line note in the layout note: "A real examiner may word the intro and follow-ups differently; practise understanding, not memorising."
   3. **QuestionBlock (first required question):** role label · PlayButton · Danish text · VerificationNote (US-068; rev. 2, R-16): either "✓ Wording checked against SIRI's examiner booklet" with a Disclosure "checked on ۱۸ نوامبر ۲۰۲۶ · SIRI examiner booklet Maj–Juni 2024, p. 8 · open (external site)" from `siriCheck.checkedOn` and `sourceRef.pages`, or "As given in the booklet (from SIRI's examiner booklets), **not yet checked word for word**" (same wording as the About legend) · "show translation" (US-013) · SimilarQuestionLinks ("A similar question: Maj–Juni 2019 · C · situation A"; US-007 #5)
   4. **KeywordList:** three stacked Danish–Persian pairs (UXD-24); emoji decorative (UX-OQ-16); tip "Use these three words to rebuild your answer with template 1" → template (US-014 #3)
   5. **Answer aloud** (primary button of the section; US-019) with the subtitle "you speak, then compare" (rev. 2, UX-OQ-04) → [answer-aloud](answer-aloud.md)
   6. **ModelAnswerBlock**, collapsed by default (UXD-04): heading "A simple, clear sample answer" (OQ-14 wording) · "built on template 1" link (US-020) · AudioPlayer (model voice, speed 0.75/1/1.25, seek; US-015) · Danish text with the booklet's bold connectives and word highlight while playing (US-016) · "Shadow sentence by sentence" (US-024).
   7. **PersonalExampleBlock** (if present; US-018, D-20): label "An example from a nurse's perspective" · PlayButton · Danish text · prompt "Make your own example from your work or life" → toolbox personal sentences
   8. **FollowupBlock:** label "Suggested follow-up question" · SourceLabel "SIRI's suggested wording ({term})" where the check matches, otherwise the booklet label (rev. 2.1, S3) · one-line note "Real examiners ask follow-ups as they judge necessary and may ask others, depending on what you say" (US-017 #3) · PlayButton · Danish text · VerificationNote · "show translation" · **Answer aloud** (secondary) · short answer, collapsed (audio and Danish text)
5. **Section B** (`#sitB`): same structure
6. **General question** (`#general`, `h2` "The general question (second required question)"): a note "The examiner first announces a more general question; listen for *overordnet* or *generelt*" → examiner phrases. Then QuestionBlock, KeywordList (tip → template 2), Answer aloud, ModelAnswerBlock (template 2), PersonalExampleBlock, FollowupBlock (template 3).
7. **Related topics** (D-21; UXD-20): up to a few links in our wording, "Related topics: …". Similar-question and related-topic links come from the public `content/topic-links.json` (ADR-0002; UX-OQ-14 closed); the app never reads `content/internal/`.
8. **Page footer:** "Practise this topic as a mock exam" (repeat of the header action, for people who reach the end) · CreditLine ("From the booklet by Shery Rahimi, pages 36–37", US-058) · "Report a problem with this topic" (US-065)

Sample answers, follow-up answers and personal examples with a Persian translation have a collapsed toggle beneath the Danish text. The toggle reveals text labelled «ترجمهٔ برنامه».

## Components

BackLink, PageHeader, TermLabel, Pre2023Badge, PracticeStatus, ReviewBanner, OverflowMenu, ShareButton, InfoNote (collapsible), SectionNav, SituationCard (study variant), TranslationToggle, ExaminerIntroBlock, SourceLabel, QuestionBlock, VerificationNote, SimilarQuestionLink, KeywordList, Button (answer aloud), ModelAnswerBlock, AudioPlayer, SpeedControl, WordHighlighter, PersonalExampleBlock, FollowupBlock, RelatedTopics, CreditLine, ReportProblemLink, Toast.

## States

| State | Behaviour |
|---|---|
| First-time | Layout note open. No status. |
| Returning | Status or review banner in the header. The layout note is collapsed. |
| Loading | Text is server-rendered; no audio is fetched until play (US-061 #2). Players show their idle state with duration unknown until loaded. |
| Empty | Not applicable: unpublished or unknown IDs return the not-found page (US-011 #6). Optional blocks (follow-up, personal example, similar links, related topics) simply don't render when absent (US-017 #4, US-018 #3). |
| Error | E1 for the page; E5 per player (retry; text stays). |
| Slow network | Players show loading on tap; a second tap doesn't double-play (US-062 #2). |
| Microphone denied | "Answer aloud" still opens; it runs without recording (US-019 #6). A small "microphone off" note with the help link appears in the panel, not on the page. |
| Storage unavailable | No status, no review banner, layout note shown each visit (collapsed after first view in a session). Speed choice works for the session only. |
| Review due | ReviewBanner as above; after the learner practises, a polite toast "Review done. Next review in {n} days." |
| SIRI differs (OQ-17) | The QuestionBlock reserves a Disclosure "SIRI's wording differs slightly" under the verification note. Its content follows OQ-17 (UX-OQ-20). |

## Responsive behaviour

| Width | Layout |
|---|---|
| 375 | Single column. SectionNav sticks under the compact header as three equal segments. Header actions: "Practise as a mock exam" as a secondary button; share in overflow. Each section is long; the primary "Answer aloud" sits right after the key words, so it is reached without opening anything. |
| 768 | Single column, wider measure. SectionNav sticky. Header actions inline. |
| 1280 | Two columns. **Start column (right):** sticky side navigation (A · B · general question, plus "related topics" and "practise as a mock exam"). **Main column:** sections. Within a section, KeywordList and Answer aloud sit beside the question block if the measure allows; the sample answer stays full width for readability. |

## RTL and bidi

- **Danish (LTR, `lang="da"`):** topic name (`h1`), term label, situation titles, intros, questions, follow-ups, key words (Danish half), sample answers, short answers, personal examples, similar-question term labels.
- **Persian (RTL, `lang="fa"`):** everything else, plus translations and the Persian half of key words.
- Danish paragraphs align to their own start (left) inside the RTL page; short Danish labels in Persian rows are isolated. The exact alignment of short Danish labels is a `ui-designer` call (README conventions).
- Key words: Danish line above Persian line, never in one line (UXD-24; US-014 #2).
- Persian translations of questions may contain Latin runs such as "(sosu)" (pilot report §1.5): those runs are isolated by content markup or by the component; never left to the bidi algorithm.
- **Mirror:** back link arrow, row chevrons, overflow-menu placement. **Don't mirror:** play/pause, the audio progress bar, speed control, the microphone icon.
- The audio progress bar fills left to right even in RTL, because it represents Danish audio time (styling rules: media scrubbers aren't mirrored). The slider is `dir="ltr"`, so **→ seeks forward and ← back** for keyboard users (rev. 2, R-22; E2E check).
- The pre-2023 explanation in the header adds "In the mock exam this topic runs in today's format" (R-17). Its label uses the Danish TermLabel `Maj–Juni 2023` (Latin digits) instead of a Persian-digit year.

## Accessibility

- Headings: `h1` topic; `h2` per section; `h3` for intro, first question, key words, sample answer, personal example, follow-up.
- SectionNav is a `nav` with an accessible name ("Sections of this topic") and `aria-current="true"` on the section in view. Activating a link moves focus to the section's `h2`, and the sticky bar never hides the focused element (WCAG 2.4.11; scroll padding equal to the bar height).
- Every PlayButton has an accessible name naming what it plays ("Play the examiner's question", "Play the sample answer"). Only one clip plays at a time; starting one stops the other (US-012 #3).
- TranslationToggle and the collapsed blocks are Disclosures with `aria-expanded`; the revealed content follows the control in the DOM and doesn't move the scroll position away (US-013 #2).
- Word highlight (US-016): visual only; not announced; with reduced motion, no auto-scroll.
- Focus order follows the visual order within each section: card → intro → question → key words → answer aloud → sample answer → personal example → follow-up.
- Live region: only the toast after a review step completes.

## Copy needs

| Key | Intended meaning | Draft |
|---|---|---|
| `topic.layoutNote.title` | How this page is laid out | – |
| `topic.layoutNote.body` | In the exam the examiner picks one of the two situations, introduces it and asks the first question. Later comes a more general question. Study both situations. | – |
| `topic.sectionNav.label` | Sections of this topic | – |
| `topic.section.sitA` / `.sitB` / `.general` | Situation A · Situation B · The general question | – |
| `topic.intro.label` | The examiner introduces the situation | – |
| `topic.role.firstRequired` | First required question | «سؤال اجباری اول» |
| `topic.role.secondRequired` | Second required question (general) | – |
| `topic.role.followup` | Suggested follow-up question | «سؤال تکمیلی پیشنهادی» |
| `topic.followup.note` | Real examiners ask follow-ups as they judge necessary, and may ask others depending on what you say. | – |
| `topic.general.announceNote` | First the examiner says a more general question is coming. Listen for {overordnet} or {generelt}. | – |
| `topic.translation.show` / `.hide` | Show translation · Hide translation | «نمایش ترجمه» (PRD draft) |
| `topic.keywords.title` | Three key words | – |
| `topic.keywords.tip` | Use these three words to rebuild your answer with {templateName}. | – |
| `topic.answerAloud` | Answer aloud | «بلند جواب بدهید» |
| `topic.sample.title` | A simple, clear sample answer (OQ-14) | – |
| `topic.sample.show` / `.hide` | Show the sample answer · Hide it | – |
| `topic.sample.template` | Built on {templateName} | – |
| `topic.shadow` | Shadow sentence by sentence | – |
| `topic.example.label` | An example from a nurse's perspective | «مثال از دید یک پرستار» |
| `topic.example.prompt` | Make your own example from your work or life. | «مثال خودتان را بسازید» |
| `topic.shortAnswer.title` | A short sample answer | – |
| `topic.similar` | A similar question: {termLabel} · {part} | – |
| `topic.related` | Related topics | – |
| `topic.practiseMock` | Practise this topic as a mock exam | – |
| `topic.share` / `topic.linkCopied` | Share · Link copied | – |
| `topic.report` | Report a problem with this topic | – |
| `topic.credit` | From the booklet by {author}, {pages, plural, one {page #} other {pages {pageList}}} | – |
| `labels.verification.matches` | Wording checked against SIRI's examiner booklet | – |
| `labels.verification.details` | Checked on {date} · SIRI examiner booklet {termLabel}, page {page} · open (external site) | – |
| `labels.verification.booklet` | As given in the booklet (from SIRI's examiner booklets), not yet checked word for word | – |
| `labels.source.situationTitle` | The booklet's description of the picture | – |
| `labels.source.siriSuggested` | SIRI's suggested wording ({document}) (rev. 2.1) | – |
| `topic.layoutNote.reworded` | A real examiner may word the intro and follow-ups differently. Practise understanding, not memorising. (rev. 2.1) | – |
| `topic.answerAloud.sub` | You speak, then compare | – |
| `labels.verification.differs` | SIRI's wording differs slightly (OQ-17) | – |
| `audio.play` / `.pause` / `.retry` / `.loading` / `.speed` | Play · Pause · Try again · Loading · Speed | – |
| `review.banner.due` | Ready for your day-{day} review. Answer at least one question aloud, or practise it as a mock exam. | – |
| `review.banner.next` | Next review {relativeDate} | – |
| `review.banner.complete` | Review cycle complete | – |
| `review.banner.newCycle` | Start a new cycle | – |
| `review.toast.done` | Review done. Next review {relativeDate}. | – |

## Wireframes

**375 px, top of page and section A**
```
┌─────────────────────────────────────┐
│ [⋯]          › Work and labour mkt  │ back (mirrored) · overflow at end
│        [da: Mangel på arbejdskraft] │ h1
│                     Labour shortage │
│ [da: Maj–Juni 2024 · B] · Work      │
│           Practised 2× · 3 days ago │
│ [ Practise as a mock exam ]         │
│ ▾ How this page is laid out         │
│   In the exam the examiner picks ONE│
│   situation …                       │
├─────────────────────────────────────┤
│ General question │  B  │ •A         │ sticky section nav
├─────────────────────────────────────┤
│                         Situation A │ h2
│ ┌─────────────────────────────────┐ │
│ │ (icon)                       A  │ │
│ │ [da: sygeplejerske med mange    │ │
│ │      patienter]                 │ │
│ │                ▸ Show translation│ │
│ └─────────────────────────────────┘ │
│  The examiner introduces · SIRI's   │
│                             wording │
│ [▶] [da: Situation A viser en       │
│     sygeplejerske, der har ansvar   │
│     for mange patienter og har      │
│     travlt.]                        │
│              First required question│ h3
│ [▶] [da: Der mangler arbejdskraft i │
│     sundhedssektoren, fx sygeple-   │
│     jersker og social- og sundheds- │
│     assistenter. Hvorfor tror du,   │
│     der gør det?]                   │
│  ✓ Checked against SIRI's examiner  │
│   booklet ▸ details (date, page,    │
│   link)                             │
│                ▸ Show translation   │
│                                     │
│                     Three key words │ h3
│  [da: hårdt arbejde]                │
│                         hard work   │
│  [da: for lav løn]                  │
│        low pay for the responsibility│
│  [da: flere ældre]                  │
│                    more older people│
│  Rebuild your answer with template 1│
│                                     │
│ [ 🎙 Answer aloud               ]   │ PRIMARY
│ ▸ A simple, clear sample answer     │ collapsed
│ ▸ An example from a nurse's         │
│   perspective                       │
│ ┌─────────────────────────────────┐ │
│ │      Suggested follow-up question│ │
│ │ Real examiners may ask others…  │ │
│ │ [▶] [da: Hvilke problemer mener │ │
│ │     du, der kan være ved, …?]   │ │
│ │               ▸ Show translation│ │
│ │ [ Answer aloud ]                │ │
│ │ ▸ A short sample answer         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**375 px, sample answer expanded**
```
┌─────────────────────────────────────┐
│ ▾ A simple, clear sample answer     │
│           Built on template 1 ›     │
│ ┌─────────────────────────────────┐ │
│ │ [▶] ━━━━━━━○────────  0:12/0:31 │ │ not mirrored
│ │                 Speed: [1×] ▾   │ │
│ └─────────────────────────────────┘ │
│ [da: Det kan der være flere grunde  │
│  til. **For det første** er arbej-  │
│  det hårdt, både fysisk og psykisk. │
│  **For det andet** …]               │
│        Shadow sentence by sentence ›│
└─────────────────────────────────────┘
```

**1280 px**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [≡] Guide Templates&phrases Mock Topics• Home Progress              App name │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                  › Work and the labour market │
│                                              [da: Mangel på arbejdskraft]  h1 │
│  [Practise as a mock exam] [Share]                         Labour shortage    │
│                                           [da: Maj–Juni 2024 · B] · Work      │
│ ┌──────────────────────────────────────────────────────┐ ┌──────────────────┐ │
│ │                                         Situation A  │ │ On this topic    │ │
│ │  [situation card]                                    │ │ • Situation A    │ │
│ │  [intro: ▶ + Danish]                                 │ │   Situation B    │ │
│ │  [question: ▶ + Danish + verification + translation] │ │   General quest. │ │
│ │  [key words]                 [ 🎙 Answer aloud ]     │ │   Related topics │ │
│ │  [▸ sample answer (full width)]                      │ │   Practise mock  │ │
│ │  [follow-up block]                                   │ └──────────────────┘ │
│ └──────────────────────────────────────────────────────┘     (start column)   │
└──────────────────────────────────────────────────────────────────────────────┘
```
