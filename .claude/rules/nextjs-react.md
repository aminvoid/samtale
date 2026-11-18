---
paths:
  - "src/**/*.{ts,tsx}"
  - "next.config.*"
---

# Next.js 16 and React 19

## Check before you use an API
- **Look up APIs you aren't sure about** in current docs (the `next-devtools` MCP server, or nextjs.org/docs). Don't rely on what you remember from Next.js 13–15.
- **Next.js 16 changes to respect** (check exact details in the docs):
  - `middleware.ts` is now **`proxy.ts`**. next-intl's locale middleware goes there.
  - **Request APIs are async:** `await params`, `await searchParams`, `await cookies()`, `await headers()`.
  - **Turbopack** is the default bundler for `dev` and `build`.
  - **Caching is opt-in** through Cache Components (`cacheComponents`, `"use cache"`, `cacheLife`, `cacheTag`). Statically generate content pages with `generateStaticParams`, and make pages dynamic only where needed.
  - **`next lint` is gone.** Run ESLint directly.
  - **React Compiler** is supported through the `reactCompiler` option. Adopt it only through an ADR. If it's enabled, don't add `useMemo`/`useCallback` by hand for performance.

## Architecture
- **Routes:** App Router only. Routes live in `src/app/[locale]/`. Pages are thin: they load data through `src/lib/content` and compose components from `src/features/*`.
- **Server Components by default.** Put `"use client"` on the smallest interactive leaf, and pass it only serialisable props. Mark server-only modules with `import "server-only"`.
- **Fetching content:** in Server Components, through the content repository. Never fetch content JSON on the client.
- **Feature boundaries:** features don't import each other's internals. Share code through `src/lib` or `src/components`, and enforce this with ESLint import rules once scaffolded.
- **Error states:** each meaningful route segment has `error.tsx`, `not-found.tsx` and, where useful, `loading.tsx`, with translated, friendly messages.
- **Metadata:** use `generateMetadata` with translated strings. Set `<html lang dir>` from the locale.
- **Fonts and images:** fonts with `next/font` (self-hosted, `display: "swap"`), images with `next/image`.
- **Security headers:** set a CSP and a `Permissions-Policy` (`microphone=(self)`, everything else off) in `next.config`.

## TypeScript
- **Strictness:** turn on `strict`, `noUncheckedIndexedAccess` and `noImplicitOverride`.
- **Avoid escape hatches:** no `any`, no `as` casts to silence errors, and no non-null `!` without a comment explaining why.
- **Unions:** use discriminated unions for states, and exhaustive `switch` statements with a `never` check.
- **Validation at the boundary:** content, storage, env vars and URL params are parsed with Zod.

## React
- **Components:** function components with named exports, one per file. Use kebab-case file names, with tests next to the file (`foo.test.tsx`).
- **State:** keep it local first. Put shareable state in the URL (filters, selected theme). Use context only for cross-cutting concerns, such as the single shared audio player. Don't add a global state library without an ADR.
- **Effects:** don't use `useEffect` for derived data. Always clean up timers, event listeners, media streams and object URLs.
- **Accessibility:** native elements before ARIA. A clickable thing is a `<button>` or `<a>`.
