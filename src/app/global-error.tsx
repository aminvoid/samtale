"use client";

import { useEffect } from "react";
import { getDirection } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { reportError } from "@/lib/observability/report-error";
import { fontVariables } from "./fonts";
import { globalErrorMessages as messages } from "./global-error-messages";
import "./globals.css";

/*
 * Errors in the root layout replace the whole document with this page. It has no locale segment, so it
 * renders in the default locale (messages/fa.json; a test checks that it matches routing.defaultLocale).
 * This component ships with every page, so it imports only its two strings, generated from
 * messages/fa.json (scripts/i18n/global-error-messages.ts), not the whole messages file and the ICU
 * formatter (ADR-0014 budget). `metadata` isn't supported here, so the title is React's <title>.
 */
const locale = routing.defaultLocale;

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    reportError(error, { area: "root" });
  }, [error]);

  return (
    <html lang={locale} dir={getDirection(locale)} className={fontVariables}>
      <body>
        <title>{messages.title}</title>
        <main id="main" tabIndex={-1} className="mx-auto max-w-prose px-4 py-8">
          <h1 className="text-2xl font-bold">{messages.title}</h1>
          <button
            type="button"
            onClick={() => {
              retry();
            }}
            className="mbs-4 underline min-block-11 min-inline-11"
          >
            {messages.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
