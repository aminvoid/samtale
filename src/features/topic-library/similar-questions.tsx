import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { DanishText } from "@/components/ui/danish-text";
import { Icon } from "@/components/ui/icon";
import { InfoNote } from "@/components/ui/info-note";
import { PersianText } from "@/components/ui/persian-text";
import { Link } from "@/i18n/navigation";
import { richTags } from "@/i18n/rich-tags";
import { getTopic, type SimilarGroup, type Topic, type TopicSummary } from "@/lib/content/repository";
import { themesPath, topicHref } from "./library-paths";
import { TermName } from "./term-name";

type SimilarQuestionsProps = {
  groups: readonly SimilarGroup[];
  topics: readonly TopicSummary[];
};

function questionFor(topic: Topic, section: SimilarGroup["members"][number]["section"]) {
  if (section === null) return topic.title;
  if (section === "general") return topic.general.question.text;
  const key = section === "sitA" ? "A" : "B";
  return topic.situations.find((situation) => situation.key === key)?.question.text ?? topic.title;
}

export async function SimilarQuestions({ groups, topics }: SimilarQuestionsProps) {
  const t = await getTranslations("library");
  const byId = new Map(topics.map((topic) => [topic.id, topic]));
  const rows = await Promise.all(
    groups.map(async ({ id, members }) => {
      const occurrences = members.flatMap(({ topicId, section }) => {
        const topic = byId.get(topicId);
        return topic === undefined ? [] : [{ topic, section }];
      });
      // The public repository provides section references. Use the first published question verbatim.
      const representative = occurrences.find(({ section }) => section !== null) ?? occurrences[0];
      if (representative === undefined) return null;
      const topic = await getTopic(representative.topic.id);
      if (topic === null) return null;
      return { id, occurrences, heading: questionFor(topic, representative.section) };
    }),
  );
  const visible = rows.filter((row) => row !== null);

  return (
    <>
      <p className="text-body max-inline-reading">{t("similar.intro", { start: 2016, end: 2024 })}</p>
      <InfoNote className="mbs-3 max-inline-reading">
        {t.rich("similar.confidentialityNote", {
          ...richTags,
          year: 2024,
          term: () => <TermName term={{ year: 2024, session: "maj" }} />,
        })}
      </InfoNote>
      {visible.length === 0 ? (
        <div className="mbs-4">
          <p>{t("similar.empty")}</p>
          <Link href={themesPath} className="inline-flex items-center text-accent underline min-block-touch">
            {t("search.browseInstead")}
          </Link>
        </div>
      ) : (
        <ul className="mbs-6 grid grid-cols-1 gap-3">
          {visible.map(({ id, heading, occurrences }) => (
            <li key={id}>
              <Card className="grid grid-cols-1 gap-3 xl:grid-cols-5 xl:gap-6">
                <div className="xl:col-span-2">
                  <DanishText as="p" className="text-align-flow text-da-card">
                    {heading.da}
                  </DanishText>
                  <PersianText as="p" className="text-ui text-text-muted">
                    {heading.fa}
                  </PersianText>
                </div>
                <ul className="grid grid-cols-1 content-start md:grid-cols-2 md:gap-x-4 xl:col-span-3">
                  {occurrences.map(({ topic, section }) => (
                    <li key={topicHref(topic.id, section)} className="border-bs border-border">
                      <Link
                        href={topicHref(topic.id, section)}
                        prefetch={false}
                        className="flex items-center justify-between gap-2 rounded-control px-2 py-1 text-ui text-accent min-block-touch hover:underline"
                      >
                        {section === null ? (
                          <TermName term={topic.term} letter={topic.letter} />
                        ) : (
                          <span>
                            {t.rich("similar.occurrence", {
                              term: () => <TermName term={topic.term} letter={topic.letter} />,
                              part: () => t.rich(`part.${section}`, richTags),
                            })}
                          </span>
                        )}
                        <Icon name="chevron-right" size={16} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
