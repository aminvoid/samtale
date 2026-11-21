import { getTranslations } from "next-intl/server";
import { SimilarQuestions } from "@/features/topic-library/similar-questions";
import { listSimilarQuestionGroups, listTopics } from "@/lib/content/repository";

export async function generateMetadata() {
  const t = await getTranslations("library.similar");
  return { title: t("title") };
}

export default async function SimilarQuestionsPage() {
  const [groups, topics] = await Promise.all([listSimilarQuestionGroups(), listTopics()]);
  return <SimilarQuestions groups={groups} topics={topics} />;
}
