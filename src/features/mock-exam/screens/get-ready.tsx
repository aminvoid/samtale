import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { DanishText } from "@/components/ui/danish-text";
import { FocusHeading } from "@/components/ui/focus-heading";
import {
  IconBellOff,
  IconHeadphones,
  IconListChecks,
  IconMic,
  IconSmartphone,
  IconVolume2,
} from "@/components/ui/icon";
import { InfoNote } from "@/components/ui/info-note";
import { Link } from "@/i18n/navigation";
import type { MockDeck } from "@/lib/content/repository";
import { examConfig } from "@/lib/exam/config";
import { createProgressStore } from "@/lib/progress/create-progress-store";
import type { FocusItem } from "@/lib/progress/schema";
import { cn } from "@/lib/utils/cn";
import type { MockExamAction, State } from "../index";
import { ExamRules } from "./exam-rules";
import { PracticeOptions } from "./practice-options";
import { mockCard, mockTextLink, type ThemeOption } from "./presentation";

export function GetReady({
  state,
  send,
  deck,
  themes,
  invalid,
  soundError,
  micPreviouslyDenied,
}: {
  state: Extract<State, { type: "prepare.getReady" | "prepare.instruction" }>;
  send: (action: MockExamAction) => void;
  deck: MockDeck;
  themes: readonly ThemeOption[];
  invalid: boolean;
  soundError: boolean;
  micPreviouslyDenied: boolean;
}) {
  const t = useTranslations("mock");
  const nav = useTranslations("nav");
  const { context } = state;
  const micId = useId();
  const soundId = useId();
  const [focus, setFocus] = useState<FocusItem | null>(null);

  useEffect(() => {
    let active = true;
    void createProgressStore()
      .listAttempts()
      .then((result) => {
        if (active && result.ok) setFocus(result.value[0]?.focusNextTime ?? null);
      });
    return () => {
      active = false;
    };
  }, []);

  const back = <BackLink href="/mock">{nav("mockFull")}</BackLink>;
  if (state.type === "prepare.instruction") {
    const line = deck.examinerLines.find(({ id }) => id === state.clipId);
    return (
      <div className="grid gap-4">
        {back}
        <FocusHeading>{t("ready.instruction")}</FocusHeading>
        {line && <DanishText as="p">{line.text.da}</DanishText>}
        <Button
          onClick={() => {
            send({ type: "INSTRUCTION_SKIP" });
          }}
        >
          {t("ready.skipInstruction")}
        </Button>
      </div>
    );
  }
  if (state.reloadNotice) {
    return (
      <div className="grid gap-4">
        {back}
        <FocusHeading>{t("ready.reloadTitle")}</FocusHeading>
        <InfoNote>{t("ready.reload")}</InfoNote>
        <Button
          onClick={() => {
            send({ type: "DISMISS_RELOAD_NOTICE" });
          }}
        >
          {t("ready.new")}
        </Button>
      </div>
    );
  }
  const micStatus = {
    undecided: micPreviouslyDenied ? t("ready.micPrevious") : null,
    granted: t("ready.micGranted"),
    denied: t("ready.micDenied"),
    unavailable: t(
      context.micReason === "in-use"
        ? "ready.micInUse"
        : context.micReason === "insecure"
          ? "ready.micInsecure"
          : "ready.micUnavailable",
    ),
    skipped: t("ready.micSkipped"),
  }[context.micState];
  const empty = context.topics.length < (context.mode === "exam" ? 3 : 1);
  const soundLine = deck.examinerLines.find(({ id }) => id === examConfig.soundCheckClipId);
  return (
    <div className="mx-auto grid gap-5 max-inline-5xl">
      <div>
        {back}
        <FocusHeading>{t(`ready.${context.mode}`)}</FocusHeading>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="grid gap-4">
          {context.mode === "exam" && (
            <div className={mockCard}>
              <ExamRules />
              <Link className={mockTextLink} href="/mock/practice">
                {t("ready.usePractice")}
              </Link>
            </div>
          )}
          <InfoNote icon={IconHeadphones} variant="compact">
            {t("ready.headphones")}
          </InfoNote>
          {context.mode === "exam" && (
            <InfoNote icon={IconBellOff} variant="compact">
              {t("ready.dnd")}
            </InfoNote>
          )}
          {state.wakeLockTip && (
            <InfoNote icon={IconSmartphone}>{t("ready.wakeLock", { minutes: 2 })}</InfoNote>
          )}
          {invalid && <InfoNote>{t("ready.invalid")}</InfoNote>}
          {focus && (
            <InfoNote icon={IconListChecks}>
              {t("ready.focus", { item: t(`review.check.${focus}.label`) })}
            </InfoNote>
          )}
          {context.policy.topicChoice && !empty && <PracticeOptions {...{ context, send, deck, themes }} />}
          {context.alwaysShowExaminerText && (
            <p className="text-caption text-text-muted">{t("ready.alwaysText")}</p>
          )}
        </div>
        <div className="grid gap-4">
          <section
            aria-labelledby={soundId}
            aria-describedby={`${soundId}-status`}
            className={cn(mockCard, "grid gap-3")}
          >
            <h2 id={soundId} className="text-h2">
              {t("ready.sound")}
            </h2>
            <p>{t("ready.volume")}</p>
            {soundLine && (
              <div className="rounded-control bg-surface-sunken p-3">
                <DanishText as="p">{soundLine.text.da}</DanishText>
                <p className="text-caption">{t("ready.soundMeaning")}</p>
              </div>
            )}
            <Button
              icon={<IconVolume2 />}
              variant="secondary"
              onClick={() => {
                send({ type: "SOUND_CHECK_PLAY" });
              }}
            >
              {t("ready.play")}
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="tertiary"
                onClick={() => {
                  send({ type: "SOUND_CHECK_HEARD" });
                }}
              >
                {t("ready.heard")}
              </Button>
              <Button
                variant="tertiary"
                onClick={() => {
                  send({ type: "SOUND_CHECK_PROBLEM" });
                }}
              >
                {t("ready.noSound")}
              </Button>
            </div>
            <p
              id={`${soundId}-status`}
              role="status"
              aria-live="polite"
              className="text-caption text-text-muted"
            >
              {state.soundOk
                ? t("ready.soundOk")
                : state.soundHelp
                  ? t("ready.soundHelp")
                  : t("ready.soundWaiting")}
              {soundError && <span className="block">{t("ready.soundError")}</span>}
            </p>
          </section>
          <section
            aria-labelledby={micId}
            aria-describedby={`${micId}-description`}
            className={cn(mockCard, "grid gap-3")}
          >
            <h2 id={micId} className="text-h2">
              {t("ready.mic")}
            </h2>
            <p id={`${micId}-description`}>{t("ready.micExplanation")}</p>
            <p role="status" aria-live="polite" className="empty:hidden">
              {micStatus}
            </p>
            <div className="flex flex-wrap gap-2">
              {context.micState === "undecided" && (
                <Button
                  variant="secondary"
                  icon={<IconMic />}
                  loading={context.micRequest !== null}
                  onClick={() => {
                    send({ type: "MIC_ALLOW" });
                  }}
                >
                  {t("ready.micAllow")}
                </Button>
              )}
              {context.micState !== "skipped" && (
                <Button
                  variant="tertiary"
                  onClick={() => {
                    send({ type: "MIC_SKIP" });
                  }}
                >
                  {t("ready.micSkip")}
                </Button>
              )}
            </div>
          </section>
        </div>
      </div>
      <Button
        size="lg"
        block
        disabledReason={
          empty
            ? t(context.mode === "exam" ? "start.examUnavailable" : "start.noTopics")
            : context.micState === "undecided"
              ? t("ready.continueBlocked")
              : undefined
        }
        onClick={() => {
          send({ type: "CONTINUE" });
        }}
      >
        {t(
          context.options.topicSource.type === "chosen" ||
            context.micState === "denied" ||
            context.micState === "unavailable"
            ? "ready.continue"
            : "ready.toDraw",
        )}
      </Button>
    </div>
  );
}
