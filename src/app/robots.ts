import type { MetadataRoute } from "next";
import { env } from "@/lib/env/server";

export default function robots(): MetadataRoute.Robots {
  return env.SITE_INDEXING === "on"
    ? { rules: { userAgent: "*", allow: "/" } }
    : { rules: { userAgent: "*", disallow: "/" } };
}
