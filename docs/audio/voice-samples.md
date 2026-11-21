# Voice samples: listening test (2026-11-20)

The clips are on your machine only, in `.cache/audio/samples/` (gitignored). They contain booklet text, so **don't share or publish them** until the author's permission is confirmed.

**Easiest way to listen:** open [`.cache/audio/samples/index.html`](../../.cache/audio/samples/index.html) in a browser.
- It plays every clip below and highlights words where the voice returned timings.
- It has a browser-speed switch (0.75× / 1× / 1.25×, with `preservesPitch`), so you can compare the browser's slow-down with the SSML `rate` clips.

**Source text:** topic `2024-maj-b` (Mangel på arbejdskraft), situation A. Azure AI Speech, swedencentral, MP3 24 kHz 48 kbit/s mono. Generated with `npm run audio:samples`.

**Spent:** 4,813 of the 5,000-character sample budget, the ledger is in `.cache/audio/samples/usage.json`. That's about $0.07 at the S0 price, or nothing within the F0 free allowance.

## What to listen for
1. **Examiner voice:** calm, clear and neutral, like a real examiner at the table. Is the intro line easy to follow at normal speed?
2. **Model-answer voice:** natural, and clearly a *different person* from the examiner.
3. **Slow versions:** does the SSML `-25%` clip sound more natural than the normal clip played at 0.75× in the browser?
4. **Pronunciation:** "fx" should be read as "for eksempel"; listen to "social- og sundhedsassistenter" and "Hvorfor eller hvorfor ikke?".

**Note:** the intro clips were made before the "10 sekunder" → "ti sekunder" hint was added, so in them the voice reads the digits itself.

## Examiner candidates

| Voice | Type | Sound check | Intro line | Situation A intro | First question | Question, rate −25 % |
|---|---|---|---|---|---|---|
| **Jeppe** `da-DK-JeppeNeural` (male) | standard neural, GA | [2.7 s](../../.cache/audio/samples/soundcheck--JeppeNeural.mp3) | [12.4 s](../../.cache/audio/samples/intro--JeppeNeural.mp3) | [5.7 s](../../.cache/audio/samples/sitA-intro--JeppeNeural.mp3) | [9.2 s](../../.cache/audio/samples/q1--JeppeNeural.mp3) | [12.2 s](../../.cache/audio/samples/q1-slow--JeppeNeural.mp3) |
| **Christel** `da-DK-ChristelNeural` (female) | standard neural, GA | – | [12.1 s](../../.cache/audio/samples/intro--ChristelNeural.mp3) | [5.5 s](../../.cache/audio/samples/sitA-intro--ChristelNeural.mp3) | [9.3 s](../../.cache/audio/samples/q1--ChristelNeural.mp3) | [12.4 s](../../.cache/audio/samples/q1-slow--ChristelNeural.mp3) |
| **Grant MAI** `da-DK-Grant:MAI-Voice-2.1` (male) | MAI-Voice HD, **preview** | [1.9 s](../../.cache/audio/samples/soundcheck--Grant-MAI-Voice-2-1.mp3) | [13.7 s](../../.cache/audio/samples/intro--Grant-MAI-Voice-2-1.mp3) | [5.3 s](../../.cache/audio/samples/sitA-intro--Grant-MAI-Voice-2-1.mp3) | [8.3 s](../../.cache/audio/samples/q1--Grant-MAI-Voice-2-1.mp3) | [10.9 s](../../.cache/audio/samples/q1-slow--Grant-MAI-Voice-2-1.mp3) |
| **Harper MAI** `da-DK-Harper:MAI-Voice-2.1` (female) | MAI-Voice HD, **preview** | – | [13.0 s](../../.cache/audio/samples/intro--Harper-MAI-Voice-2-1.mp3) | [5.5 s](../../.cache/audio/samples/sitA-intro--Harper-MAI-Voice-2-1.mp3) | [8.5 s](../../.cache/audio/samples/q1--Harper-MAI-Voice-2-1.mp3) | – |
| **Christel Dragon** `da-DK-Christel:DragonLatestNeural` (female) | Dragon, **preview** | – | [11.7 s](../../.cache/audio/samples/intro--Christel-DragonLatestNeural.mp3) | [5.6 s](../../.cache/audio/samples/sitA-intro--Christel-DragonLatestNeural.mp3) | [8.1 s](../../.cache/audio/samples/q1--Christel-DragonLatestNeural.mp3) | – |
| Grant MAI Flash `da-DK-Grant:MAI-Voice-2.1-Flash` | MAI-Voice Flash, preview | – | – | – | [6.9 s](../../.cache/audio/samples/q1--Grant-MAI-Voice-2-1-Flash.mp3) | – |
| Harper MAI Flash `da-DK-Harper:MAI-Voice-2.1-Flash` | MAI-Voice Flash, preview | – | – | – | [8.8 s](../../.cache/audio/samples/q1--Harper-MAI-Voice-2-1-Flash.mp3) | – |

**Follow-up with the spoken variant:** an 800 ms pause, then *"Hvorfor eller hvorfor ikke?"*, in Jeppe: [10.7 s](../../.cache/audio/samples/why-followup--JeppeNeural.mp3) (`2024-maj-b.general.followup1`).

## Model-answer candidates

**Only the two standard voices returned word timings,** so only they can read model answers with word highlighting (US-016).

| Voice | Model answer | Model answer, rate −25 % |
|---|---|---|
| **Christel** `da-DK-ChristelNeural` (female) | [19.3 s](../../.cache/audio/samples/answer--ChristelNeural.mp3) | [25.7 s](../../.cache/audio/samples/answer-slow--ChristelNeural.mp3) |
| **Jeppe** `da-DK-JeppeNeural` (male) | [19.9 s](../../.cache/audio/samples/answer--JeppeNeural.mp3) | [26.5 s](../../.cache/audio/samples/answer-slow--JeppeNeural.mp3) |

## Recommendation
- **Examiner: Jeppe. Model answers: Christel.**
  - Both are generally available (GA), with full SSML, including `rate` for the slower repeat.
  - Both return word timings, and both cost $15 per million characters.
  - A male examiner and a female answer voice are easy to tell apart.
- **Alternative examiner: Grant (MAI-Voice-2.1), if you prefer how it sounds.**
  - It speaks a little faster: 8.3 s for the question, against 9.2 s for Jeppe.
  - Microsoft describes the MAI voices as more expressive. Whether that sounds better for an examiner is for your ear: I chose on technical criteria and haven't listened.
  - The catch: it's a **preview** with no SLA, so a later regeneration might sound different or fail. Its price isn't confirmed yet.
  - The examiner doesn't need word timings, so the missing timings aren't a problem.
- **The final choice is yours, by ear.** Record it in [ADR-0015](../adr/0015-voices-ssml-and-generation.md).
