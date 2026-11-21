import { useTranslations } from "next-intl";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { DanishText } from "@/components/ui/danish-text";
import { examConfig } from "@/lib/exam/config";
import type { MockExamAction, State } from "../index";

export function RepeatControl({
  context,
  send,
}: {
  context: State["context"];
  send: (action: MockExamAction) => void;
}) {
  const t = useTranslations("mock.interview");
  const id = useId();
  const unit = context.script[context.cursor];
  const answer = context.answers.find(({ itemId }) => itemId === unit?.id);
  const canRepeat = !context.graceCeilingReached;
  return (
    <div className="grid gap-1">
      <div className="grid gap-1 rounded-control border border-border bg-surface-raised p-2">
        <Button
          variant="secondary"
          icon="repeat-2"
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-phrase`}
          disabled={!canRepeat}
          onClick={() => {
            send({ type: "REPEAT", rate: 1 });
          }}
        >
          <span id={`${id}-label`}>{t("repeat")}</span>
        </Button>
        <div id={`${id}-phrase`} className="grid gap-1 px-2 text-caption text-text-muted">
          <DanishText as="p" className="wrap-anywhere">
            {examConfig.repeatRequestText}
          </DanishText>
          <p>{t("repeatMeaning")}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-2">
        {unit?.role === "firstRequired" && (
          <Button
            variant="tertiary"
            disabled={!canRepeat}
            onClick={() => {
              send({ type: "REPEAT_INTRO" });
            }}
          >
            {t("repeatIntro")}
          </Button>
        )}
        {context.policy.slowRepeat && (answer?.repeats ?? 0) >= 1 && (
          <Button
            variant="tertiary"
            icon="snail"
            disabled={!canRepeat}
            aria-describedby={`${id}-slow`}
            onClick={() => {
              send({ type: "REPEAT", rate: examConfig.slowRepeatRate });
            }}
          >
            {t("slower")}
          </Button>
        )}
      </div>
      {context.policy.slowRepeat && (answer?.repeats ?? 0) >= 1 && (
        <p id={`${id}-slow`} className="text-caption text-text-muted">
          {t("slowerNote")}
        </p>
      )}
    </div>
  );
}
