/** Async, storage-agnostic access to published content (ADR-0002). */
import "server-only";
import { fileSource } from "./source/file-source";

export type {
  ContentItem,
  ContentItemId,
  ExaminerLines,
  MockDeck,
  TopicSearchDocument as SearchDocument,
  SimilarGroup,
  TermId,
  TermSummary,
  Theme,
  ThemeId,
  ThemeSummary,
  Topic,
  TopicId,
  TopicLink,
  TopicSummary,
} from "./schema/published";
export type { TopicFilter } from "./source/content-source";

export const {
  listThemes,
  getTheme,
  listTerms,
  listTopics,
  getTopic,
  listTopicIds,
  getExaminerLines,
  getTopicLinks,
  getMockDeck,
  getSearchIndex,
  listSimilarQuestionGroups,
  getContentItem,
} = fileSource;
