import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { DanishText } from "@/components/ui/danish-text";
import { Dialog, type DialogProps } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { richTags } from "@/i18n/rich-tags";
import { elapsed, type MockExamAction, type State } from "../index";
import { formatDuration, mockTextLink, type DeckTopic } from "./presentation";

type Props = {
  state: State;
  send: (action: MockExamAction) => void;
  now: () => number;
  topic?: DeckTopic;
  /** Where focus returns when a dialog closes: the primary slot (UXD-08). */
  finalFocus?: DialogProps["finalFocus"];
};

export function RunDialogs({ state, send, now, topic, finalFocus }: Props) {
  const t = useTranslations("mock");
  const audio = useTranslations("audio");
  const error = useTranslations("error");
  const initialFocus = useRef<HTMLButtonElement>(null);
  const { context } = state;
  const end = () => {
    send({ type: "END_AND_REVIEW" });
  };
  const abandon = () => {
    send({ type: "LEAVE_CONFIRMED" });
  };
  const closeLabel = t("close");

  if (context.leaveDialog || state.type === "hold.paused") {
    const leave = context.leaveDialog;
    const resume = () => {
      send({ type: leave ? "LEAVE_CANCELLED" : "RESUME" });
    };
    return (
      <Dialog
        key={leave ? "leave" : "pause"}
        open
        closeLabel={closeLabel}
        initialFocus={initialFocus}
        finalFocus={finalFocus}
        onOpenChange={(open) => {
          if (!open) resume();
        }}
        title={t(leave ? "dialog.leaveTitle" : "dialog.pauseTitle")}
        description={
          leave ? t(context.mode === "practice" ? "dialog.leavePractice" : "dialog.leaveExam") : undefined
        }
      >
        <div className="grid gap-2">
          <Button ref={initialFocus} onClick={resume}>
            {t("interview.resume")}
          </Button>
          {context.answersStarted > 0 && (
            <Button variant="secondary" onClick={end}>
              {t("dialog.endReview")}
            </Button>
          )}
          <Button variant="destructive-tertiary" aria-describedby="mock-leave-note" onClick={abandon}>
            {t("dialog.leaveWithout")}
          </Button>
          <p id="mock-leave-note" className="text-caption text-text-muted">
            {t("dialog.leaveNote")}
          </p>
        </div>
      </Dialog>
    );
  }
  if (state.type === "hold.interrupted" && state.status === "choosing") {
    const resume = () => {
      send({ type: "CONTINUE_AFTER_INTERRUPTION" });
    };
    const clock = context.examClock;
    return (
      <Dialog
        key="interruption"
        open
        closeLabel={t("interview.resume")}
        initialFocus={initialFocus}
        finalFocus={finalFocus}
        onOpenChange={(open) => {
          if (!open) resume();
        }}
        title={t(context.mode === "exam" ? "dialog.interruptedTitle" : "dialog.interruptedPractice")}
        description={t("dialog.interruptedReason")}
      >
        <div className="grid gap-2">
          {context.mode === "exam" && (
            <>
              {clock && (
                <p>
                  {t.rich("dialog.interruptedClock", {
                    ...richTags,
                    time: formatDuration(elapsed(clock, now()), (parts) => audio("clock", parts)),
                  })}
                </p>
              )}
              <p className="font-semibold">{t("dialog.interruptedLabel")}</p>
            </>
          )}
          <Button ref={initialFocus} loading={state.reacquiring} onClick={resume}>
            {t(
              state.point.type === "run.unit.answering" ||
                state.point.type === "run.unit.repeating" ||
                state.point.type === "run.unit.speaking"
                ? "dialog.continueReplay"
                : "interview.resume",
            )}
          </Button>
          <Button
            variant="secondary"
            disabled={state.reacquiring}
            aria-describedby="mock-restart-note"
            onClick={() => {
              send({ type: "RESTART" });
            }}
          >
            {t("dialog.restart")}
          </Button>
          <p id="mock-restart-note" className="text-caption text-text-muted">
            {t("dialog.restartNote")}
          </p>
          <Button variant="secondary" onClick={end}>
            {t("dialog.endReview")}
          </Button>
        </div>
      </Dialog>
    );
  }
  if (state.type === "hold.audioError") {
    const retry = () => {
      send({ type: "RETRY_AUDIO" });
    };
    return (
      <Dialog
        key="audio"
        open
        closeLabel={error("retry")}
        initialFocus={initialFocus}
        finalFocus={finalFocus}
        onOpenChange={(open) => {
          if (!open) retry();
        }}
        title={t("dialog.audioTitle")}
        description={t("dialog.audioBody")}
      >
        <div className="grid gap-2">
          <Button ref={initialFocus} loading={state.retryId !== null} onClick={retry}>
            {error("retry")}
          </Button>
          <Button variant="secondary" onClick={end}>
            {t("dialog.endReview")}
          </Button>
        </div>
      </Dialog>
    );
  }
  if (context.sheet !== "hints" || !topic) return null;
  const unit = context.script[context.cursor];
  const situation = topic.situations.find(({ key }) => key === context.situationKey);
  const section =
    unit?.role === "secondRequired" || unit?.role === "secondFollowup" ? topic.general : situation;
  const required = section?.question.id === unit?.id ? section?.question : undefined;
  const question = required ?? section?.followups.find(({ id }) => id === unit?.id);
  const template = unit?.role === "firstRequired" ? 1 : unit?.role === "secondRequired" ? 2 : 3;
  return (
    <Sheet
      open
      closeLabel={closeLabel}
      onOpenChange={(open) => {
        if (!open) send({ type: "HINTS_CLOSED" });
      }}
      title={t("interview.hints")}
      description={t("interview.noNotes")}
    >
      <div className="grid gap-3">
        {question && <p lang="fa">{question.text.fa}</p>}
        {required && required.keywords.length > 0 && (
          <ul className="grid gap-2">
            {required.keywords.map(({ id, text }) => (
              <li key={id} className="flex flex-wrap gap-x-2">
                <DanishText as="bdi">{text.da}</DanishText>
                <span lang="fa">{text.fa}</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          className={mockTextLink}
          href={`/templates#template-${String(template)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("interview.template", { number: template })}
        </Link>
      </div>
    </Sheet>
  );
}
