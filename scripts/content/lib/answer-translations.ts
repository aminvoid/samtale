import { createHash } from "node:crypto";
import type { AnswerTranslation, ItemDecision } from "./pipeline-schema.ts";

export function translationSourceHash(da: string): string {
  return createHash("sha256").update(da.normalize("NFC")).digest("hex").slice(0, 16);
}

type AnswerItem = { id: string; text: { da?: string } };
type AnswerSection = {
  question: { modelAnswer: AnswerItem };
  followups: { answer: AnswerItem }[];
  personalExamples: AnswerItem[];
};

export function answerItemsOf({
  situations,
  general,
}: {
  situations: AnswerSection[];
  general: AnswerSection;
}) {
  return [...situations, general].flatMap(({ question, followups, personalExamples }) => [
    question.modelAnswer,
    ...followups.map(({ answer }) => answer),
    ...personalExamples,
  ]);
}

export function publishedAnswerTranslation(
  item: AnswerTranslation | undefined,
  da: string,
  decision: Pick<ItemDecision, "status"> | undefined,
  channel: "preview" | "production",
): Pick<AnswerTranslation, "fa" | "origin"> | undefined {
  if (
    item === undefined ||
    (channel === "production" && decision?.status !== "approved") ||
    item.sourceHash !== translationSourceHash(da)
  ) {
    return undefined;
  }
  return { fa: item.fa, origin: item.origin };
}
