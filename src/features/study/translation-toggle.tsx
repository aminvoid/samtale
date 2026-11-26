import { useTranslations } from "next-intl";
import { DanishText } from "@/components/ui/danish-text";
import { Disclosure } from "@/components/ui/disclosure";
import { IconLanguages } from "@/components/ui/icon";
import { PersianText } from "@/components/ui/persian-text";
import { splitLatinRuns } from "@/lib/format/split-latin-runs";
import { cn } from "@/lib/utils/cn";

const whyEnding = /\bhvorfor\s*\??\s*\/\s*hvorfor\s+ikke\?\s*$/iu;

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
    <Disclosure label={answerLabel ?? t("translation")} icon={<IconLanguages />}>
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
          {splitLatinRuns(text).map(({ text: run, isLatin }, index) =>
            isLatin ? (
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
