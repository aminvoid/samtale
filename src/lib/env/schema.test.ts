import { describe, expect, it } from "vitest";
import { parseBuildEnv } from "./schema";

describe("parseBuildEnv", () => {
  it("applies safe defaults to an empty environment", () => {
    expect(parseBuildEnv({})).toEqual({
      CONTENT_RELEASE: "preview",
      SITE_INDEXING: "off",
      AUDIO_BASE_URL: "/audio",
    });
  });

  it("ignores unrelated variables", () => {
    expect(parseBuildEnv({ PATH: "/usr/bin", AZURE_SPEECH_KEY: "not-for-the-app" })).not.toHaveProperty(
      "AZURE_SPEECH_KEY",
    );
  });

  it("rejects unknown values", () => {
    expect(() => parseBuildEnv({ CONTENT_RELEASE: "staging" })).toThrow(/CONTENT_RELEASE/);
    expect(() => parseBuildEnv({ SITE_INDEXING: "yes" })).toThrow(/SITE_INDEXING/);
    expect(() => parseBuildEnv({ NEXT_PUBLIC_SITE_URL: "not a url" })).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("accepts a preview deployment with preview content", () => {
    expect(parseBuildEnv({ VERCEL_ENV: "preview" }).CONTENT_RELEASE).toBe("preview");
  });

  it("rejects a production deployment that builds preview content (ADR-0010)", () => {
    expect(() =>
      parseBuildEnv({
        VERCEL_ENV: "production",
        CONTENT_RELEASE: "preview",
        NEXT_PUBLIC_SITE_URL: "https://example.org",
      }),
    ).toThrow(/CONTENT_RELEASE=production/);
  });

  it("rejects a production deployment without a site URL (ADR-0010)", () => {
    expect(() => parseBuildEnv({ VERCEL_ENV: "production", CONTENT_RELEASE: "production" })).toThrow(
      /NEXT_PUBLIC_SITE_URL/,
    );
  });

  it("accepts a complete production environment", () => {
    expect(
      parseBuildEnv({
        VERCEL_ENV: "production",
        CONTENT_RELEASE: "production",
        NEXT_PUBLIC_SITE_URL: "https://example.org",
        SITE_INDEXING: "on",
      }),
    ).toEqual({
      VERCEL_ENV: "production",
      CONTENT_RELEASE: "production",
      NEXT_PUBLIC_SITE_URL: "https://example.org",
      SITE_INDEXING: "on",
      AUDIO_BASE_URL: "/audio",
    });
  });
});
