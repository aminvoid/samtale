# ADR-0007: The mock exam state machine, the shared audio player and recording

| | |
|---|---|
| **Status** | Accepted (2026-11-19). The microphone strategy on iOS (§5) is settled by the OQ-9 spike. |
| **Deciders** | `software-architect`; `speech-engineer` and `frontend-developer` implement |
| **Related** | CLAUDE.md rules 7, 9, 10; [mock-exam-state-machine.md](../ux/flows/mock-exam-state-machine.md) (**source of truth for behaviour**); `.claude/rules/speech-audio.md`; US-019, US-026 to US-045, US-062, US-063; D-1, D-6; ADR-0005, ADR-0006, ADR-0008 |

## Context

- `ux-architect`'s state-machine spec defines the behaviour: states, events, transitions, timers, holds, the 270 s limit with a 20 s grace period, interruptions, persistence, invariants I1–I13 and test scenarios. This ADR decides **how it's built**, and must keep every rule, invariant and scenario of that spec.
- CLAUDE.md rule 9: a pure reducer with typed events; time and randomness injected; unit-tested without React.
- Constraints from browsers:
  - iOS Safari starts audio only from a user gesture; there's no autoplay.
  - While the microphone is open, iOS may route playback to the earpiece or lower its volume (PRD R3, OQ-9).
  - `MediaRecorder` formats differ: Safari records `audio/mp4`, Chromium and Firefox `audio/webm;codecs=opus`.
  - Only one clip may play at a time (GA-11).
- Delprøve 1 comes later and should reuse the timer, recorder and review.

## Options considered

### State machine

| Option | Gain | Give up |
|---|---|---|
| **A. Hand-written reducer: `transition(state, event) → { state, commands }`, commands as data** | Pure and fully deterministic; matches rule 9 literally; no dependency; every test is "events in, state and commands out" | We write the state plumbing ourselves (deadlines, holds) |
| B. XState v5 | Statecharts, delayed transitions, visual tooling | A dependency and a framework vocabulary for a mostly linear sequence; side effects live inside the library's actor model, which is harder to test as plain data |
| C. `useReducer` with effects inside components | Least code at first | Side effects and timers spread through components; untestable without React |

### Audio output

| Option | Gain | Give up |
|---|---|---|
| **A. One shared `HTMLAudioElement` for the whole app, created once in a root-layout provider** | One element to "unlock" on iOS with the first tap; one-clip-at-a-time is structural; `playbackRate` + `preservesPitch` built in | Sample-accurate timing isn't available (not needed) |
| B. Web Audio API (`AudioContext` + decoded buffers) | Precise scheduling | Decoding memory; more code; the same iOS audio-session issues with the microphone |

## Decision

**Machine option A; audio option A.**

### 1. Module layout

```
src/lib/exam/config.ts                 exam config (DL-039): C1–C16 of the UX spec, examiner line IDs; Zod-validated
src/features/mock-exam/machine/
  types.ts                             State (discriminated union), Event, Command, Context
  script.ts                            buildDelproeve2Script(topic, situationKey) → Unit[] (UX §4)
  transition.ts                        transition(state, event) → { state, commands }   (pure)
  deadlines.ts                         nextDeadline(state) → number | null              (pure)
  random.ts                            seeded PRNG (mulberry32), draw and situation choice (pure)
  *.test.ts                            unit tests + property tests for I1–I13
src/features/mock-exam/runner/
  use-mock-exam.ts                     host: dispatch loop, command executor, TICK scheduling, platform listeners
  ports.ts                             AudioPort, RecorderPort, ProgressPort, MarkerPort, AnnouncePort, Clock
src/lib/audio/player/                  AudioPlayerProvider (shared element), useClip, useWordHighlight
src/lib/audio/preload.ts               fetch → Blob → object URL, with progress and abort
src/lib/audio/recorder/                MediaRecorder adapter (dynamically imported on first use)
```

### 2. The pure core

- **State** is a discriminated union mirroring UX §5 (`prepare.*`, `run.*`, `hold.*`, `finished`, `left`), plus context: mode, attempt ID, topic, situation, script and cursor, deadlines and frozen remainders, per-question facts, mic state, `limitReached`, `interrupted`.
- **Every event carries `at`** (milliseconds from the injected clock). There is no hidden time.
- **Randomness:** the initial state receives a `seed`; the PRNG state lives in the machine's context, so `CARD_TAPPED` and the situation choice are pure and replayable. The host seeds from `crypto.getRandomValues`; tests use fixed seeds.
- **Draw (US-028):** one complete published term at random, its A/B/C in random card order; fallback to three different published topics if no term is complete (US-028 #5). Practice options (`chosen(topicId)`, `drawFromTheme`) are inputs at set-up.
- **Timers are deadlines,** never `setTimeout` inside the core. `nextDeadline(state)` tells the host when to send the next `TICK`; the machine derives `LOOK_ENDED`, `LIMIT_REACHED`, `GRACE_EXPIRED`, `RECORDING_CAP_REACHED` etc. from `at` (UX §6, §8).
- **Commands** (data, executed by the host): `playClip`, `stopAudio`, `preload`, `requestMic`, `startRecording`, `pauseRecording`, `resumeRecording`, `stopRecording`, `discardRecording`, `releaseMic`, `announce` (message key + params, never text), `persistAttempt`, `setInProgressMarker`, `clearInProgressMarker`, `navigate` (to review or `/fa/mock`).
- **Mode is a policy object,** not branches scattered through the code: `{ canPause, lookAdjustable, examLimitMs | null, graceMs, hints, reRecord, topicChoice, situationChoice }`. Both modes run the same script (I9).
- **Unknown events are ignored** (UX principle 5). Double taps are therefore harmless (I6).
- **Delprøve 1 later:** add `buildDelproeve1Script` and its policy (2-minute presentation that never cuts off, then questions). The attempt record already carries `part: 2`.

### 3. The host (`use-mock-exam.ts`, client)

- Holds the machine state with `useReducer` around `transition`, executes commands through **ports** after each transition, and schedules one `setTimeout` to `nextDeadline` (re-armed after every transition).
- Ports are plain TypeScript types implemented by `src/lib/audio/*`, `ProgressStore` (ADR-0008) and small helpers. They exist so component tests can run the real runner with fakes; there is no other abstraction.
- **Platform signals → events** (UX §12.1):
  - `visibilitychange` to hidden, and `pagehide` → `APP_HIDDEN`; back to visible → `APP_VISIBLE`.
  - The shared audio element pausing without our command (a call, Siri, an alarm) → `AUDIO_INTERRUPTED`.
  - `MediaStreamTrack` `ended`, or `mute` lasting over 1 s while visible → `MIC_LOST`.
  - `play()` rejected with `NotAllowedError` → `PLAYBACK_BLOCKED`.
  - The runner's `useLayoutEffect` cleanup (route change or the route being hidden by Activity, ADR-0005) → `NAVIGATED_AWAY`, executed synchronously: stop audio, stop and discard recording, release the microphone.
- **UX-OQ-01 (back opens the leave dialog):** technically possible with a sentinel history entry pushed inside the `START` tap (so it carries user activation; Chromium skips entries added without one) and a `popstate` listener that sends `LEAVE_REQUESTED` and re-pushes the sentinel. It interacts with the App Router's own `popstate` handling and with iOS edge-swipe gestures, so it **can't be promised** until it's verified on real iPhones and Android phones in the spike. Until then, US-038 #5 (back ends the attempt) stays. Recommendation to the owner: allow it if the spike shows it's reliable.
  - *Implementation note (2026-11-22):* the App Router re-renders synchronously inside its own `popstate` listener, which unmounts the runner, and Chromium runs a window's listeners in the order they were added (capture or not). A listener added by the runner therefore never ran, and Back reached the machine only as a route change. The runner now listens through `src/lib/navigation/history-back.ts`, whose single listener is registered from `src/instrumentation-client.ts` before the router's. This applies to both C19 settings.
- **Reload marker (UX §12.3):** `sessionStorage` key `pd3:mock:in-progress:v1` with `{ attemptId, mode, topicId, startedAt }`, through the guarded helper in `src/lib/storage/` (every access in `try/catch`; unavailable storage just skips the "couldn't be kept" view).

### 4. Shared audio player (`AudioPlayerProvider`, root layout)

- Creates **one** `HTMLAudioElement` on first use and keeps it for the app's lifetime. Exposes `play(clip)`, `pause()`, `seek()`, `setRate()`, and a store (`useSyncExternalStore`) with `{ clipId, status: idle | loading | playing | paused | ended | error, currentTimeMs, durationMs }`.
- Playing a clip stops the previous one (GA-11). Route changes stop playback (US-062 #6).
- Study pages: the element has `preload = "none"` until `play()`; a slow load shows the loading state; a second tap during loading doesn't start a second playback (US-062 #2); errors expose "retry".
- Speed: `playbackRate` 0.75 / 1 / 1.25 with `preservesPitch = true`; the chosen rate is stored in settings (ADR-0008).
- **Word highlighting (US-016):** a `requestAnimationFrame` loop runs only while playing, reads `currentTime`, binary-searches the clip's `words` tuples (ADR-0006) and updates one "current word" index. It never moves focus and never announces to screen readers; with `prefers-reduced-motion` there's no animated transition or smooth scrolling. The highlighted word also gets an underline, not only a colour (US-016 #4).
- **iOS unlock:** the mock's `START` handler calls `player.play(firstClip)` synchronously inside the tap. That unlocks the shared element, so later examiner clips play without further taps (US-027 #7). If a later `play()` is still refused, the machine goes to `hold.blocked` ("tap to hear").
- **Mock preload:** `preload(clipIds)` fetches the attempt's clips (12 per topic, about 1 MB) into Blobs with `AbortController`, reports progress, applies the 15 s slow notice through the machine (C6), and hands object URLs to the player. Object URLs are revoked when the attempt ends or is left.

### 5. Recording (`src/lib/audio/recorder/`, lazy-loaded)

- Loaded with `import()` the first time a learner chooses to record, so study pages don't carry it.
- **Format by feature detection,** first supported of: `audio/mp4;codecs=mp4a.40.2`, `audio/mp4`, `audio/webm;codecs=opus`, `audio/webm`. The chosen MIME type is stored with each recording.
- `getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })` is called **only after a tap**, after the Persian explanation (US-063 #1). Denial, no device, device in use and insecure context map to `MIC_DENIED`/`MIC_UNAVAILABLE` with a reason; denial is remembered in settings so the app shows guidance instead of asking again (US-063 #3).
- `start(timeslice = 1000)` so partial data survives an interruption; `pause()`/`resume()` for repeats (one recording per answer); `stop()` resolves `{ blob, mimeType, durationMs, parts }`. The cap (180 s, C5) is enforced by the machine's deadline.
- **Microphone strategy is a config flag, settled by the OQ-9 spike on real iPhones:**
  - `keep-open`: acquire once at get ready, release at closing. Fewer permission and latency risks; but iOS may lower or reroute examiner audio while the stream is open.
  - `per-answer`: acquire when answering starts, release when it ends, so examiner clips play with no active capture. Adds ~0.1–0.5 s per answer and must never re-prompt within an attempt.
  - The spike also tries `navigator.audioSession.type` (WebKit's Audio Session API) as a mitigation.
  - The machine is unaffected: it emits the same `startRecording`/`stopRecording`/`releaseMic` commands either way.
- Every stop path ends all tracks (the browser's microphone indicator turns off, US-035 #4) and revokes object URLs. Recordings are never sent anywhere (CLAUDE.md rule 10; QA checks network traffic, US-044 #3).

### 6. Where recordings live

- **Session-only by default (D-6):** answer blobs stay in memory in the mock section's `MockSessionProvider`, so they survive the client-side navigation to the review, and are dropped on leaving the review (with the warning in US-044 #2). Answer-aloud recordings on the study page stay in that component's state and are dropped on leave (US-019 #8).
- **Kept attempt (US-045):** "keep on this device" writes the blobs to the device-only `RecordingStore` (IndexedDB, ADR-0008), replacing any kept attempt for the same topic.

## Consequences

- **Gain:** the whole exam logic, including the 270 s limit, the grace period, holds and the draw, is tested as pure functions with fixed seeds and a fake clock; invariants I1–I13 become property tests (`fast-check` 4.10.3, MIT, dev-only).
- **Gain:** one audio element makes "one clip at a time" and the iOS unlock structural rather than a convention.
- **Give up:** a hand-written reducer for ~20 states is a few hundred lines we own. The UX spec is detailed enough to make that low-risk.
- **Give up:** the iOS microphone behaviour can't be fully decided on paper; the design isolates it behind one flag so the spike's answer doesn't ripple.
- The back-button behaviour (UX-OQ-01) stays as written in US-038 #5 until the spike proves the alternative reliable.
