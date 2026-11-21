import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { DanishText } from "@/components/ui/danish-text";
import { richTags } from "@/i18n/rich-tags";
import { routing } from "@/i18n/routing";
import { examConfig } from "@/lib/exam/config";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-prose px-4 py-8">
      <h1 className="text-2xl font-bold">{t.rich("title", richTags)}</h1>
      <p className="mbs-4">{t.rich("firstQuestionTip", richTags)}</p>
      <p className="mbs-4">{t("repeatLabel")}</p>
      <DanishText as="p" className="mbs-2 text-lg">
        {examConfig.repeatRequestText}
      </DanishText>
    </main>
  );
}
