# Screen: Mock exam review

| | |
|---|---|
| **Route** | `/fa/mock/review/{topicId}?attempt={attemptId}` (rev. 2, ADR-0005 §4: static per topic; the attempt is overlaid in the browser) |
| **Stories** | US-041, US-042, US-044 (Must); US-043, US-045, US-048 #2 (Should); US-035 #7; US-020; US-050; GA-10 |
| **Decisions** | D-6 (recordings session-only by default), D-19 (no answer translations) |
| **Flows** | [mock-review](../flows/mock-review.md) |
| **Milestone** | M2 (M3 for lengths and keeping) |

## Purpose

Hear your answers next to the sample answers, check yourself against the assessed skills, and pick one thing to improve. **No grade anywhere** (US-041 #6, US-042 #3).

## Content hierarchy

1. **Header** (normal app chrome returns here; focused mode has ended): back link "‹ Mock exam" (or "‹ My progress" from history) · `h1` "Your answers" · Danish topic name, Persian name, TermLabel, situation · mode label · date
2. **Keep card** (UXD-21; US-045; D-6), shown only while recordings exist in memory: "Your recordings are deleted when you leave this page." + switch "Keep this attempt on this device" (off) + "Replaces the attempt you kept earlier for this topic" when relevant. From history with a kept attempt: "Kept on this device" + Delete.
3. **Facts** (US-041 #5; US-043): total time (+ "time during the interruption isn't counted", R-37) · "interrupted" or "ended early" (if so) · repeats asked: n, followed by "Asking for a repeat is allowed in the real exam." (R-15) · "show text" used: yes/no · if the part-1 cut-off applied: "The app moved on to the general question to leave time for it." (R-10; rev. 2.1, no SIRI attribution). If ended before the limit in exam conditions: "In a real exam the examiner fills about 4½ minutes with more follow-up questions." (US-035 #7)
4. **Part 1** (`h2` "Part 1: situation {key}")
   - "What the examiner said first": situation intro (Danish text, play, SourceLabel)
   - **ReviewQuestionItem** for the first required question:
     - role label · Danish question · play (examiner) · VerificationNote · Translation (Disclosure) · Key words (Disclosure) (US-041 #3)
     - **Your answer:** TakePlayer(s), length "0:52" and "about 45–60 s suggested" as a neutral reference (US-043); "recorded in 2 parts"; "not recorded"
     - **Sample answer:** Disclosure (collapsed on phones), AudioPlayer, Danish text; "built on template 1" link (US-020); no translation (D-19)
     - "Open this question in the topic" link
   - ReviewQuestionItem for the suggested follow-up (sample = short answer; template 3)
   - **SelfCheckList for the first required question** (US-042): six items
5. Transition line (small, labelled "the app's wording")
6. **Part 2** (`h2` "Part 2: the general question"): items for the second required question and its follow-up; **SelfCheckList** with seven items (adds "covered both sides")
7. **Focus next time** (optional; rev. 2, R-18): "Pick one thing to focus on next time", a single choice from the self-check items. Saved with the attempt; shown in history instead of ticks.
8. **Next:** Practise this topic (topic page) · Start a new mock exam · Home

**Self-check items** (US-042 #1–#2), each a checkbox with a Persian explanation (Disclosure "what this means") and a Danish example phrase:
1. I answered the question I was asked.
2. I gave a reason. *"fordi …"*
3. I gave an example. *"For eksempel …"*
4. I linked my ideas. *"fordi, derfor, men, alt i alt"*
5. I ended with my opinion or a conclusion. *"Alt i alt mener jeg, at …"*
6. I kept going: when I got stuck, I used a rescue phrase. *"Det har jeg ikke tænkt så meget over før, men jeg tror, at …"*
7. (general question only) I covered both sides. *"På den ene side … på den anden side …"*

No total, no "x of 7", no colours for ticked vs unticked beyond the checkbox itself (US-042 #3).

## Components

BackLink, PageHeader, TermLabel, KeepCard (Switch + explanation), FactsList, ReviewQuestionItem, AudioPlayer, TakePlayer, Disclosure, VerificationNote, SourceLabel, KeywordList, SelfCheckList, DiscardGuardDialog, StorageNotice, Toast, NextStepsCard.

## States

| State | Behaviour |
|---|---|
| First-time | A one-line note above part 1: "Listen to your answer, then the sample. Then tick what you did. Nobody sees this but you." (UXD-26) |
| Loading | Facts and text render from the stored record and content; recordings come from memory; sample audio on play. |
| Empty (no recordings) | "Not recorded" under each question; **sample answers expanded**; its own first-time note: "Listen to the sample answer and think about what you said. Then tick what you did." (rev. 2, R-15); self-check works (US-041 #4). |
| Error | Unknown or deleted `attempt` (or opened on another device): the topic's questions and samples with "This attempt isn't on this device." + Start a mock exam · My progress (ADR-0005 §4). Unknown `topicId`: not-found. Audio: per-player retry. |
| Back with unkept recordings | The discard guard dialog, when the ADR-0007 back guard is enabled (rev. 2, R-34). |
| Slow network | Sample audio loads on play; recordings are local and instant. |
| Microphone denied | As empty. |
| Storage unavailable | Fresh review works; KeepCard switch disabled with "Can't keep recordings in this browser"; ticks work but aren't saved, with one StorageNotice (US-050). |
| From history, not kept | KeepCard replaced by a one-line note "Recordings from this attempt weren't kept." |
| Keep failed (quota) | "This attempt couldn't be kept on this device. You can still listen now." (US-045 #4) |
| Leaving with unkept recordings | DiscardGuardDialog via in-app links (US-044 #2): Keep and leave · Leave without keeping · Stay |

## Responsive behaviour

| Width | Layout |
|---|---|
| 375 | Single column; within each question: your answer first, then the sample (collapsed). Self-check lists full width with 44 px rows. |
| 768 | Same, wider; sample answer expanded by default. |
| 1280 | Each ReviewQuestionItem as two columns: **your answer on the start side (right)**, sample answer on the end side (left), aligned at the top. Self-check under each part spans both. |

## RTL and bidi

- **Danish:** topic name, situation intro, questions, sample answers, transition line, self-check example phrases, TermLabel.
- Lengths "0:52" with Persian digits in LTR isolates; "about 45–60 s" via the formatter.
- Self-check example phrases are separate Danish elements under the Persian item text, never inline concatenation.
- Don't mirror the players. Back link mirrors.

## Accessibility

- `h1` "Your answers"; `h2` per part; `h3` per question.
- Players: names say whose audio ("Play your answer to the first required question", "Play the sample answer").
- Only one clip plays at a time (US-041 #2).
- SelfCheckList is a `fieldset` with a `legend` ("Check yourself: first required question"); checkboxes with visible labels; explanations as Disclosures tied with `aria-describedby`.
- KeepCard switch has a visible label and description; turning it on announces "Kept on this device" politely; failure is announced.
- DiscardGuardDialog is modal; default focus on Stay.

## Copy needs

| Key | Intended meaning | Draft |
|---|---|---|
| `review.title` | Your answers | – |
| `review.keep.note` | Your recordings are deleted when you leave this page. | – |
| `review.keep.switch` | Keep this attempt on this device | «روی همین دستگاه نگه دار» |
| `review.keep.replaces` | This replaces the attempt you kept earlier for this topic. | – |
| `review.keep.kept` / `.delete` / `.failed` / `.unavailable` | Kept on this device · Delete · This attempt couldn't be kept on this device. You can still listen now. · Can't keep recordings in this browser | – |
| `review.notKept` | Recordings from this attempt weren't kept. | – |
| `review.facts.total` / `.interrupted` / `.repeats` / `.showText` | Total time: {duration} · Interrupted · Repeats asked: {count} · "Show text" used: {yesNo} | – |
| `review.facts.shortNote` | In a real exam the examiner fills about 4½ minutes with more follow-up questions. | – |
| `review.part1` / `.part2` | Part 1: situation {key} · Part 2: the general question | – |
| `review.introHeard` | What the examiner said first | – |
| `review.yourAnswer` / `.notRecorded` / `.parts` / `.length` / `.guide` | Your answer · Not recorded · Recorded in {count} parts · Length {duration} · About 45–60 s suggested | – |
| `review.openInTopic` | Open this question in the topic | – |
| `selfCheck.title` | Check yourself: {role} | «خودارزیابی» |
| `selfCheck.item.answered` / `.reason` / `.example` / `.linked` / `.opinion` / `.keptGoing` / `.bothSides` | The seven items above | – |
| `selfCheck.item.*.explain` | One-sentence Persian explanation per item | – |
| `selfCheck.private` | Nobody sees this but you. | – |
| `review.next.topic` / `.newMock` / `.home` | Practise this topic · Start a new mock exam · Home | – |
| `review.discard.title` / `.body` / `.keepLeave` / `.leave` / `.stay` | Leave without your recordings? · Your recordings from this attempt will be deleted. · Keep and leave · Leave without keeping · Stay | – |
| `review.gone` | This attempt isn't on this device. | – |
| `review.facts.repeatsAllowed` / `.endedEarly` / `.interruptionNotCounted` / `.followupSkipped` | Asking for a repeat is allowed in the real exam. · Ended early · Time during the interruption isn't counted. · The app moved on to the general question to leave time for it. (rev. 2.1: no SIRI or "real examiner" attribution; it's the app's rule) | – |
| `review.notRecordedNote` | Listen to the sample answer and think about what you said. Then tick what you did. | – |
| `review.focusNext.title` / `.none` | Pick one thing to focus on next time (optional) · No choice | – |

## Wireframe

**375 px**
```
┌─────────────────────────────────────┐
│ [≡]                    › Mock exam  │
│                       Your answers  │ h1
│ [da: Mangel på arbejdskraft] · A    │
│     Exam conditions · 19 Nov        │
│ ┌─────────────────────────────────┐ │
│ │ Your recordings are deleted when│ │
│ │            you leave this page. │ │
│ │ Keep this attempt on this device│ │
│ │                          [○—]   │ │
│ └─────────────────────────────────┘ │
│  Total 3:52 · Repeats 1 · Show text │
│  used: no                           │
│  ⓘ In a real exam the examiner fills│
│    about 4½ min with more follow-ups│
│                Part 1: situation A  │ h2
│ What the examiner said first        │
│ [▶] [da: Situation A viser …]       │
│             First required question │ h3
│ [▶] [da: Der mangler arbejdskraft … │
│      Hvorfor tror du, der gør det?] │
│ ▸ Translation   ▸ Key words         │
│                        Your answer  │
│ [▶] ━━━━━━━━━━━━━━━━━  0:52         │
│        About 45–60 s suggested      │
│ ▸ Sample answer · template 1        │
│   … follow-up item …                │
│ ┌─────────────────────────────────┐ │
│ │ Check yourself: first question  │ │
│ │ [ ] I answered the question     │ │
│ │ [✓] I gave a reason  fordi …    │ │
│ │ [ ] I gave an example           │ │
│ │ [ ] I linked my ideas           │ │
│ │ [ ] I ended with my opinion     │ │
│ │ [ ] I kept going                │ │
│ └─────────────────────────────────┘ │
│   … Part 2 …                        │
│ [Practise this topic] [New mock]    │
└─────────────────────────────────────┘
```
*(Checkbox rows: the box sits at the start (right) in the real RTL layout; drawn on the left here only for ASCII legibility.)*

**1280 px, one question item**
```
┌──────────────────────────────────────────────────────────────────────────┐
│                                              First required question  h3  │
│  [▶] [da: Der mangler arbejdskraft i sundhedssektoren, … ?]               │
│ ┌───────────────────────────────────┐ ┌────────────────────────────────┐ │
│ │ Sample answer · template 1        │ │                    Your answer │ │
│ │ [▶] ━━━━━━━━━━  0:31              │ │ [▶] ━━━━━━━━━━━━━━━━  0:52     │ │
│ │ [da: Det kan der være flere …]    │ │        About 45–60 s suggested │ │
│ └───────────────────────────────────┘ └────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```
