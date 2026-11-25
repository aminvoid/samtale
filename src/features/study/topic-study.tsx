import { useFormatter, useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import { BackLink } from "@/components/ui/back-link";
import { DanishText } from "@/components/ui/danish-text";
import { Icon } from "@/components/ui/icon";
import { InfoNote } from "@/components/ui/info-note";
import { PersianText } from "@/components/ui/persian-text";
import { Pre2023Badge } from "@/components/ui/pre2023-badge";
import { TermName } from "@/components/ui/term-name";
import { Link } from "@/i18n/navigation";
import { AudioPlayerProvider } from "@/lib/audio/player";
import type { TermSummary, Theme, Topic } from "@/lib/content/repository";
import { AnswerAloudProvider } from "./answer-aloud";
import type { SpeakingQuestion } from "./answer-aloud-panel";
import { ExaminerIntro } from "./examiner-intro";
import { RememberAudioRate } from "./remember-audio-rate";
import { ShareTopic } from "./share-topic";
import { SituationCard } from "./situation-card";
import { StudySection } from "./study-section";
import { StudySectionNav } from "./study-section-nav";
import { StudyTopicLink, type StudyDestination } from "./study-topic-link";
import { StudyVisit } from "./study-visit";

const mockLinkStyle =
  "inline-flex items-center justify-center gap-2 rounded-control border border-border-strong bg-surface-raised px-4 py-2 text-ui font-semibold min-block-touch hover:bg-surface-sunken";

export function TopicStudy({
  topic,
  theme,
  terms,
  destinations,
}: {
  topic: Topic;
  theme: Theme | null;
  terms: TermSummary[];
  destinations: StudyDestination[];
}) {
  const t = useTranslations("study");
  const library = useTranslations("library");
  const format = useFormatter();
  const related = destinations.filter(({ link }) => link.kind === "related");
  const similar = destinations.filter(({ link }) => link.kind === "similar");
  const topicSimilar = similar.filter(({ link }) => link.fromSection === null);
  const termsById = new Map(terms.map((term) => [term.id, term]));
  const mockHref = `/mock/practice?topic=${encodeURIComponent(topic.id)}`;
  const [a, b] = topic.situations;
  const letterA = () => <DanishText as="bdi">{a.key}</DanishText>;
  const letterB = () => <DanishText as="bdi">{b.key}</DanishText>;
  const sitA = t.rich("sitA", { letter: letterA });
  const sitB = t.rich("sitB", { letter: letterB });
  const navigation: ComponentProps<typeof StudySectionNav>["entries"] = [
    { id: "sitA", label: sitA, compactLabel: letterA() },
    { id: "sitB", label: sitB, compactLabel: letterB() },
    { id: "general", label: t("general") },
  ];
  if (related.length > 0) navigation.push({ id: "related", label: t("related") });
  const pages = format.list(topic.sourcePages.map((page) => format.number(page, "integer")));

  const speakingQuestions = [a, b, topic.general].flatMap<SpeakingQuestion>((section) => {
    const situation = section === a ? a.key : section === b ? b.key : undefined;
    const { question, followups } = section;
    return [
      {
        id: question.id,
        audio: question.audio,
        text: question.text,
        role: situation === undefined ? "second-question" : "first-question",
        situation,
        keywords: question.keywords,
        model: question.modelAnswer,
      },
      ...followups.map(({ id, audio, text, answer }) => ({
        id,
        audio,
        text,
        model: answer,
        role: "followup" as const,
        situation,
      })),
    ];
  });

  return (
    <AudioPlayerProvider>
      <RememberAudioRate />
      <article data-study-topic className="grid gap-6">
        <header className="grid gap-3 max-inline-reading xl:max-inline-none">
          <div className="justify-self-start">
            <BackLink href={theme === null ? "/topics" : `/topics/themes/${theme.id}`}>
              {theme === null ? (
                library("view.themes")
              ) : (
                <PersianText className="text-ui">{theme.title.fa}</PersianText>
              )}
            </BackLink>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid gap-1 min-inline-0">
              <h1 tabIndex={-1} className="text-h1">
                <DanishText className="block text-align-flow text-da-title wrap-anywhere">
                  {topic.title.da}
                </DanishText>
              </h1>
              <PersianText as="p" className="text-lead text-text-muted">
                {topic.title.fa}
              </PersianText>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <Link href={mockHref} className={mockLinkStyle}>
                <Icon name="messages-square" />
                {t("practiseMock")}
              </Link>
              <ShareTopic />
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <TermName term={topic.term} letter={topic.letter} variant="chip" />
            {theme !== null && (
              <PersianText className="text-caption text-text-muted">{theme.title.fa}</PersianText>
            )}
            {topic.formatEraId === "pre-2023" && (
              <Pre2023Badge
                variant="explained"
                explanationLabel={library("olderInfo")}
                explanation={library("olderExplanation")}
              >
                {library("olderShort")}
              </Pre2023Badge>
            )}
          </div>
          <div className="max-inline-reading">
            <StudyVisit topicId={topic.id}>
              <div className="grid gap-2 px-2 pbe-1 text-body">
                <p>{t("layoutBody")}</p>
                <p>{t("layoutVariation")}</p>
              </div>
            </StudyVisit>
          </div>
        </header>

        <div className="xl:grid xl:grid-cols-[var(--container-study-nav)_minmax(0,var(--container-reading))] xl:gap-12">
          <StudySectionNav entries={navigation} mockHref={mockHref} />
          <div className="mx-auto mbs-4 grid gap-10 inline-full max-inline-reading min-inline-0 xl:mbs-0">
            <AnswerAloudProvider topicId={topic.id} questions={speakingQuestions}>
              <StudySection
                id="sitA"
                heading={sitA}
                topicId={topic.id}
                section={a}
                terms={termsById}
                similar={similar.filter(({ link }) => link.fromSection === "sitA")}
              >
                <SituationCard situation={a} themeId={topic.themeId} />
                {a.intro && <ExaminerIntro intro={a.intro} terms={termsById} />}
              </StudySection>
              <StudySection
                id="sitB"
                heading={sitB}
                topicId={topic.id}
                section={b}
                terms={termsById}
                similar={similar.filter(({ link }) => link.fromSection === "sitB")}
              >
                <SituationCard situation={b} themeId={topic.themeId} />
                {b.intro && <ExaminerIntro intro={b.intro} terms={termsById} />}
              </StudySection>
              <StudySection
                id="general"
                heading={t("generalHeading")}
                topicId={topic.id}
                section={topic.general}
                terms={termsById}
                similar={similar.filter(({ link }) => link.fromSection === "general")}
              >
                <InfoNote variant="compact">
                  {t.rich("generalNote", {
                    da: (word) => <DanishText as="bdi">{word}</DanishText>,
                  })}
                </InfoNote>
              </StudySection>
            </AnswerAloudProvider>
            {topicSimilar.length > 0 && (
              <section aria-labelledby={`${topic.id}-similar`} className="grid gap-2">
                <h2 id={`${topic.id}-similar`} className="text-h2">
                  {library("view.similar")}
                </h2>
                <ul role="list">
                  {topicSimilar.map((destination) => (
                    <li key={`${destination.topic.id}.${destination.link.toSection ?? ""}`}>
                      <StudyTopicLink destination={destination} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {related.length > 0 && (
              <section aria-labelledby={`${topic.id}-related-label`} className="grid gap-3">
                <h2 id="related" tabIndex={-1} data-keep-focus className="text-h2">
                  <span id={`${topic.id}-related-label`}>{t("related")}</span>
                </h2>
                <ul role="list" className="grid gap-2">
                  {related.map((destination) => (
                    <li key={`${destination.topic.id}.${destination.link.toSection ?? ""}`}>
                      <StudyTopicLink destination={destination} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <footer className="grid justify-items-start gap-3 border-bs border-border pbs-4">
              <Link href={mockHref} className={mockLinkStyle}>
                <Icon name="messages-square" />
                {t("practiseMock")}
              </Link>
              {topic.sourcePages.length > 0 && (
                <p className="text-caption text-text-muted">
                  {t("credit", { count: topic.sourcePages.length, pages })}
                </p>
              )}
              <Link
                href="/about#report"
                className="inline-flex items-center text-caption text-accent underline min-block-touch"
              >
                {t("report")}
              </Link>
            </footer>
          </div>
        </div>
      </article>
    </AudioPlayerProvider>
  );
}
