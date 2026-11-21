import { getTranslations } from "next-intl/server";
import type { TermSummary, TopicSummary } from "@/lib/content/repository";
import { EraDivider } from "./era-divider";
import { LibraryProgress } from "./library-progress";
import { TermGroup } from "./term-group";
import { TermJumpList } from "./term-jump-list";

export async function TermsScreen({
  terms,
  topics,
}: {
  terms: readonly TermSummary[];
  topics: readonly TopicSummary[];
}) {
  const t = await getTranslations("library");
  if (terms.length === 0) return <p className="text-body text-text-muted">{t("empty")}</p>;
  const firstOlder = terms.findIndex(({ formatEraId }) => formatEraId === "pre-2023");

  return (
    <>
      <TermJumpList terms={terms} />
      <LibraryProgress>
        {terms.map((term, index) => (
          <div key={term.id}>
            {index === firstOlder && <EraDivider showCurrent={firstOlder > 0} />}
            <TermGroup term={term} topics={topics.filter(({ termId }) => termId === term.id)} />
          </div>
        ))}
      </LibraryProgress>
    </>
  );
}
