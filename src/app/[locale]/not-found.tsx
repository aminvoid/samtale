import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** Shown when a page in the locale tree calls notFound() (unknown topic IDs). Unmatched URLs use global-not-found. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notFound");
  return { title: t("title") };
}

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-prose px-4 py-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <Link href="/" className="mbs-4 inline-block underline">
        {t("backHome")}
      </Link>
    </main>
  );
}
