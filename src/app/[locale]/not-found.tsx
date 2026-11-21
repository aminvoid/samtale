import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FocusHeading } from "@/components/ui/focus-heading";
import { Link } from "@/i18n/navigation";

/** Shown when a page in the locale tree calls notFound() (unknown topic IDs). Unmatched URLs use global-not-found. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notFound");
  return { title: t("title") };
}

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const meta = await getTranslations("metadata");
  return (
    <div className="mx-auto max-inline-reading">
      {/* not-found segments ignore generateMetadata here; React 19 hoists <title> into <head>. */}
      <title>{meta("titleTemplate", { page: t("title"), appName: meta("appName") })}</title>
      <FocusHeading>{t("title")}</FocusHeading>
      <Link href="/" className="mbs-4 inline-flex items-center text-accent underline min-block-touch">
        {t("backHome")}
      </Link>
    </div>
  );
}
