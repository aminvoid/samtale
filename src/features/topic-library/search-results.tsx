import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { LiveRegion } from "@/components/ui/live-region";
import { Link } from "@/i18n/navigation";
import { richTags } from "@/i18n/rich-tags";
import type { SearchDocument, TopicSummary } from "@/lib/content/repository";
import { themesPath, topicHref } from "./library-paths";
import { LibraryProgress } from "./library-progress";
import { ListInfoButton } from "./list-info-button";
import { searchTopics, type SearchMatch } from "./search-topics";
import { TopicListItem } from "./topic-list-item";

type SearchResultsProps = {
  topics: readonly TopicSummary[];
  index: readonly SearchDocument[];
  query: string;
};

const matchLabel = {
  "topic-title": "topicTitle",
  "situation-title": "situationTitle",
  question: "question",
  followup: "followup",
  keyword: "keyword",
} satisfies Record<
  SearchMatch["kind"],
  "topicTitle" | "situationTitle" | "question" | "followup" | "keyword"
>;

export function SearchResults({ topics, index, query }: SearchResultsProps) {
  const t = useTranslations("library");
  const search = useTranslations("library.search");
  const results = searchTopics(topics, index, query);
  const count = search("count", { count: results.length });

  function renderMatch({ section, kind }: SearchMatch) {
    if (section === null) return search("topicTitle");
    if (section === "general" && kind === "question") return search("generalQuestion");
    return search.rich(matchLabel[kind], {
      part: () => t.rich(`part.${section}`, richTags),
    });
  }

  return (
    <>
      <LiveRegion>{query ? count : null}</LiveRegion>
      {query && (
        <section aria-labelledby="search-results-heading">
          <h2 id="search-results-heading" className="text-label text-text-muted" data-numeric>
            {count}
          </h2>
          {results.some(({ topic }) => topic.formatEraId === "pre-2023") && <ListInfoButton />}
          {results.length === 0 ? (
            <div className="mbs-3">
              <p>{search.rich("noResults", { query, isolate: (chunks) => <bdi>{chunks}</bdi> })}</p>
              <Link
                href={themesPath}
                className="inline-flex items-center text-accent underline min-block-touch"
              >
                {search("browseInstead")}
              </Link>
            </div>
          ) : (
            <LibraryProgress>
              <ul className="mbs-3 grid grid-cols-1 gap-3 max-inline-reading">
                {results.map(({ topic, match }) => {
                  const label = search.rich("matchedIn", { part: () => renderMatch(match) });
                  return (
                    <li key={topic.id}>
                      <TopicListItem topic={topic} />
                      <div className="flex items-center gap-2 ps-4 text-caption text-text-muted min-block-touch">
                        <Icon name="search" size={16} />
                        {match.section === null ? (
                          label
                        ) : (
                          <Link
                            href={topicHref(topic.id, match.section)}
                            prefetch={false}
                            className="inline-flex items-center text-accent underline min-block-touch"
                          >
                            {label}
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </LibraryProgress>
          )}
        </section>
      )}
    </>
  );
}
