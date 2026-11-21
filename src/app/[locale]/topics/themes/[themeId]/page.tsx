import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { BackLink } from "@/components/ui/back-link";
import { DanishText } from "@/components/ui/danish-text";
import { PageHeader } from "@/components/ui/page-header";
import { PersianText } from "@/components/ui/persian-text";
import { FilteredTheme } from "@/features/topic-library/filtered-theme";
import { themesPath } from "@/features/topic-library/library-paths";
import { ThemeResults } from "@/features/topic-library/theme-results";
import { orderTopics } from "@/features/topic-library/topic-order";
import { getTheme, listThemes, listTopics } from "@/lib/content/repository";

export async function generateStaticParams() {
  const themes = await listThemes();
  return themes.filter(({ topicCount }) => topicCount > 0).map(({ id }) => ({ themeId: id }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/topics/themes/[themeId]">) {
  const { themeId } = await params;
  const theme = await getTheme(themeId);
  return { title: theme?.title.fa };
}

export default async function ThemePage({ params }: PageProps<"/[locale]/topics/themes/[themeId]">) {
  const { themeId } = await params;
  const [theme, topics, t] = await Promise.all([
    getTheme(themeId),
    listTopics({ themeId }),
    getTranslations("library.view"),
  ]);
  if (theme === null || topics.length === 0) notFound();

  const ordered = orderTopics(topics);
  const fullList = <ThemeResults theme={theme} topics={ordered} />;
  return (
    <>
      <PageHeader
        back={<BackLink href={themesPath}>{t("themes")}</BackLink>}
        title={<PersianText className="text-h1">{theme.title.fa}</PersianText>}
        subtitle={
          <DanishText as="p" className="text-align-flow text-da-card">
            {theme.title.da}
          </DanishText>
        }
      />
      {theme.subthemes.length === 0 ? (
        fullList
      ) : (
        <Suspense fallback={fullList}>
          <FilteredTheme theme={{ id: theme.id, subthemes: theme.subthemes }} topics={ordered} />
        </Suspense>
      )}
    </>
  );
}
