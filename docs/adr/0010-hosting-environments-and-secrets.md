# ADR-0010: Hosting, environments, environment variables and secrets

| | |
|---|---|
| **Status** | **Accepted (2026-11-19, confirmed by owner delegation):** Vercel Hobby ($0), with deployment protection until the author's written permission exists. Re-check the Hobby non-commercial terms before the public launch. Environment variables and secrets handling are accepted (2026-11-19). |
| **Deciders** | Owner (hosting, cost, domain); `software-architect` (the rest) |
| **Related** | CLAUDE.md rule 8, DL-009 / D-23 (private repo, nothing public before permission), D-10 (closed beta), D-13 (free, no ads), PRD R16; ADR-0005, ADR-0006, ADR-0011, ADR-0012 |

## Context

- The v1 app is **fully static** after build (ADR-0005): no route handlers, no server actions, no database, no secrets at runtime. The only request-time code is the locale proxy (ADR-0004).
- Audio (~60 MB in total, of which only published clips deploy) is served from the same origin (ADR-0006).
- **Nothing may be public before the author's written permission** (DL-009). The repository stays private (D-23). A closed beta for 5–10 learners is planned once the author agrees (D-10).
- Later: a token route for speech-to-text, accounts and a database need server functions.
- The owner pays; costs are expected to be small (D-13).

## Options considered (prices and limits as published on 2026-11-19; the owner should re-check before signing up)

| Option | Monthly cost | Fit today | Fit tomorrow | Give up |
|---|---|---|---|---|
| **A. Vercel Hobby** (default Next.js output) | **$0.** Includes 100 GB Fast Data Transfer, 1M function invocations, 1M CDN requests. Over the limit, features pause for up to 30 days rather than bill. | First-party Next.js 16 platform (a "verified adapter"): Cache Components, proxy, headers, preview deployment per branch, Node 26 default. **Deployment Protection with Vercel Authentication covers preview and production on Hobby**, and **Shareable Links** let chosen people in without accounts. Private GitHub repos deploy via the Git integration (no 100 MB CLI upload limit). | Route handlers for STT tokens and accounts work as-is | Hobby is for personal, non-commercial use under Vercel's terms; a free, ad-free community app should qualify, but **the owner must confirm**. Runtime logs are kept for 1 hour only. A US company (EU data transfers under its DPA; the privacy page must name the host). |
| B. Vercel Pro | $20 per developer seat | As A, plus spend controls, longer logs, log drains, optional password protection (+$20/month) | As A | Cost |
| C. Azure Static Web Apps (Free) with `output: "export"` | $0 (Free: 100 GB bandwidth, 250 MB app size); Standard ~$9/month | One vendor with Azure Speech | Server features need SWA-managed Azure Functions or a move | Static export drops the proxy, `next.config` headers and runtime `"use cache"` (ADR-0005 option C): headers and redirects move to `staticwebapp.config.json`, and the Cache Components decision would have to be revisited. Closed-beta access needs SWA role invitations (learners need GitHub or Microsoft accounts) or the Standard plan's password protection. |
| D. Azure App Service (B1) or Container Apps running `next start` | ~$13/month (B1), or near $0 with scale-to-zero on Container Apps plus cold starts | Full Next.js | Full | We run the container, TLS, CDN in front, and updates. More operations than this project needs. |
| E. Cloudflare Workers with the OpenNext adapter | $0 (generous free tier, no bandwidth charge for static assets) | Cloudflare Access (free up to 50 users, email one-time code) is excellent for a closed beta | Workers can host route handlers | The adapter is not (yet) a Next.js-verified adapter; Cache Components support must be checked per release. A third vendor. |

## Decision (recommended; owner to decide)

**Recommend option A, Vercel Hobby,** with these settings, and keep the app portable so B–E stay one migration away:

1. **Before permission (now → M2):** Vercel Authentication on **all** deployments (preview and production). Only the owner can open them. `SITE_INDEXING=off`.
2. **Closed beta (D-10, after the author agrees):** share a **Shareable Link** to the production deployment with the 5–10 learners; protection stays on. (Fallback if that proves awkward: option E's Cloudflare Access, or Pro's password protection.)
3. **Public launch (M4):** turn protection off for production only, set `SITE_INDEXING=on`, add the custom domain.
4. If the owner prefers a single vendor (Azure), option C is the next best; it costs one ADR revision (static export, host-level headers) and the Cache Components decision.

Why not static export now: it buys host independence we don't need yet, and gives up the platform features (headers in config, the proxy, protection and preview links) that this phase relies on most.

## Environments

| Environment | Where | `CONTENT_RELEASE` | Access | Notes |
|---|---|---|---|---|
| Local | `npm run dev` | `preview` | the developer | `.env.local` (never committed) may hold `AZURE_SPEECH_*` for `audio:generate` only |
| CI | GitHub Actions | `preview` and `production` (both built; ADR-0012) | – | no secrets at all |
| Preview | Vercel preview deployment per branch or PR | `preview` (drafts shown with a "not reviewed" banner) | Vercel Authentication (owner only) | |
| Production | Vercel production (`main`) | **`production`** (approved topics only) | protected until M4, then public | the build fails if `VERCEL_ENV=production` and `CONTENT_RELEASE` isn't `production` |

## Environment variables (validated with Zod)

| Variable | Used by | Values | Secret? |
|---|---|---|---|
| `CONTENT_RELEASE` | `content:build`, `next.config` | `preview` (default) · `production` | no |
| `SITE_INDEXING` | `robots.ts`, headers (ADR-0011) | `off` (default) · `on` | no |
| `NEXT_PUBLIC_SITE_URL` | `metadataBase`, canonical and share URLs (US-066) | absolute `https://` URL; **required in production** | no |
| `AUDIO_BASE_URL` | `content:build` (ADR-0006) | default `/audio` | no |
| `VERCEL_ENV` | build guard | set by Vercel | no |
| `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` | `scripts/audio/` only | – | **yes; local machine only, never in CI or Vercel** |

- `src/lib/env/schema.ts` (pure Zod, no `server-only`) defines the build schema; it's imported by `next.config.ts` (with an explicit `.ts` extension, ADR-0001) so an invalid environment **fails the build at startup**, and by `scripts/content/build-read-model.ts`.
- `src/lib/env/server.ts` (`import "server-only"`) re-exports the parsed values for server code; `src/lib/env/public.ts` lists `NEXT_PUBLIC_*` values explicitly (Next.js inlines only literal references).
- `scripts/audio/env.ts` has its own schema for the Azure variables; the app never imports it.
- `.env.example` documents every variable with safe defaults. `.env*` files are gitignored except `.env.example`; `.claude/settings.json` already denies agents from reading them.

## Secrets

- **The deployed v1 app holds no secrets.** Azure keys exist only on the machine that runs `audio:generate`.
- **Speech-to-text later:** `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` become server-only variables on the host; a route handler `/api/speech/token` exchanges them for a short-lived Azure token (about 10 minutes) and returns only the token and region; rate-limited; never cached. No `NEXT_PUBLIC_*` ever holds a key (CLAUDE.md rule 8).
- GitHub: Dependabot alerts on; secret scanning on (available for private repos depending on the GitHub plan; if not, add a `gitleaks` step to CI).

## Consequences

- **Gain:** $0 hosting at community scale, nothing public before permission, per-branch previews for reviewers, and no secret in any deployed artefact.
- **Gain:** the static-first design (ADR-0005) and same-origin audio (ADR-0006) make a later move to Azure or Cloudflare a deployment change, not a rewrite.
- **Give up:** a second vendor account besides Azure; Hobby's terms and limits; 1-hour runtime logs (we have no server logic to debug in v1).
- **Owner decisions needed:** hosting provider and plan (H1); whether to buy a custom domain (~€10–15 a year; H2); confirming that Hobby's non-commercial terms fit (H1).
