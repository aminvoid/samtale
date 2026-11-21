import { useTranslations } from "next-intl";
import type { TopicSummary } from "@/lib/content/repository";
import { LibraryProgress } from "./library-progress";
import { ListInfoButton } from "./list-info-button";
import { TopicListItem } from "./topic-list-item";

export function TopicList({ topics }: { topics: readonly TopicSummary[] }) {
  const t = useTranslations("library");
  return (
    <section aria-labelledby="theme-topics">
      <h2 id="theme-topics" className="text-h2">
        {t("topicsHeading")}
      </h2>
      {topics.some((topic) => topic.formatEraId === "pre-2023") && <ListInfoButton />}
      {topics.length === 0 ? (
        <p className="mbs-3 text-body text-text-muted">{t("filter.empty")}</p>
      ) : (
        <LibraryProgress>
          <ul className="mbs-3 grid grid-cols-1 gap-3">
            {topics.map((topic) => (
              <li key={topic.id}>
                <TopicListItem topic={topic} />
              </li>
            ))}
          </ul>
        </LibraryProgress>
      )}
    </section>
  );
}
