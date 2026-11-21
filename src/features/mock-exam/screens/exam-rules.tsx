import { useTranslations } from "next-intl";
import { InfoNote } from "@/components/ui/info-note";
import { richTags } from "@/i18n/rich-tags";
import { examConfig } from "@/lib/exam/config";
import { formatDuration } from "./presentation";

export function ExamRules() {
  const t = useTranslations("mock.start");
  const audio = useTranslations("audio");
  return (
    <div className="grid gap-3">
      <ul className="list-disc space-y-2 ps-5">
        <li>
          {t.rich("limit", {
            ...richTags,
            time: formatDuration(examConfig.examLimitSeconds * 1000, (time) => audio("clock", time)),
          })}
        </li>
        <li className="font-semibold">{t("continuous")}</li>
        <li>{t("available")}</li>
        <li>{t("notices")}</li>
      </ul>
      <InfoNote icon="circle-pause" variant="compact">
        {t("interruptions")}
      </InfoNote>
      <p className="text-text-muted">{t("alternative")}</p>
    </div>
  );
}
