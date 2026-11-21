import { useTranslations } from "next-intl";
import { richTags } from "@/i18n/rich-tags";
import { examConfig } from "@/lib/exam/config";
import type { AttemptRecord } from "@/lib/progress/schema";
import { formatDuration, mockCard } from "./presentation";

export function ReviewFacts({ attempt }: { attempt: AttemptRecord }) {
  const t = useTranslations("mock.review");
  const audio = useTranslations("audio");
  const limit = examConfig.examLimitSeconds * 1000;
  const duration = (ms: number) => formatDuration(ms, (parts) => audio("clock", parts));
  const repeats = attempt.answers.reduce((sum, answer) => sum + answer.repeats, 0);
  return (
    <section className={mockCard}>
      <h2 className="mbe-2 text-h2">{t("details")}</h2>
      <ul className="grid gap-1">
        <li>{t.rich("total", { ...richTags, time: duration(attempt.totalMs) })}</li>
        {attempt.status === "interrupted" && <li>{t("interruptionTime")}</li>}
        <li>
          {t("repeats", { count: repeats })}{" "}
          <span className="text-caption text-text-muted">{t("repeatsAllowed")}</span>
        </li>
        <li>
          {t(attempt.answers.some(({ showTextUsed }) => showTextUsed) ? "showTextUsed" : "showTextUnused")}
        </li>
        {attempt.skippedFollowups.length > 0 && <li>{t("skipped")}</li>}
        {attempt.mode === "exam" && attempt.status === "completed" && attempt.totalMs < limit && (
          <li>{t.rich("short", { ...richTags, limit: duration(limit) })}</li>
        )}
      </ul>
    </section>
  );
}
