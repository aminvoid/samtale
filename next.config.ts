import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
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

export default withNextIntl(nextConfig);
