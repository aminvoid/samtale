import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DanishText } from "@/components/ui/danish-text";
import { Icon } from "@/components/ui/icon";
import { SourceLabel } from "@/components/ui/source-label";
import { richTags } from "@/i18n/rich-tags";
import type { MockDeck } from "@/lib/content/repository";
import { examConfig } from "@/lib/exam/config";
import { cn } from "@/lib/utils/cn";
import type { MockExamAction, State } from "../index";
import type { DeckTopic } from "./presentation";

type ExaminerPoint = Extract<State, { type: `run.${string}` }>;
type Clip = NonNullable<State["context"]["script"][number]["clips"][number]>;

function promptDisplay(clip: Clip | undefined, deck: MockDeck, topic: DeckTopic | undefined) {
  if (!clip) return null;
  const ids = examConfig.examinerLineIds;
  const spec = [
    { id: topic && `${ids.intro}:${topic.id}`, line: ids.intro, meaning: "introMeaning" },
    { id: ids.transition, line: ids.transition, meaning: "transitionMeaning" },
    { id: ids.thanks, line: ids.thanks, meaning: "thanksMeaning" },
    { id: ids.closing, line: ids.closing, meaning: "closingMeaning" },
  ].find((entry) => entry.id === clip.id);
  const line = deck.examinerLines.find(({ id }) => id === spec?.line);
  if (line)
    return {
      text: line.text.da.replace("{topic}", topic?.title.da ?? ""),
      source: line.origin === "app" ? "app" : "siri",
      meaning: spec?.meaning,
    };
  const intro = topic?.situations.find((situation) => situation.intro.id === clip.id)?.intro;
  return {
    text: clip.spoken ? [clip.spoken.question, clip.spoken.ending] : clip.textDa,
    source:
      intro?.origin === "app" ? "app" : intro || clip.id.includes(".followup") ? "suggested" : undefined,
    meaning: undefined,
  };
}

export function ExaminerPanel({
  state,
  point,
  deck,
  topic,
  send,
}: {
  state: State;
  point: ExaminerPoint;
  deck: MockDeck;
  topic?: DeckTopic;
  send: (action: MockExamAction) => void;
}) {
  const t = useTranslations("mock");
  const ctx = state.context;
  const unit = ctx.script[ctx.cursor];
  const answering = state.type === "run.unit.answering" && !state.waitingToAdvance;
  const closing = point.type === "run.closing";
  const role =
    closing || point.type === "run.introLine" || point.type === "run.thanks"
      ? "line"
      : unit?.role === "firstRequired"
        ? "first"
        : unit?.role === "secondRequired"
          ? "second"
          : "followup";
  const audioClip = "audio" in point ? point.audio.clips[point.audio.index] : undefined;
  const clip = closing ? { id: examConfig.examinerLineIds.closing } : (audioClip ?? unit?.question);
  const display = promptDisplay(clip, deck, topic);
  const active = "audio" in state && state.audio.playback.phase === "playing";
  const toggle = display?.text && !closing && (!ctx.showTextOpen || !ctx.policy.keepShowTextOpen);
  return (
    <section
      className={cn(
        "grid gap-2 rounded-card p-3 md:p-4",
        answering ? "bg-role-you-subtle" : "bg-role-examiner-subtle",
      )}
    >
      <h2 className={cn("text-h3", answering ? "text-role-you" : "text-role-examiner")}>
        {t(`examiner.${role}`)}
      </h2>
      <p className="flex items-center gap-2 font-semibold">
        <Icon
          name={answering ? "mic" : "audio-lines"}
          className={active ? "motion-safe:animate-speaking" : undefined}
        />
        {answering
          ? t("examiner.yourTurn")
          : state.type === "hold.paused"
            ? t("dialog.pauseTitle")
            : active || closing
              ? t("examiner.speaking")
              : t("examiner.listen")}
      </p>
      {toggle && (
        <Button
          variant="tertiary"
          icon="captions"
          className="justify-self-start"
          aria-pressed={ctx.showTextOpen}
          onClick={() => {
            send({ type: ctx.showTextOpen ? "HIDE_TEXT" : "SHOW_TEXT" });
          }}
        >
          {t("examiner.showText")}
        </Button>
      )}
      {display?.text && (ctx.showTextOpen || closing) && (
        <div className="grid gap-2 rounded-control bg-surface-raised p-3">
          <DanishText as="p" className="text-da-question wrap-anywhere">
            {Array.isArray(display.text) ? display.text.join(" ") : display.text}
          </DanishText>
          {display.source && (
            <SourceLabel variant={display.source === "app" ? "app" : "siri"}>
              {t.rich(
                display.source === "app"
                  ? "examiner.app"
                  : display.source === "suggested"
                    ? "examiner.suggested"
                    : "examiner.siri",
                richTags,
              )}
            </SourceLabel>
          )}
          {ctx.policy.showFixedLineMeaning && display.meaning && (
            <p className="text-caption">
              {t(
                display.meaning === "introMeaning"
                  ? "examiner.introMeaning"
                  : display.meaning === "transitionMeaning"
                    ? "examiner.transitionMeaning"
                    : display.meaning === "thanksMeaning"
                      ? "examiner.thanksMeaning"
                      : "examiner.closingMeaning",
              )}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
