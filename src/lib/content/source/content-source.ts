import type {
  ContentItem,
  ContentItemId,
  ExaminerLines,
  MockDeck,
  TopicSearchDocument,
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
} from "../schema/published";

export interface TopicFilter {
  themeId?: ThemeId;
  termId?: TermId;
}

export interface ContentSource {
  listThemes: () => Promise<ThemeSummary[]>;
  getTheme: (id: ThemeId) => Promise<Theme | null>;
  listTerms: () => Promise<TermSummary[]>;
  listTopics: (filter?: TopicFilter) => Promise<TopicSummary[]>;
  getTopic: (id: TopicId) => Promise<Topic | null>;
  listTopicIds: () => Promise<TopicId[]>;
  getExaminerLines: () => Promise<ExaminerLines>;
  getTopicLinks: (id: TopicId) => Promise<TopicLink[]>;
  getMockDeck: () => Promise<MockDeck>;
  getSearchIndex: () => Promise<TopicSearchDocument[]>;
  listSimilarQuestionGroups: () => Promise<SimilarGroup[]>;
  getContentItem: (id: ContentItemId) => Promise<ContentItem | null>;
}
