import type { SearchDocument, TopicSummary } from "@/lib/content/repository";
import { normalizeSearchText } from "@/lib/content/search";

type SearchField = SearchDocument["fields"][number];
export type SearchMatch = Pick<SearchField, "section" | "kind">;

export function searchTopics(
  topics: readonly TopicSummary[],
  index: readonly SearchDocument[],
  query: string,
) {
  const tokens = normalizeSearchText(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return [];

  const matches = new Map<string, SearchMatch>();
  for (const { topicId, fields } of index) {
    const contains = ({ text }: SearchField, token: string) =>
      text.da.includes(token) ||
      text.fa.includes(token) ||
      (/\p{Script=Arabic}/u.test(token) && text.fa.replaceAll(" ", "").includes(token));

    // Mixed-script tokens may match different fields in the same topic.
    const fieldsByToken = tokens.map((token) => fields.find((field) => contains(field, token)));
    if (fieldsByToken.some((field) => field === undefined)) continue;

    const match = fields.find((field) => tokens.every((token) => contains(field, token))) ?? fieldsByToken[0];
    if (match) matches.set(topicId, { section: match.section, kind: match.kind });
  }

  return topics.flatMap((topic) => {
    const match = matches.get(topic.id);
    return match ? [{ topic, match }] : [];
  });
}
