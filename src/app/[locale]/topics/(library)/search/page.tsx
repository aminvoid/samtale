import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { orderTopics } from "@/features/topic-library/topic-order";
import { UrlSearchResults } from "@/features/topic-library/url-search-results";
import { getSearchIndex, listTopics } from "@/lib/content/repository";

export async function generateMetadata() {
  const t = await getTranslations("library.search");
  return { title: t("title") };
}

export default async function SearchPage() {
  const [topics, index] = await Promise.all([listTopics(), getSearchIndex()]);
  return (
    <Suspense fallback={null}>
      <UrlSearchResults topics={orderTopics(topics)} index={index} />
    </Suspense>
  );
}
