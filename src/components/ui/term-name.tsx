import { useTranslations } from "next-intl";
import type { TopicSummary } from "@/lib/content/repository";
import { TermLabel } from "./term-label";

const danishYear = new Intl.NumberFormat("da-DK", { useGrouping: false });

type TermNameProps = {
  term: TopicSummary["term"];
  letter?: TopicSummary["letter"];
  className?: string;
  variant?: "inline" | "chip";
};

export function TermName({ term, letter, className, variant }: TermNameProps) {
  const t = useTranslations("library.term");
  const name = t.markup(term.session, { year: danishYear.format(term.year), da: (text) => text });
  return (
    <TermLabel className={className} variant={variant}>
      {letter ? t("withLetter", { term: name, letter }) : name}
    </TermLabel>
  );
}
