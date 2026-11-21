import { z } from "zod";

export const buildEnvSchema = z
  .object({
    CONTENT_RELEASE: z.enum(["preview", "production"]).default("preview"),
    SITE_INDEXING: z.enum(["on", "off"]).default("off"),
    NEXT_PUBLIC_SITE_URL: z.url().optional(),
    AUDIO_BASE_URL: z.string().min(1).default("/audio"),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.VERCEL_ENV !== "production") return;
    if (env.CONTENT_RELEASE !== "production") {
      ctx.addIssue({
        code: "custom",
        path: ["CONTENT_RELEASE"],
        message: "Production deployments must build with CONTENT_RELEASE=production (ADR-0010).",
      });
    }
    if (env.NEXT_PUBLIC_SITE_URL === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SITE_URL"],
        message: "Required in production (ADR-0010).",
      });
    }
  });

export type BuildEnv = z.infer<typeof buildEnvSchema>;

export function parseBuildEnv(source: Record<string, string | undefined>): BuildEnv {
  const result = buildEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
