import { useTranslations } from "next-intl";
import { DanishText } from "@/components/ui/danish-text";
import { Disclosure } from "@/components/ui/disclosure";
import { PersianText } from "@/components/ui/persian-text";
import { cn } from "@/lib/utils/cn";

const whyEnding = /\bhvorfor\s*\??\s*\/\s*hvorfor\s+ikke\?\s*$/iu;
const latinRun = /([\p{Script=Latin}\d]+(?:[-+’'][\p{Script=Latin}\d]+)*)/gu;
const hasLatin = /\p{Script=Latin}/u;

export function TranslationToggle({
  text,
  question,
  answerLabel,
}: {
  text: string;
  question?: string;
  answerLabel?: string;
}) {
  const t = useTranslations("study");
  const isAnswer = answerLabel !== undefined;
  return (
    <Disclosure label={answerLabel ?? t("translation")} icon="languages">
      <div
        className={cn(
          "rounded-control bg-surface-sunken px-4 py-3",
          isAnswer ? "grid gap-2" : "flex flex-wrap items-baseline gap-x-3 gap-y-2",
        )}
      >
        {isAnswer && (
          <PersianText className="text-caption font-semibold text-text-muted">
            {t("answerTranslationSource")}
          </PersianText>
        )}
        <PersianText
          as={isAnswer ? "p" : "span"}
          variant="translation"
          className={cn("wrap-anywhere", isAnswer && "whitespace-pre-line")}
        >
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
