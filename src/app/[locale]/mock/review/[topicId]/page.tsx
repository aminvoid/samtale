import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { MockReview } from "@/features/mock-exam/screens/mock-review";
import { ReviewMaterial } from "@/features/mock-exam/screens/review-material";
import { getExaminerLines, getTopic, listTopicIds } from "@/lib/content/repository";

export async function generateStaticParams() {
  return (await listTopicIds()).map((topicId) => ({ topicId }));
}

export async function generateMetadata() {
  const t = await getTranslations("mock.review");
  return { title: t("title") };
}

export default async function Page({ params }: PageProps<"/[locale]/mock/review/[topicId]">) {
  const { topicId } = await params;
  const [topic, lines, t] = await Promise.all([
    getTopic(topicId),
    getExaminerLines(),
    getTranslations("mock.review"),
  ]);
  if (topic === null) notFound();
  return (
    <Suspense
      fallback={
        <div className="grid gap-5">
          <PageHeader title={t("title")} />
          <ReviewMaterial topic={topic} lines={lines} />
        </div>
      }
    >
      <MockReview topic={topic} lines={lines} />
    </Suspense>
  );
}
