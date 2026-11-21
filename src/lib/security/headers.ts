export type HeaderPair = { key: string; value: string };

/**
 * Vercel preview and production deployments are served over HTTPS. VERCEL_ENV=development comes from
 * `vercel env pull` on a local machine, which serves plain HTTP, so it doesn't count.
 */
export function isHttpsDeployment(vercelEnv: "production" | "preview" | "development" | undefined): boolean {
  return vercelEnv === "production" || vercelEnv === "preview";
}

export function buildContentSecurityPolicy(options: { isDev: boolean; onHttpsHost: boolean }): string {
  const { isDev, onHttpsHost } = options;
  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])]],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "data:", "blob:"]],
    ["font-src", ["'self'"]],
    ["media-src", ["'self'", "blob:"]],
    ["connect-src", ["'self'", ...(isDev ? ["ws:"] : [])]],
    ["worker-src", ["'self'"]],
    ["manifest-src", ["'self'"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
  ];
  const parts = directives.map(([name, values]) => `${name} ${values.join(" ")}`);
  if (onHttpsHost) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

export const PERMISSIONS_POLICY = [
  "microphone=(self)",
  "camera=()",
  "geolocation=()",
  "display-capture=()",
  "usb=()",
  "serial=()",
  "hid=()",
  "bluetooth=()",
  "midi=()",
  "payment=()",
  "magnetometer=()",
  "gyroscope=()",
  "accelerometer=()",
  "browsing-topics=()",
  "interest-cohort=()",
].join(", ");

export function buildSecurityHeaders(options: {
  isDev: boolean;
  indexing: "on" | "off";
  onHttpsHost: boolean;
}): HeaderPair[] {
  const headers: HeaderPair[] = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(options) },
    { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
    { key: "Referrer-Policy", value: "same-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  ];
  if (options.onHttpsHost) {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" });
  }
  if (options.indexing === "off") {
    headers.push({ key: "X-Robots-Tag", value: "noindex, nofollow" });
  }
  return headers;
}

export const AUDIO_CACHE_HEADERS: HeaderPair[] = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];
