import { notFound } from "next/navigation";
import { env } from "@/lib/env/server";
import { ThrowAfterMount } from "./throw-after-mount";

/**
 * Test-only route for the error-boundary E2E test (ADR-0012). It exists only in the preview channel;
 * production builds render a 404. It throws in the browser after hydration, so the static build passes.
 */
export default function TestErrorPage() {
  if (env.CONTENT_RELEASE !== "preview") notFound();
  return <ThrowAfterMount />;
}
