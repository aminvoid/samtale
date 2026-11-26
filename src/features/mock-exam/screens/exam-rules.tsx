import { useTranslations } from "next-intl";
import { IconCirclePause } from "@/components/ui/icon";
import { InfoNote } from "@/components/ui/info-note";
import { examConfig } from "@/lib/exam/config";
import { formatDuration } from "./presentation";

export function ExamRules() {
  const t = useTranslations("mock.start");
  return (
    <div className="grid gap-3">
      <ul className="list-disc space-y-2 ps-5">
        <li>{formatDuration(examConfig.examLimitSeconds * 1000, (parts) => t("limit", parts))}</li>
        <li className="font-semibold">{t("continuous")}</li>
        <li>{t("available")}</li>
        <li>{t("notices")}</li>
      </ul>
      <InfoNote icon={IconCirclePause} variant="compact">
        {t("interruptions")}
      </InfoNote>
      <p className="text-text-muted">{t("alternative")}</p>
    </div>
  );
}
