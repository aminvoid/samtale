import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { TermSummary, TopicSummary } from "@/lib/content/repository";
import { termsPath } from "./library-paths";
import { TermName } from "./term-name";
import { TopicListItem } from "./topic-list-item";

type TermGroupProps = {
  term: TermSummary;
  topics: readonly TopicSummary[];
  detail?: boolean;
};

export function TermGroup({ term, topics, detail }: TermGroupProps) {
  const headingId = `term-${term.id}`;
  return (
    <section aria-labelledby={detail ? undefined : headingId} className="mbs-4">
      {detail || (
        <h2 id={headingId} tabIndex={-1} className="text-h2">
          <Link
            href={`${termsPath}/${term.id}`}
            className="inline-flex items-center gap-2 rounded-control min-block-touch"
          >
            <TermName term={term} className="text-da-card text-text" />
            <Icon name="chevron-right" className="text-text-muted" />
          </Link>
        </h2>
      )}
      <ul className="mbs-2 grid grid-cols-1 gap-3 xl:grid-cols-3">
        {topics.map((topic) => (
          <li key={topic.id}>
            <TopicListItem topic={topic} groupedByTerm />
          </li>
        ))}
      </ul>
    </section>
  );
}
