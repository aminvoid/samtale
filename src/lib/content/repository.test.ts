// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type * as Repository from "./repository";
import { MockDeckSchema, type ReadModel, type Topic } from "./schema/published";
import { normalizeSearchText } from "./search";

function topic(
  termId: string,
  year: number,
  session: Topic["term"]["session"],
  letter: Topic["letter"],
): Topic {
  const id = `${termId}-${letter.toLowerCase()}`;
  const title = { da: "Hjem", fa: "خانه" };
  function section(key: "sitA" | "sitB" | "general") {
    const sectionId = `${id}.${key}`;
    const questionId = `${sectionId}.q1`;
    return {
      id: sectionId,
      question: {
        id: questionId,
        text: title,
        verification: { status: "unchecked" },
        keywords: [],
        modelAnswer: {
          id: `${questionId}.answer`,
          text: { da: "Et eksempel." },
          emphasis: [],
          audio: { url: "/audio/fixture.mp3", durationMs: 400 },
        },
      },
      followups: [],
      personalExamples: [],
    } satisfies Topic["general"];
  }
  return {
    id,
    termId,
    term: { year, session },
    letter,
    title,
    themeId: year === 2024 ? "bolig" : "kultur",
    formatEraId: "from-2023",
    draft: true,
    sourcePages: [1],
    situations: [
      {
        ...section("sitA"),
        key: "A",
        title,
        intro: {
          id: `${id}.sitA.intro`,
          text: { da: "Et emne." },
          origin: "app",
          sourceLabel: { kind: "app" },
        },
      },
      {
        ...section("sitB"),
        key: "B",
        title,
        intro: {
          id: `${id}.sitB.intro`,
          text: { da: "Et emne." },
          origin: "app",
          sourceLabel: { kind: "app" },
        },
      },
    ],
    general: section("general"),
    links:
      letter === "A"
        ? [{ fromSection: "sitA", toTopicId: "2024-maj-b", toSection: "general", kind: "similar" }]
        : [],
    examinerAudio: [],
  };
}

const fixture: ReadModel = {
  readModelVersion: 1,
  channel: "preview",
  themes: [
    { id: "bolig", chapter: 1, emoji: "🏠", title: { da: "Bolig", fa: "خانه" }, subthemes: [] },
    { id: "kultur", chapter: 2, emoji: "🎨", title: { da: "Kultur", fa: "فرهنگ" }, subthemes: [] },
    { id: "klima", chapter: 3, emoji: "🌳", title: { da: "Klima", fa: "اقلیم" }, subthemes: [] },
  ],
  terms: [
    {
      id: "2024-maj",
      year: 2024,
      session: "maj",
      formatEraId: "from-2023",
      topicIds: ["2024-maj-a", "2024-maj-b", "2024-maj-c"],
    },
    { id: "2023-nov", year: 2023, session: "nov", formatEraId: "from-2023", topicIds: ["2023-nov-a"] },
  ],
  topics: [
    topic("2024-maj", 2024, "maj", "A"),
    topic("2024-maj", 2024, "maj", "B"),
    topic("2024-maj", 2024, "maj", "C"),
    topic("2023-nov", 2023, "nov", "A"),
  ],
  examinerLines: [
    { id: "examiner.thanks", role: "between-answers", text: { da: "Tak." }, placeholders: [], origin: "app" },
  ],
  similarGroups: [
    {
      id: "similar.1",
      members: [
        { topicId: "2024-maj-a", section: "sitA" },
        { topicId: "2024-maj-b", section: "general" },
      ],
    },
  ],
  searchIndex: [
    {
      topicId: "2024-maj-a",
      fields: [
        { section: null, kind: "topic-title", text: { da: "hjem", fa: "خانه" } },
        { section: "sitA", kind: "model-answer", text: { da: "eksempel", fa: "عبارت نمونه" } },
        { section: "general", kind: "followup-answer", text: { da: "et eksempel", fa: "مثال تکمیلی" } },
        { section: "sitB", kind: "personal-example", text: { da: "erfaring", fa: "نمونه شخصی" } },
      ],
    },
  ],
};

describe("published content repository", () => {
  let repository: typeof Repository;

  beforeAll(async () => {
    vi.doMock("@/generated/content/read-model.json", () => ({ default: fixture }));
    repository = await import("./repository");
  });

  afterAll(() => {
    vi.doUnmock("@/generated/content/read-model.json");
  });

  it("returns answer translation search text with the library's question labels", async () => {
    const [document] = await repository.getSearchIndex();
    expect(document?.fields).toEqual([
      { section: null, kind: "topic-title", text: { da: "hjem", fa: "خانه" } },
      { section: "sitA", kind: "question", text: { da: "eksempel", fa: "عبارت نمونه" } },
      { section: "general", kind: "followup", text: { da: "et eksempel", fa: "مثال تکمیلی" } },
      { section: "sitB", kind: "question", text: { da: "erfaring", fa: "نمونه شخصی" } },
    ]);
  });

  it("lists term and topic summaries newest first and supports combined filters", async () => {
    const { listTerms, listTopics, listTopicIds } = repository;
    expect((await listTerms()).map(({ id }) => id)).toEqual(["2024-maj", "2023-nov"]);
    expect(await listTopicIds()).toEqual(["2024-maj-a", "2024-maj-b", "2024-maj-c", "2023-nov-a"]);
    expect((await listTopics({ themeId: "bolig", termId: "2024-maj" })).map(({ id }) => id)).toEqual([
      "2024-maj-a",
      "2024-maj-b",
      "2024-maj-c",
    ]);
    expect(await listTopics({ themeId: "bolig", termId: "2023-nov" })).toEqual([]);
    expect((await listTopics())[0]).not.toHaveProperty("situations");
  });

  it("counts published topics per theme and resolves details by ID", async () => {
    const { listThemes, getTheme, getTopic } = repository;
    expect((await listThemes()).map(({ id, topicCount }) => [id, topicCount])).toEqual([
      ["bolig", 3],
      ["kultur", 1],
      ["klima", 0],
    ]);
    expect(await getTheme("bolig")).toMatchObject({ id: "bolig", subthemes: [] });
    expect(await getTheme("missing")).toBeNull();
    expect(await getTopic("2024-maj-a")).toMatchObject({ id: "2024-maj-a", sourcePages: [1] });
    expect(await getTopic("missing")).toBeNull();
  });

  it("returns examiner lines, structured links and similar groups", async () => {
    const { getExaminerLines, getTopicLinks, listSimilarQuestionGroups } = repository;
    expect(await getExaminerLines()).toEqual(fixture.examinerLines);
    expect(await getTopicLinks("2024-maj-a")).toEqual(fixture.topics[0]?.links);
    expect(await getTopicLinks("missing")).toEqual([]);
    expect(await listSimilarQuestionGroups()).toEqual(fixture.similarGroups);
  });

  it("keeps the mock deck compact and draws only from complete terms", async () => {
    const deck = await repository.getMockDeck();
    expect(MockDeckSchema.safeParse(deck).success).toBe(true);
    expect(deck.terms.map(({ id }) => id)).toEqual(["2024-maj"]);
    expect(deck.topics).toHaveLength(4);
    expect(JSON.stringify(deck)).not.toContain("Et eksempel.");
  });

  it("resolves audio-bearing content items and returns null for unknown IDs", async () => {
    expect(await repository.getContentItem("2024-maj-a.general.q1.answer")).toEqual({
      id: "2024-maj-a.general.q1.answer",
      topicId: "2024-maj-a",
      section: "general",
      kind: "model-answer",
      text: { da: "Et eksempel." },
      audio: { url: "/audio/fixture.mp3", durationMs: 400 },
    });
    expect(await repository.getContentItem("2024-maj-a.sitA.intro")).toMatchObject({
      kind: "intro",
      section: "sitA",
    });
    expect(await repository.getContentItem("2024-maj-a.missing")).toBeNull();
    expect(await repository.getContentItem("missing")).toBeNull();
  });

  it("keeps the shared snapshot intact when a caller edits its results", async () => {
    const terms = await repository.listTerms();
    terms.reverse();
    terms[0]?.topicIds.pop();
    expect(await repository.listTerms()).toEqual(fixture.terms);
  });
});

it("fails closed when the generated model has an unknown nested field", async () => {
  vi.resetModules();
  const themes = fixture.themes.map((theme) => ({ ...theme, title: { ...theme.title, unsupported: true } }));
  vi.doMock("@/generated/content/read-model.json", () => ({ default: { ...fixture, themes } }));
  try {
    await expect(import("./repository")).rejects.toThrow(/unsupported/);
  } finally {
    vi.doUnmock("@/generated/content/read-model.json");
  }
});

it("normalizes Danish case, Persian letter variants, diacritics and ZWNJ", () => {
  expect(normalizeSearchText("  SUNDHED  ")).toBe("sundhed");
  expect(normalizeSearchText("ÅBEN")).toBe("åben");
  expect(normalizeSearchText("كَار‌ي")).toBe("کار ی");
});
