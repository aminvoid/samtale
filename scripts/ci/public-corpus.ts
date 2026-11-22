import { z } from "zod";
import {
  BilingualTextSchema,
  DanishTextSchema,
  PersianTextSchema,
} from "../../src/lib/content/schema/published.ts";
import { normalizeSearchText } from "../../src/lib/content/search.ts";
import { readOfficialSiriUrl } from "../content/build-read-model.ts";

// The authoring fields that contribute prose to the read model. Each object strips extra
// keys, including unpublished locales, review data and spoken overrides.
const bilingual = BilingualTextSchema.strip();
const danishItem = z.object({ text: DanishTextSchema.strip() });
const bilingualItem = z.object({ text: bilingual });
const verificationSource = {
  sourceRef: z
    .object({ document: z.string(), pages: z.array(z.number().int().positive()).min(1) })
    .optional(),
  sourceDisplay: z
    .discriminatedUnion("availability", [
      z.object({ availability: z.literal("official"), title: z.string() }),
      z.object({ availability: z.literal("third-party-copy"), title: z.string(), note: z.string() }),
    ])
    .optional(),
};
const prompt = bilingualItem.extend({
  siriCheck: z
    .discriminatedUnion("status", [
      z.object({ status: z.literal("unchecked") }),
      z.object({ status: z.literal("matches"), ...verificationSource }),
      z.object({
        status: z.literal("differs"),
        ...verificationSource,
        siriParts: z.array(z.string()).min(1),
      }),
    ])
    .optional(),
});
const section = z.object({
  question: prompt.extend({
    keywords: z.array(bilingualItem.extend({ emoji: z.string() })),
    modelAnswer: danishItem,
  }),
  followups: z.array(prompt.extend({ answer: danishItem })),
  personalExamples: z.array(danishItem.extend({ label: PersianTextSchema.strip() })),
});
export const publishedTopicText = z.object({
  title: bilingual,
  situations: z.array(section.extend({ title: bilingual, intro: danishItem.optional() })),
  general: section,
});

const themeTitle = z.object({ title: bilingual });
export const publicTextFiles = {
  "themes.json": z.object({ themes: z.array(themeTitle.extend({ subthemes: z.array(themeTitle) })) }),
  "examiner-lines.json": z.object({ lines: z.array(danishItem) }),
};

// Extract verification separately so the generic string collector skips references and other input metadata.
export function publicTopicText(raw: unknown, officialUrls: Map<string, string>, root: string) {
  const { title, situations, general } = publishedTopicText.parse(raw);

  function projectPrompt<T extends z.infer<typeof prompt>>({ siriCheck, ...item }: T) {
    if (siriCheck === undefined || siriCheck.status === "unchecked") return item;
    const { sourceDisplay, sourceRef } = siriCheck;
    if (sourceDisplay === undefined || sourceRef === undefined) return item;
    let source: string;
    if (sourceDisplay.availability === "official") {
      source = officialUrls.get(sourceRef.document) ?? readOfficialSiriUrl(root, sourceRef.document);
      officialUrls.set(sourceRef.document, source);
    } else {
      source = sourceDisplay.note;
    }
    return {
      ...item,
      verificationText: [
        sourceDisplay.title,
        source,
        ...(siriCheck.status === "differs" ? [siriCheck.siriParts.join(" ")] : []),
      ],
    };
  }

  function projectSection<T extends z.infer<typeof section>>(input: T) {
    return {
      ...input,
      question: projectPrompt(input.question),
      followups: input.followups.map((followup) => projectPrompt(followup)),
    };
  }

  return { title, situations: situations.map(projectSection), general: projectSection(general) };
}

export function searchIndexText(topic: z.infer<typeof publishedTopicText>): string[] {
  const sections = [...topic.situations, topic.general];
  const fields = [
    topic.title,
    ...topic.situations.map(({ title }) => title),
    ...sections.flatMap(({ question, followups }) => [
      question.text,
      ...question.keywords.map(({ text }) => text),
      ...followups.map(({ text }) => text),
    ]),
  ];
  return fields.flatMap(({ da, fa }) => [normalizeSearchText(da), normalizeSearchText(fa)]);
}

/**
 * The item IDs of a topic (`2020-nov-c.general.followup1.answer`). They're public: the read model,
 * the audio manifest and URLs carry them. Without them, an internal record whose own ID contains
 * one (a ledger correction `2020-nov-c.da-general.followup1.answer`) yields a canary window that
 * matches every topic page. The `review` subtree is skipped, since it's internal.
 */
export function publicItemIds(raw: unknown): string[] {
  const ids: string[] = [];
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
    } else if (value !== null && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        if (key === "review") continue;
        if (key === "id" && typeof child === "string") ids.push(child);
        else walk(child);
      }
    }
  };
  walk(raw);
  return ids;
}
