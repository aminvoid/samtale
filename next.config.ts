import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants.js";
import createNextIntlPlugin from "next-intl/plugin";
import { assertReadModelChannel } from "./scripts/ci/build-artifacts.ts";
import { parseBuildEnv } from "./src/lib/env/schema.ts";
import { AUDIO_CACHE_HEADERS, buildSecurityHeaders, isHttpsDeployment } from "./src/lib/security/headers.ts";

// Fails the build at startup if the environment is invalid (ADR-0010).
const env = parseBuildEnv(process.env);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    // Persian 404 for unmatched URLs (src/app/global-not-found.tsx). Experimental in 16.4; see the
    // ADR-0005 note for why and when to remove it.
    globalNotFound: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  headers() {
    return Promise.resolve([
      {
        source: "/:path*",
        headers: buildSecurityHeaders({
          isDev: process.env.NODE_ENV === "development",
          indexing: env.SITE_INDEXING,
          onHttpsHost: isHttpsDeployment(env.VERCEL_ENV),
        }),
      },
      { source: "/audio/:path*", headers: AUDIO_CACHE_HEADERS },
    ]);
  },
};

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./src/i18n/request.ts",
  experimental: { createMessagesDeclaration: "./messages/fa.json" },
});

export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) assertReadModelChannel(import.meta.dirname, env.CONTENT_RELEASE);
  return withNextIntl(nextConfig);
}
