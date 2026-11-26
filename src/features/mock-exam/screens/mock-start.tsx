import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DanishText } from "@/components/ui/danish-text";
import { IconClock3 } from "@/components/ui/icon";
import { InfoNote } from "@/components/ui/info-note";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { examConfig } from "@/lib/exam/config";
import { cn } from "@/lib/utils/cn";
import { ExamRules } from "./exam-rules";
import { MockHistoryLink } from "./mock-history-link";
import { MockStartNotice } from "./mock-start-notice";
import { mockCard, mockLink, mockPrimaryLink, mockSecondaryLink, mockTextLink } from "./presentation";

export function MockStart({
  topicCount,
  showProgressHistory = false,
}: {
  topicCount: number;
  showProgressHistory?: boolean;
}) {
  const t = useTranslations("mock");
  return (
    <div className="grid gap-6">
      <PageHeader
        title={t.rich("title", { da: (text) => <DanishText as="bdi">{text}</DanishText>, part: "other" })}
        subtitle={t("start.sequence", { look: examConfig.lookSeconds })}
      />
      <Link href="/guide/delproeve-2" className={cn(mockTextLink, "justify-self-start")}>
        {t("start.guide")}
      </Link>
      <MockStartNotice />
      <div className="grid gap-4 md:grid-cols-2">
        <section className={cn(mockCard, "flex flex-col gap-4")}>
          <h2 className="text-h2">{t("mode.practice")}</h2>
          <ul className="list-disc space-y-2 ps-5">
            <li>{t("start.practicePace")}</li>
            <li>{t("start.practiceChoice")}</li>
          </ul>
          <div className="mbs-auto">
            {topicCount > 0 ? (
              <Link
                href="/mock/practice"
                prefetch={false}
                className={cn(mockLink, mockPrimaryLink, "inline-full")}
              >
                {t("start.practice")}
              </Link>
            ) : (
              <Button block disabledReason={t("start.noTopics")}>
                {t("start.practice")}
              </Button>
            )}
          </div>
        </section>
        <section className={cn(mockCard, "flex flex-col gap-4")}>
          <h2 className="text-h2">{t("mode.exam")}</h2>
          <ExamRules />
          <div className="mbs-auto">
            {topicCount >= 3 ? (
              <Link
                href="/mock/exam"
                prefetch={false}
                className={cn(mockLink, mockSecondaryLink, "inline-full")}
              >
                {t("start.exam")}
              </Link>
            ) : (
              <Button variant="secondary" block disabledReason={t("start.examUnavailable")}>
                {t("start.exam")}
              </Button>
            )}
          </div>
        </section>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2">
        <section className="grid gap-2">
          <h2 className="text-h2">{t("start.needs")}</h2>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-text-muted">
            <li className="flex items-center gap-2">
              <IconClock3 />
              {t("start.duration", { min: 5, max: 6 })}
            </li>
            <li>{t("start.quiet")}</li>
            <li>{t("start.sound")}</li>
            <li>{t("start.mic")}</li>
          </ul>
        </section>
        <InfoNote variant="compact">{t("start.noGrade")}</InfoNote>
      </div>
      {showProgressHistory && <MockHistoryLink />}
    </div>
  );
}
