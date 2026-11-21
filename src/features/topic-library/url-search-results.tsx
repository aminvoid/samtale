"use client";

import { useSearchParams } from "next/navigation";
import type { SearchDocument, TopicSummary } from "@/lib/content/repository";
import { SearchResults } from "./search-results";

export function UrlSearchResults({
  topics,
  index,
}: {
  topics: readonly TopicSummary[];
  index: readonly SearchDocument[];
}) {
  const params = useSearchParams();
  return <SearchResults topics={topics} index={index} query={params.get("q")?.trim() ?? ""} />;
}
