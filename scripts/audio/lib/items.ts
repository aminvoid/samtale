/**
 * Collects every audio-bearing item from the content files (schema proposal §10).
 * Only the fields audio needs are validated here; `content:validate` owns the full schema.
 */
import { z } from "zod";

export type VoiceRole = "examiner" | "model";

export interface AudioItem {
  id: string;
  role: VoiceRole;
  /** Display text (`text.da`), NFC. */
  text: string;
  /** Store word timings (ADR-0006 §2: answers, follow-up answers, personal examples). */
  words: boolean;
  kind: "intro" | "question" | "keyword" | "answer" | "followup" | "followupAnswer" | "example" | "examinerLine";
  topicId?: string;
}

const da = z.object({ da: z.string().min(1) });
const withText = z.object({ id: z.string().min(1), text: da });

const questionSchema = withText.extend({
  keywords: z.array(withText).default([]),
  modelAnswer: withText.optional(),
});
const followupSchema = withText.extend({ answer: withText.optional() });
const sectionSchema = z.object({
  id: z.string(),
  question: questionSchema,
  followups: z.array(followupSchema).default([]),
  personalExamples: z.array(withText).default([]),
});
export const topicSchema = z.object({
  id: z.string().min(1),
  title: da,
  situations: z.array(sectionSchema.extend({ intro: withText.optional() })),
  general: sectionSchema,
});
export const examinerLinesSchema = z.object({
  lines: z.array(z.object({ id: z.string().min(1), text: da, placeholders: z.array(z.string()).default([]) })),
});

export type Topic = z.infer<typeof topicSchema>;
export type ExaminerLines = z.infer<typeof examinerLinesSchema>;

export interface CollectOptions {
  keywords: boolean;
}

function sectionItems(section: z.infer<typeof sectionSchema>, topicId: string, opts: CollectOptions): AudioItem[] {
  const items: AudioItem[] = [];
  const q = section.question;
  items.push({ id: q.id, role: "examiner", text: q.text.da, words: false, kind: "question", topicId });
  if (opts.keywords) {
    for (const kw of q.keywords) items.push({ id: kw.id, role: "model", text: kw.text.da, words: false, kind: "keyword", topicId });
  }
  if (q.modelAnswer) {
    items.push({ id: q.modelAnswer.id, role: "model", text: q.modelAnswer.text.da, words: true, kind: "answer", topicId });
  }
  for (const f of section.followups) {
    items.push({ id: f.id, role: "examiner", text: f.text.da, words: false, kind: "followup", topicId });
    if (f.answer) {
      items.push({ id: f.answer.id, role: "model", text: f.answer.text.da, words: true, kind: "followupAnswer", topicId });
    }
  }
  for (const ex of section.personalExamples) {
    items.push({ id: ex.id, role: "model", text: ex.text.da, words: true, kind: "example", topicId });
  }
  return items;
}

export function collectTopicItems(topic: Topic, lines: ExaminerLines, opts: CollectOptions): AudioItem[] {
  const items: AudioItem[] = [];
  for (const line of lines.lines) {
    if (!line.placeholders.includes("topic")) continue;
    items.push({
      id: `${line.id}:${topic.id}`,
      role: "examiner",
      text: line.text.da.replaceAll("{topic}", topic.title.da),
      words: false,
      kind: "examinerLine",
      topicId: topic.id,
    });
  }
  for (const sit of topic.situations) {
    if (sit.intro) items.push({ id: sit.intro.id, role: "examiner", text: sit.intro.text.da, words: false, kind: "intro", topicId: topic.id });
    items.push(...sectionItems(sit, topic.id, opts));
  }
  items.push(...sectionItems(topic.general, topic.id, opts));
  return items;
}

export function collectSharedLines(lines: ExaminerLines): AudioItem[] {
  return lines.lines
    .filter((l) => l.placeholders.length === 0)
    .map((l): AudioItem => ({ id: l.id, role: "examiner", text: l.text.da, words: false, kind: "examinerLine" }));
}

/** App-owned lines that aren't in content/ yet (e.g. the C13 sound check from the exam config). */
export interface ExtraLine {
  id: string;
  text: string;
}

export function collectItems(
  topics: readonly Topic[],
  lines: ExaminerLines,
  opts: CollectOptions,
  extra: readonly ExtraLine[] = [],
): AudioItem[] {
  const items: AudioItem[] = [
    ...extra.map((l): AudioItem => ({ id: l.id, role: "examiner", text: l.text, words: false, kind: "examinerLine" })),
    ...collectSharedLines(lines),
    ...topics.flatMap((t) => collectTopicItems(t, lines, opts)),
  ];
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new Error(`Duplicate audio item id ${item.id}`);
    seen.add(item.id);
    if (item.text !== item.text.normalize("NFC")) throw new Error(`Text of ${item.id} is not NFC`);
    if (/\{\w+\}/.test(item.text)) throw new Error(`Unfilled placeholder in ${item.id}`);
  }
  return items;
}
