import { useTranslations } from "next-intl";
import { TermLabel } from "@/components/ui/term-label";
import type { TopicSummary } from "@/lib/content/repository";

const danishYear = new Intl.NumberFormat("da-DK", { useGrouping: false });

type TermNameProps = {
  term: TopicSummary["term"];
  letter?: TopicSummary["letter"];
  className?: string;
};

export function TermName({ term, letter, className }: TermNameProps) {
  const t = useTranslations("library.term");
  const name = t.markup(term.session, { year: danishYear.format(term.year), da: (text) => text });
  return (
    <TermLabel className={className}>{letter ? t("withLetter", { term: name, letter }) : name}</TermLabel>
  );
}
