import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next internals, audio and the listed public files goes through the
  // locale proxy, including dotted content IDs (2016-nov-c.sitA.q1). Add new public files here
  // (sitemap.xml, manifest.webmanifest). ADR-0004 §1.
  matcher: ["/((?!api/|_next/|_vercel/|audio/|favicon\\.ico$|robots\\.txt$).*)"],
};
