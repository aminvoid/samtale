# ADR-0013: Error reporting and analytics

| | |
|---|---|
| **Status** | Accepted (2026-11-19) for v1: **no analytics, no third-party error reporting.** Revisit with the owner's decision D-5. |
| **Deciders** | Owner (any analytics, any new third party); `software-architect` (technical seams) |
| **Related** | PRD §4.3–§4.5, D-5, D-9 (report-a-problem channel), GA-13, US-059, US-065; CLAUDE.md ("Azure AI Speech is the only external service"); ADR-0010, ADR-0011 |

## Context

- The PRD's default is **no analytics**; learning is measured with interviews, sessions and a voluntary survey (§4.5). Any analytics, including aggregate cookieless counts, is the owner's decision D-5.
- The app is static; errors happen in learners' browsers (audio, microphone, storage), which a host's server logs never see.
- Privacy is a product goal: no user audio leaves the device, no third-party trackers (GA-13). A third-party service would also be a second external service, which CLAUDE.md doesn't currently allow.
- "Report a problem" (US-065) gives learners a user-initiated channel (D-9: a mailto link or a Telegram contact).

## Options considered

### Error reporting

| Option | Cost | Gain | Give up |
|---|---|---|---|
| **A. None automated; errors shown calmly with a short error code that "report a problem" includes** | $0 | No data leaves the device unless the learner chooses to send it; nothing to disclose beyond what the learner writes | We learn about bugs only from QA, the beta and reports |
| B. Sentry (`@sentry/nextjs` 11.14.0), EU region, no PII, no replay or tracing | Free tier exists (event caps) | Stack traces from real devices (valuable for iOS audio quirks) | A third party receiving IP addresses and user agents; a sizeable client bundle; CSP and privacy-page changes; an exception to "Azure only" |
| C. First-party endpoint (`/api/client-errors`) writing to host logs | $0 on Hobby | No third party | Turns the static app partly dynamic; Vercel Hobby keeps runtime logs for 1 hour, so reports would vanish without paid log drains |
| D. Self-hosted GlitchTip (Sentry-compatible) | Hosting cost | No third party | Operating a service |

### Analytics (for D-5; listed so the owner can choose later)

| Option | Notes |
|---|---|
| **None** (PRD recommendation) | Interviews, sessions, survey |
| First-party aggregate counters (the PRD's ~6 events), no identifiers | Needs a server route and a small store (a database or KV): new infrastructure and cost |
| Vercel Web Analytics | Cookieless, aggregate, included events on Hobby; a third party; the privacy page must list it |
| Plausible (EU, paid) or self-hosted Umami | Cookieless; paid or operated by us |

## Decision

**v1: option A, and no analytics.** Build the seams so either can be added without touching features:

- `src/lib/observability/report-error.ts`: one function, `reportError(error, context?: { area: string; itemId?: string })`. In v1 it logs to the console in development and does nothing in production except keep the **last error code** in memory.
- Error boundaries (`error.tsx` per segment, the player, the recorder, the mock runner) show a calm Persian message with a next step (GA-9) and a short **error code** (a React `digest` for server errors, or a code derived from the area and error name on the client).
- "Report a problem" (US-065, channel per D-9) pre-fills the page, the item ID and, if present, the last error code. The learner sees and sends it themselves. No automatic upload.
- Storage, microphone and audio failures are reported through `reportError` with an `area`, so a future reporter gets useful grouping for free.
- **No analytics code** of any kind ships. The privacy page says so (US-059 #1).

**If the owner later approves error reporting:** recommend Sentry's EU region with `sendDefaultPii: false`, no session replay, no performance tracing, errors only, sampling as needed. Change `reportError`, add the ingest origin to CSP `connect-src`, update the privacy page, and update CLAUDE.md's "only external service" statement.

## Consequences

- **Gain:** the strongest privacy position and nothing to disclose beyond the host's request logs; zero cost; no extra JavaScript.
- **Give up:** blind to errors on devices we don't test. The M2 real-device checks and the closed beta (D-10) are the mitigation; the seams make adding a reporter a one-module change.
- The owner decides D-5 (analytics) and whether to allow an error-reporting service; both are listed in "Decisions needed".
