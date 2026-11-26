import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { DirectionProvider } from "@/components/ui/direction-provider";
import { SkipLink } from "@/components/ui/skip-link";
import { AppShell } from "@/features/app-shell/app-shell";
// Imported from its own file: the feature's index would pull the whole mock exam runtime into every page.
import { ClearMockReloadMarker } from "@/features/mock-exam/screens/clear-mock-reload-marker";
import { getDirection } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { publicEnv } from "@/lib/env/public";
import { fontVariables } from "../fonts";
import "../globals.css";

// Every route under this layout must be fully static (ADR-0005).
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    metadataBase: publicEnv.siteUrl === undefined ? undefined : new URL(publicEnv.siteUrl),
    title: { default: t("appName"), template: t("titleTemplate", { page: "%s", appName: t("appName") }) },
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const direction = getDirection(locale);
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <html lang={locale} dir={direction} className={fontVariables}>
      <body>
        <SkipLink>{t("skipToContent")}</SkipLink>
        <NextIntlClientProvider>
          <Suspense fallback={null}>
            <ClearMockReloadMarker />
          </Suspense>
          <DirectionProvider direction={direction}>
            <AppShell>{children}</AppShell>
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
