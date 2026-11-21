import { getTranslations } from "next-intl/server";
import { ThemeGrid } from "@/features/topic-library/theme-grid";
import { listThemes } from "@/lib/content/repository";

export async function generateMetadata() {
  const t = await getTranslations("library");
  return { title: t.markup("title", { part: "2", da: (text) => text }) };
}

export default async function TopicsPage() {
  const themes = await listThemes();
  return <ThemeGrid themes={themes.filter(({ topicCount }) => topicCount > 0)} />;
}
