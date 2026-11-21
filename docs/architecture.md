# Architecture overview (v1)

| | |
|---|---|
| **Status** | v1 architecture, 2026-11-19. Decisions are in [docs/adr/](adr/README.md); this page shows how they fit together. |
| **Author** | `software-architect` |
| **Inputs** | [CLAUDE.md](../CLAUDE.md), [PRD rev. 3.1](product/prd.md), [user stories](product/user-stories.md), [decision log](product/decision-log.md), [schema proposal](content/schema-proposal.md), [pipeline](content/pipeline.md), [pilot report](content/pilot-report.md), [information architecture](ux/information-architecture.md), [mock exam state machine](ux/flows/mock-exam-state-machine.md) |
| **Scaffolding** | [scaffold-plan.md](scaffold-plan.md) |

## 1. In one paragraph

A **statically generated Next.js 16 app** (Cache Components, every route prerendered and enforced with `ensureStatic`) served from a CDN. Content is authored as versioned JSON in a private repository, validated, and **projected at build time into a published read model** that contains only approved, public fields; the app reads it through an async repository. Danish audio is **pre-generated** with Azure AI Speech on a developer machine, stored with content-hashed names, and served from the same origin. Everything personal (progress, settings, kept recordings) stays **on the device** in IndexedDB behind async interfaces. Interactive parts (the audio player, recorder, mock exam runner, search, progress views) are small client islands. There is no server-side state, no account, no analytics and no secret in any deployment.

## 2. Context (C4 level 1)

```mermaid
flowchart LR
  learner(["Learner<br/>(Persian-speaking PD3 candidate,<br/>phone first)"])
  owner(["Owner and content team<br/>(owner + agents)"])

  subgraph sys["PD3 Mundtlig learning app"]
    app["Web app<br/>static pages + client islands"]
  end

  azure["Azure AI Speech<br/>(TTS, build time only)"]
  host["Hosting CDN<br/>(proposed: Vercel, ADR-0010)"]
  gh["GitHub<br/>(private repo, Actions CI)"]
  siri["SIRI / danskogproever.dk<br/>(external links only)"]
  channel["Report-a-problem channel<br/>(mailto or Telegram, D-9)"]

  learner -- "studies, listens, records,<br/>takes mock exams (HTTPS)" --> app
  app -- "served by" --- host
  owner -- "edits content, reviews,<br/>approves, generates audio" --> gh
  owner -- "runs audio:generate<br/>(local machine)" --> azure
  gh -- "builds and deploys main" --> host
  learner -. "opens links" .-> siri
  learner -. "user-initiated reports" .-> channel
```

**Nothing flows from the app to Azure, GitHub or any third party at runtime.** The learner's browser talks only to the host.

## 3. Containers (C4 level 2)

```mermaid
flowchart TB
  subgraph browser["Learner's browser"]
    pages["Static HTML + RSC payloads<br/>(prerendered per locale and ID)"]
    islands["Client islands<br/>player · recorder · mock runner · search · progress"]
    idb[("IndexedDB 'pd3-mundtlig'<br/>practice events · attempts · settings · kept recordings")]
    ss[("sessionStorage<br/>mock in-progress marker")]
    mem[("Memory<br/>session recordings, preloaded clip Blobs")]
    islands --- idb
    islands --- ss
    islands --- mem
  end

  subgraph cdn["Host (CDN + proxy)"]
    proxy["proxy.ts<br/>next-intl: / → /fa, unprefixed → /fa/…"]
    static["Prerendered pages, JS/CSS chunks,<br/>self-hosted fonts"]
    audioStatic["/audio/HASH.mp3<br/>published clips only, immutable"]
  end

  subgraph build["Build (CI and host build)"]
    validate["content:validate<br/>Zod + publishing gates + confidentiality"]
    cbuild["content:build<br/>allow-list projection → src/generated/content<br/>copy published clips → public/audio"]
    nextbuild["next build<br/>Cache Components, ensureStatic, typecheck"]
    leaks["check:leaks<br/>scan .next for internal text"]
    validate --> cbuild --> nextbuild --> leaks
  end

  subgraph repo["Private repository"]
    authoring[("content/<br/>topics · themes · terms · examiner lines<br/>topic-links · published-ids")]
    internal[("content/internal/ + review-ledger.json<br/>NEVER read by content:build")]
    audioRepo[("audio/manifest.json + audio/clips/")]
    messages[("messages/fa.json")]
    pipeline["scripts/content (extract, validate, build)<br/>scripts/audio (generate)"]
  end

  azure["Azure AI Speech"]

  pipeline -- "content:extract" --> authoring
  pipeline -- "content:extract" --> internal
  pipeline -- "audio:generate (local)" --> azure
  azure -- "MP3 + word boundaries" --> audioRepo
  authoring --> validate
  audioRepo --> cbuild
  messages --> nextbuild
  nextbuild --> static
  cbuild --> audioStatic
  pages -. "requests" .-> proxy --> static
  islands -. "play / preload" .-> audioStatic
```

## 4. Components inside the app (C4 level 3)

```mermaid
flowchart TB
  subgraph app["src/app/[locale] (routes: thin pages)"]
    rl["layout.tsx (root)<br/>html lang/dir · fonts · NextIntlClientProvider<br/>DirectionProvider · AudioPlayerProvider · ProgressProvider<br/>ensureStatic = 'navigation'"]
    rHome["page.tsx (home)"]
    rGuide["guide/…"]
    rTopics["topics/… · topics/[topicId]"]
    rTpl["templates/… · toolbox · vocabulary"]
    rMock["mock/ · mock/practice · mock/exam<br/>mock/review/[topicId]?attempt="]
    rProg["progress · settings · about · privacy"]
  end

  subgraph features["src/features (each exposes index.ts)"]
    fGuide["exam-guide"]
    fLib["topic-library<br/>(themes, terms, similar, client search)"]
    fStudy["study<br/>(sections, translations, key words,<br/>model answer, answer aloud)"]
    fTpl["templates · phrases"]
    fMock["mock-exam<br/>machine/ (pure) · runner/ (host)"]
    fProg["progress · settings"]
  end

  subgraph ui["src/components/ui"]
    prim["Base UI wrappers · Icon · DanishText · PersianText"]
  end

  subgraph lib["src/lib"]
    lContent["content<br/>repository (server-only) · schemas"]
    lAudio["audio<br/>player · preload · recorder (lazy) · manifest schema"]
    lProg["progress<br/>ProgressStore · IndexedDB · memory · derive"]
    lRec["recordings<br/>RecordingStore (device-only)"]
    lExam["exam/config"]
    lFmt["format (clock, dates, digits)"]
    lEnv["env · security · observability · storage · utils"]
  end

  i18n["src/i18n<br/>routing · request · config · formats"]
  gen[("src/generated/content<br/>(read model)")]

  app --> features
  app --> ui
  app --> lib
  features --> ui
  features --> lib
  features --> i18n
  ui --> lFmt
  lContent --> gen
  fMock --> lAudio
  fMock --> lProg
  fMock --> lRec
  fMock --> lExam
  fStudy --> lAudio
  fStudy --> lProg
  fLib --> lProg
  fProg --> lProg
  fProg --> lRec
```

## 5. Module map

| Module | Responsibility | Depends on | Must not | Owner | ADR |
|---|---|---|---|---|---|
| `src/app/[locale]/**` | Routes, `generateStaticParams`, metadata, error and not-found pages; compose features | features (via `index.ts`), ui, lib, i18n | contain business logic; read cookies, headers or server `searchParams` | frontend-developer | 0001, 0005 |
| `src/proxy.ts` | Locale redirects (next-intl) | i18n/routing | do anything else | frontend-developer | 0004 |
| `src/features/exam-guide` | Guide pages, examiner phrases, study method | content repo, audio player, ui | – | frontend-developer | – |
| `src/features/topic-library` | Themes, terms, similar questions, client-side search, practice badges | content repo, progress hooks | fetch content on the client | frontend-developer | 0005 |
| `src/features/study` | Topic study page sections, translations on request, key words, model answer with highlighting, answer aloud | content repo, audio, progress, recorder (lazy) | store recordings beyond the page (D-6) | frontend-developer | 0007 |
| `src/features/templates`, `phrases` | Templates, toolbox, vocabulary; "test myself" | content repo, audio | – | frontend-developer | – |
| `src/features/mock-exam/machine` | Pure reducer, script builder, deadlines, seeded draw | exam config, content types | touch DOM, media, storage or real time | frontend-developer | 0007 |
| `src/features/mock-exam/runner` | Executes commands through ports; platform signals → events | machine, audio, recorder, progress, recordings, storage | contain exam rules | frontend-developer, speech-engineer | 0007 |
| `src/features/progress`, `settings` | History, ready-to-review list, settings, delete everything | progress, recordings | know about IndexedDB | frontend-developer | 0008 |
| `src/components/ui` | Accessible, RTL-aware primitives; only importer of Base UI and lucide | Base UI, lucide, format, utils | contain business logic or hard-coded strings | frontend-developer, ui-designer | 0009 |
| `src/lib/content` | Read-model schemas; async repository; file source (server-only) | `src/generated/content` | be imported by client components (except types) | content-engineer (schema), frontend-developer (repository) | 0002 |
| `src/lib/audio` | Shared player, word highlighting, mock preload, recorder adapter, manifest schema | – | upload anything | speech-engineer | 0006, 0007 |
| `src/lib/progress` | `ProgressStore` interface, IndexedDB and memory implementations, migrations, derivations, review schedule | idb (browser folder only) | store recordings or personal data | frontend-developer | 0008 |
| `src/lib/recordings` | Device-only `RecordingStore` | idb | sync to any server | frontend-developer | 0008 |
| `src/lib/exam` | Exam config (C1–C16), examiner line IDs | – | hold Danish text (lines live in content) | frontend-developer, pd3-exam-expert reviews | 0007 |
| `src/lib/format` | Clock, durations, dates with the digit and calendar config | i18n/config | format by hand outside this module | frontend-developer | 0004 |
| `src/lib/env`, `security`, `observability`, `storage`, `utils` | Env schemas, header builder, `reportError`, guarded sessionStorage, `cn()` | zod | read secrets in client code | software-architect | 0010, 0011, 0013 |
| `src/i18n` | Locale list, request config, direction, formats | next-intl | hard-code `rtl` anywhere else | frontend-developer | 0004 |
| `messages/` | Interface strings (`fa.json` reference) | – | contain content translations | persian-localization-reviewer | 0004 |
| `content/` | Authoring data; `internal/` and the ledger are internal | – | be imported by `src/` | content-engineer | 0002, 0003 |
| `audio/` | Manifest + clips (committed) | – | be imported by `src/`; be copied wholesale to `public/` | speech-engineer | 0006 |
| `scripts/content` | Extract, validate, build read model, fidelity checks | `src/lib` pure modules | be imported by `src/` | content-engineer | 0003 |
| `scripts/audio` | TTS generation, dry run, prune | Azure Speech SDK | run in CI | speech-engineer | 0006 |
| `scripts/ci` | Leak scan, budget checks | – | – | software-architect, qa-engineer | 0002, 0014 |

## 6. Data flows

### 6.1 Browsing a topic

```mermaid
sequenceDiagram
  autonumber
  participant CE as content-engineer / owner
  participant Repo as content/ (private repo)
  participant Build as content:build + next build
  participant CDN as Host CDN
  participant P as proxy.ts
  participant B as Learner's browser

  Note over CE,Build: Build time
  CE->>Repo: extract, review, approve (ledger → topic review.status)
  Build->>Repo: read public authoring files + topic-links + audio manifest
  Build->>Build: validate · allow-list projection · confidentiality scan<br/>(production: approved topics only)
  Build->>Build: generateStaticParams(listTopicIds()) → prerender /fa/topics/{id}
  Build->>CDN: deploy static HTML, RSC payloads, chunks, published clips

  Note over B,CDN: Request time
  B->>P: GET /topics/2024-maj-b (shared link without locale)
  P-->>B: 307 → /fa/topics/2024-maj-b
  B->>CDN: GET /fa/topics/2024-maj-b
  CDN-->>B: prerendered HTML (lang=fa dir=rtl, Danish blocks lang=da dir=ltr)
  B->>B: hydrate islands, ProgressProvider opens IndexedDB lazily
  B->>B: show "practised N times" badge from derived events
  Note over B: No audio is downloaded until play (US-061 #2)
  B->>CDN: GET /fa/topics/9999-maj-z (unknown ID)
  CDN-->>B: 404 with the Persian not-found page (rendered once, then cached)
```

### 6.2 Playing audio with word highlighting

```mermaid
sequenceDiagram
  autonumber
  actor L as Learner
  participant C as Model answer component
  participant AP as AudioPlayerProvider (one audio element)
  participant CDN as /audio/HASH.mp3
  participant HL as useWordHighlight

  Note over C: Props from the read model:<br/>{ url, durationMs, words: [charStart, charEnd, startMs, endMs][] }
  L->>C: tap Play (user gesture)
  C->>AP: play({ id, url, words })
  AP->>AP: stop any other clip (GA-11)
  AP->>CDN: GET (first time only, immutable cache afterwards)
  CDN-->>AP: MP3 stream
  AP-->>C: status: loading → playing
  loop every animation frame while playing
    HL->>AP: read currentTime
    HL->>HL: binary search words → current index
    HL-->>C: highlight word (underline + colour, no focus move, no announcement)
  end
  L->>C: choose 0.75×
  C->>AP: setRate(0.75) (preservesPitch) → saved in settings
  L->>C: pause → highlight stays on the current word
  AP-->>C: ended → highlight clears
  Note over AP: Load error → status error → "retry", the text stays (US-062)
```

### 6.3 Running a mock exam (exam conditions)

```mermaid
sequenceDiagram
  autonumber
  actor L as Learner
  participant R as Runner host (use-mock-exam)
  participant M as Machine (pure transition)
  participant AP as Shared player
  participant Rec as Recorder (lazy)
  participant PS as ProgressStore
  participant SS as sessionStorage

  Note over R: Page props: getMockDeck() (prerendered)
  L->>R: Get ready: sound check, "Allow microphone" (tap)
  R->>Rec: acquire() after the Persian explanation
  Rec-->>R: MIC_GRANTED / MIC_DENIED (exam runs either way)
  L->>R: tap a face-down card
  R->>M: CARD_TAPPED{at, index}
  M-->>R: state reveal.loading, commands [preload(12 clips)]
  R->>AP: preload → Blobs → object URLs
  AP-->>R: ASSETS_LOADED
  L->>R: START (tap = iOS unlock)
  R->>M: START{at}
  M-->>R: commands [setInProgressMarker, playClip(examiner.intro:topic)]
  R->>SS: marker {attemptId, mode, topicId, startedAt}
  R->>AP: play() inside the tap
  AP-->>R: CLIP_ENDED → look 10 s (deadline) → TICK → LOOK_ENDED
  M-->>R: playClip(sitX.intro) — exam clock starts at its CLIP_STARTED
  M-->>R: playClip(sitX.q1) → then startRecording
  L->>R: Done
  R->>M: DONE{at}
  M-->>R: [stopRecording, playClip(examiner.thanks), …next unit]
  Note over M: At 270 s: no new unit starts, an answer in progress<br/>ends at Done or after the 20 s grace (UX §10)
  M-->>R: [stopRecording, releaseMic, playClip(examiner.closing)]
  M-->>R: [persistAttempt(record), clearInProgressMarker]
  R->>PS: saveAttempt + recordPractice (once, I8)
  R-->>L: end view → /fa/mock/review/{topicId}?attempt={id}
  Note over R: App hidden → APP_HIDDEN → hold.interrupted (timers frozen)<br/>Route change → NAVIGATED_AWAY → stop, discard, release mic
```

### 6.4 Saving progress

```mermaid
sequenceDiagram
  autonumber
  participant F as Feature (answer aloud, mock runner, review, settings)
  participant H as Progress hooks / ProgressProvider
  participant S as ProgressStore (interface)
  participant IDB as IndexedDBProgressStore
  participant MEM as MemoryProgressStore
  participant RS as RecordingStore (device-only)

  F->>H: recordPractice({ topicId, kind, at })
  H->>S: recordPractice(event with id, v, localDate)
  alt IndexedDB available
    S->>IDB: open lazily (upgrade steps if the version changed)
    IDB->>IDB: Zod-validate, put in practiceEvents
    IDB-->>S: { ok: true }
  else unavailable, blocked or quota
    S->>MEM: keep in memory for this session
    MEM-->>S: { ok: false, reason }
    S-->>H: report once: "progress can't be saved in this browser"
  end
  S-->>H: notify subscribers
  H->>H: derive topicProgress / dueReviews (days 3, 7, 14, D-22)
  F->>H: review: "keep on this device"
  H->>RS: putAttemptRecordings (replaces the older kept attempt for this topic)
  H->>S: setAttemptKept(attemptId, true)
  H->>H: navigator.storage.persist() (only now)
  Note over S: Read path: records parsed per version, migrated in memory,<br/>invalid ones skipped (US-046 #4). Delete everything → clearAll() + RS.deleteAll()
  Note over S: Later: ServerProgressStore implements the same interface,<br/>local events upload by ID on first sign-in, recordings never leave the device
```

## 7. Cross-cutting rules (where they're enforced)

| Rule | Enforced by |
|---|---|
| Content only through `src/lib/content` | lint (`no-restricted-imports`), ADR-0001/0002 |
| Internal content never in a build | `content:build` reads no internal files; allow-list projection; confidentiality scan; `check:leaks` in CI |
| Only approved content in production | `CONTENT_RELEASE=production` gates in `content:build`; build guard on `VERCEL_ENV` |
| Every page static | `ensureStatic = "navigation"` (build fails otherwise) |
| No hard-coded strings; Danish isolated | `react/jsx-no-literals`, attribute rule, messages tests, E2E Latin-name check |
| Logical CSS only, tokens only | `better-tailwindcss` rules |
| One clip at a time; no autoplay | single shared `<audio>`; E2E |
| Recordings never uploaded | no upload code path; E2E network assertion |
| Secrets never in the browser | no secrets deployed at all; env schemas; lint ban on the Speech SDK in `src/` |

## 8. Readiness for tomorrow

| Future change | Where it lands | Cost |
|---|---|---|
| **Database for content** | `db-source.ts` behind the same repository + `content:publish` + `"use cache"`/`cacheTag` | adapter + script; pages unchanged (ADR-0002 §6) |
| **Accounts** | `ServerProgressStore` + auth route handlers; local events upload by ID | new store; features unchanged (ADR-0008 §6) |
| **More interface languages** | `routing.locales` + `messages/en.json` | data only; direction, digits and routes follow (ADR-0004) |
| **Delprøve 1** | `buildDelproeve1Script` + mode policy; `/fa/guide/delproeve-1`, `/fa/delproeve-1/…`; attempts already carry `part` | new script and pages; reuses timer, recorder, review (ADR-0007, IA §8) |
| **Speech-to-text** | `/api/speech/token` route handler issuing short-lived tokens; client SDK in a lazy island | first dynamic route; keys server-only (ADR-0010) |
| **Moving hosts** | static output + same-origin audio; headers in one module | deployment change (ADR-0010) |
