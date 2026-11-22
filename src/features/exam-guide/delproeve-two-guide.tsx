import { useFormatter, useLocale, useTranslations } from "next-intl";
import { BackLink } from "@/components/ui/back-link";
import { DanishText } from "@/components/ui/danish-text";
import { Disclosure } from "@/components/ui/disclosure";
import { ExternalLink } from "@/components/ui/external-link";
import { Icon } from "@/components/ui/icon";
import { InfoNote } from "@/components/ui/info-note";
import { PageHeader } from "@/components/ui/page-header";
import { numberingSystemFor } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { richTags } from "@/i18n/rich-tags";
import { examConfig } from "@/lib/exam/config";
import {
  arrangementsDeadlineWeeks,
  arrangementsNextTermYear,
  arrangementsWinterYear,
  assessmentUrl,
  bookletUrl,
  candidateUrl,
  checkedOn,
  conversationMinutes,
  examOrderUrl,
  examinerChecklistUrl,
  gradeScaleUrl,
  oralMinutes,
  practicalArrangementsUrl,
  practicalNotesUrl,
} from "./exam-facts";
import { ExamSequence } from "./exam-sequence";
import type { GuideExaminerLines } from "./examiner-lines";
import { FollowUpTypes } from "./follow-up-types";

const textLink =
  "inline-flex items-center gap-2 rounded-control text-accent underline min-block-touch min-inline-touch";
const bullets = "list-outside list-disc space-y-2 ps-5";

export function DelproeveTwoGuide({ lines }: { lines: GuideExaminerLines }) {
  const t = useTranslations("guide");
  const format = useFormatter();
  const locale = useLocale();

  const contents = [
    { id: "steps", label: t("section.steps") },
    { id: "timeline", label: t("section.timeline") },
    { id: "examiner", label: t("section.examiner") },
    { id: "follow-up-types", label: t("section.followUps") },
    { id: "assessment", label: t("section.assessment") },
    { id: "grade", label: t("section.grade") },
    { id: "fits", label: t("section.fits") },
    { id: "sources", label: t("section.sources") },
  ];
  const contentsLinks = (
    <nav aria-label={t("onThisPage")}>
      <ul role="list">
        {contents.map(({ id, label }) => (
          <li key={id}>
            <a href={`#${id}`} className={textLink}>
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  // ABOUT §4.2 (BEK 1759/2024) and §4.3 (BEK 1687/2025).
  const grades = [12, 10, 7, 4, 2, 0, -3];
  const numberingSystem = numberingSystemFor(locale);
  const duration = new Intl.NumberFormat(locale, { numberingSystem });
  const passAverage = new Intl.NumberFormat(locale, {
    numberingSystem,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  function sourceLink(href: string, label: string) {
    return (
      <ExternalLink href={href} label={t("sources.external", { label })}>
        {label}
      </ExternalLink>
    );
  }

  return (
    <article className="mx-auto grid gap-8 text-body xl:grid-cols-[var(--container-study-nav)_minmax(0,var(--container-reading))] xl:justify-center">
      <div className="mx-auto flex flex-col gap-4 inline-full max-inline-reading min-inline-0 xl:col-start-2 xl:row-start-1">
        <PageHeader title={t("title")} back={<BackLink href="/guide">{t("overview.title")}</BackLink>} />
        <p className="text-caption text-text-muted">{t("lastChecked", { date: checkedOn })}</p>
        {/* ABOUT §3.4: an unprepared conversation and the right to a repeat. Review Q5: candidate wording. */}
        <p className="text-lead">
          {t.rich("lead", {
            ...richTags,
            part: "2",
            minutes: duration.format(conversationMinutes),
          })}
        </p>
        <section aria-labelledby="repeat">
          <InfoNote icon="repeat-2">
            <h2 id="repeat" tabIndex={-1} className="text-h2">
              {t("repeat.title")}
            </h2>
            <p className="mbs-2">{t("repeat.body")}</p>
            <div className="mbs-3 rounded-control bg-surface-raised p-3">
              <p className="text-caption text-text-muted">{t("repeat.suggestion")}</p>
              <DanishText as="p" className="mbs-1 text-da-line">
                {examConfig.repeatRequestText}
              </DanishText>
              <p lang="fa" className="mbs-1 text-ui">
                {t("lines.translation", { meaning: t("repeat.meaning") })}
              </p>
            </div>
            <p className="mbs-2 text-ui">{t.rich("repeat.variant", richTags)}</p>
          </InfoNote>
        </section>
        <Disclosure
          label={t("onThisPage")}
          icon="list-checks"
          className="rounded-card border border-border bg-surface-raised p-2 xl:hidden"
        >
          <div className="px-2">{contentsLinks}</div>
        </Disclosure>
      </div>
      <div className="inset-bs-4 hidden self-start rounded-card border border-border bg-surface-raised p-4 xl:sticky xl:col-start-1 xl:row-span-2 xl:row-start-1 xl:block short:static">
        <p className="mbe-1 text-label text-text-muted">{t("onThisPage")}</p>
        {contentsLinks}
      </div>

      <div className="mx-auto flex flex-col gap-10 inline-full max-inline-reading min-inline-0 xl:col-start-2 xl:row-start-2">
        <ExamSequence lines={lines} />

        {/* ABOUT §3.4, §4.1 (SIRI checklist) and §10; mock-rules review 2026-11-20, S3. */}
        <section aria-labelledby="examiner" className="flex flex-col gap-4">
          <h2 id="examiner" tabIndex={-1} className="text-h2">
            {t("section.examiner")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-card border border-border bg-surface-raised p-4">
              <h3 className="mbe-2 text-h3">{t("examiner.does")}</h3>
              <ul className={bullets}>
                <li>{t("examiner.repeatFirst")}</li>
                <li>{t("examiner.cannotAnswer")}</li>
                <li>{t("examiner.harder")}</li>
                <li>{t("examiner.pauses")}</li>
                <li>{t.rich("examiner.thanks", richTags)}</li>
              </ul>
            </div>
            <div className="rounded-card border border-border bg-surface-raised p-4">
              <h3 className="mbe-2 text-h3">{t("examiner.doesNot")}</h3>
              <ul className={bullets}>
                <li>{t("examiner.correct")}</li>
                <li>{t("examiner.translate")}</li>
                <li>{t("examiner.knowledge")}</li>
                <li>{t("examiner.interrupt")}</li>
              </ul>
            </div>
          </div>
          <p>{t("examiner.mayReword")}</p>
          <div>{sourceLink(examinerChecklistUrl, t("sources.examinerChecklist"))}</div>
          <div>
            {/* US-001 #4: suggested candidate phrase from the glossary/review, separate from exam rules. */}
            <p>{t("examiner.rescue")}</p>
            {t.rich("examiner.rescueDanish", {
              da: (children) => (
                <DanishText as="p" className="mbs-1 text-da-line">
                  {children}
                </DanishText>
              ),
            })}
            <p lang="fa" className="text-ui">
              {t("lines.translation", { meaning: t("examiner.rescueMeaning") })}
            </p>
            <a href="#repeat" className={textLink}>
              {t("examiner.repeatLink")}
            </a>
          </div>
        </section>

        <FollowUpTypes />

        {/* ABOUT §4.1, BEK 1687/2025 annex 1 point 3.40. */}
        <section aria-labelledby="assessment" className="flex flex-col gap-3">
          <h2 id="assessment" tabIndex={-1} className="text-h2">
            {t("section.assessment")}
          </h2>
          <ul className={bullets}>
            <li>{t("assessment.listening")}</li>
            <li>{t("assessment.responses")}</li>
            <li>{t("assessment.language")}</li>
          </ul>
          <div>{sourceLink(assessmentUrl, t("assessment.source", { annex: 1, point: "3.40" }))}</div>
        </section>

        <section aria-labelledby="grade" className="flex flex-col gap-3">
          <h2 id="grade" tabIndex={-1} className="text-h2">
            {t("section.grade")}
          </h2>
          <p>{t("grade.oral")}</p>
          <p>{t("grade.holistic")}</p>
          <div>
            <p>{t("grade.scale")}</p>
            <ul
              role="list"
              aria-label={t("grade.scaleLabel")}
              dir="ltr"
              className="mbs-2 flex flex-wrap justify-end gap-2"
            >
              {grades.map((grade) => (
                <li key={grade} className="rounded-chip bg-surface-sunken px-3 py-1 text-label tabular-nums">
                  {grade === 2 || grade === 0
                    ? format.number(grade, "twoDigit")
                    : format.number(grade, "integer")}
                </li>
              ))}
            </ul>
            {sourceLink(gradeScaleUrl, t("grade.scaleSource"))}
          </div>
          <div>
            <p>
              {t.rich("grade.pass", {
                ...richTags,
                minimum: passAverage.format(2),
                belowMinimum: passAverage.format(1.9),
              })}
            </p>
            {sourceLink(examOrderUrl, t("grade.passSource"))}
          </div>
          <p className="font-semibold">{t("grade.noGrade")}</p>
        </section>

        {/* ABOUT §3.3 and §10: no notes; §10 addendum on §§27–29 and §51(4) for special arrangements. */}
        <section aria-labelledby="fits" className="flex flex-col gap-3">
          <h2 id="fits" tabIndex={-1} className="text-h2">
            {t("section.fits")}
          </h2>
          <p>{t("fits.body", { minutes: oralMinutes })}</p>
          <Link href="/guide" className={textLink}>
            {t("overview.title")}
          </Link>
          <InfoNote icon="notebook-text">
            <p>{t("fits.noNotes")}</p>
            {sourceLink(practicalNotesUrl, t("sources.practicalRules"))}
          </InfoNote>
          <div>
            <h3 className="text-h3">{t("fits.arrangementsTitle")}</h3>
            <p className="mbs-2">{t("fits.arrangements", { weeks: arrangementsDeadlineWeeks })}</p>
            <p className="mbs-2">
              {t.rich("fits.arrangementsTerm", {
                ...richTags,
                winterYear: arrangementsWinterYear,
                year: arrangementsNextTermYear,
              })}
            </p>
            <p className="mbs-2">{t("fits.arrangementsGrading")}</p>
            <div className="flex flex-wrap gap-x-4">
              {sourceLink(examOrderUrl, t("fits.arrangementsSource"))}
              {sourceLink(practicalArrangementsUrl, t("fits.practicalArrangementsSource"))}
            </div>
          </div>
        </section>

        {/* ABOUT §9: official candidate page and the latest public examiner booklet. */}
        <section aria-labelledby="sources" className="flex flex-col gap-2">
          <h2 id="sources" tabIndex={-1} className="text-h2">
            {t("section.sources")}
          </h2>
          <div className="flex flex-wrap gap-x-4">
            {sourceLink(candidateUrl, t("sources.candidate"))}
            {sourceLink(bookletUrl, t("sources.booklet"))}
          </div>
          <p className="text-caption text-text-muted">{t.rich("sources.independent", richTags)}</p>
        </section>

        <section aria-labelledby="guide-next" className="flex flex-col gap-3">
          <h2 id="guide-next" className="text-h2">
            {t("section.next")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/topics"
              className="flex items-center gap-2 rounded-card border border-border bg-surface-raised p-4 text-label text-accent min-block-touch hover:bg-surface-sunken"
            >
              <Icon name="library-big" />
              {t("next.topics")}
              <Icon name="arrow-right" size={16} className="ms-auto" />
            </Link>
            <Link
              href="/mock"
              className="flex items-center gap-2 rounded-card border border-border bg-surface-raised p-4 text-label text-accent min-block-touch hover:bg-surface-sunken"
            >
              <Icon name="mic" />
              {t("next.mock")}
              <Icon name="arrow-right" size={16} className="ms-auto" />
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
