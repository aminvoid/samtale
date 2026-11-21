# ADR-0004: i18n routing, typed messages, text direction, number and date formatting, fonts

| | |
|---|---|
| **Status** | Accepted (2026-11-19). The calendar choice (§5) needs owner confirmation. |
| **Deciders** | `software-architect` |
| **Related** | `.claude/rules/i18n-rtl.md`, CLAUDE.md rules 4–5, US-051 to US-053, US-056, D-2, [information-architecture.md](../ux/information-architecture.md) §4, ADR-0005, ADR-0009 |

## Context

- Persian (`fa`, RTL) is the only interface language in v1. Adding `en` later must be "a messages file and one locale entry, no other code change" (US-056).
- Routes are locale-prefixed (`/fa/...`); `/` redirects to `/fa` (IA §4.1).
- Danish content renders left to right inside the Persian interface, isolated, with `lang="da"` (US-052).
- D-2: Persian digits ۰–۹ in the interface, set in one config value.
- Every page is statically generated (ADR-0005), so i18n must not read request headers or cookies while rendering.
- Next.js 16 renamed `middleware.ts` to `proxy.ts`. Next.js 16.3 added `next/root-params`; next-intl uses it to resolve the locale without headers, which makes static rendering work without `setRequestLocale` (next-intl post "Next.js root params", 2026-08-04).

**Checked in Node 26 (ICU of the build machine):** `new Intl.NumberFormat("fa").format(51)` → `۵۱` (numbering system `arabext` is the CLDR default for `fa`). `Intl.DateTimeFormat("fa")` defaults to the **Persian (Solar Hijri) calendar**: 19 Nov 2026 → `۲۸ آبان ۱۴۰۵`; `fa-AF` uses Afghan month names (`۲۸ عقرب ۱۴۰۵`). Years format with a grouping separator by default (`۲٬۰۱۶`).

## Options considered

### Library

| Option | Gain | Give up |
|---|---|---|
| **A. next-intl 4.15.1** | RSC-native (`getTranslations` on the server, `useTranslations` in client leaves), ICU plurals and rich text, typed messages via `AppConfig`, locale proxy, `next/root-params` support for static rendering | One dependency (MIT, maintained, ~small client runtime) |
| B. Hand-rolled dictionaries (the pattern in Next's i18n guide) | No dependency | No ICU plurals, rich text, formatters or type augmentation; we'd rebuild them |
| C. react-i18next | Mature | Not RSC-native; more client JS; types need extra tooling |

### Locale resolution

| Option | Gain | Give up |
|---|---|---|
| **A. `proxy.ts` with next-intl's middleware + `next/root-params` in `i18n/request.ts`** | Standard next-intl setup; `/` and unprefixed links (`/topics/x`) redirect to `/fa/...`; ready for `en` negotiation | One proxy invocation per page request (not for static files) |
| B. No proxy; a `redirects()` rule for `/` only | Pure CDN, no invocation | Unprefixed deep links 404; locale negotiation must be added later |

## Decision

**next-intl 4.15.1 with `proxy.ts` and `next/root-params`.**

### 1. Routing

- `src/i18n/routing.ts`: `defineRouting({ locales: ["fa"], defaultLocale: "fa", localePrefix: "always", localeCookie: false })`. This is the **single list of locales**.
- `localeCookie: false`: with one locale there's nothing to remember, and the app then sets **no cookies at all**, which simplifies the privacy page (US-059). Revisit when `en` arrives.
- `src/proxy.ts`: `export default createMiddleware(routing)` with matcher `"/((?!api/|_next/|_vercel/|audio/|favicon\\.ico$|robots\\.txt$).*)"`. *Amended 2026-11-20 (code review S3):* public files are listed explicitly instead of skipping every dotted path, so unprefixed links to dotted content IDs (`/topics/2016-nov-c.sitA.q1`) are redirected too, and `/audiobook` isn't mistaken for `/audio/`. Add new public files (`sitemap.xml`, `manifest.webmanifest`) to the list. URLs that match no route render `src/app/global-not-found.tsx` (ADR-0005 note).
- `src/i18n/request.ts`: `getRequestConfig` reads the locale with `rootParams.locale()` when not given, validates it with `hasLocale`, and returns `messages`, `formats` (§5), and `timeZone: "Europe/Copenhagen"`.
- `src/i18n/navigation.ts`: `createNavigation(routing)` → `Link`, `redirect`, `usePathname`, `useRouter`. App code uses these, never `next/link` directly for internal links (lint rule).
- **Root layout is `src/app/[locale]/layout.tsx`** (there is no `src/app/layout.tsx`, which would otherwise become the root layout and break root params). It renders `<html lang={locale} dir={getDirection(locale)}>`, exports `generateStaticParams` over `routing.locales`, and wraps children in `NextIntlClientProvider` and Base UI's `DirectionProvider` with the same direction.

### 2. Direction from the locale

- `getDirection(locale)` in `src/i18n/config.ts`: `RTL_LANGUAGES.has(new Intl.Locale(locale).language) ? "rtl" : "ltr"`, with `RTL_LANGUAGES = {ar, ckb, dv, fa, he, ps, sd, ug, ur, yi}`. Adding `en` needs no change; `rtl` is never hard-coded elsewhere.
- Components that need direction (icons that mirror, the audio scrubber that must not) read it from context, not from the locale string.

### 3. Danish inside Persian

- Block-level Danish goes through `<DanishText>` (`src/components/ui/danish-text.tsx`), which sets `lang="da" dir="ltr"`. Persian content fields go through `<PersianText>` (`lang="fa"`).
- Danish inside an interface sentence is written in the message with a tag: `«سؤال اول معمولاً با <da>Hvorfor tror du, …?</da> تمام می‌شود.»` (*corrected 2026-11-20, Persian review: the first question usually **ends** with this phrase*), rendered with `t.rich(key, { da: (c) => <bdi lang="da">{c}</bdi>, ltr: (c) => <bdi dir="ltr">{c}</bdi> })`. Other Latin runs (`PD3`, `SIRI`) use `<ltr>`.
- A unit test (ADR-0012) fails if a `fa` message contains a Latin-script run outside `<da>`/`<ltr>` tags, except in an allow-list of keys that end up in plain-text contexts (`metadata.*`).

### 4. Typed messages

- `messages/fa.json` is the reference. `src/global.d.ts` augments next-intl's `AppConfig` with `Locale` (from `routing.locales`), `Messages` (`typeof fa`) and `Formats` (from `src/i18n/formats.ts`). A missing or misspelt key fails `tsc`.
- next-intl's `experimental.createMessagesDeclaration: "./messages/fa.json"` generates `messages/fa.d.json.ts` (gitignored) so ICU **arguments** are typed too; this needs `allowArbitraryExtensions` in `tsconfig`. If the experimental option breaks, remove it; only argument typing is lost.
- When `en.json` is added, a parity test (ADR-0012) fails CI if any key or ICU argument differs from `fa.json`. (US-056 #2 asks for "the type check fails". This test runs in the same CI job; making `tsc` itself compare files would need a generated file per locale, which isn't worth it. The main thread may want to tell `product-manager`.)
- Keys are grouped by feature (`topicLibrary.title`) in English camelCase; sentences are never concatenated.

### 5. Numbers, dates and durations: one formatting config

- `src/i18n/config.ts` holds the only knobs:
  - `NUMBERING_SYSTEM_OVERRIDES: Partial<Record<Locale, string>> = {}`. The default comes from CLDR (`fa` → `arabext`, i.e. ۰–۹, which is D-2). Switching to Latin digits is the one-line change `{ fa: "latn" }`.
  - `CALENDAR = "gregory"` (**proposed; owner and `persian-localization-reviewer` to confirm**). Without it, `fa` dates come out in the Solar Hijri calendar with Iranian month names, which Afghan (Dari) learners don't use (they use different month names) and which doesn't match exam terms (Maj–Juni, Nov–Dec) or life in Denmark.
  - `DATE_LOCALE: "fa" | "fa-AF" = "fa"` (*added 2026-11-20, Persian review*): whose Gregorian month names dates use, Iranian (`نوامبر`) or Afghan/Dari (`نومبر`); digits and calendar still come from the two knobs above. `dateLocaleFor(locale)` returns the Intl locale for dates; the date helpers in `src/lib/format/` must use it (next-intl's `format.dateTime` formats with the interface locale, so it can't apply `fa-AF`).
- `src/i18n/formats.ts` builds next-intl `Formats` from those knobs: `number.integer`, `number.year` (`useGrouping: false`, so 2016 isn't `۲٬۰۱۶`), `number.twoDigit`, `dateTime.date`, `dateTime.dayMonth` (all with `numberingSystem` and `calendar` set).
- Messages format numbers with named formats (`{count, number, integer}`), **not** the bare `#` in plurals, so the override reaches every number. The messages test rejects `#`.
- `src/lib/format/` has the few helpers that aren't a single `Intl` call, built on `Intl.NumberFormat` with the same numbering system: `formatClock(ms)` → `۴:۳۰` (minutes unpadded, seconds two digits; US-053 #1). `Intl.DurationFormat` was checked and pads minutes (`۰۴:۳۰`), so it isn't used for the clock. Timers render inside an element with `dir="ltr"`.
- Danish content keeps its own digits (D-2): content strings are never re-formatted.
- Server-rendered dates use `Europe/Copenhagen`. Progress dates are computed and formatted **on the device**, in local calendar days (US-047).

### 6. Fonts

- `next/font/google` (self-hosted at build time, so no request to Google at runtime and CSP `font-src 'self'` holds):
  - **Vazirmatn** variable, subsets `arabic` + `latin`, `display: "swap"`, CSS variable `--font-vazirmatn` (checked: available in Next 16.4.6's font data, weights 100–900, variable).
  - A Latin face for Danish with æ ø å, subsets `latin` + `latin-ext`, CSS variable `--font-danish`. **Placeholder: Noto Sans** until `ui-designer` chooses.
- `globals.css`: the interface font on `html`; `:lang(da) { font-family: var(--font-danish) }`.

### 7. Client messages

`NextIntlClientProvider` in the root layout inherits the server's messages and formats (next-intl 4 default). With one compact `fa.json` this is fine. If `fa.json` grows past ~30 KB gzipped, pass only the namespaces used by client components.

## Consequences

- **Gain:** adding `en` = add `"en"` to `routing.locales` + `messages/en.json` (the parity test guards completeness); direction, digits (CLDR `latn` for `en`) and routes follow automatically.
- **Gain:** pages stay fully static; no cookie is set.
- **Give up:** one proxy invocation per page request. If hosting cost ever matters, the proxy can be replaced by a single redirect while only `fa` exists.
- **Give up:** a small amount of discipline in messages (`<da>` tags, named number formats), enforced by a test.
- **New owner decision:** Gregorian vs Solar Hijri calendar for interface dates (§5). Recommendation: Gregorian, in Persian words and digits.
- Without a proxy (for example on a pure static host), `/` and unprefixed links would need a host-level redirect (ADR-0010).
