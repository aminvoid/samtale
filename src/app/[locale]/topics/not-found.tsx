import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/ui/back-link";
import { FocusHeading } from "@/components/ui/focus-heading";
import { themesPath } from "@/features/topic-library/library-paths";

export async function generateMetadata() {
  const t = await getTranslations("notFound");
  return { title: t("title") };
}

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <>
      {/* not-found segments ignore generateMetadata here; React 19 hoists <title> into <head>. */}
      <title>
        {t("metadata.titleTemplate", { page: t("notFound.title"), appName: t("metadata.appName") })}
      </title>
      <FocusHeading>{t("notFound.title")}</FocusHeading>
      <div className="mbs-4 flex flex-wrap gap-x-4">
        <BackLink href={themesPath}>{t("library.search.browseInstead")}</BackLink>
        <BackLink href="/">{t("notFound.backHome")}</BackLink>
      </div>
    </>
  );
}
