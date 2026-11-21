import type { ReactNode } from "react";
import type { TermSummary, Topic } from "@/lib/content/repository";
import { AnswerAloud } from "./answer-aloud";
import { AnswerDisclosure } from "./answer-disclosure";
import { KeywordList } from "./keyword-list";
import { StudyQuestion } from "./study-question";
import { StudyTopicLink, type StudyDestination } from "./study-topic-link";

export function StudySection({
  id,
  heading,
  topicId,
  section,
  terms,
  similar,
  children,
}: {
  id: "sitA" | "sitB" | "general";
  heading: ReactNode;
  topicId: string;
  section: Topic["general"];
  terms: ReadonlyMap<string, TermSummary>;
  similar: StudyDestination[];
  children?: ReactNode;
}) {
  const general = id === "general";
  const { question } = section;
  const template = general ? 2 : 1;
  const labelId = `${topicId}-${id}-label`;

  return (
    <section aria-labelledby={labelId} data-study-section={id} className="grid gap-4 min-inline-0">
      <h2 id={id} tabIndex={-1} data-keep-focus className="text-h2">
        <span id={labelId}>{heading}</span>
      </h2>
      {children}
      <StudyQuestion question={question} kind={general ? "second-question" : "first-question"} terms={terms}>
        {similar.length > 0 && (
          <ul role="list">
            {similar.map((destination) => (
              <li key={`${destination.topic.id}.${destination.link.toSection ?? ""}`}>
                <StudyTopicLink destination={destination} />
              </li>
            ))}
          </ul>
        )}
      </StudyQuestion>
      <div className="grid items-start gap-4 xl:grid-cols-5">
        <div className="min-inline-0 xl:col-span-3">
          <KeywordList keywords={question.keywords} template={template} />
        </div>
        <div className="min-inline-0 xl:col-span-2">
          <AnswerAloud topicId={topicId} itemId={question.id} primary />
        </div>
      </div>
      <AnswerDisclosure kind="model" item={question.modelAnswer} template={template} />
      {section.personalExamples.map((example) => (
        <AnswerDisclosure key={example.id} kind="example" item={example} />
      ))}
      {section.followups.map((followup) => (
        <StudyQuestion key={followup.id} question={followup} kind="followup" terms={terms}>
          <AnswerAloud topicId={topicId} itemId={followup.id} />
          <AnswerDisclosure kind="short" item={followup.answer} />
        </StudyQuestion>
      ))}
    </section>
  );
}
