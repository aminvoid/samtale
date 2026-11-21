import { z } from "zod";
import {
  BilingualTextSchema,
  DanishTextSchema,
  PersianTextSchema,
} from "../../src/lib/content/schema/published.ts";
import { normalizeSearchText } from "../../src/lib/content/search.ts";

// The authoring fields that contribute prose to the read model. Each object strips extra
// keys, including unpublished locales, verification details, review data and spoken overrides.
const bilingual = BilingualTextSchema.strip();
const danishItem = z.object({ text: DanishTextSchema.strip() });
const bilingualItem = z.object({ text: bilingual });
const section = z.object({
  question: bilingualItem.extend({
    keywords: z.array(bilingualItem.extend({ emoji: z.string() })),
    modelAnswer: danishItem,
  }),
  followups: z.array(bilingualItem.extend({ answer: danishItem })),
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
