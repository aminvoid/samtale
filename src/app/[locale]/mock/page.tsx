import { getTranslations } from "next-intl/server";
import { MockStart } from "@/features/mock-exam/screens/mock-start";
import { getMockDeck } from "@/lib/content/repository";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("mockFull") };
}

export default async function Page() {
  const deck = await getMockDeck();
  return <MockStart topicCount={deck.topics.length} />;
}
