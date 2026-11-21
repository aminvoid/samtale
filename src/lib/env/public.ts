// Next.js inlines only literal process.env.NEXT_PUBLIC_* references.
export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
} as const;
