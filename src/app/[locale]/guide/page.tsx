import { getTranslations } from "next-intl/server";
import { GuideOverview } from "@/features/exam-guide/guide-overview";

export async function generateMetadata() {
  const t = await getTranslations("guide.overview");
  return { title: t("title") };
}

export default function Page() {
  return <GuideOverview />;
}
