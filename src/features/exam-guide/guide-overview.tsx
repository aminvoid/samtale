import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { StepList } from "@/components/ui/step-list";
import { numberingSystemFor } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { richTags } from "@/i18n/rich-tags";
import { checkedOn, conversationMinutes, lookSeconds, oralMinutes } from "./exam-facts";

export function GuideOverview() {
  const t = useTranslations("guide");
  const format = useFormatter();
  const locale = useLocale();
  const duration = new Intl.NumberFormat(locale, { numberingSystem: numberingSystemFor(locale) });

  // ABOUT §§3.2–3.3. The overview keeps the same route when the part-one guide is added.
  const steps = [
    { key: "start", body: <p>{t.rich("overview.start", richTags)}</p> },
    {
      key: "part-one",
      body: (
        <div className="flex flex-col items-start gap-2">
          <h3 className="text-h3">{t.rich("overview.partOne", { ...richTags, part: "1" })}</h3>
          <p>{t("overview.partOneTopic", { days: 5 })}</p>
          <p>
            {t("overview.partOneTiming", {
              presentation: 2,
              questions: duration.format(2.5),
            })}
          </p>
          <p>{t.rich("overview.partOneNotes", { ...richTags, size: "A4" })}</p>
          <p className="rounded-chip bg-surface-sunken px-3 py-1 text-caption text-text-muted">
            {t("overview.partOneLater")}
          </p>
        </div>
      ),
    },
    {
      key: "part-two",
      body: (
        <div className="flex flex-col items-start gap-2">
          <h3 className="text-h3">{t.rich("overview.partTwo", { ...richTags, part: "2" })}</h3>
          <p>
            {t("overview.partTwoSummary", {
              seconds: lookSeconds,
              minutes: duration.format(conversationMinutes),
            })}
          </p>
          <Link
            href="/guide/delproeve-2"
            className="inline-flex items-center gap-2 rounded-control bg-accent px-4 py-2 text-label text-accent-contrast min-block-touch hover:bg-accent-hover"
          >
            {t("overview.partTwoLink")}
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      ),
    },
    { key: "finish", body: <p>{t("overview.finish")}</p> },
  ];

  return (
    <article className="mx-auto flex flex-col gap-6 text-body max-inline-reading">
      <PageHeader
        title={t("overview.title")}
        subtitle={t.rich("overview.lead", { ...richTags, exam: "PD3", minutes: oralMinutes })}
      />
      <p className="text-caption text-text-muted">{t("lastChecked", { date: checkedOn })}</p>
      <section
        aria-labelledby="oral-sequence"
        className="rounded-card border border-border bg-surface-raised p-4 md:p-6"
      >
        <h2 id="oral-sequence" className="mbe-4 text-h2">
          {t("overview.sequence")}
        </h2>
        <StepList
          steps={steps.map((step, index) => ({ ...step, number: format.number(index + 1, "integer") }))}
        />
      </section>
    </article>
  );
}
