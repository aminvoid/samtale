import { describe, expect, it } from "vitest";
import {
  AUDIO_CACHE_HEADERS,
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  type HeaderPair,
  isHttpsDeployment,
  PERMISSIONS_POLICY,
} from "./headers";

function headerValue(headers: HeaderPair[], key: string): string | undefined {
  return headers.find((h) => h.key === key)?.value;
}

const localProduction = { isDev: false, indexing: "off", onHttpsHost: false } as const;

describe("buildContentSecurityPolicy", () => {
  it("locks down framing, plugins and base URIs", () => {
    const csp = buildContentSecurityPolicy(localProduction);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("default-src 'self'");
  });

  it("allows blob: media for recordings and preloaded clips", () => {
    expect(buildContentSecurityPolicy(localProduction)).toContain("media-src 'self' blob:");
  });

  it("has no 'unsafe-eval', no ws: and no upgrade-insecure-requests in a local production build", () => {
    const csp = buildContentSecurityPolicy(localProduction);
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("ws:");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("adds 'unsafe-eval' and ws: in development only", () => {
    const csp = buildContentSecurityPolicy({ isDev: true, onHttpsHost: false });
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(csp).toContain("connect-src 'self' ws:");
  });

  it("adds upgrade-insecure-requests on HTTPS hosts", () => {
    expect(buildContentSecurityPolicy({ isDev: false, onHttpsHost: true })).toMatch(
      /; upgrade-insecure-requests$/,
    );
  });
});

describe("buildSecurityHeaders", () => {
  it("allows the microphone for our own origin only", () => {
    expect(PERMISSIONS_POLICY).toContain("microphone=(self)");
    expect(PERMISSIONS_POLICY).toContain("camera=()");
    expect(headerValue(buildSecurityHeaders(localProduction), "Permissions-Policy")).toBe(PERMISSIONS_POLICY);
  });

  it("sends the baseline headers", () => {
    const headers = buildSecurityHeaders(localProduction);
    expect(headerValue(headers, "X-Content-Type-Options")).toBe("nosniff");
    expect(headerValue(headers, "X-Frame-Options")).toBe("DENY");
    expect(headerValue(headers, "Referrer-Policy")).toBe("same-origin");
    expect(headerValue(headers, "Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(headerValue(headers, "Cross-Origin-Resource-Policy")).toBe("same-origin");
    expect(headerValue(headers, "Content-Security-Policy")).toBe(buildContentSecurityPolicy(localProduction));
  });

  it("sends X-Robots-Tag only while indexing is off", () => {
    expect(headerValue(buildSecurityHeaders(localProduction), "X-Robots-Tag")).toBe("noindex, nofollow");
    expect(
      headerValue(buildSecurityHeaders({ ...localProduction, indexing: "on" }), "X-Robots-Tag"),
    ).toBeUndefined();
  });

  it("sends HSTS only on HTTPS hosts", () => {
    expect(headerValue(buildSecurityHeaders(localProduction), "Strict-Transport-Security")).toBeUndefined();
    expect(
      headerValue(
        buildSecurityHeaders({ ...localProduction, onHttpsHost: true }),
        "Strict-Transport-Security",
      ),
    ).toBe("max-age=63072000; includeSubDomains");
  });
});

describe("AUDIO_CACHE_HEADERS", () => {
  it("caches content-addressed audio forever", () => {
    expect(headerValue(AUDIO_CACHE_HEADERS, "Cache-Control")).toBe("public, max-age=31536000, immutable");
  });
});

describe("isHttpsDeployment", () => {
  it("is true for Vercel preview and production only", () => {
    expect(isHttpsDeployment("production")).toBe(true);
    expect(isHttpsDeployment("preview")).toBe(true);
    // `vercel env pull` writes VERCEL_ENV=development into .env.local; local servers are plain HTTP.
    expect(isHttpsDeployment("development")).toBe(false);
    expect(isHttpsDeployment(undefined)).toBe(false);
  });
});
