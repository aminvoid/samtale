import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Pre2023Badge } from "@/components/ui/pre2023-badge";
import { LibraryProgress } from "@/features/topic-library/library-progress";
import { termsPath } from "@/features/topic-library/library-paths";
import { ListInfoButton } from "@/features/topic-library/list-info-button";
import { TermGroup } from "@/features/topic-library/term-group";
import { TermJumpList } from "@/features/topic-library/term-jump-list";
import { TermName } from "@/components/ui/term-name";
import { orderTopics, publishedTerms } from "@/features/topic-library/topic-order";
import { listTerms, listTopics } from "@/lib/content/repository";

export async function generateStaticParams() {
  return publishedTerms(await listTerms()).map(({ id }) => ({ termId: id }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/topics/terms/[termId]">) {
  const { termId } = await params;
  const [terms, t] = await Promise.all([listTerms(), getTranslations("library.term")]);
  const term = terms.find(({ id }) => id === termId);
  return {
    title: term
      ? t.markup(term.session, {
          year: new Intl.NumberFormat("da-DK", { useGrouping: false }).format(term.year),
          da: (text) => text,
        })
      : undefined,
  };
}

export default async function TermPage({ params }: PageProps<"/[locale]/topics/terms/[termId]">) {
  const { termId } = await params;
  const [allTerms, topics, t] = await Promise.all([
    listTerms(),
    listTopics({ termId }),
    getTranslations("library"),
  ]);
  const terms = publishedTerms(allTerms);
  const term = terms.find(({ id }) => id === termId);
  if (term === undefined || topics.length === 0) notFound();

  return (
    <>
      <PageHeader
        back={<BackLink href={termsPath}>{t("view.terms")}</BackLink>}
        title={<TermName term={term} className="text-h1 text-text" />}
      />
      {term.formatEraId === "pre-2023" && (
        <div className="mbs-2">
          <Pre2023Badge>{t("olderShort")}</Pre2023Badge>
          <ListInfoButton />
        </div>
      )}
      <div className="mbs-4">
        <TermJumpList terms={terms} currentTerm={term.id} />
        <LibraryProgress>
          <TermGroup term={term} topics={orderTopics(topics)} detail />
        </LibraryProgress>
      </div>
    </>
  );
}
