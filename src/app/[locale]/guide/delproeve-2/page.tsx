import { getTranslations } from "next-intl/server";
import { ComingSoon } from "@/features/app-shell/coming-soon";
import { richTags } from "@/i18n/rich-tags";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t.markup("guideTitle", { part: "2", da: (text) => text }) };
}

export default async function Page() {
  const t = await getTranslations("nav");
  return <ComingSoon title={t.rich("guideTitle", { ...richTags, part: "2" })} />;
}
