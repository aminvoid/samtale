import { useFormatter, useLocale, useTranslations } from "next-intl";
import { DanishText } from "@/components/ui/danish-text";
import { ExternalLink } from "@/components/ui/external-link";
import { InfoNote } from "@/components/ui/info-note";
import { SourceLabel } from "@/components/ui/source-label";
import { StepList } from "@/components/ui/step-list";
import { Timeline } from "@/components/ui/timeline";
import { numberingSystemFor } from "@/i18n/config";
import { richTags } from "@/i18n/rich-tags";
import { AudioPlayerProvider } from "@/lib/audio/player";
import { conversationMinutes, lookSeconds, practicalDrawUrl, sourceEditionYear } from "./exam-facts";
import { ExaminerLinePlayback } from "./examiner-line-playback";
import type { GuideExaminerLine, GuideExaminerLines } from "./examiner-lines";

export function ExamSequence({ lines }: { lines: GuideExaminerLines }) {
  const t = useTranslations("guide");
  const format = useFormatter();
  const locale = useLocale();
  const duration = new Intl.NumberFormat(locale, { numberingSystem: numberingSystemFor(locale) });

  function source(line: GuideExaminerLine) {
    return line.origin === "siri" ? (
      <SourceLabel variant="siri">
        {t.rich("lines.siri", { ...richTags, year: sourceEditionYear })}
      </SourceLabel>
    ) : (
      <SourceLabel variant="app-from-siri">{t.rich("lines.app", richTags)}</SourceLabel>
    );
  }

  // ABOUT §3.4 and §10. Review Q2–Q3: the picture instruction and closing are from SIRI,
  // the transition exemplifies an instruction to the examiner, and the app uses text cards.
  const steps = [
    {
      key: "draw",
      body: (
        <div>
          <p>{t.rich("steps.draw", richTags)}</p>
          <ExternalLink
            href={practicalDrawUrl}
            label={t("sources.external", { label: t("sources.practicalRules") })}
          >
            {t("sources.practicalRules")}
          </ExternalLink>
        </div>
      ),
    },
    {
      key: "look",
      body: (
        <div className="flex flex-col gap-3">
          <p>{t.rich("steps.look", { ...richTags, seconds: lookSeconds })}</p>
          <ExaminerLinePlayback
            line={lines.intro}
            heading={t("lines.intro")}
            meaning={t("lines.introMeaning", {
              topic: lines.exampleTopic ?? t("lines.topicPlaceholder"),
              seconds: lookSeconds,
            })}
            source={source(lines.intro)}
          />
          <InfoNote variant="compact">{t("steps.pictures")}</InfoNote>
        </div>
      ),
    },
    { key: "first", body: t.rich("steps.first", richTags) },
    { key: "first-follow-up", body: t("steps.followFirst") },
    {
      key: "second",
      body: (
        <div className="flex flex-col gap-3">
          <p>{t.rich("steps.second", richTags)}</p>
          <ExaminerLinePlayback
            line={lines.transition}
            heading={t("lines.transition")}
            meaning={t("lines.transitionMeaning")}
            source={source(lines.transition)}
          />
          <InfoNote variant="compact">{t.rich("steps.listenFor", richTags)}</InfoNote>
        </div>
      ),
    },
    { key: "second-follow-up", body: t("steps.followSecond") },
    {
      key: "close",
      body: (
        <div className="flex flex-col gap-3">
          <p>{t("steps.close")}</p>
          <ExaminerLinePlayback
            line={lines.closing}
            heading={t("lines.closing")}
            meaning={t("lines.closingMeaning")}
            source={source(lines.closing)}
          />
        </div>
      ),
    },
  ];

  // ABOUT §3.4, review Q1: only the look time and the total conversation time are specified.
  const segments = [
    { key: "draw", label: t("timeline.draw") },
    { key: "look", label: t("timeline.look"), detail: t("timeline.lookTime", { seconds: lookSeconds }) },
    {
      key: "conversation",
      label: t("timeline.questions"),
      detail: t("timeline.questionsTime", {
        minutes: duration.format(conversationMinutes),
      }),
      emphasized: true,
    },
    {
      key: "close",
      label: t("timeline.close"),
      detail: (
        <>
          <DanishText as="p" className="text-da-line">
            {lines.closing.text}
          </DanishText>
          <p lang="fa">{t("lines.closingMeaning")}</p>
        </>
      ),
    },
  ];

  return (
    <>
      <section aria-labelledby="steps">
        <h2 id="steps" tabIndex={-1} className="mbe-4 text-h2">
          {t("section.steps")}
        </h2>
        <AudioPlayerProvider>
          <StepList
            steps={steps.map((step, index) => ({ ...step, number: format.number(index + 1, "integer") }))}
          />
        </AudioPlayerProvider>
      </section>
      <section aria-labelledby="timeline" className="flex flex-col gap-3">
        <h2 id="timeline" tabIndex={-1} className="text-h2">
          {t("section.timeline")}
        </h2>
        <Timeline segments={segments} />
        <p>{t.rich("timeline.unsplit", richTags)}</p>
        {/* ABOUT §§3.4 and 6: picture description was removed from the May–June 2023 term. */}
        <InfoNote>{t("timeline.noDescription", { year: 2023 })}</InfoNote>
      </section>
    </>
  );
}
