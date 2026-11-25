import { useTranslations } from "next-intl";
import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Button } from "@/components/ui/button";
import { DanishText } from "@/components/ui/danish-text";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { InfoNote } from "@/components/ui/info-note";
import { PersianText } from "@/components/ui/persian-text";
import { RoleHeader } from "@/components/ui/role-header";
import { Link } from "@/i18n/navigation";
import type { Topic } from "@/lib/content/repository";
import { examConfig } from "@/lib/exam/config";
import { cn } from "@/lib/utils/cn";
import { AnswerAudio } from "./answer-audio";
import type { createAnswerAloudSession } from "./answer-aloud-session";
import { answerElapsed, MAX_ANSWER_RECORDING_MS, type AnswerAloudState } from "./answer-aloud-state";
import { TranslationToggle } from "./translation-toggle";

type RequiredQuestion = Topic["general"]["question"];
export type SpeakingQuestion = Pick<RequiredQuestion, "id" | "text" | "audio"> & {
  role: "first-question" | "second-question" | "followup";
  situation?: "A" | "B";
  keywords?: RequiredQuestion["keywords"];
  model: RequiredQuestion["modelAnswer"];
};

type Session = ReturnType<typeof createAnswerAloudSession>;

export function AnswerAloudPanel({
  question,
  state,
  session,
  trigger,
  close,
  next,
}: {
  question: SpeakingQuestion | undefined;
  state: AnswerAloudState;
  session: Session;
  trigger: RefObject<HTMLButtonElement | null>;
  close: () => void;
  next?: () => void;
}) {
  const t = useTranslations("study");
  const audio = useTranslations("audio");
  const ready = useTranslations("mock.ready");
  const repeat = useTranslations("mock.interview");
  const [hideQuestion, setHideQuestion] = useState(false);
  const [hint, setHint] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const title = useRef<HTMLSpanElement>(null);
  const step = useRef<HTMLDivElement>(null);
  const stay = useRef<HTMLButtonElement>(null);
  const questionTextId = useId();
  const privacyId = useId();
  const hintId = useId();
  const open = state.phase !== "closed";
  const comparing = state.phase === "compare";
  const answering = state.phase === "answering";
  const paused = state.phase === "paused";
  const recording = answering && session.isRecording();
  const canResumeRecording = paused && session.canResumeRecording();
  const recorderFailed = state.recorderStatus === "failed";

  useLayoutEffect(() => {
    if (!open) return;
    if (confirming) {
      stay.current?.focus();
      return;
    }
    const active = document.activeElement;
    if (!comparing && active !== title.current && title.current?.closest('[role="dialog"]')?.contains(active))
      return;
    const firstButton = step.current?.querySelector<HTMLButtonElement>("button:enabled");
    (firstButton ?? title.current)?.focus();
  }, [state.phase, state.itemId, open, confirming, comparing]);

  useEffect(() => {
    if (open) return;
    // Also reset after browser Back, which bypasses the close confirmation.
    const reset = window.setTimeout(() => {
      setConfirming(false);
      setHint(false);
    });
    return () => {
      window.clearTimeout(reset);
    };
  }, [open]);

  function dismiss() {
    if (confirming) {
      setConfirming(false);
    } else if (session.hasTake()) {
      session.interrupt();
      setConfirming(true);
    } else {
      close();
    }
  }

  function playQuestion(repeating = false) {
    if (question === undefined) return;
    session.retryQuestion(question.audio && { id: question.id, ...question.audio }, repeating);
  }

  const micError =
    state.micIssue === "denied"
      ? t("speaking.micDenied")
      : state.micIssue === "in-use"
        ? ready("micInUse")
        : state.micIssue === "insecure"
          ? ready("micInsecure")
          : state.micIssue === null
            ? null
            : ready("micUnavailable");
  const status =
    state.phase === "listening"
      ? t("speaking.listening")
      : state.phase === "audio-error"
        ? t("speaking.questionFailed")
        : state.phase === "starting"
          ? t("speaking.micWaiting")
          : state.phase === "permission" && recorderFailed
            ? ready("micUnavailable")
            : recording
              ? t("speaking.recording")
              : answering
                ? t("speaking.withoutRecording")
                : paused
                  ? t("speaking.paused")
                  : state.phase === "stopping"
                    ? t("speaking.stopping")
                    : comparing
                      ? state.capped
                        ? t("speaking.capped", { minutes: MAX_ANSWER_RECORDING_MS / 60_000 })
                        : state.takes.length > 0
                          ? t("speaking.stopped")
                          : t("speaking.compare")
                      : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) dismiss();
      }}
      disablePointerDismissal
      initialFocus={title}
      finalFocus={trigger}
      presentation="fullscreen-mobile"
      closeLabel={t("speaking.close")}
      description={confirming ? t("speaking.discard") : undefined}
      title={
        <span ref={title} tabIndex={-1}>
          {t(confirming ? "speaking.discardTitle" : "answerAloud")}
        </span>
      }
      className={cn("scroll-pbe-24", comparing && "lg:max-inline-focused")}
    >
      {confirming ? (
        <div className="flex flex-wrap gap-2">
          <Button
            ref={stay}
            onClick={() => {
              setConfirming(false);
            }}
          >
            {t("speaking.stay")}
          </Button>
          <Button
            variant="destructive-tertiary"
            onClick={() => {
              setConfirming(false);
              close();
            }}
          >
            {t("speaking.leave")}
          </Button>
        </div>
      ) : (
        question !== undefined && (
          <div className="grid gap-4">
            <div role="status" className="grid gap-2 empty:sr-only">
              {status && (
                <p className="flex items-center gap-2 text-ui font-semibold">
                  {recording && <Icon name="circle-dot" className="text-danger" />}
                  {answering && !recording && <Icon name="mic-off" />}
                  {status}
                </p>
              )}
              {(answering || paused) && micError !== null && <p className="text-caption">{micError}</p>}
            </div>
            {!comparing && (
              <div className="grid gap-2 rounded-card bg-role-examiner-subtle p-3">
                <RoleHeader
                  as="h3"
                  role={question.role}
                  label={t(
                    question.role === "followup"
                      ? "followup"
                      : question.role === "first-question"
                        ? "firstQuestion"
                        : "secondQuestion",
                  )}
                  source={
                    question.situation === undefined
                      ? undefined
                      : t.rich(question.situation === "A" ? "sitA" : "sitB", {
                          letter: () => <DanishText as="bdi">{question.situation}</DanishText>,
                        })
                  }
                />
                <div id={questionTextId} hidden={hideQuestion && state.phase !== "audio-error"}>
                  <DanishText as="p" className="text-da-question wrap-anywhere">
                    {question.text.da}
                  </DanishText>
                </div>
                {state.phase !== "audio-error" && (
                  <Button
                    variant="tertiary"
                    aria-controls={questionTextId}
                    aria-expanded={!hideQuestion}
                    onClick={() => {
                      setHideQuestion(!hideQuestion);
                    }}
                    className="justify-self-start"
                  >
                    {t(hideQuestion ? "speaking.showQuestion" : "speaking.hideQuestion")}
                  </Button>
                )}
              </div>
            )}
            {!comparing && !answering && !paused && state.phase !== "stopping" && (
              <div className="grid gap-2 rounded-control bg-surface-sunken p-3 text-caption">
                <p id={privacyId}>{t("speaking.privacy")}</p>
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-self-start text-accent underline min-block-touch"
                >
                  {t("speaking.privacyLink")}
                </Link>
              </div>
            )}
            {state.phase === "audio-error" && (
              <div ref={step} className="flex flex-wrap gap-2">
                {question.audio && (
                  <Button
                    onClick={() => {
                      playQuestion();
                    }}
                  >
                    {t("speaking.questionRetry")}
                  </Button>
                )}
                <Button variant="secondary" onClick={session.readQuestion}>
                  {t("speaking.readQuestion")}
                </Button>
              </div>
            )}
            {(state.phase === "permission" || state.phase === "starting") && (
              <div ref={step} className="flex flex-wrap gap-2">
                {state.phase === "permission" && (
                  <Button
                    icon="mic"
                    aria-describedby={privacyId}
                    disabled={state.recorderStatus === "loading"}
                    onClick={recorderFailed ? session.preloadRecorder : session.requestMic}
                  >
                    {recorderFailed ? t("speaking.micRetry") : ready("micAllow")}
                  </Button>
                )}
                <Button variant="secondary" onClick={session.skipMic}>
                  {ready("micSkip")}
                </Button>
              </div>
            )}
            {(answering || paused) && (
              <>
                <SpeakingTimer state={state} />
                {state.wakeLockTip && (
                  <InfoNote
                    icon="lock"
                    variant="dismissible"
                    dismissLabel={t("speaking.dismissWakeLockTip")}
                    onDismiss={session.dismissWakeLockTip}
                  >
                    {ready("wakeLock", { minutes: MAX_ANSWER_RECORDING_MS / 60_000 })}
                  </InfoNote>
                )}
                {micError !== null && (
                  <div className="grid gap-2 rounded-control bg-surface-sunken p-3 text-caption">
                    {state.micIssue === "denied" && <p>{t("speaking.micSettings")}</p>}
                    {!paused && (
                      <Button
                        variant="secondary"
                        className="justify-self-start"
                        disabled={state.recorderStatus !== "ready"}
                        onClick={session.requestMic}
                      >
                        {t("speaking.micRetry")}
                      </Button>
                    )}
                  </div>
                )}
                {question.keywords !== undefined && question.keywords.length > 0 && (
                  <div className="grid gap-2">
                    <Button
                      variant="tertiary"
                      className="justify-self-start"
                      icon="key-round"
                      aria-controls={hintId}
                      aria-expanded={hint}
                      onClick={() => {
                        setHint(!hint);
                      }}
                    >
                      {t(hint ? "speaking.hideHint" : "speaking.hint")}
                    </Button>
                    <ul id={hintId} hidden={!hint} className="rounded-card bg-role-keyword-subtle p-3">
                      {question.keywords.map(({ id, text }) => (
                        <li key={id} className="flex flex-wrap gap-x-3 py-1">
                          <DanishText className="wrap-anywhere">{text.da}</DanishText>
                          <PersianText className="wrap-anywhere text-text-muted">{text.fa}</PersianText>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {answering && question.audio && (
                  <div className="grid gap-1 rounded-control border border-border p-2">
                    <Button
                      variant="secondary"
                      icon="repeat-2"
                      onClick={() => {
                        playQuestion(true);
                      }}
                    >
                      {repeat("repeat")}
                    </Button>
                    <DanishText as="p" className="text-caption wrap-anywhere">
                      {examConfig.repeatRequestText}
                    </DanishText>
                    <p className="text-caption text-text-muted">{repeat("repeatMeaning")}</p>
                  </div>
                )}
                {paused && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={session.resume}
                      disabled={canResumeRecording && state.recorderStatus !== "ready"}
                    >
                      {t("speaking.resume")}
                    </Button>
                    {canResumeRecording && (
                      <Button variant="tertiary" onClick={session.skipMic}>
                        {ready("micSkip")}
                      </Button>
                    )}
                  </div>
                )}
                <div ref={step} className="sticky inset-be-0 bg-surface-raised pbs-2 pbe-2 short:static">
                  <Button size="lg" block onClick={session.finish}>
                    {t("answerDone")}
                  </Button>
                </div>
              </>
            )}
            {comparing && (
              <>
                <div className="grid items-start gap-3 lg:grid-cols-2">
                  <div
                    ref={state.takes.length > 0 ? step : undefined}
                    className="grid gap-2 rounded-card bg-role-you-subtle p-3 min-inline-0"
                  >
                    <RoleHeader as="h3" role="learner-recording" label={t("speaking.yourAnswer")} />
                    {state.takes.length === 0 && <p>{t("speaking.noTake")}</p>}
                    {state.takes.map((take, index) => (
                      <div key={take.url} className="grid gap-2">
                        <bdi dir="ltr" className="justify-self-start text-caption tabular-nums">
                          {audio("clock", clockParts(take.durationMs))}
                        </bdi>
                        <AudioPlayer
                          itemId={take.url}
                          audio={take}
                          label={
                            state.takes.length > 1
                              ? t("speaking.playPart", { part: index + 1 })
                              : t("speaking.playTake")
                          }
                          className="bg-surface-raised"
                        />
                      </div>
                    ))}
                  </div>
                  <div
                    ref={state.takes.length === 0 && question.model.audio !== undefined ? step : undefined}
                    className="grid gap-2 rounded-card bg-role-sample-subtle p-3 min-inline-0"
                  >
                    <RoleHeader
                      as="h3"
                      role={question.role === "followup" ? "short-sample-answer" : "sample-answer"}
                      label={t(question.role === "followup" ? "shortAnswer" : "sample")}
                    />
                    <AnswerAudio
                      item={question.model}
                      emphasis={question.model.emphasis}
                      label={t(question.role === "followup" ? "playShortAnswer" : "playSample")}
                    />
                    {question.model.translation && (
                      <TranslationToggle
                        text={question.model.translation.fa}
                        answerLabel={t(
                          question.role === "followup" ? "shortAnswerTranslation" : "sampleTranslation",
                        )}
                      />
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap justify-between gap-2 pbe-14">
                  <Button
                    variant="secondary"
                    icon="rotate-ccw"
                    onClick={() => {
                      setHint(false);
                      session.start(question.id, question.audio && { id: question.id, ...question.audio });
                    }}
                  >
                    {t("speaking.again")}
                  </Button>
                  <Button
                    icon="arrow-right"
                    onClick={() => {
                      setHint(false);
                      if (next === undefined) dismiss();
                      else next();
                    }}
                  >
                    {t(next === undefined ? "speaking.back" : "speaking.next")}
                  </Button>
                </div>
                <p role="status" className="text-caption text-text-muted empty:hidden">
                  {state.practice === "review"
                    ? t("reviewSaved")
                    : state.practice === "saved"
                      ? t("practiceSaved")
                      : state.practice === "error"
                        ? t("practiceSaveFailed")
                        : ""}
                </p>
              </>
            )}
          </div>
        )
      )}
    </Dialog>
  );
}

function clockParts(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return { minutes: Math.floor(seconds / 60), seconds: seconds % 60 };
}

function SpeakingTimer({ state }: { state: AnswerAloudState }) {
  const t = useTranslations("study.speaking");
  const audio = useTranslations("audio");
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    if (state.startedAt === null) return;
    const timer = setInterval(() => {
      setNow(performance.now());
    }, 250);
    return () => {
      clearInterval(timer);
    };
  }, [state.startedAt]);

  const [from, to] = examConfig.answerGuideSeconds;
  return (
    <div className="grid gap-1 text-center">
      <bdi dir="ltr" role="timer" aria-label={t("elapsed")} className="text-h2 tabular-nums">
        {audio("clock", clockParts(answerElapsed(state, now)))}
      </bdi>
      <p className="text-caption text-text-muted">{t("guide", { from, to })}</p>
    </div>
  );
}
