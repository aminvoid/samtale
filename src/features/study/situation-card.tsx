import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { DanishText } from "@/components/ui/danish-text";
import { SourceLabel } from "@/components/ui/source-label";
import { ThemeIcon } from "@/components/ui/theme-icon";
import type { Topic } from "@/lib/content/repository";
import { TranslationToggle } from "./translation-toggle";

export function SituationCard({
  situation,
  themeId,
}: {
  situation: Topic["situations"][number];
  themeId: string;
}) {
  const t = useTranslations("study");

  return (
    <Card className="grid gap-2">
      <div className="flex items-start gap-3">
        <DanishText className="grid shrink-0 place-items-center rounded-control bg-accent-subtle text-da-card font-bold text-accent block-10 inline-10">
          {situation.key}
        </DanishText>
        <DanishText
          as="p"
          className="grow self-center text-align-flow text-da-card wrap-anywhere min-inline-0"
        >
          {situation.title.da}
        </DanishText>
        <ThemeIcon themeId={themeId} className="text-text-muted" />
      </div>
      <SourceLabel variant="booklet-picture">{t("pictureSource")}</SourceLabel>
      <TranslationToggle text={situation.title.fa} />
    </Card>
  );
}
