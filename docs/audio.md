# Audio: voices, settings, cost and how to regenerate

All Danish audio is pre-generated on a developer machine with Azure AI Speech, never on request and never in CI. The contract (format, file names, manifest, hosting) is [ADR-0006](adr/0006-audio-pipeline-and-hosting.md). Voices, SSML and the generation method are [ADR-0015](adr/0015-voices-ssml-and-generation.md) (**Proposed**: the voices wait for the owner's [listening test](audio/voice-samples.md)).

## Voices (proposed)

| Role | Voice | Why |
|---|---|---|
| Examiner (questions, follow-ups, intros, examiner lines, sound check) | `da-DK-JeppeNeural` (male, GA) | Stable, full SSML (`rate` for the slower repeat), $15/1M |
| Model (answers, follow-up answers, personal examples, key words) | `da-DK-ChristelNeural` (female, GA) | **One of only two `da-DK` voices that return word timings** (tested 2026-11-20), needed for highlighting |

**Changing a voice:**
- Edit `VOICES` in `scripts/audio/config.ts`, then run a dry run.
- Every clip for that role gets a new hash and is regenerated. Nothing else changes.

## Settings

| Setting | Value | Where |
|---|---|---|
| Output | MP3, 24 kHz, 48 kbit/s, mono, CBR (`Audio24Khz48KBitRateMonoMp3`) | `scripts/audio/config.ts` |
| Rate | Voice default. The study-page 0.75×/1.25× control uses `playbackRate` with `preservesPitch` | ADR-0006 §4 |
| Slower repeat (C20) | **Proposed:** pre-generated `-25%` clips for questions and follow-ups (not implemented yet) | ADR-0015 §5 |
| Sentence pauses | Voice default (about 0.85 s); `sentencePauseMs` is available but off | `SSML_SETTINGS` |
| Reading hints | Abbreviations (`fx`, `f.eks.`, `bl.a.`, `ca.`, `osv.`, `mv.`, `pga.`), `10 sekunder`, `PD3`, the en-dash pause, and *Hvorfor eller hvorfor ikke?* after an 800 ms pause. Conditional hints are off. | `scripts/audio/lib/lexicon.ts` |
| Word timings | Model answers, follow-up answers and personal examples, as `[charStart, charEnd, audioStartMs, audioEndMs]` against the **display** text | ADR-0006 §2 |

**The display text is never changed.** A reading hint only changes the SSML sent to Azure. The generator maps word offsets back to the text the learner sees.

## Cost (prices checked 2026-11-20)

**Prices:**
- **Source:** the Azure Retail Prices API, region swedencentral.
- **Standard neural:** **$15 per 1M** billable characters.
- **Neural HD:** $22 per 1M.
- **MAI-Voice:** not in the API; a third-party report gives $22 (2.1) and $15 (Flash), unverified.
- **F0 (free tier):** 0.5M neural characters per month, at 20 requests per 60 s.
- **Billed characters:** all SSML markup except `<speak>` and `<voice>`, so reading hints and `<break>` add a little.

**Dry run, 2026-11-21, proposed voices:**

| Scope | Items | Billable characters | S0 cost | F0 |
|---|---|---|---|---|
| Pilot: 3 topics + 4 shared lines (including the sound check), with key words | 77 | 9,092 | $0.14 | free, ≥ 4 min |
| Pilot without key words | 50 | 8,602 | $0.13 | free, ≥ 3 min |
| **All 51 topics, extrapolated from the pilot average, with key words** | **~1,245** | **~152,600** | **~$2.29** | **free**, ≥ 63 min |
| All 51 topics without key words | ~786 | ~144,300 | ~$2.16 | free, ≥ 40 min |
| Proposed C20 slow clips (ADR-0015 §5) | ~306 | ~47,000 | ~$0.71 | free |

**Cross-check:** the pilot report counts 124,752 booklet characters (1,078 items). Adding about 102 situation intros, 51 filled-in intro lines and the shared lines gives about 145,000 display characters. That is in line with the extrapolation, since the pilot topics are slightly longer than average.

**Listening set already spent:** 4,813 characters, about $0.07 at S0.

## How to regenerate

1. **Credentials:** put `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` in **`.env.local`** (never in `.env.example`, never committed).
2. **Dry run (no Azure call, no cost):**
   ```sh
   npm run audio:generate -- --dry-run
   npm run audio:generate -- --dry-run --extrapolate-topics 51
   ```
   It shows items, unique clips, cached and to-synthesize counts, billable characters and the cost on S0 and F0.
3. **Ask the owner** with the dry-run numbers (`.claude/rules/speech-audio.md`).
4. **Generate:** without `--yes`, the script refuses to call Azure.
   ```sh
   npm run audio:generate -- --yes                 # F0 pacing: 1 at a time, 18 requests/min
   npm run audio:generate -- --yes --tier s0       # S0: 4 in parallel
   npm run audio:generate -- --yes --only 2024-maj-b   # one topic (no pruning)
   ```
5. **Commit** `audio/manifest.json` and `audio/clips/*.mp3`. `content:build` copies the published clips into `public/audio/`.

**How the generator behaves:**
- **Idempotent:** a clip's name is a hash of the exact SSML, voice, format, settings, lexicon version and generator version. Unchanged items are never re-requested, and identical texts share one clip.
- **Resumable:** the manifest is written after every clip, and `.cache/audio/meta/<hash>.json` keeps each clip's timings. An interrupted run continues where it stopped without paying again. Failed clips are listed, and the exit code is 1.
- **Retries:** throttling, timeouts and 5xx errors are retried with exponential backoff and jitter (up to 6 attempts). Bad SSML, an unknown voice and auth errors fail at once.
- **Pruning:** after a complete, successful run, manifest entries for removed items and unreferenced clips are deleted.
- **Secrets:** the key is validated, never printed, and removed from any error text.

**Other commands:**
- `npm run audio:voices`: the current voice list for the region (free). Add `-- --locale fa-IR` for Persian.
- `npm run audio:samples`: the listening set in `.cache/audio/samples/`, capped at 5,000 characters in total.

**Tests** (`scripts/audio/**/*.test.ts`, `src/lib/audio/*.test.ts`) never call Azure. They use a fake synthesizer and word events recorded from Azure.
