import "server-only";
import generated from "@/generated/content/read-model.json";
import {
  ReadModelSchema,
  type ContentItem,
  type MockDeck,
  type QuestionSection,
  type Topic,
  type TopicSummary,
} from "../schema/published";
import type { ContentSource } from "./content-source";

const model = ReadModelSchema.parse(generated);
const topicsById = new Map(model.topics.map((topic) => [topic.id, topic]));
const themesById = new Map(model.themes.map((theme) => [theme.id, theme]));
const topicCounts = new Map<string, number>();
for (const { themeId } of model.topics) {
  topicCounts.set(themeId, (topicCounts.get(themeId) ?? 0) + 1);
}

function summarizeTopic({
  id,
  termId,
  term,
  letter,
  themeId,
  subthemeId,
  title,
  formatEraId,
  draft,
}: Topic): TopicSummary {
  return { id, termId, term, letter, themeId, subthemeId, title, formatEraId, draft };
}

type MockTopic = MockDeck["topics"][number];
type MockSection = MockTopic["general"];

function mockSection({ id, question, followups }: QuestionSection): MockSection {
  return {
    id,
    question: {
      id: question.id,
      text: question.text,
      audio: question.audio,
      verification: question.verification,
      keywords: question.keywords,
    },
    followups: followups.map(({ id, text, audio, verification }) => ({ id, text, audio, verification })),
  };
}

function mockTopics(topics: Topic[]): MockTopic[] {
  return topics.flatMap((topic) => {
    const [a, b] = topic.situations;
    if (a.intro === undefined || b.intro === undefined) return [];
    return [
      {
        ...summarizeTopic(topic),
        situations: [
          { ...mockSection(a), key: a.key, title: a.title, intro: a.intro },
          { ...mockSection(b), key: b.key, title: b.title, intro: b.intro },
        ],
        general: mockSection(topic.general),
        examinerAudio: topic.examinerAudio,
      },
    ];
  });
}

function getMockDeck(): MockDeck {
  const topics = mockTopics(model.topics);
  const readyIds = new Set(topics.map(({ id }) => id));
  const terms = model.terms
    .map((term) => ({ ...term, topicIds: term.topicIds.filter((id) => readyIds.has(id)) }))
    .filter(({ topicIds }) => topicIds.length === 3);
  return { terms, topics, examinerLines: model.examinerLines };
}

function findContentItem(topic: Topic, id: string): ContentItem | null {
  function sectionItems(section: ContentItem["section"], content: QuestionSection): ContentItem[] {
    function item(
      kind: ContentItem["kind"],
      { id, text, audio }: Pick<ContentItem, "id" | "text" | "audio">,
    ): ContentItem {
      return { id, topicId: topic.id, section, kind, text, audio };
    }
    const { question } = content;
    return [
      item("question", question),
      item("model-answer", question.modelAnswer),
      ...question.keywords.map((keyword) => item("keyword", keyword)),
      ...content.followups.flatMap((followup) => [
        item("followup", followup),
        item("followup-answer", followup.answer),
      ]),
      ...content.personalExamples.map((example) => item("personal-example", example)),
    ];
  }

  const items = [
    ...topic.situations.flatMap(({ key, intro, ...content }): ContentItem[] => {
      const section = key === "A" ? "sitA" : "sitB";
      const items = sectionItems(section, content);
      if (intro !== undefined) {
        items.push({
          id: intro.id,
          topicId: topic.id,
          section,
          kind: "intro",
          text: intro.text,
          audio: intro.audio,
        });
      }
      return items;
    }),
    ...sectionItems("general", topic.general),
  ];
  return items.find((item) => item.id === id) ?? null;
}

function result<T>(value: T): Promise<T> {
  // Callers can sort and shape their results without mutating the shared snapshot.
  return Promise.resolve(structuredClone(value));
}

export const fileSource: ContentSource = {
  listThemes: () =>
    result(
      model.themes.map(({ id, chapter, emoji, title }) => ({
        id,
        chapter,
        emoji,
        title,
        topicCount: topicCounts.get(id) ?? 0,
      })),
    ),
  getTheme: (id) => result(themesById.get(id) ?? null),
  listTerms: () => result(model.terms),
  listTopics: ({ themeId, termId } = {}) =>
    result(
      model.topics
        .filter(
          (topic) =>
            (themeId === undefined || topic.themeId === themeId) &&
            (termId === undefined || topic.termId === termId),
        )
        .map(summarizeTopic),
    ),
  getTopic: (id) => result(topicsById.get(id) ?? null),
  listTopicIds: () => Promise.resolve(model.topics.map(({ id }) => id)),
  getExaminerLines: () => result(model.examinerLines),
  getTopicLinks: (id) => result(topicsById.get(id)?.links ?? []),
  getMockDeck: () => result(getMockDeck()),
  getSearchIndex: () => result(model.searchIndex),
  listSimilarQuestionGroups: () => result(model.similarGroups),
  getContentItem: (id) => {
    const topic = topicsById.get(id.split(".", 1)[0] ?? "");
    return result(topic === undefined ? null : findContentItem(topic, id));
  },
};
