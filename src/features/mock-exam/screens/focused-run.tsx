import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DanishText } from "@/components/ui/danish-text";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { InfoNote } from "@/components/ui/info-note";
import { SourceLabel } from "@/components/ui/source-label";
import { ToggleIconButton } from "@/components/ui/toggle-icon-button";
import { useRouter } from "@/i18n/navigation";
import { richTags } from "@/i18n/rich-tags";
import type { MockDeck } from "@/lib/content/repository";
import { examConfig } from "@/lib/exam/config";
import { cn } from "@/lib/utils/cn";
import type { MockExamAction, State } from "../index";
import { ExaminerPanel } from "./examiner-panel";
import { FocusedModeShell } from "./focused-mode-shell";
import { MockClock } from "./mock-clock";
import { MockSituations } from "./mock-situations";
import { formatDuration } from "./presentation";
import { PrimaryAction } from "./primary-action";
import { RepeatControl } from "./repeat-control";
import { RunDialogs } from "./run-dialogs";

type RunState = Exclude<State, { type: `prepare.${string}` | "left" }>;

export function FocusedRun({
  state,
  send,
  now,
  deck,
}: {
  state: RunState;
  send: (action: MockExamAction) => void;
  now: () => number;
  deck: MockDeck;
}) {
  const t = useTranslations("mock");
  const audio = useTranslations("audio");
  const router = useRouter();
  const [translated, setTranslated] = useState(false);
  const [closeGuard, setCloseGuard] = useState(false);
  const stayButton = useRef<HTMLButtonElement>(null);
  const { context: ctx } = state;
  const point = "point" in state ? state.point : state;
  const topic = deck.topics.find(({ id }) => id === ctx.topic?.id);
  const lookPhase =
    point.type === "run.introLine" || point.type === "run.look" || point.type === "run.chooseSituation";
  const finished = state.type === "finished";
  const closing = state.type === "run.closing";
  const interview = !lookPhase && !finished;
  const answering = state.type === "run.unit.answering" && !state.waitingToAdvance;
  const unit = ctx.script[ctx.cursor];
  const answer = ctx.answers.find(({ itemId }) => itemId === unit?.id);
  const second = unit?.role === "secondRequired" || unit?.role === "secondFollowup";
  const pausedLook = ctx.look?.deadline === null;
  const stickyFocus = useRef<HTMLElement | null>(null);
  const primaryArea = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Auxiliary answer controls can disappear when a replay starts. Keep the next action reachable.
    const previous = stickyFocus.current;
    if (previous && !previous.isConnected && document.activeElement === document.body) {
      primaryArea.current?.querySelector("button")?.focus();
    }
    stickyFocus.current = null;
  }, [state]);

  useEffect(() => {
    // Start unmounts with the reveal view. Keep keyboard and screen-reader focus in the primary slot (UXD-08).
    if (document.activeElement === null || document.activeElement === document.body) {
      primaryArea.current?.querySelector("button")?.focus();
    }
  }, []);

  const toPrimary = () => primaryArea.current?.querySelector("button") ?? true;

  const primary = (() => {
    if (finished)
      return {
        label: t("end.review"),
        action: () => {
          send({ type: "GO_TO_REVIEW" });
        },
      };
    if (state.type === "hold.paused")
      return {
        label: t("interview.resume"),
        action: () => {
          send({ type: "RESUME" });
        },
      };
    if (state.type === "hold.blocked")
      return {
        label: t("examiner.tap"),
        action:
          state.retryId === null
            ? () => {
                send({ type: "TAP_TO_HEAR" });
              }
            : undefined,
      };
    if (state.type === "run.look")
      return {
        label: t(ctx.policy.lookAdjustable ? "look.ready" : "look.looking"),
        action: ctx.policy.lookAdjustable
          ? () => {
              send({ type: "LOOK_SKIP" });
            }
          : undefined,
      };
    return {
      label: t(answering ? "interview.done" : "examiner.listen"),
      action: answering
        ? () => {
            send({ type: "DONE" });
          }
        : undefined,
    };
  })();

  const closingLine = deck.examinerLines.find(({ id }) => id === examConfig.examinerLineIds.closing);
  const recording = ctx.recording === "recording";
  const recordingStatus = recording
    ? "recording"
    : ctx.recording === "paused"
      ? "pausedRecording"
      : ctx.micState === "granted" && !answer?.recordingCapped
        ? "micReady"
        : "notRecording";
  const firstDoneHint = answering && ctx.answersStarted === 1;
  const notice =
    ctx.graceNotice === "limit"
      ? t("live.finishSentence")
      : ctx.graceNotice === "handover"
        ? t("live.handover")
        : ctx.minuteNoticePassed && !ctx.limitReached && interview && !closing
          ? t("live.oneMinuteLeft")
          : null;
  return (
    <FocusedModeShell
      mode={ctx.mode}
      send={send}
      finished={finished}
      closing={closing}
      onClose={
        finished && state.attempt.answers.some(({ recorded }) => recorded)
          ? () => {
              setCloseGuard(true);
            }
          : undefined
      }
      indicator={
        interview &&
        !closing && (
          <span className="flex items-center gap-2 justify-self-start rounded-chip border border-border px-3 text-caption font-semibold text-text-muted">
            <Icon
              name={recording ? "circle-dot" : recordingStatus === "notRecording" ? "mic-off" : "mic"}
              size={16}
              className={recording ? "text-danger motion-safe:animate-rec-pulse" : undefined}
            />
            {t(`interview.${recordingStatus}`)}
          </span>
        )
      }
      tools={
        interview &&
        !closing && (
          <div className="flex flex-wrap items-center gap-1">
            {ctx.timersVisible ? (
              <MockClock ctx={ctx} now={now} type="overall" />
            ) : (
              <span className="text-caption text-text-muted">{t("interview.hidden")}</span>
            )}
            <ToggleIconButton
              icon="clock-3"
              label={t("interview.timers")}
              pressed={!ctx.timersVisible}
              onClick={() => {
                send({ type: "TIMERS_TOGGLED" });
              }}
            />
          </div>
        )
      }
      answerArea={
        <>
          <div
            className="grid gap-2 empty:hidden"
            onFocus={(event) => {
              stickyFocus.current = event.target;
            }}
          >
            {answering && (
              <>
                {ctx.timersVisible && <MockClock ctx={ctx} now={now} type="answer" />}
                <RepeatControl context={ctx} send={send} />
              </>
            )}
            {ctx.policy.canPause &&
              interview &&
              !closing &&
              (state.type === "run.unit.speaking" ||
                state.type === "run.unit.repeating" ||
                state.type === "run.unit.answering" ||
                state.type === "run.thanks") && (
                <div className="flex flex-wrap gap-2">
                  {answering && ctx.policy.hints && (
                    <Button
                      variant="secondary"
                      icon="lightbulb"
                      onClick={() => {
                        send({ type: "HINTS_OPENED" });
                      }}
                    >
                      {t("interview.hints")}
                    </Button>
                  )}
                  <Button
                    variant="tertiary"
                    icon="pause"
                    onClick={() => {
                      send({ type: "PAUSE" });
                    }}
                  >
                    {t("interview.pause")}
                  </Button>
                  {answering &&
                    ctx.policy.reRecord &&
                    ctx.micState === "granted" &&
                    answer?.recorded &&
                    ctx.recording !== "starting" && (
                      <Button
                        variant="tertiary"
                        icon="rotate-ccw"
                        onClick={() => {
                          send({ type: "RERECORD" });
                        }}
                      >
                        {t("interview.rerecord")}
                      </Button>
                    )}
                </div>
              )}
            {state.type === "run.look" && ctx.policy.lookAdjustable && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="tertiary"
                  icon="pause"
                  onClick={() => {
                    send({ type: pausedLook ? "LOOK_RESUME" : "LOOK_PAUSE" });
                  }}
                >
                  {t(pausedLook ? "interview.resume" : "interview.pause")}
                </Button>
                <Button
                  variant="tertiary"
                  onClick={() => {
                    send({ type: "LOOK_EXTEND" });
                  }}
                >
                  {t("look.add", { seconds: examConfig.lookExtendSeconds })}
                </Button>
              </div>
            )}
            {state.type === "run.introLine" && ctx.policy.canPause && (
              <Button
                variant="tertiary"
                className="justify-self-start"
                icon="pause"
                onClick={() => {
                  send({ type: "PAUSE" });
                }}
              >
                {t("interview.pause")}
              </Button>
            )}
          </div>
          <div ref={primaryArea}>
            {state.type === "run.chooseSituation" ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {topic?.situations.map(({ key }) => (
                  <Button
                    key={key}
                    variant="secondary"
                    onClick={() => {
                      send({ type: "SITUATION_CHOSEN", key });
                    }}
                  >
                    {t("look.card", { key })}
                  </Button>
                ))}
                <Button
                  onClick={() => {
                    send({ type: "SITUATION_CHOSEN", key: "random" });
                  }}
                >
                  {t("look.random")}
                </Button>
              </div>
            ) : (
              <PrimaryAction
                label={primary.label}
                onClick={primary.action}
                describedBy={firstDoneHint ? "first-done-hint" : undefined}
              />
            )}
          </div>
          {firstDoneHint && (
            <p id="first-done-hint" className="text-caption text-text-muted">
              {t("interview.doneHint")}
            </p>
          )}
        </>
      }
    >
      {finished ? (
        <>
          <h1 className="text-h1">{t("end.title")}</h1>
          {closingLine && (
            <div className="grid gap-2 rounded-card bg-role-examiner-subtle p-4">
              <DanishText as="p" className="text-da-line">
                {closingLine.text.da}
              </DanishText>
              <SourceLabel variant="siri">{t.rich("examiner.siri", richTags)}</SourceLabel>
            </div>
          )}
          <p className="text-lead">
            {t.rich("review.total", {
              ...richTags,
              time: formatDuration(state.attempt.totalMs, (parts) => audio("clock", parts)),
            })}
          </p>
          {state.attempt.status === "interrupted" && <InfoNote>{t("review.interruptionTime")}</InfoNote>}
          {state.saveFailed && <InfoNote>{t("live.saveFailed")}</InfoNote>}
        </>
      ) : (
        <>
          <h1 className={lookPhase ? "text-h1" : "text-h2"}>
            {lookPhase && topic ? (
              <DanishText as="bdi" className="wrap-anywhere">
                {topic.title.da}
              </DanishText>
            ) : (
              t("interview.title")
            )}
          </h1>
          {interview && (
            <div className="flex flex-wrap items-center gap-2 text-caption font-semibold">
              <span aria-hidden className="flex gap-1">
                <span className="rounded-full bg-accent block-1.5 inline-6" />
                <span
                  className={cn("rounded-full block-1.5 inline-6", second ? "bg-accent" : "bg-border-strong")}
                />
              </span>
              {t(second ? "interview.secondStep" : "interview.firstStep", {
                current: second ? 2 : 1,
                total: 2,
              })}
            </div>
          )}
          {topic && (
            <MockSituations
              topic={topic}
              selected={ctx.situationKey}
              compact={interview}
              translated={lookPhase && translated}
            />
          )}
          {lookPhase && (
            <>
              <InfoNote variant="compact">{t("look.pictures")}</InfoNote>
              {ctx.policy.lookAdjustable && (
                <Button
                  variant="tertiary"
                  icon="languages"
                  className="justify-self-start"
                  aria-pressed={translated}
                  onClick={() => {
                    setTranslated((value) => !value);
                  }}
                >
                  {t("look.translations")}
                </Button>
              )}
            </>
          )}
          {point.type === "run.chooseSituation" ? (
            <h2 className="text-h2">{t("look.choose")}</h2>
          ) : point.type === "run.look" ? (
            <MockClock ctx={ctx} now={now} type="look" />
          ) : (
            point.type !== "finished" && (
              <ExaminerPanel state={state} point={point} deck={deck} topic={topic} send={send} />
            )
          )}
          {notice && <InfoNote>{notice}</InfoNote>}
          {answering && answer?.recordingCapped && (
            <InfoNote>{t("live.recordingCapped", { minutes: examConfig.maxRecordingSeconds / 60 })}</InfoNote>
          )}
          {answering && ctx.micState === "unavailable" && ctx.answers.some(({ recorded }) => recorded) && (
            <InfoNote>{t("live.notRecording")}</InfoNote>
          )}
        </>
      )}
      <RunDialogs {...{ state, send, now, topic }} finalFocus={toPrimary} />
      {closeGuard && finished && (
        <Dialog
          open
          title={t("end.discardTitle")}
          description={t("end.discardBody")}
          closeLabel={t("close")}
          initialFocus={stayButton}
          finalFocus={toPrimary}
          onOpenChange={(open) => {
            if (!open) setCloseGuard(false);
          }}
        >
          <div className="grid gap-2">
            <Button
              ref={stayButton}
              onClick={() => {
                setCloseGuard(false);
              }}
            >
              {t("review.stay")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                send({ type: "GO_TO_REVIEW" });
              }}
            >
              {t("end.review")}
            </Button>
            <Button
              variant="destructive-tertiary"
              onClick={() => {
                router.push("/mock");
              }}
            >
              {t("review.discard")}
            </Button>
          </div>
        </Dialog>
      )}
    </FocusedModeShell>
  );
}
