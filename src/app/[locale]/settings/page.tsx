import { getTranslations } from "next-intl/server";
import { ComingSoon } from "@/features/app-shell/coming-soon";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("settings") };
}

export default async function Page() {
  const t = await getTranslations("nav");
  return <ComingSoon title={t("settings")} />;
}
