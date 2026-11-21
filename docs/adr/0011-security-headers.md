# ADR-0011: Security headers: CSP, Permissions-Policy and the rest

| | |
|---|---|
| **Status** | Accepted (2026-11-19) |
| **Deciders** | `software-architect` |
| **Related** | `.claude/rules/nextjs-react.md` ("Security headers"), CLAUDE.md rules 8 and 10, GA-13, US-044, US-059; ADR-0005 (static rendering), ADR-0006 (audio), ADR-0009 (Base UI), ADR-0010 (hosting), ADR-0013 (no third parties) |

## Context

- Every page is prerendered static HTML (ADR-0005). The App Router puts **inline scripts** in that HTML (the React Server Components payload).
- The Next.js 16.4 CSP guide is explicit: **nonces require dynamic rendering** of every page ("Static pages are generated at build time, when no request or response headers exist — so no nonce can be injected"). Hash-based CSP via Subresource Integrity (`experimental.sri`) covers external script files and is experimental.
- The app has no user-generated content shown to other users, no third-party scripts, no analytics, no ads, no embeds, and no `dangerouslySetInnerHTML` with content (lint error, ADR-0001). Content is escaped by React.
- The app needs the microphone (same origin, after a tap). Audio is same-origin; the mock exam plays preloaded clips and recordings from `blob:` URLs. Fonts are self-hosted by `next/font`.
- Base UI may inject inline `<style>` elements (ADR-0009). Next.js and `next/font` also use inline styles.

## Options considered

| Option | Gain | Give up |
|---|---|---|
| A. Nonce-based strict CSP via `proxy.ts` | Strongest script policy | Forces **every page to render dynamically**: no CDN-cached HTML, a server render per request, cost and latency on slow phones; contradicts ADR-0005 |
| **B. Static CSP in `next.config` `headers()`, with `script-src 'self' 'unsafe-inline'`; everything else locked down** | Pages stay static; the rest of the policy (`default-src`, `object-src`, `base-uri`, `frame-ancestors`, `connect-src`, `media-src`) still blocks most attack paths | Inline script injection isn't blocked by CSP; we rely on having no injection point (React escaping, no `dangerouslySetInnerHTML`, no user content) |
| C. B plus experimental SRI and no `'unsafe-inline'` | Possibly strict and static | Experimental; inline RSC payload scripts may still need `'unsafe-inline'`; unverified with Cache Components |

## Decision

**Option B now; evaluate C in a spike** (an E2E test already listens for CSP violations, so trying it is cheap and safe).

All headers are built in `src/lib/security/headers.ts` (pure, unit-tested) and applied in `next.config.ts` `headers()` for `/:path*`.

### Content-Security-Policy (production)

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self';
media-src 'self' blob:;
connect-src 'self';
worker-src 'self';
manifest-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

- Development adds `'unsafe-eval'` to `script-src` (React's dev tooling; the docs say production doesn't need it) and `ws:` to `connect-src` for hot reload.
- `upgrade-insecure-requests` (and HSTS below) are sent only on HTTPS hosts (any Vercel deployment), so a local `next start` over plain HTTP, which the E2E suite uses, keeps working.
- `media-src blob:` is for the mock preload (object URLs) and recording playback; `connect-src 'self'` covers the preload `fetch`.
- If audio moves to Blob storage (ADR-0006 option B), add that origin to `media-src` and `connect-src` in the same change.
- Vercel's preview toolbar loads scripts from `vercel.live`; it's blocked by this policy. Turn the toolbar off in the project settings (we don't need comments on previews).

### Permissions-Policy

```
microphone=(self), camera=(), geolocation=(), display-capture=(), usb=(), serial=(), hid=(),
bluetooth=(), midi=(), payment=(), magnetometer=(), gyroscope=(), accelerometer=(),
browsing-topics=(), interest-cohort=()
```

The microphone is allowed for our own origin only (`.claude/rules/nextjs-react.md`); every other powerful feature is off, and the ad-tracking features are explicitly refused.

### Other headers

| Header | Value | Why |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` on HTTPS hosts; no `preload` until the owner decides the domain is permanent | HTTPS only |
| `X-Content-Type-Options` | `nosniff` | No MIME sniffing |
| `X-Frame-Options` | `DENY` | Legacy companion to `frame-ancestors 'none'` |
| `Referrer-Policy` | `same-origin` | External sites (SIRI links) don't learn that the learner came from the app or which topic they were on |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates the browsing context |
| `Cross-Origin-Resource-Policy` | `same-origin` | Our files, including audio, can't be embedded by other sites |
| `X-Robots-Tag` | `noindex, nofollow` while `SITE_INDEXING=off` | Pre-launch deployments stay out of search engines; `robots.ts` disallows everything too |
| `Cache-Control` on `/audio/:path*` | `public, max-age=31536000, immutable` | ADR-0006 |

`poweredByHeader: false` in `next.config.ts`.

### Verification

- Unit test: the header builder output for dev/prod and indexing on/off.
- E2E (every core page): listen for `securitypolicyviolation` events and console CSP errors; any violation fails the test.
- E2E: assert the headers on `/fa` and on one audio file.
- E2E (US-044 #3): no request from the app carries recording data (no `POST`/`PUT` with a body, no `blob:` upload).

## Consequences

- **Gain:** pages stay static and fast; the policy blocks plugins, framing, base-tag hijacking, cross-origin fetches and powerful features we don't use.
- **Give up:** `script-src 'unsafe-inline'` means CSP alone won't stop an injected inline script. The mitigation is having no injection point, enforced by lint and code review. If the app ever renders user-supplied HTML, this decision must be revisited first.
- No `report-to` endpoint: there's no reporting service (ADR-0013). If error reporting is added, CSP reports can go to the same place.
