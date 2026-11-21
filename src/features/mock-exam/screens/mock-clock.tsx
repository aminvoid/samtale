import { useTranslations } from "next-intl";
import { useEffect, useReducer } from "react";
import { richTags } from "@/i18n/rich-tags";
import { examConfig } from "@/lib/exam/config";
import { elapsed, remaining } from "../index";
import type { State } from "../index";
import { formatDuration } from "./presentation";

type TimerProps = { ctx: State["context"]; now: () => number };
type ClockProps = TimerProps & { type: "look" | "overall" | "answer" };

function useClockRender(running: boolean) {
  const [, refresh] = useReducer((tick: number) => tick + 1, 0);
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(refresh, 250);
    return () => {
      window.clearInterval(interval);
    };
  }, [running]);
}

export function MockClock({ ctx, now, type }: ClockProps) {
  const t = useTranslations("mock");
  const audio = useTranslations("audio");
  const clock = type === "overall" ? ctx.examClock : ctx.answerClock;
  const running = type === "look" ? ctx.look?.deadline != null : clock?.since != null;
  useClockRender(running);
  const at = now();
  if (type === "look") {
    if (ctx.look === null) return null;
    return (
      <div className="grid justify-items-center gap-1">
        <span className="text-caption text-text-muted">{t("look.time")}</span>
        <bdi
          dir="ltr"
          aria-hidden="true"
          className="grid place-items-center rounded-full border-2 border-accent bg-surface-raised text-h2 tabular-nums block-12 inline-12"
        >
          {t("look.seconds", { seconds: Math.ceil(remaining(ctx.look, at) / 1000) })}
        </bdi>
      </div>
    );
  }
  const formatted = formatDuration(elapsed(clock, at), (time) => audio("clock", time));
  return (
    <div
      className={
        type === "answer"
          ? "flex flex-wrap items-baseline gap-x-3"
          : "flex flex-wrap items-baseline gap-1 text-caption"
      }
    >
      <span className="text-caption text-text-muted">
        {t(type === "overall" ? "interview.overall" : "interview.answerTime")}
      </span>
      <time className="tabular-nums">
        {type === "overall" && ctx.policy.examLimitMs !== null ? (
          t.rich("interview.limitClock", {
            ...richTags,
            elapsed: formatted,
            limit: formatDuration(ctx.policy.examLimitMs, (time) => audio("clock", time)),
          })
        ) : (
          <bdi dir="ltr">{formatted}</bdi>
        )}
      </time>
      {type === "answer" && ctx.policy.canPause && (
        <span className="text-caption text-text-muted">
          {t("interview.guide", {
            min: examConfig.answerGuideSeconds[0],
            max: examConfig.answerGuideSeconds[1],
          })}
        </span>
      )}
    </div>
  );
}
