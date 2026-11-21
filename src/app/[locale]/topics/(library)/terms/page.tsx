import { getTranslations } from "next-intl/server";
import { TermsScreen } from "@/features/topic-library/terms-screen";
import { orderTopics, publishedTerms } from "@/features/topic-library/topic-order";
import { listTerms, listTopics } from "@/lib/content/repository";

export async function generateMetadata() {
  const t = await getTranslations("library.view");
  return { title: t("terms") };
}

export default async function TermsPage() {
  const [terms, topics] = await Promise.all([listTerms(), listTopics()]);
  return <TermsScreen terms={publishedTerms(terms)} topics={orderTopics(topics)} />;
}
