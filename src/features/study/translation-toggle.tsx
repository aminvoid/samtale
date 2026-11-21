import { useTranslations } from "next-intl";
import { DanishText } from "@/components/ui/danish-text";
import { Disclosure } from "@/components/ui/disclosure";
import { PersianText } from "@/components/ui/persian-text";

const whyEnding = /\bhvorfor\s*\??\s*\/\s*hvorfor\s+ikke\?\s*$/iu;
const latinRun = /([\p{Script=Latin}\d]+(?:[-+’'][\p{Script=Latin}\d]+)*)/gu;
const hasLatin = /\p{Script=Latin}/u;

export function TranslationToggle({ text, question }: { text: string; question?: string }) {
  const t = useTranslations("study");
  return (
    <Disclosure label={t("translation")} icon="languages">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 rounded-control bg-surface-sunken px-4 py-3">
        <PersianText variant="translation" className="wrap-anywhere">
          {text.split(latinRun).map((run, index) =>
            hasLatin.test(run) ? (
              <DanishText key={index} as="bdi">
                {run}
              </DanishText>
            ) : (
              run
            ),
          )}
        </PersianText>
        {question !== undefined && whyEnding.test(question) && (
          <PersianText className="rounded-chip bg-accent-subtle px-2 text-caption text-accent">
            {t("whyHint")}
          </PersianText>
        )}
      </div>
    </Disclosure>
  );
}
