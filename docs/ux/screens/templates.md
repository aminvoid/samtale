# Screen: Templates (hub and template pages)

| | |
|---|---|
| **Routes** | `/fa/templates` (hub), `/fa/templates/why`, `/fa/templates/pros-cons`, `/fa/templates/follow-ups` |
| **Stories** | US-021 (Must), US-020 (Could, entry), US-025 (Could, shadow), US-065, US-062 |
| **Content** | `templates.json` (schema §11.1), booklet lines 241–296 |
| **Flows** | [templates-and-phrases](../flows/templates-and-phrases.md) |
| **Milestone** | M1 |

## Purpose

Learn the booklet's three answer templates ("golden skeletons") well enough to rebuild any answer from three key words.

## Content hierarchy

**Hub (`/fa/templates`)**
1. `h1` "Templates and phrases"
2. Section switch: **Templates** · Toolbox · Words and phrases (links)
3. One-line first-time note (UXD-26): "The booklet builds every sample answer on these three templates. Learn them first."
4. Three TemplateCards in the booklet's order (US-021 #1):
   - Template 1 · *"Hvorfor tror du, …?"* → reasons · "for the first required question"
   - Template 2 · *"Hvilke fordele og ulemper …?"* → both sides and your opinion · "for the second required question"
   - Template 3 · answering follow-up questions · "for follow-ups, such as *Mener du, at …?*"

**Template page**
1. Back link "‹ Templates" (or the origin topic, when entered from a topic) · `h1` Persian title with the Danish cue isolated
2. "Fits:" line (US-021 #4)
3. **Test myself** switch (US-021 #5)
4. **Steps** (templates 1, 2): ordered list; each TemplateStep has a Persian label ("start", "reason 1", …), the Danish phrase exactly as in the booklet (with its underlined grammar notation, e.g. *For det første + verbum + subjekt …*), the Persian meaning, and a PlayButton (US-021 #2–#3). Optional "shadow" (US-025).
5. **Cue rows** (template 3): each CueRow shows the examiner's cue (Danish, e.g. *… betyder for X?*), the answer starter (Danish), the Persian meaning, and a PlayButton.
6. **Example** (template 1 only): the booklet's example answer with its connectives bold, PlayButton.
7. **Grammar in brief** (collapsed; UX-OQ-17): template 2's tip on word order after *at*; the V2 table on template 1 or 3.
8. Footer: CreditLine (booklet pages 7–8) · Report a problem (US-065)

## Components

PageHeader, SegmentedNav, InfoNote, TemplateCard, Switch (test myself), TemplateStep, CueRow, RevealButton, PlayButton, Disclosure, CreditLine, ReportProblemLink, BackLink.

## States

| State | Behaviour |
|---|---|
| First-time | Hub note shown; dismissible. |
| Loading | Text-first; audio on tap. |
| Empty | Not applicable (build-time content). |
| Error | E1; per-phrase audio retry (E5). |
| Slow network | Audio loading state per phrase. |
| Microphone denied | Only affects shadowing (Could). |
| Storage unavailable | No effect. |
| Test myself on | Every Danish phrase is replaced by a "Reveal" button with the step's Persian label and meaning still visible. Revealing one step doesn't reveal others. "Reveal all" / "Hide all" at the top. Turning the switch off shows all. The state isn't stored. |

## Responsive behaviour

| Width | Layout |
|---|---|
| 375 | Single column. Each step is a stacked card: Persian label (small), Danish phrase (large, LTR), Persian meaning, play button at the inline end of the Danish line. |
| 768 | Same, wider. |
| 1280 | Steps as a three-column table: Persian label (start, right) · Danish phrase · Persian meaning, with play beside the Danish phrase. The hub shows the three cards side by side. |

## RTL and bidi

- Danish phrases are blocks (`lang="da"`, `dir="ltr"`), never inline in a Persian line.
- Template titles mix Persian and a Danish cue (*«Hvorfor tror du, …?»*): the cue is an isolated `bdi lang="da"`; the Persian guillemets sit outside the isolate.
- Grammar notation (`+ verbum + subjekt`, `X`, `…`, `/`) stays exactly as printed inside the Danish block.
- The steps' order is the booklet's order; step numbers in Persian digits.
- Mirror: back link, card chevrons. Don't mirror: play.

## Accessibility

- Steps are an ordered list. Each step's PlayButton accessible name: "Play: {step label}".
- Test-myself switch: `role="switch"` with `aria-checked`; changing it keeps focus on the switch and announces nothing extra (the switch state is announced).
- RevealButton: accessible name "Reveal the Danish for {step label}"; after reveal, focus stays on the revealed text's container (made focusable with `tabindex="-1"`) so screen-reader users hear it.
- Template audio reads the reviewed `spoken` variant (OQ-S1); the visible text is still the booklet's, and the accessible name doesn't promise the audio is word-for-word the notation.

## Copy needs

| Key | Intended meaning |
|---|---|
| `templates.title` | Templates and phrases |
| `templates.nav.templates` / `.toolbox` / `.words` | Templates · Toolbox · Words and phrases |
| `templates.firstNote` | The booklet builds every sample answer on these three templates. Learn them first. |
| `templates.why.title` | Template 1: {cue}, reasons |
| `templates.prosCons.title` | Template 2: {cue}, both sides and your opinion |
| `templates.followups.title` | Template 3: answering follow-up questions |
| `templates.fits.first` / `.second` / `.followup` | For the first required question · For the second required question · For follow-up questions |
| `templates.testMyself` | Test myself |
| `templates.reveal` / `.revealAll` / `.hideAll` | Reveal · Reveal all · Hide all |
| `templates.example` | The booklet's example |
| `templates.grammar` | Grammar in brief |
| `templates.credit` | From the booklet by {author}, pages {pages} |
| `templates.shadow` | Shadow this phrase |

## Wireframes

**375 px, template 1, test myself off**
```
┌─────────────────────────────────────┐
│                        › Templates  │
│   Template 1: «[da: Hvorfor tror du,│ h1
│                       …?]» reasons  │
│      For the first required question│
│                  Test myself [ ○—]  │
│ ┌─────────────────────────────────┐ │
│ │                          1 Start│ │
│ │ [▶] [da: Det kan der være flere │ │
│ │      grunde til.]               │ │
│ │       It could have several     │ │
│ │                       reasons.  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │                       2 Reason 1│ │
│ │ [▶] [da: For det første +       │ │
│ │      verbum + subjekt …]        │ │
│ │                        Firstly …│ │
│ └─────────────────────────────────┘ │
│   … reason 2, reason 3, summary …   │
│                The booklet's example│
│ [▶] [da: Det kan der være flere …]  │
│ ▸ Grammar in brief                  │
└─────────────────────────────────────┘
```

**375 px, test myself on**
```
│ ┌─────────────────────────────────┐ │
│ │                       2 Reason 1│ │
│ │                        Firstly …│ │
│ │ [ Reveal ]                      │ │
│ └─────────────────────────────────┘ │
```
