import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getDirection } from "@/i18n/config";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { fontVariables } from "./fonts";
import "./globals.css";

/*
 * 404 for URLs that match no route (experimental.globalNotFound, ADR-0005 note). It renders outside the
 * [locale] layout, so it uses the default locale explicitly and never reads root params.
 */
const locale = routing.defaultLocale;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale });
  return {
    title: t("metadata.titleTemplate", { page: t("notFound.title"), appName: t("metadata.appName") }),
  };
}

export default async function GlobalNotFound() {
  const t = await getTranslations({ locale, namespace: "notFound" });
  return (
    <html lang={locale} dir={getDirection(locale)} className={fontVariables}>
      <body>
        <main id="main" tabIndex={-1} className="mx-auto px-4 py-8 max-inline-reading">
          <h1 autoFocus tabIndex={-1} className="text-h1">
            {t("title")}
          </h1>
          {/* A plain link: there's no NextIntlClientProvider here, and a full page load is fine on a 404. */}
          <a
            href={getPathname({ href: "/", locale })}
            className="mbs-4 inline-flex items-center text-accent underline min-block-11 min-inline-touch"
          >
            {t("backHome")}
          </a>
        </main>
      </body>
    </html>
  );
}
