# Code review: Next.js scaffold (2026-11-20)

| | |
|---|---|
| **Reviewer** | `code-reviewer` (read-only) |
| **Scope** | `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.mts`, `playwright.config.ts`, `.npmrc`, `.github/`, `src/`, `messages/`, `e2e/`, `scripts/ci/`, `scripts/content/validate.ts`, `scripts/content/build-read-model.ts`, `scripts/audio/` (lightly). Also `.env.example`, because it sits next to the config and holds secrets. |
| **Against** | `CLAUDE.md`, `.claude/rules/`, `docs/scaffold-plan.md`, ADRs 0001, 0002, 0004, 0005, 0008, 0011, 0012, 0014 (plus 0010 for env) |
| **Gates run** | `npm run typecheck` pass · `npm run lint` pass (0 warnings) · `npm test` 29/29 pass (coverage thresholds met) · `npx prettier --check .` pass · `npm run build` pass (`/fa` static, `/[locale]` partial prerender, proxy present) · `npm run check:leaks` pass (13 canaries). I also ran `next start` and used curl to check routes and headers. To check the lint rules and the proposed 404 fix, I used throwaway copies in the session scratchpad. No project file other than this review was changed. |

## 1. Summary

The scaffold is careful work. Versions are pinned and the choices are documented. The env schema is pure and checked when `next.config` loads. The CSP and Permissions-Policy are built by a unit-tested pure function and match ADR-0011. Static rendering is enforced with `ensureStatic = "navigation"`. next-intl uses `proxy.ts` and `next/root-params`, so pages stay static without `setRequestLocale`. Digits and calendar are set by one knob (`NUMBERING_SYSTEM_OVERRIDES`, `CALENDAR`). A messages test guards bidi tags, `#`, and Arabic ي/ك. The boundary lint rules hold: I tried cross-feature imports (by alias and by relative path), `lib → features`, `ui → features`, imports of `content/` and `@/generated`, `next/link` and `lucide-react`, and each one was rejected.

**Key risks:**

1. **Real Azure Speech keys are in `.env.example`.** `.gitignore` explicitly un-ignores that file, so the first commit would publish them. This is the only Blocker.
2. **The leak scan can be bypassed in several ways** (escaping, partial text, `public/`, quoted IDs, silent skips). It isn't run on the build that actually deploys, and the production job can't fail. Nothing leaks today because `content:build` is a stub, but this gate has to be fixed before the real read model lands.
3. **404 and error handling:** unknown URLs show Next's English 404. Errors thrown in the root layout show Next's English global error. `error.tsx` uses `reset` instead of the Next 16.3 `retry`. I built and checked a fix (§2, S3).
4. **Smaller gaps:**
   - the lint rules miss some i18n-literal cases
   - `scripts/content/build-read-model.ts`, the future security allow-list, isn't type-checked
   - the font payload is about twice the ADR-0014 font budget
   - the "install scripts are skipped" premise is wrong: on npm 11.20 they still run

## 2. Findings

### Blocker

**B1. Live Azure Speech keys in a file that's meant to be committed**: `.env.example:11-18`
- **The issue:**
  - `AZURE_SPEECH_KEY`, `KEY1` and `KEY2` hold what look like real 84-character Azure AI Speech keys (values redacted here).
  - `Endpoint` and `Location-Region` are also set.
  - `.gitignore:16` has `!.env.example`, so `git add .` would commit them.
  - The file isn't in the `.claude/settings.json` read-deny list, so every agent and tool that reads the repo has already seen the keys. (I did too.)
- **Why it matters:**
  - CLAUDE.md rule 8 and ADR-0010 say the keys exist only on the machine that runs `audio:generate`.
  - A leaked Speech key lets anyone run up the bill on your Azure subscription.
  - The keys have to be treated as exposed even if nothing is committed.
- **Fix:**
  1. In the Azure portal, **regenerate both Key 1 and Key 2** for the Speech resource.
  2. Put the new key only in `.env.local`, which is already gitignored and on the deny list.
  3. Reset `.env.example` to placeholders:
     ```
     # Only for `npm run audio:generate` on your own machine. Never set these in CI or on the host.
     AZURE_SPEECH_KEY=
     AZURE_SPEECH_REGION=swedencentral
     ```
     Delete the `KEY1`, `KEY2`, `Location-Region` and `Endpoint` lines. `Location-Region` isn't even a valid environment variable name, and nothing reads any of them.
  4. Add a secret scan before the first push. Either:
     - enable GitHub push protection and secret scanning on the repo, or
     - add a `gitleaks` step to the `verify` job.
     Also consider a pre-commit hook.
  5. Optional: make `scripts/audio/env.ts` reject an empty key with a clear message. It already rejects placeholders.

### Should fix

**S1. The leak scan has several bypasses**: `scripts/ci/check-build-leaks.ts`

Today nothing can leak, because `build-read-model.ts` writes an empty read model and `src/` has no import path to `content/` (lint-verified). The scan is the last line of defence in ADR-0002 §5, though, and these gaps let internal text reach the build without failing it:

| # | Line | Gap | How it gets through |
|---|---|---|---|
| a | 61-62 | Only the raw string is matched | Build output escapes text. In `.rsc` and inline flight data, `"` becomes `\"`, newlines become `\n`, and `<` becomes `<` inside `<script>`. In HTML text, React escapes `'` to `&#x27;`, `"` to `&quot;` and `&` to `&amp;`, and puts `<!-- -->` between adjacent text nodes. Any note containing a quote, `&`, `<` or a line break is invisible to the scan. Ledger note 1 already contains `'…'` and backticks. |
| b | 42 | Whole strings only, and only those ≥ 16 characters | An excerpt, truncation or re-wrap of a note doesn't match. Short sensitive strings are never canaries; `confidentialityHits` such as `Skriftlig 2026` (14 characters) are exactly the confidential part. |
| c | 43 | Unapproved IDs are matched as `"2024-maj-a"` with the quotes | In inline flight data the ID appears as `\"2024-maj-a\"`, so the quoted form doesn't match. In links it appears as `/fa/topics/2024-maj-a`, with no quotes at all. Route files (`.next/server/app/fa/topics/2024-maj-a.html`) are matched by content, never by file name. Worse, the production check adds only the **ID** as a canary, not the unapproved topic's text. A production build that publishes an unapproved topic's full questions and model answers passes as long as the quoted ID isn't present. |
| d | 30-31 | One hard-coded file in `content/internal/`; a missing file returns `null` silently | A second internal file (for example `content/internal/topic-links-draft.json`) is never canaried. Renaming the file turns the scan into a silent no-op. |
| e | 36-37 | A topic that fails `topicReviewSchema` is skipped (`continue`) | A schema change, such as `review` moving or `schemaVersion: 1` reshaping it, silently drops that topic's notes and its unapproved status. The scan should fail closed. |
| f | 54 | Only `.next/` is scanned | `public/` is served as-is and never copied into `.next/`. `content:build` will write `public/audio/` (and a manifest with item IDs and texts if ADR-0006 puts word boundaries there). An unapproved topic's audio and manifest entries would ship unscanned. |
| g | 11, 47 | Extension allow-list, and any directory named `cache` is skipped at any depth | A future output type (`.xml.body` is covered, but `.svg`, `.css` and extensionless files aren't), or a route segment literally named `cache`, is skipped. |

- **Fix:**
  - **Fail closed:**
    - glob `content/internal/**/*.json`
    - throw if `content/internal/` or `content/review-ledger.json` is missing
    - throw on any topic that fails the review schema
    - print the number of canaries from each source
  - **Match decoded text, not raw bytes.** For each file, search a few normalised views:
    - the raw text
    - the text with JSON escapes decoded (`\"`, `\\`, `\n`, `\uXXXX`), applied twice to handle double-encoded flight data
    - the text with HTML entities decoded and `<!-- -->` removed
    - all of the above after NFC normalisation and whitespace collapsing

    Then search each view for each canary.
  - **Match fragments.** For internal strings, add every 24-character window (step 8) of the whitespace-collapsed text as a canary. Keep `confidentialityHits` as canaries whatever their length.
  - **Production:**
    - for each unapproved topic, add its long content strings as canaries (question texts, model answers; ≥ 24 characters), excluding any string that also appears in an approved topic
    - match IDs with a boundary regex: `(?<![\w-])2024-maj-a(?![\w-])` (a following `.` is allowed, which covers `2024-maj-a.sitA.q1`)
    - check file **paths** under `.next/server/app/**` and the route list in `.next/prerender-manifest.json`
  - Scan `public/` as well as `.next/`. Skip only `.next/cache` at the top level, and scan every file that isn't binary (no NUL byte in the first 8 KB) instead of using an extension allow-list.
  - **Add a self-test** (`scripts/ci/check-build-leaks.test.ts`). Plant canaries in a temporary build folder in each encoding (raw, JSON-escaped, double-escaped, HTML-escaped, split by `<!-- -->`, excerpted, inside `public/`) and assert that each one is found. ADR-0012 treats the scan as a gate; a gate without a test is a hope.

**S2. The scan doesn't run on the deployed build, and the production job can't fail**: `.github/workflows/ci.yml:64-79`, `package.json:13`
- **The issue:**
  - CI scans its own `.next`, but Vercel runs a separate build with its own environment.
  - `build-production` has `continue-on-error: true`, so a production leak shows as a warning.
  - The comment says this is because "a production build with zero approved topics fails by design". The stub `build-read-model.ts` doesn't implement that failure, so the job would pass today.
- **Fix:**
  - Make the scan part of every build:
    ```json
    "postbuild": "tsx scripts/ci/check-build-leaks.ts"
    ```
    and have the script read `CONTENT_RELEASE` itself instead of a `--production` flag. Vercel runs `npm run build`, so it inherits the gate, and so do local builds.
  - Remove `continue-on-error` now, while the job passes. Re-add it, or better, an explicit `if:`, only in the PR that makes `content:build` refuse zero approved topics.

**S3. Unknown URLs show Next's English 404 (the known issue), and dotted URLs skip the proxy**: `src/app/` (missing `global-not-found.tsx`), `src/proxy.ts:8`, `next.config.ts`
- **The cause:**
  - The root layout is `[locale]/layout.tsx`. A URL that matches no route (`/fa/unknown`, `/fa/a/b/c`, `/audio/missing.mp3`) never enters that layout, so Next renders its built-in `/_not-found`, which has no `lang`/`dir` and English text.
  - The matcher's `.*\\..*` clause skips the proxy for **any** path containing a dot. Two consequences:
    - `/foo.bar` matches `[locale]` with an invalid locale. The layout's `notFound()` has no boundary above it, so the response is a blank `<html id="__next_error__">` page.
    - Unprefixed deep links with dotted content IDs (CLAUDE.md rule 3: `2016-nov-c.sitA.q1`) aren't redirected to `/fa/...`.
  - `api` and `audio` in the matcher also lack a trailing `/`, so `/audiobook` and `/apis` would skip the proxy too.
- **Fix** (built and checked in a scratch copy: `/fa/unknown`, `/fa/a/b/c` and `/audio/x.mp3` return 404 with `<html lang="fa" dir="rtl">`, the Persian title and a link to `/fa`; `/foo.bar` and `/topics/2016-nov-c.sitA.q1` redirect to `/fa/...`; `/robots.txt` and `/favicon.ico` still return 200):

  1. `next.config.ts`:
     ```ts
     experimental: { globalNotFound: true },
     ```
  2. New file `src/app/global-not-found.tsx`. Move the two `next/font` calls into `src/app/fonts.ts` and import them in both this file and the layout, so the 404 page uses the same fonts.
     ```tsx
     import type { Metadata } from "next";
     import { getTranslations } from "next-intl/server";
     import { getDirection } from "@/i18n/config";
     import { getPathname } from "@/i18n/navigation";
     import { routing } from "@/i18n/routing";
     import "./globals.css";

     const locale = routing.defaultLocale;

     export async function generateMetadata(): Promise<Metadata> {
       const t = await getTranslations({ locale, namespace: "notFound" });
       return { title: t("title") };
     }

     export default async function GlobalNotFound() {
       const t = await getTranslations({ locale, namespace: "notFound" });
       return (
         <html lang={locale} dir={getDirection(locale)}>
           <body>
             <main id="main" className="mx-auto max-w-prose px-4 py-8">
               <h1 className="text-2xl font-bold">{t("title")}</h1>
               <a href={getPathname({ href: "/", locale })} className="mbs-4 inline-block underline">
                 {t("backHome")}
               </a>
             </main>
           </body>
         </html>
       );
     }
     ```
     - A plain `<a>` is deliberate: there's no `NextIntlClientProvider` here, and a full page load is fine on a 404.
     - Passing `locale` explicitly means `request.ts` never calls `rootParams.locale()` outside the `[locale]` tree.
  3. `src/proxy.ts`: list the exclusions explicitly instead of excluding every dotted path:
     ```ts
     matcher: ["/((?!api/|_next/|_vercel/|audio/|favicon\\.ico$|robots\\.txt$).*)"],
     ```
     Add future public files here (for example `sitemap.xml` or `manifest.webmanifest`). Update ADR-0004 §1, which quotes the old matcher.
  4. Add an E2E regression test: `/fa/does-not-exist` returns 404, has `html[lang=fa][dir=rtl]`, a Persian `h1` and a link to `/fa`, and passes axe.
- **Alternative considered:** a `[locale]/[...rest]/page.tsx` that calls `notFound()` (the next-intl docs pattern). With `ensureStatic = "navigation"`, it needs `generateStaticParams`, and every unknown URL is then generated on demand and **cached**, so bots probing random paths grow the cache without limit. `global-not-found` avoids that. Its downside is that it's marked experimental in the 16.4 docs (see Q5).

**S4. Error handling: wrong recovery API, no root-level boundary, error not narrowed**: `src/app/[locale]/error.tsx:5-12`, `src/app/` (missing `global-error.tsx`)
- **The issues:**
  - `reset` only re-renders the children. The Next 16.3+ docs say to use the stable `retry` prop, which re-fetches. After a transient server or RSC failure, "Try again" with `reset` just fails again.
  - The type `error: Error & { digest?: string }` is unsound: a value thrown in a Client Component "is passed as-is and may not be an `Error`".
  - `error.tsx` doesn't wrap the layout of its own segment, which is the root layout. The build output shows Next's default `_global-error`, which is in English.
  - There's no `reportError` hook (ADR-0013) and no focus move for screen-reader users.
- **Fix:**
  - Change the signature to `({ error, retry }: { error: unknown; retry: () => void })` and call `retry`.
  - In a `useEffect`, pass the error, narrowed with `instanceof Error`, to a `reportError` stub in `src/lib/observability/` (a no-op for now).
  - Give the `h1` `tabIndex={-1}` and focus it on mount.
  - Add `src/app/global-error.tsx` (`"use client"`):
    - render its own `<html lang dir>`
    - get its text with `createTranslator({ locale: routing.defaultLocale, messages: { error: fa.error }, namespace: "error" })`, importing only the `error` slice so the chunk stays small
    - set the title with React's `<title>`, since `metadata` isn't supported in `global-error`
  - Add an E2E test for both pages, using a test-only route that throws in the preview channel.

**S5. Lint gaps against CLAUDE.md rule 5 and ADR-0001**: `eslint.config.mjs`

I checked these by linting probe files in a scratch copy of the config:

| Probe | Result |
|---|---|
| A new feature folder (`src/features/newfeat`) importing `@/features/mock-exam/model/reducer` | **not reported**: `FEATURES` (lines 9-18) is a hard-coded list |
| ``aria-label={`Play`}`` (template literal) | not reported |
| `aria-placeholder="Search"`, `aria-roledescription` | not reported (not in `A11Y_TEXT_ATTRIBUTES`, line 84) |
| `<P label="Save now" />` (string prop on our own component) | not reported (`ignoreProps: true`) |
| `export const metadata = { title: "English title" }` | not reported |
| `dir={"rtl"}` | not reported (the selector only matches the bare `dir="rtl"` form) |
| `readFileSync("content/internal/…")` in `src/app` | not reported |
| `src/lib/**` importing `@/i18n/navigation` | allowed (ADR-0001 allows `config`/`routing` only) |

- **Fix:**
  - **Feature list:** build it with `readdirSync(new URL("./src/features", import.meta.url), { withFileTypes: true }).filter((d) => d.isDirectory())`, so new features are covered automatically. Alternatively, add one generic zone per feature.
  - **Literal text in attributes:** extend the `no-restricted-syntax` selectors with `JSXExpressionContainer > TemplateLiteral`, and add `aria-placeholder`, `aria-roledescription` and `label` to `A11Y_TEXT_ATTRIBUTES`.
  - **Static metadata:** in `src/app/**`, forbid `ExportNamedDeclaration VariableDeclarator[id.name="metadata"]`, which forces `generateMetadata` with translations.
  - **Direction:** add `JSXAttribute[name.name='dir'] Literal[value='rtl']`.
  - **File access:** add `fs`, `node:fs` and `node:fs/promises` to `RESTRICTED` for `src/**`, with an opt-out only for `src/lib/content/source/**`. The leak scan should be the second line of defence, not the only one.
  - **`src/lib`:** add a zone or pattern that forbids `@/i18n/navigation`, `@/i18n/request` and `@/i18n/rich-tags` there.

**S6. The future security-critical script isn't type-checked**: `tsconfig.json:43`, `eslint.config.mjs:183-196`
- **The issue:**
  - All of `scripts/content` is excluded from `tsc` and linted with `disableTypeChecked`.
  - That includes `build-read-model.ts`, which ADR-0002 makes the allow-list projection between internal and public data, and `validate.ts`.
  - `no-floating-promises` and the `strict-boolean`-style rules are off exactly where a mistake would publish internal data.
- **Fix:** narrow the exclusion to the pilot files that fail (`scripts/content/lib/validate.ts`, `scripts/content/lib/review-page.ts`, and the other pilot scripts named in the TODO), or fix their two `noImplicitReturns` errors. Then `build-read-model.ts` and `validate.ts` get full type-aware linting now, before the real projection is written.

**S7. The font payload is about twice the ADR-0014 budget**: `src/app/[locale]/layout.tsx:16-26`
- **The issue:**
  - `/fa` preloads four woff2 files: Vazirmatn arabic (46 KB), Vazirmatn latin (34 KB), Noto Sans latin (36 KB) and **Noto Sans latin-ext (168 KB)**. That's about 284 KB against a budget of ≤ 150 KB.
  - Danish æ, ø and å are U+00E6, U+00F8 and U+00E5. They're in the `latin` subset; `latin-ext` covers U+0100 and above, so Danish never uses it.
  - `check:budgets` only measures JavaScript, so this wasn't caught.
- **Fix:**
  - Use `subsets: ["latin"]` for the Danish face.
  - Consider `preload: false` for Vazirmatn's `latin` subset, which is only needed for short runs like "PD3".
  - Add a font assertion to `e2e/budgets.spec.ts` (sum `resourceType() === "font"`, ≤ 150 KB), plus the HTML+RSC budget once topic pages exist.

**S8. `AUDIO_BASE_URL` isn't tied to the CSP**: `src/lib/env/schema.ts:8`, `src/lib/security/headers.ts:11-12`
- **The issue:** the schema accepts any non-empty string, but `media-src` and `connect-src` allow only `'self'` and `blob:`. Setting `AUDIO_BASE_URL=https://<blob-host>/audio` (ADR-0006 option B) would silently break every clip in production, and the build would still succeed.
- **Fix:** until ADR-0006 B is adopted, restrict the value to root-relative paths:
  ```ts
  z.string().regex(/^\/(?!\/)/)
  ```
  When B is adopted, pass the origin into `buildContentSecurityPolicy` and add a unit test that a configured audio origin appears in `media-src` and `connect-src` (ADR-0011 already says to change both together).

**S9. The "one formatting knob" can be bypassed**: `src/i18n/config.ts:49-60`, `src/i18n/messages.test.ts:42-44`
- **The issue:**
  - `numberingSystem` and `calendar` apply only to the **named** formats.
  - A message with `{n, number}` (no style), `{n, number, ::compact-short}`, `{d, date, short}` or a bare `{d, date}` ignores both knobs.
  - Likewise `format.dateTime(d)` or `format.number(n)` with inline options.
  - For `fa`, an unnamed date comes out in the **Solar Hijri** calendar with Iranian month names, which is exactly what ADR-0004 §5 is meant to prevent. And setting the override to `{ fa: "latn" }` would miss unnamed numbers.
  - The test only bans `#`.
- **Fix:**
  - Extend the messages test: every `{x, number…}`, `{x, date…}` and `{x, time…}` argument must name a key from `buildFormats("fa")` (`integer`, `year`, `twoDigit`, `date`, `dayMonth`).
  - When `src/lib/format` is built, route all dates and durations through it.
  - Add a `no-restricted-syntax` rule for `.dateTime(` and `.number(` calls whose second argument isn't a string literal.

**S10. Install scripts aren't skipped on npm 11.20; record the policy**: `package.json`, `.npmrc`
- **The premise is wrong.** On npm 11.20.0 (installed), `allowScripts` is **advisory**: `npm help approve-scripts` says "install scripts still run by default, but installs print a list of packages whose scripts have not been reviewed". They did run here: `node_modules/esbuild/bin/esbuild` is the native Mach-O binary, which only esbuild's postinstall puts there. The project has no `allowScripts` field.
- **Is skipping them safe?** Yes, for this project.
  - **`esbuild` 0.28.2** (from `tsx` and `vite`): the postinstall only checks and optimises the binary. Without it, esbuild resolves `@esbuild/<platform>` from its optional dependencies. `@esbuild/linux-x64` is in the lockfile.
  - **`@swc/core` 1.16.22**: the postinstall only falls back to `@swc/wasm` if the native binding fails to load. `@swc/core-linux-x64-gnu` is in the lockfile.
  - **`@parcel/watcher` 2.6.0**: the install script builds from source only when no prebuilt binary exists. `@parcel/watcher-linux-x64-glibc` is in the lockfile.
  - I loaded all three successfully. `@swc/core` and `@parcel/watcher` come from `next-intl`'s message-extraction tooling, which this project doesn't use.
  - The only risk is a platform without a prebuilt binary (musl or Alpine, unusual CPUs), which neither CI nor Vercel uses.
- **Fix:** make the policy explicit and enforced, so a future dependency with a new install script fails `npm ci` instead of running with a notice:
  ```sh
  npm approve-scripts esbuild           # writes a pinned "esbuild@0.28.2": true
  npm deny-scripts @swc/core @parcel/watcher
  ```
  Then add `strict-allow-scripts=true` to `.npmrc`, and record the decision in ADR-0001.

**S11. CI is missing gates that ADR-0012 promises**: `.github/workflows/ci.yml`
- The **`audit`** job (weekly and on lockfile change, `npm audit --omit=dev --audit-level=high`) is missing.
- The "**test that `build-read-model.ts` never references `content/internal` or the ledger**" (ADR-0012 §1) is missing. Add it now against the stub, for example a Vitest test that reads the file's text and its import graph and asserts that none of them mention `content/internal` or `review-ledger`.
- The CSP listener (`e2e/home.spec.ts:6-9`) watches the console only and covers one test. ADR-0011 asks for `securitypolicyviolation` events on every core page. Install a listener with `page.addInitScript` in a shared fixture so every spec gets it.
- The leak-scan self-test (S1) and the 404/error E2E tests (S3, S4) are missing.

### Nit

- **N1.** `next.config.ts:28`: `onHttpsHost: env.VERCEL_ENV !== undefined` is also true for `VERCEL_ENV=development`, which `vercel env pull` writes into `.env.local`. A local `next start` over plain HTTP would then send HSTS and `upgrade-insecure-requests`. Use `env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview"`.
- **N2.** `src/app/[locale]/layout.tsx:52`: the skip link uses `sr-only focus:not-sr-only`. `globals.css:105-110` defines the designer's `skip-link` utility, which "replaces" that pattern, with a focus ring that isn't clipped and a 44 px target. Use `className="skip-link"`.
- **N3.** `src/components/ui/danish-text.tsx:13`: `cn(className)` renders `class=""` when no class is passed. Use `className={className}`. The component will soon also need `id` and `aria-*` passthrough, and probably `h2`/`h3` in `as`. Its test (`danish-text.test.tsx`) queries by text; add a case for `as="blockquote"` and one asserting that nested `<bdi>` isn't needed.
- **N4.** `vitest.config.mts:20`: the coverage `include` leaves out `src/i18n/**`. `config.ts` and `formats.ts` are the formatting logic ADR-0012 asks to cover. Add `src/i18n/{config,formats}.ts`.
- **N5.** `src/i18n/config.test.ts:24`: `"۱۹ نوامبر ۲۰۲۶"` depends on the ICU data in Node 26. That's fine, but say so in a comment, so an ICU update that changes the month spelling isn't mistaken for a regression.
- **N6.** `.github/dependabot.yml`: the `lint-format` group will propose ESLint 10, and TypeScript 7 will come in a separate update. Both are deliberately held back (ADR-0001), and the ESLint PR fails with ERESOLVE. Add `ignore: [{ dependency-name: "eslint", update-types: ["version-update:semver-major"] }, { dependency-name: "typescript", update-types: ["version-update:semver-major"] }]`, and remove each entry when its trigger in ADR-0001 is met.
- **N7.** ESLint 9.39.5 is marked deprecated on npm ("This version is no longer supported"). I checked the registry today: `eslint-plugin-react` 7.37.5, `eslint-plugin-jsx-a11y` 6.10.2 and `eslint-plugin-import` 2.32.0 are still the latest, and all still cap their `eslint` peer at `^9`, so ADR-0001's reasoning holds. ESLint is dev-only and only parses our own code, so the exposure is low. Keep 9, and note the deprecation and the date in ADR-0001's "Versions checked".
- **N8.** `.github/workflows/ci.yml`: actions are pinned by tag. Pin them by commit SHA, with the tag in a comment; Dependabot updates both. This is cheap supply-chain hardening for a public project.
- **N9.** `src/app/[locale]/not-found.tsx`: there's no `generateMetadata`, so the 404 tab shows only the app name. Add `title: t("title")`.
- **N10.** `src/app/[locale]/page.tsx:22`: `{ count: 51 }` is a hard-coded placeholder (as the plan says). Add a `TODO(content repository)` comment so it doesn't survive into M1.
- **N11.** ADR-0001 confines `lucide-react` to `src/components/ui/icon.tsx`, but the lint opt-out covers all of `src/components/ui/**` (`eslint.config.mjs:162-165`). Narrow it to `icon.tsx` and the theme-icon map.

## 3. Questions

1. **The source PDF and booklet Markdown are already in git history** (commit `785c6d6` added `docs/resources/PD3_Mundtlig_Delproeve2.pdf` and `.md`). This is outside my scope, but CLAUDE.md says "never commit … the source PDF". There's no remote yet. Is this intended for a private repo (D-23)? If not, remove it from history with `git filter-repo` **before the first push**, and add `docs/resources/*.pdf` to `.gitignore`. Note that CI's `content:extract` determinism check needs the Markdown in the repo.
2. **Preview channel and `needs-review`:** will the preview read model carry review statuses so drafts can be flagged (ADR-0010)? If so, the bare `needs-review` canary (line 28) will fail every preview build. ADR-0002 §5 specifies the quoted `"needs-review"`. Which is right?
3. **Approved margin notes (D-21):** when a tip is approved for public use (the ledger already suggests one for `2024-maj-c`), its text will legitimately appear in the build, and the scan will fail. Should canaries come only from notes with `visibility: "internal"`?
4. **Does the Vercel build run any gate?** If S2's `postbuild` isn't wanted, how is the artifact that Vercel deploys checked?
5. **Is `experimental.globalNotFound` acceptable,** given that ADR-0005 prefers stable APIs? The alternative (a catch-all route) has the unbounded-cache trade-off described in S3.
6. **Where did the "install scripts are skipped" note come from?** Was it a warning printed during `npm install`? On npm 11.20 that warning means "will be blocked in a future release", not "skipped".
