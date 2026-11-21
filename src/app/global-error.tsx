"use client";

import { createTranslator } from "next-intl";
import { useEffect } from "react";
import messages from "../../messages/fa.json";
import { getDirection } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { reportError } from "@/lib/observability/report-error";
import { fontVariables } from "./fonts";
import "./globals.css";

/*
 * Errors in the root layout replace the whole document with this page. It has no locale segment, so it
 * renders in the default locale (messages/fa.json; a test checks that it matches routing.defaultLocale).
 * `metadata` isn't supported here, so the title is React's <title>.
 */
const locale = routing.defaultLocale;
const t = createTranslator({ locale, messages, namespace: "error" });

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    reportError(error, { area: "root" });
  }, [error]);

  return (
    <html lang={locale} dir={getDirection(locale)} className={fontVariables}>
      <body>
        <title>{t("title")}</title>
        <main id="main" tabIndex={-1} className="mx-auto max-w-prose px-4 py-8">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <button
            type="button"
            onClick={() => {
              retry();
            }}
            className="mbs-4 underline min-block-11 min-inline-11"
          >
            {t("retry")}
          </button>
        </main>
      </body>
    </html>
  );
}
