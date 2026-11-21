import { useTranslations } from "next-intl";
import { DanishText } from "@/components/ui/danish-text";
import { RoleHeader } from "@/components/ui/role-header";
import { SourceLabel } from "@/components/ui/source-label";
import { TermName } from "@/components/ui/term-name";
import { richTags } from "@/i18n/rich-tags";
import type { TermSummary, Topic } from "@/lib/content/repository";
import { IntroAudio } from "./intro-audio";

export function ExaminerIntro({
  intro,
  terms,
}: {
  intro: NonNullable<Topic["situations"][number]["intro"]>;
  terms: ReadonlyMap<string, TermSummary>;
}) {
  const t = useTranslations("study");
  const source = intro.sourceLabel;
  const term = source.kind === "siri" ? terms.get(source.termId) : undefined;
  const label =
    source.kind === "app"
      ? t("sources.app")
      : term === undefined
        ? t.rich("sources.suggested", richTags)
        : t.rich("sources.suggestedWithTerm", {
            ...richTags,
            term: () => <TermName term={term} />,
          });

  return (
    <div className="grid gap-3 rounded-card bg-role-examiner-subtle p-4">
      <RoleHeader
        as="h3"
        role="situation-intro"
        label={t("intro")}
        source={<SourceLabel variant={source.kind}>{label}</SourceLabel>}
      />
      <IntroAudio item={{ id: intro.id, audio: intro.audio }}>
        <DanishText as="p" className="rounded-control bg-surface-raised p-3 text-da-intro wrap-anywhere">
          {intro.text.da}
        </DanishText>
      </IntroAudio>
    </div>
  );
}
