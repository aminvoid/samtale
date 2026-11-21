# Learner walkthrough: UX specs v1

- **Reviewer:** `learner-persona` agent, 2026-11-19
- **Scope:** `docs/ux/` (README, information architecture, the flows and screens on each route, component inventory, the mock-exam state machine), `docs/product/personas.md`, `content/topics/2024-maj-b.json`, `content/examiner-lines.json`, `docs/resources/ABOUT_PD3_MUNDTLIG.md` §3.4 and §10. ADR-0007 and ADR-0014 were read only to check what the specs assume about the platform.
- **Not in scope:** visual design (`docs/design/` doesn't exist yet), content correctness, code.

> **Limitations (one line):** this is a walkthrough of specs and ASCII wireframes, not of a running app or real people, so every reaction below is a **hypothesis** to test with real learners; claims about phone behaviour (screen auto-lock, call banners, Telegram's in-app browser, Android back) are unverified and belong in the OQ-9 spike.

**Personas.** `docs/product/personas.md` matches my built-in personas (same names, ages and traits) and adds detail, so I used it: Maryam needs at least a 10 in the oral for nurse authorisation; Ahmad reads standard Persian easily but finds some Iranian expressions foreign; Sara is from Iran, at B2. Everything in their voices below is invented to illustrate, as in the personas file.

**How to read each step.** Each step has a five-second test (*What is this? Is it for me? What do I do next?*), a first-person think-aloud, and a separate **analyst note**. Analyst notes list only the dimensions that have something to report: clarity, cognitive load, anxiety and trust, accessibility, RTL/bidi, and faithfulness to the real exam. UI text is quoted in Persian where the specs give a draft, and as the spec's English gloss (in "quotes") where no Persian exists yet. Recommendations are numbered **R-xx** and collected in §7.

---

## 1. Summary: the ten things most likely to hurt real learners

1. **The phone's screen may lock in the middle of an answer** (R-01). Learners speak for 45–90 s without touching the screen, and phones often lock after 30–60 s. Nothing in the specs keeps the screen awake. If this is true, most mocks will be "interrupted" by the learner's own phone. Ahmad (A10), Maryam (M5).
2. **Android back and iOS edge-swipe throw away an attempt with no warning** (R-02). On Android, people press back to close a sheet. Pressing back with the hints sheet open would end the whole mock. All three personas support UX-OQ-01.
3. **A phone call during an answer may look like "the microphone stopped"** (R-03). The rest of the attempt would then go unrecorded while the clock keeps running. Maryam (M6).
4. **In answer aloud, a second press of Done skips the comparison** (R-04). The Done button becomes "Next question" in place. Sara (S5).
5. **The second required question can be lost when part 1 runs long** (R-10). In the real exam it is always asked. A learner aiming for a 10, who gives long answers, is the one who'd hit this. Maryam (M9).
6. **The sound check plays a Danish sentence Ahmad doesn't understand,** with "I heard it" / "I can't hear it" buttons. He may read this as a comprehension test he has failed before the mock even starts (R-11). Ahmad (A4).
7. **The get-ready screen is the busiest screen in the app,** and it comes just before the most stressful activity (R-12). Ahmad (A4).
8. **"Time is up" appears in the middle of a sentence** (R-09). It is the one thing an anxious learner is training herself not to react to, and the real exam has no such message. Maryam (M9).
9. **Sara's trust signals stop one step short of proof** (R-16, R-17). Verification notes have no date, page or link. The booklet-wording note doesn't say "not checked". Situation titles have no source label. The pre-2023 label mixes ۲۰۲۳ with Latin "2019".
10. **A learner who has only done mocks never reaches Home's returning state,** so "ready to review" never shows (R-06). Ahmad (A13).

---

## 2. Walkthrough 1: Ahmad, 375 px, practice mock without a microphone

**Route:** a Telegram link → home → guide → mock start → get ready (practice, no microphone) → draw → look → interview (repeat request) → end → review → a return visit three days later.

### A0 · Before arrival
> "Someone in the Telegram group posted this link: 'Persian app for PD3 oral'. I've just finished a night shift and I'm on the bus on mobile data, so I hope it isn't heavy. My oral exam is in December. What scares me most is the examiner saying something fast and me not understanding a single word. If it's simple, in Persian, and looks serious, I'll give it ten minutes."

### A1 · Home, first visit (`/fa`), opened from Telegram
**Five-second test.** *What is it?* Practice for the oral exam, in Persian. *For me?* Probably. *Next?* The big box: "How does delprøve 2 work?"

**Think-aloud.** "OK, the app name, then 'Practise delprøve 2 of the PD3 oral, with explanations in Persian'. Good, Persian. Next line: 'Not an official SIRI product.' Hmm. Not official? So is it fake? And SIRI… like Siri on the iPhone? Then it says 'Questions from published exams 2016–2024', and that sounds real. There are three boxes. The first is the biggest: 'How does delprøve 2 work? About a 3-minute read.' Three minutes of reading is a lot for me, but OK, that's what I need. I tap it."

**Analyst note.**
- **Anxiety and trust:** the honesty line puts what the app is **not** before what it **is**. Ahmad "trusts things that look official". He may take "not official" as "not real" before he reaches "questions from published exams". "SIRI" has no gloss and is a homograph of Apple's Siri («سیری»). This needs a Persian gloss, or a name learners recognise (R-19).
- **Clarity:** "delprøve 2" isn't explained on Home. A Persian gloss ("part 2 of the oral: the unprepared conversation") would help B1 learners who haven't met the term (R-19).
- **RTL/bidi:** home shows "2016–2024" in Persian digits (D-2), while every term label below uses Latin digits ("Maj–Juni 2024 · B", UXD-22). That makes two digit systems for years on one screen (R-33).
- **Accessibility and platform:** first-visit.md calls a Telegram link the most likely way in. On many phones Telegram opens links in its own in-app browser. Microphone support, storage and back behaviour may differ there, and progress saved there won't be in Chrome or Safari later. The specs don't mention this (R-21).

### A2 · The delprøve 2 guide (`/fa/guide/delproeve-2`)
**Five-second test.** *What is it?* "How delprøve 2 works". *For me?* Yes. *Next?* Read, or scroll.

**Think-aloud.** "'An unprepared talk of about 4½ minutes on a topic you draw.' Good, one sentence, I understand it. Then the steps. Number 3: the examiner asks the first question, often 'Hvorfor tror du, …?'. I know *hvorfor*. Number 5: 'listen for *overordnet*'. What does *overordnet* mean? It doesn't say. Can I hear it? There's no play button. I'm scrolling… timeline… 'What the examiner does and doesn't do': 'repeats a question you didn't understand'. This is the best thing on the page. So I'm allowed to ask! I want to hear how the examiner sounds, but there's no sound here. I scroll a long way down and find 'Next: Try a practice mock'."

**Analyst note.**
- **Clarity:** Danish words inside the steps (*overordnet*, *generelt*, *Hvorfor tror du*, *Tak, så er prøven forbi*) are isolated as Danish, but exam-guide.md doesn't give them a Persian gloss. For Ahmad, a Danish word with no meaning is noise (R-20).
- **Load:** seven steps, a timeline, eight examiner bullets, assessment, grade, where delprøve 2 fits, more, next and sources. That's about 5–6 screens at 375 px. The single most calming fact for Ahmad ("you may ask for a repeat, and the examiner must repeat a required question") is the first of eight bullets in the fourth section. Consider surfacing it near the top.
- **Accessibility (listening-first):** the main guide has no audio by design, which is right for data. But the three examiner lines and the repeat phrase are short, and the whole point for Ahmad is to *hear* them. Inline play buttons that load on tap cost nothing until used (R-20). The phrases sub-page (US-002) is milestone M3, so at M2 the mock would be the first place Ahmad ever hears the examiner (R-20).
- **Faithfulness:** good. The steps follow ABOUT §3.4 in order, and "no picture description any more" is there.

### A3 · Mock exam start (`/fa/mock`)
**Five-second test.** *What is it?* Two ways to do a test exam. *For me?* The first one. *Next?* "Start practice".

**Think-aloud.** "Two boxes. The top one is «تمرین»: 'pause any time, hints, no time limit, record an answer again'. No time limit, good. Record? I don't want to record my voice. The second box, «شرایط آزمون», says 'can't be paused'. Not for me today. Right at the bottom: 'mic optional'. OK. 'No grade. You check yourself after.' Good, nobody is judging me. Start practice."

**Analyst note.**
- **Anxiety:** practice first (D-1) works. "Mic optional" sits at the bottom, below the exam-conditions card. For a microphone-shy learner, "(optional)" next to "Record an answer again" inside the practice card would answer the worry where it arises.
- **Clarity:** the five bullet points are scannable. Good.

### A4 · Get ready, practice (`/fa/mock/practice`)
**Five-second test.** *What is it?* Lots of settings. *For me?* … *Next?* Not sure. The button at the bottom is greyed out.

**Think-aloud.** "'Practice: get ready'. Topic: three round buttons. 'Draw a topic (like the exam)' is already chosen. Fine. Situation: two more round buttons. 'The examiner chooses (like the exam)'. Fine. 'Approximate time split' with a switch. What is that? I leave it. Then '1 Can you hear the examiner?' and 'Play the examiner'. I press it. A man says something long in Danish: '…*et spørgsmål af en mere overordnet karakter*'. I caught *spørgsmål*. Did I hear it? Yes. Did I understand it? No. Which button do I press, 'I heard it' or 'I can't hear it'? I already feel bad. I press 'I heard it'. Then '2 Why the microphone?' It says my recordings stay on this device and are never uploaded. I press 'Continue without recording'. Then 'Always show the examiner's text' with a switch. Should I turn it on? Maybe that's cheating. I leave it off. Now the bottom button works: 'Continue to the draw'."

**Analyst note.**
- **Load:** this is the busiest screen in the product: two radio groups, two switches, two checks with four buttons, and a primary action. It comes just before the most stressful activity. Defaults are good, but all the options are visible (R-12).
- **Anxiety (the moment I almost gave up, see below):** the sound-check sample is `examiner.transition` (UXD-28, C13): a long Danish sentence with no context, text or meaning. "I heard it" (heard) is easily confused with "I understood it". A B1 learner can fail his own sound check before the mock starts (R-11).
- **Clarity:** "Approximate time split" means nothing to Ahmad. "Always show the examiner's text" is an accessibility accommodation (UXD-13). It is **remembered and also applies in exam conditions**, so a learner who switches it on once may not realise later exam-conditions runs show text automatically (R-12).
- **Copy:** recording-consent-and-microphone.md says copy "never says 'upload'", while `mic.explain.body` and the privacy page say "never uploaded". The intent is clear, but the Persian should avoid the loanword «آپلود». A draft for `persian-localization-reviewer`: «صدای شما از این گوشی بیرون نمی‌رود.» ("your voice never leaves this phone").
- **Accessibility:** "Continue" is aria-disabled with a visible reason. Good.

### A5 · Draw (focused mode)
**Five-second test.** *What is it?* Three cards. *For me?* Yes. *Next?* Tap one.

**Think-aloud.** "'Like the exam: three identical slips. Tap one.' Nice, like the real thing. Underneath: 'The letter you get is the real letter of that exam topic.' What letter? There are no letters. I tap the middle one."

**Analyst note.**
- **Clarity:** the first-time hint explains a letter Ahmad can't see yet. It belongs on the reveal, after the letter appears (R-23).
- **Faithfulness:** strong. Identical unmarked slips (ABOUT §10).

### A6 · Reveal and load
**Five-second test.** *What is it?* My topic. *For me?* Yes. *Next?* Wait, then "Start".

**Think-aloud.** "B. '*Mangel på arbejdskraft*', and in Persian «کمبود نیروی کار». Labour shortage, I know this. 'Maj–Juni 2024 · B'. 'Getting the examiner ready… 9 of 12'. Nine of twelve what? It's slow on the bus. How much internet is this using? 'You can pause at any time.' Good. It's ready: «شروع»."

**Analyst note.**
- **Anxiety:** the "Nothing has started yet" copy for the slow state is excellent for Ahmad. A small "about 1 MB, downloaded once" line would answer his data worry (ADR-0007 says about 1 MB per attempt) (R-25). "9 of 12" means nothing to him; a plain bar is enough.

### A7 · Intro line and the look (practice)
**Five-second test.** *What is it?* Two boxes in Danish and a number counting down. *For me?* Yes. *Next?* Read fast.

**Think-aloud.** "The examiner talks: '*Her er der to billeder, som viser nogle situationer, der handler om emnet Mangel på arbejdskraft. Du har nu 10 sekunder…*' I got *to billeder* and *10 sekunder*. Two pictures? I see two boxes, not pictures. Oh, there's a line: «در آزمون واقعی، به‌جای این کارت‌ها دو عکس می‌بینید.» OK. Box A: '*sygeplejerske med mange patienter*'. I know *sygeplejerske*. Box B: '*byggeplads, hvor arbejdet ikke er gået i gang*'. Too long. 7… 6… I press 'Show translations': «پرستاری با بیماران زیاد و سرِ شلوغ» and «کارگاه ساختمانی که کارش هنوز شروع نشده». 'سرِ شلوغ'? People in Iran say that. I understand it, but it isn't how we say it. I press '+10 s'. Good, that helped. Then 'I'm ready'."

**Analyst note.**
- **Faithfulness:** the line "two pictures" over text cards is explained by the Persian note. Good (PRD §6.5).
- **Load and layout:** at 375 × ~560 px (Android Chrome with its address bar), the h1, two stacked cards, the picture note, the countdown, the controls row and the primary button probably need scrolling during a 10-second window. The picture note is shown every time (mock-draw-and-look.md, View 3) and could shrink after the first few attempts (R-26).
- **Clarity:** SIRI's intro line has no Persian meaning anywhere in the mock. In practice mode, "show text" could include the Persian meaning of fixed examiner lines (intro, transition, *"Tak."*, closing), which already exist for the phrases page (R-27).
- **Persian (for `persian-localization-reviewer`, from the content, not the specs):** «سرِ شلوغ» is colloquial Iranian. Elsewhere in `2024-maj-b.json`, the translations use informal «به نظرت» and «جوان‌ها… دبیرستان نظری», while the interface rules require formal «شما» and Dari-friendly wording (`.claude/rules/i18n-rtl.md`) (R-32).

### A8 · Situation A: intro and first question (practice, no microphone)
**Five-second test.** *What is it?* The examiner is talking. *For me?* Yes. *Next?* Wait, then speak.

**Think-aloud.** "At the top it says 'Not recording'. Good, I trust that. 'Part 1 of 2'. The small boxes A and B, with A marked. 'First required question', 'The examiner is speaking…'. He says: '*Situation A viser en sygeplejerske, der har ansvar for mange patienter og har travlt. Der mangler arbejdskraft i sundhedssektoren, fx sygeplejersker og social- og sundhedsassistenter. Hvorfor tror du, der gør det?*' I got *Hvorfor tror du*, just like the guide said. The rest was fast. There are three buttons: 'Record again', 'Pause', 'Hints'. Record again? I'm not recording anything."

**Analyst note.**
- **Clarity:** "Record again" is shown even when the learner chose not to record (mock-interview.md, Answer area). It should be hidden when the microphone isn't on (R-14).
- **Accessibility:** at 375 px the pinned bottom area holds the repeat control (two lines of Danish plus a Persian line), the practice row and the 56 px primary button. With the larger system font common on older phones, it could cover the examiner panel. Unpin it at large text sizes (R-36).
- **Faithfulness:** the order of prompts matches ABOUT §3.4 exactly.

### A9 · Asking for a repeat, twice, then hints
**Five-second test.** *What is it?* A big box with a Danish sentence. *For me?* That's the sentence for "please repeat". *Next?* Is it a button?

**Think-aloud.** "'Your turn'. The timer says 0:04, then 0:05… In the big box: '*Undskyld, vil du godt gentage spørgsmålet?*' and underneath «ببخشید، می‌شود سؤال را تکرار کنید؟». Is this a button, or something to learn? I say it out loud (nobody is listening, so I'm not shy) and touch it. 'The examiner is repeating the question…' Same words, same speed. I caught *sundhedssektoren* this time. I press it again. Exactly the same again. A real person would say it more simply the second time. I open 'Hints', then 'Translation': «در بخش سلامت کمبود نیروی کار هست، مثلاً پرستار و دستیار بهداشتی-اجتماعی (sosu). به نظرت چرا؟» Now I get it. When I close the hints, the timer says 0:51. The booklet suggests 45–60 seconds, and I haven't said one word yet. Ugh."

**Analyst note.**
- **Felt most helped:** the repeat control. It shows the exact sentence he's afraid of needing, with its meaning, and it works (see key moments).
- **Clarity:** nothing visible says the box is an *action* ("ask the examiner to repeat"). `mock.repeat.label` exists for answer aloud but isn't shown in the mock wireframe. There's also no prompt to *say it aloud first* (US-032 #1 intends this) (R-13).
- **Faithfulness:** ABOUT §3.4 says the examiner repeats with roughly the same words **and may then rephrase**. The app always replays identical audio (PRD §6.5), which is fine for the first repeat. In practice mode, a second or later repeat could offer "hear it slower (0.75×)" as the app's honest equivalent of rephrasing. Exam conditions stay identical (R-13).
- **Anxiety:** the answer timer keeps running while the hints sheet is open. In practice ("no time limit"), reading a hint shouldn't eat into the 45–60 s guide (R-14).
- **RTL/bidi:** "(sosu)" is a Latin run in a Persian sentence. The spec isolates it (topic-study.md, RTL). Test it with the parentheses, because unisolated it may display as ")sosu(".

### A10 · Answering without a microphone; follow-up; general question
**Five-second test.** *What is it?* My turn. *For me?* Yes. *Next?* Speak, then press «جوابم تمام شد».

**Think-aloud.** "I speak slowly: '*Det er fordi… arbejdet er hårdt… og lønnen…*' I look out of the window to think. The screen goes dark. I touch it, and it's locked. I unlock it: 'The exam is paused.' Continue, Start again, End and review. Did I do something wrong? I press Continue. He asks the question again, and I finish and press Done. '*Tak.*' Then the follow-up. Then: '*Nu vil jeg stille dig et spørgsmål af en mere overordnet karakter*'. *Overordnet*, the word from the guide! I knew a general question was coming. '*… fordele og ulemper …*' Advantages and disadvantages, I know that. I open Hints to check, then press the phone's back button to close the hints… and everything is gone. I'm on the mock exam page again. What happened?"

**Analyst note.**
- **Screen lock:** a learner speaks for 45–90 s without touching the screen. Phones commonly dim and lock after 30–60 s (older Androids often default to 30 s). The state machine treats a locked screen as `APP_HIDDEN`, which is an interruption (§12.1), and nothing asks the browser to keep the screen on. In practice this means a paused answer. In exam conditions the attempt is labelled "interrupted". The Screen Wake Lock API is within the ADR-0014 browser floor (Chrome 111+, Safari 16.4+) (R-01).
- **Back:** on Android, back closes sheets and dialogs. Per US-038 #5 and state machine §7.6, back during an attempt is `NAVIGATED_AWAY`, which ends it with no dialog. The hints sheet, pause overlay and leave dialog don't say they capture back. The answer-aloud panel already does ("System back closes it", UXD-14), so the mock is inconsistent. After a back press, `/fa/mock` shows **no message** (mock-start.md: "After leaving an attempt: no message"), so Ahmad doesn't know what happened (R-02).
- **Interruption copy:** "The exam is paused." doesn't say why. A generic reason ("the screen turned off or another app opened") would stop him blaming himself (R-08).
- **Faithfulness:** hearing *overordnet* and recognising it is exactly the transfer the guide is for.

### A11 · Closing and end view
**Think-aloud** (on a second, complete run). "'*Tak, så er prøven forbi.*' I know that one, the exam is over. «آزمون تمام شد». 'Total time 3:52'. 'SIRI's wording', that Siri again. Big button: 'See my answers and check myself'."

**Analyst note.**
- **Anxiety:** calm, and no grade. Good. "SIRI's wording" is the same unglossed acronym (R-19).

### A12 · Review with no recordings (`/fa/mock/review/{attemptId}`)
**Five-second test.** *What is it?* My answers… but I didn't record. *For me?* Partly. *Next?* Not sure.

**Think-aloud.** "'Your answers'. A note: 'Listen to your answer, then the sample. Then tick what you did.' Listen to my answer? I didn't record one. 'Repeats asked: 2'. Why are they counting that? Is two bad? Under each question it says 'Not recorded', then '▸ Sample answer · template 1'. I have to open it each time. Inside there's audio, and I set it to 0.75. That's the best part: I listen to how I should have said it. Then six checkboxes, each with a long sentence. Then another seven. Too much reading. I skip them and press 'Home'."

**Analyst note.**
- **Clarity:** the first-time note assumes a recording exists (mock-review.md, States). The "not recorded" state needs its own wording (R-15).
- **Load:** without a recording there's nothing to compare, and the "answer before you read the model" reason for collapsing (R7) no longer applies because he has already answered. The sample answer is the most useful thing on this page for him. A play button visible on the collapsed row (or expanded samples when not recorded) saves four taps (R-15).
- **Anxiety:** "Repeats asked: 2" is neutral, but with no context Ahmad reads it as a demerit. One line, "Asking for a repeat is allowed in the real exam", fixes that (R-15).
- **Load:** 13 checkboxes across two lists is a lot to read at B1. Skipping is allowed without reminders (US-042 #4), which is the right safety valve.

### A13 · Three days later: Home
**Think-aloud.** "I open the link again. It's the same first page as before, with the big 'How does delprøve 2 work?' box. It doesn't remember me? I did a whole mock!"

**Analyst note.**
- **Spec gap:** home.md defines the returning state as "storage available, **at least one topic opened**". Ahmad never opened a topic page. He only did a mock, which marks 2024-maj-b as practised and starts its review cycle (state machine §14). So he stays on the first-visit Home, and "Ready to review" (part of the returning state) never shows his day-3 review (R-06).
- **Platform:** if Telegram opened the link in its in-app browser each time, storage may also differ between visits (R-21).

### Ahmad: key moments
- **The moment I almost gave up:** A4, the sound check. "I didn't understand the test sentence. If I can't even understand the sound check, how will I understand the exam?" A close second (if it happens): A10, the back press that wiped the mock with no explanation.
- **The moment I felt most helped:** A9. "The repeat button showed me the exact sentence to say, with the Persian under it, and the examiner really did repeat. And later I heard *overordnet* and knew what was coming."

### Ahmad: verdict
The sequence is faithful and calm, and the no-microphone path is respectful. The risks are at the edges: a dense get-ready screen, a sound check that feels like a test, Danish words with no meaning, the phone's own behaviour (screen lock, back button) ending or interrupting attempts, and a review page written for people who recorded.

---

## 3. Walkthrough 2: Maryam, 375 px (iPhone), exam conditions, topic `2024-maj-b`

**Route:** mock start → get ready (exam conditions) → draw (she happens to draw B; exam conditions can't choose a topic, US-040 #3) → look → situation A → a phone call at about 2:30 → the limit is reached mid-answer → end → review.

**Exam-clock timeline used** (C2 = 270 s, C3 = 20 s; the clock starts at the situation intro, C15):

| Clock | What happens |
|---|---|
| 0:00 | Situation A intro: *"Situation A viser en sygeplejerske, der har ansvar for mange patienter og har travlt."* |
| 0:06–0:15 | q1: *"Der mangler arbejdskraft i sundhedssektoren … Hvorfor tror du, der gør det?"* |
| 0:15–1:35 | Answer 1 (80 s), Done |
| 1:36–1:46 | *"Tak."* → follow-up: *"Hvilke problemer mener du, der kan være ved, at der mangler sygeplejersker og social- og sundhedsassistenter?"* |
| 1:46–2:30 | Answer 2 in progress, then the **call** (clock freezes at 2:30 if it's handled as an interruption) |
| 2:30–3:05 | After Continue: the follow-up replays, then the rest of answer 2; Done |
| 3:06–3:27 | *"Tak."* → transition → q2: *"Ved mangel på arbejdskraft … Hvilke fordele og ulemper mener du, der kan være ved det for samfundet?"* |
| 3:27–4:42 | Answer 3. At **4:30 the limit is reached** mid-answer, with a grace notice; Done at 4:42 → closing |

### M0 · Before arrival
> "Three weeks left, and I need a 10, not just a pass. I've done practice mode twice. Today I want a real run before my late shift: exam conditions, no hints. I'm in the kitchen with my phone, and the ward might call about my shift. I want to finish feeling 'ready', not panicked."

### M1 · Mock start, exam-conditions card
**Five-second test.** *What is it?* The two modes. *For me?* The second one today. *Next?* "Start under exam conditions".

**Think-aloud.** "«شرایط آزمون»: random topic, one clock of about 4½ minutes, can't be paused, no hints, leave at any time. Can't be paused… what if the ward calls? Do I lose everything? It doesn't say. I'll risk it."

**Analyst note.**
- **Anxiety:** "can't be paused" is stated (WCAG 2.2.1), but what happens when a call or screen lock interrupts isn't. The behaviour is actually reassuring ("the exam stops and waits; continue, or end and review"), so saying it up front lowers anxiety at no cost (R-07).

### M2 · Get ready (exam conditions)
**Think-aloud.** "The rules again, shorter. 'Microphone ready ✓', it remembers me. Good. I skip the sound check. 'Continue to the draw'."

**Analyst note.**
- **Anxiety and faithfulness:** a one-line tip before the draw ("Turn on Do Not Disturb so calls don't interrupt; everything you need loads before you start") would prevent the very interruption in this scenario. Get ready is the last safe moment, because no attempt exists yet (R-07).
- **Faithfulness:** the "always show the examiner's text" switch shows here in its remembered state. If Maryam had switched it on in practice, this run would show text by default. Say it plainly, as a status line ("Examiner's text: always shown · change") (R-12).

### M3 · Draw and reveal
**Think-aloud.** "Three slips, tap. B: '*Mangel på arbejdskraft*'. I know this one, the nurse topic! 'The clock starts when the examiner introduces the situation.' Good, so the 10 seconds don't count. «شروع»."

**Analyst note.**
- **Trust:** "the clock starts when…" is exactly the kind of rule anxious learners need before the moment it applies. Good.
- **Faithfulness:** a real draw. With the full library, this term's topics would be one of about 17 terms.

### M4 · Look (fixed 10 s, Danish only)
**Think-aloud.** "SIRI's sentence: I know it by heart now. 'Two pictures… cards instead.' I've read that note five times. A: *sygeplejerske med mange patienter*. B: *byggeplads…*. 10… 0. 'The examiner chose this situation': A. Of course, the nurse one."

**Analyst note.**
- **Load:** the picture note repeats on every attempt in a 10-second window. Compact it after the first few attempts (R-26).
- **Faithfulness:** good. No controls, no translations (US-029 #4).

### M5 · First required question and answer
**Five-second test.** *What is it?* The exam running. *For me?* Yes. *Next?* Answer, then Done.

**Think-aloud.** "'0:03 of about 4:30', '● Recording'. The intro, then the question. I know my three reasons: hard work, pay, more elderly people. I talk and look away from the phone to concentrate… [if the phone locks here, see the note] … 1:20 in, I'm done. I press «جوابم تمام شد». The big '0:41'-style number in the middle grows while I talk, and I keep glancing at it."

**Analyst note.**
- **Screen lock:** Maryam talks for 80 s without touching the phone. iPhones auto-lock after 30 s (forced in Low Power Mode) or 1 minute by default on many setups. Without a wake lock, this attempt would be "interrupted" here, before the call even comes (R-01). The rest of this walkthrough assumes the screen stays on.
- **Anxiety (relates to UX-OQ-03 and UXD-05):** two running numbers (the exam clock and a large answer timer). The real exam shows no clock. Maryam may cut answers short to "save time", which is the opposite of the depth she needs for a 10. The hide-timers toggle exists. Test whether anxious learners want it hidden by default after their first exam-conditions run.

### M6 · The phone call at about 2:30
**Think-aloud.** "In the middle of the follow-up answer, the phone rings. It's the ward. A banner at the top, so the app is still behind it. I tap the banner to answer, talk for a minute, hang up and come back."

**Analyst note.**
- **Signals:** the specs assume a call produces `APP_HIDDEN` or `AUDIO_INTERRUPTED` (§12.1). On recent iPhones an incoming call is often a **banner**, so the page stays visible. While she's *answering*, no examiner clip is playing, so there's no audio pause to detect (ADR-0007 maps `AUDIO_INTERRUPTED` to the audio element pausing). The only signal is the microphone track being muted by the system. ADR-0007 maps a mute of over 1 s while visible to `MIC_LOST`, which per §7.3:
  - stops recording, shows "The microphone stopped. The exam continues without recording.",
  - **keeps the clock running** (it isn't an interruption), and
  - sets `micState = unavailable` **for the rest of the attempt**.

  If she declines the call from the banner, she loses 10–20 s of clock and every later answer goes unrecorded. If she answers it, `APP_HIDDEN` follows and the dialog appears, but the microphone is already marked unavailable. **Her general-question answer would then be "Not recorded" in the review** (R-03). This needs the OQ-9 spike on real phones. The behaviour above is a hypothesis.
- **Faithfulness:** a real examiner would simply wait.

### M7 · Coming back: the interruption dialog
**Five-second test.** *What is it?* A message about the exam stopping. *For me?* Yes. *Next?* Three buttons: which one?

**Think-aloud.** "'The exam stopped while you were away.' Then: 'In exam conditions this attempt will be marked "interrupted". That's not a fail.' OK… thank you for saying that. Continue, Start again, End and review what I have. Did the clock stop? It doesn't say. If I press 'Start again', do I lose my first answer? It was a good one. I don't know. I press Continue."

**Analyst note.**
- **Felt most helped:** "That's not a fail." (see key moments).
- **Trust:** the dialog doesn't say the clock froze, or where it froze. "The clock stopped at ۲:۳۰ and continues from there" is true and calming. "Start again" doesn't say it discards this attempt and its recordings (UXD-11). Name the consequence (R-08).
- **Faithfulness:** "Start again" reuses the same topic, so she now knows the questions. A fresh draw would be more faithful. This is a question for the owner, not a must.

### M8 · Continue: the follow-up replays, then the transition and the general question
**Think-aloud.** "He asks the follow-up again. I finish my answer, Done. '*Tak.*' '*Nu vil jeg stille dig et spørgsmål af en mere overordnet karakter.*' Then the long one about foreign workers. *Fordele og ulemper.* I go: '*På den ene side… på den anden side…*'."

**Analyst note.**
- **Trust:** "recorded in 2 parts" (UXD-10) means nothing she said is lost. Good.

### M9 · The limit is reached mid-answer
**Five-second test.** *What is it?* A box appears: "Time is up". *For me?* Yes. *Next?* Panic.

**Think-aloud.** "I'm in the middle of '*…men vi skal også uddanne flere i Danmark, fordi…*' and a box appears: «زمان تمام شد؛ جمله‌تان را کامل کنید.» Time is up! I lose my sentence, say '*…ja, alt i alt…*', and press Done. That's exactly what I don't want to happen in the real exam."

**Analyst note.**
- **Anxiety:** the grace notice (state machine R7) is calm by design, with no countdown and no colour, but its first words, "Time is up", are the trigger. The real exam has **no** such message: the examiner waits for a natural break and says *"Tak, så er prøven forbi."* Options: lead with permission rather than the deadline (draft: «می‌توانید جمله‌تان را تمام کنید. بعد ممتحن آزمون را تمام می‌کند.»), or show nothing when timers are hidden. Test both (R-09).
- **Faithfulness, a bigger issue:** by R1 (§10), no new unit starts after the limit. If part 1 runs long (a learner aiming for a 10 talks for 2+ minutes per answer), the **second required question is never asked**. As I read ABOUT §3.4, both required questions are always asked, and the examiner trims follow-ups to make room. Ask `pd3-exam-expert` (related to UX-OQ-12). A rule such as "skip the remaining part-1 follow-ups when the clock passes X, so U2 is always asked" would keep the mock faithful (R-10).

### M10 · Closing and end view
**Think-aloud.** "'*Tak, så er prøven forbi.*' «آزمون تمام شد». 'Total time 4:42 · Interrupted'. 4:42? It's longer than 4:30, and I was on the phone for a minute. Does that count?"

**Analyst note.**
- **Clarity:** the total excludes frozen time, which is right but invisible. Add "(time during the interruption isn't counted)" when interrupted (R-37).

### M11 · Review
**Think-aloud.** "At the top: 'Your recordings are deleted when you leave this page. Keep this attempt on this device?' Yes! «روی همین دستگاه نگه دار». It says this replaces the attempt I kept last week for this topic. But I wanted to compare them… OK. My follow-up answer is in two parts, and it plays both. I listen to the general-question answer: I said '*På den ene side*' and never said '*på den anden side*'. That's useful. Self-check: I tick 'reason', 'example' and 'opinion', and leave 'both sides' unticked. Honest. Nothing tells me whether this is a 10, but I knew it wouldn't."

**Analyst note.**
- **Trust:** the keep card at the top (UXD-21) works. Replacing the earlier kept attempt (D-6) cuts against Maryam's main goal (seeing improvement on the same topic). That is a trade-off the owner accepted; validate it.
- **Faithfulness to her goal:** the self-check covers structure (reason, example, opinion, both sides). The assessed criteria also include nuanced, complex and correct language (ABOUT §4.1). A learner aiming for a 10 will notice there's no language-quality item. This is a product question, low priority (R-38).
- **Data loss:** if she swipes back (an iOS edge swipe) before toggling keep, the recordings go without asking (mock-review flow, step 6). The same back guard as UX-OQ-01 would help here (R-34).

### M12 · History entry (briefly)
"19 Nov · *Mangel på arbejdskraft* · A · Interrupted · reason · example · opinion". "So my best run says 'Interrupted' forever, and 'reason · example · opinion' looks like 3 out of 7." (See UX-OQ-28 in §5.)

### Maryam: key moments
- **The moment I almost gave up:** M9. "'Time is up' popped up and I lost my sentence, exactly the panic I'm practising to avoid." (If R-03's hypothesis holds, it's worse: finding "Not recorded" under her general-question answer.)
- **The moment I felt most helped:** M7. "'That's not a fail', and then hearing that nothing I'd said was lost: 'recorded in 2 parts'."

### Maryam: verdict
The exam-conditions run is faithful, and "interrupted, not failed" lands well. Her trust depends on four things the specs don't yet guarantee: the screen staying on, a call being recognised as a call, the second required question always being asked, and a gentler signal at the limit.

---

## 4. Walkthrough 3: Sara, 1280 px, keyboard only

**Route:** home (returning) → library by exam term → topic page `2024-maj-b` (verification labels) and a pre-2023 topic (the label and its explanation) → answer aloud → My progress, mock history → one past review.

### S0 · Before arrival
> "I've used it on my phone for a week. Tonight I'm on my laptop and want to go through the nine current-format topics systematically, check where every question comes from, and look at my mock history. Keyboard only: I don't want to reach for the trackpad. No tutorials, please."

### S1 · Home, returning (1280)
**Five-second test.** *What is it?* My dashboard. *For me?* Yes. *Next?* Topics.

**Think-aloud.** "Tab: 'Skip to content'. Tab, tab: the nav links. The order is 'My progress', then 'Home', 'Topics'… why is My progress before Home? Whatever. 'Topics', Enter. Wait, my history from my phone isn't here, of course: 'saved only in this browser'. Fine, I've done two mocks on this laptop too."

**Analyst note.**
- **Clarity:** IA §3.2 says the top nav uses "the same order as the tabs, with My progress added", but both wireframes put My progress first, before Home. Decide where it goes (R-31).
- **Trust:** progress being local to each device is a real limitation for laptop-plus-phone learners. It is honestly disclosed. It's a candidate interview question, not a v1 change.

### S2 · Library, by exam term (`/fa/topics/terms`)
**Five-second test.** *What is it?* All exam terms. *For me?* Yes. *Next?* The 2023–2024 terms.

**Think-aloud.** "Tab to the view switch, 'Exam terms', Enter. Focus stays on the switch. Good, no jumping. 'Maj–Juni 2024: C *Pædagogik i folkeskolen*, B *Mangel på arbejdskraft*, A *Støtte til kultur*'. Latin digits, like on SIRI's site. Good. Further down, every topic from 2022 and earlier carries a badge, «پیش از تغییر قالب آزمون در ۲۰۲۳», next to 'Nov–Dec 2019 · A'. So 2019 in Latin digits and ۲۰۲۳ in Persian, in the same row. Sloppy. And forty-two identical badges: just draw one line between 2023 and 2022. I want to open the badge's explanation, but Tab only lands on the whole row link. And reaching Nov–Dec 2017 means tabbing past 30 links."

**Analyst note.**
- **Accessibility (spec conflict):** TopicListItem is "a single link" with "no nested interactive elements" (topic-library.md, Accessibility), yet it contains a Pre2023Badge whose explanation is a Disclosure, which is a button (component inventory §2; UXD-27). The disclosure can't live inside the link. In lists, make the badge plain text, and put the explanation on the term heading, an era divider, the topic page and the reveal (R-05).
- **RTL/bidi and trust:** the label's ۲۰۲۳ (D-2) sits beside Latin term labels (UXD-22). Use one style for exam years, or phrase it as a term: "before Maj–Juni 2023" built with the TermLabel component (R-17).
- **Load:** one era divider ("Format from Maj–Juni 2023 onwards" / "Older format") instead of 42 badges would answer Sara's "how many current-format topics are there?" at a glance (R-17).
- **Keyboard:** there's no way to jump to a term. Make term headings links to `/fa/topics/terms/{termId}` and add a compact term jump list (R-29).

### S3 · Topic page `2024-maj-b` (1280)
**Five-second test.** *What is it?* The topic, laid out like the exam. *For me?* Yes. *Next?* Check the sources.

**Think-aloud.** "h1 '*Mangel på arbejdskraft*', «کمبود نیروی کار», 'Maj–Juni 2024 · B · Work'. Side nav: Situation A, B, General question. Intro: 'The examiner introduces · SIRI's wording'. Good. Question: '✓ Wording checked against SIRI's examiner booklet, May–June 2024'. Checked when? Which page? Can I open SIRI's PDF? It's public. I'd check page 8 myself. The situation card says '*sygeplejerske med mange patienter*'. That's not what SIRI's picture is called. The SIRI booklet says '*Mangel på medarbejdere i sundhedssektoren*'. So whose text is this card? Everything else on the page has a source label, but this doesn't. Bottom: 'From the booklet by Shery Rahimi, pages 36–37' and 'Report a problem'. Good. 'A simple, clear sample answer'. Honest; I like that it doesn't pretend to be a 12."

**Analyst note.**
- **Trust:** the content already stores `checkedOn` and `sourceRef.pages` (`2024-maj-b.json`, `siriCheck`), but the VerificationNote shows only the term. A disclosure with "checked on 18 Nov 2026 · SIRI examiner booklet May–June 2024, p. 8 · open (external)" turns a claim into proof for sceptics (R-16).
- **Trust:** the situation card has no SourceLabel. Under D-18 it shows the booklet's description of SIRI's picture, so label it as such (R-16).
- **Faithfulness:** the follow-up note "Real examiners ask follow-ups as they judge necessary" and the honest sample-answer label (OQ-14) are what Sara is looking for.

### S4 · A pre-2023 topic (any Nov–Dec 2019 topic)
**Think-aloud.** "The badge on the page header: Enter opens the explanation: the exam used to start with a picture description; then came the same two required questions; the description no longer exists; so the questions are still good practice. Clear. Does the mock run it in the old format? It doesn't say. The question says 'The question as given in the booklet (from SIRI's examiner booklets)'. So… was it checked or not? The About page says 'not yet checked word for word', but this note doesn't. And the intro: 'the app's wording'. Good, honest."

**Analyst note.**
- **Trust (inconsistent labels):** `labels.verification.booklet` (topic-study.md) omits "not yet checked word for word", which the About legend includes (about-and-privacy.md). Sara reads the inline label as ambiguous. Make the inline label carry the status (R-16).
- **Clarity and faithfulness:** add to the pre-2023 explanation: "In the mock exam this topic runs in today's format" (PRD §6.5), plus a link to the guide's "what changed" or to the About sources (R-17).

### S5 · Answer this question aloud (dialog at 1280)
**Five-second test.** *What is it?* A recording dialog. *For me?* Yes. *Next?* Listen, speak, Done.

**Think-aloud.** "Tab to '🎙 Answer aloud', Enter. Focus is on the dialog title. The question plays. The text is hidden ('Show the text'). Why hide it? I read it a second ago, and I can still see it through the dimmed background. Tab, tab to the big button: 'Listen…', disabled. Then 'Recording'. I answer for 50 seconds and press Space: Done. Without thinking I press Space again, and it's 'Next question', already playing the follow-up. I never heard my answer! I press Escape: 'Your recording will be deleted'. Hmm. When I do get to the compare view, I Shift+Tab back to 'Your answer', play it, then the sample. I press → on the sample's progress bar to skip ahead, and it goes *backwards*."

**Analyst note.**
- **Accessibility and data loss (key):** UXD-08's single persistent slot is safe in the mock, because after Done it becomes "Listen…" (disabled). In answer aloud, the slot after Done becomes an **active** "Next question" (answer-aloud.md, Phase 3 and Accessibility), so a double press or key repeat skips the comparison, which is the whole point of the exercise. Phase 3 is a new view, so move focus to "Play your answer" there and make "Next question" a separate control (R-04).
- **Keyboard and bidi:** the AudioPlayer scrubber isn't mirrored, so it fills left to right, but the spec doesn't say which arrow key seeks forward. Headless sliders in an RTL context often invert arrow keys. Set `dir="ltr"` on the slider so → means forward, and test it (R-22).
- **UX-OQ-29:** at 1280 the hidden question text is still readable behind the dialog backdrop, so hiding it costs a click and buys nothing (see §5).

### S6 · My progress, mock history (`/fa/progress#history`)
**Five-second test.** *What is it?* What I've done. *For me?* Yes. *Next?* Scan the history.

**Think-aloud.** "Right column: Ready to review and Coming up. Left column: My mock exams. Tab, tab… I go through the review items first. Fine. '18 Nov · *Støtte til kultur* · B · Exam conditions · reason · example'. No total time? That's the one hard fact I care about for exam conditions: did I fill 4½ minutes? 'reason · example': so I didn't tick 'opinion'. It reads like a checklist score anyway. I'd rather see the time and my own note to myself."

**Analyst note.**
- **Clarity:** AttemptHistoryItem (progress.md, item 4) lacks the total time, which is the most objective fact for an exam-conditions run (R-18).
- **UX-OQ-28:** see §5. The short-words display still invites subtraction.
- **Keyboard:** at 1280, a "jump to: Ready to review · My mock exams · Practised topics" list helps, as it does on phones (progress.md says jump links on 375 px only) (R-29).

### S7 · Opening a past review
**Think-aloud.** "'Recordings from this attempt weren't kept.' I knew that. Facts, questions, samples and my ticks. Fine. Back link '‹ My progress'. Good."

**Analyst note.** Works as specified. No issues.

### Sara: key moments
- **The moment I almost gave up:** S5. "I pressed Space twice and lost the one thing I came for, hearing my answer next to the model."
- **The moment I felt most helped:** S3–S4. "Every examiner line says whose words they are: SIRI's, the booklet's or the app's. That's rare, and it's why I keep using it."

### Sara: verdict
The trust architecture (source labels, the pre-2023 label, credit, a report link) is the app's strongest asset for Sara. It needs the last step (dates, pages, links, consistent label text). Keyboard paths mostly work. The double-press skip and the scrubber's arrow direction are the real defects.

---

## 5. The open questions, as the personas experience them

| ID | Ahmad | Maryam | Sara | Recommendation |
|---|---|---|---|---|
| **UX-OQ-01** Back during a mock: end it, or open the leave dialog? | Android back is right under his thumb, and he uses it to close sheets. Ending the attempt silently feels like his fault (A10). | An iOS edge swipe at 4:00 would erase her best run (M5–M9). | Mouse or keyboard back is rarely accidental, but a dialog doesn't bother her. | **Back opens the leave dialog** (as the UX recommends). Also, **back first closes any open sheet or dialog** (hints, pause, leave, interruption); this is needed on Android whatever the outcome. If the spike shows the guard is unreliable: after at least one answer, treat back as "end and review" (save as ended early), or at least show a notice on `/fa/mock` (R-02). |
| **UX-OQ-02** "End and review what I have" in the leave dialog | Three buttons are more to read, but "keep what I did" is the kinder default when he's tired. | Yes: the ward calls her in after three answers, and she wants them. | Yes, it's efficient. | **Add it.** Order: Continue (default) · End and see my answers · **Leave without saving** (rename "Leave" so the difference is explicit). Add the same option to the practice pause overlay, which today offers only Continue · Leave (R-14). |
| **UX-OQ-04** Sample answers collapsed by default | One extra tap is OK if the label is clear. Risk: «بلند جواب بدهید» ("answer aloud") is read as "play the answer aloud" and opens a microphone sheet. | Wants to try first. Collapsed is right. | Fine. Might want an "open all" preference. | **Keep collapsed on the topic page** (UXD-04). After answering (answer-aloud compare, mock review), the "answer first" reason no longer applies: show a play button on the collapsed row, or expand when nothing was recorded (R-15). Add a short subtitle under "Answer aloud" ("you speak, then compare"). |
| **UX-OQ-05** A listen-only learner never starts a review cycle | He listens to the questions and samples at 0.75× and shadows, but "nothing counts". | Not affected (she answers aloud). | Not affected. | **Count shadowing a whole answer** as practised: it is speaking aloud, not passive listening (shadowing.md says it doesn't count). Keep the explicit "I studied this today" button for the interviews to decide. A practice mock without a microphone already counts. Good. |
| **UX-OQ-06** Examiner intro text hidden or shown by default (mock) | Hidden is scary, but the compact card already gives the gist. He'd like the Persian meaning of fixed examiner lines in practice. | Hidden. That's the real exam. | Hidden. | **Agree:** hidden by default in the mock, shown on the study page. In practice, "show text" could include the Persian meaning of the fixed examiner lines (R-27), and could stay open for the rest of a practice attempt once opened, while still resetting per unit in exam conditions (R-28). |
| **UX-OQ-27** Guide vs Progress as a tab | Guide. He rereads "what will happen" the night before. | Progress or history, three weeks out. | On her phone, Progress. On desktop both are in the top nav. | **Keep UXD-01,** but make sure history is reachable in one tap from the mock tab ("My past mock exams" on `/fa/mock`) and from Home's returning state (and fix R-06 so mock-only learners reach that state). Test which tab learners would drop. "Templates and phrases" may be the least understood label (R-30). |
| **UX-OQ-28** Self-check ticks in history without a score | Doesn't care; extra words are clutter. | "reason · example · opinion" reads as 3 of 7. | Same, and it's less useful than the total time. | **Don't show ticks in the history list.** Show mode, total time and, optionally, one **"focus next time"** item the learner picks at the end of the review ("give an example"). It looks forward, it isn't a score, and it supports H5 ("one thing to improve"), which no UI element currently captures. Needs a PM change to US-048 #1 (R-18). |
| **UX-OQ-29** Hide the question text in answer aloud | He reads the question and its translation on the page, then it vanishes in the panel and he forgets the second half of a long question. | Neutral. She wants listening practice in the mock, not here. | Pointless: she just read it, and it's visible behind the dialog at 1280. | **Show the text by default in answer aloud** (the page already shows it), and keep hidden-by-default for the mock, where the question hasn't been seen. If you keep it hidden, make the hiding real (full-screen at all widths). As specified, it has the cost and none of the benefit. |

---

## 6. Where the personas' needs conflict

| Tension | Ahmad | Maryam | Sara | Suggested resolution |
|---|---|---|---|---|
| The "not official" line | Lowers trust if it comes first | Neutral | Raises trust | Lead with what it is ("real questions from published exams, checked against SIRI where marked"), then "not made by SIRI (the exam authority)" (R-19) |
| Options before the mock | Wants none visible | Wants them fast | Wants control | A one-line summary of the defaults with "Change" (R-12) |
| Visible timers | Fine in practice (hideable) | May rush; a test candidate for hidden-by-default after the first run | Wants them visible | Keep visible by default (UXD-05), but test it with anxious learners. The grace notice must not lead with "Time is up" (R-09) |
| Examiner text | Wants it to stay open in practice | Hidden (realism) | Hidden | Practice stays open once opened; exam conditions reset per unit (R-28) |
| Repeats | Second repeat should help more | Identical replay is fine | Identical replay is faithful | Exam conditions identical; practice offers a slower replay on later repeats (R-13) |
| Keeping attempts | Doesn't record | Wants several attempts per topic to compare | Wants history facts | D-6 stands for v1; validate "latest per topic" with Maryam-type learners |
| Phone tab | Guide | Progress | Progress (phone) | Keep Guide, with history one tap from Mock and Home (UX-OQ-27) |
| Topic choice in exam conditions | – | Wants to redo a weak topic under real conditions | Random is real | Keep US-040 #3. Practice with `?topic=` and no hints is the workaround; consider telling learners so |

---

## 7. Prioritised recommendations

**P0: decide or fix before the mock is built.** These are behaviours that can lose a learner's work or misrepresent the exam.

| # | Recommendation | Step and persona reaction | Spec to change | Owner |
|---|---|---|---|---|
| R-01 | **Keep the screen awake** during the mock runner and answer aloud (Screen Wake Lock, within the ADR-0014 floor). Release it on end or leave. If it's unavailable, add a one-line "keep your screen on" tip at get ready. Add a scenario "screen auto-locks during an answer" to §17. | A10 "the screen went dark; did I do something wrong?"; M5 (80-s answer) | state machine §9 (new row: wake lock), §12.1, §17; mock-get-ready.md; ADR-0007 §3 | software-architect, ux-architect |
| R-02 | **Back:** adopt UX-OQ-01. Back first closes any open sheet or dialog (hints, pause, leave, interruption, mic help). If the guard can't be made reliable: after at least one answer, back saves the attempt as ended early and opens the review; otherwise `/fa/mock` shows "Your mock exam ended when you went back. Nothing was saved." | A10 "everything is gone; what happened?"; M9 (edge swipe at 4:00) | state machine §7.6, §12.4; mock-start.md States ("After leaving: no message"); component inventory §6 HintsSheet, LeaveDialog, PauseOverlay; US-038 #5 | product-manager, software-architect |
| R-03 | **Calls during an answer:** a system mute of the microphone track (as opposed to `ended`) should be treated as a possible interruption (freeze, dialog), not as `MIC_LOST`. Never set the microphone to unavailable for the rest of the attempt; re-acquire it silently at the next answer. Add "incoming call banner while answering" to the OQ-9 spike. | M6 "my general-question answer says 'Not recorded'" (hypothesis) | state machine §7.3 (`MIC_LOST` row), §12.1; ADR-0007 §3 (mute → event mapping) | software-architect, ux-architect |
| R-04 | **Answer aloud, Phase 3:** don't turn the Done slot into "Next question". Move focus to "Play your answer"; "Next question" is a separate button. | S5 "I pressed Space twice and never heard my answer" | answer-aloud.md Phase 3 and Accessibility; UXD-08 note | ux-architect |
| R-05 | **No disclosure inside a list-item link:** the Pre2023Badge is plain text in TopicListItem; its explanation lives on the term heading, an era divider, the topic page and the reveal. | S2 "Tab only lands on the whole row" | topic-library.md TopicListItem and Accessibility; component inventory §2 Pre2023Badge, §3 TopicListItem | ux-architect, accessibility-auditor |

**P1: fold into the specs before `ui-designer` starts.**

| # | Recommendation | Step and persona reaction | Spec to change | Owner |
|---|---|---|---|---|
| R-06 | Home's returning state starts on **any** stored progress (topic opened, topic practised, attempt saved); "Continue" can point to the last mock. | A13 "it doesn't remember me" | home.md Content hierarchy (returning state) | ux-architect |
| R-07 | Exam-conditions rules say what a call or screen lock does ("the exam stops and waits; it's marked interrupted, not failed"). Get ready adds a "turn on Do Not Disturb" tip. | M1 "what if the ward calls?"; M2 | mock-start.md item 3; mock-get-ready.md item 2; `mock.mode.exam.rules` | ux-architect |
| R-08 | Interruption dialog: give a reason ("the screen turned off or another app opened"), "The clock stopped at {m:ss} and continues from there", and "Start again (this attempt won't be kept)". | A10, M7 "did the clock stop? do I lose my first answer?" | mock-interview.md Dialogs and Copy (`mock.interrupt.*`) | ux-architect, persian-localization-reviewer |
| R-09 | Grace notice: lead with permission, not the deadline. Draft «می‌توانید جمله‌تان را تمام کنید. بعد ممتحن آزمون را تمام می‌کند.» Test showing nothing when timers are hidden. | M9 "Time is up, I lost my sentence" | mock-interview.md (`mock.grace`); state machine R7, §15 | ux-architect, learner testing |
| R-10 | **Ask `pd3-exam-expert`:** is the second required question always asked in the real exam? If so, add an examiner-like rule (skip the remaining part-1 follow-ups once the clock passes a threshold) so U2 is always asked. | M9 (a long part 1 means the general question is never asked) | state machine §10 (R1), §17; UX-OQ-12 | pd3-exam-expert, ux-architect |
| R-11 | Sound check: ask about volume, not understanding ("Is the sound loud enough?" · "Yes, I can hear it" · "No sound"). Show the sample's Danish text and Persian meaning as a preview ("you'll hear this before the general question"). | A4 "I didn't understand the test sentence" | mock-get-ready.md item 4 and Copy (`mock.ready.sound.*`); UXD-28 | ux-architect |
| R-12 | Practice get ready: collapse the topic, situation and pacing options into one summary line with "Change". Move "always show the examiner's text" to settings, and show its state as a status line in exam-conditions get ready. | A4 "too many choices"; M2 | mock-get-ready.md items 3, 6 and Wireframe; settings.md | ux-architect |
| R-13 | RepeatControl: a visible action label (draft «درخواست تکرار سؤال»), a first-time hint "Say it aloud, then tap". Practice only: on the second and later repeats, offer "hear it slower". | A9 "is this a button?", "same words, same speed" | mock-interview.md Answer area; component inventory §6 RepeatControl; state machine §11; US-032 | ux-architect, product-manager |
| R-14 | Practice: hide "Record again" when not recording; pause the answer timer while the hints sheet is open; add "End and review what I have" to the pause overlay. | A8, A9 "0:51 and I haven't said a word" | mock-interview.md Answer area and Dialogs; state machine §8 (answer timer), §7.5 | ux-architect |
| R-15 | Review when not recorded: its own first-time note ("Listen to the sample and think about what you said…"), a play button on collapsed sample rows, and a line saying repeats are allowed in the real exam. | A12 "listen to my answer? I didn't record" | mock-review.md States, item 4; flows/mock-review.md step 3 | ux-architect |
| R-16 | Trust details: the VerificationNote discloses the checked date, the SIRI page and an external link; the booklet variant says "not yet checked word for word" (matching the About legend); the situation card gets a SourceLabel ("the booklet's description of the picture"). | S3 "checked when? which page?", S4 "checked or not?" | topic-study.md items 4.1, 4.3 and Copy (`labels.verification.*`); component inventory §2; about-and-privacy.md | ux-architect, content-engineer |
| R-17 | Pre-2023: one digit style for exam years (or phrase it as "before Maj–Juni 2023"); one era divider in the terms view; the explanation adds "in the mock this topic runs in today's format" and a source link. | S2 "2019 next to ۲۰۲۳", S4 | topic-library.md Terms view and `labels.pre2023`; US-009 #3 | ux-architect, persian-localization-reviewer |
| R-18 | History item: add the total time; replace ticks with an optional "focus next time" chosen at the end of the review. | S6, M12 "looks like 3 of 7" | progress.md item 4 and Open note; mock-review.md item 7; US-048 #1 | product-manager, ux-architect |
| R-19 | Home honesty line: say what it is first, then "not made by SIRI". Gloss SIRI in Persian at first use (it's also Apple's assistant), and gloss "delprøve 2". | A1 "not official, so is it fake? Siri like the iPhone?" | home.md items 2–3 and Copy; `labels.source.siri` | ux-architect, persian-localization-reviewer |
| R-20 | Guide: a Persian gloss next to every Danish word or phrase; inline play buttons (loaded on tap) for the three examiner lines and the repeat phrase; ship the examiner lines' audio with the mock (M2), not M3. | A2 "what is *overordnet*? I want to hear him" | exam-guide.md items 4, 7; PRD milestones (US-002) | ux-architect, product-manager |
| R-21 | Telegram's in-app browser: add it to the test matrix (microphone, storage separation, wake lock, back). Consider a gentle "open in your browser to keep your progress" note on progress views if it's detectable. | A1, A13 | first-visit.md Entry points; ADR-0014 test matrix | qa-engineer, software-architect |
| R-22 | Audio scrubber keyboard: the slider is `dir="ltr"`, so → seeks forward. Add an E2E check. | S5 "it goes backwards" | component inventory §4 AudioPlayer | ux-architect, accessibility-auditor |
| R-23 | Move the draw's first-time hint ("the letter you get is the real letter…") to the reveal. | A5 "what letter?" | mock-draw-and-look.md States (First-time) | ux-architect |

**P2: worth doing; lower risk.**

| # | Recommendation | Step | Spec |
|---|---|---|---|
| R-25 | A data note at the reveal: "about 1 MB, downloaded once". Drop "9 of 12". | A6 | mock-draw-and-look.md View 2 |
| R-26 | The look view fits about 560 px of visible height; the picture note becomes a compact line after the first few attempts. | A7, M4 | mock-draw-and-look.md View 3, Responsive |
| R-27 | Practice "show text" for fixed examiner lines includes their Persian meaning. | A7 | mock-interview.md Examiner panel; ShowTextToggle |
| R-28 | Show-text persistence: once opened, it stays open for the rest of a practice attempt; it resets per unit in exam conditions. | UX-OQ-06 | UXD-13; state machine §7.3 |
| R-29 | Keyboard shortcuts through long lists: term headings link to term pages, plus a term jump list; progress jump links at all widths. | S2, S6 | topic-library.md; progress.md Responsive |
| R-30 | Short phone tab labels that fit at 360 px; test whether "Templates" is understood. | A1 | IA §3.1 |
| R-31 | Settle where "My progress" sits in the top nav. | S1 | IA §3.2 |
| R-32 | Content translations: formal address and Dari-friendly wording («به نظرت», «خودت», «سرِ شلوغ», «دبیرستان نظری»). | A7, A9 | content files; `persian-localization-reviewer` |
| R-33 | One digit style for years across Home and term labels. | A1 | UX-OQ-09; home.md |
| R-34 | Apply the back guard to the review page while unkept recordings exist. | M11 | flows/mock-review.md step 6 |
| R-35 | Exam-conditions leave dialog: test whether examiner audio and a new answer phase running *underneath* the dialog confuses people. Consider not starting a new answer phase until the dialog closes (the clock still runs). | M (analyst) | state machine §7.6; mock-interview.md States |
| R-36 | At large text sizes, unpin the bottom answer area so it never covers the examiner panel. | A8 | mock-interview.md Responsive |
| R-37 | Total time says "time during the interruption isn't counted" when interrupted. | M10 | mock-interview.md End view; mock-review.md Facts |
| R-38 | Product question: a language-quality item in the self-check for learners aiming for a 10. | M11 | US-042; mock-review.md self-check items |


---

## 8. Validate with 3–5 real learners

All of the above is hypothesis. Before visual design is finalised, run **3–5 short sessions** with real learners on a clickable prototype (or paper versions of these wireframes), recruited as in personas.md: at least one Afghan/Dari speaker, one older Android phone, one iPhone, one nurse who needs a 10, and one person who has already sat the oral. Ask them to **open the link from Telegram, as they normally would**, and to use their own phone with its normal settings (auto-lock and text size).

**Tasks:** read the home page and say what the app is; find out from the guide what happens after the 10 seconds; do a practice mock without recording, asking for one repeat; do an exam-conditions mock and take a (staged) phone call in the middle; answer one question aloud on a laptop using only the keyboard; find your last mock exam.

**Questions to ask:**
1. *(Home)* What is this app? Who made it? Can you trust it? What does "not an official SIRI product" mean to you? What is SIRI?
2. *(Guide)* What happens after the 10 seconds? Which Danish words in the steps didn't you understand? Would you have pressed a play button to hear them?
3. *(Get ready)* What did each option on this screen mean? Which would you change? After hearing the test sound, which button would you press, and why?
4. *(Repeat)* How did you ask the examiner to repeat? Did you say the sentence out loud? What did you expect the second repeat to do?
5. *(Screen lock, back)* Did your screen turn off while you were speaking? Did you ever press back or swipe, and what did you expect to happen?
6. *(Interruption)* After the call, what did you think had happened to your answers and to the clock? Which of the three buttons did you choose, and why?
7. *(Limit)* When the message at 4:30 appeared, what did you do? How did it make you feel? Would you rather see nothing?
8. *(Timers)* Did you watch the clock while answering? Did it make you speak more or less? Would you hide it?
9. *(Review)* What did "Repeats asked: 2" make you think? Did you use the self-check? What one thing will you do differently next time?
10. *(History)* What does "reason · example" next to an attempt tell you? What would you rather see there?
11. *(Sources, for Sara-type learners)* What does "Wording checked against SIRI's examiner booklet" tell you? What does "as given in the booklet" tell you? What would make you believe it?
12. *(Pre-2023)* What do you understand from «پیش از تغییر قالب آزمون در ۲۰۲۳»? Would you still practise these topics?
13. *(Tabs)* If you could keep only four tabs, which one would you remove?
14. *(Dari speakers)* Show «پرستاری با بیماران زیاد و سرِ شلوغ» and «به نظرت چرا؟». Do these feel natural? What would you say instead?
15. *(Data and device)* Did you open the link inside Telegram? Did your progress still show the next time you opened it?
