import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TopicStudy } from "@/features/study/topic-study";
import {
  getTheme,
  getTopic,
  getTopicLinks,
  listTerms,
  listTopicIds,
  listTopics,
} from "@/lib/content/repository";

export async function generateStaticParams() {
  return (await listTopicIds()).map((topicId) => ({ topicId }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/topics/[topicId]">): Promise<Metadata> {
  const { topicId } = await params;
  const [topic, t] = await Promise.all([getTopic(topicId), getTranslations("study")]);
  return topic === null ? {} : { title: t("pageTitle", { topic: topic.title.fa }) };
}

export default async function TopicPage({ params }: PageProps<"/[locale]/topics/[topicId]">) {
  const { topicId } = await params;
  const topic = await getTopic(topicId);
  if (topic === null) notFound();

  const [theme, links, terms, topics] = await Promise.all([
    getTheme(topic.themeId),
    getTopicLinks(topicId),
    listTerms(),
    listTopics(),
  ]);
  const topicsById = new Map(topics.map((summary) => [summary.id, summary]));
  const destinations = links.flatMap((link) => {
    const destination = topicsById.get(link.toTopicId);
    return destination === undefined ? [] : [{ link, topic: destination }];
  });

  return <TopicStudy topic={topic} theme={theme} terms={terms} destinations={destinations} />;
}
