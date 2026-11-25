/** Project the authoring files into the published contract (ADR-0002). */
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { manifestSchema } from "../../src/lib/audio/manifest-schema.ts";
import { ReviewStatusSchema, SCHEMA_VERSION } from "../../src/lib/content/schema/authoring.ts";
import {
  BilingualTextSchema,
  DanishTextSchema,
  ExaminerLineSchema,
  OfficialSourceUrlSchema,
  PersianTextSchema,
  ReadModelSchema,
  SectionKindSchema,
  TermSchema,
  TextRangeSchema,
  TopicSummarySchema,
  type AudioRef,
  type QuestionSection,
  type ReadModel,
  type SearchDocument,
  type SimilarGroup,
  type Topic,
  type Verification,
} from "../../src/lib/content/schema/published.ts";
import { normalizeSearchText } from "../../src/lib/content/search.ts";
import { parseBuildEnv, type BuildEnv } from "../../src/lib/env/schema.ts";
import { sha256 } from "../audio/lib/hash.ts";
import { publishedAnswerTranslation } from "./lib/answer-translations.ts";
import { scanForConfidentiality } from "./lib/confidentiality.ts";
import {
  AnswerTranslationsFileSchema,
  ItemDecisionSchema,
  ReviewLedgerSchema,
  type AnswerTranslation,
} from "./lib/pipeline-schema.ts";

// Read only the input fields used by the projection. z.object strips extra keys at every level.
const id = z.string().min(1);
const version = { schemaVersion: z.literal(SCHEMA_VERSION) };
const status = z.object({ status: ReviewStatusSchema });
const sourceRef = z.object({ document: id });
const checkedInput = {
  sourceRef: sourceRef.extend({ pages: z.array(z.number().int().positive()).min(1).optional() }).optional(),
  checkedOn: z.iso.date().optional(),
  sourceDisplay: z
    .discriminatedUnion("availability", [
      z.object({ title: id, availability: z.literal("official") }),
      z.object({ title: id, availability: z.literal("third-party-copy"), note: id }),
    ])
    .optional(),
};
const verificationInput = z.discriminatedUnion("status", [
  z.object({ status: z.literal("unchecked") }),
  z.object({ status: z.literal("matches"), ...checkedInput }),
  z.object({ status: z.literal("differs"), ...checkedInput, siriParts: z.array(id).min(1) }),
]);
const officialDocument = z.object({
  document: z.object({ authenticity: z.literal("official"), url: OfficialSourceUrlSchema }),
});
const danishItem = z.object({ id, text: DanishTextSchema.strip() });
const bilingualItem = z.object({ id, text: BilingualTextSchema.strip() });
const prompt = bilingualItem.extend({ siriCheck: verificationInput });
const range = z.object(TextRangeSchema.shape);
const answer = danishItem.extend({ emphasis: z.array(range) });
const section = z.object({
  id,
  question: prompt.extend({
    keywords: z.array(bilingualItem.extend({ emoji: z.string() })),
    modelAnswer: answer,
  }),
  followups: z.array(prompt.extend({ answer: danishItem.extend({ emphasis: z.array(range).optional() }) })),
  personalExamples: z.array(danishItem.extend({ label: PersianTextSchema.strip() })),
});
const situation = section.extend({
  key: z.enum(["A", "B"]),
  title: BilingualTextSchema.strip(),
  intro: danishItem
    .extend({
      origin: ExaminerLineSchema.shape.origin,
      sourceRef: sourceRef.optional(),
      review: status,
    })
    .optional(),
});
const topicHeader = z.object({ ...version, review: status });
const topicInput = z.object({
  id: TopicSummarySchema.shape.id,
  termId: TopicSummarySchema.shape.termId,
  letter: TopicSummarySchema.shape.letter,
  themeId: id,
  subthemeId: id.optional(),
  title: BilingualTextSchema.strip(),
  source: z.object({ pages: z.array(z.number().int()) }),
  situations: z.tuple([situation, situation]),
  general: section,
});
const themesInput = z.object({
  ...version,
  themes: z.array(
    z.object({
      id,
      chapter: z.number().int(),
      emoji: z.string(),
      title: BilingualTextSchema.strip(),
      subthemes: z.array(z.object({ id, title: BilingualTextSchema.strip() })),
    }),
  ),
});
const termsInput = z.object({
  ...version,
  terms: z.array(
    z.object({ ...TermSchema.shape, formatEraId: id, topicIds: z.array(TopicSummarySchema.shape.id) }),
  ),
});
const linesInput = z.object({
  ...version,
  lines: z.array(
    danishItem.extend({
      role: ExaminerLineSchema.shape.role,
      placeholders: ExaminerLineSchema.shape.placeholders,
      origin: ExaminerLineSchema.shape.origin,
    }),
  ),
});
const topicRef = z.object({ topicId: TopicSummarySchema.shape.id, section: SectionKindSchema.nullable() });
const linksInput = z.object({
  ...version,
  links: z.array(z.object({ from: topicRef, to: topicRef, kind: z.enum(["similar", "related"]) })),
  similarGroups: z.array(z.object({ id, members: z.array(topicRef) })),
});
// Only the translation statuses are needed by the production projection.
const translationDecisionsInput = z.object({
  schemaVersion: ReviewLedgerSchema.shape.schemaVersion,
  answerTranslations: z.record(id, ItemDecisionSchema.pick({ status: true }).strip()).optional(),
});

type BuildOptions = Pick<BuildEnv, "CONTENT_RELEASE" | "AUDIO_BASE_URL">;
type AudioFor = (itemId: string, textDa: string, includeWords?: boolean) => AudioRef | undefined;
type Verify = (check: z.infer<typeof verificationInput>, itemId: string) => Verification;
type TranslationFor = (
  itemId: string,
  da: string,
) => { translation: Pick<AnswerTranslation, "fa" | "origin"> } | undefined;
const LATEST_PUBLIC_TERM = "2024-maj";

function readJson(path: string): unknown {
  if (lstatSync(path, { throwIfNoEntry: false })?.isFile() !== true) {
    throw new Error(`Expected a regular content input file at ${path}.`);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function requireDirectory(path: string): void {
  if (lstatSync(path, { throwIfNoEntry: false })?.isDirectory() !== true) {
    throw new Error(`Expected a content input directory at ${path}.`);
  }
}

function createTranslationLookup(
  contentDir: string,
  channel: BuildOptions["CONTENT_RELEASE"],
): TranslationFor {
  const { items } = AnswerTranslationsFileSchema.parse(
    readJson(join(contentDir, "answer-translations.json")),
  );
  const translations = new Map(Object.entries(items));
  const decisions = new Map(
    channel === "production" && translations.size > 0
      ? Object.entries(
          translationDecisionsInput.parse(readJson(join(contentDir, "review-ledger.json")))
            .answerTranslations ?? {},
        )
      : [],
  );
  return (id, da) => {
    const translation = publishedAnswerTranslation(translations.get(id), da, decisions.get(id), channel);
    return translation === undefined ? undefined : { translation };
  };
}

function createAudioLookup(root: string, options: BuildOptions) {
  const audioDir = join(root, "audio");
  const manifestPath = join(audioDir, "manifest.json");
  const clipsDir = join(audioDir, "clips");
  const audioDirectory = lstatSync(audioDir, { throwIfNoEntry: false });
  if (audioDirectory !== undefined) requireDirectory(audioDir);
  const manifest = lstatSync(manifestPath, { throwIfNoEntry: false });
  if (manifest === undefined && options.CONTENT_RELEASE === "production") {
    throw new Error("Production content requires audio/manifest.json and matching clips.");
  }
  const entries = new Map(
    manifest === undefined ? [] : Object.entries(manifestSchema.parse(readJson(manifestPath)).entries),
  );
  const clips = new Set<string>();
  const missing: string[] = [];
  const baseUrl = options.AUDIO_BASE_URL.replace(/\/+$/, "");
  const hasClipsDir = lstatSync(clipsDir, { throwIfNoEntry: false })?.isDirectory() === true;

  const audioFor: AudioFor = (itemId, textDa, includeWords = false) => {
    const entry = entries.get(itemId);
    if (entry !== undefined && entry.textSha256 === sha256(textDa)) {
      const filename = `${entry.hash}.mp3`;
      if (hasClipsDir && lstatSync(join(clipsDir, filename), { throwIfNoEntry: false })?.isFile() === true) {
        clips.add(filename);
        return {
          url: `${baseUrl}/${filename}`,
          durationMs: entry.durationMs,
          words: includeWords
            ? entry.words?.map(([start, end, from, to]) => [start, end, from, to])
            : undefined,
        };
      }
    }
    missing.push(itemId);
    return undefined;
  };

  return { audioFor, clips, clipsDir, missing };
}

function siriTermId(document: string | undefined): string {
  const termId = document?.match(/^siri-(\d{4}-(?:maj|nov))$/)?.[1];
  if (termId === undefined || termId > LATEST_PUBLIC_TERM) {
    throw new Error("Expected a SIRI source term in the public exam period.");
  }
  return termId;
}

export function readOfficialSiriUrl(root: string, document: string): string {
  const termId = siriTermId(document);
  return officialDocument.parse(readJson(join(root, "scripts/content/data", `siri-${termId}.json`))).document
    .url;
}

function createVerificationProjector(root: string): Verify {
  const urls = new Map<string, string>();

  function officialUrl(document: string) {
    const url = urls.get(document) ?? readOfficialSiriUrl(root, document);
    urls.set(document, url);
    return url;
  }

  return (check, itemId) => {
    if (check.status === "unchecked") return { status: "unchecked" };
    if (check.checkedOn === undefined) throw new Error(`Missing verification date for ${itemId}.`);
    const document = check.sourceRef?.document;
    const checked = { sourceTermId: siriTermId(document), checkedOn: check.checkedOn };
    const pages = check.sourceRef?.pages;
    const display = check.sourceDisplay;
    if (document === undefined || pages === undefined || display === undefined) {
      if (check.status === "differs") throw new Error(`Missing verification source details for ${itemId}.`);
      return { status: "matches", ...checked };
    }

    const { availability, title } = display;
    const sourceDisplay =
      availability === "official"
        ? { availability, title, pages, url: officialUrl(document) }
        : { availability, title, pages, note: display.note };

    return check.status === "differs"
      ? { status: "differs", ...checked, sourceDisplay, alternative: { da: check.siriParts.join(" ") } }
      : { status: "matches", ...checked, sourceDisplay };
  };
}

function projectSection(
  input: z.infer<typeof section>,
  audioFor: AudioFor,
  verify: Verify,
  translationFor: TranslationFor,
): QuestionSection {
  const { question } = input;
  const projectBilingual = ({ id, text }: z.infer<typeof bilingualItem>) => ({
    id,
    text: { da: text.da, fa: text.fa },
    audio: audioFor(id, text.da),
  });
  const projectDanish = ({ id, text }: z.infer<typeof danishItem>) => ({
    id,
    text: { da: text.da },
    audio: audioFor(id, text.da, true),
    ...translationFor(id, text.da),
  });
  const projectAnswer = ({ id, text, emphasis }: z.infer<typeof answer>) => ({
    ...projectDanish({ id, text }),
    emphasis: emphasis.map(({ start, end }) => ({ start, end })),
  });

  return {
    id: input.id,
    question: {
      ...projectBilingual(question),
      verification: verify(question.siriCheck, question.id),
      keywords: question.keywords.map((keyword) => ({ ...projectBilingual(keyword), emoji: keyword.emoji })),
      modelAnswer: projectAnswer(question.modelAnswer),
    },
    followups: input.followups.map((followup) => ({
      ...projectBilingual(followup),
      verification: verify(followup.siriCheck, followup.id),
      answer: projectAnswer({ ...followup.answer, emphasis: followup.answer.emphasis ?? [] }),
    })),
    personalExamples: input.personalExamples.map((example) => ({
      ...projectDanish(example),
      label: { fa: example.label.fa },
      perspective: "nurse",
    })),
  };
}

function projectSituation(
  input: z.infer<typeof situation>,
  audioFor: AudioFor,
  verify: Verify,
  translationFor: TranslationFor,
  production: boolean,
): Topic["situations"][number] {
  const { intro } = input;
  if (production && intro?.review.status !== "approved") {
    throw new Error(`Production requires an approved intro for ${input.id}.`);
  }

  return {
    ...projectSection(input, audioFor, verify, translationFor),
    key: input.key,
    title: { da: input.title.da, fa: input.title.fa },
    intro:
      intro === undefined
        ? undefined
        : {
            id: intro.id,
            text: { da: intro.text.da },
            origin: intro.origin,
            sourceLabel:
              intro.origin === "siri"
                ? { kind: "siri", termId: siriTermId(intro.sourceRef?.document) }
                : { kind: "app" },
            audio: audioFor(intro.id, intro.text.da),
          },
  };
}

function indexTopic(topic: Topic): SearchDocument {
  const fields: SearchDocument["fields"] = [];
  function add(
    section: SearchDocument["fields"][number]["section"],
    kind: SearchDocument["fields"][number]["kind"],
    text: Topic["title"],
  ) {
    fields.push({
      section,
      kind,
      text: { da: normalizeSearchText(text.da), fa: normalizeSearchText(text.fa) },
    });
  }
  function addSection(section: "sitA" | "sitB" | "general", content: QuestionSection) {
    function addTranslation(
      kind: "model-answer" | "followup-answer" | "personal-example",
      { text, translation }: Pick<QuestionSection["question"]["modelAnswer"], "text" | "translation">,
    ) {
      if (translation !== undefined) add(section, kind, { da: text.da, fa: translation.fa });
    }
    add(section, "question", content.question.text);
    for (const followup of content.followups) add(section, "followup", followup.text);
    for (const keyword of content.question.keywords) add(section, "keyword", keyword.text);
    addTranslation("model-answer", content.question.modelAnswer);
    for (const { answer } of content.followups) addTranslation("followup-answer", answer);
    for (const example of content.personalExamples) addTranslation("personal-example", example);
  }

  add(null, "topic-title", topic.title);
  for (const situation of topic.situations) {
    const section = situation.key === "A" ? "sitA" : "sitB";
    add(section, "situation-title", situation.title);
    addSection(section, situation);
  }
  addSection("general", topic.general);
  return { topicId: topic.id, fields };
}

function linksForTopic(
  topicId: string,
  authored: z.infer<typeof linksInput>["links"],
  groups: SimilarGroup[],
): Topic["links"] {
  const links: Topic["links"] = authored
    .filter(({ from }) => from.topicId === topicId)
    .map(({ from, to, kind }) => ({
      fromSection: from.section,
      toTopicId: to.topicId,
      toSection: to.section,
      kind,
    }));
  for (const { members } of groups) {
    for (const from of members.filter((member) => member.topicId === topicId)) {
      for (const to of members.filter((member) => member.topicId !== topicId)) {
        links.push({
          fromSection: from.section,
          toTopicId: to.topicId,
          toSection: to.section,
          kind: "similar",
        });
      }
    }
  }
  return [...new Map(links.map((link) => [JSON.stringify(link), link])).values()];
}

export function buildReadModel(root: string, options: BuildOptions): ReadModel {
  const production = options.CONTENT_RELEASE === "production";
  const contentDir = join(root, "content");
  const topicsDir = join(contentDir, "topics");
  requireDirectory(contentDir);
  requireDirectory(topicsDir);
  const inputs = readdirSync(topicsDir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .flatMap((file) => {
      const raw = readJson(join(topicsDir, file));
      const { review } = topicHeader.parse(raw);
      return production && review.status !== "approved" ? [] : [topicInput.parse(raw)];
    });
  if (production && inputs.length === 0) throw new Error("Production content has zero approved topics.");

  const publishedIds = new Set(inputs.map(({ id }) => id));
  if (publishedIds.size !== inputs.length) throw new Error("Duplicate published topic IDs.");
  const { audioFor, clips, clipsDir, missing } = createAudioLookup(root, options);
  const verify = createVerificationProjector(root);
  const translationFor = createTranslationLookup(contentDir, options.CONTENT_RELEASE);
  const themes: ReadModel["themes"] = themesInput
    .parse(readJson(join(contentDir, "themes.json")))
    .themes.map(({ id, chapter, emoji, title, subthemes }) => ({
      id,
      chapter,
      emoji,
      title: { da: title.da, fa: title.fa },
      subthemes: subthemes.map(({ id, title }) => ({ id, title: { da: title.da, fa: title.fa } })),
    }));
  const terms: ReadModel["terms"] = termsInput
    .parse(readJson(join(contentDir, "terms.json")))
    .terms.map(({ id, year, session, formatEraId, topicIds }) => {
      if (id !== `${String(year)}-${session}` || id > LATEST_PUBLIC_TERM) {
        throw new Error(`Expected a consistent term from the public exam period: ${id}.`);
      }
      return {
        id,
        year,
        session,
        formatEraId,
        topicIds: topicIds.filter((id) => publishedIds.has(id)).sort(),
      };
    })
    .sort((a, b) => b.year - a.year || Number(b.session === "nov") - Number(a.session === "nov"));
  const termById = new Map(terms.map((term) => [term.id, term]));
  const termOrder = new Map(terms.map((term, i) => [term.id, i]));
  const themeById = new Map(themes.map((theme) => [theme.id, theme]));
  const examinerLines: ReadModel["examinerLines"] = linesInput
    .parse(readJson(join(contentDir, "examiner-lines.json")))
    .lines.map(({ id, text, origin, role, placeholders }) => ({
      id,
      role,
      text: { da: text.da },
      origin,
      placeholders: [...placeholders],
      audio: placeholders.length === 0 ? audioFor(id, text.da) : undefined,
    }));
  const { links, similarGroups } = linksInput.parse(readJson(join(contentDir, "topic-links.json")));
  const topicLinks = links.filter(
    ({ from, to }) => publishedIds.has(from.topicId) && publishedIds.has(to.topicId),
  );
  const publishedGroups = similarGroups.flatMap(({ id, members }) => {
    const published = members.filter(({ topicId }) => publishedIds.has(topicId));
    return published.length === 0
      ? []
      : [{ id, members: published.map(({ topicId, section }) => ({ topicId, section })) }];
  });

  const topics: Topic[] = inputs.map((input) => {
    const term = termById.get(input.termId);
    if (
      term === undefined ||
      term.topicIds.indexOf(input.id) < 0 ||
      input.id !== `${term.id}-${input.letter.toLowerCase()}`
    ) {
      throw new Error(`Missing term membership for ${input.id}.`);
    }
    const theme = themeById.get(input.themeId);
    if (
      theme === undefined ||
      (input.subthemeId !== undefined && theme.subthemes.every(({ id }) => id !== input.subthemeId))
    ) {
      throw new Error(`Missing theme membership for ${input.id}.`);
    }
    const [a, b] = input.situations;
    return {
      id: input.id,
      termId: term.id,
      term: { year: term.year, session: term.session },
      letter: input.letter,
      themeId: input.themeId,
      subthemeId: input.subthemeId,
      title: { da: input.title.da, fa: input.title.fa },
      formatEraId: term.formatEraId,
      draft: production ? undefined : true,
      sourcePages: [...input.source.pages],
      situations: [
        projectSituation(a, audioFor, verify, translationFor, production),
        projectSituation(b, audioFor, verify, translationFor, production),
      ],
      general: projectSection(input.general, audioFor, verify, translationFor),
      links: linksForTopic(input.id, topicLinks, publishedGroups),
      examinerAudio: examinerLines.flatMap((line) => {
        if (line.placeholders.length === 0) return [];
        const audio = audioFor(`${line.id}:${input.id}`, line.text.da.replaceAll("{topic}", input.title.da));
        return audio === undefined ? [] : [{ lineId: line.id, audio }];
      }),
    };
  });
  topics.sort(
    (a, b) =>
      (termOrder.get(a.termId) ?? 0) - (termOrder.get(b.termId) ?? 0) ||
      (a.letter < b.letter ? -1 : Number(a.letter > b.letter)),
  );

  const model: ReadModel = {
    readModelVersion: 1,
    channel: options.CONTENT_RELEASE,
    themes,
    terms,
    topics,
    examinerLines,
    similarGroups: publishedGroups,
    searchIndex: topics.map(indexTopic),
  };
  ReadModelSchema.parse(model);
  const hits = scanForConfidentiality(model);
  if (hits.length > 0) {
    throw new Error(
      `Published content failed the confidentiality check at ${hits.map(({ path }) => path).join(", ")}.`,
    );
  }
  if (missing.length > 0) {
    const summary = `${String(missing.length)} audio items missing or stale (first: ${missing[0] ?? ""}).`;
    if (production) throw new Error(`Production content requires matching audio. ${summary}`);
    process.stderr.write(`content:build [preview]: ${summary} Affected items will be text-only.\n`);
  }

  const outDir = join(root, "src/generated/content");
  const publicDir = join(root, "public");
  mkdirSync(outDir, { recursive: true });
  mkdirSync(publicDir, { recursive: true });
  const stage = mkdtempSync(join(outDir, ".build-"));
  try {
    const stagedAudio = join(stage, "audio");
    mkdirSync(stagedAudio);
    for (const filename of clips) copyFileSync(join(clipsDir, filename), join(stagedAudio, filename));
    const stagedModel = join(stage, "read-model.json");
    writeFileSync(stagedModel, `${JSON.stringify(model, null, 2)}\n`);

    const publishedAudio = join(publicDir, "audio");
    rmSync(publishedAudio, { recursive: true, force: true });
    renameSync(stagedAudio, publishedAudio);
    renameSync(stagedModel, join(outDir, "read-model.json"));
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
  return model;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const env = parseBuildEnv(process.env);
  const { topics } = buildReadModel(resolve(import.meta.dirname, "../.."), env);
  process.stdout.write(`content:build [${env.CONTENT_RELEASE}]: ${String(topics.length)} topics\n`);
}
