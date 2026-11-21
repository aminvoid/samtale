import type { TermSummary, TopicSummary } from "@/lib/content/repository";

export function newestTermFirst(left: string, right: string) {
  return right.localeCompare(left);
}

export function orderTopics(topics: readonly TopicSummary[]) {
  return [...topics].sort((a, b) => newestTermFirst(a.termId, b.termId) || a.letter.localeCompare(b.letter));
}

export function publishedTerms(terms: readonly TermSummary[]) {
  return terms.filter(({ topicIds }) => topicIds.length > 0).sort((a, b) => newestTermFirst(a.id, b.id));
}
