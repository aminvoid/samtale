import { useTranslations } from "next-intl";
import { Disclosure } from "@/components/ui/disclosure";
import { SourceLabel } from "@/components/ui/source-label";
import { TermName } from "@/components/ui/term-name";
import { richTags } from "@/i18n/rich-tags";
import type { TermSummary, Topic } from "@/lib/content/repository";

type VerificationNoteProps = {
  verification: Topic["general"]["question"]["verification"];
  sourceTerm?: TermSummary;
  followup?: boolean;
};

export function VerificationNote({ verification, sourceTerm, followup = false }: VerificationNoteProps) {
  const t = useTranslations("study.sources");
  if (verification.status === "unchecked") {
    return <SourceLabel variant="booklet">{t.rich("unchecked", richTags)}</SourceLabel>;
  }

  const matches = verification.status === "matches";
  const term = sourceTerm === undefined ? undefined : <TermName term={sourceTerm} />;
  const label = matches
    ? followup
      ? term === undefined
        ? t.rich("suggested", richTags)
        : t.rich("suggestedWithTerm", { ...richTags, term: () => term })
      : t("official")
    : t("booklet");

  return (
    <div>
      <SourceLabel variant={matches ? "siri" : "booklet"}>{label}</SourceLabel>
      <Disclosure label={t.rich(matches ? "details" : "differs", richTags)}>
        <div className="grid gap-1 rounded-control bg-surface-sunken px-4 py-3 text-caption text-text-muted">
          {term !== undefined && <p>{t.rich("sourceTerm", { ...richTags, term: () => term })}</p>}
          <p>{t("checkedOn", { date: new Date(`${verification.checkedOn}T12:00:00Z`) })}</p>
          {!matches && <p>{t.rich("versionUnavailable", richTags)}</p>}
        </div>
      </Disclosure>
    </div>
  );
}
