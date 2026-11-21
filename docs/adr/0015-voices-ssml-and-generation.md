# ADR-0015: Voices, SSML and lexicon, generation method, and the slower repeat

| | |
|---|---|
| **Status** | **Accepted by owner delegation, provisional (2026-11-21).** Examiner: `da-DK-JeppeNeural`. Model answers: `da-DK-ChristelNeural`. These are the only da-DK voices that return word timings. Key words get audio. The owner may swap voices after the [listening test](../audio/voice-samples.md). Swapping only regenerates the clips. §5 (pre-generated SSML-rate clips for the C20 slower repeat) is accepted in principle, but `software-architect` must still update the ADR-0006 manifest contract. **No real generation run happens** until the owner has rotated the key, confirmed the pricing tier (F0 or S0) and approved a dry run. |
| **Deciders** | Owner (voices); `speech-engineer` (method, SSML); `software-architect` (§5 manifest change) |
| **Related** | ADR-0006 (audio contract), ADR-0007 (player), `.claude/rules/speech-audio.md`, [docs/audio.md](../audio.md), [Danish review](../reviews/2026-11-20-danish-review-pilot.md) (TTS hints), [exam review](../reviews/2026-11-20-exam-review-mock-rules.md) (#5, S2, suggestion 3), UX C13, C20 |

## Context

**Voices.** The Azure voice list for the resource's region (swedencentral, fetched 2026-11-20 with `npm run audio:voices`) has **7 native `da-DK` voices**:

| Voice | Gender | Type | Status | Styles | Word boundaries (tested) |
|---|---|---|---|---|---|
| `da-DK-ChristelNeural` | F | standard neural (48 kHz) | GA | – | **yes** |
| `da-DK-JeppeNeural` | M | standard neural (48 kHz) | GA | – | **yes** |
| `da-DK-Christel:DragonLatestNeural` | F | Dragon, multilingual, context-aware | Preview | – | no (0 events) |
| `da-DK-Harper:MAI-Voice-2.1` | F | NeuralHD (MAI) | Preview | agent, audiobook, customer_call_center, educational, narrator | no |
| `da-DK-Grant:MAI-Voice-2.1` | M | NeuralHD (MAI) | Preview | agent, customer_call_center, educational, narrator | no |
| `da-DK-Harper:MAI-Voice-2.1-Flash` | F | Neural (MAI Flash) | Preview | as above | no |
| `da-DK-Grant:MAI-Voice-2.1-Flash` | M | Neural (MAI Flash) | Preview | as above | no |

- About 200 multilingual voices from other locales also list `da-DK` as a secondary language. They weren't tested: a non-Danish persona risks a foreign accent, which is wrong for learners.
- `fa-IR` (only if Persian audio is ever needed): `fa-IR-DilaraNeural`, `fa-IR-FaridNeural` and `fa-IR-Dilara:DragonLatestNeural`.

**Word boundaries.** The SDK was set to request word and punctuation boundaries for every voice.
- Only the two standard voices returned events, with exact SSML offsets for all words (17/17 in the first question, 57/57 in the model answer).
- Dragon and MAI returned none.
- Highlighting (US-016) needs timings only for model answers, follow-up answers and personal examples (ADR-0006 §2). So **the model voice must be Christel or Jeppe; the examiner can be any voice.**

**`<sub alias>` breaks word offsets.** With `<sub alias="for eksempel">fx</sub>`, Christel's events after the `<sub>` came back with `textOffset -1`, and one event's text contained markup (`">fx sygeplejersker`).

**Billing** (Azure's billable-characters note) counts all SSML markup except `<speak>` and `<voice>`. So `<prosody>`, `<break>` and `<sub>` cost characters.

**Limits.**
- F0: 20 transactions per 60 s; batch synthesis not available.
- S0: 30 TPS.
- HD voices are real-time only and don't support `<prosody>`, `<mstts:silence>` or `<bookmark>`.

## Options considered

### Voices

| Option | Gain | Give up |
|---|---|---|
| **A. Examiner Jeppe, model Christel** (both standard, GA) | SLA; stable for later regenerations; full SSML; word timings; $15/1M; male/female contrast | Less expressive than the newest models (owner to judge by ear) |
| B. Examiner Christel, model Jeppe | Same technical properties | A female examiner (no exam reason either way) |
| C. Examiner Grant `MAI-Voice-2.1`, model Christel | Possibly more natural examiner | **Preview, no SLA**: a later regeneration of one corrected item may sound different or fail; price not in the Retail Prices API (third-party report: $22/1M, unverified) |
| D. A Dragon or MAI voice for model answers | – | **Not viable:** no word boundaries, so no highlighting |

### Generation method

| Option | Gain | Give up |
|---|---|---|
| **A. Real-time Speech SDK (`speakSsmlAsync`), one request per clip, word-boundary events** | Works on F0 and S0, for every voice type; events arrive with each clip; easy retry per clip | One request per clip (fine at ~1,250 clips) |
| B. Batch synthesis REST API | Fewer requests | Not available on F0; HD voices are real-time only; the job/poll/zip handling adds code |

### Abbreviations and reading hints

| Option | Gain | Give up |
|---|---|---|
| **A. Spoken form as plain SSML text, mapped back to the written form by our own offset table** | Correct offsets; fewer billed characters (`fx` +10 instead of +34) | Our code owns the mapping (unit-tested against recorded Azure events) |
| B. `<sub alias>` | Standard SSML | Breaks word offsets (see Context) |
| C. Hosted lexicon file (`<lexicon uri>`) | Text untouched | Needs a public URL; HD voices accept only alias entries |

## Decision (proposed)

### 1. Voices: option A
- `VOICES` in `scripts/audio/config.ts` holds the choice.
- Changing a voice changes every hash for that role, so only that role's clips are regenerated.

### 2. Method: option A
- Real-time SDK, MP3 24 kHz 48 kbit/s mono (ADR-0006).
- `durationMs` comes from the file length (constant bit rate, 6 bytes per ms). That's what browsers report; the SDK's value omits about 60 ms of MP3 padding.

### 3. SSML and lexicon (`scripts/audio/lib/lexicon.ts`)
- Every request is `<speak xml:lang="da-DK"><voice>…</voice></speak>`, with XML escaped. The display text is never changed.
- **Option A for every spoken substitution.** The rules applied:
  - **Abbreviations:** `fx`, `f.eks.`, `bl.a.`, `ca.`, `osv.`, `mv.`, `pga.`.
    - A capital at sentence start is kept ("Fx" → "For eksempel").
    - A sentence-final abbreviation keeps its full stop.
  - **Danish review, TTS hints:**
    - `10 sekunder` → "ti sekunder"
    - `PD3` → "pe de tre"
    - a spaced en dash → `<break time="250ms"/>`
  - **Exam review #5 / S2:** `Hvorfor?/Hvorfor ikke?` and the older `Hvorfor / hvorfor ikke?` → `<break time="800ms"/>` + "Hvorfor eller hvorfor ikke?" (no comma before *eller*).
    - This supersedes the Danish review's comma version.
    - Learners hear both alternatives, never only "Hvorfor?".
    - When content gains a reviewed `spoken` field (`origin: "app"`), the generator should read that instead of this rule.
- **Conditional hints from the Danish review are registered but switched off,** until the listening test shows the problem:
  - `social- og sundhedsassistenter`
  - `jord- og betonarbejdere`
  - `feedback` → "fiidbæk"
  - an IPA `<phoneme>` for `overordnet`

  The Christel and Jeppe events show a natural 150 ms pause at the hyphen in "social- og", which is the correct Danish reading of the ellipsis.
- **No extra sentence pauses.** The standard voices already leave about 0.85 s between sentences (850–875 ms between the last and first words in Jeppe's model-answer events). `sentencePauseMs` exists but is off; turning it on costs about 50 characters per item.
- **Hashing:** enabled rules are hashed into `LEXICON_VERSION`, which is part of every clip hash. Turning a rule on regenerates exactly the clips it affects.

### 4. Sound check (C13)
- `examiner.soundCheck`, *"Hej, og velkommen til prøven."* (Danish review), is generated with the examiner voice.
- The generator reads the line from `src/lib/exam/config.ts`, until `content-engineer` moves it into `content/examiner-lines.json`.

### 5. Slower repeat (C20): pre-generated SSML rate, not 0.75× time-stretching
- **Why:** the exam review (suggestion 3) asks for SSML-rate synthesis, because time-stretching distorts Danish prosody. The listening set lets the owner hear both: the `q1-slow` clips against `q1` played at 0.75× in `index.html`.
- **Proposal:**
  - Generate a second clip at `<prosody rate="-25%">` only for the clips C20 can replay: U1 and U2 questions and follow-ups. That's about 306 clips for 51 topics.
  - Store it in the manifest as an optional `slow: { hash, durationMs, bytes }` on those entries, with no word timings.
  - The player uses it for "hear it slower" and falls back to `playbackRate = 0.75` when it's missing.
- **Cost:** about 38,000 question characters plus about 9,000 characters of prosody markup, so about 47,000 billable characters. That's about $0.71 at S0, or within the F0 allowance.
- **Not implemented yet:** this changes the ADR-0006 manifest contract, so it needs `software-architect`'s agreement first. The general study-page speed control (0.75× / 1× / 1.25×) stays on `playbackRate`, as ADR-0006 §4 says.
- **For non-standard examiners:** `<prosody>` isn't supported on HD voices. The Grant MAI sample did come out 30 % longer at `-25%`, but that's undocumented. If option C wins, confirm `rate` on MAI first.

## Consequences

- **Gain:** a GA pair that's stable across regenerations, with word highlighting for every model answer. The whole 51-topic set costs about $2.30 at S0, or nothing on F0.
- **Gain:** reading hints are data (`RULES`) with tests. Fixing a mispronunciation is one rule and regenerates only the clips it affects.
- **Give up:** we own the SSML-to-display offset mapping. It's covered by tests built from events recorded from Azure.
- **Give up:** if the owner prefers a preview voice for the examiner, regenerations can drift. In that case, pin the clips and regenerate the examiner role in one batch.
- **Risk:** Azure may change a voice model under the same name. Clips already generated don't change, because hashes depend on inputs, not on the model.
