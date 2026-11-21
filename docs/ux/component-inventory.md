# Component inventory (v1)

| | |
|---|---|
| **Status** | Draft. Input for `ui-designer` (`docs/design/components.md`) and `software-architect` (headless library ADR) |
| **Date** | 2026-11-19 |
| **Author** | `ux-architect` |
| **Scope** | Every UI component the [screens](screens/) need: what it does, its states, its RTL behaviour and its accessibility contract. **No visual style** (that's `ui-designer`) and **no library choice** (that's `software-architect`; dialogs, menus, tabs, popovers and sliders must come from the accessible headless library per the styling rules). |

**Conventions**
- *Primitive* = goes in `src/components/ui` (no business logic). *Feature* = composed in a feature folder.
- "States" lists behavioural states. `ui-designer` adds default, hover, focus-visible, active and disabled visuals to every interactive component.
- Every component takes all user-facing text from messages (GA-1) and every number through the locale formatter (GA-12).
- Touch targets ≥ 44 × 44 px (GA-4). Primary actions in focused mode ≥ 56 px tall on phones.

---

## 1. Layout and navigation

| Component | Kind | Behaviour | States | RTL | Accessibility | Used in |
|---|---|---|---|---|---|---|
| **AppShell** | Feature | Skip link, header, main landmark, tab bar (< 768) or top nav (≥ 768), footer | normal · focused mode (no nav) | `dir` from the locale helper | One `main`; skip link first; route change moves focus to `h1` | All |
| **AppHeader** | Feature | App name at the start; menu button at the end | – | Start = right | `header` landmark; menu button `aria-expanded` | All non-focused |
| **BottomTabBar** | Feature | Five tabs: Home · Topics · Mock exam · Templates and phrases · Guide (UXD-01) | active tab; hidden in focused mode and on get-ready (thumb zone) | Order runs right to left | `nav` with a name; `aria-current="page"`; icon + visible label; active state not colour-only | < 768 |
| **TopNav** | Feature | Six section links + menu | active link | Same order as tabs | as above | ≥ 768 |
| **MenuDrawer** | Primitive (dialog) | Lists every section, then Settings, About, Privacy | open · closed | Slides from the end side (left) | Modal; focus trap; Escape closes; returns focus | All |
| **FocusedModeShell** | Feature | Minimal header: Leave/Close (start), activity or mode label, optional timers (end). No tabs. Holds the Screen Wake Lock while mounted and visible (rev. 2, R-01); owns the back behaviour (R-02). | – | Leave on the right | Leave never adjacent to the primary action | Mock runner, answer aloud, shadowing |
| **BackLink** | Primitive | "‹ {parent}" | – | Arrow mirrors | Link names the destination | Deep pages |
| **SectionNav** | Feature | Sticky A · B · General; scroll-spy marks the section in view; side list at 1280 | current section | Segments right to left | `nav` with a name; `aria-current="true"`; activating moves focus to the heading; scroll padding so the bar never hides focus (2.4.11) | Topic page |
| **SegmentedNav** | Primitive | View switch where each option is a URL (library views, templates/toolbox/words) | current | Right to left | Links with `aria-current="page"` (not ARIA tabs) | Library, templates |
| **JumpLinks** | Primitive | In-page fragment links | – | – | Focus moves to the target heading | Guide, toolbox, progress |
| **PageHeader** | Primitive | `h1`, optional subtitle and meta line | – | – | One `h1` per page | All |
| **Footer** | Feature | About · Privacy · "not an official SIRI product" · credit | – | – | `contentinfo` | Non-focused pages |

## 2. Text and labels (bidi-critical)

| Component | Kind | Behaviour | States | RTL / bidi | Accessibility | Used in |
|---|---|---|---|---|---|---|
| **DanishText** | Primitive | Renders any Danish block or inline run. **Rev. 2.2 (a11y M1): Danish never goes into `aria-label`, `title`, `alt` or a plain-string announcement**, where its `lang` would be lost. Accessible names that include Danish use `aria-labelledby`/`aria-describedby` pointing at a DanishText element; names come from content, not interpolated strings. | block · inline | **Always `lang="da"` `dir="ltr"`**; inline runs inside Persian use `<bdi lang="da">`. Blocks align to their own start (left). Supports `emphasis` ranges (bold connectives) and word-highlight hooks. | Screen readers switch to Danish (US-052 #4) | Everywhere |
| **PersianText** | Primitive | Persian content fields (translations, labels from content) | – | `lang="fa"`; Latin runs inside (e.g. "(sosu)") isolated | – | Translations |
| **TermLabel** | Primitive | "Maj–Juni 2024 · B" built from term ID + letter (UXD-22) | – | Danish proper name, LTR isolate, Latin digits; letter Latin | Read as Danish | Lists, headers, reveal |
| **Pre2023Badge** | Primitive | Rev. 2 (R-05, R-17): two variants. **Plain** (text only, "older format") inside list items. **Explained** (text + Disclosure with the US-009 #3 points and "in the mock this topic runs in today's format") on the topic header and the reveal. The label embeds a TermLabel (`Maj–Juni 2023`) rather than a Persian-digit year. | plain · collapsed · expanded | Icon not mirrored | Never a control inside a link; Disclosure never hover-only; not colour-only (US-009 #5) | Library (plain), topic, reveal |
| **EraDivider** | Feature | Rev. 2 (R-17): one divider in the terms view between today's format and the older format, with an info button opening the explanation | – | – | Heading + Disclosure | Terms view |
| **ListInfoButton** | Primitive | Rev. 2 (R-05): "What does 'older format' mean?" beside a list heading | – | – | Disclosure outside the list | Theme, search |
| **SourceLabel** | Primitive | "SIRI's wording ({document})" for the intro line, the closing and verified required questions · **"SIRI's suggested wording ({document})"** for situation intros and suggested follow-ups, which SIRI offers as suggestions the examiner may reword (rev. 2.1, exam review S3, decided by delegation, 2026-11-20) · "The app's wording" · "The app's wording, based on SIRI's instruction" · "As given in the booklet" · "The booklet's description of the picture" | variant per origin and role | – | Plain text | Intros, follow-ups, examiner lines, situation cards, about |
| **VerificationNote** | Primitive | Per question: **matches**, with a Disclosure "checked on {date} · SIRI examiner booklet {termLabel}, p. {page} · open (external)" (rev. 2, R-16) · **booklet wording, not yet checked word for word** · **differs** (Disclosure, per OQ-17) | 3 variants | – | Text, with an icon that isn't the only signal; external link marked | Topic, review |
| **CreditLine** | Primitive | "From the booklet by {author}, pages …" | – | Page numbers via formatter | – | Topic, templates, toolbox |
| **InfoNote** | Primitive | Calm one-to-three-line note, optionally collapsible and dismissible (UXD-26) | open · collapsed · dismissed | Info icon not mirrored | Collapsible variant is a Disclosure; dismissal is a labelled button | Many |
| **ExternalLink** | Primitive | Link to an external site | – | Icon mirrors | Accessible name adds "(opens an external site)" | Guide, about |

## 3. Content blocks (topic study)

| Component | Kind | Behaviour | States | RTL / bidi | Accessibility | Used in |
|---|---|---|---|---|---|---|
| **SituationCard** | Feature | Theme icon, key letter, booklet's Danish title (D-18); SourceLabel "the booklet's description of the picture" in the study variant (rev. 2, R-16); translation on request | variants: study · look · compact (interview) · selected ("the examiner's situation") | A on the right when side by side; icon decorative | Card text carries meaning; icon `aria-hidden` (US-029 #7); selected state as text + non-colour cue | Topic, look, interview |
| **TranslationToggle** | Primitive | Shows/hides a Persian translation in place (US-013) | hidden (default) · shown | – | Disclosure with `aria-expanded`; revealed content follows the control; scroll position kept | Questions, follow-ups, situation titles |
| **ExaminerIntroBlock** | Feature | Label + SourceLabel + PlayButton + DanishText | – | – | `h3` | Topic |
| **QuestionBlock** | Feature | Role label, PlayButton (examiner voice), DanishText, VerificationNote, TranslationToggle, SimilarQuestionLinks | – | – | `h3` role label; play button names what it plays | Topic |
| **KeywordList** | Feature | Exactly three pairs, Danish line above Persian line (UXD-24), optional decorative emoji, tip link | – | Never on one line; never concatenated | List of 3; emoji `aria-hidden` | Topic, hints, review |
| **ModelAnswerBlock** | Feature | Collapsed by default (UXD-04); label (OQ-14), template link, AudioPlayer, DanishText with emphasis + WordHighlighter, shadow link. No translation (D-19). | collapsed · expanded · playing | – | Disclosure | Topic, review, answer aloud |
| **PersonalExampleBlock** | Feature | Label "from a nurse's perspective" (D-20), PlayButton, DanishText, prompt + link | collapsed · expanded | – | Disclosure | Topic |
| **FollowupBlock** | Feature | Label "Suggested follow-up", examiner note, PlayButton, DanishText, VerificationNote, TranslationToggle, Answer aloud, short answer (collapsed) | – | – | `h3` | Topic |
| **SimilarQuestionLink** | Primitive | "A similar question: {TermLabel} · {part}" | – | Built from isolated parts (ICU), not concatenation | Link name includes Danish term label with `lang` | Topic, similar page |
| **RelatedTopics** | Feature | List of topic links, our wording (D-21) | – | – | List | Topic |
| **ThemeCard** | Feature | Icon, Persian + Danish name, count | – | Chevron mirrors | Single link | Library |
| **TopicListItem** | Feature | Danish name, Persian name, TermLabel, Pre2023Badge (plain), PracticeStatus | – | Chevron mirrors | Single link with **no interactive descendants** (rev. 2, R-05); name starts with Danish name | Library, search |
| **TermJumpList** | Primitive | Rev. 2 (R-29): compact links to each term heading; term headings link to term pages | – | – | `nav` with a name | Terms view |
| **TermGroup** | Feature | Term heading + A/B/C rows | – | A on the right in row layouts | Heading + list | Terms view |
| **FilterChips** | Primitive | Sub-theme filter as links (`?sub=`) | current | Wrap right to left | `aria-current` | Theme page |
| **SearchField** | Primitive | Visible label; debounced results | empty · typing · results · no results | `dir="auto"` on the input (user input only) | Label; results count via ResultsCount | Library |
| **ResultsCount** | Primitive | "{n} topics found" | – | Persian digits | Polite live region, debounced (US-008 #4) | Search |
| **StepList** | Primitive | Ordered steps with optional notes | – | Numbers Persian | `ol` | Guide |
| **Timeline** | Feature | Draw → ~10 s → ~4½ min → closing | horizontal · vertical | **Reads right to left; connectors mirror** (US-001 #2) | `ol` with text per segment; connectors decorative | Guide |
| **TemplateCard** | Feature | Template title with Danish cue, "fits" line | – | Cue isolated | Single link | Templates hub |
| **TemplateStep** / **CueRow** | Feature | Persian label, Danish phrase (verbatim notation), Persian meaning, PlayButton; hidden in test-myself until revealed | shown · hidden · revealed | Danish block | Reveal button names the step; focus stays on revealed text | Templates |
| **PhraseItem** | Feature | Danish line, Persian meaning, PlayButton, optional emoji and shadow action | – | Danish and Persian on separate lines | Play name = meaning; Danish as description | Toolbox, vocabulary, examiner phrases |

## 4. Audio and recording

| Component | Kind | Behaviour | States | RTL | Accessibility | Used in |
|---|---|---|---|---|---|---|
| **PlayButton** | Primitive | One-tap play/pause for a short clip; loads on first tap; stops any other clip (GA-11) | idle · loading · playing · paused · error (retry) | **Not mirrored** | Name says what plays; state via `aria-pressed` or label change; a second tap while loading doesn't double-play (US-062 #2) | Everywhere |
| **AudioPlayer** | Primitive | Play/pause, seek bar, elapsed/total, SpeedControl | idle · loading · playing · paused · ended · error | **Scrubber and progress fill left to right; not mirrored** (media direction); the slider element is `dir="ltr"` so **→ seeks forward, ← back** in the RTL page (rev. 2, R-22; E2E check); times in Persian digits inside LTR isolates | Slider from the headless library with value text "0:12 of 0:31"; keyboard seek | Sample answers, review |
| **SpeedControl** | Primitive | 0.75× · 1× · 1.25×; global; remembered (US-015 #3) | – | – | Radio group or select with label | Players, settings |
| **WordHighlighter** | Feature | Highlights the current word from word timings (US-016) | off · on · paused (stays) · ended (clears) | – | Visual only (underline + weight, not colour alone); not announced; no auto-scroll with reduced motion | Sample answers |
| **ExaminerPanel** | Feature | "The examiner is speaking…" / "Your turn" / "Repeating…" with an activity indicator | speaking · waiting · repeating · blocked | Indicator not mirrored | Status text; indicator `aria-hidden`; static under reduced motion | Mock, answer aloud |
| **ShowTextToggle** | Primitive | Reveals the Danish text of the current examiner unit (US-030 #5) | hidden · shown | – | Disclosure | Mock, answer aloud |
| **TapToHear** | Feature | Replaces the primary slot when autoplay is blocked (US-062 #4) | – | – | Becomes the primary; announced | Mock |
| **RecordingIndicator** | Primitive | "● Recording" / "Microphone ready" / "Not recording" / "Stopped at 3 min" | 4 variants | Not mirrored | Icon + text, never colour or dot alone; static under reduced motion | Mock, answer aloud, shadowing |
| **RecordButton** | Primitive | Record / Stop | idle · requesting permission · recording · stopped | Not mirrored | Name reflects action; announced on start/stop | Shadowing |
| **TakePlayer** | Feature | Plays the learner's take(s) in sequence; shows length; "recorded in 2 parts" | none · ready · playing | Not mirrored | Name "Play your answer to …" | Answer aloud, review, shadowing |
| **CompareButton** | Feature | Plays original, then mine | – | – | Announces nothing extra | Shadowing |
| **MicLevelMeter** | Feature (optional) | Live input level for the get-ready check (UX-OQ-26) | – | Fills left to right (media) | Text equivalent "We can hear you" when level passes a threshold | Get ready |
| **SoundCheck** | Feature | Rev. 2 (R-11): "Is the sound loud enough?" → play a neutral line shown with its Danish text and Persian meaning → "Yes, I can hear it" / "No sound" + help. About volume, never understanding. | not checked · playing · heard · problem | – | Group with status text | Get ready |
| **WakeLockTip** | Primitive | Rev. 2 (R-01): one-time tip when the Screen Wake Lock is unsupported ("set auto-lock to 2 minutes or more") | – | – | Plain text | Get ready, first answer aloud |
| **TipLine** | Primitive | One-line tip, e.g. "Turn on Do Not Disturb" (R-07) | – | – | Plain text | Get ready (exam) |
| **MicPermissionExplainer** | Feature | Why, on-device only, deleted by default, optional; Allow / Continue without (US-044 #1, US-063 #1) | sheet variant · inline variant | – | Dialog (sheet) or group (inline); the browser prompt only after Allow | Recording entry points |
| **MicDeniedHelp** | Feature | Per-browser steps; continue without; try again (US-063 #2) | iOS Safari · Android Chrome · desktop | – | Steps as an ordered list | Same |

## 5. Timers and progress through an activity

| Component | Kind | Behaviour | States | RTL | Accessibility | Used in |
|---|---|---|---|---|---|---|
| **ExamClock** | Feature | "2:15 of about 4:30" (exam) / "2:15" (practice); never counts down; no colour change (UXD-05) | visible · hidden · grace (text only) | Digits Persian in LTR isolate; ICU "of" phrasing | Not live; one-minute announcement only (state machine §15); hideable (2.2.2) | Mock |
| **TimersToggle** | Primitive | Show/hide all mock timers; remembered | – | – | Toggle button with `aria-pressed` | Mock |
| **ElapsedTimer** | Primitive | Per-answer elapsed, optional "45–60 s suggested" reference | running · paused · hidden | As above | Not live | Mock, answer aloud |
| **Countdown** | Feature | The 10-second look only | counting · paused (practice) | **Not mirrored** (clock) | Announced at start and end only; number `aria-hidden` with a static label | Look |
| **PacingAid** | Feature (Could) | Collapsed panel with the booklet's approximate split and part elapsed (US-070) | collapsed · open | – | Disclosure; never alerts | Practice mock |
| **StepIndicator** | Primitive | "Part 1 of 2" / "Sentence 3 of 5" | – | **Mirrors** (fills from the right) | Text equivalent always present | Mock, shadowing |
| **LoadProgress** | Primitive | Mock preload progress, slow and failed variants | loading · slow · failed · done | Fills right to left (it's progress, not media) | `progressbar` with value text | Reveal |

## 6. Mock exam specific

| Component | Kind | Behaviour | States | RTL | Accessibility | Used in |
|---|---|---|---|---|---|---|
| **ModeCard** | Feature | Mode name, rules list, one start button | – | Practice on the right / first | Region with `h2`; rules before the button | Mock start |
| **RulesList** | Primitive | Compact rules for a mode | – | – | List | Mock start, get ready |
| **ReadinessChecklist** | Feature | Sound + microphone rows, each with status | per row | – | Groups with headings and status descriptions | Get ready |
| **DrawCard** | Feature | Identical face-down card; reveals letter + topic on tap (US-028) | face down · revealing · revealed · disabled | Flip direction irrelevant; crossfade under reduced motion | Button "card n of 3"; one draw only | Draw |
| **RevealPanel** | Feature | The revealed card's content + LoadProgress + Start | loading · slow · failed · ready | – | Focus to its heading on reveal | Reveal |
| **LookControls** | Feature | Pause · +10 s · I'm ready (practice) | – | – | Buttons with clear names | Look |
| **ChoiceButtons** | Primitive | Situation A · B · Let the examiner choose | – | A first (right) | Group with a legend | Practice choose |
| **PrimaryActionSlot** | Feature | One persistent button whose label and `aria-disabled` change with the phase (UXD-08): Listen… / I've finished my answer / Tap to hear / Start / Continue. **Never turns into a different forward action** such as "Next question" (rev. 2, R-04): answer aloud's compare step removes it and moves focus. | waiting · active · busy | – | Focus never lost when phases change; double taps ignored by state | Mock, answer aloud, get ready, reveal |
| **RepeatControl** | Feature | Visible action label "Ask the examiner to repeat", then *"Undskyld, vil du godt gentage spørgsmålet?"* + Persian meaning; first-time hint "Say it aloud, then tap"; practice: "Hear it slower" from the second repeat (rev. 2, R-13) | available (answering) · unavailable (examiner speaking) · slower offered | Danish block | Name starts with the visible action label (2.5.3); Danish phrase as description | Mock, answer aloud |
| **HintsSheet** | Feature | Translation · key words · template card, without leaving the attempt (US-036 #2); pauses the answer timer while open (R-14) | closed · open | Sheet from the bottom | Modal sheet; focus trap; Escape **and back** close it (R-02) | Practice mock |
| **GraceNotice** | Primitive | Leads with permission: "You can finish your sentence. Then the examiner will end the exam." No countdown, no "time is up" (rev. 2, R-09) | – | – | Announced once | Exam mock |
| **LeaveDialog** | Feature | Continue the exam (default) · End and see my answers (after the first answer) · Leave without saving (rev. 2, UX-OQ-02) | practice (paused) · exam (clock runs; no new clip or answer phase, R-35) | – | Modal; default focus Continue; Escape and back = continue | Mock |
| **InterruptionDialog** | Feature | Reason; "the clock stopped at {m:ss}" (exam); Continue · Start again (this attempt won't be kept) · End and see my answers (rev. 2, R-08) | practice · exam | – | Modal; default focus Continue; back opens the LeaveDialog on top | Mock |
| **AudioErrorDialog** | Feature | Try again · End and see my answers (US-038 #7) | first failure · repeated failure | – | Modal; back opens the LeaveDialog on top | Mock |
| **PauseOverlay** | Feature | Continue · End and see my answers · Leave without saving (rev. 2) | – | – | Modal; back opens the LeaveDialog on top | Practice mock |
| **EndScreen** | Feature | Closing line text, "The exam is over", total time (+ "time during the interruption isn't counted", R-37), one primary action | – | – | Focus to `h1`; no grade (GA-10) | Mock |
| **FocusNextTimePicker** | Feature | Rev. 2 (R-18): optional single choice of one self-check item to focus on next time | none · chosen | – | Radio group with a "no choice" option; never required | Review |

## 7. Review and progress

| Component | Kind | Behaviour | States | RTL | Accessibility | Used in |
|---|---|---|---|---|---|---|
| **KeepCard** | Feature | Explains session-only recordings; switch to keep on this device (US-045) | off · on (kept) · failed · unavailable · from history (kept/delete) | Switch at the start | `role="switch"`; result announced | Review |
| **FactsList** | Primitive | Neutral facts: total time, interrupted, repeats, show text (US-041 #5) | – | Durations in LTR isolates | Plain list, no scoring language | Review |
| **ReviewQuestionItem** | Feature | Question, my answer (TakePlayer), sample (collapsed on phones), links | recorded · not recorded · parts | Mine on the right, sample on the left at 1280 | `h3`; one clip at a time | Review |
| **SelfCheckList** | Feature | 6 or 7 checkboxes with explanations and Danish examples; no total (US-042) | unticked · ticked · saved · not saved (storage) | Checkbox at the start | `fieldset`/`legend`; explanations via `aria-describedby` | Review |
| **DiscardGuardDialog** | Feature | Keep and leave · Leave without keeping · Stay (US-044 #2) | – | – | Modal; default focus Stay | Review, answer aloud, shadowing (2-button variant) |
| **ReviewDueList** / **ReviewDueItem** | Feature | Topics due today or earlier, oldest first; never "missed" (US-047 #5) | – | Chevron mirrors | Links | Home, progress |
| **ReviewBanner** | Feature | On the topic page: due / next / complete / start new cycle | 4 variants | – | Not live; the toast after completion is | Topic |
| **PracticeStatus** | Primitive | "Practised n times · last …" or "Ready to review" | – | Relative dates Persian | Text | Library, topic, progress |
| **AttemptHistoryItem** | Feature | Date, topic, situation, mode label (incl. "ended early"), **total time**, optional "focus next time"; **no ticks** (rev. 2, R-18); "recordings kept" | – | – | Single link | Progress |
| **PractisedTopicItem** | Feature | Topic, count, last date, review status | – | – | Link | Progress |

## 8. Feedback and system

| Component | Kind | Behaviour | States | Accessibility | Used in |
|---|---|---|---|---|---|
| **LiveRegion** | Primitive | One polite announcer per page; queues messages until examiner audio stops, and during answers until after Done except the handover and grace notices (state machine §15, rev. 2.2). **Renders markup**, so Danish params appear as `<span lang="da">` (a11y M1). | – | `aria-live="polite"`; never per second | Mock, answer aloud, search, toasts |
| **Toast** | Primitive | Short, calm confirmation or one-off failure ("Review done", "Link copied", "We couldn't save just now") | – | Uses the LiveRegion; doesn't steal focus; stays long enough to read (≥ 6 s, pausable on hover/focus) | Many |
| **StorageNotice** | Primitive | One short notice with the reason (US-050) | – | Plain text with a privacy link | Progress views, settings, review |
| **ErrorState** | Primitive | Page-level calm error with next steps (GA-9) | not found · page error · offline · lost attempt | Focus to `h1` | System pages |
| **EmptyState** | Primitive | Calm explanation + one or two links; never a list of what's not done (US-067 #4) | – | – | Progress, search |
| **Skeleton** | Primitive | Shown only after a delay threshold | – | `aria-busy` on the region | Slow routes |
| **ConfirmDialog** | Primitive | Destructive confirmation (US-049 #2) | – | Modal; default focus Cancel; destructive button names its action | Settings |
| **Dialog / Sheet** | Primitive (headless) | Base for every modal | – | Focus trap, Escape, return focus, `aria-labelledby` | Many |
| **Disclosure** | Primitive (headless) | Expand/collapse | collapsed · expanded | `aria-expanded`, `aria-controls` | Many |
| **Switch / Checkbox / RadioGroup** | Primitive (headless) | Form controls | – | Visible labels | Settings, get ready, review |
| **OverflowMenu** | Primitive (headless) | Secondary actions (share, report) on phones | – | Menu pattern | Topic |
| **ShareButton** | Feature | Native share sheet, else copy link + toast (US-066 #2) | – | – | Topic, theme |
| **ReportProblemLink** | Feature | Opens the D-9 channel with the item ID (US-065) | – | Says where it goes | Topic, templates, toolbox |
| **Button** | Primitive | Variants: primary · secondary · tertiary · destructive · icon-only (with accessible name) | default · loading · aria-disabled | Debounced by state, not timers (GA-4) | All |

---

## 9. Icon mirroring in RTL

| Mirror | Don't mirror |
|---|---|
| Back/forward arrows, row chevrons, "next/previous sentence", breadcrumb separators, StepIndicator, the guide Timeline connectors, LoadProgress, external-link arrow, menu drawer direction, leave/exit arrow (if a door-with-arrow icon is used) | Play, pause, replay/repeat media icon, audio progress bar and scrubber, speed control, Countdown, ExamClock, record dot, microphone, speaker/volume, checkmarks, info icon, search magnifier, close (×), theme icons and emoji, logos |

## 10. Content roles that must be recognisable at a glance

For `ui-designer` (agent brief: "content roles are recognisable at a glance"; colour never the only signal): **examiner speech** (intro, question, follow-up, examiner lines), **sample answer**, **suggested follow-up**, **personal example**, **key words**, **Persian translation**, **the app's own wording** vs **SIRI's wording** vs **booklet wording**, **the learner's own recording**. Each needs a consistent combination of label, icon and typographic role across the topic page, the mock, the review and the phrases page.
