# ADR-0006: Audio pipeline: format, content-hashed files, manifest with word timings, hosting and caching

| | |
|---|---|
| **Status** | Accepted (2026-11-19) for the contract (format, naming, manifest, hosting). Voice choice, SSML, lexicon and the generation method are for `speech-engineer`'s own ADR after the listening test. |
| **Deciders** | `software-architect`; `speech-engineer` implements |
| **Related** | `.claude/rules/speech-audio.md`, DL-005, schema proposal §10, ADR-0002 (read model joins audio), ADR-0007 (playback), ADR-0011 (headers), ADR-0014 (budgets) |

## Context

- All Danish audio is pre-generated with Azure AI Speech: an examiner voice and a different model-answer voice, with **word boundaries** for highlighting (US-016).
- Volume: about **1,078 booklet items, ~125,000 characters** across 51 topics, plus about 102 situation intros, 51 filled-in intro lines (`examiner.intro:<topicId>`) and the shared examiner lines. Roughly 135,000 characters in total.
- Rough size: at ~14 characters per second of speech that is about 2.7 hours of audio. At 48 kbit/s that's **about 55–65 MB**.
- Requirements: no audio downloaded until the learner presses play (except the mock exam preload, US-027); files cacheable forever; only changed items regenerated; the deployed app holds no Azure secret.
- Content items have permanent IDs (schema §10); identical Danish texts exist in 11 answer pairs (OQ-S2).
- Only **published** items should be reachable on the public site.

## Options considered

### Format

| Option | Gain | Give up |
|---|---|---|
| **A. MP3, mono, 24 kHz, 48 kbit/s** (Azure `Audio24Khz48KBitRateMonoMp3`) | Plays everywhere, including iOS Safari 16.4; constant bit rate gives accurate seeking for word highlighting; good speech quality | ~30–40 % larger than Opus at similar quality |
| B. Opus in WebM or Ogg | Smaller files | Safari support for Opus-in-WebM/Ogg playback is recent and uneven across the iOS versions we support (ADR-0014); would need a fallback format, doubling generation and storage |

### Hosting

| Option | Gain | Give up |
|---|---|---|
| **A. Same origin: generated clips committed under `audio/clips/`, copied at build into `public/audio/`, served by the host's CDN** | No CORS, no extra CSP origin, no second Azure resource, no upload credentials in CI; atomic with the app (a deployment can never reference missing audio) | ~60 MB in the private repo (more history on full regenerations); deployment size grows by the published subset |
| B. Azure Blob Storage, public container, no CDN | Pennies per month; keeps the repo small | CORS for the mock preload (`fetch`), an extra origin in `media-src`/`connect-src`, SAS credentials in the generation script, and deployments that can reference audio not yet uploaded |
| C. Azure Blob + Azure Front Door | Global CDN | Front Door Standard has a monthly base fee (tens of dollars), far more than this app needs |

## Decision

**MP3 24 kHz 48 kbit/s mono, same-origin hosting (option A), content-hashed file names, a committed manifest that never ships to the browser.**

### 1. Files and naming

```
audio/
  manifest.json           committed; written only by `audio:generate`
  clips/<hash>.mp3        committed; immutable
public/audio/<hash>.mp3   gitignored; `content:build` copies only clips referenced by published items
```

- `hash` = first 20 hex characters of SHA-256 over canonical JSON of `{ ssml, voice, outputFormat, ssmlSettings, lexiconVersion, generatorVersion }`, where `ssml` is the exact SSML sent (including `<sub alias>` substitutions).
  - Same input → same file, so unchanged items are never regenerated and identical texts share one file (answers OQ-S2: yes, shared by hash; each item keeps its own ID).
  - Any change (text, voice, rate, lexicon, script version) → a new name, so caches never serve stale audio.
- `audio:prune` deletes clips no manifest entry references (run by the generation script after a successful run).

### 2. Manifest (`audio/manifest.json`)

```ts
{
  manifestVersion: 1,
  generatorVersion: string,
  entries: {
    [itemId: string]: {            // "2024-maj-b.sitA.q1.answer", "examiner.intro:2024-maj-b", "examiner.thanks"
      hash: string;                // file name without extension
      voiceRole: "examiner" | "model";
      voice: string;               // Azure voice name, e.g. chosen in speech-engineer's ADR
      textSha256: string;          // SHA-256 of the DISPLAY text (text.da) at generation time
      durationMs: number;
      bytes: number;
      words?: Array<[charStart: number, charEnd: number, audioStartMs: number, audioEndMs: number]>;
    }
  }
}
```

- Word offsets index into the **display text** (`text.da`, UTF-16, the same unit as `TextRange` in ADR-0002), not into the SSML. Mapping SSML offsets back to display text (for `<sub alias>`) is the generator's job.
- `words` are stored for model answers, follow-up answers and personal examples (the highlighting scope of US-016). They're omitted for questions and examiner lines to keep the read model small.
- Validated with a Zod schema in `src/lib/audio/manifest-schema.ts` (shared by the script and `content:build`).

### 3. Joining audio to content (in `content:build`, ADR-0002)

- For each published item, look up its manifest entry and attach `{ url: AUDIO_BASE_URL + "/" + hash + ".mp3", durationMs, words? }` to the read model.
- **Stale or missing audio:** if `textSha256` doesn't match the current text, or the entry is missing:
  - `production` channel: the build **fails** (no published item without matching audio);
  - `preview` channel: a warning; the item renders text-only with the "audio not available" state.
- The full manifest is never imported by `src/` and never copied to `public/`, so unpublished item IDs, word timings and hashes don't leak.

### 4. Caching and delivery

- `next.config.ts` `headers()`: `/audio/:path*` → `Cache-Control: public, max-age=31536000, immutable`. File names change with content, so this is safe.
- Study pages use `<audio preload="none">` semantics through the shared player (ADR-0007). Nothing is fetched until play.
- The mock exam preloads its 12 clips (~1 MB) with `fetch()` into Blobs and plays them from object URLs (ADR-0007). Same origin, so CSP needs only `connect-src 'self'` and `media-src 'self' blob:`.
- Playback speed (0.75×/1×/1.25×) uses `playbackRate` with `preservesPitch = true` in the browser, not separate files.

### 5. Generation (`scripts/audio/`, owned by `speech-engineer`)

- Required behaviour is already in `.claude/rules/speech-audio.md`: concurrency limit, exponential backoff, resumable, `--dry-run` with character count and cost, never logs secrets, `AZURE_SPEECH_KEY`/`AZURE_SPEECH_REGION` from the local environment only (validated with Zod in `scripts/audio/env.ts`).
- Real-time SDK synthesis with `wordBoundary` events, or the batch synthesis REST API with word boundaries: `speech-engineer` decides and records it.
- Generation runs **on a developer machine**, never in CI or at deploy time. Its outputs (`audio/manifest.json`, `audio/clips/`) are committed. The deployment never needs an Azure key.
- `AUDIO_BASE_URL` (default `/audio`) is the only switch needed to move clips to Blob storage later (option B): upload `audio/clips/`, set the variable, add the origin to CSP.

### 6. Cost note (for the owner; `speech-engineer` confirms with a dry run)

- Azure's pricing page (checked 2026-11-19) lists **0.5 million characters free per month** for neural TTS on the free (F0) tier. ~135,000 characters for the whole set fits within one month's free allowance, if F0's rate limits are acceptable for a resumable run.
- The pay-as-you-go price per million characters wasn't shown on the page when checked; `speech-engineer` must confirm it before any paid run.
- Hosting the audio costs nothing extra under option A (it's part of the host's bandwidth, ADR-0010).

## Consequences

- **Gain:** one origin, no extra services, immutable caching, no secrets in deployments, and only approved audio on the public site.
- **Gain:** regenerating one corrected answer changes one file and one manifest entry.
- **Give up:** the private repo carries the clips (~60 MB now; a full regeneration with a new voice adds about the same again to history). If history size becomes a problem, move clips to Blob storage (option B) without code changes.
- **Give up:** MP3 is larger than Opus; at ~6 KB per second of speech, a 40-second model answer is ~240 KB, acceptable on 3G when fetched on demand.
- `content:build` is the gate between generated audio and published content; it must run before every `next build` (`prebuild`).
