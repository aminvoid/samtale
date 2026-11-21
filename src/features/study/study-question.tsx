import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { DanishText } from "@/components/ui/danish-text";
import { RoleHeader } from "@/components/ui/role-header";
import type { TermSummary, Topic } from "@/lib/content/repository";
import { cn } from "@/lib/utils/cn";
import { StudyClipButton } from "./study-clip-button";
import { TranslationToggle } from "./translation-toggle";
import { VerificationNote } from "./verification-note";

type Section = Topic["general"];

export function StudyQuestion({
  question,
  kind,
  terms,
  children,
}: {
  question: Section["question"] | Section["followups"][number];
  kind: "first-question" | "second-question" | "followup";
  terms: ReadonlyMap<string, TermSummary>;
  children?: ReactNode;
}) {
  const t = useTranslations("study");
  const followup = kind === "followup";
  const { verification } = question;

  return (
    <div
      className={cn(
        "grid gap-3 rounded-card p-4 md:p-5",
        followup ? "border border-dashed border-role-examiner bg-surface-raised" : "bg-role-examiner-subtle",
      )}
    >
      <RoleHeader
        as="h3"
        role={kind}
        label={t(followup ? "followup" : kind === "first-question" ? "firstQuestion" : "secondQuestion")}
        action={
          <StudyClipButton
            item={{ id: question.id, audio: question.audio }}
            label={t(followup ? "playFollowup" : "playQuestion")}
            variant="examiner"
          />
        }
      />
      {followup && <p className="text-caption text-text-muted">{t("followupNote")}</p>}
      <DanishText as="p" className={cn("wrap-anywhere", followup ? "text-da-followup" : "text-da-question")}>
        {question.text.da}
      </DanishText>
      <VerificationNote
        verification={verification}
        sourceTerm={verification.status === "unchecked" ? undefined : terms.get(verification.sourceTermId)}
        followup={followup}
      />
      <TranslationToggle text={question.text.fa} question={question.text.da} />
      {children}
    </div>
  );
}
