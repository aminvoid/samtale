# Screen: Toolbox, and words and phrases

| | |
|---|---|
| **Routes** | `/fa/toolbox` (fragments `#reasons`, `#personal`, `#rescue`), `/fa/vocabulary` (`#words`, `#phrases`) |
| **Stories** | US-022, US-023 (Should), US-025 (Could), US-002 (cross-link), US-001 #4 (rescue sentence link), US-062, US-065 |
| **Content** | `toolbox.json`, `vocabulary.json` (schema §11.2–§11.3); booklet lines 302–347, 5815–5882 |
| **Flows** | [templates-and-phrases](../flows/templates-and-phrases.md) |
| **Milestone** | M3 |

## Purpose

**Toolbox:** something to say when the mind goes blank: 10 all-purpose reasons, 6 personal sentences, 9 rescue sentences. **Words and phrases:** the booklet's 30 high-value words and 20 verb phrases. All with audio, for listening learners like Ahmad (US-023).

## Content hierarchy

**Toolbox**
1. Section switch (Templates · **Toolbox** · Words and phrases); `h1` "Toolbox: when your mind goes blank"
2. Jump links: Reasons · Personal sentences · Rescue sentences
3. **`#reasons` 10 all-purpose reasons** (`h2`): each PhraseItem: decorative emoji, Danish sentence (with its "/" alternatives as printed), Persian meaning, PlayButton
4. **`#personal` Personal sentences** (`h2`), 6 items. The first (*"Jeg er selv sygeplejerske, og …"*) is nurse-specific; label per UX-OQ-25.
5. **`#rescue` Rescue sentences** (`h2`), 9 items, with a short explanation of when to use them (US-022 #2): when you didn't understand (ask for a repeat); when you can't answer (keep going, e.g. *"Det har jeg ikke tænkt så meget over før, men jeg tror, at …"*). Under the repeat request: "The mock exam's repeat button uses *Undskyld, vil du **godt** gentage spørgsmålet?*. Both are correct." (US-022 #3)
6. CreditLine (pages 9–10) · Report a problem

**Words and phrases**
1. Section switch; `h1` "Golden words and phrases"
2. **`#words` 30 words** (`h2`): Danish word with its grammar marker as printed ("livskvalitet (en)"), Persian meaning, PlayButton
3. **`#phrases` 20 verb phrases** (`h2`): Danish phrase, Persian meaning, PlayButton
4. CreditLine (pages 115–116)

## Components

SegmentedNav, PageHeader, JumpLinks, PhraseItem, PlayButton, InfoNote, CreditLine, ReportProblemLink. Optional "shadow" action on each PhraseItem (US-025).

## States

| State | Behaviour |
|---|---|
| First-time | No special note. |
| Loading | Lists are text; **no audio is fetched until a play button is tapped** (US-023 #2). |
| Empty | Not applicable. |
| Error | E1; per-item retry (E5). |
| Slow network | Per-item loading state. |
| Microphone denied | Only shadowing affected. |
| Storage unavailable | No effect. |
| Playing | One item plays at a time; starting another stops the first (US-023 #2, GA-11). |

## Responsive behaviour

| Width | Layout |
|---|---|
| 375 | One PhraseItem per row: Danish (LTR block), Persian meaning beneath, play button at the row's end. Jump links wrap. |
| 768 | Same, wider. |
| 1280 | Two columns of PhraseItems per group for words and phrases; toolbox stays one column (sentences are long). Jump links become a sticky side list on the start side. |

## RTL and bidi

- Danish on its own line; Persian on its own line. Never "Danish · Persian" in one line as in the booklet's source layout (UXD-24).
- Grammar markers "(en)", "(et)", "(pl.)" are part of the Danish line.
- Emoji are decorative (`aria-hidden`); rendering on older Android phones is a `ui-designer` check (UX-OQ-16).
- Don't mirror play.

## Accessibility

- Each group is a list under an `h2`. PlayButton accessible name: "Play: {Persian meaning}", with `aria-describedby` pointing at the Danish text.
- Jump links move focus to the group heading.
- No live regions.

## Copy needs

| Key | Intended meaning |
|---|---|
| `toolbox.title` | Toolbox: when your mind goes blank |
| `toolbox.reasons` / `.personal` / `.rescue` | All-purpose reasons · Personal sentences · Rescue sentences |
| `toolbox.reasons.intro` | These reasons fit almost any topic. |
| `toolbox.rescue.when` | Use these when you didn't catch the question, or when you can't think of an answer. Keep talking instead of stopping. |
| `toolbox.rescue.repeatVariant` | The mock exam's repeat button uses {variant}. Both are correct. |
| `vocabulary.title` | Golden words and phrases |
| `vocabulary.words` / `.phrases` | 30 common words · 20 verb phrases |
| `common.credit` | From the booklet by {author}, pages {pages} |

## Wireframe

**375 px, rescue group**
```
┌─────────────────────────────────────┐
│ Words │ •Toolbox │ Templates        │
│              Rescue sentences       │ h2
│  Use these when you didn't catch the│
│  question, or can't think of an     │
│               answer. Keep talking. │
│ ┌─────────────────────────────────┐ │
│ │ [▶] [da: Undskyld, vil du       │ │
│ │      gentage spørgsmålet?]      │ │
│ │  Sorry, could you repeat the    │ │
│ │                      question?  │ │
│ │ ⓘ The mock exam uses "… vil du  │ │
│ │   godt …". Both are correct.    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [▶] [da: Det har jeg ikke tænkt │ │
│ │      så meget over før, men jeg │ │
│ │      tror, at …]                │ │
│ │   I hadn't thought much about   │ │
│ │          it before, but I think…│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```
