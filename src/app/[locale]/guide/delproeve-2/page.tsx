import { getTranslations } from "next-intl/server";
import { DelproeveTwoGuide } from "@/features/exam-guide/delproeve-two-guide";
import { introductoryExampleId } from "@/features/exam-guide/exam-facts";
import { prepareExaminerLines } from "@/features/exam-guide/examiner-lines";
import { getExaminerLines, getTopic } from "@/lib/content/repository";

export async function generateMetadata() {
  const t = await getTranslations("guide");
  return { title: t("title") };
}

export default async function Page() {
  const [lines, example] = await Promise.all([getExaminerLines(), getTopic(introductoryExampleId)]);
  return <DelproeveTwoGuide lines={prepareExaminerLines(lines, example)} />;
}
