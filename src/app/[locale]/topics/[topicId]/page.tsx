import { notFound } from "next/navigation";
import { DanishText } from "@/components/ui/danish-text";
import { PersianText } from "@/components/ui/persian-text";
import { ComingSoon } from "@/features/app-shell/coming-soon";
import { getTopic, listTopicIds } from "@/lib/content/repository";

export async function generateStaticParams() {
  const topics = await listTopicIds();
  return topics.map((topicId) => ({ topicId }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/topics/[topicId]">) {
  const { topicId } = await params;
  const topic = await getTopic(topicId);
  return { title: topic?.title.fa };
}

export default async function TopicPage({ params }: PageProps<"/[locale]/topics/[topicId]">) {
  const { topicId } = await params;
  const topic = await getTopic(topicId);
  if (topic === null) notFound();

  return (
    <ComingSoon
      title={
        <DanishText as="bdi" className="text-da-title">
          {topic.title.da}
        </DanishText>
      }
      subtitle={<PersianText>{topic.title.fa}</PersianText>}
    />
  );
}
