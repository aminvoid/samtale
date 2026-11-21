# Screen: Home

| | |
|---|---|
| **Route** | `/fa` |
| **Stories** | US-057 (Must), US-046 #5, US-047 #3, US-058, US-067, US-050, US-061 #2 |
| **Flows** | [first-visit](../flows/first-visit.md), [spaced-review](../flows/spaced-review.md), [progress-and-data](../flows/progress-and-data.md) |
| **Milestone** | M1 (first-visit), M2 ("continue"), M3 ("ready to review") |

## Purpose

Answer "what is this, is it for me, what do I do next?" in one screen. For a returning learner, offer the single most useful next step.

## Content hierarchy

**First-visit state**
1. `h1`: the app name (from `ui-designer`'s identity work)
2. Purpose line: practise delprøve 2 of the PD3 oral, with explanations in Persian, plus a gloss: "part 2 of the oral: the unprepared conversation" (rev. 2, R-19)
3. Source line, **what it is first** (R-19): "Real questions from published exams 2016–2024, checked against SIRI's wording where marked." Then: "Not made by SIRI (Styrelsen for International Rekruttering og Integration, the exam authority)." → About (US-058). SIRI is spelled out at first use because it is also the name of Apple's assistant.
4. **Primary action:** "How does delprøve 2 work?" → guide (US-057 #1)
5. Secondary starting points (cards): "Study past topics" → library; "Try a practice mock exam" → `/fa/mock`
6. Footer

**Returning state** (storage available and **any** stored progress: a topic opened or practised, or a saved mock attempt; rev. 2, R-06)
1. `h1` (app name, visually compact)
2. **Continue where you left off** (primary): the most recent of the last opened topic and the last mock attempt. Topic: Danish and Persian names, term label, "Continue". Mock: "Your last mock exam" with topic and date, "See my answers" (US-046 #5)
3. **Ready to review** (M3): up to three topics due, oldest first; "see all" → `/fa/progress#review` (US-047 #3)
4. Starting points, compact: guide · topics · mock exam
5. "See my progress" link
6. Footer

## Components

PageHeader, PrimaryActionCard, StartingPointCard ×3, ContinueCard, ReviewDueList / ReviewDueItem, TermLabel, Pre2023Badge (inside cards when relevant), InfoNote (honesty line), StorageNotice (conditional), Footer, BottomTabBar / TopNav.

## States

| State | Behaviour |
|---|---|
| First-time | As above. Nothing requested (no microphone, no permissions). No audio loads (US-057 #5). |
| Loading | Server-rendered text; no skeleton for the static parts. The returning-state sections depend on device storage, which only the browser can read. **Behavioural requirement:** no control the learner could be about to tap may move after first paint (a shifting target under the thumb causes mis-taps). How to achieve it (for example a reserved slot, or reading a small "has progress" flag before paint) is for `software-architect`. |
| Empty | First-visit state is the empty state. No "you haven't done anything" copy (US-067 #4). |
| Error | Full-page ErrorState (E1) is unlikely here; storage read errors fall back to the first-visit state silently (E17). |
| Slow network | Text only; nothing else to fetch. |
| Microphone denied | Not applicable. |
| Storage unavailable | First-visit layout. A one-line StorageNotice under the starting points, once per session: "Progress can't be saved in this browser. Everything else works." (US-050 #1) |
| Returning, nothing due | No "ready to review" section at all (not an empty box). |
| Last topic unpublished since | "Continue" falls back to the starting points; no error. |

## Responsive behaviour

| Width | Layout |
|---|---|
| 375 | Single column. In first-visit state the primary action and both secondary cards fit above the tab bar at default text size. Cards are full width; secondary cards may sit two-up only if both labels fit on one line each (otherwise stacked). |
| 768 | Single centred column; secondary cards two-up; top navigation replaces the tab bar. |
| 1280 | Two columns: start column (right) holds the purpose text and primary action (first visit) or "continue" (returning); end column holds "ready to review" or the starting points. Max content width as for reading pages. |

## RTL and bidi

- All interface text Persian, RTL.
- **Danish:** topic names in "continue" and "ready to review" (`lang="da"`, LTR, isolated). Term labels such as `Maj–Juni 2024 · B` isolated as Danish (UXD-22).
- The words "delprøve 2" and "PD3" inside Persian sentences are wrapped in `<bdi lang="da">` (US-052 #2).
- Card chevrons point to the inline end (left) and mirror. No other directional icons.

## Accessibility

- One `h1`; sections use `h2` ("Continue where you left off", "Ready to review", "Start here").
- Focus order: skip link → header menu → main (primary action first) → starting points → footer → tab bar.
- Each card is one link with a clear accessible name (no nested interactive elements).
- "Ready to review" items: the accessible name includes the Danish topic name (with `lang="da"`) and the review step ("day 3 review").
- No live regions on this page.

## Copy needs

| Key | Intended meaning | Draft (for `persian-localization-reviewer`) |
|---|---|---|
| `home.purpose` | Practise delprøve 2 of the PD3 oral, with explanations in Persian | – |
| `home.partGloss` | Part 2 of the oral: the unprepared conversation | – |
| `home.source` | Real questions from published exams 2016–2024, checked against SIRI's wording where marked. | – |
| `home.notBySiri` | Not made by SIRI (Styrelsen for International Rekruttering og Integration, the exam authority). | – |
| `home.notOfficialLink` | About the app and its sources | – |
| `home.continue.lastMock` / `.seeAnswers` | Your last mock exam · See my answers | – |
| `home.start.heading` | Where would you like to start? | – |
| `home.start.guide` | How does delprøve 2 work? | – |
| `home.start.guideHint` | About a 3-minute read | – |
| `home.start.topics` | Study past topics | – |
| `home.start.topicsHint` | {count} topics from 2016–2024, with sample answers and audio | – |
| `home.start.mock` | Try a practice mock exam | – |
| `home.start.mockHint` | The real sequence, at your own pace | – |
| `home.continue.heading` | Continue where you left off | «ادامه از جایی که بودید» |
| `home.continue.action` | Continue | «ادامه» |
| `home.review.heading` | Ready to review | «آمادهٔ مرور» (PRD draft) |
| `home.review.step` | Day {day} review | – |
| `home.review.seeAll` | See all | – |
| `home.progressLink` | See my progress | – |
| `common.storageUnavailable.short` | Progress can't be saved in this browser. Everything else works. | – |

## Wireframes

Conventions: drawn as seen in RTL (the inline start is on the **right**). Labels are English glosses of the intended Persian. `[da: …]` is Danish, rendered LTR.

**375 px, first visit**
```
┌─────────────────────────────────────┐
│ [≡]                        App name │
├─────────────────────────────────────┤
│                            App name │  h1
│   Practise [da: delprøve 2] of the  │
│      PD3 oral, explained in Persian │
│ Part 2 of the oral: the unprepared  │
│                       conversation  │
│ Real questions, published exams     │
│   2016–2024 · Not made by SIRI (the │
│ exam authority) · About & sources › │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ‹      How does [da: delprøve 2]│ │  PRIMARY
│ │                           work? │ │
│ │                About 3 min read │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ‹             Study past topics │ │
│ │       51 topics, audio, answers │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ‹    Try a practice mock exam   │ │
│ │  The real sequence, your pace   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Guide Templates [Mock] Topics •Home │
└─────────────────────────────────────┘
```

**375 px, returning (M3)**
```
┌─────────────────────────────────────┐
│ [≡]                        App name │
├─────────────────────────────────────┤
│        Continue where you left off  │  h2
│ ┌─────────────────────────────────┐ │
│ │      [da: Mangel på arbejdskraft]│ │
│ │                 Labour shortage  │ │
│ │   [da: Maj–Juni 2024 · B]        │ │
│ │ [ Continue ]                     │ │  PRIMARY
│ └─────────────────────────────────┘ │
│                    Ready to review  │  h2
│ ‹ [da: Kostvaner og livsstil]  Day 3│
│ ‹ [da: Støtte til kultur]      Day 7│
│                          See all ›  │
│                         Start here  │  h2
│  [Guide]      [Topics]      [Mock]  │
│                   See my progress   │
├─────────────────────────────────────┤
│ Guide Templates [Mock] Topics •Home │
└─────────────────────────────────────┘
```

**1280 px, returning**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [≡]  My progress  Guide  Templates&phrases  Mock exam  Topics  •Home  App name│
├──────────────────────────────────────────────────────────────────────────────┤
│   ┌──────────────────────────────┐   ┌──────────────────────────────────┐    │
│   │              Ready to review │   │      Continue where you left off │    │
│   │ ‹ [da: Kostvaner…]     Day 3 │   │     [da: Mangel på arbejdskraft] │    │
│   │ ‹ [da: Støtte til…]    Day 7 │   │                  Labour shortage │    │
│   │                   See all ›  │   │ [ Continue ]                     │    │
│   └──────────────────────────────┘   └──────────────────────────────────┘    │
│         [Guide]            [Topics]            [Mock exam]   Start here      │
└──────────────────────────────────────────────────────────────────────────────┘
```
