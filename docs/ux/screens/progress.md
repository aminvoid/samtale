# Screen: My progress

| | |
|---|---|
| **Route** | `/fa/progress` (fragments `#review`, `#history`, `#practised`) |
| **Stories** | US-046 (Must), US-047, US-048 (Should), US-050, US-067, US-010 |
| **Decision** | D-22 (spaced review per topic) |
| **Flows** | [progress-and-data](../flows/progress-and-data.md), [spaced-review](../flows/spaced-review.md) |
| **Milestone** | M2 (practised topics), M3 (review, history) |

## Purpose

Show what the learner **has done** and what's ready to review, so they can choose what to do next. Never a list of what they haven't done (US-067 #4).

## Content hierarchy

1. `h1` "My progress"
2. One line: "Saved only in this browser on this device." → Privacy (US-050 #4)
3. **`#review` Ready to review** (US-047): topics due today or earlier, oldest first: Danish name, Persian name, "day 7 review". Then **Coming up**: next due per topic, relative ("in 3 days"). Then the per-topic note: "The booklet suggests reviewing each chapter on day 1, 3, 7 and 14. The app applies the same days to each topic." (US-047 #2)
4. **`#history` My mock exams** (US-048; rev. 2, R-18): newest first; each AttemptHistoryItem: date (Gregorian, Persian month names and digits), Danish topic name, situation, mode label ("Practice" / "Exam conditions" / "Interrupted", plus "ended early"), **total time**, the optional **"focus next time"** item if the learner picked one, "recordings kept" icon + text if kept → opens `/fa/mock/review/{topicId}?attempt={id}`. **No self-check ticks in the list** (UX-OQ-28 closed).
5. **`#practised` Practised topics** (US-046): Danish and Persian name, "practised {n} times · last {relative}", review status ("next review in 2 days" / "review cycle complete")
6. Link: Settings (delete data)

**Self-check in history (rev. 2, decided by delegation):** ticks stay in the review only; any list of ticked items reads as "3 of 7" (walkthrough M12, S6). US-048 #1 needs a PM update (README).

## Components

PageHeader, InfoNote, ReviewDueList, ReviewDueItem, UpcomingReviewItem, AttemptHistoryItem, PractisedTopicItem, PracticeStatus, EmptyState, StorageNotice, Link.

## States

| State | Behaviour |
|---|---|
| First-time (nothing stored) | EmptyState: "Your practice will appear here after you answer a question aloud or finish a mock exam." Links: Study a topic · Try a practice mock exam. No empty section boxes. |
| Loading | Reads device storage; a brief skeleton only if slower than the threshold. |
| Empty sections | A section with nothing in it isn't shown (no "0 mock exams"). |
| Error (corrupted data) | Valid records shown; invalid ignored silently (US-046 #4). |
| Slow network | Not applicable (local data); topic names come from content already loaded. |
| Microphone denied | Not applicable. |
| Storage unavailable | StorageNotice in place of all sections: "Your progress can't be saved in this browser (for example in a private window). Everything else works." (US-050 #1) |
| Topic unpublished since | Its entries are hidden (kept in storage). |

## Responsive behaviour

| Width | Layout |
|---|---|
| 375 | Sections stacked; jump links under the `h1`. |
| 768 | Same, wider; jump links kept. |
| 1280 | Jump links kept at all widths (rev. 2, R-29). Two columns: start (right) Ready to review + Coming up; end (left) History; Practised topics full width below. |

## RTL and bidi

- Danish topic names isolated; term labels Danish (UXD-22).
- Relative dates and counts in Persian digits; absolute dates Gregorian with Persian month names and Persian digits, e.g. «۲ دسامبر ۲۰۲۶» (UX-OQ-08 closed).
- If the app can detect Telegram's in-app browser, a gentle note: "You're using Telegram's built-in browser. Open this page in your usual browser to keep your progress in one place." (R-21; UX-OQ-30)
- Row chevrons mirror.

## Accessibility

- `h1`, `h2` per section; lists of links; each item's accessible name starts with the Danish topic name (`lang="da"`).
- Mode labels are text, not colour (GA-8).
- No live regions.

## Copy needs

| Key | Intended meaning | Draft |
|---|---|---|
| `progress.title` | My progress | «پیشرفت من» |
| `progress.localOnly` | Saved only in this browser on this device. | – |
| `progress.review.title` | Ready to review | «آمادهٔ مرور» |
| `progress.review.step` | Day {day} review | – |
| `progress.upcoming.title` / `.item` | Coming up · Next review {relativeDate} | – |
| `progress.perTopicNote` | The booklet suggests reviewing each chapter on day 1, 3, 7 and 14. The app applies the same days to each topic. | – |
| `progress.history.title` | My mock exams | – |
| `progress.history.mode.practice` / `.exam` / `.interrupted` | Practice · Exam conditions · Interrupted | – |
| `progress.history.endedEarly` | Ended before the last question | – |
| `progress.history.kept` | Recordings kept | – |
| `progress.history.total` / `.focus` | {duration} · Focus: {item} | – |
| `progress.telegramNote` | You're using Telegram's built-in browser. Open this page in your usual browser to keep your progress in one place. | – |
| `progress.practised.title` / `.item` | Practised topics · Practised {count, plural, other {# times}} · last {relativeDate} | – |
| `progress.cycleComplete` | Review cycle complete | – |
| `progress.empty` | Your practice will appear here after you answer a question aloud or finish a mock exam. | – |

## Wireframe

**375 px**
```
┌─────────────────────────────────────┐
│ [≡]                        App name │
├─────────────────────────────────────┤
│                        My progress  │ h1
│  Saved only in this browser on this │
│                            device.  │
│                    Ready to review  │ h2
│ ‹ [da: Kostvaner og livsstil] Day 3 │
│ ‹ [da: Støtte til kultur]     Day 7 │
│                         Coming up   │
│ [da: Mangel på arbejdskraft] in 3 d │
│  The booklet suggests … each topic. │
│                    My mock exams    │ h2
│ ┌─────────────────────────────────┐ │
│ │ ‹ 19 Nov · [da: Mangel på …] · A│ │
│ │   Exam conditions · 4:12 ·      │ │
│ │   Focus: give an example ·      │ │
│ │   Recordings kept               │ │
│ └─────────────────────────────────┘ │
│                  Practised topics   │ h2
│ ‹ [da: Mangel på arbejdskraft]      │
│     Practised 3 times · today       │
│                         Settings ›  │
└─────────────────────────────────────┘
```
