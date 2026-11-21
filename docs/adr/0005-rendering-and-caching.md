# ADR-0005: Rendering and caching (Cache Components, static generation, client islands)

| | |
|---|---|
| **Status** | Accepted (2026-11-19). The route change in §4 needs `ux-architect`'s agreement. |
| **Deciders** | `software-architect` |
| **Related** | `.claude/rules/nextjs-react.md`, [information-architecture.md](../ux/information-architecture.md) §4, ADR-0002, ADR-0004, ADR-0007, ADR-0014 |

## Context

- Every page shows content that changes only when we publish. Nothing depends on who the learner is: progress lives on the device and is read in the browser.
- Next.js 16 offers two caching models: **Cache Components** (`cacheComponents: true`, `"use cache"`, Partial Prerendering by default) and the **previous model** (route segment configs). The 16.4 docs say Cache Components and Partial Prefetching "will be enabled everywhere in the next major release, and the options will be removed".
- New in 16.4: the **`ensureStatic`** route segment config. `ensureStatic = "navigation"` on the root layout makes `next dev` and `next build` fail if any route needs request-time rendering (uncached data, `cookies()`, `headers()`, server-side `searchParams`). It requires `cacheComponents`.
- With Cache Components, `dynamicParams` is not supported; params not returned by `generateStaticParams` render on request, and the page calls `notFound()` for unknown IDs.
- With Cache Components, Next keeps up to 3 recently visited routes mounted but hidden with React `<Activity>`. Effects are cleaned up when a route is hidden; state survives.
- The IA (§4) uses query parameters for filters (`?sub=`, `?q=`, `?topic=`, `?theme=`) and a path segment for attempt reviews (`/fa/mock/review/{attemptId}`).

## Options considered

| Option | Gain | Give up |
|---|---|---|
| **A. Cache Components + Partial Prefetching, and `ensureStatic = "navigation"` on the root layout** | The forward-looking model (default in the next major). The whole app is guaranteed static by the build itself, not by discipline. A future database source just adds `"use cache"`. | Newer model with stricter rules (no server-side `searchParams` in static routes; Activity keeps hidden routes' state, which interactive components must handle) |
| B. Previous model: `generateStaticParams` + `dynamicParams = false` | Familiar; unknown IDs 404 without rendering | A migration is due at the next major; nothing stops a page from silently becoming dynamic |
| C. Static export (`output: "export"`) | Any static host; no server at all | No proxy, no `headers()` in config, no `"use cache"` at runtime (docs: unsupported in static export), no route handlers. Speech-to-text tokens, accounts and a database would need a different deployment model later. See ADR-0010. |

## Decision

**Option A.**

### 1. Configuration

- `next.config.ts`: `cacheComponents: true`, `partialPrefetching: true` (must be set explicitly; leaving it unset logs a warning).
- `src/app/[locale]/layout.tsx`: `export const ensureStatic = "navigation"` and `generateStaticParams` over `routing.locales`.
- Every dynamic segment exports `generateStaticParams`:

| Route | Params from |
|---|---|
| `/[locale]` | `routing.locales` |
| `/[locale]/topics/[topicId]` | `listTopicIds()` |
| `/[locale]/topics/themes/[themeId]` | themes with ≥ 1 published topic (US-005 #5) |
| `/[locale]/topics/terms/[termId]` | terms with ≥ 1 published topic |
| `/[locale]/templates/[templateSlug]` | the three template slugs |
| `/[locale]/shadow/[contentId]` (M3) | published shadowable item IDs |
| `/[locale]/mock/review/[topicId]` (§4) | `listTopicIds()` |

- Unknown or unpublished IDs: the repository returns `null`, the page calls `notFound()`, and `not-found.tsx` renders the Persian page with HTTP 404 (US-011 #6). That render happens once on demand and is cached.
- Pages `await params` at the top (not inside `<Suspense>`). With `ensureStatic = "navigation"`, the docs say an ID that wasn't prerendered is generated in full before it's served (no fallback shell), which is what we want for a 404.

### 2. Data access

- The content repository's file source uses static JSON imports (ADR-0002), so no `"use cache"` is needed today. The database source will add `"use cache"` + `cacheLife("max")` + `cacheTag("content")`; `ensureStatic` will catch a forgotten one.
- **Nothing on the server reads cookies, headers or `searchParams`.** Request-specific state lives in the browser.

### 3. Query parameters are read in client components

`ensureStatic = "navigation"` forbids server-side `searchParams`; client hooks (`useSearchParams`) are allowed inside `<Suspense>`. So:

| Parameter | Handled by |
|---|---|
| `/fa/topics/search?q=` | a client search component over the search index passed as props (`getSearchIndex()`, budget in ADR-0014); Persian/Arabic letter and ZWNJ normalisation per US-008 runs in the browser |
| `/fa/topics/themes/{id}?sub=` | a client filter over the theme's topics (all rendered statically) |
| `/fa/mock/practice?topic=` / `?theme=` | the mock runner (client) reads them at set-up |
| `/fa/mock/review/{topicId}?attempt=` | the review page (§4) |

### 4. Route change proposed to `ux-architect`: the attempt review

- An attempt ID is generated on the device and exists only there. `/fa/mock/review/{attemptId}` can't be prerendered, and rendering it on the server per attempt would create a cached page per random ID for no benefit (and send device-local IDs to the server).
- **Proposal:** `/fa/mock/review/{topicId}?attempt={attemptId}`.
  - The path segment is the topic: the page is static per topic and server-renders the topic's questions, model answers and audio (so the mock deck doesn't need to carry model answers, §5).
  - The `attempt` query is read in the browser to overlay the attempt record from `ProgressStore` and, straight after an attempt, the in-memory recordings held by the mock section's client provider (ADR-0007).
  - A review link opened on another device shows the topic's model answers and a calm "this attempt isn't on this device" note.

### 5. Client islands (the only `"use client"` code)

| Island | Where | Notes |
|---|---|---|
| `AudioPlayerProvider` + clip controls | root layout; study, templates, guide phrases, review | one shared `<audio>` element (ADR-0007) |
| `ProgressProvider` | root layout | opens IndexedDB lazily, on first use (ADR-0008) |
| Translation / hint toggles, "show text" | study, mock | Base UI Collapsible (ADR-0009) |
| Answer aloud + recorder | study (M2) | recorder module lazy-loaded with `import()` |
| Mock exam runner | `/fa/mock/practice`, `/fa/mock/exam` | receives `getMockDeck()` as props: titles, situations (booklet titles, intros), questions, follow-ups, key words and translations for practice hints, audio refs. **No model answers** (they come with the review route). Budget ≤ 60 KB gzipped (ADR-0014). |
| Search, theme filter, progress views, settings | as above | read device data or query params |

The mock section has its own client layout provider (`src/app/[locale]/mock/layout.tsx` → `MockSessionProvider`) that holds the finished attempt's in-memory recordings across the client-side navigation to its review.

### 6. Activity (hidden routes keep their state)

- Transient UI (open dialogs, menus) resets in a `useLayoutEffect` cleanup, as the Next.js "Preserving UI state" guide shows.
- The mock runner and the answer-aloud recorder treat their layout-effect cleanup as **"navigated away"**: stop audio, stop and discard the recording, release the microphone, and reset the machine (ADR-0007, US-038 #5). A hidden route must never keep the microphone open.
- The shared player stops on route change (US-062 #6) by listening to pathname changes in the provider.

### 7. React Compiler: off in v1

| Option | Gain | Give up |
|---|---|---|
| Babel React Compiler (`reactCompiler: true` + `babel-plugin-react-compiler` 1.0.0) | Automatic memoisation | Slower dev and build (Babel pass); one more dependency; little benefit, since interactive code is a few small islands |
| Rust port (`experimental.turbopackRustReactCompiler`) | Fast | Experimental |
| **Off** | Simplest | Manual `useMemo`/`useCallback` where profiling shows a need (expected: none) |

Revisit when the Rust port is stable. The React Hooks lint rules shipped in `eslint-config-next` stay on either way.

### 8. Note (2026-11-20): the Persian 404 for unmatched URLs uses `experimental.globalNotFound`

The root layout is `[locale]/layout.tsx`, so a URL that matches no route (`/fa/unknown`, `/fa/a/b/c`, `/audio/missing.mp3`) never enters it, and Next rendered its built-in English 404 without `lang`/`dir`. Code review S3 compared two fixes:

| Option | Gain | Give up |
|---|---|---|
| **`experimental.globalNotFound: true` + `src/app/global-not-found.tsx`** (chosen, owner-approved) | Next returns the page directly, without rendering a route; nothing is cached per unknown URL | An experimental flag, against this ADR's preference for stable APIs |
| `[locale]/[...rest]/page.tsx` calling `notFound()` (next-intl's pattern) | Stable APIs | With `ensureStatic = "navigation"` it needs `generateStaticParams`, and every unknown URL is rendered on demand and **cached**, so bots probing random paths grow the cache without limit |

`global-not-found.tsx` renders its own `<html lang dir>` in the default locale, imports the global CSS and the shared fonts (`src/app/fonts.ts`), and passes the locale to next-intl explicitly (it never reads root params). `[locale]/not-found.tsx` still handles `notFound()` from pages (unknown topic IDs). An E2E test covers both the page and its axe scan.

**Removal trigger:** when `globalNotFound` becomes stable (the option is renamed or the flag is no longer needed) or is removed, or when a Next.js upgrade's release notes change its behaviour, move to the stable form in the same upgrade PR. If it's removed without a replacement, switch to the catch-all option and add a proxy rule that rejects paths that can't be routes before rendering.

## Consequences

- **Gain:** every page is prerendered HTML served from the CDN; the build fails if a change makes any route dynamic.
- **Gain:** moving content to a database later is cache-tag work, not a rendering rewrite.
- **Give up:** filters, search and attempt lookups happen in the browser. With 51 topics that's cheap, and the search index has a size budget.
- **Give up:** unknown IDs render once on demand instead of being rejected outright (`dynamicParams` is unavailable). If someone floods random IDs, the proxy can reject IDs that don't match `^\d{4}-(maj|nov)-[a-c]$` before rendering.
- `ux-architect` should confirm the review route change (§4).
