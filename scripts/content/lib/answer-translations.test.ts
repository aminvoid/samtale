// @vitest-environment node
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SCHEMA_VERSION, TopicFileSchema } from "@/lib/content/schema/authoring";
import { answerItemsOf, translationSourceHash } from "./answer-translations";
import { AnswerTranslationsFileSchema, ReviewLedgerSchema, type ItemDecision } from "./pipeline-schema";
import { validateContent } from "./validate";

const content = resolve(import.meta.dirname, "../../../content");
const topic = TopicFileSchema.parse(
  JSON.parse(readFileSync(join(content, "topics/2024-maj-b.json"), "utf8")),
);
const answers = answerItemsOf(topic);
const modelAnswer = topic.general.question.modelAnswer;
const example = { fa: "عبارت ویژه", sourceHash: translationSourceHash(modelAnswer.text.da!), origin: "app" };
const file = (items: Record<string, unknown>) => ({ schemaVersion: SCHEMA_VERSION, items });
const approval = { status: "approved", reviewedBy: "fixture", reviewedOn: "2026-11-25" } as const;

describe("answer translations schema and source hash", () => {
  it("accepts the current version and strict app-authored records", () => {
    expect(AnswerTranslationsFileSchema.parse(file({}))).toEqual(file({}));
    const valid = file({ [modelAnswer.id]: example });
    expect(AnswerTranslationsFileSchema.parse(valid)).toEqual(valid);
    for (const invalid of [
      { ...valid, schemaVersion: SCHEMA_VERSION + 1 },
      { ...valid, extra: true },
      file({ [modelAnswer.id]: { ...example, review: approval } }),
      file({ [modelAnswer.id]: { ...example, origin: "siri" } }),
      file({ [modelAnswer.id]: { ...example, sourceHash: "xyz" } }),
      file({ [modelAnswer.id]: { ...example, fa: "" } }),
    ]) {
      expect(AnswerTranslationsFileSchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("accepts an optional map of strict ledger item decisions", () => {
    const ledger = { schemaVersion: SCHEMA_VERSION, topics: {} };
    expect(ReviewLedgerSchema.parse(ledger)).toEqual(ledger);
    const valid = { ...ledger, answerTranslations: { [modelAnswer.id]: approval } };
    expect(ReviewLedgerSchema.parse(valid)).toEqual(valid);
    expect(
      ReviewLedgerSchema.safeParse({
        ...valid,
        answerTranslations: { [modelAnswer.id]: { ...approval, sourceHash: example.sourceHash } },
      }).success,
    ).toBe(false);
  });

  it("hashes UTF-8 NFC text without altering whitespace or case", () => {
    expect(translationSourceHash("blå")).toBe("f10944f4633d8e2c");
    expect(translationSourceHash("bla\u030a")).toBe("f10944f4633d8e2c");
    expect(translationSourceHash(" blå ")).toBe("c04f1b368149d305");
    expect(translationSourceHash("Blå\n")).toBe("ec1104d99217da94");
  });
});

describe("answer translation validation", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "pd3-translation-validation-"));
    for (const path of [
      "topics",
      "themes.json",
      "terms.json",
      "examiner-lines.json",
      "topic-links.json",
      "published-ids.json",
      "internal",
    ]) {
      cpSync(join(content, path), join(root, path), { recursive: true });
    }
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function validate(items: Record<string, unknown>, answerTranslations?: Record<string, ItemDecision>) {
    writeFileSync(join(root, "answer-translations.json"), `${JSON.stringify(file(items))}\n`);
    return validateContent(root, {
      ledger: { schemaVersion: SCHEMA_VERSION, topics: {}, answerTranslations },
    });
  }

  it("resolves all answer kinds and reports item coverage", () => {
    const ids = [
      modelAnswer.id,
      topic.general.followups[0]!.answer.id,
      topic.situations[0]!.personalExamples[0]!.id,
    ];
    const items = Object.fromEntries(
      answers
        .filter(({ id }) => ids.includes(id))
        .map(({ id, text }) => [
          id,
          {
            ...example,
            sourceHash: translationSourceHash(text.da!),
          },
        ]),
    );
    const result = validate(items, { [modelAnswer.id]: approval });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.report).toContain(
      "answer translations: 313 total, 3 translated, 1 approved, 0 stale, 310 missing",
    );
  });

  it("rejects a translation for an existing non-answer item ID", () => {
    const id = topic.general.question.id;
    expect(validate({ [id]: example }).errors).toEqual([
      `answer-translations.json items.${id}: unknown answer ID or missing Danish text`,
    ]);
  });

  it.each([
    ["", /schema.*fa/],
    ["۲۳", /has no Persian letters/],
    ["کتاب و كلمه‌ي", /Arabic kaf.*\n.*Arabic yeh/],
    ["متن ﺍ", /presentation form/],
    ["امتحان", /uses «امتحان»/],
    ["جواب", /uses «جواب»/],
  ])("rejects invalid Persian text %j", (fa, error) => {
    const result = validate({ [modelAnswer.id]: { ...example, fa } });
    expect(result.errors.join("\n")).toMatch(error);
  });

  it("warns about stale drafts and fails on stale approvals", () => {
    const items = { [modelAnswer.id]: { ...example, sourceHash: translationSourceHash("Tidligere tekst") } };
    const draft = validate(items);
    expect(draft.errors).toEqual([]);
    expect(draft.warnings).toEqual([expect.stringContaining("stale translation")]);
    expect(draft.report).toContain(
      "answer translations: 313 total, 1 translated, 0 approved, 1 stale, 312 missing",
    );
    const approved = validate(items, { [modelAnswer.id]: approval });
    expect(approved.errors).toEqual([expect.stringContaining("approved but stale translation")]);
    expect(approved.warnings).toEqual([]);
  });

  it("rejects ledger entries with no corresponding translation", () => {
    expect(validate({}, { [modelAnswer.id]: approval }).errors).toEqual([
      `review-ledger.json answerTranslations.${modelAnswer.id}: unknown answer translation ID`,
    ]);
  });
});
