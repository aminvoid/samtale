import { getTranslations } from "next-intl/server";
import { RunnerPage } from "@/features/mock-exam/screens/runner-page";

export async function generateMetadata() {
  const t = await getTranslations("mock.ready");
  return { title: t("exam") };
}

export default function Page() {
  return <RunnerPage mode="exam" />;
}
