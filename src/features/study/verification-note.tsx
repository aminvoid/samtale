import { useFormatter, useTranslations } from "next-intl";
import { DanishText } from "@/components/ui/danish-text";
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
  const format = useFormatter();
  if (verification.status === "unchecked") {
    return <SourceLabel variant="booklet">{t.rich("unchecked", richTags)}</SourceLabel>;
  }

  const matches = verification.status === "matches";
  const source = verification.sourceDisplay;
  const officialMatch = matches && source?.availability !== "third-party-copy";
  const term = sourceTerm === undefined ? undefined : <TermName term={sourceTerm} />;
  const label = officialMatch
    ? followup
      ? term === undefined
        ? t.rich("suggested", richTags)
        : t.rich("suggestedWithTerm", { ...richTags, term: () => term })
      : t("official")
    : t("booklet");

  return (
    <div>
      <SourceLabel variant={officialMatch ? "siri" : "booklet"}>{label}</SourceLabel>
      <Disclosure label={t.rich(matches ? "details" : "differs", richTags)}>
        <div className="grid gap-1 rounded-control bg-surface-sunken px-4 py-3 text-caption text-text-muted">
          {verification.status === "differs" && (
            <DanishText as="blockquote" className="text-da-followup wrap-anywhere text-text">
              {verification.alternative.da}
            </DanishText>
          )}
          {source === undefined ? (
            term !== undefined && <p>{t.rich("sourceTerm", { ...richTags, term: () => term })}</p>
          ) : (
            <>
              <p>
                {t.rich("sourceDocument", { title: () => <DanishText as="bdi">{source.title}</DanishText> })}
              </p>
              <p>
                {t("sourcePages", {
                  count: source.pages.length,
                  pages: format.list(source.pages.map((page) => format.number(page, "integer"))),
                })}
              </p>
              {source.availability === "third-party-copy" ? (
                <p>{t.rich("thirdPartyCopy", richTags)}</p>
              ) : (
                <a
                  className="inline-flex items-center justify-self-start text-accent underline min-block-touch"
                  href={source.url}
                >
                  {t("openOfficialSource")}
                </a>
              )}
            </>
          )}
          <p>{t("checkedOn", { date: new Date(`${verification.checkedOn}T12:00:00Z`) })}</p>
        </div>
      </Disclosure>
    </div>
  );
}
